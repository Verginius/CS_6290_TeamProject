// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {GovernanceToken} from "../src/governance/GovernanceToken.sol";
import {Timelock} from "../src/governance/Timelock.sol";
import {GovernorWithDefenses, ITokenVotes} from "../src/governance/GovernorWithDefenses.sol";

/**
 * @title GovernorWithDefensesTest
 * @dev Comprehensive test suite for GovernorWithDefenses.  Each test targets
 *      one of the eight security fixes and proves the defense holds.
 *
 * ============================================================
 * TEST COVERAGE
 * ============================================================
 *
 * testInitialization          — constructor parameters stored correctly.
 *
 * testTokenDelegation         — delegated vote weight equals token balance
 *                               for each user after self-delegation.
 *
 * testCreateProposal          — proposal starts in Pending state; threshold
 *                               check passes for eligible proposers.
 *
 * testProposalThreshold       — FIX-4: proposer with zero votes is rejected.
 *
 * testSnapshotVoting          — FIX-1: tokens acquired AFTER proposal creation
 *                               do not increase vote weight in castVote.
 *
 * testNoDoubleVoting          — FIX-2: second castVote from same address reverts.
 *
 * testVotingDelay             — FIX-1 / delay: castVote reverts before
 *                               voteStart (proposal still Pending).
 *
 * testQuorumEnforcement       — FIX-5: proposal Defeated when total votes
 *                               fall below quorumVotes.
 *
 * testVotingFlow              — happy-path: propose → Active → vote → Succeeded.
 *
 * testTimelockQueue           — FIX-3: queue() transitions Succeeded → Queued
 *                               and schedules operation in TimelockController.
 *
 * testTimelockExecute         — FIX-3: execute() dispatches through timelock
 *                               after minDelay has elapsed.
 *
 * testCannotExecuteWithoutQueue — FIX-3: revert if execute() is called before
 *                                 queue().
 *
 * testCannotExecuteBeforeDelay — FIX-3: revert if timelock delay not elapsed.
 *
 * testCancelPendingProposal   — FIX-7: proposer can cancel while Pending.
 *
 * testCannotCancelActiveProposal — FIX-7: cancel reverts once voting is Active.
 *
 * testCalldataIntegrity       — FIX-8: execute() with altered targets reverts.
 *
 * ============================================================
 */
contract GovernorWithDefensesTest is Test {
    // ─────────────────────────────────────────────────────────────────────────
    // Contracts
    // ─────────────────────────────────────────────────────────────────────────

    GovernanceToken public token;
    Timelock public timelock;
    GovernorWithDefenses public governor;

    // ─────────────────────────────────────────────────────────────────────────
    // Actors
    // ─────────────────────────────────────────────────────────────────────────

    address public admin = makeAddr("admin");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    address public user3 = makeAddr("user3");
    address public attacker = makeAddr("attacker");

    // ─────────────────────────────────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────────────────────────────────

    uint256 public constant INITIAL_SUPPLY = 100_000e18;
    uint256 public constant USER_TOKENS = 10_000e18;
    uint256 public constant MIN_DELAY = 1 days;
    uint256 public constant TEST_VOTING_DELAY = 10; // blocks
    uint256 public constant TEST_VOTING_PERIOD = 100; // blocks
    uint256 public constant TEST_PROPOSAL_THRESHOLD = 1e18; // 1 token
    uint256 public constant TEST_QUORUM_VOTES = 5_000e18; // 5 000 tokens

    // ─────────────────────────────────────────────────────────────────────────
    // Setup
    // ─────────────────────────────────────────────────────────────────────────

    function setUp() public {
        vm.startPrank(admin);

        // 1. Governance token.
        token = new GovernanceToken("Governance Token", "GOV", admin, INITIAL_SUPPLY);

        // 2. Timelock — no proposers/executors yet; admin holds DEFAULT_ADMIN_ROLE.
        address[] memory proposers = new address[](0);
        address[] memory executors = new address[](0);
        timelock = new Timelock(MIN_DELAY, proposers, executors, admin);

        // 3. GovernorWithDefenses.
        governor = new GovernorWithDefenses(
            "DAO Governor (Defended)",
            ITokenVotes(address(token)),
            timelock,
            TEST_VOTING_DELAY,
            TEST_VOTING_PERIOD,
            TEST_PROPOSAL_THRESHOLD,
            TEST_QUORUM_VOTES
        );

        // 4. Wire Timelock roles.
        bytes32 proposerRole = timelock.PROPOSER_ROLE();
        bytes32 executorRole = timelock.EXECUTOR_ROLE();
        bytes32 cancelerRole = timelock.CANCELLER_ROLE();
        bytes32 adminRole = timelock.DEFAULT_ADMIN_ROLE();

        timelock.grantRole(proposerRole, address(governor)); // governor can schedule
        timelock.grantRole(cancelerRole, address(governor)); // governor can cancel
        timelock.grantRole(executorRole, address(0)); // anyone can execute when ready
        timelock.revokeRole(adminRole, admin); // revoke deployer admin

        // 5. Distribute tokens.
        require(token.transfer(user1, USER_TOKENS), "transfer user1 failed");
        require(token.transfer(user2, USER_TOKENS), "transfer user2 failed");
        require(token.transfer(user3, USER_TOKENS), "transfer user3 failed");
        // attacker gets NO tokens intentionally

        vm.stopPrank();

        // 6. Self-delegate to activate voting power.
        vm.prank(user1);
        token.delegate(user1);
        vm.prank(user2);
        token.delegate(user2);
        vm.prank(user3);
        token.delegate(user3);

        // Advance one block so delegation checkpoints are in the past.
        vm.roll(block.number + 1);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    /// @dev Builds a minimal no-op proposal (targets address(0), value 0, empty calldata).
    function _buildNoOpProposal()
        internal
        pure
        returns (address[] memory targets, uint256[] memory values, bytes[] memory calldatas, string memory description)
    {
        targets = new address[](1);
        values = new uint256[](1);
        calldatas = new bytes[](1);
        targets[0] = address(0); // address(0): empty call succeeds, no code to revert
        values[0] = 0;
        calldatas[0] = "";
        description = "Proposal: no-op";
    }

    /// @dev Proposes via user1 and returns the proposalId.
    function _propose() internal returns (uint256 proposalId) {
        (address[] memory targets, uint256[] memory values, bytes[] memory calldatas, string memory description) =
            _buildNoOpProposal();

        vm.prank(user1);
        proposalId = governor.propose(targets, values, calldatas, description);
    }

    /// @dev Moves blocks past the voting delay so the proposal becomes Active.
    function _advanceToActive(uint256 proposalId) internal {
        (, uint256 voteStart,) = governor.proposalWindow(proposalId);
        vm.roll(voteStart + 1);
    }

    /// @dev Casts For votes from user1 + user2 (combined 20 000 tokens ≥ quorum).
    function _castForVotes(uint256 proposalId) internal {
        vm.prank(user1);
        governor.castVote(proposalId, 1); // For
        vm.prank(user2);
        governor.castVote(proposalId, 1); // For
    }

    /// @dev Advances blocks past the voting period.
    function _advancePastVoteEnd(uint256 proposalId) internal {
        (,, uint256 voteEnd) = governor.proposalWindow(proposalId);
        vm.roll(voteEnd + 1);
    }

    /// @dev Queues a succeeded proposal, returns the ETA.
    function _queueProposal(
        uint256 /* proposalId */
    )
        internal
        returns (uint256 eta)
    {
        (address[] memory targets, uint256[] memory values, bytes[] memory calldatas,) = _buildNoOpProposal();
        bytes32 descriptionHash = keccak256(bytes("Proposal: no-op"));

        governor.queue(targets, values, calldatas, descriptionHash);
        eta = block.timestamp + MIN_DELAY;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Basic initialisation
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Constructor parameters are stored correctly.
    function testInitialization() public view {
        assertEq(governor.name(), "DAO Governor (Defended)");
        assertEq(governor.votingDelay(), TEST_VOTING_DELAY);
        assertEq(governor.votingPeriod(), TEST_VOTING_PERIOD);
        assertEq(governor.proposalThreshold(), TEST_PROPOSAL_THRESHOLD);
        assertEq(governor.quorumVotes(), TEST_QUORUM_VOTES);
        assertEq(address(governor.TOKEN()), address(token));
        assertEq(address(governor.TIMELOCK()), address(timelock));
    }

    /// @notice Each user's delegated vote weight equals their token balance.
    function testTokenDelegation() public view {
        assertEq(token.getVotes(user1), USER_TOKENS);
        assertEq(token.getVotes(user2), USER_TOKENS);
        assertEq(token.getVotes(user3), USER_TOKENS);
        assertEq(token.getVotes(attacker), 0);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FIX-4: Proposal threshold
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice A newly submitted proposal by an eligible user starts in Pending.
    function testCreateProposal() public {
        uint256 proposalId = _propose();
        assertEq(uint256(governor.state(proposalId)), uint256(GovernorWithDefenses.ProposalState.Pending));
        assertEq(governor.proposalProposer(proposalId), user1);
    }

    /// @notice FIX-4: A proposer with no tokens is rejected.
    function testProposalThreshold() public {
        (address[] memory targets, uint256[] memory values, bytes[] memory calldatas, string memory description) =
            _buildNoOpProposal();

        vm.prank(attacker); // attacker has 0 tokens
        vm.expectRevert("GovernorWithDefenses: proposer votes below threshold");
        governor.propose(targets, values, calldatas, description);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FIX-1: Snapshot voting – voting delay enforcement
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice FIX-1 / delay: castVote reverts while the proposal is still Pending.
    function testVotingDelay() public {
        uint256 proposalId = _propose();

        // Still Pending — castVote should revert.
        vm.prank(user1);
        vm.expectRevert("GovernorWithDefenses: voting not active");
        governor.castVote(proposalId, 1);
    }

    /// @notice FIX-1: Tokens acquired after proposal creation do NOT increase
    ///         vote weight — snapshot prevents flash-loan / late-buy attacks.
    function testSnapshotVoting() public {
        // user3 transfers all tokens away before proposing (but after delegation).
        // We'll give the attacker tokens AFTER the proposal block to simulate
        // a post-snapshot acquisition.

        uint256 proposalId = _propose(); // snapshot = block N

        // Advance one block so the snapshot (block N) is now strictly in the past.
        // getPastVotes requires timepoint < clock(), so any delegation checkpoint
        // written at block N+1 or later will NOT be visible at snapshotBlock N.
        vm.roll(block.number + 1);

        // Attacker receives tokens AFTER the snapshot block.
        // Impersonate user1 (who has tokens) to transfer to attacker.
        vm.prank(user1);
        require(token.transfer(attacker, USER_TOKENS), "transfer attacker failed");

        // Attacker self-delegates to activate the freshly received tokens.
        vm.prank(attacker);
        token.delegate(attacker);

        _advanceToActive(proposalId);

        // Attacker's live balance is now USER_TOKENS, but snapshotBlock weight = 0.
        assertEq(token.getVotes(attacker), USER_TOKENS);

        vm.prank(attacker);
        uint256 weight = governor.castVote(proposalId, 1); // For

        // Weight must be 0 (snapshot was taken before attacker received tokens).
        assertEq(weight, 0, "FIX-1: post-snapshot tokens must not count");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FIX-2: Double-vote prevention
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice FIX-2: A second castVote from the same address reverts.
    function testNoDoubleVoting() public {
        uint256 proposalId = _propose();
        _advanceToActive(proposalId);

        vm.startPrank(user1);
        governor.castVote(proposalId, 1); // first vote — succeeds

        vm.expectRevert("GovernorWithDefenses: vote already cast");
        governor.castVote(proposalId, 0); // second vote — must revert
        vm.stopPrank();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FIX-5: Quorum enforcement
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice FIX-5: A proposal is Defeated when total votes are below quorumVotes.
    function testQuorumEnforcement() public {
        uint256 proposalId = _propose();
        _advanceToActive(proposalId);

        // Only user3 votes For with USER_TOKENS (10 000) < quorumVotes (5 000).
        // Wait — quorum is 5 000 tokens. user3 has 10 000, so that passes quorum.
        // Let's test with a smaller vote: cast 0-weight attacker vote only.
        // Actually, let's set up a separate proposal with only the attacker voting
        // (0 weight) to confirm Defeated.

        vm.prank(attacker); // weight = 0
        governor.castVote(proposalId, 1);

        _advancePastVoteEnd(proposalId);

        // 0 votes total < 5 000 quorum → Defeated.
        assertEq(
            uint256(governor.state(proposalId)),
            uint256(GovernorWithDefenses.ProposalState.Defeated),
            "FIX-5: must be Defeated without quorum"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Happy-path: full voting flow to Succeeded
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Full happy-path: propose → Active → castVote → Succeeded.
    function testVotingFlow() public {
        uint256 proposalId = _propose();

        _advanceToActive(proposalId);
        assertEq(uint256(governor.state(proposalId)), uint256(GovernorWithDefenses.ProposalState.Active));

        _castForVotes(proposalId);

        (uint256 against, uint256 forV, uint256 abstain) = governor.proposalVotes(proposalId);
        assertEq(forV, USER_TOKENS * 2, "20 000 tokens For");
        assertEq(against, 0);
        assertEq(abstain, 0);

        _advancePastVoteEnd(proposalId);

        assertEq(uint256(governor.state(proposalId)), uint256(GovernorWithDefenses.ProposalState.Succeeded));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FIX-3: Timelock integration
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice FIX-3: queue() moves Succeeded → Queued and schedules in timelock.
    function testTimelockQueue() public {
        uint256 proposalId = _propose();
        _advanceToActive(proposalId);
        _castForVotes(proposalId);
        _advancePastVoteEnd(proposalId);

        assertEq(uint256(governor.state(proposalId)), uint256(GovernorWithDefenses.ProposalState.Succeeded));

        _queueProposal(proposalId);

        assertEq(
            uint256(governor.state(proposalId)),
            uint256(GovernorWithDefenses.ProposalState.Queued),
            "FIX-3: must be Queued after queue()"
        );

        // Verify operation registered in TimelockController.
        (address[] memory targets, uint256[] memory values, bytes[] memory calldatas,) = _buildNoOpProposal();
        bytes32 timelockId = timelock.hashOperationBatch(targets, values, calldatas, bytes32(0), bytes32(proposalId));
        assertTrue(timelock.isOperationPending(timelockId), "FIX-3: timelock operation must be pending after queue()");
    }

    /// @notice FIX-3: execute() dispatches through timelock after minDelay.
    function testTimelockExecute() public {
        uint256 proposalId = _propose();
        _advanceToActive(proposalId);
        _castForVotes(proposalId);
        _advancePastVoteEnd(proposalId);
        _queueProposal(proposalId);

        // Fast-forward past the timelock delay.
        vm.warp(block.timestamp + MIN_DELAY + 1);

        (address[] memory targets, uint256[] memory values, bytes[] memory calldatas,) = _buildNoOpProposal();
        bytes32 descriptionHash = keccak256(bytes("Proposal: no-op"));

        governor.execute(targets, values, calldatas, descriptionHash);

        assertEq(
            uint256(governor.state(proposalId)),
            uint256(GovernorWithDefenses.ProposalState.Executed),
            "FIX-3: must be Executed after execute()"
        );
    }

    /// @notice FIX-3: calling execute() before queue() reverts.
    function testCannotExecuteWithoutQueue() public {
        uint256 proposalId = _propose();
        _advanceToActive(proposalId);
        _castForVotes(proposalId);
        _advancePastVoteEnd(proposalId);

        // proposal is Succeeded but NOT Queued yet
        (address[] memory targets, uint256[] memory values, bytes[] memory calldatas,) = _buildNoOpProposal();
        bytes32 descriptionHash = keccak256(bytes("Proposal: no-op"));

        vm.expectRevert("GovernorWithDefenses: proposal not queued");
        governor.execute(targets, values, calldatas, descriptionHash);
    }

    /// @notice FIX-3: execute() reverts when the timelock delay has not elapsed.
    function testCannotExecuteBeforeDelay() public {
        uint256 proposalId = _propose();
        _advanceToActive(proposalId);
        _castForVotes(proposalId);
        _advancePastVoteEnd(proposalId);
        _queueProposal(proposalId);

        // Do NOT warp past MIN_DELAY.
        (address[] memory targets, uint256[] memory values, bytes[] memory calldatas,) = _buildNoOpProposal();
        bytes32 descriptionHash = keccak256(bytes("Proposal: no-op"));

        vm.expectRevert("GovernorWithDefenses: timelock delay not elapsed");
        governor.execute(targets, values, calldatas, descriptionHash);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FIX-7: Cancellation restrictions
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice FIX-7: Proposer can cancel a Pending proposal.
    function testCancelPendingProposal() public {
        uint256 proposalId = _propose();

        (address[] memory targets, uint256[] memory values, bytes[] memory calldatas,) = _buildNoOpProposal();
        bytes32 descriptionHash = keccak256(bytes("Proposal: no-op"));

        vm.prank(user1);
        governor.cancel(targets, values, calldatas, descriptionHash);

        assertEq(
            uint256(governor.state(proposalId)),
            uint256(GovernorWithDefenses.ProposalState.Canceled),
            "FIX-7: must be Canceled after cancel()"
        );
    }

    /// @notice FIX-7: cancel() reverts once the voting window is Active.
    function testCannotCancelActiveProposal() public {
        uint256 proposalId = _propose();
        _advanceToActive(proposalId);

        (address[] memory targets, uint256[] memory values, bytes[] memory calldatas,) = _buildNoOpProposal();
        bytes32 descriptionHash = keccak256(bytes("Proposal: no-op"));

        vm.prank(user1);
        vm.expectRevert("GovernorWithDefenses: can only cancel pending proposals");
        governor.cancel(targets, values, calldatas, descriptionHash);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FIX-8: Calldata integrity
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice FIX-8: execute() with an altered target array reverts.
    function testCalldataIntegrity() public {
        uint256 proposalId = _propose();
        _advanceToActive(proposalId);
        _castForVotes(proposalId);
        _advancePastVoteEnd(proposalId);
        _queueProposal(proposalId);
        vm.warp(block.timestamp + MIN_DELAY + 1);

        // Build a tampered targets array pointing to a different address.
        address[] memory tamperedTargets = new address[](1);
        tamperedTargets[0] = attacker; // differs from stored address(token)

        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        bytes32 descriptionHash = keccak256(bytes("Proposal: no-op"));

        // hashProposal will produce a *different* proposalId → unknown proposal revert.
        vm.expectRevert("GovernorWithDefenses: unknown proposal");
        governor.execute(tamperedTargets, values, calldatas, descriptionHash);
    }

    /// @notice FIX-8: queue() with matching arrays but altered calldata reverts on mismatch.
    function testCalldataIntegrityOnQueue() public {
        uint256 proposalId = _propose();
        _advanceToActive(proposalId);
        _castForVotes(proposalId);
        _advancePastVoteEnd(proposalId);

        // The caller computes the correct proposalId (matching hash),
        // but hands queue() calldatas that differ from what was stored.
        // To reach _validateCallArrays we must supply arrays whose hash
        // matches the stored descriptionHash — we do that by reconstructing
        // the exact proposal but then changing calldatas after hashing.
        // Since hashProposal includes calldatas, a different calldata produces
        // a different hash → unknown proposal.  We test the explicit mismatch
        // via the internal validator by constructing a scenario where the hash
        // happens to match but element check fails — this is not practically
        // achievable with keccak256, so we verify the hash-level defence instead.
        (address[] memory targets, uint256[] memory values, bytes[] memory calldatas,) = _buildNoOpProposal();
        bytes32 correctHash = keccak256(bytes("Proposal: no-op"));

        // Mutate one calldata byte in place — changes the proposalId hash, so
        // hashProposal(targets, values, calldatas, correctHash) produces an ID
        // that was never stored → "unknown proposal" is the expected revert.
        calldatas[0] = hex"deadbeef";

        vm.expectRevert("GovernorWithDefenses: unknown proposal");
        governor.queue(targets, values, calldatas, correctHash);
    }
}
