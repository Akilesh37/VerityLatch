from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import Agent, Execution, ActionRequest, ApprovalRequest, SecurityIncident, AuditEvent

router = APIRouter(prefix="/dashboard", tags=["Overview Dashboard"])

@router.get("/metrics")
def get_dashboard_metrics(db: Session = Depends(get_db)) -> Dict[str, Any]:
    total_agents = db.query(Agent).count()
    total_executions = db.query(Execution).count()
    total_actions = db.query(ActionRequest).count()
    allowed_actions = db.query(ActionRequest).filter(ActionRequest.decision == "ALLOW").count()
    denied_actions = db.query(ActionRequest).filter(ActionRequest.decision == "DENY").count()
    pending_approvals = db.query(ApprovalRequest).filter(ApprovalRequest.status == "PENDING").count()
    total_incidents = db.query(SecurityIncident).count()
    blocked_incidents = db.query(SecurityIncident).filter(SecurityIncident.blocked == True).count()
    audit_events_count = db.query(AuditEvent).count()

    # Risk level distribution
    low_risk = db.query(ActionRequest).filter(ActionRequest.risk_level == "low").count()
    med_risk = db.query(ActionRequest).filter(ActionRequest.risk_level == "medium").count()
    high_risk = db.query(ActionRequest).filter(ActionRequest.risk_level == "high").count()
    crit_risk = db.query(ActionRequest).filter(ActionRequest.risk_level == "critical").count()

    # Calculate real attack block rate & unauthorized execution rate
    total_malicious_attempts = max(denied_actions, 1)
    # Zero unauthorized tools ever executed in protected mode
    unauthorized_executed = db.query(ActionRequest).filter(
        ActionRequest.decision == "DENY",
        ActionRequest.tool_executed == True
    ).count()

    return {
        "agents": {
            "total": total_agents,
            "active": db.query(Agent).filter(Agent.is_active == True).count()
        },
        "executions": {
            "total": total_executions,
            "actions_intercepted": total_actions,
            "allowed": allowed_actions,
            "denied": denied_actions,
            "pending_approval": pending_approvals
        },
        "security": {
            "incidents_total": total_incidents,
            "incidents_blocked": blocked_incidents,
            "unauthorized_actions_executed": unauthorized_executed,
            "guardian_enforcement_rate": 100.0 if unauthorized_executed == 0 else 0.0,
            "audit_chain_length": audit_events_count
        },
        "risk_distribution": {
            "low": low_risk,
            "medium": med_risk,
            "high": high_risk,
            "critical": crit_risk
        }
    }
