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

To run migrations against the Dockerized database from your host:

1. Start Postgres: `make up` or `docker compose up -d postgres`
2. Use the local connection string: `postgresql://quiz_user:quiz_password@localhost:5432/quiz_db`
3. Run commands locally: `npm run db:migrate`, `npm run db:push`, etc.

To run migrations from inside a container (e.g. app container):

```bash
docker compose run --rm app npx prisma migrate deploy --schema=libs/db/prisma/schema.prisma
```

---

## Quick Reference

| Command            | Script                 | Description                        |
|--------------------|------------------------|------------------------------------|
| Generate client    | `npm run db:generate`  | Regenerate Prisma client           |
| Create migration   | `npm run db:migrate`   | Create and apply migration (dev)   |
| Deploy migrations  | `npm run db:migrate:deploy` | Apply migrations (prod)      |
| Push schema        | `npm run db:push`      | Sync schema without migrations     |
| Prisma Studio      | `npm run db:studio`    | GUI for database                   |
| Seed               | `npm run db:seed`      | Run seed script                    |
| DB shell           | `make db-shell`        | Interactive psql                   |
