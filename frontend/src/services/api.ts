const API_BASE = '/api/v1';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('veritylatch_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'Request failed';
    try {
      const err = await response.json();
      errorDetail = err.detail || JSON.stringify(err);
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (data: { email: string; password: string }) =>
    request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request<any>('/auth/me'),

  // Dashboard
  getDashboardMetrics: () => request<any>('/dashboard/metrics'),

  // Agents & Tools
  getAgents: () => request<any[]>('/agents'),
  getAgent: (id: string) => request<any>(`/agents/${id}`),
  createAgent: (data: any) => request<any>('/agents', { method: 'POST', body: JSON.stringify(data) }),
  updateAgent: (id: string, data: any) => request<any>(`/agents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getTools: () => request<any[]>('/tools'),

  // Executions
  getExecutions: (params?: { agent_id?: string; mode?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<any[]>(`/executions?${query}`);
  },
  getExecution: (id: string) => request<any>(`/executions/${id}`),
  runExecution: (data: { agent_id: string; task_prompt: string; mode?: string; untrusted_context?: string }) =>
    request<any>('/executions', { method: 'POST', body: JSON.stringify(data) }),

  // Guardian Direct Evaluation
  evaluateAction: (data: any) =>
    request<any>('/guardian/evaluate', { method: 'POST', body: JSON.stringify(data) }),

  // Policies
  getPolicies: () => request<any[]>('/policies'),
  getPolicy: (id: string) => request<any>(`/policies/${id}`),
  createPolicy: (data: any) => request<any>('/policies', { method: 'POST', body: JSON.stringify(data) }),
  updatePolicy: (id: string, data: any) => request<any>(`/policies/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Approvals
  getApprovals: () => request<any[]>('/approvals'),
  getApproval: (id: string) => request<any>(`/approvals/${id}`),
  approveRequest: (id: string, reason?: string) =>
    request<any>(`/approvals/${id}/approve`, { method: 'POST', body: JSON.stringify({ reason }) }),
  rejectRequest: (id: string, reason: string) =>
    request<any>(`/approvals/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // Incidents
  getIncidents: (params?: { severity?: string; status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<any[]>(`/security/incidents?${query}`);
  },
  getIncident: (id: string) => request<any>(`/security/incidents/${id}`),
  updateIncidentStatus: (id: string, remediation_status: string) =>
    request<any>(`/security/incidents/${id}`, { method: 'PATCH', body: JSON.stringify({ remediation_status }) }),

  // Audit
  getAuditEvents: (limit: number = 100) => request<any[]>(`/audit/events?limit=${limit}`),
  verifyAuditLedger: () => request<any>('/audit/verify', { method: 'POST' }),

  // Governance
  getGovernanceOverview: () => request<any>('/governance/overview'),
  getRiskRegister: () => request<any[]>('/governance/risk-register'),

  // Red Team & Benchmark
  getRedTeamScenarios: () => request<any[]>('/redteam/scenarios'),
  runRedTeamScenario: (scenario_id: string, mode: string = 'protected') =>
    request<any>('/redteam/run', { method: 'POST', body: JSON.stringify({ scenario_id, mode }) }),
  getBenchmarkResults: () => request<any>('/benchmark/results'),
  triggerBenchmark: (scenarios_count: number = 200) =>
    request<any>('/benchmark/run', { method: 'POST', body: JSON.stringify({ scenarios_count }) }),
};

