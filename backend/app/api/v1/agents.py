from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import Agent, Tool, AgentPermission, User
from app.schemas.schemas import AgentResponse, AgentCreate, AgentUpdate, ToolSchema
from app.api.deps import get_current_user, require_roles

router = APIRouter(tags=["Agents & Tools"])

def format_agent_response(agent: Agent) -> dict:
    perms = []
    for p in agent.permissions:
        perms.append({
            "tool_id": p.tool_id,
            "tool_name": p.tool.name if p.tool else p.tool_id,
            "environment": p.environment,
            "is_allowed": p.is_allowed,
            "requires_approval": p.requires_approval
        })
    return {
        "id": agent.id,
        "name": agent.name,
        "description": agent.description,
        "system_prompt": agent.system_prompt,
        "owner": agent.owner,
        "environment": agent.environment,
        "is_active": agent.is_active,
        "risk_profile": agent.risk_profile,
        "capabilities": agent.capabilities or [],
        "permissions": perms,
        "created_at": agent.created_at,
        "updated_at": agent.updated_at
    }

@router.get("/agents", response_model=List[AgentResponse])
def list_agents(db: Session = Depends(get_db)):
    agents = db.query(Agent).all()
    return [format_agent_response(a) for a in agents]

@router.get("/agents/{agent_id}", response_model=AgentResponse)
def get_agent(agent_id: str, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return format_agent_response(agent)

@router.post("/agents", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
def create_agent(
    agent_in: AgentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Enterprise Administrator", "AI Developer"]))
):
    existing = db.query(Agent).filter(Agent.id == agent_in.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Agent with this ID already exists")
    
    agent = Agent(
        id=agent_in.id,
        name=agent_in.name,
        description=agent_in.description,
        system_prompt=agent_in.system_prompt,
        owner=agent_in.owner,
        environment=agent_in.environment,
        risk_profile=agent_in.risk_profile,
        capabilities=agent_in.capabilities,
        is_active=True
    )
    db.add(agent)
    db.flush()

    for perm in agent_in.permissions:
        tool = db.query(Tool).filter(Tool.id == perm.tool_id).first()
        if tool:
            p = AgentPermission(
                agent_id=agent.id,
                tool_id=perm.tool_id,
                environment=perm.environment,
                is_allowed=perm.is_allowed,
                requires_approval=perm.requires_approval
            )
            db.add(p)

    db.commit()
    db.refresh(agent)
    return format_agent_response(agent)

@router.patch("/agents/{agent_id}", response_model=AgentResponse)
def update_agent(
    agent_id: str,
    agent_in: AgentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Enterprise Administrator", "AI Developer"]))
):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    update_data = agent_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(agent, field, value)

    db.commit()
    db.refresh(agent)
    return format_agent_response(agent)

@router.get("/tools", response_model=List[ToolSchema])
def list_tools(db: Session = Depends(get_db)):
    tools = db.query(Tool).all()
    return tools

