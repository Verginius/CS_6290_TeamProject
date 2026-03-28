// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {GovernanceToken} from "../../src/governance/GovernanceToken.sol";
import {GovernorVulnerable} from "../../src/governance/GovernorVulnerable.sol";

abstract contract TestHelpers is Test {
    uint8 internal constant VOTE_AGAINST = 0;
    uint8 internal constant VOTE_FOR = 1;
    uint8 internal constant VOTE_ABSTAIN = 2;

    struct ProposalPayload {
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
        string description;
    }

    function _buildNoOpProposal(string memory description) internal pure returns (ProposalPayload memory payload) {
        payload.targets = new address[](1);
        payload.targets[0] = address(0);

        payload.values = new uint256[](1);
        payload.values[0] = 0;

        payload.calldatas = new bytes[](1);
        payload.calldatas[0] = "";

        payload.description = description;
    }

    function _buildTreasuryWithdrawProposal(
        address treasury,
        address token,
        address recipient,
        uint256 amount,
        string memory description
    ) internal pure returns (ProposalPayload memory payload) {
        payload.targets = new address[](1);
        payload.targets[0] = treasury;

        payload.values = new uint256[](1);
        payload.values[0] = 0;

        payload.calldatas = new bytes[](1);
        payload.calldatas[0] =
            abi.encodeWithSignature("withdrawWithinLimit(address,uint256,address)", token, amount, recipient);

        payload.description = description;
    }

    function _propose(GovernorVulnerable governor, address proposer, ProposalPayload memory payload)
        internal
        returns (uint256 proposalId)
    {
        vm.prank(proposer);
        proposalId = governor.propose(payload.targets, payload.values, payload.calldatas, payload.description);
    }

    function _proposalDescriptionHash(ProposalPayload memory payload) internal pure returns (bytes32) {
        return keccak256(bytes(payload.description));
    }

    function _moveToVotingStart(GovernorVulnerable governor, uint256 proposalId)
        internal
        returns (uint256 voteStart, uint256 voteEnd)
    {
        (voteStart, voteEnd) = governor.proposalSnapshot(proposalId);
        vm.roll(voteStart + 1);
    }

    function _movePastVotingEnd(GovernorVulnerable governor, uint256 proposalId)
        internal
        returns (uint256 voteStart, uint256 voteEnd)
    {
        (voteStart, voteEnd) = governor.proposalSnapshot(proposalId);
        vm.roll(voteEnd + 1);
    }

    function _castVote(GovernorVulnerable governor, uint256 proposalId, address voter, uint8 support)
        internal
        returns (uint256 weight)
    {
        vm.prank(voter);
        weight = governor.castVote(proposalId, support);
    }

    function _delegateSelf(GovernanceToken token, address holder) internal {
        vm.prank(holder);
        token.delegate(holder);
    }

    function _batchDelegateSelf(GovernanceToken token, address[] memory holders) internal {
        for (uint256 i = 0; i < holders.length; i++) {
            _delegateSelf(token, holders[i]);
        }
    }

    function _transferAndDelegate(GovernanceToken token, address from, address to, uint256 amount) internal {
        vm.prank(from);
        require(token.transfer(to, amount), "transfer failed");
        _delegateSelf(token, to);
    }

    function _makeActors(string memory prefix, uint256 count) internal returns (address[] memory actors) {
        actors = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            actors[i] = makeAddr(string.concat(prefix, vm.toString(i)));
        }
    }
}
