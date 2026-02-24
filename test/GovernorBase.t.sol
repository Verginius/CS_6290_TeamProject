// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BaseTest} from "./BaseTest.sol";
import {IGovernor} from "@openzeppelin/contracts/governance/IGovernor.sol";

/**
 * @title GovernorBaseTest
 * @dev Smoke-test suite for the GovernorBase secure reference implementation.
 *      Inherits the full governance fixture from BaseTest.
 *
 * ============================================================
 * TEST COVERAGE
 * ============================================================
 *
 * testInitialization      — constructor parameters (name, delay, period,
 *                            threshold, quorum) are stored correctly.
 *
 * testTokenDelegation     — each actor's delegated vote weight equals
 *                            their token balance after self-delegation.
 *
 * testCreateProposal      — a submitted proposal transitions to Pending
 *                            state immediately.
 *
 * testVotingFlow          — full happy-path:
 *                            propose → roll past delay → Active →
 *                            cast For votes → roll past period → Succeeded.
 *                            Also checks that for / against / abstain
 *                            tallies are accumulated correctly.
 *
 * ============================================================
 * RELATIONSHIP TO GovernorVulnerableTest
 * ============================================================
 *
 * GovernorBaseTest demonstrates the CORRECT behaviour that
 * GovernorVulnerableTest shows being violated.  Running both
 * suites side-by-side illustrates each attack surface concretely.
 *
 * ============================================================
 */
contract GovernorBaseTest is BaseTest {
    // ─────────────────────────────────────────────────────────────────────────
    // Setup
    // ─────────────────────────────────────────────────────────────────────────

    function setUp() public override {
        super.setUp();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Tests
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Constructor parameters are stored correctly.
    function testInitialization() public view {
        assertEq(governor.name(), "DAO Governor");
        assertEq(governor.votingDelay(), TEST_VOTING_DELAY);
        assertEq(governor.votingPeriod(), TEST_VOTING_PERIOD);
        assertEq(governor.proposalThreshold(), TEST_PROPOSAL_THRESHOLD);
        assertEq(governor.quorumNumerator(), TEST_QUORUM_PERCENTAGE);
    }

    /// @notice Each user's delegated vote weight equals their token balance.
    function testTokenDelegation() public view {
        assertEq(token.getVotes(user1), 10_000e18);
        assertEq(token.getVotes(user2), 10_000e18);
        assertEq(token.getVotes(user3), 10_000e18);
    }

    /// @notice A newly submitted proposal starts in the Pending state.
    function testCreateProposal() public {
        vm.startPrank(user1);

        address[] memory targets = new address[](1);
        targets[0] = address(token);

        uint256[] memory values = new uint256[](1);
        values[0] = 0;

        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature("mint(address,uint256)", user1, 100e18);

        string memory description = "Proposal #1: Mint tokens";

        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        // IGovernor.ProposalState.Pending == 0
        assertEq(uint256(governor.state(proposalId)), uint256(IGovernor.ProposalState.Pending));

        vm.stopPrank();
    }

    /// @notice Full happy-path: propose → Active → cast votes → Succeeded.
    function testVotingFlow() public {
        vm.startPrank(user1);

        address[] memory targets = new address[](1);
        targets[0] = address(0);
        uint256[] memory values = new uint256[](1);
        values[0] = 0;
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = "";
        string memory description = "Proposal #2: Standard Vote";

        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        vm.roll(block.number + TEST_VOTING_DELAY + 1);

        assertEq(uint256(governor.state(proposalId)), uint256(IGovernor.ProposalState.Active));

        // Support: 0 = Against, 1 = For, 2 = Abstain.
        governor.castVote(proposalId, 1);
        vm.stopPrank();

        vm.prank(user2);
        governor.castVote(proposalId, 1);

        (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) = governor.proposalVotes(proposalId);
        assertEq(forVotes, 20_000e18);
        assertEq(againstVotes, 0);
        assertEq(abstainVotes, 0);

        vm.roll(block.number + TEST_VOTING_PERIOD + 1);

        assertEq(uint256(governor.state(proposalId)), uint256(IGovernor.ProposalState.Succeeded));
    }
}
