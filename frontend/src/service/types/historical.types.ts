export interface HistoricalData {
  timeRange: {
    start: string;
    end: string;
    interval: 'hour' | 'day' | 'week' | 'month';
  };
  
  attackFrequency: Array<{
    timestamp: string;
    flashloan: number;
    sybil: number;
    bribery: number;
    combined: number;
    total: number;
  }>;
  
  successRates: Array<{
    timestamp: string;
    flashloan: number;  // 百分比
    sybil: number;
    bribery: number;
    combined: number;
    average: number;
  }>;
  
  attackCosts: Array<{
    timestamp: string;
    average: number;    // ETH
    median: number;     // ETH
    min: number;
    max: number;
    p90: number;        // 90百分位数
  }>;
  
  defenseAdoption: Array<{
    timestamp: string;
    timelock: number;      // 采用率百分比
    quorum: number;
    multisig: number;
    emergencyPause: number;
    votingDelay: number;
    tokenWeighting: number;
  }>;
  
  correlations: {
    matrix: number[][];   // 5x5 相关性矩阵
    labels: string[];    // ['攻击频率', '成功率', '攻击成本', '防御采用率', '资金损失']
    descriptions: Array<{
      pair: string;
      coefficient: number; // -1 到 1
      strength: 'strong' | 'moderate' | 'weak';
      direction: 'positive' | 'negative';
    }>;
  };
  
  predictions: {
    next30Days: {
      attackFrequency: number;      // 预测值
      attackFrequencyChange: number; // 相比当前的变化百分比
      successRate: number;
      successRateChange: number;
      averageCost: number;
      averageCostChange: number;
    };
    recommendations: Array<{
      metric: string;
      trend: 'up' | 'down' | 'stable';
      severity: 'high' | 'medium' | 'low';
      suggestion: string;
    }>;
  };
  
  summary: {
    totalAttacks: number;
    avgSuccessRate: number;
    totalValueAtRisk: string;   // ETH
    totalValueLost: string;     // ETH
    defenseEffectiveness: number; // 百分比
    mostCommonAttack: string;
    mostEffectiveDefense: string;
  };
}