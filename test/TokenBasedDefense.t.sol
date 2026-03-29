// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {GovernanceToken} from "../src/governance/GovernanceToken.sol";
import {TokenBasedDefense} from "../src/defenses/TokenBasedDefense.sol";
import {IVotesView} from "../src/libraries/VotingPower.sol";

contract TokenBasedDefenseTest is Test {
    GovernanceToken internal token;
    TokenBasedDefense internal defense;

    address internal admin = makeAddr("admin");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");

    uint256 internal constant INITIAL_SUPPLY = 1_000_000e18;
    uint256 internal constant ALICE_TOKENS = 100_000e18;
    uint256 internal constant BOB_TOKENS = 25_000e18;

    function setUp() public {
        vm.startPrank(admin);
        token = new GovernanceToken("Governance Token", "GOV", admin, INITIAL_SUPPLY);
        token.transfer(alice, ALICE_TOKENS);
        token.transfer(bob, BOB_TOKENS);
        vm.stopPrank();

        vm.prank(alice);
        token.delegate(alice);
        vm.prank(bob);
        token.delegate(bob);

        vm.roll(block.number + 1);
        defense = new TokenBasedDefense(IVotesView(address(token)));
    }

    function testConstructorRejectsZeroToken() public {
        vm.expectRevert("TokenBasedDefense: zero token");
        new TokenBasedDefense(IVotesView(address(0)));
    }

    function testSnapshotVotesReadsHistoricalWeight() public {
        uint256 snapshotBlock = block.number - 1;
        uint256 snapshotVotes = defense.snapshotVotes(alice, snapshotBlock);

        assertEq(snapshotVotes, ALICE_TOKENS);
    }

    function testSnapshotVotesRejectsCurrentBlock() public {
        vm.expectRevert("TokenBasedDefense: snapshot must be past block");
        defense.snapshotVotes(alice, block.number);
    }

    function testLiveVotesReflectsCurrentState() public {
        assertEq(defense.liveVotes(alice), ALICE_TOKENS);
        assertEq(defense.liveVotes(bob), BOB_TOKENS);
    }

    function testVoteEscrowPowerHandlesBounds() public view {
        assertEq(defense.voteEscrowPower(0, 365 days), 0);
        assertEq(defense.voteEscrowPower(100e18, 1 days), 0);
        assertEq(defense.voteEscrowPower(100e18, 4 * 365 days), 100e18);
        assertEq(defense.voteEscrowPower(100e18, 10 * 365 days), 100e18);
    }

    function testMaxVoteEscrowPowerEqualsLockedAmount() public view {
        assertEq(defense.maxVoteEscrowPower(77e18), 77e18);
    }

    function testResolveDelegationFallsBackToVoter() public view {
        assertEq(defense.resolveDelegation(alice, address(0)), alice);
        assertEq(defense.resolveDelegation(alice, bob), bob);
    }

    function testAnalyzeTokenDefensesBuildsCombinedView() public {
        uint256 snapshotBlock = block.number - 1;
        uint256 lockAmount = 50_000e18;
        uint256 remainingLockTime = 365 days;

        TokenBasedDefense.DefenseAnalysis memory analysis =
            defense.analyzeTokenDefenses(alice, snapshotBlock, lockAmount, remainingLockTime, true);

        uint256 vePower = defense.voteEscrowPower(lockAmount, remainingLockTime);

        assertEq(analysis.snapshotBasePower, ALICE_TOKENS);
        assertEq(analysis.voteEscrowPower, vePower);
        assertEq(analysis.totalEffectivePower, ALICE_TOKENS + vePower);
        assertFalse(analysis.liveDiffersFromSnapshot);
        assertTrue(analysis.hasLockAlignment);
        assertTrue(analysis.isDelegated);
    }

    function testAnalyzeTokenDefensesDetectsSnapshotDrift() public {
        uint256 snapshotBlock = block.number - 1;

        vm.prank(admin);
        token.transfer(alice, 10_000e18);

        TokenBasedDefense.DefenseAnalysis memory analysis =
            defense.analyzeTokenDefenses(alice, snapshotBlock, 0, 0, false);

        assertTrue(analysis.liveDiffersFromSnapshot);
        assertFalse(analysis.hasLockAlignment);
        assertFalse(analysis.isDelegated);
    }

    function testAnalyzeTokenDefensesRejectsCurrentBlockSnapshot() public {
        vm.expectRevert("TokenBasedDefense: snapshot must be past block");
        defense.analyzeTokenDefenses(alice, block.number, 0, 0, false);
    }

    function testDefenseSummaryReturnsExpectedMessage() public view {
        string memory summary = defense.defenseSummary();
        assertGt(bytes(summary).length, 0);
    }
}
