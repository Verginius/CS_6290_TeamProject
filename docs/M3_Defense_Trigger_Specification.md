# M3 Defense Parameter Specification: Volume-Based Circuit Breaker

**Role:** Data Analyst (QI Nan)
**Target Protocol:** Compound Finance ($COMP)
**Milestone:** 3

## 1. Objective

In M2, we established that acquiring 400,000 COMP for a Quorum via market buys incurs a 39.71% slippage. The objective of this specification is to translate this empirical limit into actionable parameters for the defensive smart contract.

## 2. Parameter Derivation (Based on M2 Data)

Based on our M2 `Slippage-to-Volume` curve:

- **Normal Trading Peak:** Market data shows normal heavy trades rarely exceed 10,000 COMP.
- **Attack Danger Zone:** To reach 400,000 COMP efficiently, pushing volume past 50,000 COMP triggers significant >2% slippage.

### Recommended Smart Contract Variables:

* `MAX_SAFE_VOLUME`: **50,000 COMP**
* `CIRCUIT_BREAKER_COOLDOWN`: **100 Blocks**

## 3. Integration Instructions

The smart contract should implement a modifier that tracks `COMP_acquired_in_current_block`. If `amount > MAX_SAFE_VOLUME`, revert the `propose()` governance function call.


