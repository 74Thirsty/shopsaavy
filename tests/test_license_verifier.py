import base64
import hashlib
import hmac

from core.license_verifier import verify_product_key

PASSWORD_B64 = "U0hPUFNTQUFWWS1QUk9EVUNUSU9OLVNFR1JFVA=="
SALT = "v1"
KEY_LENGTH = 25
GROUP_SIZE = 5


def make_key(identifier: str) -> str:
    password = base64.b64decode(PASSWORD_B64).decode("utf-8")
    key_bytes = password.encode("utf-8")
    message = identifier.encode("utf-8") + b":" + SALT.encode("utf-8")
    digest = hmac.new(key_bytes, message, hashlib.sha256).digest()
    raw = base64.b32encode(digest[: (KEY_LENGTH * 5 + 7) // 8]).decode("utf-8").rstrip("=")
    value = raw[:KEY_LENGTH]
    parts = [value[i : i + GROUP_SIZE] for i in range(0, len(value), GROUP_SIZE)]
    return "-".join(parts)


def test_verify_product_key_valid(monkeypatch):
    key = make_key("GLOBAL")
    assert verify_product_key(key) is True
    assert verify_product_key(key.lower()) is True


def test_verify_product_key_invalid():
    assert verify_product_key("NOT-A-REAL-KEY") is False
    assert verify_product_key("") is False
