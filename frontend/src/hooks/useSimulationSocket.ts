import { useEffect, useCallback, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { apiClient } from '../lib/api';

export interface SimulationProgress {
  stage: string;
  step: string;
  progress: number;
}

export interface SimulationLog {
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  icon: string;
  message: string;
}

export interface SimulationResult {
  success: boolean;
  results?: any;
  error?: string;
}

export interface SimulationMetrics {
  fundsTransferred: string;
  attackCost: string;
  successProbability: number;
  gasUsed: string;
  scenario: string;
  defenseEnabled: boolean;
  treasuryBalance: string;
}

export interface SimulationState {
  isRunning: boolean;
  stage: string;
  progress: number;
  logs: SimulationLog[];
  error: string | null;
  metrics: SimulationMetrics;
}

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

// ========== 新增：批量模拟顺序推断 ==========
const SIMULATION_RESULTS_KEY = 'simulation_results';
const SCENARIO_ORDER = ['A', 'B', 'C', 'D', 'E'];
const DEFENSE_ORDER = [false, true]; // false: No Defense, true: With Defense

// 计数器：记录已经处理了多少个结果（每个场景+防御模式为一个结果）
let resultCounter = 0;
// 已保存的记录集合，避免重复保存同一个组合
let savedSet = new Set<string>();

// 保存单个模拟结果到 localStorage 数组
interface StoredResult {
  scenario: string;
  defenseEnabled: boolean;
  attackCost: string;
  gasUsed: string;
  successRate: number;
  totalExtracted: string;
  timestamp: number;
}

// function saveSimulationResult(result: StoredResult) {
//   const existing = localStorage.getItem(SIMULATION_RESULTS_KEY);
//   let results: StoredResult[] = existing ? JSON.parse(existing) : [];
//   const index = results.findIndex(
//     r => r.scenario === result.scenario && r.defenseEnabled === result.defenseEnabled
//   );
//   if (index !== -1) {
//     results[index] = result;
//   } else {
//     results.push(result);
//   }
//   localStorage.setItem(SIMULATION_RESULTS_KEY, JSON.stringify(results));
//   console.log('[Saved simulation result]', result);
// }

function saveSimulationResult(result: StoredResult) {
  const existing = localStorage.getItem(SIMULATION_RESULTS_KEY);
  let results: StoredResult[] = existing ? JSON.parse(existing) : [];
  const index = results.findIndex(
    r => r.scenario === result.scenario && r.defenseEnabled === result.defenseEnabled
  );
  if (index !== -1) {
    results[index] = result;
  } else {
    results.push(result);
  }
  localStorage.setItem(SIMULATION_RESULTS_KEY, JSON.stringify(results));
}

// 重置计数器（开始新的一轮批量模拟前调用）
function resetBatchCounter() {
  resultCounter = 0;
  savedSet.clear();
  console.log('[Batch counter reset]');
}

// ========== Hook 定义 ==========
export const useSimulationSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<SimulationState>({
    isRunning: false,
    stage: 'idle',
    progress: 0,
    logs: [],
    error: null,
    metrics: {
      fundsTransferred: '0',
      attackCost: '0',
      successProbability: 0,
      gasUsed: '0',
      scenario: 'A',
      defenseEnabled: false,
      treasuryBalance: '5000000',
    },
  });

  // 标记当前是否是批量模拟模式（由 startSimulation 的参数决定）
  const isBatchModeRef = useRef(false);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Connected to simulation socket');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from simulation socket');
    });

    socket.on('simulation:start', (data: { scenario: string }) => {
      // 如果是批量模式，重置计数器
      if (isBatchModeRef.current) {
        resetBatchCounter();
      }
      setState(prev => ({
        ...prev,
        isRunning: true,
        stage: 'starting',
        progress: 0,
        logs: [{
          timestamp: new Date().toISOString().slice(11, 19),
          type: 'info',
          icon: '🚀',
          message: `Starting simulation: ${data.scenario}`
        }],
        error: null,
      }));
    });

    socket.on('simulation:progress', (data: SimulationProgress) => {
      setState(prev => ({
        ...prev,
        stage: data.stage,
        progress: data.progress,
      }));
    });

    socket.on('simulation:metrics', (data: SimulationMetrics) => {

      // ✅ 先定义（在最外层）
      let finalScenario = data.scenario;
      let finalDefenseEnabled = data.defenseEnabled;

      // ========= 过滤 =========
      // if (!data.attackCost || data.attackCost === '0') return;

      // ========= 批量推断 =========
      if (isBatchModeRef.current) {
        const scenarioIndex = Math.floor(resultCounter / DEFENSE_ORDER.length);
        const defenseIndex = resultCounter % DEFENSE_ORDER.length;

        if (scenarioIndex < SCENARIO_ORDER.length) {
          finalScenario = SCENARIO_ORDER[scenarioIndex];
          finalDefenseEnabled = DEFENSE_ORDER[defenseIndex];
        }

        resultCounter++; // ❗必须在这里
      }

  // ========= 保存 =========
    const key = `${finalScenario}-${finalDefenseEnabled}`;
    if (savedSet.has(key)) return;

    savedSet.add(key);

    const result: StoredResult = {
      scenario: finalScenario,
      defenseEnabled: finalDefenseEnabled,
      attackCost: data.attackCost,
      gasUsed: data.gasUsed,
      successRate: data.successProbability,
      totalExtracted: (Number(data.fundsTransferred) / 1e18).toFixed(6),
      timestamp: Date.now(),
    };

    saveSimulationResult(result);

  // ✅ 只在这里 ++ 一次
    // if (isBatchModeRef.current) {
    //   resultCounter++;
    // }

  // ========= UI 更新（直接用 final）=========
      setState(prev => ({
        ...prev,
        metrics: {
          ...data,
          scenario: finalScenario,
          defenseEnabled: finalDefenseEnabled,
        },
      }));
    });

    socket.on('simulation:log', (data: SimulationLog) => {
      setState(prev => ({
        ...prev,
        logs: [data, ...prev.logs].slice(0, 100),
      }));
    });

    socket.on('simulation:error', (data: { message: string }) => {
      setState(prev => ({
        ...prev,
        error: data.message,
        isRunning: false,
        logs: [{
          timestamp: new Date().toISOString().slice(11, 19),
          type: 'error',
          icon: '❌',
          message: data.message
        }, ...prev.logs].slice(0, 100),
      }));
    });

    socket.on('simulation:complete', (data: SimulationResult) => {
      setState(prev => ({
        ...prev,
        isRunning: false,
        stage: 'completed',
        progress: 100,
        logs: [{
          timestamp: new Date().toISOString().slice(11, 19),
          type: data.success ? 'success' : 'error',
          icon: data.success ? '✅' : '❌',
          message: data.success ? 'Simulation completed successfully' : `Simulation failed: ${data.error}`
        }, ...prev.logs].slice(0, 100),
      }));
      // 批量模拟完成后，可以保留计数器，但下次批量开始时会重置
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const startSimulation = useCallback(async (scenario?: string, defenseEnabled?: boolean) => {
    try {
      // 如果传入了 scenario 和 defenseEnabled，则为手动单场景模式
      if (scenario !== undefined && defenseEnabled !== undefined) {
        isBatchModeRef.current = false;
        await apiClient.post('/simulation/run', { scenario, defenseEnabled });
      } else {
        // 否则为批量模拟模式（触发后端一次性跑完5个场景）
        isBatchModeRef.current = true;
        await apiClient.post('/simulation/run', {}); // 不传参数，后端自动跑全部
      }
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        error: err.message || 'Failed to start simulation',
      }));
    }
  }, []);

  const stopSimulation = useCallback(async () => {
    try {
      await apiClient.post('/simulation/stop');
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        error: err.message || 'Failed to stop simulation',
      }));
    }
  }, []);

  const resetSimulation = useCallback(() => {
    setState({
      isRunning: false,
      stage: 'idle',
      progress: 0,
      logs: [],
      error: null,
      metrics: {
        fundsTransferred: '0',
        attackCost: '0',
        successProbability: 0,
        gasUsed: '0',
        scenario: 'A',
        defenseEnabled: false,
        treasuryBalance: '5000000',
      },
    });
    // 重置批量模式标志和计数器
    isBatchModeRef.current = false;
    resetBatchCounter();
  }, []);

  return {
    state,
    startSimulation,
    stopSimulation,
    resetSimulation,
  };
};
// import { useEffect, useCallback, useRef, useState } from 'react';
// import { io, Socket } from 'socket.io-client';
// import { apiClient } from '../lib/api';

// export interface SimulationProgress {
//   stage: string;
//   step: string;
//   progress: number;
// }

// export interface SimulationLog {
//   timestamp: string;
//   type: 'info' | 'success' | 'warning' | 'error';
//   icon: string;
//   message: string;
// }

// export interface SimulationResult {
//   success: boolean;
//   results?: any;
//   error?: string;
// }

// export interface SimulationMetrics {
//   fundsTransferred: string;
//   attackCost: string;
//   successProbability: number;
//   gasUsed: string;
//   scenario: string;
//   defenseEnabled: boolean;
//   treasuryBalance: string;
// }

// export interface SimulationState {
//   isRunning: boolean;
//   stage: string;
//   progress: number;
//   logs: SimulationLog[];
//   error: string | null;
//   metrics: SimulationMetrics;
// }

// const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

// export const useSimulationSocket = () => {
//   const socketRef = useRef<Socket | null>(null);
//   const [state, setState] = useState<SimulationState>({
//     isRunning: false,
//     stage: 'idle',
//     progress: 0,
//     logs: [],
//     error: null,
//     metrics: {
//       fundsTransferred: '0',
//       attackCost: '0',
//       successProbability: 0,
//       gasUsed: '0',
//       scenario: 'A',
//       defenseEnabled: false,
//       treasuryBalance: '5000000',
//     },
//   });

//   useEffect(() => {
//     socketRef.current = io(SOCKET_URL, {
//       transports: ['websocket', 'polling'],
//       reconnection: true,
//       reconnectionAttempts: 5,
//       reconnectionDelay: 1000,
//     });

//     const socket = socketRef.current;

//     socket.on('connect', () => {
//       console.log('Connected to simulation socket');
//     });

//     socket.on('disconnect', () => {
//       console.log('Disconnected from simulation socket');
//     });

//     socket.on('simulation:start', (data: { scenario: string }) => {
//       setState(prev => ({
//         ...prev,
//         isRunning: true,
//         stage: 'starting',
//         progress: 0,
//         logs: [{
//           timestamp: new Date().toISOString().slice(11, 19),
//           type: 'info',
//           icon: '🚀',
//           message: `Starting simulation: ${data.scenario}`
//         }],
//         error: null,
//       }));
//     });

//     socket.on('simulation:progress', (data: SimulationProgress) => {
//       setState(prev => ({
//         ...prev,
//         stage: data.stage,
//         progress: data.progress,
//       }));
//     });

//     socket.on('simulation:metrics', (data: SimulationMetrics) => {
//       setState(prev => ({
//         ...prev,
//         metrics: data,
//       }));
//     });

//     socket.on('simulation:log', (data: SimulationLog) => {
//       setState(prev => ({
//         ...prev,
//         logs: [data, ...prev.logs].slice(0, 100),
//       }));
//     });

//     socket.on('simulation:error', (data: { message: string }) => {
//       setState(prev => ({
//         ...prev,
//         error: data.message,
//         isRunning: false,
//         logs: [{
//           timestamp: new Date().toISOString().slice(11, 19),
//           type: 'error',
//           icon: '❌',
//           message: data.message
//         }, ...prev.logs].slice(0, 100),
//       }));
//     });

//     socket.on('simulation:complete', (data: SimulationResult) => {
//       setState(prev => ({
//         ...prev,
//         isRunning: false,
//         stage: 'completed',
//         progress: 100,
//         logs: [{
//           timestamp: new Date().toISOString().slice(11, 19),
//           type: data.success ? 'success' : 'error',
//           icon: data.success ? '✅' : '❌',
//           message: data.success ? 'Simulation completed successfully' : `Simulation failed: ${data.error}`
//         }, ...prev.logs].slice(0, 100),
//       }));
//     });

//     return () => {
//       socket.disconnect();
//     };
//   }, []);

//   const startSimulation = useCallback(async (scenario?: string, defenseEnabled?: boolean) => {
//     try {
//       await apiClient.post('/simulation/run', { scenario, defenseEnabled });
//     } catch (err: any) {
//       setState(prev => ({
//         ...prev,
//         error: err.message || 'Failed to start simulation',
//       }));
//     }
//   }, []);

//   const stopSimulation = useCallback(async () => {
//     try {
//       await apiClient.post('/simulation/stop');
//     } catch (err: any) {
//       setState(prev => ({
//         ...prev,
//         error: err.message || 'Failed to stop simulation',
//       }));
//     }
//   }, []);

//   const resetSimulation = useCallback(() => {
//     setState({
//       isRunning: false,
//       stage: 'idle',
//       progress: 0,
//       logs: [],
//       error: null,
//       metrics: {
//         fundsTransferred: '0',
//         attackCost: '0',
//         successProbability: 0,
//         gasUsed: '0',
//         scenario: 'A',
//         defenseEnabled: false,
//         treasuryBalance: '5000000',
//       },
//     });
//   }, []);

//   return {
//     state,
//     startSimulation,
//     stopSimulation,
//     resetSimulation,
//   };
// };