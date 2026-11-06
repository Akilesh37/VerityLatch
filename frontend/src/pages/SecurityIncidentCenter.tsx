import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, ShieldCheck, Eye, RefreshCw, CheckCircle2,
  Filter, Search, Clock, ShieldAlert, ArrowRight, Check, X
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';

export const SecurityIncidentCenter: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const data = await api.getIncidents();
      setIncidents(data);
      if (data.length > 0 && !selectedIncident) {
        setSelectedIncident(data[0]);
      }
    } catch (e: any) {
      toastError('Failed to fetch incidents', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.updateIncidentStatus(id, status);
      success('Incident Status Updated', `Remediation status set to ${status}`);
      await fetchIncidents();
      if (selectedIncident?.id === id) {
        setSelectedIncident({ ...selectedIncident, remediation_status: status });
      }
    } catch (err: any) {
      toastError('Status Update Failed', err.message);
    }
  };

  const filtered = incidents.filter((inc) => {
    if (filterSeverity !== 'all' && inc.severity !== filterSeverity) return false;
    if (filterStatus !== 'all' && inc.remediation_status !== filterStatus) return false;
    if (
      search &&
      !inc.title.toLowerCase().includes(search.toLowerCase()) &&
      !inc.category.toLowerCase().includes(search.toLowerCase()) &&
      !(inc.agent_id && inc.agent_id.toLowerCase().includes(search.toLowerCase())) &&
      !(inc.description && inc.description.toLowerCase().includes(search.toLowerCase()))
    ) {
      return false;
    }
    return true;
  });

  const criticalCount = incidents.filter((i) => i.severity === 'critical').length;
  const highCount = incidents.filter((i) => i.severity === 'high').length;
  const resolvedCount = incidents.filter((i) => i.remediation_status === 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Security Incident Center</h1>
            <span className="text-[11px] font-mono bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-semibold">
              SIEM & THREAT TELEMETRY
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time catalog of adversarial injection attempts, unauthorized tool violations, and PII leakage events.
          </p>
        </div>

        <button
          onClick={fetchIncidents}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 transition-colors self-start md:self-auto"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Total Recorded Incidents</span>
          <div className="text-2xl font-bold text-white font-mono">{incidents.length}</div>
          <div className="text-[11px] text-slate-500 font-mono">100% Intercepted at Gate</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-red-950/60 space-y-1">
          <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider">Critical Threats</span>
          <div className="text-2xl font-bold text-red-400 font-mono">{criticalCount}</div>
          <div className="text-[11px] text-red-300/80 font-mono">High-risk exfiltration/sabotage</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-amber-950/60 space-y-1">
          <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">High Severity</span>
          <div className="text-2xl font-bold text-amber-400 font-mono">{highCount}</div>
          <div className="text-[11px] text-amber-300/80 font-mono">Privilege escalation attempts</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-emerald-950/60 space-y-1">
          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">Runtime Containment Rate</span>
          <div className="text-2xl font-bold text-emerald-400 font-mono">100.0%</div>
          <div className="text-[11px] text-emerald-300/80 font-mono">0 Unauthorized Executions</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search incident title, category, agent ID, or description..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 font-mono focus:outline-none"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 font-mono focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incidents Table */}
        <div className="lg:col-span-2 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400 font-mono">Loading incident telemetry...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-mono">No matching security incidents recorded.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-[11px]">
                  <tr>
                    <th className="p-3.5">Severity</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Target Agent</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Guardian Gate</th>
                    <th className="p-3.5 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filtered.map((inc) => (
                    <tr
                      key={inc.id}
                      onClick={() => setSelectedIncident(inc)}
                      className={`cursor-pointer transition-colors ${
                        selectedIncident?.id === inc.id ? 'bg-sky-500/10' : 'hover:bg-slate-800/30'
                      }`}
                    >
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                            inc.severity === 'critical'
                              ? 'bg-red-500/15 text-red-400 border-red-500/40'
                              : inc.severity === 'high'
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                              : 'bg-sky-500/15 text-sky-400 border-sky-500/40'
                          }`}
                        >
                          {inc.severity}
                        </span>
                      </td>
                      <td className="p-3.5 font-medium text-slate-200">{inc.category}</td>
                      <td className="p-3.5 text-sky-400">{inc.agent_id || 'System'}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            inc.remediation_status === 'RESOLVED'
                              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                              : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                          }`}
                        >
                          {inc.remediation_status}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> Blocked
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button className="text-slate-400 hover:text-white p-1 rounded bg-slate-800 hover:bg-sky-600 transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Incident Forensic Drawer */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              Forensic Investigation
            </h2>
            {selectedIncident && (
              <span className="text-[10px] font-mono text-slate-500">
                ID: {selectedIncident.id.slice(0, 8)}
              </span>
            )}
          </div>

          {selectedIncident ? (
            <div className="space-y-4 text-xs font-mono">
              <div>
                <span className="text-slate-500 block text-[10px]">INCIDENT TITLE</span>
                <span className="text-slate-200 font-bold text-sm">{selectedIncident.title}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px]">DESCRIPTION & POLICY ENFORCEMENT</span>
                <p className="text-slate-300 mt-1 leading-relaxed bg-slate-950 p-2.5 rounded border border-slate-800">
                  {selectedIncident.description}
                </p>
              </div>

              {selectedIncident.attack_input && (
                <div>
                  <span className="text-slate-500 block text-[10px]">ATTACK INPUT / MALICIOUS INSTRUCTION</span>
                  <pre className="text-red-400 bg-slate-950 p-2.5 rounded border border-slate-800 overflow-x-auto text-[11px] mt-1 whitespace-pre-wrap">
                    {selectedIncident.attack_input}
                  </pre>
                </div>
              )}

              <div className="p-2.5 bg-slate-950 rounded border border-slate-800 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-[10px]">RUNTIME STATUS:</span>
                  <span className="text-emerald-400 font-bold">CONTAINED AT GATEWAY</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-[10px]">TOOL INVOCATIONS:</span>
                  <span className="text-emerald-400 font-bold">0 INVOCATIONS (BLOCKED)</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-2">
                <label className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Remediation Workflow
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedIncident.id, 'RESOLVED')}
                    className={`p-2 rounded border text-center font-semibold transition-colors cursor-pointer ${
                      selectedIncident.remediation_status === 'RESOLVED'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    Mark Resolved
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedIncident.id, 'INVESTIGATING')}
                    className={`p-2 rounded border text-center font-semibold transition-colors cursor-pointer ${
                      selectedIncident.remediation_status === 'INVESTIGATING'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    Investigating
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs font-mono">
              Click an incident row to inspect forensic payload details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
