from typing import Dict, Any, List, Tuple
from app.core.config import settings

class RiskEngine:
    def calculate_risk(
        self,
        tool_name: str,
        tool_sensitivity: str,
        is_destructive: bool,
        environment: str,
        provenance: str,
        data_classification: str,
        has_adversarial_indicators: bool,
        has_pii: bool
    ) -> Tuple[float, str, List[str], str]:
        """
        Calculates a deterministic 0-100 risk score with explicit contributing factors.
        Returns: (risk_score, risk_level, contributing_factors, recommended_action)
        """
        score = 0.0
        factors = []

        # 1. Base Sensitivity
        sensitivity_map = {
            "low": 15.0,
            "medium": 35.0,
            "high": 65.0,
            "critical": 90.0
        }
        base_score = sensitivity_map.get(tool_sensitivity.lower(), 25.0)
        score += base_score
        factors.append(f"Base tool sensitivity '{tool_sensitivity}': +{base_score:.0f} pts")

        # 2. Destructive impact
        if is_destructive:
            score += 25.0
            factors.append("State-mutating / destructive operation: +25 pts")

        # 3. Environment risk
        env = environment.lower()
        if env == "production":
            score += 25.0
            factors.append("Production environment target: +25 pts")
        elif env == "staging":
            score += 10.0
            factors.append("Staging environment target: +10 pts")

        # 4. Context Provenance
        if "untrusted" in provenance.lower() or "external" in provenance.lower():
            score += 30.0
            factors.append(f"Untrusted context provenance ({provenance}): +30 pts")

        # 5. Adversarial / Injection indicators
        if has_adversarial_indicators:
            score += 35.0
            factors.append("Adversarial prompt injection pattern detected: +35 pts")

        # 6. Data Classification & PII
        if data_classification == "RESTRICTED":
            score += 30.0
            factors.append("Restricted data classification: +30 pts")
        elif data_classification == "CONFIDENTIAL" or has_pii:
            score += 15.0
            factors.append("Confidential data / PII detected: +15 pts")

        # Prohibited actions jump straight to 100
        if tool_name in ["export_env_secrets", "execute_payment"]:
            score = 100.0
            factors.append(f"Prohibited critical enterprise tool '{tool_name}': Set to 100 pts")

        # Clamp between 0 and 100
        final_score = min(max(score, 0.0), 100.0)

        # Map to Risk Level
        if final_score < settings.RISK_THRESHOLD_LOW:
            level = "low"
            recommendation = "Safe to execute automatically under policy constraints."
        elif final_score < settings.RISK_THRESHOLD_MEDIUM:
            level = "medium"
            recommendation = "Standard operation. Verify permission scope."
        elif final_score < settings.RISK_THRESHOLD_HIGH:
            level = "high"
            recommendation = "High risk operation. Mandate human-in-the-loop review."
        else:
            level = "critical"
            recommendation = "Critical risk. Prohibit autonomous execution; require multi-party sign-off or block."

        return final_score, level, factors, recommendation

risk_engine = RiskEngine()

