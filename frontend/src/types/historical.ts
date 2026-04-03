// export interface FrequencyPoint {
//   date: string;
//   flashLoan: number;
//   sybil: number;
//   bribery: number;
//   combined?: number;
// }

// export interface SuccessRatePoint {
//   date: string;
//   flashLoan: number;
//   sybil: number;
//   bribery: number;
// }

// export interface CostPoint {
//   date: string;
//   average: number;
//   median: number;
//   p90?: number;
// }

// export interface DefenseAdoptionPoint {
//   date: string;
//   timelock: number;
//   quorum: number;
//   multisig: number;
//   emergencyPause?: number;
//   votingDelay?: number;
// }

// export interface CorrelationRow {
//   metric: string;
//   freq: number;
//   success: number;
//   cost: number;
//   defense: number;
// }

// export interface HistoricalData {
//   frequency: FrequencyPoint[];
//   successRate: SuccessRatePoint[];
//   attackCost: CostPoint[];
//   defenseAdoption: DefenseAdoptionPoint[];
//   correlation: CorrelationRow[];
//   predictions: {
//     attackFrequencyChange: number;
//     successRateChange: number;
//     recommendation: string;
//   };
// }

export interface FrequencyPoint {
  date: string;
  flashLoan: number;
  whale: number;
  spam: number;
  quorum: number;
  timelock: number;
}

export interface SuccessRatePoint {
  date: string;
  flashLoan: number;
  whale: number;
  spam: number;
  quorum: number;
  timelock: number;
}

export interface CostPoint {
  date: string;
  average: number;
  median: number;
  p90?: number;
}

export interface DefenseAdoptionPoint {
  date: string;
  votingDelay: number;
  snapshotVoting: number;
  tokenLocking: number;
  dynamicQuorum: number;
  emergencyPause: number;
}

export interface CorrelationRow {
  metric: string;
  freq: number;
  success: number;
  cost: number;
  defense: number;
}

export interface HistoricalData {
  frequency: FrequencyPoint[];
  successRate: SuccessRatePoint[];
  attackCost: CostPoint[];
  defenseAdoption: DefenseAdoptionPoint[];
  correlation: CorrelationRow[];
  predictions: {
    attackFrequencyChange: number;
    successRateChange: number;
    recommendation: string;
  };
}