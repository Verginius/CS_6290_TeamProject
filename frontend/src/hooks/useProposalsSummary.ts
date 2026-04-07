// import { useEffect, useState } from 'react';
// import { getGovernorContract } from '../lib/web3';

// export const useProposalsSummary = (mode: 'vulnerable' | 'defense' = 'vulnerable') => {
//   const [active, setActive] = useState(0);
//   const [voting, setVoting] = useState(0);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchProposals = async () => {
//       const contract = getGovernorContract(mode);
//       // 这里需要根据你的合约实际方法调整
//       // 假设有 getProposalCount() 和 state(proposalId)
//       // 示例：遍历最近 10 个提案
//       try {
//         const count = await contract.proposalCount(); // 如果合约有
//         let activeCount = 0, votingCount = 0;
//         for (let i = 0; i < count; i++) {
//           const state = await contract.state(i);
//           if (state === 1) activeCount++; // 1 = Active
//           if (state === 0) votingCount++; // 0 = Pending
//         }
//         setActive(activeCount);
//         setVoting(votingCount);
//       } catch (err) {
//         console.error('Failed to fetch proposals', err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchProposals();
//     // 可选轮询
//     const interval = setInterval(fetchProposals, 15000);
//     return () => clearInterval(interval);
//   }, [mode]);

//   return { active, voting, loading };
// };

// import { useState, useEffect } from 'react';

// export const useProposalsSummary = (mode: 'vulnerable' | 'defense' = 'vulnerable') => {
//   const [active, setActive] = useState(2);
//   const [voting, setVoting] = useState(1);
//   const [loading, setLoading] = useState(false);

//   // 暂时用静态数据，等合约可用后再替换
//   return { active, voting, loading };
// };

// src/hooks/useProposalsSummary.ts
// import { useState, useEffect } from 'react';

// export const useProposalsSummary = (mode: 'vulnerable' | 'defense' = 'vulnerable') => {
//   const [active, setActive] = useState(2);
//   const [voting, setVoting] = useState(1);
//   const [loading, setLoading] = useState(false);

//   // TODO: 后续替换为真实合约调用或后端 API
//   return { active, voting, loading };
// };

import { useEffect, useState } from 'react';
import { provider, getGovernorContract } from '../lib/web3';

export const useProposalsSummary = (
  mode: 'vulnerable' | 'defense' = 'vulnerable'
) => {

  const [active, setActive] = useState(0);
  const [voting, setVoting] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const fetchProposals = async () => {

      try {

        const governor = getGovernorContract(mode);
        const governorAddress = await governor.getAddress();

        const latestBlock = await provider.getBlockNumber();

        const logs = await provider.getLogs({
          address: governorAddress,
          fromBlock: 0,
          toBlock: latestBlock
        });

        let activeCount = 0;
        let votingCount = 0;

        for (const log of logs) {

          try {

            const parsed = governor.interface.parseLog(log);

            if (parsed?.name === "ProposalCreated") {

              const proposalId = parsed.args.proposalId;

              const state = await governor.state(proposalId);

              if (state === 1n) votingCount++;
              if (state === 0n || state === 1n) activeCount++;

            }

          } catch {}

        }

        setActive(activeCount);
        setVoting(votingCount);

      } catch (err) {

        console.error('Failed to fetch proposals', err);

      } finally {

        setLoading(false);

      }

    };

    fetchProposals();

  }, [mode]);

  return { active, voting, loading };

};