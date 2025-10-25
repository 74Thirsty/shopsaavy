from pathlib import Path

import pytest

import app.main as main_module
from core.license_manager import LicenseManager, LicenseValidationError


@pytest.fixture(autouse=True)
def configure_paths(monkeypatch, tmp_path):
    monkeypatch.setenv("LICENSE_CACHE_PATH", str(tmp_path / "license.json"))
    log_path = tmp_path / "logs" / "license.log"
    monkeypatch.setenv("LICENSE_LOG_PATH", str(log_path))
    monkeypatch.setenv("LICENSE_LOCAL_KEY_PATH", str(tmp_path / "license.key"))
    monkeypatch.setenv("LICENSE_KEY", "TEST-KEY-0001")
    yield


def test_app_exits_when_license_invalid(monkeypatch, capsys, tmp_path):
    def fake_remote(self):
        raise LicenseValidationError("Invalid or expired license.")

    monkeypatch.setattr(LicenseManager, "_perform_remote_validation", fake_remote, raising=False)

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
    assert "Invalid or expired license" in log_path.read_text()


def test_app_starts_with_valid_license(monkeypatch):
    def future_timestamp():
        from datetime import datetime, timedelta, timezone

        return (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()

    def successful_remote(self):
        from core.license_manager import LicenseStatus

        return LicenseStatus(valid=True, expiry=future_timestamp())

    monkeypatch.setattr(LicenseManager, "_perform_remote_validation", successful_remote, raising=False)

    started = {"bootstrap": False}

    def fake_bootstrap():
        started["bootstrap"] = True

    monkeypatch.setattr(main_module, "bootstrap_application", fake_bootstrap)

    main_module.main()
    assert started["bootstrap"] is True
