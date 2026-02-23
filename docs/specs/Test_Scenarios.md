# Test Scenarios Specification

**Project:** On-Chain Governance Attack Simulation  
**Version:** 1.0  
**Last Updated:** 2026-02-13  
**Author:** Student 3 - Testing & Defense Engineer  

---

## Table of Contents

1. [Overview](#overview)
2. [Scope](#scope)
3. [Common Setup](#common-setup)
4. [Baseline Parameters](#baseline-parameters)
5. [Attack Scenarios](#attack-scenarios)
6. [Defense Scenarios](#defense-scenarios)
7. [Output Requirements](#output-requirements)
8. [Execution Notes](#execution-notes)

---

## Overview

### Purpose

This specification defines the test scenarios for the on-chain governance attack simulation project. It is derived from the project plan and serves as the test specification for Foundry tests and scripts.

### Design Goals

- **Comprehensive**: Cover all five attack types and four defense layers.
- **Comparable**: Ensure consistent inputs for vulnerable vs protected configurations.
- **Measurable**: Emit structured outputs for analysis and visualization.
- **Repeatable**: Use deterministic parameters and clear setup steps.

---

## Scope

The scenarios cover five attack types and four layers of defenses. Each scenario should be executed against:

- A vulnerable governance configuration (no or minimal defenses).
- A protected governance configuration (enabled defenses).

Each scenario should record structured results suitable for analysis (see Analysis Metrics).

---

## Common Setup

- Governance token uses ERC20Votes.
- Governance contract supports proposal lifecycle: Pending -> Active -> Succeeded -> Executed.
- Treasury contract holds funds for exploitation tests.
- Timelock is configurable (0, 24h, 48h).
- Voting delay and voting period are configurable.
- Snapshot block is configurable for snapshot voting.

---

## Baseline Parameters

- Total supply: 1,000,000 tokens.
- Initial distribution: 40% DAO treasury, 30% community, 20% team, 10% attacker (varies per test).
- Default quorum: 10% total supply.
- Default voting period: 7 days.
- Default voting delay: 1 day.

---

## Attack Scenarios

### 1. Flash Loan Governance Attack

**Goal:** Validate same-block voting power abuse and mitigation by time-based or snapshot defenses.

Test cases:
- FL-01: No timelock, no voting delay, no snapshot -> attack succeeds.
- FL-02: Timelock enabled (48h) -> attack fails to execute immediately.
- FL-03: Snapshot voting enabled -> attack fails to gain voting power.
- FL-04: Insufficient flash loan amount -> attack fails quorum.
- FL-05: Multiple attackers in same block -> verify conflict handling and vote accounting.

### 2. Whale Manipulation Attack

**Goal:** Validate large-holder dominance and effectiveness of vote caps or supermajority.

Test cases:
- WH-01: Single whale with 51% voting power -> malicious proposal passes.
- WH-02: Two whales coordinating with 60% total -> malicious proposal passes.
- WH-03: High participation (50%) reduces whale success -> proposal fails.
- WH-04: Per-address vote cap (10%) -> proposal fails.
- WH-05: Supermajority required (>60%) -> proposal fails with 51%.

### 3. Proposal Spam Attack

**Goal:** Measure proposal spam impact and defenses like thresholds and rate limits.

Test cases:
- PS-01: 50+ proposals in short window -> voter fatigue metric increases.
- PS-02: 100 proposals with one malicious -> malicious passes under low participation.
- PS-03: Rate limit (1 proposal per address per week) -> spam blocked.
- PS-04: Proposal threshold (1% supply) -> spam blocked.
- PS-05: Increased proposal cost -> spam profitability drops below zero.

### 4. Quorum Manipulation Attack

**Goal:** Validate low-participation timing attacks and Sybil behavior.

Test cases:
- QM-01: Sybil accounts (100) inflate votes -> proposal passes.
- QM-02: Low-participation window -> proposal passes at 5% participation.
- QM-03: High participation window -> proposal fails.
- QM-04: Dynamic quorum enabled -> proposal fails.
- QM-05: Minimum voting period (7 days) -> reduces timing effectiveness.

### 5. Timelock Exploit

**Goal:** Validate emergency function bypass and timelock coverage.

Test cases:
- TL-01: Emergency function bypasses timelock -> exploit succeeds.
- TL-02: Proper timelock coverage -> exploit fails.
- TL-03: Proposal cancellation during timelock -> assess governance safety.
- TL-04: Front-run execution at timelock expiry -> verify protection.
- TL-05: Multi-sig guardian enabled -> exploit blocked.

---

## Defense Scenarios

### Time-Based Defenses

- TD-01: Voting delay blocks same-block flash loan votes.
- TD-02: Longer voting period increases participation and reduces timing attacks.
- TD-03: Timelock provides exit window for users.
- TD-04: Grace period increases response time.

### Token-Based Defenses

- TK-01: Snapshot voting uses prior balances.
- TK-02: Token locking prevents rapid vote shifts.
- TK-03: Minimum holding period blocks last-minute accumulation.
- TK-04: Delegation changes delayed by 24-48h.

### Threshold and Quorum Defenses

- TQ-01: Dynamic quorum tracks recent participation.
- TQ-02: Supermajority requirements for critical proposals.
- TQ-03: Minimum proposal threshold blocks spam.
- TQ-04: Per-address vote cap reduces whale influence.

### Structural Controls

- SC-01: Multi-sig treasury blocks governance compromise.
- SC-02: Guardian veto halts malicious proposal.
- SC-03: Optimistic governance with veto window.
- SC-04: Staged rollout requires multiple votes.

---

## Output Requirements

Each scenario should output a JSON record with:

- scenarioId
- attackType
- defenseConfig
- success
- gasUsed
- cost
- profit
- votesFor
- votesAgainst
- quorum
- participation
- timestamp

These outputs will be aggregated and used by the analysis pipeline.

---

## Execution Notes

- Each scenario should run at least 3 times to reduce variance.
- Report gas usage using Foundry traces or events.
- Store raw outputs in analysis/data/raw/ with per-attack files.
