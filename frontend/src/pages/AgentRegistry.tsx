import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Bot, Plus, ArrowRight, Shield, CheckCircle, RefreshCw, X, Search } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';

export const AgentRegistry: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New agent form
  const [newAgent, setNewAgent] = useState({
    id: '',
    name: '',
    description: '',
    system_prompt: 'You are an authorized enterprise agent. Strictly follow organizational security policies.',
    owner: 'Security Operations',
    environment: 'development',
    risk_profile: 'low',
    capabilities: 'read_logs, search_docs',
  });

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const data = await api.getAgents();
      setAgents(data);
    } catch (e: any) {
      toastError('Failed to load agents', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const caps = newAgent.capabilities.split(',').map((s) => s.trim()).filter(Boolean);
      await api.createAgent({
        ...newAgent,
        capabilities: caps,
      });
      success('Agent Registered', `Agent "${newAgent.name}" successfully enrolled.`);
      setShowCreateModal(false);
      setNewAgent({
        id: '',
        name: '',
        description: '',
        system_prompt: 'You are an authorized enterprise agent. Strictly follow organizational security policies.',
        owner: 'Security Operations',
        environment: 'development',
        risk_profile: 'low',
        capabilities: 'read_logs, search_docs',
      });
      fetchAgents();
    } catch (err: any) {
      toastError('Registration Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = agents.filter((a) => {
    if (
      search &&
      !a.name.toLowerCase().includes(search.toLowerCase()) &&
      !a.id.toLowerCase().includes(search.toLowerCase()) &&
      !a.description.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Agent Registry</h1>
            <span className="text-[11px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full font-semibold">
              {agents.length} ENROLLED
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Registered enterprise AI agents, capability scopes, and environment bindings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Enroll New Agent</span>
          </button>
          <button
            onClick={fetchAgents}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search agents by name, ID, or description..."
          className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors font-mono"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400 font-mono text-xs">
          Loading agent catalog...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 font-mono bg-slate-900 rounded-xl border border-slate-800">
          No matching agents found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map((agent) => (
            <div
              key={agent.id}
              className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between shadow-sm group"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
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
                    <span className="text-emerald-400 font-bold">{agent.permissions?.length ?? 0}</span>
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

      {/* Modal: Enroll New Agent */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden font-mono text-xs">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white">Enroll Enterprise Agent</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAgent} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Agent ID</label>
                  <input
                    value={newAgent.id}
                    onChange={(e) => setNewAgent({ ...newAgent, id: e.target.value })}
                    placeholder="e.g. agent-security-01"
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Agent Name</label>
                  <input
                    value={newAgent.name}
                    onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                    placeholder="e.g. SOC Analyst Agent"
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description</label>
                <input
                  value={newAgent.description}
                  onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
                  placeholder="Automated incident response triage"
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Owner</label>
                  <input
                    value={newAgent.owner}
                    onChange={(e) => setNewAgent({ ...newAgent, owner: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Environment</label>
                  <select
                    value={newAgent.environment}
                    onChange={(e) => setNewAgent({ ...newAgent, environment: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
                  >
                    <option value="development">development</option>
                    <option value="staging">staging</option>
                    <option value="production">production</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Risk Profile</label>
                  <select
                    value={newAgent.risk_profile}
                    onChange={(e) => setNewAgent({ ...newAgent, risk_profile: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
                  >
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Capabilities (Comma-separated)
                </label>
                <input
                  value={newAgent.capabilities}
                  onChange={(e) => setNewAgent({ ...newAgent, capabilities: e.target.value })}
                  placeholder="read_logs, query_siem, restart_service"
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">System Prompt</label>
                <textarea
                  value={newAgent.system_prompt}
                  onChange={(e) => setNewAgent({ ...newAgent, system_prompt: e.target.value })}
                  rows={3}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 font-mono text-[11px]"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded disabled:opacity-50"
                >
                  {submitting ? 'Enrolling...' : 'Enroll Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
