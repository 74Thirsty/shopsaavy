# License provisioning and validation

Shop Saavy now uses offline, signed license tokens. Licenses are generated and
issued by you (the vendor) using a private Ed25519 key. The application ships
with the corresponding public key so it can validate licenses without contacting
an external service.

You will need the [`cryptography`](https://cryptography.io) package installed on
any machine that generates or verifies licenses:

```bash
pip install cryptography
```

## 1. Generate the signing keypair (one-time)

Run the helper script once on a secure machine to create the Ed25519 keypair:

```bash
python tools/make_keys.py
```

This writes two files in the current directory:

- `license_private.pem` – the private signing key. Store it securely and keep it
offline whenever possible.
- `license_public.pem` – the public verification key. Check this file into the
application or deliver it alongside your binaries.

If the private key is ever compromised, generate a new keypair and re-issue
licenses signed with the replacement key.

## 2. Create license tokens

Use the offline generator to sign payloads for customers:

```bash
python tools/gen_license.py --id "John_Smith" --product "ShopSaavy" --version "1.0.0" --days 365
```

The script outputs both the raw token (`BASE64URL.BASE64URL`) and a human-
readable Base32 variant suitable for manual entry. Only distribute the token to
your customer; never ship the private key.

Token payloads contain four fields separated by `|`:

1. Identifier – a user, tenant, or device identifier.
2. Product – used to prevent cross-product reuse.
3. Version – used to gate major releases.
4. Expiry – a Unix timestamp (`time.time()` style seconds).

## 3. Bundle the public key with the app

Place the public key PEM file somewhere accessible to the Python runtime. By
default the application expects the key at `src/core/license_public.pem`. To use
a custom path, set the `LICENSE_PUBLIC_KEY_PATH` environment variable.

You can also set optional expectations so the runtime rejects tokens for the
wrong product or release channel:

- `LICENSE_PRODUCT`
- `LICENSE_VERSION`

## 4. Provide the license token at runtime

The application looks for the token (re-using the existing locations from the
previous system):

| Priority | Source | Instructions |
| --- | --- | --- |
| 1 | `LICENSE_TOKEN` or `LICENSE_KEY` environment variable | Store the token in `.env` for local development or inject it via your secret manager. |
| 2 | System keyring | Save the token with service `shopsaavy` and account `license_key`. The Python `keyring` backend must be available on the host. |
| 3 | Token file | Save the token to `~/.license_token` (preferred) or to the legacy paths `~/.license_key` / `~/.config/shopsaavy/license_key`. |

Tokens can be supplied in raw form or as the Base32 grouped representation
(either is accepted by the verifier).

## 5. Validate the token locally

Before launching the full stack, verify the token matches the embedded public
key:

```bash
python -m src.core.license_cli validate
```

The command prints a JSON payload. A successful response includes
`{"valid": true, ...}`. On failure the payload contains `"error"` with the
reason. Fix the issue and run the command again until validation succeeds.

To inspect the last known status without re-running verification, execute:

```bash
python -m src.core.license_cli status
```

## 6. Logging

Validation attempts are recorded in `/logs/license.log` by default. Override the
location with the `LICENSE_LOG_PATH` environment variable. Log entries include
timestamps and an obfuscated view of the supplied token.

## 7. Troubleshooting

| Symptom | Resolution |
| --- | --- |
| `No license token provided.` | Ensure the token is present in one of the supported storage locations. |
| `Invalid license signature.` | Confirm the token was generated using the private key that matches the embedded public key. |
| `License product mismatch.` | Re-issue the token with a matching `--product` value or adjust `LICENSE_PRODUCT`. |
| `License version mismatch.` | Re-issue the token with a matching `--version` value or adjust `LICENSE_VERSION`. |
| `License expired.` | Generate a replacement token with a later expiry. |
| `License public key not found at ...` | Ship the public key with the application or point `LICENSE_PUBLIC_KEY_PATH` at the installed PEM file. |

With a valid token in place, start Shop Saavy using the usual `npm run dev` or
production commands.
