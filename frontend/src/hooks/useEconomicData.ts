import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import type { EconomicData } from '../types/economic';

export const useEconomicData = (tokenPrice: number, gasPrice: number, ethPrice: number) => {
  const [data, setData] = useState<EconomicData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          tokenPrice: tokenPrice.toString(),
          gasPrice: gasPrice.toString(),
          ethPrice: ethPrice.toString(),
        });
        const response = await apiClient.get(`/economic/data?${params}`);
        setData(response.data);
      } catch (err) {
        console.warn('API failed, using mock economic data', err);
        setData(getMockEconomicData(tokenPrice, gasPrice, ethPrice));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tokenPrice, gasPrice, ethPrice]);

  return { data, loading };
};

function getMockEconomicData(tokenPrice: number, gasPrice: number, ethPrice: number): EconomicData {
  // 模拟成本分解（固定值，但可以基于 gasPrice 等简单调整）
  const attackCost = 5.2;
  const targetFunds = 1000;
  return {
    costBreakdown: [
      { name: 'Flash Loan Fee', value: 21, amount: 1.1 },
      { name: 'Gas Fee', value: 54, amount: 2.8 },
      { name: 'Token Slippage', value: 17, amount: 0.9 },
      { name: 'Others', value: 8, amount: 0.4 },
    ],
    roiCalculator: {
      targetFunds,
      attackCost,
      expectedProfit: targetFunds - attackCost,
      roi: ((targetFunds - attackCost) / attackCost) * 100,
    },
    breakEvenData: [
      { amount: 0, profit: -attackCost },
      { amount: 50, profit: -attackCost },
      { amount: 100, profit: -attackCost },
      { amount: 150, profit: 0 },
      { amount: 500, profit: 500 - attackCost },
      { amount: 1000, profit: 1000 - attackCost },
    ],
    sensitivityData: [
      { param: 'Token Price -10%', impact: -8 },
      { param: 'Token Price +10%', impact: 8 },
      { param: 'Gas Price -20%', impact: -15 },
      { param: 'Gas Price +20%', impact: 15 },
      { param: 'Slippage -5%', impact: -3 },
      { param: 'Slippage +5%', impact: 3 },
    ],
    defenseROI: [
      { name: 'Timelock', investment: 0.5, savings: 250 },
      { name: 'Quorum Increase', investment: 0.2, savings: 120 },
      { name: 'Multi-sig', investment: 1.0, savings: 500 },
    ],
    totalDefenseROI: 30800,
    totalInvestment: 1.7,
    totalSavings: 870,
  };
}