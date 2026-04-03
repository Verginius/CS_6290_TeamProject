# Architecture Decision Log: Counter-Flash Loan Defense

**Date:** March 25, 2026  
**Author:** QI Nan (Data Analyst)  
**Context:** Deciding on the primary defense mechanism against the Compound governance takeover simulated in M1/M2.

### Options Considered:

1. **Voting Timelocks (Delaying proposal execution)**
2. **Flash Loan Blacklisting (Blocking Aave/Uniswap router addresses)**
3. **Volume-Based Circuit Breaker (Tracking single-block token acquisition)**

### Decision:

We selected **Option 3: Volume-Based Circuit Breaker**.

### Justification:

- **Why not Option 1:** Flash loan attacks execute the "borrow -> vote/propose -> repay" loop within a *single block*. Standard timelocks check balances at a snapshot and cannot detect single-block inflation.
- **Why not Option 2:** Attackers can easily route funds through proxy contracts or fresh addresses, making static blacklists obsolete instantly.
- **Why Option 3 (Chosen):** Based on our M2 data, acquiring the 400,000 COMP Quorum requires massive liquidity manipulation. By enforcing a `MAX_SAFE_VOLUME` threshold (50,000 COMP per block), we leverage economic friction. It is mathematically impossible for an attacker to reach Quorum without triggering this volume alarm, and it avoids false positives for normal users.
