// import { 
//   AlertTriangle, 
//   DollarSign, 
//   FileText, 
//   Zap, 
//   CheckCircle2,
//   TrendingDown,
//   Clock,
//   Shield,
//   ArrowRight
// } from 'lucide-react';
// import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// import { useNavigate } from 'react-router-dom';

// const heatmapData = [
//   { time: '00:00', value: 120 },
//   { time: '04:00', value: 80 },
//   { time: '08:00', value: 250 },
//   { time: '12:00', value: 380 },
//   { time: '16:00', value: 290 },
//   { time: '20:00', value: 150 },
//   { time: '24:00', value: 100 },
// ];

// export function Overview() {
//   const navigate = useNavigate();

//   return (
//     <div className="space-y-6">
//       {/* Stats Cards */}
//       <div className="grid grid-cols-4 gap-4">
//         <div className="bg-card rounded-lg p-6 border border-border shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
//           <div className="flex items-start justify-between mb-4">
//             <div className="p-3 bg-destructive/10 rounded-lg">
//               <AlertTriangle className="w-6 h-6 text-destructive" />
//             </div>
//             <span className="text-destructive text-xs px-2 py-1 bg-destructive/10 rounded">High Risk</span>
//           </div>
//           <h3 className="text-muted-foreground text-sm mb-1">Current Risk Level</h3>
//           <div className="text-2xl font-bold text-destructive mb-2">🔴 High Risk</div>
//           <p className="text-xs text-muted-foreground">⚠️ Immediate Attention Required</p>
//         </div>

//         <div className="bg-card rounded-lg p-6 border border-border shadow-lg hover:shadow-xl transition-shadow">
//           <div className="flex items-start justify-between mb-4">
//             <div className="p-3 bg-primary/10 rounded-lg">
//               <DollarSign className="w-6 h-6 text-primary" />
//             </div>
//           </div>
//           <h3 className="text-muted-foreground text-sm mb-1">Treasury Overview</h3>
//           <div className="text-2xl font-bold mb-2">💰 1,240 ETH</div>
//           <div className="flex items-center gap-1 text-xs text-destructive">
//             <TrendingDown className="w-3 h-3" />
//             <span>↓ 12% Yesterday</span>
//           </div>
//         </div>

//         <div className="bg-card rounded-lg p-6 border border-border shadow-lg hover:shadow-xl transition-shadow">
//           <div className="flex items-start justify-between mb-4">
//             <div className="p-3 bg-warning/10 rounded-lg">
//               <FileText className="w-6 h-6 text-warning" />
//             </div>
//           </div>
//           <h3 className="text-muted-foreground text-sm mb-1">Active Governance</h3>
//           <div className="text-2xl font-bold mb-2">📋 2 Proposals</div>
//           <div className="flex items-center gap-1 text-xs text-muted-foreground">
//             <Clock className="w-3 h-3" />
//             <span>⏳ 1 Voting</span>
//           </div>
//         </div>

//         <div className="bg-card rounded-lg p-6 border border-border shadow-lg hover:shadow-xl transition-shadow">
//           <div className="flex items-start justify-between mb-4">
//             <div className="p-3 bg-success/10 rounded-lg">
//               <Zap className="w-6 h-6 text-success" />
//             </div>
//           </div>
//           <h3 className="text-muted-foreground text-sm mb-1">Attack Events</h3>
//           <div className="text-2xl font-bold mb-2">⚡ 0 In Progress</div>
//           <div className="flex items-center gap-1 text-xs text-success">
//             <CheckCircle2 className="w-3 h-3" />
//             <span>✅ 7 Defended</span>
//           </div>
//         </div>
//       </div>

//       {/* Heatmap */}
//       <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//         <h2 className="mb-6">24-Hour Fund Flow Heatmap</h2>
//         <ResponsiveContainer width="100%" height={200}>
//           <AreaChart data={heatmapData}>
//             <defs>
//               <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
//                 <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
//                 <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
//               </linearGradient>
//             </defs>
//             <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
//             <XAxis dataKey="time" stroke="#94A3B8" />
//             <YAxis stroke="#94A3B8" />
//             <Tooltip 
//               contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
//               labelStyle={{ color: '#F8FAFC' }}
//             />
//             <Area type="monotone" dataKey="value" stroke="#3B82F6" fillOpacity={1} fill="url(#colorValue)" />
//           </AreaChart>
//         </ResponsiveContainer>
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

//         {/* Recent Simulations */}
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
//               <span className="text-success">Enabled</span>
//             </div>
//             <div className="flex items-center justify-between text-sm">
//               <span className="text-muted-foreground">• Quorum:</span>
//               <span className="text-success">15%</span>
//             </div>
//             <div className="flex items-center justify-between text-sm">
//               <span className="text-muted-foreground">• Emergency Pause:</span>
//               <span className="text-success">Ready</span>
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

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
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
            <div className="flex items-center gap-2 text-sm hover:text-primary cursor-pointer transition-colors">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span>Flash Loan Attack Test</span>
            </div>
            <div className="flex items-center gap-2 text-sm hover:text-primary cursor-pointer transition-colors">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span>Vote Manipulation Test</span>
            </div>
            <div className="flex items-center gap-2 text-sm hover:text-primary cursor-pointer transition-colors">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span>Defense Config Test</span>
            </div>
          </div>
          <button 
            onClick={() => navigate('/attack')}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            Start Simulation
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Recent Simulations (still static for now, but you can later fetch from API) */}
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
