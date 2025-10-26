"""Generate signed license tokens using the offline keypair."""

from __future__ import annotations

import argparse
import base64
import time
from pathlib import Path

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey


def b64u(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("utf-8").rstrip("=")


def canonical_payload(identifier: str, product: str, version: str, expiry: int) -> bytes:
    return f"{identifier}|{product}|{version}|{expiry}".encode("utf-8")


def sign_payload(private_key_path: Path, payload: bytes) -> str:
    private_key_data = private_key_path.read_bytes()
    private_key = serialization.load_pem_private_key(private_key_data, password=None)
    assert isinstance(private_key, Ed25519PrivateKey)
    signature = private_key.sign(payload)
    return f"{b64u(payload)}.{b64u(signature)}"


def human_readable(token: str) -> str:
    encoded = base64.b32encode(token.encode("utf-8")).decode("utf-8").rstrip("=")
    groups = [encoded[i : i + 5] for i in range(0, len(encoded), 5)]
    return "-".join(groups)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate a signed license token")
    parser.add_argument("--priv", default="license_private.pem", help="Path to the private PEM file")
    parser.add_argument("--id", required=True, help="License identifier (user or device)")
    parser.add_argument("--product", default="ShopSaavy", help="Product identifier")
    parser.add_argument("--version", default="1.0.0", help="Product version")
    parser.add_argument("--days", type=int, default=365, help="Days until expiry")
    args = parser.parse_args()

    expiry = int(time.time()) + args.days * 24 * 3600
    payload = canonical_payload(args.id, args.product, args.version, expiry)
    token = sign_payload(Path(args.priv), payload)

    print("RAW TOKEN:")
    print(token)
    print()
    print("HUMAN-FRIENDLY (BASE32 GROUPED):")
    print(human_readable(token))


if __name__ == "__main__":  # pragma: no cover
    main()
