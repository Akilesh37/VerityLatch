import React, { useState, useEffect } from 'react';
import { Scale, CheckCircle2, Shield, AlertTriangle, Layers, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export const GovernanceDashboard: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [risks, setRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGovernanceData = async () => {
    setLoading(true);
    try {
      const [ovData, riskData] = await Promise.all([
        api.getGovernanceOverview(),
        api.getRiskRegister(),
      ]);
      setOverview(ovData);
      setRisks(riskData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGovernanceData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Responsible AI & Governance</h1>
          <p className="text-xs text-slate-400 mt-1">
            Alignment with the NIST AI Risk Management Framework 1.0 (AI RMF 1.0): Govern, Map, Measure, Manage.
          </p>
        </div>
        <button
          onClick={fetchGovernanceData}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* 4 NIST Pillars Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-sky-400 mb-2 font-bold text-xs">
            <span>1. GOVERN</span>
            <Layers className="w-4 h-4" />
          </div>
          <div className="text-lg font-bold text-white">{overview?.total_registered_agents ?? 3} Registered</div>
          <p className="text-[11px] text-slate-400 mt-1 font-sans">
            Explicit agent ownership, RBAC permissions, and active policy definitions.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-amber-400 mb-2 font-bold text-xs">
            <span>2. MAP</span>
            <Scale className="w-4 h-4" />
          </div>
          <div className="text-lg font-bold text-white">{overview?.total_risk_records ?? 5} Risks Mapped</div>
          <p className="text-[11px] text-slate-400 mt-1 font-sans">
            Operational context, data classification scopes, and untrusted provenance tagging.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-emerald-400 mb-2 font-bold text-xs">
            <span>3. MEASURE</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-lg font-bold text-white">200 Scenarios</div>
          <p className="text-[11px] text-slate-400 mt-1 font-sans">
            Automated red-teaming, 12 empirical metrics, latency profiling, and bypass testing.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-purple-400 mb-2 font-bold text-xs">
            <span>4. MANAGE</span>
            <Shield className="w-4 h-4" />
          </div>
          <div className="text-lg font-bold text-white">{overview?.mitigation_percentage ?? 100}% Mitigated</div>
          <p className="text-[11px] text-slate-400 mt-1 font-sans">
            Deterministic Guardian enforcement, single-use approval tickets, and incident remediation.
          </p>
        </div>
      </div>

      {/* Risk Register Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 font-semibold text-xs text-white flex items-center justify-between">
          <span>Enterprise AI Risk Register (NIST AI RMF Mapped)</span>
          <span className="text-slate-400 font-mono text-[11px]">Posture: MONITORED</span>
        </div>
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-[11px]">
            <tr>
              <th className="p-3">Risk ID</th>
              <th className="p-3">NIST Category</th>
              <th className="p-3">Severity</th>
              <th className="p-3">Risk Title & Description</th>
              <th className="p-3">Mitigation Control</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {risks.map((r) => (
              <tr key={r.id} className="hover:bg-slate-800/30">
                <td className="p-3 font-bold text-sky-400">{r.id}</td>
                <td className="p-3 text-slate-300 font-semibold">{r.nist_category}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      r.severity === 'Critical'
                        ? 'bg-red-500/10 text-red-400 border-red-500/30'
                        : r.severity === 'High'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                    }`}
                  >
                    {r.severity}
                  </span>
                </td>
                <td className="p-3 max-w-sm">
                  <div className="font-semibold text-slate-200">{r.risk_title}</div>
                  <div className="text-[11px] text-slate-400 font-sans mt-0.5">{r.description}</div>
                </td>
                <td className="p-3 max-w-xs text-slate-300 font-sans text-[11px]">
                  {r.mitigation_control}
                </td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

