// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ProposalLib} from "../../src/libraries/ProposalLib.sol";

contract ProposalLibTarget {
    uint256 public stored;

    function store(uint256 value) external payable {
        stored = value;
    }

    function revertWithMessage() external pure {
        revert("target revert");
    }

    function revertWithoutMessage() external pure {
        revert();
    }
}

contract ProposalLibHarness {
    function hashProposal(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) external pure returns (uint256) {
        return ProposalLib.hashProposal(targets, values, calldatas, descriptionHash);
    }

    function hashDescription(string memory description) external pure returns (bytes32) {
        return ProposalLib.hashDescription(description);
    }

    function validateArrayLengths(address[] memory targets, uint256[] memory values, bytes[] memory calldatas)
        external
        pure
    {
        ProposalLib.validateArrayLengths(targets, values, calldatas);
    }

    function validateCalldata(
        address[] memory storedTargets,
        uint256[] memory storedValues,
        bytes[] memory storedCalldatas,
        address[] memory suppliedTargets,
        uint256[] memory suppliedValues,
        bytes[] memory suppliedCalldatas
    ) external pure {
        ProposalLib.validateCalldata(
            storedTargets, storedValues, storedCalldatas, suppliedTargets, suppliedValues, suppliedCalldatas
        );
    }

    function voteStartBlock(uint256 creationBlock, uint256 votingDelay) external pure returns (uint256) {
        return ProposalLib.voteStartBlock(creationBlock, votingDelay);
    }

    function voteEndBlock(uint256 voteStart, uint256 votingPeriod) external pure returns (uint256) {
        return ProposalLib.voteEndBlock(voteStart, votingPeriod);
    }

    function isVotingActive(uint256 voteStart, uint256 voteEnd) external view returns (bool) {
        return ProposalLib.isVotingActive(voteStart, voteEnd);
    }

    function isPending(uint256 voteStart) external view returns (bool) {
        return ProposalLib.isPending(voteStart);
    }

    function isVotingEnded(uint256 voteEnd) external view returns (bool) {
        return ProposalLib.isVotingEnded(voteEnd);
    }

    function computeEta(uint256 queuedAt, uint256 timelockDelay) external pure returns (uint256) {
        return ProposalLib.computeEta(queuedAt, timelockDelay);
    }

    function isExpired(uint256 eta, uint256 gracePeriod) external view returns (bool) {
        return ProposalLib.isExpired(eta, gracePeriod);
    }

    function isReady(uint256 eta) external view returns (bool) {
        return ProposalLib.isReady(eta);
    }

    function executeBatch(address[] memory targets, uint256[] memory values, bytes[] memory calldatas)
        external
        payable
    {
        ProposalLib.executeBatch(targets, values, calldatas);
    }
}
