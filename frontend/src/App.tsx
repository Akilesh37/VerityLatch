import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { OverviewDashboard } from './pages/OverviewDashboard';
import { AgentRegistry } from './pages/AgentRegistry';
import { AgentDetails } from './pages/AgentDetails';
import { ExecutionMonitoring } from './pages/ExecutionMonitoring';
import { PolicyManagement } from './pages/PolicyManagement';
import { ApprovalCenter } from './pages/ApprovalCenter';
import { SecurityIncidentCenter } from './pages/SecurityIncidentCenter';
import { RedTeamLab } from './pages/RedTeamLab';
import { BenchmarkDashboard } from './pages/BenchmarkDashboard';
import { AuditExplorer } from './pages/AuditExplorer';
import { GovernanceDashboard } from './pages/GovernanceDashboard';
import { SystemSettings } from './pages/SystemSettings';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-xs">
        Verifying Guardian session...
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<OverviewDashboard />} />
              <Route path="agents" element={<AgentRegistry />} />
              <Route path="agents/:id" element={<AgentDetails />} />
              <Route path="executions" element={<ExecutionMonitoring />} />
              <Route path="policies" element={<PolicyManagement />} />
              <Route path="approvals" element={<ApprovalCenter />} />
              <Route path="incidents" element={<SecurityIncidentCenter />} />
              <Route path="redteam" element={<RedTeamLab />} />
              <Route path="benchmark" element={<BenchmarkDashboard />} />
              <Route path="audit" element={<AuditExplorer />} />
              <Route path="governance" element={<GovernanceDashboard />} />
              <Route path="settings" element={<SystemSettings />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
};

