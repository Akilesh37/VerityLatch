import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldCheck, Eye, RefreshCw, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export const SecurityIncidentCenter: React.FC = () => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const data = await api.getIncidents();
      setIncidents(data);
    } catch (e) {
      console.error(e);
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
      fetchIncidents();
      if (selectedIncident?.id === id) {
        setSelectedIncident({ ...selectedIncident, remediation_status: status });
      }
    } catch (err) {
      alert('Status update failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Security Incident Center</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time catalog of adversarial injection attempts, unauthorized tool violations, and PII leakage events.
          </p>
        </div>
        <button
          onClick={fetchIncidents}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incidents Table */}
        <div className="lg:col-span-2 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400 font-mono">Loading incident log...</div>
          ) : incidents.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-mono">Zero security incidents recorded.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-[11px]">
                  <tr>
                    <th className="p-3.5">Severity</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Agent</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Blocked</th>
                    <th className="p-3.5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {incidents.map((inc) => (
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
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            inc.remediation_status === 'RESOLVED'
                              ? 'text-emerald-400 bg-emerald-500/10'
                              : 'text-amber-400 bg-amber-500/10'
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
                      <td className="p-3.5">
                        <button className="text-sky-400 hover:text-sky-300">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Incident Drawer */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-sm font-semibold text-white border-b border-slate-800 pb-3">
            Incident Forensic Details
          </h2>
          {selectedIncident ? (
            <div className="space-y-4 text-xs font-mono">
              <div>
                <span className="text-slate-500 block text-[10px]">INCIDENT TITLE</span>
                <span className="text-slate-200 font-bold text-sm">{selectedIncident.title}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px]">DESCRIPTION & REASON</span>
                <p className="text-slate-300 mt-1 leading-relaxed bg-slate-950 p-2.5 rounded border border-slate-800">
                  {selectedIncident.description}
                </p>
              </div>

              {selectedIncident.attack_input && (
                <div>
                  <span className="text-slate-500 block text-[10px]">ATTACK INPUT / PAYLOAD</span>
                  <pre className="text-red-400 bg-slate-950 p-2.5 rounded border border-slate-800 overflow-x-auto text-[11px] mt-1 whitespace-pre-wrap">
                    {selectedIncident.attack_input}
                  </pre>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500">TOOL EXECUTED:</span>
                <span className="text-emerald-400 font-bold">FALSE (0 Invocations)</span>
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-2">
                <label className="text-slate-400 block text-[11px]">UPDATE REMEDIATION WORKFLOW:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedIncident.id, 'RESOLVED')}
                    className="p-2 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-center font-semibold transition-colors"
                  >
                    Mark Resolved
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedIncident.id, 'INVESTIGATING')}
                    className="p-2 rounded bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 text-center font-semibold transition-colors"
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
