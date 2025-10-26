"""Offline product key verification logic mirroring the developer keygen script."""

from __future__ import annotations

import base64
import hashlib
import hmac
import os
from typing import Final


# The developer-provided password is embedded as a base64 string so it isn't
# stored in plain text while still remaining a static constant inside the
# runtime build.
_PASSWORD_B64: Final[str] = "U0hPUFNTQUFWWS1QUk9EVUNUSU9OLVNFR1JFVA=="
_PASSWORD: Final[str] = base64.b64decode(_PASSWORD_B64).decode("utf-8")

# Salt value aligned with the manual key generator script.
_SALT: Final[str] = "v1"

# Identifier may be machine or deployment specific. Allow an environment
# override for flexibility while defaulting to a shared "GLOBAL" identifier.
_IDENTIFIER_ENVS: Final[tuple[str, ...]] = (
    "SHOPSAAVY_LICENSE_IDENTIFIER",
    "LICENSE_IDENTIFIER",
)
_DEFAULT_IDENTIFIER: Final[str] = "GLOBAL"

# Length of the generated Base32 key before inserting group separators.
_KEY_LENGTH: Final[int] = 25


def _current_identifier() -> str:
    for env_name in _IDENTIFIER_ENVS:
        raw = os.getenv(env_name)
        if raw is not None:
            value = raw.strip()
            if value:
                return value
    return _DEFAULT_IDENTIFIER


def _derive_key_material(password: str, identifier: str, salt: str, out_length: int) -> str:
    if out_length <= 0:
        raise ValueError("out_length must be greater than zero")

    key = password.encode("utf-8")
    message = identifier.encode("utf-8")
    if salt:
        message += b":" + salt.encode("utf-8")

    digest = hmac.new(key, message, hashlib.sha256).digest()
    needed_bytes = (out_length * 5 + 7) // 8
    if needed_bytes > len(digest):
        derived = hashlib.pbkdf2_hmac(
            "sha256",
            identifier.encode("utf-8"),
            (password + salt).encode("utf-8"),
            100_000,
            dklen=needed_bytes,
        )
    else:
        derived = digest[:needed_bytes]

    encoded = base64.b32encode(derived).decode("utf-8").rstrip("=")
    return encoded[:out_length]


def _normalize_candidate(candidate_key: str) -> str:
    return "".join(ch for ch in candidate_key.upper() if ch.isalnum())


def verify_product_key(candidate_key: str) -> bool:
    """Return ``True`` when ``candidate_key`` matches the expected product key."""

    if not candidate_key:
        return False

    normalized_candidate = _normalize_candidate(candidate_key)
    expected_key = _derive_key_material(
        _PASSWORD,
        _current_identifier(),
        _SALT,
        _KEY_LENGTH,
    )
    return hmac.compare_digest(normalized_candidate, expected_key)


__all__ = ["verify_product_key"]
