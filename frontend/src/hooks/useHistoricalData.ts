import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import type { HistoricalData } from '../types/historical';

// Mock 数据（与原有静态数据一致，但根据时间范围可调整）
const getMockData = (range: string): HistoricalData => {
  return {
    frequency: [
      { date: 'Week 1', flashLoan: 12, whale: 8, spam: 15, quorum: 5, timelock: 3 },
      { date: 'Week 2', flashLoan: 28, whale: 12, spam: 25, quorum: 9, timelock: 6 },
      { date: 'Week 3', flashLoan: 15, whale: 18, spam: 30, quorum: 12, timelock: 9 },
      { date: 'Week 4', flashLoan: 9, whale: 14, spam: 22, quorum: 10, timelock: 7 },
    ],
    successRate: [
      { date: 'Week 1', flashLoan: 92, whale: 85, spam: 88, quorum: 75, timelock: 70 },
      { date: 'Week 2', flashLoan: 88, whale: 80, spam: 85, quorum: 70, timelock: 65 },
      { date: 'Week 3', flashLoan: 87, whale: 78, spam: 82, quorum: 68, timelock: 62 },
      { date: 'Week 4', flashLoan: 85, whale: 75, spam: 80, quorum: 65, timelock: 58 },
    ],
    attackCost: [
      { date: 'Week 1', average: 0.8, median: 0.5 },
      { date: 'Week 2', average: 0.9, median: 0.6 },
      { date: 'Week 3', average: 1.1, median: 0.8 },
      { date: 'Week 4', average: 1.2, median: 0.9 },
    ],
    defenseAdoption: [
      { date: 'Week 1', votingDelay: 10, snapshotVoting: 5, tokenLocking: 3, dynamicQuorum: 2, emergencyPause: 1 },
      { date: 'Week 2', votingDelay: 18, snapshotVoting: 12, tokenLocking: 8, dynamicQuorum: 5, emergencyPause: 3 },
      { date: 'Week 3', votingDelay: 28, snapshotVoting: 20, tokenLocking: 15, dynamicQuorum: 10, emergencyPause: 6 },
      { date: 'Week 4', votingDelay: 38, snapshotVoting: 30, tokenLocking: 22, dynamicQuorum: 16, emergencyPause: 12 },
    ],
    correlation: [
      { metric: 'Attack Frequency', freq: 1.0, success: -0.65, cost: 0.42, defense: -0.78 },
      { metric: 'Success Rate', freq: -0.65, success: 1.0, cost: -0.34, defense: 0.21 },
      { metric: 'Cost', freq: 0.42, success: -0.34, cost: 1.0, defense: -0.15 },
      { metric: 'Defense Adoption', freq: -0.78, success: 0.21, cost: -0.15, defense: 1.0 },
    ],
    predictions: {
      attackFrequencyChange: 12,
      successRateChange: -10,
      recommendation: 'Enable Emergency Pause and increase Voting Delay',
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