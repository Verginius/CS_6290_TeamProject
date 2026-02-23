export interface EconomicAnalysisData {
  attackCost: {
    total: string;      // ETH
    totalUSD: string;   // USD
    breakdown: {
      flashloanFee: string;  // ETH
      gasCost: string;       // ETH
      slippage: string;      // ETH
      other: string;         // ETH
    };
    percentages: {
      flashloanFee: number;  // 百分比
      gasCost: number;
      slippage: number;
      other: number;
    };
  };
  
  roi: {
    targetFunds: string;     // ETH
    expectedProfit: string;  // ETH
    percentage: number;      // 百分比
    breakEvenPoint: string;  // ETH
    safetyMargin: number;    // 百分比
    paybackPeriod: string;   // 区块数/天数
  };
  
  sensitivityAnalysis: {
    tokenPrice: {
      base: number;         // USD
      range: number[];      // [-20%, -10%, 0, +10%, +20%]
      impactOnSuccess: number[]; // 对应的成功率变化
    };
    gasPrice: {
      base: number;         // gwei
      range: number[];
      impactOnCost: number[];    // 成本变化百分比
    };
    slippage: {
      base: number;         // 百分比
      range: number[];
      impactOnSuccess: number[];
    };
  };
  
  defenseInvestment: Array<{
    measure: string;
    monthlyCost: string;     // ETH
    monthlySavings: string;  // ETH
    roi: number;            // 百分比
    paybackPeriod: string;  // 天
    recommended: boolean;
  }>;
  
  marketConditions: {
    ethPrice: number;       // USD
    gasPrice: number;       // gwei
    tokenPrice: number;     // USD
    liquidityDepth: number; // ETH
    timestamp: string;
  };
}