import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.entities import Execution, Agent
from app.schemas.schemas import ActionProposal
from app.agents.providers import get_llm_provider
from app.guardian.gateway import guardian_gateway
from app.agents.executor import protected_executor

class AgentOrchestrator:
    def run_agent_workflow(
        self,
        agent_id: str,
        user_prompt: str,
        untrusted_context: Optional[str] = None,
        mode: str = "protected",
        user_id: Optional[str] = None,
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        """
        Executes an enterprise agent workflow through the LangGraph-style pipeline:
        Prompt -> LLM Proposal -> Guardian Interception -> Authorization -> Tool Execution -> Trace
        """
        now = datetime.now(timezone.utc)
        execution_id = str(uuid.uuid4())
        trace_steps = []

        close_db_local = False
        if db is None:
            from app.core.database import SessionLocal
            db = SessionLocal()
            close_db_local = True

        try:
            # 1. Always create Execution Record in DB
            exec_record = Execution(
                id=execution_id,
                agent_id=agent_id,
                user_id=user_id,
                task_prompt=user_prompt,
                mode=mode,
                status="in_progress",
                created_at=now
            )
            db.add(exec_record)
            db.commit()

            trace_steps.append({
                "step": 1,
                "name": "TASK_INGESTION",
                "timestamp": now.isoformat(),
                "details": {
                    "agent_id": agent_id,
                    "user_prompt": user_prompt,
                    "untrusted_context_present": untrusted_context is not None,
                    "mode": mode
                }
            })

            # 2. LLM Generates Tool Proposal
            llm_provider = get_llm_provider()
            provenance = "UNTRUSTED_JIRA_TICKET" if untrusted_context else "USER_PROMPT"
            proposal_dict = llm_provider.generate_tool_proposal(agent_id, user_prompt, untrusted_context)

            trace_steps.append({
                "step": 2,
                "name": "LLM_PROPOSAL_GENERATED",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "details": {
                    "thought": proposal_dict.get("thought", ""),
                    "proposed_tool": proposal_dict.get("tool_name", ""),
                    "target_environment": proposal_dict.get("environment", "development"),
                    "arguments": proposal_dict.get("arguments", {}),
                    "is_manipulated": proposal_dict.get("manipulated", False)
                }
            })

            # 3. Formulate Action Proposal
            proposal = ActionProposal(
                action_id=str(uuid.uuid4()),
                execution_id=execution_id,
                agent_id=agent_id,
                user_id=user_id,
                tool_name=proposal_dict.get("tool_name", ""),
                action_name=proposal_dict.get("action_name", "execute"),
                resource=proposal_dict.get("resource", "system"),
                environment=proposal_dict.get("environment", "development"),
                arguments=proposal_dict.get("arguments", {}),
                data_classification="INTERNAL",
                context_provenance=provenance
            )

            # 4. Guardian Runtime Interception & Authorization
            guardian_result = guardian_gateway.evaluate_proposal(
                proposal=proposal,
                db=db,
                mode=mode
            )

            trace_steps.append({
                "step": 3,
                "name": "GUARDIAN_INTERCEPTION",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "details": {
                    "decision": guardian_result.decision,
                    "risk_score": guardian_result.risk_score,
                    "risk_level": guardian_result.risk_level,
                    "policy_matched": guardian_result.policy_matched,
                    "reason": guardian_result.reason,
                    "payload_hash": guardian_result.payload_hash,
                    "execution_permitted": guardian_result.execution_permitted,
                    "approval_request_id": guardian_result.approval_request_id
                }
            })

            # 5. Protected Tool Execution Boundary
            tool_result = None
            tool_executed = False
            execution_error = None

            if guardian_result.execution_permitted:
                try:
                    tool_result = protected_executor.execute_tool(
                        tool_name=proposal.tool_name,
                        arguments=proposal.arguments,
                        authorization_ticket=guardian_result.authorization_ticket,
                        expected_payload_hash=guardian_result.payload_hash,
                        mode=mode
                    )
                    tool_executed = True
                    trace_steps.append({
                        "step": 4,
                        "name": "TOOL_EXECUTION_COMPLETED",
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "details": {
                            "tool_name": proposal.tool_name,
                            "tool_executed": True,
                            "output_summary": str(tool_result)[:300]
                        }
                    })
                except Exception as e:
                    execution_error = str(e)
                    trace_steps.append({
                        "step": 4,
                        "name": "TOOL_EXECUTION_REJECTED",
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "details": {
                            "tool_name": proposal.tool_name,
                            "tool_executed": False,
                            "rejection_reason": execution_error
                        }
                    })
            else:
                trace_steps.append({
                    "step": 4,
                    "name": "TOOL_EXECUTION_BLOCKED_BY_GUARDIAN",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "details": {
                        "tool_name": proposal.tool_name,
                        "tool_executed": False,
                        "reason": f"Tool executor was never reached. Decision: {guardian_result.decision}"
                    }
                })

            # 6. Final Status & Summary
            final_status = "completed"
            if guardian_result.decision == "DENY":
                final_status = "blocked"
                summary = f"Operation blocked by Guardian policy '{guardian_result.policy_matched}': {guardian_result.reason}"
            elif guardian_result.decision == "REQUIRE_APPROVAL":
                final_status = "pending_approval"
                summary = f"Action suspended pending human sign-off (Approval Request: {guardian_result.approval_request_id})."
            else:
                summary = f"Successfully executed tool '{proposal.tool_name}' under policy authorization."

            exec_record.status = final_status
            exec_record.result_summary = summary
            exec_record.completed_at = datetime.now(timezone.utc)
            db.commit()

            return {
                "execution_id": execution_id,
                "agent_id": agent_id,
                "mode": mode,
                "status": final_status,
                "summary": summary,
                "llm_manipulated": proposal_dict.get("manipulated", False),
                "proposed_tool": proposal.tool_name,
                "arguments": proposal.arguments,
                "guardian_decision": guardian_result.decision,
                "risk_score": guardian_result.risk_score,
                "risk_level": guardian_result.risk_level,
                "policy_matched": guardian_result.policy_matched,
                "tool_executed": tool_executed,
                "tool_result": tool_result,
                "approval_request_id": guardian_result.approval_request_id,
                "trace_steps": trace_steps
            }
        finally:
            if close_db_local:
                db.close()

agent_orchestrator = AgentOrchestrator()
