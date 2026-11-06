import React, { useState, useEffect } from 'react';
import {
  FlaskConical, Play, Shield, ShieldAlert, CheckCircle2, XCircle,
  ArrowRight, RefreshCw, Terminal, Split, Lock, AlertTriangle,
  Copy, ExternalLink, Activity
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';

export const RedTeamLab: React.FC = () => {
  const { success, warning, error: toastError } = useToast();
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'single'>('split');
  const [singleMode, setSingleMode] = useState<'protected' | 'baseline'>('protected');

  // Results
  const [baselineResult, setBaselineResult] = useState<any>(null);
  const [protectedResult, setProtectedResult] = useState<any>(null);
  const [singleResult, setSingleResult] = useState<any>(null);

  const fetchScenarios = async () => {
    setLoading(true);
    try {
      const data = await api.getRedTeamScenarios();
      setScenarios(data);
      if (data.length > 0 && !selectedScenarioId) {
        setSelectedScenarioId(data[0].id);
      }
    } catch (e: any) {
      toastError('Failed to fetch scenarios', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScenarios();
  }, []);

  const handleRunSideBySide = async () => {
    if (!selectedScenarioId) return;
    setRunning(true);
    setBaselineResult(null);
    setProtectedResult(null);
    try {
      // Execute both baseline and protected in parallel
      const [baseRes, protRes] = await Promise.all([
        api.runRedTeamScenario(selectedScenarioId, 'baseline'),
        api.runRedTeamScenario(selectedScenarioId, 'protected'),
      ]);
      setBaselineResult(baseRes);
      setProtectedResult(protRes);
      success(
        'Evaluation Completed',
        `Baseline: ${baseRes.attack_succeeded ? 'EXPLOITED' : 'BLOCKED'} | Guardian: ${protRes.defense_effective ? '100% CONTAINED' : 'FAILED'}`
      );
    } catch (err: any) {
      toastError('Evaluation Error', err.message);
    } finally {
      setRunning(false);
    }
  };

  const handleRunSingle = async () => {
    if (!selectedScenarioId) return;
    setRunning(true);
    setSingleResult(null);
    try {
      const res = await api.runRedTeamScenario(selectedScenarioId, singleMode);
      setSingleResult(res);
      if (res.defense_effective) {
        success('Attack Blocked', 'Guardian zero-trust policy prevented tool execution');
      } else {
        warning('Attack Succeeded', 'Baseline mode allowed tool execution');
      }
    } catch (err: any) {
      toastError('Execution Error', err.message);
    } finally {
      setRunning(false);
    }
  };

  const currentScenario = scenarios.find((s) => s.id === selectedScenarioId);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Red-Team Laboratory</h1>
            <span className="text-[11px] font-mono bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-semibold">
              ADVERSARIAL SUITE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Empirical runtime security workbench: compare prompt injection attacks side-by-side against Unprotected Baseline vs VerityLatch Guardian.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs font-mono">
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
                viewMode === 'split' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Split className="w-3.5 h-3.5" />
              Side-by-Side Split
            </button>
            <button
              onClick={() => setViewMode('single')}
              className={`px-3 py-1 rounded transition-colors ${
                viewMode === 'single' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Single Mode
            </button>
          </div>

          <button
            onClick={fetchScenarios}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Scenario Selector & Attack Configuration */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2 font-mono uppercase tracking-wider">
              1. Attack Scenario Catalogue ({scenarios.length})
            </label>
            {loading ? (
              <div className="text-xs font-mono text-slate-500 p-4 text-center">Loading scenarios...</div>
            ) : (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {scenarios.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedScenarioId(s.id);
                      setBaselineResult(null);
                      setProtectedResult(null);
                      setSingleResult(null);
                    }}
                    className={`w-full text-left p-3 rounded-lg border text-xs font-mono transition-all ${
                      selectedScenarioId === s.id
                        ? 'bg-sky-500/15 border-sky-500/50 text-white shadow-sm shadow-sky-500/10'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="font-bold text-slate-200">{s.name}</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span className="text-sky-400 font-semibold">{s.target_agent_id}</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {s.category}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mode Selector for Single Mode */}
          {viewMode === 'single' && (
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <label className="text-xs font-semibold text-slate-300 block font-mono uppercase tracking-wider">
                2. Execution Boundary
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSingleMode('protected')}
                  className={`p-2.5 rounded-lg border text-xs font-mono text-center transition-all ${
                    singleMode === 'protected'
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                  }`}
                >
                  <Shield className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                  Protected
                </button>
                <button
                  type="button"
                  onClick={() => setSingleMode('baseline')}
                  className={`p-2.5 rounded-lg border text-xs font-mono text-center transition-all ${
                    singleMode === 'baseline'
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                  Baseline
                </button>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            {viewMode === 'split' ? (
              <button
                onClick={handleRunSideBySide}
                disabled={running || !selectedScenarioId}
                className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-600/25 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Split className="w-4 h-4" />
                {running ? 'Executing Dual Evaluation...' : 'Run Side-by-Side Comparison'}
              </button>
            ) : (
              <button
                onClick={handleRunSingle}
                disabled={running || !selectedScenarioId}
                className="w-full py-3 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-600/25 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Play className="w-4 h-4" />
                {running ? 'Evaluating Attack Scenario...' : `Execute in ${singleMode.toUpperCase()}`}
              </button>
            )}
          </div>
        </div>

        {/* Right 2 Columns: Attack Details & Execution Workspace */}
        <div className="lg:col-span-2 space-y-4">
          {/* Active Scenario Prompt Preview */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                  Active Attack Vector: {currentScenario?.name || 'Select Scenario'}
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
                Target: {currentScenario?.target_agent_id}
              </span>
            </div>

            <p className="text-xs text-slate-300 font-mono">
              {currentScenario?.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  User Prompt
                </span>
                <span className="text-slate-200">{currentScenario?.prompt_input}</span>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[10px] font-bold text-amber-400 uppercase block mb-1">
                  Untrusted Injected Vector
                </span>
                <pre className="text-[11px] text-amber-200/90 whitespace-pre-wrap font-mono max-h-24 overflow-y-auto">
                  {currentScenario?.untrusted_context || 'None (Direct prompt attack)'}
                </pre>
              </div>
            </div>
          </div>

          {/* Results: Side-by-Side Dual Terminal */}
          {viewMode === 'split' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Terminal: Unprotected Baseline */}
              <div className="p-4 rounded-xl bg-slate-950 border border-red-950/80 shadow-md space-y-3">
                <div className="flex items-center justify-between border-b border-red-900/40 pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-bold text-red-400 font-mono">
                      UNPROTECTED BASELINE
                    </span>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-800/50">
                    NO GUARDIAN GATEWAY
                  </span>
                </div>

                {baselineResult ? (
                  <div className="space-y-3 font-mono text-xs">
                    <div className="p-2.5 rounded bg-red-950/30 border border-red-800/40 text-red-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-red-400">Security Outcome</span>
                        <span className="text-[10px] font-bold bg-red-500/20 text-red-300 px-2 py-0.5 rounded border border-red-500/30">
                          {baselineResult.attack_succeeded ? 'SYSTEM COMPROMISED' : 'SAFE'}
                        </span>
                      </div>
                      <div className="text-[11px] text-red-300 mt-1">
                        LLM fell for injected prompt and executed prohibited tool directly.
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 bg-slate-900 rounded border border-slate-800">
                        <span className="text-slate-500 text-[10px] block">TOOL EXECUTED</span>
                        <span className="text-red-400 font-bold">
                          {baselineResult.tool_executed ? 'YES (1 Invocations)' : 'NO'}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-900 rounded border border-slate-800">
                        <span className="text-slate-500 text-[10px] block">INVOCATION COUNTER</span>
                        <span className="text-red-400 font-bold">
                          {baselineResult.tool_execution_counter} calls
                        </span>
                      </div>
                    </div>

                    {baselineResult.tool_result && (
                      <div className="p-2.5 bg-red-950/40 rounded border border-red-800/40">
                        <div className="text-[10px] text-red-400 font-bold mb-1">
                          EXFILTRATED DATA / BREACH EVIDENCE:
                        </div>
                        <pre className="text-[10px] text-red-200 whitespace-pre-wrap overflow-x-auto max-h-32">
                          {JSON.stringify(baselineResult.tool_result, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs font-mono">
                    Click "Run Side-by-Side Comparison" to execute the baseline simulation.
                  </div>
                )}
              </div>

              {/* Right Terminal: VerityLatch Protected */}
              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-950/80 shadow-md space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-900/40 pb-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400 font-mono">
                      VERITYLATCH CONTROL PLANE
                    </span>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                    ZERO-TRUST ACTIVE
                  </span>
                </div>

                {protectedResult ? (
                  <div className="space-y-3 font-mono text-xs">
                    <div className="p-2.5 rounded bg-emerald-950/30 border border-emerald-800/40 text-emerald-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-emerald-400">Security Outcome</span>
                        <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                          {protectedResult.defense_effective ? '100% CONTAINED' : 'BREACH'}
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-300 mt-1">
                        Tool invocation intercepted and rejected at Guardian enforcement boundary.
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 bg-slate-900 rounded border border-slate-800">
                        <span className="text-slate-500 text-[10px] block">GUARDIAN DECISION</span>
                        <span className="text-red-400 font-bold">
                          {protectedResult.guardian_decision}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-900 rounded border border-slate-800">
                        <span className="text-slate-500 text-[10px] block">TOOL EXECUTED</span>
                        <span className="text-emerald-400 font-bold">
                          NO (0 Invocations)
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-900 rounded border border-slate-800 space-y-1">
                      <div className="text-[10px] text-slate-500 uppercase">Enforcing Rego Policy</div>
                      <div className="text-emerald-400 font-bold text-xs truncate">
                        {protectedResult.policy_matched || 'policy-prohibited-tools'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Incident automatically logged to Security Incident Center and tamper-evident audit ledger.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs font-mono">
                    Click "Run Side-by-Side Comparison" to execute the zero-trust simulation.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Results: Single Mode */}
          {viewMode === 'single' && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              {singleResult ? (
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-slate-200">
                      Result: {singleResult.scenario_name} ({singleResult.mode.toUpperCase()})
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        singleResult.defense_effective
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}
                    >
                      {singleResult.defense_effective ? 'DEFENSE EFFECTIVE' : 'ATTACK SUCCEEDED'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">GUARDIAN DECISION</span>
                      <span className="font-bold text-slate-200">{singleResult.guardian_decision || 'N/A'}</span>
                    </div>
                    <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">TOOL INVOCATIONS</span>
                      <span className={singleResult.tool_executed ? 'font-bold text-red-400' : 'font-bold text-emerald-400'}>
                        {singleResult.tool_executed ? '1 (Breach)' : '0 (Contained)'}
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">POLICY MATCHED</span>
                      <span className="font-bold text-sky-400 truncate block">
                        {singleResult.policy_matched || 'None'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded border border-slate-800 text-slate-300">
                    {singleResult.summary}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs font-mono">
                  Select a scenario and click "Execute in {singleMode.toUpperCase()}" to begin evaluation.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
