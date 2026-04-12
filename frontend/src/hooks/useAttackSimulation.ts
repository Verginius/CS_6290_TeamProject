// import { useState, useCallback, useEffect } from 'react';
// import { useSimulationSocket,} from './useSimulationSocket';
// import type { SimulationLog, SimulationMetrics } from './useSimulationSocket';

// export type AttackStage = 'idle' | 'starting' | 'deploy' | 'setup' | 'attack' | 'defended' | 'export' | 'completed';
// export type LogEntry = SimulationLog;

// // localStorage 存储 key
// const SIMULATION_RESULTS_KEY = 'simulation_results';

// // 定义保存的数据结构
// export interface SimulationResult {
//   scenario: string;          // 'A' | 'B' | 'C' | 'D' | 'E'
//   defenseEnabled: boolean;
//   attackCost: string;        // ETH 字符串
//   gasUsed: string;
//   successRate: number;       // 0-100
//   totalExtracted: string;    // ETH 字符串
//   timestamp: number;
// }

// // 保存结果的函数
// const saveSimulationResult = (result: SimulationResult) => {
//   const existing = localStorage.getItem(SIMULATION_RESULTS_KEY);
//   let results: SimulationResult[] = existing ? JSON.parse(existing) : [];
//   // 查找是否已有相同 (scenario + defenseEnabled) 的记录，有则覆盖
//   const index = results.findIndex(
//     r => r.scenario === result.scenario && r.defenseEnabled === result.defenseEnabled
//   );
//   if (index !== -1) {
//     results[index] = result;
//   } else {
//     results.push(result);
//   }
//   localStorage.setItem(SIMULATION_RESULTS_KEY, JSON.stringify(results));
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

// export const useAttackSimulation = (defenseEnabled: boolean, initialAttackType: string = 'flashloan') => {
//   const [config, setConfig] = useState({
//     attackType: initialAttackType as 'flashloan' | 'whale' | 'spam' | 'quorum' | 'timelock',
//     targetContract: '0x...',
//     initialFunds: '100000',
//     flashloanSource: 'aave' as 'aave' | 'uniswap' | 'balancer',
//     loanAmount: '670000',
//   });

//   const { state: socketState, startSimulation, stopSimulation, resetSimulation } = useSimulationSocket();

//   const getNodes = () => {
//     const treasuryBalance = socketState.metrics.treasuryBalance || '5000000';
//     return [
//       { id: 'attacker', type: 'wallet', label: 'Attacker', balance: '10000' },
//       { id: 'proposal', type: 'contract', label: 'Governor', balance: '0' },
//       { id: 'treasury', type: 'contract', label: 'Treasury', balance: treasuryBalance },
//     ];
//   };

//   const nodes = getNodes();

//   const edges = [
//     { source: 'attacker', target: 'proposal', value: '670000', label: 'Submit Proposal' },
//     { source: 'proposal', target: 'treasury', value: '1000', label: 'Transfer Funds' },
//   ];

//   const state: AttackSimulationState = {
//     isRunning: socketState.isRunning,
//     stage: socketState.stage as AttackStage,
//     progress: socketState.progress,
//     logs: socketState.logs,
//     metrics: {
//       fundsTransferred: socketState.metrics.fundsTransferred,
//       attackCost: socketState.metrics.attackCost,
//       successProbability: socketState.metrics.successProbability,
//       gasUsed: socketState.metrics.gasUsed,
//     },
//     config,
//     nodes,
//     edges,
//   };

//   const updateConfig = useCallback((newConfig: Partial<typeof config>) => {
//     setConfig((prev) => ({ ...prev, ...newConfig }));
//   }, []);

//   const start = useCallback(async () => {
//     await startSimulation(undefined, defenseEnabled);
//   }, [startSimulation, defenseEnabled]);

//   const pauseSimulation = useCallback(async () => {
//     await stopSimulation();
//   }, [stopSimulation]);

//   const reset = useCallback(() => {
//     resetSimulation();
//   }, [resetSimulation]);

//   useEffect(() => {
//     let targetContract = '0x...';
//     let initialFunds = '100000';
//     let loanAmount = '670000';
//     if (config.attackType === 'whale') {
//       loanAmount = '1000000';
//     } else if (config.attackType === 'spam') {
//       initialFunds = '5000';
//       loanAmount = '10';
//     } else if (config.attackType === 'quorum') {
//       initialFunds = '1000';
//       loanAmount = '0';
//     } else if (config.attackType === 'timelock') {
//       loanAmount = '5';
//     }
//     updateConfig({ targetContract, initialFunds, loanAmount });
//   }, [config.attackType, updateConfig]);

  
//   // 新增：当模拟完成时保存结果
//   useEffect(() => {
//     // 监听 isRunning 从 true 变为 false，且 progress 为 100 或有 metrics 数据
//     if (!socketState.isRunning && socketState.progress === 100 && socketState.metrics.attackCost !== '0') {
//       const scenario = socketState.metrics.scenario || 'A'; // 确保你的 metrics 中有 scenario
//       const result: SimulationResult = {
//         scenario,
//         defenseEnabled,
//         attackCost: socketState.metrics.attackCost,
//         gasUsed: socketState.metrics.gasUsed,
//         successRate: socketState.metrics.successProbability,
//         totalExtracted: socketState.metrics.fundsTransferred, // 或使用单独的字段
//         timestamp: Date.now(),
//       };
//       saveSimulationResult(result);
//     }
//   }, [socketState.isRunning, socketState.progress, socketState.metrics, defenseEnabled]);

//   return {
//     state,
//     startSimulation: start,
//     pauseSimulation,
//     resetSimulation: reset,
//     updateConfig,
//     loading: socketState.isRunning,
//     error: socketState.error,
//   };
// };

// useAttackSimulation.ts

import { useState, useCallback, useEffect } from 'react';
import { useSimulationSocket } from './useSimulationSocket';
import type { SimulationLog, SimulationMetrics } from './useSimulationSocket';

// localStorage 存储 key
const SIMULATION_RESULTS_KEY = 'simulation_results';

export interface SimulationResult {
  scenario: string;          // 'A' | 'B' | 'C' | 'D' | 'E'
  defenseEnabled: boolean;
  attackCost: string;
  gasUsed: string;
  successRate: number;
  totalExtracted: string;
  timestamp: number;
}

const saveSimulationResult = (result: SimulationResult) => {
  const existing = localStorage.getItem(SIMULATION_RESULTS_KEY);
  let results: SimulationResult[] = existing ? JSON.parse(existing) : [];
  const index = results.findIndex(
    r => r.scenario === result.scenario && r.defenseEnabled === result.defenseEnabled
  );
  if (index !== -1) {
    results[index] = result;
  } else {
    results.push(result);
  }
  localStorage.setItem(SIMULATION_RESULTS_KEY, JSON.stringify(results));
  console.log('[Saved]', result);
};

export type AttackStage = 'idle' | 'starting' | 'deploy' | 'setup' | 'attack' | 'defended' | 'export' | 'completed';
export type LogEntry = SimulationLog;

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

export const useAttackSimulation = (
  defenseEnabled: boolean, 
  initialAttackType: string = 'flashloan',
  scenario: string = 'A'   // 新增场景参数
) => {
  const [config, setConfig] = useState({
    attackType: initialAttackType as 'flashloan' | 'whale' | 'spam' | 'quorum' | 'timelock',
    targetContract: '0x...',
    initialFunds: '100000',
    flashloanSource: 'aave' as 'aave' | 'uniswap' | 'balancer',
    loanAmount: '670000',
  });

  const { state: socketState, startSimulation, stopSimulation, resetSimulation } = useSimulationSocket();

  const getNodes = () => {
    const treasuryBalance = socketState.metrics.treasuryBalance || '5000000';
    return [
      { id: 'attacker', type: 'wallet', label: 'Attacker', balance: '10000' },
      { id: 'proposal', type: 'contract', label: 'Governor', balance: '0' },
      { id: 'treasury', type: 'contract', label: 'Treasury', balance: treasuryBalance },
    ];
  };

  const nodes = getNodes();
  const edges = [
    { source: 'attacker', target: 'proposal', value: '670000', label: 'Submit Proposal' },
    { source: 'proposal', target: 'treasury', value: '1000', label: 'Transfer Funds' },
  ];

  const state: AttackSimulationState = {
    isRunning: socketState.isRunning,
    stage: socketState.stage as AttackStage,
    progress: socketState.progress,
    logs: socketState.logs,
    metrics: {
      fundsTransferred: socketState.metrics.fundsTransferred,
      attackCost: socketState.metrics.attackCost,
      successProbability: socketState.metrics.successProbability,
      gasUsed: socketState.metrics.gasUsed,
    },
    config,
    nodes,
    edges,
  };

  const updateConfig = useCallback((newConfig: Partial<typeof config>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  }, []);

  // const start = useCallback(async () => {
  //   await startSimulation(scenario, defenseEnabled);
  // }, [startSimulation, defenseEnabled, scenario]);
  const start = useCallback(async () => {
    await startSimulation(); // ❗这里不要传参数
    }, [startSimulation]);

  const pauseSimulation = useCallback(async () => {
    await stopSimulation();
  }, [stopSimulation]);

  const reset = useCallback(() => {
    resetSimulation();
  }, [resetSimulation]);

  useEffect(() => {
    let targetContract = '0x...';
    let initialFunds = '100000';
    let loanAmount = '670000';
    if (config.attackType === 'whale') {
      loanAmount = '1000000';
    } else if (config.attackType === 'spam') {
      initialFunds = '5000';
      loanAmount = '10';
    } else if (config.attackType === 'quorum') {
      initialFunds = '1000';
      loanAmount = '0';
    } else if (config.attackType === 'timelock') {
      loanAmount = '5';
    }
    updateConfig({ targetContract, initialFunds, loanAmount });
  }, [config.attackType, updateConfig]);

  return {
    state,
    startSimulation: start,
    pauseSimulation,
    resetSimulation: reset,
    updateConfig,
    loading: socketState.isRunning,
    error: socketState.error,
  };
};