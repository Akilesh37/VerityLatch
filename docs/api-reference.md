# VerityLatch — REST API Reference Manual

**Base URL:** `http://localhost:8000/api/v1`  
**Authentication:** Bearer JWT Token (`Authorization: Bearer <token>`)

---

## 1. Authentication Endpoints

### `POST /auth/login`
Authenticates an enterprise user and returns a signed JWT access token.
- **Request Body**:
  ```json
  {
    "email": "admin@veritylatch.io",
    "password": "VerityAdmin2026!"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
    "token_type": "bearer",
    "expires_in": 86400,
    "user": {
      "id": "usr_991823",
      "email": "admin@veritylatch.io",
      "full_name": "Chief Information Security Officer",
      "roles": ["Enterprise Administrator"]
    }
  }
  ```

### `GET /auth/me`
Retrieves current authenticated user profile and roles.

---

## 2. Agent Management Endpoints

### `GET /agents`
Lists all registered enterprise AI agents with granted capability scopes.

### `GET /agents/{agent_id}`
Returns configuration, system prompt, and delegated tool permissions for a specific agent.

### `POST /agents`
Registers a new enterprise agent.
- **RBAC Required**: `Enterprise Administrator` or `AI Developer`.

---

## 3. Guardian Runtime Gateway Endpoints

### `POST /guardian/evaluate`
Directly submits an action proposal to the Guardian for deterministic evaluation.
- **Request Body**:
  ```json
  {
    "proposal": {
      "agent_id": "agent-devops-01",
      "tool_name": "restart_service",
      "action_name": "rolling_restart",
      "resource": "k8s:cluster-prod-01/payment-service",
      "environment": "production",
      "arguments": {"service": "payment-service"},
      "data_classification": "INTERNAL",
      "context_provenance": "USER_PROMPT"
    },
    "mode": "protected"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "decision": "REQUIRE_APPROVAL",
    "risk_score": 65.0,
    "risk_level": "high",
    "risk_factors": ["Base tool sensitivity 'high': +65 pts", "Production environment target: +25 pts"],
    "policy_matched": "policy-production-restart-approval",
    "reason": "Production infrastructure modification on 'restart_service' mandates human sign-off.",
    "payload_hash": "a1b2c3d4...",
    "authorization_ticket": null,
    "approval_request_id": "apprv_881293",
    "execution_permitted": false
  }
  ```

---

## 4. Human Approval Endpoints

### `GET /approvals`
Lists pending and historical approval requests.

### `POST /approvals/{approval_id}/approve`
Approves a pending high-risk action, revalidates payload hash, and generates single-use authorization ticket.
- **RBAC Required**: `Human Approver` or `Enterprise Administrator`.

### `POST /approvals/{approval_id}/reject`
Rejects the action with an immutable reason string.

---

## 5. Tamper-Evident Audit Endpoints

### `GET /audit/events`
Returns hash-chained audit ledger events (`limit`, `agent_id`, `event_type` filters).

### `POST /audit/verify`
Performs cryptographic SHA-256 chain recomputation across all ledger blocks.
- **Response (200 OK)**:
  ```json
  {
    "is_valid": true,
    "total_events": 208,
    "verified_events": 208,
    "broken_link_id": null,
    "message": "Audit ledger integrity verified successfully. All 208 events cryptographically linked."
  }
  ```

---

## 6. Red-Team & Benchmark Endpoints

### `GET /redteam/scenarios`
Returns pre-configured adversarial test scenarios.

### `POST /redteam/run`
Executes an attack scenario in either `protected` or `baseline` mode, returning the empirical execution trace.

### `GET /benchmark/results`
Returns latest 200-scenario benchmark statistics and comparative category metrics.

### `POST /benchmark/run`
Triggers the full 200-scenario benchmark run.
