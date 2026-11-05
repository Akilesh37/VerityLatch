import React, { useState, useEffect } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { Bot, Shield, Terminal, ArrowLeft, Check, AlertCircle, Play, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export const AgentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testPrompt, setTestPrompt] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [executing, setExecuting] = useState(false);

  const fetchAgent = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.getAgent(id);
      setAgent(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgent();
  }, [id]);

  const handleExecuteTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPrompt || !agent) return;
    setExecuting(true);
    setTestResult(null);
    try {
      const res = await api.runExecution({
        agent_id: agent.id,
        task_prompt: testPrompt,
        mode: 'protected',
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ error: err.message });
    } finally {
      setExecuting(false);
    }
  };

  if (loading && !agent) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 font-mono text-xs">
        Loading agent details...
      </div>
    );
  }

  if (!agent) {
    return <div className="text-red-400 text-sm">Agent not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <NavLink
          to="/agents"
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Agent Registry
        </NavLink>
        <span className="text-xs font-mono bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded border border-sky-500/30">
          ID: {agent.id}
        </span>
      </div>

      {/* Agent Header */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">{agent.name}</h1>
            <p className="text-xs text-slate-400 mt-1">{agent.description}</p>
            <div className="flex items-center gap-4 mt-3 text-xs font-mono text-slate-400">
              <span>Owner: <strong className="text-slate-200">{agent.owner}</strong></span>
              <span>•</span>
              <span>Environment: <strong className="text-emerald-400 uppercase">{agent.environment}</strong></span>
              <span>•</span>
              <span>Risk: <strong className="text-sky-400 uppercase">{agent.risk_profile}</strong></span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Prompt & Configuration */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-sky-400" />
            Agent System Prompt
          </h2>
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed max-h-56 overflow-y-auto">
            {agent.system_prompt}
          </div>

          <h3 className="text-xs font-semibold text-slate-300 pt-2 border-t border-slate-800">
            Granted Tool Permissions & OPA Constraints
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {agent.permissions?.map((p: any) => (
              <div
                key={p.tool_id}
                className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono"
              >
                <div>
                  <div className="font-semibold text-slate-200">{p.tool_name || p.tool_id}</div>
                  <div className="text-[10px] text-slate-400">Env: {p.environment}</div>
                </div>
                <div className="flex items-center gap-2">
                  {p.requires_approval ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      Req. Approval
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Auto-Authorized
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Test Console */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-emerald-400" />
              Live Guardian Test Sandbox
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Dispatch a test prompt to {agent.name} through the Guardian Control Plane.
            </p>

            <form onSubmit={handleExecuteTest} className="space-y-3">
              <textarea
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                placeholder="Enter prompt (e.g. 'Lookup Jira ticket DEV-1042' or 'Restart production service')..."
                rows={3}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
              />
              <button
                type="submit"
                disabled={executing || !testPrompt}
                className="py-2 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                {executing ? 'Evaluating Action...' : 'Run Protected Execution'}
              </button>
            </form>
          </div>

          {testResult && (
            <div className="mt-4 p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Guardian Decision:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                    testResult.guardian_decision === 'ALLOW'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : testResult.guardian_decision === 'DENY'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {testResult.guardian_decision || 'ERROR'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Proposed Tool:</span>
                <span className="text-slate-200">{testResult.proposed_tool || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tool Executed:</span>
                <span className={testResult.tool_executed ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                  {testResult.tool_executed ? 'YES (Simulated)' : 'NO (Blocked before tool)'}
                </span>
              </div>
              {testResult.summary && (
                <div className="pt-2 text-[11px] text-slate-300 border-t border-slate-800/80">
                  {testResult.summary}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
