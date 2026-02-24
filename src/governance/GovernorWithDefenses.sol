// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title GovernorWithDefenses
 * @dev Hardened governance contract that mirrors GovernorVulnerable's structure
 *      but explicitly patches every known vulnerability.  Intentionally written
 *      without OpenZeppelin's Governor base class so that each fix is visible
 *      and easy to compare line-by-line with the vulnerable version.
 *
 * ============================================================
 * FIXES (one-to-one with GovernorVulnerable's VULN-N labels)
 * ============================================================
 *
 * FIX-1: Snapshot voting
 *        propose() records snapshotBlock = block.number.  castVote() reads
 *        TOKEN.getPastVotes(voter, snapshotBlock) so vote weight is frozen
 *        at proposal-creation time, defeating flash-loan attacks (cf. VULN-1).
 *
 * FIX-2: Double-vote guard
 *        _castVote() checks hasVoted[proposalId][voter] BEFORE recording,
 *        and reverts on a second attempt from the same address (cf. VULN-2).
 *
 * FIX-3: Timelock integration
 *        Execution is split into two mandatory steps:
 *          1. queue()   – calls TimelockController.scheduleBatch() after a
 *                         successful vote.  The proposal enters Queued state.
 *          2. execute() – calls TimelockController.executeBatch() only after
 *                         the timelock delay has elapsed (isOperationReady).
 *        (cf. VULN-3)
 *
 * FIX-4: Proposal threshold
 *        propose() verifies TOKEN.getPastVotes(msg.sender, block.number-1)
 *        >= proposalThreshold before creating the proposal (cf. VULN-4).
 *
 * FIX-5: Quorum
 *        state() requires total participation (for + against + abstain) to
 *        meet quorumVotes before a proposal can be Succeeded (cf. VULN-5).
 *
 * FIX-6: CEI pattern
 *        queue() and execute() both write state BEFORE dispatching external
 *        calls, eliminating the reentrancy window present in VULN-6.
 *
 * FIX-7: Cancellation restricted to Pending state
 *        cancel() reverts unless the proposal is still in the Pending phase
 *        (before voting starts), preventing mid-vote griefing (cf. VULN-7).
 *
 * FIX-8: Calldata integrity check
 *        execute() and queue() compare caller-supplied arrays element-by-element
 *        against the values stored at proposal time, rejecting any attempt to
 *        pass manipulated parameters (cf. VULN-8).
 *
 * ============================================================
 * PROPOSAL LIFECYCLE
 * ============================================================
 *
 *   propose()
 *      │
 *      ▼
 *   Pending  ──cancel()──▶  Canceled
 *      │
 *      │ (votingDelay blocks)
 *      ▼
 *   Active
 *      │
 *      │ (votingPeriod blocks)
 *      ▼
 *   Succeeded / Defeated
 *      │ (only Succeeded continues)
 *      │ queue()
 *      ▼
 *   Queued
 *      │
 *      │ (timelock.minDelay seconds)
 *      │ execute()
 *      ▼
 *   Executed
 *
 * ============================================================
 */

// ---------------------------------------------------------------------------
// Token interface (same as GovernorVulnerable for easy comparison)
// ---------------------------------------------------------------------------

interface ITokenVotes {
    /// @dev Returns current (live) delegated vote weight.
    function getVotes(address account) external view returns (uint256);

    /// @dev Returns vote weight checkpointed at `timepoint` (block number).
    ///      Requires timepoint < clock() (current block).
    function getPastVotes(address account, uint256 timepoint) external view returns (uint256);
}

// ---------------------------------------------------------------------------
// Main contract
// ---------------------------------------------------------------------------

contract GovernorWithDefenses {
    // ─────────────────────────────────────────────────────────────────────────
    // Types
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Lifecycle states for a proposal.
    enum ProposalState {
        Pending, // 0 – created, voting not yet started
        Active, // 1 – voting window is open
        Succeeded, // 2 – voting ended, for > against, quorum met
        Defeated, // 3 – voting ended, for <= against OR quorum not met
        Queued, // 4 – queued in TimelockController, awaiting delay  (FIX-3)
        Executed, // 5 – proposal actions have been dispatched
        Canceled // 6 – canceled while Pending only                   (FIX-7)
    }

    struct ProposalVotes {
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
    }

    struct Proposal {
        address proposer;
        /// @dev FIX-1: block number at which vote weight is frozen.
        uint256 snapshotBlock;
        uint256 voteStart; // first block where voting is allowed
        uint256 voteEnd; // last block where voting is allowed (inclusive)
        bool canceled;
        bool queued; // FIX-3: true once scheduleBatch succeeds
        bool executed;
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
        bytes32 descriptionHash;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Storage
    // ─────────────────────────────────────────────────────────────────────────

    string public name;

    /// @notice The voting token (ERC20Votes-compatible).
    ITokenVotes public immutable TOKEN;

    /// @notice TimelockController that acts as the execution layer.  (FIX-3)
    TimelockController public immutable TIMELOCK;

    /// @notice Blocks to wait after proposal creation before voting starts.
    uint256 public votingDelay;

    /// @notice Duration in blocks of the voting window.
    uint256 public votingPeriod;

    /// @notice FIX-4: minimum vote weight required to create a proposal.
    uint256 public proposalThreshold;

    /// @notice FIX-5: minimum total participation for a vote to be valid.
    uint256 public quorumVotes;

    mapping(uint256 => Proposal) internal _proposals;
    mapping(uint256 => ProposalVotes) internal _proposalVotes;

    /// @dev FIX-2: enforced guard — checked BEFORE counting in _castVote.
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        address[] targets,
        uint256[] values,
        bytes[] calldatas,
        string description,
        uint256 snapshotBlock,
        uint256 voteStart,
        uint256 voteEnd
    );

    event VoteCast(address indexed voter, uint256 indexed proposalId, uint8 support, uint256 weight, string reason);

    event ProposalQueued(uint256 indexed proposalId, uint256 eta);
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCanceled(uint256 indexed proposalId);

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Deploys the governor, wiring up the token and timelock.
    /// @param _name              Human-readable governor name.
    /// @param _token             ERC20Votes-compatible governance token.
    /// @param _timelock          TimelockController used as the execution layer.
    /// @param _votingDelay       Blocks between proposal creation and voting start.
    /// @param _votingPeriod      Duration in blocks of the voting window.
    /// @param _proposalThreshold Minimum delegated votes required to propose.
    /// @param _quorumVotes       Minimum total participation for a vote to count.
    constructor(
        string memory _name,
        ITokenVotes _token,
        TimelockController _timelock,
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _proposalThreshold,
        uint256 _quorumVotes
    ) {
        require(address(_token) != address(0), "GovernorWithDefenses: zero token");
        require(address(_timelock) != address(0), "GovernorWithDefenses: zero timelock");
        require(_votingPeriod > 0, "GovernorWithDefenses: zero period");

        name = _name;
        TOKEN = _token;
        TIMELOCK = _timelock;
        votingDelay = _votingDelay;
        votingPeriod = _votingPeriod;
        proposalThreshold = _proposalThreshold;
        quorumVotes = _quorumVotes;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Proposal lifecycle helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Returns the current state of a proposal.
     *
     * @dev FIX-5: quorumVotes > 0 causes Defeated for low-participation votes.
     *      FIX-3: Queued state added between Succeeded and Executed.
     */
    function state(uint256 proposalId) public view returns (ProposalState) {
        Proposal storage p = _proposals[proposalId];
        require(p.voteStart != 0, "GovernorWithDefenses: unknown proposal");

        if (p.canceled) return ProposalState.Canceled;
        if (p.executed) return ProposalState.Executed;
        if (p.queued) return ProposalState.Queued;

        if (block.number <= p.voteStart) return ProposalState.Pending;
        if (block.number <= p.voteEnd) return ProposalState.Active;

        // Voting ended — evaluate outcome.
        ProposalVotes storage v = _proposalVotes[proposalId];

        // FIX-5: require minimum participation before declaring Succeeded.
        bool quorumReached = (v.forVotes + v.againstVotes + v.abstainVotes) >= quorumVotes;
        bool votingSucceeded = quorumReached && (v.forVotes > v.againstVotes);

        return votingSucceeded ? ProposalState.Succeeded : ProposalState.Defeated;
    }

    /**
     * @notice Deterministically derives a proposal ID from its contents.
     * @dev    Same hash function as GovernorVulnerable for portability.
     */
    function hashProposal(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public pure returns (uint256) {
        return uint256(keccak256(abi.encode(targets, values, calldatas, descriptionHash)));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Core governance actions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Create a new governance proposal.
     *
     * @dev FIX-1: snapshotBlock = block.number is recorded so that vote weight
     *             is frozen at this instant.
     *      FIX-4: Caller must hold at least proposalThreshold delegated votes
     *             (checked against the previous block to comply with
     *             ERC5805 / getPastVotes constraints).
     *
     * @param targets     Contract addresses to call on execution.
     * @param values      ETH values forwarded to each call.
     * @param calldatas   ABI-encoded call data for each target.
     * @param description Plain-text description of the proposal.
     * @return proposalId Deterministic proposal identifier.
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) external returns (uint256 proposalId) {
        // FIX-4: Proposal threshold check using snapshot at (block.number - 1).
        //        Uses getPastVotes to prevent same-block flash manipulation.
        uint256 checkBlock = block.number > 0 ? block.number - 1 : 0;
        require(
            TOKEN.getPastVotes(msg.sender, checkBlock) >= proposalThreshold,
            "GovernorWithDefenses: proposer votes below threshold"
        );

        require(targets.length == values.length, "GovernorWithDefenses: invalid proposal length");
        require(targets.length == calldatas.length, "GovernorWithDefenses: invalid proposal length");
        require(targets.length > 0, "GovernorWithDefenses: empty proposal");

        bytes32 descriptionHash;
        assembly ("memory-safe") {
            descriptionHash := keccak256(add(description, 0x20), mload(description))
        }
        proposalId = hashProposal(targets, values, calldatas, descriptionHash);

        require(_proposals[proposalId].voteStart == 0, "GovernorWithDefenses: proposal already exists");

        // FIX-1: Record the snapshot block — vote weight is frozen here.
        uint256 snapshot = block.number;
        uint256 voteStart = snapshot + votingDelay;
        uint256 voteEnd = voteStart + votingPeriod;

        _proposals[proposalId] = Proposal({
            proposer: msg.sender,
            snapshotBlock: snapshot, // FIX-1
            voteStart: voteStart,
            voteEnd: voteEnd,
            canceled: false,
            queued: false,
            executed: false,
            targets: targets,
            values: values,
            calldatas: calldatas,
            descriptionHash: descriptionHash
        });

        emit ProposalCreated(
            proposalId, msg.sender, targets, values, calldatas, description, snapshot, voteStart, voteEnd
        );
    }

    /**
     * @notice Cast a vote on an active proposal.
     *
     * @param proposalId The proposal to vote on.
     * @param support    0 = Against, 1 = For, 2 = Abstain.
     */
    function castVote(uint256 proposalId, uint8 support) external returns (uint256 weight) {
        return _castVote(proposalId, msg.sender, support, "");
    }

    /**
     * @notice Cast a vote with an optional reason string.
     */
    function castVoteWithReason(uint256 proposalId, uint8 support, string calldata reason)
        external
        returns (uint256 weight)
    {
        return _castVote(proposalId, msg.sender, support, reason);
    }

    /**
     * @dev Internal vote casting.
     *
     *      FIX-1: Reads TOKEN.getPastVotes(voter, snapshotBlock) — weight
     *             is frozen at proposal-creation time.
     *      FIX-2: Reverts if the voter has already cast a vote.
     */
    function _castVote(uint256 proposalId, address voter, uint8 support, string memory reason)
        internal
        returns (uint256 weight)
    {
        require(state(proposalId) == ProposalState.Active, "GovernorWithDefenses: voting not active");
        require(support <= 2, "GovernorWithDefenses: invalid support value");

        // FIX-2: Guard is now enforced — revert on duplicate vote.
        require(!hasVoted[proposalId][voter], "GovernorWithDefenses: vote already cast");
        hasVoted[proposalId][voter] = true;

        // FIX-1: Use historical (snapshot) weight, not live balance.
        //        snapshotBlock < voteStart <= block.number (always a past block).
        uint256 snapshotBlock = _proposals[proposalId].snapshotBlock;
        weight = TOKEN.getPastVotes(voter, snapshotBlock);

        ProposalVotes storage v = _proposalVotes[proposalId];
        if (support == 0) {
            v.againstVotes += weight;
        } else if (support == 1) {
            v.forVotes += weight;
        } else {
            v.abstainVotes += weight;
        }

        emit VoteCast(voter, proposalId, support, weight, reason);
    }

    /**
     * @notice Queue a succeeded proposal in the TimelockController.
     *
     * @dev FIX-3: Mandatory queuing step — schedules the operation batch in
     *             the TimelockController, enforcing the configurable delay.
     *      FIX-6: CEI — proposal state is marked `queued = true` BEFORE the
     *             external call to scheduleBatch.
     *      FIX-8: Caller-supplied arrays are validated against stored values
     *             before any state change.
     *
     * @param targets         Call targets (must match proposal).
     * @param values          ETH values (must match proposal).
     * @param calldatas       Encoded call data (must match proposal).
     * @param descriptionHash keccak256 of the proposal description.
     * @return proposalId     ID of the queued proposal.
     */
    function queue(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
        external
        returns (uint256 proposalId)
    {
        proposalId = hashProposal(targets, values, calldatas, descriptionHash);

        require(state(proposalId) == ProposalState.Succeeded, "GovernorWithDefenses: proposal not succeeded");

        // FIX-8: Validate caller-supplied arrays against stored proposal data.
        _validateCallArrays(proposalId, targets, values, calldatas);

        // FIX-6: CEI — write state BEFORE external call.
        _proposals[proposalId].queued = true;

        // FIX-3: Schedule the batch in the TimelockController.
        //        salt = bytes32(proposalId) makes each proposal a unique operation.
        uint256 delay = TIMELOCK.getMinDelay();
        TIMELOCK.scheduleBatch(
            targets,
            values,
            calldatas,
            bytes32(0), // predecessor — none required
            bytes32(proposalId), // salt       — unique per proposal
            delay
        );

        uint256 eta = block.timestamp + delay;
        emit ProposalQueued(proposalId, eta);
    }

    /**
     * @notice Execute a queued proposal after the timelock delay has elapsed.
     *
     * @dev FIX-3: Delegates execution to TimelockController.executeBatch(),
     *             which enforces that minDelay has elapsed since scheduling.
     *      FIX-6: CEI — proposal state is marked `executed = true` BEFORE the
     *             external call to executeBatch.
     *      FIX-8: Caller-supplied arrays are validated against stored values.
     *
     * @param targets         Call targets (must match proposal).
     * @param values          ETH values (must match proposal).
     * @param calldatas       Encoded call data (must match proposal).
     * @param descriptionHash keccak256 of the proposal description.
     * @return proposalId     ID of the executed proposal.
     */
    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) external payable returns (uint256 proposalId) {
        proposalId = hashProposal(targets, values, calldatas, descriptionHash);

        require(state(proposalId) == ProposalState.Queued, "GovernorWithDefenses: proposal not queued");

        // FIX-8: Validate caller-supplied arrays against stored proposal data.
        _validateCallArrays(proposalId, targets, values, calldatas);

        // FIX-3: Confirm the timelock operation is ready (delay elapsed).
        bytes32 timelockId = TIMELOCK.hashOperationBatch(targets, values, calldatas, bytes32(0), bytes32(proposalId));
        require(TIMELOCK.isOperationReady(timelockId), "GovernorWithDefenses: timelock delay not elapsed");

        // FIX-6: CEI — write executed flag BEFORE external call.
        _proposals[proposalId].executed = true;

        // FIX-3: Execute through the timelock (not directly).
        TIMELOCK.executeBatch{value: msg.value}(targets, values, calldatas, bytes32(0), bytes32(proposalId));

        emit ProposalExecuted(proposalId);
    }

    /**
     * @notice Cancel a proposal that is still in the Pending state.
     *
     * @dev FIX-7: Cancellation is only permitted while the proposal is Pending
     *             (before voting has started).  Prevents a proposer from
     *             canceling mid-vote to manipulate outcomes.
     *      FIX-6: CEI — state is updated before emitting the event.
     */
    function cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) external returns (uint256 proposalId) {
        proposalId = hashProposal(targets, values, calldatas, descriptionHash);
        Proposal storage p = _proposals[proposalId];

        // FIX-7: Only allow cancellation while the proposal is still Pending.
        require(state(proposalId) == ProposalState.Pending, "GovernorWithDefenses: can only cancel pending proposals");
        require(msg.sender == p.proposer, "GovernorWithDefenses: not proposer");

        // FIX-6: CEI — update state before event.
        p.canceled = true;
        emit ProposalCanceled(proposalId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // View helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Returns the raw vote tallies for a proposal.
     * @return againstVotes  Votes cast against.
     * @return forVotes      Votes cast in favour.
     * @return abstainVotes  Abstain votes.
     */
    function proposalVotes(uint256 proposalId)
        external
        view
        returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)
    {
        ProposalVotes storage v = _proposalVotes[proposalId];
        return (v.againstVotes, v.forVotes, v.abstainVotes);
    }

    /**
     * @notice Returns the snapshot, start and end block of a proposal's window.
     * @return snapshotBlock Block at which vote weight was frozen (FIX-1).
     * @return voteStart     First block where voting is allowed.
     * @return voteEnd       Last block where voting is allowed.
     */
    function proposalWindow(uint256 proposalId)
        external
        view
        returns (uint256 snapshotBlock, uint256 voteStart, uint256 voteEnd)
    {
        Proposal storage p = _proposals[proposalId];
        return (p.snapshotBlock, p.voteStart, p.voteEnd);
    }

    /**
     * @notice Returns the proposer of a given proposal.
     */
    function proposalProposer(uint256 proposalId) external view returns (address) {
        return _proposals[proposalId].proposer;
    }

    /**
     * @notice Returns the descriptionHash stored for a proposal.
     */
    function proposalDescriptionHash(uint256 proposalId) external view returns (bytes32) {
        return _proposals[proposalId].descriptionHash;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal utilities
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @dev FIX-8: Validate caller-supplied call arrays against stored proposal data.
     *             Reverts on any length mismatch or element-level discrepancy.
     */
    function _validateCallArrays(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas
    ) internal view {
        Proposal storage p = _proposals[proposalId];

        require(
            targets.length == p.targets.length && values.length == p.values.length
                && calldatas.length == p.calldatas.length,
            "GovernorWithDefenses: array length mismatch"
        );

        for (uint256 i = 0; i < targets.length; ++i) {
            require(targets[i] == p.targets[i], "GovernorWithDefenses: target mismatch");
            require(values[i] == p.values[i], "GovernorWithDefenses: value mismatch");
            require(keccak256(calldatas[i]) == keccak256(p.calldatas[i]), "GovernorWithDefenses: calldata mismatch");
        }
    }

    /// @dev Allow the contract to receive ETH for forwarding in proposal calls.
    receive() external payable {}
}
