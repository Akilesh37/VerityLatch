import hashlib
import hmac
from datetime import datetime, timedelta, timezone
from typing import Any, Union, Optional
from jose import jwt, JWTError
import bcrypt
from app.core.config import settings

def create_access_token(subject: Union[str, Any], roles: list[str], expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "roles": roles,
        "iss": "veritylatch-auth",
        "iat": datetime.now(timezone.utc)
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        password_bytes = plain_password.encode('utf-8')[:72]
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    password_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')

def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None

def compute_payload_hash(payload: Any) -> str:
    """Computes a deterministic SHA-256 hash of a payload dictionary or string."""
    import json
    if isinstance(payload, (dict, list)):
        payload_str = json.dumps(payload, sort_keys=True, separators=(',', ':'))
    else:
        payload_str = str(payload)
    return hashlib.sha256(payload_str.encode("utf-8")).hexdigest()

def compute_audit_hash(event_id: str, prev_hash: str, timestamp: str, payload_summary: str) -> str:
    """Computes SHA-256 hash-link for tamper-evident audit ledger."""
    raw = f"{event_id}|{prev_hash}|{timestamp}|{payload_summary}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()
