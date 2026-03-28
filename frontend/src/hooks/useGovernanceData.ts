// import { useState, useEffect } from 'react';
// import { apiClient } from '../lib/api';
// import type { GovernanceData } from '../types/governance';

// export const useGovernanceData = (dao?: string, status?: string, sort?: string) => {
//   const [data, setData] = useState<GovernanceData | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true);
//       try {
//         const params = new URLSearchParams();
//         if (dao && dao !== 'all') params.append('dao', dao);
//         if (status && status !== 'all') params.append('status', status);
//         if (sort) params.append('sort', sort);
//         const url = `/api/governance?${params.toString()}`;
//         const response = await apiClient.get(url);
//         setData(response.data);
//       } catch (err) {
//         console.warn('API failed, using mock governance data', err);
//         setData(getMockGovernanceData());
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, [dao, status, sort]);

//   return { data, loading };
// };

// function getMockGovernanceData(): GovernanceData {
//   return {
//     proposals: [
//       {
//         id: '123',
//         title: 'Parameter Update Proposal',
//         description: 'Adjust interest rate model',
//         stage: 'active',
//         forVotes: 67,
//         againstVotes: 22,
//         abstainVotes: 11,
//         riskLevel: 'medium',
//         supportRate: 67,
//       },
//       {
//         id: '124',
//         title: 'Fund Transfer Proposal',
//         description: 'Transfer funds to new treasury',
//         stage: 'active',
//         forVotes: 92,
//         againstVotes: 5,
//         abstainVotes: 3,
//         riskLevel: 'high',
//         supportRate: 92,
//       },
//     ],
//     tokenDistribution: [
//       { name: 'Top 10 Holders', value: 45, color: '#3B82F6' },
//       { name: 'Medium Holders', value: 30, color: '#10B981' },
//       { name: 'Small Holders', value: 25, color: '#F59E0B' },
//     ],
//     votingPatterns: [
//       { proposalName: 'Proposal #123', support: 67, against: 22, abstain: 11 },
//       { proposalName: 'Proposal #124', support: 92, against: 5, abstain: 3 },
//     ],
//     liveVotes: [
//       { timestamp: '14:30:15', address: '0x123..abc', action: 'Voted For', proposal: 'Proposal #123', tokens: '1,200' },
//       { timestamp: '14:30:22', address: '0x456..def', action: 'Voted Against', proposal: 'Proposal #123', tokens: '850' },
//       { timestamp: '14:30:30', address: '0x789..ghi', action: 'Voted For', proposal: 'Proposal #124', tokens: '3,500' },
//     ],
//     timelineStages: [
//       { stage: 'Proposal', icon: '📝', active: true },
//       { stage: 'Voting', icon: '🗳️', active: true },
//       { stage: 'Timelock', icon: '⏳', active: false },
//       { stage: 'Execution', icon: '✅', active: false },
//     ],
//   };
// }

// src/hooks/useGovernanceData.ts
// src/hooks/useGovernanceData.ts
// src/hooks/useGovernanceData.ts
// src/hooks/useGovernanceData.ts
// src/hooks/useGovernanceData.ts
// src/hooks/useGovernanceData.ts
// src/hooks/useGovernanceData.ts
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { getGovernorContract, provider } from '../lib/web3';
import governanceTokenAbi from '../lib/abi/GovernanceToken.json';
import type { GovernanceData, Proposal, LiveVote } from '../types/governance';

const GOVERNANCE_TOKEN_ADDRESS = import.meta.env.VITE_GOVERNANCE_TOKEN_ADDRESS;

const stateToString = (state: number): Proposal['stage'] => {
  const states: Record<number, Proposal['stage']> = {
    0: 'pending',
    1: 'active',
    2: 'succeeded',
    3: 'queued',
    4: 'executed',
    5: 'defeated',
  };
  return states[state] || 'pending';
};

const calculateRiskLevel = (supportRate: number, stage: string): Proposal['riskLevel'] => {
  if (stage === 'active' && supportRate > 80) return 'high';
  if (stage === 'active' && supportRate > 60) return 'medium';
  if (stage === 'pending') return 'low';
  return 'medium';
};

export const useGovernanceData = (mode: 'vulnerable' | 'defense' = 'vulnerable') => {
  const [data, setData] = useState<GovernanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMock, setUsingMock] = useState(false);

  // 获取提案列表（仅防御版尝试真实读取）
  const fetchProposals = useCallback(async (): Promise<Proposal[]> => {
    if (mode === 'vulnerable') {
      setUsingMock(true);
      return getMockProposals();
    }

    try {
      const contract = getGovernorContract(mode);
      // 检查合约地址是否存在
      if (!contract) {
        throw new Error('Governor contract address not configured');
      }

      console.log(`Fetching proposals from ${mode} governor:`, contract.address);
      const count = await contract.proposalCount();
      console.log(`Total proposals: ${count}`);

      const proposals: Proposal[] = [];
      for (let i = 0; i < Number(count); i++) {
        try {
          const proposer = await contract.proposalProposer(i);
          const [snapshotBlock, startBlock, endBlock] = await contract.proposalWindow(i);
          const [againstVotes, forVotes, abstainVotes] = await contract.proposalVotes(i);
          const state = await contract.state(i);
          const totalVotes = forVotes + againstVotes + abstainVotes;
          const supportRate = totalVotes === 0 ? 0 : (forVotes * 100) / totalVotes;

          proposals.push({
            id: i.toString(),
            proposer,
            title: `Proposal #${i}`,
            description: `Proposal ${i} details`,
            stage: stateToString(state),
            startBlock: Number(startBlock),
            endBlock: Number(endBlock),
            forVotes: Number(forVotes),
            againstVotes: Number(againstVotes),
            abstainVotes: Number(abstainVotes),
            riskLevel: calculateRiskLevel(supportRate, stateToString(state)),
            supportRate,
          });
        } catch (err) {
          console.warn(`Failed to fetch proposal ${i}:`, err);
        }
      }
      return proposals;
    } catch (err) {
      console.error('Failed to fetch proposals:', err);
      setUsingMock(true);
      return getMockProposals();
    }
  }, [mode]);

  const fetchTokenDistribution = useCallback(async () => {
    try {
      if (!GOVERNANCE_TOKEN_ADDRESS) throw new Error('No token address');
      const tokenContract = new ethers.Contract(
        GOVERNANCE_TOKEN_ADDRESS,
        governanceTokenAbi.abi,
        provider
      );
      const totalSupply = await tokenContract.totalSupply();
      console.log('Total token supply:', ethers.formatEther(totalSupply));
      return [
        { name: 'Top 10 Holders', value: 45, color: '#3B82F6' },
        { name: 'Medium Holders', value: 30, color: '#10B981' },
        { name: 'Small Holders', value: 25, color: '#F59E0B' },
      ];
    } catch (err) {
      console.error('Failed to fetch token distribution:', err);
      return [
        { name: 'Top 10 Holders', value: 45, color: '#3B82F6' },
        { name: 'Medium Holders', value: 30, color: '#10B981' },
        { name: 'Small Holders', value: 25, color: '#F59E0B' },
      ];
    }
  }, []);

  const fetchVotingPatterns = useCallback(async (proposals: Proposal[]) => {
    return proposals.slice(-3).map(p => ({
      proposalName: `Proposal #${p.id}`,
      support: p.forVotes,
      against: p.againstVotes,
      abstain: p.abstainVotes,
    }));
  }, []);

  const getTimelineStages = useCallback((proposals: Proposal[]) => {
    const hasActive = proposals.some(p => p.stage === 'active');
    const hasQueued = proposals.some(p => p.stage === 'queued');
    const hasExecuted = proposals.some(p => p.stage === 'executed');
    return [
      { stage: 'Proposal', icon: '📝', active: true },
      { stage: 'Voting', icon: '🗳️', active: hasActive },
      { stage: 'Timelock', icon: '⏳', active: hasQueued },
      { stage: 'Execution', icon: '✅', active: hasExecuted },
    ];
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const proposals = await fetchProposals();
        if (!isMounted) return;

        const tokenDistribution = await fetchTokenDistribution();
        const votingPatterns = await fetchVotingPatterns(proposals);
        const timelineStages = getTimelineStages(proposals);

        setData({
          proposals,
          tokenDistribution,
          votingPatterns,
          liveVotes: [],
          timelineStages,
        });
      } catch (err) {
        console.error('Fatal error loading governance data:', err);
        setError('Failed to load governance data');
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    loadData();

    if (mode === 'defense') {
      const contract = getGovernorContract(mode);
      if (!contract) return;
      const voteHandler = (voter: string, proposalId: bigint, support: number, weight: bigint) => {
        const vote: LiveVote = {
          timestamp: new Date().toISOString().slice(11, 19),
          address: `${voter.slice(0, 6)}..${voter.slice(-4)}`,
          action: support === 1 ? 'Voted For' : support === 0 ? 'Voted Against' : 'Abstained',
          proposal: `Proposal #${proposalId}`,
          tokens: ethers.formatEther(weight),
        };
        setData(prev => prev ? { ...prev, liveVotes: [vote, ...prev.liveVotes].slice(0, 20) } : prev);
      };
      contract.on('VoteCast', voteHandler);

      const proposalHandler = async () => {
        const newProposals = await fetchProposals();
        setData(prev => prev ? { ...prev, proposals: newProposals } : prev);
      };
      contract.on('ProposalCreated', proposalHandler);

      return () => {
        contract.off('VoteCast', voteHandler);
        contract.off('ProposalCreated', proposalHandler);
      };
    }
  }, [mode, fetchProposals, fetchTokenDistribution, fetchVotingPatterns, getTimelineStages]);

  return { data, loading, error, usingMock };
};

function getMockProposals(): Proposal[] {
  return [
    {
      id: '123',
      proposer: '0x1234567890123456789012345678901234567890',
      title: 'Parameter Update Proposal',
      description: 'Adjust interest rate model',
      stage: 'active',
      startBlock: 100,
      endBlock: 200,
      forVotes: 67,
      againstVotes: 22,
      abstainVotes: 11,
      riskLevel: 'medium',
      supportRate: 67,
    },
    {
      id: '124',
      proposer: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      title: 'Fund Transfer Proposal',
      description: 'Transfer funds to new treasury',
      stage: 'active',
      startBlock: 150,
      endBlock: 250,
      forVotes: 92,
      againstVotes: 5,
      abstainVotes: 3,
      riskLevel: 'high',
      supportRate: 92,
    },
  ];
}
// import { useState, useEffect, useCallback } from 'react';
// import { ethers } from 'ethers';
// import { getGovernorContract, provider } from '../lib/web3';
// import governanceTokenAbi from '../lib/abi/GovernanceToken.json';
// import type { GovernanceData, Proposal, LiveVote } from '../types/governance';

// const GOVERNANCE_TOKEN_ADDRESS = import.meta.env.VITE_GOVERNANCE_TOKEN_ADDRESS;

// // 将提案状态数字转换为字符串（与 GovernorVulnerable 一致）
// const stateToString = (state: number): Proposal['stage'] => {
//   const states: Record<number, Proposal['stage']> = {
//     0: 'pending',
//     1: 'active',
//     2: 'succeeded',
//     3: 'queued',
//     4: 'executed',
//     5: 'defeated',
//   };
//   return states[state] || 'pending';
// };

// // 风险等级判断（示例逻辑）
// const calculateRiskLevel = (supportRate: number, stage: string): Proposal['riskLevel'] => {
//   if (stage === 'active' && supportRate > 80) return 'high';
//   if (stage === 'active' && supportRate > 60) return 'medium';
//   if (stage === 'pending') return 'low';
//   return 'medium';
// };

// export const useGovernanceData = (mode: 'vulnerable' | 'defense' = 'vulnerable') => {
//   const [data, setData] = useState<GovernanceData | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // 获取提案列表（从合约）
//   const fetchProposals = useCallback(async (): Promise<Proposal[]> => {
//     try {
//       const contract = getGovernorContract(mode);
//       console.log(`Fetching proposals from ${mode} governor:`, contract.address);

//       // 获取提案总数
//       const count = await contract.proposalCount();
//       console.log(`Total proposals: ${count}`);

//       const proposals: Proposal[] = [];
//       for (let i = 0; i < Number(count); i++) {
//         try {
//           // 获取 proposer
//           const proposer = await contract.proposalProposer(i);
//           // 获取投票窗口（startBlock, endBlock）
//           const [startBlock, endBlock] = await contract.proposalSnapshot(i);
//           // 获取投票详情
//           const [againstVotes, forVotes, abstainVotes] = await contract.proposalVotes(i);
//           // 获取当前状态
//           const state = await contract.state(i);
//           const totalVotes = forVotes + againstVotes + abstainVotes;
//           const supportRate = totalVotes === 0 ? 0 : (forVotes * 100) / totalVotes;

//           proposals.push({
//             id: i.toString(),
//             proposer,
//             title: `Proposal #${i}`,
//             description: `Proposal ${i} details`,
//             stage: stateToString(state),
//             startBlock: Number(startBlock),
//             endBlock: Number(endBlock),
//             forVotes: Number(forVotes),
//             againstVotes: Number(againstVotes),
//             abstainVotes: Number(abstainVotes),
//             riskLevel: calculateRiskLevel(supportRate, stateToString(state)),
//             supportRate,
//           });
//         } catch (err) {
//           console.warn(`Failed to fetch proposal ${i}:`, err);
//         }
//       }
//       return proposals;
//     } catch (err) {
//       console.error('Failed to fetch proposals count:', err);
//       return []; // 返回空数组，让外层决定是否使用 mock
//     }
//   }, [mode]);

//   // 获取代币总供应量（用于展示，分布仍为 mock）
//   const fetchTokenDistribution = useCallback(async () => {
//     try {
//       const tokenContract = new ethers.Contract(
//         GOVERNANCE_TOKEN_ADDRESS,
//         governanceTokenAbi.abi,
//         provider
//       );
//       const totalSupply = await tokenContract.totalSupply();
//       console.log('Total token supply:', ethers.formatEther(totalSupply));
//       // 真实分布需要遍历，这里仍用 mock
//       return [
//         { name: 'Top 10 Holders', value: 45, color: '#3B82F6' },
//         { name: 'Medium Holders', value: 30, color: '#10B981' },
//         { name: 'Small Holders', value: 25, color: '#F59E0B' },
//       ];
//     } catch (err) {
//       console.error('Failed to fetch token distribution:', err);
//       return [
//         { name: 'Top 10 Holders', value: 45, color: '#3B82F6' },
//         { name: 'Medium Holders', value: 30, color: '#10B981' },
//         { name: 'Small Holders', value: 25, color: '#F59E0B' },
//       ];
//     }
//   }, []);

//   // 获取投票模式（用于柱状图）
//   const fetchVotingPatterns = useCallback(async (proposals: Proposal[]) => {
//     return proposals.slice(-3).map(p => ({
//       proposalName: `Proposal #${p.id}`,
//       support: p.forVotes,
//       against: p.againstVotes,
//       abstain: p.abstainVotes,
//     }));
//   }, []);

//   // 获取时间线阶段（根据当前提案状态）
//   const getTimelineStages = useCallback((proposals: Proposal[]) => {
//     const hasActive = proposals.some(p => p.stage === 'active');
//     const hasQueued = proposals.some(p => p.stage === 'queued');
//     const hasExecuted = proposals.some(p => p.stage === 'executed');
//     return [
//       { stage: 'Proposal', icon: '📝', active: true },
//       { stage: 'Voting', icon: '🗳️', active: hasActive },
//       { stage: 'Timelock', icon: '⏳', active: hasQueued },
//       { stage: 'Execution', icon: '✅', active: hasExecuted },
//     ];
//   }, []);

//   // 主加载逻辑
//   useEffect(() => {
//     let isMounted = true;
//     const loadData = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const proposals = await fetchProposals();
//         if (!isMounted) return;

//         const tokenDistribution = await fetchTokenDistribution();
//         const votingPatterns = await fetchVotingPatterns(proposals);
//         const timelineStages = getTimelineStages(proposals);

//         setData({
//           proposals,
//           tokenDistribution,
//           votingPatterns,
//           liveVotes: [], // 实时投票通过事件添加
//           timelineStages,
//         });
//       } catch (err) {
//         console.error('Fatal error loading governance data:', err);
//         setError('Failed to load governance data');
//         setData(null); // 不使用 mock，让用户看到错误
//       } finally {
//         setLoading(false);
//       }
//     };
//     loadData();

//     // 监听实时投票事件（VoteCast）
//     const contract = getGovernorContract(mode);
//     const voteHandler = (voter: string, proposalId: bigint, support: number, weight: bigint) => {
//       const vote: LiveVote = {
//         timestamp: new Date().toISOString().slice(11, 19),
//         address: `${voter.slice(0, 6)}..${voter.slice(-4)}`,
//         action: support === 1 ? 'Voted For' : support === 0 ? 'Voted Against' : 'Abstained',
//         proposal: `Proposal #${proposalId}`,
//         tokens: ethers.formatEther(weight),
//       };
//       setData(prev => prev ? { ...prev, liveVotes: [vote, ...prev.liveVotes].slice(0, 20) } : prev);
//     };
//     contract.on('VoteCast', voteHandler);

//     // 监听新提案事件
//     const proposalHandler = async () => {
//       const newProposals = await fetchProposals();
//       setData(prev => prev ? { ...prev, proposals: newProposals } : prev);
//     };
//     contract.on('ProposalCreated', proposalHandler);

//     return () => {
//       isMounted = false;
//       contract.off('VoteCast', voteHandler);
//       contract.off('ProposalCreated', proposalHandler);
//     };
//   }, [mode, fetchProposals, fetchTokenDistribution, fetchVotingPatterns, getTimelineStages]);

//   return { data, loading, error };
// };