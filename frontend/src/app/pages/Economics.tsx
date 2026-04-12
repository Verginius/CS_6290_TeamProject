// import { useState, useEffect } from 'react';
// import { PlayCircle, Database, RefreshCw, AlertCircle } from 'lucide-react';
// import {
//   PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
//   BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
//   LineChart, Line
// } from 'recharts';
// import { Link } from 'react-router-dom';

// const STORAGE_KEY = 'last_attack_metrics';

// export function Economics() {
//   const [metrics, setMetrics] = useState<{ attackCost: number; gasUsed: number } | null>(null);
//   const [loading, setLoading] = useState(true);

//   const loadFromStorage = () => {
//     const raw = localStorage.getItem(STORAGE_KEY);
//     if (raw) {
//       try {
//         const parsed = JSON.parse(raw);
//         const attackCost = parseFloat(parsed.attackCost);
//         const gasUsed = parseFloat(parsed.gasUsed);
//         if (!isNaN(attackCost) && attackCost > 0 && !isNaN(gasUsed) && gasUsed > 0) {
//           setMetrics({ attackCost, gasUsed });
//           setLoading(false);
//           return;
//         }
//       } catch (e) {}
//     }
//     setMetrics(null);
//     setLoading(false);
//   };

//   useEffect(() => {
//     loadFromStorage();
//     // 监听其他标签页的 storage 事件，实现跨标签页同步
//     const handleStorageChange = (e: StorageEvent) => {
//       if (e.key === STORAGE_KEY) {
//         loadFromStorage();
//       }
//     };
//     window.addEventListener('storage', handleStorageChange);
//     return () => window.removeEventListener('storage', handleStorageChange);
//   }, []);

//   const handleRefresh = () => {
//     setLoading(true);
//     loadFromStorage();
//   };

//   // 用户可调参数
//   const [ethPrice, setEthPrice] = useState(3200);
//   const [inputEthPrice, setInputEthPrice] = useState('3200');
//   const [gasPriceGwei, setGasPriceGwei] = useState(50);
//   const [inputGasPrice, setInputGasPrice] = useState('50');

//   const effectiveGasCostETH = metrics ? (metrics.gasUsed * gasPriceGwei) / 1e9 : 0;
//   const totalAttackCost = metrics?.attackCost || 0;
//   const hasRealData = metrics !== null && totalAttackCost > 0;

//   // 成本构成
//   const costBreakdown = hasRealData
//     ? [
//         { name: 'Flash Loan Fee', value: 21, amount: totalAttackCost * 0.21, color: '#3B82F6' },
//         { name: 'Gas Fee', value: 54, amount: effectiveGasCostETH > 0 ? effectiveGasCostETH : totalAttackCost * 0.54, color: '#EF4444' },
//         { name: 'Token Slippage', value: 17, amount: totalAttackCost * 0.17, color: '#F59E0B' },
//         { name: 'Others', value: 8, amount: totalAttackCost * 0.08, color: '#94A3B8' },
//       ]
//     : [];

//   const targetFunds = 500; // 可根据实际需求调整
//   const expectedProfit = targetFunds - totalAttackCost;
//   const roi = (expectedProfit / totalAttackCost) * 100;

//   const breakEvenData = hasRealData
//     ? [0, totalAttackCost * 0.5, totalAttackCost, totalAttackCost * 1.5, totalAttackCost * 2, targetFunds].map(amount => ({
//         amount,
//         profit: amount - totalAttackCost,
//       }))
//     : [];

//   const sensitivityData = [
//     { param: 'Token Price -10%', impact: -8 },
//     { param: 'Token Price +10%', impact: 8 },
//     { param: 'Gas Price -20%', impact: -12 },
//     { param: 'Gas Price +20%', impact: 12 },
//     { param: 'Slippage -5%', impact: -4 },
//     { param: 'Slippage +5%', impact: 4 },
//   ];

//   const defenseROI = [
//     { name: 'Voting Delay', investment: 0.3, savings: 150 },
//     { name: 'Snapshot Voting', investment: 0.2, savings: 200 },
//     { name: 'Token Locking', investment: 0.8, savings: 400 },
//     { name: 'Dynamic Quorum', investment: 0.5, savings: 300 },
//     { name: 'Emergency Pause', investment: 1.0, savings: 600 },
//   ];
//   const totalInvestment = defenseROI.reduce((s, d) => s + d.investment, 0);
//   const totalSavings = defenseROI.reduce((s, d) => s + d.savings, 0);
//   const totalDefenseROI = (totalSavings / totalInvestment) * 100;

//   const formatETH = (value: number) => `${value.toFixed(2)} ETH`;
//   const formatUSD = (value: number) => `$${(value * ethPrice).toLocaleString()}`;

//   const handleEthPriceUpdate = () => setEthPrice(parseFloat(inputEthPrice));
//   const handleGasPriceUpdate = () => setGasPriceGwei(parseFloat(inputGasPrice));

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-96">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
//         <span className="ml-2">Loading economic data...</span>
//       </div>
//     );
//   }

//   if (!hasRealData) {
//     return (
//       <div className="flex flex-col items-center justify-center h-96 text-center">
//         <Database className="w-16 h-16 text-muted-foreground mb-4" />
//         <h2 className="text-xl font-semibold mb-2">No Attack Data Available</h2>
//         <p className="text-muted-foreground mb-4 max-w-md">
//           Please run an attack simulation first. After the simulation completes, return here and click the refresh button.
//         </p>
//         <div className="flex gap-4">
//           <Link
//             to="/attack"
//             className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg"
//           >
//             <PlayCircle className="w-5 h-5" />
//             Go to Attack Simulation
//           </Link>
//           <button
//             onClick={handleRefresh}
//             className="flex items-center gap-2 border border-border hover:bg-secondary px-6 py-3 rounded-lg"
//           >
//             <RefreshCw className="w-5 h-5" />
//             Refresh
//           </button>
//         </div>
//         <div className="mt-6 text-xs text-muted-foreground bg-card p-3 rounded-lg max-w-md">
//           <AlertCircle className="w-4 h-4 inline mr-1" />
//           Tip: Make sure you have run at least one simulation and that the attack cost is non-zero.
//           <br />
//           You can check localStorage key "{STORAGE_KEY}" in DevTools.
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* 参数栏 */}
//       <div className="bg-card rounded-lg p-4 border border-border shadow-lg">
//         <div className="flex flex-wrap items-center justify-between gap-4">
//           <div className="flex items-center gap-6">
//             <div className="flex items-center gap-2">
//               <span className="text-sm text-muted-foreground">ETH Price (USD):</span>
//               <input
//                 type="text"
//                 value={inputEthPrice}
//                 onChange={(e) => setInputEthPrice(e.target.value)}
//                 onBlur={handleEthPriceUpdate}
//                 className="bg-secondary border border-border rounded px-3 py-1 text-sm w-24"
//               />
//             </div>
//             <div className="flex items-center gap-2">
//               <span className="text-sm text-muted-foreground">Gas Price (Gwei):</span>
//               <input
//                 type="text"
//                 value={inputGasPrice}
//                 onChange={(e) => setInputGasPrice(e.target.value)}
//                 onBlur={handleGasPriceUpdate}
//                 className="bg-secondary border border-border rounded px-3 py-1 text-sm w-24"
//               />
//             </div>
//           </div>
//           <div className="flex items-center gap-3">
//             <div className="text-xs text-muted-foreground bg-secondary/30 px-3 py-1 rounded-full">
//               Last simulation data
//             </div>
//             <button
//               onClick={handleRefresh}
//               className="flex items-center gap-1 text-xs text-primary hover:underline"
//             >
//               <RefreshCw className="w-3 h-3" /> Refresh
//             </button>
//           </div>
//         </div>
//         <div className="mt-3 text-xs text-muted-foreground flex gap-4">
//           <span>⚡ Attack Cost: {totalAttackCost.toFixed(4)} ETH</span>
//           <span>🔥 Gas Used: {metrics.gasUsed.toLocaleString()}</span>
//         </div>
//       </div>

//       {/* Attack Cost Breakdown */}
//       <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//         <h2 className="mb-6">Attack Cost Breakdown</h2>
//         <div className="grid grid-cols-2 gap-8">
//           <div>
//             <ResponsiveContainer width="100%" height={250}>
//               <PieChart>
//                 <Pie
//                   data={costBreakdown}
//                   cx="50%" cy="50%" innerRadius={60} outerRadius={100}
//                   dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
//                 >
//                   {costBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
//                 </Pie>
//                 <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155' }} />
//               </PieChart>
//             </ResponsiveContainer>
//           </div>
//           <div className="flex flex-col justify-center">
//             <div className="text-center mb-6">
//               <div className="text-3xl font-bold mb-1">{formatETH(totalAttackCost)}</div>
//               <div className="text-muted-foreground text-sm">(≈ {formatUSD(totalAttackCost)})</div>
//             </div>
//             <div className="space-y-3">
//               {costBreakdown.map((item, idx) => (
//                 <div key={idx} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
//                   <div className="flex items-center gap-2">
//                     <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></div>
//                     <span className="text-sm">{item.name}:</span>
//                   </div>
//                   <div className="text-right">
//                     <div className="font-bold">{formatETH(item.amount)}</div>
//                     <div className="text-xs text-muted-foreground">({item.value}%)</div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* 三列卡片 */}
//       <div className="grid grid-cols-3 gap-6">
//         {/* ROI Calculator */}
//         <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//           <h3 className="mb-4 text-primary">ROI Calculator</h3>
//           <div className="space-y-4">
//             <div className="p-3 bg-secondary/20 rounded-lg flex justify-between">
//               <span className="text-sm text-muted-foreground">Target Funds:</span>
//               <span className="font-bold">{formatETH(targetFunds)}</span>
//             </div>
//             <div className="p-3 bg-secondary/20 rounded-lg flex justify-between">
//               <span className="text-sm text-muted-foreground">Attack Cost:</span>
//               <span className="font-bold text-destructive">{formatETH(totalAttackCost)}</span>
//             </div>
//             <div className="p-3 bg-success/10 rounded-lg border border-success/30 flex justify-between">
//               <span className="text-sm text-muted-foreground">Expected Profit:</span>
//               <span className="font-bold text-success">{formatETH(expectedProfit)}</span>
//             </div>
//             <div className="p-4 bg-primary/10 rounded-lg text-center">
//               <div className="text-xs text-muted-foreground">ROI</div>
//               <div className="text-3xl font-bold text-primary">{roi.toFixed(0)}%</div>
//             </div>
//           </div>
//         </div>

//         {/* Break-even Analysis */}
//         <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//           <h3 className="mb-4 text-warning">Break-even Analysis</h3>
//           <ResponsiveContainer width="100%" height={180}>
//             <LineChart data={breakEvenData}>
//               <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
//               <XAxis dataKey="amount" stroke="#94A3B8" tick={{ fontSize: 10 }} />
//               <YAxis stroke="#94A3B8" tick={{ fontSize: 10 }} />
//               <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155' }} />
//               <Line type="monotone" dataKey="profit" stroke="#F59E0B" strokeWidth={2} dot={{ fill: '#F59E0B' }} />
//             </LineChart>
//           </ResponsiveContainer>
//           <div className="mt-4 text-sm space-y-2">
//             <div className="flex justify-between">
//               <span className="text-muted-foreground">Break-even Point:</span>
//               <span className="font-bold">{breakEvenData.find(d => d.profit >= 0)?.amount?.toFixed(2) || 'N/A'} ETH</span>
//             </div>
//             <div className="flex justify-between">
//               <span className="text-muted-foreground">Current Target:</span>
//               <span className="text-success">{formatETH(targetFunds)}</span>
//             </div>
//             <div className="flex justify-between">
//               <span className="text-muted-foreground">Safety Margin:</span>
//               <span className="text-success">
//                 {((targetFunds - (breakEvenData.find(d => d.profit >= 0)?.amount || 0)) / (breakEvenData.find(d => d.profit >= 0)?.amount || 1) * 100).toFixed(0)}%
//               </span>
//             </div>
//           </div>
//         </div>

//         {/* Sensitivity Analysis */}
//         <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//           <h3 className="mb-4 text-success">Sensitivity Analysis</h3>
//           <div className="space-y-2">
//             {sensitivityData.map((item, i) => (
//               <div key={i} className="p-2 bg-secondary/20 rounded-lg">
//                 <div className="flex justify-between text-xs mb-1">
//                   <span className="text-muted-foreground">{item.param}</span>
//                   <span className={item.impact > 0 ? 'text-success' : 'text-destructive'}>
//                     {item.impact > 0 ? '+' : ''}{item.impact}%
//                   </span>
//                 </div>
//                 <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
//                   <div className={`h-full ${item.impact > 0 ? 'bg-success' : 'bg-destructive'}`}
//                        style={{ width: `${Math.abs(item.impact) * 5}%` }}></div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Defense Investment ROI */}
//       <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//         <h2 className="mb-6">Defense Investment ROI Analysis</h2>
//         <ResponsiveContainer width="100%" height={300}>
//           <BarChart data={defenseROI}>
//             <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
//             <XAxis dataKey="name" stroke="#94A3B8" />
//             <YAxis stroke="#94A3B8" />
//             <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155' }} />
//             <Legend />
//             <Bar dataKey="investment" fill="#EF4444" name="Investment (ETH/month)" />
//             <Bar dataKey="savings" fill="#10B981" name="Savings (ETH/month)" />
//           </BarChart>
//         </ResponsiveContainer>
//         <div className="mt-6 p-4 bg-success/10 rounded-lg text-center">
//           <div className="text-sm text-muted-foreground">Total Defense ROI</div>
//           <div className="text-4xl font-bold text-success">{totalDefenseROI.toFixed(0)}%</div>
//           <div className="text-xs text-muted-foreground mt-2">
//             Total Investment: {formatETH(totalInvestment)}/month → Total Savings: {formatETH(totalSavings)}/month
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

import { useState, useEffect, useMemo } from 'react';
import { PlayCircle, Database, RefreshCw, BarChart3, Trash2 } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line
} from 'recharts';
import { Link } from 'react-router-dom';

const SIMULATION_RESULTS_KEY = 'simulation_results';

interface SimulationResult {
  scenario: string;
  defenseEnabled: boolean;
  attackCost: string;
  gasUsed: string;
  successRate: number;
  totalExtracted: string;
  timestamp: number;
}

export function Economics() {
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // 加载并验证数据
  const loadResults = () => {
    const raw = localStorage.getItem(SIMULATION_RESULTS_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        // 过滤出有效的结果
        const validResults = parsed.filter((r: any) => 
          typeof r === 'object' &&
          r !== null &&
          typeof r.scenario === 'string' &&
          typeof r.defenseEnabled === 'boolean' &&
          typeof r.attackCost === 'string' &&
          typeof r.gasUsed === 'string' &&
          typeof r.successRate === 'number' &&
          typeof r.totalExtracted === 'string'
        );
        setResults(validResults);
        if (validResults.length > 0 && !selectedKey) {
          const first = validResults[0];
          setSelectedKey(`${first.scenario}-${first.defenseEnabled}`);
        }
      } catch (e) {
        console.error('Failed to parse simulation results', e);
        setResults([]);
      }
    } else {
      setResults([]);
    }
    setLoading(false);
  };

  // 清除所有数据
  const clearAllData = () => {
    localStorage.removeItem(SIMULATION_RESULTS_KEY);
    loadResults();
    setSelectedKey(null);
  };

  useEffect(() => {
    loadResults();
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SIMULATION_RESULTS_KEY) {
        loadResults();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    loadResults();
  };

  // 当前选中的结果
  const currentResult = useMemo(() => {
    if (!selectedKey) return null;
    const [scenario, defenseStr] = selectedKey.split('-');
    const defenseEnabled = defenseStr === 'true';
    return results.find(r => r.scenario === scenario && r.defenseEnabled === defenseEnabled) || null;
  }, [selectedKey, results]);

  // 所有场景的攻击成本对比数据
  const costComparisonData = useMemo(() => {
    const scenarios = ['A', 'B', 'C', 'D', 'E'];
    return scenarios.map(s => {
      const noDefense = results.find(r => r.scenario === s && !r.defenseEnabled);
      const withDefense = results.find(r => r.scenario === s && r.defenseEnabled);
      return {
        scenario: s,
        'No Defense': noDefense ? parseFloat(noDefense.attackCost) : 0,
        'With Defense': withDefense ? parseFloat(withDefense.attackCost) : 0,
      };
    });
  }, [results]);

  // 用户参数
  const [ethPrice, setEthPrice] = useState(2100);
  const [inputEthPrice, setInputEthPrice] = useState('3200');
  const [gasPriceGwei, setGasPriceGwei] = useState(50);
  const [inputGasPrice, setInputGasPrice] = useState('50');

  const totalAttackCost = currentResult ? parseFloat(currentResult.attackCost) : 0;
  const gasUsed = currentResult ? parseFloat(currentResult.gasUsed) : 0;
  const effectiveGasCostETH = gasUsed > 0 ? (gasUsed * gasPriceGwei) / 1e9 : 0;

  const costBreakdown = currentResult ? [
    { name: 'Flash Loan Fee', value: 21, amount: totalAttackCost * 0.21, color: '#3B82F6' },
    { name: 'Gas Fee', value: 54, amount: effectiveGasCostETH > 0 ? effectiveGasCostETH : totalAttackCost * 0.54, color: '#EF4444' },
    { name: 'Token Slippage', value: 17, amount: totalAttackCost * 0.17, color: '#F59E0B' },
    { name: 'Others', value: 8, amount: totalAttackCost * 0.08, color: '#94A3B8' },
  ] : [];

  const targetFunds = currentResult ? parseFloat(currentResult.totalExtracted) || 500 : 500;
  const expectedProfit = targetFunds - totalAttackCost;
  const roi = (expectedProfit / totalAttackCost) * 100;

  const breakEvenData = currentResult
    ? [0, totalAttackCost * 0.5, totalAttackCost, totalAttackCost * 1.5, totalAttackCost * 2, targetFunds].map(amount => ({
        amount,
        profit: amount - totalAttackCost,
      }))
    : [];

  const sensitivityData = [
    { param: 'Token Price -10%', impact: -8 },
    { param: 'Token Price +10%', impact: 8 },
    { param: 'Gas Price -20%', impact: -12 },
    { param: 'Gas Price +20%', impact: 12 },
    { param: 'Slippage -5%', impact: -4 },
    { param: 'Slippage +5%', impact: 4 },
  ];

  const defenseROI = [
    { name: 'Voting Delay', investment: 0.3, savings: 150 },
    { name: 'Snapshot Voting', investment: 0.2, savings: 200 },
    { name: 'Token Locking', investment: 0.8, savings: 400 },
    { name: 'Dynamic Quorum', investment: 0.5, savings: 300 },
    { name: 'Emergency Pause', investment: 1.0, savings: 600 },
  ];
  const totalInvestment = defenseROI.reduce((s, d) => s + d.investment, 0);
  const totalSavings = defenseROI.reduce((s, d) => s + d.savings, 0);
  const totalDefenseROI = (totalSavings / totalInvestment) * 100;

  const formatETH = (value: number) => `${value.toFixed(2)} ETH`;
  const formatUSD = (value: number) => `$${(value * ethPrice).toLocaleString()}`;

  const handleEthPriceUpdate = () => setEthPrice(parseFloat(inputEthPrice));
  const handleGasPriceUpdate = () => setGasPriceGwei(parseFloat(inputGasPrice));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading economic data...</span>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <Database className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Attack Simulation Data</h2>
        <p className="text-muted-foreground mb-4 max-w-md">
          Please run attack simulations for each scenario (A-E) with both No Defense and With Defense.
        </p>
        <div className="flex gap-4">
          <Link
            to="/attack"
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg"
          >
            <PlayCircle className="w-5 h-5" />
            Go to Attack Simulation
          </Link>
          <button
            onClick={clearAllData}
            className="flex items-center gap-2 border border-border hover:bg-secondary px-6 py-3 rounded-lg"
          >
            <Trash2 className="w-5 h-5" />
            Clear Storage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 参数栏 */}
      <div className="bg-card rounded-lg p-4 border border-border shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">ETH Price (USD):</span>
              <input
                type="text"
                value={inputEthPrice}
                onChange={(e) => setInputEthPrice(e.target.value)}
                onBlur={handleEthPriceUpdate}
                className="bg-secondary border border-border rounded px-3 py-1 text-sm w-24"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Gas Price (Gwei):</span>
              <input
                type="text"
                value={inputGasPrice}
                onChange={(e) => setInputGasPrice(e.target.value)}
                onBlur={handleGasPriceUpdate}
                className="bg-secondary border border-border rounded px-3 py-1 text-sm w-24"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-muted-foreground bg-secondary/30 px-3 py-1 rounded-full">
              {results.length} simulations stored
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
            <button
              onClick={clearAllData}
              className="flex items-center gap-1 text-xs text-destructive hover:underline"
            >
              <Trash2 className="w-3 h-3" /> Clear all
            </button>
          </div>
        </div>
      </div>

      {/* 攻击成本对比 */}
      <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
        <h2 className="mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Attack Cost per Scenario (ETH)
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={costComparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="scenario" stroke="#94A3B8" />
            <YAxis stroke="#94A3B8" />
            <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155' }} />
            <Legend />
            <Bar dataKey="No Defense" fill="#EF4444" />
            <Bar dataKey="With Defense" fill="#10B981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 详细分析 */}
      <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2>Detailed Economic Analysis</h2>
          <select
            value={selectedKey || ''}
            onChange={(e) => setSelectedKey(e.target.value)}
            className="bg-secondary border border-border rounded px-3 py-1.5 text-sm"
          >
            {results.map(r => {
              const key = `${r.scenario}-${r.defenseEnabled}`;
              return (
                <option key={key} value={key}>
                  Scenario {r.scenario} - {r.defenseEnabled ? 'With Defense' : 'No Defense'}
                </option>
              );
            })}
          </select>
        </div>

        {currentResult ? (
          <>
            <div className="grid grid-cols-2 gap-8 mb-6">
              <div>
                <h3 className="text-sm text-muted-foreground mb-2">Attack Metrics</h3>
                <div className="space-y-2">
                  <div className="flex justify-between"><span>Attack Cost:</span><span className="font-mono">{formatETH(totalAttackCost)}</span></div>
                  <div className="flex justify-between"><span>Gas Used:</span><span className="font-mono">{gasUsed.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Success Rate:</span><span className="font-mono">{currentResult.successRate}%</span></div>
                  <div className="flex justify-between"><span>Total Extracted:</span><span className="font-mono">{formatETH(parseFloat(currentResult.totalExtracted))}</span></div>
                </div>
              </div>
              <div>
                <h3 className="text-sm text-muted-foreground mb-2">ROI Analysis</h3>
                <div className="space-y-2">
                  <div className="flex justify-between"><span>Target Funds:</span><span className="font-mono">{formatETH(targetFunds)}</span></div>
                  <div className="flex justify-between"><span>Expected Profit:</span><span className="font-mono text-success">{formatETH(expectedProfit)}</span></div>
                  <div className="flex justify-between"><span>ROI:</span><span className="font-mono text-primary">{roi.toFixed(0)}%</span></div>
                </div>
              </div>
            </div>

            {/* 成本构成 */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={costBreakdown}
                      cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                      dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {costBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {costBreakdown.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm">{item.name}:</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatETH(item.amount)}</div>
                      <div className="text-xs text-muted-foreground">({item.value}%)</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 盈亏平衡 */}
            <div className="mt-6">
              <h3 className="mb-2 text-warning">Break-even Analysis</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={breakEvenData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="amount" stroke="#94A3B8" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#94A3B8" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155' }} />
                  <Line type="monotone" dataKey="profit" stroke="#F59E0B" strokeWidth={2} dot={{ fill: '#F59E0B' }} />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-2 text-sm">
                <div className="flex justify-between">
                  <span>Break-even Point:</span>
                  <span className="font-bold">{breakEvenData.find(d => d.profit >= 0)?.amount?.toFixed(2) || 'N/A'} ETH</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-muted-foreground">Select a simulation to view details</div>
        )}
      </div>

      {/* 敏感性分析
      <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
        <h2 className="mb-4 text-success">Sensitivity Analysis</h2>
        <div className="space-y-2">
          {sensitivityData.map((item, i) => (
            <div key={i} className="p-2 bg-secondary/20 rounded-lg">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">{item.param}</span>
                <span className={item.impact > 0 ? 'text-success' : 'text-destructive'}>
                  {item.impact > 0 ? '+' : ''}{item.impact}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className={`h-full ${item.impact > 0 ? 'bg-success' : 'bg-destructive'}`}
                     style={{ width: `${Math.abs(item.impact) * 5}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div> */}

      {/* 防御 ROI */}
      <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
        <h2 className="mb-6">Defense Investment ROI Analysis</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={defenseROI}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94A3B8" />
            <YAxis stroke="#94A3B8" />
            <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155' }} />
            <Legend />
            <Bar dataKey="investment" fill="#EF4444" name="Investment (ETH/month)" />
            <Bar dataKey="savings" fill="#10B981" name="Savings (ETH/month)" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-6 p-4 bg-success/10 rounded-lg text-center">
          <div className="text-sm text-muted-foreground">Total Defense ROI</div>
          <div className="text-4xl font-bold text-success">{totalDefenseROI.toFixed(0)}%</div>
          <div className="text-xs text-muted-foreground mt-2">
            Total Investment: {formatETH(totalInvestment)}/month → Total Savings: {formatETH(totalSavings)}/month
          </div>
        </div>
      </div>
    </div>
  );
}
// import { useState } from 'react';
// import { RefreshCw, Loader2 } from 'lucide-react';
// import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line } from 'recharts';
// import { useEconomicData } from '../../hooks/useEconomicData';

// export function Economics() {
//   const [tokenPrice, setTokenPrice] = useState(1250);
//   const [gasPrice, setGasPrice] = useState(50);
//   const [ethPrice, setEthPrice] = useState(3200);
//   const [inputTokenPrice, setInputTokenPrice] = useState('1250');
//   const [inputGasPrice, setInputGasPrice] = useState('50');
//   const [inputEthPrice, setInputEthPrice] = useState('3200');

//   const { data, loading } = useEconomicData(tokenPrice, gasPrice, ethPrice);

//   const handleUpdate = () => {
//     setTokenPrice(parseFloat(inputTokenPrice));
//     setGasPrice(parseFloat(inputGasPrice));
//     setEthPrice(parseFloat(inputEthPrice));
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-96">
//         <Loader2 className="animate-spin text-primary w-8 h-8" />
//         <span className="ml-2 text-muted-foreground">Loading economic data...</span>
//       </div>
//     );
//   }

//   if (!data) {
//     return (
//       <div className="bg-card rounded-lg p-6 border border-border text-center text-destructive">
//         Failed to load economic data.
//       </div>
//     );
//   }

//   // 辅助函数：格式化货币
//   const formatETH = (value: number) => `${value.toFixed(1)} ETH`;
//   const formatUSD = (value: number) => `$${(value * ethPrice).toLocaleString()}`;

//   return (
//     <div className="space-y-6">
//       {/* Parameter Settings */}
//       <div className="bg-card rounded-lg p-4 border border-border shadow-lg">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-6">
//             <div className="flex items-center gap-2">
//               <span className="text-sm text-muted-foreground">Token Price:</span>
//               <input
//                 type="text"
//                 value={inputTokenPrice}
//                 onChange={(e) => setInputTokenPrice(e.target.value)}
//                 className="bg-secondary border border-border rounded px-3 py-1 text-sm w-24"
//               />
//             </div>
//             <div className="flex items-center gap-2">
//               <span className="text-sm text-muted-foreground">Gas Price:</span>
//               <input
//                 type="text"
//                 value={inputGasPrice}
//                 onChange={(e) => setInputGasPrice(e.target.value)}
//                 className="bg-secondary border border-border rounded px-3 py-1 text-sm w-24"
//               />
//             </div>
//             <div className="flex items-center gap-2">
//               <span className="text-sm text-muted-foreground">ETH Price:</span>
//               <input
//                 type="text"
//                 value={inputEthPrice}
//                 onChange={(e) => setInputEthPrice(e.target.value)}
//                 className="bg-secondary border border-border rounded px-3 py-1 text-sm w-24"
//               />
//             </div>
//           </div>
//           <button
//             onClick={handleUpdate}
//             className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors"
//           >
//             <RefreshCw className="w-4 h-4" />
//             Update
//           </button>
//         </div>
//       </div>

//       {/* Attack Cost Breakdown */}
//       <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//         <h2 className="mb-6">Attack Cost Breakdown</h2>
//         <div className="grid grid-cols-2 gap-8">
//           <div>
//             <ResponsiveContainer width="100%" height={250}>
//               <PieChart>
//                 <Pie
//                   data={data.costBreakdown}
//                   cx="50%"
//                   cy="50%"
//                   innerRadius={60}
//                   outerRadius={100}
//                   fill="#8884d8"
//                   paddingAngle={2}
//                   dataKey="value"
//                   label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
//                 >
//                   {data.costBreakdown.map((entry, index) => (
//                     <Cell key={`cell-${index}`} fill={entry.color || ['#3B82F6', '#EF4444', '#F59E0B', '#94A3B8'][index % 4]} />
//                   ))}
//                 </Pie>
//                 <Tooltip
//                   contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
//                 />
//               </PieChart>
//             </ResponsiveContainer>
//           </div>
//           <div className="flex flex-col justify-center">
//             <div className="text-center mb-6">
//               <div className="text-3xl font-bold mb-1">{formatETH(data.roiCalculator.attackCost)}</div>
//               <div className="text-muted-foreground text-sm">(≈ {formatUSD(data.roiCalculator.attackCost)})</div>
//             </div>
//             <div className="space-y-3">
//               {data.costBreakdown.map((item, index) => (
//                 <div key={index} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
//                   <div className="flex items-center gap-2">
//                     <div className="w-3 h-3 rounded" style={{ backgroundColor: ['#3B82F6', '#EF4444', '#F59E0B', '#94A3B8'][index % 4] }}></div>
//                     <span className="text-sm">{item.name}:</span>
//                   </div>
//                   <div className="text-right">
//                     <div className="font-bold">{formatETH(item.amount)}</div>
//                     <div className="text-xs text-muted-foreground">({item.value}%)</div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Calculators Row */}
//       <div className="grid grid-cols-3 gap-6">
//         {/* ROI Calculator */}
//         <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//           <h3 className="mb-4 text-primary">ROI Calculator</h3>
//           <div className="space-y-4">
//             <div className="p-3 bg-secondary/20 rounded-lg">
//               <div className="flex items-center justify-between mb-1">
//                 <span className="text-sm text-muted-foreground">Attack Target Funds:</span>
//                 <span className="font-bold">{formatETH(data.roiCalculator.targetFunds)}</span>
//               </div>
//             </div>
//             <div className="p-3 bg-secondary/20 rounded-lg">
//               <div className="flex items-center justify-between mb-1">
//                 <span className="text-sm text-muted-foreground">Attack Cost:</span>
//                 <span className="font-bold text-destructive">{formatETH(data.roiCalculator.attackCost)}</span>
//               </div>
//             </div>
//             <div className="p-3 bg-success/10 rounded-lg border border-success/30">
//               <div className="flex items-center justify-between mb-1">
//                 <span className="text-sm text-muted-foreground">Expected Profit:</span>
//                 <span className="font-bold text-success">{formatETH(data.roiCalculator.expectedProfit)}</span>
//               </div>
//             </div>
//             <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
//               <div className="text-center">
//                 <div className="text-xs text-muted-foreground mb-1">ROI</div>
//                 <div className="text-3xl font-bold text-primary">{data.roiCalculator.roi.toFixed(0)}%</div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Break-even Analysis */}
//         <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//           <h3 className="mb-4 text-warning">Break-even Analysis</h3>
//           <ResponsiveContainer width="100%" height={180}>
//             <LineChart data={data.breakEvenData}>
//               <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
//               <XAxis dataKey="amount" stroke="#94A3B8" tick={{ fontSize: 10 }} />
//               <YAxis stroke="#94A3B8" tick={{ fontSize: 10 }} />
//               <Tooltip
//                 contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
//               />
//               <Line type="monotone" dataKey="profit" stroke="#F59E0B" strokeWidth={2} dot={{ fill: '#F59E0B' }} />
//             </LineChart>
//           </ResponsiveContainer>
//           <div className="mt-4 space-y-2 text-sm">
//             <div className="flex items-center justify-between">
//               <span className="text-muted-foreground">• Break-even Point:</span>
//               <span className="font-bold">
//                 {data.breakEvenData.find(d => d.profit >= 0)?.amount?.toFixed(0) || 'N/A'} ETH
//               </span>
//             </div>
//             <div className="flex items-center justify-between">
//               <span className="text-muted-foreground">• Current Target:</span>
//               <span className="text-success">{formatETH(data.roiCalculator.targetFunds)}</span>
//             </div>
//             <div className="flex items-center justify-between">
//               <span className="text-muted-foreground">• Safety Margin:</span>
//               <span className="text-success">
//                 {((data.roiCalculator.targetFunds - (data.breakEvenData.find(d => d.profit >= 0)?.amount || 0)) / (data.breakEvenData.find(d => d.profit >= 0)?.amount || 1) * 100).toFixed(0)}%
//               </span>
//             </div>
//           </div>
//         </div>

//         {/* Sensitivity Analysis */}
//         <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//           <h3 className="mb-4 text-success">Sensitivity Analysis</h3>
//           <div className="space-y-2">
//             {data.sensitivityData.map((item, index) => (
//               <div key={index} className="p-2 bg-secondary/20 rounded-lg">
//                 <div className="flex items-center justify-between text-xs mb-1">
//                   <span className="text-muted-foreground">{item.param}</span>
//                   <span className={item.impact > 0 ? 'text-success' : 'text-destructive'}>
//                     {item.impact > 0 ? '+' : ''}{item.impact}%
//                   </span>
//                 </div>
//                 <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
//                   <div
//                     className={`h-full ${item.impact > 0 ? 'bg-success' : 'bg-destructive'}`}
//                     style={{ width: `${Math.abs(item.impact) * 5}%` }}
//                   ></div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Defense Investment ROI */}
//       <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//         <h2 className="mb-6">Defense Investment ROI Analysis</h2>
//         <ResponsiveContainer width="100%" height={300}>
//           <BarChart data={data.defenseROI}>
//             <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
//             <XAxis dataKey="name" stroke="#94A3B8" />
//             <YAxis stroke="#94A3B8" />
//             <Tooltip
//               contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
//             />
//             <Legend />
//             <Bar dataKey="investment" fill="#EF4444" name="Investment (ETH/month)" />
//             <Bar dataKey="savings" fill="#10B981" name="Savings (ETH/month)" />
//           </BarChart>
//         </ResponsiveContainer>
//         <div className="mt-6 p-4 bg-success/10 rounded-lg border border-success/30">
//           <div className="text-center">
//             <div className="text-sm text-muted-foreground mb-2">Total Defense ROI</div>
//             <div className="text-4xl font-bold text-success">{data.totalDefenseROI.toFixed(0)}%</div>
//             <div className="text-xs text-muted-foreground mt-2">
//               Total Investment: {formatETH(data.totalInvestment)}/month → Total Savings: {formatETH(data.totalSavings)}/month
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
