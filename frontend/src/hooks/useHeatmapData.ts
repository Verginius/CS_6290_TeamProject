import { useEffect, useState } from 'react';
import { apiClient } from '../lib/api';

export const useHeatmapData = () => {
  const [data, setData] = useState<Array<{ time: string; value: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiClient.get('/heatmap?range=24h');
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch heatmap data', err);
        // 如果后端失败，可以保留静态 mock 数据，但最好使用真实数据
        setData([
          { time: '00:00', value: 120 },
          { time: '04:00', value: 80 },
          // ... 其他 mock
        ]);
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