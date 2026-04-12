import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

import { useEffect, useState } from 'react';
import { getChainInfo } from '../../lib/chain';

import { 
  Home, 
  Zap, 
  BarChart3, 
  Building2, 
  DollarSign, 
  Shield, 
  TrendingUp,
  User,
  Circle
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [blockNumber, setBlockNumber] = useState(0);
  const [connected, setConnected] = useState(false);
  useEffect(() => {
  const fetchData = async () => {
    const data = await getChainInfo();
    setBlockNumber(data.blockNumber);
    setConnected(data.connected);
  };

  fetchData();

  const interval = setInterval(fetchData, 3000); // 每3秒更新
  return () => clearInterval(interval);
}, []);
  const navItems = [
    { path: '/', icon: Home, label: 'Overview' },
    { path: '/attack', icon: Zap, label: 'Attack Simulation' },
    { path: '/comparison', icon: BarChart3, label: 'Comparison' },
    { path: '/governance', icon: Building2, label: 'Governance' },
    { path: '/economics', icon: DollarSign, label: 'Economics' },
    { path: '/defense', icon: Shield, label: 'Defense Lab' },
    { path: '/history', icon: TrendingUp, label: 'Historical Data' },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Left Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl">Governance Attack Simulator</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Status Bar */}
        <header className="h-16 bg-card border-b border-border px-8 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">Network:</span>
              <span className="font-medium">Ethereum Mainnet (Forked)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">Block Height:</span>
              <span className="font-mono">
                {blockNumber ? `#${blockNumber.toLocaleString()}` : '—'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">Status:</span>
              <Circle
                className={`w-2 h-2 ${
                  connected ? 'fill-success text-success' : 'fill-destructive text-destructive'
                }`}/>
              <span className={connected ? 'text-success text-sm' : 'text-destructive text-sm'}>
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 cursor-pointer hover:bg-secondary px-3 py-2 rounded-lg">
            <User className="w-5 h-5" />
            <span className="text-sm">User Menu</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}