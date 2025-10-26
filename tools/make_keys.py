"""Generate an Ed25519 keypair for signing licenses."""

from __future__ import annotations

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey


def main() -> None:
    private_key = Ed25519PrivateKey.generate()
    public_key = private_key.public_key()

    private_bytes = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    public_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )

    with open("license_private.pem", "wb") as private_file:
        private_file.write(private_bytes)

    with open("license_public.pem", "wb") as public_file:
        public_file.write(public_bytes)

    print("Keypair generated: license_private.pem (keep secure), license_public.pem (embed in app)")


if __name__ == "__main__":  # pragma: no cover
    main()
