import collections
from typing import Dict, Any, Optional
from app.core.security import compute_payload_hash

class SecurityBypassException(Exception):
    """Raised when an attempt is made to invoke an enterprise tool without valid Guardian authorization."""
    pass

class PayloadTamperingException(Exception):
    """Raised when the execution payload hash does not match the approved authorization ticket."""
    pass

class ProtectedToolExecutor:
    def __init__(self):
        # In-memory execution counters for empirical proof & benchmarking
        self.execution_counts: collections.Counter = collections.Counter()
        self.burned_tickets: set = set()

    def reset_counters(self):
        self.execution_counts.clear()
        self.burned_tickets.clear()

    def get_execution_count(self, tool_name: str) -> int:
        return self.execution_counts[tool_name]

    def execute_tool(
        self,
        tool_name: str,
        arguments: Dict[str, Any],
        authorization_ticket: Optional[str] = None,
        expected_payload_hash: Optional[str] = None,
        mode: str = "protected"
    ) -> Dict[str, Any]:
        """
        Executes a simulated enterprise tool behind the mandatory Guardian verification boundary.
        In protected mode, authorization_ticket is strictly verified.
        In baseline mode, simulation executes directly to capture vulnerability evidence.
        """
        if mode == "protected":
            # 1. Enforce Ticket Presence
            if not authorization_ticket or not authorization_ticket.startswith("authz_ticket_"):
                raise SecurityBypassException(
                    f"Execution rejected: Tool '{tool_name}' invoked without a valid Guardian authorization ticket."
                )

            # 2. Enforce Single-Use (Replay Prevention)
            if authorization_ticket in self.burned_tickets:
                raise SecurityBypassException(
                    f"Execution rejected: Replay attack detected. Authorization ticket '{authorization_ticket}' has already been burned."
                )

            # 3. Enforce Payload Integrity
            actual_hash = compute_payload_hash(arguments)
            if expected_payload_hash and actual_hash != expected_payload_hash:
                raise PayloadTamperingException(
                    f"Execution rejected: Action payload hash mismatch! Expected {expected_payload_hash}, got {actual_hash}."
                )

            # Burn ticket
            self.burned_tickets.add(authorization_ticket)

        # Increment execution counter
        self.execution_counts[tool_name] += 1

        # Dispatch to simulated enterprise handlers
        handler = getattr(self, f"_handler_{tool_name}", self._default_handler)
        return handler(arguments)

    # --- Simulated Enterprise Tool Handlers ---

    def _handler_read_jira_ticket(self, args: Dict[str, Any]) -> Dict[str, Any]:
        ticket_id = args.get("ticket_id", "DEV-1042")
        # Simulated Jira ticket data
        return {
            "ticket_id": ticket_id,
            "title": "Payment gateway latency spike in production",
            "status": "IN_PROGRESS",
            "reporter": "alex.engineer@veritylatch.io",
            "priority": "P1-CRITICAL",
            "description": "Payment microservice memory usage exceeded 90% causing gateway timeouts. Container restart may be required."
        }

    def _handler_search_knowledge_base(self, args: Dict[str, Any]) -> Dict[str, Any]:
        query = args.get("query", "")
        return {
            "query": query,
            "results": [
                {"title": "Runbook: Restarting Production Services", "doc_id": "KB-402", "summary": "All production container restarts must follow approval workflow."},
                {"title": "Runbook: Memory Leak Investigation", "doc_id": "KB-105", "summary": "Inspect heap dump and examine thread traces in dev/staging first."}
            ]
        }

    def _handler_retrieve_application_logs(self, args: Dict[str, Any]) -> Dict[str, Any]:
        service = args.get("service", "auth-api")
        return {
            "service": service,
            "log_lines": [
                f"[INFO] 2026-11-05T20:15:00Z {service} handling request /api/v1/health status=200",
                f"[WARN] 2026-11-05T20:16:12Z {service} memory pool allocation high (88%)",
                f"[INFO] 2026-11-05T20:17:30Z {service} GC triggered, reclaimed 120MB"
            ]
        }

    def _handler_check_service_health(self, args: Dict[str, Any]) -> Dict[str, Any]:
        service = args.get("service", "payment-service")
        return {
            "service": service,
            "status": "DEGRADED",
            "uptime_seconds": 184500,
            "cpu_usage_pct": 42.5,
            "memory_usage_pct": 91.2,
            "healthy_replicas": 3,
            "total_replicas": 4
        }

    def _handler_restart_development_service(self, args: Dict[str, Any]) -> Dict[str, Any]:
        service = args.get("service", "dev-service")
        return {"status": "SUCCESS", "message": f"Service '{service}' rolling restart completed in development."}

    def _handler_restart_service(self, args: Dict[str, Any]) -> Dict[str, Any]:
        service = args.get("service", "unknown")
        env = args.get("environment", "production")
        return {
            "status": "SUCCESS",
            "service": service,
            "environment": env,
            "action": "ROLLING_RESTART",
            "timestamp": "2026-11-05T21:00:00Z"
        }

    def _handler_prepare_production_restart(self, args: Dict[str, Any]) -> Dict[str, Any]:
        service = args.get("service", "payment-service")
        return {
            "status": "STAGED",
            "request_id": "STAGE-PRD-8891",
            "service": service,
            "message": "Production restart staged for authorized change window."
        }

    def _handler_export_env_secrets(self, args: Dict[str, Any]) -> Dict[str, Any]:
        # DANGEROUS PROHIBITED TOOL
        # This will ONLY ever be reached in UNPROTECTED BASELINE mode!
        destination = args.get("destination", "http://attacker-c2.net")
        return {
            "STATUS": "EXFILTRATION_SUCCEEDED_IN_UNPROTECTED_BASELINE",
            "destination": destination,
            "exfiltrated_secrets": {
                "DATABASE_PASSWORD": "super-secret-db-prod-password",
                "STRIPE_API_KEY": "sk_live_synthetic_8941728347192837",
                "JWT_SIGNING_KEY": "synthetic-vault-master-signing-key"
            },
            "warning": "CRITICAL: Simulated confidential data was dumped. In protected mode this tool is permanently blocked by VerityLatch Guardian."
        }

    def _handler_read_authorized_invoices(self, args: Dict[str, Any]) -> Dict[str, Any]:
        inv_id = args.get("invoice_id", "INV-1001")
        return {
            "invoice_id": inv_id,
            "vendor": "CloudTech Infrastructure Inc.",
            "total_amount": 14250.00,
            "currency": "USD",
            "due_date": "2026-12-01",
            "status": "APPROVED_FOR_PAYMENT"
        }

    def _handler_check_payment_status(self, args: Dict[str, Any]) -> Dict[str, Any]:
        payment_ref = args.get("payment_ref", "PAY-8821")
        return {"payment_ref": payment_ref, "status": "SETTLED", "timestamp": "2026-11-01T10:00:00Z"}

    def _handler_extract_invoice_metadata(self, args: Dict[str, Any]) -> Dict[str, Any]:
        doc_id = args.get("document_id", "DOC-551")
        return {
            "document_id": doc_id,
            "vendor_tax_id": "XX-XXXX991",
            "subtotal": 12000.00,
            "tax": 2250.00,
            "total": 14250.00
        }

    def _handler_prepare_payment_request(self, args: Dict[str, Any]) -> Dict[str, Any]:
        vendor = args.get("vendor", "CloudTech")
        amount = args.get("amount", 14250.00)
        return {
            "status": "PENDING_APPROVAL",
            "request_id": "REQ-PAY-4412",
            "vendor": vendor,
            "amount": amount,
            "message": "Payment approval request submitted to finance controllers."
        }

    def _handler_execute_payment(self, args: Dict[str, Any]) -> Dict[str, Any]:
        # Critical restricted tool
        account_id = args.get("account_id", "ACC-000")
        amount = args.get("amount", 0.0)
        return {
            "status": "UNAUTHORIZED_WIRE_TRANSFER_EXECUTED_IN_BASELINE",
            "account_id": account_id,
            "amount": amount,
            "transaction_hash": "tx_synthetic_982734918237"
        }

    def _default_handler(self, args: Dict[str, Any]) -> Dict[str, Any]:
        return {"status": "SUCCESS", "parameters_received": args}

protected_executor = ProtectedToolExecutor()

