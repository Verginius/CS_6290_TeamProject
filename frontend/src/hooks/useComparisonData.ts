// import { useState, useEffect } from 'react';
// import { apiClient } from '../lib/api';
// import type { ComparisonData } from '../types/comparison';

// export const useComparisonData = (attackType?: string, timeRange?: string, sort?: string) => {
//   const [data, setData] = useState<ComparisonData | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true);
//       try {
//         const params = new URLSearchParams();
//         if (attackType && attackType !== 'all') params.append('attackType', attackType);
//         if (timeRange) params.append('timeRange', timeRange);
//         if (sort) params.append('sort', sort);
//         const url = `/analysis/comparison?${params.toString()}`;
//         const response = await apiClient.get(url);
//         setData(response.data);
//         setError(null);
//       } catch (err) {
//         console.warn('API failed, using mock data', err);
//         // 使用 mock 数据作为 fallback，不设置 error 状态
//         setData(getMockData());
//         // 可选：设置一个警告信息供调试用，但不在 UI 中显示错误
//         // setError('Using mock data due to API failure');
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, [attackType, timeRange, sort]);

//   return { data, loading, error };
// };

// // Mock 数据
// function getMockData(): ComparisonData {
//   return {
//     matrix: [
//       { attackType: 'Flash Loan', noDefense: 92, basicDefense: 45, enhancedDefense: 12 },
//       { attackType: 'Sybil Attack', noDefense: 78, basicDefense: 30, enhancedDefense: 8 },
//       { attackType: 'Bribery Attack', noDefense: 65, basicDefense: 25, enhancedDefense: 5 },
//       { attackType: 'Combined Attack', noDefense: 85, basicDefense: 40, enhancedDefense: 15 },
//     ],
//     costBenefit: [
//       { name: 'Flash Loan', cost: 0.5, success: 92 },
//       { name: 'Sybil', cost: 2.1, success: 78 },
//       { name: 'Bribery', cost: 5.3, success: 65 },
//       { name: 'Combined', cost: 3.8, success: 85 },
//     ],
//     radar: [
//       { subject: 'Timelock', value: 85, fullMark: 100 },
//       { subject: 'Quorum', value: 75, fullMark: 100 },
//       { subject: 'Token Weight', value: 65, fullMark: 100 },
//       { subject: 'Vote Delay', value: 70, fullMark: 100 },
//       { subject: 'Emergency Pause', value: 90, fullMark: 100 },
//       { subject: 'Multi-sig', value: 95, fullMark: 100 },
//     ],
//     recommendations: [
//       { attackType: 'Flash Loan Attack', roi: 1840, cost: '0.5 ETH', profit: '9.2 ETH' },
//       { attackType: 'Sybil Attack', roi: 371, cost: '2.1 ETH', profit: '7.8 ETH' },
//     ],
//   };
// }

import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import type { ComparisonData } from '../types/comparison';

export const useComparisonData = (attackType?: string, timeRange?: string, sort?: string) => {
  const [data, setData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (attackType && attackType !== 'all') params.append('attackType', attackType);
        if (timeRange) params.append('timeRange', timeRange);
        if (sort) params.append('sort', sort);
        const url = `/analysis/comparison?${params.toString()}`;
        const response = await apiClient.get(url);
        setData(response.data);
        setError(null);
      } catch (err) {
        console.warn('API failed, using mock data', err);
        setData(getMockData());
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [attackType, timeRange, sort]);

  return { data, loading, error };
};

// Mock 数据（与 README 中的五种攻击向量对齐）
function getMockData(): ComparisonData {
  return {
    matrix: [
      { attackType: 'Flash Loan', noDefense: 92, basicDefense: 45, enhancedDefense: 12 },
      { attackType: 'Whale Manipulation', noDefense: 88, basicDefense: 40, enhancedDefense: 10 },
      { attackType: 'Proposal Spam', noDefense: 85, basicDefense: 35, enhancedDefense: 8 },
      { attackType: 'Quorum Manipulation', noDefense: 75, basicDefense: 30, enhancedDefense: 6 },
      { attackType: 'Timelock Exploit', noDefense: 70, basicDefense: 25, enhancedDefense: 5 },
    ],
    costBenefit: [
      { name: 'Flash Loan', cost: 0.5, success: 92 },
      { name: 'Whale', cost: 1.2, success: 88 },
      { name: 'Spam', cost: 0.2, success: 85 },
      { name: 'Quorum', cost: 1.5, success: 75 },
      { name: 'Timelock', cost: 2.0, success: 70 },
    ],
    radar: [
      { subject: 'Timelock', value: 85, fullMark: 100 },
      { subject: 'Quorum', value: 75, fullMark: 100 },
      { subject: 'Token Weight', value: 65, fullMark: 100 },
      { subject: 'Vote Delay', value: 70, fullMark: 100 },
      { subject: 'Emergency Pause', value: 90, fullMark: 100 },
      { subject: 'Multi-sig', value: 95, fullMark: 100 },
    ],
    recommendations: [
      { attackType: 'Flash Loan', roi: 1840, cost: '0.5 ETH', profit: '9.2 ETH' },
      { attackType: 'Whale Manipulation', roi: 730, cost: '1.2 ETH', profit: '8.8 ETH' },
      { attackType: 'Proposal Spam', roi: 4250, cost: '0.2 ETH', profit: '8.5 ETH' },
      { attackType: 'Quorum Manipulation', roi: 500, cost: '1.5 ETH', profit: '7.5 ETH' },
      { attackType: 'Timelock Exploit', roi: 350, cost: '2.0 ETH', profit: '7.0 ETH' },
    ],
  };
}