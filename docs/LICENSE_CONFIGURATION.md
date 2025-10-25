# License Configuration Guide

This guide explains how to activate Shop Saavy with your commercial license key, manage offline validation, and troubleshoot
common setup issues.

## 1. Obtain or Generate Your License Key

1. Sign in to the Shop Saavy licensing portal at `https://portal.licenseserver.com` using an account with the **License Manager** role.
2. Navigate to **Licenses → Issue License** and choose the appropriate plan (Personal or Business), seat count, and expiry date.
3. Click **Generate License**. The portal returns a 25-character key and emails a copy to the assignee.
4. Automating provisioning? Call the issuance API instead of the UI:
   ```bash
   curl -X POST https://api.licenseserver.com/v1/licenses \
     -H "Authorization: Bearer ${ADMIN_TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{
       "product": "shop-saavy",
       "plan": "business",
       "seats": 1,
       "expires_at": "2025-12-31T23:59:59Z"
     }'
   ```
   The response includes `license_key`, `status`, and `expires_at`. Save the `license_key` in your secrets manager and continue to the next step.
5. If you cannot reach the portal or API, email `support@licenseserver.com` to have the key issued manually.

## 2. Provide the License to the Application

The runtime checks for a license key in multiple secure locations. Supply the key using whichever option best fits your
infrastructure:

| Priority | Source | Instructions |
| --- | --- | --- |
| 1 | `LICENSE_KEY` environment variable | Add `LICENSE_KEY=YOUR-LICENSE-KEY` to `.env` for local development or provision it through your host's secret manager. |
| 2 | System keyring | Store the key with service `shopsaavy` and account `license_key`. The Python `keyring` backend must be available on the host. |
| 3 | License file | Save the raw key to `~/.license_key` or `~/.config/shopsaavy/license_key`. Ensure file permissions restrict access to the service user. |

You can change the key at any time. Restart the application after rotating keys so the new value is loaded into memory.

## 3. Validate the License

Before launching the full stack, validate that the key is accepted by the licensing service:

```bash
python -m src.core.license_cli validate
```

The command prints a JSON payload. A successful response includes `{"valid": true, ...}`. If validation fails, the output
contains `"error"` and an explanatory message. Resolve the issue, update your key, and run the command again until it succeeds.

To check the most recent validation result without pinging the server, run:

```bash
python -m src.core.license_cli status
```

## 4. Offline and Caching Behaviour

- Successful validations are cached for 24 hours in `~/.app_cache/license.json`. The same payload is mirrored to
  `~/.app_cache/license.key` so the application can validate while offline.
- Override these paths with `LICENSE_CACHE_PATH` and `LICENSE_LOCAL_KEY_PATH` if you prefer a custom directory. Ensure the
  process user has read/write access.
- The cached file includes an expiry timestamp. If the timestamp has passed or the cache is older than 24 hours, the
  application will re-contact the license server.

## 5. Logging

License operations are recorded in `/logs/license.log` by default. Set `LICENSE_LOG_PATH` to move the log file to another
location. Review this log whenever the application exits with `[LICENSE ERROR]`—it contains the precise validation stage and an
obfuscated view of the key used.

## 6. Troubleshooting Checklist

| Symptom | Resolution |
| --- | --- |
| `No license key provided.` | Confirm the key is present in one of the supported storage locations and restart the app. |
| `Invalid license.` | Double-check that the key matches the value issued in the portal. Typos and expired keys trigger this response. |
| `License expired.` | Renew your license or contact support to extend the expiry date. |
| `Offline validation unavailable.` | Connect to the internet at least once to perform a successful validation so the cache file can be written. |
| No log file created | Ensure the directory containing `LICENSE_LOG_PATH` exists and is writable by the process user. |

For rotation, revocation, and automation playbooks see the in-repo wiki article at [`docs/wiki/LICENSING_WIKI.md`](./wiki/LICENSING_WIKI.md).

With a valid license in place, you can start Shop Saavy using the normal `npm run dev` or production startup commands.
