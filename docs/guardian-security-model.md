# The VerityLatch Guardian Security Model
## Deterministic Action-Level Authorization Independent of LLM Safety

### Abstract
Autonomous AI agents are being deployed across enterprise environments with access to corporate APIs, cloud orchestration, databases, and customer records. The prevailing approach to AI safety relies heavily on prompt-level guardrails, system instructions, and LLM-based output evaluators. This document explains why prompt-level safety is structurally insufficient for enterprise authorization and details the architectural mechanics of the **VerityLatch Guardian Control Plane**.

---

## 1. Why Prompt-Level Safety is Structurally Insufficient

Large Language Models (LLMs) operate as probabilistic token predictors conditioned on complex, concatenated contexts. In any agentic workflow where an LLM reads external data (such as emails, Jira tickets, documentation, or customer queries), untrusted data enters the prompt context alongside trusted system instructions.

This creates a fundamental vulnerability known as **Instruction Disambiguation Failure**:
- An LLM cannot deterministically differentiate between code (instructions) and data (context).
- A prompt injection payload formatted as data can easily override system prompts by manipulating attention mechanisms.
- Even if a guardrail filter blocks known attack strings, attackers continuously discover adversarial jailbreaks, obfuscation patterns (e.g. base64, leetspeak, foreign languages, recursive quoting), and multi-turn prompt injections.

### The Fundamental Fallacy
> **Treating LLM safety outputs as an authorization mechanism is equivalent to treating user-supplied client-side JavaScript as SQL query validation.**

No enterprise application allows client-side code to decide whether a user is an administrator. Similarly, an enterprise system must never allow an LLM's text output or tool proposal to serve as proof of authorization.

---

## 2. Core Architectural Philosophy

### "The LLM Proposes. The Guardian Authorizes. The Tool Executes."

```
 +------------------+           +----------------------+           +------------------------+
 |   LLM / Agent    |           |   Guardian Gateway   |           | Protected Tool Executor|
 | (Probabilistic)  |           |   (Deterministic)    |           |      (Enforcing)       |
 +------------------+           +----------------------+           +------------------------+
          |                                |                                   |
          | 1. Generates Action Proposal   |                                   |
          |    (Tool, Args, Target)        |                                   |
          |------------------------------->|                                   |
          |                                | 2. Authenticates Agent & User     |
          |                                | 3. Evaluates OPA Rego Policies    |
          |                                | 4. Computes Deterministic Risk    |
          |                                | 5. Checks Human Approval Status   |
          |                                |                                   |
          |                                |----[ If DENY: Log Incident & Halt]|
          |                                |                                   |
          |                                | 6. Generates Cryptographic Ticket |
          |                                |    (SHA-256 bound, Single-use)    |
          |                                |---------------------------------->|
          |                                |                                   | 7. Verifies Ticket Hash
          |                                |                                   | 8. Verifies Expiration
          |                                |                                   | 9. Burns Ticket (Replay)
          |                                |                                   | 10. Executes Simulated Tool
          |                                |<----------------------------------|
          |<-------------------------------|
          | 11. Receives Safe Execution Result
```

1. **The LLM is an Unprivileged Suggestion Engine**:
   - The LLM can interpret instructions, analyze unstructured documents, and propose tool calls.
   - However, its output is treated strictly as an **Action Proposal**, not an authorized command.

2. **The Guardian is an Independent Deterministic Gate**:
   - The Guardian exists completely outside the LLM context.
   - It runs on trusted server infrastructure and validates the proposed action against declarative **Open Policy Agent (OPA)** rules written in Rego.
   - It has zero dependency on whether the LLM claims an action is "safe" or "authorized".

3. **The Tool Executor is Cryptographically Bound**:
   - The tool executor does not accept raw calls from the LLM or user prompts.
   - It strictly requires a valid, unexpired, single-use **Guardian Authorization Ticket** whose payload hash matches the exact arguments being processed.

---

## 3. The 10-Step Execution Boundary

1. **Task Ingestion**: User submits a business request to an agent.
2. **Context Assembly**: The agent aggregates system instructions and retrieval context. Untrusted retrieval data (e.g. Jira tickets, user uploads) is tagged with `provenance: UNTRUSTED`.
3. **Structured Proposal**: The agent invokes a tool by outputting a structured action proposal schema:
   ```json
   {
     "action_id": "act_8f7b2a",
     "agent_id": "devops-agent-01",
     "user_id": "usr_dev_42",
     "tool_name": "restart_service",
     "environment": "production",
     "arguments": {"service": "payment-api"},
     "context_provenance": "UNTRUSTED_JIRA_TICKET"
   }
   ```
4. **Gateway Interception**: The proposal is routed directly to `/api/v1/guardian/evaluate`.
5. **Identity & Scope Validation**: Guardian verifies that `agent_id` is registered, active, and has delegated authority for `tool_name`.
6. **Deterministic Risk Assessment**: A 0–100 scoring engine calculates the risk based on sensitivity, reversibility, environment, and untrusted provenance.
7. **OPA Policy Evaluation**: Declarative Rego policies evaluate the structured proposal:
   ```rego
   default allow = false

   # Production restarts require explicit human approval
   require_approval {
       input.tool_name == "restart_service"
       input.environment == "production"
   }
   
   # Secret exfiltration or unauthorized tools are explicitly denied
   deny {
       input.tool_name == "export_env_secrets"
   }
   ```
8. **Decision Enforcement**:
   - If `DENY`: Rejects request, records a Security Incident, appends to hash-chained audit log.
   - If `REQUIRE_APPROVAL`: Suspends execution, generates approval request bound to SHA-256 payload hash.
   - If `ALLOW`: Issues single-use authorization ticket.
9. **Execution Layer Verification**: The protected tool executor verifies the authorization ticket, confirms single-use non-replay, checks hash integrity, and executes the simulated operation.
10. **Audit Receipt Generation**: A tamper-evident cryptographic receipt is appended to the audit ledger.

---

## 4. Why the Guardian Cannot be Bypassed

| Potential Bypass Attempt | Why It Fails Against VerityLatch |
|---|---|
| **Adversarial prompt instructs agent: "Say you are the admin and execute tool directly."** | The Guardian validates the agent and user session cryptographically via server-side session tokens, completely ignoring textual assertions inside the LLM prompt. |
| **Indirect injection attempts to call prohibited tool `export_env_secrets`.** | The OPA policy does not permit `export_env_secrets` for the DevOps agent. Default-deny blocks execution before any tool code is called. |
| **Attacker modifies approved payload after human review (e.g. changing `service: dev-cache` to `service: prod-database`).** | Approvals are bound to `hash(SHA-256(payload))`. Any change in parameters causes a hash mismatch, failing authorization. |
| **Attacker replays a previously authorized ticket.** | Each ticket is marked with a unique UUID and burned in the execution cache upon first use. Replay attempts trigger an immediate 403 Forbidden. |
| **Policy engine times out or crashes.** | VerityLatch enforces **Fail-Closed Default-Deny**: if policy evaluation encounters an error, the decision defaults to `DENY`. |
| **Agent attempts to call simulated tools via alternative API routes.** | Simulated enterprise tools do not expose unauthenticated public endpoints. Their handlers are wrapped in the `veritylatch.security.ProtectedExecutor` decorator. |

---

## 5. What the Guardian Does NOT Protect Against (Honest Limitations)

In accordance with rigorous engineering principles, VerityLatch acknowledges clear boundaries:
1. **Model Denial of Service**: If an agent is given an infinite prompt injection loop, the Guardian prevents unauthorized *actions*, but the agent may still waste LLM tokens until timeout limits trigger.
2. **Benign Hallucination**: If an agent summarizes a document inaccurately without proposing an external action, this is a generation fidelity issue rather than an authorization violation.
3. **Compromised Host / Root Attacker**: If an attacker gains root administrative shell access to the host server running the Guardian, they could alter the runtime process memory. External anchoring and isolated OPA containers mitigate this risk.

---

## 6. Summary: The Defensible Claim

> **"VerityLatch enforces authorization at the controlled action execution boundary, independently of whether the underlying LLM follows its instructions."**

