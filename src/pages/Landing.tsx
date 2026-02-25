import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { Shield, Activity, BarChart3, Bell, Globe, ArrowRight, Lock, Mail, User } from 'lucide-react';
import { motion } from 'motion/react';

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.token) {
        login(data.token, data.user);
      } else if (data.success) {
        setIsLogin(true);
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <Activity className="text-emerald-500" />
          <span>SmartTraffic</span>
        </div>
        <div className="flex gap-8 items-center text-sm font-medium text-gray-600">
          <a href="#features" className="hover:text-black">Features</a>
          <a href="#security" className="hover:text-black">Security</a>
          {isAuthenticated ? (
            <button onClick={() => window.location.href = '/dashboard'} className="bg-black text-white px-5 py-2 rounded-full hover:bg-gray-800 transition-colors">
              Dashboard
            </button>
          ) : (
            <button onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })} className="bg-black text-white px-5 py-2 rounded-full hover:bg-gray-800 transition-colors">
              Get Started
            </button>
          )}
        </div>
      </nav>

      <main>
        <section className="max-w-7xl mx-auto px-6 pt-20 pb-32 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-7xl font-bold leading-[1.1] tracking-tight mb-8">
              Analyze your web traffic <span className="text-emerald-500">in real-time.</span>
            </h1>
            <p className="text-xl text-gray-500 mb-10 max-w-lg leading-relaxed">
              Monitor bandwidth usage, resolve domains, and secure your network with our advanced traffic analysis engine.
            </p>
            <div className="flex gap-4">
              <button className="bg-black text-white px-8 py-4 rounded-full font-semibold flex items-center gap-2 hover:scale-105 transition-transform">
                Start Monitoring <ArrowRight size={20} />
              </button>
              <button className="border border-gray-200 px-8 py-4 rounded-full font-semibold hover:bg-gray-50 transition-colors">
                View Demo
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-gray-900 rounded-3xl p-4 shadow-2xl border border-white/10">
              <div className="bg-gray-800 rounded-2xl p-6 h-[400px] flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <span className="text-xs text-gray-500 font-mono">LIVE_TRAFFIC_FEED</span>
                </div>
                <div className="space-y-3 font-mono text-[10px] text-emerald-400 opacity-80">
                  <p>[14:20:01] INBOUND: 192.168.1.45 → github.com (HTTPS) - 45.2 KB</p>
                  <p>[14:20:03] OUTBOUND: 192.168.1.45 → google.com (DNS) - 0.8 KB</p>
                  <p>[14:20:05] INBOUND: 192.168.1.45 → youtube.com (HTTPS) - 1.2 MB</p>
                  <p>[14:20:08] ALERT: Bandwidth spike detected on netflix.com</p>
                  <p>[14:20:10] INBOUND: 192.168.1.45 → microsoft.com (TCP) - 12.4 KB</p>
                </div>
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-emerald-500/20 blur-3xl rounded-full" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full" />
          </motion.div>
        </section>

        <section id="features" className="bg-gray-50 py-32">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
              <p className="text-gray-500">Everything you need to master your network traffic.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: <Activity className="text-emerald-500" />, title: "Real-time Monitoring", desc: "Watch packets flow in real-time with zero latency using WebSockets." },
                { icon: <Globe className="text-blue-500" />, title: "Domain Resolution", desc: "Automatically map IP addresses to human-readable domain names." },
                { icon: <BarChart3 className="text-purple-500" />, title: "Deep Analytics", desc: "Visualize usage trends, top domains, and protocol distribution." },
                { icon: <Bell className="text-orange-500" />, title: "Smart Alerts", desc: "Get notified immediately when data usage exceeds your custom limits." },
                { icon: <Shield className="text-red-500" />, title: "Privacy First", desc: "Metadata-only analysis. We never decrypt your private HTTPS payloads." },
                { icon: <Lock className="text-cyan-500" />, title: "Secure Storage", desc: "All logs are stored locally in a high-performance SQLite database." },
              ].map((f, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
                    {f.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="auth-section" className="py-32">
          <div className="max-w-md mx-auto px-6">
            <div className="bg-white border border-gray-200 rounded-[2rem] p-10 shadow-xl">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                <p className="text-gray-500">{isLogin ? 'Enter your details to access your dashboard' : 'Join us to start monitoring your traffic'}</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                {!isLogin && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Username</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="text" 
                        required
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        placeholder="johndoe"
                        value={formData.username}
                        onChange={e => setFormData({...formData, username: e.target.value})}
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="email" 
                      required
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      placeholder="name@company.com"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="password" 
                      required
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                </div>
                <button type="submit" className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-black/10">
                  {isLogin ? 'Sign In' : 'Create Account'}
                </button>
              </form>
              <div className="mt-8 text-center">
                <button onClick={() => setIsLogin(!isLogin)} className="text-sm font-medium text-gray-500 hover:text-black transition-colors">
                  {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-bold">
            <Activity className="text-emerald-500" size={20} />
            <span>SmartTraffic</span>
          </div>
          <p className="text-sm text-gray-400">© 2024 Smart Web Traffic Analyzer. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-black">Privacy Policy</a>
            <a href="#" className="hover:text-black">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
