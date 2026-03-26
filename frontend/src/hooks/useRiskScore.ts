import { useEffect, useState } from 'react';
import { apiClient } from '../lib/api';

export const useRiskScore = () => {
  const [score, setScore] = useState<number>(85);
  const [level, setLevel] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRisk = async () => {
      try {
        const res = await apiClient.get('/risk/score');
        setScore(res.data.score);
        setLevel(res.data.level);
      } catch (err) {
        console.error('Failed to fetch risk score', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRisk();
    const interval = setInterval(fetchRisk, 30000);
    return () => clearInterval(interval);
  }, []);

  return { score, level, loading };
};