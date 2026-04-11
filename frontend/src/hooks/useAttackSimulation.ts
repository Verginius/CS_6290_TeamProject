import { useState, useCallback, useEffect } from 'react';
import { useSimulationSocket, SimulationLog, SimulationMetrics } from './useSimulationSocket';

export type AttackStage = 'idle' | 'starting' | 'deploy' | 'setup' | 'attack' | 'defended' | 'export' | 'completed';
export type LogEntry = SimulationLog;

export interface AttackSimulationState {
  isRunning: boolean;
  stage: AttackStage;
  progress: number;
  logs: LogEntry[];
  metrics: {
    fundsTransferred: string;
    attackCost: string;
    successProbability: number;
    gasUsed: string;
  };
  config: {
    attackType: 'flashloan' | 'whale' | 'spam' | 'quorum' | 'timelock';
    targetContract: string;
    initialFunds: string;
    flashloanSource: 'aave' | 'uniswap' | 'balancer';
    loanAmount: string;
  };
  nodes: Array<{ id: string; type: string; label: string; balance: string }>;
  edges: Array<{ source: string; target: string; value: string; label: string }>;
}

export const useAttackSimulation = (defenseEnabled: boolean, initialAttackType: string = 'flashloan') => {
  const [config, setConfig] = useState({
    attackType: initialAttackType as 'flashloan' | 'whale' | 'spam' | 'quorum' | 'timelock',
    targetContract: '0x...',
    initialFunds: '100000',
    flashloanSource: 'aave' as 'aave' | 'uniswap' | 'balancer',
    loanAmount: '670000',
  });

  const { state: socketState, startSimulation, stopSimulation, resetSimulation } = useSimulationSocket();

  const getNodes = () => {
    const treasuryBalance = socketState.metrics.treasuryBalance || '5000000';
    return [
      { id: 'attacker', type: 'wallet', label: 'Attacker', balance: '10000' },
      { id: 'proposal', type: 'contract', label: 'Governor', balance: '0' },
      { id: 'treasury', type: 'contract', label: 'Treasury', balance: treasuryBalance },
    ];
  };

  const nodes = getNodes();

  const edges = [
    { source: 'attacker', target: 'proposal', value: '670000', label: 'Submit Proposal' },
    { source: 'proposal', target: 'treasury', value: '1000', label: 'Transfer Funds' },
  ];

  const state: AttackSimulationState = {
    isRunning: socketState.isRunning,
    stage: socketState.stage as AttackStage,
    progress: socketState.progress,
    logs: socketState.logs,
    metrics: {
      fundsTransferred: socketState.metrics.fundsTransferred,
      attackCost: socketState.metrics.attackCost,
      successProbability: socketState.metrics.successProbability,
      gasUsed: socketState.metrics.gasUsed,
    },
    config,
    nodes,
    edges,
  };

  const updateConfig = useCallback((newConfig: Partial<typeof config>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  }, []);

  const start = useCallback(async () => {
    await startSimulation(undefined, defenseEnabled);
  }, [startSimulation, defenseEnabled]);

  const pauseSimulation = useCallback(async () => {
    await stopSimulation();
  }, [stopSimulation]);

  const reset = useCallback(() => {
    resetSimulation();
  }, [resetSimulation]);

  useEffect(() => {
    let targetContract = '0x...';
    let initialFunds = '100000';
    let loanAmount = '670000';
    if (config.attackType === 'whale') {
      loanAmount = '1000000';
    } else if (config.attackType === 'spam') {
      initialFunds = '5000';
      loanAmount = '10';
    } else if (config.attackType === 'quorum') {
      initialFunds = '1000';
      loanAmount = '0';
    } else if (config.attackType === 'timelock') {
      loanAmount = '5';
    }
    updateConfig({ targetContract, initialFunds, loanAmount });
  }, [config.attackType, updateConfig]);

  return {
    state,
    startSimulation: start,
    pauseSimulation,
    resetSimulation: reset,
    updateConfig,
    loading: socketState.isRunning,
    error: socketState.error,
  };
};