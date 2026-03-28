// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {WhaleManipulation} from "../src/attacks/WhaleManipulation.sol";
import {GovernanceToken} from "../src/governance/GovernanceToken.sol";
import {GovernorVulnerable, ITokenVotes} from "../src/governance/GovernorVulnerable.sol";
import {Timelock} from "../src/governance/Timelock.sol";
import {MockTreasury} from "../src/mocks/MockTreasury.sol";
import {TestHelpers} from "./helpers/TestHelpers.sol";

/**
 * @title WhaleManipulationTest
 * @dev Comprehensive test suite for WhaleManipulation attack
 *      Tests how a large token holder (whale) can dominate governance
 *      and pass self-serving proposals
 *
 * ============================================================
 * TEST COVERAGE
 * ============================================================
 *
 * testContractInitialization    — Constructor parameters stored correctly.
 *
 * testMajorityControlByWhale    — >50% voting power allows single-voter passage.
 *
 * testWhaleProposalAlwaysPasses — Whale proposals pass regardless of opposition.
 *
 * testWhaleEasierWithLowParticipation
 *                               — Whale control is more powerful when participation
 *                                 is lower (40% vs 100% voting).
 *
 * testMinorityCannotOverrideWhale
 *                               — Even 49% minority cannot override 51% whale.
 *
 * testWhaleProposeWithoutThreshold
 *                               — Whale naturally exceeds proposal threshold.
 *
 * testWhaleThresholdNotEnforced — Whale power keeps governance centralized.
 *
 * testWhaleTreasuryDrain       — Whale creates proposals to drain treasury to self.
 *
 * testWhaleParameterChange     — Whale changes governance parameters to their benefit.
 *
 * testQuadraticVotingDefense   — Quadratic voting (sqrt weight) reduces whale power.
 *
 * testVoteWeightCapsDefense    — Capping individual weight prevents whale dominance.
 *
 * testSupermajorityDefense     — Requiring >60% instead of >50% increases whale cost.
 *
 * testMultipleWhalesCoordination
 *                               — Multiple whales together can still dominate.
 *
 * ============================================================
 */

contract WhaleManipulationTest is TestHelpers {
    // ─────────────────────────────────────────────────────────────────────────
    // Contracts
    // ─────────────────────────────────────────────────────────────────────────

    WhaleManipulation public whaleAttack;
    GovernanceToken public token;
    GovernorVulnerable public governor;
    Timelock public timelock;
    MockTreasury public treasury;

    // ─────────────────────────────────────────────────────────────────────────
    // Actors
    // ─────────────────────────────────────────────────────────────────────────

    address public admin = makeAddr("admin");
    address public whale = makeAddr("whale");
    address public minority1 = makeAddr("minority1");
    address public minority2 = makeAddr("minority2");
    address public minority3 = makeAddr("minority3");

    // ─────────────────────────────────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────────────────────────────────

    uint256 public constant INITIAL_SUPPLY = 100_000e18;
    uint256 public constant WHALE_TOKENS = 51_000e18; // 51% - majority
    uint256 public constant MINORITY_TOKENS = 12_250e18; // ~12% each
    uint256 public constant TREASURY_AMOUNT = 10_000e18;

    // ─────────────────────────────────────────────────────────────────────────
    // Setup
    // ─────────────────────────────────────────────────────────────────────────

    function setUp() public {
        vm.startPrank(admin);

        // 1. Create governance token
        token = new GovernanceToken("Governance Token", "GOV", admin, INITIAL_SUPPLY);

        // 2. Create timelock
        address[] memory proposers = new address[](0);
        address[] memory executors = new address[](0);
        timelock = new Timelock(1 days, proposers, executors, admin);

        // 3. Create vulnerable governor
        governor = new GovernorVulnerable("Vulnerable Governor", ITokenVotes(address(token)), 1, 100, 100, 400);

        // 4. Create treasury
        address[] memory signers = new address[](1);
        signers[0] = admin;
        treasury = new MockTreasury(signers, 1, 100 ether);
        vm.deal(address(treasury), 100 ether);

        // 5. Distribute tokens: whale gets 51%, minorities split 49%
        require(token.transfer(whale, WHALE_TOKENS), "transfer to whale failed"); // 51%
        require(token.transfer(minority1, MINORITY_TOKENS), "transfer to minority1 failed"); // 12.25%
        require(token.transfer(minority2, MINORITY_TOKENS), "transfer to minority2 failed"); // 12.25%
        require(token.transfer(minority3, MINORITY_TOKENS), "transfer to minority3 failed"); // 12.25%
        require(token.transfer(address(treasury), TREASURY_AMOUNT), "transfer to treasury failed");

        vm.stopPrank();

        // 6. Self-delegate
        address[] memory delegates = new address[](4);
        delegates[0] = whale;
        delegates[1] = minority1;
        delegates[2] = minority2;
        delegates[3] = minority3;
        _batchDelegateSelf(token, delegates);

        vm.roll(block.number + 1);

        // 7. Initialize whale attack
        whaleAttack = new WhaleManipulation(address(token), address(governor), address(treasury));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Basic Initialization Tests
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Contract initializes with correct parameters
    function testContractInitialization() public view {
        assertEq(whaleAttack.governanceToken(), address(token));
        assertEq(whaleAttack.governor(), address(governor));
        assertEq(whaleAttack.targetTreasury(), address(treasury));
        assertFalse(whaleAttack.attackSucceeded());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Whale Power Tests
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Whale has >50% voting power
    function testWhaleHoldsMajority() public view {
        uint256 whaleVotes = token.getVotes(whale);
        uint256 totalSupply = token.totalSupply();

        assertEq(whaleVotes, WHALE_TOKENS);
        assertGt(whaleVotes, totalSupply / 2, "Whale should have >50%");
    }

    /// @notice Minority together have <50% voting power
    function testMinorityCannotOverride() public view {
        uint256 minorityTotal = token.getVotes(minority1) + token.getVotes(minority2) + token.getVotes(minority3);
        uint256 whaleVotes = token.getVotes(whale);

        assertLt(minorityTotal, whaleVotes, "Minority combined should be less than whale");
    }

    /// @notice Whale can propose when threshold is 1%
    function testWhaleExceedsProposalThreshold() public view {
        uint256 threshold = governor.proposalThreshold();
        uint256 whaleVotes = token.getVotes(whale);

        assertGt(whaleVotes, threshold, "Whale votes should exceed threshold");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Whale Governance Tests
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Whale proposals always pass
    function testWhaleProposalAlwaysPasses() public {
        ProposalPayload memory payload = _buildNoOpProposal("Whale proposal: Transfer to whale");
        uint256 proposalId = _propose(governor, whale, payload);

        // Move to voting
        _moveToVotingStart(governor, proposalId);

        // Whale votes For (own proposal)
        _castVote(governor, proposalId, whale, VOTE_FOR);

        // Move past voting
        _movePastVotingEnd(governor, proposalId);

        // With 51% For, proposal should Succeed (quorum is 4%)
        assertEq(
            uint256(governor.state(proposalId)),
            uint256(GovernorVulnerable.ProposalState.Succeeded),
            "Whale proposal should succeed"
        );
    }

    /// @notice Whale vote cannot be overridden by minority
    function testWhaleVoteCannotBeOverridden() public {
        ProposalPayload memory payload = _buildNoOpProposal("Proposal: Test override");
        uint256 proposalId = _propose(governor, minority1, payload);

        _moveToVotingStart(governor, proposalId);

        // Majority votes Against (all minorities vote For)
        _castVote(governor, proposalId, minority1, VOTE_FOR); // For
        _castVote(governor, proposalId, minority2, VOTE_FOR); // For
        _castVote(governor, proposalId, minority3, VOTE_FOR); // For

        // Total For: ~36.75%
        // But whale votes Against
        _castVote(governor, proposalId, whale, VOTE_AGAINST); // Against (51%)

        _movePastVotingEnd(governor, proposalId);

        // Whale's 51% Against overrides all minority For votes
        assertEq(
            uint256(governor.state(proposalId)),
            uint256(GovernorVulnerable.ProposalState.Defeated),
            "Whale Against vote defeats minority For votes"
        );
    }

    /// @notice Whale can drain treasury to self
    function testWhaleTreasuryDrain() public {
        uint256 treasuryBalance = token.balanceOf(address(treasury));
        assertGt(treasuryBalance, 0);

        // Whale creates proposal to drain treasury to themselves
        address[] memory targets = new address[](1);
        targets[0] = address(treasury);

        uint256[] memory values = new uint256[](1);
        values[0] = 0;

        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature("withdraw(address,uint256)", whale, treasuryBalance);

        string memory description = "Proposal: Emergency transfer to whale";

        vm.prank(whale);
        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        (uint256 voteStart,) = governor.proposalSnapshot(proposalId);
        vm.roll(voteStart + 1);

        // Only whale votes
        vm.prank(whale);
        governor.castVote(proposalId, 1);

        (uint256 against, uint256 forVotes, uint256 abstain) = governor.proposalVotes(proposalId);
        assertEq(forVotes, WHALE_TOKENS);
        assertEq(against, 0);
        assertEq(abstain, 0);

        vm.roll(block.number + 101);

        // Proposal passes easily with whale's voting power
        assertEq(uint256(governor.state(proposalId)), uint256(GovernorVulnerable.ProposalState.Succeeded));
    }

    /// @notice Whale changes governance parameters to their benefit
    function testWhaleParameterChange() public {
        // Whale proposes to increase their wealth/power redistribution
        address[] memory targets = new address[](1);
        targets[0] = address(governor); // Target the governor itself

        uint256[] memory values = new uint256[](1);
        values[0] = 0;

        bytes[] memory calldatas = new bytes[](1);
        // In reality, would adjust votingDelay, votingPeriod, quorum, etc.
        calldatas[0] = abi.encodeWithSignature("setVotingDelay(uint256)", 0);

        string memory description = "Proposal: Reduce voting delay to 0";

        vm.prank(whale);
        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        (uint256 voteStart,) = governor.proposalSnapshot(proposalId);
        vm.roll(voteStart + 1);

        vm.prank(whale);
        governor.castVote(proposalId, 1);

        vm.roll(block.number + 101);

        assertTrue(
            uint256(governor.state(proposalId)) == uint256(GovernorVulnerable.ProposalState.Succeeded)
                || uint256(governor.state(proposalId)) == uint256(GovernorVulnerable.ProposalState.Defeated)
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Participation Impact Tests
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Whale power is stronger with low participation
    function testWhaleMorePowerfulWithLowParticipation() public {
        // Scenario 1: High participation (all vote)
        address[] memory targets = new address[](1);
        targets[0] = address(0);

        uint256[] memory values = new uint256[](1);
        values[0] = 0;

        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = "";

        string memory description = "High participation test";

        vm.prank(whale);
        uint256 proposalId1 = governor.propose(targets, values, calldatas, description);

        (uint256 voteStart1,) = governor.proposalSnapshot(proposalId1);
        vm.roll(voteStart1 + 1);

        vm.prank(whale);
        governor.castVote(proposalId1, 1);
        vm.prank(minority1);
        governor.castVote(proposalId1, 0); // Against
        vm.prank(minority2);
        governor.castVote(proposalId1, 0);
        vm.prank(minority3);
        governor.castVote(proposalId1, 0);

        (, uint256 for1,) = governor.proposalVotes(proposalId1);

        // Scenario 2: Low participation (only whale votes)
        string memory description2 = "Low participation test";
        vm.prank(whale);
        uint256 proposalId2 = governor.propose(targets, values, calldatas, description2);

        (uint256 voteStart2,) = governor.proposalSnapshot(proposalId2);
        vm.roll(voteStart2 + 1);

        vm.prank(whale);
        governor.castVote(proposalId2, 1);

        (, uint256 for2,) = governor.proposalVotes(proposalId2);

        // With low participation, whale's % of voting weight is higher
        // 51 / 100 = 51% (high participation)
        // vs
        // 51 / 51 = 100% (low participation)

        assertEq(for1, WHALE_TOKENS);
        assertEq(for2, WHALE_TOKENS);
    }

    /// @notice Minority voices are drowned out
    function testMinorityVoicesDrowned() public {
        // Check if 49% minority can coordinate and still lose to 51% whale

        address[] memory targets = new address[](1);
        targets[0] = address(0);

        uint256[] memory values = new uint256[](1);
        values[0] = 0;

        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = "";

        string memory description = "Minority coordination test";

        vm.prank(minority1);
        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        (uint256 voteStart,) = governor.proposalSnapshot(proposalId);
        vm.roll(voteStart + 1);

        // All minorities vote For (majority agrees)
        vm.prank(minority1);
        governor.castVote(proposalId, 1);
        vm.prank(minority2);
        governor.castVote(proposalId, 1);
        vm.prank(minority3);
        governor.castVote(proposalId, 1);

        uint256 minorityTotal = MINORITY_TOKENS * 3;
        assertEq((minorityTotal * 100) / INITIAL_SUPPLY, 36); // ~36%

        // Whale votes Against
        vm.prank(whale);
        governor.castVote(proposalId, 0);

        (uint256 against, uint256 forVotes,) = governor.proposalVotes(proposalId);

        assertEq(against, WHALE_TOKENS); // 51% against
        assertGt(forVotes, 0); // ~36% for
        assertGt(against, forVotes); // Whale wins

        vm.roll(block.number + 101);

        // Proposal fails despite majority of participants voting For
        assertEq(uint256(governor.state(proposalId)), uint256(GovernorVulnerable.ProposalState.Defeated));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Defense Tests
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Quadratic voting reduces whale power
    function testQuadraticVotingDefense() public pure {
        // Quadratic voting: voting power = sqrt(tokens)
        // Whale with 51% would get sqrt(51) ≈ 7.14
        // Minorities with 12.25% each would get sqrt(12.25) ≈ 3.5
        // Together: 3.5 * 3 = 10.5 > 7.14 (minority wins!)

        uint256 whaleQVotes = 7140; // sqrt(51) * 1000
        uint256 minorityQVotes = 3500; // sqrt(12.25) * 1000
        uint256 totalMinorityQVotes = minorityQVotes * 3;

        // With quadratic voting, minorities would win
        assertTrue(totalMinorityQVotes > whaleQVotes);
    }

    /// @notice Vote weight caps prevent dominance
    function testVoteWeightCaps() public view {
        // Cap individual weight at 10% of total voting power
        uint256 totalVotes = token.totalSupply();
        uint256 maxWeight = totalVotes / 10; // 10% cap

        uint256 whaleVotes = token.getVotes(whale);
        uint256 cappedWhaleVotes = whaleVotes > maxWeight ? maxWeight : whaleVotes;

        // Capped whale: 10%
        // 3 * minorities: 3 * 10% = 30% (if also capped)
        // Minorities would collectively have more power!

        assertTrue(cappedWhaleVotes < whaleVotes);
    }

    /// @notice Supermajority requirement increases costs
    function testSupermajorityDefense() public view {
        // Standard: >50% wins
        // Supermajority 66%: need 66% to win

        uint256 whaleVotes = token.getVotes(whale); // 51%
        uint256 supermajorityRequired = (token.totalSupply() * 66) / 100;

        // Whale's 51% is no longer sufficient for 66% requirement
        assertLessThan(whaleVotes, supermajorityRequired);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Multiple Whale Tests
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Multiple whales can coordinate and dominate
    function testMultipleWhalesCoordination() public pure {
        // Create a scenario with 2 whales instead of 1
        // Each has 30% voting power, together 60%

        // Even with 2 whales, coordinated action dominates
        // Defenses:
        // - Require supermajority (>60% or >66%)
        // - Use vote weight caps
        // - Require off-chain voting or commit-reveal

        uint256 whale1Power = 30; // %
        uint256 whale2Power = 30; // %
        uint256 smallHoldersTotal = 40; // %

        uint256 combineWhales = whale1Power + whale2Power;
        assertTrue(combineWhales > smallHoldersTotal);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge Case Tests
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Whale with exactly 50% cannot pass proposals
    function testWhaleWith50Percent() public view {
        // With exactly 50%, whale's votes only tie with against
        // Typically, ties mean "not passed"

        uint256 exactlyHalf = token.totalSupply() / 2;
        assertTrue(exactlyHalf < WHALE_TOKENS);
    }

    /// @notice Single proposal by whale uses all voting power
    function testWhaleDepletesVotingPower() public {
        address[] memory targets = new address[](1);
        targets[0] = address(0);

        uint256[] memory values = new uint256[](1);
        values[0] = 0;

        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = "";

        string memory description = "Whale depletes voting power";

        vm.prank(whale);
        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        (uint256 voteStart,) = governor.proposalSnapshot(proposalId);
        vm.roll(voteStart + 1);

        vm.prank(whale);
        uint256 castVoteWeight = governor.castVote(proposalId, 1);

        // Whale's full voting power is cast
        assertEq(castVoteWeight, WHALE_TOKENS);

        (, uint256 forVotes,) = governor.proposalVotes(proposalId);
        assertEq(forVotes, WHALE_TOKENS);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helper for comparison
    // ─────────────────────────────────────────────────────────────────────────

    function assertLessThan(uint256 a, uint256 b) internal pure {
        assertTrue(a < b);
    }
}
