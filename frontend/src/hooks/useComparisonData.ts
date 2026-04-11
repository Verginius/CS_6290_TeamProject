// // src/hooks/useComparisonData.ts
// import { useState, useEffect } from 'react';
// import type { ComparisonData } from '../types/comparison';

// // 攻击类型列表
// const attackTypes = ['Flash Loan', 'Whale Manipulation', 'Proposal Spam', 'Quorum Manipulation', 'Timelock Exploit'];

// // 场景名称映射
// const scenarioNames: Record<string, string> = {
//   A: 'Scenario A - Extreme Vulnerability',
//   B: 'Scenario B - Whale-Heavy Distribution',
//   C: 'Scenario C - Distributed Holdings',
//   D: 'Scenario D - Fair Governance',
//   E: 'Scenario E - Paranoid Security',
// };


// const loadScenarioData = async (scenario: string): Promise<{ noDefense: number[]; defense: (number | null)[] }> => {
//   if (scenario === 'A') {
//     const response = await fetch('/attack_simulation_resultsA.json');
//     const json = await response.json();
//     const attacks = json.attacks;
//     const successRates = attacks.map((a: any) => (a.succeeded ? 100 : 0));
//     return {
//       noDefense: successRates,
//       defense: [null, null, null, null, null],  // 无防御场景
//     };
//   } else {
//     // B~E 场景有防御数据，仍为 number[]
//     const mockData: Record<string, { noDefense: number[]; defense: number[] }> = {
//       B: { noDefense: [90, 85, 70, 60, 55], defense: [30, 25, 20, 15, 10] },
//       C: { noDefense: [85, 80, 75, 65, 60], defense: [40, 35, 30, 25, 20] },
//       D: { noDefense: [80, 75, 70, 60, 55], defense: [55, 50, 45, 40, 35] },
//       E: { noDefense: [75, 70, 65, 55, 50], defense: [70, 65, 60, 55, 50] },
//     };
//     return mockData[scenario] || { noDefense: [0,0,0,0,0], defense: [0,0,0,0,0] };
//   }
// };

// export const useComparisonData = (scenario: string, attackType?: string, timeRange?: string, sort?: string) => {
//   const [data, setData] = useState<ComparisonData | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true);
//       try {
//         const { noDefense, defense } = await loadScenarioData(scenario);

//         // 构建 matrix 行（No Defense 和 Defense）
//         const matrixRows = attackTypes.map((attack, idx) => ({
//           attackType: attack,
//           noDefense: noDefense[idx],
//           defense: defense[idx],
//         }));

//         // 成本效益数据（成本固定，成功率随场景变化）
//         const costBenefit = attackTypes.map((attack, idx) => {
//           let cost = 0;
//           switch (attack) {
//             case 'Flash Loan': cost = 0.5; break;
//             case 'Whale Manipulation': cost = 1.2; break;
//             case 'Proposal Spam': cost = 0.2; break;
//             case 'Quorum Manipulation': cost = 1.5; break;
//             case 'Timelock Exploit': cost = 2.0; break;
//           }
//           return {
//             name: attack,
//             cost,
//             success: noDefense[idx], // 这里展示无防御成功率，可改为防御成功率等
//           };
//         });

//         // 雷达图数据（防御效果评分，根据场景调整）
//         let radarValues = [10,5,5,5,10,15]; // 默认场景A
//         if (scenario === 'E') radarValues = [95,90,85,80,95,98];
//         else if (scenario === 'D') radarValues = [80,75,70,65,85,90];
//         else if (scenario === 'C') radarValues = [60,55,50,45,70,75];
//         else if (scenario === 'B') radarValues = [40,35,30,25,50,55];
//         const radar = [
//           { subject: 'Timelock', value: radarValues[0], fullMark: 100 },
//           { subject: 'Quorum', value: radarValues[1], fullMark: 100 },
//           { subject: 'Token Weight', value: radarValues[2], fullMark: 100 },
//           { subject: 'Vote Delay', value: radarValues[3], fullMark: 100 },
//           { subject: 'Emergency Pause', value: radarValues[4], fullMark: 100 },
//           { subject: 'Multi-sig', value: radarValues[5], fullMark: 100 },
//         ];

//         // ROI 建议（简单计算）
//         const recommendations = attackTypes.map((attack, idx) => {
//           const profit = noDefense[idx] === 100 ? 10 : 0; // 简化
//           const cost = costBenefit.find(c => c.name === attack)?.cost || 1;
//           const roi = profit > 0 ? (profit / cost) * 100 : 0;
//           return {
//             attackType: attack,
//             roi: Math.round(roi),
//             cost: `${cost} ETH`,
//             profit: `${profit.toFixed(2)} ETH`,
//           };
//         });

//         setData({
//           matrix: matrixRows,
//           costBenefit,
//           radar,
//           recommendations,
//         });
//         setError(null);
//       } catch (err) {
//         console.error(err);
//         setError('Failed to load scenario data');
//         setData(null);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, [scenario]);

//   return { data, loading, error };
// };

// src/hooks/useComparisonData.ts
// import { useState, useEffect } from 'react';
// import type { ComparisonData } from '../types/comparison';

// // 攻击类型列表（必须与 JSON 中的 name 字段一致）
// const attackTypes = [
//   'Flash Loan Attack',
//   'Whale Manipulation',
//   'Proposal Spam',
//   'Quorum Manipulation',
//   'Timelock Exploit',
// ];

// // 场景名称映射
// const scenarioNames: Record<string, string> = {
//   A: 'Scenario A - Extreme Vulnerability',
//   B: 'Scenario B - Whale-Heavy Distribution',
//   C: 'Scenario C - Distributed Holdings',
//   D: 'Scenario D - Fair Governance',
//   E: 'Scenario E - Paranoid Security',
// };

// // 从 JSON 加载场景 A 的攻击结果（无防御）
// interface AttackResult {
//   name: string;
//   succeeded: boolean;
//   amountExtracted: string; // wei 或 ETH 字符串
// }

// const loadAttackResultsFromJSON = async (): Promise<AttackResult[]> => {
//   const response = await fetch('/attack_simulation_resultsA.json');
//   const json = await response.json();
//   return json.attacks as AttackResult[];
// };

// // 将 amountExtracted 字符串转换为 ETH 数值（假设单位可能是 wei 或 ETH）
// const parseAmountToETH = (amountStr: string): number => {
//   const amount = parseFloat(amountStr);
//   if (isNaN(amount)) return 0;
//   // 如果数值极大（如 1e23），视为 wei，转换为 ETH
//   if (amount > 1e12) {
//     return amount / 1e18;
//   }
//   // 否则直接当作 ETH 数值（如 "50"）
//   return amount;
// };

// // 攻击成本（ETH）基于项目文档：
// // Flash Loan: $340 / $2000 = 0.17 ETH
// // Whale Manipulation: 滑点成本 $2.7M / $2000 = 1350 ETH
// // Proposal Spam: Gas $80 / $2000 = 0.04 ETH
// // Quorum Manipulation: 类似 Flash Loan 但额外 gas ≈ 0.2 ETH
// // Timelock Exploit: 估算 2 ETH（保持原代码风格）
// const attackCostsETH: Record<string, number> = {
//   'Flash Loan Attack': 0.17,
//   'Whale Manipulation': 1350,
//   'Proposal Spam': 0.04,
//   'Quorum Manipulation': 0.2,
//   'Timelock Exploit': 2.0,
// };

// // 判断某攻击是否需要大量 COMP（受体积断路器影响）
// // 根据 M3_Defense_Trigger_Specification.md，阈值 50,000 COMP
// const requiresLargeCOMP = (attackName: string): boolean => {
//   return ['Flash Loan Attack', 'Whale Manipulation', 'Quorum Manipulation'].includes(attackName);
// };

// // 获取防御模式下的攻击成功率（%）
// // 场景 A 返回 null（无防御数据）
// // 场景 B~E 根据断路器逻辑：需要大量 COMP 的攻击成功率为 0%，否则保持原无防御成功率
// const getDefenseSuccessRates = (
//   scenario: string,
//   noDefenseRates: number[],
//   attackNames: string[]
// ): (number | null)[] => {
//   if (scenario === 'A') {
//     return attackNames.map(() => null);
//   }
//   // 场景 B~E 使用相同防御逻辑（断路器生效）
//   return attackNames.map((name, idx) => {
//     if (requiresLargeCOMP(name)) {
//       return 0; // 完全阻止
//     } else {
//       return noDefenseRates[idx]; // 不受影响，成功率不变
//     }
//   });
// };

// // 雷达图各维度基础评分（来自 M2/M3 文档分析）
// // 顺序：Timelock, Quorum, Token Weight, Vote Delay, Emergency Pause, Multi-sig
// const baseRadarScores = [5, 90, 85, 20, 30, 50];

// // 根据场景缩放雷达图评分（场景 A 全 0，B~E 逐步增强）
// const getRadarScoresForScenario = (scenario: string): number[] => {
//   if (scenario === 'A') return [0, 0, 0, 0, 0, 0];
//   const factor: Record<string, number> = { B: 0.2, C: 0.4, D: 0.7, E: 1.0 };
//   const f = factor[scenario] || 0.5;
//   return baseRadarScores.map(v => Math.min(100, Math.round(v * f)));
// };

// export const useComparisonData = (scenario: string, attackType?: string, timeRange?: string, sort?: string) => {
//   const [data, setData] = useState<ComparisonData | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true);
//       try {
//         // 1. 加载无防御攻击结果
//         const attackResults = await loadAttackResultsFromJSON();
//         // 确保顺序与 attackTypes 一致
//         const noDefenseRates = attackTypes.map(type => {
//           const result = attackResults.find(r => r.name === type);
//           return result ? (result.succeeded ? 100 : 0) : 0;
//         });
//         const profits = attackTypes.map(type => {
//           const result = attackResults.find(r => r.name === type);
//           return result ? parseAmountToETH(result.amountExtracted) : 0;
//         });

//         // 2. 防御成功率（场景 A 为 null，其他场景基于断路器）
//         const defenseRates = getDefenseSuccessRates(scenario, noDefenseRates, attackTypes);

//         // 3. 构建 matrix 行
//         const matrixRows = attackTypes.map((attack, idx) => ({
//           attackType: attack,
//           noDefense: noDefenseRates[idx],
//           defense: defenseRates[idx],
//         }));

//         // 4. 成本效益数据（成本 + 无防御成功率）
//         const costBenefit = attackTypes.map((attack, idx) => ({
//           name: attack,
//           cost: attackCostsETH[attack] || 0,
//           success: noDefenseRates[idx],
//         }));

//         // 5. 雷达图数据
//         const radarScores = getRadarScoresForScenario(scenario);
//         const radar = [
//           { subject: 'Timelock', value: radarScores[0], fullMark: 100 },
//           { subject: 'Quorum', value: radarScores[1], fullMark: 100 },
//           { subject: 'Token Weight', value: radarScores[2], fullMark: 100 },
//           { subject: 'Vote Delay', value: radarScores[3], fullMark: 100 },
//           { subject: 'Emergency Pause', value: radarScores[4], fullMark: 100 },
//           { subject: 'Multi-sig', value: radarScores[5], fullMark: 100 },
//         ];

//         // 6. ROI 分析（基于真实利润和成本）
//         const recommendations = attackTypes.map((attack, idx) => {
//           const profit = profits[idx];
//           const cost = attackCostsETH[attack] || 0;
//           let roi = 0;
//           if (cost > 0 && profit > 0) {
//             roi = (profit / cost) * 100;
//           }
//           return {
//             attackType: attack,
//             roi: Math.round(roi),
//             cost: `${cost.toFixed(2)} ETH`,
//             profit: `${profit.toFixed(2)} ETH`,
//           };
//         });

//         setData({
//           matrix: matrixRows,
//           costBenefit,
//           radar,
//           recommendations,
//         });
//         setError(null);
//       } catch (err) {
//         console.error(err);
//         setError('Failed to load scenario data');
//         setData(null);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, [scenario]);

//   return { data, loading, error };
// };

// src/hooks/useComparisonData.ts
import { useState, useEffect } from 'react';
import type { ComparisonData } from '../types/comparison';

// 攻击类型列表（必须与 JSON 中的 name 字段完全一致）
const attackTypes = [
  'Flash Loan Attack',
  'Whale Manipulation',
  'Proposal Spam',
  'Quorum Manipulation',
  'Timelock Exploit',
];

// 场景名称映射（用于 UI 显示）
export const scenarioNames: Record<string, string> = {
  A: 'Scenario A - Extreme Vulnerability',
  B: 'Scenario B - Whale-Heavy Distribution',
  C: 'Scenario C - Distributed Holdings',
  D: 'Scenario D - Fair Governance',
  E: 'Scenario E - Paranoid Security',
};

// 攻击成本（ETH）基于项目文档
const attackCostsETH: Record<string, number> = {
  'Flash Loan Attack': 0.17,
  'Whale Manipulation': 1350,
  'Proposal Spam': 0.04,
  'Quorum Manipulation': 0.2,
  'Timelock Exploit': 2.0,
};

// 从 JSON 文件加载攻击结果数组
interface AttackResult {
  name: string;
  succeeded: boolean;
  amountExtracted: string; // wei 或 ETH 字符串
}

const loadAttackResults = async (url: string): Promise<AttackResult[] | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    return json.attacks as AttackResult[];
  } catch (err) {
    console.warn(`Failed to load ${url}:`, err);
    return null; // 文件不存在或加载失败
  }
};

// 将 amountExtracted 转换为 ETH 数值
const parseAmountToETH = (amountStr: string): number => {
  const amount = parseFloat(amountStr);
  if (isNaN(amount)) return 0;
  // 如果数值极大（如 1e23），视为 wei，转换为 ETH
  if (amount > 1e12) {
    return amount / 1e18;
  }
  // 否则直接当作 ETH 数值（如 "50"）
  return amount;
};

// 根据攻击结果数组计算成功率和利润数组（按 attackTypes 顺序）
const computeRatesAndProfits = (results: AttackResult[] | null): { rates: number[]; profits: number[] } => {
  if (!results) {
    return {
      rates: attackTypes.map(() => 0),
      profits: attackTypes.map(() => 0),
    };
  }
  const rates = attackTypes.map(type => {
    const found = results.find(r => r.name === type);
    return found ? (found.succeeded ? 100 : 0) : 0;
  });
  const profits = attackTypes.map(type => {
    const found = results.find(r => r.name === type);
    return found ? parseAmountToETH(found.amountExtracted) : 0;
  });
  return { rates, profits };
};

// 雷达图各维度基础评分（来自 M2/M3 文档）
const baseRadarScores = [5, 90, 85, 20, 30, 50];

// 根据场景缩放雷达图评分（场景 A 全 0，B~E 逐步增强）
const getRadarScoresForScenario = (scenario: string): number[] => {
  if (scenario === 'A') return [0, 0, 0, 0, 0, 0];
  const factor: Record<string, number> = { B: 0.2, C: 0.4, D: 0.7, E: 1.0 };
  const f = factor[scenario] || 0.5;
  return baseRadarScores.map(v => Math.min(100, Math.round(v * f)));
};

export const useComparisonData = (scenario: string, attackType?: string, timeRange?: string, sort?: string) => {
  const [data, setData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 构建文件 URL（假设防御文件命名为 attack_simulation_defended_results{scenario}.json）
        const noDefenseUrl = `/attack_simulation_results${scenario}.json`;
        const defenseUrl = `/attack_simulation_defended_results${scenario}.json`;

        // 并行加载两个文件
        const [noDefenseResults, defenseResults] = await Promise.all([
          loadAttackResults(noDefenseUrl),
          loadAttackResults(defenseUrl),
        ]);

        // 计算无防御的成功率和利润
        const { rates: noDefenseRates, profits: noDefenseProfits } = computeRatesAndProfits(noDefenseResults);

        // 计算防御的成功率和利润（如果防御文件不存在，防御成功率全部为 null）
        let defenseRates: (number | null)[];
        let defenseProfits: number[];
        if (defenseResults) {
          const { rates, profits } = computeRatesAndProfits(defenseResults);
          defenseRates = rates; // 防御模式下的成功率（0% 或 100%）
          defenseProfits = profits;
        } else {
          defenseRates = attackTypes.map(() => null); // 无防御数据
          defenseProfits = attackTypes.map(() => 0);
        }

        // 构建 matrix 行（防御成功率可能为 null）
        const matrixRows = attackTypes.map((attack, idx) => ({
          attackType: attack,
          noDefense: noDefenseRates[idx],
          defense: defenseRates[idx],
        }));

        // 成本效益数据：成本（固定）+ 无防御成功率
        const costBenefit = attackTypes.map((attack, idx) => ({
          name: attack,
          cost: attackCostsETH[attack] || 0,
          success: noDefenseRates[idx],
        }));

        // 雷达图数据（基于场景，与防御文件内容无关）
        const radarScores = getRadarScoresForScenario(scenario);
        const radar = [
          { subject: 'Timelock', value: radarScores[0], fullMark: 100 },
          { subject: 'Quorum', value: radarScores[1], fullMark: 100 },
          { subject: 'Token Weight', value: radarScores[2], fullMark: 100 },
          { subject: 'Vote Delay', value: radarScores[3], fullMark: 100 },
          { subject: 'Emergency Pause', value: radarScores[4], fullMark: 100 },
          { subject: 'Multi-sig', value: radarScores[5], fullMark: 100 },
        ];

        // ROI 分析：使用防御模式下的利润（如果有防御数据，优先用防御利润；否则用无防御利润）
        // 根据你的业务逻辑，ROI 应该是攻击者在当前防御配置下能获得的利润。这里采用防御模式利润。
        const profitsForROI = defenseResults ? defenseProfits : noDefenseProfits;
        const recommendations = attackTypes.map((attack, idx) => {
          const profit = profitsForROI[idx];
          const cost = attackCostsETH[attack] || 0;
          let roi = 0;
          if (cost > 0 && profit > 0) {
            roi = (profit / cost) * 100;
          }
          return {
            attackType: attack,
            roi: Math.round(roi),
            cost: `${cost.toFixed(2)} ETH`,
            profit: `${profit.toFixed(2)} ETH`,
          };
        });

        setData({
          matrix: matrixRows,
          costBenefit,
          radar,
          recommendations,
        });
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Failed to load scenario data');
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [scenario]);

  return { data, loading, error };
};