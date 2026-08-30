from datetime import datetime, timedelta, timezone
from hashlib import pbkdf2_hmac
from hmac import compare_digest
from secrets import token_bytes
from uuid import UUID

import jwt

from app.config import settings


ALGORITHM = "HS256"
PASSWORD_ITERATIONS = 600_000


def hash_password(password: str) -> str:
    """Hash a password using PBKDF2-HMAC-SHA256."""
    salt = token_bytes(16)

    digest = pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PASSWORD_ITERATIONS,
    )

    return (
        f"pbkdf2_sha256${PASSWORD_ITERATIONS}$"
        f"{salt.hex()}${digest.hex()}"
    )


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against a stored PBKDF2 hash."""
    try:
        algorithm, iterations, salt_hex, digest_hex = password_hash.split("$")

        if algorithm != "pbkdf2_sha256":
            return False

        expected = bytes.fromhex(digest_hex)

        actual = pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            bytes.fromhex(salt_hex),
            int(iterations),
        )

        return compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


def create_access_token(
    *,
    user_id: UUID,
    role: str,
) -> str:
    """Create a signed JWT access token."""
    now = datetime.now(timezone.utc)
    expires = now + timedelta(
        minutes=settings.access_token_expire_minutes
    )

    payload = {
        "sub": str(user_id),
        "role": role,
        "iat": now,
        "exp": expires,
        "type": "access",
    }

    return jwt.encode(
        payload,
        settings.auth_secret,
        algorithm=ALGORITHM,
    )


def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT access token."""
    return jwt.decode(
        token,
        settings.auth_secret,
        algorithms=[ALGORITHM],
    )
