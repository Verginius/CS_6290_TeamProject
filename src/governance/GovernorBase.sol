// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Governor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorSettings} from "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import {GovernorCountingSimple} from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import {GovernorVotes} from "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import {GovernorVotesQuorumFraction} from "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import {GovernorTimelockControl} from "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";

/**
 * @title GovernorBase
 * @dev Base governance implementation using OpenZeppelin's modular system.
 * This contract integrates settings, voting counting, token voting, quorum, and timelock control.
 */
contract GovernorBase is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    /**
     * @dev Sets up the governor with core parameters.
     * @param _name The name of the governor contract.
     * @param _token The voting token (ERC20Votes).
     * @param _timelock The timelock controller.
     * @param _votingDelay The delay (in blocks or seconds) before voting starts.
     * @param _votingPeriod The duration (in blocks or seconds) of the voting period.
     * @param _proposalThreshold The minimum number of votes required to create a proposal.
     * @param _quorumPercentage The percentage of total supply required for a quorum (0-100).
     */
    constructor(
        string memory _name,
        IVotes _token,
        TimelockController _timelock,
        uint48 _votingDelay,
        uint32 _votingPeriod,
        uint256 _proposalThreshold,
        uint256 _quorumPercentage
    )
        Governor(_name)
        GovernorSettings(_votingDelay, _votingPeriod, _proposalThreshold)
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(_quorumPercentage)
        GovernorTimelockControl(_timelock)
    {}

    /**
     * @dev The following functions are overrides required by Solidity.
     */

    /**
     * @dev Returns the voting delay.
     * Required override by Governor and GovernorSettings.
     */
    function votingDelay()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }

    /**
     * @dev Returns the voting period.
     * Required override by Governor and GovernorSettings.
     */
    function votingPeriod()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    /**
     * @dev Returns the quorum required for a proposal to pass at a specific timepoint.
     * Required override by Governor and GovernorVotesQuorumFraction.
     */
    function quorum(uint256 blockNumber)
        public
        view
        override(Governor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    /**
     * @dev Returns the current state of a proposal.
     * Required override by Governor and GovernorTimelockControl.
     */
    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    /**
     * @dev Returns whether a proposal needs to be queued.
     * Required override by Governor and GovernorTimelockControl.
     */
    function proposalNeedsQueuing(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.proposalNeedsQueuing(proposalId);
    }

    /**
     * @dev Returns the proposal threshold.
     * Required override by Governor and GovernorSettings.
     */
    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    /**
     * @dev Internal function to queue operations in the timelock.
     * Required override by GovernorTimelockControl.
     * @param proposalId The ID of the proposal.
     * @param targets The addresses of the contracts to call.
     * @param values The amounts of ETH to send.
     * @param calldatas The calldata for the calls.
     * @param descriptionHash The hash of the proposal description.
     * @return The queue operation output.
     */
    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint48) {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    /**
     * @dev Internal function to execute operations via the timelock.
     * Required override by Governor and GovernorTimelockControl.
     * @param proposalId The ID of the proposal.
     * @param targets The addresses of the contracts to call.
     * @param values The amounts of ETH to send.
     * @param calldatas The calldata for the calls.
     * @param descriptionHash The hash of the proposal description.
     */
    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    /**
     * @dev Internal function to cancel a proposal.
     * Required override by Governor and GovernorTimelockControl.
     * @param targets The addresses of the contracts to call.
     * @param values The amounts of ETH to send.
     * @param calldatas The calldata for the calls.
     * @param descriptionHash The hash of the proposal description.
     * @return proposalId The ID of the cancelled proposal.
     */
    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    /**
     * @dev Internal function to support executing operations via the executor.
     * Required override by Governor and GovernorTimelockControl.
     * @return The executor address.
     */
    function _executor()
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }
}
