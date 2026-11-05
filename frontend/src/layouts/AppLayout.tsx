import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Shield, Bot, Activity, FileCheck, CheckCircle2, AlertTriangle,
  FlaskConical, BarChart3, History, Scale, Settings, LogOut,
  ChevronRight, Lock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);

  useEffect(() => {
    async function fetchPending() {
      try {
        const approvals = await api.getApprovals();
        const pending = approvals.filter((a: any) => a.status === 'PENDING').length;
        setPendingApprovalsCount(pending);
      } catch {}
    }
    fetchPending();
    const interval = setInterval(fetchPending, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Overview Dashboard', icon: Activity },
    { to: '/agents', label: 'Agent Registry', icon: Bot },
    { to: '/executions', label: 'Execution Monitor', icon: ChevronRight },
    { to: '/policies', label: 'Policy Management', icon: FileCheck },
    { to: '/approvals', label: 'Approval Center', icon: CheckCircle2, badge: pendingApprovalsCount },
    { to: '/incidents', label: 'Security Incidents', icon: AlertTriangle },
    { to: '/redteam', label: 'Red-Team Lab', icon: FlaskConical },
    { to: '/benchmark', label: 'Benchmark Results', icon: BarChart3 },
    { to: '/audit', label: 'Audit Explorer', icon: History },
    { to: '/governance', label: 'AI Governance', icon: Scale },
    { to: '/settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/90 flex flex-col flex-shrink-0 z-20 backdrop-blur">
        {/* Brand */}
        <div className="h-16 flex items-center px-5 border-b border-slate-800 gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-sm shadow-sky-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              VERITYLATCH
              <span className="text-[10px] bg-sky-500/20 text-sky-400 font-mono px-1.5 py-0.5 rounded border border-sky-500/30">
                PROD
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Runtime AI Security</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.2 rounded-full border border-amber-500/40 font-mono font-bold animate-pulse">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <div className="text-xs font-semibold text-slate-200 truncate">{user?.full_name || 'Enterprise Operator'}</div>
              <div className="text-[10px] text-sky-400 truncate font-mono">{user?.roles?.[0] || 'User'}</div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-6 flex-shrink-0 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              GUARDIAN ENFORCEMENT: ACTIVE
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <Lock className="w-3.5 h-3.5 text-sky-400" />
              DEFAULT-DENY POLICY ENGINE
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <span>VERSION 1.0.0</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400">POSTGRES / OPA CONNECTED</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
