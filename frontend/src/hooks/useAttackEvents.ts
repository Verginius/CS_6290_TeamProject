import { useEffect, useState } from 'react';
import { apiClient } from '../lib/api';

export const useAttackEvents = () => {
  const [inProgress, setInProgress] = useState(0);
  const [defended, setDefended] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiClient.get('/attacks/summary');
        setInProgress(res.data.inProgress);
        setDefended(res.data.defended);
      } catch (err) {
        console.error('Failed to fetch attack summary', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return { inProgress, defended, loading };
};