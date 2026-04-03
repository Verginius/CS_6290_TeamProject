// import { useEffect, useState } from 'react';
// import { getGovernorContract } from '../lib/web3';

// export const useDefenseStatus = () => {
//   const [timelockEnabled, setTimelockEnabled] = useState(false);
//   const [quorum, setQuorum] = useState<number>(0);
//   const [emergencyReady, setEmergencyReady] = useState(false);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchDefense = async () => {
//       const contract = getGovernorContract('defense');
//       try {
//         // 假设合约有这些方法
//         const delay = await contract.timelockDelay(); // 如果 >0 则启用
//         setTimelockEnabled(delay > 0);
//         const quorumBps = await contract.quorumNumerator(); // 或者 quorumBps()
//         setQuorum(quorumBps / 100); // 假设是基点，转换为百分比
//         // 紧急暂停状态可以从合约或其他来源读取
//         setEmergencyReady(true);
//       } catch (err) {
//         console.error('Failed to fetch defense status', err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchDefense();
//   }, []);

//   return { timelockEnabled, quorum, emergencyReady, loading };
// };

// src/hooks/useDefenseStatus.ts
import { useEffect, useState } from 'react';
import { getGovernorContract } from '../lib/web3';

export const useDefenseStatus = () => {
  const [timelockEnabled, setTimelockEnabled] = useState(false);
  const [quorum, setQuorum] = useState<number>(0);
  const [emergencyReady, setEmergencyReady] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDefense = async () => {
      try {
        const contract = getGovernorContract('defense');
        // 获取时间锁延迟（秒），>0 表示启用
        const delay = await contract.timelockDelay();
        setTimelockEnabled(delay > 0);
        // 获取法定人数分子（如 4 表示 4%）
        const numerator = await contract.quorumNumerator();
        setQuorum(Number(numerator));
        // 紧急暂停状态暂未部署，设为 false
        setEmergencyReady(false);
      } catch (err) {
        console.error('Failed to fetch defense status', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDefense();
  }, []);

  return { timelockEnabled, quorum, emergencyReady, loading };
};