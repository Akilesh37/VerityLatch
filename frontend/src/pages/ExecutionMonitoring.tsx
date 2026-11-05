import React, { useState, useEffect } from 'react';
import { Activity, Shield, RefreshCw, Filter, Search, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

export const ExecutionMonitoring: React.FC = () => {
  const [executions, setExecutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<string>('all');
  const [search, setSearch] = useState('');

  const fetchExecutions = async () => {
    setLoading(true);
    try {
      const data = await api.getExecutions();
      setExecutions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutions();
  }, []);

  const filtered = executions.filter((ex) => {
    if (filterMode !== 'all' && ex.mode !== filterMode) return false;
    if (search && !ex.task_prompt.toLowerCase().includes(search.toLowerCase()) && !ex.agent_id.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Execution Monitoring</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time audit of AI agent task proposals, Guardian policy evaluations, and tool invocations.
          </p>
        </div>
        <button
          onClick={fetchExecutions}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 transition-colors self-start md:self-auto"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prompt or agent ID..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs font-mono">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 rounded-md transition-colors ${filterMode === 'all' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilterMode('protected')}
            className={`px-3 py-1 rounded-md transition-colors ${filterMode === 'protected' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
          >
            Protected
          </button>
          <button
            onClick={() => setFilterMode('baseline')}
            className={`px-3 py-1 rounded-md transition-colors ${filterMode === 'baseline' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
          >
            Baseline
          </button>
        </div>
      </div>

      {/* Executions Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-mono">Loading execution records...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 font-mono">No executions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-[11px]">
                <tr>
                  <th className="p-3.5">Execution ID</th>
                  <th className="p-3.5">Agent</th>
                  <th className="p-3.5">Task Prompt</th>
                  <th className="p-3.5">Mode</th>
                  <th className="p-3.5">Actions</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((ex) => (
                  <tr key={ex.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5 text-slate-300 font-semibold">{ex.id.slice(0, 8)}...</td>
                    <td className="p-3.5 text-sky-400 font-medium">{ex.agent_id}</td>
                    <td className="p-3.5 max-w-xs truncate text-slate-200" title={ex.task_prompt}>
                      {ex.task_prompt}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                          ex.mode === 'protected'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {ex.mode}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400">
                      <span className="text-emerald-400 font-semibold">{ex.allowed_actions}</span> /{' '}
                      <span className="text-red-400 font-semibold">{ex.denied_actions}</span> /{' '}
                      <span className="text-slate-200">{ex.total_actions}</span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          ex.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : ex.status === 'blocked'
                            ? 'bg-red-500/10 text-red-400 border-red-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {ex.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {new Date(ex.created_at).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
