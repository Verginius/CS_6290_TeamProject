export interface DefenseConfig {
  mechanism: 'StructuralControl' | 'ThresholdQuorum' | 'TimeBased' | 'TokenBased';
  enabled: boolean;
  parameters: Record<string, any>;
}

export interface DefenseMetrics {
  attackMitigationRate: number;      // percentage representing how successfully it stopped an attack
  voterParticipationImpact: number;  // impact on legitimate voter turnout
  additionalGasCost: string;         // extra gas overhead from the defense contract
}

export interface DefenseSimulationResult {
  defenseEnabled: boolean;
  activeDefenses: DefenseConfig[];
  defenseMetrics: DefenseMetrics;
}
