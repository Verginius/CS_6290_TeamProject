// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Threshold Quorum Defense
 * @dev Defense Layer 3: Threshold & Quorum Defenses
 *
 * This module implements the third layer of governance defense mechanisms:
 * 1. Proposal Threshold - Minimum voting power to create proposals
 * 2. Dynamic Quorum - Quorum adjusts based on recent participation
 * 3. Supermajority Requirements - Different consensus thresholds based on proposal type
 *
 * These defenses prevent attacks by:
 * - Making proposal spam expensive (threshold)
 * - Preventing low-participation gaming (dynamic quorum)
 * - Requiring higher consensus for critical actions (supermajority)
 *
 * Reference: docs/specs/Defense_Mechanisms.md - Defense Layer 3
 */

import "@openzeppelin/contracts/access/Ownable.sol";

contract ThersholdQuorumDefense is Ownable {
    // Enums
    enum ProposalType {
        STANDARD, // Simple majority (>50%)
        IMPORTANT, // 60% required (parameter changes)
        CRITICAL, // 67% (2/3) required (treasury, upgrades)
        CONSTITUTIONAL // 75% (3/4) required (governance changes)
    }

    // Structs
    struct ProposalVotes {
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
    }

    struct ProposalThresholdConfig {
        uint256 basisPoints; // 10000 = 100%
        uint256 absoluteMinimum; // Minimum tokens required even if BPS is lower
        string description;
    }

    struct DynamicQuorumConfig {
        uint256 quorumFloorBps; // 5% - minimum quorum
        uint256 quorumCeilingBps; // 20% - maximum quorum
        uint256 participationWeight; // 70% - weight for recent participation
        uint256 historyLength; // Track last 10 proposals
        uint256 minHistoryThreshold; // Minimum historical proposals to use dynamic calc
    }

    // State variables
    uint256 public totalSupply;
    ProposalThresholdConfig public thresholdConfig;
    DynamicQuorumConfig public quorumConfig;

    mapping(uint256 => ProposalVotes) public proposalVotes;
    mapping(uint256 => ProposalType) public proposalTypes;
    mapping(uint256 => bool) public proposalExists;
    uint256[] public recentParticipationRates; // Store recent participation rates in basis points

    // Events
    event ThresholdUpdated(uint256 newBasisPoints, uint256 newAbsoluteMinimum);
    event QuorumConfigUpdated(DynamicQuorumConfig newConfig);
    event ProposalCreated(uint256 proposalId, ProposalType proposalType);
    event VoteTalliesUpdated(uint256 proposalId, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes);

    // Constructor
    constructor(
        address initialOwner,
        uint256 _totalSupply,
        ProposalThresholdConfig memory _thresholdConfig,
        DynamicQuorumConfig memory _quorumConfig
    ) Ownable(initialOwner) {
        require(_thresholdConfig.basisPoints <= 10000, "Invalid threshold basis points");
        require(_validateQuorumConfig(_quorumConfig), "Invalid quorum config");

        totalSupply = _totalSupply;
        thresholdConfig = _thresholdConfig;
        quorumConfig = _quorumConfig;
    }

    // External functions
    function updateThresholdConfig(ProposalThresholdConfig memory _newConfig) external onlyOwner {
        require(_newConfig.basisPoints <= 10000, "Invalid threshold basis points");
        thresholdConfig = _newConfig;
        emit ThresholdUpdated(_newConfig.basisPoints, _newConfig.absoluteMinimum);
    }

    function updateQuorumConfig(DynamicQuorumConfig memory _newConfig) external onlyOwner {
        require(_validateQuorumConfig(_newConfig), "Invalid quorum config");
        quorumConfig = _newConfig;
        emit QuorumConfigUpdated(_newConfig);
    }

    function createProposal(uint256 proposalId, ProposalType proposalType, uint256 proposerVotes) external {
        require(!proposalExists[proposalId], "Proposal already exists");
        require(checkProposalThreshold(proposerVotes), "Insufficient voting power for proposal");

        proposalTypes[proposalId] = proposalType;
        proposalExists[proposalId] = true;
        emit ProposalCreated(proposalId, proposalType);
    }

    // In this demo module, only governance (owner) is allowed to write vote tallies.
    function castVote(uint256 proposalId, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes) external onlyOwner {
        require(proposalExists[proposalId], "Proposal does not exist");

        proposalVotes[proposalId] = ProposalVotes({forVotes: forVotes, againstVotes: againstVotes, abstainVotes: abstainVotes});
        emit VoteTalliesUpdated(proposalId, forVotes, againstVotes, abstainVotes);
    }

    // Public view functions
    function checkProposalThreshold(uint256 proposerVotes) public view returns (bool) {
        uint256 threshold = calculateThreshold();
        return proposerVotes >= threshold;
    }

    function calculateThreshold() public view returns (uint256) {
        uint256 percentageBased = (totalSupply * thresholdConfig.basisPoints) / 10000;
        return percentageBased > thresholdConfig.absoluteMinimum ? percentageBased : thresholdConfig.absoluteMinimum;
    }

    function calculateDynamicQuorum(uint256 proposalId) public view returns (uint256) {
        // Unknown proposal id uses safest default quorum floor.
        if (!proposalExists[proposalId]) {
            return quorumConfig.quorumFloorBps;
        }

        if (recentParticipationRates.length < quorumConfig.minHistoryThreshold) {
            return quorumConfig.quorumFloorBps;
        }

        uint256 avgParticipation = _calculateAverageParticipation();
        uint256 dynamicQuorum = (avgParticipation * quorumConfig.participationWeight / 10000)
            + (quorumConfig.quorumFloorBps * (10000 - quorumConfig.participationWeight) / 10000);

        if (dynamicQuorum < quorumConfig.quorumFloorBps) {
            return quorumConfig.quorumFloorBps;
        } else if (dynamicQuorum > quorumConfig.quorumCeilingBps) {
            return quorumConfig.quorumCeilingBps;
        }
        return dynamicQuorum;
    }

    function checkSupermajority(uint256 proposalId) public view returns (bool) {
        if (!proposalExists[proposalId]) return false;

        ProposalVotes memory votes = proposalVotes[proposalId];
        ProposalType pType = proposalTypes[proposalId];
        uint256 totalVotes = votes.forVotes + votes.againstVotes + votes.abstainVotes;

        if (totalVotes == 0) return false;

        uint256 forPercentage = (votes.forVotes * 10000) / totalVotes;

        if (pType == ProposalType.STANDARD) {
            return forPercentage > 5000; // >50%
        } else if (pType == ProposalType.IMPORTANT) {
            return forPercentage >= 6000; // >=60%
        } else if (pType == ProposalType.CRITICAL) {
            return forPercentage >= 6667; // >=67% (2/3)
        } else if (pType == ProposalType.CONSTITUTIONAL) {
            return forPercentage >= 7500; // >=75% (3/4)
        }
        return false;
    }

    function recordParticipation(uint256 participationBps) external onlyOwner {
        require(participationBps <= 10000, "Participation exceeds 100% BPS");

        if (recentParticipationRates.length >= quorumConfig.historyLength) {
            // Remove oldest
            for (uint256 i = 0; i < recentParticipationRates.length - 1; i++) {
                recentParticipationRates[i] = recentParticipationRates[i + 1];
            }
            recentParticipationRates.pop();
        }
        recentParticipationRates.push(participationBps);
    }

    // Internal functions
    function _validateQuorumConfig(DynamicQuorumConfig memory config) internal pure returns (bool) {
        if (config.historyLength == 0) return false;
        if (config.minHistoryThreshold > config.historyLength) return false;
        if (config.quorumFloorBps > config.quorumCeilingBps) return false;
        if (config.quorumCeilingBps > 10000) return false;
        if (config.participationWeight > 10000) return false;
        return true;
    }

    function _calculateAverageParticipation() internal view returns (uint256) {
        uint256 sum = 0;
        for (uint256 i = 0; i < recentParticipationRates.length; i++) {
            sum += recentParticipationRates[i];
        }
        return sum / recentParticipationRates.length;
    }

    // Utility functions for ProposalVotes
    function getTotalVotes(uint256 proposalId) public view returns (uint256) {
        ProposalVotes memory votes = proposalVotes[proposalId];
        return votes.forVotes + votes.againstVotes + votes.abstainVotes;
    }

    function getParticipationRate(uint256 proposalId) public view returns (uint256) {
        uint256 totalVotes = getTotalVotes(proposalId);
        if (totalSupply == 0) return 0;
        return (totalVotes * 10000) / totalSupply; // in basis points
    }
}
