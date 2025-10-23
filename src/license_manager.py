"""Offline license management utilities for the ShopSaavy admin app."""
from __future__ import annotations

import hashlib
import hmac
import os
from typing import Optional

SECRET_SALT = "STATIC_APP_SALT_82b9f8"
KEY_FILE = ".license"
_SIGNATURE_SUFFIX = "cafe"

_cached_key: Optional[str] = None
_cached_result: Optional[bool] = None


def _read_license_file() -> str:
    """Read the persisted license key from disk, if available."""
    if os.path.exists(KEY_FILE):
        with open(KEY_FILE, "r", encoding="utf-8") as handle:
            return handle.read().strip()
    return ""


def load_license_key() -> str:
    """Load the license key from disk or the PRODUCT_KEY environment variable."""
    key_from_file = _read_license_file()
    if key_from_file:
        return key_from_file
    return os.getenv("PRODUCT_KEY", "").strip()


def is_license_valid(force_refresh: bool = False) -> bool:
    """Validate the license key using an offline HMAC signature check."""
    global _cached_key, _cached_result

    if force_refresh:
        _cached_key = None
        _cached_result = None

    key = load_license_key()
    if not key:
        _cached_key = None
        _cached_result = False
        return False

    if _cached_key == key and _cached_result is not None:
        return _cached_result

    signature = hmac.new(SECRET_SALT.encode("utf-8"), key.encode("utf-8"), hashlib.sha256).hexdigest()
    _cached_key = key
    _cached_result = signature.endswith(_SIGNATURE_SUFFIX)
    return _cached_result


__all__ = ["is_license_valid", "load_license_key", "SECRET_SALT"]
