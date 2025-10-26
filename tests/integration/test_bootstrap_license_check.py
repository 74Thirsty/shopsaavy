import base64
import time
from pathlib import Path

import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

import app.main as main_module


def generate_keypair(tmp_path):
    private_key = Ed25519PrivateKey.generate()
    public_key = private_key.public_key()

    public_path = tmp_path / "license_public.pem"
    public_path.write_bytes(
        public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )
    )
    return private_key, public_path


def create_token(private_key: Ed25519PrivateKey, *, product="ShopSaavy", version="1.0.0", expiry=None):
    if expiry is None:
        expiry = int(time.time()) + 3600
    payload = f"customer|{product}|{version}|{expiry}".encode("utf-8")
    payload_b64 = base64.urlsafe_b64encode(payload).decode("utf-8").rstrip("=")
    signature = private_key.sign(payload)
    signature_b64 = base64.urlsafe_b64encode(signature).decode("utf-8").rstrip("=")
    return f"{payload_b64}.{signature_b64}"


@pytest.fixture(autouse=True)
def configure_env(monkeypatch, tmp_path):
    private_key, public_path = generate_keypair(tmp_path)
    monkeypatch.setenv("LICENSE_PUBLIC_KEY_PATH", str(public_path))
    monkeypatch.setenv("LICENSE_LOG_PATH", str(tmp_path / "logs" / "license.log"))
    monkeypatch.delenv("LICENSE_TOKEN", raising=False)
    monkeypatch.delenv("LICENSE_KEY", raising=False)
    monkeypatch.setenv("LICENSE_PRODUCT", "ShopSaavy")
    monkeypatch.setenv("LICENSE_VERSION", "1.0.0")
    yield private_key


def test_app_exits_when_license_invalid(monkeypatch, capsys, configure_env, tmp_path):
    private_key = configure_env
    invalid_token = create_token(private_key, product="Other")
    monkeypatch.setenv("LICENSE_TOKEN", invalid_token)

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
    assert "License product mismatch" in log_path.read_text()


def test_app_starts_with_valid_license(monkeypatch, configure_env):
    private_key = configure_env
    token = create_token(private_key)
    monkeypatch.setenv("LICENSE_TOKEN", token)

    started = {"bootstrap": False}

    def fake_bootstrap():
        started["bootstrap"] = True

    monkeypatch.setattr(main_module, "bootstrap_application", fake_bootstrap)

    main_module.main()
    assert started["bootstrap"] is True
