# CS6290 — Individual Evidence Pack (Milestone Template)

---

## Student Information

- **Name:** QI Nan
- **Student ID (SID):** 59755022
- **Group Number / Project Title:** Team 12 / On-chain governance attack simulation
- **Milestone:** M3 
- **Date:** March 29, 2026

---

## 1) What I Contributed (2–5 bullets)

Briefly describe **your own contributions** since the last milestone.  

- **Designed Defense Parameters:** Translated the 39.71% slippage and $9.5M cost data from M2 into a "Volume-Based Circuit Breaker" specification, setting a hard limit for single-block token acquisition.
- **Authored Decision Log:** Created a formal Decision Log to document the architectural choice of utilizing a volume-based circuit breaker over traditional timelocks to counter flash loan attacks.
- **Developed Validation Script:** Coded a Python simulator (`threshold_validator.py`) to test the newly defined defensive thresholds against varied transaction sizes.
- **Generated Test Results:** Executed the simulation and compiled the output logs (`simulation_test_results.log`) to prove that the proposed threshold blocks attacks with zero false positives for normal market behavior.

---

## 2) Evidence (at least 2 items)

Provide **verifiable evidence** that supports your contributions.  

### Optimized Evidence Table (Concise & Compliant Format)

| #   | Evidence Type   | Link / Reference                      | Description                                                                                          |
| --- | --------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 1   | Design Artifact | `M3_Defense_Trigger_Specification.md` | Detailed specification mapping M2 slippage data to smart contract circuit-breaker thresholds.        |
| 2   | Design Artifact | `Defense_Decision_Log.md`             | Formal documentation justifying the selected defense mechanism based on M1/M2 attack vectors.        |
| 3   | Code / Script   | `threshold_validator.py`              | Python script testing the defense logic against simulated on-chain transactions.                     |
| 4   | Test Log        | `simulation_test_results.log`         | Raw output log from the validation script proving the successful interception of flash loan volumes. |

---

## 3) Validation You Performed (at least 1 item)

- **What did you test/verify?** I ran `threshold_validator.py` to test our newly defined defense threshold (triggering at >50,000 COMP single-block acquisition) against historical normal trading data and our simulated M2 attack data (400,000 COMP).
- **What was the result?** The generated `simulation_test_results.log` confirms that the defense mechanism correctly intercepted the simulated governance attack (blocking the 400,000 COMP transaction) while successfully letting normal market transactions (e.g., 10k COMP) pass. 

---

## 4) AI Usage Transparency (required)

- **AI tool(s) used:** Gemini / Claude / Doubao
- **One AI output I rejected (and why it was wrong, risky, or insufficient):** I asked the AI for suggestions on defending against flash loan governance attacks. The AI recommended "increasing the voting timelock delay." I rejected this because our M1/M2 research showed the attack utilizes flash loans within a *single transaction/block* to snapshot voting power, rendering standard timelocks completely ineffective for this specific attack vector. Instead, I designed a volume/slippage-based circuit breaker.

---

## 5) Reflection / Risk / Next Step (short)

By converting theoretical economic limits into hardcoded defense parameters, I successfully bridged the gap between data analysis and smart contract security. The primary remaining risk is the gas overhead introduced by our circuit breaker checks on every transaction. Moving forward to the final project submission, I will assist the team in summarizing the overall effectiveness of our attack/defense simulation for the final report.

---
