// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {VotingPower, IVotesView} from "../../src/libraries/VotingPower.sol";

contract VotingPowerHarness {
    function snapshotWeight(IVotesView token, address account, uint256 snapshotBlock) external view returns (uint256) {
        return VotingPower.snapshotWeight(token, account, snapshotBlock);
    }

    function liveWeight(IVotesView token, address account) external view returns (uint256) {
        return VotingPower.liveWeight(token, account);
    }

    function pastTotalSupply(IVotesView token, uint256 timepoint) external view returns (uint256) {
        return VotingPower.pastTotalSupply(token, timepoint);
    }

    function meetsThreshold(IVotesView token, address account, uint256 threshold) external view returns (bool) {
        return VotingPower.meetsThreshold(token, account, threshold);
    }

    function meetsThresholdBps(IVotesView token, address account, uint256 thresholdBps) external view returns (bool) {
        return VotingPower.meetsThresholdBps(token, account, thresholdBps);
    }

    function absoluteThreshold(IVotesView token, uint256 thresholdBps) external view returns (uint256) {
        return VotingPower.absoluteThreshold(token, thresholdBps);
    }

    function shareAtSnapshot(IVotesView token, address account, uint256 snapshotBlock) external view returns (uint256) {
        return VotingPower.shareAtSnapshot(token, account, snapshotBlock);
    }

    function isWhale(IVotesView token, address account, uint256 snapshotBlock, uint256 whaleBps)
        external
        view
        returns (bool)
    {
        return VotingPower.isWhale(token, account, snapshotBlock, whaleBps);
    }

    function aggregateWeight(IVotesView token, address[] memory accounts, uint256 snapshotBlock)
        external
        view
        returns (uint256)
    {
        return VotingPower.aggregateWeight(token, accounts, snapshotBlock);
    }

    function coalitionReachesBps(IVotesView token, address[] memory delegates, uint256 snapshotBlock, uint256 targetBps)
        external
        view
        returns (bool)
    {
        return VotingPower.coalitionReachesBps(token, delegates, snapshotBlock, targetBps);
    }
}
