# Prisma Database Guide

How to run Prisma migrations and related database commands for this project.

## Prerequisites

Set `DATABASE_URL` in your environment or `.env`:

- **Local (PostgreSQL in Docker):** `postgresql://quiz_user:quiz_password@localhost:5432/quiz_db`
- **Inside Docker network:** `postgresql://quiz_user:quiz_password@postgres:5432/quiz_db`

Ensure PostgreSQL is running (e.g. `make up` or `docker compose up -d postgres`).

## Schema & Migrations Location

- **Schema:** `libs/db/prisma/schema.prisma`
- **Migrations:** `libs/db/prisma/migrations/`
- **Config:** `prisma.config.ts`

---

## Commands

### Generate Prisma Client

Regenerate the Prisma client after schema changes. Does not require a database connection.

```bash
npm run db:generate
```

---

### Create & Apply Migrations (Development)

Creates a new migration from schema changes and applies it to the database.

```bash
npm run db:migrate
```

When prompted, enter a migration name (e.g. `add_user_table`).

---

### Apply Migrations (Production)

Applies existing migrations without creating new ones. Use in CI/CD or production deploys.

```bash
npm run db:migrate:deploy
```

---

### Push Schema (Prototype / No Migrations)

Syncs the schema to the database without generating migration files. Useful for prototyping.

```bash
npm run db:push
```

> **Warning:** Can cause data loss if schema changes conflict with existing data. Prefer `db:migrate` for production.

---

### Prisma Studio

Opens Prisma Studio to inspect and edit data in the browser.

```bash
npm run db:studio
```

Default URL: `http://localhost:5555`

---

### Seed Database

Runs the seed script to populate the database.

```bash
npm run db:seed
```

Seed script: `libs/db/prisma/seed.ts`

---

### Database Shell

Open an interactive PostgreSQL CLI session.

```bash
npm run db:shell
# or
make db-shell
```

---

## Running Prisma in Docker

Start Postgres first, then run Prisma commands in Docker:

```bash
make up
make db-migrate          # Create and apply migration
make db-migrate-deploy   # Apply migrations (production)
make db-push             # Push schema (prototype)
make db-generate         # Regenerate Prisma client
make db-studio           # Open Prisma Studio at http://localhost:5555
make db-seed             # Run seed script
```

The `prisma` service uses the builder image (includes Prisma CLI) and connects to the `postgres` container. Migration files are written to `libs/db/prisma/migrations/` via a volume mount.

**Running locally (against Docker Postgres):**

1. Start Postgres: `make up`
2. Set `DATABASE_URL=postgresql://quiz_user:quiz_password@localhost:5432/quiz_db` in `.env`
3. Run: `npm run db:migrate`, `npm run db:push`, etc.

---

## Quick Reference

| Command            | Local                    | Docker (Make)      |
|--------------------|--------------------------|--------------------|
| Generate client    | `npm run db:generate`    | `make db-generate` |
| Create migration   | `npm run db:migrate`     | `make db-migrate`  |
| Deploy migrations  | `npm run db:migrate:deploy` | `make db-migrate-deploy` |
| Push schema        | `npm run db:push`        | `make db-push`     |
| Prisma Studio      | `npm run db:studio`      | `make db-studio`   |
| Seed               | `npm run db:seed`        | `make db-seed`     |
| DB shell           | `make db-shell`          | `make db-shell`    |
