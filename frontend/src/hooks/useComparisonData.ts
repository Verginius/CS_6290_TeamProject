// import { useState, useEffect } from 'react';

// const attackTypes = [
//   'Flash Loan Attack',
//   'Whale Manipulation',
//   'Proposal Spam',
//   'Quorum Manipulation',
//   'Timelock Exploit',
// ];

// const attackCostsETH: Record<string, number> = {
//   'Flash Loan Attack': 0.17,
//   'Whale Manipulation': 1350,
//   'Proposal Spam': 0.04,
//   'Quorum Manipulation': 0.2,
//   'Timelock Exploit': 2.0,
// };

// interface AttackResult {
//   name: string;
//   succeeded: boolean;
//   amountExtracted: string;
// }

// interface JsonData {
//   attacks: AttackResult[];
// }

// const loadAttackResults = async (url: string): Promise<JsonData | null> => {
//   try {
//     const res = await fetch(url);
//     if (!res.ok) return null;
//     return await res.json();
//   } catch {
//     return null;
//   }
// };

// const parseAmountToETH = (amountStr: string): number => {
//   try {
//     const wei = BigInt(amountStr);
//     return Number(wei) / 1e18;
//   } catch {
//     return 0;
//   }
// };

// export const useComparisonData = () => {
//   const [data, setData] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true);

//       try {
//         const scenarios = ['A', 'B', 'C', 'D', 'E'];

//         const noDefenseMap: Record<string, AttackResult[]> = {};
//         const defenseMap: Record<string, AttackResult[]> = {};

//         // =========================
//         // 1. 并行加载 5 个场景
//         // =========================
//         await Promise.all(
//           scenarios.map(async (s) => {
//             const [noDef, def] = await Promise.all([
//               loadAttackResults(`/attack_simulation_results_${s}.json?t=${Date.now()}`),
//               loadAttackResults(`/attack_simulation_defended_results_${s}.json?t=${Date.now()}`),
//             ]);

//             noDefenseMap[s] = noDef?.attacks || [];
//             defenseMap[s] = def?.attacks || [];
//           })
//         );

//         // =========================
//         // 2. matrix（核心：5场景对比）
//         // =========================
//         const matrix = attackTypes.map(type => {
//           return {
//             attackType: type,

//             scenarios: scenarios.map(s => {
//               const noDef = noDefenseMap[s].find(r => r.name === type);
//               const def = defenseMap[s].find(r => r.name === type);

//               return {
//                 scenario: s,

//                 // no defense
//                 noDefense: !!noDef?.succeeded,

//                 // with defense
//                 defense: def ? !!def.succeeded : null,

//                 // profit
//                 profit: parseAmountToETH(noDef?.amountExtracted || '0'),
//               };
//             }),
//           };
//         });

//         // =========================
//         // 3. cost benefit（跨场景平均）
//         // =========================
//         const costBenefit = attackTypes.map(type => {
//           let successCount = 0;

//           scenarios.forEach(s => {
//             const found = noDefenseMap[s].find(r => r.name === type);
//             if (found?.succeeded) successCount++;
//           });

//           return {
//             name: type,
//             cost: attackCostsETH[type] || 0,
//             successRate: Math.round((successCount / scenarios.length) * 100),
//           };
//         });

//         // =========================
//         // 4. ROI（跨所有场景汇总）
//         // =========================
//         const recommendations = attackTypes.map(type => {
//           let totalProfit = 0;

//           scenarios.forEach(s => {
//             const found = noDefenseMap[s].find(r => r.name === type);
//             totalProfit += parseAmountToETH(found?.amountExtracted || '0');
//           });

//           const cost = attackCostsETH[type] || 0;
//           const roi = cost > 0 ? (totalProfit / cost) * 100 : 0;

//           return {
//             attackType: type,
//             roi: Math.round(roi),
//             cost: `${cost.toFixed(2)} ETH`,
//             profit: `${totalProfit.toFixed(2)} ETH`,
//           };
//         });

//         // =========================
//         // 5. radar（整体安全评分）
//         // =========================
//         const radar = scenarios.map(s => {
//           const list = noDefenseMap[s];

//           const successRate =
//             list.length > 0
//               ? (list.filter(x => x.succeeded).length / list.length) * 100
//               : 0;

//           return {
//             subject: `Scenario ${s}`,
//             value: Math.round(100 - successRate), // 防御强度
//             fullMark: 100,
//           };
//         });

//         // =========================
//         // 6. final
//         // =========================
//         setData({
//           matrix,
//           costBenefit,
//           radar,
//           recommendations,
//           summary: scenarios.map(s => {
//             const list = noDefenseMap[s];
//             const success =
//               list.length > 0
//                 ? list.filter(x => x.succeeded).length
//                 : 0;

//             return {
//               scenario: s,
//               successRate: list.length
//                 ? Math.round((success / list.length) * 100)
//                 : 0,
//             };
//           }),
//         });

//         setError(null);
//       } catch (err) {
//         console.error(err);
//         setError('Failed to load comparison data');
//         setData(null);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   return { data, loading, error };
// };

import { useEffect, useState } from 'react';

const scenarios = ['A', 'B', 'C', 'D', 'E'] as const;

const attackTypes = [
  'Flash Loan Attack',
  'Whale Manipulation',
  'Proposal Spam',
  'Quorum Manipulation',
  'Timelock Exploit',
];

const attackCostsETH: Record<string, number> = {
  'Flash Loan Attack': 0.17,
  'Whale Manipulation': 1350,
  'Proposal Spam': 0.04,
  'Quorum Manipulation': 0.2,
  'Timelock Exploit': 2.0,
};

type AttackResult = {
  name: string;
  succeeded: boolean;
  amountExtracted: string;
};

type ScenarioData = {
  attacks: AttackResult[];
  summary: {
    successRate: number;
    totalExtracted: string;
  };
};

export interface ComparisonData {
  scenarios: Record<
    string,
    {
      noDefense: ScenarioData;
      defense: ScenarioData;
    }
  >;
}

const loadJSON = async (url: string): Promise<ScenarioData | null> => {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

const parseETH = (v: string) => {
  try {
    return Number(BigInt(v)) / 1e18;
  } catch {
    return 0;
  }
};

export const useComparisonData = () => {
  const [data, setData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);

      try {
        const results = await Promise.all(
          scenarios.map(async (s) => {
            const noDefense = await loadJSON(
              `/attack_simulation_results_${s}.json?t=${Date.now()}`
            );

            const defense = await loadJSON(
              `/attack_simulation_defended_results_${s}.json?t=${Date.now()}`
            );

            return {
              [s]: {
                noDefense,
                defense,
              },
            };
          })
        );

        const merged = Object.assign({}, ...results);

        setData({ scenarios: merged });
        setError(null);
      } catch (e) {
        setError('failed');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  return { data, loading, error };
};



// import { useState, useEffect } from 'react';
// import type { ComparisonData } from '../types/comparison';

// const attackTypes = [
//   'Flash Loan Attack',
//   'Whale Manipulation',
//   'Proposal Spam',
//   'Quorum Manipulation',
//   'Timelock Exploit',
// ];

// const attackCostsETH: Record<string, number> = {
//   'Flash Loan Attack': 0.17,
//   'Whale Manipulation': 1350,
//   'Proposal Spam': 0.04,
//   'Quorum Manipulation': 0.2,
//   'Timelock Exploit': 2.0,
// };

// interface AttackResult {
//   name: string;
//   succeeded: boolean;
//   amountExtracted: string;
// }

// interface JsonData {
//   attacks: AttackResult[];
//   summary: {
//     successRate: number;
//   };
// }

// // ✅ 读取 JSON
// const loadAttackResults = async (url: string): Promise<JsonData | null> => {
//   try {
//     const res = await fetch(url);
//     if (!res.ok) throw new Error();
//     return await res.json();
//   } catch {
//     return null;
//   }
// };

// // ✅ 正确解析 ETH（修复精度问题）
// const parseAmountToETH = (amountStr: string): number => {
//   try {
//     const wei = BigInt(amountStr);
//     return Number(wei) / 1e18;
//   } catch {
//     return 0;
//   }
// };

// export const useComparisonData = (scenario: string) => {
//   const [data, setData] = useState<ComparisonData | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true);
//       try {
//         const noDefenseUrl = `/attack_simulation_results_${scenario}.json?t=${Date.now()}`;
//         const defenseUrl = `/attack_simulation_defended_results_${scenario}.json?t=${Date.now()}`;

//         const [noDefenseJson, defenseJson] = await Promise.all([
//           loadAttackResults(noDefenseUrl),
//           loadAttackResults(defenseUrl),
//         ]);

//         const noDefenseResults = noDefenseJson?.attacks || [];
//         const defenseResults = defenseJson?.attacks || [];

//         // ✅ 单次结果 → 0 或 100（不是“rate”）
//         const matrix = attackTypes.map(type => {
//           const noDef = noDefenseResults.find(r => r.name === type);
//           const def = defenseResults.find(r => r.name === type);

//           return {
//             attackType: type,
//             noDefense: noDef ? (noDef.succeeded ? 100 : 0) : 0,
//             defense: def ? (def.succeeded ? 100 : 0) : null,
//           };
//         });

//         // ✅ 成本 vs 成功（用于柱状图）
//         const costBenefit = attackTypes.map(type => {
//           const found = noDefenseResults.find(r => r.name === type);

//           return {
//             name: type,
//             cost: attackCostsETH[type] || 0,
//             success: found?.succeeded ? 100 : 0,
//           };
//         });

//         // ✅ Radar（保持你原逻辑）
//         const radar = [
//           { subject: 'Timelock', value: 30, fullMark: 100 },
//           { subject: 'Quorum', value: 60, fullMark: 100 },
//           { subject: 'Token Weight', value: 70, fullMark: 100 },
//           { subject: 'Vote Delay', value: 40, fullMark: 100 },
//           { subject: 'Emergency Pause', value: 50, fullMark: 100 },
//           { subject: 'Multi-sig', value: 65, fullMark: 100 },
//         ];

//         // ✅ ROI
//         const recommendations = attackTypes.map(type => {
//           const found = noDefenseResults.find(r => r.name === type);
//           const profit = found ? parseAmountToETH(found.amountExtracted) : 0;
//           const cost = attackCostsETH[type] || 0;

//           const roi = cost > 0 ? (profit / cost) * 100 : 0;

//           return {
//             attackType: type,
//             roi: Math.round(roi),
//             cost: `${cost.toFixed(2)} ETH`,
//             profit: `${profit.toFixed(2)} ETH`,
//           };
//         });

//         setData({
//           matrix,
//           costBenefit,
//           radar,
//           recommendations,
//         });

//         setError(null);
//       } catch (err) {
//         console.error(err);
//         setError('Failed to load data');
//         setData(null);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, [scenario]);

//   return { data, loading, error };
// };