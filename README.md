# Grid

A self-hosted Homer-style grid built with Next.js, SQLite, and a web-based admin UI.

## Features

- Public dashboard with categories, service cards, icons, and live status dots.
- First-run admin setup with secure password hashing and cookie sessions.
- Admin UI for categories, items, ordering, theme, background, custom icons, health checks, and optional health alerts.
- SQLite-backed configuration and health history.
- Built-in SVG icon set plus persistent uploaded icons.
- Per-item latency and uptime charts.
- Single Docker container with `/data` persistence.

## Local Development

```bash
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open `http://localhost:3000`. The first visit to `/admin` redirects to first-run setup.

## Health alert notifications

Alerts are **per item**: in the admin item editor, enable **Notify when this health check fails or recovers**. Delivery options are configured under **Health alerts** on the admin dashboard.

- Notifications fire on **status transitions** (for example from online to offline), not on every failed poll while already down. Optionally enable **recover** alerts when a service comes back online.
- **Webhook**: `POST` with `Content-Type: application/json` to the URL you configure (`http` or `https`). Body fields:
  - `event`: `"health_failure"` or `"health_recovery"`
  - `itemId`, `title`, `serviceUrl`, `healthCheckUrl` (nullable), `checkedAt` (ISO string), `status`, `statusCode`, `errorMessage`, `dashboardTitle`
- **Email** (optional): set **Send email** and optionally a **To** address in the admin UI. Credentials are read only from the environment (never stored in SQLite):

| Variable                      | Meaning                                                                                               |
| ----------------------------- | ----------------------------------------------------------------------------------------------------- |
| `SMTP_HOST`                   | SMTP server hostname (required for email)                                                             |
| `SMTP_PORT`                   | Port (default `587`)                                                                                  |
| `SMTP_SECURE`                 | Set to `true` for TLS-on-connect (typical for port `465`; port `587` usually leaves this unset/false) |
| `SMTP_USER` / `SMTP_PASSWORD` | Auth when your server requires it                                                                     |
| `MAIL_FROM_NAME`              | From name (Defaults to GRID)                                                                          |
| `MAIL_FROM`                   | From address (required for email)                                                                     |
| `HEALTH_NOTIFY_EMAIL_TO`      | Default recipient if **To** is left empty in the UI                                                   |

Optional: `HEALTH_NOTIFY_WEBHOOK_TIMEOUT_MS` (default `8000`) caps how long a webhook request may run.

Scheduled checks run in the same Next.js server process (`startHealthScheduler` in [`src/app/layout.tsx`](src/app/layout.tsx)); ensure the container or host stays up for background polling.

## Docker

```bash
docker compose up --build
```

Runtime data is persisted in `./data`:

- `./data/app.db`
- `./data/uploads/icons`
- `./data/uploads/backgrounds`

No default admin credentials are included. Create the first admin account through `/setup`.
