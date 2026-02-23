Excellent! Now let me create a comprehensive final plan document for your review:

---

# **FINAL PROJECT PLAN: On-Chain Governance Attack Simulation**
## **With Spec-Driven Development & Interactive Visualization Dashboard**

---

## **PROJECT SUMMARY**

**Team Size:** 5 students  
**Duration:** 8-10 weeks  
**Smart Contract Framework:** Foundry (Solidity)  
**Front-end:** React + TypeScript + Recharts + D3.js  
**Backend:** Node.js + Express API  
**Deployment:** Local development environment  
**Focus:** 5 attack types with comprehensive analysis and interactive visualization  

---

## **TEAM STRUCTURE (FINALIZED)**

### **👤 Student 1: Spec, Architecture & Core Governance Lead**
**Primary Skills Needed:** Solidity, system design, technical writing  

**Responsibilities:**
- Write formal specifications for all system components
- Design and implement core governance smart contracts
- Create system architecture documentation
- Coordinate integration across all team members
- Review code against specifications

**Key Deliverables:**
- Complete specifications in `specs/` directory
- Core governance contracts in `src/governance/`
- Architecture diagrams and technical documentation
- Integration coordination

---

### **👤 Student 2: Attack Implementation Engineer**
**Primary Skills Needed:** Solidity, security research, testing  

**Responsibilities:**
- Research real-world governance attack vectors
- Implement all 5 attack smart contracts
- Create mock contracts for testing (flash loan providers, etc.)
- Build Foundry simulation scripts
- Export attack data in JSON format for frontend

**Key Deliverables:**
- Attack contracts in `src/attacks/`
- Mock contracts in `src/mocks/`
- Simulation scripts in `script/`
- Attack documentation with diagrams
- JSON data exports for dashboard

---

### **👤 Student 3: Testing & Defense Engineer**
**Primary Skills Needed:** Solidity testing, security, quality assurance  

**Responsibilities:**
- Build comprehensive Foundry test suite
- Implement defense mechanism contracts
- Run attack vs defense scenario testing
- Achieve >90% test coverage
- Generate test result exports

**Key Deliverables:**
- Complete test suite in `test/`
- Defense contracts in `src/defenses/`
- Test coverage reports
- Defense effectiveness evaluation
- Integration test results

---

### **👤 Student 4: Data Analysis & Metrics Engineer**
**Primary Skills Needed:** Python, data analysis, statistics  

**Responsibilities:**
- Design comprehensive metrics framework
- Build Python scripts to parse simulation data
- Calculate economic and effectiveness metrics
- Create Node.js API endpoints for frontend
- Generate insights and comparative analyses

**Key Deliverables:**
- Python analysis scripts in `analysis/scripts/`
- Metrics calculation documentation
- Node.js Express API in `backend/`
- API documentation
- Analysis findings for final report

---

### **👤 Student 5: Front-end Visualization & Dashboard Developer**
**Primary Skills Needed:** React, TypeScript, data visualization (will learn on the job)  

**Responsibilities:**
- Build interactive web dashboard using React + TypeScript
- Implement data visualizations using Recharts + D3.js
- Integrate with Node.js API backend
- Connect to local Foundry Anvil testnet via Web3
- Create engaging UI/UX for attack simulations
- Deploy dashboard locally with documentation

**Key Deliverables:**
- Complete React application in `frontend/`
- 7 dashboard pages with interactive visualizations
- Real-time Web3 integration with Anvil
- API integration with Node.js backend
- User guide and demo mode
- Local deployment with setup instructions

---

## **COMPLETE PROJECT STRUCTURE**

```
CS_6290_TeamProject/
│
├── README.md                       # Project overview and setup
├── PROJECT_PLAN.md                 # This comprehensive plan
├── foundry.toml                    # Foundry configuration
├── package.json                    # Root package.json for scripts
│
├── specs/                          # 📋 Formal Specifications (Student 1)
│   ├── ATTACK_SCENARIOS.md        # Detailed attack specifications
│   ├── DEFENSE_MECHANISMS.md      # Defense system specifications
│   ├── GOVERNANCE_SPEC.md         # Governance protocol design
│   └── ANALYSIS_METRICS.md        # Metrics definitions and formulas
│
├── src/                            # 📝 Smart Contracts (Solidity)
│   │
│   ├── governance/                # 🏛️ Core Governance (Student 1)
│   │   ├── GovernorBase.sol      # Base governance implementation
│   │   ├── GovernorWithDefenses.sol # Protected governance
│   │   ├── GovernorVulnerable.sol # Intentionally vulnerable version
│   │   ├── GovernanceToken.sol    # ERC20Votes token
│   │   └── Timelock.sol           # Timelock controller
│   │
│   ├── attacks/                   # ⚔️ Attack Contracts (Student 2)
│   │   ├── FlashLoanAttack.sol   # Flash loan governance attack
│   │   ├── WhaleManipulation.sol  # Whale voting power attack
│   │   ├── ProposalSpam.sol       # Spam attack implementation
│   │   ├── QuorumManipulation.sol # Sybil/quorum attack
│   │   └── TimelockExploit.sol    # Emergency function exploit
│   │
│   ├── defenses/                  # 🛡️ Defense Mechanisms (Student 3)
│   │   ├── SnapshotVoting.sol    # Historical balance voting
│   │   ├── DynamicQuorum.sol      # Adaptive quorum system
│   │   ├── VotingDelay.sol        # Proposal delay mechanism
│   │   ├── TokenLocking.sol       # Vote period token locks
│   │   └── EmergencyPause.sol     # Guardian pause system
│   │
│   ├── mocks/                     # 🎭 Mock Contracts (Student 2)
│   │   ├── MockFlashLoanProvider.sol # Aave-style flash loans
│   │   ├── MockToken.sol          # Test ERC20 tokens
│   │   └── MockTreasury.sol       # DAO treasury simulation
│   │
│   └── libraries/                 # 📚 Shared Libraries (Student 1)
│       ├── GovernanceMath.sol     # Quorum/voting calculations
│       ├── VotingPower.sol        # Vote weight calculations
│       └── ProposalLib.sol        # Proposal utilities
│
├── test/                          # 🧪 Test Suite (Student 3)
│   ├── BaseTest.sol              # Base test setup and utilities
│   ├── FlashLoanAttack.t.sol     # Flash loan attack tests
│   ├── WhaleManipulation.t.sol   # Whale attack tests
│   ├── ProposalSpam.t.sol        # Spam attack tests
│   ├── QuorumManipulation.t.sol  # Quorum attack tests
│   ├── TimelockExploit.t.sol     # Timelock exploit tests
│   ├── DefenseTests.t.sol        # Defense mechanism tests
│   ├── Integration.t.sol         # End-to-end integration tests
│   └── helpers/                   # Test helper contracts
│       ├── TestHelpers.sol
│       └── AttackScenarios.sol
│
├── script/                        # 🔧 Foundry Scripts (Student 2 & 1)
│   ├── Deploy.s.sol              # Deploy all contracts
│   ├── SimulateAttacks.s.sol     # Run attack simulations
│   ├── ExportData.s.sol          # Export results to JSON
│   ├── SetupScenarios.s.sol      # Create test scenarios
│   └── README.md                  # Script usage guide
│
├── analysis/                      # 📊 Data Analysis (Student 4)
│   ├── data/                     # Simulation results storage
│   │   ├── raw/                  # Raw test outputs
│   │   │   ├── flash_loan_results.json
│   │   │   ├── whale_attack_results.json
│   │   │   ├── proposal_spam_results.json
│   │   │   ├── quorum_manipulation_results.json
│   │   │   └── timelock_exploit_results.json
│   │   └── processed/            # Processed/aggregated data
│   │       ├── attack_summary.json
│   │       ├── defense_effectiveness.json
│   │       └── metrics.json
│   │
│   ├── scripts/                  # Python analysis scripts
│   │   ├── parse_results.py     # Parse Foundry output
│   │   ├── calculate_metrics.py # Compute all metrics
│   │   ├── aggregate_data.py    # Aggregate simulation data
│   │   └── export_for_api.py    # Prepare data for API
│   │
│   ├── notebooks/                # Jupyter notebooks (optional)
│   │   ├── economic_analysis.ipynb
│   │   ├── defense_effectiveness.ipynb
│   │   └── visualization_prototypes.ipynb
│   │
│   ├── requirements.txt          # Python dependencies
│   └── README.md                 # Analysis documentation
│
├── backend/                       # 🖥️ Node.js API (Student 4)
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   │
│   ├── src/
│   │   ├── server.ts             # Express server setup
│   │   ├── config.ts             # Configuration
│   │   │
│   │   ├── routes/               # API routes
│   │   │   ├── attacks.ts       # GET /api/attacks/*
│   │   │   ├── defenses.ts      # GET /api/defenses/*
│   │   │   ├── metrics.ts       # GET /api/metrics/*
│   │   │   ├── simulations.ts   # GET /api/simulations/*
│   │   │   └── governance.ts    # GET /api/governance/*
│   │   │
│   │   ├── services/            # Business logic
│   │   │   ├── dataLoader.ts   # Load JSON data
│   │   │   ├── metricsService.ts # Metrics calculations
│   │   │   └── web3Service.ts   # Web3 interactions
│   │   │
│   │   ├── middleware/          # Express middleware
│   │   │   ├── cors.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── logger.ts
│   │   │
│   │   └── types/               # TypeScript types
│   │       ├── attack.ts
│   │       ├── defense.ts
│   │       └── metrics.ts
│   │
│   └── README.md                # API documentation
│
├── frontend/                     # 🎨 React Dashboard (Student 5)
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── index.html
│   │
│   ├── public/                  # Static assets
│   │   ├── logo.svg
│   │   └── favicon.ico
│   │
│   ├── src/
│   │   ├── main.tsx            # Application entry point
│   │   ├── App.tsx             # Root component
│   │   ├── vite-env.d.ts
│   │   │
│   │   ├── pages/              # Dashboard pages (7 pages)
│   │   │   ├── HomePage.tsx           # Overview dashboard
│   │   │   ├── AttackSimulation.tsx   # Live attack simulator
│   │   │   ├── ComparativeAnalysis.tsx # Attack comparisons
│   │   │   ├── GovernanceMonitor.tsx   # Live governance state
│   │   │   ├── EconomicAnalysis.tsx    # Cost-benefit analysis
│   │   │   ├── DefenseConfigLab.tsx    # Defense testing tool
│   │   │   └── HistoricalData.tsx      # Trends over time
│   │   │
│   │   ├── components/         # React components
│   │   │   │
│   │   │   ├── charts/        # Recharts + D3 visualizations
│   │   │   │   ├── AttackSuccessChart.tsx
│   │   │   │   ├── DefenseEffectivenessMatrix.tsx
│   │   │   │   ├── CostBreakdownChart.tsx
│   │   │   │   ├── TokenDistribution.tsx
│   │   │   │   ├── ProposalTimeline.tsx
│   │   │   │   ├── ProfitabilityScatter.tsx
│   │   │   │   ├── GovernanceHealthGauge.tsx
│   │   │   │   ├── AttackFlowDiagram.tsx (D3.js)
│   │   │   │   └── NetworkGraph.tsx (D3.js)
│   │   │   │
│   │   │   ├── simulation/    # Attack simulation components
│   │   │   │   ├── AttackLauncher.tsx
│   │   │   │   ├── AttackControls.tsx
│   │   │   │   ├── LiveExecutionViewer.tsx
│   │   │   │   ├── BlockchainStateCard.tsx
│   │   │   │   └── ResultsDisplay.tsx
│   │   │   │
│   │   │   ├── ui/            # shadcn/ui components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── slider.tsx
│   │   │   │   ├── table.tsx
│   │   │   │   ├── tabs.tsx
│   │   │   │   └── badge.tsx
│   │   │   │
│   │   │   └── layout/        # Layout components
│   │   │       ├── Header.tsx
│   │   │       ├── Sidebar.tsx
│   │   │       ├── Layout.tsx
│   │   │       └── Footer.tsx
│   │   │
│   │   ├── hooks/             # Custom React hooks
│   │   │   ├── useWeb3.ts            # Web3 connection
│   │   │   ├── useSimulationData.ts  # Load simulation data
│   │   │   ├── useAttackExecution.ts # Execute attacks
│   │   │   ├── useGovernanceState.ts # Read governance state
│   │   │   └── useAPI.ts             # API calls
│   │   │
│   │   ├── lib/               # Utilities and helpers
│   │   │   ├── web3.ts       # ethers.js setup
│   │   │   ├── api.ts        # API client
│   │   │   ├── contracts.ts  # Contract ABIs and addresses
│   │   │   ├── formatters.ts # Data formatting utilities
│   │   │   └── constants.ts  # App constants
│   │   │
│   │   ├── types/            # TypeScript type definitions
│   │   │   ├── attack.ts
│   │   │   ├── defense.ts
│   │   │   ├── metrics.ts
│   │   │   ├── governance.ts
│   │   │   └── simulation.ts
│   │   │
│   │   ├── stores/           # State management (Zustand)
│   │   │   ├── simulationStore.ts
│   │   │   ├── web3Store.ts
│   │   │   └── uiStore.ts
│   │   │
│   │   └── styles/
│   │       └── globals.css
│   │
│   └── README.md              # Frontend setup and usage
│
├── docs/                       # 📚 Documentation
│   ├── ARCHITECTURE.md        # System architecture overview
│   ├── ATTACK_ANALYSIS.md     # Detailed attack findings
│   ├── DEFENSE_EVALUATION.md  # Defense mechanism analysis
│   ├── API_DOCUMENTATION.md   # Backend API docs
│   ├── FRONTEND_GUIDE.md      # Dashboard user guide
│   ├── SETUP_GUIDE.md         # Setup instructions
│   ├── TEAM_GUIDE.md          # Team workflow
│   └── FINAL_REPORT.md        # Academic final report
│
└── lib/                        # Foundry dependencies (auto-managed)
    ├── forge-std/
    └── openzeppelin-contracts/
```

---

## **ATTACK SCENARIOS (5 TYPES)**

### **1. Flash Loan Governance Attack** ⚡
**Priority:** HIGHEST  
**Real-world precedent:** Beanstalk ($181M stolen, 2022)

**Attack Mechanism:**
1. Attacker borrows massive amount of governance tokens via flash loan
2. Uses borrowed tokens to gain voting power
3. Creates and immediately votes on malicious proposal
4. Executes proposal within same transaction (if no timelock)
5. Drains treasury or changes critical parameters
6. Repays flash loan, keeps stolen funds

**Test Scenarios:**
- ✅ Attack vulnerable governance (no timelock) → SUCCESS
- ✅ Attack protected governance (with timelock) → FAILURE
- ✅ Attack with insufficient loan amount → FAILURE
- ✅ Multiple simultaneous attackers
- ✅ Cost-benefit analysis at different TVL levels

**Success Metrics:**
- Attack profitability ratio
- Minimum viable attack cost
- Break-even treasury value
- Defense penetration success rate

---

### **2. Whale Manipulation Attack** 🐋
**Priority:** HIGH  
**Real-world context:** Common in many DAOs with concentrated holdings

**Attack Mechanism:**
1. Large token holder(s) accumulate >40-51% voting power
2. Create self-serving proposals (treasury transfers, parameter changes)
3. Vote passes due to whale dominance
4. Low participation from other voters enables attack
5. May involve coordination between multiple whales

**Test Scenarios:**
- ✅ Single whale with 51% voting power
- ✅ Multiple whales coordinating (60% combined)
- ✅ Whale attack with 10% participation vs 50% participation
- ✅ Quadratic voting defense testing
- ✅ Vote weight cap effectiveness

**Success Metrics:**
- Minimum voting power for success
- Impact of participation rate
- Token concentration index (Herfindahl-Hirschman Index)
- Effectiveness of anti-whale mechanisms

---

### **3. Proposal Spam Attack** 📨
**Priority:** MEDIUM  
**Real-world context:** Attempted against various DAOs

**Attack Mechanism:**
1. Attacker creates numerous spam proposals
2. Legitimate proposals buried in noise
3. Voter fatigue reduces participation
4. Malicious proposal hidden among spam passes unnoticed
5. Exploits low proposal submission costs

**Test Scenarios:**
- ✅ Create 50+ proposals in short timeframe
- ✅ Hide malicious proposal (treasury drain) among 100 spam proposals
- ✅ Measure voter participation decay over time
- ✅ Test rate limiting defense (1 proposal per address per week)
- ✅ Test proposal threshold defense (1% supply required)

**Success Metrics:**
- Cost per spam proposal
- Voter participation decay rate
- Detection rate of malicious proposals
- Effectiveness of rate limiting
- Proposal threshold impact

---

### **4. Quorum Manipulation** 📊
**Priority:** MEDIUM  
**Real-world context:** Exploited in low-participation DAOs

**Attack Mechanism:**
1. Attacker times proposal during low participation period
2. Creates Sybil accounts to inflate/deflate quorum
3. Manipulates participation to reach or avoid quorum threshold
4. Fixed quorum systems most vulnerable
5. Can combine with other attacks

**Test Scenarios:**
- ✅ Sybil attack with 100 fake accounts
- ✅ Strategic voting at 2am vs 2pm (simulated participation)
- ✅ Quorum bypass in 5% participation vs 30% participation
- ✅ Dynamic quorum defense (adjusts to recent participation)
- ✅ Minimum voting period defense (7 days vs 1 day)

**Success Metrics:**
- Cost to create sufficient Sybil accounts
- Effectiveness of dynamic quorum
- Participation rate variance analysis
- Detection accuracy (Sybil vs legitimate)

---

### **5. Timelock Exploit** ⏰
**Priority:** MEDIUM  
**Real-world context:** Emergency functions sometimes misused

**Attack Mechanism:**
1. Exploit emergency functions that bypass timelock
2. Admin/guardian privileges abused during timelock period
3. Front-run timelock expiration to extract value
4. Cancel legitimate proposals during timelock
5. Exploit gaps in timelock implementation

**Test Scenarios:**
- ✅ Emergency function bypass of 48-hour timelock
- ✅ Front-running proposal execution
- ✅ Proposal cancellation during timelock
- ✅ User exit capability during timelock period
- ✅ Multi-sig guardian effectiveness

**Success Metrics:**
- % of users able to exit during timelock
- Emergency response time measurement
- Timelock coverage (% of critical functions protected)
- Bypass attempt success rate

---

## **DEFENSE MECHANISMS (4 LAYERS)**

### **Layer 1: Time-Based Defenses** ⏱️
**Purpose:** Prevent same-block attacks, allow community response

**Mechanisms:**
1. **Voting Delay** (1-2 days)
   - Delay between proposal creation and voting start
   - Prevents flash loan attacks (can't vote in same transaction)
   - Allows community review time

2. **Voting Period** (5-7 days)
   - Extended window for voting
   - Increases participation
   - Harder to time low-participation attacks

3. **Timelock** (24-48 hours)
   - Delay between proposal passing and execution
   - Users can exit if malicious proposal passes
   - Community can organize response

4. **Grace Period** (additional 12-24 hours)
   - Extra time for users to react
   - Overlaps with timelock

**Effectiveness:**
- ✅ Blocks: Flash loan attacks
- ✅ Mitigates: Whale manipulation, Quorum manipulation
- ⚠️ Trade-off: Reduces governance agility

---

### **Layer 2: Token-Based Defenses** 🪙
**Purpose:** Ensure voting power represents commitment

**Mechanisms:**
1. **Snapshot Voting**
   - Use token balances from past block (e.g., proposal creation block - 1)
   - Prevents acquiring tokens just for vote
   - Blocks flash loan voting

2. **Token Locking**
   - Lock tokens for duration of voting period
   - Prevents vote manipulation via token trading
   - Ensures skin in the game

3. **Minimum Holding Period**
   - Require tokens held for X days before proposal creation
   - Prevents last-minute accumulation for specific votes

4. **Vote Delegation Timelock**
   - Delegation changes take effect after delay (24-48 hours)
   - Prevents delegation market manipulation

**Effectiveness:**
- ✅ Blocks: Flash loan attacks
- ✅ Mitigates: Whale manipulation
- ⚠️ Trade-off: Reduces liquidity, may discourage participation

---

### **Layer 3: Threshold & Quorum Mechanisms** 📈
**Purpose:** Ensure sufficient participation and prevent minority control

**Mechanisms:**
1. **Dynamic Quorum**
   - Adjust quorum based on recent participation
   - Formula: `quorum = (avgParticipation * 0.7) + (totalSupply * 0.05)`
   - Prevents quorum manipulation

2. **Supermajority Requirements**
   - Critical proposals require >60% approval (not just >50%)
   - Treasury transfers, parameter changes
   - Harder for whales to unilaterally pass proposals

3. **Minimum Proposal Threshold**
   - Require 1-5% of token supply to create proposal
   - Prevents spam attacks
   - Makes attack more expensive

4. **Per-Address Vote Cap**
   - Limit voting power to maximum % (e.g., 10%)
   - Reduces whale dominance
   - More democratic distribution

**Effectiveness:**
- ✅ Mitigates: Whale manipulation, Quorum manipulation
- ✅ Prevents: Proposal spam
- ⚠️ Trade-off: May exclude legitimate minority proposals

---

### **Layer 4: Structural Controls** 🏗️
**Purpose:** Add human oversight and emergency response

**Mechanisms:**
1. **Multi-sig Treasury**
   - Require 3-of-5 or 5-of-9 signatures for treasury access
   - Even if governance compromised, treasury protected
   - Human review layer

2. **Guardian/Security Council**
   - Trusted group can pause/veto in emergencies
   - 24-48 hour window to veto malicious proposals
   - Centralized but temporary (progressive decentralization)

3. **Optimistic Governance**
   - Proposals pass unless vetoed
   - Reduces voting fatigue
   - Guardian can veto if malicious

4. **Staged Rollout**
   - Critical changes require multiple sequential votes
   - E.g., "Signal vote" → "Implementation vote"
   - Extra scrutiny for important decisions

**Effectiveness:**
- ✅ Blocks: All attacks if guardians are vigilant
- ✅ Emergency response capability
- ⚠️ Trade-off: Centralization risk, trust required

---

## **COMPREHENSIVE METRICS & ANALYSIS**

### **Category 1: Economic Metrics** 💰

#### **1.1 Attack Profitability Ratio**
```
APR = (Funds Stolen - Attack Cost) / Attack Cost
```
- **Interpretation:** >0 = profitable, <0 = unprofitable
- **Purpose:** Determine if attack is economically rational
- **Expected Range:** -1.0 to 10.0 (varies by attack type)

#### **1.2 Attack Cost Breakdown**
```
Total Cost = Flash Loan Fees + Gas Costs + Token Purchase + Opportunity Cost
```
- **Flash Loan Fee:** Typically 0.09% (Aave)
- **Gas Cost:** Varies by complexity (estimate 500k-2M gas)
- **Token Purchase:** If attacker needs to buy tokens
- **Opportunity Cost:** Lost staking rewards, etc.

#### **1.3 Break-even Governance Control**
```
Minimum TVL for profitable attack = Total Attack Cost / (% of TVL extractable)
```
- **Purpose:** Identify which DAOs are vulnerable based on treasury size
- **Example:** If attack costs $50k and attacker can extract 50% of treasury, break-even TVL = $100k

#### **1.4 Cost-Benefit Matrix**
| Attack Type | Avg Cost | Success Rate | Avg Profit | ROI |
|-------------|----------|--------------|------------|-----|
| Flash Loan  | $X       | Y%           | $Z         | W%  |
| Whale       | ...      | ...          | ...        | ... |

---

### **Category 2: Defense Effectiveness Metrics** 🛡️

#### **2.1 Attack Success Rate**
```
Success Rate = Successful Attacks / Total Attack Attempts
```
- **Calculate for each:** Attack type, Defense configuration
- **Target:** 0% with defenses enabled, 100% without

#### **2.2 Defense Penetration Time**
```
Penetration Time = Time taken to bypass defense (blocks or seconds)
```
- **Timelock:** Should be ∞ (cannot bypass)
- **Rate Limiting:** Time to wait between proposals

#### **2.3 Timelock Coverage**
```
Coverage = (Functions Protected by Timelock / Total Critical Functions) × 100%
```
- **Target:** 100% for treasury, parameter changes
- **Exceptions:** Emergency pause functions

#### **2.4 False Positive Rate**
```
FPR = Legitimate Proposals Flagged as Attacks / Total Legitimate Proposals
```
- **Purpose:** Ensure defenses don't block normal governance
- **Target:** <5%

#### **2.5 Defense Effectiveness Matrix**
| Defense ↓ / Attack → | Flash Loan | Whale | Spam | Quorum | Timelock |
|---------------------|-----------|-------|------|--------|----------|
| Snapshot Voting     | ✅ 100%   | ⚠️ 30% | ❌ 0% | ❌ 0%   | ❌ 0%    |
| Voting Delay        | ✅ 100%   | ⚠️ 20% | ❌ 0% | ⚠️ 40%  | ❌ 0%    |
| Timelock            | ✅ 100%   | ⚠️ 50% | ❌ 0% | ❌ 0%   | ✅ 80%   |
| Dynamic Quorum      | ❌ 0%    | ❌ 0%  | ❌ 0% | ✅ 90%  | ❌ 0%    |
| Proposal Threshold  | ⚠️ 30%    | ❌ 0%  | ✅ 95%| ❌ 0%   | ❌ 0%    |
| Multi-sig Treasury  | ✅ 100%   | ✅ 100%| ✅100%| ✅ 100% | ✅ 100%  |

*Numbers are hypothetical - your simulation will generate actual data*

---

### **Category 3: Governance Health Metrics** 🏥

#### **3.1 Participation Rate**
```
Participation = (Votes Cast / Total Possible Votes) × 100%
```
- **Track over time** (especially during spam attacks)
- **Target:** >20% for healthy governance

#### **3.2 Token Concentration (Herfindahl-Hirschman Index)**
```
HHI = Σ(VotingPower_i)² for all holders
```
- **Range:** 0 to 10,000
- **<1,500:** Competitive (healthy)
- **1,500-2,500:** Moderate concentration
- **>2,500:** High concentration (vulnerable to whale attacks)

#### **3.3 Gini Coefficient**
```
Measures inequality in token distribution (0 = perfect equality, 1 = perfect inequality)
```
- **Purpose:** Assess fairness of governance
- **Typical DAO:** 0.7-0.9 (high inequality)

#### **3.4 Delegation Diversity**
```
Diversity = Unique Delegates / Total Token Holders
```
- **Higher = better** (more distributed power)
- **Target:** >10% delegation rate

#### **3.5 Proposal Success Rate**
```
Success Rate = Passed Proposals / Total Proposals
```
- **Healthy range:** 30-70%
- **Too high (>80%):** Possible rubber-stamping
- **Too low (<20%):** Governance dysfunction

---

### **Category 4: Comparative Analysis** 📊

#### **4.1 Attack Ranking by Danger**
Rank attacks by composite score:
```
Danger Score = (Success Rate × 0.4) + (Profitability × 0.3) + (Ease of Execution × 0.3)
```

**Expected Ranking (hypothesis):**
1. Flash Loan Attack (if no timelock)
2. Whale Manipulation (if concentrated holdings)
3. Timelock Exploit (if emergency functions exist)
4. Quorum Manipulation
5. Proposal Spam

#### **4.2 Defense ROI**
For each defense, calculate:
```
Defense ROI = (Attacks Prevented Value / Implementation Cost)
```
- **Implementation Cost:** Gas to deploy, governance complexity
- **Attacks Prevented Value:** TVL protected

#### **4.3 Security vs Usability Trade-off**
Create 2D chart:
- **X-axis:** Security Score (attacks blocked)
- **Y-axis:** Usability Score (proposal speed, participation ease)
- **Plot different defense configurations**
- **Identify Pareto frontier** (optimal configurations)

---

## **DETAILED TIMELINE (8-10 WEEKS)**

### **📅 Phase 1: Foundation & Setup (Weeks 1-2)**

#### **Week 1**
**Student 1 (Spec & Governance):**
- [ ] Day 1-2: Set up Foundry project structure
- [ ] Day 3-5: Write GOVERNANCE_SPEC.md (governance model, voting mechanisms)
- [ ] Day 6-7: Begin ATTACK_SCENARIOS.md (flash loan & whale attacks)
- [ ] Start implementing GovernanceToken.sol (ERC20Votes)

**Student 2 (Attacks):**
- [ ] Day 1-2: Research flash loan protocols (Aave, Balancer)
- [ ] Day 3-4: Study Beanstalk attack postmortem
- [ ] Day 5-7: Design attack contract architecture
- [ ] Begin MockFlashLoanProvider.sol

**Student 3 (Testing & Defense):**
- [ ] Day 1-3: Set up Foundry test framework
- [ ] Day 4-5: Create BaseTest.sol with common utilities
- [ ] Day 6-7: Write test scenarios document
- [ ] Define test data generators

**Student 4 (Analysis):**
- [ ] Day 1-2: Set up Python environment (pandas, numpy)
- [ ] Day 3-4: Design data schema (JSON format for results)
- [ ] Day 5-7: Write ANALYSIS_METRICS.md specification
- [ ] Create requirements.txt and folder structure

**Student 5 (Frontend):**
- [ ] Day 1-3: Learn React basics (if needed) - tutorials, documentation
- [ ] Day 4-5: Set up React + Vite project
- [ ] Day 6-7: Design UI mockups (Figma or paper sketches)
- [ ] Install Tailwind CSS, shadcn/ui

**Week 1 Milestone:** Project structure set up, specifications started, learning underway

---

#### **Week 2**
**Student 1:**
- [ ] Complete all specification documents
- [ ] Implement GovernorBase.sol (core governance logic)
- [ ] Create simple proposal system
- [ ] Write Natspec documentation for contracts

**Student 2:**
- [ ] Complete MockFlashLoanProvider.sol
- [ ] Implement basic FlashLoanAttack.sol (simple version)
- [ ] Create MockTreasury.sol
- [ ] Test flash loan mechanism works

**Student 3:**
- [ ] Write basic test cases for GovernorBase
- [ ] Create test helpers (deploy functions, etc.)
- [ ] Begin DEFENSE_MECHANISMS.md specification
- [ ] Plan defense contract architecture

**Student 4:**
- [ ] Create parse_results.py skeleton
- [ ] Set up Node.js + Express backend project
- [ ] Design API endpoints (documentation)
- [ ] Create TypeScript types for data

**Student 5:**
- [ ] Complete React/TypeScript tutorials
- [ ] Create basic dashboard layout (Header, Sidebar, Layout)
- [ ] Set up React Router for navigation
- [ ] Create placeholder pages (7 pages with "Coming Soon")
- [ ] Set up ethers.js and test connection to local network

**Week 2 Milestone:** 
- ✅ All specifications complete
- ✅ Basic governance contract working
- ✅ Test framework functional
- ✅ Frontend skeleton ready
- ✅ Student 5 comfortable with React basics

**Checkpoint:** Team meeting to review specifications and adjust scope if needed

---

### **📅 Phase 2: Core Implementation (Weeks 3-4)**

#### **Week 3**
**Student 1:**
- [ ] Implement GovernorVulnerable.sol (intentionally exploitable)
- [ ] Add proposal lifecycle (Pending → Active → Succeeded → Executed)
- [ ] Implement voting logic (for/against/abstain)
- [ ] Create Timelock.sol (basic version)
- [ ] Integration testing with Student 2's attacks

**Student 2:**
- [ ] Complete FlashLoanAttack.sol with full exploit logic
- [ ] Implement WhaleManipulation.sol
- [ ] Create Foundry script: SimulateFlashLoan.s.sol
- [ ] Run successful attack on GovernorVulnerable
- [ ] Export first results to JSON

**Student 3:**
- [ ] Write FlashLoanAttack.t.sol (comprehensive tests)
- [ ] Write WhaleManipulation.t.sol
- [ ] Test attack success on vulnerable governance
- [ ] Implement SnapshotVoting.sol defense
- [ ] Begin defense testing

**Student 4:**
- [ ] Implement parse_results.py (parse Foundry logs)
- [ ] Create calculate_metrics.py (economic metrics)
- [ ] Set up Express server with basic routes
- [ ] Create GET /api/attacks/flash-loan endpoint
- [ ] Test API returns mock data

**Student 5:**
- [ ] Learn Recharts basics (tutorials, examples)
- [ ] Implement HomePage.tsx with summary cards
- [ ] Create first chart: AttackSuccessChart.tsx (simple bar chart)
- [ ] Fetch data from API (useAPI hook)
- [ ] Display mock data in charts

**Week 3 Milestone:**
- ✅ Flash loan attack fully working
- ✅ Whale attack implemented
- ✅ 2 attack test suites complete
- ✅ First charts in dashboard
- ✅ API serving data

---

#### **Week 4**
**Student 1:**
- [ ] Implement GovernorWithDefenses.sol (protected version)
- [ ] Add snapshot voting logic
- [ ] Add voting delay mechanism
- [ ] Integrate timelock with proposal execution
- [ ] Test that flash loan attack FAILS against protected version

**Student 2:**
- [ ] Implement ProposalSpam.sol
- [ ] Create script to spam 100 proposals
- [ ] Measure gas costs and timing
- [ ] Export spam attack results
- [ ] Begin QuorumManipulation.sol

**Student 3:**
- [ ] Test flash loan attack fails with snapshot voting ✅
- [ ] Test flash loan attack fails with timelock ✅
- [ ] Implement VotingDelay.sol defense
- [ ] Write defense effectiveness tests
- [ ] Achieve >80% code coverage

**Student 4:**
- [ ] Implement aggregate_data.py
- [ ] Calculate attack profitability metrics
- [ ] Add more API endpoints (defenses, metrics)
- [ ] Create data aggregation pipeline
- [ ] Set up CORS for frontend

**Student 5:**
- [ ] Implement AttackSimulation.tsx page
- [ ] Create AttackLauncher component (UI for selecting attacks)
- [ ] Add AttackControls (parameter inputs)
- [ ] Create CostBreakdownChart.tsx (Recharts stacked bar)
- [ ] Implement basic Web3 connection (connect to Anvil)

**Week 4 Milestone:**
- ✅ Protected governance blocks flash loan attacks
- ✅ 3 attacks implemented (flash, whale, spam)
- ✅ Defense mechanisms proving effective
- ✅ Dashboard has 2 functional pages
- ✅ Web3 integration working

**Checkpoint:** Mid-project review - assess progress, adjust timeline if needed

---

### **📅 Phase 3: Extended Implementation (Weeks 5-6)**

#### **Week 5**
**Student 1:**
- [ ] Add dynamic quorum calculation
- [ ] Implement proposal threshold requirements
- [ ] Create emergency pause mechanism
- [ ] Write comprehensive Natspec documentation
- [ ] Code review Student 2 & 3's contracts

**Student 2:**
- [ ] Complete QuorumManipulation.sol
- [ ] Implement TimelockExploit.sol (emergency function bypass)
- [ ] Create variations of each attack (different parameters)
- [ ] Run comprehensive simulations (100+ test cases)
- [ ] Export all results in standardized JSON format

**Student 3:**
- [ ] Write QuorumManipulation.t.sol
- [ ] Write TimelockExploit.t.sol
- [ ] Implement DynamicQuorum.sol defense
- [ ] Implement TokenLocking.sol defense
- [ ] Test all 5 attacks vs all defenses (25+ combinations)

**Student 4:**
- [ ] Process all simulation data
- [ ] Calculate all economic metrics
- [ ] Calculate defense effectiveness matrix
- [ ] Calculate governance health metrics
- [ ] Create comprehensive API with all endpoints

**Student 5:**
- [ ] Implement ComparativeAnalysis.tsx page
- [ ] Create DefenseEffectivenessMatrix.tsx (heatmap with Recharts)
- [ ] Create ProfitabilityScatter.tsx (scatter plot)
- [ ] Implement GovernanceMonitor.tsx page
- [ ] Create TokenDistribution.tsx (treemap or sunburst)

**Week 5 Milestone:**
- ✅ All 5 attacks implemented and tested
- ✅ All defense mechanisms working
- ✅ Comprehensive test coverage (>90%)
- ✅ API fully functional
- ✅ 4-5 dashboard pages complete

---

#### **Week 6**
**Student 1:**
- [ ] Final governance contract optimization
- [ ] Gas optimization review
- [ ] Create deployment scripts
- [ ] Write contract documentation
- [ ] Support integration testing

**Student 2:**
- [ ] Attack contract optimization
- [ ] Create edge case scenarios
- [ ] Document attack methodologies
- [ ] Create demo scenarios for presentation
- [ ] Ensure all data exports are clean

**Student 3:**
- [ ] Write Integration.t.sol (end-to-end tests)
- [ ] Fuzz testing for critical functions
- [ ] Generate test coverage report (forge coverage)
- [ ] Write DEFENSE_EVALUATION.md
- [ ] Final test suite optimization

**Student 4:**
- [ ] Complete all metric calculations
- [ ] Generate comparative analysis reports
- [ ] Create data export for visualizations
- [ ] API performance optimization
- [ ] Write API documentation

**Student 5:**
- [ ] Implement EconomicAnalysis.tsx page
- [ ] Create complex charts (area, radar charts)
- [ ] Implement DefenseConfigLab.tsx (interactive testing)
- [ ] Add chart export functionality (PNG/SVG)
- [ ] Implement HistoricalData.tsx page

**Week 6 Milestone:**
- ✅ All components fully implemented
- ✅ Integration testing complete
- ✅ All 7 dashboard pages functional
- ✅ Data pipeline working end-to-end
- ✅ Ready for final polish phase

**Checkpoint:** Feature freeze - no new features, only bug fixes and polish

---

### **📅 Phase 4: Integration & Analysis (Weeks 7-8)**

#### **Week 7**
**Student 1:**
- [ ] Comprehensive code review
- [ ] Update all documentation
- [ ] Create ARCHITECTURE.md with diagrams
- [ ] Run full system integration tests
- [ ] Write governance sections of final report

**Student 2:**
- [ ] Run final comprehensive simulations
- [ ] Generate complete dataset (all scenarios)
- [ ] Write ATTACK_ANALYSIS.md
- [ ] Create attack flow diagrams
- [ ] Prepare demo attack scenarios

**Student 3:**
- [ ] Final testing sweep (all edge cases)
- [ ] Generate final coverage report
- [ ] Performance benchmarking (gas analysis)
- [ ] Complete DEFENSE_EVALUATION.md
- [ ] Create test documentation

**Student 4:**
- [ ] Process complete simulation dataset
- [ ] Generate all final metrics
- [ ] Create comparison matrices
- [ ] Statistical analysis (trends, correlations)
- [ ] Write analysis sections of final report

**Student 5:**
- [ ] Learn D3.js basics
- [ ] Create AttackFlowDiagram.tsx (D3.js force-directed graph)
- [ ] Create NetworkGraph.tsx for token relationships
- [ ] Add animations to attack simulations
- [ ] Real-time update implementation

**Week 7 Milestone:**
- ✅ Complete simulation dataset generated
- ✅ All metrics calculated
- ✅ Dashboard fully functional with all visualizations
- ✅ Documentation substantial

---

#### **Week 8**
**Student 1:**
- [ ] Final documentation review
- [ ] Create deployment guide
- [ ] Team coordination for final report
- [ ] Review and merge all documentation
- [ ] Prepare technical demo talking points

**Student 2:**
- [ ] Polish attack demos
- [ ] Create demo video script
- [ ] Test all demo scenarios
- [ ] Finalize attack documentation
- [ ] Support final report writing

**Student 3:**
- [ ] Final bug fixes
- [ ] Update README with setup instructions
- [ ] Create testing guide
- [ ] CI/CD setup (optional: GitHub Actions)
- [ ] Support final report

**Student 4:**
- [ ] Generate final visualization data
- [ ] Create executive summary statistics
- [ ] Write insights and findings
- [ ] Prepare data for presentation
- [ ] Create analysis slides

**Student 5:**
- [ ] UI/UX polish (colors, spacing, responsiveness)
- [ ] Add tooltips and help text throughout dashboard
- [ ] Create demo mode (guided tour)
- [ ] Write FRONTEND_GUIDE.md
- [ ] Test on different browsers/screen sizes
- [ ] Performance optimization

**Week 8 Milestone:**
- ✅ All systems polished and bug-free
- ✅ Comprehensive documentation complete
- ✅ Dashboard production-ready
- ✅ Demo scenarios tested
- ✅ Ready for final phase

---

### **📅 Phase 5: Documentation & Presentation (Weeks 9-10)**

#### **Week 9**
**All Team:**
- [ ] Collaborative final report writing
- [ ] Create presentation slides
- [ ] Design presentation flow

**Student 1:**
- [ ] Write introduction and architecture sections
- [ ] Create system architecture diagrams
- [ ] Review entire codebase
- [ ] Write conclusion and recommendations

**Student 2:**
- [ ] Write attack methodology sections
- [ ] Create attack diagrams for report
- [ ] Prepare live attack demos
- [ ] Write real-world implications section

**Student 3:**
- [ ] Write defense mechanism sections
- [ ] Include test results and coverage
- [ ] Create defense effectiveness visualizations
- [ ] Write testing methodology section

**Student 4:**
- [ ] Write analysis and findings sections
- [ ] Include all metrics and charts
- [ ] Write comparative analysis section
- [ ] Create executive summary

**Student 5:**
- [ ] Create dashboard screenshots for report
- [ ] Record dashboard demo video
- [ ] Write visualization section of report
- [ ] Prepare live demo walkthrough
- [ ] Create backup demo (recorded) in case live fails

**Week 9 Deliverables:**
- [ ] Complete FINAL_REPORT.md (30-50 pages)
- [ ] Presentation slides (20-30 slides)
- [ ] Demo script prepared
- [ ] Backup materials ready

---

#### **Week 10**
**Monday-Wednesday:**
- [ ] Final report editing and proofreading
- [ ] Presentation rehearsals (at least 3 full run-throughs)
- [ ] Demo testing on presentation computer
- [ ] Q&A preparation
- [ ] Backup plans for technical issues

**Thursday-Friday:**
- [ ] Final rehearsal
- [ ] Team presentation
- [ ] Live demo
- [ ] Submit all deliverables

**Final Deliverables:**
1. ✅ Complete codebase (smart contracts, tests, scripts)
2. ✅ Functional React dashboard (deployed locally)
3. ✅ Node.js API backend
4. ✅ Comprehensive documentation (8+ markdown files)
5. ✅ Final academic report (FINAL_REPORT.md)
6. ✅ Presentation slides
7. ✅ Demo video (backup)
8. ✅ Setup and deployment instructions

**Week 10 Milestone:**
🎉 **PROJECT COMPLETE** - Presentation delivered, all deliverables submitted

---

## **TECHNOLOGY STACK DETAILS**

### **Smart Contract Layer**
```yaml
Language: Solidity
Framework: Foundry
  - forge: Compilation and testing
  - anvil: Local Ethereum node
  - cast: CLI for blockchain interaction
Testing: Foundry test framework (Solidity-based tests)
Libraries:
  - OpenZeppelin Contracts v5.0 (ERC20Votes, Timelock, Governor)
  - forge-std (testing utilities)
Gas Optimization: Target <2M gas per transaction
```

### **Backend Layer**
```yaml
Runtime: Node.js
Framework: Express.js
Language: TypeScript
Data Format: JSON
Port: 3001 (configurable)
Key Libraries:
  - cors: Cross-origin requests
  - dotenv: Environment variables
  - typescript: Type safety
  - ts-node: Development
  - nodemon: Hot reload
```

### **Frontend Layer**
```yaml
Framework: React with TypeScript
Build Tool: Vite (fast dev server, optimized builds)
Styling: Tailwind CSS v3
Charts: 
  - Recharts (primary charting library)
  - D3.js (custom visualizations)
Web3: ethers.js (blockchain interaction)
State: Zustand (lightweight state management)
Port: 5173 (Vite default)
```

### **Analysis Layer**
```yaml
Language: Python 3.13
Key Libraries:
  - pandas: Data manipulation
  - numpy: Numerical computations
  - matplotlib: Static visualizations
  - plotly: Interactive charts (optional)
  - jupyter: Notebooks (optional)
Environment: Virtual environment (venv)
```

### **Development Tools**
```yaml
Version Control: Git + GitHub
Code Editor: VS Code (recommended extensions: Solidity, ESLint, Prettier)
Package Managers:
  - npm/yarn (JavaScript)
  - pip (Python)
  - foundryup (Foundry)
Linting:
  - solhint (Solidity)
  - eslint (TypeScript/JavaScript)
Formatting:
  - forge fmt (Solidity)
  - prettier (TypeScript/JavaScript)
```

---

## **DATA FLOW ARCHITECTURE**

```
┌─────────────────────────────────────────────────────────────────┐
│                    SMART CONTRACT LAYER                          │
│                  (Foundry on Anvil Testnet)                      │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Governance  │  │   Attacks    │  │   Defenses   │          │
│  │  Contracts   │  │  Contracts   │  │  Contracts   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                   │
│         └──────────────────┴──────────────────┘                  │
│                            │                                      │
└────────────────────────────┼──────────────────────────────────────┘
                             │
                ┌────────────┼────────────┐
                │            │            │
        ┌───────▼────┐   ┌──▼────────┐  │
        │   Foundry  │   │  Foundry  │  │
        │   Tests    │   │  Scripts  │  │
        │  (.t.sol)  │   │ (.s.sol)  │  │
        └─────┬──────┘   └──┬────────┘  │
              │             │            │
              │  Emit Events│            │
              │  Write Logs │            │
              │             │            │
              └─────┬───────┴────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DATA STORAGE                             │
│                    analysis/data/raw/*.json                      │
│                                                                   │
│  {                                                               │
│    "attackType": "FlashLoanAttack",                             │
│    "defenseEnabled": true,                                      │
│    "success": false,                                            │
│    "costEth": 1.2,                                              │
│    "gasUsed": 500000,                                           │
│    "timestamp": "2026-02-05T12:00:00Z"                         │
│  }                                                               │
└─────────────────────────┬───────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
  ┌─────▼──────┐   ┌──────▼──────┐   ┌─────▼──────────┐
  │   Python   │   │  Node.js    │   │    Frontend    │
  │  Analysis  │   │   API       │   │   (Web3)       │
  │  Scripts   │   │  Backend    │   │   ethers.js    │
  └─────┬──────┘   └──────┬──────┘   └─────┬──────────┘
        │                 │                 │
        │  Process &      │  Serve via      │  Read directly
        │  Aggregate      │  REST API       │  from Anvil
        │                 │                 │  (real-time)
        ▼                 ▼                 │
  ┌──────────────────────────────────┐     │
  │   analysis/data/processed/       │     │
  │   - attack_summary.json          │     │
  │   - defense_effectiveness.json   │     │
  │   - metrics.json                 │     │
  └──────────────┬───────────────────┘     │
                 │                         │
        ┌────────▼───────────┐             │
        │   Node.js API      │             │
        │   http://localhost:3001/api/     │
        │                                   │
        │   Endpoints:                     │
        │   - GET /attacks                 │
        │   - GET /defenses                │
        │   - GET /metrics                 │
        │   - GET /simulations/:id         │
        └────────┬───────────┘             │
                 │                         │
                 └──────────┬──────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    REACT FRONTEND DASHBOARD                      │
│                  http://localhost:5173                           │
│                                                                   │
│  Data Sources:                                                   │
│  1. REST API (historical data, metrics)                         │
│  2. Web3 Direct (real-time blockchain state)                    │
│                                                                   │
│  Features:                                                       │
│  - Interactive charts (Recharts + D3.js)                        │
│  - Real-time attack simulation                                  │
│  - Live governance monitoring                                   │
│  - Comparative analysis                                         │
│  - Defense configuration lab                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## **API SPECIFICATION**

### **Base URL**
```
http://localhost:3001/api
```

### **Endpoints**

#### **GET /attacks**
Get all attack simulation results
```json
Response: {
  "data": [
    {
      "id": "flash-loan-001",
      "type": "FlashLoanAttack",
      "timestamp": "2026-02-05T12:00:00Z",
      "success": false,
      "cost": 1.2,
      "profit": 0,
      "gasUsed": 500000,
      "defenses": ["snapshot", "timelock"]
    }
  ],
  "total": 150
}
```

#### **GET /attacks/:type**
Get results for specific attack type
- `:type` = `flash-loan | whale | spam | quorum | timelock`

#### **GET /defenses**
Get all defense configurations tested
```json
Response: {
  "configurations": [
    {
      "id": "config-001",
      "name": "Full Protection",
      "defenses": ["snapshot", "timelock", "dynamicQuorum"],
      "attacksBlocked": ["flash-loan", "whale", "timelock"],
      "effectiveness": 0.95
    }
  ]
}
```

#### **GET /metrics**
Get aggregated metrics
```json
Response: {
  "economic": {
    "avgAttackCost": 1.5,
    "avgProfit": 0.2,
    "profitableAttacks": 15
  },
  "defense": {
    "avgSuccessRate": 0.05,
    "avgBlockRate": 0.95
  },
  "governance": {
    "avgParticipation": 0.35,
    "tokenConcentration": 2500
  }
}
```

#### **GET /simulations/:id**
Get detailed results for specific simulation

#### **GET /governance/state**
Get current governance state from blockchain (proxies to Web3)

---

## **FRONTEND DASHBOARD PAGES (DETAILED)**

### **1. HomePage (Overview Dashboard)**
**Route:** `/`

**Components:**
- 4 Summary Cards (attacks run, success rate, total cost, best defense)
- Attack Success Rate Bar Chart
- Recent Activity Timeline
- Quick Navigation Cards

**Data Sources:**
- API: `/api/metrics`
- API: `/api/simulations?limit=10`

**Priority:** HIGH (first impression)

---

### **2. AttackSimulation Page**
**Route:** `/simulation`

**Components:**
- Attack Selector Dropdown
- Parameter Configuration Panel
  - Sliders for amounts, percentages
  - Toggle switches for defenses
- "Launch Attack" Button
- Live Execution Viewer (step-by-step animation)
- Results Display (success/fail, cost, profit)
- Blockchain State Cards (block, balances, votes)

**Data Sources:**
- Web3: Direct contract calls via ethers.js
- API: `/api/attacks/:type` (historical comparison)

**Special Features:**
- Real-time transaction watching
- Animated state transitions
- Gas usage meter

**Priority:** HIGHEST (main demo feature)

---

### **3. ComparativeAnalysis Page**
**Route:** `/analysis`

**Components:**
- Filter Controls (multi-select for attacks/defenses)
- Comparison Table (sortable)
- Defense Effectiveness Matrix Heatmap
- Cost vs Success Scatter Plot
- Attack Profitability Grouped Bar Chart
- Export Button (download CSV)

**Data Sources:**
- API: `/api/attacks`
- API: `/api/defenses`
- API: `/api/metrics`

**Charts:**
- Recharts: Heatmap, Scatter, Bar
- 3-4 charts on one page

**Priority:** HIGH (research findings showcase)

---

### **4. GovernanceMonitor Page**
**Route:** `/governance`

**Components:**
- Live Connection Indicator
- Current Stats Cards (proposals, voters, quorum)
- Token Distribution Treemap
- Proposal Timeline (Gantt-style)
- Participation Rate Line Chart
- Quorum Gauge

**Data Sources:**
- Web3: Direct blockchain reads (governance contract state)
- API: `/api/governance/state` (aggregated)

**Special Features:**
- Auto-refresh every 5 seconds
- Real-time event listening

**Priority:** MEDIUM

---

### **5. EconomicAnalysis Page**
**Route:** `/economics`

**Components:**
- Economic Model Parameters Panel
- Attack Cost Breakdown Stacked Bar
- Profitability Scenarios Area Chart
- Minimum Viable Attack Bubble Chart
- Defense Cost-Benefit Radar Chart
- Break-even Calculator Tool

**Data Sources:**
- API: `/api/metrics`
- API: `/api/attacks` (for cost data)

**Charts:**
- Recharts: Stacked Bar, Area, Bubble, Radar
- Complex multi-axis charts

**Priority:** MEDIUM-HIGH (important for findings)

---

### **6. DefenseConfigLab Page**
**Route:** `/lab`

**Components:**
- Defense Checklist with toggles
- Parameter Sliders (timelock duration, proposal threshold, etc.)
- "Test Configuration" Button
- Results Panel (which attacks blocked/succeeded)
- Security Score Display
- Usability Score Display
- Defense Layer Diagram (D3.js concentric circles)
- Security vs Usability Scatter Plot

**Data Sources:**
- API: POST `/api/test-config` (test a configuration)
- Client-side calculation for scores

**Special Features:**
- Interactive experimentation
- Save/load configurations

**Priority:** MEDIUM (cool feature but not critical)

---

### **7. HistoricalData Page**
**Route:** `/history`

**Components:**
- Time Range Selector
- Success Rate Trends Multi-Line Chart
- Gas Cost Trends Line Chart
- Participation Decay Line Chart
- Data Export Functionality
- Aggregation Controls (daily/weekly)

**Data Sources:**
- API: `/api/simulations?from=X&to=Y`
- API: `/api/metrics/trends`

**Charts:**
- Recharts: Line charts with time-series data

**Priority:** LOW-MEDIUM (nice to have)

---

## **LEARNING RESOURCES FOR STUDENT 5**

### **Week 1: React Basics**
1. **React Official Tutorial** (2-3 hours)
   - https://react.dev/learn
   - Focus: Components, Props, State

2. **TypeScript for React** (2 hours)
   - https://react-typescript-cheatsheet.netlify.app/
   - Focus: Typing props, state, events

3. **Practice:** Build a simple todo app

---

### **Week 2-3: Recharts**
1. **Recharts Documentation** (3 hours)
   - https://recharts.org/
   - Try: BarChart, LineChart, PieChart

2. **Tutorial:** Build a dashboard with Recharts
   - https://www.youtube.com/results?search_query=recharts+tutorial

3. **Practice:** Recreate 3 sample charts from docs

---

### **Week 4-5: Web3 Integration**
1. **ethers.js Documentation** (4 hours)
   - https://docs.ethers.org/v6/
   - Focus: Providers, Contracts, Reading state

2. **Tutorial:** Connect to local blockchain
   - Follow Foundry