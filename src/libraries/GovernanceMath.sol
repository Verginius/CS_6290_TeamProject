// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title  GovernanceMath
 * @author CS 6290 Team — Student 1 (Spec, Architecture & Core Governance Lead)
 * @notice Pure-math library covering every numerical calculation required by
 *         the governance system: quorum derivation, basis-point arithmetic,
 *         dynamic-quorum adjustment, supermajority testing, and on-chain
 *         approximations of token-concentration metrics (HHI, Gini).
 *
 * @dev    All functions are `internal pure` — no storage reads, no external
 *         calls.  Import this library wherever numerical governance logic is
 *         needed instead of duplicating the formulae.
 *
 * ============================================================
 * UNIT CONVENTIONS
 * ============================================================
 *
 *  token-wei   — smallest indivisible unit of the governance token
 *                (same as ERC-20 `uint256` balances / vote weights).
 *
 *  BPS         — basis points: 1 BPS = 0.01 %, denominator = 10_000.
 *                10_000 BPS = 100 %.  Used for quorum, threshold, and
 *                supermajority fractions.
 *
 *  supply      — total token supply in token-wei; obtained off-chain or via
 *                `getPastTotalSupply` / `totalSupply`.
 *
 * ============================================================
 * DYNAMIC QUORUM ALGORITHM SUMMARY
 * ============================================================
 *
 *   Inputs
 *     • recentParticipationBps[]  — ring-buffer of historical participation BPS
 *     • baseBps                   — static fallback (used when buffer is empty)
 *     • minBps / maxBps           — absolute floor / ceiling
 *
 *   Steps
 *     1. avgBps     = mean(recentParticipationBps[])
 *     2. dynamicBps = clamp(avgBps × 70 % + 500, minBps, maxBps)
 *     3. quorum     = totalSupply × dynamicBps / 10_000
 *
 *   The + 500 term (half-step between a typical 2 % floor and 10 % ceiling)
 *   ensures the quorum is never trivially satisfiable even after a sequence
 *   of zero-turnout proposals.
 *
 * ============================================================
 */
library GovernanceMath {
    // ─────────────────────────────────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Denominator for all basis-point fractions.
    uint256 internal constant BPS_DENOMINATOR = 10_000;

    /// @notice Default minimum dynamic quorum (2 % of supply).
    uint256 internal constant DEFAULT_MIN_QUORUM_BPS = 200;

    /// @notice Default maximum dynamic quorum (10 % of supply).
    uint256 internal constant DEFAULT_MAX_QUORUM_BPS = 1_000;

    /// @notice Default midpoint offset used in `dynamicQuorumBps`.
    uint256 internal constant DYNAMIC_QUORUM_OFFSET = 500;

    /// @notice Dampening factor numerator for the dynamic-quorum formula (70 %).
    uint256 internal constant DYNAMIC_DAMPENING_NUM = 7_000;

    // ─────────────────────────────────────────────────────────────────────────
    // § 1  Basis-point arithmetic
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Applies a BPS fraction to `amount`.
     *
     * @dev    result = amount × bps / 10_000.
     *         Reverts if `bps > 10_000` to prevent silent over-100 % results.
     *
     * @param  amount  Value to scale (token-wei or any uint256).
     * @param  bps     Fraction in basis points (0 – 10_000).
     * @return result  Scaled value, truncated (floor division).
     */
    function applyBps(uint256 amount, uint256 bps) internal pure returns (uint256 result) {
        require(bps <= BPS_DENOMINATOR, "GovernanceMath: bps > 100%");
        return (amount * bps) / BPS_DENOMINATOR;
    }

    /**
     * @notice Converts an absolute `value` to basis points relative to `total`.
     *
     * @dev    result = value × 10_000 / total.
     *         Returns 0 when `total` is 0 to avoid division-by-zero.
     *
     * @param  value   Numerator (e.g. votes cast, token balance).
     * @param  total   Denominator (e.g. total supply, max votes).
     * @return bps     Fraction expressed in basis points.
     */
    function toBps(uint256 value, uint256 total) internal pure returns (uint256 bps) {
        if (total == 0) return 0;
        return (value * BPS_DENOMINATOR) / total;
    }

    /**
     * @notice Clamps `value` to the inclusive range `[lo, hi]`.
     *
     * @param  value  Input value.
     * @param  lo     Inclusive lower bound.
     * @param  hi     Inclusive upper bound.  Must be ≥ `lo`.
     * @return        Clamped value.
     */
    function clamp(uint256 value, uint256 lo, uint256 hi) internal pure returns (uint256) {
        require(hi >= lo, "GovernanceMath: hi < lo");
        if (value < lo) return lo;
        if (value > hi) return hi;
        return value;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // § 2  Static quorum
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Computes a static quorum from a BPS fraction of `totalSupply`.
     *
     *         quorum = totalSupply × quorumBps / 10_000
     *
     * @param  totalSupply  Token supply in token-wei.
     * @param  quorumBps    Required participation in basis points.
     * @return quorum       Minimum aggregate votes (token-wei) for a proposal
     *                      to be eligible to succeed.
     */
    function staticQuorum(uint256 totalSupply, uint256 quorumBps) internal pure returns (uint256 quorum) {
        return applyBps(totalSupply, quorumBps);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // § 3  Dynamic quorum
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Computes the dynamic quorum BPS from a history of recent
     *         participation values.
     *
     *         Algorithm:
     *           1. avgBps      = mean(history[])
     *           2. dynamicBps  = avgBps × 70 % + 500
     *           3. dynamicBps  = clamp(dynamicBps, minBps, maxBps)
     *
     *         If `history` is empty, returns `clamp(baseBps, minBps, maxBps)`.
     *
     * @param  history  Array of recent participation BPS values (rolling window).
     * @param  baseBps  Static fallback BPS used when `history` is empty.
     * @param  minBps   Minimum allowable dynamic quorum BPS (floor).
     * @param  maxBps   Maximum allowable dynamic quorum BPS (ceiling).
     * @return bps      Clamped dynamic quorum numerator in basis points.
     */
    function dynamicQuorumBps(uint256[] memory history, uint256 baseBps, uint256 minBps, uint256 maxBps)
        internal
        pure
        returns (uint256 bps)
    {
        if (history.length == 0) {
            return clamp(baseBps, minBps, maxBps);
        }

        uint256 sum;
        for (uint256 i = 0; i < history.length; ++i) {
            sum += history[i];
        }
        uint256 avgBps = sum / history.length;

        // Apply 70 % dampening and add the midpoint offset.
        uint256 dynamic = (avgBps * DYNAMIC_DAMPENING_NUM) / BPS_DENOMINATOR + DYNAMIC_QUORUM_OFFSET;

        return clamp(dynamic, minBps, maxBps);
    }

    /**
     * @notice Computes the absolute dynamic quorum in token-wei.
     *
     *         Calls `dynamicQuorumBps` then multiplies by `totalSupply`.
     *
     * @param  totalSupply  Token supply in token-wei.
     * @param  history      Participation-BPS history array.
     * @param  baseBps      Static fallback BPS.
     * @param  minBps       BPS floor.
     * @param  maxBps       BPS ceiling.
     * @return quorum       Minimum aggregate votes (token-wei).
     */
    function dynamicQuorum(
        uint256 totalSupply,
        uint256[] memory history,
        uint256 baseBps,
        uint256 minBps,
        uint256 maxBps
    ) internal pure returns (uint256 quorum) {
        uint256 bps = dynamicQuorumBps(history, baseBps, minBps, maxBps);
        return (totalSupply * bps) / BPS_DENOMINATOR;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // § 4  Vote-outcome tests
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Returns `true` when aggregate participation meets or exceeds
     *         `quorumVotes`.
     *
     * @param  forVotes      Votes cast in favour.
     * @param  againstVotes  Votes cast against.
     * @param  abstainVotes  Abstain votes.
     * @param  quorumVotes_  Minimum participation threshold (token-wei).
     * @return               `true` if quorum is reached.
     */
    function quorumReached(uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, uint256 quorumVotes_)
        internal
        pure
        returns (bool)
    {
        return (forVotes + againstVotes + abstainVotes) >= quorumVotes_;
    }

    /**
     * @notice Returns `true` when `forVotes > againstVotes` (simple majority).
     *
     * @param  forVotes      Votes cast in favour.
     * @param  againstVotes  Votes cast against.
     * @return               `true` if the proposal has a simple majority.
     */
    function majorityReached(uint256 forVotes, uint256 againstVotes) internal pure returns (bool) {
        return forVotes > againstVotes;
    }

    /**
     * @notice Returns `true` when `forVotes` meets or exceeds a supermajority
     *         fraction of all non-abstain votes.
     *
     *         supermajority = forVotes × 10_000 ≥ (forVotes + againstVotes) × thresholdBps
     *
     *         Example: `thresholdBps = 6_000` requires 60 % of cast votes.
     *
     * @param  forVotes      Votes cast in favour.
     * @param  againstVotes  Votes cast against.
     * @param  thresholdBps  Required approval fraction in basis points (e.g. 6 000 = 60 %).
     * @return               `true` if the supermajority threshold is met.
     */
    function supermajorityReached(uint256 forVotes, uint256 againstVotes, uint256 thresholdBps)
        internal
        pure
        returns (bool)
    {
        require(thresholdBps <= BPS_DENOMINATOR, "GovernanceMath: thresholdBps > 100%");
        uint256 totalCast = forVotes + againstVotes;
        if (totalCast == 0) return false;
        // forVotes / totalCast >= thresholdBps / 10_000
        // ↔ forVotes * 10_000 >= totalCast * thresholdBps
        return (forVotes * BPS_DENOMINATOR) >= (totalCast * thresholdBps);
    }

    /**
     * @notice Returns `true` when a proposal is considered to have succeeded:
     *         quorum is reached AND a simple majority of for > against.
     *
     * @param  forVotes      Votes in favour.
     * @param  againstVotes  Votes against.
     * @param  abstainVotes  Abstain votes.
     * @param  quorumVotes_  Minimum participation threshold.
     * @return               `true` if the proposal succeeded.
     */
    function proposalSucceeded(uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, uint256 quorumVotes_)
        internal
        pure
        returns (bool)
    {
        return
            quorumReached(forVotes, againstVotes, abstainVotes, quorumVotes_) && majorityReached(forVotes, againstVotes);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // § 5  Participation recording (ring-buffer helper)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Computes the participation BPS for a single completed proposal.
     *
     *         participationBps = (forVotes + againstVotes + abstainVotes)
     *                            × 10_000 / totalSupply
     *
     *         Returns 0 when `totalSupply` is 0.
     *
     * @param  forVotes      Votes in favour.
     * @param  againstVotes  Votes against.
     * @param  abstainVotes  Abstain votes.
     * @param  totalSupply   Token total supply at the proposal snapshot.
     * @return bps           Participation as basis points of total supply.
     */
    function participationBps(uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, uint256 totalSupply)
        internal
        pure
        returns (uint256 bps)
    {
        return toBps(forVotes + againstVotes + abstainVotes, totalSupply);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // § 6  Token-concentration metrics (on-chain approximations)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Computes a simplified Herfindahl-Hirschman Index (HHI) for up
     *         to `n` holders, expressed in basis points.
     *
     * @dev    Classical HHI = Σ (share_i)² where share_i = balance_i / supply.
     *         To avoid floating point, we compute:
     *           HHI_bps = Σ (balance_i × 10_000 / supply)²  /  10_000
     *         Result is in the range [0, 10_000]:
     *           •   0   — perfectly equal distribution
     *           • 10_000 — single holder owns everything
     *
     *         Gas note: O(n) in the length of `balances`. Suitable for
     *         off-chain calls (eth_call) and simulation scripts; avoid calling
     *         on-chain in a hot path with large arrays.
     *
     * @param  balances  Array of individual token balances (token-wei).
     * @param  supply    Total token supply (token-wei).
     * @return hhi       HHI in basis points (0 – 10_000).
     */
    function herfindahlHirschman(uint256[] memory balances, uint256 supply) internal pure returns (uint256 hhi) {
        if (supply == 0 || balances.length == 0) return 0;
        uint256 sumSquares;
        for (uint256 i = 0; i < balances.length; ++i) {
            uint256 shareBps = (balances[i] * BPS_DENOMINATOR) / supply;
            sumSquares += shareBps * shareBps;
        }
        // Normalise: divide by BPS_DENOMINATOR to keep result in [0, 10_000].
        return sumSquares / BPS_DENOMINATOR;
    }

    /**
     * @notice Computes a discrete approximation of the Gini coefficient for
     *         a snapshot of token balances.
     *
     * @dev    Standard Gini formula (sorted array version):
     *           G = (2 × Σ i·balance_i) / (n × Σ balance_i)  −  (n+1)/n
     *         where balances are sorted ascending and i is 1-indexed.
     *
     *         Returns a value in BPS (0 = perfect equality, 10_000 = perfect
     *         inequality).
     *
     *         The caller is responsible for sorting `balances` ascending before
     *         passing them in — on-chain sorting of large arrays is prohibitive.
     *
     *         Gas note: O(n); intended for off-chain simulation / analytics.
     *
     * @param  balances  Token balances sorted in **ascending** order.
     * @return gini      Gini coefficient in basis points (0 – 10_000).
     */
    function giniCoefficient(uint256[] memory balances) internal pure returns (uint256 gini) {
        uint256 n = balances.length;
        if (n == 0) return 0;

        uint256 totalBalance;
        uint256 weightedSum;

        for (uint256 i = 0; i < n; ++i) {
            totalBalance += balances[i];
            weightedSum += (i + 1) * balances[i];
        }

        if (totalBalance == 0) return 0;

        // G = (2 × weightedSum) / (n × totalBalance) − (n+1) / n
        // Multiply everything by BPS_DENOMINATOR to keep integer arithmetic.
        uint256 numerator = 2 * weightedSum * BPS_DENOMINATOR;
        uint256 denominator = n * totalBalance;
        uint256 term1 = numerator / denominator;
        uint256 term2 = ((n + 1) * BPS_DENOMINATOR) / n;

        return term1 > term2 ? term1 - term2 : 0;
    }
}
