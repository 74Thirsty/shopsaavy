import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest

from core.license_manager import LicenseManager, LicenseStatus, LicenseValidationError


@pytest.fixture(autouse=True)
def clear_env(monkeypatch, tmp_path):
    monkeypatch.delenv("LICENSE_KEY", raising=False)
    monkeypatch.setenv("LICENSE_CACHE_PATH", str(tmp_path / "license.json"))
    monkeypatch.setenv("LICENSE_LOG_PATH", str(tmp_path / "license.log"))
    monkeypatch.setenv("LICENSE_LOCAL_KEY_PATH", str(tmp_path / "license.key"))
    yield


def future_timestamp(hours: int = 1) -> str:
    return (datetime.now(timezone.utc) + timedelta(hours=hours)).isoformat()


def past_timestamp(hours: int = 1) -> str:
    return (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()


def test_valid_license(monkeypatch):
    license_key = "TEST-VALID-1234"
    monkeypatch.setenv("LICENSE_KEY", license_key)

    def fake_remote(self):
        return LicenseStatus(valid=True, expiry=future_timestamp())

    monkeypatch.setattr(LicenseManager, "_perform_remote_validation", fake_remote, raising=False)

    manager = LicenseManager()
    assert manager.validate_license() is True
    status = manager.get_license_status()
    assert status["valid"] is True
    assert status["license_key"].startswith("XXXX-XXXX-")
    assert "validated_at" in status


def test_invalid_license(monkeypatch):
    license_key = "TEST-INVALID-1234"
    monkeypatch.setenv("LICENSE_KEY", license_key)

    def fake_remote(self):
        return LicenseStatus(valid=False, message="Invalid license")

    monkeypatch.setattr(LicenseManager, "_perform_remote_validation", fake_remote, raising=False)

    manager = LicenseManager()
    with pytest.raises(LicenseValidationError):
        manager.validate_license()


def test_expired_license(monkeypatch):
    license_key = "TEST-EXPIRED-1234"
    monkeypatch.setenv("LICENSE_KEY", license_key)

    def fake_remote(self):
        return LicenseStatus(valid=True, expiry=past_timestamp())

    monkeypatch.setattr(LicenseManager, "_perform_remote_validation", fake_remote, raising=False)

    manager = LicenseManager()
    with pytest.raises(LicenseValidationError):
        manager.validate_license()


def test_caching_behavior(monkeypatch, tmp_path):
    license_key = "TEST-CACHE-1234"
    monkeypatch.setenv("LICENSE_KEY", license_key)
    call_count = {"count": 0}

    def fake_remote(self):
        call_count["count"] += 1
        return LicenseStatus(valid=True, expiry=future_timestamp())

    monkeypatch.setattr(LicenseManager, "_perform_remote_validation", fake_remote, raising=False)

    manager = LicenseManager()
    assert manager.validate_license() is True
    assert call_count["count"] == 1
    assert manager.validate_license() is True
    assert call_count["count"] == 1

    cache_file = Path(tmp_path / "license.json")
    assert cache_file.exists()
    payload = json.loads(cache_file.read_text())
    assert payload["license_hash"]
    assert "validated_at" in payload
