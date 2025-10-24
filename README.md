# Shop Saavy Demo

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
     ```
   - The `SITE_NAME` value is automatically maintained when you update it through the admin interface; manual edits are optional.
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

## Deployment Notes

1. Run `npm run build` to generate production-ready frontend assets.
2. Ensure the `.env` file (or host-level environment variables) includes `ADMIN_PASSWORD`, `SITE_NAME`, and `PORT` as desired.
3. Start the server with `npm start`; Express serves both the API and static frontend from `client/dist`.
4. Site name changes performed in production automatically persist to the `.env` file and refresh the live process without restarts.

## License

This project is available under the [Private License](./LICENSE.md).
