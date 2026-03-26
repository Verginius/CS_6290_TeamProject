import { useState, useEffect, useCallback } from 'react';
import { getGovernorContract } from '../lib/web3';
import { apiClient } from '../lib/api';
import { ethers } from 'ethers';

export type AttackStage = 'preparation' | 'flashloan' | 'proposal' | 'voting' | 'execution' | 'completed';
export type LogEntry = {
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  icon: string;
  message: string;
};

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
    attackType: 'flashloan' | 'sybil' | 'bribery' | 'combined';
    targetContract: string;
    initialFunds: string;
    flashloanSource: 'aave' | 'uniswap' | 'balancer';
    loanAmount: string;
  };
  nodes: Array<{ id: string; type: string; label: string; balance: string }>;
  edges: Array<{ source: string; target: string; value: string; label: string }>;
}

export const useAttackSimulation = (defenseEnabled: boolean) => {
  const [state, setState] = useState<AttackSimulationState>({
    isRunning: false,
    stage: 'preparation',
    progress: 0,
    logs: [],
    metrics: {
      fundsTransferred: '0',
      attackCost: '0',
      successProbability: defenseEnabled ? 12 : 92,
      gasUsed: '0',
    },
    config: {
      attackType: 'flashloan',
      targetContract: '0x...', // 占位
      initialFunds: '100000',
      flashloanSource: 'aave',
      loanAmount: '670000',
    },
    nodes: [
      { id: 'flashloan', type: 'protocol', label: 'Flash Loan (Aave)', balance: '0' },
      { id: 'attacker', type: 'wallet', label: 'Attacker', balance: '10000' },
      { id: 'proposal', type: 'contract', label: 'Governor', balance: '0' },
      { id: 'treasury', type: 'contract', label: 'Treasury', balance: '1000' },
    ],
    edges: [
      { source: 'flashloan', target: 'attacker', value: '670000', label: 'Borrow Tokens' },
      { source: 'attacker', target: 'proposal', value: '670000', label: 'Submit Proposal' },
      { source: 'proposal', target: 'treasury', value: '1000', label: 'Transfer Funds' },
    ],
  });

  // 添加日志
  const addLog = (log: LogEntry) => {
    setState((prev) => ({
      ...prev,
      logs: [log, ...prev.logs].slice(0, 100), // 最多保留100条
    }));
  };

  // 更新进度
  const updateProgress = useCallback((newProgress: number, stage: AttackStage) => {
    setState((prev) => ({
      ...prev,
      progress: newProgress,
      stage,
    }));
  }, []);

  // 启动模拟（实际应调用合约或后端 API）
  const startSimulation = useCallback(async () => {
    if (state.isRunning) return;

    setState((prev) => ({ ...prev, isRunning: true, logs: [] }));
    addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'info', icon: '⚙️', message: 'Starting attack simulation...' });

    // TODO: 实际执行攻击（调用合约或后端）
    // 这里模拟异步攻击过程
    const steps = ['flashloan', 'proposal', 'voting', 'execution'];
    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep >= steps.length) {
        clearInterval(interval);
        setState((prev) => ({ ...prev, isRunning: false, stage: 'completed', progress: 100 }));
        addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'success', icon: '✅', message: 'Attack simulation completed.' });
        return;
      }
      const step = steps[currentStep];
      currentStep++;
      const newProgress = (currentStep / steps.length) * 100;

      switch (step) {
        case 'flashloan':
          updateProgress(newProgress, 'flashloan');
          addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'success', icon: '⚡', message: `Flash loan: borrowed ${state.config.loanAmount} tokens from ${state.config.flashloanSource}.` });
          break;
        case 'proposal':
          updateProgress(newProgress, 'proposal');
          addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'info', icon: '📝', message: `Malicious proposal submitted targeting ${state.config.targetContract}.` });
          break;
        case 'voting':
          updateProgress(newProgress, 'voting');
          addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'warning', icon: '🗳️', message: 'Voting period started. Manipulating votes...' });
          break;
        case 'execution':
          updateProgress(newProgress, 'execution');
          if (!defenseEnabled) {
            addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'success', icon: '💰', message: `Proposal executed! ${state.config.initialFunds} tokens transferred to attacker.` });
            setState((prev) => ({
              ...prev,
              metrics: {
                ...prev.metrics,
                fundsTransferred: state.config.initialFunds,
                attackCost: '2.8',
                successProbability: 92,
                gasUsed: '1250000',
              },
            }));
          } else {
            addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'error', icon: '🛡️', message: 'Defense mechanism triggered! Timelock prevented execution.' });
            setState((prev) => ({
              ...prev,
              metrics: {
                ...prev.metrics,
                fundsTransferred: '0',
                attackCost: '2.8',
                successProbability: 12,
                gasUsed: '1250000',
              },
            }));
          }
          break;
      }
    }, 2000);
  }, [state.isRunning, defenseEnabled, state.config, updateProgress]);

  const pauseSimulation = useCallback(() => {
    setState((prev) => ({ ...prev, isRunning: false }));
    addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'info', icon: '⏸️', message: 'Simulation paused.' });
  }, []);

  const resetSimulation = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isRunning: false,
      stage: 'preparation',
      progress: 0,
      logs: [],
      metrics: {
        fundsTransferred: '0',
        attackCost: '0',
        successProbability: defenseEnabled ? 12 : 92,
        gasUsed: '0',
      },
    }));
    addLog({ timestamp: new Date().toISOString().slice(11, 19), type: 'info', icon: '🔄', message: 'Simulation reset.' });
  }, [defenseEnabled]);

  const updateConfig = useCallback((newConfig: Partial<AttackSimulationState['config']>) => {
    setState((prev) => ({
      ...prev,
      config: { ...prev.config, ...newConfig },
    }));
  }, []);

  return { state, startSimulation, pauseSimulation, resetSimulation, updateConfig };
};