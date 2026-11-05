import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.entities import (
    Agent, Tool, AgentPermission, ActionRequest, ApprovalRequest,
    SecurityIncident, AuditEvent, Execution
)
from app.schemas.schemas import ActionProposal, GuardianEvaluationResult
from app.privacy.analyzer import privacy_engine
from app.security.guardrails import guardrails_engine
from app.guardian.risk_engine import risk_engine
from app.policies.evaluator import policy_evaluator
from app.core.security import compute_payload_hash, compute_audit_hash

class GuardianGateway:
    def evaluate_proposal(
        self,
        proposal: ActionProposal,
        db: Optional[Session] = None,
        mode: str = "protected"
    ) -> GuardianEvaluationResult:
        close_db_local = False
        if db is None:
            from app.core.database import SessionLocal
            db = SessionLocal()
            close_db_local = True

        try:
            return self._evaluate_proposal_impl(proposal, db, mode)
        finally:
            if close_db_local:
                db.close()

    def _evaluate_proposal_impl(
        self,
        proposal: ActionProposal,
        db: Session,
        mode: str = "protected"
    ) -> GuardianEvaluationResult:
        now = datetime.now(timezone.utc)
        payload_hash = compute_payload_hash(proposal.arguments)

        # In baseline mode (unprotected), Guardian logs but does not enforce
        if mode == "baseline":
            return GuardianEvaluationResult(
                decision="ALLOW",
                risk_score=95.0 if proposal.tool_name == "export_env_secrets" else 10.0,
                risk_level="critical" if proposal.tool_name == "export_env_secrets" else "low",
                risk_factors=["BASELINE UNPROTECTED MODE: Guardian enforcement bypassed for comparison."],
                policy_matched="none-baseline-bypass",
                reason="Unprotected baseline execution: direct invocation without policy gate.",
                payload_hash=payload_hash,
                authorization_ticket=f"baseline_ticket_{uuid.uuid4()}",
                approval_request_id=None,
                redacted_arguments=proposal.arguments,
                execution_permitted=True
            )

        # 1. Authenticate and Validate Agent
        agent = db.query(Agent).filter(Agent.id == proposal.agent_id).first()
        if not agent or not agent.is_active:
            return self._record_deny(
                db=db,
                proposal=proposal,
                payload_hash=payload_hash,
                reason=f"Agent '{proposal.agent_id}' is inactive or unregistered.",
                policy_matched="agent-identity-validation",
                risk_score=85.0,
                risk_factors=["Unregistered or deactivated agent ID."]
            )

        # 2. Lookup Tool Metadata
        tool = db.query(Tool).filter(Tool.id == proposal.tool_name).first()
        tool_sensitivity = tool.sensitivity if tool else "critical"
        is_destructive = tool.is_destructive if tool else True

        # 3. Check Delegated Agent Permission in Target Environment
        perm = db.query(AgentPermission).filter(
            AgentPermission.agent_id == proposal.agent_id,
            AgentPermission.tool_id == proposal.tool_name
        ).first()

        tool_allowed = False
        requires_approval = False
        if perm and perm.is_allowed:
            if perm.environment in ["*", proposal.environment]:
                tool_allowed = True
                requires_approval = perm.requires_approval

        # 4. Privacy & Secret Scanning
        redacted_args, pii_findings = privacy_engine.scan_dict(proposal.arguments)
        has_pii = len(pii_findings) > 0

        # 5. Guardrail / Injection Analysis
        args_text = str(proposal.arguments)
        is_suspicious, indicators, attack_cat = guardrails_engine.evaluate_input_security(
            prompt=args_text,
            untrusted_context=proposal.context_provenance
        )
        data_class = guardrails_engine.classify_data(args_text, has_secrets_or_pii=has_pii)

        # 6. Deterministic Risk Engine
        risk_score, risk_level, factors, recommendation = risk_engine.calculate_risk(
            tool_name=proposal.tool_name,
            tool_sensitivity=tool_sensitivity,
            is_destructive=is_destructive,
            environment=proposal.environment,
            provenance=proposal.context_provenance,
            data_classification=data_class,
            has_adversarial_indicators=is_suspicious,
            has_pii=has_pii
        )

        # 7. OPA Policy Evaluation
        policy_input = {
            "agent_id": proposal.agent_id,
            "tool_name": proposal.tool_name,
            "action_name": proposal.action_name,
            "environment": proposal.environment,
            "resource": proposal.resource,
            "arguments": proposal.arguments,
            "context_provenance": proposal.context_provenance,
            "tool_sensitivity": tool_sensitivity,
            "tool_allowed": tool_allowed,
            "requires_approval": requires_approval,
            "risk_score": risk_score
        }
        decision, policy_name, reason = policy_evaluator.evaluate(policy_input)

        # Generate ActionRequest ID upfront
        action_request_id = str(uuid.uuid4())

        # 8. Handle Actions Based on Decision
        authz_ticket = None
        approval_id = None
        execution_permitted = False

        if decision == "ALLOW":
            authz_ticket = f"authz_ticket_{uuid.uuid4().hex}"
            execution_permitted = True
        elif decision == "REQUIRE_APPROVAL":
            execution_permitted = False
            # Create Approval Request referencing the action_request_id
            apprv_req = ApprovalRequest(
                id=str(uuid.uuid4()),
                action_request_id=action_request_id,
                status="PENDING",
                payload_hash=payload_hash,
                requested_by_agent=proposal.agent_id,
                tool_name=proposal.tool_name,
                environment=proposal.environment,
                risk_score=risk_score,
                explanation=f"{reason}. Recommended review: {recommendation}",
                expires_at=now + timedelta(hours=24),
                created_at=now
            )
            approval_id = apprv_req.id
        elif decision == "DENY":
            execution_permitted = False
            # Create Security Incident
            incident = SecurityIncident(
                id=str(uuid.uuid4()),
                title=f"Blocked Unauthorized Tool: {proposal.tool_name} by {proposal.agent_id}",
                severity=risk_level,
                category=attack_cat if attack_cat != "none" else "unauthorized_tool_execution",
                agent_id=proposal.agent_id,
                execution_id=proposal.execution_id,
                action_request_id=action_request_id,
                description=f"Guardian intercepted prohibited tool invocation. Reason: {reason}",
                attack_input=str(proposal.arguments),
                blocked=True,
                tool_executed=False,
                remediation_status="OPEN",
                created_at=now
            )
            db.add(incident)

        # Persist ActionRequest first so foreign key constraints are satisfied
        action_req = ActionRequest(
            id=action_request_id,
            execution_id=proposal.execution_id,
            agent_id=proposal.agent_id,
            user_id=proposal.user_id,
            tool_name=proposal.tool_name,
            action_name=proposal.action_name,
            resource=proposal.resource,
            environment=proposal.environment,
            arguments=redacted_args,
            payload_hash=payload_hash,
            data_classification=data_class,
            context_provenance=proposal.context_provenance,
            risk_score=risk_score,
            risk_level=risk_level,
            risk_factors=factors,
            decision=decision,
            policy_matched=policy_name,
            reason=reason,
            tool_executed=False,
            created_at=now
        )
        db.add(action_req)
        db.flush()

        if approval_id:
            db.add(apprv_req)
            db.flush()

        # Update Execution statistics if linked
        if proposal.execution_id:
            exec_record = db.query(Execution).filter(Execution.id == proposal.execution_id).first()
            if exec_record:
                exec_record.total_actions += 1
                if decision == "ALLOW":
                    exec_record.allowed_actions += 1
                elif decision == "DENY":
                    exec_record.denied_actions += 1

        # Append to Cryptographic Hash-Chained Audit Ledger
        last_event = db.query(AuditEvent).order_by(AuditEvent.timestamp.desc()).first()
        prev_hash = last_event.current_hash if last_event else "0" * 64
        event_id = str(uuid.uuid4())
        event_summary = f"{decision}:{proposal.tool_name}:{payload_hash}"
        current_hash = compute_audit_hash(event_id, prev_hash, now.isoformat(), event_summary)

        audit_entry = AuditEvent(
            id=event_id,
            event_type=f"GUARDIAN_EVAL_{decision}",
            agent_id=proposal.agent_id,
            user_id=proposal.user_id,
            execution_id=proposal.execution_id,
            action_request_id=action_req.id,
            tool_name=proposal.tool_name,
            resource=proposal.resource,
            decision=decision,
            risk_score=risk_score,
            payload_hash=payload_hash,
            details={"policy": policy_name, "risk_level": risk_level, "factors": factors},
            previous_hash=prev_hash,
            current_hash=current_hash,
            timestamp=now
        )
        db.add(audit_entry)
        db.commit()

        return GuardianEvaluationResult(
            decision=decision,
            risk_score=risk_score,
            risk_level=risk_level,
            risk_factors=factors,
            policy_matched=policy_name,
            reason=reason,
            payload_hash=payload_hash,
            authorization_ticket=authz_ticket,
            approval_request_id=approval_id,
            redacted_arguments=redacted_args,
            execution_permitted=execution_permitted
        )

    def _record_deny(
        self,
        db: Session,
        proposal: ActionProposal,
        payload_hash: str,
        reason: str,
        policy_matched: str,
        risk_score: float,
        risk_factors: list
    ) -> GuardianEvaluationResult:
        now = datetime.now(timezone.utc)
        action_req = ActionRequest(
            id=str(uuid.uuid4()),
            execution_id=proposal.execution_id,
            agent_id=proposal.agent_id,
            user_id=proposal.user_id,
            tool_name=proposal.tool_name,
            action_name=proposal.action_name,
            resource=proposal.resource,
            environment=proposal.environment,
            arguments=proposal.arguments,
            payload_hash=payload_hash,
            data_classification="INTERNAL",
            context_provenance=proposal.context_provenance,
            risk_score=risk_score,
            risk_level="high",
            risk_factors=risk_factors,
            decision="DENY",
            policy_matched=policy_matched,
            reason=reason,
            tool_executed=False,
            created_at=now
        )
        db.add(action_req)

        incident = SecurityIncident(
            id=str(uuid.uuid4()),
            title=f"Denied Action: {proposal.tool_name} by {proposal.agent_id}",
            severity="high",
            category="unauthorized_access",
            agent_id=proposal.agent_id,
            execution_id=proposal.execution_id,
            description=reason,
            attack_input=str(proposal.arguments),
            blocked=True,
            tool_executed=False,
            created_at=now
        )
        db.add(incident)

        last_event = db.query(AuditEvent).order_by(AuditEvent.timestamp.desc()).first()
        prev_hash = last_event.current_hash if last_event else "0" * 64
        event_id = str(uuid.uuid4())
        current_hash = compute_audit_hash(event_id, prev_hash, now.isoformat(), f"DENY:{proposal.tool_name}:{payload_hash}")

        audit_entry = AuditEvent(
            id=event_id,
            event_type="GUARDIAN_EVAL_DENY",
            agent_id=proposal.agent_id,
            user_id=proposal.user_id,
            action_request_id=action_req.id,
            tool_name=proposal.tool_name,
            resource=proposal.resource,
            decision="DENY",
            risk_score=risk_score,
            payload_hash=payload_hash,
            details={"policy": policy_matched, "reason": reason},
            previous_hash=prev_hash,
            current_hash=current_hash,
            timestamp=now
        )
        db.add(audit_entry)
        db.commit()

        return GuardianEvaluationResult(
            decision="DENY",
            risk_score=risk_score,
            risk_level="high",
            risk_factors=risk_factors,
            policy_matched=policy_matched,
            reason=reason,
            payload_hash=payload_hash,
            authorization_ticket=None,
            approval_request_id=None,
            redacted_arguments=proposal.arguments,
            execution_permitted=False
        )

guardian_gateway = GuardianGateway()
