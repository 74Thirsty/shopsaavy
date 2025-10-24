# Shop Saavy User Guide

Welcome to the comprehensive user guide for the Shop Saavy demo storefront and administration suite. This document explains how storefront visitors, sales operators, and administrators can collaboratively run the experience from day one.

## Audience Overview

| Role | Primary Goals |
| --- | --- |
| Shoppers | Browse the catalog, learn about highlighted products, and complete purchases using the checkout option that fits their needs. |
| Sales Operators | Track new orders, coordinate with customers after a checkout form submission, and keep product listings accurate. |
| Administrators | Configure site identity, homepage content, checkout integrations, and data backups without touching source code. |

## Quick Start Checklist

1. **Install and configure the application** using the root-level [README](../README.md) instructions.
2. **Create administrative credentials** by setting the `ADMIN_PASSWORD` value in `.env`.
3. **Launch the dev or production server** with `npm run dev` (development) or `npm start` (after `npm run build`).
4. **Load the storefront** at `http://localhost:5173/` (development) or your deployed hostname.
5. **Open the administration workspace** at `http://localhost:5173/admin` and authenticate with the configured password.

## Storefront Experience

### Navigating the Catalog

- The landing page surfaces hero messaging, featured spotlights, and the full product grid.
- Use navigation links to switch between the homepage, checkout hub, and any other configured pages.
- Product cards display images, pricing, and concise descriptions pulled from the SQLite-backed catalog.
- Selecting a product reveals detailed information, enabling sales staff to answer questions quickly.

### Checkout Hub

The **Checkout** route consolidates every order placement path:

- **Secure Checkout** – The primary destination for production-ready payments. Configure it with a PCI-compliant processor (Stripe Checkout, Square, etc.) and the storefront renders a prominent "Continue to Secure Checkout" button.
- **Google Forms Order Form** – Ideal for cost-sensitive teams. The page embeds your published Google Form so shoppers can submit order requests without leaving the site.
- **Microsoft Forms Order Form** – Offers the same low-cost workflow for Microsoft 365 tenants. The embed adapts automatically to your form URL.

Each integration is optional. When a link is not configured, the UI hides the corresponding section to maintain a clean presentation.

## Administration Workspace

### Signing In

1. Navigate to `/admin`.
2. Enter the administrator password configured in `.env` when prompted.
3. Upon success, the dashboard loads site settings, content, products, and checkout configuration data.

All authenticated API requests include the `x-admin-password` header. Use secure transport (HTTPS) in production.

### Managing Products

- **View Inventory** – Scroll through the product list, which reads directly from the SQLite database.
- **Create** – Click the *Add Product* button, complete the form, and save to publish instantly.
- **Edit** – Open a product row, adjust fields inline or via modal dialogs, and save changes to persist them.
- **Delete** – Remove discontinued items to keep the storefront current.

### Updating Site Identity & Theme

The **Site Settings** panel lets you:

- Change the site name. Updates propagate to `.env`, refresh `process.env.SITE_NAME`, and update the storefront header live.
- Switch between layout styles and light/dark/auto themes. Preferences persist in local storage for the current administrator.

### Editing Homepage Content

Use the **Site Content** editor to fine-tune hero headings, spotlight blurbs, and call-to-action links. Saved updates immediately reach the live storefront so customers see the latest messaging without a redeploy.

### Configuring Checkout Integrations

The **Checkout Integrations** panel powers the checkout hub experience:

1. **Secure Checkout URL**
   - Enter the hosted payment page or ecommerce processor link you want to highlight.
   - Provide a short label to appear on the call-to-action button (e.g., "Pay with Stripe").
   - Save the changes to update the storefront checkout hub instantly.
2. **Google Forms Link**
   - Paste the published Google Form URL or embed link.
   - Optionally craft helper text that clarifies how orders will be processed once the form is submitted.
3. **Microsoft Forms Link**
   - Paste the published Microsoft Form URL.
   - Supply helper text to guide customers through any follow-up steps.

> **Tip:** The admin dashboard validates required fields before persisting updates. Empty URLs disable the corresponding sections on the checkout hub, ensuring shoppers only see live options.

### Monitoring Form Submissions

- Review incoming responses within Google Forms or Microsoft Forms dashboards.
- Export CSV spreadsheets or enable email notifications to alert your sales team.
- After a submission, update the product inventory or order status within your internal systems.

## Data & Maintenance

- **Database Location** – The SQLite database file lives in the `data/` directory. Back it up regularly when running in production.
- **Environment Configuration** – When `SITE_NAME` is changed in the admin UI, the server rewrites `.env` and reloads environment variables on the fly.
- **Server Logs** – Run the server with `npm run dev` (development) or `npm start` (production) to stream logs for troubleshooting.

## Troubleshooting

| Symptom | Resolution |
| --- | --- |
| Cannot log into admin area | Verify the `ADMIN_PASSWORD` in `.env` matches the credential entered in the UI and restart the server if the environment file changed manually. |
| Secure checkout button missing | Ensure a secure checkout URL is saved in the Checkout Integrations panel. Empty values hide the button by design. |
| Embedded form not rendering | Confirm the Google or Microsoft form is published for sharing and the URL uses HTTPS. Some organization-level sharing restrictions can block the iframe. |
| Site name not updating | Check server logs for permission issues writing to `.env`. In production, ensure the process user can modify the file. |

## Additional Resources

- [README](../README.md) – Architecture overview, API reference, and deployment notes.
- [LICENSE](../LICENSE.md) – Licensing details for using or extending the demo.

With these tools in place, your team can operate a secure checkout workflow while offering low-cost alternatives for budget-conscious customers.
