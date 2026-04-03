import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import type { EconomicData, DefenseROIItem  } from '../types/economic';

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

/// 在 getMockEconomicData 函数中替换 defenseROI 数组及相关计算

function getMockEconomicData(tokenPrice: number, gasPrice: number, ethPrice: number): EconomicData {
  // 攻击成本与目标资金（与之前一致）
  const attackCost = 5.2;
  const targetFunds = 1000;

  // 防御投资 ROI 数据（基于 README 中的 5 个独立防御合约）
  const defenseROI: DefenseROIItem[] = [
    { name: 'Voting Delay', investment: 0.3, savings: 150 },      // 延迟投票开始，减少闪电贷攻击
    { name: 'Snapshot Voting', investment: 0.2, savings: 200 },    // 快照投票，防止后获取代币
    { name: 'Token Locking', investment: 0.8, savings: 400 },      // 锁仓投票，阻止借入投票
    { name: 'Dynamic Quorum', investment: 0.5, savings: 300 },     // 动态法定人数，抵御低参与攻击
    { name: 'Emergency Pause', investment: 1.0, savings: 600 },    // 紧急暂停，阻断所有攻击
  ];

  // 计算总防御投资和总节省
  const totalInvestment = defenseROI.reduce((sum, item) => sum + item.investment, 0);
  const totalSavings = defenseROI.reduce((sum, item) => sum + item.savings, 0);
  const totalDefenseROI = (totalSavings / totalInvestment) * 100;

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
    defenseROI,
    totalDefenseROI,
    totalInvestment,
    totalSavings,
  };
}