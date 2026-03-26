// import { useState } from 'react';
// import { Play, Pause, Square, Circle } from 'lucide-react';

// export function AttackSimulation() {
//   const [isRunning, setIsRunning] = useState(false);
//   const [hasDefense, setHasDefense] = useState(false);
//   const [progress, setProgress] = useState(65);

//   const logs = [
//     { time: '14:30:02', icon: '✅', message: 'Flash Loan Success: Borrowed 100,000 USDC', type: 'success' },
//     { time: '14:30:05', icon: '📝', message: 'Proposal Submitted: Malicious Fund Transfer', type: 'info' },
//     { time: '14:30:10', icon: '🗳️', message: 'Voting Started: 100 Block Voting Period', type: 'info' },
//     { time: '14:30:15', icon: '⚡', message: 'Vote Manipulation: Using Borrowed Tokens', type: 'warning' },
//   ];

//   return (
//     <div className="space-y-6">
//       {/* Control Bar */}
//       <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-4">
//             <button 
//               onClick={() => setIsRunning(!isRunning)}
//               className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors"
//             >
//               {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
//               {isRunning ? 'Pause' : 'Start Simulation'}
//             </button>
//             <button className="flex items-center gap-2 border border-border hover:bg-secondary text-foreground px-4 py-2 rounded-lg transition-colors">
//               <Square className="w-4 h-4" />
//               Reset
//             </button>
//           </div>
//           <div className="flex items-center gap-6">
//             <div className="flex items-center gap-3">
//               <button 
//                 onClick={() => setHasDefense(false)}
//                 className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
//                   !hasDefense ? 'bg-destructive text-destructive-foreground' : 'border border-border hover:bg-secondary'
//                 }`}
//               >
//                 <Circle className={`w-3 h-3 ${!hasDefense ? 'fill-current' : ''}`} />
//                 No Defense
//               </button>
//               <button 
//                 onClick={() => setHasDefense(true)}
//                 className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
//                   hasDefense ? 'bg-success text-success-foreground' : 'border border-border hover:bg-secondary'
//                 }`}
//               >
//                 <Circle className={`w-3 h-3 ${hasDefense ? 'fill-current' : ''}`} />
//                 With Defense
//               </button>
//             </div>
//             <div className="flex items-center gap-2">
//               <div className="w-48 h-2 bg-secondary rounded-full overflow-hidden">
//                 <div 
//                   className="h-full bg-primary transition-all duration-300"
//                   style={{ width: `${progress}%` }}
//                 ></div>
//               </div>
//               <span className="text-sm font-mono w-12">{progress}%</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Attack Visualization */}
//       <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//         <h3 className="mb-6">Real-time Attack Visualization</h3>
//         <div className="relative h-64 bg-secondary/20 rounded-lg border border-border p-8">
//           {/* Attack Flow Diagram */}
//           <div className="flex items-center justify-around h-full">
//             <div className="text-center">
//               <div className="w-16 h-16 rounded-full bg-warning/20 border-2 border-warning flex items-center justify-center mb-2">
//                 <span className="text-2xl">⚡</span>
//               </div>
//               <p className="text-xs text-muted-foreground">Flash Loan</p>
//               <p className="text-xs font-mono">(Aave)</p>
//             </div>
            
//             <div className="flex-1 h-0.5 bg-gradient-to-r from-warning via-destructive to-primary mx-4"></div>
            
//             <div className="text-center">
//               <div className="w-16 h-16 rounded-full bg-destructive/20 border-2 border-destructive flex items-center justify-center mb-2">
//                 <span className="text-2xl">📝</span>
//               </div>
//               <p className="text-xs text-muted-foreground">Proposal</p>
//               <p className="text-xs font-mono">(Attacker)</p>
//             </div>
            
//             <div className="flex-1 h-0.5 bg-gradient-to-r from-destructive via-warning to-primary mx-4"></div>
            
//             <div className="text-center">
//               <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center mb-2">
//                 <span className="text-2xl">🗳️</span>
//               </div>
//               <p className="text-xs text-muted-foreground">Voting</p>
//               <p className="text-xs font-mono">(DAO)</p>
//             </div>
            
//             <div className="flex-1 h-0.5 bg-gradient-to-r from-primary to-success mx-4"></div>
            
//             <div className="text-center">
//               <div className="w-16 h-16 rounded-full bg-success/20 border-2 border-success flex items-center justify-center mb-2">
//                 <span className="text-2xl">💰</span>
//               </div>
//               <p className="text-xs text-muted-foreground">Target</p>
//               <p className="text-xs font-mono">(Treasury)</p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Info Cards Row */}
//       <div className="grid grid-cols-3 gap-6">
//         {/* Attack Config */}
//         <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//           <h3 className="mb-4 text-primary">Attack Configuration</h3>
//           <div className="space-y-3 text-sm">
//             <div className="flex items-center justify-between">
//               <span className="text-muted-foreground">• Attack Type</span>
//               <span>Flash Loan</span>
//             </div>
//             <div className="flex items-center justify-between">
//               <span className="text-muted-foreground">• Target Contract</span>
//               <span className="font-mono text-xs">0x123...abc</span>
//             </div>
//             <div className="flex items-center justify-between">
//               <span className="text-muted-foreground">• Initial Funds</span>
//               <span>100,000 USDC</span>
//             </div>
//             <div className="flex items-center justify-between">
//               <span className="text-muted-foreground">• Flash Loan Source</span>
//               <span>Aave V3</span>
//             </div>
//           </div>
//         </div>

//         {/* Real-time Metrics */}
//         <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//           <h3 className="mb-4 text-warning">Real-time Metrics</h3>
//           <div className="space-y-3 text-sm">
//             <div className="flex items-center justify-between">
//               <span className="text-muted-foreground">• Funds Transferred</span>
//               <span className="text-success">85,000 USDC</span>
//             </div>
//             <div className="flex items-center justify-between">
//               <span className="text-muted-foreground">• Attack Cost</span>
//               <span className="text-destructive">2.8 ETH</span>
//             </div>
//             <div className="flex items-center justify-between">
//               <span className="text-muted-foreground">• Success Rate</span>
//               <span className="text-success">92%</span>
//             </div>
//             <div className="flex items-center justify-between">
//               <span className="text-muted-foreground">• Gas Consumed</span>
//               <span>1,250,000</span>
//             </div>
//           </div>
//         </div>

//         {/* Stage Details */}
//         <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//           <h3 className="mb-4 text-success">Stage Details</h3>
//           <div className="space-y-3 text-sm">
//             <div className="flex items-center justify-between">
//               <span className="text-muted-foreground">Current Stage:</span>
//               <span className="text-warning">Voting</span>
//             </div>
//             <div className="flex items-center justify-between">
//               <span className="text-muted-foreground">Progress:</span>
//               <span className="text-primary">78%</span>
//             </div>
//             <div className="flex items-center justify-between">
//               <span className="text-muted-foreground">Remaining Blocks:</span>
//               <span className="font-mono">42</span>
//             </div>
//             <div className="pt-2 border-t border-border">
//               <p className="text-xs text-muted-foreground">Detailed logs...</p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Execution Log */}
//       <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//         <h3 className="mb-4">Attack Execution Log</h3>
//         <div className="space-y-2 font-mono text-sm">
//           {logs.map((log, index) => (
//             <div 
//               key={index}
//               className={`p-3 rounded-lg border ${
//                 log.type === 'success' ? 'bg-success/5 border-success/20' :
//                 log.type === 'warning' ? 'bg-warning/5 border-warning/20' :
//                 'bg-primary/5 border-primary/20'
//               }`}
//             >
//               <span className="text-muted-foreground">{log.time}</span>
//               <span className="mx-2">{log.icon}</span>
//               <span>{log.message}</span>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

import { useState } from 'react';
import { Play, Pause, Square, Circle } from 'lucide-react';
import { useAttackSimulation } from '../../hooks/useAttackSimulation';

export function AttackSimulation() {
  const [defenseEnabled, setDefenseEnabled] = useState(false);
  const { state, startSimulation, pauseSimulation, resetSimulation, updateConfig } = useAttackSimulation(defenseEnabled);

  // 处理攻击类型变更（示例）
  const handleAttackTypeChange = (type: typeof state.config.attackType) => {
    updateConfig({ attackType: type });
  };

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={state.isRunning ? pauseSimulation : startSimulation}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors"
            >
              {state.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {state.isRunning ? 'Pause' : 'Start Simulation'}
            </button>
            <button
              onClick={resetSimulation}
              className="flex items-center gap-2 border border-border hover:bg-secondary text-foreground px-4 py-2 rounded-lg transition-colors"
            >
              <Square className="w-4 h-4" />
              Reset
            </button>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDefenseEnabled(false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  !defenseEnabled ? 'bg-destructive text-destructive-foreground' : 'border border-border hover:bg-secondary'
                }`}
              >
                <Circle className={`w-3 h-3 ${!defenseEnabled ? 'fill-current' : ''}`} />
                No Defense
              </button>
              <button
                onClick={() => setDefenseEnabled(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  defenseEnabled ? 'bg-success text-success-foreground' : 'border border-border hover:bg-secondary'
                }`}
              >
                <Circle className={`w-3 h-3 ${defenseEnabled ? 'fill-current' : ''}`} />
                With Defense
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-48 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${state.progress}%` }}
                ></div>
              </div>
              <span className="text-sm font-mono w-12">{state.progress}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Attack Visualization */}
      <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
        <h3 className="mb-6">Real-time Attack Visualization</h3>
        <div className="relative h-64 bg-secondary/20 rounded-lg border border-border p-8">
          <div className="flex items-center justify-around h-full">
            {state.nodes.map((node) => (
              <div key={node.id} className="text-center">
                <div
                  className={`w-16 h-16 rounded-full border-2 flex items-center justify-center mb-2
                    ${node.type === 'protocol' ? 'border-warning bg-warning/20' :
                      node.type === 'wallet' ? 'border-destructive bg-destructive/20' :
                      'border-primary bg-primary/20'}`}
                >
                  <span className="text-2xl">
                    {node.id === 'flashloan' && '⚡'}
                    {node.id === 'attacker' && '👤'}
                    {node.id === 'proposal' && '📝'}
                    {node.id === 'treasury' && '💰'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{node.label}</p>
                <p className="text-xs font-mono">{node.balance} ETH</p>
              </div>
            ))}
            {/* 简化的连线（实际可用 SVG 绘制，这里用文字代替） */}
          </div>
          <div className="absolute inset-0 flex items-center justify-around pointer-events-none">
            {/* 实际连线可用 SVG 线条，这里用简单文字示意 */}
          </div>
        </div>
      </div>

      {/* Info Cards Row */}
      <div className="grid grid-cols-3 gap-6">
        {/* Attack Config */}
        <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
          <h3 className="mb-4 text-primary">Attack Configuration</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">• Attack Type</span>
              <select
                value={state.config.attackType}
                onChange={(e) => handleAttackTypeChange(e.target.value as any)}
                className="bg-background border border-border rounded px-2 py-1"
              >
                <option value="flashloan">Flash Loan</option>
                <option value="sybil">Sybil</option>
                <option value="bribery">Bribery</option>
                <option value="combined">Combined</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">• Target Contract</span>
              <span className="font-mono text-xs">{state.config.targetContract.slice(0, 10)}...</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">• Initial Funds</span>
              <span>{state.config.initialFunds} USDC</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">• Flash Loan Source</span>
              <select
                value={state.config.flashloanSource}
                onChange={(e) => updateConfig({ flashloanSource: e.target.value as any })}
                className="bg-background border border-border rounded px-2 py-1"
              >
                <option value="aave">Aave V3</option>
                <option value="uniswap">Uniswap V3</option>
                <option value="balancer">Balancer</option>
              </select>
            </div>
          </div>
        </div>

        {/* Real-time Metrics */}
        <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
          <h3 className="mb-4 text-warning">Real-time Metrics</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">• Funds Transferred</span>
              <span className={state.metrics.fundsTransferred !== '0' ? 'text-success' : 'text-muted-foreground'}>
                {state.metrics.fundsTransferred} USDC
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">• Attack Cost</span>
              <span className="text-destructive">{state.metrics.attackCost} ETH</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">• Success Rate</span>
              <span className={state.metrics.successProbability > 80 ? 'text-success' : 'text-warning'}>
                {state.metrics.successProbability}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">• Gas Consumed</span>
              <span>{state.metrics.gasUsed}</span>
            </div>
          </div>
        </div>

        {/* Stage Details */}
        <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
          <h3 className="mb-4 text-success">Stage Details</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Current Stage:</span>
              <span className="text-warning capitalize">{state.stage}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Progress:</span>
              <span className="text-primary">{state.progress}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Remaining Blocks:</span>
              <span className="font-mono">{Math.max(0, 100 - state.progress)}</span>
            </div>
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">Detailed logs below...</p>
            </div>
          </div>
        </div>
      </div>

      {/* Execution Log */}
      <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
        <h3 className="mb-4">Attack Execution Log</h3>
        <div className="space-y-2 font-mono text-sm max-h-80 overflow-y-auto">
          {state.logs.length === 0 ? (
            <div className="p-3 rounded-lg border border-border text-muted-foreground text-center">
              No logs yet. Start simulation to see events.
            </div>
          ) : (
            state.logs.map((log, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  log.type === 'success' ? 'bg-success/5 border-success/20' :
                  log.type === 'warning' ? 'bg-warning/5 border-warning/20' :
                  log.type === 'error' ? 'bg-destructive/5 border-destructive/20' :
                  'bg-primary/5 border-primary/20'
                }`}
              >
                <span className="text-muted-foreground">{log.timestamp}</span>
                <span className="mx-2">{log.icon}</span>
                <span>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}