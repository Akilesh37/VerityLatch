from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.schemas import GuardianEvaluationRequest, GuardianEvaluationResult
from app.guardian.gateway import guardian_gateway

router = APIRouter(prefix="/guardian", tags=["Guardian Control Plane"])

@router.post("/evaluate", response_model=GuardianEvaluationResult)
def evaluate_action(
    request: GuardianEvaluationRequest,
    db: Session = Depends(get_db)
):
    """
    Directly evaluates a proposed tool action against identity, OPA Rego policies,
    privacy constraints, and risk thresholds.
    """
    return guardian_gateway.evaluate_proposal(
        proposal=request.proposal,
        db=db,
        mode=request.mode
    )
