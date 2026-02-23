# Defense Mechanisms Specification

**Project:** On-Chain Governance Attack Simulation  
**Version:** 1.0  
**Last Updated:** 2026-02-13  
**Author:** Student 3 - Defense Implementation Engineer  

---

## Table of Contents

1. [Overview](#overview)
2. [Defense Layer 1: Time-Based Defenses](#defense-layer-1-time-based-defenses)
3. [Defense Layer 2: Token-Based Defenses](#defense-layer-2-token-based-defenses)
4. [Defense Layer 3: Threshold & Quorum Defenses](#defense-layer-3-threshold--quorum-defenses)
5. [Defense Layer 4: Structural Control Defenses](#defense-layer-4-structural-control-defenses)
6. [Defense Comparison Matrix](#defense-comparison-matrix)
7. [Implementation Architecture](#implementation-architecture)
8. [Testing Requirements](#testing-requirements)
9. [Security Analysis](#security-analysis)

---

## Overview

### Purpose

This document specifies a defense-in-depth approach to securing DAO governance systems. Each layer provides protection against specific attack vectors while maintaining usability and decentralization. The defense system is designed to:

1. **Prevent** attacks through proactive mechanisms
2. **Detect** attacks through monitoring and pattern recognition
3. **Mitigate** damage when attacks occur
4. **Recover** from successful attacks with minimal loss

### Defense Philosophy

**Defense-in-Depth Strategy:**
```
┌─────────────────────────────────────────────────────────────────┐
│                    DEFENSE LAYERED APPROACH                      │
└─────────────────────────────────────────────────────────────────┘

Layer 4: Structural Controls 🏗️ (Last Resort)
         ├─ Multi-sig treasury
         ├─ Guardian roles
         └─ Emergency pause
         ↓
Layer 3: Threshold & Quorum 📈 (Participation)
         ├─ Dynamic quorum
         ├─ Proposal thresholds
         └─ Supermajority requirements
         ↓
Layer 2: Token-Based Defenses 🪙 (Economic)
         ├─ Snapshot voting
         ├─ Token locking
         └─ Vote delegation
         ↓
Layer 1: Time-Based Defenses ⏱️ (Temporal)
         ├─ Voting delay
         ├─ Voting period
         └─ Timelock
         ↓
[Governance Action Executes]

If attack bypasses Layer 1 → Caught by Layer 2
If attack bypasses Layer 2 → Caught by Layer 3
If attack bypasses Layer 3 → Caught by Layer 4
```

### Success Metrics

Each defense mechanism is evaluated on:
- **Effectiveness**: % of attacks blocked
- **Usability**: Impact on legitimate governance
- **Decentralization**: Preservation of trustlessness
- **Cost**: Gas overhead and complexity
- **Composability**: Works well with other defenses

### Design Principles

1. **Multiple Layers**: No single point of failure
2. **Fail-Safe Defaults**: Security-first configuration
3. **Transparency**: All actions visible on-chain
4. **Flexibility**: Configurable parameters via governance
5. **Minimal Trust**: Reduce reliance on administrators

---

## Defense Layer 1: Time-Based Defenses

### Overview

Time-based defenses introduce delays at key stages of the governance process, preventing attacks that rely on atomic execution or immediate action. These are the **most effective** defenses against flash loan attacks.

### Mechanism 1.1: Voting Delay

**Description:**  
A waiting period between proposal creation and the start of voting. During this period:
- Proposal is visible but voting hasn't started
- Community can review and discuss
- Vote weight snapshot is taken at votingDelay expiration

**Parameters:**
```solidity
uint256 public votingDelay; // Blocks to wait before voting starts
// Typical: 1 day = ~7,200 blocks (on Ethereum)
```

**How It Works:**
```
Proposal Created (Block 1000)
         │
         ├─ Voting Delay: 7,200 blocks (~1 day)
         │  ├─ Community reviews proposal
         │  ├─ Discussions on forum/Discord
         │  └─ Users prepare voting positions
         │
         ↓
Voting Starts (Block 8200)
         │
         └─ Votes can now be cast
```

**Attack Prevention:**
- ✅ **Flash Loan**: Prevents same-transaction voting
- ✅ **Quick Exploits**: Gives time for vulnerability discovery
- ⚠️ **Whale**: Doesn't prevent but allows community awareness

**Implementation:**
```solidity
function propose(
    address[] memory targets,
    uint256[] memory values,
    string[] memory signatures,
    bytes[] memory calldatas,
    string memory description
) public returns (uint256) {
    require(
        getVotes(msg.sender, block.number - 1) >= proposalThreshold(),
        "Governor: proposer votes below threshold"
    );
    
    uint256 proposalId = hashProposal(targets, values, calldatas, keccak256(bytes(description)));
    
    Proposal storage proposal = proposals[proposalId];
    require(proposal.voteStart == 0, "Governor: proposal already exists");
    
    uint64 snapshot = block.number + votingDelay;
    uint64 voteStart = snapshot;
    uint64 voteEnd = voteStart + votingPeriod;
    
    proposal.snapshot = snapshot;
    proposal.voteStart = voteStart;
    proposal.voteEnd = voteEnd;
    
    emit ProposalCreated(
        proposalId,
        msg.sender,
        targets,
        values,
        signatures,
        calldatas,
        voteStart,
        voteEnd,
        description
    );
    
    return proposalId;
}
```

**Configuration:**
```solidity
// Recommended values
uint256 public constant MINIMUM_VOTING_DELAY = 1 days; // 7,200 blocks
uint256 public constant MAXIMUM_VOTING_DELAY = 7 days; // 50,400 blocks
uint256 public constant DEFAULT_VOTING_DELAY = 2 days; // 14,400 blocks
```

**Trade-offs:**
- ➕ Strong defense against flash loans
- ➕ Community review time
- ➖ Slows governance process
- ➖ Delayed response to urgent issues

**Effectiveness:**
```
Attack Type        | Prevention | Mitigation | Overall
-------------------|------------|------------|----------
Flash Loan         | ✅ 100%     | N/A        | ✅ 100%
Whale              | ❌ 0%       | ⚠️ 30%      | ⚠️ 30%
Proposal Spam      | ❌ 0%       | ❌ 0%       | ❌ 0%
Quorum Manip       | ❌ 0%       | ⚠️ 20%      | ⚠️ 20%
Timelock Exploit   | ❌ 0%       | ❌ 0%       | ❌ 0%
```

---

### Mechanism 1.2: Voting Period

**Description:**  
The duration during which votes can be cast. Must be long enough for:
- Wide participation across time zones
- Thoughtful consideration of proposals
- Delegation of votes if needed

**Parameters:**
```solidity
uint256 public votingPeriod; // Blocks voting is open
// Typical: 3-7 days = 21,600-50,400 blocks
```

**How It Works:**
```
Voting Period: 3 days (21,600 blocks)
│
├─ Day 1 (First 7,200 blocks)
│  ├─ Early adopters vote
│  ├─ 10-20% participation
│  └─ Results may swing significantly
│
├─ Day 2 (Blocks 7,201-14,400)
│  ├─ Mainstream participation
│  ├─ 50-70% of total votes cast
│  └─ Results stabilize
│
└─ Day 3 (Blocks 14,401-21,600)
   ├─ Final votes
   ├─ Last-minute rallies
   └─ Final result determined
```

**Attack Prevention:**
- ⚠️ **Quick Manipulation**: Harder to coordinate timing
- ⚠️ **Quorum Gaming**: More participation = harder to predict
- ✅ **Informed Voting**: Time for research and discussion

**Implementation:**
```solidity
function castVote(uint256 proposalId, uint8 support) public returns (uint256) {
    return _castVote(proposalId, msg.sender, support, "");
}

function _castVote(
    uint256 proposalId,
    address voter,
    uint8 support,
    string memory reason
) internal returns (uint256) {
    Proposal storage proposal = proposals[proposalId];
    ProposalState status = state(proposalId);
    
    require(status == ProposalState.Active, "Governor: vote not currently active");
    
    uint256 weight = getVotes(voter, proposal.snapshot);
    require(weight > 0, "Governor: voter has no voting weight");
    require(!proposal.hasVoted[voter], "Governor: vote already cast");
    
    proposal.hasVoted[voter] = true;
    
    if (support == uint8(VoteType.Against)) {
        proposal.againstVotes += weight;
    } else if (support == uint8(VoteType.For)) {
        proposal.forVotes += weight;
    } else if (support == uint8(VoteType.Abstain)) {
        proposal.abstainVotes += weight;
    } else {
        revert("Governor: invalid vote type");
    }
    
    emit VoteCast(voter, proposalId, support, weight, reason);
    
    return weight;
}
```

**Configuration:**
```solidity
// Recommended values
uint256 public constant MINIMUM_VOTING_PERIOD = 3 days;   // 21,600 blocks
uint256 public constant MAXIMUM_VOTING_PERIOD = 14 days;  // 100,800 blocks
uint256 public constant DEFAULT_VOTING_PERIOD = 7 days;   // 50,400 blocks
```

**Trade-offs:**
- ➕ Higher participation rates
- ➕ Cross-timezone inclusivity
- ➕ More informed voting
- ➖ Slower governance execution
- ➖ Voter fatigue on long periods

**Effectiveness:**
```
Attack Type        | Prevention | Mitigation | Overall
-------------------|------------|------------|----------
Flash Loan         | ✅ 90%      | N/A        | ✅ 90%
Whale              | ❌ 0%       | ⚠️ 40%      | ⚠️ 40%
Proposal Spam      | ❌ 0%       | ⚠️ 20%      | ⚠️ 20%
Quorum Manip       | ❌ 0%       | ⚠️ 50%      | ⚠️ 50%
Timelock Exploit   | ❌ 0%       | ❌ 0%       | ❌ 0%
```

---

### Mechanism 1.3: Timelock

**Description:**  
A mandatory delay between proposal execution approval and actual execution. The timelock:
- Queues approved proposals with an Estimated Time of Arrival (ETA)
- Enforces minimum delay before execution
- Allows community to exit if proposal is malicious

**Parameters:**
```solidity
uint256 public delay; // Minimum delay for execution
// Typical: 24-48 hours
```

**How It Works:**
```
Proposal Passed (Voting Completed)
         │
         ├─ Queue in Timelock
         │  ├─ Calculate ETA = now + delay
         │  ├─ Store transaction details
         │  └─ Emit event for transparency
         │
         ↓
Timelock Period: 48 hours
         │  ├─ Community can review
         │  ├─ Users can exit (withdraw funds)
         │  ├─ Security researchers analyze
         │  └─ Counter-proposals can be created
         │
         ↓
ETA Reached
         │  ├─ Transaction can now execute
         │  ├─ Anyone can call execute()
         │  └─ Transaction executes if still valid
         │
         ↓
Action Executed
```

**Attack Prevention:**
- ✅ **Flash Loan**: Impossible to execute in same transaction/block
- ✅ **Malicious Proposals**: Community can exit or cancel
- ⚠️ **Whale**: Users can withdraw but doesn't prevent passage

**Implementation:**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Timelock {
    event QueueTransaction(
        bytes32 indexed txHash,
        address indexed target,
        uint256 value,
        string signature,
        bytes data,
        uint256 eta
    );
    
    event ExecuteTransaction(
        bytes32 indexed txHash,
        address indexed target,
        uint256 value,
        string signature,
        bytes data,
        uint256 eta
    );
    
    event CancelTransaction(
        bytes32 indexed txHash,
        address indexed target,
        uint256 value,
        string signature,
        bytes data,
        uint256 eta
    );
    
    uint256 public constant GRACE_PERIOD = 14 days;
    uint256 public constant MINIMUM_DELAY = 2 days;
    uint256 public constant MAXIMUM_DELAY = 30 days;
    
    address public admin;
    uint256 public delay;
    
    mapping(bytes32 => bool) public queuedTransactions;
    
    constructor(address _admin, uint256 _delay) {
        require(_delay >= MINIMUM_DELAY, "Timelock: delay too short");
        require(_delay <= MAXIMUM_DELAY, "Timelock: delay too long");
        
        admin = _admin;
        delay = _delay;
    }
    
    function queueTransaction(
        address target,
        uint256 value,
        string memory signature,
        bytes memory data,
        uint256 eta
    ) public returns (bytes32) {
        require(msg.sender == admin, "Timelock: only admin");
        require(
            eta >= block.timestamp + delay,
            "Timelock: ETA must exceed delay"
        );
        
        bytes32 txHash = keccak256(
            abi.encode(target, value, signature, data, eta)
        );
        
        queuedTransactions[txHash] = true;
        
        emit QueueTransaction(txHash, target, value, signature, data, eta);
        return txHash;
    }
    
    function executeTransaction(
        address target,
        uint256 value,
        string memory signature,
        bytes memory data,
        uint256 eta
    ) public payable returns (bytes memory) {
        require(msg.sender == admin, "Timelock: only admin");
        
        bytes32 txHash = keccak256(
            abi.encode(target, value, signature, data, eta)
        );
        
        require(
            queuedTransactions[txHash],
            "Timelock: transaction not queued"
        );
        require(
            block.timestamp >= eta,
            "Timelock: transaction not ready"
        );
        require(
            block.timestamp <= eta + GRACE_PERIOD,
            "Timelock: transaction expired"
        );
        
        queuedTransactions[txHash] = false;
        
        bytes memory callData;
        if (bytes(signature).length == 0) {
            callData = data;
        } else {
            callData = abi.encodePacked(
                bytes4(keccak256(bytes(signature))),
                data
            );
        }
        
        (bool success, bytes memory returnData) = target.call{value: value}(
            callData
        );
        require(success, "Timelock: transaction execution reverted");
        
        emit ExecuteTransaction(txHash, target, value, signature, data, eta);
        
        return returnData;
    }
    
    function cancelTransaction(
        address target,
        uint256 value,
        string memory signature,
        bytes memory data,
        uint256 eta
    ) public {
        require(msg.sender == admin, "Timelock: only admin");
        
        bytes32 txHash = keccak256(
            abi.encode(target, value, signature, data, eta)
        );
        
        queuedTransactions[txHash] = false;
        
        emit CancelTransaction(txHash, target, value, signature, data, eta);
    }
}
```

**Configuration:**
```solidity
// Recommended delays based on protocol value
struct TimelockConfig {
    uint256 minDelay;        // Minimum for any action
    uint256 normalDelay;     // Standard proposals
    uint256 criticalDelay;   // Treasury/upgrade proposals
}

// Example configurations
TimelockConfig small = TimelockConfig({
    minDelay: 24 hours,
    normalDelay: 48 hours,
    criticalDelay: 72 hours
});

TimelockConfig large = TimelockConfig({
    minDelay: 48 hours,
    normalDelay: 72 hours,
    criticalDelay: 168 hours  // 7 days
});
```

**Trade-offs:**
- ➕ **Strongest** flash loan defense
- ➕ Community response time
- ➕ User exit window
- ➖ Very slow governance
- ➖ Not responsive to emergencies
- ➖ Adds complexity

**Effectiveness:**
```
Attack Type        | Prevention | Mitigation | Overall
-------------------|------------|------------|----------
Flash Loan         | ✅ 100%     | N/A        | ✅ 100%
Whale              | ❌ 0%       | ⚠️ 60%      | ⚠️ 60%
Proposal Spam      | ❌ 0%       | ❌ 0%       | ❌ 0%
Quorum Manip       | ❌ 0%       | ⚠️ 40%      | ⚠️ 40%
Timelock Exploit   | N/A        | N/A        | See Layer 4
```

---

### Time-Based Defense Summary

**Combined Effectiveness:**
```
When all three time-based defenses are enabled:

┌─────────────────────────────────────────────────────────────┐
│ Total Timeline: Proposal → Execution                        │
└─────────────────────────────────────────────────────────────┘

Day 0: Proposal Created
  ↓
Day 1-2: Voting Delay (review period)
  ↓
Day 2-9: Voting Period (7 days voting)
  ↓
Day 9: Voting Ends, Proposal Passed
  ↓
Day 9-11: Timelock Period (48 hours)
  ↓
Day 11: Execution Possible

TOTAL TIME: 11 days minimum
```

**Attack Prevention:**
- Flash Loan: ✅ **100%** (impossible to execute atomically)
- Whale: ⚠️ **40%** (allows community response but doesn't prevent vote)
- Spam: ⚠️ **10%** (slight deterrent from slow process)
- Quorum: ⚠️ **35%** (longer periods = more participation)

**Recommended Configuration:**
```solidity
contract GovernorWithTimeDefenses {
    uint256 public constant VOTING_DELAY = 2 days;    // 14,400 blocks
    uint256 public constant VOTING_PERIOD = 7 days;   // 50,400 blocks
    uint256 public constant TIMELOCK_DELAY = 48 hours; // 2 days
    
    // Total minimum time: ~11 days
}
```

---

## Defense Layer 2: Token-Based Defenses

### Overview

Token-based defenses modify how voting power is calculated and used, making it economically harder or impossible to execute certain attacks even with sufficient tokens.

### Mechanism 2.1: Snapshot Voting

**Description:**  
Instead of using current token balance for voting power, use historical balance at a specific block (snapshot). This prevents:
- Flash loan attacks (tokens borrowed momentarily)
- Last-minute token acquisition
- Vote power manipulation during voting

**Parameters:**
```solidity
uint256 public snapshot; // Block number for balance snapshot
// Typically: proposalCreation + votingDelay
```

**How It Works:**
```
Block 1000: User holds 10,000 tokens
    │
    ├─ Delegate to self
    ├─ Voting power recorded in checkpoint
    │
Block 1000: Proposal Created
    │
    ├─ Snapshot set to block 1001 (or 1000 + votingDelay)
    │
Block 1001: Snapshot Block
    │
    ├─ Voting power frozen at this point
    ├─ Future balance changes don't affect this proposal
    │
Block 1100: User buys 90,000 more tokens (now has 100,000)
    │
    ├─ Voting power for current proposal: still 10,000 ❌
    ├─ Voting power for future proposals: 100,000 ✅
    │
Block 1200: User votes on proposal
    │
    └─ Vote weight = getPriorVotes(user, snapshot) = 10,000
```

**Attack Prevention:**
- ✅ **Flash Loan**: Borrowed tokens have 0 voting power (not held at snapshot)
- ✅ **Quick Accumulation**: Can't buy tokens and immediately vote
- ⚠️ **Whale**: Doesn't prevent if whale held tokens before snapshot

**Implementation:**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract GovernanceToken is ERC20, ERC20Votes {
    constructor(
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) ERC20Permit(name) {
        _mint(msg.sender, 1_000_000 * 10**decimals());
    }
    
    // Override required by Solidity
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);
    }
    
    function _mint(
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Votes) {
        super._mint(to, amount);
    }
    
    function _burn(
        address account,
        uint256 amount
    ) internal override(ERC20, ERC20Votes) {
        super._burn(account, amount);
    }
}

// In Governor contract
function getVotes(address account, uint256 blockNumber)
    public
    view
    returns (uint256)
{
    return token.getPastVotes(account, blockNumber);
}

function propose(
    address[] memory targets,
    uint256[] memory values,
    string[] memory signatures,
    bytes[] memory calldatas,
    string memory description
) public returns (uint256) {
    uint256 proposerVotes = getVotes(msg.sender, block.number - 1);
    require(
        proposerVotes >= proposalThreshold(),
        "Governor: proposer votes below threshold"
    );
    
    uint256 proposalId = hashProposal(targets, values, calldatas, keccak256(bytes(description)));
    
    Proposal storage proposal = proposals[proposalId];
    
    // Set snapshot for vote weight calculation
    proposal.snapshot = block.number + votingDelay;
    proposal.voteStart = proposal.snapshot;
    proposal.voteEnd = proposal.voteStart + votingPeriod;
    
    emit ProposalCreated(proposalId, msg.sender, proposal.snapshot);
    
    return proposalId;
}
```

**Checkpoint System:**
```solidity
// ERC20Votes uses checkpoint system to track historical balances
struct Checkpoint {
    uint32 fromBlock;
    uint224 votes;
}

mapping(address => Checkpoint[]) private _checkpoints;

function _writeCheckpoint(
    Checkpoint[] storage ckpts,
    function(uint256, uint256) view returns (uint256) op,
    uint256 delta
) private returns (uint256 oldWeight, uint256 newWeight) {
    uint256 pos = ckpts.length;
    oldWeight = pos == 0 ? 0 : ckpts[pos - 1].votes;
    newWeight = op(oldWeight, delta);
    
    if (pos > 0 && ckpts[pos - 1].fromBlock == block.number) {
        ckpts[pos - 1].votes = SafeCast.toUint224(newWeight);
    } else {
        ckpts.push(Checkpoint({
            fromBlock: SafeCast.toUint32(block.number),
            votes: SafeCast.toUint224(newWeight)
        }));
    }
}
```

**Trade-offs:**
- ➕ **Eliminates** flash loan voting power
- ➕ No additional gas for voters
- ➕ Transparent and deterministic
- ➖ Slightly higher gas for token transfers (checkpoint writes)
- ➖ Doesn't prevent long-term accumulation
- ➖ Needs votingDelay to be effective

**Effectiveness:**
```
Attack Type        | Prevention | Mitigation | Overall
-------------------|------------|------------|----------
Flash Loan         | ✅ 100%     | N/A        | ✅ 100%
Whale              | ❌ 0%       | ❌ 0%       | ❌ 0%
Proposal Spam      | ❌ 0%       | ❌ 0%       | ❌ 0%
Quorum Manip       | ⚠️ 50%      | ⚠️ 30%      | ⚠️ 40%
Timelock Exploit   | ❌ 0%       | ❌ 0%       | ❌ 0%
```

---

### Mechanism 2.2: Token Locking (Vote Escrowing)

**Description:**  
Require tokens to be locked for a period to gain voting power. Longer locks = more voting power. This creates:
- Long-term alignment of voters with protocol
- Economic cost to accumulate voting power
- Deterrent against short-term manipulation

**Parameters:**
```solidity
uint256 public minLockDuration;  // Minimum lock time for voting
uint256 public maxLockDuration;  // Maximum lock time
uint256 public lockMultiplier;   // Voting power boost for locking
```

**Models:**

**Model A: Simple Lock (1:1)**
```solidity
// Lock tokens for fixed period to vote
function lock(uint256 amount, uint256 duration) external {
    require(duration >= MIN_LOCK_DURATION, "Lock too short");
    require(amount > 0, "Amount must be positive");
    
    token.transferFrom(msg.sender, address(this), amount);
    
    locks[msg.sender] = Lock({
        amount: amount,
        unlockTime: block.timestamp + duration,
        votingPower: amount  // 1:1 ratio
    });
}

// Voting power = locked amount
function getVotingPower(address account) public view returns (uint256) {
    return locks[account].amount;
}
```

**Model B: Vote Escrow (Time-Weighted)**
```solidity
// Lock tokens for variable time = variable voting power
// Inspired by Curve's veCRV model

function createLock(uint256 amount, uint256 unlockTime) external {
    require(unlockTime > block.timestamp, "Invalid unlock time");
    require(unlockTime <= block.timestamp + MAX_LOCK_TIME, "Lock too long");
    
    token.transferFrom(msg.sender, address(this), amount);
    
    // Voting power decays linearly until unlock
    uint256 duration = unlockTime - block.timestamp;
    uint256 votingPower = (amount * duration) / MAX_LOCK_TIME;
    
    locks[msg.sender] = LockedBalance({
        amount: amount,
        end: unlockTime
    });
    
    _checkpoint(msg.sender, LockedBalance(0, 0), locks[msg.sender]);
}

// Voting power decays over time
function balanceOf(address account) public view returns (uint256) {
    LockedBalance memory locked = locks[account];
    if (locked.end <= block.timestamp) {
        return 0; // Lock expired
    }
    
    // Linear decay
    uint256 remaining = locked.end - block.timestamp;
    return (locked.amount * remaining) / MAX_LOCK_TIME;
}
```

**Comparison:**
```
Lock Duration | Simple Lock | Vote Escrow (veToken)
--------------|-------------|----------------------
No lock       | 0 power     | 0 power
1 week        | 100 power   | 1.9 power (1/52 of max)
1 month       | 100 power   | 8.3 power (1/12 of max)
6 months      | 100 power   | 50 power (6/12 of max)
1 year        | 100 power   | 100 power (max)
2 years       | 100 power   | 200 power (if allowed)
4 years       | 100 power   | 400 power (Curve max)
```

**Attack Prevention:**
- ⚠️ **Flash Loan**: Partial (flash loans can't lock for duration)
- ⚠️ **Quick Manipulation**: Requires long-term commitment
- ⚠️ **Whale**: Doesn't prevent but creates alignment

**Implementation (Vote Escrow):**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VoteEscrow {
    struct LockedBalance {
        int128 amount;
        uint256 end;
    }
    
    struct Point {
        int128 bias;
        int128 slope;
        uint256 ts;
        uint256 blk;
    }
    
    uint256 public constant WEEK = 7 days;
    uint256 public constant MAXTIME = 4 * 365 days;
    uint256 public constant MULTIPLIER = 10**18;
    
    IERC20 public token;
    
    mapping(address => LockedBalance) public locked;
    mapping(address => Point[]) public userPointHistory;
    mapping(uint256 => Point) public pointHistory;
    
    uint256 public epoch;
    
    event Deposit(
        address indexed provider,
        uint256 value,
        uint256 indexed locktime,
        uint256 ts
    );
    
    event Withdraw(address indexed provider, uint256 value, uint256 ts);
    
    constructor(address _token) {
        token = IERC20(_token);
        pointHistory[0].blk = block.number;
        pointHistory[0].ts = block.timestamp;
    }
    
    function createLock(uint256 _value, uint256 _unlockTime) external {
        LockedBalance memory _locked = locked[msg.sender];
        
        require(_value > 0, "Need non-zero value");
        require(_locked.amount == 0, "Withdraw old tokens first");
        require(
            _unlockTime > block.timestamp,
            "Can only lock until time in the future"
        );
        require(
            _unlockTime <= block.timestamp + MAXTIME,
            "Voting lock can be 4 years max"
        );
        
        _depositFor(msg.sender, _value, _unlockTime, _locked, 1);
    }
    
    function increaseLockAmount(uint256 _value) external {
        LockedBalance memory _locked = locked[msg.sender];
        
        require(_value > 0, "Need non-zero value");
        require(_locked.amount > 0, "No existing lock found");
        require(_locked.end > block.timestamp, "Cannot add to expired lock");
        
        _depositFor(msg.sender, _value, 0, _locked, 2);
    }
    
    function increaseLockDuration(uint256 _unlockTime) external {
        LockedBalance memory _locked = locked[msg.sender];
        
        require(_locked.end > block.timestamp, "Lock expired");
        require(_locked.amount > 0, "Nothing is locked");
        require(_unlockTime > _locked.end, "Can only increase lock duration");
        require(
            _unlockTime <= block.timestamp + MAXTIME,
            "Voting lock can be 4 years max"
        );
        
        _depositFor(msg.sender, 0, _unlockTime, _locked, 3);
    }
    
    function withdraw() external {
        LockedBalance memory _locked = locked[msg.sender];
        require(block.timestamp >= _locked.end, "The lock didn't expire");
        uint256 value = uint256(int256(_locked.amount));
        
        LockedBalance memory oldLocked = _locked;
        _locked.end = 0;
        _locked.amount = 0;
        locked[msg.sender] = _locked;
        
        _checkpoint(msg.sender, oldLocked, _locked);
        
        token.transfer(msg.sender, value);
        
        emit Withdraw(msg.sender, value, block.timestamp);
    }
    
    function balanceOf(address addr) external view returns (uint256) {
        return balanceOf(addr, block.timestamp);
    }
    
    function balanceOf(address addr, uint256 _t) public view returns (uint256) {
        uint256 _epoch = userPointHistory[addr].length;
        if (_epoch == 0) {
            return 0;
        }
        
        Point memory lastPoint = userPointHistory[addr][_epoch - 1];
        lastPoint.bias -= lastPoint.slope * int128(int256(_t - lastPoint.ts));
        if (lastPoint.bias < 0) {
            lastPoint.bias = 0;
        }
        return uint256(int256(lastPoint.bias));
    }
    
    function _depositFor(
        address _addr,
        uint256 _value,
        uint256 _unlockTime,
        LockedBalance memory _lockedBalance,
        uint256 _type
    ) internal {
        LockedBalance memory locked_ = _lockedBalance;
        
        if (_value != 0) {
            token.transferFrom(_addr, address(this), _value);
        }
        
        locked_.amount += int128(int256(_value));
        if (_unlockTime != 0) {
            locked_.end = _unlockTime;
        }
        locked[_addr] = locked_;
        
        _checkpoint(_addr, _lockedBalance, locked_);
        
        emit Deposit(_addr, _value, locked_.end, block.timestamp);
    }
    
    function _checkpoint(
        address addr,
        LockedBalance memory oldLocked,
        LockedBalance memory newLocked
    ) internal {
        Point memory uOld;
        Point memory uNew;
        
        // Calculate slopes and biases
        if (oldLocked.end > block.timestamp && oldLocked.amount > 0) {
            uOld.slope = oldLocked.amount / int128(int256(MAXTIME));
            uOld.bias = uOld.slope * int128(int256(oldLocked.end - block.timestamp));
        }
        
        if (newLocked.end > block.timestamp && newLocked.amount > 0) {
            uNew.slope = newLocked.amount / int128(int256(MAXTIME));
            uNew.bias = uNew.slope * int128(int256(newLocked.end - block.timestamp));
        }
        
        // Update user point history
        uint256 userEpoch = userPointHistory[addr].length;
        userEpoch++;
        uNew.ts = block.timestamp;
        uNew.blk = block.number;
        userPointHistory[addr].push(uNew);
    }
}
```

**Trade-offs:**
- ➕ Long-term alignment
- ➕ Economic cost for attackers
- ➕ Deters flash loans completely
- ➖ Lower liquidity for token holders
- ➖ Complexity (vote escrow model)
- ➖ Reduced participation (lock friction)

**Effectiveness:**
```
Attack Type        | Prevention | Mitigation | Overall
-------------------|------------|------------|----------
Flash Loan         | ✅ 100%     | N/A        | ✅ 100%
Whale              | ❌ 0%       | ⚠️ 30%      | ⚠️ 30%
Proposal Spam      | ⚠️ 40%      | ⚠️ 20%      | ⚠️ 30%
Quorum Manip       | ⚠️ 50%      | ⚠️ 30%      | ⚠️ 40%
Timelock Exploit   | ❌ 0%       | ❌ 0%       | ❌ 0%
```

---

### Mechanism 2.3: Vote Delegation

**Description:**  
Allow token holders to delegate their voting power to others without transferring tokens. This:
- Increases participation (experts vote on behalf of passive holders)
- Concentrates expertise
- Maintains token holder ultimate control

**Parameters:**
```solidity
mapping(address => address) public delegates;
```

**How It Works:**
```
Alice (10,000 tokens) → Delegates to → Bob
Bob (5,000 tokens) → Votes with 15,000 power

Alice retains:
- ✅ Token ownership
- ✅ Can change delegate anytime
- ✅ Can vote directly (overrides delegation)
- ❌ Voting power (while delegated)

Bob gains:
- ✅ Voting power (15,000 total)
- ❌ Token ownership
- ❌ Ability to transfer Alice's tokens
```

**Attack Prevention:**
- ⚠️ **Whale**: Can reduce whale power if many delegate to others
- ✅ **Low Participation**: Increases overall participation
- ❌ **Delegation Concentration**: Could create new whales

**Implementation:**
```solidity
// Built into ERC20Votes
function delegate(address delegatee) public virtual override {
    _delegate(_msgSender(), delegatee);
}

function delegateBySig(
    address delegatee,
    uint256 nonce,
    uint256 expiry,
    uint8 v,
    bytes32 r,
    bytes32 s
) public virtual override {
    require(block.timestamp <= expiry, "ERC20Votes: signature expired");
    address signer = ECDSA.recover(
        _hashTypedDataV4(
            keccak256(
                abi.encode(
                    DELEGATION_TYPEHASH,
                    delegatee,
                    nonce,
                    expiry
                )
            )
        ),
        v,
        r,
        s
    );
    require(nonce == _useNonce(signer), "ERC20Votes: invalid nonce");
    _delegate(signer, delegatee);
}

function _delegate(address delegator, address delegatee) internal virtual {
    address currentDelegate = delegates(delegator);
    uint256 delegatorBalance = balanceOf(delegator);
    _delegates[delegator] = delegatee;
    
    emit DelegateChanged(delegator, currentDelegate, delegatee);
    
    _moveVotingPower(currentDelegate, delegatee, delegatorBalance);
}

function _moveVotingPower(
    address src,
    address dst,
    uint256 amount
) private {
    if (src != dst && amount > 0) {
        if (src != address(0)) {
            (uint256 oldWeight, uint256 newWeight) = _writeCheckpoint(
                _checkpoints[src],
                _subtract,
                amount
            );
            emit DelegateVotesChanged(src, oldWeight, newWeight);
        }
        
        if (dst != address(0)) {
            (uint256 oldWeight, uint256 newWeight) = _writeCheckpoint(
                _checkpoints[dst],
                _add,
                amount
            );
            emit DelegateVotesChanged(dst, oldWeight, newWeight);
        }
    }
}
```

**Trade-offs:**
- ➕ Increased participation
- ➕ Expert decision-making
- ➕ Flexible (can change anytime)
- ➖ Delegation centralization risk
- ➖ Requires trust in delegate
- ➖ Voter laziness

**Effectiveness:**
```
Attack Type        | Prevention | Mitigation | Overall
-------------------|------------|------------|----------
Flash Loan         | ❌ 0%       | ❌ 0%       | ❌ 0%
Whale              | ⚠️ 30%      | ⚠️ 40%      | ⚠️ 35%
Proposal Spam      | ❌ 0%       | ⚠️ 20%      | ⚠️ 10%
Quorum Manip       | ❌ 0%       | ✅ 70%      | ⚠️ 35%
Timelock Exploit   | ❌ 0%       | ❌ 0%       | ❌ 0%
```

---

### Token-Based Defense Summary

**Combined Effectiveness:**
When all token-based defenses are enabled:

```
Defense Combination:
- Snapshot voting (blocks flash loans)
- Vote escrow (4-year max lock, time-weighted)
- Delegation (increases participation)

Result:
- Flash loan attacks: ✅ 100% prevention
- Whale attacks: ⚠️ 30-40% mitigation
- Participation: +50% increase
- Long-term alignment: Strong
```

**Recommended Configuration:**
```solidity
contract GovernorWithTokenDefenses {
    // Use ERC20Votes for snapshot
    ERC20Votes public immutable token;
    
    // Optional: Vote escrow for alignment
    VoteEscrow public immutable veToken;
    
    // Built-in delegation
    function delegate(address delegatee) external {
        token.delegate(delegatee);
    }
    
    // Vote power from snapshot
    function getVotes(address account, uint256 blockNumber)
        public
        view
        returns (uint256)
    {
        if (address(veToken) != address(0)) {
            return veToken.balanceOf(account, blockNumber);
        }
        return token.getPastVotes(account, blockNumber);
    }
}
```

---

## Defense Layer 3: Threshold & Quorum Defenses

### Overview

Threshold and quorum defenses set participation and support requirements that make attacks economically expensive or logistically difficult.

### Mechanism 3.1: Proposal Threshold

**Description:**  
Minimum voting power required to create a proposal. Prevents spam by making proposal creation expensive.

**Parameters:**
```solidity
uint256 public proposalThreshold; // Tokens needed to propose
// Typical: 0.1% - 2% of total supply
```

**How It Works:**
```
Proposal Threshold: 1% of supply = 10,000 tokens

Scenario A: User has 5,000 tokens
├─ Attempts to create proposal
├─ Check: getVotes(user) >= proposalThreshold()
├─ 5,000 < 10,000
└─ ❌ Reverts: "Below proposal threshold"

Scenario B: User has 15,000 tokens
├─ Attempts to create proposal
├─ Check: getVotes(user) >= proposalThreshold()
├─ 15,000 >= 10,000
└─ ✅ Proposal created successfully

Scenario C: Spam attack
├─ Attacker wants to create 100 proposals
├─ Needs: 100 × 1% = 100% of supply (impossible)
├─ Or: Reuse same tokens (must wait between proposals)
└─ ❌ Spam attack too expensive
```

**Attack Prevention:**
- ✅ **Proposal Spam**: Direct prevention, makes spam expensive
- ⚠️ **Flash Loan**: Partial (still need to borrow threshold amount)
- ❌ **Whale**: Doesn't affect whales (they have tokens)

**Implementation:**
```solidity
function proposalThreshold() public view returns (uint256) {
    return (token.totalSupply() * proposalThresholdBPS) / 10000;
}

function propose(
    address[] memory targets,
    uint256[] memory values,
    string[] memory signatures,
    bytes[] memory calldatas,
    string memory description
) public virtual returns (uint256) {
    uint256 proposerVotes = getVotes(_msgSender(), block.number - 1);
    uint256 threshold = proposalThreshold();
    
    require(
        proposerVotes >= threshold,
        string(
            abi.encodePacked(
                "Governor: proposer votes below threshold. Required: ",
                Strings.toString(threshold),
                ", has: ",
                Strings.toString(proposerVotes)
            )
        )
    );
    
    // Create proposal...
}
```

**Configuration:**
```solidity
// Basis Points (BPS) system: 10000 = 100%
struct ThresholdConfig {
    uint256 bps;           // Basis points
    uint256 absolute;      // Absolute minimum
    string description;
}

ThresholdConfig[5] memory configs = [
    ThresholdConfig({
        bps: 10,           // 0.1%
        absolute: 1000,
        description: "Very low - easy to propose, high spam risk"
    }),
    ThresholdConfig({
        bps: 50,           // 0.5%
        absolute: 5000,
        description: "Low - accessible, moderate spam risk"
    }),
    ThresholdConfig({
        bps: 100,          // 1%
        absolute: 10000,
        description: "Medium - recommended for most DAOs"
    }),
    ThresholdConfig({
        bps: 200,          // 2%
        absolute: 20000,
        description: "High - limits proposers, very low spam"
    }),
    ThresholdConfig({
        bps: 500,          // 5%
        absolute: 50000,
        description: "Very high - only major holders, no spam"
    })
];
```

**Trade-offs:**
- ➕ Directly prevents spam
- ➕ Economic deterrent
- ➕ Simple to implement
- ➖ Can exclude smaller holders
- ➖ May reduce governance participation
- ➖ Doesn't prevent whales

**Effectiveness:**
```
Attack Type        | Prevention | Mitigation | Overall
-------------------|------------|------------|----------
Flash Loan         | ⚠️ 40%      | ⚠️ 30%      | ⚠️ 35%
Whale              | ❌ 0%       | ❌ 0%       | ❌ 0%
Proposal Spam      | ✅ 95%      | N/A        | ✅ 95%
Quorum Manip       | ⚠️ 20%      | ⚠️ 10%      | ⚠️ 15%
Timelock Exploit   | ❌ 0%       | ❌ 0%       | ❌ 0%
```

---

### Mechanism 3.2: Dynamic Quorum

**Description:**  
Quorum adjusts based on recent participation rather than being fixed. This:
- Prevents low-participation gaming
- Adapts to community engagement levels
- Makes quorum manipulation harder

**Parameters:**
```solidity
uint256 public quorumNumerator; // Base quorum percentage
uint256 public quorumDenominator; // Usually 100
uint256[] public recentParticipation; // Historical data
```

**Models:**

**Model A: Fixed Quorum (Vulnerable)**
```solidity
function quorum() public view returns (uint256) {
    return (token.totalSupply() * 4) / 100; // Fixed 4%
}

// Problem: Always 4% regardless of actual participation
// If normal participation is 10%, quorum is easy to meet
// If participation drops to 2%, attacker with 2.5% wins
```

**Model B: Dynamic Quorum (Recommended)**
```solidity
function quorum(uint256 blockNumber) public view returns (uint256) {
    uint256 recentAvgParticipation = _getRecentAvgParticipation();
    
    // Quorum = 70% of recent average + minimum 5%
    uint256 dynamicQuorum = (recentAvgParticipation * 70) / 100;
    uint256 minimumQuorum = (token.totalSupply() * 5) / 100;
    
    return max(dynamicQuorum, minimumQuorum);
}

function _getRecentAvgParticipation() internal view returns (uint256) {
    if (recentParticipation.length == 0) return 0;
    
    uint256 sum = 0;
    uint256 count = min(recentParticipation.length, 10); // Last 10 proposals
    
    for (uint256 i = 0; i < count; i++) {
        sum += recentParticipation[recentParticipation.length - 1 - i];
    }
    
    return sum / count;
}
```

**Model C: Participation-Weighted Quorum**
```solidity
function quorum() public view returns (uint256) {
    uint256 totalVotes = forVotes + againstVotes + abstainVotes;
    
    // Quorum is % of actual participants
    // Requires 60% of those who voted to be FOR
    // Not a fixed % of total supply
    
    return (totalVotes * 60) / 100;
}

// Advantage: Can't be gamed by low participation
// Disadvantage: Need minimum threshold to prevent tiny-participation attacks
```

**Comparison:**
```
Scenario: Total supply = 1,000,000 tokens

Model           | Normal (10%) | Low (3%)  | High (20%)
----------------|--------------|-----------|------------
Fixed 4%        | 40,000       | 40,000    | 40,000
Dynamic (70%+5%)| 70,000       | 52,000    | 140,000
Participation % | 60% of votes | 60% of votes | 60% of votes

Attack Analysis:
- Fixed: Attacker needs 40,001 votes (always)
- Dynamic: Attacker needs 52,000-140,000 (adapts)
- Participation: Attacker needs >60% of actual voters (relative)
```

**Implementation:**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

abstract contract GovernorDynamicQuorum {
    struct ProposalVotes {
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
    }
    
    mapping(uint256 => ProposalVotes) private _proposalVotes;
    uint256[] private _participationHistory;
    
    uint256 public constant MAX_HISTORY_LENGTH = 20;
    uint256 public constant QUORUM_FLOOR_BPS = 500;    // 5%
    uint256 public constant QUORUM_CEILING_BPS = 2000; // 20%
    uint256 public constant PARTICIPATION_WEIGHT = 7000; // 70%
    
    event QuorumCalculated(
        uint256 proposalId,
        uint256 requiredQuorum,
        uint256 actualParticipation
    );
    
    function quorum(uint256 blockNumber) public view virtual returns (uint256) {
        uint256 totalSupply = token.totalSupply();
        
        // Get recent average participation
        uint256 avgParticipation = _calculateAverageParticipation();
        
        // Dynamic quorum = 70% of recent average
        uint256 dynamicQuorum = (avgParticipation * PARTICIPATION_WEIGHT) / 10000;
        
        // Apply floor and ceiling
        uint256 floor = (totalSupply * QUORUM_FLOOR_BPS) / 10000;
        uint256 ceiling = (totalSupply * QUORUM_CEILING_BPS) / 10000;
        
        if (dynamicQuorum < floor) return floor;
        if (dynamicQuorum > ceiling) return ceiling;
        return dynamicQuorum;
    }
    
    function _calculateAverageParticipation() internal view returns (uint256) {
        if (_participationHistory.length == 0) {
            // No history, return floor
            return (token.totalSupply() * QUORUM_FLOOR_BPS) / 10000;
        }
        
        uint256 sum = 0;
        uint256 count = _participationHistory.length > MAX_HISTORY_LENGTH
            ? MAX_HISTORY_LENGTH
            : _participationHistory.length;
        
        for (uint256 i = 0; i < count; i++) {
            sum += _participationHistory[_participationHistory.length - 1 - i];
        }
        
        return sum / count;
    }
    
    function _recordParticipation(uint256 proposalId) internal {
        ProposalVotes memory votes = _proposalVotes[proposalId];
        uint256 participation = votes.forVotes + votes.againstVotes + votes.abstainVotes;
        
        _participationHistory.push(participation);
        
        // Keep history bounded
        if (_participationHistory.length > MAX_HISTORY_LENGTH + 5) {
            // Remove oldest entries
            for (uint256 i = 0; i < 5; i++) {
                _participationHistory[i] = _participationHistory[i + 5];
            }
            // Shorten array
            assembly {
                mstore(_participationHistory.slot, sub(mload(_participationHistory.slot), 5))
            }
        }
        
        emit QuorumCalculated(
            proposalId,
            quorum(block.number),
            participation
        );
    }
    
    function getParticipationHistory() external view returns (uint256[] memory) {
        return _participationHistory;
    }
}
```

**Trade-offs:**
- ➕ Adapts to community engagement
- ➕ Prevents low-participation gaming
- ➕ More fair than fixed quorum
- ➖ More complex
- ➖ Requires historical data
- ➖ Can be manipulated over time

**Effectiveness:**
```
Attack Type        | Prevention | Mitigation | Overall
-------------------|------------|------------|----------
Flash Loan         | ❌ 0%       | ⚠️ 20%      | ⚠️ 10%
Whale              | ❌ 0%       | ⚠️ 30%      | ⚠️ 15%
Proposal Spam      | ❌ 0%       | ⚠️ 10%      | ⚠️ 5%
Quorum Manip       | ✅ 85%      | ⚠️ 50%      | ✅ 70%
Timelock Exploit   | ❌ 0%       | ❌ 0%       | ❌ 0%
```

---

### Mechanism 3.3: Supermajority Requirements

**Description:**  
Require more than simple majority (>50%) for proposal passage. Critical proposals might need 60%, 67%, or even 75% approval.

**Parameters:**
```solidity
enum ProposalType {
    Standard,    // Simple majority (>50%)
    Important,   // 60% required
    Critical,    // 67% (2/3) required
    Constitutional // 75% (3/4) required
}

mapping(uint256 => ProposalType) public proposalTypes;
```

**How It Works:**
```
Total Votes: 100,000
FOR: 55,000
AGAINST: 45,000

Simple Majority (>50%):
├─ 55,000 / 100,000 = 55%
└─ ✅ Passes (55% > 50%)

Supermajority (60%):
├─ 55,000 / 100,000 = 55%
└─ ❌ Fails (55% < 60%)

Supermajority (67%):
├─ Need: 67,000 FOR votes
└─ ❌ Fails (55,000 < 67,000)
```

**Proposal Type Classification:**
```solidity
function _classifyProposal(
    address[] memory targets,
    bytes[] memory calldatas
) internal pure returns (ProposalType) {
    for (uint256 i = 0; i < targets.length; i++) {
        bytes4 selector = bytes4(calldatas[i]);
        
        // Critical: Treasury transfers > 10%
        if (selector == IERC20.transfer.selector) {
            (, uint256 amount) = abi.decode(calldatas[i][4:], (address, uint256));
            if (amount > TREASURY_BALANCE / 10) {
                return ProposalType.Critical;
            }
        }
        
        // Critical: Contract upgrades
        if (selector == IUpgradeable.upgradeTo.selector) {
            return ProposalType.Critical;
        }
        
        // Important: Parameter changes
        if (selector == IGovernor.setVotingDelay.selector ||
            selector == IGovernor.setVotingPeriod.selector) {
            return ProposalType.Important;
        }
    }
    
    return ProposalType.Standard;
}
```

**Implementation:**
```solidity
function _voteSucceeded(uint256 proposalId)
    internal
    view
    virtual
    returns (bool)
{
    ProposalVotes memory votes = _proposalVotes[proposalId];
    ProposalType pType = proposalTypes[proposalId];
    
    uint256 totalVotes = votes.forVotes + votes.againstVotes;
    if (totalVotes == 0) return false;
    
    uint256 requiredPercentage;
    
    if (pType == ProposalType.Constitutional) {
        requiredPercentage = 75; // 3/4
    } else if (pType == ProposalType.Critical) {
        requiredPercentage = 67; // 2/3
    } else if (pType == ProposalType.Important) {
        requiredPercentage = 60;
    } else {
        requiredPercentage = 50;
    }
    
    return (votes.forVotes * 100) / totalVotes > requiredPercentage;
}
```

**Real-World Examples:**
```
Protocol         | Proposal Type        | Requirement
-----------------|----------------------|-------------
MakerDAO         | Standard governance  | >50%
MakerDAO         | Emergency shutdown   | Executive vote
Compound         | Standard proposal    | >50%
Uniswap          | Standard             | >50%
Uniswap          | Treasury (large)     | Custom threshold
ENS              | Constitutional       | 67%
```

**Trade-offs:**
- ➕ Higher security for critical actions
- ➕ Better consensus requirement
- ➕ Reduces whale single-handed control
- ➖ Harder to pass any proposal
- ➖ Can cause governance gridlock
- ➖ May favor status quo too much

**Effectiveness:**
```
Attack Type        | Prevention | Mitigation | Overall
-------------------|------------|------------|----------
Flash Loan         | ❌ 0%       | ⚠️ 30%      | ⚠️ 15%
Whale (51%)        | ✅ 100%     | N/A        | ✅ 100%
Whale (67%)        | ⚠️ 50%      | ⚠️ 30%      | ⚠️ 40%
Whale (75%)        | ❌ 0%       | ⚠️ 20%      | ⚠️ 10%
Proposal Spam      | ❌ 0%       | ⚠️ 20%      | ⚠️ 10%
Quorum Manip       | ⚠️ 40%      | ⚠️ 30%      | ⚠️ 35%
```

---

### Threshold & Quorum Defense Summary

**Combined Effectiveness:**
```
Configuration:
- Proposal Threshold: 1% of supply
- Dynamic Quorum: 70% of avg participation + 5% floor
- Supermajority: 60% for important, 67% for critical

Results:
- Spam prevention: ✅ 95%
- Quorum gaming prevention: ✅ 70%
- Whale with 51% voting power: ✅ Blocked on critical proposals
- Whale with 67% voting power: ⚠️ Can pass most proposals
- Overall governance health: Much improved
```

---

## Defense Layer 4: Structural Control Defenses

### Overview

Structural controls are "last resort" mechanisms that add human oversight or emergency powers. These sacrifice some decentralization for security.

### Mechanism 4.1: Multi-sig Treasury

**Description:**  
Instead of governance directly controlling treasury, use a multi-signature wallet requiring M-of-N signatures for transfers.

**Parameters:**
```solidity
uint256 public requiredSignatures; // M
address[] public signers; // N total signers
```

**Models:**

**Model A: Full Multi-sig**
```
Governance can ONLY propose
Multi-sig must execute

Flow:
Proposal Passed → Queued in Timelock → Multi-sig reviews → 3-of-5 approve → Execute
```

**Model B: Hybrid (Recommended)**
```
Small transfers (<1%): Governance executes directly
Large transfers (>1%): Requires multi-sig approval

Flow for small:
Proposal → Vote → Timelock → Execute

Flow for large:
Proposal → Vote → Timelock → Multi-sig must co-sign → Execute
```

**Model C: Override**
```
Governance normally executes
Multi-sig can veto within 48 hours

Flow:
Proposal → Execute → 48h window → Multi-sig can cancel → Funds safe
```

**Implementation:**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MultiSigTreasury {
    uint256 public required;
    address[] public owners;
    
    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 numConfirmations;
    }
    
    mapping(uint256 => Transaction) public transactions;
    mapping(uint256 => mapping(address => bool)) public isConfirmed;
    uint256 public transactionCount;
    
    address public governance; // Can propose but not execute alone
    
    modifier onlyGovernance() {
        require(msg.sender == governance, "Only governance");
        _;
    }
    
    modifier onlyOwner() {
        bool isOwner = false;
        for (uint256 i = 0; i < owners.length; i++) {
            if (owners[i] == msg.sender) {
                isOwner = true;
                break;
            }
        }
        require(isOwner, "Only owner");
        _;
    }
    
    constructor(address[] memory _owners, uint256 _required, address _governance) {
        require(_owners.length > 0, "Owners required");
        require(_required > 0 && _required <= _owners.length, "Invalid required");
        
        owners = _owners;
        required = _required;
        governance = _governance;
    }
    
    // Governance proposes transaction
    function propose(
        address to,
        uint256 value,
        bytes memory data
    ) external onlyGovernance returns (uint256) {
        uint256 txIndex = transactionCount;
        
        transactions[txIndex] = Transaction({
            to: to,
            value: value,
            data: data,
            executed: false,
            numConfirmations: 0
        });
        
        transactionCount++;
        
        return txIndex;
    }
    
    // Multi-sig owners confirm
    function confirmTransaction(uint256 txIndex) external onlyOwner {
        require(txIndex < transactionCount, "Invalid transaction");
        require(!isConfirmed[txIndex][msg.sender], "Already confirmed");
        require(!transactions[txIndex].executed, "Already executed");
        
        isConfirmed[txIndex][msg.sender] = true;
        transactions[txIndex].numConfirmations++;
        
        // Auto-execute if enough confirmations
        if (transactions[txIndex].numConfirmations >= required) {
            _executeTransaction(txIndex);
        }
    }
    
    function _executeTransaction(uint256 txIndex) internal {
        Transaction storage transaction = transactions[txIndex];
        
        require(!transaction.executed, "Already executed");
        require(
            transaction.numConfirmations >= required,
            "Not enough confirmations"
        );
        
        transaction.executed = true;
        
        (bool success, ) = transaction.to.call{value: transaction.value}(
            transaction.data
        );
        require(success, "Transaction failed");
    }
    
    function revokeConfirmation(uint256 txIndex) external onlyOwner {
        require(txIndex < transactionCount, "Invalid transaction");
        require(isConfirmed[txIndex][msg.sender], "Not confirmed");
        require(!transactions[txIndex].executed, "Already executed");
        
        isConfirmed[txIndex][msg.sender] = false;
        transactions[txIndex].numConfirmations--;
    }
}
```

**Trade-offs:**
- ➕ **Strongest** defense against treasury drain
- ➕ Human review of critical actions
- ➕ Can block malicious proposals
- ➖ Centralization (trusted signers)
- ➖ Single point of failure (if signers collude)
- ➖ Slower execution

**Effectiveness:**
```
Attack Type        | Prevention | Mitigation | Overall
-------------------|------------|------------|----------
Flash Loan         | ✅ 100%     | N/A        | ✅ 100%
Whale              | ✅ 100%     | N/A        | ✅ 100%
Proposal Spam      | ⚠️ 50%      | ⚠️ 50%      | ⚠️ 50%
Quorum Manip       | ✅ 90%      | ⚠️ 50%      | ✅ 75%
Timelock Exploit   | ✅ 80%      | ⚠️ 60%      | ✅ 70%
```

---

### Mechanism 4.2: Guardian Role

**Description:**  
Designated address(es) with special powers to pause, cancel, or veto proposals in emergencies.

**Powers:**
```solidity
interface IGuardian {
    function cancelProposal(uint256 proposalId) external; // Cancel active proposal
    function pause() external; // Pause all governance
    function unpause() external; // Resume governance
    function vetoExecution(uint256 proposalId) external; // Block execution
}
```

**Implementation:**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

abstract contract GovernorWithGuardian {
    address public guardian;
    bool public paused;
    
    mapping(uint256 => bool) public vetoed;
    
    event GuardianCanceled(uint256 proposalId, string reason);
    event GuardianVetoed(uint256 proposalId);
    event Paused(address guardian);
    event Unpaused(address guardian);
    
    modifier onlyGuardian() {
        require(msg.sender == guardian, "Only guardian");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Governance paused");
        _;
    }
    
    constructor(address _guardian) {
        guardian = _guardian;
    }
    
    function cancelProposal(uint256 proposalId, string memory reason)
        external
        onlyGuardian
    {
        ProposalState status = state(proposalId);
        require(
            status != ProposalState.Executed &&
            status != ProposalState.Canceled,
            "Invalid state"
        );
        
        _cancel(proposalId);
        
        emit GuardianCanceled(proposalId, reason);
    }
    
    function vetoExecution(uint256 proposalId) external onlyGuardian {
        require(
            state(proposalId) == ProposalState.Queued,
            "Not queued"
        );
        
        vetoed[proposalId] = true;
        
        emit GuardianVetoed(proposalId);
    }
    
    function pause() external onlyGuardian {
        paused = true;
        emit Paused(msg.sender);
    }
    
    function unpause() external onlyGuardian {
        paused = false;
        emit Unpaused(msg.sender);
    }
    
    // Update governance functions to check guardian veto
    function execute(uint256 proposalId) external payable whenNotPaused {
        require(!vetoed[proposalId], "Vetoed by guardian");
        _execute(proposalId);
    }
    
    // Renounce guardian (path to decentralization)
    function renounceGuardian() external onlyGuardian {
        guardian = address(0);
    }
}
```

**Use Cases:**
```
Legitimate Guardian Actions:
1. Cancel proposal with discovered critical bug
2. Pause governance during active exploit
3. Veto execution of clearly malicious proposal
4. Emergency response to unforeseen circumstances

Guardian Abuse Risks:
1. Cancel legitimate community proposals
2. Maintain permanent control over governance
3. Threaten to pause to influence votes
4. Become new centralized authority
```

**Guardian Selection Options:**
```
Option A: Multi-sig Committee
- 5-9 trusted community members
- Requires 3-of-5 or 5-of-9 to act
- Reduces individual power

Option B: DAO Treasury Multi-sig
- Same signers as treasury
- Unified trust assumption
- Streamlined operations

Option C: Timebound Guardian
- Guardian powers expire after 1-2 years
- Forces transition to full decentralization
- Balances security and decentralization

Option D: Limited Guardian
- Can only pause, not cancel
- Can veto but not execute
- Minimal discretion
```

**Trade-offs:**
- ➕ Emergency response capability
- ➕ Can prevent catastrophic attacks
- ➕ Flexible (can be renounced later)
- ➖ **Centralization** (defeats purpose of DAO)
- ➖ Requires trust in guardian
- ➖ Risk of guardian abuse

**Effectiveness:**
```
Attack Type        | Prevention | Mitigation | Overall
-------------------|------------|------------|----------
Flash Loan         | ✅ 90%      | ✅ 95%      | ✅ 92%
Whale              | ✅ 90%      | ✅ 95%      | ✅ 92%
Proposal Spam      | ✅ 80%      | ✅ 90%      | ✅ 85%
Quorum Manip       | ✅ 85%      | ✅ 90%      | ✅ 87%
Timelock Exploit   | ✅ 95%      | ✅ 95%      | ✅ 95%
```

---

### Mechanism 4.3: Emergency Pause

**Description:**  
Circuit breaker that halts all governance actions during active attacks or critical bugs.

**Implementation:**
```solidity
abstract contract Pausable {
    bool private _paused;
    
    event Paused(address account);
    event Unpaused(address account);
    
    constructor() {
        _paused = false;
    }
    
    modifier whenNotPaused() {
        require(!_paused, "Pausable: paused");
        _;
    }
    
    modifier whenPaused() {
        require(_paused, "Pausable: not paused");
        _;
    }
    
    function paused() public view returns (bool) {
        return _paused;
    }
    
    function _pause() internal virtual whenNotPaused {
        _paused = true;
        emit Paused(msg.sender);
    }
    
    function _unpause() internal virtual whenPaused {
        _paused = false;
        emit Unpaused(msg.sender);
    }
}

// Apply to governance
contract GovernorPausable is Pausable {
    function propose(...) external whenNotPaused returns (uint256) {
        // Proposal creation blocked when paused
    }
    
    function castVote(...) external whenNotPaused {
        // Voting blocked when paused
    }
    
    function execute(...) external whenNotPaused {
        // Execution blocked when paused
    }
}
```

**Use Cases:**
```
Emergency Scenarios:
1. ⚠️ Active flash loan attack detected
2. ⚠️ Critical bug discovered in governance contract
3. ⚠️ Ongoing proposal spam flood
4. ⚠️ Whale attempting hostile takeover
5. ⚠️ Timelock exploit in progress

Pause Duration:
- Immediate: Pause on detection
- Investigation: 24-72 hours
- Fix: Deploy patch or cancel malicious proposals
- Unpause: Resume when safe
```

**Trade-offs:**
- ➕ Immediate attack response
- ➕ Buys time for investigation
- ➕ Prevents ongoing damage
- ➖ Halts ALL governance (including legitimate)
- ➖ Requires trusted party to trigger
- ➖ Can be abused to prevent good proposals

---

### Structural Control Defense Summary

**Decentralization vs Security Trade-off:**
```
┌─────────────────────────────────────────────────────────────┐
│         Decentralization ←──────────→ Security              │
└─────────────────────────────────────────────────────────────┘

Full Decentralization:
├─ No multi-sig, no guardian, no pause
├─ Governance is supreme authority
├─ Maximum trust minimization
└─ ⚠️ Vulnerable to attacks

Balanced (Recommended):
├─ Multi-sig for large treasury transfers only
├─ Time-bound guardian (expires in 2 years)
├─ Pause available but requires multi-sig to trigger
└─ ✅ Good balance of security and decentralization

Full Centralization:
├─ Multi-sig controls everything
├─ Guardian can cancel any proposal
├─ Pause can be triggered unilaterally
└─ ❌ Not really a DAO anymore
```

**Recommended Progressive Decentralization:**
```
Phase 1 (Months 0-6): High Security
- Active guardian (multi-sig 3-of-5)
- Multi-sig treasury control
- Pause mechanism available
- Focus: Prevent catastrophic failures

Phase 2 (Months 6-18): Moderate Security
- Guardian powers reduced (veto only, no cancel)
- Multi-sig only for >10% treasury transfers
- Pause requires 4-of-5 multi-sig
- Focus: Maintain safety while decentralizing

Phase 3 (Months 18-24): High Decentralization
- Guardian role transparent and procedural
- Multi-sig only for >25% treasury transfers
- Pause requires governance vote
- Focus: Community sovereignty

Phase 4 (Months 24+): Full Decentralization
- Guardian renounced or requires governance to act
- Multi-sig significantly reduced role
- Pause only via emergency governance
- Focus: Trustless operation
```

---

## Defense Comparison Matrix

### Effectiveness by Attack Type

| Defense ↓ / Attack → | Flash Loan | Whale | Spam | Quorum | Timelock |
|---------------------|------------|-------|------|--------|----------|
| **Layer 1: Time-Based** |
| Voting Delay* | ✅ 100% | ⚠️ 30% | ❌ 0% | ⚠️ 20% | ❌ 0% |
| Voting Period | ✅ 90% | ⚠️ 40% | ⚠️ 20% | ⚠️ 50% | ❌ 0% |
| Timelock | ✅ 100% | ⚠️ 60% | ❌ 0% | ⚠️ 40% | N/A |
| **Layer 2: Token-Based** |
| Snapshot Voting | ✅ 100% | ❌ 0% | ❌ 0% | ⚠️ 40% | ❌ 0% |
| Vote Escrow | ✅ 100% | ⚠️ 30% | ⚠️ 30% | ⚠️ 40% | ❌ 0% |
| Delegation | ❌ 0% | ⚠️ 35% | ⚠️ 10% | ⚠️ 35% | ❌ 0% |
| **Layer 3: Threshold & Quorum** |
| Proposal Threshold | ⚠️ 35% | ❌ 0% | ✅ 95% | ⚠️ 15% | ❌ 0% |
| Dynamic Quorum | ⚠️ 10% | ⚠️ 15% | ⚠️ 5% | ✅ 70% | ❌ 0% |
| Supermajority | ⚠️ 15% | ✅ 100%* | ⚠️ 10% | ⚠️ 35% | ❌ 0% |
| **Layer 4: Structural** |
| Multi-sig Treasury | ✅ 100% | ✅ 100% | ⚠️ 50% | ✅ 75% | ✅ 70% |
| Guardian | ✅ 92% | ✅ 92% | ✅ 85% | ✅ 87% | ✅ 95% |
| Emergency Pause | ✅ 95% | ✅ 90% | ✅ 80% | ✅ 85% | ✅ 90% |

**Legend:**
- ✅ Highly effective (>75%)
- ⚠️ Partially effective (25-75%)
- ❌ Not effective (<25%)
- * = Conditional on parameters

### Defense Combinations

**Minimum Viable Defense (Budget DAO):**
```solidity
contract MinimalGovernor {
    uint256 votingDelay = 1 days;        // Blocks flash loans
    uint256 votingPeriod = 3 days;       // Reasonable participation time
    uint256 timelockDelay = 24 hours;    // Minimum protection
    
    ERC20Votes token;                     // Snapshot voting
    
    uint256 proposalThreshold = 1%;       // Prevent spam
    uint256 quorum = 4%;                  // Fixed quorum
    
    // No multi-sig, no guardian, no pause
    // Decentralized but vulnerable
}

Effectiveness:
- Flash Loan: ✅ 100% (time + snapshot)
- Whale: ⚠️ 35% (minimal mitigation)
- Spam: ✅ 95% (threshold)
- Quorum: ⚠️ 25% (fixed quorum weak)
- Timelock Exploit: ⚠️ 30% (short delay)

Overall: 58% avg effectiveness
Risk Level: Medium-High
```

**Recommended Defense (Standard DAO):**
```solidity
contract StandardGovernor {
    // Layer 1: Strong time-based defenses
    uint256 votingDelay = 2 days;
    uint256 votingPeriod = 7 days;
    uint256 timelockDelay = 48 hours;
    
    // Layer 2: Token defenses
    ERC20Votes token;                     // Snapshot
    VoteEscrow veToken;                   // Optional: For alignment
    // Delegation built-in
    
    // Layer 3: Adaptive thresholds
    uint256 proposalThreshold = 1%;
    DynamicQuorum quorum;                 // Adaptive quorum
    mapping(uint256 => uint256) supermajorityThresholds;
    
    // Layer 4: Light structural controls
    MultiSigTreasury treasury;            // For large transfers
    address guardian;                     // Time-bound (2 years)
    bool pausable;                        // Multi-sig can pause
}

Effectiveness:
- Flash Loan: ✅ 100%
- Whale: ⚠️ 60%
- Spam: ✅ 95%
- Quorum: ✅ 75%
- Timelock Exploit: ✅ 70%

Overall: 80% avg effectiveness
Risk Level: Low-Medium
Decentralization: High
```

**Maximum Security (High-Value DAO):**
```solidity
contract MaxSecurityGovernor {
    // Layer 1: Maximum delays
    uint256 votingDelay = 3 days;
    uint256 votingPeriod = 14 days;
    uint256 timelockDelay = 7 days;
    
    // Layer 2: All token defenses
    ERC20Votes token;
    VoteEscrow veToken;                   // Required 4-year max lock
    DelegationRegistry registry;          // Enhanced delegation
    
    // Layer 3: Strict requirements
    uint256 proposalThreshold = 2%;       // High threshold
    DynamicQuorum quorum;                 // With 10% floor
    SupermajorityPolicy policy;           // 67% for most actions
    
    // Layer 4: Full structural controls
    MultiSigTreasury treasury;            // All transfers
    address guardian;                     // 5-of-9 multi-sig
    PausableGovernance pause;             // Available but requires 4-of-9
}

Effectiveness:
- Flash Loan: ✅ 100%
- Whale: ✅ 80%
- Spam: ✅ 98%
- Quorum: ✅ 85%
- Timelock Exploit: ✅ 90%

Overall: 91% avg effectiveness
Risk Level: Very Low
Decentralization: Medium
Trade-off: Slower, more complex governance
```

---

## Implementation Architecture

### Contract Structure

```
GovernorWithDefenses
├─ Inherits:
│  ├─ Governor (OpenZeppelin base)
│  ├─ GovernorSettings (configurable parameters)
│  ├─ GovernorCountingSimple (vote counting)
│  ├─ GovernorVotes (token-based voting)
│  ├─ GovernorVotesQuorumFraction (dynamic quorum)
│  ├─ GovernorTimelockControl (timelock integration)
│  └─ GovernorWithGuardian (custom guardian extension)
│
├─ Components:
│  ├─ GovernanceToken (ERC20Votes)
│  │  ├─ Snapshot checkpoints
│  │  ├─ Delegation system
│  │  └─ Transfer hooks
│  │
│  ├─ Timelock (TimelockController)
│  │  ├─ Queue management
│  │  ├─ Delay enforcement
│  │  └─ Execution control
│  │
│  ├─ VoteEscrow (Optional)
│  │  ├─ Lock management
│  │  ├─ Power calculation
│  │  └─ Decay mechanics
│  │
│  ├─ MultiSigTreasury
│  │  ├─ Signature collection
│  │  ├─ Transaction execution
│  │  └─ Governance integration
│  │
│  └─ Guardian (Multi-sig or EOA)
│     ├─ Cancel power
│     ├─ Veto power
│     └─ Pause power
│
└─ Defense System:
   ├─ Layer 1: Time-Based
   ├─ Layer 2: Token-Based
   ├─ Layer 3: Threshold & Quorum
   └─ Layer 4: Structural Controls
```

### Deployment Sequence

```solidity
1. Deploy GovernanceToken
   ├─ Mint initial supply
   ├─ Distribute to DAO members
   └─ Enable delegation

2. Deploy VoteEscrow (optional)
   ├─ Link to GovernanceToken
   └─ Set max lock period

3. Deploy Timelock
   ├─ Set minimum delay (48 hours)
   ├─ Set initial admin (deployer temporarily)
   └─ Prepare for governance control

4. Deploy MultiSigTreasury
   ├─ Set signers (community leaders)
   ├─ Set threshold (3-of-5)
   └─ Set governance address (pending)

5. Deploy Governor
   ├─ Set votingDelay (2 days)
   ├─ Set votingPeriod (7 days)
   ├─ Set proposalThreshold (1%)
   ├─ Link to GovernanceToken
   ├─ Link to Timelock
   └─ Set guardian (multi-sig)

6. Transfer Control
   ├─ Timelock.admin = Governor
   ├─ MultiSigTreasury.governance = Governor
   ├─ Governor starts managing itself
   └─ Deployer renounces remaining powers

7. Initial Governance
   ├─ Community reviews configuration
   ├─ Test proposals
   └─ Adjust parameters via governance if needed
```

---

## Testing Requirements

### Unit Tests

Each defense mechanism must have:

**Layer 1 (Time-Based):**
```solidity
test_votingDelay_preventsFlashLoan()
test_votingDelay_allowsVotingAfterDelay()
test_votingPeriod_acceptsVotesDuringPeriod()
test_votingPeriod_rejectsVotesAfterPeriod()
test_timelock_queuesProposal()
test_timelock_enforcesDelay()
test_timelock_executesAfterDelay()
test_timelock_rejectsEarlyExecution()
```

**Layer 2 (Token-Based):**
```solidity
test_snapshot_usesHistoricalBalance()
test_snapshot_ignoresCurrentBalance()
test_snapshot_blocksFlashLoanVoting()
test_voteEscrow_calculatesCorrectPower()
test_voteEscrow_decaysOverTime()
test_voteEscrow_preventsEarlyWithdrawal()
test_delegation_transfersVotingPower()
test_delegation_preservesTokenOwnership()
```

**Layer 3 (Threshold & Quorum):**
```solidity
test_proposalThreshold_blocksLowBalance()
test_proposalThreshold_allowsSufficientBalance()
test_dynamicQuorum_adaptsToParticipation()
test_dynamicQuorum_hasFloor()
test_dynamicQuorum_hasCeiling()
test_supermajority_requires60Percent()
test_supermajority_requires67Percent()
```

**Layer 4 (Structural):**
```solidity
test_multiSig_requiresMinimumSignatures()
test_multiSig_executesWithSufficientSigs()
test_guardian_canCancelProposal()
test_guardian_canVetoExecution()
test_guardian_canPauseGovernance()
test_pause_blocksAllGovernanceActions()
```

### Integration Tests

**Full Attack Simulations:**
```solidity
test_flashLoanAttack_fullFlow()
├─ Deploy attack contract
├─ Attempt flash loan governance takeover
├─ Verify all defenses block attack
└─ Measure gas costs

test_whaleAttack_fullFlow()
├─ Set up whale with 60% tokens
├─ Whale creates self-serving proposal
├─ Verify supermajority blocks whale
└─ Test exit mechanisms

test_spamAttack_fullFlow()
├─ Attempt to create 100 proposals
├─ Verify proposal threshold blocks spam
└─ Measure cost of spam

test_quorumManipulation_fullFlow()
├─ Create Sybil accounts
├─ Attempt low-participation exploit
├─ Verify dynamic quorum adapts
└─ Test detection mechanisms

test_timelockExploit_fullFlow()
├─ Attempt emergency bypass
├─ Attempt front-running
├─ Verify multi-sig blocks exploitation
└─ Test guardian intervention
```

### Scenario Tests

**Progressive Defense Layers:**
```solidity
test_defenseLayer1Only()
├─ Enable only time-based defenses
├─ Run all attacks
├─ Measure effectiveness
└─ Document vulnerabilities

test_defenseLayers1and2()
├─ Add token-based defenses
├─ Run all attacks
├─ Compare effectiveness improvement
└─ Measure gas overhead

test_defenseLayers1through3()
├─ Add threshold defenses
├─ Run all attacks
├─ Evaluate governance usability
└─ Analyze trade-offs

test_allDefenseLayers()
├─ Enable all defenses
├─ Run comprehensive attack suite
├─ Verify maximum protection
└─ Document costs and complexity
```

---

## Security Analysis

### Defense Strength Analysis

**Attack Success Probability by Configuration:**

```
Configuration: No Defenses (Vulnerable)
┌──────────────┬─────────────┬────────────┐
│ Attack Type  │ Success %   │ Expected $ │
├──────────────┼─────────────┼────────────┤
│ Flash Loan   │ 95%         │ $100k+     │
│ Whale        │ 85%         │ Varies     │
│ Spam         │ 90%         │ Low        │
│ Quorum       │ 75%         │ $50k+      │
│ Timelock     │ 60%         │ $100k+     │
└──────────────┴─────────────┴────────────┘

Configuration: Minimal (Budget)
┌──────────────┬─────────────┬────────────┐
│ Flash Loan   │ 0%          │ $0         │
│ Whale        │ 70%         │ Varies     │
│ Spam         │ 5%          │ Low        │
│ Quorum       │ 60%         │ $40k+      │
│ Timelock     │ 50%         │ $80k+      │
└──────────────┴─────────────┴────────────┘

Configuration: Standard (Recommended)
┌──────────────┬─────────────┬────────────┐
│ Flash Loan   │ 0%          │ $0         │
│ Whale        │ 35%         │ Reduced    │
│ Spam         │ 2%          │ Minimal    │
│ Quorum       │ 20%         │ $20k+      │
│ Timelock     │ 25%         │ $40k+      │
└──────────────┴─────────────┴────────────┘

Configuration: Maximum (High Security)
┌──────────────┬─────────────┬────────────┐
│ Flash Loan   │ 0%          │ $0         │
│ Whale        │ 15%         │ Minimal    │
│ Spam         │ 0%          │ $0         │
│ Quorum       │ 10%         │ $10k+      │
│ Timelock     │ 5%          │ $5k+       │
└──────────────┴─────────────┴────────────┘
```

### Cost-Benefit Analysis

**Gas Costs:**
```
Defense Mechanism     | Gas Overhead      | One-Time Setup
----------------------|-------------------|------------------
Voting Delay          | 0 (built-in)      | 0
Voting Period         | 0 (built-in)      | 0
Timelock              | +50k per proposal | 2M (deploy)
Snapshot Voting       | +5k per transfer  | Built into ERC20Votes
Vote Escrow           | +100k per lock    | 3M (deploy)
Dynamic Quorum        | +10k per proposal | Included
Multi-sig Treasury    | +150k per tx      | 2M (deploy)
Guardian              | +20k per action   | Minimal
```

**Usability Impact:**
```
Defense Level | Proposal Time | User Friction | Participation
--------------|---------------|---------------|---------------
None          | Instant       | None          | Low (risky)
Minimal       | 4-5 days      | Low           | Medium
Standard      | 11-12 days    | Medium        | High
Maximum       | 24+ days      | High          | Medium-High
```

### Recommendations by DAO Size

**Small DAO (<$1M TVL):**
```
Recommended: Minimal Defense
- Voting delay: 1 day
- Voting period: 3 days
- Timelock: 24 hours
- Snapshot voting: Yes
- Proposal threshold: 1%
- Fixed quorum: 4%
- Multi-sig: No (or only for treasury)
- Guardian: No

Rationale: Low attack incentive, prioritize usability
```

**Medium DAO ($1M-$50M TVL):**
```
Recommended: Standard Defense
- Voting delay: 2 days
- Voting period: 7 days
- Timelock: 48 hours
- Snapshot voting: Yes
- Vote escrow: Optional
- Proposal threshold: 1%
- Dynamic quorum: Yes
- Supermajority: 60% for important
- Multi-sig treasury: Large transfers only
- Guardian: Time-bound (2 years)

Rationale: Balanced security and usability
```

**Large DAO (>$50M TVL):**
```
Recommended: Maximum Defense
- Voting delay: 3 days
- Voting period: 14 days
- Timelock: 7 days
- Snapshot voting: Yes
- Vote escrow: Recommended (4-year max)
- Proposal threshold: 2%
- Dynamic quorum: Yes (10% floor)
- Supermajority: 67% for critical
- Multi-sig treasury: All transfers
- Guardian: 5-of-9 multi-sig

Rationale: High-value target requires maximum protection
```

---

## Conclusion

Defense-in-depth is critical for secure DAO governance. No single mechanism is sufficient—multiple layers working together provide robust protection while maintaining decentralization and usability.

**Key Principles:**
1. ✅ **Layer defenses**: Multiple independent protections
2. ✅ **Balance trade-offs**: Security vs usability vs decentralization
3. ✅ **Progressive decentralization**: Start secure, gradually remove training wheels
4. ✅ **Continuous monitoring**: Detect attacks and adapt
5. ✅ **Community engagement**: Education and participation are defenses too

---

**End of Defense Mechanisms Specification**