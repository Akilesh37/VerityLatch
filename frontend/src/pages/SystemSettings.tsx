import React from 'react';
import { Settings, Shield, Server, Cpu, Database, UserCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const SystemSettings: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">System Settings & Configuration</h1>
        <p className="text-xs text-slate-400 mt-1">
          VerityLatch Guardian runtime environment parameters, OPA endpoints, and active LLM provider abstractions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Policy Engine & Guardian Configuration */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-sky-400" />
            Guardian Enforcement Engine
          </h2>
          <div className="space-y-3 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">OPA POLICY ENGINE ENDPOINT</span>
              <input
                type="text"
                readOnly
                value="http://localhost:8181/v1/data/veritylatch/authz"
                className="w-full mt-1 p-2.5 bg-slate-950 border border-slate-800 rounded text-slate-200"
              />
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">ENFORCEMENT MODE</span>
              <input
                type="text"
                readOnly
                value="DEFAULT-DENY (FAIL-CLOSED)"
                className="w-full mt-1 p-2.5 bg-slate-950 border border-slate-800 rounded text-emerald-400 font-bold"
              />
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">RISK ENGINE THRESHOLDS</span>
              <div className="grid grid-cols-3 gap-2 mt-1">
                <div className="p-2 bg-slate-950 border border-slate-800 rounded text-center">
                  <span className="text-[10px] text-slate-400 block">Low</span>
                  <span className="text-sky-400 font-bold">&lt; 30</span>
                </div>
                <div className="p-2 bg-slate-950 border border-slate-800 rounded text-center">
                  <span className="text-[10px] text-slate-400 block">Medium</span>
                  <span className="text-amber-400 font-bold">30 - 59</span>
                </div>
                <div className="p-2 bg-slate-950 border border-slate-800 rounded text-center">
                  <span className="text-[10px] text-slate-400 block">High/Crit</span>
                  <span className="text-red-400 font-bold">&gt;= 60</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LLM Provider Configuration */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            GenAI Provider Abstraction
          </h2>
          <div className="space-y-3 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">ACTIVE LLM PROVIDER</span>
              <div className="mt-1 p-2.5 bg-slate-950 border border-slate-800 rounded text-slate-200 flex items-center justify-between">
                <span className="font-bold text-sky-400">Deterministic Mock Provider (CI/CD Ready)</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                  CONNECTED
                </span>
              </div>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">SUPPORTED EXTERNAL PROVIDERS</span>
              <div className="mt-1 p-2.5 bg-slate-950 border border-slate-800 rounded text-slate-400 space-y-1 text-[11px]">
                <div>• Google Gemini (via <code>GEMINI_API_KEY</code>)</div>
                <div>• Groq Cloud API (via <code>GROQ_API_KEY</code>)</div>
                <div>• Local Ollama (via <code>http://localhost:11434</code>)</div>
              </div>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">AUDIT & PERSISTENCE STORAGE</span>
              <div className="mt-1 p-2.5 bg-slate-950 border border-slate-800 rounded text-slate-200">
                PostgreSQL / SQLite Dual Engine (Hash-Chained Ledger Active)
              </div>
            </div>
          </div>
        </div>

        {/* Current Session Info */}
        <div className="md:col-span-2 p-5 rounded-xl bg-slate-900 border border-slate-800">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
            <UserCheck className="w-4 h-4 text-sky-400" />
            Active Operator Session
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <span className="text-slate-500 block text-[10px]">LOGGED IN AS</span>
              <span className="text-slate-200 font-bold">{user?.full_name}</span>
            </div>
            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <span className="text-slate-500 block text-[10px]">EMAIL ADDRESS</span>
              <span className="text-slate-200 font-bold">{user?.email}</span>
            </div>
            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <span className="text-slate-500 block text-[10px]">ASSIGNED ROLES</span>
              <span className="text-sky-400 font-bold">{user?.roles?.join(', ')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
