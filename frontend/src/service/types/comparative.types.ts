export interface ComparativeAnalysisData {
  comparisons: Array<{
    attackType: string;
    successRate: {
      noDefense: number;
      basicDefense: number;
      enhancedDefense: number;
    };
    cost: {
      eth: number;
      usd: number;
    };
    roi: number; // 百分比
  }>;
  defenseMetrics: {
    timelock: number; // 0-100
    quorum: number;
    tokenWeight: number;
    votingDelay: number;
    emergencyPause: number;
    multisig: number;
  };
  recommendations: Array<{
    type: string;
    cost: string;
    expectedSavings: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}