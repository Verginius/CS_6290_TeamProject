export interface EconomicAnalysisData {
  attackCost: {
    total: string; // ETH
    breakdown: {
      flashloanFee: string;
      gasCost: string;
      slippage: string;
      other: string;
    };
    inUSD: string;
  };
  roi: {
    targetFunds: string;
    expectedProfit: string;
    percentage: number;
    breakEvenPoint: string;
    safetyMargin: number; // 百分比
  };
  sensitivityAnalysis: {
    tokenPrice: {
      base: number;
      impactOnSuccess: number; // 百分比变化
    };
    gasPrice: {
      base: number;
      impactOnCost: number;
    };
    slippage: {
      base: number;
      impactOnSuccess: number;
    };
  };
  defenseInvestment: Array<{
    measure: string;
    monthlyCost: string;
    monthlySavings: string;
    roi: number;
    paybackPeriod: string; // 天
  }>;
}