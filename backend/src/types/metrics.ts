import { AttackMetrics } from './attack';
import { DefenseMetrics, DefenseSimulationResult } from './defense';

export interface EconomicMetrics {
  totalProfit: string;
  totalCost: string;
  roi: number; // Return on Investment
  duration: number; // Time elapsed
}

export interface SimulationSummary {
  metrics: {
    attackSimsAvailable: boolean;
    defendedSimsAvailable: boolean;
  };
  data: {
    baseline: any; // Add stricter typing once raw JSON fields are finalized
    defended: any; // Add stricter typing once raw JSON fields are finalized
  };
}

export interface GovernanceMetrics {
  totalProposals: number;
  activeVoters: number;
  tokensLocked: string;
  averageQuorum: number;
}
