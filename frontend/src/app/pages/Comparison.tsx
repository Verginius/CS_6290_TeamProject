// import { useState } from 'react';
// import { Download, Loader2 } from 'lucide-react';
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
//   RadarChart,
//   PolarGrid,
//   PolarAngleAxis,
//   PolarRadiusAxis,
//   Radar,
// } from 'recharts';
// import { useComparisonData } from '../../hooks/useComparisonData';

// export function Comparison() {
//   const [scenario, setScenario] = useState('A');
//   const [attackType, setAttackType] = useState('all');
//   const [timeRange, setTimeRange] = useState('7d');
//   const [sort, setSort] = useState('success');
//   const { data, loading, error } = useComparisonData(scenario, attackType, timeRange, sort);

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-96">
//         <Loader2 className="animate-spin text-primary w-8 h-8" />
//         <span className="ml-2 text-muted-foreground">Loading comparison data...</span>
//       </div>
//     );
//   }

//   if (error || !data) {
//     return (
//       <div className="bg-card rounded-lg p-6 border border-border text-center text-destructive">
//         <p>{error || 'Failed to load data'}</p>
//         <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-primary rounded">
//           Retry
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Filter Bar */}
//       <div className="bg-card rounded-lg p-4 border border-border shadow-lg">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-4">
//             {/* 场景选择器 */}
//             <select
//               value={scenario}
//               onChange={(e) => setScenario(e.target.value)}
//               className="bg-secondary border border-border rounded-lg px-4 py-2 text-sm"
//             >
//               <option value="A">Scenario A - Extreme Vulnerability</option>
//               <option value="B">Scenario B - Whale-Heavy Distribution</option>
//               <option value="C">Scenario C - Distributed Holdings</option>
//               <option value="D">Scenario D - Fair Governance</option>
//               <option value="E">Scenario E - Paranoid Security</option>
//             </select>
//             <select
//               value={attackType}
//               onChange={(e) => setAttackType(e.target.value)}
//               className="bg-secondary border border-border rounded-lg px-4 py-2 text-sm"
//             >
//               <option value="all">Attack Type: All</option>
//               <option value="flashloan">Flash Loan</option>
//               <option value="whale">Whale Manipulation</option>
//               <option value="spam">Proposal Spam</option>
//               <option value="quorum">Quorum Manipulation</option>
//               <option value="timelock">Timelock Exploit</option>
//             </select>
//             <select
//               value={timeRange}
//               onChange={(e) => setTimeRange(e.target.value)}
//               className="bg-secondary border border-border rounded-lg px-4 py-2 text-sm"
//             >
//               <option value="1d">Time Range: Last 24 Hours</option>
//               <option value="7d">Last 7 Days</option>
//               <option value="30d">Last 30 Days</option>
//             </select>
//             <select
//               value={sort}
//               onChange={(e) => setSort(e.target.value)}
//               className="bg-secondary border border-border rounded-lg px-4 py-2 text-sm"
//             >
//               <option value="success">Sort: Success Rate</option>
//               <option value="cost">Attack Cost</option>
//               <option value="time">Time</option>
//             </select>
//           </div>
//           <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors">
//             <Download className="w-4 h-4" />
//             Export Report
//           </button>
//         </div>
//       </div>

//       {/* Attack Success Rate Matrix */}
//       <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//         <h2 className="mb-6">Attack Success Rate Comparison Matrix</h2>
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead>
//               <tr className="border-b border-border">
//                 <th className="text-left p-4 text-muted-foreground"></th>
//                 {data.matrix.map((row) => (
//                   <th key={row.attackType} className="text-center p-4 text-muted-foreground">
//                     {row.attackType}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {/* No Defense Row */}
//               <tr className="border-b border-border hover:bg-secondary/20">
//                 <td className="p-4 text-muted-foreground">No Defense</td>
//                 {data.matrix.map((row) => (
//                   <td key={row.attackType} className="text-center p-4">
//                     <span
//                       className={`inline-block px-3 py-1 rounded ${
//                         row.noDefense > 80
//                           ? 'bg-destructive/20 text-destructive'
//                           : row.noDefense > 60
//                           ? 'bg-warning/20 text-warning'
//                           : 'bg-success/20 text-success'
//                       }`}
//                     >
//                       {row.noDefense}%
//                     </span>
//                   </td>
//                 ))}
//               </tr>
//               {/* Defense Row */}
//               <tr className="hover:bg-secondary/20">
//                 <td className="p-4 text-muted-foreground">Defense</td>
//                 {data.matrix.map((row) => (
//                   <td key={row.attackType} className="text-center p-4">
//                     {row.defense === null ? (
//                       <span className="inline-block px-3 py-1 rounded bg-muted/50 text-muted-foreground">
//                         —
//                       </span>
//                     ) : (
//                       <span
//                         className={`inline-block px-3 py-1 rounded ${
//                           row.defense > 80
//                             ? 'bg-destructive/20 text-destructive'
//                             : row.defense > 60
//                             ? 'bg-warning/20 text-warning'
//                             : 'bg-success/20 text-success'
//                         }`}
//                       >
//                         {row.defense}%
//                       </span>
//                     )}
//                   </td>
//                 ))}
//               </tr>
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Cost-Benefit Analysis Chart */}
//       <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//         <h2 className="mb-6">Cost-Benefit Analysis</h2>
//         <ResponsiveContainer width="100%" height={300}>
//           <BarChart data={data.costBenefit}>
//             <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
//             <XAxis dataKey="name" stroke="#94A3B8" />
//             <YAxis
//               yAxisId="left"
//               orientation="left"
//               stroke="#94A3B8"
//               label={{ value: 'Cost (ETH)', angle: -90, position: 'insideLeft', fill: '#94A3B8' }}
//             />
//             <YAxis
//               yAxisId="right"
//               orientation="right"
//               stroke="#94A3B8"
//               label={{ value: 'Success Rate (%)', angle: 90, position: 'insideRight', fill: '#94A3B8' }}
//             />
//             <Tooltip
//               contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
//               labelStyle={{ color: '#F8FAFC' }}
//             />
//             <Legend />
//             <Bar yAxisId="left" dataKey="cost" fill="#3B82F6" name="Attack Cost (ETH)" />
//             <Bar yAxisId="right" dataKey="success" fill="#10B981" name="Success Rate (%)" />
//           </BarChart>
//         </ResponsiveContainer>
//       </div>

//       {/* Bottom Row */}
//       <div className="grid grid-cols-2 gap-6">
//         {/* Defense Radar Chart */}
//         <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//           <h3 className="mb-6">Defense Effectiveness Radar</h3>
//           <ResponsiveContainer width="100%" height={300}>
//             <RadarChart data={data.radar}>
//               <PolarGrid stroke="#334155" />
//               <PolarAngleAxis dataKey="subject" stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 12 }} />
//               <PolarRadiusAxis stroke="#94A3B8" domain={[0, 100]} />
//               <Radar name="Defense Effect" dataKey="value" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
//               <Tooltip
//                 contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
//               />
//             </RadarChart>
//           </ResponsiveContainer>
//         </div>

//         {/* ROI Analysis */}
//         <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//           <div className="flex items-center justify-between mb-2">
//             <h3 className="mb-0">ROI Analysis Cards</h3>
//             <span className="text-xs text-muted-foreground bg-secondary/30 px-2 py-1 rounded">
//               ℹ️ ROI = (Profit in defense mode / Cost) × 100%
//             </span>
//           </div>
//           <p className="text-xs text-muted-foreground mb-4">
//             * Profit is based on the extracted amount from the <strong>defense simulation</strong> (if available), otherwise from the no‑defense scenario.
//           </p>
//           <div className="space-y-4">
//             {data.recommendations.map((rec, idx) => (
//               <div key={idx} className="p-4 bg-secondary/20 rounded-lg border border-border">
//                 <div className="flex items-center justify-between mb-2">
//                   <span className="text-muted-foreground">{rec.attackType} ROI</span>
//                   <span
//                     className={`text-2xl font-bold ${
//                       rec.roi > 1000
//                         ? 'text-success'
//                         : rec.roi > 300
//                         ? 'text-warning'
//                         : 'text-muted-foreground'
//                     }`}
//                   >
//                     {rec.roi}%
//                   </span>
//                 </div>
//                 <div className="text-xs text-muted-foreground">
//                   Cost: {rec.cost} → Profit: {rec.profit}
//                 </div>
//               </div>
//             ))}
//             <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
//               <div className="mb-2 text-sm text-primary">Recommended Defense Investment</div>
//               <div className="flex items-center justify-between mb-1">
//                 <span className="text-muted-foreground text-sm">Investment:</span>
//                 <span className="font-bold">2.5 ETH/month</span>
//               </div>
//               <div className="flex items-center justify-between">
//                 <span className="text-muted-foreground text-sm">Expected Savings:</span>
//                 <span className="font-bold text-success">250 ETH</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
// import { useState } from 'react';
// import { Download, Loader2 } from 'lucide-react';
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
//   RadarChart,
//   PolarGrid,
//   PolarAngleAxis,
//   PolarRadiusAxis,
//   Radar,
// } from 'recharts';

// import { useComparisonData } from '../../hooks/useComparisonData';

// const scenarios = ['A', 'B', 'C', 'D', 'E'];

// const attackTypes = [
//   'Flash Loan Attack',
//   'Whale Manipulation',
//   'Proposal Spam',
//   'Quorum Manipulation',
//   'Timelock Exploit',
// ];

// // ===== ETH parser =====
// const parseETH = (v?: string) => {
//   try {
//     if (!v) return 0;
//     return Number(BigInt(v)) / 1e18;
//   } catch {
//     return 0;
//   }
// };

// export function Comparison() {
//   const [scenario, setScenario] = useState('A');

//   // ⚠️ 保持你的 hook（你可以后面再扩展 filter）
//   const { data, loading, error } = useComparisonData(scenario);

//   // ================= loading =================
//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-96">
//         <Loader2 className="animate-spin text-primary w-8 h-8" />
//         <span className="ml-2 text-muted-foreground">
//           Loading comparison data...
//         </span>
//       </div>
//     );
//   }

//   // ================= error =================
//   if (error || !data) {
//     return (
//       <div className="bg-card rounded-lg p-6 border border-border text-center text-destructive">
//         <p>{error || 'Failed to load data'}</p>
//         <button
//           onClick={() => window.location.reload()}
//           className="mt-4 px-4 py-2 bg-primary rounded"
//         >
//           Retry
//         </button>
//       </div>
//     );
//   }

//   // ================= summary cards =================
//   const summaryCards = scenarios.map((s) => {
//     const no = data.scenarios?.[s]?.noDefense?.summary?.successRate ?? 0;
//     const def = data.scenarios?.[s]?.defense?.summary?.successRate ?? 0;

//     const total = Math.round((no + def) / 2);

//     return (
//       <div key={s} className="p-4 border rounded bg-card">
//         <div className="font-bold">Scenario {s}</div>
//         <div>No Defense: {no}%</div>
//         <div>With Defense: {def}%</div>
//         <div className="text-primary font-semibold">
//           Overall: {total}%
//         </div>
//       </div>
//     );
//   });

//   // ================= matrix =================
//   const matrix = attackTypes.map((attack) => (
//     <tr key={attack} className="border-b">
//       <td className="p-2 font-medium">{attack}</td>

//       {scenarios.map((s) => {
//         const no = data.scenarios?.[s]?.noDefense?.attacks?.find(
//           (a) => a.name === attack
//         );

//         const def = data.scenarios?.[s]?.defense?.attacks?.find(
//           (a) => a.name === attack
//         );

//         return (
//           <>
//             <td key={s + attack + 'no'} className="text-center">
//               {no?.succeeded ? '✅' : '❌'}
//             </td>

//             <td key={s + attack + 'def'} className="text-center">
//               {def ? (def.succeeded ? '✅' : '❌') : '—'}
//             </td>
//           </>
//         );
//       })}
//     </tr>
//   ));

//   // ================= cost / profit =================
//   const costCards = scenarios.map((s) => {
//     const no = data.scenarios?.[s]?.noDefense?.attacks || [];
//     const def = data.scenarios?.[s]?.defense?.attacks || [];

//     const noProfit = no.reduce((sum, a) => sum + parseETH(a.amountExtracted), 0);
//     const defProfit = def.reduce((sum, a) => sum + parseETH(a.amountExtracted), 0);

//     const successNo =
//       data.scenarios?.[s]?.noDefense?.summary?.successRate ?? 0;
//     const successDef =
//       data.scenarios?.[s]?.defense?.summary?.successRate ?? 0;

//     return (
//       <div key={s} className="p-4 border rounded">
//         <div className="font-bold mb-2">Scenario {s}</div>
//         <div>No Defense Profit: {noProfit.toFixed(2)} ETH</div>
//         <div>With Defense Profit: {defProfit.toFixed(2)} ETH</div>
//         <div className="text-sm text-muted-foreground mt-2">
//           Success: {successNo}% → {successDef}%
//         </div>
//       </div>
//     );
//   });

//   // ================= UI =================
//   return (
//     <div className="space-y-6">

//       {/* ===== Filter bar (保持原风格) ===== */}
//       <div className="bg-card rounded-lg p-4 border border-border shadow-lg">
//         <div className="flex items-center justify-between">

//           <div className="flex items-center gap-4">

//             <select
//               value={scenario}
//               onChange={(e) => setScenario(e.target.value)}
//               className="bg-secondary border border-border rounded-lg px-4 py-2 text-sm"
//             >
//               <option value="A">Scenario A</option>
//               <option value="B">Scenario B</option>
//               <option value="C">Scenario C</option>
//               <option value="D">Scenario D</option>
//               <option value="E">Scenario E</option>
//             </select>

//           </div>

//           <button className="flex items-center gap-2 bg-primary px-4 py-2 rounded-lg">
//             <Download className="w-4 h-4" />
//             Export
//           </button>

//         </div>
//       </div>

//       {/* ===== summary ===== */}
//       <div className="grid grid-cols-5 gap-4">
//         {summaryCards}
//       </div>

//       {/* ===== matrix (原风格保留) ===== */}
//       <div className="bg-card p-4 border rounded">
//         <table className="w-full">
//           <thead>
//             <tr>
//               <th>Attack</th>

//               {scenarios.map((s) => (
//                 <>
//                   <th key={s + 'n'}>{s} No</th>
//                   <th key={s + 'd'}>{s} Def</th>
//                 </>
//               ))}
//             </tr>
//           </thead>

//           <tbody>{matrix}</tbody>
//         </table>
//       </div>

//       {/* ===== cost ===== */}
//       <div className="grid grid-cols-5 gap-4">
//         {costCards}
//       </div>

//     </div>
//   );
// }

import { useState } from 'react';
import {
  Download,
  Loader2,
  Shield,
  Skull,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CheckCircle2,
  XCircle,
  BarChart3,
  AlertCircle,
  Zap,
  Ship,
  MailWarning,
  Scale,
  Clock,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

import { useComparisonData } from '../../hooks/useComparisonData';

const scenarios = ['A', 'B', 'C', 'D', 'E'];

const attackTypes = [
  'Flash Loan Attack',
  'Whale Manipulation',
  'Proposal Spam',
  'Quorum Manipulation',
  'Timelock Exploit',
];

// Attack type to icon mapping
const attackIcons: Record<string, React.ReactNode> = {
  'Flash Loan Attack': <Zap className="w-4 h-4 text-yellow-500" />,
  'Whale Manipulation': <Ship className="w-4 h-4 text-blue-500" />,
  'Proposal Spam': <MailWarning className="w-4 h-4 text-orange-500" />,
  'Quorum Manipulation': <Scale className="w-4 h-4 text-purple-500" />,
  'Timelock Exploit': <Clock className="w-4 h-4 text-red-500" />,
};

// ===== ETH parser =====
const parseETH = (v?: string) => {
  try {
    if (!v) return 0;
    return Number(BigInt(v)) / 1e18;
  } catch {
    return 0;
  }
};

// Helper to get attack cost (mock from attackCostsETH but could be extended)
const getAttackCost = (attackName: string): number => {
  const costs: Record<string, number> = {
    'Flash Loan Attack': 0.17,
    'Whale Manipulation': 1350,
    'Proposal Spam': 0.04,
    'Quorum Manipulation': 0.2,
    'Timelock Exploit': 2.0,
  };
  return costs[attackName] || 0;
};

export function Comparison() {
  const [scenario, setScenario] = useState('A');

  const { data, loading, error } = useComparisonData();

  // ================= loading =================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
        <span className="ml-2 text-muted-foreground">
          Loading comparison data...
        </span>
      </div>
    );
  }

  // ================= error =================
  if (error || !data) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border text-center text-destructive">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
        <p>{error || 'Failed to load data'}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-primary rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  // Prepare radar chart data for selected scenario
  const selectedScenarioData = data.scenarios?.[scenario];
  const radarData = attackTypes.map((attack) => {
    const noDefenseAttack = selectedScenarioData?.noDefense?.attacks?.find(
      (a) => a.name === attack
    );
    const defenseAttack = selectedScenarioData?.defense?.attacks?.find(
      (a) => a.name === attack
    );
    return {
      attack,
      noDefense: noDefenseAttack?.succeeded ? 100 : 0,
      defense: defenseAttack?.succeeded ? 100 : 0,
    };
  });

  // Prepare bar chart data for all scenarios (total extracted ETH)
  const barChartData = scenarios.map((s) => {
    const noDefenseAttacks = data.scenarios?.[s]?.noDefense?.attacks || [];
    const defenseAttacks = data.scenarios?.[s]?.defense?.attacks || [];
    const noDefenseTotal = noDefenseAttacks.reduce(
      (sum, a) => sum + parseETH(a.amountExtracted),
      0
    );
    const defenseTotal = defenseAttacks.reduce(
      (sum, a) => sum + parseETH(a.amountExtracted),
      0
    );
    return {
      scenario: s,
      'No Defense': Number(noDefenseTotal.toFixed(2)),
      'With Defense': Number(defenseTotal.toFixed(2)),
    };
  });

  // ================= summary cards with icons =================
  const summaryCards = scenarios.map((s) => {
    const no = data.scenarios?.[s]?.noDefense?.summary?.successRate ?? 0;
    const def = data.scenarios?.[s]?.defense?.summary?.successRate ?? 0;
    const total = Math.round((no + def) / 2);
    const isImproved = def > no;
    const change = def - no;
    const isSelected = s === scenario;

    return (
      <div
        key={s}
        className={`p-4 border rounded-xl transition-all ${
          isSelected
            ? 'ring-2 ring-primary shadow-lg bg-gradient-to-br from-primary/5 to-transparent'
            : 'bg-card hover:shadow-md'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="font-bold text-lg">Scenario {s}</div>
          {isSelected && <div className="text-xs bg-primary/20 px-2 py-0.5 rounded-full">Active</div>}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Skull className="w-4 h-4 text-red-500" />
              <span>No Defense</span>
            </div>
            <span className="font-mono font-semibold">{no}%</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-green-500" />
              <span>With Defense</span>
            </div>
            <span className="font-mono font-semibold">{def}%</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-1 text-sm font-semibold">
              <DollarSign className="w-4 h-4" />
              <span>Overall</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-mono font-bold">{total}%</span>
              {change !== 0 && (
                <div className={`flex items-center text-xs ${isImproved ? 'text-green-600' : 'text-red-600'}`}>
                  {isImproved ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{Math.abs(change)}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  });

  // ================= matrix with tooltips and icons =================
  const matrix = attackTypes.map((attack) => (
    <tr key={attack} className="border-b hover:bg-muted/30 transition-colors">
      <td className="p-3 font-medium">
        <div className="flex items-center gap-2">
          {attackIcons[attack]}
          <span>{attack}</span>
          <span className="text-xs text-muted-foreground ml-2">
            (cost: {getAttackCost(attack)} ETH)
          </span>
        </div>
      </td>

      {scenarios.map((s) => {
        const no = data.scenarios?.[s]?.noDefense?.attacks?.find(
          (a) => a.name === attack
        );
        const def = data.scenarios?.[s]?.defense?.attacks?.find(
          (a) => a.name === attack
        );

        const noAmount = parseETH(no?.amountExtracted);
        const defAmount = parseETH(def?.amountExtracted);

        return (
          <>
            <td
              key={s + attack + 'no'}
              className="text-center p-2"
              title={no?.succeeded ? `Success • Extracted: ${noAmount.toFixed(4)} ETH` : `Failed • Extracted: 0 ETH`}
            >
              {no?.succeeded ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 inline" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 inline" />
              )}
            </td>

            <td
              key={s + attack + 'def'}
              className="text-center p-2"
              title={def?.succeeded ? `Defense active • Extracted: ${defAmount.toFixed(4)} ETH` : `Defense blocked • Extracted: 0 ETH`}
            >
              {def ? (
                def.succeeded ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 inline" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500 inline" />
                )
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </td>
          </>
        );
      })}
    </tr>
  ));

  // ================= cost / profit cards with enhanced visuals =================
  const costCards = scenarios.map((s) => {
    const no = data.scenarios?.[s]?.noDefense?.attacks || [];
    const def = data.scenarios?.[s]?.defense?.attacks || [];

    const noProfit = no.reduce((sum, a) => sum + parseETH(a.amountExtracted), 0);
    const defProfit = def.reduce((sum, a) => sum + parseETH(a.amountExtracted), 0);

    const successNo = data.scenarios?.[s]?.noDefense?.summary?.successRate ?? 0;
    const successDef = data.scenarios?.[s]?.defense?.summary?.successRate ?? 0;

    const profitChange = defProfit - noProfit;
    const isProfitReduced = profitChange < 0;
    const successChange = successDef - successNo;

    return (
      <div
        key={s}
        className={`p-4 border rounded-xl bg-gradient-to-br from-card to-background transition-all hover:shadow-md ${
          s === scenario ? 'ring-1 ring-primary/50' : ''
        }`}
      >
        <div className="font-bold text-lg mb-3 flex items-center justify-between">
          <span>Scenario {s}</span>
          <DollarSign className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1 text-sm">
              <Skull className="w-3 h-3" />
              <span>No Defense:</span>
            </div>
            <span className="font-mono font-medium">{noProfit.toFixed(2)} ETH</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1 text-sm">
              <Shield className="w-3 h-3" />
              <span>With Defense:</span>
            </div>
            <span className="font-mono font-medium">{defProfit.toFixed(2)} ETH</span>
          </div>
          <div className="flex justify-between items-center text-sm pt-1 border-t">
            <span>Profit Δ:</span>
            <span className={`font-mono ${isProfitReduced ? 'text-green-600' : 'text-red-600'}`}>
              {profitChange > 0 ? '+' : ''}{profitChange.toFixed(2)} ETH
            </span>
          </div>
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <span>Success:</span>
              <span>{successNo}%</span>
              {successChange !== 0 && (
                <div className={`flex items-center ${successChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {successChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{Math.abs(successChange)}%</span>
                </div>
              )}
            </div>
            <span>→ {successDef}%</span>
          </div>
        </div>
      </div>
    );
  });

  // ================= UI =================
  return (
    <div className="space-y-8">

      {/* ===== Filter bar with enhanced styling ===== */}
      <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              className="bg-secondary border border-border rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {scenarios.map(s => (
                <option key={s} value={s}>Scenario {s}</option>
              ))}
            </select>
            <div className="hidden md:block text-xs text-muted-foreground">
              Radar chart & active highlight based on selection
            </div>
          </div>

          <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 transition-colors px-4 py-2 rounded-lg text-primary-foreground">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* ===== summary section ===== */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Success Rate Overview</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {summaryCards}
        </div>
      </div>

      {/* ===== Radar Chart for selected scenario ===== */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Radar className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Attack Resilience: Scenario {scenario}</h2>
          <span className="text-xs text-muted-foreground ml-2">(Success rate per attack type)</span>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="attack" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Radar
                name="No Defense"
                dataKey="noDefense"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.3}
              />
              <Radar
                name="With Defense"
                dataKey="defense"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.3}
              />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                formatter={(value: number) => [`${value}%`, 'Success Rate']}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ===== Bar Chart: Extracted ETH per scenario ===== */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Total Extracted Value (ETH)</h2>
          <span className="text-xs text-muted-foreground">Per scenario comparison</span>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="scenario" stroke="hsl(var(--foreground))" />
              <YAxis stroke="hsl(var(--foreground))" tickFormatter={(value) => `${value} ETH`} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                formatter={(value: number) => [`${value.toFixed(2)} ETH`, '']}
              />
              <Legend />
              <Bar dataKey="No Defense" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="With Defense" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ===== Attack Success Matrix ===== */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b bg-muted/20">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Attack Success Matrix</h2>
            <span className="text-xs text-muted-foreground">✅ Success | ❌ Blocked/Failed</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr>
                <th className="p-3 text-left">Attack Type</th>
                {scenarios.map((s) => (
                  <>
                    <th key={s + 'n'} className="p-2 text-center font-medium">
                      <div className="flex items-center justify-center gap-1">
                        <Skull className="w-3 h-3" /> {s}
                      </div>
                    </th>
                    <th key={s + 'd'} className="p-2 text-center font-medium">
                      <div className="flex items-center justify-center gap-1">
                        <Shield className="w-3 h-3" /> {s}
                      </div>
                    </th>
                  </>
                ))}
              </tr>
            </thead>
            <tbody>{matrix}</tbody>
          </table>
        </div>
      </div>

      {/* ===== Profit & Loss Cards ===== */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Financial Impact (ETH extracted)</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {costCards}
        </div>
      </div>

    </div>
  );
}
// import { useComparisonData } from '../../hooks/useComparisonData';
// import { Loader2 } from 'lucide-react';

// const scenarios = ['A', 'B', 'C', 'D', 'E'];
// const attackTypes = [
//   'Flash Loan Attack',
//   'Whale Manipulation',
//   'Proposal Spam',
//   'Quorum Manipulation',
//   'Timelock Exploit',
// ];

// const parseETH = (v: string) => {
//   try {
//     return Number(BigInt(v)) / 1e18;
//   } catch {
//     return 0;
//   }
// };

// export function Comparison() {
//   const { data, loading, error } = useComparisonData();

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-96">
//         <Loader2 className="animate-spin w-8 h-8" />
//       </div>
//     );
//   }

//   if (!data || error) {
//     return (
//       <div className="text-red-500 p-6">
//         Failed to load data
//       </div>
//     );
//   }

//     const summaryCards = scenarios.map((s) => {
//     const noDef = data.scenarios[s]?.noDefense?.summary?.successRate ?? 0;
//     const def = data.scenarios[s]?.defense?.summary?.successRate ?? 0;

//     return (
//       <div key={s} className="p-4 border rounded bg-card">
//         <div className="font-bold">Scenario {s}</div>
//         <div>No Defense: {noDef}%</div>
//         <div>With Defense: {def}%</div>
//       </div>
//     );
//   });

//     const matrix = attackTypes.map((attack) => (
//     <tr key={attack} className="border-b">
//       <td className="p-2">{attack}</td>

//       {scenarios.map((s) => {
//         const no = data.scenarios[s]?.noDefense?.attacks?.find(
//           (a) => a.name === attack
//         );

//         const def = data.scenarios[s]?.defense?.attacks?.find(
//           (a) => a.name === attack
//         );

//         return (
//           <>
//             <td className="text-center">
//               {no?.succeeded ? '✅' : '❌'}
//             </td>

//             <td className="text-center">
//               {def ? (def.succeeded ? '✅' : '❌') : '—'}
//             </td>
//           </>
//         );
//       })}
//     </tr>
//   ));

//     const costCards = scenarios.map((s) => {
//     const no = data.scenarios[s]?.noDefense?.attacks || [];
//     const def = data.scenarios[s]?.defense?.attacks || [];

//     const noProfit = no.reduce((sum, a) => sum + parseETH(a.amountExtracted), 0);
//     const defProfit = def.reduce((sum, a) => sum + parseETH(a.amountExtracted), 0);

//     return (
//       <div key={s} className="p-4 border rounded">
//         <div>Scenario {s}</div>
//         <div>No Defense Profit: {noProfit.toFixed(2)}</div>
//         <div>With Defense Profit: {defProfit.toFixed(2)}</div>
//       </div>
//     );
//   });

//     return (
//     <div className="space-y-6">

//       {/* 1. 总览 */}
//       <div className="grid grid-cols-5 gap-4">
//         {summaryCards}
//       </div>

//       {/* 2. Matrix */}
//       <div className="bg-card p-4 border rounded">
//         <table className="w-full">
//           <thead>
//             <tr>
//               <th>Attack</th>
//               {scenarios.map((s) => (
//                 <>
//                   <th key={s + 'n'}>{s} No</th>
//                   <th key={s + 'd'}>{s} Def</th>
//                 </>
//               ))}
//             </tr>
//           </thead>

//           <tbody>{matrix}</tbody>
//         </table>
//       </div>

//       {/* 3. Cost / Profit */}
//       <div className="grid grid-cols-5 gap-4">
//         {costCards}
//       </div>

//     </div>
//   );
// }


// import { useState } from 'react';
// import { Download, Loader2 } from 'lucide-react';
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
//   RadarChart,
//   PolarGrid,
//   PolarAngleAxis,
//   PolarRadiusAxis,
//   Radar,
// } from 'recharts';
// import { useComparisonData } from '../../hooks/useComparisonData';

// export function Comparison() {
//   const [attackType, setAttackType] = useState('all');
//   const [timeRange, setTimeRange] = useState('7d');
//   const [sort, setSort] = useState('success');
//   const { data, loading, error } = useComparisonData(attackType, timeRange, sort);

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-96">
//         <Loader2 className="animate-spin text-primary w-8 h-8" />
//         <span className="ml-2 text-muted-foreground">Loading comparison data...</span>
//       </div>
//     );
//   }

//   if (error || !data) {
//     return (
//       <div className="bg-card rounded-lg p-6 border border-border text-center text-destructive">
//         <p>{error || 'Failed to load data'}</p>
//         <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-primary rounded">
//           Retry
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Filter Bar */}
//       <div className="bg-card rounded-lg p-4 border border-border shadow-lg">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-4">
//             <select
//               value={attackType}
//               onChange={(e) => setAttackType(e.target.value)}
//               className="bg-secondary border border-border rounded-lg px-4 py-2 text-sm"
//             >
//               <option value="all">Attack Type: All</option>
//               <option value="flashloan">Flash Loan</option>
//               <option value="whale">Whale Manipulation</option>
//               <option value="spam">Proposal Spam</option>
//               <option value="quorum">Quorum Manipulation</option>
//               <option value="timelock">Timelock Exploit</option>
//             </select>
//             <select
//               value={timeRange}
//               onChange={(e) => setTimeRange(e.target.value)}
//               className="bg-secondary border border-border rounded-lg px-4 py-2 text-sm"
//             >
//               <option value="1d">Time Range: Last 24 Hours</option>
//               <option value="7d">Last 7 Days</option>
//               <option value="30d">Last 30 Days</option>
//             </select>
//             <select
//               value={sort}
//               onChange={(e) => setSort(e.target.value)}
//               className="bg-secondary border border-border rounded-lg px-4 py-2 text-sm"
//             >
//               <option value="success">Sort: Success Rate</option>
//               <option value="cost">Attack Cost</option>
//               <option value="time">Time</option>
//             </select>
//           </div>
//           <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors">
//             <Download className="w-4 h-4" />
//             Export Report
//           </button>
//         </div>
//       </div>

//       {/* Attack Success Rate Matrix */}
//       <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//         <h2 className="mb-6">Attack Success Rate Comparison Matrix</h2>
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead>
//               <tr className="border-b border-border">
//                 <th className="text-left p-4 text-muted-foreground"></th>
//                 {data.matrix.map((row) => (
//                   <th key={row.attackType} className="text-center p-4 text-muted-foreground">
//                     {row.attackType}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {/* No Defense Row */}
//               <tr className="border-b border-border hover:bg-secondary/20">
//                 <td className="p-4 text-muted-foreground">No Defense</td>
//                 {data.matrix.map((row) => (
//                   <td key={row.attackType} className="text-center p-4">
//                     <span
//                       className={`inline-block px-3 py-1 rounded ${
//                         row.noDefense > 80
//                           ? 'bg-destructive/20 text-destructive'
//                           : row.noDefense > 60
//                           ? 'bg-warning/20 text-warning'
//                           : 'bg-success/20 text-success'
//                       }`}
//                     >
//                       {row.noDefense}%
//                     </span>
//                   </td>
//                 ))}
//               </tr>
//               {/* Basic Defense Row */}
//               <tr className="border-b border-border hover:bg-secondary/20">
//                 <td className="p-4 text-muted-foreground">Basic Defense</td>
//                 {data.matrix.map((row) => (
//                   <td key={row.attackType} className="text-center p-4">
//                     <span className="inline-block bg-warning/20 text-warning px-3 py-1 rounded">
//                       {row.basicDefense}%
//                     </span>
//                   </td>
//                 ))}
//               </tr>
//               {/* Enhanced Defense Row */}
//               <tr className="hover:bg-secondary/20">
//                 <td className="p-4 text-muted-foreground">Enhanced Defense</td>
//                 {data.matrix.map((row) => (
//                   <td key={row.attackType} className="text-center p-4">
//                     <span className="inline-block bg-success/20 text-success px-3 py-1 rounded">
//                       {row.enhancedDefense}%
//                     </span>
//                   </td>
//                 ))}
//               </tr>
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Cost-Benefit Analysis Chart */}
//       <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//         <h2 className="mb-6">Cost-Benefit Analysis</h2>
//         <ResponsiveContainer width="100%" height={300}>
//           <BarChart data={data.costBenefit}>
//             <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
//             <XAxis dataKey="name" stroke="#94A3B8" />
//             <YAxis
//               yAxisId="left"
//               orientation="left"
//               stroke="#94A3B8"
//               label={{ value: 'Cost (ETH)', angle: -90, position: 'insideLeft', fill: '#94A3B8' }}
//             />
//             <YAxis
//               yAxisId="right"
//               orientation="right"
//               stroke="#94A3B8"
//               label={{ value: 'Success Rate (%)', angle: 90, position: 'insideRight', fill: '#94A3B8' }}
//             />
//             <Tooltip
//               contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
//               labelStyle={{ color: '#F8FAFC' }}
//             />
//             <Legend />
//             <Bar yAxisId="left" dataKey="cost" fill="#3B82F6" name="Attack Cost (ETH)" />
//             <Bar yAxisId="right" dataKey="success" fill="#10B981" name="Success Rate (%)" />
//           </BarChart>
//         </ResponsiveContainer>
//       </div>

//       {/* Bottom Row */}
//       <div className="grid grid-cols-2 gap-6">
//         {/* Defense Radar Chart */}
//         <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//           <h3 className="mb-6">Defense Effectiveness Radar</h3>
//           <ResponsiveContainer width="100%" height={300}>
//             <RadarChart data={data.radar}>
//               <PolarGrid stroke="#334155" />
//               <PolarAngleAxis dataKey="subject" stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 12 }} />
//               <PolarRadiusAxis stroke="#94A3B8" domain={[0, 100]} />
//               <Radar name="Defense Effect" dataKey="value" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
//               <Tooltip
//                 contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
//               />
//             </RadarChart>
//           </ResponsiveContainer>
//         </div>

//         {/* ROI Analysis */}
//         <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//           <h3 className="mb-6">ROI Analysis Cards</h3>
//           <div className="space-y-4">
//             {data.recommendations.map((rec, idx) => (
//               <div key={idx} className="p-4 bg-secondary/20 rounded-lg border border-border">
//                 <div className="flex items-center justify-between mb-2">
//                   <span className="text-muted-foreground">{rec.attackType} ROI</span>
//                   <span
//                     className={`text-2xl font-bold ${
//                       rec.roi > 1000
//                         ? 'text-success'
//                         : rec.roi > 300
//                         ? 'text-warning'
//                         : 'text-muted-foreground'
//                     }`}
//                   >
//                     {rec.roi}%
//                   </span>
//                 </div>
//                 <div className="text-xs text-muted-foreground">
//                   Cost: {rec.cost} → Profit: {rec.profit}
//                 </div>
//               </div>
//             ))}
//             <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
//               <div className="mb-2 text-sm text-primary">Recommended Defense Investment</div>
//               <div className="flex items-center justify-between mb-1">
//                 <span className="text-muted-foreground text-sm">Investment:</span>
//                 <span className="font-bold">2.5 ETH/month</span>
//               </div>
//               <div className="flex items-center justify-between">
//                 <span className="text-muted-foreground text-sm">Expected Savings:</span>
//                 <span className="font-bold text-success">250 ETH</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }