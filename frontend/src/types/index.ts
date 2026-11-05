export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  roles: string[];
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  owner: string;
  environment: string;
  is_active: boolean;
  risk_profile: string;
  capabilities: string[];
  permissions: {
    tool_id: string;
    tool_name: string;
    environment: string;
    is_allowed: boolean;
    requires_approval: boolean;
  }[];
  created_at: string;
  updated_at: string;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  sensitivity: string;
  is_destructive: boolean;
  parameters_schema: any;
}

export interface Execution {
  id: string;
  agent_id: string;
  user_id?: string;
  task_prompt: string;
  mode: 'protected' | 'baseline';
  status: 'in_progress' | 'completed' | 'blocked' | 'pending_approval' | 'failed';
  result_summary?: string;
  total_actions: number;
  allowed_actions: number;
  denied_actions: number;
  approved_actions: number;
  created_at: string;
  completed_at?: string;
}

export interface Policy {
  id: string;
  name: string;
  description: string;
  category: string;
  rego_code: string;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface ApprovalRequest {
  id: string;
  action_request_id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  payload_hash: string;
  requested_by_agent: string;
  tool_name: string;
  environment: string;
  risk_score: number;
  explanation: string;
  expires_at: string;
  created_at: string;
  decision?: {
    id: string;
    approver_id: string;
    decision: string;
    reason: string;
    decided_at: string;
  };
}

export interface SecurityIncident {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  agent_id?: string;
  execution_id?: string;
  description: string;
  attack_input?: string;
  blocked: boolean;
  tool_executed: boolean;
  remediation_status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  created_at: string;
}

export interface AuditEvent {
  id: string;
  sequence_number?: number;
  event_type: string;
  agent_id?: string;
  user_id?: string;
  execution_id?: string;
  tool_name?: string;
  resource?: string;
  decision?: string;
  risk_score?: number;
  payload_hash?: string;
  previous_hash: string;
  current_hash: string;
  timestamp: string;
  details: any;
}

export interface GovernanceRisk {
  id: string;
  risk_title: string;
  nist_category: 'GOVERN' | 'MAP' | 'MEASURE' | 'MANAGE';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'IDENTIFIED' | 'IN_PROGRESS' | 'MITIGATED' | 'ACCEPTED';
  description: string;
  mitigation_control: string;
  owner: string;
  updated_at: string;
}

export interface BenchmarkSummary {
  has_run: boolean;
  run_id?: string;
  dataset_version?: string;
  total_scenarios?: number;
  passed_scenarios?: number;
  failed_scenarios?: number;
  baseline_attack_success_rate?: number;
  protected_attack_success_rate?: number;
  attack_block_rate?: number;
  unauthorized_execution_rate?: number;
  false_positive_rate?: number;
  legitimate_completion_rate?: number;
  median_latency_ms?: number;
  p95_latency_ms?: number;
  summary_report?: any;
  category_metrics?: {
    category: string;
    metric_name: string;
    baseline_value: number;
    protected_value: number;
    diff: number;
  }[];
  created_at?: string;
}
