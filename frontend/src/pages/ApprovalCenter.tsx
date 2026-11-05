import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Shield, Clock, Hash, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export const ApprovalCenter: React.FC = () => {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const data = await api.getApprovals();
      setApprovals(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await api.approveRequest(id, 'Authorized by verified human operator');
      fetchApprovals();
    } catch (err: any) {
      alert('Approval failed: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Please provide reason for rejection:', 'Operational risk threshold exceeded');
    if (!reason) return;
    setActionLoading(id);
    try {
      await api.rejectRequest(id, reason);
      fetchApprovals();
    } catch (err: any) {
      alert('Rejection failed: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const pending = approvals.filter((a) => a.status === 'PENDING');
  const history = approvals.filter((a) => a.status !== 'PENDING');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Human-in-the-Loop Approval Center</h1>
          <p className="text-xs text-slate-400 mt-1">
            Cryptographically bound action approval gate. Authorizations are single-use and tied to exact payload hashes.
          </p>
        </div>
        <button
          onClick={fetchApprovals}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Pending Approvals */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Pending Human Sign-Off ({pending.length})
        </h2>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-mono">Loading approval queue...</div>
        ) : pending.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400 font-mono">
            No actions currently waiting for approval.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pending.map((req) => (
              <div
                key={req.id}
                className="p-5 rounded-xl bg-slate-900 border border-amber-500/30 shadow-lg shadow-amber-500/5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-bold mr-2">
                      ACTION SUSPENDED
                    </span>
                    <span className="text-xs font-mono text-slate-300">Agent: <strong className="text-sky-400">{req.requested_by_agent}</strong></span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                    <span>Risk Score: <strong className="text-red-400">{req.risk_score} / 100</strong></span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      Expires: {new Date(req.expires_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="text-slate-200 font-semibold text-sm">
                    Tool: <span className="text-sky-400">{req.tool_name}</span> (Env: <span className="uppercase text-amber-400">{req.environment}</span>)
                  </div>
                  <p className="text-slate-400">{req.explanation}</p>
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2 overflow-x-auto">
                    <Hash className="w-4 h-4 text-sky-400 flex-shrink-0" />
                    <span>Payload Binding SHA-256: <code className="text-slate-200">{req.payload_hash}</code></span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => handleReject(req.id)}
                    disabled={actionLoading === req.id}
                    className="px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject Action
                  </button>
                  <button
                    onClick={() => handleApprove(req.id)}
                    disabled={actionLoading === req.id}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {actionLoading === req.id ? 'Authorizing...' : 'Approve & Issue Ticket'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historical Approvals */}
      {history.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-slate-800">
          <h2 className="text-sm font-semibold text-white">Historical Decisions ({history.length})</h2>
          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-[11px]">
                <tr>
                  <th className="p-3">Request ID</th>
                  <th className="p-3">Agent</th>
                  <th className="p-3">Tool</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-800/30">
                    <td className="p-3 text-slate-300">{h.id.slice(0, 8)}...</td>
                    <td className="p-3 text-sky-400">{h.requested_by_agent}</td>
                    <td className="p-3 text-slate-200">{h.tool_name}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          h.status === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-red-500/10 text-red-400 border-red-500/30'
                        }`}
                      >
                        {h.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 max-w-xs truncate">{h.decision?.reason || '-'}</td>
                    <td className="p-3 text-slate-500">{new Date(h.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
