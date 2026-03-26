// src/hooks/useDefenseConfig.ts
import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../lib/api';
import type { DefenseConfig, ImpactAnalysis, TradeoffScores, StressTestResult } from '../types/defense';

// 默认配置（mock 数据）
const MOCK_CONFIG: DefenseConfig = {
  timelock: { enabled: true, delay: 48 },
  quorum: { enabled: true, threshold: 15 },
  votingDelay: { enabled: true, blocks: 10000 },
  emergencyPause: { enabled: true, triggerCondition: '75% Abnormal Voting' },
  multisig: { enabled: true, signers: 5, threshold: 3 },
  tokenWeighting: { enabled: true, type: 'quadratic' },
};

// 预设场景（mock）
const MOCK_PRESETS: Record<string, DefenseConfig> = {
  'Flash Loan Attack': {
    timelock: { enabled: true, delay: 72 },
    quorum: { enabled: true, threshold: 20 },
    votingDelay: { enabled: true, blocks: 14400 },
    emergencyPause: { enabled: true, triggerCondition: 'Flash Loan Detected' },
    multisig: { enabled: true, signers: 7, threshold: 5 },
    tokenWeighting: { enabled: true, type: 'quadratic' },
  },
  'Sybil Attack': {
    timelock: { enabled: true, delay: 48 },
    quorum: { enabled: true, threshold: 10 },
    votingDelay: { enabled: true, blocks: 7200 },
    emergencyPause: { enabled: true, triggerCondition: '90% Abnormal Voting' },
    multisig: { enabled: true, signers: 5, threshold: 3 },
    tokenWeighting: { enabled: true, type: 'linear' },
  },
};

export const useDefenseConfig = () => {
  const [config, setConfig] = useState<DefenseConfig>(MOCK_CONFIG);
  const [impact, setImpact] = useState<ImpactAnalysis>({
    attackCostChange: 120,
    successRateChange: -85,
    gasUsageChange: 45,
  });
  const [tradeoff, setTradeoff] = useState<TradeoffScores>({
    security: 92,
    efficiency: 78,
    cost: 65,
  });
  const [stressResult, setStressResult] = useState<StressTestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingMock, setUsingMock] = useState(false);

  // 根据配置重新计算影响分析和权衡分数（与之前相同）
  const recalcImpactAndTradeoff = useCallback((newConfig: DefenseConfig) => {
    let securityScore = 50;
    let efficiencyScore = 50;
    let costScore = 50;

    if (newConfig.timelock.enabled) {
      securityScore += newConfig.timelock.delay / 24 * 10;
      efficiencyScore -= newConfig.timelock.delay / 24 * 5;
      costScore += 5;
    }
    if (newConfig.quorum.enabled) {
      securityScore += newConfig.quorum.threshold * 2;
      efficiencyScore -= newConfig.quorum.threshold;
      costScore += 3;
    }
    if (newConfig.votingDelay.enabled) {
      securityScore += newConfig.votingDelay.blocks / 1000;
      efficiencyScore -= newConfig.votingDelay.blocks / 1000;
    }
    if (newConfig.emergencyPause.enabled) {
      securityScore += 20;
      efficiencyScore -= 10;
    }
    if (newConfig.multisig.enabled) {
      securityScore += newConfig.multisig.threshold * 5;
      efficiencyScore -= newConfig.multisig.threshold * 2;
      costScore += 10;
    }
    if (newConfig.tokenWeighting.enabled) {
      securityScore += 15;
      efficiencyScore += 5;
    }

    securityScore = Math.min(100, Math.max(0, securityScore));
    efficiencyScore = Math.min(100, Math.max(0, efficiencyScore));
    costScore = Math.min(100, Math.max(0, costScore));

    setTradeoff({
      security: Math.round(securityScore),
      efficiency: Math.round(efficiencyScore),
      cost: Math.round(costScore),
    });

    const baseSecurity = 50;
    const securityChange = securityScore - baseSecurity;
    setImpact({
      attackCostChange: Math.round(120 + securityChange * 0.5),
      successRateChange: Math.round(-85 - securityChange * 0.5),
      gasUsageChange: Math.round(45 + securityChange * 0.3),
    });
  }, []);

  // 初始化时尝试从 API 获取真实配置，失败则使用 mock
  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get<DefenseConfig>('/defense/config');
        setConfig(res.data);
        recalcImpactAndTradeoff(res.data);
        setUsingMock(false);
        setError(null);
      } catch (err) {
        console.warn('API failed, using mock defense config', err);
        // 使用 mock 数据
        setConfig(MOCK_CONFIG);
        recalcImpactAndTradeoff(MOCK_CONFIG);
        setUsingMock(true);
        // 可选：设置一个提示信息，但不作为错误展示
        // setError('Using mock data because API is unavailable');
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [recalcImpactAndTradeoff]);

  // 更新配置的单个字段
  const updateConfig = useCallback((key: keyof DefenseConfig, value: any) => {
    setConfig(prev => {
      const newConfig = { ...prev, [key]: value };
      recalcImpactAndTradeoff(newConfig);
      return newConfig;
    });
  }, [recalcImpactAndTradeoff]);

  // 更新嵌套字段
  const updateNested = useCallback((section: keyof DefenseConfig, field: string, value: any) => {
    setConfig(prev => {
      const newConfig = {
        ...prev,
        [section]: { ...prev[section], [field]: value },
      };
      recalcImpactAndTradeoff(newConfig);
      return newConfig;
    });
  }, [recalcImpactAndTradeoff]);

  // 保存配置到后端
  const saveConfig = useCallback(async () => {
    setLoading(true);
    try {
      await apiClient.post('/defense/config', config);
      // 可选：显示成功提示
    } catch (err) {
      console.error('Failed to save config', err);
      setError('Failed to save configuration');
    } finally {
      setLoading(false);
    }
  }, [config]);

  // 加载预设场景
  const loadPreset = useCallback(async (presetName: string) => {
    setLoading(true);
    try {
      // 先尝试从 API 获取预设
      const res = await apiClient.get<DefenseConfig>(`/defense/preset/${presetName}`);
      setConfig(res.data);
      recalcImpactAndTradeoff(res.data);
      setUsingMock(false);
    } catch (err) {
      console.warn('API preset failed, using mock preset', err);
      // 使用本地 mock 预设
      const preset = MOCK_PRESETS[presetName];
      if (preset) {
        setConfig(preset);
        recalcImpactAndTradeoff(preset);
        setUsingMock(true);
      } else {
        setError(`Preset "${presetName}" not found`);
      }
    } finally {
      setLoading(false);
    }
  }, [recalcImpactAndTradeoff]);

  // 启动压力测试
  const startStressTest = useCallback(async (concurrentAttacks: number, durationHours: number) => {
    setLoading(true);
    setStressResult({ status: 'running', progress: 0, totalAttacks: 0, defended: 0, failed: 0, averageResponseTime: 0, maxFundsLost: '0', totalFundsLost: '0', defenseSuccessRate: 0 });
    try {
      const response = await apiClient.post('/defense/stress-test', { concurrentAttacks, duration: durationHours, config });
      const { testId } = response.data;
      // 轮询结果
      const pollInterval = setInterval(async () => {
        try {
          const result = await apiClient.get<StressTestResult>(`/defense/stress-test/${testId}`);
          setStressResult({ ...result.data, status: result.data.completed ? 'completed' : 'running' });
          if (result.data.completed) clearInterval(pollInterval);
        } catch (err) {
          console.error('Failed to get stress test result', err);
          clearInterval(pollInterval);
          setError('Stress test polling failed');
        }
      }, 2000);
    } catch (err) {
      console.error('Failed to start stress test', err);
      // 可选：模拟一个假结果用于演示
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

  // 重置配置到默认
  const resetConfig = useCallback(() => {
    setConfig(MOCK_CONFIG);
    recalcImpactAndTradeoff(MOCK_CONFIG);
    setUsingMock(false);
  }, [recalcImpactAndTradeoff]);

  return {
    config,
    impact,
    tradeoff,
    stressResult,
    loading,
    error,
    usingMock,
    updateConfig,
    updateNested,
    saveConfig,
    loadPreset,
    startStressTest,
    resetConfig,
  };
};
