// import { Save, Upload } from 'lucide-react';

// export function Defense() {
//   return (
//     <div className="space-y-6">
//       {/* Scenario Selector */}
//       <div className="bg-card rounded-lg p-4 border border-border shadow-lg">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-4">
//             <select className="bg-secondary border border-border rounded-lg px-4 py-2 text-sm">
//               <option>Preset Scenario: Flash Loan Attack</option>
//               <option>Sybil Attack</option>
//               <option>Bribery Attack</option>
//               <option>Combined Attack</option>
//             </select>
//             <button className="px-4 py-2 border border-border hover:bg-secondary rounded-lg text-sm transition-colors">
//               Custom Config
//             </button>
//           </div>
//           <div className="flex items-center gap-2">
//             <button className="flex items-center gap-2 border border-border hover:bg-secondary px-4 py-2 rounded-lg transition-colors">
//               <Save className="w-4 h-4" />
//               Save Config
//             </button>
//             <button className="flex items-center gap-2 border border-border hover:bg-secondary px-4 py-2 rounded-lg transition-colors">
//               <Upload className="w-4 h-4" />
//               Load Config
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Defense Mechanism Config Panel */}
//       <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//         <h2 className="mb-6">Defense Mechanism Configuration Panel</h2>
//         <div className="space-y-4">
//           {/* Timelock */}
//           <div className="p-4 bg-secondary/20 rounded-lg border border-border">
//             <div className="flex items-center justify-between mb-3">
//               <div className="flex items-center gap-3">
//                 <input type="checkbox" defaultChecked className="w-4 h-4" />
//                 <span className="font-medium">Timelock</span>
//               </div>
//               <span className="text-sm text-success">Enabled</span>
//             </div>
//             <div className="flex items-center gap-4">
//               <span className="text-sm text-muted-foreground w-20">Delay:</span>
//               <input type="range" min="0" max="100" defaultValue="62" className="flex-1" />
//               <span className="text-sm font-mono w-24">48 hours</span>
//             </div>
//           </div>

//           {/* Quorum */}
//           <div className="p-4 bg-secondary/20 rounded-lg border border-border">
//             <div className="flex items-center justify-between mb-3">
//               <div className="flex items-center gap-3">
//                 <input type="checkbox" defaultChecked className="w-4 h-4" />
//                 <span className="font-medium">Quorum</span>
//               </div>
//               <span className="text-sm text-success">Enabled</span>
//             </div>
//             <div className="flex items-center gap-4">
//               <span className="text-sm text-muted-foreground w-20">Threshold:</span>
//               <input type="range" min="0" max="100" defaultValue="75" className="flex-1" />
//               <span className="text-sm font-mono w-24">15%</span>
//             </div>
//           </div>

//           {/* Voting Delay */}
//           <div className="p-4 bg-secondary/20 rounded-lg border border-border">
//             <div className="flex items-center justify-between mb-3">
//               <div className="flex items-center gap-3">
//                 <input type="checkbox" defaultChecked className="w-4 h-4" />
//                 <span className="font-medium">Voting Delay</span>
//               </div>
//               <span className="text-sm text-success">Enabled</span>
//             </div>
//             <div className="flex items-center gap-4">
//               <span className="text-sm text-muted-foreground w-20">Blocks:</span>
//               <input type="range" min="0" max="100" defaultValue="50" className="flex-1" />
//               <span className="text-sm font-mono w-24">10,000</span>
//             </div>
//           </div>

//           {/* Emergency Pause */}
//           <div className="p-4 bg-secondary/20 rounded-lg border border-border">
//             <div className="flex items-center justify-between mb-3">
//               <div className="flex items-center gap-3">
//                 <input type="checkbox" defaultChecked className="w-4 h-4" />
//                 <span className="font-medium">Emergency Pause</span>
//               </div>
//               <span className="text-sm text-success">Enabled</span>
//             </div>
//             <div className="flex items-center gap-4">
//               <span className="text-sm text-muted-foreground w-20">Trigger:</span>
//               <select className="flex-1 bg-secondary border border-border rounded px-3 py-1 text-sm">
//                 <option>75% Abnormal Voting</option>
//                 <option>90% Abnormal Voting</option>
//                 <option>Flash Loan Detected</option>
//               </select>
//             </div>
//           </div>

//           {/* Multi-sig */}
//           <div className="p-4 bg-secondary/20 rounded-lg border border-border">
//             <div className="flex items-center justify-between mb-3">
//               <div className="flex items-center gap-3">
//                 <input type="checkbox" defaultChecked className="w-4 h-4" />
//                 <span className="font-medium">Multi-signature</span>
//               </div>
//               <span className="text-sm text-success">Enabled</span>
//             </div>
//             <div className="grid grid-cols-2 gap-4">
//               <div className="flex items-center gap-4">
//                 <span className="text-sm text-muted-foreground">Signers:</span>
//                 <input type="number" defaultValue="5" className="flex-1 bg-secondary border border-border rounded px-3 py-1 text-sm" />
//               </div>
//               <div className="flex items-center gap-4">
//                 <span className="text-sm text-muted-foreground">Threshold:</span>
//                 <input type="number" defaultValue="3" className="flex-1 bg-secondary border border-border rounded px-3 py-1 text-sm" />
//               </div>
//             </div>
//           </div>

//           {/* Token Weight */}
//           <div className="p-4 bg-secondary/20 rounded-lg border border-border">
//             <div className="flex items-center justify-between mb-3">
//               <div className="flex items-center gap-3">
//                 <input type="checkbox" defaultChecked className="w-4 h-4" />
//                 <span className="font-medium">Token Weight</span>
//               </div>
//               <span className="text-sm text-success">Enabled</span>
//             </div>
//             <div className="flex items-center gap-4">
//               <span className="text-sm text-muted-foreground w-20">Type:</span>
//               <select className="flex-1 bg-secondary border border-border rounded px-3 py-1 text-sm">
//                 <option>Quadratic Voting</option>
//                 <option>Linear Voting</option>
//                 <option>Time-weighted</option>
//               </select>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Analysis Cards Row */}
//       <div className="grid grid-cols-3 gap-6">
//         {/* Real-time Effect Preview */}
//         <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//           <h3 className="mb-4 text-primary">Real-time Effect Preview</h3>
//           <div className="text-center mb-6">
//             <div className="text-sm text-muted-foreground mb-2">Attack Success Probability</div>
//             <div className="relative inline-block">
//               <div className="text-5xl font-bold text-success">12%</div>
//               <div className="absolute -top-2 -right-8 text-xs text-muted-foreground">Current</div>
//             </div>
//           </div>
//           <div className="p-4 bg-secondary/20 rounded-lg">
//             <div className="flex items-center justify-between text-sm mb-2">
//               <span className="text-muted-foreground">Original:</span>
//               <span className="text-destructive font-bold">92%</span>
//             </div>
//             <div className="flex items-center justify-between text-sm">
//               <span className="text-muted-foreground">Reduction:</span>
//               <span className="text-success font-bold">-80%</span>
//             </div>
//           </div>
//         </div>

//         {/* Config Impact Analysis */}
//         <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//           <h3 className="mb-4 text-warning">Configuration Impact Analysis</h3>
//           <div className="space-y-3">
//             <div className="p-3 bg-secondary/20 rounded-lg">
//               <div className="flex items-center justify-between mb-1">
//                 <span className="text-sm text-muted-foreground">Attack Cost:</span>
//                 <span className="text-success">+120%</span>
//               </div>
//               <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
//                 <div className="h-full bg-success" style={{ width: '60%' }}></div>
//               </div>
//             </div>
//             <div className="p-3 bg-secondary/20 rounded-lg">
//               <div className="flex items-center justify-between mb-1">
//                 <span className="text-sm text-muted-foreground">Success Rate:</span>
//                 <span className="text-success">-85%</span>
//               </div>
//               <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
//                 <div className="h-full bg-success" style={{ width: '85%' }}></div>
//               </div>
//             </div>
//             <div className="p-3 bg-secondary/20 rounded-lg">
//               <div className="flex items-center justify-between mb-1">
//                 <span className="text-sm text-muted-foreground">Gas Consumption:</span>
//                 <span className="text-warning">+45%</span>
//               </div>
//               <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
//                 <div className="h-full bg-warning" style={{ width: '45%' }}></div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Trade-off Analysis */}
//         <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//           <h3 className="mb-4 text-success">Trade-off Analysis</h3>
//           <div className="mb-4 text-center">
//             <div className="text-xs text-muted-foreground mb-2">Current Configuration Score</div>
//           </div>
//           <div className="space-y-3">
//             <div>
//               <div className="flex items-center justify-between mb-1 text-sm">
//                 <span className="text-muted-foreground">Security:</span>
//                 <span className="font-bold text-success">92/100</span>
//               </div>
//               <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
//                 <div className="h-full bg-success" style={{ width: '92%' }}></div>
//               </div>
//             </div>
//             <div>
//               <div className="flex items-center justify-between mb-1 text-sm">
//                 <span className="text-muted-foreground">Efficiency:</span>
//                 <span className="font-bold text-warning">78/100</span>
//               </div>
//               <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
//                 <div className="h-full bg-warning" style={{ width: '78%' }}></div>
//               </div>
//             </div>
//             <div>
//               <div className="flex items-center justify-between mb-1 text-sm">
//                 <span className="text-muted-foreground">Cost:</span>
//                 <span className="font-bold text-primary">65/100</span>
//               </div>
//               <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
//                 <div className="h-full bg-primary" style={{ width: '65%' }}></div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Stress Test Console */}
//       <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
//         <h2 className="mb-6">Stress Test Console</h2>
//         <div className="flex items-center gap-4 mb-6">
//           <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg transition-colors">
//             Test
//           </button>
//           <div className="flex items-center gap-2">
//             <span className="text-sm text-muted-foreground">Concurrent Attacks:</span>
//             <input type="number" defaultValue="5" className="bg-secondary border border-border rounded px-3 py-1 w-20 text-sm" />
//           </div>
//           <div className="flex items-center gap-2">
//             <span className="text-sm text-muted-foreground">Duration:</span>
//             <input type="text" defaultValue="24 hours" className="bg-secondary border border-border rounded px-3 py-1 w-24 text-sm" />
//           </div>
//           <button className="bg-success hover:bg-success/90 text-success-foreground px-6 py-2 rounded-lg transition-colors ml-auto">
//             Start Test
//           </button>
//         </div>
//         <div className="p-6 bg-secondary/20 rounded-lg border border-border">
//           <div className="mb-4">
//             <div className="flex items-center justify-between mb-2">
//               <span className="text-sm text-muted-foreground">Test Progress:</span>
//               <span className="text-sm font-mono">65%</span>
//             </div>
//             <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
//               <div className="h-full bg-primary" style={{ width: '65%' }}></div>
//             </div>
//           </div>
//           <div className="grid grid-cols-3 gap-6 text-center">
//             <div>
//               <div className="text-2xl font-bold text-success mb-1">42/65</div>
//               <div className="text-xs text-muted-foreground">Successful Defenses</div>
//             </div>
//             <div>
//               <div className="text-2xl font-bold text-primary mb-1">3.2</div>
//               <div className="text-xs text-muted-foreground">Avg Response Time (blocks)</div>
//             </div>
//             <div>
//               <div className="text-2xl font-bold text-warning mb-1">23</div>
//               <div className="text-xs text-muted-foreground">Pending Tests</div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

import { useState } from 'react';
import { Save, Upload, Loader2 } from 'lucide-react';
import { useDefenseConfig } from '../../hooks/useDefenseConfig';

export function Defense() {
  const {
    config,
    impact,
    tradeoff,
    stressResult,
    loading,
    error,
    updateNested,
    saveConfig,
    loadPreset,
    startStressTest,
    resetConfig,
  } = useDefenseConfig();

  const [preset, setPreset] = useState('Flash Loan Attack');
  const [concurrentAttacks, setConcurrentAttacks] = useState(5);
  const [duration, setDuration] = useState(24);

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setPreset(value);
    loadPreset(value);
  };

  const handleStartTest = () => {
    startStressTest(concurrentAttacks, duration);
  };

  if (loading && !config) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
        <span className="ml-2 text-muted-foreground">Loading defense configuration...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border text-center text-destructive">
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-primary rounded">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Scenario Selector */}
      <div className="bg-card rounded-lg p-4 border border-border shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <select
              value={preset}
              onChange={handlePresetChange}
              className="bg-secondary border border-border rounded-lg px-4 py-2 text-sm"
            >
              <option>Flash Loan Attack</option>
              <option>Sybil Attack</option>
              <option>Bribery Attack</option>
              <option>Combined Attack</option>
            </select>
            <button
              onClick={resetConfig}
              className="px-4 py-2 border border-border hover:bg-secondary rounded-lg text-sm transition-colors"
            >
              Custom Config
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={saveConfig}
              className="flex items-center gap-2 border border-border hover:bg-secondary px-4 py-2 rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Config
            </button>
            <button className="flex items-center gap-2 border border-border hover:bg-secondary px-4 py-2 rounded-lg transition-colors">
              <Upload className="w-4 h-4" />
              Load Config
            </button>
          </div>
        </div>
      </div>

      {/* Defense Mechanism Config Panel */}
      <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
        <h2 className="mb-6">Defense Mechanism Configuration Panel</h2>
        <div className="space-y-4">
          {/* Timelock */}
          <div className="p-4 bg-secondary/20 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={config.timelock.enabled}
                  onChange={(e) => updateNested('timelock', 'enabled', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="font-medium">Timelock</span>
              </div>
              <span className="text-sm text-success">{config.timelock.enabled ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground w-20">Delay:</span>
              <input
                type="range"
                min="0"
                max="168"
                value={config.timelock.delay}
                onChange={(e) => updateNested('timelock', 'delay', parseInt(e.target.value))}
                className="flex-1"
                disabled={!config.timelock.enabled}
              />
              <span className="text-sm font-mono w-24">{config.timelock.delay} hours</span>
            </div>
          </div>

          {/* Quorum */}
          <div className="p-4 bg-secondary/20 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={config.quorum.enabled}
                  onChange={(e) => updateNested('quorum', 'enabled', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="font-medium">Quorum</span>
              </div>
              <span className="text-sm text-success">{config.quorum.enabled ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground w-20">Threshold:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={config.quorum.threshold}
                onChange={(e) => updateNested('quorum', 'threshold', parseInt(e.target.value))}
                className="flex-1"
                disabled={!config.quorum.enabled}
              />
              <span className="text-sm font-mono w-24">{config.quorum.threshold}%</span>
            </div>
          </div>

          {/* Voting Delay */}
          <div className="p-4 bg-secondary/20 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={config.votingDelay.enabled}
                  onChange={(e) => updateNested('votingDelay', 'enabled', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="font-medium">Voting Delay</span>
              </div>
              <span className="text-sm text-success">{config.votingDelay.enabled ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground w-20">Blocks:</span>
              <input
                type="range"
                min="0"
                max="20000"
                step="100"
                value={config.votingDelay.blocks}
                onChange={(e) => updateNested('votingDelay', 'blocks', parseInt(e.target.value))}
                className="flex-1"
                disabled={!config.votingDelay.enabled}
              />
              <span className="text-sm font-mono w-24">{config.votingDelay.blocks}</span>
            </div>
          </div>

          {/* Emergency Pause */}
          <div className="p-4 bg-secondary/20 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={config.emergencyPause.enabled}
                  onChange={(e) => updateNested('emergencyPause', 'enabled', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="font-medium">Emergency Pause</span>
              </div>
              <span className="text-sm text-success">{config.emergencyPause.enabled ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground w-20">Trigger:</span>
              <select
                value={config.emergencyPause.triggerCondition}
                onChange={(e) => updateNested('emergencyPause', 'triggerCondition', e.target.value)}
                className="flex-1 bg-secondary border border-border rounded px-3 py-1 text-sm"
                disabled={!config.emergencyPause.enabled}
              >
                <option>75% Abnormal Voting</option>
                <option>90% Abnormal Voting</option>
                <option>Flash Loan Detected</option>
              </select>
            </div>
          </div>

          {/* Multi-sig */}
          <div className="p-4 bg-secondary/20 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={config.multisig.enabled}
                  onChange={(e) => updateNested('multisig', 'enabled', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="font-medium">Multi-signature</span>
              </div>
              <span className="text-sm text-success">{config.multisig.enabled ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Signers:</span>
                <input
                  type="number"
                  value={config.multisig.signers}
                  onChange={(e) => updateNested('multisig', 'signers', parseInt(e.target.value))}
                  className="flex-1 bg-secondary border border-border rounded px-3 py-1 text-sm"
                  disabled={!config.multisig.enabled}
                  min={1}
                  max={10}
                />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Threshold:</span>
                <input
                  type="number"
                  value={config.multisig.threshold}
                  onChange={(e) => updateNested('multisig', 'threshold', parseInt(e.target.value))}
                  className="flex-1 bg-secondary border border-border rounded px-3 py-1 text-sm"
                  disabled={!config.multisig.enabled}
                  min={1}
                  max={config.multisig.signers}
                />
              </div>
            </div>
          </div>

          {/* Token Weight */}
          <div className="p-4 bg-secondary/20 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={config.tokenWeighting.enabled}
                  onChange={(e) => updateNested('tokenWeighting', 'enabled', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="font-medium">Token Weight</span>
              </div>
              <span className="text-sm text-success">{config.tokenWeighting.enabled ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground w-20">Type:</span>
              <select
                value={config.tokenWeighting.type}
                onChange={(e) => updateNested('tokenWeighting', 'type', e.target.value as any)}
                className="flex-1 bg-secondary border border-border rounded px-3 py-1 text-sm"
                disabled={!config.tokenWeighting.enabled}
              >
                <option value="linear">Linear Voting</option>
                <option value="quadratic">Quadratic Voting</option>
                <option value="sqrt">Square Root Weight</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Cards Row */}
      <div className="grid grid-cols-3 gap-6">
        {/* Real-time Effect Preview */}
        <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
          <h3 className="mb-4 text-primary">Real-time Effect Preview</h3>
          <div className="text-center mb-6">
            <div className="text-sm text-muted-foreground mb-2">Attack Success Probability</div>
            <div className="relative inline-block">
              <div className="text-5xl font-bold text-success">
                {Math.max(0, Math.min(100, 100 + impact.successRateChange))}%
              </div>
              <div className="absolute -top-2 -right-8 text-xs text-muted-foreground">Current</div>
            </div>
          </div>
          <div className="p-4 bg-secondary/20 rounded-lg">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Original:</span>
              <span className="text-destructive font-bold">92%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Reduction:</span>
              <span className="text-success font-bold">{Math.abs(impact.successRateChange)}%</span>
            </div>
          </div>
        </div>

        {/* Config Impact Analysis */}
        <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
          <h3 className="mb-4 text-warning">Configuration Impact Analysis</h3>
          <div className="space-y-3">
            <div className="p-3 bg-secondary/20 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Attack Cost:</span>
                <span className="text-success">{impact.attackCostChange > 0 ? '+' : ''}{impact.attackCostChange}%</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-success" style={{ width: `${Math.min(100, Math.abs(impact.attackCostChange))}%` }}></div>
              </div>
            </div>
            <div className="p-3 bg-secondary/20 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Success Rate:</span>
                <span className="text-success">{impact.successRateChange}%</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-success" style={{ width: `${Math.abs(impact.successRateChange)}%` }}></div>
              </div>
            </div>
            <div className="p-3 bg-secondary/20 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Gas Consumption:</span>
                <span className="text-warning">+{impact.gasUsageChange}%</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-warning" style={{ width: `${impact.gasUsageChange}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Trade-off Analysis */}
        <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
          <h3 className="mb-4 text-success">Trade-off Analysis</h3>
          <div className="mb-4 text-center">
            <div className="text-xs text-muted-foreground mb-2">Current Configuration Score</div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1 text-sm">
                <span className="text-muted-foreground">Security:</span>
                <span className="font-bold text-success">{tradeoff.security}/100</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-success" style={{ width: `${tradeoff.security}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1 text-sm">
                <span className="text-muted-foreground">Efficiency:</span>
                <span className="font-bold text-warning">{tradeoff.efficiency}/100</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-warning" style={{ width: `${tradeoff.efficiency}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1 text-sm">
                <span className="text-muted-foreground">Cost:</span>
                <span className="font-bold text-primary">{tradeoff.cost}/100</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${tradeoff.cost}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stress Test Console */}
      <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
        <h2 className="mb-6">Stress Test Console</h2>
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleStartTest}
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin inline mr-2" /> : null}
            Test
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Concurrent Attacks:</span>
            <input
              type="number"
              value={concurrentAttacks}
              onChange={(e) => setConcurrentAttacks(parseInt(e.target.value))}
              className="bg-secondary border border-border rounded px-3 py-1 w-20 text-sm"
              min={1}
              max={100}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Duration:</span>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="bg-secondary border border-border rounded px-3 py-1 w-24 text-sm"
              min={1}
              max={168}
            />
            <span className="text-sm">hours</span>
          </div>
          <button
            onClick={handleStartTest}
            className="bg-success hover:bg-success/90 text-success-foreground px-6 py-2 rounded-lg transition-colors ml-auto"
          >
            Start Test
          </button>
        </div>

        {stressResult && (
          <div className="p-6 bg-secondary/20 rounded-lg border border-border">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Test Progress:</span>
                <span className="text-sm font-mono">{stressResult.progress || 0}%</span>
              </div>
              <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${stressResult.progress || 0}%` }}></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-success mb-1">{stressResult.defended}/{stressResult.totalAttacks}</div>
                <div className="text-xs text-muted-foreground">Successful Defenses</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary mb-1">{stressResult.averageResponseTime}</div>
                <div className="text-xs text-muted-foreground">Avg Response Time (blocks)</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-warning mb-1">{stressResult.totalFundsLost} ETH</div>
                <div className="text-xs text-muted-foreground">Total Funds Lost</div>
              </div>
            </div>
            {stressResult.status === 'running' && (
              <div className="mt-4 text-center text-sm text-muted-foreground">Test in progress...</div>
            )}
            {stressResult.status === 'completed' && (
              <div className="mt-4 text-center text-sm text-success">Test completed successfully.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
