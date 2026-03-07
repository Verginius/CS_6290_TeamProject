// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {VotingPower, IVotesView} from "../libraries/VotingPower.sol";

/// @title TokenBasedDefense
/// @notice Demonstrates Layer 2 (Token-Based) defense mechanisms
///         as specified in docs/specs/Defense_Mechanisms.md §Defense Layer 2.
///
/// @dev    This contract exposes helper functions for educational purposes:
///         1. Snapshot Voting         – Query historical voting power
///         2. Token Locking (Vote Escrow) – Calculate time-weighted voting power
///         3. Vote Delegation         – Resolve delegation relationships
///         4. Defense Analysis        – Synthesize combined effectiveness
///
///         This contract is intentionally minimal. Production governors
///         should use GovernorWithDefenses.sol which integrates all defenses.
///
/// docs/specs/Defense_Mechanisms.md references:
/// §Mechanism 2.1: Snapshot Voting
/// §Mechanism 2.2: Token Locking (Vote Escrowing)
/// §Mechanism 2.3: Vote Delegation
contract TokenBasedDefense {
    using VotingPower for IVotesView;

    // ─────────────────────────────────────────────────────────────────────────
    // Constants (from docs/specs/Defense_Mechanisms.md §Mechanism 2.2)
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Minimum lock duration for voting power to count.
    uint256 public constant MIN_LOCK_DURATION = 3 days;

    /// @notice Maximum lock duration (vote escrow model, Curve-style).
    ///         docs/specs/Defense_Mechanisms.md: "4-year max lock"
    uint256 public constant MAX_LOCK_DURATION = 4 * 365 days;

    // ─────────────────────────────────────────────────────────────────────────
    // Storage
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Governance token (ERC20Votes compatible).
    IVotesView public immutable token;

    constructor(IVotesView _token) {
        require(address(_token) != address(0), "TokenBasedDefense: zero token");
        token = _token;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Mechanism 1: Snapshot Voting
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Returns voting power at a specific block (snapshot voting).
    ///         Defense_Mechanisms.md §Mechanism 2.1: Snapshot Voting
    ///
    ///         Key property: Voting power is FROZEN at the snapshot block.
    ///         This prevents flash-loan attacks because borrowed tokens
    ///         were never held at the snapshot block.
    ///
    /// @param account      The voter address.
    /// @param snapshotBlock The block at which to measure voting power (must be < block.number).
    /// @return Voting power at the given block (historical checkpoint).
    function snapshotVotes(address account, uint256 snapshotBlock) external view returns (uint256) {
        require(snapshotBlock < block.number, "TokenBasedDefense: snapshot must be past block");
        return token.snapshotWeight(account, snapshotBlock);
    }

    /// @notice Returns current (live) voting power for comparison.
    ///         ⚠️  VULNERABLE to flash-loan attacks — use snapshotVotes() for governance!
    /// @param account The voter address.
    /// @return Current voting power (updated in same block).
    function liveVotes(address account) external view returns (uint256) {
        return token.liveWeight(account);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Mechanism 2: Token Locking (Vote Escrow)
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Calculate vote-escrow voting power from a time lock.
    ///         docs/specs/Defense_Mechanisms.md §Mechanism 2.2: Token Locking (Vote Escrowing)
    ///
    ///         Vote Escrow (Curve-style, simplified for this project):
    ///         - Longer remaining lock time → higher voting power
    ///         - Voting power decays linearly to 0 at expiry
    ///         - Formula (simplified): vePower = lockedAmount × remainingTime / MAX_LOCK_DURATION
    ///
    /// @param lockedAmount   Tokens locked.
    /// @param remainingTime  Seconds until lock expires.
    /// @return vePower       Voting power attributable to the lock (decays to 0).
    function voteEscrowPower(uint256 lockedAmount, uint256 remainingTime) public pure returns (uint256 vePower) {
        if (lockedAmount == 0) return 0;
        if (remainingTime < MIN_LOCK_DURATION) return 0;
        if (remainingTime > MAX_LOCK_DURATION) remainingTime = MAX_LOCK_DURATION;

        vePower = (lockedAmount * remainingTime) / MAX_LOCK_DURATION;
    }

    /// @notice Maximum vote-escrow power at full duration (remainingTime = MAX_LOCK_DURATION).
    function maxVoteEscrowPower(uint256 lockedAmount) external pure returns (uint256) {
        return voteEscrowPower(lockedAmount, MAX_LOCK_DURATION);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Mechanism 3: Vote Delegation
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Resolve the effective voter address based on delegation.
    ///         docs/specs/Defense_Mechanisms.md §Mechanism 2.3: Vote Delegation
    ///
    ///         Delegation allows:
    ///         ✅ Experts to accumulate voting power
    ///         ✅ Passive token holders to participate
    ///         ⚠️  Risk of centralization if many delegate to same address
    ///
    /// @dev Note: Solidity does not allow `mapping` parameters on public/external functions.
    ///      In production, delegation is handled by ERC20Votes (`token.delegates(account)` and checkpoints).
    /// @param voter     The original token holder.
    /// @param delegatee The delegatee address (0 means "no delegation").
    /// @return effectiveVoter The address whose voting power is used.
    function resolveDelegation(address voter, address delegatee) external pure returns (address effectiveVoter) {
        if (delegatee == address(0)) return voter;
        return delegatee;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Integrated Analysis: All Layer 2 Defenses Combined
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Result of analyzing Layer 2 defenses for a voter.
    struct DefenseAnalysis {
        // Voting power from snapshot voting (flash-loan safe)
        uint256 snapshotBasePower;
        // Vote-escrow power from token locking (time-weighted, decays)
        uint256 voteEscrowPower;
        // Combined effective voting power
        uint256 totalEffectivePower;
        // True if live voting power differs from snapshot (a manipulation indicator)
        bool liveDiffersFromSnapshot;
        // True if voter has a qualifying lock
        bool hasLockAlignment;
        // True if voter has delegated (input flag; delegation is token-level)
        bool isDelegated;
    }

    /// @notice Comprehensive analysis of Layer 2 defense effectiveness.
    ///         docs/specs/Defense_Mechanisms.md §Token-Based Defense Summary
    ///
    ///         Answers:
    ///         - "Is this voter vulnerable to flash loans?" (snapshot ≠ live)
    ///         - "Are they locked for long-term alignment?" (lock qualifies + vePower > 0)
    ///         - "Have they delegated power?" (delegate ≠ self)
    ///
    /// @param voter The voter to analyze.
    /// @param snapshotBlock Block for historical balance (must be < block.number).
    /// @param lockedAmount        Tokens locked by voter.
    /// @param remainingLockTime   Seconds remaining on lock.
    /// @param hasDelegated        True if voter delegated.
    function analyzeTokenDefenses(
        address voter,
        uint256 snapshotBlock,
        uint256 lockedAmount,
        uint256 remainingLockTime,
        bool hasDelegated
    ) external view returns (DefenseAnalysis memory analysis) {
        require(snapshotBlock < block.number, "TokenBasedDefense: snapshot must be past block");
        uint256 snapshotPower = this.snapshotVotes(voter, snapshotBlock);
        uint256 livePower = this.liveVotes(voter);
        uint256 vePower = voteEscrowPower(lockedAmount, remainingLockTime);

        analysis = DefenseAnalysis({
            snapshotBasePower: snapshotPower,
            voteEscrowPower: vePower,
            totalEffectivePower: snapshotPower + vePower,
            // If live != snapshot, then using live-votes would be unsafe for this proposal.
            liveDiffersFromSnapshot: (snapshotPower != livePower),
            hasLockAlignment: (vePower > 0),
            isDelegated: hasDelegated
        });
    }

    /// @notice Quick reference: Defense effectiveness against each attack.
    ///         docs/specs/Defense_Mechanisms.md §Token-Based Defense Summary

    function defenseSummary() external pure returns (string memory summary) {
        summary = "Layer 2 combined: Flash loans 100% blocked, " "whale manipulation 30-40% mitigated, "
            "spam attacks 40% reduced. " "See docs/specs/Defense_Mechanisms.md for full matrix.";
    }
}
