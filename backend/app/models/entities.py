import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    approvals = relationship("ApprovalDecision", back_populates="approver")

class Role(Base):
    __tablename__ = "roles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    users = relationship("UserRole", back_populates="role")

class UserRole(Base):
    __tablename__ = "user_roles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role_id = Column(String(36), ForeignKey("roles.id", ondelete="CASCADE"), nullable=False)

    user = relationship("User", back_populates="roles")
    role = relationship("Role", back_populates="users")

class Agent(Base):
    __tablename__ = "agents"

    id = Column(String(50), primary_key=True)  # e.g. agent-it-01, agent-devops-01, agent-finance-01
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    system_prompt = Column(Text, nullable=False)
    owner = Column(String(255), nullable=False)
    environment = Column(String(50), default="development", nullable=False)
    is_active = Column(Boolean, default=True)
    risk_profile = Column(String(50), default="medium")  # low, medium, high
    capabilities = Column(JSON, default=list)  # list of capabilities
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    permissions = relationship("AgentPermission", back_populates="agent", cascade="all, delete-orphan")
    executions = relationship("Execution", back_populates="agent")

class Tool(Base):
    __tablename__ = "tools"

    id = Column(String(100), primary_key=True)  # e.g. read_jira_ticket, restart_service
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False)  # IT, DevOps, Finance
    sensitivity = Column(String(50), default="medium")  # low, medium, high, critical
    is_destructive = Column(Boolean, default=False)
    parameters_schema = Column(JSON, default=dict)
    created_at = Column(DateTime, default=utc_now)

    permissions = relationship("AgentPermission", back_populates="tool")

class AgentPermission(Base):
    __tablename__ = "agent_permissions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    agent_id = Column(String(50), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False)
    tool_id = Column(String(100), ForeignKey("tools.id", ondelete="CASCADE"), nullable=False)
    environment = Column(String(50), default="*")  # development, staging, production, or *
    is_allowed = Column(Boolean, default=True)
    requires_approval = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)

    agent = relationship("Agent", back_populates="permissions")
    tool = relationship("Tool", back_populates="permissions")

class Execution(Base):
    __tablename__ = "executions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    agent_id = Column(String(50), ForeignKey("agents.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    task_prompt = Column(Text, nullable=False)
    mode = Column(String(50), default="protected")  # protected, baseline
    status = Column(String(50), default="in_progress")  # in_progress, completed, failed, blocked
    result_summary = Column(Text, nullable=True)
    total_actions = Column(Integer, default=0)
    allowed_actions = Column(Integer, default=0)
    denied_actions = Column(Integer, default=0)
    approved_actions = Column(Integer, default=0)
    created_at = Column(DateTime, default=utc_now)
    completed_at = Column(DateTime, nullable=True)

    agent = relationship("Agent", back_populates="executions")
    action_requests = relationship("ActionRequest", back_populates="execution", cascade="all, delete-orphan")

class ActionRequest(Base):
    __tablename__ = "action_requests"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    execution_id = Column(String(36), ForeignKey("executions.id", ondelete="CASCADE"), nullable=True)
    agent_id = Column(String(50), ForeignKey("agents.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    tool_name = Column(String(100), nullable=False)
    action_name = Column(String(100), nullable=False)
    resource = Column(String(255), nullable=False)
    environment = Column(String(50), default="development", nullable=False)
    arguments = Column(JSON, default=dict)
    payload_hash = Column(String(64), nullable=False)
    data_classification = Column(String(50), default="INTERNAL")  # PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED
    context_provenance = Column(String(100), default="USER_PROMPT")  # UNTRUSTED_JIRA_TICKET, EXTERNAL_WEB, INTERNAL_DOC
    risk_score = Column(Float, default=0.0)
    risk_level = Column(String(50), default="low")  # low, medium, high, critical
    risk_factors = Column(JSON, default=list)
    decision = Column(String(50), nullable=False)  # ALLOW, DENY, REQUIRE_APPROVAL, MODIFY_OR_REDACT
    policy_matched = Column(String(100), nullable=True)
    reason = Column(Text, nullable=True)
    tool_executed = Column(Boolean, default=False)
    execution_result = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    execution = relationship("Execution", back_populates="action_requests")
    approval_request = relationship("ApprovalRequest", back_populates="action_request", uselist=False)

class PolicyDefinition(Base):
    __tablename__ = "policy_definitions"

    id = Column(String(100), primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False)  # RBAC, DataProtection, Guardrails, Environment
    rego_code = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)
    priority = Column(Integer, default=100)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    versions = relationship("PolicyVersion", back_populates="policy", cascade="all, delete-orphan")

class PolicyVersion(Base):
    __tablename__ = "policy_versions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    policy_id = Column(String(100), ForeignKey("policy_definitions.id", ondelete="CASCADE"), nullable=False)
    version = Column(Integer, nullable=False)
    rego_code = Column(Text, nullable=False)
    author = Column(String(255), default="system")
    change_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    policy = relationship("PolicyDefinition", back_populates="versions")

class ApprovalRequest(Base):
    __tablename__ = "approval_requests"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    action_request_id = Column(String(36), ForeignKey("action_requests.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="PENDING")  # PENDING, APPROVED, REJECTED, EXPIRED
    payload_hash = Column(String(64), nullable=False)  # Enforces cryptographic payload binding
    requested_by_agent = Column(String(50), nullable=False)
    tool_name = Column(String(100), nullable=False)
    environment = Column(String(50), nullable=False)
    risk_score = Column(Float, nullable=False)
    explanation = Column(Text, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=utc_now)

    action_request = relationship("ActionRequest", back_populates="approval_request")
    decision = relationship("ApprovalDecision", back_populates="approval_request", uselist=False)

class ApprovalDecision(Base):
    __tablename__ = "approval_decisions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    approval_request_id = Column(String(36), ForeignKey("approval_requests.id", ondelete="CASCADE"), nullable=False)
    approver_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    decision = Column(String(50), nullable=False)  # APPROVED, REJECTED
    reason = Column(Text, nullable=True)
    decided_at = Column(DateTime, default=utc_now)

    approval_request = relationship("ApprovalRequest", back_populates="decision")
    approver = relationship("User", back_populates="approvals")

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    sequence_number = Column(Integer, autoincrement=True, unique=True, index=True)
    event_type = Column(String(100), nullable=False, index=True)
    agent_id = Column(String(50), nullable=True)
    user_id = Column(String(36), nullable=True)
    execution_id = Column(String(36), nullable=True)
    action_request_id = Column(String(36), nullable=True)
    tool_name = Column(String(100), nullable=True)
    resource = Column(String(255), nullable=True)
    decision = Column(String(50), nullable=True)
    risk_score = Column(Float, nullable=True)
    payload_hash = Column(String(64), nullable=True)
    details = Column(JSON, default=dict)
    previous_hash = Column(String(64), nullable=False)
    current_hash = Column(String(64), nullable=False, index=True)
    timestamp = Column(DateTime, default=utc_now, index=True)

class SecurityIncident(Base):
    __tablename__ = "security_incidents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    severity = Column(String(50), nullable=False)  # low, medium, high, critical
    category = Column(String(100), nullable=False)  # prompt_injection, unauthorized_tool, pii_leakage, etc.
    agent_id = Column(String(50), nullable=True)
    execution_id = Column(String(36), nullable=True)
    action_request_id = Column(String(36), nullable=True)
    description = Column(Text, nullable=False)
    attack_input = Column(Text, nullable=True)
    blocked = Column(Boolean, default=True)
    tool_executed = Column(Boolean, default=False)
    remediation_status = Column(String(50), default="OPEN")  # OPEN, INVESTIGATING, RESOLVED, DISMISSED
    created_at = Column(DateTime, default=utc_now)
    resolved_at = Column(DateTime, nullable=True)

class RedTeamScenario(Base):
    __tablename__ = "redteam_scenarios"

    id = Column(String(100), primary_key=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    target_agent_id = Column(String(50), nullable=False)
    prompt_input = Column(Text, nullable=False)
    untrusted_context = Column(Text, nullable=True)
    prohibited_tool = Column(String(100), nullable=False)
    expected_decision = Column(String(50), default="DENY")
    difficulty = Column(String(50), default="medium")
    created_at = Column(DateTime, default=utc_now)

class RedTeamResult(Base):
    __tablename__ = "redteam_results"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    scenario_id = Column(String(100), ForeignKey("redteam_scenarios.id"), nullable=False)
    mode = Column(String(50), nullable=False)  # baseline, protected
    agent_id = Column(String(50), nullable=False)
    model_name = Column(String(100), nullable=False)
    llm_manipulated = Column(Boolean, default=False)
    proposed_tool = Column(String(100), nullable=True)
    guardian_decision = Column(String(50), nullable=True)
    tool_executed = Column(Boolean, default=False)
    attack_succeeded = Column(Boolean, default=False)
    execution_trace = Column(JSON, default=list)
    created_at = Column(DateTime, default=utc_now)

class GovernanceRisk(Base):
    __tablename__ = "governance_risks"

    id = Column(String(50), primary_key=True)
    risk_title = Column(String(255), nullable=False)
    nist_category = Column(String(50), nullable=False)  # GOVERN, MAP, MEASURE, MANAGE
    severity = Column(String(50), nullable=False)  # Low, Medium, High, Critical
    status = Column(String(50), default="MITIGATED")  # IDENTIFIED, IN_PROGRESS, MITIGATED, ACCEPTED
    description = Column(Text, nullable=False)
    mitigation_control = Column(Text, nullable=False)
    owner = Column(String(100), nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

class BenchmarkRun(Base):
    __tablename__ = "benchmark_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    dataset_version = Column(String(50), default="v1.0.0")
    total_scenarios = Column(Integer, nullable=False)
    passed_scenarios = Column(Integer, nullable=False)
    failed_scenarios = Column(Integer, nullable=False)
    baseline_attack_success_rate = Column(Float, nullable=False)
    protected_attack_success_rate = Column(Float, nullable=False)
    attack_block_rate = Column(Float, nullable=False)
    unauthorized_execution_rate = Column(Float, nullable=False)
    false_positive_rate = Column(Float, nullable=False)
    legitimate_completion_rate = Column(Float, nullable=False)
    median_latency_ms = Column(Float, nullable=False)
    p95_latency_ms = Column(Float, nullable=False)
    summary_report = Column(JSON, default=dict)
    created_at = Column(DateTime, default=utc_now)

class BenchmarkMetric(Base):
    __tablename__ = "benchmark_metrics"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    benchmark_run_id = Column(String(36), ForeignKey("benchmark_runs.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(100), nullable=False)
    metric_name = Column(String(100), nullable=False)
    baseline_value = Column(Float, nullable=False)
    protected_value = Column(Float, nullable=False)
    diff = Column(Float, nullable=False)
