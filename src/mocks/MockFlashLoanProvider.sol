// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MockFlashLoanProvider
 * @dev Simulates an Aave-style flash loan provider for testing governance attacks.
 *
 * This mock implements the basic flash loan interface:
 * 1. Transfers tokens to the receiver
 * 2. Calls the receiver's flashLoan callback
 * 3. Must receive the borrowed amount + fee back
 * 4. Reverts if callback doesn't repay
 */
interface IFlashLoanReceiver {
    /**
     * @notice Callback function called by flash loan provider
     * @param token The token borrowed
     * @param amount The amount borrowed
     * @param fee The fee (0.09% of amount)
     * @param data Arbitrary data passed by borrower
     * @return True if the flash loan was handled successfully
     */
    function executeOperation(
        address token,
        uint256 amount,
        uint256 fee,
        bytes calldata data
    ) external returns (bool);
}

contract MockFlashLoanProvider {
    // ─────────────────────────────────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Flash loan fee in basis points (0.09% = 9 basis points)
    uint256 public constant FLASH_LOAN_FEE = 9; // 0.09%
    uint256 public constant BASIS_POINTS = 10000;

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────

    event FlashLoan(
        address indexed receiver,
        address indexed token,
        uint256 amount,
        uint256 fee,
        bytes data
    );

    // ─────────────────────────────────────────────────────────────────────────
    // Flash Loan Function
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Executes a flash loan
     * @param token The token to borrow
     * @param amount The amount to borrow
     * @param receiver The contract that will receive the tokens and execute the callback
     * @param data Arbitrary data to pass to the callback
     */
    function flashLoan(
        address token,
        uint256 amount,
        address receiver,
        bytes calldata data
    ) external returns (bool) {
        require(token != address(0), "MockFlashLoanProvider: invalid token");
        require(receiver != address(0), "MockFlashLoanProvider: invalid receiver");
        require(amount > 0, "MockFlashLoanProvider: amount must be > 0");

        // Calculate the fee
        uint256 fee = (amount * FLASH_LOAN_FEE) / BASIS_POINTS;

        // Check that the provider has enough tokens
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance >= amount, "MockFlashLoanProvider: insufficient balance");

        // Transfer tokens to receiver
        require(IERC20(token).transfer(receiver, amount), "MockFlashLoanProvider: transfer failed");

        // Call the callback
        require(
            IFlashLoanReceiver(receiver).executeOperation(token, amount, fee, data),
            "MockFlashLoanProvider: callback failed"
        );

        // Check that tokens were repaid with fee
        uint256 finalBalance = IERC20(token).balanceOf(address(this));
        require(finalBalance >= balance + fee, "MockFlashLoanProvider: repayment failed");

        emit FlashLoan(receiver, token, amount, fee, data);
        return true;
    }

    /**
     * @notice Get the fee for a flash loan of a given amount
     * @param amount The loan amount
     * @return The fee amount
     */
    function getFlashLoanFee(uint256 amount) external pure returns (uint256) {
        return (amount * FLASH_LOAN_FEE) / BASIS_POINTS;
    }
}
