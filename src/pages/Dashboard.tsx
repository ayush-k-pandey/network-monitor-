import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../lib/AuthContext';
import { 
  Activity, ArrowUp, ArrowDown, Globe, Shield, 
  LayoutDashboard, FileText, Settings, LogOut,
  AlertTriangle, Clock, Server
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

interface TrafficLog {
  id: number;
  timestamp: string;
  source_ip: string;
  destination_ip: string;
  domain: string;
  protocol: string;
  upload_bytes: number;
  download_bytes: number;
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

export default function Dashboard() {
  const { user, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [logs, setLogs] = useState<TrafficLog[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  // WebSocket for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'TRAFFIC_UPDATE') {
        setLogs(prev => [message.data, ...prev].slice(0, 50));
      }
    };

    return () => ws.close();
  }, []);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      const headers = { Authorization: `Bearer ${token}` };
      const [summaryRes, historyRes, settingsRes] = await Promise.all([
        fetch('/api/traffic/summary', { headers }),
        fetch('/api/traffic/history', { headers }),
        fetch('/api/settings', { headers })
      ]);
      
      setSummary(await summaryRes.json());
      setHistory(await historyRes.json());
      setSettings(await settingsRes.json());
    };
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [token]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalUsageGB = useMemo(() => {
    if (!summary) return 0;
    return (summary.stats.total_upload + summary.stats.total_download) / (1024 * 1024 * 1024);
  }, [summary]);

  const isOverLimit = settings && totalUsageGB > settings.data_limit_gb;

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col p-6 fixed h-full">
        <div className="flex items-center gap-2 font-bold text-xl mb-12">
          <Activity className="text-emerald-500" />
          <span>SmartTraffic</span>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { id: 'overview', icon: <LayoutDashboard size={20} />, label: 'Overview' },
            { id: 'reports', icon: <FileText size={20} />, label: 'Reports' },
            { id: 'settings', icon: <Settings size={20} />, label: 'Settings' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === item.id ? 'bg-emerald-50 text-emerald-600' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-6 px-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
              {user?.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user?.username}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 p-10">
        <header className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-2">Network Dashboard</h1>
            <p className="text-gray-500">Real-time traffic analysis and system health.</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 flex items-center gap-3 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">System Online</span>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Alert Banner */}
              {isOverLimit && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-4 text-red-700">
                  <AlertTriangle className="text-red-500" />
                  <div>
                    <p className="font-bold">Data Limit Exceeded</p>
                    <p className="text-sm opacity-80">Your current usage ({totalUsageGB.toFixed(2)} GB) has exceeded your limit of {settings.data_limit_gb} GB.</p>
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-6">
                <StatCard 
                  title="Total Download" 
                  value={formatBytes(summary?.stats.total_download || 0)} 
                  icon={<ArrowDown className="text-blue-500" />}
                  trend="+12% from last month"
                />
                <StatCard 
                  title="Total Upload" 
                  value={formatBytes(summary?.stats.total_upload || 0)} 
                  icon={<ArrowUp className="text-emerald-500" />}
                  trend="+5% from last month"
                />
                <StatCard 
                  title="Active Domains" 
                  value={summary?.topDomains.length || 0} 
                  icon={<Globe className="text-purple-500" />}
                  trend="Monitoring 24/7"
                />
                <StatCard 
                  title="Packets Captured" 
                  value={summary?.stats.total_packets.toLocaleString() || 0} 
                  icon={<Shield className="text-orange-500" />}
                  trend="Real-time analysis"
                />
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-3 gap-8">
                <div className="col-span-2 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="font-bold text-lg">Traffic History (24h)</h3>
                    <div className="flex gap-4 text-xs font-medium">
                      <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Upload</div>
                      <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /> Download</div>
                    </div>
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={history}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="hour" 
                          tickFormatter={(val) => format(new Date(val), 'HH:mm')}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: '#9ca3af' }}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: '#9ca3af' }}
                          tickFormatter={(val) => formatBytes(val)}
                        />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          formatter={(val: number) => [formatBytes(val), '']}
                        />
                        <Line type="monotone" dataKey="upload" stroke="#10b981" strokeWidth={3} dot={false} />
                        <Line type="monotone" dataKey="download" stroke="#3b82f6" strokeWidth={3} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-lg mb-8">Protocol Distribution</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={summary?.protocolStats || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="count"
                          nameKey="protocol"
                        >
                          {summary?.protocolStats.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Real-time Feed */}
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                  <h3 className="font-bold text-lg">Live Traffic Feed</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Clock size={14} />
                    <span>Updated just now</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-gray-50/50 text-gray-400 font-medium uppercase tracking-wider text-[10px]">
                        <th className="px-8 py-4">Timestamp</th>
                        <th className="px-8 py-4">Domain</th>
                        <th className="px-8 py-4">Protocol</th>
                        <th className="px-8 py-4">Source IP</th>
                        <th className="px-8 py-4">Upload</th>
                        <th className="px-8 py-4">Download</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-8 py-4 font-mono text-xs text-gray-400">
                            {format(new Date(log.timestamp), 'HH:mm:ss')}
                          </td>
                          <td className="px-8 py-4 font-bold text-gray-700">{log.domain}</td>
                          <td className="px-8 py-4">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                              log.protocol === 'HTTPS' ? 'bg-emerald-100 text-emerald-700' :
                              log.protocol === 'DNS' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {log.protocol}
                            </span>
                          </td>
                          <td className="px-8 py-4 font-mono text-xs text-gray-500">{log.source_ip}</td>
                          <td className="px-8 py-4 text-emerald-600 font-medium">{formatBytes(log.upload_bytes)}</td>
                          <td className="px-8 py-4 text-blue-600 font-medium">{formatBytes(log.download_bytes)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'reports' && (
            <motion.div 
              key="reports"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="bg-white p-10 rounded-[2rem] border border-gray-100 shadow-sm">
                <h3 className="text-2xl font-bold mb-8">Monthly Usage Report</h3>
                <div className="grid grid-cols-2 gap-12">
                  <div>
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Top Domains by Usage</h4>
                    <div className="space-y-4">
                      {summary?.topDomains.map((d: any, i: number) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-400">
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-bold">{d.domain}</span>
                              <span className="text-gray-500">{formatBytes(d.total_bytes)}</span>
                            </div>
                            <div className="w-full bg-gray-50 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-emerald-500 h-full rounded-full" 
                                style={{ width: `${(d.total_bytes / summary.topDomains[0].total_bytes) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gray-900 rounded-3xl p-8 text-white flex flex-col justify-between">
                    <div>
                      <p className="text-gray-400 text-sm mb-2">Total Bandwidth Consumed</p>
                      <p className="text-5xl font-bold">{formatBytes((summary?.stats.total_upload || 0) + (summary?.stats.total_download || 0))}</p>
                    </div>
                    <div className="pt-8 border-t border-white/10 flex justify-between items-center">
                      <div className="flex gap-4">
                        <button className="bg-white text-black px-6 py-3 rounded-xl text-sm font-bold hover:bg-gray-100 transition-colors">
                          Export CSV
                        </button>
                        <button className="border border-white/20 px-6 py-3 rounded-xl text-sm font-bold hover:bg-white/5 transition-colors">
                          Print PDF
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl"
            >
              <div className="bg-white p-10 rounded-[2rem] border border-gray-100 shadow-sm">
                <h3 className="text-2xl font-bold mb-8">System Settings</h3>
                <form className="space-y-8" onSubmit={async (e) => {
                  e.preventDefault();
                  const res = await fetch('/api/settings', {
                    method: 'POST',
                    headers: { 
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(settings)
                  });
                  if (res.ok) alert('Settings saved successfully!');
                }}>
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-700">Monthly Data Limit (GB)</label>
                    <input 
                      type="number" 
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      value={settings?.data_limit_gb || 0}
                      onChange={e => setSettings({...settings, data_limit_gb: parseFloat(e.target.value)})}
                    />
                    <p className="text-xs text-gray-400">Set a threshold to receive alerts when your usage exceeds this value.</p>
                  </div>

                  <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl">
                    <div>
                      <p className="font-bold">Enable Alerts</p>
                      <p className="text-xs text-gray-500">Receive system notifications when limits are reached.</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setSettings({...settings, alerts_enabled: !settings.alerts_enabled})}
                      className={`w-14 h-8 rounded-full p-1 transition-colors ${settings?.alerts_enabled ? 'bg-emerald-500' : 'bg-gray-300'}`}
                    >
                      <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${settings?.alerts_enabled ? 'translate-x-6' : ''}`} />
                    </button>
                  </div>

                  <button type="submit" className="bg-black text-white px-8 py-4 rounded-2xl font-bold hover:bg-gray-800 transition-colors">
                    Save Changes
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, trend }: { title: string, value: string | number, icon: React.ReactNode, trend: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
          {icon}
        </div>
      </div>
      <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
      <p className="text-2xl font-bold mb-2">{value}</p>
      <p className="text-[10px] text-gray-400 font-medium">{trend}</p>
    </div>
  );
}
