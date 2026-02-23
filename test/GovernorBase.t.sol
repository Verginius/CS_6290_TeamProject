// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BaseTest} from "./BaseTest.sol";
import {IGovernor} from "@openzeppelin/contracts/governance/IGovernor.sol";

contract GovernorBaseTest is BaseTest {
    function setUp() public override {
        super.setUp();
    }

    function testInitialization() public view {
        assertEq(governor.name(), "DAO Governor");
        assertEq(governor.votingDelay(), TEST_VOTING_DELAY);
        assertEq(governor.votingPeriod(), TEST_VOTING_PERIOD);
        assertEq(governor.proposalThreshold(), TEST_PROPOSAL_THRESHOLD);
        assertEq(governor.quorumNumerator(), TEST_QUORUM_PERCENTAGE);
    }

    function testTokenDelegation() public view {
        assertEq(token.getVotes(user1), 10_000e18);
        assertEq(token.getVotes(user2), 10_000e18);
        assertEq(token.getVotes(user3), 10_000e18);
    }

    function testCreateProposal() public {
        vm.startPrank(user1);
        
        address[] memory targets = new address[](1);
        targets[0] = address(token);
        
        uint256[] memory values = new uint256[](1);
        values[0] = 0;
        
        bytes[] memory calldatas = new bytes[](1);
        // Proposal to mint tokens
        calldatas[0] = abi.encodeWithSignature("mint(address,uint256)", user1, 100e18);
        
        string memory description = "Proposal #1: Mint tokens";
        
        uint256 proposalId = governor.propose(targets, values, calldatas, description);
        
        // Use IGovernor.ProposalState enum (Pending = 0)
        assertEq(uint256(governor.state(proposalId)), uint256(IGovernor.ProposalState.Pending));
        
        vm.stopPrank();
    }

    function testVotingFlow() public {
        vm.startPrank(user1);
        
        address[] memory targets = new address[](1);
        targets[0] = address(0); // Dummy target
        uint256[] memory values = new uint256[](1);
        values[0] = 0;
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = "";
        string memory description = "Proposal #2: Standard Vote";
        
        uint256 proposalId = governor.propose(targets, values, calldatas, description);
        
        // Wait for voting delay
        vm.roll(block.number + TEST_VOTING_DELAY + 1);
        
        assertEq(uint256(governor.state(proposalId)), uint256(IGovernor.ProposalState.Active));
        
        // Cast vote
        // Support: 0 = Against, 1 = For, 2 = Abstain
        governor.castVote(proposalId, 1);
        vm.stopPrank();
        
        vm.prank(user2);
        governor.castVote(proposalId, 1);

        // Check votes
        (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) = governor.proposalVotes(proposalId);
        assertEq(forVotes, 20_000e18);
        assertEq(againstVotes, 0);
        assertEq(abstainVotes, 0);

        // Wait for voting period to end
        vm.roll(block.number + TEST_VOTING_PERIOD + 1);
        
        assertEq(uint256(governor.state(proposalId)), uint256(IGovernor.ProposalState.Succeeded));
    }
}
