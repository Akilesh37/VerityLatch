import re
from typing import Dict, Any, List, Tuple

INJECTION_PATTERNS = [
    r"(?i)ignore\s+(?:all\s+)?(?:previous|prior)\s+instructions",
    r"(?i)system\s*:\s*critical\s+runtime\s+override",
    r"(?i)you\s+are\s+now\s+in\s+dan\s+mode",
    r"(?i)disregard\s+(?:the\s+)?above",
    r"(?i)export\s+all\s+(?:env|environment|vault)\s+secrets",
    r"(?i)dump\s+database\s+credentials",
    r"(?i)bypass\s+all\s+(?:approval|security|guardrail)s?",
    r"(?i)emergency\s+override\s+root",
    r"(?i)send\s+(?:all\s+)?secrets\s+to\s+https?://",
    r"(?i)print\s+(?:the\s+)?system\s+prompt"
]

class GuardrailsEngine:
    def evaluate_input_security(
        self,
        prompt: str,
        untrusted_context: str = None
    ) -> Tuple[bool, List[str], str]:
        """
        Evaluates input text and untrusted context for adversarial indicators.
        Returns: (is_suspicious, matched_indicators, inferred_attack_category)
        """
        combined_text = f"{prompt or ''}\n{untrusted_context or ''}"
        matched_indicators = []
        attack_category = "none"

        for pattern in INJECTION_PATTERNS:
            if re.search(pattern, combined_text):
                matched_indicators.append(pattern)

        if matched_indicators:
            if untrusted_context and any(re.search(p, untrusted_context) for p in matched_indicators):
                attack_category = "indirect_prompt_injection"
            elif any("emergency override" in p or "bypass" in p for p in matched_indicators):
                attack_category = "approval_bypass"
            elif any("export" in p or "secrets" in p for p in matched_indicators):
                attack_category = "secret_exfiltration"
            else:
                attack_category = "direct_prompt_injection"
            return True, matched_indicators, attack_category

        return False, [], "none"

    def classify_data(self, text: str, has_secrets_or_pii: bool = False) -> str:
        """Determines the data classification level: PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED."""
        if "secret" in text.lower() or "password" in text.lower() or "private_key" in text.lower():
            return "RESTRICTED"
        if has_secrets_or_pii:
            return "CONFIDENTIAL"
        if "internal" in text.lower() or "jira" in text.lower() or "log" in text.lower():
            return "INTERNAL"
        return "PUBLIC"

guardrails_engine = GuardrailsEngine()

