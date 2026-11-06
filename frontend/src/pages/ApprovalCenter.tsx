import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, XCircle, AlertTriangle, Shield, Clock, Hash,
  RefreshCw, Copy, Check, MessageSquare, X, Lock, ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface ApprovalItem {
  id: string;
  action_request_id: string;
  status: string;
  payload_hash: string;
  requested_by_agent: string;
  tool_name: string;
  environment: string;
  risk_score: number;
  explanation: string;
  expires_at: string;
  created_at: string;
  decision?: {
    approved: boolean;
    reason: string;
    decided_at: string;
    decided_by?: string;
  };
}

export const ApprovalCenter: React.FC = () => {
  const { success, warning, error: toastError } = useToast();
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Review modal state
  const [reviewItem, setReviewItem] = useState<ApprovalItem | null>(null);
  const [reviewMode, setReviewMode] = useState<'approve' | 'reject'>('approve');
  const [justification, setJustification] = useState('');

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const data = await api.getApprovals();
      setApprovals(data);
    } catch (e: any) {
      toastError('Failed to fetch approvals', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleOpenReview = (item: ApprovalItem, mode: 'approve' | 'reject') => {
    setReviewItem(item);
    setReviewMode(mode);
    setJustification(
      mode === 'approve'
        ? 'Authorized by verified human operator under incident change review.'
        : 'Operation rejected: high operational impact or unauthorized parameter detected.'
    );
  };

  const handleConfirmDecision = async () => {
    if (!reviewItem) return;
    setActionLoading(reviewItem.id);

    try {
      if (reviewMode === 'approve') {
        const res = await api.approveRequest(reviewItem.id, justification);
        success(
          'Action Approved & Executed',
          `Single-use cryptographic ticket issued. Execution permitted.`
        );
      } else {
        const res = await api.rejectRequest(reviewItem.id, justification);
        warning(
          'Action Rejected',
          `Rejection recorded in audit ledger. Execution blocked.`
        );
      }
      setReviewItem(null);
      await fetchApprovals();
    } catch (err: any) {
      toastError('Decision Failed', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    success('Payload Hash Copied', 'SHA-256 copied to clipboard');
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const pending = approvals.filter((a) => a.status === 'PENDING');
  const history = approvals.filter((a) => a.status !== 'PENDING');

  const getTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Human-in-the-Loop Approval Center
            </h1>
            <span className="text-[11px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold">
              {pending.length} PENDING REVIEW
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic cryptographic approval gate. Authorizations are strictly single-use and bound to exact SHA-256 payload hashes.
          </p>
        </div>

        <button
          onClick={fetchApprovals}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 transition-colors self-start md:self-auto"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Pending Approvals Queue */}
      <div className="space-y-4">
        <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Active Approval Queue ({pending.length})
        </h2>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-mono bg-slate-900 rounded-xl border border-slate-800">
            Loading approval queue...
          </div>
        ) : pending.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400 font-mono space-y-1">
            <div className="text-slate-300 font-semibold">All operations verified or cleared.</div>
            <div className="text-slate-500">No sensitive actions currently awaiting human sign-off.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pending.map((req) => (
              <div
                key={req.id}
                className="p-5 rounded-xl bg-slate-900 border border-amber-500/30 shadow-lg shadow-amber-500/5 space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-bold">
                      ACTION SUSPENDED
                    </span>
                    <span className="text-xs font-mono text-slate-300">
                      Target Agent: <strong className="text-sky-400">{req.requested_by_agent}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">RISK:</span>
                      <strong className="text-red-400 font-bold">{req.risk_score} / 100</strong>
                    </div>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      <Clock className="w-3.5 h-3.5" />
                      Expires in: {getTimeRemaining(req.expires_at)}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
                    Tool: <span className="text-sky-400 font-bold">{req.tool_name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700 uppercase">
                      Env: {req.environment}
                    </span>
                  </div>
                  <p className="text-slate-300 bg-slate-950 p-2.5 rounded border border-slate-800/80">
                    {req.explanation}
                  </p>

                  {/* Payload Hash */}
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <Hash className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                      <span className="text-slate-500">Payload Hash:</span>
                      <code className="text-emerald-400 truncate select-all">{req.payload_hash}</code>
                    </div>
                    <button
                      onClick={() => handleCopyHash(req.payload_hash)}
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors flex-shrink-0"
                      title="Copy SHA-256"
                    >
                      {copiedHash === req.payload_hash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Operator Actions */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800/60">
                  <button
                    onClick={() => handleOpenReview(req, 'reject')}
                    disabled={actionLoading === req.id}
                    className="px-4 py-2 rounded-lg bg-red-600/15 hover:bg-red-600/25 text-red-300 border border-red-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject Action
                  </button>
                  <button
                    onClick={() => handleOpenReview(req, 'approve')}
                    disabled={actionLoading === req.id}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Review & Authorize
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historical Approvals Table */}
      {history.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Historical Decisions Audit ({history.length})
            </h2>
          </div>

          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-[11px]">
                <tr>
                  <th className="p-3">Request ID</th>
                  <th className="p-3">Agent</th>
                  <th className="p-3">Tool</th>
                  <th className="p-3">Environment</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Audited Justification</th>
                  <th className="p-3">Decided At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 text-slate-300 font-semibold">{h.id.slice(0, 8)}...</td>
                    <td className="p-3 text-sky-400">{h.requested_by_agent}</td>
                    <td className="p-3 text-slate-200">{h.tool_name}</td>
                    <td className="p-3 uppercase text-slate-400">{h.environment}</td>
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
                    <td className="p-3 text-slate-400 max-w-xs truncate" title={h.decision?.reason || '-'}>
                      {h.decision?.reason || '-'}
                    </td>
                    <td className="p-3 text-slate-500">
                      {h.decision?.decided_at ? new Date(h.decision.decided_at).toLocaleString() : new Date(h.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review & Justification Modal */}
      {reviewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden font-mono text-xs">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white">
                  {reviewMode === 'approve' ? 'Cryptographic Sign-Off' : 'Confirm Action Rejection'}
                </h3>
              </div>
              <button
                onClick={() => setReviewItem(null)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Agent: <strong className="text-white">{reviewItem.requested_by_agent}</strong></span>
                  <span>Env: <strong className="text-amber-400 uppercase">{reviewItem.environment}</strong></span>
                </div>
                <div>
                  <span className="text-slate-400">Tool: </span>
                  <strong className="text-sky-400">{reviewItem.tool_name}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Risk Score: </span>
                  <strong className="text-red-400">{reviewItem.risk_score} / 100</strong>
                </div>
                <div className="text-[11px] text-emerald-400 break-all bg-slate-900 p-2 rounded">
                  Hash: {reviewItem.payload_hash}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Audit Justification / RFC Ticket Reference
                </label>
                <textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                  placeholder="Enter authorized operational reason for this action..."
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setReviewItem(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDecision}
                  disabled={actionLoading === reviewItem.id}
                  className={`px-4 py-2 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                    reviewMode === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20'
                      : 'bg-red-600 hover:bg-red-500 shadow-md shadow-red-600/20'
                  }`}
                >
                  {actionLoading === reviewItem.id ? (
                    'Recording Decision...'
                  ) : reviewMode === 'approve' ? (
                    'Issue Single-Use Execution Ticket'
                  ) : (
                    'Confirm Rejection'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
