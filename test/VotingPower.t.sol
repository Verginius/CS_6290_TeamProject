// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {GovernanceToken} from "../src/governance/GovernanceToken.sol";
import {IVotesView} from "../src/libraries/VotingPower.sol";
import {VotingPowerHarness} from "./harness/VotingPowerHarness.sol";

contract VotingPowerTest is Test {
    GovernanceToken internal token;
    VotingPowerHarness internal harness;

    address internal admin = makeAddr("admin");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal carol = makeAddr("carol");

    function setUp() public {
        token = new GovernanceToken("Governance Token", "GOV", admin, 1_000_000e18);
        harness = new VotingPowerHarness();

        vm.startPrank(admin);
        token.transfer(alice, 100_000e18);
        token.transfer(bob, 50_000e18);
        token.transfer(carol, 25_000e18);
        vm.stopPrank();

        vm.prank(alice);
        token.delegate(alice);
        vm.prank(bob);
        token.delegate(bob);
        vm.prank(carol);
        token.delegate(carol);

        vm.roll(block.number + 1);
    }

    function testSnapshotAndLiveWeightReads() public view {
        IVotesView votesToken = IVotesView(address(token));
        uint256 snapshotBlock = block.number - 1;

        assertEq(harness.snapshotWeight(votesToken, alice, snapshotBlock), 100_000e18);
        assertEq(harness.liveWeight(votesToken, bob), 50_000e18);
        assertEq(harness.pastTotalSupply(votesToken, snapshotBlock), token.totalSupply());
    }

    function testThresholdChecks() public view {
        IVotesView votesToken = IVotesView(address(token));

        assertTrue(harness.meetsThreshold(votesToken, alice, 100_000e18));
        assertFalse(harness.meetsThreshold(votesToken, alice, 100_001e18));

        assertTrue(harness.meetsThresholdBps(votesToken, alice, 1_000));
        assertFalse(harness.meetsThresholdBps(votesToken, carol, 1_000));
    }

    function testThresholdHelpersRejectInvalidBps() public {
        IVotesView votesToken = IVotesView(address(token));

        vm.expectRevert("VotingPower: thresholdBps > 100%");
        harness.meetsThresholdBps(votesToken, alice, 10_001);

        vm.expectRevert("VotingPower: thresholdBps > 100%");
        harness.absoluteThreshold(votesToken, 10_001);
    }

    function testAbsoluteThresholdAndSnapshotShare() public view {
        IVotesView votesToken = IVotesView(address(token));
        uint256 snapshotBlock = block.number - 1;

        assertEq(harness.absoluteThreshold(votesToken, 1_000), token.totalSupply() / 10);
        assertEq(harness.shareAtSnapshot(votesToken, alice, snapshotBlock), 1_000);
        assertTrue(harness.isWhale(votesToken, alice, snapshotBlock, 1_000));
        assertFalse(harness.isWhale(votesToken, bob, snapshotBlock, 1_000));
    }

    function testAggregateWeightAndCoalitionChecks() public view {
        IVotesView votesToken = IVotesView(address(token));
        uint256 snapshotBlock = block.number - 1;
        address[] memory coalition = new address[](2);
        coalition[0] = alice;
        coalition[1] = bob;

        assertEq(harness.aggregateWeight(votesToken, coalition, snapshotBlock), 150_000e18);
        assertTrue(harness.coalitionReachesBps(votesToken, coalition, snapshotBlock, 1_500));
        assertFalse(harness.coalitionReachesBps(votesToken, coalition, snapshotBlock, 2_000));
    }

    function testSnapshotShareHandlesZeroSupplyToken() public {
        VotingPowerMockToken mockToken = new VotingPowerMockToken();
        uint256 snapshotBlock = block.number - 1;
        assertEq(harness.shareAtSnapshot(mockToken, alice, snapshotBlock), 0);
        assertFalse(harness.coalitionReachesBps(mockToken, new address[](0), snapshotBlock, 100));
    }
}

contract VotingPowerMockToken is IVotesView {
    function getVotes(address) external pure returns (uint256) {
        return 0;
    }

    function getPastVotes(address, uint256) external pure returns (uint256) {
        return 0;
    }

    function getPastTotalSupply(uint256) external pure returns (uint256) {
        return 0;
    }

    function totalSupply() external pure returns (uint256) {
        return 0;
    }
}
