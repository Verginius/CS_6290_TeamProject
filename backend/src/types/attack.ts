export interface AttackMetrics {
  fundsTransferred: string;
  attackCost: string;
  successProbability: number;
  gasUsed: string;
}

export interface AttackConfig {
  attackType: 'flashloan' | 'whale' | 'spam' | 'quorum' | 'timelock';
  targetContract: string;
  initialFunds: string;
  flashloanSource?: 'aave' | 'uniswap' | 'balancer';
  loanAmount?: string;
}

export interface AttackSimulationData {
  isRunning: boolean;
  stage: 'preparation' | 'flashloan' | 'proposal' | 'voting' | 'execution' | 'completed';
  progress: number;
  logs: {
    timestamp: string;
    type: 'info' | 'success' | 'warning' | 'error';
    icon: string;
    message: string;
  }[];
  metrics: AttackMetrics;
  config: AttackConfig;
}
