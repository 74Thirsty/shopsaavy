"""CLI helper for verifying license tokens within the application."""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Optional

from .license_verifier import LicenseVerificationError, normalize_token, verify_token


def verify_from_cli(
    public_key: Path,
    token: str,
    *,
    expected_product: Optional[str] = None,
    expected_version: Optional[str] = None,
) -> bool:
    """Verify ``token`` using ``public_key`` and return the result."""

    normalized = normalize_token(token)
    payload = verify_token(
        public_key,
        normalized,
        expected_product=expected_product,
        expected_version=expected_version,
    )
    return not payload.is_expired


def main(argv: list[str] | None = None) -> int:
    argv = argv or sys.argv[1:]
    if len(argv) < 2 or len(argv) > 4:
        print("Usage: verify_license.py <public_key.pem> <token> [expected_product] [expected_version]")
        return 1

    public_key = Path(argv[0])
    token = argv[1]
    expected_product = argv[2] if len(argv) >= 3 else None
    expected_version = argv[3] if len(argv) >= 4 else None

    try:
        valid = verify_from_cli(
            public_key,
            token,
            expected_product=expected_product,
            expected_version=expected_version,
        )
    except (OSError, LicenseVerificationError) as exc:
        print(f"INVALID: {exc}")
        return 1

    if not valid:
        print("INVALID: License expired.")
        return 1

    print("VALID")
    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
