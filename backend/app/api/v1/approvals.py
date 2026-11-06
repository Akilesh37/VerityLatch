from typing import List
from datetime import datetime, timezone
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import ApprovalRequest, ApprovalDecision, ActionRequest, AuditEvent, User
from app.schemas.schemas import (
    ApprovalRequestResponse, ApprovalDecisionRequest, ApprovalRejectRequest
)
from app.api.deps import get_current_user, require_roles
from app.core.security import compute_audit_hash

router = APIRouter(prefix="/approvals", tags=["Approval Center"])

def format_approval_response(req: ApprovalRequest) -> dict:
    decision_dict = None
    if req.decision:
        decision_dict = {
            "id": req.decision.id,
            "approver_id": req.decision.approver_id,
            "decision": req.decision.decision,
            "reason": req.decision.reason,
            "decided_at": req.decision.decided_at
        }
    return {
        "id": req.id,
        "action_request_id": req.action_request_id,
        "status": req.status,
        "payload_hash": req.payload_hash,
        "requested_by_agent": req.requested_by_agent,
        "tool_name": req.tool_name,
        "environment": req.environment,
        "risk_score": req.risk_score,
        "explanation": req.explanation,
        "expires_at": req.expires_at,
        "created_at": req.created_at,
        "decision": decision_dict
    }

@router.get("", response_model=List[ApprovalRequestResponse])
def list_approvals(db: Session = Depends(get_db)):
    approvals = db.query(ApprovalRequest).order_by(ApprovalRequest.created_at.desc()).all()
    return [format_approval_response(a) for a in approvals]

@router.get("/{approval_id}", response_model=ApprovalRequestResponse)
def get_approval(approval_id: str, db: Session = Depends(get_db)):
    req = db.query(ApprovalRequest).filter(ApprovalRequest.id == approval_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Approval request not found")
    return format_approval_response(req)

@router.post("/{approval_id}/approve", response_model=ApprovalRequestResponse)
def approve_request(
    approval_id: str,
    body: ApprovalDecisionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Human Approver", "Enterprise Administrator"]))
):
    req = db.query(ApprovalRequest).filter(ApprovalRequest.id == approval_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Approval request not found")
    if req.status != "PENDING":
        raise HTTPException(status_code=400, detail=f"Request cannot be approved; status is {req.status}")

    now = datetime.now(timezone.utc)
    if req.expires_at.replace(tzinfo=timezone.utc) < now:
        req.status = "EXPIRED"
        db.commit()
        raise HTTPException(status_code=400, detail="Approval request has expired")

    # Update approval request status
    req.status = "APPROVED"
    decision = ApprovalDecision(
        approval_request_id=req.id,
        approver_id=current_user.id,
        decision="APPROVED",
        reason=body.reason,
        decided_at=now
    )
    db.add(decision)

    # Update associated ActionRequest
    action_req = db.query(ActionRequest).filter(ActionRequest.id == req.action_request_id).first()
    if action_req:
        action_req.decision = "ALLOW"
        action_req.reason = f"Approved by {current_user.full_name}: {body.reason}"
        if action_req.execution:
            action_req.execution.approved_actions += 1

    # Record Hash-Chained Audit Event
    last_event = db.query(AuditEvent).order_by(AuditEvent.timestamp.desc()).first()
    prev_hash = last_event.current_hash if last_event else "0" * 64
    event_id = str(uuid.uuid4())
    current_hash = compute_audit_hash(event_id, prev_hash, now.isoformat(), f"APPROVED:{req.id}:{req.payload_hash}")

    audit_entry = AuditEvent(
        id=event_id,
        event_type="ACTION_APPROVED",
        agent_id=req.requested_by_agent,
        user_id=current_user.id,
        action_request_id=req.action_request_id,
        tool_name=req.tool_name,
        resource=action_req.resource if action_req else "unknown",
        decision="ALLOW",
        risk_score=req.risk_score,
        payload_hash=req.payload_hash,
        details={"approver": current_user.email, "reason": body.reason},
        previous_hash=prev_hash,
        current_hash=current_hash,
        timestamp=now
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(req)
    return format_approval_response(req)

@router.post("/{approval_id}/reject", response_model=ApprovalRequestResponse)
def reject_request(
    approval_id: str,
    body: ApprovalRejectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Human Approver", "Enterprise Administrator"]))
):
    req = db.query(ApprovalRequest).filter(ApprovalRequest.id == approval_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Approval request not found")
    if req.status != "PENDING":
        raise HTTPException(status_code=400, detail=f"Request cannot be rejected; status is {req.status}")

    now = datetime.now(timezone.utc)
    req.status = "REJECTED"
    decision = ApprovalDecision(
        approval_request_id=req.id,
        approver_id=current_user.id,
        decision="REJECTED",
        reason=body.reason,
        decided_at=now
    )
    db.add(decision)

    action_req = db.query(ActionRequest).filter(ActionRequest.id == req.action_request_id).first()
    if action_req:
        action_req.decision = "DENY"
        action_req.reason = f"Rejected by {current_user.full_name}: {body.reason}"
        if action_req.execution:
            action_req.execution.denied_actions += 1

    # Record Hash-Chained Audit Event
    last_event = db.query(AuditEvent).order_by(AuditEvent.timestamp.desc()).first()
    prev_hash = last_event.current_hash if last_event else "0" * 64
    event_id = str(uuid.uuid4())
    current_hash = compute_audit_hash(event_id, prev_hash, now.isoformat(), f"REJECTED:{req.id}:{req.payload_hash}")

    audit_entry = AuditEvent(
        id=event_id,
        event_type="ACTION_REJECTED",
        agent_id=req.requested_by_agent,
        user_id=current_user.id,
        action_request_id=req.action_request_id,
        tool_name=req.tool_name,
        resource=action_req.resource if action_req else "unknown",
        decision="DENY",
        risk_score=req.risk_score,
        payload_hash=req.payload_hash,
        details={"approver": current_user.email, "reason": body.reason},
        previous_hash=prev_hash,
        current_hash=current_hash,
        timestamp=now
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(req)
    return format_approval_response(req)

