# Governance System Specification

**Project:** On-Chain Governance Attack Simulation  
**Version:** 1.0  
**Last Updated:** 2026-02-13  
**Author:** Student 1 - Spec, Architecture & Core Governance Lead  

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Core Components](#core-components)
4. [Governance Token (GovernanceToken.sol)](#governance-token)
5. [Timelock Controller (Timelock.sol)](#timelock-controller)
6. [Governor Base (GovernorBase.sol)](#governor-base)
7. [Governor Vulnerable (GovernorVulnerable.sol)](#governor-vulnerable)
8. [Governor With Defenses (GovernorWithDefenses.sol)](#governor-with-defenses)
9. [Proposal Lifecycle](#proposal-lifecycle)
10. [Voting Mechanisms](#voting-mechanisms)
11. [Security Considerations](#security-considerations)
12. [Integration Points](#integration-points)

---

## Overview

### Purpose

This specification defines the governance system for a DAO (Decentralized Autonomous Organization) designed to demonstrate and analyze various attack vectors and defense mechanisms. The system implements three governance variants:

1. **GovernorBase** - Core governance logic with standard features
2. **GovernorVulnerable** - Intentionally exploitable version for attack demonstrations
3. **GovernorWithDefenses** - Hardened version with comprehensive security measures

### Design Goals

- **Educational**: Clearly demonstrate vulnerabilities and mitigations
- **Realistic**: Model real-world DAO governance patterns
- **Testable**: Enable comprehensive attack simulations
- **Modular**: Support multiple defense configurations
- **Gas-Efficient**: Optimize for reasonable transaction costs

### Governance Model

The system follows a **token-weighted voting** model inspired by Compound Governor and OpenZeppelin Governor:

- **1 token = 1 vote** (unless modified by defense mechanisms)
- **Delegation support** with checkpoint-based vote tracking
- **Proposal-based governance** with multi-action execution
- **Timelock enforcement** for critical operations
- **Quorum requirements** to ensure sufficient participation

---

## System Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         GOVERNANCE SYSTEM                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐          ┌──────────────────┐
│ GovernanceToken  │◄─────────│   Token Holders  │
│   (ERC20Votes)   │          │  (vote delegation)│
└────────┬─────────┘          └──────────────────┘
         │
         │ provides voting power
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│                         GOVERNOR CONTRACT                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │   GovernorBase   │  │GovernorVulnerable│  │GovernorWith    │ │
│  │                  │  │                  │  │   Defenses     │ │
│  │ • Proposals      │  │ • No timelock    │  │ • Snapshot     │ │
│  │ • Voting         │  │ • No delay       │  │ • Voting delay │ │
│  │ • Execution      │  │ • Low threshold  │  │ • Token lock   │ │
│  │ • Vote tracking  │  │ • Fixed quorum   │  │ • Dynamic Q    │ │
│  └──────────────────┘  └──────────────────┘  └────────────────┘ │
└────────────────┬─────────────────────────────────────────────────┘
                 │
                 │ queues transactions
                 │
                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                      TIMELOCK CONTROLLER                          │
│                                                                    │
│  • 24-48 hour delay before execution                              │
│  • Grace period for user exits                                    │
│  • Transaction queuing and cancellation                           │
│  • Admin role management                                          │
└────────────────┬─────────────────────────────────────────────────┘
                 │
                 │ executes approved transactions
                 │
                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                     TARGET CONTRACTS                              │
│                                                                    │
│  • Treasury (funds management)                                    │
│  • Parameter updates (protocol configuration)                     │
│  • Upgrades (contract modifications)                              │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Token holders** delegate voting power to themselves or others
2. **Proposers** create proposals with executable actions
3. **Voters** cast votes during the voting period
4. **Governance contract** tallies votes and determines outcome
5. **Timelock** enforces delay before execution (if enabled)
6. **Target contracts** execute approved actions

---

## Core Components

### 1. Governance Token (GovernanceToken.sol)

**Type:** ERC20 token with voting extension (ERC20Votes)

**Purpose:** 
- Represent ownership and voting power in the DAO
- Track historical balances for snapshot voting
- Support vote delegation

**Key Features:**
- Fixed or mintable supply (configurable)
- Checkpoint-based vote tracking
- Self-delegation or delegation to others
- Historical balance queries

**Interface:**
```solidity
interface IGovernanceToken {
    // ERC20 standard functions
    function transfer(address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    
    // Voting extensions
    function delegate(address delegatee) external;
    function getCurrentVotes(address account) external view returns (uint256);
    function getPriorVotes(address account, uint256 blockNumber) external view returns (uint256);
    
    // Checkpointing
    function numCheckpoints(address account) external view returns (uint32);
    function checkpoints(address account, uint32 index) external view returns (uint32 fromBlock, uint224 votes);
}
```

---

### 2. Timelock Controller (Timelock.sol)

**Purpose:**
- Enforce time delay between proposal approval and execution
- Provide window for users to exit if malicious proposal passes
- Add human oversight layer

**Parameters:**
- **Minimum Delay:** 1 day (prevents immediate execution)
- **Maximum Delay:** 30 days (prevents indefinite delays)
- **Grace Period:** 14 days (after ETA, before expiration)

**States:**
- **Queued:** Transaction scheduled for future execution
- **Ready:** Past ETA, can be executed
- **Expired:** Past grace period, cannot be executed

**Interface:**
```solidity
interface ITimelock {
    function queueTransaction(
        address target,
        uint256 value,
        string memory signature,
        bytes memory data,
        uint256 eta
    ) external returns (bytes32);
    
    function executeTransaction(
        address target,
        uint256 value,
        string memory signature,
        bytes memory data,
        uint256 eta
    ) external payable returns (bytes memory);
    
    function cancelTransaction(
        address target,
        uint256 value,
        string memory signature,
        bytes memory data,
        uint256 eta
    ) external;
    
    function setDelay(uint256 delay) external;
    function setPendingAdmin(address pendingAdmin) external;
    function acceptAdmin() external;
}
```

---

## Governor Base

### Overview

**GovernorBase.sol** implements the core governance logic shared by all variants. It provides:

- Proposal creation and management
- Voting mechanics (for/against/abstain)
- Vote tallying and quorum checking
- Proposal execution (direct or via timelock)

### Proposal Structure

```solidity
struct Proposal {
    uint256 id;                  // Unique proposal identifier
    address proposer;            // Address that created proposal
    uint256 eta;                 // Estimated time of execution (if queued)
    address[] targets;           // Target contract addresses
    uint256[] values;            // ETH values for each call
    string[] signatures;         // Function signatures
    bytes[] calldatas;           // Encoded function arguments
    uint256 startBlock;          // Voting starts at this block
    uint256 endBlock;            // Voting ends at this block
    uint256 forVotes;            // Total votes in favor
    uint256 againstVotes;        // Total votes against
    uint256 abstainVotes;        // Total abstain votes
    bool canceled;               // Proposal canceled flag
    bool executed;               // Proposal executed flag
    mapping(address => Receipt) receipts;  // Voter receipts
}
```

### Voting Receipt

```solidity
struct Receipt {
    bool hasVoted;      // Whether voter has cast vote
    uint8 support;      // Vote choice: 0=against, 1=for, 2=abstain
    uint256 votes;      // Number of votes cast
}
```

### Configuration Parameters

```solidity
// Governance parameters (values for GovernorBase)
uint256 public votingDelay;              // Blocks between proposal and vote start
uint256 public votingPeriod;             // Blocks for voting duration
uint256 public proposalThresholdBps;     // Basis points of supply needed to propose
uint256 public quorumBps;                // Basis points of supply needed for quorum

// Example values:
// votingDelay = 7200 blocks (~1 day at 12s/block)
// votingPeriod = 50400 blocks (~1 week)
// proposalThresholdBps = 100 (1% of supply)
// quorumBps = 400 (4% of supply)
```

### Key Functions

#### Proposal Creation

```solidity
function propose(
    address[] memory targets,
    uint256[] memory values,
    string[] memory signatures,
    bytes[] memory calldatas,
    string memory description
) public returns (uint256) {
    // Requirements:
    // 1. Proposer has sufficient voting power (>= proposalThreshold)
    // 2. Proposer has no other active proposals
    // 3. Arrays have matching lengths
    // 4. Number of actions <= MAX_ACTIONS (10)
    
    // Calculate proposal ID
    // Set start/end blocks
    // Create proposal struct
    // Emit ProposalCreated event
    
    return proposalId;
}
```

#### Voting

```solidity
function castVote(uint256 proposalId, uint8 support) public {
    // Requirements:
    // 1. Proposal state is Active
    // 2. Voter hasn't voted already
    // 3. support is valid (0, 1, or 2)
    
    // Get voter's voting power at proposal start block
    // Update proposal vote counts
    // Record voter receipt
    // Emit VoteCast event
}

function castVoteWithReason(
    uint256 proposalId,
    uint8 support,
    string memory reason
) public {
    castVote(proposalId, support);
    emit VoteCastWithReason(msg.sender, proposalId, support, reason);
}
```

#### Proposal Queue (with Timelock)

```solidity
function queue(uint256 proposalId) public {
    // Requirements:
    // 1. Proposal state is Succeeded
    
    // Calculate ETA (current time + timelock delay)
    // Queue each action in timelock
    // Update proposal ETA
    // Emit ProposalQueued event
}
```

#### Proposal Execution

```solidity
function execute(uint256 proposalId) public payable {
    // Requirements:
    // 1. Proposal state is Queued (if timelock) or Succeeded (if no timelock)
    
    // Mark proposal as executed
    // Execute each action (direct or via timelock)
    // Emit ProposalExecuted event
}
```

#### Proposal Cancellation

```solidity
function cancel(uint256 proposalId) public {
    // Requirements:
    // 1. Caller is proposer OR proposer's votes < proposal threshold
    // 2. Proposal not already executed
    
    // Mark proposal as canceled
    // Cancel timelock transactions (if queued)
    // Emit ProposalCanceled event
}
```

### Proposal States

```solidity
enum ProposalState {
    Pending,     // Proposal created, voting hasn't started
    Active,      // Voting period is active
    Canceled,    // Proposal was canceled
    Defeated,    // Voting ended, proposal failed (not enough votes or majority against)
    Succeeded,   // Voting ended, proposal passed, ready to queue
    Queued,      // Proposal queued in timelock
    Expired,     // Proposal passed grace period without execution
    Executed     // Proposal was executed
}
```

**State Transitions:**

```
Pending → Active → Defeated (failed)
                → Succeeded → Queued → Executed
                                   → Expired (timeout)
                → Canceled (at any pre-execution state)
```

**State Determination Logic:**

```solidity
function state(uint256 proposalId) public view returns (ProposalState) {
    Proposal storage proposal = proposals[proposalId];
    
    if (proposal.canceled) return ProposalState.Canceled;
    if (proposal.executed) return ProposalState.Executed;
    if (block.number <= proposal.startBlock) return ProposalState.Pending;
    if (block.number <= proposal.endBlock) return ProposalState.Active;
    
    // Check if proposal succeeded
    if (proposal.forVotes <= proposal.againstVotes || 
        proposal.forVotes < quorumVotes()) {
        return ProposalState.Defeated;
    }
    
    if (proposal.eta == 0) return ProposalState.Succeeded;
    
    if (block.timestamp >= proposal.eta + GRACE_PERIOD) {
        return ProposalState.Expired;
    }
    
    return ProposalState.Queued;
}
```

---

## Governor Vulnerable

### Purpose

**GovernorVulnerable.sol** is intentionally designed to be exploitable for educational purposes. It demonstrates common governance vulnerabilities.

### Vulnerabilities

#### 1. No Timelock Protection
```solidity
// Executed immediately after voting ends
// Vulnerable to flash loan attacks
function execute(uint256 proposalId) public payable {
    require(state(proposalId) == ProposalState.Succeeded, "Not succeeded");
    // Direct execution without delay
    _executeActions(proposal);
}
```

**Attack Vector:** Flash loan attack can borrow tokens, vote, execute in single transaction

#### 2. No Voting Delay
```solidity
// Voting starts immediately after proposal creation
votingDelay = 0;  // Same block voting
```

**Attack Vector:** Attacker can buy tokens, propose, and vote immediately

#### 3. Low Proposal Threshold
```solidity
// Very low barrier to create proposals
proposalThresholdBps = 1;  // 0.01% of supply
```

**Attack Vector:** Enables proposal spam attacks

#### 4. Fixed Quorum
```solidity
// Static 4% quorum regardless of participation
function quorumVotes() public view returns (uint256) {
    return (token.totalSupply() * 400) / 10000;  // Always 4%
}
```

**Attack Vector:** Quorum manipulation during low participation

#### 5. No Vote Locking
```solidity
// Voters can transfer tokens during voting period
// No restrictions on token movement
```

**Attack Vector:** Vote buying and token manipulation

---

## Governor With Defenses

### Purpose

**GovernorWithDefenses.sol** implements comprehensive security measures to mitigate known attack vectors.

### Defense Layer 1: Time-Based Protections

#### Voting Delay
```solidity
// Delay between proposal creation and voting start
votingDelay = 7200;  // ~1 day

// Prevents same-block/same-transaction attacks
function propose(...) public returns (uint256) {
    uint256 startBlock = block.number + votingDelay;
    uint256 endBlock = startBlock + votingPeriod;
    // ...
}
```

**Mitigates:** Flash loan attacks, immediate token accumulation

#### Extended Voting Period
```solidity
// Longer window for community participation
votingPeriod = 50400;  // ~7 days

// Increases participation, harder to time low-activity periods
```

**Mitigates:** Quorum manipulation, whale timing attacks

#### Timelock Enforcement
```solidity
// Mandatory delay before execution
bool public constant TIMELOCK_ENABLED = true;

function execute(uint256 proposalId) public payable {
    require(state(proposalId) == ProposalState.Queued, "Must be queued");
    require(block.timestamp >= proposal.eta, "Timelock not expired");
    // ...
}
```

**Mitigates:** Flash loan attacks, provides user exit window

### Defense Layer 2: Token-Based Protections

#### Snapshot Voting
```solidity
// Use historical balance at proposal creation
function castVote(uint256 proposalId, uint8 support) public {
    Proposal storage proposal = proposals[proposalId];
    
    // Vote power from start block, not current
    uint256 votes = token.getPriorVotes(msg.sender, proposal.startBlock - 1);
    
    // Prevents acquiring tokens just to vote
}
```

**Mitigates:** Flash loan voting, last-minute token accumulation

#### Token Locking (Optional Extension)
```solidity
// Lock tokens for duration of voting period
mapping(address => mapping(uint256 => bool)) public voteLocks;

function castVote(uint256 proposalId, uint8 support) public {
    // Lock tokens until voting ends
    voteLocks[msg.sender][proposalId] = true;
    lockTokens(msg.sender, proposal.endBlock);
}
```

**Mitigates:** Vote manipulation via token trading

### Defense Layer 3: Threshold & Quorum Mechanisms

#### Higher Proposal Threshold
```solidity
// Require 1% of supply to create proposals
proposalThresholdBps = 100;  // 1%

function proposalThreshold() public view returns (uint256) {
    return (token.totalSupply() * proposalThresholdBps) / 10000;
}

function propose(...) public returns (uint256) {
    require(
        token.getPriorVotes(msg.sender, block.number - 1) >= proposalThreshold(),
        "Proposer votes below threshold"
    );
    // ...
}
```

**Mitigates:** Proposal spam attacks

#### Dynamic Quorum
```solidity
// Quorum adjusts based on recent participation
uint256[] public recentParticipation;  // Last 10 proposals
uint256 public constant MIN_QUORUM_BPS = 200;  // 2%
uint256 public constant MAX_QUORUM_BPS = 1000;  // 10%

function quorumVotes() public view returns (uint256) {
    uint256 avgParticipation = _calculateAvgParticipation();
    
    // Dynamic formula: 70% of avg + 5% minimum
    uint256 dynamicQuorumBps = (avgParticipation * 70 / 100) + 500;
    
    // Clamp between min and max
    if (dynamicQuorumBps < MIN_QUORUM_BPS) dynamicQuorumBps = MIN_QUORUM_BPS;
    if (dynamicQuorumBps > MAX_QUORUM_BPS) dynamicQuorumBps = MAX_QUORUM_BPS;
    
    return (token.totalSupply() * dynamicQuorumBps) / 10000;
}
```

**Mitigates:** Quorum manipulation attacks

#### Supermajority for Critical Actions
```solidity
// Require >60% approval for treasury/parameter changes
function _voteSucceeded(uint256 proposalId) internal view returns (bool) {
    Proposal storage proposal = proposals[proposalId];
    
    // Standard: forVotes > againstVotes
    bool majorityFor = proposal.forVotes > proposal.againstVotes;
    
    // Critical actions need supermajority
    if (_isCriticalProposal(proposal)) {
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes;
        return (proposal.forVotes * 100) / totalVotes >= 60;
    }
    
    return majorityFor;
}
```

**Mitigates:** Whale manipulation

### Defense Layer 4: Structural Controls

#### Per-Proposer Rate Limiting
```solidity
mapping(address => uint256) public lastProposalBlock;
uint256 public constant PROPOSAL_COOLDOWN = 100800;  // ~2 weeks

function propose(...) public returns (uint256) {
    require(
        block.number >= lastProposalBlock[msg.sender] + PROPOSAL_COOLDOWN,
        "Proposal cooldown active"
    );
    
    lastProposalBlock[msg.sender] = block.number;
    // ...
}
```

**Mitigates:** Proposal spam from single actor

#### Guardian Veto (Emergency Pause)
```solidity
address public guardian;
bool public paused;

modifier whenNotPaused() {
    require(!paused, "Governance paused");
    _;
}

function pause() external {
    require(msg.sender == guardian, "Only guardian");
    paused = true;
    emit GovernancePaused();
}

function vetoProposal(uint256 proposalId) external {
    require(msg.sender == guardian, "Only guardian");
    _cancelProposal(proposalId);
    emit ProposalVetoed(proposalId);
}
```

**Mitigates:** All attacks (emergency response)

---

## Proposal Lifecycle

### Complete Flow Diagram

```
┌─────────────┐
│   CREATED   │  (Proposal created by proposer with sufficient votes)
└──────┬──────┘
       │
       │ voting delay passes
       │
       ▼
┌─────────────┐
│   PENDING   │  (Waiting for voting to start)
└──────┬──────┘
       │
       │ startBlock reached
       │
       ▼
┌─────────────┐
│   ACTIVE    │◄─── Voters cast votes here
└──────┬──────┘
       │
       │ endBlock reached
       │
       ├──────────────┬──────────────┐
       │              │              │
       ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐
│ DEFEATED │   │SUCCEEDED │   │ CANCELED │
│          │   │          │   │          │
│ • Not    │   │ • For >  │   │ • Proposer│
│   enough │   │   Against│   │   canceled│
│   votes  │   │ • Quorum │   │ • Or votes│
│ • Failed │   │   met    │   │   dropped │
│   quorum │   │          │   │   below   │
│          │   │          │   │   threshold│
└──────────┘   └────┬─────┘   └──────────┘
                    │
                    │ queue() called
                    │
                    ▼
             ┌─────────────┐
             │   QUEUED    │
             │             │
             │ (In timelock│
             │  waiting for│
             │  ETA)       │
             └──────┬──────┘
                    │
                    │ ETA reached
                    │
                    ├───────────┬──────────┐
                    │           │          │
                    ▼           ▼          ▼
             ┌──────────┐ ┌─────────┐ ┌────────┐
             │ EXECUTED │ │ EXPIRED │ │CANCELED│
             │          │ │         │ │        │
             │ • execute│ │ • Grace │ │ • Admin│
             │   called │ │   period│ │   cancels│
             │ • Actions│ │   passed│ │   queued │
             │   run    │ │         │ │   tx    │
             └──────────┘ └─────────┘ └────────┘

CANCELED can happen from: PENDING, ACTIVE, SUCCEEDED, QUEUED states
```

### Lifecycle Timestamps

```solidity
// Example with values
Proposal created at block: 1000
    votingDelay = 7200 blocks
    votingPeriod = 50400 blocks
    timelockDelay = 172800 seconds (~2 days)

Timeline:
Block 1000:    Proposal created (state: Pending)
Block 8200:    Voting starts (state: Active)
Block 58600:   Voting ends (state: Succeeded if passed)
               queue() called
               ETA = current_time + 172800
Time T+2 days: execute() available (state: Queued → Executed)
Time T+16 days: Grace period expires (state: Expired if not executed)
```

---

## Voting Mechanisms

### Vote Types

```solidity
uint8 constant VOTE_AGAINST = 0;
uint8 constant VOTE_FOR = 1;
uint8 constant VOTE_ABSTAIN = 2;
```

**Against (0):** Vote against the proposal
**For (1):** Vote in favor of the proposal
**Abstain (2):** Count toward quorum but not for/against tally

### Vote Weight Calculation

#### Standard (1 token = 1 vote)
```solidity
function getVotes(address account, uint256 blockNumber) public view returns (uint256) {
    return token.getPriorVotes(account, blockNumber);
}
```

#### With Delegation
```solidity
// Token holder delegates to another address
token.delegate(delegateAddress);

// Delegate's vote weight includes all delegations
uint256 delegateVotes = token.getPriorVotes(delegateAddress, blockNumber);
```

### Quorum Calculation

#### Fixed Quorum (Vulnerable)
```solidity
function quorumVotes() public view returns (uint256) {
    return (token.totalSupply() * quorumBps) / 10000;
}

// Example: 4% quorum
// If totalSupply = 1,000,000
// quorumVotes = 40,000
```

#### Dynamic Quorum (Protected)
```solidity
function quorumVotes() public view returns (uint256) {
    uint256 avgParticipation = _getAvgParticipation();
    uint256 adjustedQuorumBps = (avgParticipation * 70 / 100) + 500;
    
    // Clamp between 2% and 10%
    if (adjustedQuorumBps < 200) adjustedQuorumBps = 200;
    if (adjustedQuorumBps > 1000) adjustedQuorumBps = 1000;
    
    return (token.totalSupply() * adjustedQuorumBps) / 10000;
}
```

### Proposal Success Criteria

```solidity
function _voteSucceeded(uint256 proposalId) internal view returns (bool) {
    Proposal storage proposal = proposals[proposalId];
    
    // Must meet quorum
    bool quorumReached = proposal.forVotes >= quorumVotes();
    
    // Must have more FOR than AGAINST
    bool majorityFor = proposal.forVotes > proposal.againstVotes;
    
    return quorumReached && majorityFor;
}
```

---

## Security Considerations

### Attack Surface Analysis

| Attack Type | Vulnerable Component | Mitigation |
|------------|---------------------|------------|
| Flash Loan Attack | No voting delay, no timelock | Voting delay + Timelock + Snapshot |
| Whale Manipulation | Token concentration | Vote caps, supermajority, high participation |
| Proposal Spam | Low proposal threshold | Higher threshold, rate limiting |
| Quorum Manipulation | Fixed quorum, low participation | Dynamic quorum, extended voting |
| Timelock Exploit | Emergency functions | Multi-sig guardian, limited bypass |

### Defense-in-Depth Strategy

**Layer 1: Prevention**
- Voting delay prevents same-transaction attacks
- Proposal threshold prevents spam
- Snapshot voting prevents post-proposal token acquisition

**Layer 2: Detection**
- Monitor participation rates
- Track proposal patterns
- Detect abnormal voting behavior

**Layer 3: Response**
- Timelock provides exit window
- Guardian can veto malicious proposals
- Community can cancel via governance

**Layer 4: Recovery**
- Multi-sig treasury control
- Emergency pause mechanism
- Upgrade capability (with caution)

### Gas Optimization

**Checkpoint Compression:**
```solidity
// Store checkpoints efficiently
struct Checkpoint {
    uint32 fromBlock;   // 4 bytes (enough for ~100 years at 12s blocks)
    uint224 votes;      // 28 bytes (enough for max supply)
}
```

**Batch Operations:**
```solidity
// Cast votes for multiple proposals
function castVoteBatch(uint256[] memory proposalIds, uint8[] memory supports) external {
    for (uint256 i = 0; i < proposalIds.length; i++) {
        _castVote(proposalIds[i], supports[i]);
    }
}
```

**Event Indexing:**
```solidity
// Index key fields for efficient querying
event ProposalCreated(
    uint256 indexed proposalId,
    address indexed proposer,
    ...
);
```

---

## Integration Points

### With Attack Contracts

Attack contracts interact with governance through:

1. **Token acquisition** (purchase, flash loan, accumulation)
2. **Proposal creation** (if threshold met)
3. **Voting** (using acquired/borrowed voting power)
4. **Execution** (if proposal succeeds)

```solidity
// Example: Flash loan attack integration
contract FlashLoanAttack {
    function executeAttack(IGovernor governor, IFlashLoan provider) external {
        // 1. Borrow tokens
        provider.flashLoan(requiredTokens);
        
        // 2. Delegate to self
        token.delegate(address(this));
        
        // 3. Create malicious proposal
        uint256 proposalId = governor.propose(...);
        
        // 4. Vote (if no delay)
        governor.castVote(proposalId, 1);
        
        // 5. Execute (if no timelock)
        governor.execute(proposalId);
        
        // 6. Repay flash loan
        token.transfer(provider, requiredTokens + fee);
    }
}
```

### With Defense Contracts

Defense contracts extend governor functionality:

```solidity
// Example: Token locking extension
contract TokenLock {
    mapping(address => uint256) public lockedUntil;
    
    function lockTokensForVote(address voter, uint256 endBlock) external {
        require(msg.sender == address(governor), "Only governor");
        lockedUntil[voter] = endBlock;
    }
    
    function beforeTokenTransfer(address from) external view {
        require(block.number > lockedUntil[from], "Tokens locked");
    }
}
```

### With Frontend Dashboard

The frontend reads governance state via:

```solidity
// View functions for dashboard
function getProposal(uint256 proposalId) external view returns (
    address proposer,
    uint256 eta,
    uint256 startBlock,
    uint256 endBlock,
    uint256 forVotes,
    uint256 againstVotes,
    ProposalState state
);

function getReceipt(uint256 proposalId, address voter) external view returns (
    bool hasVoted,
    uint8 support,
    uint256 votes
);

function proposalCount() external view returns (uint256);
```

### With Analysis Backend

Events emitted for data collection:

```solidity
event ProposalCreated(
    uint256 proposalId,
    address proposer,
    address[] targets,
    uint256[] values,
    string[] signatures,
    bytes[] calldatas,
    uint256 startBlock,
    uint256 endBlock,
    string description
);

event VoteCast(
    address indexed voter,
    uint256 indexed proposalId,
    uint8 support,
    uint256 votes,
    string reason
);

event ProposalQueued(uint256 proposalId, uint256 eta);
event ProposalExecuted(uint256 proposalId);
event ProposalCanceled(uint256 proposalId);
```

---

## Implementation Checklist

### GovernanceToken.sol
- [ ] Implement ERC20 standard
- [ ] Add checkpoint-based vote tracking
- [ ] Implement delegation mechanism
- [ ] Add getPriorVotes function
- [ ] Emit Delegation events
- [ ] Test with different supply amounts

### Timelock.sol
- [ ] Implement transaction queuing
- [ ] Add delay enforcement
- [ ] Implement grace period
- [ ] Add admin role management
- [ ] Emit all state change events
- [ ] Test with various delay periods

### GovernorBase.sol
- [ ] Implement proposal creation
- [ ] Add voting mechanism
- [ ] Implement state transitions
- [ ] Add quorum checking
- [ ] Implement execution logic
- [ ] Add comprehensive events
- [ ] Test all state transitions

### GovernorVulnerable.sol
- [ ] Extend GovernorBase
- [ ] Remove timelock integration
- [ ] Set votingDelay = 0
- [ ] Lower proposal threshold
- [ ] Use fixed quorum
- [ ] Document vulnerabilities
- [ ] Test attack scenarios

### GovernorWithDefenses.sol
- [ ] Extend GovernorBase
- [ ] Integrate timelock
- [ ] Implement snapshot voting
- [ ] Add dynamic quorum
- [ ] Implement rate limiting
- [ ] Add guardian controls
- [ ] Test defense effectiveness

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-13 | Initial specification |

---

## Appendix

### References

- **Compound Governance:** https://compound.finance/governance
- **OpenZeppelin Governor:** https://docs.openzeppelin.com/contracts/governance
- **Beanstalk Attack Analysis:** Research case study
- **EIP-20:** ERC20 Token Standard
- **EIP-2612:** ERC20 Permit Extension
- **EIP-5805:** ERC20 Votes Extension

### Glossary

- **BPS (Basis Points):** 1/100th of a percent (100 bps = 1%)
- **Checkpoint:** Historical record of voting power at specific block
- **Delegation:** Assignment of voting power to another address
- **ETA:** Estimated Time of Arrival (timelock execution time)
- **Quorum:** Minimum participation required for valid vote
- **Snapshot Voting:** Using historical balances for vote weight
- **Timelock:** Delay mechanism before execution

---

**End of Specification**
