import React, { useState, useEffect } from 'react';
import { FlaskConical, Play, Shield, ShieldAlert, CheckCircle2, XCircle, ArrowRight, RefreshCw, Terminal } from 'lucide-react';
import { api } from '../services/api';

export const RedTeamLab: React.FC = () => {
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const [mode, setMode] = useState<'protected' | 'baseline'>('protected');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<any>(null);

  const fetchScenarios = async () => {
    setLoading(true);
    try {
      const data = await api.getRedTeamScenarios();
      setScenarios(data);
      if (data.length > 0 && !selectedScenarioId) {
        setSelectedScenarioId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScenarios();
  }, []);

  const handleRunAttack = async () => {
    if (!selectedScenarioId) return;
    setRunning(true);
    setRunResult(null);
    try {
      const res = await api.runRedTeamScenario(selectedScenarioId, mode);
      setRunResult(res);
    } catch (err: any) {
      alert('Execution failed: ' + err.message);
    } finally {
      setRunning(false);
    }
  };

  const currentScenario = scenarios.find((s) => s.id === selectedScenarioId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Red-Team Laboratory</h1>
          <p className="text-xs text-slate-400 mt-1">
            Empirical adversarial evaluation workbench: test prompt injections and privilege escalations in Protected vs Baseline mode.
          </p>
        </div>
        <button
          onClick={fetchScenarios}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls & Scenario Picker */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">1. Select Attack Scenario</label>
            {loading ? (
              <div className="text-xs font-mono text-slate-500">Loading scenarios...</div>
            ) : (
              <div className="space-y-2">
                {scenarios.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedScenarioId(s.id);
                      setRunResult(null);
                    }}
                    className={`w-full text-left p-3 rounded-lg border text-xs font-mono transition-colors ${
                      selectedScenarioId === s.id
                        ? 'bg-sky-500/15 border-sky-500/40 text-white font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="font-bold text-slate-200">{s.name}</div>
                    <div className="text-[10px] text-sky-400 mt-1">Target: {s.target_agent_id} • {s.category}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800">
            <label className="text-xs font-semibold text-slate-300 block mb-2">2. Evaluation Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('protected')}
                className={`p-3 rounded-lg border text-xs font-mono text-center transition-all ${
                  mode === 'protected'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-bold shadow-sm shadow-emerald-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                }`}
              >
                <Shield className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                Protected Mode
                <span className="block text-[9px] text-slate-400 font-normal">Guardian Active</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('baseline')}
                className={`p-3 rounded-lg border text-xs font-mono text-center transition-all ${
                  mode === 'baseline'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 font-bold shadow-sm shadow-amber-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                }`}
              >
                <ShieldAlert className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                Baseline Mode
                <span className="block text-[9px] text-slate-400 font-normal">No Security Gate</span>
              </button>
            </div>
            {mode === 'baseline' && (
              <p className="text-[10px] text-amber-400/90 font-mono mt-2 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                ⚠️ Warning: Baseline mode bypasses Guardian evaluation to demonstrate vulnerability against simulated enterprise tools.
              </p>
            )}
          </div>

          <button
            onClick={handleRunAttack}
            disabled={running || !selectedScenarioId}
            className="w-full py-3 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-md shadow-sky-600/25"
          >
            <Play className="w-4 h-4" />
            {running ? 'Simulating Adversarial Attack...' : 'Execute Attack Scenario'}
          </button>
        </div>

        {/* Forensic Execution Results Panel */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-sky-400" />
                  {currentScenario?.name || 'Adversarial Trace'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">{currentScenario?.description}</p>
              </div>
              <span
                className={`text-xs font-mono px-2 py-0.5 rounded font-bold border ${
                  mode === 'protected'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                }`}
              >
                {mode.toUpperCase()}
              </span>
            </div>

            {/* Input Payload Preview */}
            <div className="space-y-3 mb-4">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono">
                <span className="text-slate-500 block text-[10px]">USER PROMPT:</span>
                <span className="text-slate-200">{currentScenario?.prompt_input}</span>
              </div>
              {currentScenario?.untrusted_context && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono">
                  <span className="text-amber-400 block text-[10px]">UNTRUSTED RETRIEVAL CONTEXT (INDIRECT INJECTION):</span>
                  <pre className="text-slate-300 text-[11px] whitespace-pre-wrap font-mono mt-1">
                    {currentScenario.untrusted_context}
                  </pre>
                </div>
              )}
            </div>

            {/* Execution Outcome Box */}
            {runResult && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-slate-500 text-[10px] block">LLM MANIPULATED</span>
                    <span className={runResult.llm_manipulated ? 'text-amber-400 font-bold' : 'text-slate-300 font-bold'}>
                      {runResult.llm_manipulated ? 'TRUE' : 'FALSE'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">GUARDIAN DECISION</span>
                    <span
                      className={`font-bold ${
                        runResult.guardian_decision === 'ALLOW'
                          ? 'text-emerald-400'
                          : runResult.guardian_decision === 'DENY'
                          ? 'text-red-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {runResult.guardian_decision || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">TOOL EXECUTED</span>
                    <span className={runResult.tool_executed ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                      {runResult.tool_executed ? 'YES (Breach)' : 'NO (0 Invocations)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">DEFENSE OUTCOME</span>
                    <span
                      className={`font-bold ${
                        runResult.defense_effective ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {runResult.defense_effective ? 'ATTACK BLOCKED' : 'EXPLOITED'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-slate-400">Proposed Tool: <code className="text-sky-400">{runResult.proposed_tool}</code></div>
                  <div className="text-slate-400">Prohibited Tool: <code className="text-red-400">{runResult.prohibited_tool}</code></div>
                  {runResult.policy_matched && (
                    <div className="text-slate-400">Enforcing Policy: <code className="text-emerald-400">{runResult.policy_matched}</code></div>
                  )}
                  <div className="text-slate-300 pt-1">{runResult.summary}</div>
                </div>

                {runResult.tool_result && (
                  <div className="p-3 bg-red-950/20 border border-red-500/30 rounded text-[11px] text-red-300">
                    <div className="font-bold mb-1">VULNERABILITY EVIDENCE (BASELINE DUMP):</div>
                    <pre className="whitespace-pre-wrap">{JSON.stringify(runResult.tool_result, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {!runResult && !running && (
            <div className="p-8 text-center text-slate-500 text-xs font-mono">
              Select a scenario and click "Execute Attack Scenario" to observe live Guardian interception.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
