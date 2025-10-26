"""License validation module for the application."""

from __future__ import annotations

import json
import logging
import os
import ssl
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, Optional
from urllib import error, request
import hashlib

from .license_offline import OfflineLicenseError, is_offline_license, verify_offline_license


class LicenseValidationError(Exception):
    """Raised when a license fails validation."""


@dataclass
class LicenseStatus:
    """Represents the status returned from the validation endpoint."""

    valid: bool
    expiry: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    message: Optional[str] = None

    @property
    def expiry_datetime(self) -> Optional[datetime]:
        if not self.expiry:
            return None
        return _parse_datetime(self.expiry)

    def to_dict(self) -> Dict[str, Any]:
        payload: Dict[str, Any] = {
            "valid": self.valid,
        }
        if self.expiry is not None:
            payload["expiry"] = self.expiry
        if self.details is not None:
            payload["details"] = self.details
        if self.message:
            payload["message"] = self.message
        return payload

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "LicenseStatus":
        return cls(
            valid=bool(data.get("valid", False)),
            expiry=data.get("expiry"),
            details=data.get("details"),
            message=data.get("message"),
        )


class LicenseManager:
    """Manages license validation and caching."""

    VALIDATION_URL = "https://api.licenseserver.com/validate"
    CACHE_DURATION = timedelta(hours=24)

    def __init__(
        self,
        license_key: Optional[str] = None,
        cache_path: Optional[Path] = None,
        log_path: Optional[Path] = None,
        local_license_path: Optional[Path] = None,
        signing_secret: Optional[str] = None,
    ) -> None:
        cache_env = os.getenv("LICENSE_CACHE_PATH")
        log_env = os.getenv("LICENSE_LOG_PATH")
        local_env = os.getenv("LICENSE_LOCAL_KEY_PATH")
        secret_env = os.getenv("LICENSE_SIGNING_SECRET")
        self.cache_file = Path(cache_env) if cache_env else (cache_path or Path.home() / ".app_cache" / "license.json")
        self.log_file = Path(log_env) if log_env else (log_path or Path("/logs/license.log"))
        self.local_license_file = (
            Path(local_env)
            if local_env
            else (local_license_path or Path.home() / ".app_cache" / "license.key")
        )
        self.cache_file.parent.mkdir(parents=True, exist_ok=True)
        self.log_file.parent.mkdir(parents=True, exist_ok=True)
        self.local_license_file.parent.mkdir(parents=True, exist_ok=True)
        self.license_key = license_key or self._load_license_key()
        self.signing_secret = signing_secret or secret_env or ""
        self._status: Optional[LicenseStatus] = None
        self._last_validated_at: Optional[str] = None
        self._logger = self._configure_logger()

    def validate_license(self) -> bool:
        """Validate the license key with caching support."""
        if not self.license_key:
            raise LicenseValidationError("No license key provided.")

        offline_status = self._attempt_offline_validation()
        if offline_status:
            self._status = offline_status
            self._write_cache(offline_status)
            self._log_event("License validation succeeded (offline signature).")
            return True

        cached = self._load_cache()
        if cached:
            self._status = cached
            if cached.valid and not self._is_expired(cached):
                self._log_event("License validation succeeded (cached result).")
                return True

        used_offline = False
        try:
            status = self._perform_remote_validation()
        except LicenseValidationError as exc:
            self._log_event(f"License validation failed (remote validation): {exc}", logging.ERROR)
            raise
        except Exception as exc:  # pragma: no cover - defensive logging
            self._log_event(
                f"Remote validation unavailable ({exc}); attempting offline validation.",
                logging.WARNING,
            )
            try:
                status = self._perform_offline_validation()
                used_offline = True
            except LicenseValidationError as offline_error:
                self._log_event(f"License validation failed (offline validation): {offline_error}", logging.ERROR)
                raise

        if not status.valid:
            message = status.message or "Invalid license."
            self._log_event(f"License validation failed: {message}", logging.ERROR)
            raise LicenseValidationError(message)

        if self._is_expired(status):
            message = "License expired."
            self._log_event(message, logging.ERROR)
            raise LicenseValidationError(message)

        self._status = status
        self._write_cache(status)
        if used_offline:
            self._log_event("License validation succeeded (offline validation).")
        else:
            self._log_event("License validation succeeded (remote validation).")
        return True

    def get_license_status(self) -> Dict[str, Any]:
        """Return the most recent license status."""
        if self._status:
            result = self._status.to_dict()
            if self.license_key:
                result.setdefault("license_key", self._obfuscate_key())
            if self._last_validated_at:
                result.setdefault("validated_at", self._last_validated_at)
            return result
        cached = self._load_cache()
        if cached:
            result = cached.to_dict()
            if self.license_key:
                result.setdefault("license_key", self._obfuscate_key())
            if self._last_validated_at:
                result.setdefault("validated_at", self._last_validated_at)
            return result
        payload: Dict[str, Any] = {}
        if self.license_key:
            payload["license_key"] = self._obfuscate_key()
        if self._last_validated_at:
            payload["validated_at"] = self._last_validated_at
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
                    if content:
                        return content
                except OSError:
                    continue
        return ""

    def _perform_remote_validation(self) -> LicenseStatus:
        payload = json.dumps({"license_key": self.license_key}).encode("utf-8")
        headers = {"Content-Type": "application/json"}
        ssl_context = ssl.create_default_context()
        request_obj = request.Request(
            self.VALIDATION_URL,
            data=payload,
            headers=headers,
            method="POST",
        )
        try:
            with request.urlopen(request_obj, context=ssl_context, timeout=10) as response:
                if response.status != 200:
                    raise LicenseValidationError(
                        f"Unexpected response status: {response.status}"
                    )
                response_data = response.read().decode("utf-8")
                parsed = json.loads(response_data or "{}")
        except error.URLError as exc:
            raise exc
        except json.JSONDecodeError as exc:
            raise LicenseValidationError("Invalid response from license server") from exc

        valid = bool(parsed.get("valid"))
        status = LicenseStatus(
            valid=valid,
            expiry=parsed.get("expiry"),
            details=parsed.get("details"),
            message=parsed.get("message"),
        )
        if not status.valid:
            raise LicenseValidationError(status.message or "Invalid license.")
        return status

    def _perform_offline_validation(self) -> LicenseStatus:
        cached = self._load_cache()
        if cached and cached.valid and not self._is_expired(cached):
            self._log_event("Using cached license validation result due to offline mode.")
            return cached

        if self.local_license_file.exists():
            try:
                payload = json.loads(self.local_license_file.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError) as exc:
                raise LicenseValidationError("Invalid local license file.") from exc
            stored_hash = payload.get("license_hash")
            if stored_hash != self._license_hash:
                raise LicenseValidationError("License key mismatch in local file.")
            status = LicenseStatus.from_dict(payload.get("status", {}))
            if not status.valid or self._is_expired(status):
                raise LicenseValidationError("Local license expired or invalid.")
            self._last_validated_at = payload.get("validated_at")
            return status

        raise LicenseValidationError("Offline validation unavailable.")

    def _write_cache(self, status: LicenseStatus) -> None:
        cache_payload = {
            "license_hash": self._license_hash,
            "status": status.to_dict(),
            "validated_at": datetime.now(timezone.utc).isoformat(),
        }
        try:
            self.cache_file.write_text(json.dumps(cache_payload), encoding="utf-8")
            self.local_license_file.write_text(json.dumps(cache_payload), encoding="utf-8")
            self._last_validated_at = cache_payload["validated_at"]
        except OSError:
            self._log_event("Unable to write license cache.", logging.WARNING)

    def _load_cache(self) -> Optional[LicenseStatus]:
        self._last_validated_at = None
        if not self.cache_file.exists():
            return None
        try:
            payload = json.loads(self.cache_file.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return None

        if payload.get("license_hash") != self._license_hash:
            return None
        validated_at_raw = payload.get("validated_at")
        if not validated_at_raw:
            return None
        validated_at = _parse_datetime(validated_at_raw)
        if not validated_at:
            return None
        if datetime.now(timezone.utc) - validated_at > self.CACHE_DURATION:
            return None
        self._last_validated_at = payload.get("validated_at")
        return LicenseStatus.from_dict(payload.get("status", {}))

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
        sanitized = self.license_key.replace("-", "").replace(" ", "")
        if len(sanitized) < 4:
            tail = sanitized.upper()
        else:
            tail = sanitized[-4:].upper()
        return f"XXXX-XXXX-{tail}"

    @property
    def _license_hash(self) -> str:
        return hashlib.sha256(self.license_key.encode("utf-8")).hexdigest()

    @staticmethod
    def _is_expired(status: LicenseStatus) -> bool:
        expiry = status.expiry_datetime
        if not expiry:
            return False
        now = datetime.now(timezone.utc)
        return expiry < now

    def _attempt_offline_validation(self) -> Optional[LicenseStatus]:
        if not self.signing_secret or not self.license_key:
            return None
        if not is_offline_license(self.license_key):
            return None
        try:
            payload = verify_offline_license(self.signing_secret, self.license_key)
        except OfflineLicenseError as exc:
            raise LicenseValidationError(str(exc))

        expiry = payload.get("expires_at")
        details = {
            key: value
            for key, value in payload.items()
            if key not in {"expires_at", "version"}
        }
        status = LicenseStatus(
            valid=True,
            expiry=expiry,
            details=details,
            message="Offline license validated locally.",
        )
        self._last_validated_at = datetime.now(timezone.utc).isoformat()
        return status


def _parse_datetime(value: str) -> Optional[datetime]:
    if not value:
        return None
    try:
        if value.endswith("Z"):
            value = value[:-1] + "+00:00"
        return datetime.fromisoformat(value)
    except ValueError:
        try:
            return datetime.strptime(value, "%Y-%m-%d %H:%M:%S%z")
        except ValueError:
            return None


__all__ = [
    "LicenseManager",
    "LicenseValidationError",
    "LicenseStatus",
]
