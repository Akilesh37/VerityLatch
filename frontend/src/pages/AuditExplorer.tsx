import React, { useState, useEffect } from 'react';
import { History, ShieldCheck, Check, RefreshCw, Hash, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export const AuditExplorer: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditEvents(100);
      setEvents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleVerifyLedger = async () => {
    setVerifying(true);
    setVerificationResult(null);
    try {
      const res = await api.verifyAuditLedger();
      setVerificationResult(res);
    } catch (err: any) {
      setVerificationResult({ is_valid: false, message: err.message });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Tamper-Evident Audit Ledger</h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable SHA-256 hash-chained event history recording every agent proposal, Guardian decision, and execution.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleVerifyLedger}
            disabled={verifying}
            className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50 shadow-md shadow-emerald-600/20"
          >
            <ShieldCheck className="w-4 h-4" />
            {verifying ? 'Verifying Hashes...' : 'Verify Ledger Integrity'}
          </button>
          <button
            onClick={fetchEvents}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Verification Banner */}
      {verificationResult && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 text-xs font-mono ${
            verificationResult.is_valid
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          {verificationResult.is_valid ? (
            <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <div className="font-bold text-sm">
              {verificationResult.is_valid ? 'Cryptographic Verification Passed' : 'Ledger Integrity Broken'}
            </div>
            <p className="mt-0.5">{verificationResult.message}</p>
            {verificationResult.total_events > 0 && (
              <div className="mt-2 text-[11px] text-slate-400">
                Verified: {verificationResult.verified_events} of {verificationResult.total_events} blocks in linear chain.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ledger Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-mono">Loading audit ledger...</div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 font-mono">Ledger is currently empty.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-[11px]">
                <tr>
                  <th className="p-3.5">Event Type</th>
                  <th className="p-3.5">Agent</th>
                  <th className="p-3.5">Tool / Resource</th>
                  <th className="p-3.5">Decision</th>
                  <th className="p-3.5">Previous Hash</th>
                  <th className="p-3.5">Current Hash</th>
                  <th className="p-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5 font-bold text-slate-200">{ev.event_type}</td>
                    <td className="p-3.5 text-sky-400">{ev.agent_id || '-'}</td>
                    <td className="p-3.5 text-slate-300 max-w-xs truncate">{ev.tool_name || ev.resource || '-'}</td>
                    <td className="p-3.5">
                      {ev.decision ? (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            ev.decision === 'ALLOW'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : ev.decision === 'DENY'
                              ? 'bg-red-500/10 text-red-400 border-red-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {ev.decision}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-3.5 text-slate-500 text-[10px]" title={ev.previous_hash}>
                      {ev.previous_hash.slice(0, 10)}...
                    </td>
                    <td className="p-3.5 text-sky-400 text-[10px]" title={ev.current_hash}>
                      {ev.current_hash.slice(0, 10)}...
                    </td>
                    <td className="p-3.5 text-slate-500">{new Date(ev.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-start gap-2">
        <Hash className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
        <span>
          <strong>Cryptographic Ledger Note (Section 11):</strong> Hash chaining proves continuity and detects unauthorized edits or dropped records. For absolute non-repudiation against privileged database administrators, VerityLatch supports external ledger anchoring (e.g. S3 Object Lock, external append-only log).
        </span>
      </div>
    </div>
  );
};
