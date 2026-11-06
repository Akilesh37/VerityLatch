from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# --- Auth & User Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: Dict[str, Any]

class TokenData(BaseModel):
    email: Optional[str] = None
    roles: List[str] = []

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    roles: List[str] = ["AI Developer"]

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    is_active: bool
    roles: List[str]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Agent & Tool Schemas ---
class ToolSchema(BaseModel):
    id: str
    name: str
    description: str
    category: str
    sensitivity: str
    is_destructive: bool
    parameters_schema: Dict[str, Any] = {}

class AgentPermissionSchema(BaseModel):
    tool_id: str
    environment: str = "*"
    is_allowed: bool = True
    requires_approval: bool = False

class AgentCreate(BaseModel):
    id: str
    name: str
    description: str
    system_prompt: str
    owner: str
    environment: str = "development"
    risk_profile: str = "medium"
    capabilities: List[str] = []
    permissions: List[AgentPermissionSchema] = []

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    is_active: Optional[bool] = None
    environment: Optional[str] = None
    risk_profile: Optional[str] = None
    capabilities: Optional[List[str]] = None

class AgentResponse(BaseModel):
    id: str
    name: str
    description: str
    system_prompt: str
    owner: str
    environment: str
    is_active: bool
    risk_profile: str
    capabilities: List[str]
    permissions: List[Dict[str, Any]] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Guardian Evaluation Schemas ---
class ActionProposal(BaseModel):
    action_id: Optional[str] = None
    execution_id: Optional[str] = None
    agent_id: str
    user_id: Optional[str] = None
    tool_name: str
    action_name: str
    resource: str
    environment: str = "development"
    arguments: Dict[str, Any] = {}
    data_classification: str = "INTERNAL"
    context_provenance: str = "USER_PROMPT"

class GuardianEvaluationRequest(BaseModel):
    proposal: ActionProposal
    mode: str = "protected"  # protected vs baseline

class GuardianEvaluationResult(BaseModel):
    decision: str  # ALLOW, DENY, REQUIRE_APPROVAL, MODIFY_OR_REDACT
    risk_score: float
    risk_level: str  # low, medium, high, critical
    risk_factors: List[str]
    policy_matched: Optional[str] = None
    reason: str
    payload_hash: str
    authorization_ticket: Optional[str] = None
    approval_request_id: Optional[str] = None
    redacted_arguments: Optional[Dict[str, Any]] = None
    execution_permitted: bool

# --- Execution Schemas ---
class ExecutionCreate(BaseModel):
    agent_id: str
    task_prompt: str
    mode: str = "protected"  # protected or baseline
    untrusted_context: Optional[str] = None

class ActionRequestDetail(BaseModel):
    id: str
    tool_name: str
    action_name: str
    resource: str
    environment: str
    arguments: Dict[str, Any] = {}
    payload_hash: str
    data_classification: str
    context_provenance: str
    risk_score: float
    risk_level: str
    risk_factors: List[str] = []
    decision: str
    policy_matched: Optional[str] = None
    reason: Optional[str] = None
    tool_executed: bool
    execution_result: Optional[Any] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ExecutionResponse(BaseModel):
    id: str
    agent_id: str
    user_id: Optional[str] = None
    task_prompt: str
    mode: str
    status: str
    result_summary: Optional[str] = None
    total_actions: int
    allowed_actions: int
    denied_actions: int
    approved_actions: int
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class ExecutionDetailResponse(ExecutionResponse):
    action_requests: List[ActionRequestDetail] = []

# --- Approval Schemas ---
class ApprovalDecisionRequest(BaseModel):
    reason: Optional[str] = "Approved by authorized human operator"

class ApprovalRejectRequest(BaseModel):
    reason: str = "Operation rejected due to risk or security violation"

class ApprovalRequestResponse(BaseModel):
    id: str
    action_request_id: str
    status: str
    payload_hash: str
    requested_by_agent: str
    tool_name: str
    environment: str
    risk_score: float
    explanation: str
    expires_at: datetime
    created_at: datetime
    decision: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)

# --- Policy Schemas ---
class PolicyCreate(BaseModel):
    id: str
    name: str
    description: str
    category: str
    rego_code: str
    is_active: bool = True
    priority: int = 100

class PolicyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    rego_code: Optional[str] = None
    is_active: Optional[bool] = None
    priority: Optional[int] = None

class PolicyResponse(BaseModel):
    id: str
    name: str
    description: str
    category: str
    rego_code: str
    is_active: bool
    priority: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Security & Incident Schemas ---
class SecurityIncidentResponse(BaseModel):
    id: str
    title: str
    severity: str
    category: str
    agent_id: Optional[str] = None
    execution_id: Optional[str] = None
    action_request_id: Optional[str] = None
    description: str
    attack_input: Optional[str] = None
    blocked: bool
    tool_executed: bool
    remediation_status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Audit Schemas ---
class AuditEventResponse(BaseModel):
    id: str
    sequence_number: Optional[int] = None
    event_type: str
    agent_id: Optional[str] = None
    user_id: Optional[str] = None
    execution_id: Optional[str] = None
    tool_name: Optional[str] = None
    resource: Optional[str] = None
    decision: Optional[str] = None
    risk_score: Optional[float] = None
    payload_hash: Optional[str] = None
    previous_hash: str
    current_hash: str
    timestamp: datetime
    details: Dict[str, Any] = {}

    model_config = ConfigDict(from_attributes=True)

class AuditVerificationResponse(BaseModel):
    is_valid: bool
    total_events: int
    verified_events: int
    broken_link_id: Optional[str] = None
    message: str

# --- Governance Schemas ---
class GovernanceRiskResponse(BaseModel):
    id: str
    risk_title: str
    nist_category: str
    severity: str
    status: str
    description: str
    mitigation_control: str
    owner: str
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- RedTeam & Benchmark Schemas ---
class RedTeamRunRequest(BaseModel):
    scenario_id: str
    mode: str = "protected"  # protected vs baseline

class BenchmarkRunRequest(BaseModel):
    scenarios_count: int = 200
    dataset_version: str = "v1.0.0"
