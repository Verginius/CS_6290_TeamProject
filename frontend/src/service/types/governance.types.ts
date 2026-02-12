export interface GovernanceMonitorData {
  proposals: Array<{
    id: string;
    title: string;
    description: string;
    proposer: string;
    stage: 'pending' | 'active' | 'succeeded' | 'queued' | 'executed' | 'defeated';
    startBlock: number;
    endBlock: number;
    forVotes: string;
    againstVotes: string;
    abstainVotes: string;
    quorum: number;      // 百分比
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    riskReason?: string;
  }>;
  
  tokenDistribution: {
    top10: number;      // 百分比
    top20: number;
    top50: number;
    rest: number;
    whales: Array<{
      address: string;
      percentage: number;
      isContract: boolean;
      label?: string;
    }>;
  };
  
  votingPatterns: {
    for: number;        // 百分比
    against: number;
    abstain: number;
    byHolderSize: {
      whales: { for: number; against: number; abstain: number };
      medium: { for: number; against: number; abstain: number };
      small: { for: number; against: number; abstain: number };
    };
  };
  
  timeline: Array<{
    timestamp: string;
    event: 'proposal_created' | 'vote_cast' | 'proposal_executed' | 'defense_triggered';
    proposalId: string;
    description: string;
  }>;
  
  liveVotes: Array<{
    timestamp: string;
    voter: string;
    proposalId: string;
    support: 'for' | 'against' | 'abstain';
    weight: string;
    transactionHash: string;
  }>;
}