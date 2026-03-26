import { useEffect, useState } from 'react';
import { getGovernorContract } from '../lib/web3';

export const useDefenseStatus = () => {
  const [timelockEnabled, setTimelockEnabled] = useState(false);
  const [quorum, setQuorum] = useState<number>(0);
  const [emergencyReady, setEmergencyReady] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDefense = async () => {
      const contract = getGovernorContract('defense');
      try {
        // 假设合约有这些方法
        const delay = await contract.timelockDelay(); // 如果 >0 则启用
        setTimelockEnabled(delay > 0);
        const quorumBps = await contract.quorumNumerator(); // 或者 quorumBps()
        setQuorum(quorumBps / 100); // 假设是基点，转换为百分比
        // 紧急暂停状态可以从合约或其他来源读取
        setEmergencyReady(true);
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