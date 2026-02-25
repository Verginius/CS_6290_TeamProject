// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {GovernanceMath} from "../libraries/GovernanceMath.sol";
import {ProposalLib} from "../libraries/ProposalLib.sol";

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

    /// @dev Returns the total token supply; used by quorumVotes() and
    ///      proposalThreshold() to compute BPS-relative values.
    function totalSupply() external view returns (uint256);
}

// ---------------------------------------------------------------------------
// Main contract
// ---------------------------------------------------------------------------

contract GovernorWithDefenses {
    // ─────────────────────────────────────────────────────────────────────────
    // Types
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Lifecycle states for a proposal (Governance_Spec §ProposalState).
    enum ProposalState {
        Pending, // 0 – created, voting not yet started
        Active, // 1 – voting window is open
        Succeeded, // 2 – voting ended, for > against, quorum met
        Defeated, // 3 – voting ended, for <= against OR quorum not met
        Queued, // 4 – queued in TimelockController, awaiting delay        (FIX-3)
        Expired, // 5 – queued but not executed within GRACE_PERIOD       (Spec)
        Executed, // 6 – proposal actions have been dispatched
        Canceled // 7 – canceled while Pending only                       (FIX-7)
    }

    struct ProposalVotes {
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
    }

    /// @notice Per-voter vote receipt (Governance_Spec §Integration Points).
    struct Receipt {
        bool hasVoted;
        uint8 support;
        uint256 votes;
    }

    struct Proposal {
        address proposer;
        /// @dev FIX-1: block number at which vote weight is frozen.
        uint256 snapshotBlock;
        uint256 voteStart; // first block where voting is allowed
        uint256 voteEnd; // last block where voting is allowed (inclusive)
        uint256 eta; // UNIX timestamp when timelock operation matures
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

    // ── Timelock grace period (Governance_Spec §Expired) ─────────────────────
    uint256 public constant GRACE_PERIOD = 14 days;

    // ── Dynamic quorum bounds (Governance_Spec §Dynamic Quorum) ──────────────
    uint256 public constant MIN_QUORUM_BPS = 200; // 2 % floor
    uint256 public constant MAX_QUORUM_BPS = 1000; // 10 % ceil

    /// @dev Rolling window size for dynamic quorum average.
    uint256 private constant PARTICIPATION_WINDOW = 10;

    // ── Immutables ────────────────────────────────────────────────────────────
    string public name;

    /// @notice The voting token (ERC20Votes-compatible).
    ITokenVotes public immutable TOKEN;

    /// @notice TimelockController that acts as the execution layer.  (FIX-3)
    TimelockController public immutable TIMELOCK;

    // ── Configurable parameters ───────────────────────────────────────────────
    /// @notice Blocks to wait after proposal creation before voting starts.
    uint256 public votingDelay;

    /// @notice Duration in blocks of the voting window.
    uint256 public votingPeriod;

    /// @notice FIX-4: basis points of total supply required to create a proposal.
    ///         e.g. 100 = 1 %.  Call proposalThreshold() for the absolute value.
    uint256 public proposalThresholdBps;

    /// @notice Base quorum in basis points of total supply.
    ///         e.g. 400 = 4 %.  Call quorumVotes() for the dynamic absolute value.
    uint256 public quorumBps;

    // ── Proposal storage ──────────────────────────────────────────────────────
    mapping(uint256 => Proposal) internal _proposals;
    mapping(uint256 => ProposalVotes) internal _proposalVotes;

    /// @dev Per-voter receipts: hasVoted / support / votes (for getReceipt()).
    mapping(uint256 => mapping(address => Receipt)) private _receipts;

    /// @dev FIX-2: public bool guard for quick external checks.
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    /// @dev Total proposals ever created; returned by proposalCount().
    uint256 private _proposalCount;

    /// @dev Rolling window of participation BPS from the last
    ///      PARTICIPATION_WINDOW completed proposals (used by quorumVotes()).
    uint256[] private _recentParticipationBps;

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
    /// @param _name                 Human-readable governor name.
    /// @param _token                ERC20Votes-compatible governance token.
    /// @param _timelock             TimelockController used as the execution layer.
    /// @param _votingDelay          Blocks between proposal creation and voting start.
    /// @param _votingPeriod         Duration in blocks of the voting window.
    /// @param _proposalThresholdBps BPS of total supply required to propose (e.g. 100 = 1 %).
    /// @param _quorumBps            Base quorum in BPS of total supply (e.g. 400 = 4 %).
    constructor(
        string memory _name,
        ITokenVotes _token,
        TimelockController _timelock,
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _proposalThresholdBps,
        uint256 _quorumBps
    ) {
        require(address(_token) != address(0), "GovernorWithDefenses: zero token");
        require(address(_timelock) != address(0), "GovernorWithDefenses: zero timelock");
        require(_votingPeriod > 0, "GovernorWithDefenses: zero period");
        require(_quorumBps <= 10_000, "GovernorWithDefenses: quorum > 100%");

        name = _name;
        TOKEN = _token;
        TIMELOCK = _timelock;
        votingDelay = _votingDelay;
        votingPeriod = _votingPeriod;
        proposalThresholdBps = _proposalThresholdBps;
        quorumBps = _quorumBps;
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

        if (p.queued) {
            // Governance_Spec §Expired: if timelock window has passed, proposal expires.
            if (ProposalLib.isExpired(p.eta, GRACE_PERIOD)) return ProposalState.Expired;
            return ProposalState.Queued;
        }

        if (block.number <= p.voteStart) return ProposalState.Pending;
        if (block.number <= p.voteEnd) return ProposalState.Active;

        // Voting ended — evaluate outcome.
        ProposalVotes storage v = _proposalVotes[proposalId];

        // FIX-5: require minimum participation before declaring Succeeded.
        bool votingSucceeded =
            GovernanceMath.proposalSucceeded(v.forVotes, v.againstVotes, v.abstainVotes, quorumVotes());

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
        return ProposalLib.hashProposal(targets, values, calldatas, descriptionHash);
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
            TOKEN.getPastVotes(msg.sender, checkBlock) >= proposalThreshold(),
            "GovernorWithDefenses: proposer votes below threshold"
        );

        ProposalLib.validateArrayLengths(targets, values, calldatas);

        bytes32 descriptionHash = ProposalLib.hashDescription(description);
        proposalId = hashProposal(targets, values, calldatas, descriptionHash);

        require(_proposals[proposalId].voteStart == 0, "GovernorWithDefenses: proposal already exists");

        // Increment counter before writing proposal (Governance_Spec §Integration Points).
        ++_proposalCount;

        // FIX-1: Record the snapshot block — vote weight is frozen here.
        uint256 snapshot = block.number;
        uint256 voteStart = snapshot + votingDelay;
        uint256 voteEnd = voteStart + votingPeriod;

        _proposals[proposalId] = Proposal({
            proposer: msg.sender,
            snapshotBlock: snapshot, // FIX-1
            voteStart: voteStart,
            voteEnd: voteEnd,
            eta: 0, // set in queue()
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

        // Governance_Spec §Integration Points: store receipt for getReceipt().
        _receipts[proposalId][voter] = Receipt({hasVoted: true, support: support, votes: weight});

        emit VoteCast(voter, proposalId, support, weight, reason);
    }

    /**
     * @notice Queue a succeeded proposal in the TimelockController.
     *
     * @dev FIX-3: Mandatory queuing step — schedules the operation batch in
     *             the TimelockController, enforcing the configurable delay.
     *      FIX-6: CEI — proposal state is marked `queued = true` BEFORE the
     *             external call to scheduleBatch.
     *      FIX-8: Uses stored arrays from proposal creation; no caller-supplied
     *             arrays accepted, so tampering is impossible by design.
     *
     * @param proposalId  ID of the proposal to queue.
     */
    function queue(uint256 proposalId) external {
        require(state(proposalId) == ProposalState.Succeeded, "GovernorWithDefenses: proposal not succeeded");

        Proposal storage p = _proposals[proposalId];

        // FIX-6: CEI — write state BEFORE external call.
        p.queued = true;

        // FIX-3: Schedule the batch in the TimelockController.
        //        salt = bytes32(proposalId) makes each proposal a unique operation.
        uint256 delay = TIMELOCK.getMinDelay();
        TIMELOCK.scheduleBatch(
            p.targets,
            p.values,
            p.calldatas,
            bytes32(0), // predecessor — none required
            bytes32(proposalId), // salt       — unique per proposal
            delay
        );

        uint256 eta = ProposalLib.computeEta(block.timestamp, delay);
        p.eta = eta; // store for Expired check

        // Record participation for dynamic quorum update.
        _recordParticipation(proposalId);

        emit ProposalQueued(proposalId, eta);
    }

    /**
     * @notice Execute a queued proposal after the timelock delay has elapsed.
     *
     * @dev FIX-3: Delegates execution to TimelockController.executeBatch(),
     *             which enforces that minDelay has elapsed since scheduling.
     *      FIX-6: CEI — proposal state is marked `executed = true` BEFORE the
     *             external call to executeBatch.
     *      FIX-8: Uses stored arrays; no way to inject modified parameters.
     *
     * @param proposalId  ID of the proposal to execute.
     */
    function execute(uint256 proposalId) external payable {
        require(state(proposalId) == ProposalState.Queued, "GovernorWithDefenses: proposal not queued");

        Proposal storage p = _proposals[proposalId];

        // FIX-3: Confirm the timelock operation is ready (delay elapsed).
        bytes32 timelockId =
            TIMELOCK.hashOperationBatch(p.targets, p.values, p.calldatas, bytes32(0), bytes32(proposalId));
        require(TIMELOCK.isOperationReady(timelockId), "GovernorWithDefenses: timelock delay not elapsed");

        // FIX-6: CEI — write executed flag BEFORE external call.
        p.executed = true;

        // FIX-3: Execute through the timelock (not directly).
        TIMELOCK.executeBatch{value: msg.value}(p.targets, p.values, p.calldatas, bytes32(0), bytes32(proposalId));

        emit ProposalExecuted(proposalId);
    }

    /**
     * @notice Cancel a proposal that is still in the Pending state.
     *
     * @dev FIX-7: Cancellation is only permitted while the proposal is Pending
     *             (before voting has started).  Prevents a proposer from
     *             canceling mid-vote to manipulate outcomes.
     *      FIX-6: CEI — state is updated before emitting the event.
     *
     * @param proposalId  ID of the proposal to cancel.
     */
    function cancel(uint256 proposalId) external {
        Proposal storage p = _proposals[proposalId];

        // FIX-7: Only allow cancellation while the proposal is still Pending.
        require(state(proposalId) == ProposalState.Pending, "GovernorWithDefenses: can only cancel pending proposals");
        require(msg.sender == p.proposer, "GovernorWithDefenses: not proposer");

        // FIX-6: CEI — update state before event.
        p.canceled = true;
        emit ProposalCanceled(proposalId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BPS-derived parameter views (Governance_Spec §Parameters)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Absolute proposal-creation threshold derived from
     *         `proposalThresholdBps` and the current total supply.
     * @return Minimum delegated vote weight required to call propose().
     */
    function proposalThreshold() public view returns (uint256) {
        uint256 bps = proposalThresholdBps;
        if (bps > 10_000) {
            bps = 10_000;
        }
        return GovernanceMath.applyBps(TOKEN.totalSupply(), bps);
    }

    /**
     * @notice Dynamic quorum: absolute vote count required for a proposal to
     *         succeed.  Adjusts based on recent participation history.
     *
     *         Formula (Governance_Spec §Dynamic Quorum):
     *           dynamicBps = clamp(
     *               avgRecentParticipationBps * 70% + 500,
     *               MIN_QUORUM_BPS, MAX_QUORUM_BPS
     *           )
     *           return TOKEN.totalSupply() * dynamicBps / 10_000
     *
     *         Falls back to plain `quorumBps` when no history exists.
     * @return Minimum total participation (for+against+abstain) required.
     */
    function quorumVotes() public view returns (uint256) {
        return GovernanceMath.dynamicQuorum(
            TOKEN.totalSupply(), _recentParticipationBps, quorumBps, MIN_QUORUM_BPS, MAX_QUORUM_BPS
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Spec integration-point views (Governance_Spec §Integration Points)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Returns a summary of the given proposal for off-chain consumers.
     * @return proposer      Address that created the proposal.
     * @return eta           UNIX timestamp when the timelock operation matures.
     * @return targets       Call targets.
     * @return values        ETH values.
     * @return calldatas     ABI-encoded call data.
     * @return startBlock    First block where voting is allowed.
     * @return endBlock      Last block where voting is allowed.
     * @return forVotes      Votes cast in favour.
     * @return againstVotes  Votes cast against.
     * @return proposalState Current state of the proposal.
     */
    function getProposal(uint256 proposalId)
        external
        view
        returns (
            address proposer,
            uint256 eta,
            address[] memory targets,
            uint256[] memory values,
            bytes[] memory calldatas,
            uint256 startBlock,
            uint256 endBlock,
            uint256 forVotes,
            uint256 againstVotes,
            ProposalState proposalState
        )
    {
        Proposal storage p = _proposals[proposalId];
        require(p.voteStart != 0, "unknown proposal");

        ProposalVotes storage v = _proposalVotes[proposalId];
        return (
            p.proposer,
            p.eta,
            p.targets,
            p.values,
            p.calldatas,
            p.voteStart,
            p.voteEnd,
            v.forVotes,
            v.againstVotes,
            state(proposalId)
        );
    }

    /**
     * @notice Returns the vote receipt for a specific voter on a proposal.
     * @return hasVotedOut Whether the voter has cast a vote.
     * @return support     0 Against / 1 For / 2 Abstain.
     * @return votes       Vote weight applied.
     */
    function getReceipt(uint256 proposalId, address voter)
        external
        view
        returns (bool hasVotedOut, uint8 support, uint256 votes)
    {
        Receipt storage r = _receipts[proposalId][voter];
        return (r.hasVoted, r.support, r.votes);
    }

    /**
     * @notice Total number of proposals ever created.
     */
    function proposalCount() external view returns (uint256) {
        return _proposalCount;
    }

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
     * @dev Records the participation BPS of a just-queued proposal into the
     *      rolling window used by quorumVotes().
     *
     *      participationBps = totalVotes * 10_000 / totalSupply
     *
     *      Window is capped at PARTICIPATION_WINDOW entries (oldest dropped).
     */
    function _recordParticipation(uint256 proposalId) internal {
        ProposalVotes storage v = _proposalVotes[proposalId];
        uint256 supply = TOKEN.totalSupply();

        uint256 bps = GovernanceMath.participationBps(v.forVotes, v.againstVotes, v.abstainVotes, supply);

        if (_recentParticipationBps.length < PARTICIPATION_WINDOW) {
            _recentParticipationBps.push(bps);
        } else {
            // Rotate: shift left and append.
            for (uint256 i = 0; i + 1 < _recentParticipationBps.length; ++i) {
                _recentParticipationBps[i] = _recentParticipationBps[i + 1];
            }
            _recentParticipationBps[_recentParticipationBps.length - 1] = bps;
        }
    }

    /// @dev Allow the contract to receive ETH for forwarding in proposal calls.
    receive() external payable {}
}
