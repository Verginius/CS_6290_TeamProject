import { useState } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line } from 'recharts';
import { useEconomicData } from '../../hooks/useEconomicData';

export function Economics() {
  const [tokenPrice, setTokenPrice] = useState(1250);
  const [gasPrice, setGasPrice] = useState(50);
  const [ethPrice, setEthPrice] = useState(3200);
  const [inputTokenPrice, setInputTokenPrice] = useState('1250');
  const [inputGasPrice, setInputGasPrice] = useState('50');
  const [inputEthPrice, setInputEthPrice] = useState('3200');

  const { data, loading } = useEconomicData(tokenPrice, gasPrice, ethPrice);

  const handleUpdate = () => {
    setTokenPrice(parseFloat(inputTokenPrice));
    setGasPrice(parseFloat(inputGasPrice));
    setEthPrice(parseFloat(inputEthPrice));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
        <span className="ml-2 text-muted-foreground">Loading economic data...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border text-center text-destructive">
        Failed to load economic data.
      </div>
    );
  }

  // 辅助函数：格式化货币
  const formatETH = (value: number) => `${value.toFixed(1)} ETH`;
  const formatUSD = (value: number) => `$${(value * ethPrice).toLocaleString()}`;

  return (
    <div className="space-y-6">
      {/* Parameter Settings */}
      <div className="bg-card rounded-lg p-4 border border-border shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Token Price:</span>
              <input
                type="text"
                value={inputTokenPrice}
                onChange={(e) => setInputTokenPrice(e.target.value)}
                className="bg-secondary border border-border rounded px-3 py-1 text-sm w-24"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Gas Price:</span>
              <input
                type="text"
                value={inputGasPrice}
                onChange={(e) => setInputGasPrice(e.target.value)}
                className="bg-secondary border border-border rounded px-3 py-1 text-sm w-24"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">ETH Price:</span>
              <input
                type="text"
                value={inputEthPrice}
                onChange={(e) => setInputEthPrice(e.target.value)}
                className="bg-secondary border border-border rounded px-3 py-1 text-sm w-24"
              />
            </div>
          </div>
          <button
            onClick={handleUpdate}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Update
          </button>
        </div>
      </div>

      {/* Attack Cost Breakdown */}
      <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
        <h2 className="mb-6">Attack Cost Breakdown</h2>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.costBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {data.costBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || ['#3B82F6', '#EF4444', '#F59E0B', '#94A3B8'][index % 4]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-center mb-6">
              <div className="text-3xl font-bold mb-1">{formatETH(data.roiCalculator.attackCost)}</div>
              <div className="text-muted-foreground text-sm">(≈ {formatUSD(data.roiCalculator.attackCost)})</div>
            </div>
            <div className="space-y-3">
              {data.costBreakdown.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: ['#3B82F6', '#EF4444', '#F59E0B', '#94A3B8'][index % 4] }}></div>
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
        </div>
      </div>

      {/* Calculators Row */}
      <div className="grid grid-cols-3 gap-6">
        {/* ROI Calculator */}
        <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
          <h3 className="mb-4 text-primary">ROI Calculator</h3>
          <div className="space-y-4">
            <div className="p-3 bg-secondary/20 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Attack Target Funds:</span>
                <span className="font-bold">{formatETH(data.roiCalculator.targetFunds)}</span>
              </div>
            </div>
            <div className="p-3 bg-secondary/20 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Attack Cost:</span>
                <span className="font-bold text-destructive">{formatETH(data.roiCalculator.attackCost)}</span>
              </div>
            </div>
            <div className="p-3 bg-success/10 rounded-lg border border-success/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Expected Profit:</span>
                <span className="font-bold text-success">{formatETH(data.roiCalculator.expectedProfit)}</span>
              </div>
            </div>
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">ROI</div>
                <div className="text-3xl font-bold text-primary">{data.roiCalculator.roi.toFixed(0)}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Break-even Analysis */}
        <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
          <h3 className="mb-4 text-warning">Break-even Analysis</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data.breakEvenData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="amount" stroke="#94A3B8" tick={{ fontSize: 10 }} />
              <YAxis stroke="#94A3B8" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
              />
              <Line type="monotone" dataKey="profit" stroke="#F59E0B" strokeWidth={2} dot={{ fill: '#F59E0B' }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">• Break-even Point:</span>
              <span className="font-bold">
                {data.breakEvenData.find(d => d.profit >= 0)?.amount?.toFixed(0) || 'N/A'} ETH
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">• Current Target:</span>
              <span className="text-success">{formatETH(data.roiCalculator.targetFunds)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">• Safety Margin:</span>
              <span className="text-success">
                {((data.roiCalculator.targetFunds - (data.breakEvenData.find(d => d.profit >= 0)?.amount || 0)) / (data.breakEvenData.find(d => d.profit >= 0)?.amount || 1) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Sensitivity Analysis */}
        <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
          <h3 className="mb-4 text-success">Sensitivity Analysis</h3>
          <div className="space-y-2">
            {data.sensitivityData.map((item, index) => (
              <div key={index} className="p-2 bg-secondary/20 rounded-lg">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{item.param}</span>
                  <span className={item.impact > 0 ? 'text-success' : 'text-destructive'}>
                    {item.impact > 0 ? '+' : ''}{item.impact}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.impact > 0 ? 'bg-success' : 'bg-destructive'}`}
                    style={{ width: `${Math.abs(item.impact) * 5}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Defense Investment ROI */}
      <div className="bg-card rounded-lg p-6 border border-border shadow-lg">
        <h2 className="mb-6">Defense Investment ROI Analysis</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.defenseROI}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94A3B8" />
            <YAxis stroke="#94A3B8" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
            />
            <Legend />
            <Bar dataKey="investment" fill="#EF4444" name="Investment (ETH/month)" />
            <Bar dataKey="savings" fill="#10B981" name="Savings (ETH/month)" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-6 p-4 bg-success/10 rounded-lg border border-success/30">
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-2">Total Defense ROI</div>
            <div className="text-4xl font-bold text-success">{data.totalDefenseROI.toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground mt-2">
              Total Investment: {formatETH(data.totalInvestment)}/month → Total Savings: {formatETH(data.totalSavings)}/month
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
