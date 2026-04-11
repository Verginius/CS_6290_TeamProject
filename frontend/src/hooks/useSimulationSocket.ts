import { useEffect, useCallback, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { apiClient } from '../lib/api';

export interface SimulationProgress {
  stage: string;
  step: string;
  progress: number;
}

export interface SimulationLog {
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  icon: string;
  message: string;
}

export interface SimulationResult {
  success: boolean;
  results?: any;
  error?: string;
}

export interface SimulationMetrics {
  fundsTransferred: string;
  attackCost: string;
  successProbability: number;
  gasUsed: string;
  scenario: string;
  defenseEnabled: boolean;
  treasuryBalance: string;
}

export interface SimulationState {
  isRunning: boolean;
  stage: string;
  progress: number;
  logs: SimulationLog[];
  error: string | null;
  metrics: SimulationMetrics;
}

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

export const useSimulationSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<SimulationState>({
    isRunning: false,
    stage: 'idle',
    progress: 0,
    logs: [],
    error: null,
    metrics: {
      fundsTransferred: '0',
      attackCost: '0',
      successProbability: 0,
      gasUsed: '0',
      scenario: 'A',
      defenseEnabled: false,
      treasuryBalance: '5000000',
    },
  });

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Connected to simulation socket');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from simulation socket');
    });

    socket.on('simulation:start', (data: { scenario: string }) => {
      setState(prev => ({
        ...prev,
        isRunning: true,
        stage: 'starting',
        progress: 0,
        logs: [{
          timestamp: new Date().toISOString().slice(11, 19),
          type: 'info',
          icon: '🚀',
          message: `Starting simulation: ${data.scenario}`
        }],
        error: null,
      }));
    });

    socket.on('simulation:progress', (data: SimulationProgress) => {
      setState(prev => ({
        ...prev,
        stage: data.stage,
        progress: data.progress,
      }));
    });

    socket.on('simulation:metrics', (data: SimulationMetrics) => {
      setState(prev => ({
        ...prev,
        metrics: data,
      }));
    });

    socket.on('simulation:log', (data: SimulationLog) => {
      setState(prev => ({
        ...prev,
        logs: [data, ...prev.logs].slice(0, 100),
      }));
    });

    socket.on('simulation:error', (data: { message: string }) => {
      setState(prev => ({
        ...prev,
        error: data.message,
        isRunning: false,
        logs: [{
          timestamp: new Date().toISOString().slice(11, 19),
          type: 'error',
          icon: '❌',
          message: data.message
        }, ...prev.logs].slice(0, 100),
      }));
    });

    socket.on('simulation:complete', (data: SimulationResult) => {
      setState(prev => ({
        ...prev,
        isRunning: false,
        stage: 'completed',
        progress: 100,
        logs: [{
          timestamp: new Date().toISOString().slice(11, 19),
          type: data.success ? 'success' : 'error',
          icon: data.success ? '✅' : '❌',
          message: data.success ? 'Simulation completed successfully' : `Simulation failed: ${data.error}`
        }, ...prev.logs].slice(0, 100),
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const startSimulation = useCallback(async (scenario?: string, defenseEnabled?: boolean) => {
    try {
      await apiClient.post('/simulation/run', { scenario, defenseEnabled });
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        error: err.message || 'Failed to start simulation',
      }));
    }
  }, []);

  const stopSimulation = useCallback(async () => {
    try {
      await apiClient.post('/simulation/stop');
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        error: err.message || 'Failed to stop simulation',
      }));
    }
  }, []);

  const resetSimulation = useCallback(() => {
    setState({
      isRunning: false,
      stage: 'idle',
      progress: 0,
      logs: [],
      error: null,
      metrics: {
        fundsTransferred: '0',
        attackCost: '0',
        successProbability: 0,
        gasUsed: '0',
        scenario: 'A',
        defenseEnabled: false,
        treasuryBalance: '5000000',
      },
    });
  }, []);

  return {
    state,
    startSimulation,
    stopSimulation,
    resetSimulation,
  };
};