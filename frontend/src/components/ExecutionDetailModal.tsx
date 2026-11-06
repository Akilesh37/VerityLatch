import React, { useState } from 'react';
import {
  X, Shield, AlertTriangle, CheckCircle2, Lock, Copy, Check,
  Clock, Server, Terminal, FileCode, ExternalLink, Hash, ArrowRight
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface ActionRequestDetail {
  id: string;
  tool_name: string;
  action_name: string;
  resource: string;
  environment: string;
  arguments: Record<string, any>;
  payload_hash: string;
  data_classification: string;
  context_provenance: string;
  risk_score: number;
  risk_level: string;
  risk_factors: string[];
  decision: string;
  policy_matched?: string;
  reason?: string;
  tool_executed: boolean;
  execution_result?: any;
  created_at: string;
}

interface ExecutionDetail {
  id: string;
  agent_id: string;
  user_id?: string;
  task_prompt: string;
  mode: string;
  status: string;
  result_summary?: string;
  total_actions: number;
  allowed_actions: number;
  denied_actions: number;
  approved_actions: number;
  created_at: string;
  completed_at?: string;
  action_requests?: ActionRequestDetail[];
}

interface Props {
  execution: ExecutionDetail | null;
  onClose: () => void;
}

export const ExecutionDetailModal: React.FC<Props> = ({ execution, onClose }) => {
  const { success } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'payloads' | 'raw'>('timeline');

  if (!execution) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(label);
    success('Copied to clipboard', `${label} copied`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isProtected = execution.mode === 'protected';
  const actions = execution.action_requests || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                isProtected
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}
            >
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white font-mono">
                  EXECUTION #{execution.id.slice(0, 12)}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold border ${
                    isProtected
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {execution.mode}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold border ${
                    execution.status === 'completed'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : execution.status === 'blocked'
                      ? 'bg-red-500/10 text-red-400 border-red-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {execution.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span className="text-sky-400 font-mono font-medium">{execution.agent_id}</span>
                <span>•</span>
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{new Date(execution.created_at).toLocaleString()}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(execution.id, 'Execution ID')}
              className="p-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors flex items-center gap-1 font-mono"
              title="Copy Execution ID"
            >
              {copiedId === 'Execution ID' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy ID</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Task Prompt Overview Banner */}
        <div className="px-6 py-3 bg-slate-900/90 border-b border-slate-800/80">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
            Prompt / Task Input
          </div>
          <p className="text-xs text-slate-200 bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono whitespace-pre-wrap">
            {execution.task_prompt}
          </p>
          {execution.result_summary && (
            <div className="mt-2 text-xs text-slate-300 flex items-start gap-2 bg-slate-950/60 p-2 rounded border border-slate-800/60">
              <span className="text-[10px] font-mono text-sky-400 uppercase font-semibold">Summary:</span>
              <span className="font-mono text-slate-300">{execution.result_summary}</span>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-800 bg-slate-950/40 flex items-center gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Guardian Authorization Flow ({actions.length})
          </button>
          <button
            onClick={() => setActiveTab('payloads')}
            className={`py-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'payloads'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            Cryptographic Payload Binding
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`py-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'raw'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            Raw Execution Object
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              {actions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 font-mono bg-slate-950/50 rounded-lg border border-slate-800">
                  No individual action requests intercepted during this execution lifecycle.
                </div>
              ) : (
                actions.map((act, idx) => {
                  const isAllow = act.decision === 'ALLOW';
                  const isDeny = act.decision === 'DENY';
                  const isApprove = act.decision === 'REQUIRE_APPROVAL';

                  return (
                    <div
                      key={act.id || idx}
                      className="bg-slate-950 rounded-lg border border-slate-800 p-4 space-y-3 relative overflow-hidden"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-mono text-slate-400">
                            {idx + 1}
                          </span>
                          <span className="font-mono font-bold text-sm text-white">
                            {act.tool_name}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {act.environment}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-400">
                            {act.data_classification}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border ${
                              isAllow
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : isDeny
                                ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            }`}
                          >
                            {act.decision}
                          </span>
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-xs">
                            <span className="text-slate-400 text-[10px]">RISK:</span>
                            <span
                              className={`font-bold ${
                                act.risk_score >= 80
                                  ? 'text-red-400'
                                  : act.risk_score >= 60
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {act.risk_score}
                            </span>
                            <span className="text-[10px] text-slate-500 uppercase">({act.risk_level})</span>
                          </div>
                        </div>
                      </div>

                      {/* Policy & Explanation */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                        <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800/60 space-y-1">
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                            Matched OPA Rego Policy
                          </div>
                          <div className="text-sky-400 font-semibold truncate">
                            {act.policy_matched || 'DEFAULT_DENY_FALLBACK'}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">
                            {act.reason || 'Evaluated against zero-trust policy engine.'}
                          </p>
                        </div>

                        <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800/60 space-y-1">
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                            Execution Boundary Status
                          </div>
                          <div className="flex items-center gap-2">
                            {act.tool_executed ? (
                              <span className="text-emerald-400 flex items-center gap-1 font-semibold text-xs">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Tool executed with valid authorization ticket
                              </span>
                            ) : (
                              <span className="text-red-400 flex items-center gap-1 font-semibold text-xs">
                                <Lock className="w-3.5 h-3.5" />
                                Tool execution blocked by Guardian Gateway
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
                            Provenance: {act.context_provenance}
                          </p>
                        </div>
                      </div>

                      {/* Arguments Preview */}
                      {act.arguments && Object.keys(act.arguments).length > 0 && (
                        <div className="p-2.5 bg-slate-900 rounded border border-slate-800/80">
                          <div className="text-[10px] font-mono text-slate-500 uppercase mb-1">
                            Tool Arguments
                          </div>
                          <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto">
                            {JSON.stringify(act.arguments, null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* Risk Factors Pills */}
                      {act.risk_factors && act.risk_factors.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {act.risk_factors.map((factor, fIdx) => (
                            <span
                              key={fIdx}
                              className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-300 border border-red-500/20"
                            >
                              {factor}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'payloads' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-slate-400">
                <span className="text-sky-400 font-bold">Cryptographic Binding Note: </span>
                Every action proposal is hashed with SHA-256 before evaluation. The authorization ticket emitted by Guardian is bound to this payload hash. The protected tool executor recomputes the hash before invocation; any argument modification triggers a tampering rejection.
              </div>

              {actions.map((act, idx) => (
                <div key={idx} className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-white">
                      Action #{idx + 1}: {act.tool_name}
                    </span>
                    <button
                      onClick={() => handleCopy(act.payload_hash, `Payload Hash ${idx + 1}`)}
                      className="text-xs text-sky-400 hover:text-sky-300 font-mono flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy SHA-256</span>
                    </button>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800 text-xs font-mono text-emerald-400 break-all select-all">
                    {act.payload_hash || 'SHA256_UNBOUND_PROPOSAL'}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-400">
                    <div>Resource: <span className="text-slate-200">{act.resource}</span></div>
                    <div>Environment: <span className="text-slate-200">{act.environment}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'raw' && (
            <div className="relative">
              <button
                onClick={() => handleCopy(JSON.stringify(execution, null, 2), 'Raw JSON')}
                className="absolute right-3 top-3 p-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 rounded border border-slate-700 flex items-center gap-1 font-mono z-10"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy JSON</span>
              </button>
              <pre className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto max-h-96">
                {JSON.stringify(execution, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs font-mono text-slate-500">
          <div>
            Total Interceptions: <span className="text-slate-300">{actions.length}</span> (Allowed: <span className="text-emerald-400">{execution.allowed_actions}</span>, Denied: <span className="text-red-400">{execution.denied_actions}</span>)
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
