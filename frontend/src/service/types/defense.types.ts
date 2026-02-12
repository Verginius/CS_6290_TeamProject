export interface DefenseConfigLabData {
  configurations: {
    timelock: {
      enabled: boolean;
      delay: number; // 小时
    };
    quorum: {
      enabled: boolean;
      threshold: number; // 百分比
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
      type: 'linear' | 'quadratic';
    };
  };
  impactAnalysis: {
    attackCostChange: number; // 百分比
    successRateChange: number;
    gasUsageChange: number;
    userExperienceImpact: 'low' | 'medium' | 'high';
  };
  tradeoffScores: {
    security: number; // 0-100
    efficiency: number;
    cost: number;
  };
  stressTest: {
    progress: number; // 0-100
    results: {
      totalAttacks: number;
      defended: number;
      averageResponseTime: number; // 区块数
      maxFundsLost: string;
    };
  };
}