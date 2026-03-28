// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {GovernorVulnerable} from "../../src/governance/GovernorVulnerable.sol";
import {TestHelpers} from "./TestHelpers.sol";

contract AttackScenarios is TestHelpers {
    mapping(bytes32 => uint256) private _spamBatchNonce;

    struct ScenarioResult {
        uint256 proposalId;
        bytes32 descriptionHash;
        uint256 voteStart;
        uint256 voteEnd;
        uint256 voteWeight;
        bool executionAttempted;
        bool executionSucceeded;
    }

    function runFlashLoanStyleScenario(
        GovernorVulnerable governor,
        address proposer,
        address voter,
        address treasury,
        address token,
        address recipient,
        uint256 amount
    ) external returns (ScenarioResult memory result) {
        ProposalPayload memory payload = _buildTreasuryWithdrawProposal(
            treasury, token, recipient, amount, "PROPOSAL: Emergency Treasury Withdrawal"
        );

        result.descriptionHash = _proposalDescriptionHash(payload);
        result.proposalId = _propose(governor, proposer, payload);
        (result.voteStart, result.voteEnd) = _moveToVotingStart(governor, result.proposalId);
        result.voteWeight = _castVote(governor, result.proposalId, voter, VOTE_FOR);
        _movePastVotingEnd(governor, result.proposalId);

        result.executionAttempted = true;
        try governor.execute(payload.targets, payload.values, payload.calldatas, result.descriptionHash) {
            result.executionSucceeded = true;
        } catch {
            result.executionSucceeded = false;
        }
    }

    function runWhaleDominanceScenario(
        GovernorVulnerable governor,
        address whale,
        address treasury,
        address token,
        uint256 amount
    ) external returns (ScenarioResult memory result) {
        ProposalPayload memory payload = _buildTreasuryWithdrawProposal(
            treasury, token, whale, amount, "PROPOSAL: Whale Treasury Allocation"
        );

        result.descriptionHash = _proposalDescriptionHash(payload);
        result.proposalId = _propose(governor, whale, payload);
        (result.voteStart, result.voteEnd) = _moveToVotingStart(governor, result.proposalId);
        result.voteWeight = _castVote(governor, result.proposalId, whale, VOTE_FOR);
        _movePastVotingEnd(governor, result.proposalId);

        result.executionAttempted = true;
        try governor.execute(payload.targets, payload.values, payload.calldatas, result.descriptionHash) {
            result.executionSucceeded = true;
        } catch {
            result.executionSucceeded = false;
        }
    }

    function runProposalSpamScenario(GovernorVulnerable governor, address spammer, uint256 spamCount)
        external
        returns (uint256[] memory proposalIds)
    {
        require(spamCount > 0, "spamCount must be > 0");
        proposalIds = new uint256[](spamCount);

        // Ensure each batch uses a unique description namespace so proposalId hashes
        // do not collide when this helper is called multiple times in one test.
        bytes32 key = keccak256(abi.encode(address(governor), spammer));
        uint256 batchNonce = _spamBatchNonce[key]++;

        for (uint256 i = 0; i < spamCount; i++) {
            ProposalPayload memory payload = _buildNoOpProposal(
                string.concat(
                    "Spam Batch #", vm.toString(batchNonce), " Proposal #", vm.toString(i), " - routine housekeeping"
                )
            );
            proposalIds[i] = _propose(governor, spammer, payload);
        }
    }

    function runQuorumTimingScenario(
        GovernorVulnerable governor,
        address proposer,
        address lowParticipationVoter,
        address treasury,
        address token,
        uint256 amount
    ) external returns (ScenarioResult memory result) {
        ProposalPayload memory payload = _buildTreasuryWithdrawProposal(
            treasury, token, proposer, amount, "PROPOSAL: Low Participation Window Treasury Transfer"
        );

        result.descriptionHash = _proposalDescriptionHash(payload);
        result.proposalId = _propose(governor, proposer, payload);
        (result.voteStart, result.voteEnd) = _moveToVotingStart(governor, result.proposalId);

        result.voteWeight = _castVote(governor, result.proposalId, lowParticipationVoter, VOTE_FOR);
        _movePastVotingEnd(governor, result.proposalId);

        result.executionAttempted = true;
        try governor.execute(payload.targets, payload.values, payload.calldatas, result.descriptionHash) {
            result.executionSucceeded = true;
        } catch {
            result.executionSucceeded = false;
        }
    }

    function runTimelockBypassScenario(
        GovernorVulnerable governor,
        address proposer,
        address voter,
        address treasury,
        address token,
        uint256 amount
    ) external returns (ScenarioResult memory result) {
        ProposalPayload memory payload = _buildTreasuryWithdrawProposal(
            treasury, token, proposer, amount, "PROPOSAL: Immediate Execution Test"
        );

        result.descriptionHash = _proposalDescriptionHash(payload);
        result.proposalId = _propose(governor, proposer, payload);
        (result.voteStart, result.voteEnd) = _moveToVotingStart(governor, result.proposalId);

        result.voteWeight = _castVote(governor, result.proposalId, voter, VOTE_FOR);
        _movePastVotingEnd(governor, result.proposalId);

        result.executionAttempted = true;
        try governor.execute(payload.targets, payload.values, payload.calldatas, result.descriptionHash) {
            result.executionSucceeded = true;
        } catch {
            result.executionSucceeded = false;
        }
    }
}
