# CS 6290 — On-Chain Governance Attack Simulation

A research project that demonstrates, simulates, and defends against real-world DAO governance attack vectors using Foundry (Solidity), a React + TypeScript dashboard, and a Node.js analytics API.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Repository Structure](#repository-structure)
3. [Smart Contract Architecture](#smart-contract-architecture)
4. [Governance Contracts](#governance-contracts)
5. [Utility Libraries](#utility-libraries)
6. [Defense Mechanisms](#defense-mechanisms)
7. [Attack Contracts](#attack-contracts)
8. [Test Suite](#test-suite)
9. [Development Setup](#development-setup)
10. [Running Tests](#running-tests)
11. [Team Structure](#team-structure)

---

## Project Overview

This project implements three governance contract variants to explore five major attack vectors:

| Attack | Description |
|--------|-------------|
| Flash-loan voting | Borrow tokens, vote, repay in one transaction |
| Whale manipulation | Concentrated voting power steers outcomes |
| Proposal spam | Flood the queue to exhaust gas / reviewer attention |
| Quorum manipulation | Sybil or low-turnout exploit to pass with minimal votes |
| Timelock exploit | Race against the delay window to execute malicious actions |

Each attack is countered by a corresponding defense mechanism, enabling side-by-side comparison of vulnerable vs. hardened governance.

---

## Repository Structure

```
.
├── src/
│   ├── governance/          # Core governance contracts
│   │   ├── GovernanceToken.sol      — ERC20Votes governance token
│   │   ├── Timelock.sol             — TimelockController wrapper
│   │   ├── GovernorBase.sol         — OZ-based secure governor
│   │   ├── GovernorVulnerable.sol   — Intentionally exploitable governor
│   │   └── GovernorWithDefenses.sol — Hand-written hardened governor
│   ├── libraries/           # Shared pure-logic libraries (used by all governors)
│   │   ├── GovernanceMath.sol       — Quorum/voting math, BPS arithmetic, HHI/Gini
│   │   ├── VotingPower.sol          — Snapshot-safe vote weight & threshold helpers
│   │   └── ProposalLib.sol          — Proposal ID hashing, array validation, lifecycle
│   ├── attacks/             # Attack simulation contracts (in development)
│   ├── defenses/            # Standalone defense mechanism contracts (in development)
│   └── mocks/               # Mock contracts for testing
├── test/
│   ├── BaseTest.sol
│   ├── GovernorBase.t.sol
│   ├── GovernorVulnerable.t.sol
│   └── GovernorWithDefenses.t.sol
├── script/                  # Foundry deployment & simulation scripts
├── analysis/                # Python data analysis scripts & notebooks
├── backend/                 # Node.js Express API
├── frontend/                # React + TypeScript dashboard
├── docs/
│   ├── specs/               # Formal specifications
│   └── *.md                 # Project plan, assessment docs
├── foundry.toml
└── remappings.txt
```

---

## Smart Contract Architecture

```
Token Holders
     │ delegate voting power
     ▼
GovernanceToken (ERC20Votes)
     │ provides getPastVotes / getPastTotalSupply
     ▼
Governor Contract  ←── propose / castVote / queue / execute
     │ (GovernorBase, GovernorVulnerable, or GovernorWithDefenses)
     │ queues operations after successful vote
     ▼
Timelock Controller
     │ enforces mandatory delay before execution
     ▼
Target Contracts (treasury, parameter updates, etc.)
```

---

## Governance Contracts

### `GovernorBase.sol` — OZ-based secure governor

Built on the OpenZeppelin modular Governor framework.

| Module | Purpose |
|--------|---------|
| `GovernorVotes` | Snapshot-based vote weight (FIX-1) |
| `GovernorCountingSimple` | Double-vote guard (FIX-2) |
| `GovernorTimelockControl` | Mandatory execution delay (FIX-3) |
| `GovernorSettings` | Configurable proposal threshold (FIX-4) |
| `GovernorVotesQuorumFraction` | Base quorum fraction (FIX-5) |


### `GovernorVulnerable.sol` — intentionally exploitable

Exposes eight known vulnerabilities for attack demonstration:

| Label | Vulnerability |
|-------|--------------|
| VULN-1 | Live `getVotes()` used at vote time → flash-loan exploitable |
| VULN-2 | `hasVoted` mapping never enforced → unlimited votes per address |
| VULN-3 | No timelock → immediate execution after vote |
| VULN-4 | Zero proposal threshold → anyone can spam proposals |
| VULN-5 | Zero quorum → single vote can pass a proposal |
| VULN-6 | CEI pattern violated in `execute()` → reentrancy window |
| VULN-7 | Proposer can cancel at any lifecycle stage → mid-vote griefing |
| VULN-8 | Calldata arrays not validated against stored values |

### `GovernorWithDefenses.sol` — hand-written hardened governor

Mirrors `GovernorVulnerable` line-by-line but patches all eight vulnerabilities, plus two new defenses:

| Fix | Mechanism |
|-----|-----------|
| FIX-1 | `getPastVotes(voter, snapshotBlock)` — weight frozen at proposal creation |
| FIX-2 | `hasVoted` guard enforced before every `_castVote` |
| FIX-3 | Mandatory `queue()` → `TimelockController.scheduleBatch()` before `execute()` |
| FIX-4 | `proposalThresholdBps` checked via `getPastVotes` at `block.number - 1` |
| FIX-5 | `quorumVotes()` dynamic: `GovernanceMath.dynamicQuorum()` with rolling participation window |
| FIX-6 | CEI pattern: state writes precede all external calls |
| FIX-7 | `cancel()` only permitted while proposal is `Pending` |
| FIX-8 | Stored calldata arrays used exclusively — no caller injection |

---

## Utility Libraries

All three libraries live in `src/libraries/` and contain only `internal` functions — they are linked at compile time with zero deployment overhead.

### `GovernanceMath.sol` — quorum & voting math

All governance arithmetic lives here so no governor contract duplicates the logic.

| Function | Description |
|----------|-------------|
| `applyBps(amount, bps)` | Multiply `amount` by a BPS fraction; reverts if `bps > 10_000` |
| `toBps(value, total)` | Convert an absolute value to basis points |
| `clamp(value, lo, hi)` | Clamp to inclusive `[lo, hi]` range |
| `staticQuorum(supply, quorumBps)` | `supply × quorumBps / 10_000` |
| `dynamicQuorumBps(history[], baseBps, min, max)` | Rolling-average algorithm → clamped BPS |
| `dynamicQuorum(supply, history[], ...)` | Absolute token quorum from dynamic BPS |
| `quorumReached(for, against, abstain, threshold)` | Aggregate participation ≥ threshold |
| `majorityReached(for, against)` | `forVotes > againstVotes` |
| `supermajorityReached(for, against, bps)` | `for / (for+against) ≥ bps / 10_000` |
| `proposalSucceeded(for, against, abstain, q)` | Quorum AND majority combined check |
| `participationBps(for, against, abstain, supply)` | Total votes as BPS of supply |
| `herfindahlHirschman(balances[], supply)` | HHI concentration metric (0 – 10 000 BPS) |
| `giniCoefficient(sortedBalances[])` | Gini coefficient (0 – 10 000 BPS) |

**Dynamic quorum algorithm** (used by `GovernorWithDefenses.quorumVotes()`):
```
avgBps      = mean(recentParticipationBps[])
dynamicBps  = clamp(avgBps × 70 % + 500,  MIN_QUORUM_BPS, MAX_QUORUM_BPS)
quorum      = totalSupply × dynamicBps / 10_000
```
Default bounds: `MIN = 200 bps (2 %)`, `MAX = 1 000 bps (10 %)`, rolling window = 10 proposals.

---

### `VotingPower.sol` — snapshot-safe vote weight

Exposes `IVotesView` (ERC-5805 subset) and wraps every token query so governance contracts never call `getVotes()` in a security-sensitive path.

| Function | Description |
|----------|-------------|
| `snapshotWeight(token, account, block)` | `getPastVotes` at snapshot — flash-loan safe |
| `liveWeight(token, account)` | `getVotes` — for display only |
| `pastTotalSupply(token, block)` | `getPastTotalSupply` at a past block |
| `meetsThreshold(token, account, threshold)` | Weight at `block.number-1` ≥ threshold |
| `meetsThresholdBps(token, account, bps)` | BPS threshold check at `block.number-1` |
| `absoluteThreshold(token, bps)` | Informational: current supply × bps / 10 000 |
| `shareAtSnapshot(token, account, block)` | BPS share of total supply at snapshot |
| `isWhale(token, account, block, whaleBps)` | Share ≥ whaleBps |
| `aggregateWeight(token, accounts[], block)` | Sum of weights for a list of addresses |
| `coalitionReachesBps(token, delegates[], block, bps)` | Coalition exceeds a BPS threshold |

---

### `ProposalLib.sol` — proposal lifecycle utilities

| Function | Description |
|----------|-------------|
| `hashProposal(targets, values, calldatas, descHash)` | Deterministic proposal ID (OZ-compatible) |
| `hashDescription(description)` | `keccak256` of the description string |
| `validateArrayLengths(targets, values, calldatas)` | Reverts on length mismatch or empty arrays |
| `validateCalldata(stored…, supplied…)` | Element-wise comparison — implements FIX-8 |
| `voteStartBlock(creationBlock, delay)` | `creationBlock + votingDelay` |
| `voteEndBlock(voteStart, period)` | `voteStart + votingPeriod` |
| `isVotingActive(start, end)` | Returns `true` within voting window |
| `isPending(voteStart)` | Returns `true` before voting window |
| `isVotingEnded(voteEnd)` | Returns `true` after voting window |
| `computeEta(queuedAt, delay)` | `queuedAt + timelockDelay` |
| `isExpired(eta, gracePeriod)` | Timelock grace-period expiry check |
| `isReady(eta)` | Timelock delay elapsed |
| `executeBatch(targets, values, calldatas)` | Low-level call loop with revert propagation |

---

## Defense Mechanisms

`src/defenses/` contains standalone defense contracts implemented by Student 3. Planned contracts

| Contract | Layer | Attacks Mitigated | Mechanism |
|----------|-------|-------------------|-----------|
| `VotingDelay.sol` | 1 — Time-Based | Flash loan (100 %), quick exploits | Enforces a mandatory delay (default 2 days / ~14 400 blocks) between proposal creation and voting start; no vote can be cast in the same block or transaction as `propose()` |
| `SnapshotVoting.sol` | 2 — Token-Based | Flash loan (100 %), post-proposal accumulation | Records `snapshotBlock = block.number` at proposal creation and reads `getPastVotes(voter, snapshotBlock)` at cast time; tokens acquired after the snapshot carry zero weight |
| `TokenLocking.sol` | 2 — Token-Based | Flash loan, intra-period transfers | Implements vote-escrowing: voters lock tokens for the duration of the voting period, preventing the borrow → vote → repay cycle |
| `DynamicQuorum.sol` | 3 — Threshold & Quorum | Quorum manipulation (70 %), low-turnout capture | Standalone wrapper around `GovernanceMath.dynamicQuorum()`; exposes `computeQuorum()` and `recordParticipation()` for composable integration with any governor |
| `EmergencyPause.sol` | 4 — Structural | All attack types (80–95 %) | Guardian-controlled circuit breaker; `emergencyPause()` is callable instantly by the guardian; `emergencyUnpause()` requires a passed governance proposal through the `TimelockController`; `whenNotPaused` guards `propose`, `castVote`, `queue`, and `execute` |

> **Note:** The core adaptive-quorum algorithm is already live in `GovernorWithDefenses` via `GovernanceMath.dynamicQuorum()`. `DynamicQuorum.sol` will provide a reusable standalone contract for other governors.

---

## Attack Contracts

`src/attacks/` is reserved for attack simulation contracts (in development by Student 2). Planned contracts:

| Contract | Attack Type |
|----------|------------|
| `FlashLoanAttack.sol` | Borrow → vote → repay in one tx |
| `WhaleManipulation.sol` | Concentrated token accumulation |
| `ProposalSpam.sol` | High-volume proposal flooding |
| `QuorumManipulation.sol` | Sybil / low-turnout quorum bypass |
| `TimelockExploit.sol` | Race-condition exploit of timelock window |

---

## Test Suite

All tests use Foundry (`forge test`).

| File | Coverage |
|------|---------|
| `GovernorBase.t.sol` | OZ governor — voting, quorum, timelock integration |
| `GovernorVulnerable.t.sol` | Proves each vulnerability is exploitable |
| `GovernorWithDefenses.t.sol` | Proves each fix blocks the corresponding attack |

Key test scenarios in `GovernorWithDefenses.t.sol`:

- `testProposalThreshold` — FIX-4: zero-vote proposer rejected
- `testSnapshotVoting` — FIX-1: post-creation token transfers do not boost votes
- `testNoDoubleVoting` — FIX-2: second vote reverts
- `testQuorumEnforcement` — FIX-5: low-turnout proposal defeated
- `testTimelockQueue` / `testTimelockExecute` — FIX-3: mandatory delay enforced
- `testCancelPendingProposal` / `testCannotCancelActiveProposal` — FIX-7
- `testCalldataIntegrity` — FIX-8: altered targets revert

---

## Development Setup

### Prerequisites

| Tool | Version |
|------|---------|
| [Foundry](https://getfoundry.sh) | latest (`foundryup`) |
| [Node.js](https://nodejs.org) | ≥ 18 LTS |
| Python | 3.13+ (conda recommended) |
| Git | any |

### Recommended VS Code Extensions

Install from the VS Code Marketplace:

| Extension ID | Name |
|---|---|
| `juanblanco.solidity` | Solidity |
| `dbaeumer.vscode-eslint` | ESLint |
| `esbenp.prettier-vscode` | Prettier |
| `ms-toolsai.jupyter` | Jupyter |
| `dsznajder.es7-react-js-snippets` | ES7+ React snippets |
| `bradlc.vscode-tailwindcss` | Tailwind CSS IntelliSense |

### Foundry Setup

```powershell
# Install Foundry (run in Git Bash)
curl -L https://foundry.paradigm.xyz | bash

# Restart terminal, then:
foundryup

# Install dependencies
forge install
```
### Frontend (React + Vite)

```powershell
cd frontend
npm install
npm run dev
```

### Python Environment

```powershell
# Activate virtual environment
<project-dir>\.venv\Scripts\Activate.ps1

# Install analysis dependencies
pip install -r analysis/requirements.txt
```

### Backend (Node.js API)

```powershell
cd backend
npm install
npm run dev
```

---

## Running Tests

```powershell
# Run all tests
forge test

# Run with verbose output
forge test -vvv

# Run a specific test file
forge test --match-path test/GovernorWithDefenses.t.sol -vvv

# Run a single test function
forge test --match-test testProposalThreshold -vvv

# Gas report
forge test --gas-report

# Coverage report
forge coverage
```

---

## Deploy the Contract

``` Powershell

forge script script/Counter.s.sol

```

The contract will be deployed to the local Anvil node or simulated environment by default.

If deployment to the testnet is required, please add the `--rpc-url <URL>` and `--private-key <KEY>` parameters.


## Team Structure

| Student | Role | Key Deliverables |
|---------|------|-----------------|
| Student 1 | Spec, Architecture & Core Governance Lead | `specs/`, `src/governance/`, architecture docs |
| Student 2 | Attack Implementation Engineer | `src/attacks/`, `src/mocks/`, simulation scripts |
| Student 3 | Testing & Defense Engineer | `test/`, `src/defenses/`, coverage reports |
| Student 4 | Data Analysis & Metrics Engineer | `analysis/`, `backend/` |
| Student 5 | Front-end Visualization Developer | `frontend/` |
