"""Offline license validation backed by signed tokens."""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

from .license_verifier import (
    LicenseVerificationError,
    normalize_token,
    verify_token,
)


class LicenseValidationError(Exception):
    """Raised when a license fails validation."""


@dataclass
class LicenseStatus:
    """Represents the status of the most recent validation."""

    valid: bool
    expiry: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    message: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        payload: Dict[str, Any] = {"valid": self.valid}
        if self.expiry is not None:
            payload["expiry"] = self.expiry
        if self.details is not None:
            payload["details"] = self.details
        if self.message:
            payload["message"] = self.message
        return payload


class LicenseManager:
    """Manage offline license validation using the embedded public key."""

    def __init__(
            self,
            license_token: Optional[str] = None,
            *,
            log_path: Optional[Path] = None,
            public_key_path: Optional[Path] = None,
            expected_product: Optional[str] = None,
            expected_version: Optional[str] = None,
    ) -> None:
        # ------------------------------------------------------------------
        # Resolve everything relative to the ShopSaavy project root
        # ------------------------------------------------------------------
        APP_ROOT = Path(__file__).resolve().parents[2]  # ~/Git/shopsaavy
        DEFAULT_LOG_PATH = APP_ROOT / "logs" / "license.log"
        DEFAULT_PUBLIC_KEY = APP_ROOT / "src" / "core" / "license_public.pem"

        # Environment overrides
        log_env = os.getenv("LICENSE_LOG_PATH")
        public_key_env = os.getenv("LICENSE_PUBLIC_KEY_PATH")
        product_env = os.getenv("LICENSE_PRODUCT")
        version_env = os.getenv("LICENSE_VERSION")

        # ------------------------------------------------------------------
        # Paths now resolve inside the app root, never /
        # ------------------------------------------------------------------
        self.log_file = (
            Path(log_env)
            if log_env
            else (log_path or DEFAULT_LOG_PATH)
        )
        self.public_key_path = (
            Path(public_key_env)
            if public_key_env
            else (public_key_path or DEFAULT_PUBLIC_KEY)
        )
        self.expected_product = expected_product or product_env
        self.expected_version = expected_version or version_env

        # ensure logs/ exists under app root
        self.log_file.parent.mkdir(parents=True, exist_ok=True)

        self.license_token = license_token or self._load_license_token()
        self._status: Optional[LicenseStatus] = None
        self._last_validated_at: Optional[str] = None
        self._logger = self._configure_logger()

    # Public API -----------------------------------------------------

    def validate_license(self) -> bool:
        """Validate the configured license token."""

        if not self.license_token:
            raise LicenseValidationError("No license token provided.")

        if not self.public_key_path.exists():
            message = f"License public key not found at {self.public_key_path}"
            self._log_event(message, logging.ERROR)
            raise LicenseValidationError(message)

        token = normalize_token(self.license_token)
        try:
            payload = verify_token(
                self.public_key_path,
                token,
                expected_product=self.expected_product,
                expected_version=self.expected_version,
            )
        except (OSError, LicenseVerificationError) as exc:
            message = str(exc) or "Invalid license."
            self._log_event(f"License validation failed: {message}", logging.ERROR)
            raise LicenseValidationError(message) from exc

        if payload.is_expired:
            message = "License expired."
            self._log_event(message, logging.ERROR)
            raise LicenseValidationError(message)

        expiry_iso = datetime.fromtimestamp(payload.expiry, tz=timezone.utc).isoformat()
        self._status = LicenseStatus(
            valid=True,
            expiry=expiry_iso,
            details=payload.to_details(),
        )
        self._last_validated_at = datetime.now(timezone.utc).isoformat()
        self._log_event("License validation succeeded.")
        return True

    def get_license_status(self) -> Dict[str, Any]:
        """Return the last known license validation status."""

        if self._status:
            result = self._status.to_dict()
            if self.license_token:
                result.setdefault("license_key", self._obfuscate_key())
            if self._last_validated_at:
                result.setdefault("validated_at", self._last_validated_at)
            return result

        payload: Dict[str, Any] = {"valid": False}
        if self.license_token:
            payload["license_key"] = self._obfuscate_key()
        if self._last_validated_at:
            payload["validated_at"] = self._last_validated_at
        return payload

    # Internal helpers ----------------------------------------------

    def _load_license_token(self) -> str:
        for env_var in ("LICENSE_TOKEN", "LICENSE_KEY"):
            value = os.getenv(env_var)
            if value:
                return value.strip()

        try:
            import keyring  # type: ignore

            stored = keyring.get_password("shopsaavy", "license_key")
            if stored:
                return stored.strip()
        except Exception:
            pass

        possible_files = [
            Path.home() / ".license_token",
            Path.home() / ".license_key",
            Path.home() / ".config" / "shopsaavy" / "license_token",
            Path.home() / ".config" / "shopsaavy" / "license_key",
        ]
        for file_path in possible_files:
            if file_path.exists():
                try:
                    content = file_path.read_text(encoding="utf-8").strip()
                    if content:
                        return content
                except OSError:
                    continue
        return ""

    def _configure_logger(self) -> logging.Logger:
        try:
            resolved = self.log_file.resolve()
        except OSError:
            resolved = self.log_file
        logger_name = f"license_manager.{hash(str(resolved))}"
        logger = logging.getLogger(logger_name)
        if not logger.handlers:
            logger.setLevel(logging.INFO)
            handler = logging.FileHandler(self.log_file, encoding="utf-8")
            formatter = logging.Formatter(
                "%(asctime)s - %(levelname)s - %(message)s",
                datefmt="%Y-%m-%d %H:%M:%S",
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
            logger.propagate = False
        return logger

    def _log_event(self, message: str, level: int = logging.INFO) -> None:
        obfuscated_key = self._obfuscate_key()
        formatted_message = f"{message} | key={obfuscated_key}"
        self._logger.log(level, formatted_message)

    def _obfuscate_key(self) -> str:
        if not self.license_token:
            return "UNKNOWN"
        sanitized = "".join(ch for ch in self.license_token if ch.isalnum()).upper()
        if not sanitized:
            sanitized = self.license_token[-4:].upper()
        tail = sanitized[-4:] if len(sanitized) >= 4 else sanitized
        return f"XXXX-XXXX-{tail}"


__all__ = [
    "LicenseManager",
    "LicenseValidationError",
    "LicenseStatus",
]
