import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@veritylatch.io');
  const [password, setPassword] = useState('VerityAdmin2026!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const setDemoUser = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))]" />

      <div className="relative w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-xl p-8 shadow-2xl backdrop-blur">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-4 shadow-lg shadow-sky-500/20">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">VERITYLATCH</h1>
          <p className="text-xs text-slate-400 mt-1">Enterprise AI Agent Runtime Security & Governance</p>
          <div className="mt-3 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-mono text-sky-400">
            "Every AI action must be verified before it is executed."
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Enterprise Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold tracking-wide flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-md shadow-sky-600/30"
          >
            {loading ? 'Authenticating...' : 'Sign In to Control Plane'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Roles Quick Select */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-[11px] font-mono text-slate-400 text-center mb-3">SELECT EVALUATION ROLE</p>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <button
              type="button"
              onClick={() => setDemoUser('admin@veritylatch.io', 'VerityAdmin2026!')}
              className="p-2 rounded bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-left transition-colors"
            >
              <div className="font-semibold text-slate-200">Admin</div>
              <div className="text-[10px] text-slate-400">Full platform</div>
            </button>
            <button
              type="button"
              onClick={() => setDemoUser('analyst@veritylatch.io', 'SecurityAnalyst2026!')}
              className="p-2 rounded bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-left transition-colors"
            >
              <div className="font-semibold text-slate-200">Analyst</div>
              <div className="text-[10px] text-slate-400">Red-team & audit</div>
            </button>
            <button
              type="button"
              onClick={() => setDemoUser('approver@veritylatch.io', 'ApproverLead2026!')}
              className="p-2 rounded bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-left transition-colors"
            >
              <div className="font-semibold text-slate-200">Approver</div>
              <div className="text-[10px] text-slate-400">Human sign-off</div>
            </button>
            <button
              type="button"
              onClick={() => setDemoUser('developer@veritylatch.io', 'AIDeveloper2026!')}
              className="p-2 rounded bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-left transition-colors"
            >
              <div className="font-semibold text-slate-200">AI Dev</div>
              <div className="text-[10px] text-slate-400">Agent testing</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

