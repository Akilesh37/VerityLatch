import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Bot, Plus, ArrowRight, Shield, CheckCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export const AgentRegistry: React.FC = () => {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const data = await api.getAgents();
      setAgents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Agent Registry</h1>
          <p className="text-xs text-slate-400 mt-1">
            Registered enterprise AI agents, capability scopes, and environment bindings.
          </p>
        </div>
        <button
          onClick={fetchAgents}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400 font-mono text-xs">
          Loading agent catalog...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400">
                    <Bot className="w-5 h-5" />
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border ${
                      agent.environment === 'production'
                        ? 'bg-red-500/10 text-red-400 border-red-500/30'
                        : agent.environment === 'staging'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {agent.environment}
                  </span>
                </div>

                <h2 className="text-base font-bold text-white mb-1">{agent.name}</h2>
                <p className="text-xs text-slate-400 line-clamp-2 mb-4">{agent.description}</p>

                <div className="space-y-1.5 text-xs font-mono text-slate-300 border-t border-slate-800/80 pt-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Agent ID:</span>
                    <span className="text-slate-200">{agent.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Owner:</span>
                    <span className="text-slate-200">{agent.owner}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Risk Profile:</span>
                    <span className="uppercase text-sky-400">{agent.risk_profile}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Granted Tools:</span>
                    <span className="text-emerald-400">{agent.permissions?.length ?? 0}</span>
                  </div>
                </div>

                {agent.capabilities && agent.capabilities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {agent.capabilities.map((c: string) => (
                      <span key={c} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <NavLink
                to={`/agents/${agent.id}`}
                className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-slate-700/80"
              >
                Inspect Agent & Policies
                <ArrowRight className="w-3.5 h-3.5" />
              </NavLink>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
