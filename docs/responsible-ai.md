# VerityLatch — Responsible AI & Governance Framework

## 1. NIST AI Risk Management Framework (AI RMF 1.0) Mapping

VerityLatch implements the four core functions of the NIST AI RMF 1.0:

```
                  +--------------------------------------------------+
                  |                     GOVERN                       |
                  | Agent Inventory, Ownership, RBAC, Risk Registers |
                  +--------------------------------------------------+
                                           |
                                           v
                  +--------------------------------------------------+
                  |                      MAP                         |
                  | Context Ingestion, Provenance, Impact Categories |
                  +--------------------------------------------------+
                                           |
                                           v
                  +--------------------------------------------------+
                  |                    MEASURE                       |
                  | Red-Team Benchmarks, Latency, Empiric Metrics    |
                  +--------------------------------------------------+
                                           |
                                           v
                  +--------------------------------------------------+
                  |                    MANAGE                        |
                  | Guardian Authorization, Human Sign-Off, Audits   |
                  +--------------------------------------------------+
```

### Pillar 1: GOVERN (Policies, Accountability & Structure)
- **Agent Registry**: Mandatory registration of all AI agents (`agent-it-01`, `agent-devops-01`, `agent-finance-01`), associating each with a clear enterprise owner and risk profile.
- **Role-Based Access Control**: Strict multi-role model segregating Administrator, Security Analyst, Human Approver, and AI Developer permissions.
- **Declarative Policies**: Versioned Open Policy Agent (OPA) policies written in Rego that govern permissible tool invocations and environment mutations.

### Pillar 2: MAP (Context & Impact Identification)
- **Context Provenance Tracking**: Ingested data is explicitly tagged by origin (`USER_PROMPT`, `UNTRUSTED_JIRA_TICKET`, `EXTERNAL_WEB`, `INTERNAL_DOC`).
- **Data Classification**: Automated classification of arguments and outputs into PUBLIC, INTERNAL, CONFIDENTIAL, and RESTRICTED tiers.
- **Risk Taxonomy**: Multi-factor scoring taking into account blast radius, reversibility, and target environment (`production` vs `development`).

### Pillar 3: MEASURE (Rigorous Empirical Testing)
- **200-Scenario Synthetic Benchmark**: Continuous adversarial testing spanning direct and indirect prompt injection, sensitive data exfiltration, and privilege escalation.
- **Dual-Mode Comparative Evaluation**: Measuring baseline vulnerability versus protected containment across 12 standardized metrics.
- **Latency Instrumentation**: Benchmarking median and p95 overhead to guarantee sub-10ms performance.

### Pillar 4: MANAGE (Operational Risk Treatment)
- **Guardian Control Plane**: Intercepting every tool call proposal before execution; default-deny fail-closed behavior.
- **Human-in-the-Loop Oversight**: Cryptographic payload-bound approvals for high-impact production mutations.
- **Tamper-Evident Ledger**: SHA-256 hash chaining of every decision, incident, and execution.

---

## 2. Privacy & Data Protection

VerityLatch integrates Microsoft Presidio with regex pattern matching:
1. **PII Masking**: Emails, phone numbers, credit card numbers, and social security numbers are sanitized with `<ENTITY_REDACTED>` tags.
2. **Secret Scrubbing**: API keys, Bearer tokens, private keys, and database passwords are redacted from frontend views and audit traces.
3. **Data Minimization**: Tool executors receive only the minimum sanitized parameters necessary to fulfill operations.

---

## 3. Human-in-the-Loop Oversight Invariants

Human approval in VerityLatch is governed by three strict invariants:
1. **Cryptographic Payload Binding**: Approvals are bound to `SHA-256(payload)`. If parameters are modified between review and execution, the ticket is instantly invalidated.
2. **Single-Use Authorization**: Approved tickets are burned in the execution registry upon first use, preventing replay attacks.
3. **Time-Limited Expiry**: Requests automatically expire after 24 hours (or configurable duration), preventing stale authorizations from executing.

---

## 4. Formal Limitations & Non-Claims

In compliance with honest engineering communication:
- VerityLatch **does not** claim that all prompt injection attacks can be detected via heuristic or LLM pattern matching.
- Instead, the fundamental guarantee is that **unauthorized actions cannot execute regardless of whether the LLM was manipulated**.
- VerityLatch **does not** claim compliance certification simply because it maps to the NIST AI RMF.

