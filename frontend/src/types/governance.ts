// export interface Proposal {
//   id: string;
//   title: string;
//   description: string;
//   stage: 'pending' | 'active' | 'succeeded' | 'queued' | 'executed' | 'defeated';
//   startBlock?: number;
//   endBlock?: number;
//   forVotes: number;
//   againstVotes: number;
//   abstainVotes: number;
//   riskLevel: 'low' | 'medium' | 'high' | 'critical';
//   supportRate: number; // 百分比
// }

// export interface TokenDistribution {
//   name: string;
//   value: number;
//   color: string;
// }

// export interface VotingPatternItem {
//   proposalName: string;
//   support: number;
//   against: number;
//   abstain: number;
// }

// export interface LiveVote {
//   timestamp: string;
//   address: string;
//   action: 'Voted For' | 'Voted Against' | 'Abstained';
//   proposal: string;
//   tokens: string;
// }

// export interface GovernanceData {
//   proposals: Proposal[];
//   tokenDistribution: TokenDistribution[];
//   votingPatterns: VotingPatternItem[];
//   liveVotes: LiveVote[];
//   timelineStages: Array<{ stage: string; icon: string; active: boolean }>;
// }

// src/types/governance.ts
export interface Proposal {
  id: string;
  proposer: string;
  title: string;
  description: string;
  stage: 'pending' | 'active' | 'succeeded' | 'queued' | 'executed' | 'defeated';
  startBlock: number;
  endBlock: number;
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  supportRate: number; // 百分比
}

export interface TokenDistribution {
  name: string;
  value: number;
  color: string;
}

export interface VotingPatternItem {
  proposalName: string;
  support: number;
  against: number;
  abstain: number;
}

export interface LiveVote {
  timestamp: string;
  address: string;
  action: 'Voted For' | 'Voted Against' | 'Abstained';
  proposal: string;
  tokens: string;
}

export interface GovernanceData {
  proposals: Proposal[];
  tokenDistribution: TokenDistribution[];
  votingPatterns: VotingPatternItem[];
  liveVotes: LiveVote[];
  timelineStages: Array<{ stage: string; icon: string; active: boolean }>;
}