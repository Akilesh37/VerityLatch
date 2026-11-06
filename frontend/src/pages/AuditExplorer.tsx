import React, { useState, useEffect } from 'react';
import {
  History, ShieldCheck, Check, RefreshCw, Hash, AlertCircle,
  Copy, Eye, Search, Filter, ArrowRight, Lock, X, CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface AuditEvent {
  id: string;
  event_type: string;
  agent_id?: string;
  user_id?: string;
  tool_name?: string;
  resource?: string;
  decision?: string;
  reason?: string;
  risk_score?: number;
  payload_hash?: string;
  previous_hash: string;
  current_hash: string;
  metadata_json?: Record<string, any>;
  timestamp: string;
}

export const AuditExplorer: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditEvents(100);
      setEvents(data);
    } catch (e: any) {
      toastError('Failed to load audit events', e.message);
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
      if (res.is_valid) {
        success('Ledger Verification Successful', `Cryptographic continuity verified across all ${res.total_events} blocks.`);
      } else {
        toastError('Ledger Verification Failed', res.message);
      }
    } catch (err: any) {
      setVerificationResult({ is_valid: false, message: err.message });
      toastError('Verification Failed', err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(label);
    success('Copied to clipboard', `${label} copied`);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filtered = events.filter((ev) => {
    if (filterType !== 'all' && ev.event_type !== filterType) return false;
    if (
      search &&
      !ev.event_type.toLowerCase().includes(search.toLowerCase()) &&
      !(ev.agent_id && ev.agent_id.toLowerCase().includes(search.toLowerCase())) &&
      !(ev.tool_name && ev.tool_name.toLowerCase().includes(search.toLowerCase())) &&
      !ev.current_hash.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Tamper-Evident Audit Ledger</h1>
            <span className="text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
              SHA-256 HASH-CHAINED
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Cryptographic append-only ledger recording every agent proposal, Guardian gateway evaluation, and tool invocation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleVerifyLedger}
            disabled={verifying}
            className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold font-mono flex items-center gap-2 transition-colors disabled:opacity-50 shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            {verifying ? 'Computing Block Hashes...' : 'Verify Cryptographic Integrity'}
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

      {/* Verification Result Banner */}
      {verificationResult && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 text-xs font-mono animate-in fade-in duration-150 ${
            verificationResult.is_valid
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          {verificationResult.is_valid ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <div className="font-bold text-sm">
              {verificationResult.is_valid
                ? 'Cryptographic Verification Succeeded: ZERO DISCREPANCIES'
                : 'CRITICAL: Hash Ledger Integrity Compromised'}
            </div>
            <p className="text-slate-300">{verificationResult.message}</p>
            {verificationResult.total_events > 0 && (
              <div className="text-[11px] text-slate-400">
                Verified: <span className="text-emerald-400 font-bold">{verificationResult.verified_events}</span> consecutive blocks from Genesis to Head. No reordering or modification detected.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search event type, agent, tool, or SHA-256 hash..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors font-mono"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs font-mono overflow-x-auto">
          {['all', 'ACTION_PROPOSAL', 'GUARDIAN_DECISION', 'TOOL_EXECUTION', 'APPROVAL_DECISION', 'SECURITY_INCIDENT'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                filterType === t ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-mono">Loading audit ledger blocks...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 font-mono">No matching audit events found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-[11px]">
                <tr>
                  <th className="p-3.5">Block Index</th>
                  <th className="p-3.5">Event Type</th>
                  <th className="p-3.5">Agent</th>
                  <th className="p-3.5">Tool / Target</th>
                  <th className="p-3.5">Decision</th>
                  <th className="p-3.5">Previous Hash (H_prev)</th>
                  <th className="p-3.5">Block Hash (H_curr)</th>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((ev, idx) => (
                  <tr
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="p-3.5 text-slate-500 font-bold">
                      #{filtered.length - idx}
                    </td>
                    <td className="p-3.5 font-bold text-slate-200 group-hover:text-sky-400 transition-colors">
                      {ev.event_type}
                    </td>
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
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-500 text-[10px]" title={ev.previous_hash}>
                      {ev.previous_hash.slice(0, 8)}...
                    </td>
                    <td className="p-3.5 text-emerald-400 text-[10px] font-semibold" title={ev.current_hash}>
                      {ev.current_hash.slice(0, 8)}...
                    </td>
                    <td className="p-3.5 text-slate-500">{new Date(ev.timestamp).toLocaleTimeString()}</td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(ev);
                        }}
                        className="p-1 rounded bg-slate-800 hover:bg-sky-600 text-slate-400 hover:text-white transition-colors"
                        title="View Cryptographic Block Details"
                      >
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

      {/* Forensic Audit Block Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden font-mono text-xs">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white">
                  Cryptographic Audit Block #{selectedEvent.id.slice(0, 8)}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-500 text-[10px] block">EVENT TYPE</span>
                  <span className="text-white font-bold">{selectedEvent.event_type}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">RECORDED TIMESTAMP</span>
                  <span className="text-slate-300">{new Date(selectedEvent.timestamp).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">AGENT ID</span>
                  <span className="text-sky-400 font-semibold">{selectedEvent.agent_id || 'System Engine'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">OPERATOR / USER</span>
                  <span className="text-slate-300">{selectedEvent.user_id || 'Autonomous Gateway'}</span>
                </div>
              </div>

              {/* Cryptographic Hashes */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Cryptographic Continuity Proof
                </div>

                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                    <span>PREVIOUS HASH (H_prev)</span>
                    <button
                      onClick={() => handleCopy(selectedEvent.previous_hash, 'Previous Hash')}
                      className="text-sky-400 hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </div>
                  <div className="bg-slate-900 p-2 rounded text-[11px] text-slate-300 break-all select-all border border-slate-800">
                    {selectedEvent.previous_hash}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                    <span>CURRENT BLOCK HASH (H_curr = SHA256(H_prev + Event Payload))</span>
                    <button
                      onClick={() => handleCopy(selectedEvent.current_hash, 'Current Hash')}
                      className="text-sky-400 hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </div>
                  <div className="bg-slate-900 p-2 rounded text-[11px] text-emerald-400 font-semibold break-all select-all border border-emerald-950">
                    {selectedEvent.current_hash}
                  </div>
                </div>
              </div>

              {/* Event Details */}
              {selectedEvent.reason && (
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase">Policy Evaluation Reason</div>
                  <p className="text-slate-200 text-xs">{selectedEvent.reason}</p>
                </div>
              )}

              {/* Metadata JSON */}
              {selectedEvent.metadata_json && Object.keys(selectedEvent.metadata_json).length > 0 && (
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase">Serialized Event Payload</div>
                  <pre className="text-[11px] text-slate-300 overflow-x-auto max-h-48">
                    {JSON.stringify(selectedEvent.metadata_json, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg"
              >
                Close Block
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Explanatory Note */}
      <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-start gap-2">
        <Hash className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
        <span>
          <strong>Cryptographic Ledger Note (Section 11):</strong> Hash chaining mathematically proves continuity and detects unauthorized edits or dropped records. VerityLatch guarantees that every action request, whether authorized or denied, remains immutable and tamper-evident across the organization.
        </span>
      </div>
    </div>
  );
};
