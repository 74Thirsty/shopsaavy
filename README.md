# SaavyShop Demo

A full-stack retail demonstration website showcasing a modern React + Tailwind storefront paired with a no-code admin panel. The project includes a SQLite-powered API so clients can manage catalog data without touching code.

## Features

- **Dynamic storefront** with hero, featured products, and a dedicated shop page with filters.
- **Product detail view** featuring gallery, pricing, and related items.
- **Protected admin workspace** with password login, inline editing, modals, and deletion confirmations.
- **REST API** (`/api/products`) backed by SQLite for CRUD operations.
- **Deployment ready** for platforms like Vercel or Render with minimal configuration.

## Tech Stack

- Frontend: React 18, Vite, Tailwind CSS
- Backend: Node.js (Express), SQLite
- State management: React Context + custom hooks

## Getting Started

```bash
npm install
npm run dev
```

The `dev` script launches both the Express API (port 5000) and the Vite dev server (port 5173) with API requests proxied to the backend.

### Environment Variables

Duplicate `.env.example` and rename it to `.env` in the project root to provide environment values (the server will also read it when started from the `server/` directory):

```
ADMIN_PASSWORD=changeme
SITE_NAME=SaavyShop Demo
PORT=5000
```

`ADMIN_PASSWORD` secures the admin panel. The frontend sends it via the `x-admin-password` header for create, update, and delete operations.

## Available Scripts

- `npm run dev` – Run backend + frontend concurrently in development.
- `npm run build` – Generate the production frontend build (`client/dist`).
- `npm start` – Start the Express server. In production the server serves the built frontend and API.

## Project Structure

```
.
├── client/                # React + Tailwind storefront and admin panel
│   ├── index.html
│   └── src/
│       ├── components/
│       ├── context/
│       ├── hooks/
│       └── pages/
├── server/                # Express API and SQLite integration
│   ├── index.js
│   └── lib/db.js
├── data/                  # SQLite database file (generated at runtime)
├── .env.example
└── README.md
```

## API Overview

| Method | Route                | Description              | Auth |
| ------ | -------------------- | ------------------------ | ---- |
| GET    | `/api/products`      | List products            | No   |
| GET    | `/api/products/:id`  | Fetch product by ID      | No   |
| POST   | `/api/products`      | Create new product       | Yes  |
| PUT    | `/api/products/:id`  | Update existing product  | Yes  |
| DELETE | `/api/products/:id`  | Delete a product         | Yes  |
| POST   | `/api/admin/verify`  | Validate admin password  | Yes  |

Authentication requires the `x-admin-password` header to match `ADMIN_PASSWORD`.

## Deployment Notes

1. Run `npm run build` to produce the optimized frontend assets.
2. Deploy the project to your platform of choice (e.g., Render, Railway, or any Node-compatible host).
3. Ensure the build output (`client/dist`) is available before starting the server (`npm start`).
4. Configure the `ADMIN_PASSWORD` and `SITE_NAME` environment variables in your hosting provider.

## Bonus Ideas

Consider extending the demo with:

- Theme toggles (light/dark mode)
- Inventory quantity tracking
- CSV import/export for product catalogs
- Drag-and-drop image uploads with compression

Enjoy showcasing SaavyShop!
