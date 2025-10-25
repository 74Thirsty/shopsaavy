![Sheen Banner](https://raw.githubusercontent.com/74Thirsty/74Thirsty/main/assets/shopsaavy.svg)


Shop Saavy is a full-stack retail showcase that pairs a modern React + Tailwind storefront with a password-protected administration workspace. Store operators can manage inventory, edit landing page content, and now control the live site name without touching code or redeploying servers.

## Key Features

- **Live site identity controls** – Update the site name from the admin panel and have it persist to `.env`, refresh `process.env`, and render across the app instantly.
- **Layout and theme personalization** – Choose between storefront layouts and cycle through light, dark, and auto themes directly from the Site Settings panel with instant preview and local persistence.
- **Product management dashboard** – Browse, create, update, and delete products with inline editing and modal workflows backed by SQLite.
- **Content editing experience** – Tune hero copy, spotlight sections, and call-to-action links with field validation and preview-friendly tooling.
- **API-first backend** – Express routes expose REST endpoints for storefront queries and authenticated admin actions.
- **Production-ready build** – Vite-powered frontend bundling, static asset serving from Express, and portable configuration for cloud hosts.

## Architecture Overview

| Layer     | Technology                         | Highlights |
|-----------|------------------------------------|------------|
| Frontend  | React 18, Vite, Tailwind CSS       | Context providers manage products, site content, and site settings while React Router powers navigation. |
| Backend   | Node.js (Express), SQLite, dotenv  | REST API with environment-driven configuration, `.env` mutation utility, and admin password guardrails. |
| Tooling   | Concurrent dev scripts, Nodemon    | `npm run dev` boots both servers with proxying and live reload support. |

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Configure environment variables**
   - Duplicate `.env.example` into `.env`.
   - Provide values for:
     ```ini
     ADMIN_PASSWORD=changeme
     SITE_NAME=SaavyShop Demo
     PORT=5000
     LICENSE_KEY=YOUR-LICENSE-KEY
     ```
   - Replace `YOUR-LICENSE-KEY` with the key issued by the Shop Saavy licensing portal or your account representative. You can
     rotate keys at any time—restart the server after updating the value.
   - The `SITE_NAME` value is automatically maintained when you update it through the admin interface; manual edits are optional.
   - See [License Configuration](#license-configuration) for additional storage, offline validation, and troubleshooting options.
3. **Launch the development servers**
   ```bash
   npm run dev
   ```
   The script starts the Express API on port 5000 and the Vite dev server on port 5173 with API requests proxied to the backend.
   If port `5000` is already taken locally, the server logs a clear message and exits—set the `PORT` variable in `.env` to any
   open port and restart the command.
4. **Build for production**
   ```bash
   npm run build
   ```
   The optimized frontend output is emitted to `client/dist` and can be served by the Express app via `npm start`.

## Administration Workflow

- Navigate to `/admin` and authenticate using the `ADMIN_PASSWORD`. Credentials are exchanged via the `x-admin-password` header for protected endpoints.
- Manage catalog entries in the dashboard with inline edits or modal dialogs. All changes persist to the SQLite database.
- Update the storefront branding and appearance in the **Site Settings** panel. Managing the site name:
  - Validates the input.
  - Calls `PUT /api/admin/site-config` with the admin password.
  - Writes the updated value to `.env`, refreshes `process.env.SITE_NAME`, and broadcasts the new name to the UI via context.
- Adjust the storefront layout and theme:
  - Selections are stored in localStorage for persistence across sessions.
  - The layout selector and theme toggle provide immediate visual feedback by updating body attributes and status messaging.
- Edit homepage messaging in the **Site Content** editor. Changes are stored server-side for immediate storefront updates.

## API Reference

| Method | Route                     | Description                               | Auth Required |
|--------|---------------------------|-------------------------------------------|---------------|
| GET    | `/api/health`             | Health check with current site name.      | No            |
| GET    | `/api/config`             | Fetch runtime site configuration.         | No            |
| GET    | `/api/products`           | List products with optional filters.      | No            |
| GET    | `/api/products/:id`       | Retrieve a single product.                | No            |
| POST   | `/api/products`           | Create a product.                         | Yes           |
| PUT    | `/api/products/:id`       | Update a product.                         | Yes           |
| DELETE | `/api/products/:id`       | Delete a product.                         | Yes           |
| GET    | `/api/site-content`       | Read homepage content configuration.      | No            |
| PUT    | `/api/site-content`       | Update homepage content.                  | Yes           |
| POST   | `/api/admin/verify`       | Validate admin password.                  | Yes           |
| PUT    | `/api/admin/site-config`  | Persist and broadcast the site name.      | Yes           |

> **Authentication** – Authenticated routes require the `x-admin-password` header value to match `ADMIN_PASSWORD`.

## Project Structure

```
.
├── client/                # React storefront and admin panel
│   ├── index.html
│   └── src/
│       ├── components/    # Shared UI and admin modules
│       ├── context/       # React contexts for products, content, site settings
│       ├── hooks/         # Custom hooks (admin auth, etc.)
│       └── pages/         # Route-level components
├── server/                # Express API, SQLite helpers, env utilities
│   ├── index.js
│   └── lib/
│       ├── db.js
│       └── updateEnv.js
├── data/                  # Generated SQLite database
├── .env.example
└── README.md
```

## Documentation

- [User Guide](./docs/USER_GUIDE.md) – Step-by-step walkthrough for operators, administrators, and customers covering storefront browsing, order processing, and checkout integrations.

## Deployment Notes

1. Run `npm run build` to generate production-ready frontend assets.
2. Ensure the `.env` file (or host-level environment variables) includes `ADMIN_PASSWORD`, `SITE_NAME`, and `PORT` as desired.
3. Start the server with `npm start`; Express serves both the API and static frontend from `client/dist`.
4. Site name changes performed in production automatically persist to the `.env` file and refresh the live process without restarts.

## License

This project is available under the [Private License](./LICENSE.md).

## License Configuration

Shop Saavy requires a valid license key before the application will launch. The runtime pulls configuration from environment
variables, optional keyring entries, or local license files. Follow these steps to make sure your instance activates correctly:

1. **Generate or retrieve your key** – Sign in to the Shop Saavy Licensing Console (`https://portal.licenseserver.com`) with an
   account that has the *License Manager* role.
   - From the **Licenses → Issue License** screen pick the product tier (Personal or Business), the maximum instance count, and
     the expiry date. The console produces a 25-character key and emails a copy to the assignee. You can reissue keys at any
     time from the same view.
   - Prefer automation? Use the issuance API instead of the UI:
     ```bash
     curl -X POST https://api.licenseserver.com/v1/licenses \
       -H "Authorization: Bearer <ADMIN_TOKEN>" \
       -H "Content-Type: application/json" \
       -d '{
         "product": "shop-saavy",
         "plan": "business",
         "seats": 1,
         "expires_at": "2025-12-31T23:59:59Z"
       }'
     ```
     The response includes `license_key`, `expires_at`, and `status`. Copy `license_key` into your environment configuration.
2. **Store the key securely** – The application reads the key in this order:
   - `LICENSE_KEY` environment variable (recommended; add it to `.env` for local development or provision it via your hosting
     provider's secret manager).
   - System keyring entry: service `shopsaavy`, account `license_key`.
   - License file at `~/.license_key` or `~/.config/shopsaavy/license_key` containing the raw key value.
3. **Validate the key** – Run the CLI helper to confirm activation before starting the app:
   ```bash
   python -m src.core.license_cli validate
   ```
   A JSON payload prints to the console. If validation fails, the response includes an error message and the key will not be
   cached.
4. **Understand offline behaviour** – Successful validation caches a signed payload to `~/.app_cache/license.json` and
   `~/.app_cache/license.key` (override via `LICENSE_CACHE_PATH` and `LICENSE_LOCAL_KEY_PATH`). When the license server is
   unreachable, the cache is accepted for 24 hours from the last validation or until the embedded expiry timestamp lapses.
5. **Review logs** – All license events are written to `/logs/license.log` by default (override with `LICENSE_LOG_PATH`). Check
   this file if the app exits with `[LICENSE ERROR]` to see detailed diagnostics.

> **Tip:** In containerized or PaaS deployments, mount a writable directory for the cache path so the instance can persist
> offline tokens between restarts.

For deeper operational guidance—including automated renewal workflows, revocation procedures, and license visibility inside the
admin panel—see the [License Configuration Guide](./docs/LICENSE_CONFIGURATION.md) and the wiki article
[`docs/wiki/LICENSING_WIKI.md`](./docs/wiki/LICENSING_WIKI.md).

[![Video Title](https://img.youtube.com/vi/8F2M70TRTv0/maxresdefault.jpg)](https://www.youtube.com/watch?v=8F2M70TRTv0)

---

