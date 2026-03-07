// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Timelock (Time-Based Defense)
 * @notice Implements Defense Layer 1 from docs/specs/Defense_Mechanisms.md:
 *         the three mechanisms (Voting Delay, Voting Period, Timelock) and the
 *         full flow from proposal creation to execution.
 *
 * ============================================================
 * FLOW (Time-Based Defense Summary)
 * ============================================================
 *
 *   Proposal Created (Day 0)
 *         │
 *         │  Part 1: Voting Delay (review period)
 *         ↓
 *   Voting Starts (voteStart = createdAt + votingDelay)
 *         │
 *         │  Part 2: Voting Period (votes can be cast)
 *         ↓
 *   Voting Ends, Proposal Passed (voteEnd = voteStart + votingPeriod)
 *         │
 *         │  Part 3: Queue in Timelock — ETA = now + delay
 *         ↓
 *   Timelock Period (community can review, users can exit)
 *         │
 *         ↓  ETA Reached → execute() allowed until ETA + GRACE_PERIOD
 *   Action Executed
 *
 * ============================================================
 * THREE PARTS
 * ============================================================
 *
 *  Part 1 — Voting Delay (§ 1.1): waiting period between proposal creation
 *           and start of voting. Snapshot taken at voteStart.
 *
 *  Part 2 — Voting Period (§ 1.2): duration during which votes can be cast.
 *
 *  Part 3 — Timelock (§ 1.3): mandatory delay between "passed" and execution;
 *           queue with ETA, execute only after delay, grace period for expiry.
 */
contract Timelock {
    // ══════════════════════════════════════════════════════════════════════════
    // Part 1: Voting Delay (Mechanism 1.1)
    // ══════════════════════════════════════════════════════════════════════════

    /// @notice Waiting period (seconds) between proposal creation and voting start.
    /// @dev    Typical: 1–2 days. Vote weight snapshot is taken at voteStart.
    uint256 public votingDelay;

    /// @notice Recommended bounds (Defense_Mechanisms.md § 1.1 Configuration).
    uint256 public constant MINIMUM_VOTING_DELAY = 1 days; // 7,200 blocks
    uint256 public constant MAXIMUM_VOTING_DELAY = 7 days; // 50,400 blocks
    uint256 public constant DEFAULT_VOTING_DELAY = 2 days; // 14,400 blocks

    /// @notice Returns the timestamp when voting may start for a proposal created at `createdAt`.
    function getVoteStartTime(uint256 createdAt) external view returns (uint256) {
        return createdAt + votingDelay;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Part 2: Voting Period (Mechanism 1.2)
    // ══════════════════════════════════════════════════════════════════════════

    /// @notice Duration (seconds) during which votes can be cast.
    /// @dev    Typical: 3–7 days. Voting ends at voteStart + votingPeriod.
    uint256 public votingPeriod;

    /// @notice Recommended bounds (Defense_Mechanisms.md § 1.2 Configuration).
    uint256 public constant MINIMUM_VOTING_PERIOD = 3 days; // 21,600 blocks
    uint256 public constant MAXIMUM_VOTING_PERIOD = 14 days; // 100,800 blocks
    uint256 public constant DEFAULT_VOTING_PERIOD = 7 days; // 50,400 blocks

    /// @notice Returns the timestamp when voting ends for a proposal created at `createdAt`.
    function getVoteEndTime(uint256 createdAt) external view returns (uint256) {
        return createdAt + votingDelay + votingPeriod;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Part 3: Timelock (Mechanism 1.3)
    // ══════════════════════════════════════════════════════════════════════════

    /// @notice Minimum delay (seconds) before a queued transaction can execute.
    /// @dev    ETA = queue time + delay; execution allowed in [ETA, ETA + GRACE_PERIOD].
    uint256 public delay;

    uint256 public constant GRACE_PERIOD = 14 days;
    uint256 public constant MINIMUM_DELAY = 2 days;
    uint256 public constant MAXIMUM_DELAY = 30 days;

    /// @notice Address allowed to queue, execute, and cancel (e.g. Governor).
    address public admin;

    mapping(bytes32 => bool) public queuedTransactions;

    // ─────────────────────────────────────────────────────────────────────────
    // Events (Part 3 — Timelock)
    // ─────────────────────────────────────────────────────────────────────────

    event QueueTransaction(
        bytes32 indexed txHash, address indexed target, uint256 value, string signature, bytes data, uint256 eta
    );

    event ExecuteTransaction(
        bytes32 indexed txHash, address indexed target, uint256 value, string signature, bytes data, uint256 eta
    );

    event CancelTransaction(
        bytes32 indexed txHash, address indexed target, uint256 value, string signature, bytes data, uint256 eta
    );

    // ─────────────────────────────────────────────────────────────────────────
    // Flow: phase enum and timeline view
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Phases of the time-based defense flow (doc § Time-Based Defense Summary).
    enum Phase {
        VotingDelay, // 0 — Proposal created; before voteStart (review period)
        VotingPeriod, // 1 — Between voteStart and voteEnd (votes can be cast)
        Passed, // 2 — After voteEnd (success), not yet queued
        Queued, // 3 — Queued in timelock, before ETA
        Executable, // 4 — After ETA, within grace period
        Expired // 5 — After ETA + GRACE_PERIOD or already executed
    }

    /// @notice Returns the current phase for a proposal (by timestamps) and whether it is queued/executed.
    /// @param  createdAt  When the proposal was created (Part 1 start).
    /// @param  eta        ETA of the queued timelock operation (0 if not queued).
    /// @param  executed   True if the timelock action has already been executed.
    function getPhase(uint256 createdAt, uint256 eta, bool executed) external view returns (Phase) {
        if (executed) return Phase.Expired; // already done

        uint256 voteStart = createdAt + votingDelay;
        uint256 voteEnd = voteStart + votingPeriod;
        uint256 now_ = block.timestamp;

        if (now_ < voteStart) return Phase.VotingDelay;
        if (now_ <= voteEnd) return Phase.VotingPeriod;
        // After voteEnd: Passed (voting succeeded). If not queued, still Passed.
        if (eta == 0) return Phase.Passed;

        // Queued in timelock
        if (now_ < eta) return Phase.Queued;
        if (now_ <= eta + GRACE_PERIOD) return Phase.Executable;
        return Phase.Expired;
    }

    /// @notice Minimum total time from proposal creation to earliest possible execution (flow summary).
    function getMinimumTimeToExecution() external view returns (uint256) {
        return votingDelay + votingPeriod + delay;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    /// @param _admin         Address that can queue/execute/cancel (e.g. Governor).
    /// @param _votingDelay   Part 1: seconds before voting starts (MINIMUM_VOTING_DELAY .. MAXIMUM_VOTING_DELAY).
    /// @param _votingPeriod  Part 2: seconds voting is open (MINIMUM_VOTING_PERIOD .. MAXIMUM_VOTING_PERIOD).
    /// @param _delay         Part 3: timelock delay (MINIMUM_DELAY .. MAXIMUM_DELAY).
    constructor(address _admin, uint256 _votingDelay, uint256 _votingPeriod, uint256 _delay) {
        require(_admin != address(0), "Timelock: zero admin");
        require(
            _votingDelay >= MINIMUM_VOTING_DELAY && _votingDelay <= MAXIMUM_VOTING_DELAY, "Timelock: bad voting delay"
        );
        require(
            _votingPeriod >= MINIMUM_VOTING_PERIOD && _votingPeriod <= MAXIMUM_VOTING_PERIOD,
            "Timelock: bad voting period"
        );
        require(_delay >= MINIMUM_DELAY && _delay <= MAXIMUM_DELAY, "Timelock: bad delay");

        admin = _admin;
        votingDelay = _votingDelay;
        votingPeriod = _votingPeriod;
        delay = _delay;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Modifiers
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Restricts function access to the admin address.
    modifier onlyAdmin() {
        require(msg.sender == admin, "Timelock: only admin");
        _;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Part 3: Timelock — queue / execute / cancel (doc § 1.3 Implementation)
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Queue a transaction for execution after the timelock delay (ETA = now + delay).
    function queueTransaction(address target, uint256 value, string memory signature, bytes memory data, uint256 eta)
        public
        onlyAdmin
        returns (bytes32 txHash)
    {
        require(eta > block.timestamp + delay, "Timelock: ETA must exceed delay");

        txHash = keccak256(abi.encode(target, value, signature, data, eta));
        queuedTransactions[txHash] = true;

        emit QueueTransaction(txHash, target, value, signature, data, eta);
    }

    /// @notice Execute a queued transaction once ETA has been reached and before grace period expiry.
    function executeTransaction(address target, uint256 value, string memory signature, bytes memory data, uint256 eta)
        public
        payable
        onlyAdmin
        returns (bytes memory returnData)
    {
        bytes32 txHash = keccak256(abi.encode(target, value, signature, data, eta));
        require(queuedTransactions[txHash], "Timelock: transaction not queued");
        require(block.timestamp >= eta, "Timelock: transaction not ready");
        require(block.timestamp <= eta + GRACE_PERIOD, "Timelock: transaction expired");

        queuedTransactions[txHash] = false;

        bytes memory callData;
        if (bytes(signature).length == 0) {
            callData = data;
        } else {
            callData = abi.encodePacked(bytes4(keccak256(bytes(signature))), data);
        }

        (bool success, bytes memory ret) = target.call{value: value}(callData);
        require(success, "Timelock: transaction execution reverted");

        emit ExecuteTransaction(txHash, target, value, signature, data, eta);
        return ret;
    }

    /// @notice Cancel a queued transaction (admin only).
    function cancelTransaction(address target, uint256 value, string memory signature, bytes memory data, uint256 eta)
        public
        onlyAdmin
    {
        bytes32 txHash = keccak256(abi.encode(target, value, signature, data, eta));
        require(queuedTransactions[txHash], "Timelock: transaction not queued");

        queuedTransactions[txHash] = false;

        emit CancelTransaction(txHash, target, value, signature, data, eta);
    }

    /// @notice Returns the unique id for a transaction (same params as queue/execute/cancel).
    function getTransactionHash(address target, uint256 value, string memory signature, bytes memory data, uint256 eta)
        external
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode(target, value, signature, data, eta));
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Recommended configurations (Defense_Mechanisms.md § 1.3 & Summary)
// ─────────────────────────────────────────────────────────────────────────────

/// @notice Preset for "GovernorWithTimeDefenses" (Summary): 2 days delay, 7 days period, 48h timelock.
library TimeBasedDefenseConfig {
    struct Config {
        uint256 votingDelay;
        uint256 votingPeriod;
        uint256 timelockDelay;
    }

    /// @notice Standard: ~11 days minimum to execution (doc Summary).
    function standard() internal pure returns (Config memory) {
        return Config({votingDelay: 2 days, votingPeriod: 7 days, timelockDelay: 48 hours});
    }

    /// @notice Timelock-only presets by protocol size (§ 1.3 Configuration).
    struct TimelockOnlyConfig {
        uint256 minDelay;
        uint256 normalDelay;
        uint256 criticalDelay;
    }

    function smallTimelock() internal pure returns (TimelockOnlyConfig memory) {
        return TimelockOnlyConfig({minDelay: 24 hours, normalDelay: 48 hours, criticalDelay: 72 hours});
    }

    function largeTimelock() internal pure returns (TimelockOnlyConfig memory) {
        return TimelockOnlyConfig({minDelay: 48 hours, normalDelay: 72 hours, criticalDelay: 168 hours});
    }
}
