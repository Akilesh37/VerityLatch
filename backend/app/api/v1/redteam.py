import uuid
from typing import List, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import RedTeamScenario, RedTeamResult, SecurityIncident
from app.schemas.schemas import RedTeamRunRequest
from app.agents.orchestrator import agent_orchestrator
from app.agents.executor import protected_executor

router = APIRouter(prefix="/redteam", tags=["Red-Team Laboratory"])

@router.get("/scenarios")
def list_scenarios(db: Session = Depends(get_db)):
    scenarios = db.query(RedTeamScenario).all()
    return scenarios

@router.post("/run")
def run_scenario(
    request: RedTeamRunRequest,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    scenario = db.query(RedTeamScenario).filter(RedTeamScenario.id == request.scenario_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    # Record baseline tool invocation count before run
    initial_count = protected_executor.get_execution_count(scenario.prohibited_tool)

    # Execute workflow through orchestrator
    result = agent_orchestrator.run_agent_workflow(
        agent_id=scenario.target_agent_id,
        user_prompt=scenario.prompt_input,
        untrusted_context=scenario.untrusted_context,
        mode=request.mode,
        db=db
    )

    final_count = protected_executor.get_execution_count(scenario.prohibited_tool)
    tool_executed = (final_count > initial_count) or (result.get("tool_executed", False) and result.get("proposed_tool") == scenario.prohibited_tool)

    # Attack succeeded if prohibited tool was executed or if baseline permitted the violation
    attack_succeeded = tool_executed

    # Record RedTeamResult
    redteam_res = RedTeamResult(
        id=str(uuid.uuid4()),
        scenario_id=scenario.id,
        mode=request.mode,
        agent_id=scenario.target_agent_id,
        model_name="mock-enterprise-v1",
        llm_manipulated=result.get("llm_manipulated", False),
        proposed_tool=result.get("proposed_tool"),
        guardian_decision=result.get("guardian_decision"),
        tool_executed=tool_executed,
        attack_succeeded=attack_succeeded,
        execution_trace=result.get("trace_steps", []),
        created_at=datetime.now(timezone.utc)
    )
    db.add(redteam_res)
    db.commit()

    return {
        "scenario_id": scenario.id,
        "scenario_name": scenario.name,
        "category": scenario.category,
        "mode": request.mode,
        "llm_manipulated": result.get("llm_manipulated", False),
        "proposed_tool": result.get("proposed_tool"),
        "prohibited_tool": scenario.prohibited_tool,
        "guardian_decision": result.get("guardian_decision"),
        "policy_matched": result.get("policy_matched"),
        "tool_executed": tool_executed,
        "tool_execution_counter": final_count,
        "attack_succeeded": attack_succeeded,
        "defense_effective": not attack_succeeded if request.mode == "protected" else False,
        "summary": result.get("summary"),
        "trace_steps": result.get("trace_steps", []),
        "tool_result": result.get("tool_result")
    }
