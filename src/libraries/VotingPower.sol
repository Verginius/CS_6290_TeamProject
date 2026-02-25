// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title  VotingPower
 * @author CS 6290 Team — Student 1 (Spec, Architecture & Core Governance Lead)
 * @notice Library that centralises every vote-weight calculation used across
 *         the governance system: snapshot-safe balance reads, proposal-threshold
 *         checks, delegation influence scoring, and relative-power comparisons.
 *
 * @dev    All external token interactions are performed through the `IVotesView`
 *         interface defined below, keeping this library compatible with any
 *         ERC-5805 / OpenZeppelin ERC20Votes implementation.
 *
 * ============================================================
 * SNAPSHOT SAFETY
 * ============================================================
 *
 * All vote-weight queries that are used for governance decisions MUST use
 * `getPastVotes(account, snapshotBlock)` — never `getVotes(account)`.
 *
 * • `getVotes`      — returns the *current* (live) balance; vulnerable to
 *                     flash-loan attacks (VULN-1 in GovernorVulnerable).
 * • `getPastVotes`  — returns the balance checkpointed at a past block; immune
 *                     to intra-block manipulation (FIX-1 in GovernorWithDefenses).
 *
 * The `snapshotBlock` recorded at proposal creation is used as the
 * authoritative timepoint for all vote-weight lookups during that proposal's
 * voting period.
 *
 * ============================================================
 * PROPOSAL THRESHOLD
 * ============================================================
 *
 * `meetsThreshold` and `meetsThresholdBps` enforce FIX-4:
 *   • The check is performed at `block.number - 1` (the most recent finalised
 *     block), satisfying the ERC-5805 requirement that the timepoint is strictly
 *     in the past relative to the current block.
 *   • For BPS thresholds, the absolute minimum is derived from the total supply
 *     at `block.number - 1` using `getPastTotalSupply`.
 *
 * ============================================================
 */

/**
 * @dev Subset of ERC-5805 / OpenZeppelin ERC20Votes required by VotingPower.
 *      Governance contracts already hold a reference to ITokenVotes; cast it
 *      to this interface for library calls.
 */
interface IVotesView {
    /// @dev Current (live) delegated vote weight.  Use only for display.
    function getVotes(address account) external view returns (uint256);

    /// @dev Historical vote weight at `timepoint` (block number).
    ///      `timepoint` must be strictly less than the current block.
    function getPastVotes(address account, uint256 timepoint) external view returns (uint256);

    /// @dev Historical total supply at `timepoint`.
    function getPastTotalSupply(uint256 timepoint) external view returns (uint256);

    /// @dev Current total token supply.
    function totalSupply() external view returns (uint256);
}

library VotingPower {
    // ─────────────────────────────────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────────────────────────────────

    /// @dev BPS denominator (10 000 = 100 %).
    uint256 private constant BPS_DENOMINATOR = 10_000;

    // ─────────────────────────────────────────────────────────────────────────
    // § 1  Snapshot-safe vote weight reads
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Returns the delegated vote weight of `account` at `snapshotBlock`.
     *
     * @dev    Safe: uses `getPastVotes` — immune to flash-loan manipulation.
     *         Reverts if `snapshotBlock >= block.number` (ERC-5805 constraint).
     *
     * @param  token         ERC20Votes-compatible token.
     * @param  account       Voter address.
     * @param  snapshotBlock Block at which the snapshot was taken (proposal creation).
     * @return weight        Delegated vote weight at `snapshotBlock` (token-wei).
     */
    function snapshotWeight(IVotesView token, address account, uint256 snapshotBlock)
        internal
        view
        returns (uint256 weight)
    {
        return token.getPastVotes(account, snapshotBlock);
    }

    /**
     * @notice Returns the current (live) delegated vote weight of `account`.
     *
     * @dev    WARNING: This is the unsafe read (equivalent to VULN-1).
     *         Use only for display purposes or in components that explicitly
     *         document that flash-loan manipulation is acceptable (e.g.
     *         informational dashboards, GovernorVulnerable).
     *
     * @param  token    ERC20Votes-compatible token.
     * @param  account  Voter address.
     * @return weight   Current delegated vote weight (token-wei).
     */
    function liveWeight(IVotesView token, address account) internal view returns (uint256 weight) {
        return token.getVotes(account);
    }

    /**
     * @notice Returns the total token supply checkpointed at `timepoint`.
     *
     * @param  token      ERC20Votes-compatible token.
     * @param  timepoint  Block number (must be < current block).
     * @return supply     Total supply at `timepoint` (token-wei).
     */
    function pastTotalSupply(IVotesView token, uint256 timepoint) internal view returns (uint256 supply) {
        return token.getPastTotalSupply(timepoint);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // § 2  Proposal threshold checks (FIX-4)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Returns `true` if `account` holds at least `threshold` delegated
     *         votes at `block.number - 1`.
     *
     * @dev    Uses `getPastVotes` at the previous block — satisfies ERC-5805
     *         (timepoint strictly < current block) and prevents same-block
     *         flash-loan manipulation.
     *
     *         A governor should call this before creating a proposal (FIX-4).
     *
     * @param  token      Token to query.
     * @param  account    Proposer address.
     * @param  threshold  Minimum required vote weight (token-wei).
     * @return            `true` if the proposer meets the threshold.
     */
    function meetsThreshold(IVotesView token, address account, uint256 threshold) internal view returns (bool) {
        uint256 checkBlock = block.number > 0 ? block.number - 1 : 0;
        return token.getPastVotes(account, checkBlock) >= threshold;
    }

    /**
     * @notice Returns `true` if `account` holds at least `thresholdBps` basis
     *         points of total supply in delegated votes at `block.number - 1`.
     *
     * @dev    Derives the absolute threshold by:
     *           absoluteThreshold = totalSupply(block.number - 1) × thresholdBps / 10_000
     *         then delegates to `meetsThreshold`.
     *
     * @param  token         Token to query.
     * @param  account       Proposer address.
     * @param  thresholdBps  Required fraction in basis points (e.g. 100 = 1 %).
     * @return               `true` if the proposer meets the BPS threshold.
     */
    function meetsThresholdBps(IVotesView token, address account, uint256 thresholdBps) internal view returns (bool) {
        require(thresholdBps <= BPS_DENOMINATOR, "VotingPower: thresholdBps > 100%");
        uint256 checkBlock = block.number > 0 ? block.number - 1 : 0;
        uint256 supply = token.getPastTotalSupply(checkBlock);
        uint256 absThreshold = (supply * thresholdBps) / BPS_DENOMINATOR;
        return token.getPastVotes(account, checkBlock) >= absThreshold;
    }

    /**
     * @notice Computes the absolute proposal threshold from a BPS fraction
     *         of the *current* total supply.
     *
     * @dev    Informational helper for dashboards and off-chain tooling.
     *         On-chain enforcement should always use `meetsThreshold` or
     *         `meetsThresholdBps` (which query at `block.number - 1`).
     *
     * @param  token         Token to query.
     * @param  thresholdBps  Fraction in basis points.
     * @return absolute      Minimum delegated-vote weight required (token-wei).
     */
    function absoluteThreshold(IVotesView token, uint256 thresholdBps) internal view returns (uint256 absolute) {
        require(thresholdBps <= BPS_DENOMINATOR, "VotingPower: thresholdBps > 100%");
        return (token.totalSupply() * thresholdBps) / BPS_DENOMINATOR;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // § 3  Vote-power comparisons
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Returns the vote weight of `account` as basis points of total
     *         supply, both measured at `snapshotBlock`.
     *
     * @dev    Useful for whale-detection heuristics and off-chain reporting.
     *         Returns 0 if total supply at `snapshotBlock` is 0.
     *
     * @param  token         Token to query.
     * @param  account       Address to measure.
     * @param  snapshotBlock Historical block for the measurement.
     * @return bps           Vote weight share in basis points.
     */
    function shareAtSnapshot(IVotesView token, address account, uint256 snapshotBlock)
        internal
        view
        returns (uint256 bps)
    {
        uint256 weight = token.getPastVotes(account, snapshotBlock);
        uint256 supply = token.getPastTotalSupply(snapshotBlock);
        if (supply == 0) return 0;
        return (weight * BPS_DENOMINATOR) / supply;
    }

    /**
     * @notice Returns `true` if `account` is a **whale** — i.e. its vote
     *         share at `snapshotBlock` meets or exceeds `whaleBps`.
     *
     * @dev    Intended for off-chain monitoring scripts.  Not used as an
     *         on-chain gate because any voting-power limit must be enforced
     *         at proposal-creation or voting time, not retroactively.
     *
     * @param  token         Token to query.
     * @param  account       Address to classify.
     * @param  snapshotBlock Snapshot block for the measurement.
     * @param  whaleBps      Whale threshold in basis points (e.g. 1 000 = 10 %).
     * @return               `true` if the account is considered a whale.
     */
    function isWhale(IVotesView token, address account, uint256 snapshotBlock, uint256 whaleBps)
        internal
        view
        returns (bool)
    {
        return shareAtSnapshot(token, account, snapshotBlock) >= whaleBps;
    }

    /**
     * @notice Returns aggregate vote weight for a list of addresses at
     *         `snapshotBlock`.
     *
     * @dev    Used in tests and simulation scripts to check coordinated-whale
     *         scenarios without summing manually.
     *
     * @param  token         Token to query.
     * @param  accounts      Array of addresses.
     * @param  snapshotBlock Historical block.
     * @return total         Combined delegated vote weight (token-wei).
     */
    function aggregateWeight(IVotesView token, address[] memory accounts, uint256 snapshotBlock)
        internal
        view
        returns (uint256 total)
    {
        for (uint256 i = 0; i < accounts.length; ++i) {
            total += token.getPastVotes(accounts[i], snapshotBlock);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // § 4  Delegation influence helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Returns `true` when the total delegated weight held by
     *         `delegates` at `snapshotBlock` reaches or exceeds `targetBps`
     *         of total supply.
     *
     * @dev    Used by off-chain monitoring to assess whether a coalition of
     *         delegates has reached a governance-critical threshold (e.g.
     *         the 51 % attack threshold).
     *
     * @param  token         Token to query.
     * @param  delegates     Addresses in the coalition.
     * @param  snapshotBlock Historical block.
     * @param  targetBps     Coalition threshold in basis points.
     * @return               `true` if the coalition reaches `targetBps`.
     */
    function coalitionReachesBps(IVotesView token, address[] memory delegates, uint256 snapshotBlock, uint256 targetBps)
        internal
        view
        returns (bool)
    {
        uint256 supply = token.getPastTotalSupply(snapshotBlock);
        if (supply == 0) return false;
        uint256 total = aggregateWeight(token, delegates, snapshotBlock);
        return (total * BPS_DENOMINATOR) >= (supply * targetBps);
    }
}
