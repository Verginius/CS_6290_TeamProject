import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import type { GovernanceData } from '../types/governance';

export const useGovernanceData = (dao?: string, status?: string, sort?: string) => {
  const [data, setData] = useState<GovernanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (dao && dao !== 'all') params.append('dao', dao);
        if (status && status !== 'all') params.append('status', status);
        if (sort) params.append('sort', sort);
        const url = `/api/governance?${params.toString()}`;
        const response = await apiClient.get(url);
        setData(response.data);
      } catch (err) {
        console.warn('API failed, using mock governance data', err);
        setData(getMockGovernanceData());
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dao, status, sort]);

  return { data, loading };
};

function getMockGovernanceData(): GovernanceData {
  return {
    proposals: [
      {
        id: '123',
        title: 'Parameter Update Proposal',
        description: 'Adjust interest rate model',
        stage: 'active',
        forVotes: 67,
        againstVotes: 22,
        abstainVotes: 11,
        riskLevel: 'medium',
        supportRate: 67,
      },
      {
        id: '124',
        title: 'Fund Transfer Proposal',
        description: 'Transfer funds to new treasury',
        stage: 'active',
        forVotes: 92,
        againstVotes: 5,
        abstainVotes: 3,
        riskLevel: 'high',
        supportRate: 92,
      },
    ],
    tokenDistribution: [
      { name: 'Top 10 Holders', value: 45, color: '#3B82F6' },
      { name: 'Medium Holders', value: 30, color: '#10B981' },
      { name: 'Small Holders', value: 25, color: '#F59E0B' },
    ],
    votingPatterns: [
      { proposalName: 'Proposal #123', support: 67, against: 22, abstain: 11 },
      { proposalName: 'Proposal #124', support: 92, against: 5, abstain: 3 },
    ],
    liveVotes: [
      { timestamp: '14:30:15', address: '0x123..abc', action: 'Voted For', proposal: 'Proposal #123', tokens: '1,200' },
      { timestamp: '14:30:22', address: '0x456..def', action: 'Voted Against', proposal: 'Proposal #123', tokens: '850' },
      { timestamp: '14:30:30', address: '0x789..ghi', action: 'Voted For', proposal: 'Proposal #124', tokens: '3,500' },
    ],
    timelineStages: [
      { stage: 'Proposal', icon: '📝', active: true },
      { stage: 'Voting', icon: '🗳️', active: true },
      { stage: 'Timelock', icon: '⏳', active: false },
      { stage: 'Execution', icon: '✅', active: false },
    ],
  };
}