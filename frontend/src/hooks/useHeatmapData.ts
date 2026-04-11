// import { useEffect, useState } from 'react';
// import { apiClient } from '../lib/api';

// export const useHeatmapData = () => {
//   const [data, setData] = useState<Array<{ time: string; value: number }>>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const res = await apiClient.get('/heatmap?range=24h');
//         setData(res.data);
//       } catch (err) {
//         console.error('Failed to fetch heatmap data', err);
//         // 如果后端失败，可以保留静态 mock 数据，但最好使用真实数据
//         setData([
//           { time: '00:00', value: 120 },
//           { time: '04:00', value: 80 },
//           // ... 其他 mock
//         ]);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//     const interval = setInterval(fetchData, 60000);
//     return () => clearInterval(interval);
//   }, []);

//   return { data, loading };
// };
import { useEffect, useState } from "react";
import { provider, getTreasuryContract } from "../lib/web3";

export const useHeatmapData = () => {

  const [data, setData] = useState<Array<{ time: string; value: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const fetchData = async () => {

      try {

        const treasury = getTreasuryContract();
        const treasuryAddress = await treasury.getAddress();

        const latestBlock = await provider.getBlockNumber();

        const fromBlock = Math.max(0, latestBlock - 7200);

        const logs = await provider.getLogs({
          address: treasuryAddress,
          fromBlock,
          toBlock: latestBlock
        });

        const buckets: Record<string, number> = {};

        for (const log of logs) {

          const block = await provider.getBlock(log.blockNumber);

          if (!block) continue;

          const date = new Date(block.timestamp * 1000);

          const hour =
            date.getHours().toString().padStart(2, "0") + ":00";

          if (!buckets[hour]) buckets[hour] = 0;

          buckets[hour] += 1;

        }

        const result = Object.entries(buckets).map(([time, value]) => ({
          time,
          value
        }));

        setData(result);

      } catch (err) {

        console.error("Failed to fetch heatmap data", err);

      } finally {

        setLoading(false);

      }

    };

    fetchData();

    const interval = setInterval(fetchData, 60000);

    return () => clearInterval(interval);

  }, []);

  return { data, loading };

};