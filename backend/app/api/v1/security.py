from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import SecurityIncident, User
from app.schemas.schemas import SecurityIncidentResponse
from app.api.deps import require_roles

router = APIRouter(prefix="/security", tags=["Security Incidents"])

class IncidentStatusUpdate(BaseModel):
    remediation_status: str  # OPEN, INVESTIGATING, RESOLVED, DISMISSED

@router.get("/incidents", response_model=List[SecurityIncidentResponse])
def list_incidents(
    severity: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(SecurityIncident)
    if severity:
        query = query.filter(SecurityIncident.severity == severity)
    if status:
        query = query.filter(SecurityIncident.remediation_status == status)
    incidents = query.order_by(SecurityIncident.created_at.desc()).all()
    return incidents

@router.get("/incidents/{incident_id}", response_model=SecurityIncidentResponse)
def get_incident(incident_id: str, db: Session = Depends(get_db)):
    incident = db.query(SecurityIncident).filter(SecurityIncident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident

@router.patch("/incidents/{incident_id}", response_model=SecurityIncidentResponse)
def update_incident_status(
    incident_id: str,
    update: IncidentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Security Analyst", "Enterprise Administrator"]))
):
    incident = db.query(SecurityIncident).filter(SecurityIncident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    incident.remediation_status = update.remediation_status
    if update.remediation_status == "RESOLVED":
        incident.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(incident)
    return incident
