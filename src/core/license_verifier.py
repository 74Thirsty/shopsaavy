"""Utilities for verifying signed license tokens."""

from __future__ import annotations

import base64
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Union

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey


TokenSource = Union[str, Path]


class LicenseVerificationError(Exception):
    """Raised when a license token cannot be verified."""


@dataclass(frozen=True)
class LicensePayload:
    """Decoded contents of a license token."""

    identifier: str
    product: str
    version: str
    expiry: int

    @property
    def is_expired(self) -> bool:
        """Return whether the payload has expired."""
        return self.expiry < int(time.time())

    def to_details(self) -> dict[str, str]:
        """Return a mapping of payload details for reporting."""
        return {
            "identifier": self.identifier,
            "product": self.product,
            "version": self.version,
        }


def normalize_token(raw_token: str) -> str:
    """Return the canonical representation for the provided token.

    Tokens may be supplied either as the raw ``BASE64URL.BASE64URL`` string or
    encoded using the grouped Base32 format described in the operations guide.
    This helper detects the Base32 variant, strips formatting, and returns the
    decoded raw token string.
    """

    token = raw_token.strip()
    if not token:
        return token

    # Remove separators commonly used in the human friendly representation.
    collapsed = token.replace("-", "").replace(" ", "")
    try:
        # Base32 decoding requires correct padding; add it if necessary.
        padding = (8 - len(collapsed) % 8) % 8
        decoded = base64.b32decode(collapsed + ("=" * padding), casefold=True)
        decoded_text = decoded.decode("utf-8")
        if "." in decoded_text:
            return decoded_text
    except Exception:  # pragma: no cover - invalid input falls back to raw token
        pass
    return token


def _b64u_decode(value: str) -> bytes:
    padding = "=" * ((4 - len(value) % 4) % 4)
    return base64.urlsafe_b64decode(value + padding)


def _load_public_key(source: TokenSource) -> Ed25519PublicKey:
    if isinstance(source, (str, Path)):
        data = Path(source).read_bytes()
    else:  # pragma: no cover - defensive branch, type guards ensure coverage
        data = source
    key = serialization.load_pem_public_key(data)
    if not isinstance(key, Ed25519PublicKey):
        raise LicenseVerificationError("License public key must be Ed25519.")
    return key


def decode_token(token: str) -> tuple[LicensePayload, bytes, bytes]:
    """Decode a normalized token into its payload components."""

    parts = token.split(".")
    if len(parts) != 2:
        raise LicenseVerificationError("Malformed license token.")
    payload_b64, signature_b64 = parts
    payload_bytes = _b64u_decode(payload_b64)
    signature_bytes = _b64u_decode(signature_b64)

    try:
        identifier, product, version, expiry_raw = payload_bytes.decode("utf-8").split("|")
    except ValueError as exc:
        raise LicenseVerificationError("Invalid license payload structure.") from exc

    try:
        expiry = int(expiry_raw)
    except ValueError as exc:
        raise LicenseVerificationError("Invalid license expiry timestamp.") from exc

    return LicensePayload(
        identifier=identifier,
        product=product,
        version=version,
        expiry=expiry,
    ), signature_bytes, payload_bytes


def verify_token(
    public_key_path: TokenSource,
    token: str,
    *,
    expected_product: Optional[str] = None,
    expected_version: Optional[str] = None,
) -> LicensePayload:
    """Verify ``token`` using the public key and return its payload.

    Raises :class:`LicenseVerificationError` if the signature is invalid or if
    the payload does not match the expected product/version constraints.
    """

    normalized = normalize_token(token)
    payload, signature, payload_bytes = decode_token(normalized)

    key = _load_public_key(public_key_path)
    try:
        key.verify(signature, payload_bytes)
    except InvalidSignature as exc:
        raise LicenseVerificationError("Invalid license signature.") from exc

    if expected_product and payload.product != expected_product:
        raise LicenseVerificationError("License product mismatch.")
    if expected_version and payload.version != expected_version:
        raise LicenseVerificationError("License version mismatch.")

    return payload


__all__ = [
    "LicensePayload",
    "LicenseVerificationError",
    "normalize_token",
    "verify_token",
]
