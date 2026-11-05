import logging
from typing import Dict, Any, Tuple
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

class PolicyEvaluator:
    def __init__(self, opa_url: str = None):
        self.opa_url = opa_url or settings.OPA_URL
        self._opa_available: bool = False
        self._has_checked_opa: bool = False

    def check_opa_availability(self) -> bool:
        if self._has_checked_opa:
            return self._opa_available
        self._has_checked_opa = True
        try:
            with httpx.Client(timeout=0.1) as client:
                resp = client.get("http://localhost:8181/v1/data")
                if resp.status_code == 200:
                    self._opa_available = True
                    return True
        except Exception:
            self._opa_available = False
        return False

    def evaluate(self, policy_input: Dict[str, Any]) -> Tuple[str, str, str]:
        """
        Evaluates input against OPA / Rego policies.
        Returns: (decision, matched_policy_name, reason)
        Decisions: ALLOW, DENY, REQUIRE_APPROVAL, MODIFY_OR_REDACT
        Enforces Fail-Closed Default-Deny.
        """
        if self.check_opa_availability():
            try:
                with httpx.Client(timeout=settings.OPA_TIMEOUT_SECONDS) as client:
                    resp = client.post(self.opa_url, json={"input": policy_input})
                    if resp.status_code == 200:
                        data = resp.json().get("result", {})
                        if data.get("deny"):
                            return "DENY", "OPA-Rego-Deny", data.get("deny_reason", "Action explicitly denied by OPA policy")
                        if data.get("require_approval"):
                            return "REQUIRE_APPROVAL", "OPA-Rego-Approval", "Action requires human-in-the-loop approval"
                        if data.get("allow"):
                            return "ALLOW", "OPA-Rego-Allow", "Action permitted by OPA policy"
            except Exception as e:
                logger.warning(f"External OPA call failed ({e}). Falling back to embedded deterministic policy engine.")

        # Embedded Deterministic Rego Policy Evaluator (Fail-Closed Default-Deny)
        return self._embedded_rego_eval(policy_input)

    def _embedded_rego_eval(self, inp: Dict[str, Any]) -> Tuple[str, str, str]:
        tool_name = inp.get("tool_name", "")
        agent_id = inp.get("agent_id", "")
        env = inp.get("environment", "development").lower()
        tool_allowed = inp.get("tool_allowed", False)
        requires_approval = inp.get("requires_approval", False)
        provenance = inp.get("context_provenance", "USER_PROMPT")
        sensitivity = inp.get("tool_sensitivity", "medium").lower()

        # Rule 1: Prohibited Tools (Absolute Deny)
        if tool_name in ["export_env_secrets", "execute_payment"]:
            return "DENY", "policy-prohibited-tools", f"Execution of prohibited tool '{tool_name}' is permanently blocked by security policy."

        # Rule 2: Untrusted Provenance Guard
        if "untrusted" in provenance.lower() and sensitivity in ["high", "critical"]:
            return "DENY", "policy-untrusted-provenance-guard", f"Prohibited: High-sensitivity tool '{tool_name}' cannot be triggered by untrusted context ({provenance})."

        # Rule 3: RBAC & Permission Delegation Check
        if not tool_allowed:
            return "DENY", "policy-rbac-enforcement", f"Agent '{agent_id}' does not have delegated permission for tool '{tool_name}' in environment '{env}'."

        # Rule 4: Production Infrastructure Mutation (Approval Required)
        if tool_name in ["restart_service", "prepare_production_restart"] and env == "production":
            return "REQUIRE_APPROVAL", "policy-production-restart-approval", f"Production infrastructure modification on '{tool_name}' mandates human sign-off."

        if tool_name == "prepare_payment_request" or requires_approval:
            return "REQUIRE_APPROVAL", "policy-finance-approval", f"Tool '{tool_name}' is flagged as requiring human authorization."

        # Rule 5: Default Allow for explicitly permitted low/medium tools
        if tool_allowed and not requires_approval:
            return "ALLOW", "policy-rbac-enforcement", f"Action '{tool_name}' authorized for agent '{agent_id}'."

        # Default Deny (Fail Closed)
        return "DENY", "default-deny", "No policy explicitly permits this operation (Default-Deny)."

policy_evaluator = PolicyEvaluator()
