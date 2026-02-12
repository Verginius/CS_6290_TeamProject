export type AttackStage = 'preparation' | 'flashloan' | 'proposal' | 'voting' | 'execution' | 'completed';
export type LogType = 'info' | 'success' | 'warning' | 'error';
export type NodeType = 'wallet' | 'protocol' | 'contract';

export interface AttackSimulationData {
  stage: AttackStage;
  progress: number; // 0-100
  metrics: {
    fundsTransferred: string;
    attackCost: string;
    successProbability: number;
    gasUsed: string;
  };
  nodes: Array<{
    id: string;
    type: NodeType;
    label: string;
    balance: string;
  }>;
  edges: Array<{
    source: string;
    target: string;
    value: string;
    label: string;
  }>;
  logs: Array<{
    timestamp: string;
    type: LogType;
    message: string;
    txHash?: string;
  }>;
}

export interface AttackConfig {
  attackType: 'flashloan' | 'sybil' | 'bribery' | 'combined';
  targetContract: string;
  initialFunds: string;
  flashloanSource: 'aave' | 'uniswap' | 'balancer';
  loanAmount: string;
}