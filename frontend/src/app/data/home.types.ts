export interface HomePageData {
  riskScore: number; // 0-100
  treasury: {
    total: string; // ETH
    change24h: number; // percentage
  };
  governance: {
    activeProposals: number;
    votingProposals: number;
  };
  attacks: {
    active: number;
    defended: number;
  };
  recentSimulations: Array<{
    type: string;
    successRate: number;
    timestamp: string;
  }>;
}