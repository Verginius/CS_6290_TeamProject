export interface DefenseConfig {
  timelock: {
    enabled: boolean;
    delay: number;       // 小时
  };
  quorum: {
    enabled: boolean;
    threshold: number;   // 百分比
  };
  votingDelay: {
    enabled: boolean;
    blocks: number;
  };
  emergencyPause: {
    enabled: boolean;
    triggerCondition: string;
  };
  multisig: {
    enabled: boolean;
    signers: number;
    threshold: number;
  };
  tokenWeighting: {
    enabled: boolean;
    type: 'linear' | 'quadratic' | 'sqrt';
  };
}

export interface ImpactAnalysis {
  attackCostChange: number;   // 百分比变化
  successRateChange: number;  // 百分比变化
  gasUsageChange: number;     // 百分比变化
}

export interface TradeoffScores {
  security: number;    // 0-100
  efficiency: number;  // 0-100
  cost: number;        // 0-100
}

export interface StressTestResult {
  testId?: string;
  status: 'idle' | 'running' | 'completed';
  progress?: number;        // 0-100
  totalAttacks: number;
  defended: number;
  failed: number;
  averageResponseTime: number; // 区块数
  maxFundsLost: string;        // ETH
  totalFundsLost: string;      // ETH
  defenseSuccessRate: number;  // 百分比
  // 可选，兼容旧代码
  completed?: boolean;
}