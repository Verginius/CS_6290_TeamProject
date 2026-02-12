export interface HistoricalData {
  timeRange: {
    start: string;
    end: string;
    interval: 'hour' | 'day' | 'week';
  };
  attackFrequency: Array<{
    timestamp: string;
    flashloan: number;
    sybil: number;
    bribery: number;
    combined: number;
  }>;
  successRates: Array<{
    timestamp: string;
    flashloan: number;
    sybil: number;
    bribery: number;
  }>;
  attackCosts: Array<{
    timestamp: string;
    average: number;
    median: number;
    p90: number; // 90百分位数
  }>;
  defenseAdoption: Array<{
    timestamp: string;
    timelock: number;
    quorum: number;
    multisig: number;
    emergencyPause: number;
  }>;
  correlations: {
    frequency_success: number;
    frequency_cost: number;
    frequency_defense: number;
    success_cost: number;
    success_defense: number;
    cost_defense: number;
  };
  predictions: {
    next30Days: {
      attackFrequency: number; // 百分比变化
      successRate: number;
      averageCost: number;
    };
    recommendations: Array<string>;
  };
}