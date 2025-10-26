# Shop Saavy Licensing Wiki

This wiki entry consolidates everything administrators and engineers need to know about generating, distributing, and maintaining Shop Saavy license keys. Pair this document with `docs/LICENSE_CONFIGURATION.md` when onboarding new environments.

---

## 1. Vocabulary & System Components

| Term | Description |
| --- | --- |
| **Licensing Console** | The browser UI located at `https://portal.licenseserver.com` for human operators to issue keys. |
| **Licensing API** | REST service hosted at `https://api.licenseserver.com` that powers validation (`/validate`) and issuance (`/v1/licenses`). |
| **License Manager** | Python component in `src/core/license_manager.py` responsible for validation, caching, and logging inside Shop Saavy. |
| **Activation Cache** | JSON payload written to `~/.app_cache/license.json` (override with `LICENSE_CACHE_PATH`) used for offline validation. |
| **Local License Mirror** | Copy of the activation cache saved to `~/.app_cache/license.key` (override with `LICENSE_LOCAL_KEY_PATH`). |
| **Offline License Tool** | CLI shipped at `python -m src.core.license_tool` for generating and inspecting signed offline licenses. |

---

## 2. Issuing License Keys

### 2.1 Using the Licensing Console

1. Sign in to `https://portal.licenseserver.com` with an account that has the **License Manager** role.
2. Navigate to **Licenses → Issue License**.
3. Complete the form:
   - **Product:** `shop-saavy`
   - **Plan:** `personal` (single-user) or `business` (production deployment)
   - **Seats / Instances:** Number of simultaneous deployments allowed.
   - **Expiry:** UTC timestamp that aligns with the contract end date.
4. Click **Generate License**. The UI displays the 25-character key (format `XXXXX-XXXXX-XXXXX-XXXXX-XXXXX`) and emails a copy to the assignee.
5. Record the key in your password manager or the customer’s vault. You can revoke or regenerate the license from **Licenses → Active** at any time.

### 2.2 Automating Issuance with the API

Service accounts can automate licensing through the REST API. Example using `curl`:

```bash
curl -X POST https://api.licenseserver.com/v1/licenses \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "product": "shop-saavy",
    "plan": "business",
    "seats": 3,
    "expires_at": "2025-12-31T23:59:59Z",
    "metadata": {
      "customer": "Acme Holdings",
      "notes": "Primary production cluster"
    }
  }'
```

Successful responses look like:

```json
{
  "license_key": "AB12C-DE34F-GH56I-JK78L-MN90P",
  "status": "active",
  "expires_at": "2025-12-31T23:59:59Z",
  "created_at": "2024-04-11T15:08:31Z"
}
```

Store `license_key` securely. The API returns HTTP 409 if a duplicate active license exists for the same product + customer tuple.

> **Tip:** Use the optional `metadata` object to embed CRM IDs or invoice numbers—Shop Saavy never reads it, but it’s included in audit exports.

### 2.3 Generating Offline Licenses (no server)

For small-scale distribution without the hosted licensing stack, issue signed keys locally:

```bash
export LICENSE_SIGNING_SECRET="super-secret"
python -m src.core.license_tool generate "Customer Name" --plan personal --seats 1 --feature beta-dashboard
```

The tool prints a JSON blob that includes the `license_key` and the embedded payload. Share only the key with the customer. Keep
`LICENSE_SIGNING_SECRET` private and reuse it on every runtime that should accept the offline licenses you generate.

To audit or double-check an issued offline key later:

```bash
python -m src.core.license_tool inspect "SAOFF1-..." --signing-secret "$LICENSE_SIGNING_SECRET"
```

If the signature no longer matches (for example after editing the payload), the command exits with `Offline license signature mismatch.`

---

## 3. Distributing & Installing Keys

1. Prefer secret managers (`AWS Secrets Manager`, `Azure Key Vault`, `HashiCorp Vault`) to store the key.
2. In local development, duplicate `.env.example` and add `LICENSE_KEY=<value>`.
3. CI/CD pipelines should inject the key as an environment variable during deployment.
4. For air-gapped appliances, drop the key into `~/.license_key` and ensure only the service account can read it (`chmod 600`).
5. When using offline licenses, configure `LICENSE_SIGNING_SECRET` alongside `LICENSE_KEY` so the runtime can verify the signature without reaching the remote API.

---

## 4. Validation Lifecycle

- On every boot the backend runs `python -m src.core.license_cli validate`. Failure exits the Node.js process with `[LICENSE ERROR]`.
- Administrators can inspect the license inside **Admin → Site Settings → License** where the UI calls `/api/license/status` and `/api/license/revalidate`.
- Successful validations populate `valid`, `expiry`, and `license_key` (obfuscated) fields returned to the UI. If the key uses the offline signature format, the Python manager verifies the signature locally before consulting the hosted API.

### 4.1 Scheduled Revalidation

Even though cached activations last 24 hours, schedule a cron or CI job that runs the CLI nightly:

```bash
python -m src.core.license_cli validate >> /var/log/shopsaavy/license_cron.log 2>&1
```

If the command exits non-zero, alert the on-call engineer so they can rotate the key before production nodes restart.

---

## 5. Rotating & Revoking Licenses

### 5.1 Rotation Workflow

1. Issue a new key using the console or API.
2. Update the environment variable/secret across all deployments.
3. Run `python -m src.core.license_cli validate` to warm the cache.
4. Confirm the admin UI shows the new obfuscated key tail.
5. Revoke the old key from the console to prevent reuse.

### 5.2 Revocation

- From **Licenses → Active**, choose **Revoke**. The validation service immediately starts returning `{"valid": false, "message": "License revoked"}`.
- Shop Saavy writes the denial to `/logs/license.log` and the admin dashboard surfaces the failure in the License tab.

---

## 6. Troubleshooting Reference

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| `No license key provided.` | Missing environment variable or file. | Set `LICENSE_KEY`, restart, and revalidate. |
| `License expired.` | Expiry timestamp has passed. | Issue a new license with a future `expires_at` value. |
| `License key mismatch in local file.` | Cache contains a different key hash. | Delete cache files in `~/.app_cache` and revalidate with the correct key. |
| Admin UI shows `Unknown` status | Admin password missing in request headers. | Provide `x-admin-password` header matching `ADMIN_PASSWORD`. |
| CLI cannot reach licensing API | Network or firewall block. | Ensure outbound HTTPS access to `api.licenseserver.com` or provision an allow-list entry. |
| `Offline license signature mismatch.` | The key was altered or generated with a different secret. | Regenerate the license with `license_tool` and confirm the runtime uses the same `LICENSE_SIGNING_SECRET`. |
| `Offline validation unavailable.` | Missing cache and no signing secret configured. | Set `LICENSE_SIGNING_SECRET` or allow a one-time remote validation to seed the cache. |

---

## 7. Audit & Compliance Notes

- Every validation attempt is logged with timestamp and obfuscated key at `/logs/license.log`. Forward this file to your central logging platform for retention.
- The cache payload includes `validated_at`. Export the timestamps to satisfy auditors that validations occur at least once per 24-hour window.
- When operating in regulated environments, document who holds the `ADMIN_TOKEN` used for automated issuance.

---

## 8. Useful Commands

```bash
# Check the most recent validation result without calling the API
python -m src.core.license_cli status

# Force a revalidation and pretty-print the output
python -m src.core.license_cli validate | python -m json.tool

# Remove local cache (forces a fresh remote validation on next run)
rm ~/.app_cache/license.json ~/.app_cache/license.key

# Generate an offline license for manual distribution
python -m src.core.license_tool generate "Customer Name"

# Inspect the payload of an offline license and verify its signature
python -m src.core.license_tool inspect "SAOFF1-..."
```

Keep this wiki page in sync with vendor policy changes and portal updates. When in doubt, contact the licensing team at `support@licenseserver.com`.
