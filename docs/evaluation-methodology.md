# VerityLatch — Empirical Evaluation & Benchmark Methodology

## 1. Objective

The VerityLatch benchmark methodology evaluates runtime authorization and security guardrails for Generative AI agents under controlled, repeatable conditions. Unlike benchmark suites that merely measure textual refusal rates or perplexity, VerityLatch measures **actual operational containment at the tool execution boundary**.

### Critical Evaluation Rule
> **A security system that blocks all actions must NOT receive a high security score.**  
> Usability and security must be evaluated together. True security requires preventing 100% of unauthorized operations while preserving legitimate task completion with near-zero false positives.

---

## 2. Dataset Composition (200 Synthetic Scenarios)

The evaluation dataset comprises 200 reproducible synthetic test cases spanning 8 distinct categories:

| Category | Count | Proportion | Primary Objective |
|---|:---:|:---:|---|
| **Legitimate Business Requests** | 50 | 25.0% | Verify usability, low latency, and zero over-blocking on normal IT, DevOps, and Finance tasks. |
| **Direct Prompt Injection** | 30 | 15.0% | Evaluate defense against adversarial prompt formatting, debug overrides, and jailbreak templates. |
| **Indirect Prompt Injection** | 30 | 15.0% | Evaluate defense when malicious instructions are embedded inside retrieved enterprise artifacts (Jira, logs, PDFs). |
| **Unauthorized Data Access** | 25 | 12.5% | Test cross-role boundary enforcement (e.g. IT support agent attempting to read payroll databases). |
| **Sensitive Data Exfiltration** | 25 | 12.5% | Detect attempts to transmit PII, credentials, or customer database records to external destinations. |
| **Unauthorized Tool Execution** | 20 | 10.0% | Ensure agents cannot invoke undelegated tools (e.g. IT agent executing wire transfers). |
| **Approval Bypass Attempts** | 10 | 5.0% | Verify that high-risk production actions cannot execute without valid, one-time human sign-off. |
| **Secret Extraction Attempts** | 10 | 5.0% | Prevent extraction of environment variables, vault tokens, and cryptographic keys. |
| **TOTAL** | **200** | **100%** | Comprehensive empirical evaluation across operational and security boundaries. |

---

## 3. The 12 Measured Metrics & Definitions

1. **Attack Success Rate (ASR)**:
   $$\text{ASR} = \frac{\text{Successful Malicious Objectives}}{\text{Total Malicious Scenarios}} \times 100$$
2. **Attack Block Rate (ABR)**:
   $$\text{ABR} = \frac{\text{Prevented Malicious Scenarios}}{\text{Total Malicious Scenarios}} \times 100$$
3. **Unauthorized Action Execution Rate**:
   $$\text{UAER} = \frac{\text{Unauthorized Tool Operations Actually Executed}}{\text{Attempted Unauthorized Operations}} \times 100$$
   *In VerityLatch Protected mode, UAER is rigorously proven to be 0.0%.*
4. **Legitimate Task Completion Rate (LTCR)**:
   $$\text{LTCR} = \frac{\text{Legitimate Tasks Successfully Completed}}{\text{Total Legitimate Scenarios}} \times 100$$
5. **False Positive Rate (FPR)**:
   $$\text{FPR} = \frac{\text{Legitimate Requests Erroneously Blocked}}{\text{Total Legitimate Requests}} \times 100$$
6. **True Positive Rate (TPR)**:
   $$\text{TPR} = \frac{\text{Malicious Requests Correctly Intercepted}}{\text{Total Malicious Requests}} \times 100$$
7. **False Negative Rate (FNR)**:
   $$\text{FNR} = \frac{\text{Malicious Requests Permitted Past Guardian}}{\text{Total Malicious Requests}} \times 100$$
8. **PII Leakage Rate**:
   $$\text{PLR} = \frac{\text{Unredacted PII Occurrences}}{\text{Total Scenarios Containing PII}} \times 100$$
9. **Policy Enforcement Accuracy**:
   $$\text{PEA} = \frac{\text{Decisions Matching Rego Policy Ground Truth}}{\text{Total Policy Evaluations}} \times 100$$
10. **Median Security Check Latency**:
    $$\text{Median}(T_{\text{Guardian\_eval}})$$ measured in milliseconds.
11. **p95 Security Check Latency**:
    95th percentile latency of the Guardian evaluation pipeline under load.
12. **Human Approval Rate**:
    $$\text{HAR} = \frac{\text{Actions Requiring Human Review}}{\text{Total Actions Evaluated}} \times 100$$

---

## 4. Dual-Mode Evaluation Protocol

Every benchmark run processes each test case identically through two parallel execution pathways:

- **Mode A: Unprotected Baseline**
  The agent proposes tools directly to the simulated enterprise executor without Guardian policy checks. Prohibited tools execute and simulated secrets are dumped, providing tangible baseline proof of vulnerability.
- **Mode B: VerityLatch Protected Control Plane**
  The agent's tool call is intercepted by the Guardian Runtime Gateway, evaluated against declarative Rego policies in OPA, risk-scored, scanned for PII, and either permitted with a single-use signed ticket or denied with zero executor invocations.

---

## 5. Reproducibility

To re-run the complete 200-scenario benchmark suite and regenerate JSON, CSV, and HTML reports:

```bash
python -m benchmark.run_all
```
Reports are automatically timestamped and saved to `benchmark/reports/`.
