"""Application bootstrap module with license validation."""

from __future__ import annotations

import sys

from core.license_manager import LicenseManager, LicenseValidationError


def bootstrap_application() -> None:
    """Placeholder for the application's bootstrap routine."""
    # Existing bootstrap logic should remain untouched.
    pass


def main() -> None:
    """Entry point for launching the application."""
    try:
        manager = LicenseManager()
        if not manager.validate_license():  # Defensive; validate_license raises on failure.
            raise LicenseValidationError("Invalid or expired license.")
    except LicenseValidationError as exc:
        print(f"[LICENSE ERROR] {exc}")
        sys.exit(1)

    bootstrap_application()


if __name__ == "__main__":
    main()
