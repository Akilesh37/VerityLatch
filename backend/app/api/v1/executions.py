from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import Execution, User
from app.schemas.schemas import ExecutionCreate, ExecutionResponse, ExecutionDetailResponse
from app.agents.orchestrator import agent_orchestrator
from app.api.deps import get_current_user

router = APIRouter(prefix="/executions", tags=["Agent Execution Monitoring"])

@router.get("", response_model=List[ExecutionResponse])
def list_executions(
    agent_id: Optional[str] = None,
    mode: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(Execution)
    if agent_id:
        query = query.filter(Execution.agent_id == agent_id)
    if mode:
        query = query.filter(Execution.mode == mode)
    return query.order_by(Execution.created_at.desc()).limit(limit).all()

@router.get("/{execution_id}", response_model=ExecutionDetailResponse)
def get_execution(execution_id: str, db: Session = Depends(get_db)):
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    return execution

@router.post("", status_code=status.HTTP_201_CREATED)
def run_execution(
    exec_in: ExecutionCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    user_id = current_user.id if current_user else None
    result = agent_orchestrator.run_agent_workflow(
        agent_id=exec_in.agent_id,
        user_prompt=exec_in.task_prompt,
        untrusted_context=exec_in.untrusted_context,
        mode=exec_in.mode,
        user_id=user_id,
        db=db
    )
    return result

