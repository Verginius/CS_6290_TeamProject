// 
import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useHistoricalData } from '../../hooks/useHistoricalData';

export function History() {
  const [timeRange, setTimeRange] = useState('30d');
  const { data, loading, error } = useHistoricalData(timeRange);

  // 时间范围按钮配置
  const ranges = [
    { label: '1 Day', value: '1d' },
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
    { label: '90 Days', value: '90d' },
    { label: 'Custom', value: 'custom' },
  ];

  const getCorrelationColor = (value: number) => {
    if (value > 0.5) return 'bg-success/30 text-success';
    if (value < -0.5) return 'bg-destructive/30 text-destructive';
    return 'bg-secondary/30 text-muted-foreground';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
        <span className="ml-2 text-muted-foreground">Loading historical data...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border text-center text-destructive">
        <p>{error || 'Failed to load historical data'}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-primary rounded">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="bg-card rounded-lg p-4 border border-border shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {ranges.map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  timeRange === range.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 border border-border hover:bg-secondary rounded-lg transition-colors">
              Compare Mode
            </button>
            <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors">
              <Download className="w-4 h-4" />
              Export Data
            </button>
          </div>
        </div>
      </div>

      {/* Attack Frequency Trend */}
      <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
        <h2 className="mb-6">Attack Frequency Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.frequency}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#94A3B8" />
            <YAxis stroke="#94A3B8" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
              labelStyle={{ color: '#F8FAFC' }}
            />
            <Legend />
            <Line type="monotone" dataKey="flashLoan" stroke="#EF4444" strokeWidth={2} name="Flash Loan Attack" />
            <Line type="monotone" dataKey="sybil" stroke="#F59E0B" strokeWidth={2} name="Sybil Attack" />
            <Line type="monotone" dataKey="bribery" stroke="#3B82F6" strokeWidth={2} name="Bribery Attack" />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/30">
            <div className="text-muted-foreground mb-1">Flash Loan Attack</div>
            <div className="font-bold text-destructive">
              {data.frequency[0]?.flashLoan} → {data.frequency[data.frequency.length - 1]?.flashLoan}{' '}
              ({((data.frequency[data.frequency.length - 1]?.flashLoan - data.frequency[0]?.flashLoan) / data.frequency[0]?.flashLoan * 100).toFixed(0)}%)
            </div>
          </div>
          <div className="p-3 bg-warning/10 rounded-lg border border-warning/30">
            <div className="text-muted-foreground mb-1">Sybil Attack</div>
            <div className="font-bold text-warning">
              {data.frequency[0]?.sybil} → {data.frequency[data.frequency.length - 1]?.sybil}{' '}
              ({((data.frequency[data.frequency.length - 1]?.sybil - data.frequency[0]?.sybil) / data.frequency[0]?.sybil * 100).toFixed(0)}%)
            </div>
          </div>
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/30">
            <div className="text-muted-foreground mb-1">Bribery Attack</div>
            <div className="font-bold text-primary">
              {data.frequency[0]?.bribery} → {data.frequency[data.frequency.length - 1]?.bribery}{' '}
              ({((data.frequency[data.frequency.length - 1]?.bribery - data.frequency[0]?.bribery) / data.frequency[0]?.bribery * 100).toFixed(0)}%)
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row - Three Charts */}
      <div className="grid grid-cols-3 gap-6">
        {/* Success Rate Trend */}
        <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
          <h3 className="mb-4">Success Rate Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.successRate}>
              <defs>
                <linearGradient id="flashLoan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="sybil" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="bribery" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94A3B8" tick={{ fontSize: 10 }} />
              <YAxis stroke="#94A3B8" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
              />
              <Area type="monotone" dataKey="flashLoan" stroke="#EF4444" fillOpacity={1} fill="url(#flashLoan)" />
              <Area type="monotone" dataKey="sybil" stroke="#F59E0B" fillOpacity={1} fill="url(#sybil)" />
              <Area type="monotone" dataKey="bribery" stroke="#3B82F6" fillOpacity={1} fill="url(#bribery)" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">• Flash Loan:</span>
              <span className="text-destructive">{data.successRate[0]?.flashLoan}% → {data.successRate[data.successRate.length - 1]?.flashLoan}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">• Sybil:</span>
              <span className="text-warning">{data.successRate[0]?.sybil}% → {data.successRate[data.successRate.length - 1]?.sybil}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">• Bribery:</span>
              <span className="text-primary">{data.successRate[0]?.bribery}% → {data.successRate[data.successRate.length - 1]?.bribery}%</span>
            </div>
          </div>
        </div>

        {/* Attack Cost Trend */}
        <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
          <h3 className="mb-4">Attack Cost Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.attackCost}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94A3B8" tick={{ fontSize: 10 }} />
              <YAxis stroke="#94A3B8" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
              />
              <Bar dataKey="average" fill="#3B82F6" name="Average Cost" />
              <Bar dataKey="median" fill="#10B981" name="Median" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">• Average Cost:</span>
              <span className="text-primary">{data.attackCost[0]?.average} → {data.attackCost[data.attackCost.length - 1]?.average} ETH</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">• Median:</span>
              <span className="text-success">{data.attackCost[0]?.median} → {data.attackCost[data.attackCost.length - 1]?.median} ETH</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">• Growth Rate:</span>
              <span className="text-warning">+{((data.attackCost[data.attackCost.length - 1]?.average - data.attackCost[0]?.average) / data.attackCost[0]?.average * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* Defense Adoption Trend */}
        <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
          <h3 className="mb-4">Defense Adoption Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.defenseAdoption}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94A3B8" tick={{ fontSize: 10 }} />
              <YAxis stroke="#94A3B8" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
              />
              <Area type="monotone" dataKey="timelock" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
              <Area type="monotone" dataKey="quorum" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
              <Area type="monotone" dataKey="multisig" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">• Timelock:</span>
              <span className="text-success">{data.defenseAdoption[0]?.timelock}% → {data.defenseAdoption[data.defenseAdoption.length - 1]?.timelock}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">• Quorum:</span>
              <span className="text-primary">{data.defenseAdoption[0]?.quorum}% → {data.defenseAdoption[data.defenseAdoption.length - 1]?.quorum}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">• Multi-sig:</span>
              <span className="text-warning">{data.defenseAdoption[0]?.multisig}% → {data.defenseAdoption[data.defenseAdoption.length - 1]?.multisig}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Correlation Analysis Matrix */}
      <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
        <h2 className="mb-6">Correlation Analysis Matrix</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-muted-foreground w-32"></th>
                <th className="text-center p-4 text-muted-foreground">Attack Frequency</th>
                <th className="text-center p-4 text-muted-foreground">Success Rate</th>
                <th className="text-center p-4 text-muted-foreground">Cost</th>
                <th className="text-center p-4 text-muted-foreground">Defense Adoption</th>
              </tr>
            </thead>
            <tbody>
              {data.correlation.map((row, i) => (
                <tr key={i} className="border-b border-border hover:bg-secondary/20">
                  <td className="p-4 text-muted-foreground">{row.metric}</td>
                  <td className="text-center p-4">
                    <span className={`inline-block px-3 py-1 rounded ${getCorrelationColor(row.freq)}`}>
                      {row.freq.toFixed(2)}
                    </span>
                  </td>
                  <td className="text-center p-4">
                    <span className={`inline-block px-3 py-1 rounded ${getCorrelationColor(row.success)}`}>
                      {row.success.toFixed(2)}
                    </span>
                  </td>
                  <td className="text-center p-4">
                    <span className={`inline-block px-3 py-1 rounded ${getCorrelationColor(row.cost)}`}>
                      {row.cost.toFixed(2)}
                    </span>
                  </td>
                  <td className="text-center p-4">
                    <span className={`inline-block px-3 py-1 rounded ${getCorrelationColor(row.defense)}`}>
                      {row.defense.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-success/30"></div>
            <span>Positive Correlation (&gt; 0.5)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-destructive/30"></div>
            <span>Negative Correlation (&lt; -0.5)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-secondary/30"></div>
            <span>Weak Correlation (-0.5 ~ 0.5)</span>
          </div>
        </div>
      </div>

      {/* Prediction Analysis */}
      <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
        <h2 className="mb-6">Prediction Analysis</h2>
        <div className="grid grid-cols-3 gap-6">
          <div className="p-6 bg-warning/10 rounded-lg border border-warning/30">
            <div className="text-sm text-muted-foreground mb-2">Expected Attack Frequency</div>
            <div className="text-3xl font-bold text-warning mb-1">{data.predictions.attackFrequencyChange > 0 ? '+' : ''}{data.predictions.attackFrequencyChange}%</div>
            <div className="text-xs text-muted-foreground">Next 30 days prediction</div>
          </div>
          <div className="p-6 bg-success/10 rounded-lg border border-success/30">
            <div className="text-sm text-muted-foreground mb-2">Expected Success Rate</div>
            <div className="text-3xl font-bold text-success mb-1">{data.predictions.successRateChange > 0 ? '+' : ''}{data.predictions.successRateChange}%</div>
            <div className="text-xs text-muted-foreground">Defense improvement effect</div>
          </div>
          <div className="p-6 bg-primary/10 rounded-lg border border-primary/30">
            <div className="text-sm text-muted-foreground mb-2">Recommended Defense Upgrade</div>
            <div className="text-sm font-bold text-primary mb-1">{data.predictions.recommendation}</div>
            <div className="text-xs text-muted-foreground">Based on historical data analysis</div>
          </div>
        </div>
      </div>
    </div>
  );
}
