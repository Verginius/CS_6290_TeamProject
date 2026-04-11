// import { useState, useEffect, useCallback } from 'react';
// import { ethers } from 'ethers';
// import { getGovernorContract, provider, getGovernanceTokenContract } from '../lib/web3';
// import governanceTokenAbi from '../lib/abi/GovernanceToken.json';
// import type { GovernanceData, Proposal, LiveVote } from '../types/governance';

// const GOVERNANCE_TOKEN_ADDRESS = import.meta.env.VITE_GOVERNANCE_TOKEN_ADDRESS;
// const TREASURY_ADDRESS = import.meta.env.VITE_TREASURY_ADDRESS; // 国库地址
// const WHALE_ADDRESS = import.meta.env.VITE_WHALE_ADDRESS || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
// const ATTACK_CONTRACT_ADDRESS = import.meta.env.VITE_WHALE_MANIPULATION; // 攻击合约地址

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
//   const [usingMock, setUsingMock] = useState(false);

//   // 获取提案列表（防御版从链上读取，漏洞版用 mock）
//   const fetchProposals = useCallback(async (): Promise<Proposal[]> => {
//     if (mode === 'vulnerable') {
//       setUsingMock(true);
//       return getMockProposals();
//     }

//     try {
//       const contract = getGovernorContract(mode);
//       if (!contract) throw new Error('Governor contract address not configured');

//       console.log(`Fetching proposals from ${mode} governor:`, contract.address);
//       const count = await contract.proposalCount();
//       console.log(`Total proposals: ${count}`);

//       const proposals: Proposal[] = [];
//       for (let i = 0; i < Number(count); i++) {
//         try {
//           const proposer = await contract.proposalProposer(i);
//           const [snapshotBlock, startBlock, endBlock] = await contract.proposalWindow(i);
//           const [againstVotes, forVotes, abstainVotes] = await contract.proposalVotes(i);
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
//       console.error('Failed to fetch proposals:', err);
//       setUsingMock(true);
//       return getMockProposals();
//     }
//   }, [mode]);

//   // 真实代币分布：从链上读取关键地址的余额占比
//   const fetchTokenDistribution = useCallback(async () => {
//     if (mode === 'vulnerable') {
//       return [
//         { name: 'Top 10 Holders', value: 45, color: '#3B82F6' },
//         { name: 'Medium Holders', value: 30, color: '#10B981' },
//         { name: 'Small Holders', value: 25, color: '#F59E0B' },
//       ];
//     }

//     try {
//       if (!GOVERNANCE_TOKEN_ADDRESS) throw new Error('No token address');
//       const tokenContract = getGovernanceTokenContract(); // 使用已有的工厂函数
//       const totalSupply = await tokenContract.totalSupply();
//       if (totalSupply === 0n) throw new Error('Total supply is zero');

//       // 定义要查询的地址列表（可配置）
//       const addresses = [
//         { name: 'Whale (Attacker)', address: WHALE_ADDRESS },
//         { name: 'Treasury', address: TREASURY_ADDRESS },
//         { name: 'Attack Contract', address: ATTACK_CONTRACT_ADDRESS },
//         { name: 'Other Holders', address: null }, // 占位，用于剩余部分
//       ];

//       let accountedSupply = 0n;
//       const distribution: { name: string; value: number; color: string }[] = [];

//       for (const item of addresses) {
//         if (item.address && item.address !== '0x0000000000000000000000000000000000000000') {
//           const balance = await tokenContract.balanceOf(item.address);
//           const percent = (Number(balance) / Number(totalSupply)) * 100;
//           accountedSupply += balance;
//           distribution.push({
//             name: item.name,
//             value: percent,
//             color: item.name === 'Whale (Attacker)' ? '#EF4444' : item.name === 'Treasury' ? '#3B82F6' : '#F59E0B',
//           });
//         }
//       }

//       // 剩余部分（其他地址）
//       const remainingPercent = 100 - distribution.reduce((sum, d) => sum + d.value, 0);
//       if (remainingPercent > 0.01) {
//         distribution.push({
//           name: 'Other Holders',
//           value: remainingPercent,
//           color: '#94A3B8',
//         });
//       }

//       return distribution;
//     } catch (err) {
//       console.error('Failed to fetch token distribution:', err);
//       // 降级使用 mock
//       return [
//         { name: 'Top 10 Holders', value: 45, color: '#3B82F6' },
//         { name: 'Medium Holders', value: 30, color: '#10B981' },
//         { name: 'Small Holders', value: 25, color: '#F59E0B' },
//       ];
//     }
//   }, [mode]);

//   const fetchVotingPatterns = useCallback(async (proposals: Proposal[]) => {
//     return proposals.slice(-3).map(p => ({
//       proposalName: `Proposal #${p.id}`,
//       support: p.forVotes,
//       against: p.againstVotes,
//       abstain: p.abstainVotes,
//     }));
//   }, []);

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
//           liveVotes: [],
//           timelineStages,
//         });
//       } catch (err) {
//         console.error('Fatal error loading governance data:', err);
//         setError('Failed to load governance data');
//         setData(null);
//       } finally {
//         setLoading(false);
//       }
//     };
//     loadData();

//     if (mode === 'defense') {
//       const contract = getGovernorContract(mode);
//       if (!contract) return;
//       const voteHandler = (voter: string, proposalId: bigint, support: number, weight: bigint) => {
//         const vote: LiveVote = {
//           timestamp: new Date().toISOString().slice(11, 19),
//           address: `${voter.slice(0, 6)}..${voter.slice(-4)}`,
//           action: support === 1 ? 'Voted For' : support === 0 ? 'Voted Against' : 'Abstained',
//           proposal: `Proposal #${proposalId}`,
//           tokens: ethers.formatEther(weight),
//         };
//         setData(prev => prev ? { ...prev, liveVotes: [vote, ...prev.liveVotes].slice(0, 20) } : prev);
//       };
//       contract.on('VoteCast', voteHandler);

//       const proposalHandler = async () => {
//         const newProposals = await fetchProposals();
//         setData(prev => prev ? { ...prev, proposals: newProposals } : prev);
//       };
//       contract.on('ProposalCreated', proposalHandler);

//       return () => {
//         contract.off('VoteCast', voteHandler);
//         contract.off('ProposalCreated', proposalHandler);
//       };
//     }
//   }, [mode, fetchProposals, fetchTokenDistribution, fetchVotingPatterns, getTimelineStages]);

//   return { data, loading, error, usingMock };
// };

// function getMockProposals(): Proposal[] {
//   return [
//     {
//       id: '123',
//       proposer: '0x1234567890123456789012345678901234567890',
//       title: 'Parameter Update Proposal',
//       description: 'Adjust interest rate model',
//       stage: 'active',
//       startBlock: 100,
//       endBlock: 200,
//       forVotes: 67,
//       againstVotes: 22,
//       abstainVotes: 11,
//       riskLevel: 'medium',
//       supportRate: 67,
//     },
//     {
//       id: '124',
//       proposer: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
//       title: 'Fund Transfer Proposal',
//       description: 'Transfer funds to new treasury',
//       stage: 'active',
//       startBlock: 150,
//       endBlock: 250,
//       forVotes: 92,
//       againstVotes: 5,
//       abstainVotes: 3,
//       riskLevel: 'high',
//       supportRate: 92,
//     },
//   ];
// }

// hooks/useGovernanceData.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { getGovernorContract, provider, getGovernanceTokenContract } from '../lib/web3';
import type { GovernanceData, Proposal, LiveVote } from '../types/governance';

// 环境变量（需在 .env 中配置）
const GOVERNANCE_TOKEN_ADDRESS = import.meta.env.VITE_GOVERNANCE_TOKEN_ADDRESS;
const TREASURY_ADDRESS = import.meta.env.VITE_TREASURY_ADDRESS;
const WHALE_ADDRESS = import.meta.env.VITE_WHALE_ADDRESS || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const ATTACK_CONTRACT_ADDRESS = import.meta.env.VITE_WHALE_MANIPULATION;

// 将合约状态码转换为前端状态字符串
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

// 计算风险等级
const calculateRiskLevel = (supportRate: number, stage: string): Proposal['riskLevel'] => {
  if (stage === 'active' && supportRate > 80) return 'high';
  if (stage === 'active' && supportRate > 60) return 'medium';
  if (stage === 'pending') return 'low';
  return 'medium';
};

// Mock 数据（用于漏洞模式或降级）
const getMockProposals = (): Proposal[] => [
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

export const useGovernanceData = (mode: 'vulnerable' | 'defense' = 'vulnerable') => {
  const [data, setData] = useState<GovernanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMock, setUsingMock] = useState(false);
  const proposalIdsRef = useRef<Set<string>>(new Set()); // 存储已知的提案ID

  // 从合约事件中获取提案ID列表（仅防御模式）
  const fetchProposalIdsFromEvents = useCallback(async (): Promise<string[]> => {
    const contract = getGovernorContract(mode);
    if (!contract) return [];

    // 获取当前区块号，只查询最近10000个区块（可调整）
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 10000);
    const filter = contract.filters.ProposalCreated();
    const events = await contract.queryFilter(filter, fromBlock, 'latest');
    const ids = events.map(event => {
      // 事件参数顺序: proposalId, proposer, targets, values, calldatas, description, snapshotBlock, voteStart, voteEnd
      const proposalId = event.args?.[0];
      return proposalId?.toString();
    }).filter((id): id is string => !!id);
    return ids;
  }, [mode]);

  // 获取单个提案详情（防御模式）
  // const fetchProposalDetails = useCallback(async (proposalId: string): Promise<Proposal | null> => {
  //   const contract = getGovernorContract(mode);
  //   if (!contract) return null;
  //   try {
  //     const idNum = BigInt(proposalId);
  //     // 获取提案数据
  //     const proposer = await contract.proposalProposer(idNum);
  //     const [snapshotBlock, startBlock, endBlock] = await contract.proposalWindow(idNum);
  //     const [againstVotes, forVotes, abstainVotes] = await contract.proposalVotes(idNum);
  //     const state = await contract.state(idNum);
  //     const totalVotes = forVotes + againstVotes + abstainVotes;
  //     const supportRate = totalVotes === 0 ? 0 : (forVotes * 100) / totalVotes;
  //     const stage = stateToString(state);
  //     return {
  //       id: proposalId,
  //       proposer,
  //       title: `Proposal #${proposalId.slice(0, 8)}`,
  //       description: `Proposal ${proposalId}`,
  //       stage,
  //       startBlock: Number(startBlock),
  //       endBlock: Number(endBlock),
  //       forVotes: Number(forVotes),
  //       againstVotes: Number(againstVotes),
  //       abstainVotes: Number(abstainVotes),
  //       riskLevel: calculateRiskLevel(supportRate, stage),
  //       supportRate,
  //     };
  //   } catch (err) {
  //     console.warn(`Failed to fetch proposal ${proposalId}:`, err);
  //     return null;
  //   }
  // }, [mode]);

  const fetchProposalDetails = useCallback(async (proposalId: string): Promise<Proposal | null> => {
  const contract = getGovernorContract(mode);
  if (!contract) return null;
  try {
    const idNum = BigInt(proposalId);
    const proposer = await contract.proposalProposer(idNum);
    const [snapshotBlock, startBlock, endBlock] = await contract.proposalWindow(idNum);
    const [againstVotes, forVotes, abstainVotes] = await contract.proposalVotes(idNum);
    const state = await contract.state(idNum);
    
    // 显式转换为 number 避免 BigInt 与 number 混合运算
    const forNum = Number(forVotes);
    const againstNum = Number(againstVotes);
    const abstainNum = Number(abstainVotes);
    const totalVotes = forNum + againstNum + abstainNum;
    const supportRate = totalVotes === 0 ? 0 : (forNum * 100) / totalVotes;
    const stage = stateToString(state);
    
    return {
      id: proposalId,
      proposer,
      title: `Proposal #${proposalId.slice(0, 8)}`,
      description: `Proposal ${proposalId}`,
      stage,
      startBlock: Number(startBlock),
      endBlock: Number(endBlock),
      forVotes: forNum,
      againstVotes: againstNum,
      abstainVotes: abstainNum,
      riskLevel: calculateRiskLevel(supportRate, stage),
      supportRate,
    };
  } catch (err) {
    console.warn(`Failed to fetch proposal ${proposalId}:`, err);
    return null;
    }
  }, [mode]);

  // 获取提案列表（漏洞模式用mock，防御模式从事件获取ID然后取详情）
  const fetchProposals = useCallback(async (): Promise<Proposal[]> => {
    if (mode === 'vulnerable') {
      setUsingMock(true);
      return getMockProposals();
    }

    try {
      const ids = await fetchProposalIdsFromEvents();
      const proposals: Proposal[] = [];
      for (const id of ids) {
        const proposal = await fetchProposalDetails(id);
        if (proposal) proposals.push(proposal);
      }
      // 按提案ID排序（可选）
      proposals.sort((a, b) => b.id.localeCompare(a.id));
      return proposals;
    } catch (err) {
      console.error('Failed to fetch proposals in defense mode:', err);
      setUsingMock(true);
      return getMockProposals();
    }
  }, [mode, fetchProposalIdsFromEvents, fetchProposalDetails]);

  // 真实代币分布（防御模式从链上读取）
  const fetchTokenDistribution = useCallback(async () => {
    if (mode === 'vulnerable') {
      return [
        { name: 'Top 10 Holders', value: 45, color: '#3B82F6' },
        { name: 'Medium Holders', value: 30, color: '#10B981' },
        { name: 'Small Holders', value: 25, color: '#F59E0B' },
      ];
    }

    try {
      if (!GOVERNANCE_TOKEN_ADDRESS) throw new Error('No token address');
      const tokenContract = getGovernanceTokenContract();
      const totalSupply = await tokenContract.totalSupply();
      if (totalSupply === 0n) throw new Error('Total supply is zero');

      const addresses = [
        { name: 'Whale (Attacker)', address: WHALE_ADDRESS },
        { name: 'Treasury', address: TREASURY_ADDRESS },
        { name: 'Attack Contract', address: ATTACK_CONTRACT_ADDRESS },
      ];

      let accountedSupply = 0n;
      const distribution: { name: string; value: number; color: string }[] = [];

      for (const item of addresses) {
        if (item.address && item.address !== '0x0000000000000000000000000000000000000000') {
          const balance = await tokenContract.balanceOf(item.address);
          const percent = (Number(balance) / Number(totalSupply)) * 100;
          accountedSupply += balance;
          distribution.push({
            name: item.name,
            value: percent,
            color: item.name === 'Whale (Attacker)' ? '#EF4444' : item.name === 'Treasury' ? '#3B82F6' : '#F59E0B',
          });
        }
      }

      const remainingPercent = 100 - distribution.reduce((sum, d) => sum + d.value, 0);
      if (remainingPercent > 0.01) {
        distribution.push({ name: 'Other Holders', value: remainingPercent, color: '#94A3B8' });
      }
      return distribution;
    } catch (err) {
      console.error('Failed to fetch token distribution:', err);
      return [
        { name: 'Top 10 Holders', value: 45, color: '#3B82F6' },
        { name: 'Medium Holders', value: 30, color: '#10B981' },
        { name: 'Small Holders', value: 25, color: '#F59E0B' },
      ];
    }
  }, [mode]);

  // 投票模式数据（基于提案的投票统计）
  const fetchVotingPatterns = useCallback(async (proposals: Proposal[]) => {
    return proposals.slice(-5).map(p => ({
      proposalName: `Proposal #${p.id.slice(0, 8)}`,
      support: p.forVotes,
      against: p.againstVotes,
      abstain: p.abstainVotes,
    }));
  }, []);

  // 时间线状态（基于提案状态动态计算）
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

  // 主加载逻辑
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
  }, [fetchProposals, fetchTokenDistribution, fetchVotingPatterns, getTimelineStages]);

  // 实时事件监听（仅防御模式）
  useEffect(() => {
    if (mode !== 'defense') return;

    const contract = getGovernorContract(mode);
    if (!contract) return;

    // 监听新提案创建，更新提案列表
    const proposalCreatedHandler = async (proposalId: bigint, proposer: string) => {
      const idStr = proposalId.toString();
      if (proposalIdsRef.current.has(idStr)) return;
      proposalIdsRef.current.add(idStr);
      // 重新加载提案列表
      const newProposals = await fetchProposals();
      setData(prev => prev ? { ...prev, proposals: newProposals } : prev);
    };

    // 监听投票事件，更新实时投票记录
    const voteCastHandler = (voter: string, proposalId: bigint, support: number, weight: bigint) => {
      const vote: LiveVote = {
        timestamp: new Date().toISOString().slice(11, 19),
        address: `${voter.slice(0, 6)}..${voter.slice(-4)}`,
        action: support === 1 ? 'Voted For' : support === 0 ? 'Voted Against' : 'Abstained',
        proposal: `Proposal #${proposalId.toString().slice(0, 8)}`,
        tokens: ethers.formatEther(weight),
      };
      setData(prev => prev ? { ...prev, liveVotes: [vote, ...prev.liveVotes].slice(0, 20) } : prev);
    };

    contract.on('ProposalCreated', proposalCreatedHandler);
    contract.on('VoteCast', voteCastHandler);

    return () => {
      contract.off('ProposalCreated', proposalCreatedHandler);
      contract.off('VoteCast', voteCastHandler);
    };
  }, [mode, fetchProposals]);

  return { data, loading, error, usingMock };
};
