// import { useState, useEffect, useCallback } from 'react';
// import { getGovernorContract } from '../lib/web3';
// import { apiClient } from '../lib/api';
// import { ethers } from 'ethers';

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
//     attackType: 'flashloan' | 'sybil' | 'bribery' | 'combined';
//     targetContract: string;
//     initialFunds: string;
//     flashloanSource: 'aave' | 'uniswap' | 'balancer';
//     loanAmount: string;
//   };
//   nodes: Array<{ id: string; type: string; label: string; balance: string }>;
//   edges: Array<{ source: string; target: string; value: string; label: string }>;
// }

// export const useAttackSimulation = (defenseEnabled: boolean) => {
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
//       attackType: 'flashloan',
//       targetContract: '0x...', // 占位
//       initialFunds: '100000',
//       flashloanSource: 'aave',
//       loanAmount: '670000',
//     },
//     nodes: [
//       { id: 'flashloan', type: 'protocol', label: 'Flash Loan (Aave)', balance: '0' },
//       { id: 'attacker', type: 'wallet', label: 'Attacker', balance: '10000' },
//       { id: 'proposal', type: 'contract', label: 'Governor', balance: '0' },
//       { id: 'treasury', type: 'contract', label: 'Treasury', balance: '1000' },
//     ],
//     edges: [
//       { source: 'flashloan', target: 'attacker', value: '670000', label: 'Borrow Tokens' },
//       { source: 'attacker', target: 'proposal', value: '670000', label: 'Submit Proposal' },
//       { source: 'proposal', target: 'treasury', value: '1000', label: 'Transfer Funds' },
//     ],
//   });

//   // 添加日志
//   const addLog = (log: LogEntry) => {
//     setState((prev) => ({
//       ...prev,
//       logs: [log, ...prev.logs].slice(0, 100), // 最多保留100条
//     }));
//   };

//   // 更新进度
//   const updateProgress = useCallback((newProgress: number, stage: AttackStage) => {
//     setState((prev) => ({
//       ...prev,
//       progress: newProgress,
//       stage,
//     }));
//   }, []);

//   // 启动模拟（实际应调用合约或后端 API）
//   const startSimulation = useCallback(async () => {
//     if (state.isRunning) return;

//     setState((prev) => ({ ...prev, isRunning: true, logs: [] }));
//     addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'info', icon: '⚙️', message: 'Starting attack simulation...' });

//     // TODO: 实际执行攻击（调用合约或后端）
//     // 这里模拟异步攻击过程
//     const steps = ['flashloan', 'proposal', 'voting', 'execution'];
//     let currentStep = 0;
//     const interval = setInterval(() => {
//       if (currentStep >= steps.length) {
//         clearInterval(interval);
//         setState((prev) => ({ ...prev, isRunning: false, stage: 'completed', progress: 100 }));
//         addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'success', icon: '✅', message: 'Attack simulation completed.' });
//         return;
//       }
//       const step = steps[currentStep];
//       currentStep++;
//       const newProgress = (currentStep / steps.length) * 100;

//       switch (step) {
//         case 'flashloan':
//           updateProgress(newProgress, 'flashloan');
//           addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'success', icon: '⚡', message: `Flash loan: borrowed ${state.config.loanAmount} tokens from ${state.config.flashloanSource}.` });
//           break;
//         case 'proposal':
//           updateProgress(newProgress, 'proposal');
//           addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'info', icon: '📝', message: `Malicious proposal submitted targeting ${state.config.targetContract}.` });
//           break;
//         case 'voting':
//           updateProgress(newProgress, 'voting');
//           addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'warning', icon: '🗳️', message: 'Voting period started. Manipulating votes...' });
//           break;
//         case 'execution':
//           updateProgress(newProgress, 'execution');
//           if (!defenseEnabled) {
//             addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'success', icon: '💰', message: `Proposal executed! ${state.config.initialFunds} tokens transferred to attacker.` });
//             setState((prev) => ({
//               ...prev,
//               metrics: {
//                 ...prev.metrics,
//                 fundsTransferred: state.config.initialFunds,
//                 attackCost: '2.8',
//                 successProbability: 92,
//                 gasUsed: '1250000',
//               },
//             }));
//           } else {
//             addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'error', icon: '🛡️', message: 'Defense mechanism triggered! Timelock prevented execution.' });
//             setState((prev) => ({
//               ...prev,
//               metrics: {
//                 ...prev.metrics,
//                 fundsTransferred: '0',
//                 attackCost: '2.8',
//                 successProbability: 12,
//                 gasUsed: '1250000',
//               },
//             }));
//           }
//           break;
//       }
//     }, 2000);
//   }, [state.isRunning, defenseEnabled, state.config, updateProgress]);

//   const pauseSimulation = useCallback(() => {
//     setState((prev) => ({ ...prev, isRunning: false }));
//     addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'info', icon: '⏸️', message: 'Simulation paused.' });
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
//     addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'info', icon: '🔄', message: 'Simulation reset.' });
//   }, [defenseEnabled]);

//   const updateConfig = useCallback((newConfig: Partial<AttackSimulationState['config']>) => {
//     setState((prev) => ({
//       ...prev,
//       config: { ...prev.config, ...newConfig },
//     }));
//   }, []);

//   return { state, startSimulation, pauseSimulation, resetSimulation, updateConfig };
// };

import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import {
  getFlashLoanAttackContract,
  getWhaleManipulationContract,
  getProposalSpamContract,
  getQuorumManipulationContract,
  getTimelockExploitContract,
  getGovernorContract,
} from '../lib/web3';

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

// 攻击合约工厂映射
const attackContractMap = {
  flashloan: getFlashLoanAttackContract,
  whale: getWhaleManipulationContract,
  spam: getProposalSpamContract,
  quorum: getQuorumManipulationContract,
  timelock: getTimelockExploitContract,
};

export const useAttackSimulation = (defenseEnabled: boolean, initialAttackType: string = 'flashloan') => {
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
      targetContract: '0x...', // 占位
      initialFunds: '100000',
      flashloanSource: 'aave',
      loanAmount: '670000',
    },
    nodes: [
      { id: 'flashloan', type: 'protocol', label: 'Flash Loan (Aave)', balance: '0' },
      { id: 'attacker', type: 'wallet', label: 'Attacker', balance: '10000' },
      { id: 'proposal', type: 'contract', label: 'Governor', balance: '0' },
      { id: 'treasury', type: 'contract', label: 'Treasury', balance: '1000' },
    ],
    edges: [
      { source: 'flashloan', target: 'attacker', value: '670000', label: 'Borrow Tokens' },
      { source: 'attacker', target: 'proposal', value: '670000', label: 'Submit Proposal' },
      { source: 'proposal', target: 'treasury', value: '1000', label: 'Transfer Funds' },
    ],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 添加日志
  const addLog = (log: LogEntry) => {
    setState((prev) => ({
      ...prev,
      logs: [log, ...prev.logs].slice(0, 100),
    }));
  };

  // 更新进度
  const updateProgress = useCallback((newProgress: number, stage: AttackStage) => {
    setState((prev) => ({
      ...prev,
      progress: newProgress,
      stage,
    }));
  }, []);

  // 更新攻击配置
  const updateConfig = useCallback((newConfig: Partial<AttackSimulationState['config']>) => {
    setState((prev) => ({
      ...prev,
      config: { ...prev.config, ...newConfig },
    }));
  }, []);

  // 启动攻击（调用真实合约）
  const startSimulation = useCallback(async () => {
    if (state.isRunning) return;

    setLoading(true);
    setError(null);
    setState((prev) => ({ ...prev, isRunning: true, logs: [] }));
    addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'info', icon: '⚙️', message: `Starting ${state.config.attackType} attack...` });

    try {
      const getContract = attackContractMap[state.config.attackType];
      if (!getContract) throw new Error(`Unknown attack type: ${state.config.attackType}`);
      const attackContract = getContract();

      // 根据防御模式选择治理合约地址
      const governorAddress = defenseEnabled
        ? import.meta.env.VITE_GOVERNOR_DEFENSE_ADDRESS
        : import.meta.env.VITE_GOVERNOR_VULNERABLE_ADDRESS;
      const treasuryAddress = import.meta.env.VITE_TREASURY_ADDRESS;

      let tx;
      switch (state.config.attackType) {
        case 'flashloan': {
          const loanAmountWei = ethers.parseEther(state.config.loanAmount);
          const drainWei = ethers.parseEther(state.config.initialFunds);
          tx = await attackContract.executeAttack(loanAmountWei, drainWei);
          break;
        }
        case 'whale': {
          const whaleAddress = import.meta.env.VITE_WHALE_ADDRESS || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
          const drainWei = ethers.parseEther(state.config.initialFunds);
          tx = await attackContract.executeWhaleAttack(whaleAddress, drainWei);
          break;
        }
        case 'spam': {
          const spamCount = parseInt(state.config.loanAmount) || 10;
          tx = await attackContract.executeSpamAttack(spamCount);
          break;
        }
        case 'quorum': {
          const drainWei = ethers.parseEther(state.config.initialFunds);
          const estimatedParticipation = 500; // 5% 参与率（基点）
          tx = await attackContract.executeTimingAttack(drainWei, estimatedParticipation);
          break;
        }
        case 'timelock': {
          const numDrains = parseInt(state.config.loanAmount) || 5;
          const amountWei = ethers.parseEther(state.config.initialFunds);
          tx = await attackContract.executeGradualDrainThroughTimelock(numDrains, amountWei);
          break;
        }
        default:
          throw new Error(`Unsupported attack type: ${state.config.attackType}`);
      }

      addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'info', icon: '📡', message: `Transaction sent: ${tx.hash.slice(0, 10)}...` });
      updateProgress(30, 'preparation');

      // 等待交易确认
      const receipt = await tx.wait();
      addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'success', icon: '✅', message: `Confirmed in block ${receipt.blockNumber}` });

      // 根据交易结果更新指标
      if (receipt.status === 1) {
        updateProgress(100, 'completed');
        addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'success', icon: '💰', message: `Attack successful!` });
        setState((prev) => ({
          ...prev,
          metrics: {
            ...prev.metrics,
            fundsTransferred: state.config.initialFunds,
            successProbability: defenseEnabled ? 12 : 92,
            gasUsed: receipt.gasUsed.toString(),
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
            successProbability: defenseEnabled ? 12 : 92,
            gasUsed: receipt.gasUsed.toString(),
          },
        }));
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Attack simulation failed');
      addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'error', icon: '❌', message: `Error: ${err.message}` });
    } finally {
      setLoading(false);
      setState((prev) => ({ ...prev, isRunning: false }));
    }
  }, [state.isRunning, state.config, defenseEnabled, updateProgress]);

  // 暂停模拟（实际交易无法暂停，只更新前端状态）
  const pauseSimulation = useCallback(() => {
    setState((prev) => ({ ...prev, isRunning: false }));
    addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'info', icon: '⏸️', message: 'Simulation paused (transaction may still be pending).' });
  }, []);

  // 重置模拟
  const resetSimulation = useCallback(() => {
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
  }, [defenseEnabled]);

  // 当攻击类型改变时，调整默认配置
  useEffect(() => {
    let targetContract = '0x...';
    let initialFunds = '100000';
    let loanAmount = '670000';
    if (state.config.attackType === 'whale') {
      loanAmount = '1000000';
    } else if (state.config.attackType === 'spam') {
      initialFunds = '5000';
      loanAmount = '10'; // 垃圾提案数量
    } else if (state.config.attackType === 'quorum') {
      initialFunds = '1000';
      loanAmount = '0';
    } else if (state.config.attackType === 'timelock') {
      loanAmount = '5'; // 提现次数
    }
    updateConfig({ targetContract, initialFunds, loanAmount });
  }, [state.config.attackType, updateConfig]);

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