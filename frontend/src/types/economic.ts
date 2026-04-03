export interface CostBreakdownItem {
  name: string;
  value: number;       // 百分比
  amount: number;      // ETH
  color?: string;      // 前端颜色，可以前端决定
}

export interface ROICalculatorData {
  targetFunds: number;     // ETH
  attackCost: number;      // ETH
  expectedProfit: number;  // ETH
  roi: number;             // 百分比
}

export interface BreakEvenDataPoint {
  amount: number;          // ETH
  profit: number;          // ETH
}

export interface SensitivityItem {
  param: string;
  impact: number;          // 百分比变化
}

export interface DefenseROIItem {
  name: string;
  investment: number;      // ETH/month
  savings: number;         // ETH/month
}

export interface EconomicData {
  costBreakdown: CostBreakdownItem[];
  roiCalculator: ROICalculatorData;
  breakEvenData: BreakEvenDataPoint[];
  sensitivityData: SensitivityItem[];
  defenseROI: DefenseROIItem[];
  totalDefenseROI: number;
  totalInvestment: number;
  totalSavings: number;
}