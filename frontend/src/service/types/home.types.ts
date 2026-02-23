export interface HomePageData {
  riskScore: number;           // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  treasury: {
    total: string;            // ETH
    change24h: number;        // 百分比
    history: Array<{
      timestamp: string;
      value: string;
    }>;
  };
  
  governance: {
    activeProposals: number;
    votingProposals: number;
    queuedProposals: number;
  };
  
  attacks: {
    active: number;
    defended: number;
    successful: number;
    last24h: number;
  };
  
  heatmap: Array<{
    hour: number;            // 0-23
    value: number;          // 交易量/资金流
  }>;
  
  recentSimulations: Array<{
    id: string;
    type: 'flashloan' | 'sybil' | 'bribery' | 'combined';
    successRate: number;
    timestamp: string;
    defenseEnabled: boolean;
  }>;
}