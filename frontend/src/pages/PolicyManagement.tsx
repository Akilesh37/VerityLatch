import React, { useState, useEffect } from 'react';
import {
  FileCheck, Shield, Plus, Check, RefreshCw, Code2, Play,
  AlertTriangle, CheckCircle2, Lock, Terminal, X, Copy
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';

export const PolicyManagement: React.FC = () => {
  const { success, warning, error: toastError } = useToast();
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'sandbox'>('editor');

  // Policy Sandbox Simulator State
  const [evaluating, setEvaluating] = useState(false);
  const [simProposal, setSimProposal] = useState({
    agent_id: 'agent-devops-01',
    tool_name: 'restart_service',
    action_name: 'restart_service',
    resource: 'production-api',
    environment: 'production',
    data_classification: 'INTERNAL',
    context_provenance: 'USER_PROMPT',
    arguments: JSON.stringify({ service: 'production-api', reason: 'High memory usage' }, null, 2),
  });
  const [simResult, setSimResult] = useState<any>(null);

  // New Policy Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPolicy, setNewPolicy] = useState({
    id: '',
    name: '',
    description: '',
    category: 'RBAC',
    rego_code: `package veritylatch.authz\n\ndefault allow = false\n\n# Enterprise custom rule\nallow {\n    input.agent.id == "agent-devops-01"\n    input.action.environment == "development"\n}`,
  });

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const data = await api.getPolicies();
      setPolicies(data);
      if (data.length > 0 && !selectedPolicy) {
        setSelectedPolicy(data[0]);
      }
    } catch (e: any) {
      toastError('Failed to fetch policies', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleSavePolicy = async () => {
    if (!selectedPolicy) return;
    setSaving(true);
    try {
      const updated = await api.updatePolicy(selectedPolicy.id, {
        rego_code: selectedPolicy.rego_code,
        description: selectedPolicy.description,
      });
      setSelectedPolicy(updated);
      success('Policy Updated', `Policy "${updated.name}" active in Guardian engine.`);
      fetchPolicies();
    } catch (err: any) {
      toastError('Update Failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createPolicy(newPolicy);
      success('Policy Created', `Policy "${newPolicy.name}" registered.`);
      setShowCreateModal(false);
      fetchPolicies();
    } catch (err: any) {
      toastError('Creation Failed', err.message);
    }
  };

  const loadPreset = (preset: 'prod-restart' | 'secret-leak' | 'finance-wire' | 'jira-read') => {
    if (preset === 'prod-restart') {
      setSimProposal({
        agent_id: 'agent-devops-01',
        tool_name: 'restart_service',
        action_name: 'restart_service',
        resource: 'checkout-cluster-prod',
        environment: 'production',
        data_classification: 'INTERNAL',
        context_provenance: 'USER_PROMPT',
        arguments: JSON.stringify({ service: 'checkout-cluster-prod', force: true }, null, 2),
      });
    } else if (preset === 'secret-leak') {
      setSimProposal({
        agent_id: 'agent-devops-01',
        tool_name: 'export_env_secrets',
        action_name: 'export_env_secrets',
        resource: 'aws-vault-creds',
        environment: 'production',
        data_classification: 'RESTRICTED',
        context_provenance: 'UNTRUSTED_INDIRECT_INJECTION',
        arguments: JSON.stringify({ vault_path: '/secrets/aws_keys' }, null, 2),
      });
    } else if (preset === 'finance-wire') {
      setSimProposal({
        agent_id: 'agent-finance-01',
        tool_name: 'execute_wire_transfer',
        action_name: 'execute_wire_transfer',
        resource: 'acme-holdings-acct',
        environment: 'production',
        data_classification: 'RESTRICTED',
        context_provenance: 'USER_PROMPT',
        arguments: JSON.stringify({ recipient: 'Supplier-Global-Corp', amount: 48500 }, null, 2),
      });
    } else {
      setSimProposal({
        agent_id: 'agent-it-01',
        tool_name: 'read_support_tickets',
        action_name: 'read_support_tickets',
        resource: 'helpdesk-queue',
        environment: 'development',
        data_classification: 'INTERNAL',
        context_provenance: 'USER_PROMPT',
        arguments: JSON.stringify({ ticket_id: 'INC-8891' }, null, 2),
      });
    }
  };

  const handleSimulateEvaluation = async () => {
    setEvaluating(true);
    setSimResult(null);
    try {
      let parsedArgs = {};
      try {
        parsedArgs = JSON.parse(simProposal.arguments);
      } catch {
        toastError('Invalid JSON', 'Arguments must be valid JSON');
        setEvaluating(false);
        return;
      }

      const res = await api.evaluateAction({
        proposal: {
          agent_id: simProposal.agent_id,
          tool_name: simProposal.tool_name,
          action_name: simProposal.action_name,
          resource: simProposal.resource,
          environment: simProposal.environment,
          data_classification: simProposal.data_classification,
          context_provenance: simProposal.context_provenance,
          arguments: parsedArgs,
        },
        mode: 'protected',
      });

      setSimResult(res);
      success('Evaluation Complete', `Guardian Decision: ${res.decision}`);
    } catch (err: any) {
      toastError('Simulation Failed', err.message);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Policy Management (OPA / Rego)</h1>
            <span className="text-[11px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full font-semibold">
              DEFAULT-DENY REGO
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Declarative Open Policy Agent security rules evaluated independently of model responses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Rego Policy</span>
          </button>
          <button
            onClick={fetchPolicies}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Policies List */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider px-2 py-1">
            Active Rego Policies ({policies.length})
          </div>

          {loading ? (
            <div className="p-4 text-center text-xs text-slate-400 font-mono">Loading policies...</div>
          ) : (
            <div className="space-y-2 max-h-[550px] overflow-y-auto">
              {policies.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPolicy(p);
                    setActiveTab('editor');
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-all text-xs font-mono ${
                    selectedPolicy?.id === p.id && activeTab === 'editor'
                      ? 'bg-sky-500/15 border-sky-500/40 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-200 truncate">{p.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-sky-400 border border-slate-700 font-semibold">
                      P{p.priority}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-1">{p.description}</div>
                  <div className="text-[10px] text-slate-500 mt-2 flex items-center justify-between">
                    <span>Category: {p.category}</span>
                    <span className="text-emerald-400 font-bold uppercase">Enforcing</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right 2 Columns: Policy Editor & Policy Sandbox */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            {/* Tab Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveTab('editor')}
                  className={`flex items-center gap-1.5 text-xs font-mono font-bold py-1 border-b-2 transition-colors ${
                    activeTab === 'editor'
                      ? 'border-sky-500 text-sky-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  Rego Editor ({selectedPolicy?.name || 'Select Policy'})
                </button>
                <button
                  onClick={() => setActiveTab('sandbox')}
                  className={`flex items-center gap-1.5 text-xs font-mono font-bold py-1 border-b-2 transition-colors ${
                    activeTab === 'sandbox'
                      ? 'border-sky-500 text-sky-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Play className="w-3.5 h-3.5" />
                  Policy Sandbox Simulator
                </button>
              </div>

              {activeTab === 'editor' && (
                <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/25">
                  ACTIVE
                </span>
              )}
            </div>

            {/* TAB 1: Editor View */}
            {activeTab === 'editor' && selectedPolicy && (
              <div className="space-y-4">
                <div className="text-xs text-slate-400 font-mono bg-slate-950 p-2.5 rounded border border-slate-800">
                  {selectedPolicy.description}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-300 font-mono">
                    <span>Rego Code (Open Policy Agent)</span>
                    <span className="text-[10px] text-slate-500">Syntax: Rego v1</span>
                  </div>
                  <textarea
                    value={selectedPolicy.rego_code}
                    onChange={(e) => setSelectedPolicy({ ...selectedPolicy, rego_code: e.target.value })}
                    rows={15}
                    className="w-full p-3.5 bg-slate-950 font-mono text-xs text-emerald-300 rounded-lg border border-slate-800 focus:outline-none focus:border-sky-500 transition-colors leading-relaxed selection:bg-sky-900"
                    spellCheck={false}
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div className="text-[11px] font-mono text-slate-500">
                    Policy Priority: P{selectedPolicy.priority} • Evaluated Fail-Closed
                  </div>
                  <button
                    onClick={handleSavePolicy}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-sky-600/20 disabled:opacity-50 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    {saving ? 'Publishing Policy...' : 'Save & Publish Rego'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Sandbox Simulator View */}
            {activeTab === 'sandbox' && (
              <div className="space-y-4 font-mono text-xs">
                <div>
                  <label className="text-slate-400 block mb-1 text-[11px] uppercase tracking-wider font-semibold">
                    1. Load Preset Test Proposal
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => loadPreset('prod-restart')}
                      className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-slate-300 text-[11px]"
                    >
                      Production Restart (Expect Approval)
                    </button>
                    <button
                      type="button"
                      onClick={() => loadPreset('secret-leak')}
                      className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900/40 border border-red-800/40 rounded text-red-300 text-[11px]"
                    >
                      Export Secrets (Expect DENY)
                    </button>
                    <button
                      type="button"
                      onClick={() => loadPreset('finance-wire')}
                      className="px-2.5 py-1 bg-amber-950/40 hover:bg-amber-900/40 border border-amber-800/40 rounded text-amber-300 text-[11px]"
                    >
                      Wire &gt; $10k (Expect Approval)
                    </button>
                    <button
                      type="button"
                      onClick={() => loadPreset('jira-read')}
                      className="px-2.5 py-1 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-800/40 rounded text-emerald-300 text-[11px]"
                    >
                      Read Support Ticket (Expect ALLOW)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-slate-500 block text-[10px]">AGENT</label>
                    <input
                      value={simProposal.agent_id}
                      onChange={(e) => setSimProposal({ ...simProposal, agent_id: e.target.value })}
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block text-[10px]">TOOL NAME</label>
                    <input
                      value={simProposal.tool_name}
                      onChange={(e) => setSimProposal({ ...simProposal, tool_name: e.target.value })}
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block text-[10px]">ENVIRONMENT</label>
                    <select
                      value={simProposal.environment}
                      onChange={(e) => setSimProposal({ ...simProposal, environment: e.target.value })}
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs"
                    >
                      <option value="development">development</option>
                      <option value="staging">staging</option>
                      <option value="production">production</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-500 block text-[10px]">PROVENANCE</label>
                    <input
                      value={simProposal.context_provenance}
                      onChange={(e) => setSimProposal({ ...simProposal, context_provenance: e.target.value })}
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-500 block text-[10px] mb-1">PROPOSAL ARGUMENTS (JSON)</label>
                  <textarea
                    value={simProposal.arguments}
                    onChange={(e) => setSimProposal({ ...simProposal, arguments: e.target.value })}
                    rows={4}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs font-mono"
                  />
                </div>

                <button
                  onClick={handleSimulateEvaluation}
                  disabled={evaluating}
                  className="w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center justify-center gap-2 shadow-md shadow-sky-600/20 disabled:opacity-50 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  {evaluating ? 'Evaluating Proposal...' : 'Simulate Guardian Evaluation'}
                </button>

                {/* Simulation Result Box */}
                {simResult && (
                  <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <span className="font-bold text-white">Guardian Policy Decision:</span>
                      <span
                        className={`px-2.5 py-0.5 rounded font-bold border ${
                          simResult.decision === 'ALLOW'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : simResult.decision === 'DENY'
                            ? 'bg-red-500/15 text-red-400 border-red-500/30'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {simResult.decision}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500 block text-[10px]">RISK SCORE</span>
                        <span className="text-white font-bold">{simResult.risk_score} / 100</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">RISK CATEGORY</span>
                        <span className="text-amber-400 font-bold uppercase">{simResult.risk_level}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">POLICY MATCHED</span>
                        <span className="text-sky-400 font-bold truncate block">{simResult.policy_matched || 'None'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">EXECUTION PERMITTED</span>
                        <span className={simResult.execution_permitted ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                          {simResult.execution_permitted ? 'TRUE' : 'FALSE'}
                        </span>
                      </div>
                    </div>

                    <p className="text-slate-300 text-[11px]">{simResult.reason}</p>

                    <div className="p-2 bg-slate-900 rounded border border-slate-800 text-[10px] text-slate-400 truncate">
                      Payload Hash: <span className="text-emerald-400 font-mono">{simResult.payload_hash}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Create New Policy */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden font-mono text-xs">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white">Create Open Policy Agent Rule</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePolicy} className="p-6 space-y-4">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Policy Identifier</label>
                <input
                  value={newPolicy.id}
                  onChange={(e) => setNewPolicy({ ...newPolicy, id: e.target.value })}
                  placeholder="e.g. policy-custom-data-boundary"
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Policy Name</label>
                <input
                  value={newPolicy.name}
                  onChange={(e) => setNewPolicy({ ...newPolicy, name: e.target.value })}
                  placeholder="e.g. Sensitive Customer Data Boundary"
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description</label>
                <textarea
                  value={newPolicy.description}
                  onChange={(e) => setNewPolicy({ ...newPolicy, description: e.target.value })}
                  rows={2}
                  placeholder="Explain the security rule purpose and scope..."
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Rego Definition</label>
                <textarea
                  value={newPolicy.rego_code}
                  onChange={(e) => setNewPolicy({ ...newPolicy, rego_code: e.target.value })}
                  rows={7}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-emerald-400 font-mono text-[11px]"
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
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded"
                >
                  Deploy Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
