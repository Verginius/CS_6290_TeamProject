# Foundry Scripts Documentation

This directory contains Foundry scripts for deploying, setting up, and simulating governance attacks.

## Overview

The scripts are organized in the following workflow:

```
1. Deploy.s.sol       → Deploy all contracts to testnet/local fork
2. SetupScenarios.s.sol → Configure governance parameters and token distributions
3. SimulateAttacks.s.sol → Run attack simulations
4. ExportData.s.sol    → Export results to JSON for analysis
```

---

## Scripts

### 1. Deploy.s.sol

**Purpose:** Comprehensive deployment of all governance, mock, and attack contracts.

**What it deploys:**
- Governance Token (ERC20Votes)
- Governor (Vulnerable version)
- Governor (Defended version with security measures)
- Timelock (Transaction delay mechanism)
- Mock contracts:
  - MockFlashLoanProvider (Aave-style flash loan)
  - MockToken (Flexible ERC20 for testing)
  - MockTreasury (Multi-sig DAO treasury)
- Attack contracts:
  - FlashLoanAttack
  - WhaleManipulation
  - ProposalSpam
  - QuorumManipulation
  - TimelockExploit

**Configuration:** 
Located in Deploy.s.sol contract constants:
```solidity
uint256 private constant GOV_TOKEN_INITIAL_SUPPLY = 1_000_000_000e18;  // 1B tokens
uint256 private constant VOTING_DELAY = 1;                             // 1 block
uint256 private constant VOTING_PERIOD = 50_400;                       // ~1 week
uint256 private constant PROPOSAL_THRESHOLD = 0;                       // 0% (vulnerable)
uint256 private constant QUORUM_VOTES = 0;                             // 0% (vulnerable)
uint256 private constant TIMELOCK_DELAY = 2 days;
```

**Usage:**
```bash
# Deploy to local Foundry fork
forge script script/Deploy.s.sol:Deploy --fork-url http://localhost:8545 --broadcast --private-key $PRIVATE_KEY

# Deploy to public testnet (e.g., Sepolia)
forge script script/Deploy.s.sol:Deploy --rpc-url https://eth-sepolia.g.alchemyapi.io/v2/YOUR_API_KEY --broadcast --private-key $PRIVATE_KEY
```

**Output:**
- Deployed contract addresses (printed to console and saved in broadcast/)
- Example from execution:
```
Gov Token:              0x1234...
Governor Vulnerable:    0x5678...
Governor Defended:      0x9abc...
Timelock:               0xdef0...
Mock Treasury:          0x1111...
Flash Loan Provider:    0x2222...
Mock Token:             0x3333...
Attack Contracts:       0x4444...
```

---

### 2. SetupScenarios.s.sol

**Purpose:** Create predefined test scenarios with different governance configurations and token distributions.

**Available Scenarios:**

| Scenario | Quorum | Proposal Threshold | Timelock | Token Distribution | Use Case |
|----------|--------|-------------------|----------|-------------------|----------|
| **A** - Extreme | 0% | 0% | None | Single whale (60%) | Maximum vulnerability |
| **B** - Whale-Heavy | 4% | 1% | 2 days | Top 3 whales (80%) | High concentration |
| **C** - Distributed | 10% | 1% | 2 days | 100 equal holders | Moderate distribution |
| **D** - Fair | 20% | 2% | 1 week | Gaussian distribution | Realistic governance |
| **E** - Paranoid | 50% | 5% | 1 week | 1000 equal holders | Maximum security |

**Usage:**

```bash
# Use default scenario (A - Extreme)
forge script script/SetupScenarios.s.sol:SetupScenarios --fork-url http://localhost:8545 --broadcast

# Use specific scenario
SCENARIO=B forge script script/SetupScenarios.s.sol:SetupScenarios --fork-url http://localhost:8545 --broadcast
SCENARIO=E forge script script/SetupScenarios.s.sol:SetupScenarios --fork-url http://localhost:8545 --broadcast
```

**Output:**
```
Selected Scenario: Scenario A - Extreme Vulnerability
Description: Single whale with 60% voting power, zero quorum, no timelock...

✅ Governance Token deployed at: 0x...
✅ Vulnerable Governor deployed at: 0x...
✅ Defended Governor deployed at: 0x...
✅ Mock Treasury deployed at: 0x...

Token distribution complete:
  Whale receives: 600000000 tokens (60%)

Next Steps:
1. Run attack simulations: forge script script/SimulateAttacks.s.sol
2. Export results: forge script script/ExportData.s.sol
3. Run tests: forge test
```

---

### 3. SimulateAttacks.s.sol

**Purpose:** Execute all five attack types against the vulnerable governor and collect success metrics.

**Attacks Simulated:**

1. **Flash Loan Attack**
   - Beanstalk-style attack using flash loans
   - Bypasses voting power checks
   - Exploits getVotes vs getPastVotes difference
   - Expected cost: ~$450k
   - Risk Level: CRITICAL

2. **Whale Manipulation**
   - Concentrated voting power (>51%)
   - Single actor passes self-serving proposals
   - No coalition needed
   - Expected cost: ~$50k (just holding tokens)
   - Risk Level: HIGH

3. **Proposal Spam**
   - Creates 50+ spam proposals
   - Buries legitimate governance
   - Exploits zero proposal threshold
   - Expected cost: ~$200k in gas
   - Risk Level: MEDIUM

4. **Quorum Manipulation**
   - Timing attacks during low participation
   - Sybil account creation
   - Exploits zero quorum requirement
   - Expected cost: ~$150k
   - Risk Level: HIGH

5. **Timelock Exploit**
   - Emergency function bypasses
   - Front-running timelock execution
   - Reentrancy during execution
   - Expected cost: ~$300k
   - Risk Level: HIGH

**Usage:**

```bash
# Simulate all attacks
forge script script/SimulateAttacks.s.sol:SimulateAttacks --fork-url http://localhost:8545 --broadcast

# With specific contract addresses (optional - loads from environment)
GOV_TOKEN_ADDRESS=0x... GOVERNOR_VULNERABLE_ADDRESS=0x... forge script script/SimulateAttacks.s.sol:SimulateAttacks --fork-url http://localhost:8545 --broadcast
```

**Output:**
```
╔════════════════════════════════════════════════════════════╗
║           RUNNING GOVERNANCE ATTACK SIMULATIONS           ║
╚════════════════════════════════════════════════════════════╝

📡 ATTACK 1: Flash Loan Attack
════════════════════════════════════════════════════════════
Creating Flash Loan Attack contract...
Attack execution result:  true
Stolen amount:    500000000000000000000000000
Attack succeeded: true
✅ Flash Loan Attack simulation completed

📡 ATTACK 2: Whale Manipulation
════════════════════════════════════════════════════════════
Created whale with 60% voting power
Attack execution result:  true
Stolen amount:     60000000000000000000000000
Attack succeeded:  true
✅ Whale Manipulation simulation completed

[... additional attack details ...]

═══════════════════════════════════════════════════════════
Overall Success Rate:  80 %
═══════════════════════════════════════════════════════════
```

---

### 4. ExportData.s.sol

**Purpose:** Parse attack simulation results and export to JSON format for frontend/analysis pipeline.

**Output Format:**

```json
{
  "metadata": {
    "timestamp": "2024-01-01T00:00:00Z",
    "network": "mainnet-fork",
    "totalAttacks": 5
  },
  "attacks": [
    {
      "id": 1,
      "name": "Flash Loan Attack",
      "succeeded": true,
      "amountExtracted": "500000000000000000000000000",
      "estimatedCost": 450000,
      "estimatedProfitability": "1111111.11",
      "riskLevel": "CRITICAL",
      "details": "Beanstalk-style attack using flash loans..."
    },
    {
      "id": 2,
      "name": "Whale Manipulation",
      "succeeded": true,
      "amountExtracted": "60000000000000000000000000",
      "estimatedCost": 50000,
      "estimatedProfitability": "1200000.00",
      "riskLevel": "HIGH",
      "details": "..."
    },
    ...
  ],
  "summary": {
    "totalSuccessful": 4,
    "successRate": 80,
    "totalExtracted": "1,061,000,000000000000000000",
    "averageCost": 226000,
    "highestRiskAttack": "CRITICAL",
    "lowestCostAttack": "Whale Manipulation"
  }
}
```

**Usage:**

```bash
# Export data to console (for viewing/piping)
forge script script/ExportData.s.sol:ExportData --fork-url http://localhost:8545

# Export and save to file
forge script script/ExportData.s.sol:ExportData --fork-url http://localhost:8545 > results.json
```

**Output File Location:**
```
analysis/data/processed/attack_simulation_results.json
```

---

## Complete Workflow Example

### Step 1: Start Local Fork
```bash
# Terminal 1: Start Anvil fork
anvil --fork-url https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY
```

### Step 2: Deploy Contracts
```bash
# Terminal 2: Deploy
forge script script/Deploy.s.sol:Deploy --fork-url http://localhost:8545 --broadcast --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476c6b8d8c6a5c97bad9a1d96a5
```

### Step 3: Setup Scenario
```bash
# Setup extreme vulnerability scenario
forge script script/SetupScenarios.s.sol:SetupScenarios --fork-url http://localhost:8545 --broadcast --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476c6b8d8c6a5c97bad9a1d96a5

# Or setup fair governance scenario
SCENARIO=D forge script script/SetupScenarios.s.sol:SetupScenarios --fork-url http://localhost:8545 --broadcast --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476c6b8d8c6a5c97bad9a1d96a5
```

### Step 4: Run Simulations
```bash
# Run all attack simulations
forge script script/SimulateAttacks.s.sol:SimulateAttacks --fork-url http://localhost:8545 --broadcast --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476c6b8d8c6a5c97bad9a1d96a5
```

### Step 5: Export Results
```bash
# Export attack data to JSON
forge script script/ExportData.s.sol:ExportData --fork-url http://localhost:8545 > analysis/data/processed/attack_results.json
```

### Step 6: Analyze
```bash
# Python analysis pipeline (Student 4)
python analysis/scripts/analyze_attacks.py analysis/data/processed/attack_results.json

# Frontend dashboard (Student 5)
cd frontend && npm run dev
```

---

## Environment Variables

Create a `.env` file in the project root:

```bash
# RPC endpoints
MAINNET_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemyapi.io/v2/YOUR_API_KEY
LOCALHOST_RPC_URL=http://localhost:8545

# Private key (for broadcasting transactions)
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb476c6b8d8c6a5c97bad9a1d96a5

# Network selection
NETWORK=localhost

# Scenario selection
SCENARIO=A  # Options: A, B, C, D, E
```

**Note:** Never commit actual private keys to version control. Use `.env.local` and add `.env.local` to `.gitignore`.

---

## Output Artifacts

### Broadcast Directory
After running scripts with `--broadcast`, artifacts are saved to:
```
broadcast/
├── Deploy.s.sol/
│   ├── 31337-fork.json (Anvil)
│   └── 11155111-fork.json (Sepolia)
├── SetupScenarios.s.sol/
│   └── ...
├── SimulateAttacks.s.sol/
│   └── ...
└── ExportData.s.sol/
    └── ...
```

Each JSON file contains:
- All transaction data
- State changes
- Contract deployment addresses
- Call traces

### Analysis Output
```
analysis/data/processed/
├── attack_simulation_results.json
├── vulnerability_metrics.json
├── defense_effectiveness.json
└── attack_cost_analysis.json
```

---

## Troubleshooting

### Issue: Gas estimation failing
**Solution:** 
- Ensure you have sufficient ETH for gas
- Try without `--broadcast` first to view simulation
- Increase gas limit: `--gas-limit 10000000`

### Issue: Contract addresses not found
**Solution:**
- Check broadcast/ directory for previous deployments
- Verify RPC connection: `curl http://localhost:8545 -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"net_version","params":[],"id":1}'`
- Run Deploy.s.sol first

### Issue: Scenario environment variable not being read
**Solution:**
- Use lowercase option: `scenario=A` won't work, must be `SCENARIO=A`
- Verify env file exists: `cat .env`
- Source env: `source .env` before running script

### Issue: MockFlashLoanProvider balance insufficient
**Solution:**
- Adjust FLASH_LOAN_AMOUNT in SimulateAttacks.s.sol
- Ensure MockToken has been minted to provider
- Check Initialize sequence in Deploy.s.sol

---

## Performance Tips

1. **Parallel scenario testing:**
   ```bash
   SCENARIO=A forge script ... --fork-url http://localhost:8545 & 
   SCENARIO=B forge script ... --fork-url http://localhost:8545 &
   wait
   ```

2. **Caching:** Use persistent fork to avoid re-syncing:
   ```bash
   anvil --fork-url https://... --fork-block-number 18000000
   ```

3. **Gas optimization:** Run simulations on local fork first, then target testnet

---

## Integration with Other Components

### For Student 3 (Testing):
- Use deployed contract addresses from broadcast/
- Run test suite: `forge test --fork-url http://localhost:8545`
- Filter by test name: `forge test --match-contract GovernorVulnerable_Test`

### For Student 4 (Analysis):
- Consume JSON output from ExportData.s.sol
- Process simulation results in `analysis/scripts/`
- Generate metrics for dashboard

### For Student 5 (Frontend):
- Use exported JSON as API data source
- Visualize attack scenarios
- Display defense effectiveness
- Show risk assessments

---

## Reference

- [Foundry Scripts Documentation](https://book.getfoundry.sh/tutorials/solidity-scripting)
- [Anvil Documentation](https://book.getfoundry.sh/reference/anvil/)
- [Common Governance Attacks](../docs/Preliminary%20Assessment%20of%20Compound%20Governance%20Attack%20Cost.md)
- [Specs: Attack Scenarios](../docs/specs/Attack_Scenarios.md)
- [Specs: Defense Mechanisms](../docs/specs/Defense_Mechanisms.md)
