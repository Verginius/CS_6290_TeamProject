import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import type { HistoricalData } from '../types/historical';

// Mock 数据（与原有静态数据一致，但根据时间范围可调整）
const getMockData = (range: string): HistoricalData => {
  // 根据 range 返回不同的 mock 数据，这里简单返回固定的
  return {
    frequency: [
      { date: 'Week 1', flashLoan: 12, sybil: 5, bribery: 3 },
      { date: 'Week 2', flashLoan: 28, sybil: 8, bribery: 6 },
      { date: 'Week 3', flashLoan: 15, sybil: 12, bribery: 9 },
      { date: 'Week 4', flashLoan: 9, sybil: 7, bribery: 4 },
    ],
    successRate: [
      { date: 'Week 1', flashLoan: 92, sybil: 78, bribery: 65 },
      { date: 'Week 2', flashLoan: 88, sybil: 72, bribery: 60 },
      { date: 'Week 3', flashLoan: 87, sybil: 68, bribery: 55 },
      { date: 'Week 4', flashLoan: 85, sybil: 65, bribery: 52 },
    ],
    attackCost: [
      { date: 'Week 1', average: 0.8, median: 0.5 },
      { date: 'Week 2', average: 0.9, median: 0.6 },
      { date: 'Week 3', average: 1.1, median: 0.8 },
      { date: 'Week 4', average: 1.2, median: 0.9 },
    ],
    defenseAdoption: [
      { date: 'Week 1', timelock: 15, quorum: 8, multisig: 3 },
      { date: 'Week 2', timelock: 25, quorum: 15, multisig: 8 },
      { date: 'Week 3', timelock: 35, quorum: 24, multisig: 12 },
      { date: 'Week 4', timelock: 45, quorum: 32, multisig: 18 },
    ],
    correlation: [
      { metric: 'Attack Frequency', freq: 1.0, success: -0.65, cost: 0.42, defense: -0.78 },
      { metric: 'Success Rate', freq: -0.65, success: 1.0, cost: -0.34, defense: 0.21 },
      { metric: 'Cost', freq: 0.42, success: -0.34, cost: 1.0, defense: -0.15 },
      { metric: 'Defense Adoption', freq: -0.78, success: 0.21, cost: -0.15, defense: 1.0 },
    ],
    predictions: {
      attackFrequencyChange: 15,
      successRateChange: -8,
      recommendation: 'Increase Timelock to 72 hours',
    },
  };
};

export const useHistoricalData = (timeRange: string) => {
  const [data, setData] = useState<HistoricalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get(`/historical/trends?range=${timeRange}`);
        setData(response.data);
        setError(null);
      } catch (err) {
        console.warn('API failed, using mock historical data', err);
        setData(getMockData(timeRange));
        // 可选：设置一个非阻塞的错误提示，但 UI 不显示错误页
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timeRange]);

  return { data, loading, error };
};