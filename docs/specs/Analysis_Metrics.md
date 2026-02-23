# Analysis Metrics Specification

**Project:** On-Chain Governance Attack Simulation  
**Version:** 1.0  
**Last Updated:** 2026-02-13  
**Author:** Student 4 - Data Analysis & Metrics Engineer  

---

## Table of Contents

1. [Overview](#overview)
2. [Economic Metrics](#economic-metrics)
3. [Defense Effectiveness Metrics](#defense-effectiveness-metrics)
4. [Governance Health Metrics](#governance-health-metrics)
5. [Comparative Analysis Metrics](#comparative-analysis-metrics)
6. [Output Schema Expectations](#output-schema-expectations)

---

## Overview

### Purpose

This specification defines the metrics used to evaluate attack success, defense effectiveness, and governance health. It is derived from the project plan and is intended for analysis scripts and dashboard visualizations.

### Design Goals

- **Consistent**: Use standardized formulas across all scenarios.
- **Traceable**: Map each metric to raw scenario outputs.
- **Actionable**: Support dashboard comparisons and reports.

---

## Economic Metrics

### 1. Attack Profitability Ratio (APR)

$$APR = (FundsStolen - AttackCost) / AttackCost$$

- Interpretation: > 0 is profitable, < 0 is unprofitable.

### 2. Attack Cost Breakdown

$$AttackCost = FlashLoanFees + GasCost + TokenPurchase + OpportunityCost$$

- FlashLoanFees: default 0.09% of loaned value.
- GasCost: based on gas used and network gas price.

### 3. Break-even Governance Control

$$BreakEvenTVL = AttackCost / ExtractableFraction$$

- ExtractableFraction is the share of treasury the attacker can drain.

### 4. Cost-Benefit Matrix

Report per attack type:
- AvgCost
- SuccessRate
- AvgProfit
- ROI

---

## Defense Effectiveness Metrics

### 1. Attack Success Rate

$$SuccessRate = SuccessfulAttacks / TotalAttempts$$

Report per attack and per defense configuration.

### 2. Defense Penetration Time

$$PenetrationTime = TimeToBypassDefense$$

- For timelock, expected to be infinite if fully protected.

### 3. Timelock Coverage

$$Coverage = (ProtectedFunctions / TotalCriticalFunctions) * 100$$

- Critical functions include treasury transfers and parameter changes.

### 4. False Positive Rate

$$FPR = LegitimateProposalsFlagged / TotalLegitimateProposals$$

- Target < 5%.

### 5. Defense Effectiveness Matrix

Matrix across defenses and attacks. Each cell is effectiveness percentage.

---

## Governance Health Metrics

### 1. Participation Rate

$$Participation = (VotesCast / TotalPossibleVotes) * 100$$

- Track over time, especially during spam attacks.

### 2. Token Concentration (HHI)

$$HHI = \sum VotingPower_i^2$$

- Range 0 to 10,000.

### 3. Gini Coefficient

- Measures inequality of token distribution, 0 to 1.

### 4. Delegation Diversity

$$Diversity = UniqueDelegates / TotalTokenHolders$$

### 5. Proposal Success Rate

$$ProposalSuccess = PassedProposals / TotalProposals$$

- Healthy range: 30% to 70%.

---

## Comparative Analysis Metrics

### 1. Danger Score

$$DangerScore = (SuccessRate * 0.4) + (Profitability * 0.3) + (EaseOfExecution * 0.3)$$

- Used for ranking attack severity.

### 2. Defense ROI

$$DefenseROI = AttacksPreventedValue / ImplementationCost$$

### 3. Security vs Usability

- Security score: attacks blocked (normalized 0 to 1).
- Usability score: proposal speed and participation (normalized 0 to 1).
- Use for Pareto analysis.

---

## Output Schema Expectations

All metrics should be computed per:

- Attack type
- Defense configuration
- Scenario batch

Outputs should be written to:

- analysis/data/processed/attack_summary.json
- analysis/data/processed/defense_effectiveness.json
- analysis/data/processed/metrics.json
