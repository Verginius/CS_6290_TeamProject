// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Governor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorSettings} from "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import {GovernorCountingSimple} from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import {GovernorVotes} from "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import {
    GovernorVotesQuorumFraction
} from "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import {GovernorTimelockControl} from "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";

/**
 * @title GovernorBase
 * @dev Secure, production-grade governance contract that serves as the
 *      correct-implementation counterpart to GovernorVulnerable in this
 *      research project.  Every vulnerability present in GovernorVulnerable
 *      is mitigated here by the OpenZeppelin module it delegates to.
 *
 * ============================================================
 * SECURITY PROPERTIES (contrast with GovernorVulnerable)
 * ============================================================
 *
 * FIX-1: Snapshot voting  — GovernorVotes uses getPastVotes(account,
 *        proposalSnapshot) so vote weight is frozen at proposal-creation
 *        time, defeating flash-loan attacks (cf. VULN-1).
 *
 * FIX-2: Single-vote guard  — GovernorCountingSimple rejects duplicate
 *        votes from the same address (cf. VULN-2).
 *
 * FIX-3: Mandatory timelock  — GovernorTimelockControl queues all
 *        successful proposals in a TimelockController, enforcing a
 *        configurable delay before execution (cf. VULN-3).
 *
 * FIX-4: Proposal threshold  — GovernorSettings exposes a configurable
 *        proposalThreshold; callers below the threshold are rejected
 *        (cf. VULN-4).
 *
 * FIX-5: Quorum fraction  — GovernorVotesQuorumFraction requires a
 *        percentage of total supply to participate before a proposal
 *        can succeed (cf. VULN-5).
 *
 * ============================================================
 * OPENZEPPELIN MODULE BREAKDOWN
 * ============================================================
 *
 * Governor                  — core proposal lifecycle and access control
 * GovernorSettings          — configurable votingDelay, votingPeriod, threshold
 * GovernorCountingSimple    — for / against / abstain tally with double-vote guard
 * GovernorVotes             — ERC20Votes integration with snapshot safety
 * GovernorVotesQuorumFraction — quorum as a percentage of total supply
 * GovernorTimelockControl   — queues execution through TimelockController
 *
 * ============================================================
 */
contract GovernorBase is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Wires up all governance modules.
    /// @param _name              Name of the governor contract.
    /// @param _token             ERC20Votes token used for vote weight.
    /// @param _timelock          Timelock controller that executes passed proposals.
    /// @param _votingDelay       Blocks/seconds before voting opens after proposal.
    /// @param _votingPeriod      Blocks/seconds the voting window stays open.
    /// @param _proposalThreshold Minimum vote weight required to create a proposal.
    /// @param _quorumPercentage  % of total supply that must vote for quorum (0–100).
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

    // ─────────────────────────────────────────────────────────────────────────
    // Overrides required by Solidity
    // ─────────────────────────────────────────────────────────────────────────

    /// @dev Returns the voting delay. Resolves Governor / GovernorSettings conflict.
    function votingDelay() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }

    /// @dev Returns the voting period. Resolves Governor / GovernorSettings conflict.
    function votingPeriod() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }

    /// @dev Returns the quorum required at `blockNumber`.
    ///      Resolves Governor / GovernorVotesQuorumFraction conflict.
    /// @param blockNumber Snapshot block to measure supply against.
    /// @return            Minimum for-vote weight needed for quorum.
    function quorum(uint256 blockNumber) public view override(Governor, GovernorVotesQuorumFraction) returns (uint256) {
        return super.quorum(blockNumber);
    }

    /// @dev Returns the current lifecycle state of `proposalId`.
    ///      Resolves Governor / GovernorTimelockControl conflict.
    function state(uint256 proposalId) public view override(Governor, GovernorTimelockControl) returns (ProposalState) {
        return super.state(proposalId);
    }

    /// @dev Returns whether `proposalId` must be queued before execution.
    ///      Resolves Governor / GovernorTimelockControl conflict.
    function proposalNeedsQueuing(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.proposalNeedsQueuing(proposalId);
    }

    /// @dev Returns the proposal threshold.
    ///      Resolves Governor / GovernorSettings conflict.
    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }

    /// @dev Schedules `proposalId`'s operations in the timelock.
    ///      Resolves Governor / GovernorTimelockControl conflict.
    /// @param proposalId     ID of the proposal being queued.
    /// @param targets        Call targets.
    /// @param values         ETH values.
    /// @param calldatas      Encoded call data.
    /// @param descriptionHash Keccak256 of the proposal description.
    /// @return               ETA timestamp set by the timelock.
    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint48) {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    /// @dev Dispatches `proposalId`'s operations through the timelock.
    ///      Resolves Governor / GovernorTimelockControl conflict.
    /// @param proposalId     ID of the proposal being executed.
    /// @param targets        Call targets.
    /// @param values         ETH values.
    /// @param calldatas      Encoded call data.
    /// @param descriptionHash Keccak256 of the proposal description.
    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    /// @dev Cancels a proposal in the timelock.
    ///      Resolves Governor / GovernorTimelockControl conflict.
    /// @param targets        Call targets.
    /// @param values         ETH values.
    /// @param calldatas      Encoded call data.
    /// @param descriptionHash Keccak256 of the proposal description.
    /// @return proposalId    ID of the cancelled proposal.
    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    /// @dev Returns the executor address (the timelock).
    ///      Resolves Governor / GovernorTimelockControl conflict.
    /// @return Address of the timelock controller.
    function _executor() internal view override(Governor, GovernorTimelockControl) returns (address) {
        return super._executor();
    }
}
