export interface GovernanceMonitorData {
  proposals: Array<{
    id: string;
    title: string;
    stage: 'pending' | 'active' | 'succeeded' | 'queued' | 'executed';
    forVotes: number;
    againstVotes: number;
    abstainVotes: number;
    riskLevel: 'low' | 'medium' | 'high';
    endTime: string;
  }>;
  tokenDistribution: {
    top10: number; // 百分比
    mediumHolders: number;
    smallHolders: number;
    whaleAddresses: Array<{
      address: string;
      percentage: number;
      isContract: boolean;
    }>;
  };
  votingPatterns: {
    for: number;
    against: number;
    abstain: number;
    byHolderSize: {
      whales: number;
      medium: number;
      small: number;
    };
  };
  liveVotes: Array<{
    timestamp: string;
    voter: string;
    proposalId: string;
    support: 'for' | 'against' | 'abstain';
    weight: string;
  }>;
}