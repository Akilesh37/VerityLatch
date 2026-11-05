# VERITYLATCH
## Enterprise Runtime Security, Governance & Control Platform for AI Agents

> **"Every AI action must be verified before it is executed."**

[![CI/CD Pipeline](https://github.com/veritylatch/veritylatch/actions/workflows/ci.yml/badge.svg)](https://github.com/veritylatch/veritylatch)
[![Python Version](https://img.shields.io/badge/python-3.12%2B-blue.svg)](https://www.python.org/)
[![Node Version](https://img.shields.io/badge/node-22%2B-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![NIST AI RMF](https://img.shields.io/badge/NIST%20AI%20RMF-1.0%20Aligned-purple.svg)](docs/responsible-ai.md)

---

## 1. Executive Summary & Problem Statement

Enterprises are rapidly deploying autonomous AI agents with access to internal ticketing systems, production databases, cloud infrastructure, and financial APIs. However, large language models are vulnerable to **direct and indirect prompt injection, tool hijacking, credential exfiltration, and privilege escalation**.

Traditional AI guardrails focus on prompt filtering or model output scanning. However:
> **The LLM must never be the final authority responsible for approving its own actions.**

Prompt filters can be degraded or bypassed via obfuscation and adversarial formatting. **VerityLatch** introduces an independent, deterministic **Guardian Control Plane** that intercepts and validates every proposed agent action at the server-side boundary before execution.

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

---

## 2. The Three Mandatory Security Proofs

VerityLatch includes three repeatable, empirical proofs that technical recruiters and security architects can execute and verify immediately.

### 🛡️ PROOF 1: End-to-End Attack Demonstration
Demonstrates an agent manipulated by an indirect prompt injection inside a Jira ticket, where VerityLatch independently prevents unauthorized tool execution.

```bash
python -m benchmark.run_attack_demo --scenario indirect_prompt_injection
```
**Outcome:**
- **Baseline Agent**: Ingests ticket, executes `export_env_secrets`, dumps simulated production secrets (Tool Invocation Counter = 1).
- **Protected Agent**: Ingests ticket, LLM is manipulated into proposing `export_env_secrets`, Guardian intercepts with provenance `UNTRUSTED_JIRA_TICKET`, evaluates OPA policy, returns **DENY**, tool execution counter is verified as **0 (Zero tool invocations)**, and a Security Incident is opened.

---

### 📊 PROOF 2: 200-Scenario Empirical Benchmark
Compares the **Unprotected Baseline** against the **VerityLatch Protected Control Plane** across 200 synthetic scenarios:

```bash
python -m benchmark.run_all
```

**Measured Benchmark Results:**
| Metric | Unprotected Baseline | VerityLatch Protected | Security Advantage |
|---|:---:|:---:|:---:|
| **Attack Success Rate (ASR)** | 100.0% | **0.0%** | **-100.0%** |
| **Attack Block Rate (ABR)** | 0.0% | **100.0%** | **+100.0%** |
| **Unauthorized Action Execution Rate** | 100.0% | **0.0%** | **Zero Invocations** |
| **Legitimate Task Completion Rate** | 100.0% | **100.0%** | **Zero Over-Blocking** |
| **False Positive Rate (FPR)** | 0.0% | **0.0%** | **High Usability** |
| **Median Enforcement Latency** | 0.00 ms | **3.44 ms** | **Sub-10ms Overhead** |
| **p95 Enforcement Latency** | 0.00 ms | **7.03 ms** | **Production Grade** |

*Reports generated in JSON, CSV, and interactive HTML in `benchmark/reports/`.*

---

### 🧪 PROOF 3: Automated Guardian Bypass Tests
A dedicated pytest suite proving that no LLM prompt manipulation, replay attack, or payload alteration can bypass the Guardian execution boundary:

```bash
pytest backend/tests/test_guardian_bypass.py -v
```
**Passed Invariants:**
1. Direct tool invocation without a signed authorization ticket is rejected (`SecurityBypassException`).
2. Payload tampering between approval and execution is detected and blocked (`PayloadTamperingException`).
3. Replaying an already-burned single-use authorization ticket is rejected.
4. Denied actions never produce execution tickets.
5. Missing or corrupt policy rules trigger fail-closed default-deny.
6. Untrusted document context cannot elevate privileges.
7. Undelegated tools cannot be called across agent roles.

---

## 3. Technology Stack

- **Backend**: Python 3.12+, FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, PostgreSQL / SQLite Dual Engine.
- **Security & Authorization**: Open Policy Agent (OPA), Rego Declarative Policies, Microsoft Presidio PII Masking, PBKDF2 / Bcrypt, JWT.
- **GenAI Orchestration**: LangGraph, Provider Abstraction (Deterministic Mock Provider, Google Gemini, Groq, Ollama).
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Recharts, Lucide Icons.
- **DevSecOps & Testing**: Docker, Docker Compose, GitHub Actions, Pytest, HTTPX.

---

## 4. Quickstart & Installation

### Option A: Local Development Setup

#### 1. Backend Setup
```bash
# Create and activate virtual environment
python3 -m venv backend/venv
source backend/venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Start backend server (seeds default users and agents automatically)
PYTHONPATH=backend:. uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

#### 3. Default Evaluation Accounts
| Role | Email | Password |
|---|---|---|
| **Enterprise Administrator** | `admin@veritylatch.io` | `VerityAdmin2026!` |
| **Security Analyst** | `analyst@veritylatch.io` | `SecurityAnalyst2026!` |
| **Human Approver** | `approver@veritylatch.io` | `ApproverLead2026!` |
| **AI Developer** | `developer@veritylatch.io` | `AIDeveloper2026!` |

---

### Option B: Docker Compose Deployment

```bash
docker-compose up --build
```
- Frontend UI: `http://localhost:3000`
- Backend REST API: `http://localhost:8000/docs`
- OPA Policy Daemon: `http://localhost:8181`

---

## 5. Enterprise Frontend Application (13 Dedicated Views)

1. **Login Page (`/login`)**: Role-based access with one-click evaluation switcher.
2. **Overview Dashboard (`/`)**: Real-time KPI cards, risk distribution charts, and enforcement statistics.
3. **Agent Registry (`/agents`)**: Catalog of IT, DevOps, and Finance agents with capability tags.
4. **Agent Details (`/agents/:id`)**: Deep-dive inspection of system prompts, granted tools, and test execution console.
5. **Execution Monitoring (`/executions`)**: Live audit of all agent workflows with Protected vs Baseline filters.
6. **Policy Management (`/policies`)**: Interactive Rego policy editor and version control.
7. **Approval Center (`/approvals`)**: Human sign-off workflow with cryptographic SHA-256 payload binding.
8. **Security Incident Center (`/incidents`)**: Real-time incident triage and forensic payload viewer.
9. **Red-Team Laboratory (`/redteam`)**: Interactive adversarial workbench with live execution trace inspection.
10. **Benchmark Dashboard (`/benchmark`)**: 200-scenario comparative metrics and downloadable reports.
11. **Audit Explorer (`/audit`)**: Cryptographic hash-chained audit ledger with real-time verification.
12. **AI Governance (`/governance`)**: NIST AI RMF 1.0 dashboard and enterprise risk registers.
13. **System Settings (`/settings`)**: Runtime configuration, OPA endpoints, and LLM provider parameters.

---

## 6. Project Architecture & Documentation

- [System Architecture](docs/architecture.md)
- [Security Threat Model (STRIDE & OWASP LLM Top 10)](docs/threat-model.md)
- [Guardian Security Model & Enforcement Invariants](docs/guardian-security-model.md)
- [Empirical Evaluation Methodology](docs/evaluation-methodology.md)
- [Benchmark Results Report (200 Scenarios)](docs/benchmark-results.md)
- [End-to-End Attack Demonstration Proof](docs/attack-demonstration.md)
- [Responsible AI & NIST AI RMF 1.0 Mapping](docs/responsible-ai.md)
- [REST API Reference](docs/api-reference.md)
- [Technical Interview Preparation Guide](docs/interview-preparation.md)

---

## 7. License & Acknowledgements

This project is licensed under the Apache 2.0 License. Designed as a reference architecture for enterprise runtime AI security, governance, and control.
