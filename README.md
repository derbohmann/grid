# Grid

A self-hosted Homer-style grid built with Next.js, SQLite, and a web-based admin UI.

## Features

- Public dashboard with categories, service cards, icons, and live status dots.
- First-run admin setup with secure password hashing and cookie sessions.
- Admin UI for categories, items, ordering, theme, background, custom icons, and health checks.
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

## Docker

```bash
docker compose up --build
```

Runtime data is persisted in `./data`:

- `./data/app.db`
- `./data/uploads/icons`
- `./data/uploads/backgrounds`

No default admin credentials are included. Create the first admin account through `/setup`.
