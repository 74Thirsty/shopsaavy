import base64
import hashlib
import hmac
from pathlib import Path

import pytest

from core.license_manager import LicenseManager, LicenseValidationError


PASSWORD_B64 = "U0hPUFNTQUFWWS1QUk9EVUNUSU9OLVNFR1JFVA=="
SALT = "v1"
KEY_LENGTH = 25
GROUP_SIZE = 5
IDENTIFIER_ENV = "SHOPSAAVY_LICENSE_IDENTIFIER"


def generate_key(identifier: str) -> str:
    password = base64.b64decode(PASSWORD_B64).decode("utf-8")
    key_bytes = password.encode("utf-8")
    message = identifier.encode("utf-8") + b":" + SALT.encode("utf-8")
    digest = hmac.new(key_bytes, message, hashlib.sha256).digest()
    needed_bytes = (KEY_LENGTH * 5 + 7) // 8
    if needed_bytes > len(digest):
        derived = hashlib.pbkdf2_hmac(
            "sha256",
            identifier.encode("utf-8"),
            (password + SALT).encode("utf-8"),
            100_000,
            dklen=needed_bytes,
        )
    else:
        derived = digest[:needed_bytes]

    raw = base64.b32encode(derived).decode("utf-8").rstrip("=")[:KEY_LENGTH]
    parts = [raw[i : i + GROUP_SIZE] for i in range(0, len(raw), GROUP_SIZE)]
    return "-".join(parts)


@pytest.fixture(autouse=True)
def setup_env(monkeypatch, tmp_path):
    monkeypatch.delenv("LICENSE_KEY", raising=False)
    monkeypatch.delenv(IDENTIFIER_ENV, raising=False)
    log_path = tmp_path / "logs" / "license.log"
    monkeypatch.setenv("LICENSE_LOG_PATH", str(log_path))
    yield


def test_validate_license_success(monkeypatch, tmp_path):
    identifier = "GLOBAL"
    monkeypatch.setenv(IDENTIFIER_ENV, identifier)
    key = generate_key(identifier)
    monkeypatch.setenv("LICENSE_KEY", key)

    manager = LicenseManager()
    assert manager.validate_license() is True

    status = manager.get_license_status()
    assert status["valid"] is True
    assert status["message"] == "License validated locally."
    assert status["details"] == {"mode": "offline"}
    assert status["license_key"].startswith("XXXX-XXXX-")

    log_path = Path(tmp_path / "logs" / "license.log")
    assert log_path.exists()
    assert "License validated locally." in log_path.read_text()


def test_validate_license_invalid_key(monkeypatch):
    monkeypatch.setenv("LICENSE_KEY", "INVALID-KEY-12345")

    manager = LicenseManager()
    with pytest.raises(LicenseValidationError):
        manager.validate_license()


def test_missing_license_key():
    manager = LicenseManager(license_key="")
    with pytest.raises(LicenseValidationError):
        manager.validate_license()


def test_status_before_validation(monkeypatch):
    key = generate_key("GLOBAL")
    monkeypatch.setenv("LICENSE_KEY", key)
    manager = LicenseManager()
    status = manager.get_license_status()
    assert status["valid"] is False
    assert status["message"] == "License not yet validated."
    assert status["license_key"].endswith(key.replace("-", "")[-4:])


def test_identifier_override(monkeypatch):
    identifier = "CUSTOM-IDENT"
    monkeypatch.setenv(IDENTIFIER_ENV, identifier)
    key = generate_key(identifier)
    monkeypatch.setenv("LICENSE_KEY", key)
    manager = LicenseManager()
    assert manager.validate_license() is True
