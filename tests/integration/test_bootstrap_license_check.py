from pathlib import Path

import base64
import hashlib
import hmac

import pytest

import app.main as main_module

PASSWORD_B64 = "U0hPUFNTQUFWWS1QUk9EVUNUSU9OLVNFR1JFVA=="
SALT = "v1"
KEY_LENGTH = 25
GROUP_SIZE = 5
IDENTIFIER_ENV = "SHOPSAAVY_LICENSE_IDENTIFIER"


def make_key(identifier: str) -> str:
    password = base64.b64decode(PASSWORD_B64).decode("utf-8")
    key_bytes = password.encode("utf-8")
    message = identifier.encode("utf-8") + b":" + SALT.encode("utf-8")
    digest = hmac.new(key_bytes, message, hashlib.sha256).digest()
    raw = base64.b32encode(digest[: (KEY_LENGTH * 5 + 7) // 8]).decode("utf-8").rstrip("=")
    value = raw[:KEY_LENGTH]
    parts = [value[i : i + GROUP_SIZE] for i in range(0, len(value), GROUP_SIZE)]
    return "-".join(parts)


@pytest.fixture(autouse=True)
def configure_paths(monkeypatch, tmp_path):
    log_path = tmp_path / "logs" / "license.log"
    monkeypatch.setenv("LICENSE_LOG_PATH", str(log_path))
    monkeypatch.setenv(IDENTIFIER_ENV, "GLOBAL")
    yield


def test_app_exits_when_license_invalid(monkeypatch, capsys, tmp_path):
    monkeypatch.setenv("LICENSE_KEY", "INVALID-KEY-0000")

    called = {"bootstrap": False}

    def fake_bootstrap():
        called["bootstrap"] = True

    monkeypatch.setattr(main_module, "bootstrap_application", fake_bootstrap)

    with pytest.raises(SystemExit):
        main_module.main()

    captured = capsys.readouterr()
    assert "LICENSE ERROR" in captured.out
    assert called["bootstrap"] is False

    log_path = Path(tmp_path / "logs" / "license.log")
    assert log_path.exists()
    assert "License validation failed." in log_path.read_text()


def test_app_starts_with_valid_license(monkeypatch):
    monkeypatch.setenv("LICENSE_KEY", make_key("GLOBAL"))

    started = {"bootstrap": False}

    def fake_bootstrap():
        started["bootstrap"] = True

    monkeypatch.setattr(main_module, "bootstrap_application", fake_bootstrap)

    main_module.main()
    assert started["bootstrap"] is True
