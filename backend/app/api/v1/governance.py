from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import GovernanceRisk, Agent, PolicyDefinition, SecurityIncident, AuditEvent
from app.schemas.schemas import GovernanceRiskResponse

router = APIRouter(prefix="/governance", tags=["Responsible AI & Governance"])

@router.get("/overview")
def get_governance_overview(db: Session = Depends(get_db)) -> Dict[str, Any]:
    total_agents = db.query(Agent).count()
    active_policies = db.query(PolicyDefinition).filter(PolicyDefinition.is_active == True).count()
    total_risks = db.query(GovernanceRisk).count()
    mitigated_risks = db.query(GovernanceRisk).filter(GovernanceRisk.status == "MITIGATED").count()
    open_incidents = db.query(SecurityIncident).filter(SecurityIncident.remediation_status == "OPEN").count()
    total_audit_events = db.query(AuditEvent).count()

    # NIST AI RMF breakdown
    nist_counts = {"GOVERN": 0, "MAP": 0, "MEASURE": 0, "MANAGE": 0}
    for r in db.query(GovernanceRisk).all():
        if r.nist_category in nist_counts:
            nist_counts[r.nist_category] += 1

    return {
        "framework": "NIST AI Risk Management Framework (AI RMF 1.0)",
        "compliance_posture": "MONITORED",
        "total_registered_agents": total_agents,
        "active_security_policies": active_policies,
        "total_risk_records": total_risks,
        "mitigated_risk_records": mitigated_risks,
        "mitigation_percentage": round((mitigated_risks / max(total_risks, 1)) * 100, 1),
        "open_security_incidents": open_incidents,
        "total_audit_events": total_audit_events,
        "nist_ai_rmf_alignment": nist_counts
    }

@router.get("/risk-register", response_model=List[GovernanceRiskResponse])
def get_risk_register(db: Session = Depends(get_db)):
    risks = db.query(GovernanceRisk).order_by(GovernanceRisk.updated_at.desc()).all()
    return risks

