// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ThersholdQuorumDefense} from "../src/defenses/ThersholdQuorumDefense.sol";

contract ThersholdQuorumDefenseTest is Test {
    ThersholdQuorumDefense internal defense;

    address internal owner = makeAddr("owner");
    address internal user = makeAddr("user");

    function setUp() public {
        defense = new ThersholdQuorumDefense(owner, 1_000_000e18, _thresholdConfig(500, 10_000e18), _quorumConfig());
    }

    function testConstructorStoresInitialConfig() public view {
        assertEq(defense.owner(), owner);
        assertEq(defense.totalSupply(), 1_000_000e18);

        (uint256 basisPoints, uint256 absoluteMinimum, string memory description) = defense.thresholdConfig();
        assertEq(basisPoints, 500);
        assertEq(absoluteMinimum, 10_000e18);
        assertEq(description, "default threshold");

        (
            uint256 floorBps,
            uint256 ceilingBps,
            uint256 participationWeight,
            uint256 historyLength,
            uint256 minHistoryThreshold
        ) = defense.quorumConfig();
        assertEq(floorBps, 500);
        assertEq(ceilingBps, 2_000);
        assertEq(participationWeight, 7_000);
        assertEq(historyLength, 3);
        assertEq(minHistoryThreshold, 2);
    }

    function testConstructorRejectsInvalidConfigs() public {
        vm.expectRevert("Invalid threshold basis points");
        new ThersholdQuorumDefense(owner, 1_000_000e18, _thresholdConfig(10_001, 1), _quorumConfig());

        ThersholdQuorumDefense.DynamicQuorumConfig memory badConfig = _quorumConfig();
        badConfig.historyLength = 0;
        vm.expectRevert("Invalid quorum config");
        new ThersholdQuorumDefense(owner, 1_000_000e18, _thresholdConfig(100, 1), badConfig);
    }

    function testUpdateThresholdConfigRequiresOwner() public {
        ThersholdQuorumDefense.ProposalThresholdConfig memory newConfig = _thresholdConfig(700, 20_000e18);

        vm.prank(user);
        vm.expectRevert();
        defense.updateThresholdConfig(newConfig);

        vm.prank(owner);
        defense.updateThresholdConfig(newConfig);

        (uint256 basisPoints, uint256 absoluteMinimum, string memory description) = defense.thresholdConfig();
        assertEq(basisPoints, 700);
        assertEq(absoluteMinimum, 20_000e18);
        assertEq(description, "default threshold");
    }

    function testUpdateQuorumConfigRequiresOwnerAndValidation() public {
        ThersholdQuorumDefense.DynamicQuorumConfig memory newConfig = _quorumConfig();
        newConfig.quorumCeilingBps = 3_000;

        vm.prank(user);
        vm.expectRevert();
        defense.updateQuorumConfig(newConfig);

        newConfig.participationWeight = 11_000;
        vm.prank(owner);
        vm.expectRevert("Invalid quorum config");
        defense.updateQuorumConfig(newConfig);

        newConfig = _quorumConfig();
        newConfig.quorumCeilingBps = 3_000;
        vm.prank(owner);
        defense.updateQuorumConfig(newConfig);

        (, uint256 ceilingBps,,,) = defense.quorumConfig();
        assertEq(ceilingBps, 3_000);
    }

    function testCalculateThresholdUsesGreaterOfBpsAndAbsoluteMinimum() public {
        assertEq(defense.calculateThreshold(), 50_000e18);
        assertTrue(defense.checkProposalThreshold(50_000e18));
        assertFalse(defense.checkProposalThreshold(49_999e18));
    }

    function testCreateProposalRequiresThresholdAndUniqueId() public {
        vm.expectRevert("Insufficient voting power for proposal");
        defense.createProposal(1, ThersholdQuorumDefense.ProposalType.STANDARD, 1e18);

        defense.createProposal(1, ThersholdQuorumDefense.ProposalType.IMPORTANT, 60_000e18);
        assertTrue(defense.proposalExists(1));

        vm.expectRevert("Proposal already exists");
        defense.createProposal(1, ThersholdQuorumDefense.ProposalType.STANDARD, 60_000e18);
    }

    function testCastVoteRequiresOwnerAndExistingProposal() public {
        defense.createProposal(1, ThersholdQuorumDefense.ProposalType.STANDARD, 60_000e18);

        vm.prank(user);
        vm.expectRevert();
        defense.castVote(1, 10, 0, 0);

        vm.prank(owner);
        defense.castVote(1, 600, 300, 100);

        assertEq(defense.getTotalVotes(1), 1_000);
    }

    function testCastVoteRejectsMissingProposal() public {
        vm.prank(owner);
        vm.expectRevert("Proposal does not exist");
        defense.castVote(999, 1, 0, 0);
    }

    function testDynamicQuorumUsesFloorAverageAndCeiling() public {
        defense.createProposal(1, ThersholdQuorumDefense.ProposalType.STANDARD, 60_000e18);
        assertEq(defense.calculateDynamicQuorum(1), 500);
        assertEq(defense.calculateDynamicQuorum(999), 500);

        vm.startPrank(owner);
        defense.recordParticipation(1_000);
        assertEq(defense.calculateDynamicQuorum(1), 500);

        defense.recordParticipation(2_000);
        assertEq(defense.calculateDynamicQuorum(1), 1_200);

        defense.recordParticipation(10_000);
        defense.recordParticipation(10_000);
        vm.stopPrank();

        assertEq(defense.recentParticipationRates(0), 2_000);
        assertEq(defense.recentParticipationRates(1), 10_000);
        assertEq(defense.recentParticipationRates(2), 10_000);
        assertEq(defense.calculateDynamicQuorum(1), 2_000);
    }

    function testRecordParticipationValidatesInput() public {
        vm.prank(owner);
        vm.expectRevert("Participation exceeds 100% BPS");
        defense.recordParticipation(10_001);
    }

    function testCheckSupermajorityAcrossProposalTypes() public {
        _createAndVote(1, ThersholdQuorumDefense.ProposalType.STANDARD, 51, 49, 0);
        assertTrue(defense.checkSupermajority(1));

        _createAndVote(2, ThersholdQuorumDefense.ProposalType.IMPORTANT, 59, 41, 0);
        assertFalse(defense.checkSupermajority(2));

        _createAndVote(3, ThersholdQuorumDefense.ProposalType.CRITICAL, 667, 333, 0);
        assertTrue(defense.checkSupermajority(3));

        _createAndVote(4, ThersholdQuorumDefense.ProposalType.CONSTITUTIONAL, 749, 251, 0);
        assertFalse(defense.checkSupermajority(4));
    }

    function testCheckSupermajorityHandlesMissingProposalAndZeroVotes() public {
        assertFalse(defense.checkSupermajority(123));

        defense.createProposal(5, ThersholdQuorumDefense.ProposalType.STANDARD, 60_000e18);
        assertFalse(defense.checkSupermajority(5));
    }

    function testParticipationRateUsesTotalSupply() public {
        defense.createProposal(1, ThersholdQuorumDefense.ProposalType.STANDARD, 60_000e18);

        vm.prank(owner);
        defense.castVote(1, 25_000e18, 15_000e18, 10_000e18);

        assertEq(defense.getTotalVotes(1), 50_000e18);
        assertEq(defense.getParticipationRate(1), 500);
    }

    function _createAndVote(
        uint256 proposalId,
        ThersholdQuorumDefense.ProposalType proposalType,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 abstainVotes
    ) internal {
        defense.createProposal(proposalId, proposalType, 60_000e18);
        vm.prank(owner);
        defense.castVote(proposalId, forVotes, againstVotes, abstainVotes);
    }

    function _thresholdConfig(uint256 basisPoints, uint256 absoluteMinimum)
        internal
        pure
        returns (ThersholdQuorumDefense.ProposalThresholdConfig memory)
    {
        return ThersholdQuorumDefense.ProposalThresholdConfig({
            basisPoints: basisPoints, absoluteMinimum: absoluteMinimum, description: "default threshold"
        });
    }

    function _quorumConfig() internal pure returns (ThersholdQuorumDefense.DynamicQuorumConfig memory) {
        return ThersholdQuorumDefense.DynamicQuorumConfig({
            quorumFloorBps: 500,
            quorumCeilingBps: 2_000,
            participationWeight: 7_000,
            historyLength: 3,
            minHistoryThreshold: 2
        });
    }
}
