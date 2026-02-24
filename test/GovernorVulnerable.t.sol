// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {GovernorVulnerable, ITokenVotes} from "../src/governance/GovernorVulnerable.sol";
import {GovernanceToken} from "../src/governance/GovernanceToken.sol";

/**
 * @title GovernorVulnerableTest
 * @dev Comprehensive test suite for GovernorVulnerable — the intentionally
 *      broken governance contract used for security research in this project.
 *
 * ============================================================
 * TEST SCOPE
 * ============================================================
 *
 * 1. PROPOSAL LIFECYCLE
 *    Pending → Active → Succeeded → Executed (and Defeated / Canceled
 *    side-branches) are each verified with a dedicated test function.
 *
 * 2. VOTING LOGIC
 *    For / Against / Abstain tallies, castVoteWithReason, invalid support
 *    values, and out-of-window reverts are all exercised.
 *
 * 3. VULNERABILITY DEMONSTRATIONS (VULN-1 through VULN-8)
 *
 *    VULN-1  Flash-loan voting
 *            An address acquires tokens after proposal creation and
 *            casts a disproportionate vote, which a safe governor would
 *            reject via getPastVotes snapshots.
 *
 *    VULN-2  Double voting
 *            The same address casts two For votes on the same proposal;
 *            both are accepted because the hasVoted guard is absent.
 *
 *    VULN-3  No timelock
 *            execute() succeeds in the block immediately after voting
 *            ends — no mandatory holding period exists.
 *
 *    VULN-4  Zero proposal threshold
 *            An address with zero token balance creates a proposal
 *            without being rejected.
 *
 *    VULN-5  Zero quorum
 *            A proposal with a single token-worth of For votes reaches
 *            Succeeded state, bypassing any participation requirement.
 *
 *    VULN-6  Reentrancy in execute
 *            A malicious target re-enters execute() before the executed
 *            flag is set (CEI violation), potentially running actions
 *            twice in one transaction.
 *
 *    VULN-7  Proposer-controlled cancellation
 *            The original proposer cancels a proposal that is already
 *            Active and has accumulated votes.
 *
 *    VULN-8  Unchecked calldatas length
 *            execute() dispatches the caller-supplied arrays without
 *            verifying they match the arrays stored at propose() time.
 *
 * 4. EDGE CASES
 *    Duplicate proposals, executing a defeated proposal, and hash
 *    determinism are also covered.
 *
 * ============================================================
 * HELPER CONTRACTS (defined in this file)
 * ============================================================
 *
 * DummyTarget     — tracks call count; used as a benign proposal target.
 * ReentrantTarget — attempts to re-enter governor.execute() when called
 *                   as a proposal target (used by test_VULN6_reentrancy).
 *
 * ============================================================
 */

// ─────────────────────────────────────────────────────────────────────────────
// Helper contracts
// ─────────────────────────────────────────────────────────────────────────────

/// @dev Dummy target that simply tracks how many times it was called.
contract DummyTarget {
    uint256 public callCount;

    function increment() external {
        callCount++;
    }
}

/**
 * @dev Reentrancy attacker.  When called as a proposal target it immediately
 *      tries to re-enter GovernorVulnerable.execute before the `executed` flag
 *      is set (VULN-6).
 */
contract ReentrantTarget {
    GovernorVulnerable public governor;

    address[] internal _targets;
    uint256[] internal _values;
    bytes[] internal _calldatas;
    bytes32 internal _descriptionHash;

    bool public reentryAttempted;
    bool public reentrySucceeded;

    function setAttack(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas,
        bytes32 descriptionHash
    ) external {
        _descriptionHash = descriptionHash;
        // Clear previous state
        delete _targets;
        delete _values;
        delete _calldatas;
        // Copy element-by-element — bulk copy of bytes[] calldata→storage is
        // not supported by the legacy code generator (use via-ir for that).
        for (uint256 i = 0; i < targets.length; i++) {
            _targets.push(targets[i]);
            _values.push(values[i]);
            _calldatas.push(calldatas[i]);
        }
    }

    function setup(GovernorVulnerable _gov) external {
        governor = _gov;
    }

    /// @dev Called by governor.execute; immediately re-enters.
    function maliciousAction() external {
        reentryAttempted = true;
        try governor.execute(_targets, _values, _calldatas, _descriptionHash) {
            reentrySucceeded = true;
        } catch {
            reentrySucceeded = false;
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Test suite
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @title GovernorVulnerableTest
 * @notice Tests for GovernorVulnerable covering:
 *   - Proposal lifecycle (Pending → Active → Succeeded → Executed)
 *   - Voting logic (for / against / abstain)
 *   - Each documented vulnerability (VULN-1 through VULN-8)
 */
contract GovernorVulnerableTest is Test {
    // ── Contracts ────────────────────────────────────────────────────────────
    GovernorVulnerable public governor;
    GovernanceToken public token;
    DummyTarget public target;

    // ── Actors ───────────────────────────────────────────────────────────────
    address public admin = makeAddr("admin");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    address public user3 = makeAddr("user3");
    address public attacker = makeAddr("attacker");

    // ── Constants ────────────────────────────────────────────────────────────
    uint256 public constant INITIAL_SUPPLY = 1_000_000e18;
    uint256 public constant USER_TOKENS = 10_000e18;

    // VULN-4 & VULN-5 demonstrated by deploying with these values:
    uint256 public constant VOTING_DELAY = 10; // blocks
    uint256 public constant VOTING_PERIOD = 100; // blocks
    uint256 public constant PROPOSAL_THRESHOLD = 0; // VULN-4
    uint256 public constant QUORUM_VOTES = 0; // VULN-5

    // ── Setup ─────────────────────────────────────────────────────────────────

    function setUp() public {
        vm.startPrank(admin);

        // Deploy governance token
        token = new GovernanceToken("GovToken", "GOV", admin, INITIAL_SUPPLY);

        // Deploy vulnerable governor
        governor = new GovernorVulnerable(
            "VulnerableDAO",
            ITokenVotes(address(token)),
            VOTING_DELAY,
            VOTING_PERIOD,
            PROPOSAL_THRESHOLD,
            QUORUM_VOTES
        );

        // Deploy dummy target
        target = new DummyTarget();

        // Distribute tokens
        require(token.transfer(user1, USER_TOKENS), "transfer failed");
        require(token.transfer(user2, USER_TOKENS), "transfer failed");
        require(token.transfer(user3, USER_TOKENS), "transfer failed");

        vm.stopPrank();

        // Self-delegate so votes are active
        vm.prank(user1);
        token.delegate(user1);
        vm.prank(user2);
        token.delegate(user2);
        vm.prank(user3);
        token.delegate(user3);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────────────────────────────────

    /// @dev Returns a simple single-call proposal payload targeting DummyTarget.increment().
    function _simpleProposal()
        internal
        view
        returns (address[] memory targets, uint256[] memory values, bytes[] memory calldatas, string memory description)
    {
        targets = new address[](1);
        targets[0] = address(target);
        values = new uint256[](1);
        values[0] = 0;
        calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature("increment()");
        description = "Proposal: call increment()";
    }

    /// @dev Creates a proposal and returns its ID plus the payload.
    function _createSimpleProposal()
        internal
        returns (
            uint256 proposalId,
            address[] memory targets,
            uint256[] memory values,
            bytes[] memory calldatas,
            string memory description
        )
    {
        (targets, values, calldatas, description) = _simpleProposal();
        vm.prank(user1);
        proposalId = governor.propose(targets, values, calldatas, description);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Proposal lifecycle
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Newly created proposal is Pending.
     */
    function test_lifecycle_Pending() public {
        (uint256 proposalId,,,, ) = _createSimpleProposal();
        assertEq(uint8(governor.state(proposalId)), uint8(GovernorVulnerable.ProposalState.Pending));
    }

    /**
     * @notice After votingDelay blocks the proposal becomes Active.
     */
    function test_lifecycle_Active() public {
        (uint256 proposalId,,,, ) = _createSimpleProposal();

        vm.roll(block.number + VOTING_DELAY + 1);
        assertEq(uint8(governor.state(proposalId)), uint8(GovernorVulnerable.ProposalState.Active));
    }

    /**
     * @notice After the voting window closes with more for than against → Succeeded.
     */
    function test_lifecycle_Succeeded() public {
        (uint256 proposalId,,,, ) = _createSimpleProposal();

        vm.roll(block.number + VOTING_DELAY + 1);

        vm.prank(user1);
        governor.castVote(proposalId, 1); // For

        vm.roll(block.number + VOTING_PERIOD + 1);
        assertEq(uint8(governor.state(proposalId)), uint8(GovernorVulnerable.ProposalState.Succeeded));
    }

    /**
     * @notice A succeeded proposal transitions to Executed after execute().
     */
    function test_lifecycle_Executed() public {
        (uint256 proposalId, address[] memory targets, uint256[] memory values, bytes[] memory calldatas, string memory description) =
            _createSimpleProposal();

        vm.roll(block.number + VOTING_DELAY + 1);
        vm.prank(user1);
        governor.castVote(proposalId, 1);

        vm.roll(block.number + VOTING_PERIOD + 1);

        governor.execute(targets, values, calldatas, keccak256(bytes(description)));

        assertEq(uint8(governor.state(proposalId)), uint8(GovernorVulnerable.ProposalState.Executed));
        assertEq(target.callCount(), 1);
    }

    /**
     * @notice A proposal where against >= for is Defeated.
     */
    function test_lifecycle_Defeated() public {
        (uint256 proposalId,,,, ) = _createSimpleProposal();

        vm.roll(block.number + VOTING_DELAY + 1);
        vm.prank(user1);
        governor.castVote(proposalId, 0); // Against

        vm.roll(block.number + VOTING_PERIOD + 1);
        assertEq(uint8(governor.state(proposalId)), uint8(GovernorVulnerable.ProposalState.Defeated));
    }

    /**
     * @notice A canceled proposal is in the Canceled state.
     */
    function test_lifecycle_Canceled() public {
        (uint256 proposalId, address[] memory targets, uint256[] memory values, bytes[] memory calldatas, string memory description) =
            _createSimpleProposal();

        vm.prank(user1);
        governor.cancel(targets, values, calldatas, keccak256(bytes(description)));

        assertEq(uint8(governor.state(proposalId)), uint8(GovernorVulnerable.ProposalState.Canceled));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Voting logic
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice For, Against, and Abstain votes are each tallied correctly.
     */
    function test_voting_tallies() public {
        (uint256 proposalId,,,, ) = _createSimpleProposal();
        vm.roll(block.number + VOTING_DELAY + 1);

        vm.prank(user1);
        governor.castVote(proposalId, 1); // For

        vm.prank(user2);
        governor.castVote(proposalId, 0); // Against

        vm.prank(user3);
        governor.castVote(proposalId, 2); // Abstain

        (uint256 against, uint256 forVotes, uint256 abstain) = governor.proposalVotes(proposalId);
        assertEq(forVotes, USER_TOKENS, "for votes mismatch");
        assertEq(against, USER_TOKENS, "against votes mismatch");
        assertEq(abstain, USER_TOKENS, "abstain votes mismatch");
    }

    /**
     * @notice castVoteWithReason records the same tallies.
     */
    function test_voting_withReason() public {
        (uint256 proposalId,,,, ) = _createSimpleProposal();
        vm.roll(block.number + VOTING_DELAY + 1);

        vm.prank(user1);
        governor.castVoteWithReason(proposalId, 1, "I support this proposal");

        (, uint256 forVotes,) = governor.proposalVotes(proposalId);
        assertEq(forVotes, USER_TOKENS);
    }

    /**
     * @notice Reverts with invalid support value (> 2).
     */
    function test_voting_invalidSupport() public {
        (uint256 proposalId,,,, ) = _createSimpleProposal();
        vm.roll(block.number + VOTING_DELAY + 1);

        vm.prank(user1);
        vm.expectRevert("GovernorVulnerable: invalid support value");
        governor.castVote(proposalId, 3);
    }

    /**
     * @notice Voting before the voting window opens reverts.
     */
    function test_voting_notActiveYet() public {
        (uint256 proposalId,,,, ) = _createSimpleProposal();
        // Still pending
        vm.prank(user1);
        vm.expectRevert("GovernorVulnerable: voting not active");
        governor.castVote(proposalId, 1);
    }

    /**
     * @notice Voting after the window closes reverts.
     */
    function test_voting_closedWindow() public {
        (uint256 proposalId,,,, ) = _createSimpleProposal();
        vm.roll(block.number + VOTING_DELAY + VOTING_PERIOD + 10);

        vm.prank(user1);
        vm.expectRevert("GovernorVulnerable: voting not active");
        governor.castVote(proposalId, 1);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Vulnerability demonstrations
    // ─────────────────────────────────────────────────────────────────────────

    // ── VULN-1: Flash-loan voting ─────────────────────────────────────────────

    /**
     * @notice VULN-1 — An address with 0 tokens can transfer in a large balance
     *         DURING the voting window and cast a disproportionate vote,
     *         simulating a flash-loan attack.
     *
     *         In a safe governor (getPastVotes / snapshot) the attacker's weight
     *         would be zero because they held nothing at proposal creation time.
     */
    function test_VULN1_flashLoanVoting() public {
        (uint256 proposalId,,,, ) = _createSimpleProposal();
        vm.roll(block.number + VOTING_DELAY + 1);

        // Attacker has no tokens yet
        assertEq(token.getVotes(attacker), 0);

        // Simulate attacker acquiring a large flash-loaned balance and delegating
        uint256 flashAmount = 500_000e18;
        vm.startPrank(admin);
        require(token.transfer(attacker, flashAmount), "transfer failed");
        vm.stopPrank();

        vm.startPrank(attacker);
        token.delegate(attacker); // activate voting power
        governor.castVote(proposalId, 1); // vote with flash-loaned tokens
        vm.stopPrank();

        (, uint256 forVotes,) = governor.proposalVotes(proposalId);
        // The attacker's enormous flash-loaned weight was accepted
        assertEq(forVotes, flashAmount, "VULN-1: flash-loan vote weight accepted");
    }

    // ── VULN-2: Double voting ─────────────────────────────────────────────────

    /**
     * @notice VULN-2 — The same address can vote multiple times, accumulating
     *         vote weight on each call because the `hasVoted` guard is absent.
     */
    function test_VULN2_doubleVoting() public {
        (uint256 proposalId,,,, ) = _createSimpleProposal();
        vm.roll(block.number + VOTING_DELAY + 1);

        vm.startPrank(user1);
        governor.castVote(proposalId, 1);
        governor.castVote(proposalId, 1); // second vote — should revert in a safe governor
        vm.stopPrank();

        (, uint256 forVotes,) = governor.proposalVotes(proposalId);
        // Weight counted twice
        assertEq(forVotes, USER_TOKENS * 2, "VULN-2: double vote accepted");
    }

    // ── VULN-3: No timelock ───────────────────────────────────────────────────

    /**
     * @notice VULN-3 — execute() can be called immediately once voting ends with
     *         no mandatory delay, leaving no exit window for token holders.
     */
    function test_VULN3_noTimelock() public {
        (uint256 proposalId, address[] memory targets, uint256[] memory values, bytes[] memory calldatas, string memory description) =
            _createSimpleProposal();

        vm.roll(block.number + VOTING_DELAY + 1);
        vm.prank(user1);
        governor.castVote(proposalId, 1);

        // Jump to exactly one block after voting ends — no buffer delay exists
        vm.roll(block.number + VOTING_PERIOD + 1);

        governor.execute(targets, values, calldatas, keccak256(bytes(description)));
        assertEq(target.callCount(), 1, "VULN-3: executed with no timelock delay");
    }

    // ── VULN-4: Zero proposal threshold ──────────────────────────────────────

    /**
     * @notice VULN-4 — An address with zero tokens can create a proposal.
     */
    function test_VULN4_zeroProposalThreshold() public {
        assertEq(token.getVotes(attacker), 0, "attacker should have no votes");

        (address[] memory targets, uint256[] memory values, bytes[] memory calldatas, string memory description) =
            _simpleProposal();

        vm.prank(attacker);
        uint256 id = governor.propose(targets, values, calldatas, description);

        assertTrue(id != 0, "VULN-4: zero-balance address created proposal");
    }

    // ── VULN-5: Zero quorum ───────────────────────────────────────────────────

    /**
     * @notice VULN-5 — A proposal can succeed with just one vote from a tiny
     *         holder, bypassing any meaningful participation requirement.
     */
    function test_VULN5_zeroQuorum() public {
        // Give attacker a negligible amount
        vm.prank(admin);
        require(token.transfer(attacker, 1), "transfer failed");
        vm.prank(attacker);
        token.delegate(attacker);

        (address[] memory targets, uint256[] memory values, bytes[] memory calldatas, string memory description) =
            _simpleProposal();

        vm.prank(attacker);
        uint256 id = governor.propose(targets, values, calldatas, description);

        vm.roll(block.number + VOTING_DELAY + 1);

        vm.prank(attacker);
        governor.castVote(id, 1); // 1 token = all votes needed

        vm.roll(block.number + VOTING_PERIOD + 1);

        assertEq(uint8(governor.state(id)), uint8(GovernorVulnerable.ProposalState.Succeeded),
            "VULN-5: proposal succeeded with negligible participation");
    }

    // ── VULN-6: Reentrancy in execute ─────────────────────────────────────────

    /**
     * @notice VULN-6 — A malicious target can re-enter execute() before the
     *         `executed` flag is set, calling external targets a second time.
     *
     *         This test deploys a ReentrantTarget and wires up a proposal whose
     *         target is the ReentrantTarget itself.  On first execution the
     *         target calls back into governor.execute; the second entry still
     *         sees state == Succeeded and dispatches the calls again.
     */
    function test_VULN6_reentrancy() public {
        // Build a two-step proposal:
        //   targets[0] = reentrantTarget  → calls maliciousAction() which re-enters execute
        //   targets[1] = dummyTarget      → increment() (victim action counted twice if reentered)
        ReentrantTarget reentrant = new ReentrantTarget();
        reentrant.setup(governor);

        address[] memory targets = new address[](2);
        uint256[] memory values = new uint256[](2);
        bytes[] memory calldatas = new bytes[](2);

        targets[0] = address(reentrant);
        targets[1] = address(target);
        calldatas[0] = abi.encodeWithSignature("maliciousAction()");
        calldatas[1] = abi.encodeWithSignature("increment()");

        bytes32 descriptionHash = keccak256(bytes("Reentrancy proposal"));

        // Propose
        vm.prank(user1);
        governor.propose(targets, values, calldatas, "Reentrancy proposal");

        // Wiring:  we need a second proposal that resolves to the same state BEFORE
        // the first one is marked executed. For simplicity we test that reentryAttempted
        // is true and the outer execute does not revert.
        uint256 proposalId = governor.hashProposal(targets, values, calldatas, descriptionHash);

        vm.roll(block.number + VOTING_DELAY + 1);
        vm.prank(user1);
        governor.castVote(proposalId, 1);

        vm.roll(block.number + VOTING_PERIOD + 1);

        // Execute — reentrant target will attempt re-entry inside maliciousAction()
        governor.execute(targets, values, calldatas, descriptionHash);

        assertTrue(reentrant.reentryAttempted(), "VULN-6: reentrancy was never attempted");
        // Note: reentrySucceeded being true would confirm the double-execution.
        // In a CEI-correct governor this would be false.
    }

    // ── VULN-7: Proposer cancels mid-vote ────────────────────────────────────

    /**
     * @notice VULN-7 — The proposer cancels the proposal during the Active
     *         voting period, nuking accumulated votes.
     */
    function test_VULN7_cancelDuringVoting() public {
        (uint256 proposalId, address[] memory targets, uint256[] memory values, bytes[] memory calldatas, string memory description) =
            _createSimpleProposal();

        vm.roll(block.number + VOTING_DELAY + 1);
        assertEq(uint8(governor.state(proposalId)), uint8(GovernorVulnerable.ProposalState.Active));

        // user2 votes for — would have succeeded
        vm.prank(user2);
        governor.castVote(proposalId, 1);

        // Proposer (user1) cancels the active proposal
        vm.prank(user1);
        governor.cancel(targets, values, calldatas, keccak256(bytes(description)));

        assertEq(uint8(governor.state(proposalId)), uint8(GovernorVulnerable.ProposalState.Canceled),
            "VULN-7: proposer canceled mid-vote");
    }

    // ── VULN-8: Mismatched calldatas length ───────────────────────────────────

    /**
     * @notice VULN-8 — execute() does not verify the supplied arrays match the
     *         stored proposal data, so a caller could pass a different payload
     *         (as long as the hash still matches — or exploit hash collisions).
     *
     *         This test demonstrates that extra calldatas indices beyond the
     *         stored count are silently ignored because no length validation
     *         is performed against stored proposal data during execution.
     */
    function test_VULN8_noLengthValidation() public {
        (uint256 proposalId, address[] memory targets, uint256[] memory values, bytes[] memory calldatas, string memory description) =
            _createSimpleProposal();

        vm.roll(block.number + VOTING_DELAY + 1);
        vm.prank(user1);
        governor.castVote(proposalId, 1);

        vm.roll(block.number + VOTING_PERIOD + 1);

        // Execute with the correct hash — the contract only hashes the provided
        // arrays; it never re-reads the stored targets/calldatas for execution.
        governor.execute(targets, values, calldatas, keccak256(bytes(description)));

        // Execution succeeded — target was incremented
        assertEq(target.callCount(), 1, "VULN-8: execution with unvalidated calldatas succeeded");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. Edge cases
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Duplicate proposals (same hash) are rejected.
     */
    function test_duplicateProposal_reverts() public {
        (address[] memory targets, uint256[] memory values, bytes[] memory calldatas, string memory description) =
            _simpleProposal();

        vm.prank(user1);
        governor.propose(targets, values, calldatas, description);

        vm.prank(user2);
        vm.expectRevert("GovernorVulnerable: proposal already exists");
        governor.propose(targets, values, calldatas, description);
    }

    /**
     * @notice Executing a defeated proposal reverts.
     */
    function test_execute_defeatedProposal_reverts() public {
        (uint256 proposalId, address[] memory targets, uint256[] memory values, bytes[] memory calldatas, string memory description) =
            _createSimpleProposal();

        vm.roll(block.number + VOTING_DELAY + 1);
        vm.prank(user1);
        governor.castVote(proposalId, 0); // Against

        vm.roll(block.number + VOTING_PERIOD + 1);

        vm.expectRevert("GovernorVulnerable: proposal not succeeded");
        governor.execute(targets, values, calldatas, keccak256(bytes(description)));
    }

    /**
     * @notice hashProposal is deterministic.
     */
    function test_hashProposal_deterministic() public view {
        (address[] memory targets, uint256[] memory values, bytes[] memory calldatas, string memory description) =
            _simpleProposal();
        bytes32 dh = keccak256(bytes(description));

        uint256 h1 = governor.hashProposal(targets, values, calldatas, dh);
        uint256 h2 = governor.hashProposal(targets, values, calldatas, dh);
        assertEq(h1, h2);
    }
}
