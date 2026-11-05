import React, { useState, useEffect } from 'react';
import { FileCheck, Shield, Plus, Check, RefreshCw, Code2 } from 'lucide-react';
import { api } from '../services/api';

export const PolicyManagement: React.FC = () => {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const data = await api.getPolicies();
      setPolicies(data);
      if (data.length > 0 && !selectedPolicy) {
        setSelectedPolicy(data[0]);
      }
    } catch (e) {
      console.error(e);
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
    setSaveSuccess(false);
    try {
      const updated = await api.updatePolicy(selectedPolicy.id, {
        rego_code: selectedPolicy.rego_code,
        description: selectedPolicy.description,
      });
      setSelectedPolicy(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      fetchPolicies();
    } catch (err) {
      alert('Failed to update policy: ' + err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Policy Management (OPA / Rego)</h1>
          <p className="text-xs text-slate-400 mt-1">
            Declarative security policies enforced by the Guardian independently of model responses.
          </p>
        </div>
        <button
          onClick={fetchPolicies}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Policies List */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="text-xs font-semibold text-slate-300 px-2 py-1">Active Policies ({policies.length})</div>
          {loading ? (
            <div className="p-4 text-center text-xs text-slate-400 font-mono">Loading policies...</div>
          ) : (
            policies.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPolicy(p)}
                className={`w-full text-left p-3 rounded-lg border transition-all text-xs font-mono ${
                  selectedPolicy?.id === p.id
                    ? 'bg-sky-500/15 border-sky-500/40 text-white'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-200">{p.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-sky-400">
                    P{p.priority}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-1">{p.description}</div>
                <div className="text-[10px] text-slate-500 mt-2 font-mono">Category: {p.category}</div>
              </button>
            ))
          )}
        </div>

        {/* Selected Policy Editor */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4">
          {selectedPolicy ? (
            <>
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div>
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-sky-400" />
                      {selectedPolicy.name}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedPolicy.description}</p>
                  </div>
                  <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/25">
                    ACTIVE
                  </span>
                </div>

                <div className="space-y-1.5 mb-2">
                  <label className="text-xs font-medium text-slate-300">Rego Policy Definition</label>
                  <textarea
                    value={selectedPolicy.rego_code}
                    onChange={(e) => setSelectedPolicy({ ...selectedPolicy, rego_code: e.target.value })}
                    rows={14}
                    className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400 focus:outline-none focus:border-sky-500 transition-colors leading-relaxed selection:bg-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs font-mono">
                <span className="text-slate-500">ID: {selectedPolicy.id}</span>
                <div className="flex items-center gap-3">
                  {saveSuccess && (
                    <span className="text-emerald-400 flex items-center gap-1 text-xs">
                      <Check className="w-3.5 h-3.5" /> Policy Updated (v+1)
                    </span>
                  )}
                  <button
                    onClick={handleSavePolicy}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Publishing...' : 'Save & Publish Version'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-400 font-mono text-xs">
              Select a policy to inspect or edit.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
