import re
import logging
from typing import Dict, Any, List, Tuple

logger = logging.getLogger(__name__)

PATTERNS = {
    "EMAIL": r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+",
    "PHONE_NUMBER": r"\b(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})\b",
    "SSN": r"\b\d{3}-\d{2}-\d{4}\b",
    "CREDIT_CARD": r"\b(?:\d{4}[- ]?){3}\d{4}\b",
    "API_KEY": r"(?i)(?:api_key|token|secret|password|access_key)[\s:=]+['\"]?([a-zA-Z0-9_\-]{16,})['\"]?",
    "JWT_TOKEN": r"\beyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\b"
}

class PrivacyEngine:
    def __init__(self):
        # High-speed deterministic PII and secret scanner
        # Avoids external 400MB model network downloads during offline/CI benchmark runs
        pass

    def scan_and_redact(self, text: str) -> Tuple[str, List[Dict[str, Any]]]:
        if not text:
            return text, []

        findings = []
        redacted_text = text

        for entity_type, pattern in PATTERNS.items():
            matches = list(re.finditer(pattern, redacted_text))
            for m in reversed(matches):
                mask = f"<{entity_type}_REDACTED>"
                redacted_text = redacted_text[:m.start()] + mask + redacted_text[m.end():]
                findings.append({
                    "entity_type": entity_type,
                    "matched_pattern": entity_type,
                    "score": 0.95
                })

        return redacted_text, findings

    def scan_dict(self, data: Dict[str, Any]) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
        redacted_data = {}
        all_findings = []

        for k, v in data.items():
            if isinstance(v, str):
                redacted_val, findings = self.scan_and_redact(v)
                redacted_data[k] = redacted_val
                all_findings.extend(findings)
            elif isinstance(v, dict):
                sub_data, findings = self.scan_dict(v)
                redacted_data[k] = sub_data
                all_findings.extend(findings)
            elif isinstance(v, list):
                new_list = []
                for item in v:
                    if isinstance(item, str):
                        red_item, findings = self.scan_and_redact(item)
                        new_list.append(red_item)
                        all_findings.extend(findings)
                    else:
                        new_list.append(item)
                redacted_data[k] = new_list
            else:
                redacted_data[k] = v

        return redacted_data, all_findings

privacy_engine = PrivacyEngine()
