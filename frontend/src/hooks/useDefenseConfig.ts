// // src/hooks/useDefenseConfig.ts
// import { useState, useCallback, useEffect } from 'react';
// import { apiClient } from '../lib/api';
// import type { DefenseConfig, ImpactAnalysis, TradeoffScores, StressTestResult } from '../types/defense';

// // 默认配置（mock 数据）
// const MOCK_CONFIG: DefenseConfig = {
//   timelock: { enabled: true, delay: 48 },
//   quorum: { enabled: true, threshold: 15 },
//   votingDelay: { enabled: true, blocks: 10000 },
//   emergencyPause: { enabled: true, triggerCondition: '75% Abnormal Voting' },
//   multisig: { enabled: true, signers: 5, threshold: 3 },
//   tokenWeighting: { enabled: true, type: 'quadratic' },
// };

// // 预设场景（mock）
// const MOCK_PRESETS: Record<string, DefenseConfig> = {
//   'Flash Loan Attack': {
//     timelock: { enabled: true, delay: 72 },
//     quorum: { enabled: true, threshold: 20 },
//     votingDelay: { enabled: true, blocks: 14400 },
//     emergencyPause: { enabled: true, triggerCondition: 'Flash Loan Detected' },
//     multisig: { enabled: true, signers: 7, threshold: 5 },
//     tokenWeighting: { enabled: true, type: 'quadratic' },
//   },
//   'Sybil Attack': {
//     timelock: { enabled: true, delay: 48 },
//     quorum: { enabled: true, threshold: 10 },
//     votingDelay: { enabled: true, blocks: 7200 },
//     emergencyPause: { enabled: true, triggerCondition: '90% Abnormal Voting' },
//     multisig: { enabled: true, signers: 5, threshold: 3 },
//     tokenWeighting: { enabled: true, type: 'linear' },
//   },
// };

// export const useDefenseConfig = () => {
//   const [config, setConfig] = useState<DefenseConfig>(MOCK_CONFIG);
//   const [impact, setImpact] = useState<ImpactAnalysis>({
//     attackCostChange: 120,
//     successRateChange: -85,
//     gasUsageChange: 45,
//   });
//   const [tradeoff, setTradeoff] = useState<TradeoffScores>({
//     security: 92,
//     efficiency: 78,
//     cost: 65,
//   });
//   const [stressResult, setStressResult] = useState<StressTestResult | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [usingMock, setUsingMock] = useState(false);

//   // 根据配置重新计算影响分析和权衡分数（与之前相同）
//   const recalcImpactAndTradeoff = useCallback((newConfig: DefenseConfig) => {
//     let securityScore = 50;
//     let efficiencyScore = 50;
//     let costScore = 50;

//     if (newConfig.timelock.enabled) {
//       securityScore += newConfig.timelock.delay / 24 * 10;
//       efficiencyScore -= newConfig.timelock.delay / 24 * 5;
//       costScore += 5;
//     }
//     if (newConfig.quorum.enabled) {
//       securityScore += newConfig.quorum.threshold * 2;
//       efficiencyScore -= newConfig.quorum.threshold;
//       costScore += 3;
//     }
//     if (newConfig.votingDelay.enabled) {
//       securityScore += newConfig.votingDelay.blocks / 1000;
//       efficiencyScore -= newConfig.votingDelay.blocks / 1000;
//     }
//     if (newConfig.emergencyPause.enabled) {
//       securityScore += 20;
//       efficiencyScore -= 10;
//     }
//     if (newConfig.multisig.enabled) {
//       securityScore += newConfig.multisig.threshold * 5;
//       efficiencyScore -= newConfig.multisig.threshold * 2;
//       costScore += 10;
//     }
//     if (newConfig.tokenWeighting.enabled) {
//       securityScore += 15;
//       efficiencyScore += 5;
//     }

//     securityScore = Math.min(100, Math.max(0, securityScore));
//     efficiencyScore = Math.min(100, Math.max(0, efficiencyScore));
//     costScore = Math.min(100, Math.max(0, costScore));

//     setTradeoff({
//       security: Math.round(securityScore),
//       efficiency: Math.round(efficiencyScore),
//       cost: Math.round(costScore),
//     });

//     const baseSecurity = 50;
//     const securityChange = securityScore - baseSecurity;
//     setImpact({
//       attackCostChange: Math.round(120 + securityChange * 0.5),
//       successRateChange: Math.round(-85 - securityChange * 0.5),
//       gasUsageChange: Math.round(45 + securityChange * 0.3),
//     });
//   }, []);

//   // 初始化时尝试从 API 获取真实配置，失败则使用 mock
//   useEffect(() => {
//     const fetchConfig = async () => {
//       setLoading(true);
//       try {
//         const res = await apiClient.get<DefenseConfig>('/defense/config');
//         setConfig(res.data);
//         recalcImpactAndTradeoff(res.data);
//         setUsingMock(false);
//         setError(null);
//       } catch (err) {
//         console.warn('API failed, using mock defense config', err);
//         // 使用 mock 数据
//         setConfig(MOCK_CONFIG);
//         recalcImpactAndTradeoff(MOCK_CONFIG);
//         setUsingMock(true);
//         // 可选：设置一个提示信息，但不作为错误展示
//         // setError('Using mock data because API is unavailable');
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchConfig();
//   }, [recalcImpactAndTradeoff]);

//   // 更新配置的单个字段
//   const updateConfig = useCallback((key: keyof DefenseConfig, value: any) => {
//     setConfig(prev => {
//       const newConfig = { ...prev, [key]: value };
//       recalcImpactAndTradeoff(newConfig);
//       return newConfig;
//     });
//   }, [recalcImpactAndTradeoff]);

//   // 更新嵌套字段
//   const updateNested = useCallback((section: keyof DefenseConfig, field: string, value: any) => {
//     setConfig(prev => {
//       const newConfig = {
//         ...prev,
//         [section]: { ...prev[section], [field]: value },
//       };
//       recalcImpactAndTradeoff(newConfig);
//       return newConfig;
//     });
//   }, [recalcImpactAndTradeoff]);

//   // 保存配置到后端
//   const saveConfig = useCallback(async () => {
//     setLoading(true);
//     try {
//       await apiClient.post('/defense/config', config);
//       // 可选：显示成功提示
//     } catch (err) {
//       console.error('Failed to save config', err);
//       setError('Failed to save configuration');
//     } finally {
//       setLoading(false);
//     }
//   }, [config]);

//   // 加载预设场景
//   const loadPreset = useCallback(async (presetName: string) => {
//     setLoading(true);
//     try {
//       // 先尝试从 API 获取预设
//       const res = await apiClient.get<DefenseConfig>(`/defense/preset/${presetName}`);
//       setConfig(res.data);
//       recalcImpactAndTradeoff(res.data);
//       setUsingMock(false);
//     } catch (err) {
//       console.warn('API preset failed, using mock preset', err);
//       // 使用本地 mock 预设
//       const preset = MOCK_PRESETS[presetName];
//       if (preset) {
//         setConfig(preset);
//         recalcImpactAndTradeoff(preset);
//         setUsingMock(true);
//       } else {
//         setError(`Preset "${presetName}" not found`);
//       }
//     } finally {
//       setLoading(false);
//     }
//   }, [recalcImpactAndTradeoff]);

//   // 启动压力测试
//   const startStressTest = useCallback(async (concurrentAttacks: number, durationHours: number) => {
//     setLoading(true);
//     setStressResult({ status: 'running', progress: 0, totalAttacks: 0, defended: 0, failed: 0, averageResponseTime: 0, maxFundsLost: '0', totalFundsLost: '0', defenseSuccessRate: 0 });
//     try {
//       const response = await apiClient.post('/defense/stress-test', { concurrentAttacks, duration: durationHours, config });
//       const { testId } = response.data;
//       // 轮询结果
//       const pollInterval = setInterval(async () => {
//         try {
//           const result = await apiClient.get<StressTestResult>(`/defense/stress-test/${testId}`);
//           setStressResult({ ...result.data, status: result.data.completed ? 'completed' : 'running' });
//           if (result.data.completed) clearInterval(pollInterval);
//         } catch (err) {
//           console.error('Failed to get stress test result', err);
//           clearInterval(pollInterval);
//           setError('Stress test polling failed');
//         }
//       }, 2000);
//     } catch (err) {
//       console.error('Failed to start stress test', err);
//       // 可选：模拟一个假结果用于演示
//       setStressResult({
//         status: 'completed',
//         progress: 100,
//         totalAttacks: 65,
//         defended: 42,
//         failed: 23,
//         averageResponseTime: 3.2,
//         maxFundsLost: '1.2',
//         totalFundsLost: '15.8',
//         defenseSuccessRate: 64.6,
//       });
//       setError('Stress test failed, using mock result');
//     } finally {
//       setLoading(false);
//     }
//   }, [config]);

//   // 重置配置到默认
//   const resetConfig = useCallback(() => {
//     setConfig(MOCK_CONFIG);
//     recalcImpactAndTradeoff(MOCK_CONFIG);
//     setUsingMock(false);
//   }, [recalcImpactAndTradeoff]);

//   return {
//     config,
//     impact,
//     tradeoff,
//     stressResult,
//     loading,
//     error,
//     usingMock,
//     updateConfig,
//     updateNested,
//     saveConfig,
//     loadPreset,
//     startStressTest,
//     resetConfig,
//   };
// };

// src/hooks/useDefenseConfig.ts
import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../lib/api';
import type { DefenseConfig, ImpactAnalysis, TradeoffScores, StressTestResult } from '../types/defense';

// 默认配置（mock）
const DEFAULT_CONFIG: DefenseConfig = {
  votingDelay: { enabled: true, blocks: 14400 },
  snapshotVoting: { enabled: true },
  tokenLocking: { enabled: true, lockPeriod: 1000 },
  dynamicQuorum: { enabled: true, minBps: 200, maxBps: 1000, windowSize: 10 },
  emergencyPause: { enabled: true, guardian: '0x1804c8AB1F12E6bbf3894d4083f33e07309d1f38' },
};

// 预设场景（mock）
const PRESETS: Record<string, DefenseConfig> = {
  'Flash Loan Attack': {
    votingDelay: { enabled: true, blocks: 28800 },
    snapshotVoting: { enabled: true },
    tokenLocking: { enabled: true, lockPeriod: 2000 },
    dynamicQuorum: { enabled: true, minBps: 300, maxBps: 1000, windowSize: 15 },
    emergencyPause: { enabled: true, guardian: '0x1804c8AB1F12E6bbf3894d4083f33e07309d1f38' },
  },
  'Whale Manipulation': {
    votingDelay: { enabled: true, blocks: 12000 },
    snapshotVoting: { enabled: true },
    tokenLocking: { enabled: true, lockPeriod: 800 },
    dynamicQuorum: { enabled: true, minBps: 250, maxBps: 900, windowSize: 12 },
    emergencyPause: { enabled: true, guardian: '0x1804c8AB1F12E6bbf3894d4083f33e07309d1f38' },
  },
  'Proposal Spam': {
    votingDelay: { enabled: true, blocks: 7200 },
    snapshotVoting: { enabled: true },
    tokenLocking: { enabled: true, lockPeriod: 400 },
    dynamicQuorum: { enabled: true, minBps: 300, maxBps: 800, windowSize: 8 },
    emergencyPause: { enabled: true, guardian: '0x1804c8AB1F12E6bbf3894d4083f33e07309d1f38' },
  },
  'Quorum Manipulation': {
    votingDelay: { enabled: true, blocks: 4800 },
    snapshotVoting: { enabled: true },
    tokenLocking: { enabled: true, lockPeriod: 300 },
    dynamicQuorum: { enabled: true, minBps: 400, maxBps: 700, windowSize: 6 },
    emergencyPause: { enabled: true, guardian: '0x1804c8AB1F12E6bbf3894d4083f33e07309d1f38' },
  },
  'Timelock Exploit': {
    votingDelay: { enabled: true, blocks: 6000 },
    snapshotVoting: { enabled: true },
    tokenLocking: { enabled: true, lockPeriod: 500 },
    dynamicQuorum: { enabled: true, minBps: 350, maxBps: 850, windowSize: 9 },
    emergencyPause: { enabled: true, guardian: '0x1804c8AB1F12E6bbf3894d4083f33e07309d1f38' },
  },
  'Sybil Attack': {
    votingDelay: { enabled: true, blocks: 7200 },
    snapshotVoting: { enabled: true },
    tokenLocking: { enabled: true, lockPeriod: 500 },
    dynamicQuorum: { enabled: true, minBps: 150, maxBps: 800, windowSize: 8 },
    emergencyPause: { enabled: true, guardian: '0x1804c8AB1F12E6bbf3894d4083f33e07309d1f38' },
  },
  'Bribery Attack': {
    votingDelay: { enabled: true, blocks: 9600 },
    snapshotVoting: { enabled: true },
    tokenLocking: { enabled: true, lockPeriod: 600 },
    dynamicQuorum: { enabled: true, minBps: 200, maxBps: 900, windowSize: 10 },
    emergencyPause: { enabled: true, guardian: '0x1804c8AB1F12E6bbf3894d4083f33e07309d1f38' },
  },
  'Combined Attack': {
    votingDelay: { enabled: true, blocks: 14400 },
    snapshotVoting: { enabled: true },
    tokenLocking: { enabled: true, lockPeriod: 1000 },
    dynamicQuorum: { enabled: true, minBps: 250, maxBps: 950, windowSize: 12 },
    emergencyPause: { enabled: true, guardian: '0x1804c8AB1F12E6bbf3894d4083f33e07309d1f38' },
  },
};

// 根据配置计算影响和权衡分数
const computeImpactAndTradeoff = (config: DefenseConfig): { impact: ImpactAnalysis; tradeoff: TradeoffScores } => {
  let security = 50;
  let efficiency = 50;
  let cost = 50;

  if (config.votingDelay.enabled) {
    const blocks = config.votingDelay.blocks;
    security += blocks / 1000 * 15;
    efficiency -= blocks / 1000 * 5;
    cost += 5;
  }
  if (config.snapshotVoting.enabled) {
    security += 20;
    efficiency -= 5;
    cost += 3;
  }
  if (config.tokenLocking.enabled) {
    const lock = config.tokenLocking.lockPeriod;
    security += lock / 100 * 5;
    efficiency -= lock / 100 * 2;
    cost += 8;
  }
  if (config.dynamicQuorum.enabled) {
    security += 15;
    efficiency += 10;
    cost += 10;
  }
  if (config.emergencyPause.enabled) {
    security += 30;
    efficiency -= 15;
    cost += 5;
  }

  security = Math.min(100, Math.max(0, security));
  efficiency = Math.min(100, Math.max(0, efficiency));
  cost = Math.min(100, Math.max(0, cost));

  const baseSecurity = 50;
  const delta = security - baseSecurity;
  const impact: ImpactAnalysis = {
    attackCostChange: Math.round(120 + delta * 0.5),
    successRateChange: Math.round(-85 - delta * 0.5),
    gasUsageChange: Math.round(45 + delta * 0.3),
  };
  const tradeoff: TradeoffScores = {
    security: Math.round(security),
    efficiency: Math.round(efficiency),
    cost: Math.round(cost),
  };
  return { impact, tradeoff };
};

export const useDefenseConfig = () => {
  const [config, setConfig] = useState<DefenseConfig>(DEFAULT_CONFIG);
  const [impact, setImpact] = useState<ImpactAnalysis>(() => computeImpactAndTradeoff(DEFAULT_CONFIG).impact);
  const [tradeoff, setTradeoff] = useState<TradeoffScores>(() => computeImpactAndTradeoff(DEFAULT_CONFIG).tradeoff);
  const [stressResult, setStressResult] = useState<StressTestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingMock, setUsingMock] = useState(false);

  // 更新配置并重新计算分数
  const updateConfigAndRecalc = useCallback((newConfig: DefenseConfig) => {
    setConfig(newConfig);
    const { impact: newImpact, tradeoff: newTradeoff } = computeImpactAndTradeoff(newConfig);
    setImpact(newImpact);
    setTradeoff(newTradeoff);
  }, []);

  // 更新嵌套字段
  const updateNested = useCallback((section: keyof DefenseConfig, field: string, value: any) => {
    setConfig(prev => {
      const newConfig = {
        ...prev,
        [section]: { ...prev[section], [field]: value },
      };
      updateConfigAndRecalc(newConfig);
      return newConfig;
    });
  }, [updateConfigAndRecalc]);

  // 保存配置
  const saveConfig = useCallback(async () => {
    setLoading(true);
    try {
      await apiClient.post('/defense/config', config);
      setError(null);
      // 可选：显示成功消息
    } catch (err) {
      console.error('Save config failed', err);
      setError('Failed to save configuration');
    } finally {
      setLoading(false);
    }
  }, [config]);

  // 加载预设
  const loadPreset = useCallback(async (presetName: string) => {
    setLoading(true);
    try {
      const res = await apiClient.get<DefenseConfig>(`/defense/preset/${presetName}`);
      updateConfigAndRecalc(res.data);
      setUsingMock(false);
      setError(null);
    } catch (err) {
      console.warn('API preset failed, using mock preset', err);
      const preset = PRESETS[presetName];
      if (preset) {
        updateConfigAndRecalc(preset);
        setUsingMock(true);
        setError(null); // 不显示错误，仅使用 mock
      } else {
        setError(`Preset "${presetName}" not found`);
      }
    } finally {
      setLoading(false);
    }
  }, [updateConfigAndRecalc]);

  // 启动压力测试
  const startStressTest = useCallback(async (concurrentAttacks: number, durationHours: number) => {
  setLoading(true);
  setStressResult({
    status: 'running',
    progress: 0,
    totalAttacks: 0,
    defended: 0,
    failed: 0,
    averageResponseTime: 0,
    maxFundsLost: '0',
    totalFundsLost: '0',
    defenseSuccessRate: 0,
  });
  try {
    const response = await apiClient.post('/defense/stress-test', { concurrentAttacks, duration: durationHours, config });
    const { testId } = response.data;
    const pollInterval = setInterval(async () => {
      try {
        const result = await apiClient.get<StressTestResult>(`/defense/stress-test/${testId}`);
        // 直接使用 result.data，它已经符合 StressTestResult 类型
        setStressResult(result.data);
        if (result.data.status === 'completed') clearInterval(pollInterval);
      } catch (pollErr) {
        console.error('Polling failed', pollErr);
        clearInterval(pollInterval);
      }
    }, 2000);
  } catch (err) {
    console.error('Stress test start failed', err);
    setStressResult({
      status: 'completed',
      progress: 100,
      totalAttacks: 65,
      defended: 42,
      failed: 23,
      averageResponseTime: 3.2,
      maxFundsLost: '1.2',
      totalFundsLost: '15.8',
      defenseSuccessRate: 64.6,
    });
    setError('Stress test failed, using mock result');
  } finally {
    setLoading(false);
  }
}, [config]);

  // 重置为默认
  const resetConfig = useCallback(() => {
    updateConfigAndRecalc(DEFAULT_CONFIG);
    setUsingMock(false);
    setError(null);
  }, [updateConfigAndRecalc]);

  // 初始加载（尝试从 API 获取真实配置）
  useEffect(() => {
    const fetchInitial = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get<DefenseConfig>('/defense/config');
        updateConfigAndRecalc(res.data);
        setUsingMock(false);
      } catch (err) {
        console.warn('Failed to fetch config, using mock', err);
        updateConfigAndRecalc(DEFAULT_CONFIG);
        setUsingMock(true);
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
  }, [updateConfigAndRecalc]);

  return {
    config,
    impact,
    tradeoff,
    stressResult,
    loading,
    error,
    usingMock,
    updateNested,
    saveConfig,
    loadPreset,
    startStressTest,
    resetConfig,
  };
};