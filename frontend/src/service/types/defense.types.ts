export interface DefenseConfigLabData {
  configurations: {
    timelock: {
      enabled: boolean;
      delay: number;        // 小时
      minDelay?: number;
      maxDelay?: number;
    };
    quorum: {
      enabled: boolean;
      threshold: number;    // 百分比
      minThreshold?: number;
      maxThreshold?: number;
    };
    votingDelay: {
      enabled: boolean;
      blocks: number;
    };
    emergencyPause: {
      enabled: boolean;
      triggerCondition: string;  // '异常投票阈值' | '多签确认' | '自动触发'
      threshold: number;        // 百分比
    };
    multisig: {
      enabled: boolean;
      signers: number;
      threshold: number;
      addresses?: string[];
    };
    tokenWeighting: {
      enabled: boolean;
      type: 'linear' | 'quadratic' | 'sqrt';
      description: string;
    };
  };
  
  impactAnalysis: {
    attackCostChange: number;     // 百分比
    successRateChange: number;    // 百分比
    gasUsageChange: number;       // 百分比
    userExperienceImpact: 'low' | 'medium' | 'high';
    estimatedSavings: string;     // ETH/月
  };
  
  tradeoffScores: {
    security: number;    // 0-100
    efficiency: number;  // 0-100
    cost: number;        // 0-100
    decentralization: number; // 0-100
  };
  
  stressTest: {
    isRunning: boolean;
    progress: number;    // 0-100
    results?: {
      totalAttacks: number;
      defended: number;
      failed: number;
      averageResponseTime: number; // 区块数
      maxFundsLost: string;        // ETH
      totalFundsLost: string;      // ETH
      defenseSuccessRate: number;  // 百分比
    };
    config?: {
      concurrentAttacks: number;
      duration: number;  // 小时
      attackTypes: string[];
    };
  };
  
  presets: Array<{
    id: string;
    name: string;
    description: string;
    config: DefenseConfigLabData['configurations'];
  }>;
}