// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MockTreasury
 * @dev Simulates a DAO treasury for testing governance attacks
 *
 * Features:
 * - Hold multiple ERC20 tokens
 * - Support ETH deposits and withdrawals
 * - Multi-sig style access control with thresholds
 * - Transaction tracking and history
 * - Spending limits for token transfers
 *
 * Use Cases:
 * - Test treasury draining attacks
 * - Simulate emergency fund access
 * - Verify defense mechanisms protect treasury
 * - Track unauthorized withdrawal attempts
 */
contract MockTreasury is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─────────────────────────────────────────────────────────────────────────
    // Types
    // ─────────────────────────────────────────────────────────────────────────

    enum TransactionStatus {
        Pending,
        Approved,
        Executed,
        Failed,
        Cancelled
    }

    struct Transaction {
        address target;
        address token;
        uint256 amount;
        address recipient;
        uint256 createdAt;
        uint256 executedAt;
        TransactionStatus status;
        string description;
        address initiator;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────────────────────────────────

    uint256 private constant MAX_SIGNERS = 9;
    uint256 private constant DEFAULT_THRESHOLD = 1;

    // ─────────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Authorized signers for treasury operations
    address[] public signers;
    mapping(address => bool) public isSigner;

    /// @notice Multi-sig threshold (how many signatures required)
    uint256 public requiredSignatures;

    /// @notice Tokens held by treasury
    address[] public tokens;
    mapping(address => bool) public tokenExists;
    mapping(address => uint256) public tokenBalance;

    /// @notice Transaction history
    Transaction[] public transactions;

    /// @notice Maximum amount that can be transferred per transaction without multi-sig approval
    uint256 public spendingLimit;

    /// @notice Whether to enforce multi-sig or allow single-signer operations
    bool public multiSigEnabled;

    /// @notice Tracking of failed withdrawal attempts (for security analysis)
    mapping(address => uint256) public failedWithdrawalAttempts;
    mapping(address => uint256) public totalWithdrawalAttemptsValue;

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────

    event ETHReceived(address indexed from, uint256 amount);
    event TokenDeposited(address indexed token, uint256 amount);
    event TokenWithdrawn(address indexed token, address indexed to, uint256 amount);
    event TransactionCreated(uint256 indexed txId, address indexed initiator, address indexed token, uint256 amount);
    event TransactionExecuted(uint256 indexed txId, address indexed executor);
    event TransactionFailed(uint256 indexed txId, string reason);
    event WithdrawalAttempted(address indexed attacker, address indexed token, uint256 amount);
    event UnauthorizedWithdrawalBlocked(address indexed attacker, uint256 amount);
    event SignerAdded(address indexed signer);
    event SignerRemoved(address indexed signer);
    event ThresholdUpdated(uint256 newThreshold);
    event SpendingLimitUpdated(uint256 newLimit);

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Deploy treasury with initial signers
     * @param _initialSigners Initial signers for multi-sig operations
     * @param _threshold Number of signatures required (default 1)
     * @param _spendingLimit Max single-sig withdrawal amount
     */
    constructor(address[] memory _initialSigners, uint256 _threshold, uint256 _spendingLimit) Ownable(msg.sender) {
        require(_initialSigners.length > 0, "At least one signer required");
        require(_initialSigners.length <= MAX_SIGNERS, "Too many signers");
        require(_threshold > 0 && _threshold <= _initialSigners.length, "Invalid threshold");

        for (uint256 i = 0; i < _initialSigners.length; i++) {
            require(_initialSigners[i] != address(0), "Invalid signer");
            require(!isSigner[_initialSigners[i]], "Duplicate signer");

            signers.push(_initialSigners[i]);
            isSigner[_initialSigners[i]] = true;
        }

        requiredSignatures = _threshold;
        spendingLimit = _spendingLimit;
        multiSigEnabled = true;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Deposit Functions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Receive ETH deposits
     */
    receive() external payable {
        emit ETHReceived(msg.sender, msg.value);
    }

    /**
     * @notice Deposit ERC20 tokens into treasury
     * @param token Token address to deposit
     * @param amount Amount to deposit
     */
    function depositToken(address token, uint256 amount) external nonReentrant {
        require(token != address(0), "Invalid token");
        require(amount > 0, "Amount must be > 0");

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        if (!tokenExists[token]) {
            tokens.push(token);
            tokenExists[token] = true;
        }

        tokenBalance[token] += amount;

        emit TokenDeposited(token, amount);
    }

    /**
     * @notice Deposit multiple tokens at once
     * @param tokenList Array of token addresses
     * @param amounts Array of amounts to deposit
     */
    function depositMultiple(address[] calldata tokenList, uint256[] calldata amounts) external nonReentrant {
        require(tokenList.length == amounts.length, "Array length mismatch");
        require(tokenList.length > 0, "Empty arrays");

        for (uint256 i = 0; i < tokenList.length; i++) {
            require(tokenList[i] != address(0), "Invalid token");
            require(amounts[i] > 0, "Amount must be > 0");

            IERC20(tokenList[i]).safeTransferFrom(msg.sender, address(this), amounts[i]);

            if (!tokenExists[tokenList[i]]) {
                tokens.push(tokenList[i]);
                tokenExists[tokenList[i]] = true;
            }

            tokenBalance[tokenList[i]] += amounts[i];

            emit TokenDeposited(tokenList[i], amounts[i]);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Withdrawal Functions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Withdraw tokens within spending limit (single-signer)
     * @param token Token to withdraw
     * @param amount Amount to withdraw
     * @param to Recipient address
     */
    function withdrawWithinLimit(address token, uint256 amount, address to)
        external
        nonReentrant
        onlySigner
        returns (bool)
    {
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be > 0");
        require(multiSigEnabled, "Multi-sig mode only");

        // Check spending limit
        if (amount > spendingLimit) {
            emit UnauthorizedWithdrawalBlocked(msg.sender, amount);
            failedWithdrawalAttempts[msg.sender]++;
            totalWithdrawalAttemptsValue[msg.sender] += amount;
            revert("Amount exceeds spending limit");
        }

        // Verify treasury has sufficient balance
        require(tokenBalance[token] >= amount, "Insufficient treasury balance");

        tokenBalance[token] -= amount;
        IERC20(token).safeTransfer(to, amount);

        emit TokenWithdrawn(token, to, amount);
        return true;
    }

    /**
     * @notice Propose a withdrawal transaction (for multi-sig)
     * @param token Token to withdraw
     * @param amount Amount to withdraw
     * @param to Recipient address
     * @param description Transaction description
     * @return txId Transaction ID
     */
    function proposeWithdrawal(address token, uint256 amount, address to, string calldata description)
        external
        onlySigner
        returns (uint256)
    {
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be > 0");
        require(tokenBalance[token] >= amount, "Insufficient balance");

        Transaction memory txn = Transaction({
            target: address(this),
            token: token,
            amount: amount,
            recipient: to,
            createdAt: block.timestamp,
            executedAt: 0,
            status: TransactionStatus.Pending,
            description: description,
            initiator: msg.sender
        });

        transactions.push(txn);

        emit TransactionCreated(transactions.length - 1, msg.sender, token, amount);

        return transactions.length - 1;
    }

    /**
     * @notice Execute a proposed withdrawal (multi-sig approval required)
     * @param txId Transaction ID to execute
     */
    function executeWithdrawal(uint256 txId) external nonReentrant onlySigner returns (bool) {
        require(txId < transactions.length, "Invalid transaction ID");

        Transaction storage txn = transactions[txId];

        require(txn.status == TransactionStatus.Pending, "Transaction not pending");
        require(tokenBalance[txn.token] >= txn.amount, "Insufficient balance");

        // Execute the withdrawal
        txn.status = TransactionStatus.Executed;
        txn.executedAt = block.timestamp;

        tokenBalance[txn.token] -= txn.amount;
        IERC20(txn.token).safeTransfer(txn.recipient, txn.amount);

        emit TransactionExecuted(txId, msg.sender);
        emit TokenWithdrawn(txn.token, txn.recipient, txn.amount);

        return true;
    }

    /**
     * @notice Attempt to withdraw funds (simulates attack)
     * Tracks where attackers attempt to withdraw from
     */
    function attemptWithdrawal(address token, uint256 amount, address) external returns (bool) {
        emit WithdrawalAttempted(msg.sender, token, amount);

        failedWithdrawalAttempts[msg.sender]++;
        totalWithdrawalAttemptsValue[msg.sender] += amount;

        // Actual withdrawal logic would be enforced
        if (tokenBalance[token] < amount) {
            emit UnauthorizedWithdrawalBlocked(msg.sender, amount);
            return false;
        }

        return true;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Emergency Functions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Emergency pause function (simulates guardian pause)
     * Prevents all operations on treasury
     */
    function emergencyPause() external onlyOwner {
        multiSigEnabled = false;
    }

    /**
     * @notice Resume treasury operations
     */
    function resumeOperations() external onlyOwner {
        multiSigEnabled = true;
    }

    /**
     * @notice Emergency token recovery (only owner)
     * Used to recover tokens in exceptional cases
     */
    function emergencyRecoverToken(address token, uint256 amount, address to) external onlyOwner nonReentrant {
        require(token != address(0), "Invalid token");
        require(amount > 0, "Amount must be > 0");
        require(to != address(0), "Invalid recipient");

        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance >= amount, "Insufficient balance");

        IERC20(token).safeTransfer(to, amount);
        tokenBalance[token] -= amount;

        emit TokenWithdrawn(token, to, amount);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Multi-sig Management
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Add a new signer (owner only)
     */
    function addSigner(address newSigner) external onlyOwner {
        require(newSigner != address(0), "Invalid signer");
        require(!isSigner[newSigner], "Already a signer");
        require(signers.length < MAX_SIGNERS, "Max signers reached");

        signers.push(newSigner);
        isSigner[newSigner] = true;

        emit SignerAdded(newSigner);
    }

    /**
     * @notice Remove a signer (owner only)
     */
    function removeSigner(address signer) external onlyOwner {
        require(isSigner[signer], "Not a signer");
        require(signers.length > 1, "At least one signer required");

        isSigner[signer] = false;

        // Remove from signers array
        for (uint256 i = 0; i < signers.length; i++) {
            if (signers[i] == signer) {
                signers[i] = signers[signers.length - 1];
                signers.pop();
                break;
            }
        }

        // Adjust threshold if needed
        if (requiredSignatures > signers.length) {
            requiredSignatures = signers.length;
        }

        emit SignerRemoved(signer);
    }

    /**
     * @notice Update multi-sig threshold (owner only)
     */
    function setThreshold(uint256 newThreshold) external onlyOwner {
        require(newThreshold > 0 && newThreshold <= signers.length, "Invalid threshold");
        requiredSignatures = newThreshold;
        emit ThresholdUpdated(newThreshold);
    }

    /**
     * @notice Update spending limit (owner only)
     */
    function setSpendingLimit(uint256 newLimit) external onlyOwner {
        spendingLimit = newLimit;
        emit SpendingLimitUpdated(newLimit);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // View Functions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Get treasury balance for a token
     */
    function getBalance(address token) external view returns (uint256) {
        return tokenBalance[token];
    }

    /**
     * @notice Get ETH balance
     */
    function getEthBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Get all tokens held by treasury
     */
    function getTokens() external view returns (address[] memory) {
        return tokens;
    }

    /**
     * @notice Get number of tokens
     */
    function getTokenCount() external view returns (uint256) {
        return tokens.length;
    }

    /**
     * @notice Get all signers
     */
    function getSigners() external view returns (address[] memory) {
        return signers;
    }

    /**
     * @notice Get number of signers
     */
    function getSignerCount() external view returns (uint256) {
        return signers.length;
    }

    /**
     * @notice Get transaction details
     */
    function getTransaction(uint256 txId)
        external
        view
        returns (address token, uint256 amount, address recipient, TransactionStatus status, string memory description)
    {
        require(txId < transactions.length, "Invalid transaction ID");
        Transaction storage txn = transactions[txId];
        return (txn.token, txn.amount, txn.recipient, txn.status, txn.description);
    }

    /**
     * @notice Get transaction count
     */
    function getTransactionCount() external view returns (uint256) {
        return transactions.length;
    }

    /**
     * @notice Get attack summary for address
     */
    function getAttackSummary(address attacker)
        external
        view
        returns (uint256 failedAttempts, uint256 totalAttemptedValue)
    {
        return (failedWithdrawalAttempts[attacker], totalWithdrawalAttemptsValue[attacker]);
    }

    /**
     * @notice Get total treasury value (in terms of number of different tokens)
     */
    function getTreasuryComposition() external view returns (address[] memory tokenList, uint256[] memory balances) {
        tokenList = new address[](tokens.length);
        balances = new uint256[](tokens.length);

        for (uint256 i = 0; i < tokens.length; i++) {
            tokenList[i] = tokens[i];
            balances[i] = tokenBalance[tokens[i]];
        }

        return (tokenList, balances);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Modifiers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Restrict function to authorized signers
     */
    modifier onlySigner() {
        _onlySigner();
        _;
    }

    function _onlySigner() internal view {
        require(isSigner[msg.sender], "Not authorized");
    }
}
