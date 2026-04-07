// import { useEffect, useState } from 'react';
// import { apiClient } from '../lib/api';

// export const useAttackEvents = () => {
//   const [inProgress, setInProgress] = useState(0);
//   const [defended, setDefended] = useState(0);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const res = await apiClient.get('/attacks/summary');
//         setInProgress(res.data.inProgress);
//         setDefended(res.data.defended);
//       } catch (err) {
//         console.error('Failed to fetch attack summary', err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//     const interval = setInterval(fetchData, 10000);
//     return () => clearInterval(interval);
//   }, []);

//   return { inProgress, defended, loading };
// };

import { useEffect, useState } from 'react';
import { provider } from '../lib/web3';
import { ethers } from 'ethers';

export const useAttackEvents = () => {

  const [inProgress, setInProgress] = useState(0);
  const [defended, setDefended] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const fetchEvents = async () => {

      try {

        const filter = {
          address: null,
          fromBlock: 0,
          toBlock: 'latest'
        };

        const logs = await provider.getLogs(filter);

        // 简单统计
        setInProgress(logs.length);

        // 这里简单假设一半被防御
        setDefended(Math.floor(logs.length / 2));

      } catch (err) {
        console.error('Attack event fetch error', err);
      }

      setLoading(false);

    };

    fetchEvents();

  }, []);

  return { inProgress, defended, loading };

};