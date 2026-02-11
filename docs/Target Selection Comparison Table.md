### **Project Target Selection Comparison Matrix**

**Project:** DAO Governance Attack Simulation | **Milestone:** 1

| **Comparison Dimension**  | **Compound (Selected)**                                                                                                           | **Uniswap (Alternative)**                                                                                               | **Beanstalk (Alternative)**                                                                                   |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Governance Complexity** | **Low**: Uses standard Governor Bravo. Parameters (e.g., 400k Quorum) are hardcoded and transparent. Ideal for baseline modeling. | **Medium**: Features nested delegation and dynamic parameters, increasing the difficulty of initial data modeling.      | **High**: Governance is tightly coupled with algorithmic stablecoin mechanics. Too complex for M1 scope.      |
| **Data Accessibility**    | **High**: Real-time COMP price, flash loan fees (Aave), and quorum stats are readily available on major aggregators.              | **Medium**: UNI circulating supply and real-time voting power fluctuate significantly due to token unlocking schedules. | **Low**: On-chain data is fragmented; requires manual parsing of complex smart contract state variables.      |
| **Attack Vector Fit**     | **High**: Perfectly matches the "Flash Loan + Governance Takeover" scenario. Direct calculation path from cost to quorum.         | **Medium**: Proposals often involve liquidity pool parameters, adding extra variables to the attack cost equation.      | **Low**: Requires simultaneous attack on governance and price peg, exceeding the "Single Vector" scope of M1. |
| **Final Recommendation**  | **Primary Choice **                                                                                                               | **Secondary Option**                                                                                                    | **Not Recommended**                                                                                           |

#### **1. Target Selection Overview**

* **Target DAO / Protocol:** **Compound Finance** (The industry standard for on-chain lending and decentralized governance).

* **Governance Token:** **COMP** (The native token used for all voting and proposal actions; high liquidity for cost modeling).

* **Technical Framework:** **Governor Bravo** (Open-source, standardized module, ideal for security simulation).

#### **2. Strategic Rationale for Selection**

* **Standardized Governance:** Compound’s model is the "gold standard" for on-chain governance. This provides our developers with extensive open-source references, minimizing hurdles during the attack/defense coding phase.

* **Data Transparency:** Key metrics such as COMP price, liquidity depth, flash loan fees, and Gas costs are readily accessible via CoinMarketCap and Etherscan, ensuring high accuracy for our economic modeling.

* **Attack Scenario Alignment:** The protocol’s transparent voting thresholds and timelock parameters perfectly fit the **"Flash Loan Governance Takeover"** scenario we intend to simulate.

#### **3. Governance Mechanism & Attack Vector Analysis**

> _This section explains the core logic behind our data points:_

The system utilizes a **one-token-one-vote** on-chain governance mechanism. Any address holding or delegated with sufficient COMP can initiate and participate in governance proposals, influencing protocol parameters and the allocation of treasury funds.

**Our subsequent research will focus on the following attack vector:** "How an attacker can instantaneously acquire sufficient COMP voting power through Flash Loans to force the passage of a malicious proposal, thereby gaining control over the protocol's governance and assets."


