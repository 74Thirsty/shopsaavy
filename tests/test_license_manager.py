import base64
import time

import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

from core.license_manager import LicenseManager, LicenseValidationError


@pytest.fixture
def keypair(tmp_path):
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


@pytest.fixture(autouse=True)
def configure_env(monkeypatch, tmp_path, keypair):
    _, public_path = keypair
    monkeypatch.delenv("LICENSE_TOKEN", raising=False)
    monkeypatch.delenv("LICENSE_KEY", raising=False)
    monkeypatch.setenv("LICENSE_PUBLIC_KEY_PATH", str(public_path))
    monkeypatch.setenv("LICENSE_LOG_PATH", str(tmp_path / "license.log"))
    yield


def make_token(private_key: Ed25519PrivateKey, *, identifier="user", product="ShopSaavy", version="1.0.0", expiry=None):
    if expiry is None:
        expiry = int(time.time()) + 3600
    payload = f"{identifier}|{product}|{version}|{expiry}".encode("utf-8")
    payload_b64 = base64.urlsafe_b64encode(payload).decode("utf-8").rstrip("=")
    signature = private_key.sign(payload)
    signature_b64 = base64.urlsafe_b64encode(signature).decode("utf-8").rstrip("=")
    return f"{payload_b64}.{signature_b64}"


def test_valid_license(monkeypatch, keypair):
    private_key, _ = keypair
    token = make_token(private_key)
    monkeypatch.setenv("LICENSE_TOKEN", token)
    manager = LicenseManager()

    assert manager.validate_license() is True
    status = manager.get_license_status()
    assert status["valid"] is True
    assert status["license_key"].startswith("XXXX-XXXX-")
    assert "details" in status
    assert status["details"]["product"] == "ShopSaavy"
    assert "validated_at" in status


def test_accepts_base32_token(monkeypatch, keypair):
    private_key, _ = keypair
    token = make_token(private_key)
    encoded = base64.b32encode(token.encode("utf-8")).decode("utf-8").rstrip("=")
    grouped = "-".join(encoded[i : i + 5] for i in range(0, len(encoded), 5))
    monkeypatch.setenv("LICENSE_TOKEN", grouped)

    manager = LicenseManager()
    assert manager.validate_license() is True


def test_expired_license(monkeypatch, keypair):
    private_key, _ = keypair
    token = make_token(private_key, expiry=int(time.time()) - 10)
    monkeypatch.setenv("LICENSE_TOKEN", token)

    manager = LicenseManager()
    with pytest.raises(LicenseValidationError) as exc:
        manager.validate_license()
    assert "License expired" in str(exc.value)


def test_invalid_signature(monkeypatch, keypair):
    private_key, _ = keypair
    token = make_token(private_key)
    tampered = token[:-1] + ("A" if token[-1] != "A" else "B")
    monkeypatch.setenv("LICENSE_TOKEN", tampered)

    manager = LicenseManager()
    with pytest.raises(LicenseValidationError) as exc:
        manager.validate_license()
    assert "Invalid license signature" in str(exc.value)


def test_product_mismatch(monkeypatch, keypair):
    private_key, _ = keypair
    token = make_token(private_key, product="OtherProduct")
    monkeypatch.setenv("LICENSE_TOKEN", token)
    monkeypatch.setenv("LICENSE_PRODUCT", "ShopSaavy")

    manager = LicenseManager()
    with pytest.raises(LicenseValidationError) as exc:
        manager.validate_license()
    assert "License product mismatch" in str(exc.value)
