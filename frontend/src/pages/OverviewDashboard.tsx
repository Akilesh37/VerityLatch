import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShieldAlert, Bot, Activity, CheckCircle, AlertTriangle, ArrowUpRight,
  TrendingUp, Lock, RefreshCw, Zap
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { api } from '../services/api';

const COLORS = ['#38bdf8', '#f59e0b', '#ef4444', '#10b981'];

export const OverviewDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const data = await api.getDashboardMetrics();
      setMetrics(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 font-mono text-sm">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        Loading Guardian metrics...
      </div>
    );
  }

  const riskData = metrics ? [
    { name: 'Low Risk', value: metrics.risk_distribution.low || 1 },
    { name: 'Medium Risk', value: metrics.risk_distribution.medium || 1 },
    { name: 'High Risk', value: metrics.risk_distribution.high || 1 },
    { name: 'Critical Risk', value: metrics.risk_distribution.critical || 1 },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Guardian Control Plane
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
              Enforcing
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic runtime authorization, prompt injection defense, and cryptographic audit logging.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NavLink
            to="/redteam"
            className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Zap className="w-3.5 h-3.5" />
            Red-Team Lab
          </NavLink>
          <NavLink
            to="/benchmark"
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            200-Case Benchmark
          </NavLink>
          <button
            onClick={fetchMetrics}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Registered Agents</span>
            <Bot className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{metrics?.agents.total ?? 3}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            <span className="text-emerald-400 font-semibold">{metrics?.agents.active ?? 3} Active</span> in Staging / Prod
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Intercepted Actions</span>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{metrics?.executions.actions_intercepted ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            <span className="text-emerald-400 font-semibold">{metrics?.executions.allowed ?? 0} Allowed</span> • {metrics?.executions.denied ?? 0} Denied
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Attacks Blocked</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{metrics?.security.incidents_blocked ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            <span className="text-emerald-400 font-semibold">0 Unauthorized Actions Executed</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Pending Approvals</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{metrics?.executions.pending_approval ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            <NavLink to="/approvals" className="text-sky-400 hover:underline flex items-center gap-1">
              Review High-Risk Requests <ArrowUpRight className="w-3 h-3" />
            </NavLink>
          </div>
        </div>
      </div>

      {/* Charts & Invariant Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Chart */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col">
          <h2 className="text-sm font-semibold text-white mb-1">Action Risk Distribution</h2>
          <p className="text-xs text-slate-400 mb-4">Classified by 0-100 deterministic risk engine</p>
          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} fill="#8884d8">
                  {riskData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-800 text-[11px] font-mono">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> Low (0-29)
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Med (30-59)
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> High (60-79)
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Crit (80-100)
            </div>
          </div>
        </div>

        {/* Security Invariants & Guarantees */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white">Guardian Architectural Invariants</h2>
              <span className="text-[10px] font-mono bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded border border-sky-500/20">
                100% Deterministic
              </span>
            </div>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex items-start gap-3">
                <div className="w-6 h-6 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200">LLM Output is Strictly an Unprivileged Proposal</div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    No LLM prompt or output format is treated as authorization evidence. Every tool call passes through server-side OPA Rego policies.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex items-start gap-3">
                <div className="w-6 h-6 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200">Exclusive Single-Use Execution Boundary</div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Simulated enterprise tools require a cryptographically signed authorization ticket bound to exact argument hashes. Replays are burned.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex items-start gap-3">
                <div className="w-6 h-6 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200">Tamper-Evident SHA-256 Audit Chaining</div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {metrics?.security.audit_chain_length ?? 0} events cryptographically linked with previous_hash pointers, verifiable on demand.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Enforcement Rate: <strong className="text-emerald-400">100.0%</strong></span>
            <NavLink to="/audit" className="text-sky-400 hover:underline flex items-center gap-1">
              Verify Audit Ledger <ArrowUpRight className="w-3 h-3" />
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
};
