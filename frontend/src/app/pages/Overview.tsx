// import { 
//   AlertTriangle, 
//   DollarSign, 
//   FileText, 
//   Zap, 
//   CheckCircle2,
//   TrendingDown,
//   Clock,
//   Shield,
//   ArrowRight,
//   Loader2
// } from 'lucide-react';
// import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// import { useNavigate } from 'react-router-dom';
// import { useTreasury } from '../../hooks/useTreasury';
// import { useProposalsSummary } from '../../hooks/useProposalsSummary';
// import { useAttackEvents } from '../../hooks/useAttackEvents';
// import { useRiskScore } from '../../hooks/useRiskScore';
// import { useHeatmapData } from '../../hooks/useHeatmapData';
// import { useDefenseStatus } from '../../hooks/useDefenseStatus';

// export function Overview() {
//   const navigate = useNavigate();

//   // 数据 hooks
//   const { balance: treasuryBalance, loading: treasuryLoading, error: treasuryError } = useTreasury();
//   const { active: activeProposals, voting: votingProposals, loading: proposalsLoading } = useProposalsSummary();
//   const { inProgress: attacksInProgress, defended: attacksDefended, loading: attacksLoading } = useAttackEvents();
//   const { score: riskScore, level: riskLevel, loading: riskLoading } = useRiskScore();
//   const { data: heatmapData, loading: heatmapLoading } = useHeatmapData();
//   const { timelockEnabled, quorum, emergencyReady, loading: defenseLoading } = useDefenseStatus();

//   // 辅助函数
//   const getRiskColor = (level: string) => {
//     switch (level) {
//       case 'critical': return 'text-destructive';
//       case 'high': return 'text-destructive';
//       case 'medium': return 'text-warning';
//       default: return 'text-success';
//     }
//   };

//   const getRiskIcon = () => {
//     if (riskLevel === 'high' || riskLevel === 'critical') return '🔴';
//     if (riskLevel === 'medium') return '🟡';
//     return '🟢';
//   };

//   return (
//     <div className="space-y-6">
//       {/* Stats Cards */}
//       <div className="grid grid-cols-4 gap-4">
//         {/* Risk Score Card */}
//         <div className="bg-card rounded-lg p-6 border border-border shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
//           <div className="flex items-start justify-between mb-4">
//             <div className="p-3 bg-destructive/10 rounded-lg">
//               <AlertTriangle className={`w-6 h-6 ${getRiskColor(riskLevel)}`} />
//             </div>
//             <span className={`text-xs px-2 py-1 rounded ${riskLevel === 'high' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
//               {riskLoading ? 'Loading...' : `${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk`}
//             </span>
//           </div>
//           <h3 className="text-muted-foreground text-sm mb-1">Current Risk Level</h3>
//           <div className={`text-2xl font-bold ${getRiskColor(riskLevel)} mb-2`}>
//             {riskLoading ? <Loader2 className="animate-spin inline" /> : `${getRiskIcon()} ${riskLevel.toUpperCase()} Risk`}
//           </div>
//           <p className="text-xs text-muted-foreground">
//             {riskScore > 80 ? '⚠️ Immediate Attention Required' : riskScore > 50 ? '⚠️ Monitor Closely' : '✅ Within Normal Range'}
//           </p>
//         </div>

//         {/* Treasury Card */}
//         <div className="bg-card rounded-lg p-6 border border-border shadow-lg hover:shadow-xl transition-shadow">
//           <div className="flex items-start justify-between mb-4">
//             <div className="p-3 bg-primary/10 rounded-lg">
//               <DollarSign className="w-6 h-6 text-primary" />
//             </div>
//           </div>
//           <h3 className="text-muted-foreground text-sm mb-1">Treasury Overview</h3>
//           <div className="text-2xl font-bold mb-2">
//             {treasuryLoading ? (
//               <Loader2 className="animate-spin inline" />
//             ) : treasuryError ? (
//               <span className="text-xs text-destructive">Error</span>
//             ) : (
//               `💰 ${parseFloat(treasuryBalance).toFixed(2)} ETH`
//             )}
//           </div>
//           <div className="flex items-center gap-1 text-xs text-destructive">
//             <TrendingDown className="w-3 h-3" />
//             <span>↓ 12% Yesterday</span>
//           </div>
//         </div>

//         {/* Governance Card */}
//         <div className="bg-card rounded-lg p-6 border border-border shadow-lg hover:shadow-xl transition-shadow">
//           <div className="flex items-start justify-between mb-4">
//             <div className="p-3 bg-warning/10 rounded-lg">
//               <FileText className="w-6 h-6 text-warning" />
//             </div>
//           </div>
//           <h3 className="text-muted-foreground text-sm mb-1">Active Governance</h3>
//           <div className="text-2xl font-bold mb-2">
//             {proposalsLoading ? (
//               <Loader2 className="animate-spin inline" />
//             ) : (
//               `📋 ${activeProposals} Proposals`
//             )}
//           </div>
//           <div className="flex items-center gap-1 text-xs text-muted-foreground">
//             <Clock className="w-3 h-3" />
//             <span>⏳ {votingProposals} Voting</span>
//           </div>
//         </div>

//         {/* Attack Events Card */}
//         <div className="bg-card rounded-lg p-6 border border-border shadow-lg hover:shadow-xl transition-shadow">
//           <div className="flex items-start justify-between mb-4">
//             <div className="p-3 bg-success/10 rounded-lg">
//               <Zap className="w-6 h-6 text-success" />
//             </div>
//           </div>
//           <h3 className="text-muted-foreground text-sm mb-1">Attack Events</h3>
//           <div className="text-2xl font-bold mb-2">
//             {attacksLoading ? (
//               <Loader2 className="animate-spin inline" />
//             ) : (
//               `⚡ ${attacksInProgress} In Progress`
//             )}
//           </div>
//           <div className="flex items-center gap-1 text-xs text-success">
//             <CheckCircle2 className="w-3 h-3" />
//             <span>✅ {attacksDefended} Defended</span>
//           </div>
//         </div>
//       </div>

//       {/* Heatmap */}
//       <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//         <h2 className="mb-6">24-Hour Fund Flow Heatmap</h2>
//         {heatmapLoading ? (
//           <div className="h-[200px] flex items-center justify-center">
//             <Loader2 className="animate-spin text-primary" />
//           </div>
//         ) : heatmapData.length === 0 ? (
//           <div className="h-[200px] flex items-center justify-center text-muted-foreground">
//             No data available
//           </div>
//         ) : (
//           <ResponsiveContainer width="100%" height={200}>
//             <AreaChart data={heatmapData}>
//               <defs>
//                 <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
//                   <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
//                   <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
//                 </linearGradient>
//               </defs>
//               <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
//               <XAxis dataKey="time" stroke="#94A3B8" />
//               <YAxis stroke="#94A3B8" />
//               <Tooltip 
//                 contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
//                 labelStyle={{ color: '#F8FAFC' }}
//               />
//               <Area type="monotone" dataKey="value" stroke="#3B82F6" fillOpacity={1} fill="url(#colorValue)" />
//             </AreaChart>
//           </ResponsiveContainer>
//         )}
//       </div>

//       {/* Bottom Cards Row */}
//       <div className="grid grid-cols-3 gap-6">
//         {/* Quick Start */}
//         <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//           <h3 className="mb-4 flex items-center gap-2">
//             <Zap className="w-5 h-5 text-primary" />
//             Quick Start
//           </h3>
//           <div className="space-y-3 mb-4">
//             <div className="flex items-center gap-2 text-sm hover:text-primary cursor-pointer transition-colors">
//               <div className="w-2 h-2 rounded-full bg-primary"></div>
//               <span>Flash Loan Attack Test</span>
//             </div>
//             <div className="flex items-center gap-2 text-sm hover:text-primary cursor-pointer transition-colors">
//               <div className="w-2 h-2 rounded-full bg-primary"></div>
//               <span>Vote Manipulation Test</span>
//             </div>
//             <div className="flex items-center gap-2 text-sm hover:text-primary cursor-pointer transition-colors">
//               <div className="w-2 h-2 rounded-full bg-primary"></div>
//               <span>Defense Config Test</span>
//             </div>
//           </div>
//           <button 
//             onClick={() => navigate('/attack')}
//             className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
//           >
//             Start Simulation
//             <ArrowRight className="w-4 h-4" />
//           </button>
//         </div>

//         {/* Recent Simulations (still static for now, but you can later fetch from API) */}
//         <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//           <h3 className="mb-4 flex items-center gap-2">
//             <FileText className="w-5 h-5 text-warning" />
//             Recent Simulations
//           </h3>
//           <div className="space-y-3">
//             <div className="p-3 bg-secondary/30 rounded-lg border border-border">
//               <div className="flex items-center justify-between mb-1">
//                 <span className="text-sm">1. Flash Loan Attack</span>
//                 <span className="text-xs text-success">92%</span>
//               </div>
//               <div className="text-xs text-muted-foreground">Success Rate: 92%</div>
//             </div>
//             <div className="p-3 bg-secondary/30 rounded-lg border border-border">
//               <div className="flex items-center justify-between mb-1">
//                 <span className="text-sm">2. Sybil Attack</span>
//                 <span className="text-xs text-warning">45%</span>
//               </div>
//               <div className="text-xs text-muted-foreground">Success Rate: 45%</div>
//             </div>
//           </div>
//         </div>

//         {/* Defense Status */}
//         <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//           <h3 className="mb-4 flex items-center gap-2">
//             <Shield className="w-5 h-5 text-success" />
//             Defense Status
//           </h3>
//           <div className="space-y-3 mb-4">
//             <div className="flex items-center justify-between text-sm">
//               <span className="text-muted-foreground">• Timelock:</span>
//               {defenseLoading ? (
//                 <Loader2 className="animate-spin w-4 h-4" />
//               ) : (
//                 <span className={timelockEnabled ? 'text-success' : 'text-destructive'}>
//                   {timelockEnabled ? 'Enabled' : 'Disabled'}
//                 </span>
//               )}
//             </div>
//             <div className="flex items-center justify-between text-sm">
//               <span className="text-muted-foreground">• Quorum:</span>
//               {defenseLoading ? (
//                 <Loader2 className="animate-spin w-4 h-4" />
//               ) : (
//                 <span className="text-success">{quorum}%</span>
//               )}
//             </div>
//             <div className="flex items-center justify-between text-sm">
//               <span className="text-muted-foreground">• Emergency Pause:</span>
//               {defenseLoading ? (
//                 <Loader2 className="animate-spin w-4 h-4" />
//               ) : (
//                 <span className={emergencyReady ? 'text-success' : 'text-muted-foreground'}>
//                   {emergencyReady ? 'Ready' : 'Not Configured'}
//                 </span>
//               )}
//             </div>
//           </div>
//           <button 
//             onClick={() => navigate('/defense')}
//             className="w-full border border-border hover:bg-secondary text-foreground py-2 px-4 rounded-lg transition-colors"
//           >
//             View Details
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }


import { 
  AlertTriangle, 
  DollarSign, 
  FileText, 
  Zap, 
  CheckCircle2,
  TrendingDown,
  Clock,
  Shield,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useTreasury } from '../../hooks/useTreasury';
import { useProposalsSummary } from '../../hooks/useProposalsSummary';
import { useAttackEvents } from '../../hooks/useAttackEvents';
import { useRiskScore } from '../../hooks/useRiskScore';
import { useHeatmapData } from '../../hooks/useHeatmapData';
import { useDefenseStatus } from '../../hooks/useDefenseStatus';
// import { ethers } from 'ethers';
// const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
// const signer = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);
// const attackAddr = '0x416C42991d05b31E9A6dC209e91AD22b79D87Ae6'; // FlashLoanAttack
// const abi = [{
//   "inputs": [
//     { "internalType": "uint256", "name": "loanAmount", "type": "uint256" },
//     { "internalType": "uint256", "name": "treasuryDrainAmount", "type": "uint256" }
//   ],
//   "name": "executeAttack",
//   "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
//   "stateMutability": "nonpayable",
//   "type": "function"
// }];
// const contract = new ethers.Contract(attackAddr, abi, signer);
// const tx = await contract.executeAttack(ethers.parseEther('1000'), ethers.parseEther('1000'));
// console.log(tx);

// 攻击类型定义（与项目中的攻击向量对应）
const ATTACK_TYPES = [
  { id: 'flashloan', label: 'Flash Loan Attack Test', color: 'text-destructive' },
  { id: 'whale', label: 'Whale Manipulation Test', color: 'text-warning' },
  { id: 'spam', label: 'Proposal Spam Test', color: 'text-primary' },
  { id: 'quorum', label: 'Quorum Manipulation Test', color: 'text-info' },
  { id: 'timelock', label: 'Timelock Exploit Test', color: 'text-secondary' }
];

export function Overview() {
  const navigate = useNavigate();

  // 数据 hooks
  const { balance: treasuryBalance, loading: treasuryLoading, error: treasuryError } = useTreasury();
  const { active: activeProposals, voting: votingProposals, loading: proposalsLoading } = useProposalsSummary();
  const { inProgress: attacksInProgress, defended: attacksDefended, loading: attacksLoading } = useAttackEvents();
  const { score: riskScore, level: riskLevel, loading: riskLoading } = useRiskScore();
  const { data: heatmapData, loading: heatmapLoading } = useHeatmapData();
  const { timelockEnabled, quorum, emergencyReady, loading: defenseLoading } = useDefenseStatus();

  // 辅助函数
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-destructive';
      case 'high': return 'text-destructive';
      case 'medium': return 'text-warning';
      default: return 'text-success';
    }
  };

  const getRiskIcon = () => {
    if (riskLevel === 'high' || riskLevel === 'critical') return '🔴';
    if (riskLevel === 'medium') return '🟡';
    return '🟢';
  };

  // 跳转到攻击模拟页面并传递攻击类型
  const handleAttackClick = (attackType: string) => {
    navigate(`/attack?type=${attackType}`);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards 保持不变 */}
      <div className="grid grid-cols-4 gap-4">
        {/* Risk Score Card */}
        <div className="bg-card rounded-lg p-6 border border-border shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-destructive/10 rounded-lg">
              <AlertTriangle className={`w-6 h-6 ${getRiskColor(riskLevel)}`} />
            </div>
            <span className={`text-xs px-2 py-1 rounded ${riskLevel === 'high' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
              {riskLoading ? 'Loading...' : `${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk`}
            </span>
          </div>
          <h3 className="text-muted-foreground text-sm mb-1">Current Risk Level</h3>
          <div className={`text-2xl font-bold ${getRiskColor(riskLevel)} mb-2`}>
            {riskLoading ? <Loader2 className="animate-spin inline" /> : `${getRiskIcon()} ${riskLevel.toUpperCase()} Risk`}
          </div>
          <p className="text-xs text-muted-foreground">
            {riskScore > 80 ? '⚠️ Immediate Attention Required' : riskScore > 50 ? '⚠️ Monitor Closely' : '✅ Within Normal Range'}
          </p>
        </div>

        {/* Treasury Card */}
        <div className="bg-card rounded-lg p-6 border border-border shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h3 className="text-muted-foreground text-sm mb-1">Treasury Overview</h3>
          <div className="text-2xl font-bold mb-2">
            {treasuryLoading ? (
              <Loader2 className="animate-spin inline" />
            ) : treasuryError ? (
              <span className="text-xs text-destructive">Error</span>
            ) : (
              `💰 ${parseFloat(treasuryBalance).toFixed(2)} ETH`
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-destructive">
            <TrendingDown className="w-3 h-3" />
            <span>↓ 12% Yesterday</span>
          </div>
        </div>

        {/* Governance Card */}
        <div className="bg-card rounded-lg p-6 border border-border shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-warning/10 rounded-lg">
              <FileText className="w-6 h-6 text-warning" />
            </div>
          </div>
          <h3 className="text-muted-foreground text-sm mb-1">Active Governance</h3>
          <div className="text-2xl font-bold mb-2">
            {proposalsLoading ? (
              <Loader2 className="animate-spin inline" />
            ) : (
              `📋 ${activeProposals} Proposals`
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>⏳ {votingProposals} Voting</span>
          </div>
        </div>

        {/* Attack Events Card */}
        <div className="bg-card rounded-lg p-6 border border-border shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-success/10 rounded-lg">
              <Zap className="w-6 h-6 text-success" />
            </div>
          </div>
          <h3 className="text-muted-foreground text-sm mb-1">Attack Events</h3>
          <div className="text-2xl font-bold mb-2">
            {attacksLoading ? (
              <Loader2 className="animate-spin inline" />
            ) : (
              `⚡ ${attacksInProgress} In Progress`
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-success">
            <CheckCircle2 className="w-3 h-3" />
            <span>✅ {attacksDefended} Defended</span>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
        <h2 className="mb-6">24-Hour Fund Flow Heatmap</h2>
        {heatmapLoading ? (
          <div className="h-[200px] flex items-center justify-center">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : heatmapData.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={heatmapData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94A3B8" />
              <YAxis stroke="#94A3B8" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#F8FAFC' }}
              />
              <Area type="monotone" dataKey="value" stroke="#3B82F6" fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bottom Cards Row */}
      <div className="grid grid-cols-3 gap-6">
        {/* Quick Start */}
        <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
          <h3 className="mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Quick Start
          </h3>
          <div className="space-y-3 mb-4">
            {ATTACK_TYPES.map((attack) => (
              <div 
                key={attack.id}
                onClick={() => handleAttackClick(attack.id)}
                className="flex items-center gap-2 text-sm hover:text-primary cursor-pointer transition-colors group"
              >
                <div className={`w-2 h-2 rounded-full ${attack.color.replace('text-', 'bg-')}`}></div>
                <span className="group-hover:text-primary">{attack.label}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-border mt-2">
              <div 
                onClick={() => navigate('/defense')}
                className="flex items-center gap-2 text-sm hover:text-primary cursor-pointer transition-colors group"
              >
                <div className="w-2 h-2 rounded-full bg-success"></div>
                <span className="group-hover:text-primary">Defense Config Test</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => handleAttackClick(ATTACK_TYPES[0].id)}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            Start Simulation
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Recent Simulations (still static) */}
        <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
          <h3 className="mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-warning" />
            Recent Simulations
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-secondary/30 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">1. Flash Loan Attack</span>
                <span className="text-xs text-success">92%</span>
              </div>
              <div className="text-xs text-muted-foreground">Success Rate: 92%</div>
            </div>
            <div className="p-3 bg-secondary/30 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">2. Sybil Attack</span>
                <span className="text-xs text-warning">45%</span>
              </div>
              <div className="text-xs text-muted-foreground">Success Rate: 45%</div>
            </div>
          </div>
        </div>

        {/* Defense Status */}
        <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
          <h3 className="mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-success" />
            Defense Status
          </h3>
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">• Timelock:</span>
              {defenseLoading ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                <span className={timelockEnabled ? 'text-success' : 'text-destructive'}>
                  {timelockEnabled ? 'Enabled' : 'Disabled'}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">• Quorum:</span>
              {defenseLoading ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                <span className="text-success">{quorum}%</span>
              )}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">• Emergency Pause:</span>
              {defenseLoading ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                <span className={emergencyReady ? 'text-success' : 'text-muted-foreground'}>
                  {emergencyReady ? 'Ready' : 'Not Configured'}
                </span>
              )}
            </div>
          </div>
          <button 
            onClick={() => navigate('/defense')}
            className="w-full border border-border hover:bg-secondary text-foreground py-2 px-4 rounded-lg transition-colors"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}