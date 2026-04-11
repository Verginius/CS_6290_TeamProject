// import { useEffect, useState } from 'react';
// import { apiClient } from '../lib/api';

// export const useRiskScore = () => {
//   const [score, setScore] = useState<number>(85);
//   const [level, setLevel] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchRisk = async () => {
//       try {
//         const res = await apiClient.get('/risk/score');
//         setScore(res.data.score);
//         setLevel(res.data.level);
//       } catch (err) {
//         console.error('Failed to fetch risk score', err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchRisk();
//     const interval = setInterval(fetchRisk, 30000);
//     return () => clearInterval(interval);
//   }, []);

//   return { score, level, loading };
// };
import { useEffect, useState } from 'react';
import { provider } from '../lib/web3';

export const useRiskScore = () => {

  const [score, setScore] = useState(0);
  const [level, setLevel] = useState<'low'|'medium'|'high'|'critical'>('low');
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const calculateRisk = async () => {

      try {

        const block = await provider.getBlockNumber();

        const baseRisk = block % 100;

        setScore(baseRisk);

        if (baseRisk > 80) setLevel('critical');
        else if (baseRisk > 60) setLevel('high');
        else if (baseRisk > 30) setLevel('medium');
        else setLevel('low');

      } catch (err) {
        console.error(err);
      }

      setLoading(false);

    };

    calculateRisk();

  }, []);

  return { score, level, loading };

};