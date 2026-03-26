// import { Bell, AlertTriangle } from 'lucide-react';
// import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

// const tokenDistribution = [
//   { name: 'Top 10 Holders', value: 45, color: '#3B82F6' },
//   { name: 'Medium Holders', value: 30, color: '#10B981' },
//   { name: 'Small Holders', value: 25, color: '#F59E0B' },
// ];

// const votingPattern = [
//   { name: 'Proposal #123', support: 67, against: 22, abstain: 11 },
//   { name: 'Proposal #124', support: 92, against: 5, abstain: 3 },
// ];

// const votes = [
//   { time: '14:30:15', address: '0x123..abc', action: 'Voted For', proposal: 'Proposal #123', tokens: '1,200' },
//   { time: '14:30:22', address: '0x456..def', action: 'Voted Against', proposal: 'Proposal #123', tokens: '850' },
//   { time: '14:30:30', address: '0x789..ghi', action: 'Voted For', proposal: 'Proposal #124', tokens: '3,500' },
// ];

// export function Governance() {
//   return (
//     <div className="space-y-6">
//       {/* Filter Bar */}
//       <div className="bg-card rounded-lg p-4 border border-border shadow-lg">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-4">
//             <select className="bg-secondary border border-border rounded-lg px-4 py-2 text-sm">
//               <option>DAO: All</option>
//               <option>Compound</option>
//               <option>Uniswap</option>
//               <option>Aave</option>
//             </select>
//             <select className="bg-secondary border border-border rounded-lg px-4 py-2 text-sm">
//               <option>Status: Active</option>
//               <option>Ended</option>
//               <option>Pending Execution</option>
//             </select>
//             <select className="bg-secondary border border-border rounded-lg px-4 py-2 text-sm">
//               <option>Sort: End Time</option>
//               <option>Support Rate</option>
//               <option>Risk Level</option>
//             </select>
//           </div>
//           <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors">
//             <Bell className="w-4 h-4" />
//             Monitoring Settings
//           </button>
//         </div>
//       </div>

//       {/* Governance Timeline */}
//       <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//         <h2 className="mb-6">Governance Proposal Timeline</h2>
//         <div className="relative">
//           {/* Timeline */}
//           <div className="flex items-center justify-between mb-8">
//             <div className="flex-1 h-1 bg-secondary"></div>
//           </div>
//           <div className="flex items-center justify-between relative">
//             {/* Timeline stages */}
//             <div className="text-center flex-1">
//               <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center mx-auto mb-2">
//                 📝
//               </div>
//               <p className="text-xs text-muted-foreground">Proposal</p>
//             </div>
//             <div className="text-center flex-1">
//               <div className="w-12 h-12 rounded-full bg-warning/20 border-2 border-warning flex items-center justify-center mx-auto mb-2">
//                 🗳️
//               </div>
//               <p className="text-xs text-muted-foreground">Voting</p>
//             </div>
//             <div className="text-center flex-1">
//               <div className="w-12 h-12 rounded-full bg-secondary/50 border-2 border-border flex items-center justify-center mx-auto mb-2">
//                 ⏳
//               </div>
//               <p className="text-xs text-muted-foreground">Timelock</p>
//             </div>
//             <div className="text-center flex-1">
//               <div className="w-12 h-12 rounded-full bg-success/20 border-2 border-success flex items-center justify-center mx-auto mb-2">
//                 ✅
//               </div>
//               <p className="text-xs text-muted-foreground">Execution</p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Main Content Grid */}
//       <div className="grid grid-cols-3 gap-6">
//         {/* Active Proposals */}
//         <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//           <h3 className="mb-4">Active Proposals</h3>
//           <div className="space-y-4">
//             <div className="p-4 bg-secondary/20 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer">
//               <div className="flex items-start justify-between mb-2">
//                 <h4 className="text-sm">Proposal #123</h4>
//                 <span className="text-xs px-2 py-1 bg-warning/20 text-warning rounded">Medium</span>
//               </div>
//               <p className="text-sm text-muted-foreground mb-3">Parameter Update Proposal</p>
//               <div className="space-y-2">
//                 <div className="flex items-center justify-between text-xs">
//                   <span className="text-muted-foreground">Support Rate:</span>
//                   <span className="text-success">67%</span>
//                 </div>
//                 <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
//                   <div className="h-full bg-success" style={{ width: '67%' }}></div>
//                 </div>
//               </div>
//             </div>

//             <div className="p-4 bg-secondary/20 rounded-lg border border-destructive/50 hover:border-destructive transition-colors cursor-pointer">
//               <div className="flex items-start justify-between mb-2">
//                 <h4 className="text-sm">Proposal #124</h4>
//                 <span className="text-xs px-2 py-1 bg-destructive/20 text-destructive rounded flex items-center gap-1">
//                   <AlertTriangle className="w-3 h-3" />
//                   High
//                 </span>
//               </div>
//               <p className="text-sm text-muted-foreground mb-3">Fund Transfer Proposal</p>
//               <div className="space-y-2">
//                 <div className="flex items-center justify-between text-xs">
//                   <span className="text-muted-foreground">Support Rate:</span>
//                   <span className="text-success">92%</span>
//                 </div>
//                 <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
//                   <div className="h-full bg-destructive" style={{ width: '92%' }}></div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Token Distribution */}
//         <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//           <h3 className="mb-4">Token Distribution Analysis</h3>
//           <ResponsiveContainer width="100%" height={200}>
//             <PieChart>
//               <Pie
//                 data={tokenDistribution}
//                 cx="50%"
//                 cy="50%"
//                 labelLine={false}
//                 label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
//                 outerRadius={80}
//                 fill="#8884d8"
//                 dataKey="value"
//               >
//                 {tokenDistribution.map((entry, index) => (
//                   <Cell key={`cell-${index}`} fill={entry.color} />
//                 ))}
//               </Pie>
//               <Tooltip 
//                 contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
//               />
//             </PieChart>
//           </ResponsiveContainer>
//           <div className="mt-4 space-y-2 text-sm">
//             <div className="flex items-center justify-between">
//               <span className="text-muted-foreground">• Top 10 Holders:</span>
//               <span>45%</span>
//             </div>
//             <div className="flex items-center justify-between">
//               <span className="text-muted-foreground">• Medium Holders:</span>
//               <span>30%</span>
//             </div>
//             <div className="flex items-center justify-between">
//               <span className="text-muted-foreground">• Small Holders:</span>
//               <span>25%</span>
//             </div>
//           </div>
//         </div>

//         {/* Voting Pattern */}
//         <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//           <h3 className="mb-4">Voting Pattern Analysis</h3>
//           <ResponsiveContainer width="100%" height={200}>
//             <BarChart data={votingPattern}>
//               <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
//               <XAxis dataKey="name" stroke="#94A3B8" tick={{ fontSize: 12 }} />
//               <YAxis stroke="#94A3B8" />
//               <Tooltip 
//                 contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
//               />
//               <Legend />
//               <Bar dataKey="support" stackId="a" fill="#10B981" name="Support" />
//               <Bar dataKey="against" stackId="a" fill="#EF4444" name="Against" />
//               <Bar dataKey="abstain" stackId="a" fill="#94A3B8" name="Abstain" />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>
//       </div>

//       {/* Real-time Voting Monitor */}
//       <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//         <h2 className="mb-4">Real-time Voting Monitor</h2>
//         <div className="space-y-2">
//           {votes.map((vote, index) => (
//             <div 
//               key={index}
//               className="p-3 bg-secondary/20 rounded-lg border border-border font-mono text-sm hover:border-primary transition-colors animate-fade-in"
//             >
//               <span className="text-muted-foreground">{vote.time}</span>
//               <span className="mx-2">🗳️</span>
//               <span className="text-primary">{vote.address}</span>
//               <span className="mx-2">{vote.action}</span>
//               <span className="text-warning">{vote.proposal}</span>
//               <span className="mx-2 text-muted-foreground">({vote.tokens} tokens)</span>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

import { useState } from 'react';
import { Bell, AlertTriangle, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { useGovernanceData } from '../../hooks/useGovernanceData';

export function Governance() {
  const [dao, setDao] = useState('all');
  const [status, setStatus] = useState('active');
  const [sort, setSort] = useState('endTime');
  const { data, loading } = useGovernanceData(dao, status, sort);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
        <span className="ml-2 text-muted-foreground">Loading governance data...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border text-center text-destructive">
        Failed to load governance data.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="bg-card rounded-lg p-4 border border-border shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <select
              value={dao}
              onChange={(e) => setDao(e.target.value)}
              className="bg-secondary border border-border rounded-lg px-4 py-2 text-sm"
            >
              <option value="all">DAO: All</option>
              <option value="compound">Compound</option>
              <option value="uniswap">Uniswap</option>
              <option value="aave">Aave</option>
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-secondary border border-border rounded-lg px-4 py-2 text-sm"
            >
              <option value="active">Status: Active</option>
              <option value="ended">Ended</option>
              <option value="pending">Pending Execution</option>
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-secondary border border-border rounded-lg px-4 py-2 text-sm"
            >
              <option value="endTime">Sort: End Time</option>
              <option value="support">Support Rate</option>
              <option value="risk">Risk Level</option>
            </select>
          </div>
          <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors">
            <Bell className="w-4 h-4" />
            Monitoring Settings
          </button>
        </div>
      </div>

      {/* Governance Timeline */}
      <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
        <h2 className="mb-6">Governance Proposal Timeline</h2>
        <div className="relative">
          <div className="flex items-center justify-between mb-8">
            <div className="flex-1 h-1 bg-secondary"></div>
          </div>
          <div className="flex items-center justify-between relative">
            {data.timelineStages.map((stage, idx) => (
              <div key={idx} className="text-center flex-1">
                <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center mx-auto mb-2
                  ${stage.active ? 'border-primary bg-primary/20' : 'border-border bg-secondary/50'}`}
                >
                  {stage.icon}
                </div>
                <p className="text-xs text-muted-foreground">{stage.stage}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Active Proposals */}
        <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
          <h3 className="mb-4">Active Proposals</h3>
          <div className="space-y-4">
            {data.proposals.map((proposal) => (
              <div
                key={proposal.id}
                className={`p-4 bg-secondary/20 rounded-lg border transition-colors cursor-pointer
                  ${proposal.riskLevel === 'high' ? 'border-destructive/50 hover:border-destructive' : 'border-border hover:border-primary'}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm">Proposal #{proposal.id}</h4>
                  <span className={`text-xs px-2 py-1 rounded flex items-center gap-1
                    ${proposal.riskLevel === 'high' ? 'bg-destructive/20 text-destructive' :
                      proposal.riskLevel === 'medium' ? 'bg-warning/20 text-warning' :
                      'bg-success/20 text-success'}`}
                  >
                    {proposal.riskLevel === 'high' && <AlertTriangle className="w-3 h-3" />}
                    {proposal.riskLevel.charAt(0).toUpperCase() + proposal.riskLevel.slice(1)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{proposal.title}</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Support Rate:</span>
                    <span className="text-success">{proposal.supportRate}%</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full ${proposal.riskLevel === 'high' ? 'bg-destructive' : 'bg-success'}`}
                      style={{ width: `${proposal.supportRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Token Distribution */}
        <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
          <h3 className="mb-4">Token Distribution Analysis</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data.tokenDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.tokenDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2 text-sm">
            {data.tokenDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="text-muted-foreground">• {item.name}:</span>
                <span>{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Voting Pattern */}
        <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
          <h3 className="mb-4">Voting Pattern Analysis</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.votingPatterns}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="proposalName" stroke="#94A3B8" tick={{ fontSize: 12 }} />
              <YAxis stroke="#94A3B8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
              />
              <Legend />
              <Bar dataKey="support" stackId="a" fill="#10B981" name="Support" />
              <Bar dataKey="against" stackId="a" fill="#EF4444" name="Against" />
              <Bar dataKey="abstain" stackId="a" fill="#94A3B8" name="Abstain" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Real-time Voting Monitor */}
      <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
        <h2 className="mb-4">Real-time Voting Monitor</h2>
        <div className="space-y-2">
          {data.liveVotes.map((vote, index) => (
            <div
              key={index}
              className="p-3 bg-secondary/20 rounded-lg border border-border font-mono text-sm hover:border-primary transition-colors animate-fade-in"
            >
              <span className="text-muted-foreground">{vote.timestamp}</span>
              <span className="mx-2">🗳️</span>
              <span className="text-primary">{vote.address}</span>
              <span className="mx-2">{vote.action}</span>
              <span className="text-warning">{vote.proposal}</span>
              <span className="mx-2 text-muted-foreground">({vote.tokens} tokens)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}