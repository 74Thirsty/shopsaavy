"""Command line helper for generating and inspecting offline licenses."""

from __future__ import annotations

import argparse
import json
import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from .license_offline import (
    OfflineLicenseError,
    OfflineLicensePayload,
    generate_offline_license,
    verify_offline_license,
    is_offline_license,
)


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Offline license management tool")
    subparsers = parser.add_subparsers(dest="command", required=True)

    generate_parser = subparsers.add_parser("generate", help="Generate a new offline license")
    generate_parser.add_argument("customer", help="Customer or recipient name")
    generate_parser.add_argument(
        "--expires-in-days",
        type=int,
        default=365,
        help="Number of days until the license expires (default: 365)",
    )
    generate_parser.add_argument(
        "--expires-at",
        help="Explicit ISO 8601 expiry timestamp (overrides --expires-in-days)",
    )
    generate_parser.add_argument("--plan", help="Optional plan or SKU name")
    generate_parser.add_argument("--seats", type=int, help="Seat count or activation limit")
    generate_parser.add_argument("--notes", help="Internal notes stored in the payload")
    generate_parser.add_argument(
        "--feature",
        action="append",
        dest="features",
        help="Repeat to include enabled features",
    )
    generate_parser.add_argument(
        "--metadata",
        action="append",
        help="Additional JSON key=value pairs to include in metadata",
    )
    generate_parser.add_argument(
        "--signing-secret",
        help="Signing secret. Defaults to $LICENSE_SIGNING_SECRET if unset.",
    )

    inspect_parser = subparsers.add_parser("inspect", help="Inspect an offline license")
    inspect_parser.add_argument("license_key", help="License string to inspect")
    inspect_parser.add_argument(
        "--signing-secret",
        help="Signing secret for verification. Defaults to $LICENSE_SIGNING_SECRET.",
    )

    return parser.parse_args()


def _resolve_expiry(args: argparse.Namespace) -> datetime:
    if args.expires_at:
        try:
            value = datetime.fromisoformat(args.expires_at.replace("Z", "+00:00"))
        except ValueError as exc:
            raise SystemExit(f"Invalid --expires-at value: {exc}")
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)
    return datetime.now(timezone.utc) + timedelta(days=args.expires_in_days)


def _parse_metadata(metadata_args: Any) -> Dict[str, Any] | None:
    if not metadata_args:
        return None
    result: Dict[str, Any] = {}
    for item in metadata_args:
        if "=" not in item:
            raise SystemExit(f"Metadata must be in key=value form: {item}")
        key, value = item.split("=", maxsplit=1)
        key = key.strip()
        value = value.strip()
        try:
            result[key] = json.loads(value)
        except json.JSONDecodeError:
            result[key] = value
    return result


def handle_generate(args: argparse.Namespace) -> None:
    signing_secret = args.signing_secret or os.getenv("LICENSE_SIGNING_SECRET")
    if not signing_secret:
        raise SystemExit("Set --signing-secret or the LICENSE_SIGNING_SECRET environment variable.")

    expiry = _resolve_expiry(args)
    metadata = _parse_metadata(args.metadata)
    payload = OfflineLicensePayload(
        customer=args.customer,
        expires_at=expiry,
        plan=args.plan,
        seats=args.seats,
        notes=args.notes,
        features=args.features,
        metadata=metadata,
    )
    try:
        license_key = generate_offline_license(signing_secret, payload)
    except OfflineLicenseError as exc:
        raise SystemExit(str(exc))

    output = {
        "license_key": license_key,
        "payload": payload.to_dict(),
    }
    print(json.dumps(output, indent=2))


def handle_inspect(args: argparse.Namespace) -> None:
    if not is_offline_license(args.license_key):
        raise SystemExit("Provided license is not in offline format. Use the remote validation tooling instead.")

    signing_secret = args.signing_secret or os.getenv("LICENSE_SIGNING_SECRET")
    if not signing_secret:
        raise SystemExit("Set --signing-secret or the LICENSE_SIGNING_SECRET environment variable to inspect.")

    try:
        payload = verify_offline_license(signing_secret, args.license_key)
    except OfflineLicenseError as exc:
        raise SystemExit(str(exc))

    print(json.dumps(payload, indent=2))


def main() -> None:
    args = _parse_args()
    if args.command == "generate":
        handle_generate(args)
    elif args.command == "inspect":
        handle_inspect(args)
    else:  # pragma: no cover - defensive fallback
        raise SystemExit(f"Unknown command: {args.command}")


if __name__ == "__main__":
    main()
