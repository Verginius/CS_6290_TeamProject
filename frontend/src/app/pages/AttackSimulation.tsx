// import { useState } from 'react';
// import { Play, Pause, Square, Circle } from 'lucide-react';
// import { useAttackSimulation } from '../../hooks/useAttackSimulation';

// export function AttackSimulation() {
//   const [defenseEnabled, setDefenseEnabled] = useState(false);
//   const { state, startSimulation, pauseSimulation, resetSimulation, updateConfig } = useAttackSimulation(defenseEnabled);

//   // 处理攻击类型变更（示例）
//   const handleAttackTypeChange = (type: typeof state.config.attackType) => {
//     updateConfig({ attackType: type });
//   };

//   return (
//     <div className="space-y-6">
//       {/* Control Bar */}
//       <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-4">
//             <button
//               onClick={state.isRunning ? pauseSimulation : startSimulation}
//               className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors"
//             >
//               {state.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
//               {state.isRunning ? 'Pause' : 'Start Simulation'}
//             </button>
//             <button
//               onClick={resetSimulation}
//               className="flex items-center gap-2 border border-border hover:bg-secondary text-foreground px-4 py-2 rounded-lg transition-colors"
//             >
//               <Square className="w-4 h-4" />
//               Reset
//             </button>
//           </div>
//           <div className="flex items-center gap-6">
//             <div className="flex items-center gap-3">
//               <button
//                 onClick={() => setDefenseEnabled(false)}
//                 className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
//                   !defenseEnabled ? 'bg-destructive text-destructive-foreground' : 'border border-border hover:bg-secondary'
//                 }`}
//               >
//                 <Circle className={`w-3 h-3 ${!defenseEnabled ? 'fill-current' : ''}`} />
//                 No Defense
//               </button>
//               <button
//                 onClick={() => setDefenseEnabled(true)}
//                 className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
//                   defenseEnabled ? 'bg-success text-success-foreground' : 'border border-border hover:bg-secondary'
//                 }`}
//               >
//                 <Circle className={`w-3 h-3 ${defenseEnabled ? 'fill-current' : ''}`} />
//                 With Defense
//               </button>
//             </div>
//             <div className="flex items-center gap-2">
//               <div className="w-48 h-2 bg-secondary rounded-full overflow-hidden">
//                 <div
//                   className="h-full bg-primary transition-all duration-300"
//                   style={{ width: `${state.progress}%` }}
//                 ></div>
//               </div>
//               <span className="text-sm font-mono w-12">{state.progress}%</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Attack Visualization */}
//       <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//         <h3 className="mb-6">Real-time Attack Visualization</h3>
//         <div className="relative h-64 bg-secondary/20 rounded-lg border border-border p-8">
//           <div className="flex items-center justify-around h-full">
//             {state.nodes.map((node) => (
//               <div key={node.id} className="text-center">
//                 <div
//                   className={`w-16 h-16 rounded-full border-2 flex items-center justify-center mb-2
//                     ${node.type === 'protocol' ? 'border-warning bg-warning/20' :
//                       node.type === 'wallet' ? 'border-destructive bg-destructive/20' :
//                       'border-primary bg-primary/20'}`}
//                 >
//                   <span className="text-2xl">
//                     {node.id === 'flashloan' && '⚡'}
//                     {node.id === 'attacker' && '👤'}
//                     {node.id === 'proposal' && '📝'}
//                     {node.id === 'treasury' && '💰'}
//                   </span>
//                 </div>
//                 <p className="text-xs text-muted-foreground">{node.label}</p>
//                 <p className="text-xs font-mono">{node.balance} ETH</p>
//               </div>
//             ))}
//             {/* 简化的连线（实际可用 SVG 绘制，这里用文字代替） */}
//           </div>
//           <div className="absolute inset-0 flex items-center justify-around pointer-events-none">
//             {/* 实际连线可用 SVG 线条，这里用简单文字示意 */}
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
//               <select
//                 value={state.config.attackType}
//                 onChange={(e) => handleAttackTypeChange(e.target.value as any)}
//                 className="bg-background border border-border rounded px-2 py-1"
//               >
//                 <option value="flashloan">Flash Loan</option>
//                 <option value="sybil">Sybil</option>
//                 <option value="bribery">Bribery</option>
//                 <option value="combined">Combined</option>
//               </select>
//             </div>
//             <div className="flex items-center justify-between">
//               <span className="text-muted-foreground">• Target Contract</span>
//               <span className="font-mono text-xs">{state.config.targetContract.slice(0, 10)}...</span>
//             </div>
//             <div className="flex items-center justify-between">
//               <span className="text-muted-foreground">• Initial Funds</span>
//               <span>{state.config.initialFunds} USDC</span>
//             </div>
//             <div className="flex items-center justify-between">
//               <span className="text-muted-foreground">• Flash Loan Source</span>
//               <select
//                 value={state.config.flashloanSource}
//                 onChange={(e) => updateConfig({ flashloanSource: e.target.value as any })}
//                 className="bg-background border border-border rounded px-2 py-1"
//               >
//                 <option value="aave">Aave V3</option>
//                 <option value="uniswap">Uniswap V3</option>
//                 <option value="balancer">Balancer</option>
//               </select>
//             </div>
//           </div>
//         </div>

//         {/* Real-time Metrics */}
//         <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//           <h3 className="mb-4 text-warning">Real-time Metrics</h3>
//           <div className="space-y-3 text-sm">
//             <div className="flex items-center justify-between">
//               <span className="text-muted-foreground">• Funds Transferred</span>
//               <span className={state.metrics.fundsTransferred !== '0' ? 'text-success' : 'text-muted-foreground'}>
//                 {state.metrics.fundsTransferred} USDC
//               </span>
//             </div>
//             <div className="flex items-center justify-between">
//               <span className="text-muted-foreground">• Attack Cost</span>
//               <span className="text-destructive">{state.metrics.attackCost} ETH</span>
//             </div>
//             <div className="flex items-center justify-between">
//               <span className="text-muted-foreground">• Success Rate</span>
//               <span className={state.metrics.successProbability > 80 ? 'text-success' : 'text-warning'}>
//                 {state.metrics.successProbability}%
//               </span>
//             </div>
//             <div className="flex items-center justify-between">
//               <span className="text-muted-foreground">• Gas Consumed</span>
//               <span>{state.metrics.gasUsed}</span>
//             </div>
//           </div>
//         </div>

//         {/* Stage Details */}
//         <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//           <h3 className="mb-4 text-success">Stage Details</h3>
//           <div className="space-y-3 text-sm">
//             <div className="flex items-center justify-between">
//               <span className="text-muted-foreground">Current Stage:</span>
//               <span className="text-warning capitalize">{state.stage}</span>
//             </div>
//             <div className="flex items-center justify-between">
//               <span className="text-muted-foreground">Progress:</span>
//               <span className="text-primary">{state.progress}%</span>
//             </div>
//             <div className="flex items-center justify-between">
//               <span className="text-muted-foreground">Remaining Blocks:</span>
//               <span className="font-mono">{Math.max(0, 100 - state.progress)}</span>
//             </div>
//             <div className="pt-2 border-t border-border">
//               <p className="text-xs text-muted-foreground">Detailed logs below...</p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Execution Log */}
//       <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//         <h3 className="mb-4">Attack Execution Log</h3>
//         <div className="space-y-2 font-mono text-sm max-h-80 overflow-y-auto">
//           {state.logs.length === 0 ? (
//             <div className="p-3 rounded-lg border border-border text-muted-foreground text-center">
//               No logs yet. Start simulation to see events.
//             </div>
//           ) : (
//             state.logs.map((log, index) => (
//               <div
//                 key={index}
//                 className={`p-3 rounded-lg border ${
//                   log.type === 'success' ? 'bg-success/5 border-success/20' :
//                   log.type === 'warning' ? 'bg-warning/5 border-warning/20' :
//                   log.type === 'error' ? 'bg-destructive/5 border-destructive/20' :
//                   'bg-primary/5 border-primary/20'
//                 }`}
//               >
//                 <span className="text-muted-foreground">{log.timestamp}</span>
//                 <span className="mx-2">{log.icon}</span>
//                 <span>{log.message}</span>
//               </div>
//             ))
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Play, Pause, Square, Circle, Loader2 } from 'lucide-react';
import { useAttackSimulation } from '../../hooks/useAttackSimulation';
import { SCENARIOS, SCENARIO_LIST } from '../../lib/scenarios';

export function AttackSimulation() {
  const [searchParams] = useSearchParams();
  const attackTypeParam = searchParams.get('type') || 'flashloan';
  const [defenseEnabled, setDefenseEnabled] = useState(false);
  const [selectedScenarioKey, setSelectedScenarioKey] = useState<string>('default');

  const currentScenario = SCENARIOS[selectedScenarioKey] || SCENARIOS.default;

  const { state, startSimulation, pauseSimulation, resetSimulation, updateConfig, loading, error } =
    useAttackSimulation(defenseEnabled, attackTypeParam, selectedScenarioKey);
  
  useEffect(() => {
  if (state.metrics.attackCost !== '0' && state.metrics.gasUsed !== '0') {
    localStorage.setItem('last_attack_metrics', JSON.stringify({
      attackCost: state.metrics.attackCost,
      gasUsed: state.metrics.gasUsed,
        }));
      }
    }, [state.metrics]);

  // 自动切换 Defense 模式
  useEffect(() => {
    if (state.stage === 'attack' && defenseEnabled) {
      setDefenseEnabled(false);
    } else if (state.stage === 'defended' && !defenseEnabled) {
      setDefenseEnabled(true);
    }
  }, [state.stage, defenseEnabled]);

  // 处理攻击类型变更
  const handleAttackTypeChange = (type: string) => {
    updateConfig({ attackType: type as any });
  };

  if (loading && !state.isRunning) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
        <span className="ml-2 text-muted-foreground">Preparing attack simulation...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 场景选择栏 */}
      <div className="bg-card rounded-lg p-4 border border-border shadow-lg">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium">Attack Scenario:</span>
          <select
            value={selectedScenarioKey}
            onChange={(e) => setSelectedScenarioKey(e.target.value)}
            className="bg-background border border-border rounded px-3 py-1.5 text-sm"
          >
            {SCENARIO_LIST.map(s => (
              <option key={s.key} value={s.key}>{s.name}</option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground">
            {currentScenario.description}
          </span>
        </div>
        {/* 可选：显示当前场景的 Governor 地址 */}
        <div className="mt-2 text-xs text-muted-foreground">
          Governor: {currentScenario.addresses.governorVulnerable.slice(0, 10)}...
          Treasury: {currentScenario.addresses.treasury.slice(0, 10)}...
        </div>
      </div>

      {/* Control Bar（原有代码保持不变） */}
      <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={state.isRunning ? pauseSimulation : startSimulation}
              disabled={loading}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
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
                  !defenseEnabled
                    ? 'bg-destructive text-destructive-foreground'
                    : 'border border-border hover:bg-secondary'
                }`}
              >
                <Circle className={`w-3 h-3 ${!defenseEnabled ? 'fill-current' : ''}`} />
                No Defense
              </button>
              <button
                onClick={() => setDefenseEnabled(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  defenseEnabled
                    ? 'bg-success text-success-foreground'
                    : 'border border-border hover:bg-secondary'
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
        {error && <div className="mt-4 text-destructive text-sm">{error}</div>}
      </div>

      {/* Attack Visualization */}
      <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3>Real-time Attack Visualization</h3>
          <div className={`px-3 py-1 rounded-full text-sm ${defenseEnabled ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
            {defenseEnabled ? '🛡️ With Defense' : '⚔️ No Defense'}
          </div>
        </div>
        <div className="relative h-64 bg-secondary/20 rounded-lg border border-border p-8">
          <div className="flex items-center justify-around h-full">
            {state.nodes.map((node) => (
              <div key={node.id} className="text-center">
                <div
                  className={`w-16 h-16 rounded-full border-2 flex items-center justify-center mb-2
                    ${
                      node.type === 'protocol'
                        ? 'border-warning bg-warning/20'
                        : node.type === 'wallet'
                        ? 'border-destructive bg-destructive/20'
                        : 'border-primary bg-primary/20'
                    }`}
                >
                  <span className="text-2xl">
                    {node.id === 'attacker' && '👤'}
                    {node.id === 'proposal' && '📝'}
                    {node.id === 'treasury' && '💰'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{node.label}</p>
                <p className="text-xs font-mono">
                  {node.id === 'attacker' && state.isRunning 
                    ? `${state.metrics.fundsTransferred} USDC` 
                    : node.balance}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info Cards Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Real-time Metrics */}
        <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
          <h3 className="mb-4 text-warning">Real-time Metrics</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">• Funds Transferred</span>
              <span
                className={
                  state.metrics.fundsTransferred !== '0' ? 'text-success' : 'text-muted-foreground'
                }
              >
                {state.metrics.fundsTransferred} USDC
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">• Attack Cost</span>
              <span className="text-destructive">{state.metrics.attackCost} ETH</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">• Success Rate</span>
              <span
                className={
                  state.metrics.successProbability > 80 ? 'text-success' : 'text-warning'
                }
              >
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
                  log.type === 'success'
                    ? 'bg-success/5 border-success/20'
                    : log.type === 'warning'
                    ? 'bg-warning/5 border-warning/20'
                    : log.type === 'error'
                    ? 'bg-destructive/5 border-destructive/20'
                    : 'bg-primary/5 border-primary/20'
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

// import { useState } from 'react';
// import { useSearchParams } from 'react-router-dom';
// import { Play, Pause, Square, Circle, Loader2 } from 'lucide-react';
// import { useAttackSimulation } from '../../hooks/useAttackSimulation';

// export function AttackSimulation() {
//   const [searchParams] = useSearchParams();
//   const attackTypeParam = searchParams.get('type') || 'flashloan';
//   const [defenseEnabled, setDefenseEnabled] = useState(false);

//   const { state, startSimulation, pauseSimulation, resetSimulation, updateConfig, loading, error } =
//     useAttackSimulation(defenseEnabled, attackTypeParam);

//   // 处理攻击类型变更
//   const handleAttackTypeChange = (type: string) => {
//     updateConfig({ attackType: type as any });
//   };

//   if (loading && !state.isRunning) {
//     return (
//       <div className="flex items-center justify-center h-96">
//         <Loader2 className="animate-spin text-primary w-8 h-8" />
//         <span className="ml-2 text-muted-foreground">Preparing attack simulation...</span>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Control Bar */}
//       <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-4">
//             <button
//               onClick={state.isRunning ? pauseSimulation : startSimulation}
//               disabled={loading}
//               className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
//             >
//               {state.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
//               {state.isRunning ? 'Pause' : 'Start Simulation'}
//             </button>
//             <button
//               onClick={resetSimulation}
//               className="flex items-center gap-2 border border-border hover:bg-secondary text-foreground px-4 py-2 rounded-lg transition-colors"
//             >
//               <Square className="w-4 h-4" />
//               Reset
//             </button>
//           </div>
//           <div className="flex items-center gap-6">
//             <div className="flex items-center gap-3">
//               <button
//                 onClick={() => setDefenseEnabled(false)}
//                 className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
//                   !defenseEnabled
//                     ? 'bg-destructive text-destructive-foreground'
//                     : 'border border-border hover:bg-secondary'
//                 }`}
//               >
//                 <Circle className={`w-3 h-3 ${!defenseEnabled ? 'fill-current' : ''}`} />
//                 No Defense
//               </button>
//               <button
//                 onClick={() => setDefenseEnabled(true)}
//                 className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
//                   defenseEnabled
//                     ? 'bg-success text-success-foreground'
//                     : 'border border-border hover:bg-secondary'
//                 }`}
//               >
//                 <Circle className={`w-3 h-3 ${defenseEnabled ? 'fill-current' : ''}`} />
//                 With Defense
//               </button>
//             </div>
//             <div className="flex items-center gap-2">
//               <div className="w-48 h-2 bg-secondary rounded-full overflow-hidden">
//                 <div
//                   className="h-full bg-primary transition-all duration-300"
//                   style={{ width: `${state.progress}%` }}
//                 ></div>
//               </div>
//               <span className="text-sm font-mono w-12">{state.progress}%</span>
//             </div>
//           </div>
//         </div>
//         {error && <div className="mt-4 text-destructive text-sm">{error}</div>}
//       </div>

//       {/* Attack Visualization */}
//       <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//         <h3 className="mb-6">Real-time Attack Visualization</h3>
//         <div className="relative h-64 bg-secondary/20 rounded-lg border border-border p-8">
//           <div className="flex items-center justify-around h-full">
//             {state.nodes.map((node) => (
//               <div key={node.id} className="text-center">
//                 <div
//                   className={`w-16 h-16 rounded-full border-2 flex items-center justify-center mb-2
//                     ${
//                       node.type === 'protocol'
//                         ? 'border-warning bg-warning/20'
//                         : node.type === 'wallet'
//                         ? 'border-destructive bg-destructive/20'
//                         : 'border-primary bg-primary/20'
//                     }`}
//                 >
//                   <span className="text-2xl">
//                     {node.id === 'flashloan' && '⚡'}
//                     {node.id === 'attacker' && '👤'}
//                     {node.id === 'proposal' && '📝'}
//                     {node.id === 'treasury' && '💰'}
//                   </span>
//                 </div>
//                 <p className="text-xs text-muted-foreground">{node.label}</p>
//                 <p className="text-xs font-mono">{node.balance}</p>
//               </div>
//             ))}
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
//               <select
//                 value={state.config.attackType}
//                 onChange={(e) => handleAttackTypeChange(e.target.value)}
//                 className="bg-background border border-border rounded px-2 py-1"
//               >
//                 <option value="flashloan">Flash Loan</option>
//                 <option value="whale">Whale Manipulation</option>
//                 <option value="spam">Proposal Spam</option>
//                 <option value="quorum">Quorum Manipulation</option>
//                 <option value="timelock">Timelock Exploit</option>
//               </select>
//             </div>
//             <div className="flex items-center justify-between">
//               <span className="text-muted-foreground">• Target Contract</span>
//               <span className="font-mono text-xs">{state.config.targetContract.slice(0, 10)}...</span>
//             </div>
//             <div className="flex items-center justify-between">
//               <span className="text-muted-foreground">• Initial Funds</span>
//               <span>{state.config.initialFunds} USDC</span>
//             </div>
//             <div className="flex items-center justify-between">
//               <span className="text-muted-foreground">• Flash Loan Source</span>
//               <select
//                 value={state.config.flashloanSource}
//                 onChange={(e) => updateConfig({ flashloanSource: e.target.value as any })}
//                 className="bg-background border border-border rounded px-2 py-1"
//               >
//                 <option value="aave">Aave V3</option>
//                 <option value="uniswap">Uniswap V3</option>
//                 <option value="balancer">Balancer</option>
//               </select>
//             </div>
//           </div>
//         </div>

//         {/* Real-time Metrics */}
//         <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//           <h3 className="mb-4 text-warning">Real-time Metrics</h3>
//           <div className="space-y-3 text-sm">
//             <div className="flex items-center justify-between">
//               <span className="text-muted-foreground">• Funds Transferred</span>
//               <span
//                 className={
//                   state.metrics.fundsTransferred !== '0' ? 'text-success' : 'text-muted-foreground'
//                 }
//               >
//                 {state.metrics.fundsTransferred} USDC
//               </span>
//             </div>
//             <div className="flex items-center justify-between">
//               <span className="text-muted-foreground">• Attack Cost</span>
//               <span className="text-destructive">{state.metrics.attackCost} ETH</span>
//             </div>
//             <div className="flex items-center justify-between">
//               <span className="text-muted-foreground">• Success Rate</span>
//               <span
//                 className={
//                   state.metrics.successProbability > 80 ? 'text-success' : 'text-warning'
//                 }
//               >
//                 {state.metrics.successProbability}%
//               </span>
//             </div>
//             <div className="flex items-center justify-between">
//               <span className="text-muted-foreground">• Gas Consumed</span>
//               <span>{state.metrics.gasUsed}</span>
//             </div>
//           </div>
//         </div>

//         {/* Stage Details */}
//         <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//           <h3 className="mb-4 text-success">Stage Details</h3>
//           <div className="space-y-3 text-sm">
//             <div className="flex items-center justify-between">
//               <span className="text-muted-foreground">Current Stage:</span>
//               <span className="text-warning capitalize">{state.stage}</span>
//             </div>
//             <div className="flex items-center justify-between">
//               <span className="text-muted-foreground">Progress:</span>
//               <span className="text-primary">{state.progress}%</span>
//             </div>
//             <div className="flex items-center justify-between">
//               <span className="text-muted-foreground">Remaining Blocks:</span>
//               <span className="font-mono">{Math.max(0, 100 - state.progress)}</span>
//             </div>
//             <div className="pt-2 border-t border-border">
//               <p className="text-xs text-muted-foreground">Detailed logs below...</p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Execution Log */}
//       <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//         <h3 className="mb-4">Attack Execution Log</h3>
//         <div className="space-y-2 font-mono text-sm max-h-80 overflow-y-auto">
//           {state.logs.length === 0 ? (
//             <div className="p-3 rounded-lg border border-border text-muted-foreground text-center">
//               No logs yet. Start simulation to see events.
//             </div>
//           ) : (
//             state.logs.map((log, index) => (
//               <div
//                 key={index}
//                 className={`p-3 rounded-lg border ${
//                   log.type === 'success'
//                     ? 'bg-success/5 border-success/20'
//                     : log.type === 'warning'
//                     ? 'bg-warning/5 border-warning/20'
//                     : log.type === 'error'
//                     ? 'bg-destructive/5 border-destructive/20'
//                     : 'bg-primary/5 border-primary/20'
//                 }`}
//               >
//                 <span className="text-muted-foreground">{log.timestamp}</span>
//                 <span className="mx-2">{log.icon}</span>
//                 <span>{log.message}</span>
//               </div>
//             ))
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }