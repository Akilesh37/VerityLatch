# VerityLatch — Comprehensive Technical Interview Guide

This guide prepares software engineers, security architects, and GenAI specialists to defend the architectural, engineering, and security design choices of **VerityLatch** during rigorous technical interviews.

---

## Part 1: Software Engineering & System Design

### 1.1 Object-Oriented & Modular System Architecture
- **What it is**: Separation of concerns across independent modules (Agents, Guardian Gateway, Policy Evaluator, Protected Executor, Audit Ledger).
- **Why it is important**: Autonomous agent systems are prone to spaghetti coupling between prompt outputs and backend APIs. Clear abstraction boundaries prevent bypasses.
- **How VerityLatch implements it**: The agent orchestration layer (`app.agents`) produces action proposals; the Guardian Gateway (`app.guardian.gateway`) evaluates proposals against declarative policies; the execution layer (`app.agents.executor`) enforces single-use authorization ticket validation before executing simulated enterprise handlers.
- **Testing**: Automated unit tests (`backend/tests/test_guardian_bypass.py`) verify that modules fail closed when called out-of-order or with invalid signatures.
- **Possible Interview Question**: *"How do you prevent an agent from invoking a database handler directly without going through your security gate?"*  
  **Answer**: Handlers in `ProtectedToolExecutor` are isolated from public agent exposure. They strictly require a valid `authorization_ticket` issued by the Guardian whose payload hash matches the exact arguments passed.

### 1.2 Relational Database Normalization & Foreign Key Integrity
- **What it is**: 3rd Normal Form schema separating Users, Roles, Agents, Tools, Permissions, Executions, ActionRequests, Approvals, and AuditEvents.
- **Why it is important**: Prevents inconsistent states, orphan approval tickets, and authorization drift.
- **Testing**: SQLite foreign key pragma (`PRAGMA foreign_keys=ON`) and PostgreSQL constraints prevent inserting orphaned approval requests or unlinked executions.
- **Possible Interview Question**: *"How do you bind an approval decision to the exact action being requested?"*  
  **Answer**: We compute a SHA-256 hash of the canonical JSON parameters of the proposed tool invocation. The `ApprovalRequest` record stores this `payload_hash`. Upon execution, the executor re-computes the hash of the payload and confirms an exact match.

---

## Part 2: Generative AI & Agentic Workflows

### 2.1 LangGraph Orchestration & Tool Calling
- **What it is**: Cyclic state graph for agent workflows (Task Ingestion -> Tool Proposal -> Guardian Interception -> Execution -> Synthesis).
- **Why it is important**: AI agents need multi-turn reasoning and tool invocation without allowing the LLM autonomous write access to sensitive infrastructure.
- **How VerityLatch implements it**: The LangGraph pipeline emits structured proposals containing `agent_id`, `tool_name`, `arguments`, and `context_provenance`.
- **Possible Interview Question**: *"Why can't you just use prompt engineering (system prompts) to prevent agents from doing bad things?"*  
  **Answer**: Prompt-level safety treats instructions and untrusted data as tokens within the same context window. An attacker can use indirect prompt injection in retrieved documents to override system prompts. In contrast, VerityLatch treats the LLM purely as an unprivileged suggestion engine and enforces authorization server-side in deterministic code.

### 2.2 Provider Abstraction & Deterministic Mocking
- **What it is**: Decoupling the agent logic from specific LLM providers (Gemini, Groq, Ollama, Mock).
- **Why it is important**: Enables repeatable, zero-cost, high-speed automated testing in CI/CD without API rate limits or stochastic variations.
- **How VerityLatch implements it**: `MockLLMProvider` generates deterministic tool proposals for both legitimate and adversarial scenarios, while live providers can be swapped via configuration.

---

## Part 3: AI Security & Runtime Authorization

### 3.1 Indirect Prompt Injection Containment
- **What it is**: Malicious instructions embedded in third-party data (e.g. Jira tickets, emails, logs) that manipulate the agent's behavior.
- **How VerityLatch implements it**: Ingested artifacts are tagged with `context_provenance: UNTRUSTED_JIRA_TICKET`. Rego policies enforce that untrusted context cannot invoke high-sensitivity tools like `export_env_secrets` or `execute_payment`.
- **Testing**: Demonstrated live in `benchmark.run_attack_demo`, where an injection in a simulated Jira ticket causes the model to attempt secret export, but the Guardian blocks execution with zero tool calls.

### 3.2 Replay Protection & One-Time Authorization Tickets
- **What it is**: Ensuring an authorization ticket granted for an action cannot be captured and replayed by an attacker.
- **How VerityLatch implements it**: Each authorization ticket is issued with a unique UUID (`authz_ticket_<uuid>`) and burned into an in-memory cache upon first use. Replay attempts trigger an immediate `SecurityBypassException`.

---

## Part 4: Responsible AI & Governance

### 4.1 Tamper-Evident Hash-Chained Audit Ledger
- **What it is**: Cryptographic SHA-256 chaining where each audit event contains `current_hash = SHA256(event_id | previous_hash | timestamp | summary)`.
- **How it is tested**: `POST /api/v1/audit/verify` iterates through all historical blocks, re-computes hashes, and validates link continuity.
- **Limitations**: Hash chaining inside the application database detects unauthorized updates and deleted records, but cannot prevent a root database administrator from rewriting the entire history. External anchoring (e.g. AWS S3 Object Lock or blockchain) is recommended for absolute non-repudiation.

### 4.2 NIST AI RMF 1.0 Mapping
- **Govern**: Agent Inventory, RBAC, Declarative Rego Policies.
- **Map**: Context Provenance, Data Classification (PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED).
- **Measure**: 200-scenario benchmark measuring Attack Block Rate, False Positive Rate, and Latency.
- **Manage**: Guardian Runtime Gateway and Human-in-the-Loop approval center.
