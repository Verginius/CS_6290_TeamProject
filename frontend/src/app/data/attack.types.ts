export interface AttackSimulationData {
  stage: 'preparation' | 'flashloan' | 'proposal' | 'voting' | 'execution';
  progress: number; // 0-100
  metrics: {
    fundsTransferred: string;
    attackCost: string;
    successProbability: number;
    gasUsed: string;
  };
  nodes: Array<{
    id: string;
    type: 'wallet' | 'protocol' | 'contract';
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
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    txHash?: string;
  }>;
}