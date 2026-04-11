// // hooks/useAttackSimulation.ts
// import { useState, useCallback, useEffect } from 'react';
// import { ethers } from 'ethers';
// import {
//   getFlashLoanAttackContract,
//   getWhaleManipulationContract,
//   getProposalSpamContract,
//   getQuorumManipulationContract,
//   getTimelockExploitContract,
//   signer,
//   provider,
//   getGovernanceTokenContract,
//   getTreasuryContract,
// } from '../lib/web3';
// import type { ScenarioAddresses } from '../lib/scenarios';

// export type AttackStage = 'preparation' | 'flashloan' | 'proposal' | 'voting' | 'execution' | 'completed';
// export type LogEntry = {
//   timestamp: string;
//   type: 'info' | 'success' | 'warning' | 'error';
//   icon: string;
//   message: string;
// };

// export interface AttackSimulationState {
//   isRunning: boolean;
//   stage: AttackStage;
//   progress: number;
//   logs: LogEntry[];
//   metrics: {
//     fundsTransferred: string;
//     attackCost: string;
//     successProbability: number;
//     gasUsed: string;
//   };
//   config: {
//     attackType: 'flashloan' | 'whale' | 'spam' | 'quorum' | 'timelock';
//     targetContract: string;
//     initialFunds: string;
//     flashloanSource: 'aave' | 'uniswap' | 'balancer';
//     loanAmount: string;
//   };
//   nodes: Array<{ id: string; type: string; label: string; balance: string }>;
//   edges: Array<{ source: string; target: string; value: string; label: string }>;
// }

// const attackContractMap = {
//   flashloan: getFlashLoanAttackContract,
//   whale: getWhaleManipulationContract,
//   spam: getProposalSpamContract,
//   quorum: getQuorumManipulationContract,
//   timelock: getTimelockExploitContract,
// };

// // 辅助函数：等待新区块
// const waitForNextBlock = async (provider: ethers.Provider) => {
//   const currentBlock = await provider.getBlockNumber();
//   while ((await provider.getBlockNumber()) === currentBlock) {
//     await new Promise(resolve => setTimeout(resolve, 500));
//   }
// };

// export const useAttackSimulation = (
//   defenseEnabled: boolean,
//   initialAttackType: string = 'flashloan',
//   scenarioAddresses: ScenarioAddresses  // 新增：场景地址配置
// ) => {
//   const [state, setState] = useState<AttackSimulationState>({
//     isRunning: false,
//     stage: 'preparation',
//     progress: 0,
//     logs: [],
//     metrics: {
//       fundsTransferred: '0',
//       attackCost: '0',
//       successProbability: defenseEnabled ? 12 : 92,
//       gasUsed: '0',
//     },
//     config: {
//       attackType: initialAttackType as any,
//       targetContract: '0x...',
//       initialFunds: '100000',
//       flashloanSource: 'aave',
//       loanAmount: '670000',
//     },
//     nodes: [],
//     edges: [],
//   });

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const addLog = (log: LogEntry) => {
//     setState((prev) => ({
//       ...prev,
//       logs: [log, ...prev.logs].slice(0, 100),
//     }));
//   };

//   const updateProgress = useCallback((newProgress: number, stage: AttackStage) => {
//     setState((prev) => ({ ...prev, progress: newProgress, stage }));
//   }, []);

//   const updateConfig = useCallback((newConfig: Partial<AttackSimulationState['config']>) => {
//     setState((prev) => ({ ...prev, config: { ...prev.config, ...newConfig } }));
//   }, []);

//   // 节点/边生成逻辑（保持不变，省略... 参考之前的实现）
//   useEffect(() => {
//     // ... 原有节点生成代码不变，此处省略
//     // 注意：节点中的 treasury 余额等可以动态从场景地址获取，但不影响功能
//   }, [state.config.attackType, state.config.initialFunds, state.config.loanAmount]);

//   const startSimulation = useCallback(async () => {
//     if (state.isRunning) return;

//     setLoading(true);
//     setError(null);
//     setState((prev) => ({ ...prev, isRunning: true, logs: [] }));
//     addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'info', icon: '⚙️', message: `Starting ${state.config.attackType} attack (Defense mode: ${defenseEnabled ? 'ON' : 'OFF'}) on scenario with governor: ${scenarioAddresses.governorVulnerable.slice(0,10)}...` });

//     try {
//       const factory = attackContractMap[state.config.attackType];
//       if (!factory) throw new Error(`Unknown attack type: ${state.config.attackType}`);
      
//       // 根据攻击类型，可能使用场景特定的攻击合约地址（如果场景配置中有的话）
//       let customAttackAddress: string | undefined;
//       switch (state.config.attackType) {
//         case 'whale':
//           customAttackAddress = scenarioAddresses.whaleAttackContract;
//           break;
//         case 'flashloan':
//           customAttackAddress = scenarioAddresses.flashLoanAttackContract;
//           break;
//         case 'spam':
//           customAttackAddress = scenarioAddresses.proposalSpamContract;
//           break;
//         case 'quorum':
//           customAttackAddress = scenarioAddresses.quorumManipulationContract;
//           break;
//         case 'timelock':
//           customAttackAddress = scenarioAddresses.timelockExploitContract;
//           break;
//       }
//       const attackContract = factory(defenseEnabled, customAttackAddress);

//       // 根据场景地址获取治理代币合约（用于委托）
//       const governanceToken = getGovernanceTokenContract(scenarioAddresses.governanceToken);
//       const treasuryContract = getTreasuryContract(scenarioAddresses.treasury);

//       let tx;
//       switch (state.config.attackType) {
//         case 'flashloan': {
//           const loanAmountWei = ethers.parseEther(state.config.loanAmount);
//           const drainWei = ethers.parseEther(state.config.initialFunds);
//           tx = await attackContract.executeAttack(loanAmountWei, drainWei);
//           break;
//         }

//         case 'whale': {

//             const whaleAddress = await signer.getAddress();
//             const drainWei = ethers.parseEther(state.config.initialFunds);
//             const governanceToken = getGovernanceTokenContract();

//             let currentVotes = await governanceToken.getVotes(whaleAddress);

//             if (currentVotes === 0n) {

//               addLog({
//                 timestamp: new Date().toISOString().slice(11,19),
//                 type:'warning',
//                 icon:'⚠️',
//                 message:'Whale has no voting power. Delegating to self...'
//               });

//               const tx1 = await governanceToken.delegate(whaleAddress);
//               await tx1.wait();

//               currentVotes = await governanceToken.getVotes(whaleAddress);

//               addLog({
//                 timestamp: new Date().toISOString().slice(11,19),
//                 type:'success',
//                 icon:'🐋',
//                 message:`Whale now has voting power: ${ethers.formatEther(currentVotes)}`
//               });

//             }

//             tx = await attackContract.executeWhaleAttack(
//                 whaleAddress,
//                 drainWei
//             );

//             break;
//         }

//         case 'spam': {
//           const spamCount = parseInt(state.config.loanAmount, 10) || 10;
//           tx = await attackContract.executeSpamAttack(spamCount);
//           break;
//         }

//         case 'quorum': {

//           const governanceToken = getGovernanceTokenContract();
//           const attackerAddress = await signer.getAddress();
//           const attackAddress = await attackContract.getAddress();

//           // 检查攻击合约 votes
//           let votes = await governanceToken.getVotes(attackAddress);

//           if (votes === 0n) {

//             addLog({
//               timestamp: new Date().toISOString().slice(11,19),
//               type:'warning',
//               icon:'⚠️',
//               message:'Delegating voting power to attack contract...'
//             });

//             const delegateTx = await governanceToken.delegate(attackAddress);
//             await delegateTx.wait();

//             votes = await governanceToken.getVotes(attackAddress);

//             addLog({
//               timestamp: new Date().toISOString().slice(11,19),
//               type:'success',
//               icon:'🗳️',
//               message:`Attack contract now has ${ethers.formatEther(votes)} votes`
//             });

//           }

//           const baseDrain = ethers.parseEther(state.config.initialFunds);
//           const drainWei = baseDrain + BigInt(Date.now() % 100000);

//           const estimatedParticipation = 500;

//           tx = await attackContract.executeTimingAttack(
//             drainWei,
//             estimatedParticipation
//           );

//           break;
//         }

//         case 'timelock': {
//           const numDrains = parseInt(state.config.loanAmount, 10) || 5;
//           const amountWei = ethers.parseEther(state.config.initialFunds);
//           tx = await attackContract.executeGradualDrainThroughTimelock(numDrains, amountWei);
//           break;
//         }
//         default:
//           throw new Error(`Unsupported attack type: ${state.config.attackType}`);
//       }

//       addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'success', icon: '📖', message: `Using attack contract address: ${attackContract.target}` });
//       addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'info', icon: '📡', message: `Transaction sent: ${tx.hash.slice(0, 10)}...` });
//       updateProgress(30, 'preparation');

//       const receipt = await tx.wait();
//       const gasUsed = BigInt(receipt.gasUsed);
//       const effectiveGasPrice = receipt.effectiveGasPrice !== undefined ? BigInt(receipt.effectiveGasPrice) : 0n;
//       const costWei = gasUsed * effectiveGasPrice;
//       const costEth = ethers.formatEther(costWei);
//       addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'success', icon: '✅', message: `Confirmed in block ${receipt.blockNumber}` });

//       if (receipt.status === 1) {
//         updateProgress(100, 'completed');
//         addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'success', icon: '💰', message: `Attack successful!` });
//         setState((prev) => ({
//           ...prev,
//           metrics: {
//             ...prev.metrics,
//             fundsTransferred: state.config.initialFunds,
//             attackCost: costEth,
//             successProbability: 100,
//             gasUsed: gasUsed.toString(),
//           },
//         }));
//       } else {
//         updateProgress(100, 'completed');
//         addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'error', icon: '🛡️', message: `Attack failed: Defense mechanism blocked it.` });
//         setState((prev) => ({
//           ...prev,
//           metrics: {
//             ...prev.metrics,
//             fundsTransferred: '0',
//             attackCost: costEth,
//             successProbability: 0,
//             gasUsed: gasUsed.toString(),
//           },
//         }));
//       }
//     } catch (err: any) {
//       console.error(err);
//       setError(err.message || 'Attack simulation failed');
//       addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'error', icon: '❌', message: `Error: ${err.message}` });
//     } finally {
//       setLoading(false);
//       setState((prev) => ({ ...prev, isRunning: false }));
//     }
//   }, [state.isRunning, state.config, defenseEnabled, updateProgress, scenarioAddresses]);

//   const pauseSimulation = useCallback(() => {
//     setState((prev) => ({ ...prev, isRunning: false }));
//     addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'info', icon: '⏸️', message: 'Simulation paused (transaction may still be pending).' });
//   }, []);

//   const resetSimulation = useCallback(() => {
//     setState((prev) => ({
//       ...prev,
//       isRunning: false,
//       stage: 'preparation',
//       progress: 0,
//       logs: [],
//       metrics: {
//         fundsTransferred: '0',
//         attackCost: '0',
//         successProbability: defenseEnabled ? 12 : 92,
//         gasUsed: '0',
//       },
//     }));
//     setError(null);
//     addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'info', icon: '🔄', message: 'Simulation reset.' });
//   }, [defenseEnabled]);

//   useEffect(() => {
//     let targetContract = '0x...';
//     let initialFunds = '100000';
//     let loanAmount = '670000';
//     if (state.config.attackType === 'whale') {
//       loanAmount = '1000000';
//     } else if (state.config.attackType === 'spam') {
//       initialFunds = '5000';
//       loanAmount = '10';
//     } else if (state.config.attackType === 'quorum') {
//       initialFunds = '1000';
//       loanAmount = '0';
//     } else if (state.config.attackType === 'timelock') {
//       loanAmount = '5';
//     }
//     updateConfig({ targetContract, initialFunds, loanAmount });
//   }, [state.config.attackType, updateConfig]);

//   return {
//     state,
//     startSimulation,
//     pauseSimulation,
//     resetSimulation,
//     updateConfig,
//     loading,
//     error,
//   };
// };

// hooks/useAttackSimulation.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import {
  getFlashLoanAttackContract,
  getWhaleManipulationContract,
  getProposalSpamContract,
  getQuorumManipulationContract,
  getTimelockExploitContract,
  signer,
  provider,
  getGovernanceTokenContract,
  getTreasuryContract,
} from '../lib/web3';
import type { ScenarioAddresses } from '../lib/scenarios';

export type AttackStage = 'preparation' | 'flashloan' | 'proposal' | 'voting' | 'execution' | 'completed';
export type LogEntry = {
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  icon: string;
  message: string;
};

export interface AttackSimulationState {
  isRunning: boolean;
  stage: AttackStage;
  progress: number;
  logs: LogEntry[];
  metrics: {
    fundsTransferred: string;
    attackCost: string;
    successProbability: number;
    gasUsed: string;
  };
  config: {
    attackType: 'flashloan' | 'whale' | 'spam' | 'quorum' | 'timelock';
    targetContract: string;
    initialFunds: string;
    flashloanSource: 'aave' | 'uniswap' | 'balancer';
    loanAmount: string;
  };
  nodes: Array<{ id: string; type: string; label: string; balance: string }>;
  edges: Array<{ source: string; target: string; value: string; label: string }>;
}

const attackContractMap = {
  flashloan: getFlashLoanAttackContract,
  whale: getWhaleManipulationContract,
  spam: getProposalSpamContract,
  quorum: getQuorumManipulationContract,
  timelock: getTimelockExploitContract,
};

// 辅助函数：等待下一个区块
const waitForNextBlock = async () => {
  const currentBlock = await provider.getBlockNumber();
  while ((await provider.getBlockNumber()) === currentBlock) {
    await new Promise(resolve => setTimeout(resolve, 500));
  }
};

export const useAttackSimulation = (
  defenseEnabled: boolean,
  initialAttackType: string = 'flashloan',
  scenarioAddresses: ScenarioAddresses
) => {
  const [state, setState] = useState<AttackSimulationState>({
    isRunning: false,
    stage: 'preparation',
    progress: 0,
    logs: [],
    metrics: {
      fundsTransferred: '0',
      attackCost: '0',
      successProbability: defenseEnabled ? 12 : 92,
      gasUsed: '0',
    },
    config: {
      attackType: initialAttackType as any,
      targetContract: '0x...',
      initialFunds: '100000',
      flashloanSource: 'aave',
      loanAmount: '670000',
    },
    nodes: [],
    edges: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = (log: LogEntry) => {
    setState((prev) => ({
      ...prev,
      logs: [log, ...prev.logs].slice(0, 100),
    }));
  };

  const updateProgress = useCallback((newProgress: number, stage: AttackStage) => {
    setState((prev) => ({ ...prev, progress: newProgress, stage }));
  }, []);

  const updateConfig = useCallback((newConfig: Partial<AttackSimulationState['config']>) => {
    setState((prev) => ({ ...prev, config: { ...prev.config, ...newConfig } }));
  }, []);

  // 从链上刷新节点余额
  const refreshNodeBalances = useCallback(async () => {
    const { attackType } = state.config;
    try {
      const governanceToken = getGovernanceTokenContract(scenarioAddresses.governanceToken);
      const treasury = getTreasuryContract(scenarioAddresses.treasury);
      const whaleAddress = await signer.getAddress();

      // 获取真实数据
      const whaleVotes = await governanceToken.getVotes(whaleAddress);
      const whaleBalance = await governanceToken.balanceOf(whaleAddress);
      // 国库中治理代币的余额（假设 treasury 有 balanceOf 方法，参数为代币地址）
      let treasuryBalance = 0n;
      try {
        treasuryBalance = await treasury.balanceOf(scenarioAddresses.governanceToken);
      } catch {
        // 如果 treasury 没有 balanceOf，尝试读取原生余额
        treasuryBalance = await provider.getBalance(scenarioAddresses.treasury);
      }

      // 更新节点显示
      setState(prev => {
        const newNodes = prev.nodes.map(node => {
          if (node.id === 'whale') {
            return { ...node, balance: `${ethers.formatEther(whaleVotes)} votes` };
          }
          if (node.id === 'whale_balance') {
            return { ...node, balance: `${ethers.formatEther(whaleBalance)} tokens` };
          }
          if (node.id === 'treasury') {
            return { ...node, balance: `${ethers.formatEther(treasuryBalance)} tokens` };
          }
          return node;
        });
        return { ...prev, nodes: newNodes };
      });
    } catch (err) {
      console.warn('Failed to refresh balances:', err);
    }
  }, [scenarioAddresses, state.config.attackType]);

  // 根据攻击类型生成节点和边（动态化，但保留结构清晰）
  const generateNodesAndEdges = useCallback((attackType: string, drain: string, loan: string) => {
    let newNodes: any[] = [];
    let newEdges: any[] = [];

    switch (attackType) {
      case 'flashloan':
        newNodes = [
          { id: 'flashloan', type: 'protocol', label: 'Flash Loan Provider', balance: '0' },
          { id: 'attacker', type: 'wallet', label: 'Attacker', balance: '0' },
          { id: 'governor', type: 'contract', label: 'Governor', balance: '0' },
          { id: 'treasury', type: 'contract', label: 'Treasury', balance: 'Loading...' },
        ];
        newEdges = [
          { source: 'flashloan', target: 'attacker', value: loan, label: `Borrow ${loan} tokens` },
          { source: 'attacker', target: 'governor', value: loan, label: 'Create Proposal & Vote' },
          { source: 'governor', target: 'treasury', value: drain, label: `Drain ${drain} tokens` },
        ];
        break;
      case 'whale':
        newNodes = [
          { id: 'whale', type: 'wallet', label: 'Whale (Votes)', balance: 'Loading...' },
          { id: 'whale_balance', type: 'wallet', label: 'Whale (Tokens)', balance: 'Loading...' },
          { id: 'attacker', type: 'wallet', label: 'Attacker', balance: '0' },
          { id: 'governor', type: 'contract', label: 'Governor', balance: '0' },
          { id: 'treasury', type: 'contract', label: 'Treasury', balance: 'Loading...' },
        ];
        newEdges = [
          { source: 'whale', target: 'governor', value: 'Voting Power', label: 'Voting Power' },
          { source: 'attacker', target: 'governor', value: '0', label: 'Coordinate' },
          { source: 'governor', target: 'treasury', value: drain, label: `Drain ${drain} tokens` },
        ];
        break;
      case 'spam':
        newNodes = [
          { id: 'spammer', type: 'wallet', label: 'Spammer', balance: '0' },
          { id: 'governor', type: 'contract', label: 'Governor', balance: '0' },
          { id: 'legitimate', type: 'wallet', label: 'Legitimate User', balance: '0' },
          { id: 'treasury', type: 'contract', label: 'Treasury', balance: 'Loading...' },
        ];
        newEdges = [
          { source: 'spammer', target: 'governor', value: loan, label: `${loan} Spam Proposals` },
          { source: 'legitimate', target: 'governor', value: '1', label: 'Malicious Proposal' },
          { source: 'governor', target: 'treasury', value: drain, label: `Drain ${drain} tokens` },
        ];
        break;
      case 'quorum':
        newNodes = [
          { id: 'attacker', type: 'wallet', label: 'Attacker', balance: '0' },
          { id: 'governor', type: 'contract', label: 'Governor', balance: '0' },
          { id: 'voters', type: 'wallet', label: 'Voters', balance: '0' },
          { id: 'treasury', type: 'contract', label: 'Treasury', balance: 'Loading...' },
        ];
        newEdges = [
          { source: 'attacker', target: 'governor', value: '0', label: 'Create Proposal' },
          { source: 'voters', target: 'governor', value: 'low', label: 'Low Participation' },
          { source: 'governor', target: 'treasury', value: drain, label: `Bypass Quorum & Drain ${drain} tokens` },
        ];
        break;
      case 'timelock':
        newNodes = [
          { id: 'attacker', type: 'wallet', label: 'Attacker', balance: '0' },
          { id: 'governor', type: 'contract', label: 'Governor', balance: '0' },
          { id: 'timelock', type: 'contract', label: 'Timelock', balance: '0' },
          { id: 'treasury', type: 'contract', label: 'Treasury', balance: 'Loading...' },
        ];
        newEdges = [
          { source: 'attacker', target: 'governor', value: '1', label: 'Create Proposal' },
          { source: 'governor', target: 'timelock', value: '1', label: 'Queue' },
          { source: 'timelock', target: 'treasury', value: drain, label: `Execute after Delay, Drain ${drain} tokens` },
        ];
        break;
      default:
        return;
    }
    setState(prev => ({ ...prev, nodes: newNodes, edges: newEdges }));
  }, []);

  // 当攻击类型或金额变化时，重新生成节点和边，并刷新一次数据
  useEffect(() => {
    const drain = state.config.initialFunds;
    const loan = state.config.loanAmount;
    generateNodesAndEdges(state.config.attackType, drain, loan);
    // 生成后立即刷新一次真实数据
    refreshNodeBalances();
  }, [state.config.attackType, state.config.initialFunds, state.config.loanAmount, generateNodesAndEdges, refreshNodeBalances]);

  const startSimulation = useCallback(async () => {
    if (state.isRunning) return;

    // 清除已有定时器
    if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);

    setLoading(true);
    setError(null);
    setState((prev) => ({ ...prev, isRunning: true, logs: [] }));
    addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'info', icon: '⚙️', message: `Starting ${state.config.attackType} attack (Defense mode: ${defenseEnabled ? 'ON' : 'OFF'}) on scenario governor: ${scenarioAddresses.governorVulnerable.slice(0,10)}...` });

    // 启动定期刷新（每3秒）
    refreshIntervalRef.current = setInterval(() => {
      refreshNodeBalances();
    }, 3000);

    try {
      const factory = attackContractMap[state.config.attackType];
      if (!factory) throw new Error(`Unknown attack type: ${state.config.attackType}`);
      
      let customAttackAddress: string | undefined;   
      switch (state.config.attackType) {
        case 'whale': customAttackAddress = scenarioAddresses.whaleAttackContract; break;
        case 'flashloan': customAttackAddress = scenarioAddresses.flashLoanAttackContract; break;
        case 'spam': customAttackAddress = scenarioAddresses.proposalSpamContract; break;
        case 'quorum': customAttackAddress = scenarioAddresses.quorumManipulationContract; break;
        case 'timelock': customAttackAddress = scenarioAddresses.timelockExploitContract; break;
      }
      const attackContract = factory(defenseEnabled, customAttackAddress);
      const governanceToken = getGovernanceTokenContract(scenarioAddresses.governanceToken);
      let tx;
      // 在 startSimulation 中，switch 之前添加以下代码：

      const treasury = getTreasuryContract(scenarioAddresses.treasury);

      // 预设存款金额（例如 1000 万枚代币，单位 wei）
      const depositAmount = ethers.parseEther("10000000");

      // 查询国库当前 tokenBalance
      let treasuryBalance = await treasury.getBalance(scenarioAddresses.governanceToken);
      if (treasuryBalance < depositAmount) {
        addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'warning', icon: '🏦', message: `Treasury has insufficient balance. Depositing ${ethers.formatEther(depositAmount)} tokens...` });
        
        // 授权国库合约使用代币
        const approveTx = await governanceToken.approve(scenarioAddresses.treasury, depositAmount);
        await approveTx.wait();
        addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'info', icon: '✅', message: `Approved deposit amount` });
        
        // 存入国库
        const depositTx = await treasury.depositToken(scenarioAddresses.governanceToken, depositAmount);
        await depositTx.wait();
        await waitForNextBlock();
        
        treasuryBalance = await treasury.getBalance(scenarioAddresses.governanceToken);
        addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'success', icon: '💰', message: `Treasury now has ${ethers.formatEther(treasuryBalance)} tokens` });
      } else {
        addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'success', icon: '🏦', message: `Treasury already has ${ethers.formatEther(treasuryBalance)} tokens` });
      }
      
      switch (state.config.attackType) {
        case 'flashloan': {
          const loanAmountWei = ethers.parseEther(state.config.loanAmount);
          const drainWei = ethers.parseEther(state.config.initialFunds);
          tx = await attackContract.executeAttack(loanAmountWei, drainWei);
          break;
        }
        
        case 'whale': {

            const whaleAddress = await signer.getAddress();
            const drainWei = ethers.parseEther(state.config.initialFunds);
            const governanceToken = getGovernanceTokenContract();

            let currentVotes = await governanceToken.getVotes(whaleAddress);

            if (currentVotes === 0n) {

              addLog({
                timestamp: new Date().toISOString().slice(11,19),
                type:'warning',
                icon:'⚠️',
                message:'Whale has no voting power. Delegating to self...'
              });

              const tx1 = await governanceToken.delegate(whaleAddress);
              await tx1.wait();

              currentVotes = await governanceToken.getVotes(whaleAddress);

              addLog({
                timestamp: new Date().toISOString().slice(11,19),
                type:'success',
                icon:'🐋',
                message:`Whale now has voting power: ${ethers.formatEther(currentVotes)}`
              });

            }

            tx = await attackContract.executeWhaleAttack(
                whaleAddress,
                drainWei
            );

            break;
        }

        case 'spam': {
          const spamCount = parseInt(state.config.loanAmount, 10) || 10;
          tx = await attackContract.executeSpamAttack(spamCount);
          break;
        }

                case 'quorum': {

          const governanceToken = getGovernanceTokenContract();
          const attackerAddress = await signer.getAddress();
          const attackAddress = await attackContract.getAddress();

          // 检查攻击合约 votes
          let votes = await governanceToken.getVotes(attackAddress);

          if (votes === 0n) {

            addLog({
              timestamp: new Date().toISOString().slice(11,19),
              type:'warning',
              icon:'⚠️',
              message:'Delegating voting power to attack contract...'
            });

            const delegateTx = await governanceToken.delegate(attackAddress);
            await delegateTx.wait();

            votes = await governanceToken.getVotes(attackAddress);

            addLog({
              timestamp: new Date().toISOString().slice(11,19),
              type:'success',
              icon:'🗳️',
              message:`Attack contract now has ${ethers.formatEther(votes)} votes`
            });

          }

          const baseDrain = ethers.parseEther(state.config.initialFunds);
          const drainWei = baseDrain + BigInt(Date.now() % 100000);

          const estimatedParticipation = 500;

          tx = await attackContract.executeTimingAttack(
            drainWei,
            estimatedParticipation
          );

          break;
        }

        case 'timelock': {
          const numDrains = parseInt(state.config.loanAmount, 10) || 5;
          const amountWei = ethers.parseEther(state.config.initialFunds);
          tx = await attackContract.executeGradualDrainThroughTimelock(numDrains, amountWei);
          break;
        }
        default:
          throw new Error(`Unsupported attack type: ${state.config.attackType}`);
      }

      addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'success', icon: '📖', message: `Using attack contract address: ${attackContract.target}` });
      addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'info', icon: '📡', message: `Transaction sent: ${tx.hash.slice(0, 10)}...` });
      updateProgress(30, 'preparation');

      const receipt = await tx.wait();
      const gasUsed = BigInt(receipt.gasUsed);
      const effectiveGasPrice = receipt.effectiveGasPrice !== undefined ? BigInt(receipt.effectiveGasPrice) : 0n;
      const costWei = gasUsed * effectiveGasPrice;
      const costEth = ethers.formatEther(costWei);
      addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'success', icon: '✅', message: `Confirmed in block ${receipt.blockNumber}` });

      if (receipt.status === 1) {
        updateProgress(100, 'completed');
        addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'success', icon: '💰', message: `Attack successful!` });
        setState((prev) => ({
          ...prev,
          metrics: {
            ...prev.metrics,
            fundsTransferred: state.config.initialFunds,
            attackCost: costEth,
            successProbability: 100,
            gasUsed: gasUsed.toString(),
          },
        }));
      } else {
        updateProgress(100, 'completed');
        addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'error', icon: '🛡️', message: `Attack failed: Defense mechanism blocked it.` });
        setState((prev) => ({
          ...prev,
          metrics: {
            ...prev.metrics,
            fundsTransferred: '0',
            attackCost: costEth,
            successProbability: 0,
            gasUsed: gasUsed.toString(),
          },
        }));
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Attack simulation failed');
      addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'error', icon: '❌', message: `Error: ${err.message}` });
    } finally {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
      setLoading(false);
      setState((prev) => ({ ...prev, isRunning: false }));
    }
  }, [state.isRunning, state.config, defenseEnabled, updateProgress, scenarioAddresses, refreshNodeBalances]);

  const pauseSimulation = useCallback(() => {
    setState((prev) => ({ ...prev, isRunning: false }));
    if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'info', icon: '⏸️', message: 'Simulation paused.' });
  }, []);

  const resetSimulation = useCallback(() => {
    if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    setState((prev) => ({
      ...prev,
      isRunning: false,
      stage: 'preparation',
      progress: 0,
      logs: [],
      metrics: {
        fundsTransferred: '0',
        attackCost: '0',
        successProbability: defenseEnabled ? 12 : 92,
        gasUsed: '0',
      },
    }));
    setError(null);
    addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'info', icon: '🔄', message: 'Simulation reset.' });
    // 重新生成节点并刷新数据
    generateNodesAndEdges(state.config.attackType, state.config.initialFunds, state.config.loanAmount);
    refreshNodeBalances();
  }, [defenseEnabled, state.config.attackType, state.config.initialFunds, state.config.loanAmount, generateNodesAndEdges, refreshNodeBalances]);

  useEffect(() => {
    let targetContract = '0x...';
    let initialFunds = '100000';
    let loanAmount = '670000';
    if (state.config.attackType === 'whale') {
      loanAmount = '1000000';
    } else if (state.config.attackType === 'spam') {
      initialFunds = '5000';
      loanAmount = '10';
    } else if (state.config.attackType === 'quorum') {
      initialFunds = '1000';
      loanAmount = '0';
    } else if (state.config.attackType === 'timelock') {
      loanAmount = '5';
    }
    updateConfig({ targetContract, initialFunds, loanAmount });
  }, [state.config.attackType, updateConfig]);

  // 组件卸载时清除定时器
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, []);

  return {
    state,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    updateConfig,
    loading,
    error,
  };
};