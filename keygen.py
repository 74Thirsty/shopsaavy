#!/usr/bin/env python3
"""Utility for generating and validating Shop Saavy license keys."""
from __future__ import annotations

import argparse
import base64
import hashlib
import hmac
from dataclasses import dataclass

SALT = "V1"
PASSWORD = "Shop_Saavy"
DEFAULT_LENGTH = 20
DEFAULT_GROUP_SIZE = 5
DEFAULT_SEPARATOR = "-"


def _derive_digest(identifier: str) -> bytes:
    """Return an HMAC-SHA256 digest for the given identifier."""
    key = PASSWORD.encode("utf-8")
    message = identifier.encode("utf-8") + b":" + SALT.encode("utf-8")
    return hmac.new(key, message, hashlib.sha256).digest()


def _base32_key(identifier: str, length: int) -> str:
    digest = _derive_digest(identifier)
    needed_bytes = (length * 5 + 7) // 8  # base32 encodes 5 bits per char
    dk = digest if needed_bytes <= len(digest) else hashlib.pbkdf2_hmac(
        "sha256",
        identifier.encode("utf-8"),
        (PASSWORD + SALT).encode("utf-8"),
        100_000,
        dklen=needed_bytes,
    )
    return base64.b32encode(dk).decode("utf-8").rstrip("=")[:length]


def format_key(raw_key: str, group_size: int, separator: str) -> str:
    groups = [raw_key[i : i + group_size] for i in range(0, len(raw_key), group_size)]
    return separator.join(groups)


@dataclass(frozen=True)
class KeySpec:
    length: int = DEFAULT_LENGTH
    group_size: int = DEFAULT_GROUP_SIZE
    separator: str = DEFAULT_SEPARATOR


def generate_key(identifier: str, spec: KeySpec = KeySpec()) -> str:
    raw = _base32_key(identifier, spec.length)
    return format_key(raw, spec.group_size, spec.separator)


def validate_key(identifier: str, candidate: str, spec: KeySpec = KeySpec()) -> bool:
    expected_raw = _base32_key(identifier, spec.length)
    normalized_candidate = candidate.replace(spec.separator, "").upper()
    return hmac.compare_digest(expected_raw, normalized_candidate)


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)

    def add_spec_arguments(subparser: argparse.ArgumentParser) -> None:
        subparser.add_argument("identifier", help="Identifier used for the key")
        subparser.add_argument(
            "--length",
            type=int,
            default=DEFAULT_LENGTH,
            help=f"Length of the generated key in characters (default {DEFAULT_LENGTH})",
        )
        subparser.add_argument(
            "--group-size",
            type=int,
            default=DEFAULT_GROUP_SIZE,
            help=f"Number of characters per group (default {DEFAULT_GROUP_SIZE})",
        )
        subparser.add_argument(
            "--separator",
            default=DEFAULT_SEPARATOR,
            help=f"Separator between groups (default '{DEFAULT_SEPARATOR}')",
        )

    gen_parser = subparsers.add_parser("generate", help="Generate a license key")
    add_spec_arguments(gen_parser)

    val_parser = subparsers.add_parser("validate", help="Validate a license key")
    add_spec_arguments(val_parser)
    val_parser.add_argument("key", help="Key to validate")

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)

    spec = KeySpec(length=args.length, group_size=args.group_size, separator=args.separator)

    if args.command == "generate":
        print(generate_key(args.identifier, spec))
        return 0
    if args.command == "validate":
        if validate_key(args.identifier, args.key, spec):
            print("VALID")
            return 0
        print("INVALID")
        return 1

    parser.error("Unknown command")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
