// import { Download } from 'lucide-react';
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

// const matrixData = [
//   { attack: 'Flash Loan', noDefense: 92, basic: 45, enhanced: 12 },
//   { attack: 'Sybil Attack', noDefense: 78, basic: 30, enhanced: 8 },
//   { attack: 'Bribery Attack', noDefense: 65, basic: 25, enhanced: 5 },
//   { attack: 'Combined Attack', noDefense: 85, basic: 40, enhanced: 15 },
// ];

// const costData = [
//   { name: 'Flash Loan', cost: 0.5, success: 92 },
//   { name: 'Sybil', cost: 2.1, success: 78 },
//   { name: 'Bribery', cost: 5.3, success: 65 },
//   { name: 'Combined', cost: 3.8, success: 85 },
// ];

// const radarData = [
//   { subject: 'Timelock', A: 85, fullMark: 100 },
//   { subject: 'Quorum', A: 75, fullMark: 100 },
//   { subject: 'Token Weight', A: 65, fullMark: 100 },
//   { subject: 'Vote Delay', A: 70, fullMark: 100 },
//   { subject: 'Emergency Pause', A: 90, fullMark: 100 },
//   { subject: 'Multi-sig', A: 95, fullMark: 100 },
// ];

// export function Comparison() {
//   return (
//     <div className="space-y-6">
//       {/* Filter Bar */}
//       <div className="bg-card rounded-lg p-4 border border-border shadow-lg">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-4">
//             <select className="bg-secondary border border-border rounded-lg px-4 py-2 text-sm">
//               <option>Attack Type: All</option>
//               <option>Flash Loan</option>
//               <option>Sybil Attack</option>
//               <option>Bribery Attack</option>
//             </select>
//             <select className="bg-secondary border border-border rounded-lg px-4 py-2 text-sm">
//               <option>Time Range: Last 7 Days</option>
//               <option>Last 24 Hours</option>
//               <option>Last 30 Days</option>
//             </select>
//             <select className="bg-secondary border border-border rounded-lg px-4 py-2 text-sm">
//               <option>Sort: Success Rate</option>
//               <option>Attack Cost</option>
//               <option>Time</option>
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
//                 <th className="text-center p-4 text-muted-foreground">Flash Loan</th>
//                 <th className="text-center p-4 text-muted-foreground">Sybil Attack</th>
//                 <th className="text-center p-4 text-muted-foreground">Bribery Attack</th>
//                 <th className="text-center p-4 text-muted-foreground">Combined Attack</th>
//               </tr>
//             </thead>
//             <tbody>
//               <tr className="border-b border-border hover:bg-secondary/20">
//                 <td className="p-4 text-muted-foreground">No Defense</td>
//                 <td className="text-center p-4">
//                   <span className="inline-block bg-destructive/20 text-destructive px-3 py-1 rounded">92%</span>
//                 </td>
//                 <td className="text-center p-4">
//                   <span className="inline-block bg-destructive/20 text-destructive px-3 py-1 rounded">78%</span>
//                 </td>
//                 <td className="text-center p-4">
//                   <span className="inline-block bg-warning/20 text-warning px-3 py-1 rounded">65%</span>
//                 </td>
//                 <td className="text-center p-4">
//                   <span className="inline-block bg-destructive/20 text-destructive px-3 py-1 rounded">85%</span>
//                 </td>
//               </tr>
//               <tr className="border-b border-border hover:bg-secondary/20">
//                 <td className="p-4 text-muted-foreground">Basic Defense</td>
//                 <td className="text-center p-4">
//                   <span className="inline-block bg-warning/20 text-warning px-3 py-1 rounded">45%</span>
//                 </td>
//                 <td className="text-center p-4">
//                   <span className="inline-block bg-warning/20 text-warning px-3 py-1 rounded">30%</span>
//                 </td>
//                 <td className="text-center p-4">
//                   <span className="inline-block bg-warning/20 text-warning px-3 py-1 rounded">25%</span>
//                 </td>
//                 <td className="text-center p-4">
//                   <span className="inline-block bg-warning/20 text-warning px-3 py-1 rounded">40%</span>
//                 </td>
//               </tr>
//               <tr className="hover:bg-secondary/20">
//                 <td className="p-4 text-muted-foreground">Enhanced Defense</td>
//                 <td className="text-center p-4">
//                   <span className="inline-block bg-success/20 text-success px-3 py-1 rounded">12%</span>
//                 </td>
//                 <td className="text-center p-4">
//                   <span className="inline-block bg-success/20 text-success px-3 py-1 rounded">8%</span>
//                 </td>
//                 <td className="text-center p-4">
//                   <span className="inline-block bg-success/20 text-success px-3 py-1 rounded">5%</span>
//                 </td>
//                 <td className="text-center p-4">
//                   <span className="inline-block bg-success/20 text-success px-3 py-1 rounded">15%</span>
//                 </td>
//               </tr>
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Cost-Benefit Analysis Chart */}
//       <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//         <h2 className="mb-6">Cost-Benefit Analysis</h2>
//         <ResponsiveContainer width="100%" height={300}>
//           <BarChart data={costData}>
//             <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
//             <XAxis dataKey="name" stroke="#94A3B8" />
//             <YAxis yAxisId="left" orientation="left" stroke="#94A3B8" label={{ value: 'Cost (ETH)', angle: -90, position: 'insideLeft', fill: '#94A3B8' }} />
//             <YAxis yAxisId="right" orientation="right" stroke="#94A3B8" label={{ value: 'Success Rate (%)', angle: 90, position: 'insideRight', fill: '#94A3B8' }} />
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
//             <RadarChart data={radarData}>
//               <PolarGrid stroke="#334155" />
//               <PolarAngleAxis dataKey="subject" stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 12 }} />
//               <PolarRadiusAxis stroke="#94A3B8" />
//               <Radar name="Defense Effect" dataKey="A" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
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
//             <div className="p-4 bg-secondary/20 rounded-lg border border-border">
//               <div className="flex items-center justify-between mb-2">
//                 <span className="text-muted-foreground">Flash Loan Attack ROI</span>
//                 <span className="text-2xl font-bold text-success">1840%</span>
//               </div>
//               <div className="text-xs text-muted-foreground">
//                 Cost: 0.5 ETH → Profit: 9.2 ETH
//               </div>
//             </div>
//             <div className="p-4 bg-secondary/20 rounded-lg border border-border">
//               <div className="flex items-center justify-between mb-2">
//                 <span className="text-muted-foreground">Sybil Attack ROI</span>
//                 <span className="text-2xl font-bold text-warning">371%</span>
//               </div>
//               <div className="text-xs text-muted-foreground">
//                 Cost: 2.1 ETH → Profit: 7.8 ETH
//               </div>
//             </div>
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
import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useComparisonData } from '../../hooks/useComparisonData';

export function Comparison() {
  const [attackType, setAttackType] = useState('all');
  const [timeRange, setTimeRange] = useState('7d');
  const [sort, setSort] = useState('success');
  const { data, loading, error } = useComparisonData(attackType, timeRange, sort);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
        <span className="ml-2 text-muted-foreground">Loading comparison data...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border text-center text-destructive">
        <p>{error || 'Failed to load data'}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-primary rounded">
          Retry
        </button>
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
              value={attackType}
              onChange={(e) => setAttackType(e.target.value)}
              className="bg-secondary border border-border rounded-lg px-4 py-2 text-sm"
            >
              <option value="all">Attack Type: All</option>
              <option value="flashloan">Flash Loan</option>
              <option value="sybil">Sybil Attack</option>
              <option value="bribery">Bribery Attack</option>
              <option value="combined">Combined Attack</option>
            </select>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-secondary border border-border rounded-lg px-4 py-2 text-sm"
            >
              <option value="1d">Time Range: Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-secondary border border-border rounded-lg px-4 py-2 text-sm"
            >
              <option value="success">Sort: Success Rate</option>
              <option value="cost">Attack Cost</option>
              <option value="time">Time</option>
            </select>
          </div>
          <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Attack Success Rate Matrix */}
      <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
        <h2 className="mb-6">Attack Success Rate Comparison Matrix</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-muted-foreground"></th>
                {data.matrix.map((row) => (
                  <th key={row.attackType} className="text-center p-4 text-muted-foreground">
                    {row.attackType}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* No Defense Row */}
              <tr className="border-b border-border hover:bg-secondary/20">
                <td className="p-4 text-muted-foreground">No Defense</td>
                {data.matrix.map((row) => (
                  <td key={row.attackType} className="text-center p-4">
                    <span className={`inline-block px-3 py-1 rounded ${
                      row.noDefense > 80 ? 'bg-destructive/20 text-destructive' :
                      row.noDefense > 60 ? 'bg-warning/20 text-warning' :
                      'bg-success/20 text-success'
                    }`}>
                      {row.noDefense}%
                    </span>
                  </td>
                ))}
              </tr>
              {/* Basic Defense Row */}
              <tr className="border-b border-border hover:bg-secondary/20">
                <td className="p-4 text-muted-foreground">Basic Defense</td>
                {data.matrix.map((row) => (
                  <td key={row.attackType} className="text-center p-4">
                    <span className="inline-block bg-warning/20 text-warning px-3 py-1 rounded">
                      {row.basicDefense}%
                    </span>
                  </td>
                ))}
              </tr>
              {/* Enhanced Defense Row */}
              <tr className="hover:bg-secondary/20">
                <td className="p-4 text-muted-foreground">Enhanced Defense</td>
                {data.matrix.map((row) => (
                  <td key={row.attackType} className="text-center p-4">
                    <span className="inline-block bg-success/20 text-success px-3 py-1 rounded">
                      {row.enhancedDefense}%
                    </span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Cost-Benefit Analysis Chart */}
      <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
        <h2 className="mb-6">Cost-Benefit Analysis</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.costBenefit}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94A3B8" />
            <YAxis yAxisId="left" orientation="left" stroke="#94A3B8" label={{ value: 'Cost (ETH)', angle: -90, position: 'insideLeft', fill: '#94A3B8' }} />
            <YAxis yAxisId="right" orientation="right" stroke="#94A3B8" label={{ value: 'Success Rate (%)', angle: 90, position: 'insideRight', fill: '#94A3B8' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
              labelStyle={{ color: '#F8FAFC' }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="cost" fill="#3B82F6" name="Attack Cost (ETH)" />
            <Bar yAxisId="right" dataKey="success" fill="#10B981" name="Success Rate (%)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Defense Radar Chart */}
        <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
          <h3 className="mb-6">Defense Effectiveness Radar</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={data.radar}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="subject" stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 12 }} />
              <PolarRadiusAxis stroke="#94A3B8" domain={[0, 100]} />
              <Radar name="Defense Effect" dataKey="value" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* ROI Analysis */}
        <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
          <h3 className="mb-6">ROI Analysis Cards</h3>
          <div className="space-y-4">
            {data.recommendations.map((rec, idx) => (
              <div key={idx} className="p-4 bg-secondary/20 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground">{rec.attackType} ROI</span>
                  <span className={`text-2xl font-bold ${rec.roi > 1000 ? 'text-success' : rec.roi > 300 ? 'text-warning' : 'text-muted-foreground'}`}>
                    {rec.roi}%
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Cost: {rec.cost} → Profit: {rec.profit}
                </div>
              </div>
            ))}
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
              <div className="mb-2 text-sm text-primary">Recommended Defense Investment</div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-muted-foreground text-sm">Investment:</span>
                <span className="font-bold">2.5 ETH/month</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Expected Savings:</span>
                <span className="font-bold text-success">250 ETH</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}