"""Command line interface for interacting with the LicenseManager."""

from __future__ import annotations

import argparse
import json
import sys

from .license_manager import LicenseManager, LicenseValidationError


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="License manager utility")
    parser.add_argument(
        "command",
        choices=["status", "validate"],
        help="Action to perform",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    manager = LicenseManager()

    if args.command == "status":
        status = manager.get_license_status()
        print(json.dumps({"status": status}, default=str))
        return 0

    try:
        manager.validate_license()
    except LicenseValidationError as exc:
        payload = {"valid": False, "error": str(exc), "status": manager.get_license_status()}
        print(json.dumps(payload, default=str))
        return 1

    status = manager.get_license_status()
    print(json.dumps({"valid": True, "status": status}, default=str))
    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
