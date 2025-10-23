"""Utility script for registering a local product license key."""
from __future__ import annotations

from pathlib import Path

LICENSE_PATH = Path(__file__).resolve().parents[1] / '.license'


def main() -> None:
    try:
        key = input('Enter product key: ').strip()
    except KeyboardInterrupt:
        print('\nOperation cancelled.')
        return

    if not key:
        print('No product key entered. Nothing was saved.')
        return

    LICENSE_PATH.write_text(key, encoding='utf-8')
    print('✅ Product key saved. Restart the app.')


if __name__ == '__main__':
    main()
