"""Offline license manager that relies on the embedded key verifier."""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

from .license_verifier import verify_product_key


class LicenseValidationError(Exception):
    """Raised when the configured license fails validation."""


@dataclass
class LicenseStatus:
    """Represents the outcome of the most recent validation attempt."""

    valid: bool
    message: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    validated_at: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        payload: Dict[str, Any] = {"valid": self.valid}
        if self.message:
            payload["message"] = self.message
        if self.details is not None:
            payload["details"] = self.details
        if self.validated_at:
            payload["validated_at"] = self.validated_at
        return payload


class LicenseManager:
    """Coordinates loading and validating the offline product key."""

    def __init__(
        self,
        license_key: Optional[str] = None,
        log_path: Optional[Path] = None,
    ) -> None:
        log_env = os.getenv("LICENSE_LOG_PATH")
        self.log_file = Path(log_env) if log_env else (log_path or Path("/logs/license.log"))
        self.log_file.parent.mkdir(parents=True, exist_ok=True)
        self.license_key = (license_key or self._load_license_key()).strip()
        self._status: Optional[LicenseStatus] = None
        self._logger = self._configure_logger()

    def validate_license(self) -> bool:
        if not self.license_key:
            raise LicenseValidationError("No license key provided.")

        if verify_product_key(self.license_key):
            timestamp = datetime.now(timezone.utc).isoformat()
            self._status = LicenseStatus(
                valid=True,
                message="License validated locally.",
                details={"mode": "offline"},
                validated_at=timestamp,
            )
            self._log_event("License validated locally.")
            return True

        self._log_event("License validation failed.", level=logging.ERROR)
        raise LicenseValidationError("Invalid license key.")

    def get_license_status(self) -> Dict[str, Any]:
        if self._status:
            payload = self._status.to_dict()
        else:
            payload = {"valid": False, "message": "License not yet validated."}

        if self.license_key:
            payload.setdefault("license_key", self._obfuscate_key())
        return payload

    # Internal helpers -------------------------------------------------

    def _load_license_key(self) -> str:
        key = os.getenv("LICENSE_KEY")
        if key:
            return key.strip()

        try:
            import keyring  # type: ignore

            stored = keyring.get_password("shopsaavy", "license_key")
            if stored:
                return stored.strip()
        except Exception:
            pass

        possible_files = [
            Path.home() / ".license_key",
            Path.home() / ".config" / "shopsaavy" / "license_key",
        ]
        for file_path in possible_files:
            if file_path.exists():
                try:
                    content = file_path.read_text(encoding="utf-8").strip()
                except OSError:
                    continue
                if content:
                    return content
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
        if not self.license_key:
            return "UNKNOWN"
        sanitized = "".join(ch for ch in self.license_key.upper() if ch.isalnum())
        tail = sanitized[-4:] if len(sanitized) >= 4 else sanitized
        return f"XXXX-XXXX-{tail}"


__all__ = ["LicenseManager", "LicenseValidationError", "LicenseStatus"]
