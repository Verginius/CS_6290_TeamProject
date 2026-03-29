// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {GovernanceMath} from "../../src/libraries/GovernanceMath.sol";

contract GovernanceMathHarness {
    function applyBps(uint256 amount, uint256 bps) external pure returns (uint256) {
        return GovernanceMath.applyBps(amount, bps);
    }

    function toBps(uint256 value, uint256 total) external pure returns (uint256) {
        return GovernanceMath.toBps(value, total);
    }

    function clamp(uint256 value, uint256 lo, uint256 hi) external pure returns (uint256) {
        return GovernanceMath.clamp(value, lo, hi);
    }

    function staticQuorum(uint256 totalSupply, uint256 quorumBps) external pure returns (uint256) {
        return GovernanceMath.staticQuorum(totalSupply, quorumBps);
    }

    function dynamicQuorumBps(uint256[] memory history, uint256 baseBps, uint256 minBps, uint256 maxBps)
        external
        pure
        returns (uint256)
    {
        return GovernanceMath.dynamicQuorumBps(history, baseBps, minBps, maxBps);
    }

    function dynamicQuorum(
        uint256 totalSupply,
        uint256[] memory history,
        uint256 baseBps,
        uint256 minBps,
        uint256 maxBps
    ) external pure returns (uint256) {
        return GovernanceMath.dynamicQuorum(totalSupply, history, baseBps, minBps, maxBps);
    }

    function quorumReached(uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, uint256 quorumVotes_)
        external
        pure
        returns (bool)
    {
        return GovernanceMath.quorumReached(forVotes, againstVotes, abstainVotes, quorumVotes_);
    }

    function majorityReached(uint256 forVotes, uint256 againstVotes) external pure returns (bool) {
        return GovernanceMath.majorityReached(forVotes, againstVotes);
    }

    function supermajorityReached(uint256 forVotes, uint256 againstVotes, uint256 thresholdBps)
        external
        pure
        returns (bool)
    {
        return GovernanceMath.supermajorityReached(forVotes, againstVotes, thresholdBps);
    }

    function proposalSucceeded(uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, uint256 quorumVotes_)
        external
        pure
        returns (bool)
    {
        return GovernanceMath.proposalSucceeded(forVotes, againstVotes, abstainVotes, quorumVotes_);
    }

    function participationBps(uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, uint256 totalSupply)
        external
        pure
        returns (uint256)
    {
        return GovernanceMath.participationBps(forVotes, againstVotes, abstainVotes, totalSupply);
    }

    function herfindahlHirschman(uint256[] memory balances, uint256 supply) external pure returns (uint256) {
        return GovernanceMath.herfindahlHirschman(balances, supply);
    }

    function giniCoefficient(uint256[] memory balances) external pure returns (uint256) {
        return GovernanceMath.giniCoefficient(balances);
    }
}
