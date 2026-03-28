// export interface DefenseConfig {
//   timelock: {
//     enabled: boolean;
//     delay: number;       // 小时
//   };
//   quorum: {
//     enabled: boolean;
//     threshold: number;   // 百分比
//   };
//   votingDelay: {
//     enabled: boolean;
//     blocks: number;
//   };
//   emergencyPause: {
//     enabled: boolean;
//     triggerCondition: string;
//   };
//   multisig: {
//     enabled: boolean;
//     signers: number;
//     threshold: number;
//   };
//   tokenWeighting: {
//     enabled: boolean;
//     type: 'linear' | 'quadratic' | 'sqrt';
//   };
// }

// export interface ImpactAnalysis {
//   attackCostChange: number;   // 百分比变化
//   successRateChange: number;  // 百分比变化
//   gasUsageChange: number;     // 百分比变化
// }

// export interface TradeoffScores {
//   security: number;    // 0-100
//   efficiency: number;  // 0-100
//   cost: number;        // 0-100
// }

// export interface StressTestResult {
//   testId?: string;
//   status: 'idle' | 'running' | 'completed';
//   progress?: number;        // 0-100
//   totalAttacks: number;
//   defended: number;
//   failed: number;
//   averageResponseTime: number; // 区块数
//   maxFundsLost: string;        // ETH
//   totalFundsLost: string;      // ETH
//   defenseSuccessRate: number;  // 百分比
//   // 可选，兼容旧代码
//   completed?: boolean;
// }

// src/types/defense.ts

// src/types/defense.ts
export interface DefenseConfig {
  votingDelay: {
    enabled: boolean;
    blocks: number;           // 延迟区块数
  };
  snapshotVoting: {
    enabled: boolean;
  };
  tokenLocking: {
    enabled: boolean;
    lockPeriod: number;      // 锁定期限（区块数）
  };
  dynamicQuorum: {
    enabled: boolean;
    minBps: number;          // 最小法定人数（基点）
    maxBps: number;          // 最大法定人数（基点）
    windowSize: number;      // 滚动窗口大小（提案数）
  };
  emergencyPause: {
    enabled: boolean;
    guardian: string;        // 守护者地址
  };
}

export interface ImpactAnalysis {
  attackCostChange: number;
  successRateChange: number;
  gasUsageChange: number;
}

export interface TradeoffScores {
  security: number;
  efficiency: number;
  cost: number;
}

export interface StressTestResult {
  testId?: string;
  status: 'idle' | 'running' | 'completed';
  progress?: number;
  totalAttacks: number;
  defended: number;
  failed: number;
  averageResponseTime: number;
  maxFundsLost: string;
  totalFundsLost: string;
  defenseSuccessRate: number;
}