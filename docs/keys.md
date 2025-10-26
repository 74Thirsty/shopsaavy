Overview
ShopSaavy now validates licenses entirely offline using Ed25519-signed tokens that you issue yourself. The app ships only with the public key and verifies customer tokens locally, so no external licensing service is required.

Prerequisites
Install the cryptography package on any machine that will generate keys or verify tokens, since both the tooling and runtime depend on it.

One-time key generation
Run python tools/make_keys.py on a secure machine to create license_private.pem (keep this secret) and license_public.pem (embed with the app). Regenerate and reissue licenses if the private key is ever compromised.

Creating customer licenses
Use the offline generator whenever you need a new license:
python tools/gen_license.py --id "<customer_or_device>" --product "ShopSaavy" --version "1.0.0" --days 365
It emits both a raw BASE64URL.BASE64URL token and a grouped Base32 version for manual entry. The payload encodes identifier, product, version, and expiry timestamp in a canonical string before signing.

Shipping the public key
Place license_public.pem where the Python runtime can read it. By default the code looks for src/core/license_public.pem, but you can override the location via LICENSE_PUBLIC_KEY_PATH. Optional environment variables LICENSE_PRODUCT and LICENSE_VERSION let you pin what the app expects during validation.

Supplying the license token
At startup the LicenseManager searches in priority order:

LICENSE_TOKEN / LICENSE_KEY environment variables (use .env or your secrets manager).

System keyring entry service=shopsaavy, account=license_key.

Token files such as ~/.license_token, ~/.license_key, or ~/.config/shopsaavy/license_token.
Both raw and Base32-grouped tokens are accepted; the verifier normalizes Base32 inputs automatically.

Validating before launch
Run the CLI helper to check the current token against the embedded public key:
python -m src.core.license_cli validate
Successful runs return {"valid": true, ...}; failures include an error reason. To inspect the last known status without re-verifying, run python -m src.core.license_cli status. These commands rely on LicenseManager to load the token, verify it, and report status details.

Runtime behavior and logging
During validation the manager normalizes the token, verifies the Ed25519 signature, checks expiry, and records success or failure. Logs live at /logs/license.log by default (override with LICENSE_LOG_PATH) and include timestamps plus an obfuscated tail of the token for auditing.

Troubleshooting tips
Common failure messages correspond to specific fixes—missing tokens, signature mismatches, product/version mismatches, expired licenses, or absent public keys. Refer to the troubleshooting table to decide whether to regenerate a license, adjust environment expectations, or ship the correct public key file.

With a valid token confirmed, start ShopSaavy using your usual development or production commands.
