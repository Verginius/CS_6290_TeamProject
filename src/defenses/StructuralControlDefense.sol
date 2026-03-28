// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Structural Control Defense System
 * @dev Layer 4 Defense: Multi-sig Treasury, Guardian Role, Emergency Pause
 * Reference: docs/specs/Defense_Mechanisms.md - Defense Layer 4
 */

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract StructuralControlDefense is Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;

    // Enums
    enum TransactionStatus {
        PENDING,
        CONFIRMED,
        EXECUTED,
        CANCELED,
        VETOED,
        EXPIRED
    }

    enum GuardianAction {
        CANCEL_PROPOSAL,
        VETO_EXECUTION,
        PAUSE_GOVERNANCE,
        UNPAUSE_GOVERNANCE
    }

    enum ProgressiveDecentralizationPhase {
        PHASE_1, // High Security
        PHASE_2, // Moderate Security
        PHASE_3, // High Decentralization
        PHASE_4 // Full Decentralization
    }

    // Structs
    struct Transaction {
        string txId;
        address target;
        uint256 amount;
        string signature;
        bytes data;
        uint256 eta;
        uint256 createdAt;
        TransactionStatus status;
        EnumerableSet.AddressSet confirmations;
        string executionTxHash;
    }

    struct GuardianConfig {
        address[] addresses;
        uint256 requiredSignatures;
        bool canCancel;
        bool canVeto;
        bool canPause;
        uint256 timeboundExpiration;
    }

    struct PauseRecord {
        string reason;
        address[] confirmers;
        uint256 timestamp;
    }

    // State variables (mapping is private: Transaction contains EnumerableSet, which cannot be in public getter)
    mapping(string => Transaction) private transactions;
    string[] public transactionHistory;
    EnumerableSet.AddressSet private signers;
    uint256 public requiredSigs;
    address public governanceAddress;
    uint256 public gracePeriod = 14 days;
    uint256 public minDelay = 2 days;

    GuardianConfig public guardianConfig;
    EnumerableSet.AddressSet private guardians;
    mapping(uint256 => mapping(string => string)) private actionsLog; // timestamp => type => description
    uint256 public actionsLogCount;

    bool public isPaused;
    uint256 public pauseTimestamp;
    string public pauseReason;
    EnumerableSet.AddressSet private pauseAdmins;
    uint256 public requiredPauseConfirmations;
    EnumerableSet.AddressSet private pauseConfirmations;
    mapping(uint256 => PauseRecord) private pauseHistory;
    uint256 public pauseHistoryCount;

    ProgressiveDecentralizationPhase public currentPhase;

    // Events
    event TransactionProposed(string txId, address target, uint256 amount);
    event TransactionConfirmed(string txId, address signer);
    event TransactionExecuted(string txId, string hash);
    event TransactionCanceled(string txId, string reason);
    event TransactionVetoed(string txId, string reason);
    event GuardianActionPerformed(GuardianAction action, string description);
    event GovernancePaused(string reason);
    event GovernanceUnpaused(uint256 duration);
    event PhaseAdvanced(ProgressiveDecentralizationPhase newPhase);

    // Modifiers
    modifier onlySigner() {
        _onlySigner();
        _;
    }

    modifier onlyGuardian() {
        _onlyGuardian();
        _;
    }

    modifier onlyPauseAdmin() {
        _onlyPauseAdmin();
        _;
    }

    modifier whenNotPaused() {
        _whenNotPaused();
        _;
    }

    function _onlySigner() internal view {
        require(signers.contains(msg.sender), "Not a signer");
    }

    function _onlyGuardian() internal view {
        require(guardians.contains(msg.sender), "Not a guardian");
    }

    function _onlyPauseAdmin() internal view {
        require(pauseAdmins.contains(msg.sender), "Not a pause admin");
    }

    function _whenNotPaused() internal view {
        require(!isPaused, "Governance is paused");
    }

    // Constructor
    constructor(
        address[] memory _signers,
        uint256 _requiredSigs,
        address _governanceAddress,
        GuardianConfig memory _guardianConfig
    ) Ownable(msg.sender) {
        require(_signers.length >= _requiredSigs, "Invalid signer count");
        require(_requiredSigs > 0, "Required sigs must be > 0");

        for (uint256 i = 0; i < _signers.length; i++) {
            signers.add(_signers[i]);
        }
        requiredSigs = _requiredSigs;
        governanceAddress = _governanceAddress;
        guardianConfig = _guardianConfig;

        for (uint256 i = 0; i < _guardianConfig.addresses.length; i++) {
            guardians.add(_guardianConfig.addresses[i]);
        }

        // Initialize pause admins as signers
        for (uint256 i = 0; i < _signers.length; i++) {
            pauseAdmins.add(_signers[i]);
        }
        requiredPauseConfirmations = _requiredSigs / 2 + 1;

        currentPhase = ProgressiveDecentralizationPhase.PHASE_1;
    }

    // Multi-sig Treasury Functions
    function proposeTransaction(address target, uint256 amount, string memory signature, bytes memory data, uint256 eta)
        external
        whenNotPaused
        returns (string memory)
    {
        uint256 currentTime = block.timestamp;
        if (eta == 0) {
            eta = currentTime + minDelay;
        }

        string memory txId = generateTxId(target, amount, signature, eta, currentTime);

        require(bytes(transactions[txId].txId).length == 0, "Transaction already exists");

        Transaction storage txn = transactions[txId];
        txn.txId = txId;
        txn.target = target;
        txn.amount = amount;
        txn.signature = signature;
        txn.data = data;
        txn.eta = eta;
        txn.createdAt = currentTime;
        txn.status = TransactionStatus.PENDING;

        transactionHistory.push(txId);

        emit TransactionProposed(txId, target, amount);
        return txId;
    }

    function confirmTransaction(string memory txId) external onlySigner {
        Transaction storage txn = transactions[txId];
        require(bytes(txn.txId).length > 0, "Transaction not found");
        require(txn.status == TransactionStatus.PENDING || txn.status == TransactionStatus.CONFIRMED, "Invalid status");
        require(!txn.confirmations.contains(msg.sender), "Already confirmed");

        txn.confirmations.add(msg.sender);

        if (txn.confirmations.length() >= requiredSigs) {
            txn.status = TransactionStatus.CONFIRMED;
        }

        emit TransactionConfirmed(txId, msg.sender);
    }

    function executeTransaction(string memory txId) external {
        Transaction storage txn = transactions[txId];
        require(bytes(txn.txId).length > 0, "Transaction not found");
        require(canExecute(txId), "Cannot execute");

        txn.status = TransactionStatus.EXECUTED;
        txn.executionTxHash = generateExecutionHash(txId);

        // Simulate transfer (in real implementation, call actual transfer)
        // payable(txn.target).transfer(txn.amount);

        emit TransactionExecuted(txId, txn.executionTxHash);
    }

    function cancelTransaction(string memory txId, string memory reason) external onlySigner {
        Transaction storage txn = transactions[txId];
        require(bytes(txn.txId).length > 0, "Transaction not found");
        require(txn.status != TransactionStatus.EXECUTED, "Already executed");

        txn.status = TransactionStatus.CANCELED;
        emit TransactionCanceled(txId, reason);
    }

    function vetoTransaction(string memory txId, string memory reason) external onlyGuardian {
        require(guardianConfig.canVeto, "Cannot veto");
        require(isGuardianActive(), "Guardian expired");

        Transaction storage txn = transactions[txId];
        require(bytes(txn.txId).length > 0, "Transaction not found");
        require(txn.status != TransactionStatus.EXECUTED, "Already executed");

        txn.status = TransactionStatus.VETOED;
        emit TransactionVetoed(txId, reason);
    }

    // Guardian Functions
    function cancelProposal(string memory proposalId, string memory reason) external onlyGuardian {
        require(guardianConfig.canCancel, "Cannot cancel");
        require(isGuardianActive(), "Guardian expired");

        _logAction("ProposalCanceled", string(abi.encodePacked("Proposal ", proposalId, ": ", reason)));
        emit GuardianActionPerformed(GuardianAction.CANCEL_PROPOSAL, reason);
    }

    function vetoExecution(string memory proposalId, string memory reason) external onlyGuardian {
        require(guardianConfig.canVeto, "Cannot veto");
        require(isGuardianActive(), "Guardian expired");

        _logAction("ExecutionVetoed", string(abi.encodePacked("Proposal ", proposalId, ": ", reason)));
        emit GuardianActionPerformed(GuardianAction.VETO_EXECUTION, reason);
    }

    function renounceGuardianRole() external onlyGuardian {
        guardians.remove(msg.sender);
        if (guardians.length() == 0) {
            guardianConfig.canCancel = false;
            guardianConfig.canVeto = false;
            guardianConfig.canPause = false;
        }

        _logAction("RoleRenounced", "Guardian role renounced");
    }

    // Emergency Pause Functions
    function confirmPause(string memory reason) external onlyPauseAdmin {
        require(!isPaused, "Already paused");
        require(!pauseConfirmations.contains(msg.sender), "Already confirmed");

        pauseConfirmations.add(msg.sender);

        if (pauseConfirmations.length() >= requiredPauseConfirmations) {
            isPaused = true;
            pauseTimestamp = block.timestamp;
            pauseReason = reason;

            address[] memory confirmers = new address[](pauseConfirmations.length());
            for (uint256 i = 0; i < pauseConfirmations.length(); i++) {
                confirmers[i] = pauseConfirmations.at(i);
            }
            pauseHistory[pauseHistoryCount] =
                PauseRecord({reason: reason, confirmers: confirmers, timestamp: block.timestamp});
            pauseHistoryCount++;

            emit GovernancePaused(reason);
        }
    }

    function unpause() external onlyPauseAdmin {
        require(isPaused, "Not paused");

        uint256 duration = block.timestamp - pauseTimestamp;
        isPaused = false;
        // Clear confirmations
        while (pauseConfirmations.length() > 0) {
            pauseConfirmations.remove(pauseConfirmations.at(0));
        }

        emit GovernanceUnpaused(duration);
    }

    // Utility Functions
    function canExecute(string memory txId) public view returns (bool) {
        Transaction storage txn = transactions[txId];
        if (txn.status == TransactionStatus.EXECUTED) return false;
        if (txn.status == TransactionStatus.CANCELED) return false;
        if (txn.status == TransactionStatus.VETOED) return false;
        if (block.timestamp < txn.eta) return false;
        if (block.timestamp > txn.eta + gracePeriod) return false;
        if (txn.confirmations.length() < requiredSigs) return false;
        return true;
    }

    function isGuardianActive() public view returns (bool) {
        if (guardianConfig.timeboundExpiration == 0) return true;
        return block.timestamp < guardianConfig.timeboundExpiration;
    }

    function advancePhase(ProgressiveDecentralizationPhase newPhase) external onlyOwner {
        currentPhase = newPhase;

        if (newPhase == ProgressiveDecentralizationPhase.PHASE_2) {
            guardianConfig.canCancel = false;
        } else if (newPhase == ProgressiveDecentralizationPhase.PHASE_3) {
            requiredPauseConfirmations = signers.length();
        } else if (newPhase == ProgressiveDecentralizationPhase.PHASE_4) {
            _disableAllGuardians();
        }

        emit PhaseAdvanced(newPhase);
    }

    // Internal Functions
    function generateTxId(address target, uint256 amount, string memory signature, uint256 eta, uint256 timestamp)
        internal
        pure
        returns (string memory)
    {
        // forge-lint: disable-next-line(asm-keccak256)
        bytes32 hash = keccak256(abi.encodePacked(target, amount, signature, eta, timestamp));
        return string(abi.encodePacked(hash));
    }

    function generateExecutionHash(string memory txId) internal view returns (string memory) {
        // forge-lint: disable-next-line(asm-keccak256)
        bytes32 hash = keccak256(abi.encodePacked(txId, block.timestamp));
        return string(abi.encodePacked(hash));
    }

    function _logAction(string memory actionType, string memory description) internal {
        actionsLog[actionsLogCount]["type"] = actionType;
        actionsLog[actionsLogCount]["description"] = description;
        actionsLog[actionsLogCount]["timestamp"] = string(abi.encodePacked(block.timestamp));
        actionsLogCount++;
    }

    function _disableAllGuardians() internal {
        while (guardians.length() > 0) {
            guardians.remove(guardians.at(0));
        }
        guardianConfig.canCancel = false;
        guardianConfig.canVeto = false;
        guardianConfig.canPause = false;
    }

    // View Functions
    function getTransactionConfirmations(string memory txId) external view returns (address[] memory) {
        return transactions[txId].confirmations.values();
    }

    function getSigners() external view returns (address[] memory) {
        return signers.values();
    }

    function getGuardians() external view returns (address[] memory) {
        return guardians.values();
    }

    function getPauseAdmins() external view returns (address[] memory) {
        return pauseAdmins.values();
    }

    function getPauseRecord(uint256 index)
        external
        view
        returns (string memory reason, address[] memory confirmers, uint256 timestamp)
    {
        PauseRecord storage record = pauseHistory[index];
        return (record.reason, record.confirmers, record.timestamp);
    }
}
