"""Utilities for generating and verifying offline license keys."""

from __future__ import annotations

import base64
import binascii
import hashlib
import hmac
import json
import secrets
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, Optional


OFFLINE_LICENSE_PREFIX = "SAOFF1-"


class OfflineLicenseError(Exception):
    """Raised when an offline license cannot be generated or verified."""


@dataclass(frozen=True)
class OfflineLicensePayload:
    """Structured payload embedded inside offline licenses."""

    customer: str
    expires_at: datetime
    license_id: str = field(default_factory=lambda: secrets.token_hex(8))
    issued_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    plan: Optional[str] = None
    seats: Optional[int] = None
    notes: Optional[str] = None
    features: Iterable[str] | None = None
    metadata: Dict[str, Any] | None = None

    def to_dict(self) -> Dict[str, Any]:
        data: Dict[str, Any] = {
            "version": 1,
            "customer": self.customer,
            "license_id": self.license_id,
            "issued_at": _to_isoformat(self.issued_at),
            "expires_at": _to_isoformat(self.expires_at),
        }
        if self.plan:
            data["plan"] = self.plan
        if self.seats is not None:
            data["seats"] = int(self.seats)
        if self.notes:
            data["notes"] = self.notes
        if self.features:
            data["features"] = list(self.features)
        if self.metadata:
            data["metadata"] = self.metadata
        return data


def is_offline_license(license_key: str) -> bool:
    """Return ``True`` if the provided key uses the offline license format."""

    return bool(license_key and license_key.startswith(OFFLINE_LICENSE_PREFIX))


def generate_offline_license(secret: str, payload: OfflineLicensePayload) -> str:
    """Generate a new offline license string."""

    if not secret:
        raise OfflineLicenseError("Signing secret is required to generate a license.")

    raw_payload = _encode_payload(payload.to_dict())
    signature = _sign_payload(secret, raw_payload)
    payload_b64 = base64.urlsafe_b64encode(raw_payload).decode("ascii").rstrip("=")
    return f"{OFFLINE_LICENSE_PREFIX}{payload_b64}.{signature}"


def verify_offline_license(secret: str, license_key: str) -> Dict[str, Any]:
    """Verify an offline license and return the embedded payload."""

    if not secret:
        raise OfflineLicenseError("Signing secret is required to verify a license.")
    if not is_offline_license(license_key):
        raise OfflineLicenseError("Not an offline license key.")

    try:
        payload_part, signature = license_key[len(OFFLINE_LICENSE_PREFIX) :].split(".", maxsplit=1)
    except ValueError as exc:
        raise OfflineLicenseError("Offline license is malformed.") from exc

    try:
        raw_payload = base64.urlsafe_b64decode(_add_padding(payload_part))
    except (binascii.Error, ValueError) as exc:
        raise OfflineLicenseError("Offline license payload is invalid.") from exc
    expected_signature = _sign_payload(secret, raw_payload)
    if not hmac.compare_digest(expected_signature, signature.lower()):
        raise OfflineLicenseError("Offline license signature mismatch.")

    try:
        payload = json.loads(raw_payload.decode("utf-8"))
    except json.JSONDecodeError as exc:
        raise OfflineLicenseError("Offline license payload is invalid.") from exc

    return payload


def _encode_payload(payload: Dict[str, Any]) -> bytes:
    return json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")


def _sign_payload(secret: str, payload: bytes) -> str:
    digest = hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()
    return digest.lower()


def _to_isoformat(value: datetime) -> str:
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).isoformat()


def _add_padding(value: str) -> str:
    remainder = len(value) % 4
    if remainder:
        value += "=" * (4 - remainder)
    return value


__all__ = [
    "OfflineLicenseError",
    "OfflineLicensePayload",
    "generate_offline_license",
    "verify_offline_license",
    "is_offline_license",
]
