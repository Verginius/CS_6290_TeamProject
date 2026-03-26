# M2 Risk Parameter Analysis: Empirical Slippage Cost for Compound Attack

**Role:** Data Analyst (QI Nan)
**Target Protocol:** Compound Finance ($COMP)
**Milestone:** 2

## 1. Objective

In Milestone 1, we established the theoretical attack cost formula: `Cost_total = $340 + $80 + Slippage`. However, the slippage was an estimated 15%. For Milestone 2, this report replaces the estimation with empirical data derived from Uniswap V3 simulated liquidity depth to calculate the **Minimum Profitable Attack Threshold**.

## 2. Empirical Slippage Data (Slippage-to-Volume)

Based on our `slippage_calculator.py` model querying DEX depth, a forced market acquisition yields the following non-linear slippage scaling:

| Target Volume (COMP) | Avg Execution Price | Slippage (%) | Total Cost (USD) |
| -------------------- | ------------------- | ------------ | ---------------- |
| 10,000               | $17.00              | 0.00%        | $170,000         |
| 100,000              | $17.89              | 5.24%        | $1,789,000       |
| 200,000              | $19.16              | 12.68%       | $3,831,000       |
| **400,000 (Quorum)** | **$23.75**          | **39.71%**   | **$9,500,000**   |

*Note: Base value of 400,000 COMP without slippage is $6,800,000.*

## 3. Revised Attack Cost & Security Threshold

To force a governance proposal, the attacker must acquire 400,000 COMP.

* **Pure Token Value:** $6,800,000
* **Actual Cost due to Slippage:** $9,500,000
* **Implicit Slippage Cost (Loss):** $9,500,000 - $6,800,000 = **$2,700,000**

**Conclusion (Minimum Profitable Threshold):**
Because the attacker instantly loses **$2.7 million** to market slippage (AMMs arbitrageurs capture this), the governance attack is mathematically **unprofitable** unless the malicious proposal can extract **more than $2,700,420** (Slippage + Flashloan Fee + Gas) from the Compound Treasury. 

This $2.7M figure gives our "Defender" role a concrete numeric target for configuring the defense smart contracts in Milestone 3.
