#!/usr/bin/env python3
"""
Interactive product key generator + validator.

Run: python3 keygen_interactive.py

Features:
 - Interactive menu (generate | validate | quit)
 - Secure password entry (getpass)
 - Optional salt, length, group-size, separator
 - Deterministic HMAC-SHA256-based key derivation (same parameters -> same key)
 - Constant-time comparison for validation
"""

import base64
import hashlib
import hmac
import sys
from getpass import getpass
from typing import Optional


DEFAULT_LENGTH = 20
DEFAULT_GROUP_SIZE = 5
DEFAULT_SEPARATOR = "-"


def _hmac_sha256(password: str, identifier: str, salt: Optional[str] = None) -> bytes:
    key = password.encode("utf-8")
    msg = identifier.encode("utf-8")
    if salt:
        msg += b":" + salt.encode("utf-8")
    return hmac.new(key, msg, hashlib.sha256).digest()


def make_key(password: str, identifier: str, salt: Optional[str] = None, out_length: int = DEFAULT_LENGTH) -> str:
    if out_length <= 0:
        raise ValueError("out_length must be > 0")

    digest = _hmac_sha256(password, identifier, salt)
    needed_bytes = (out_length * 5 + 7) // 8  # base32 encodes 5 bits/char
    if needed_bytes > len(digest):
        dk = hashlib.pbkdf2_hmac("sha256", identifier.encode("utf-8"),
                                 (password + (salt or "")).encode("utf-8"),
                                 100_000, dklen=needed_bytes)
    else:
        dk = digest[:needed_bytes]

    b32 = base64.b32encode(dk).decode("utf-8").rstrip("=")
    return b32[:out_length]


def format_key(raw: str, group_size: int = DEFAULT_GROUP_SIZE, separator: str = DEFAULT_SEPARATOR) -> str:
    parts = [raw[i:i+group_size] for i in range(0, len(raw), group_size)]
    return separator.join(parts)


def generate_interactive():
    print("\n--- GENERATE MODE ---")
    password = getpass("Enter secret password (will be hidden): ").strip()
    if password == "":
        print("Password cannot be empty.")
        return

    identifier = input("Identifier (email / machine id / GLOBAL / whatever): ").strip()
    if identifier == "":
        print("Identifier cannot be empty.")
        return

    salt = input("Optional salt (press Enter to skip): ").strip() or None

    try:
        length_raw = input(f"Key length in Base32 chars [{DEFAULT_LENGTH}]: ").strip()
        length = int(length_raw) if length_raw else DEFAULT_LENGTH
    except ValueError:
        print("Invalid length. Using default.")
        length = DEFAULT_LENGTH

    try:
        group_raw = input(f"Group size for dashes [{DEFAULT_GROUP_SIZE}]: ").strip()
        group_size = int(group_raw) if group_raw else DEFAULT_GROUP_SIZE
    except ValueError:
        print("Invalid group size. Using default.")
        group_size = DEFAULT_GROUP_SIZE

    sep = input(f"Group separator [{DEFAULT_SEPARATOR}]: ").strip()
    separator = sep if sep else DEFAULT_SEPARATOR

    raw = make_key(password, identifier, salt, out_length=length)
    formatted = format_key(raw, group_size=group_size, separator=separator)
    print("\nGenerated key:")
    print(formatted)
    print("--- Done ---\n")


def validate_interactive():
    print("\n--- VALIDATE MODE ---")
    password = getpass("Enter secret password (will be hidden): ").strip()
    if password == "":
        print("Password cannot be empty.")
        return

    identifier = input("Identifier used when generating the key: ").strip()
    if identifier == "":
        print("Identifier cannot be empty.")
        return

    candidate = input("Candidate product key (paste here): ").strip()
    if candidate == "":
        print("No key provided.")
        return

    salt = input("Optional salt used when generating (press Enter to skip): ").strip() or None

    try:
        length_raw = input(f"Key length in Base32 chars used during generation [{DEFAULT_LENGTH}]: ").strip()
        length = int(length_raw) if length_raw else DEFAULT_LENGTH
    except ValueError:
        print("Invalid length. Using default.")
        length = DEFAULT_LENGTH

    try:
        group_raw = input(f"Group size used during generation [{DEFAULT_GROUP_SIZE}]: ").strip()
        group_size = int(group_raw) if group_raw else DEFAULT_GROUP_SIZE
    except ValueError:
        print("Invalid group size. Using default.")
        group_size = DEFAULT_GROUP_SIZE

    sep = input(f"Group separator used during generation [{DEFAULT_SEPARATOR}]: ").strip()
    separator = sep if sep else DEFAULT_SEPARATOR

    normalized_candidate = candidate.replace(separator, "").upper()
    expected_raw = make_key(password, identifier, salt, out_length=length)

    ok = hmac.compare_digest(normalized_candidate, expected_raw)
    print("\nResult: " + ("VALID" if ok else "INVALID"))
    print("--- Done ---\n")


def show_help():
    print("""
Interactive menu commands:
  g  or generate   -> Generate a new product key
  v  or validate   -> Validate an existing product key
  h  or help       -> Show this help text
  q  or quit       -> Exit
""")


def main_loop():
    print("Product Key Generator (interactive)")
    show_help()
    while True:
        cmd = input("Command (g/v/h/q): ").strip().lower()
        if cmd in ("g", "generate"):
            generate_interactive()
        elif cmd in ("v", "validate"):
            validate_interactive()
        elif cmd in ("h", "help"):
            show_help()
        elif cmd in ("q", "quit", "exit"):
            print("Goodbye.")
            break
        else:
            print("Unknown command. Type 'h' for help.")


if __name__ == "__main__":
    try:
        main_loop()
    except (KeyboardInterrupt, EOFError):
        print("\nExiting. Bye.")
        sys.exit(0)
