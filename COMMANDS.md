# Command Reference

Quick reference for Make commands and common usage.

## Docker

| Command | Description |
|---------|-------------|
| `make up` | Start all containers (detached) |
| `make up-build` | Start containers and rebuild images |
| `make down` | Stop and remove containers |
| `make logs` | Tail logs from all containers |
| `make logs-app` | Tail logs from app container |
| `make logs-postgres` | Tail logs from postgres container |

## Database (PostgreSQL)

| Command | Description |
|---------|-------------|
| `make db-shell` | Open interactive PostgreSQL CLI (psql) |

## Prisma (Docker)

Requires Postgres to be running (`make up`).

| Command | Description |
|---------|-------------|
| `make db-generate` | Regenerate Prisma client |
| `make db-migrate` | Create and apply migration (development) |
| `make db-migrate-deploy` | Apply migrations (production) |
| `make db-push` | Push schema without migrations |
| `make db-studio` | Open Prisma Studio at http://localhost:5555 |
| `make db-seed` | Run database seed script |

## Quiz Generator CLI (Docker)

| Command | Description |
|---------|-------------|
| `make quiz ARGS="generate-question --count 5"` | Generate questions |
| `make quiz ARGS="generate-question --count 5 --save-to-db --judge"` | Generate, save, and judge |
| `make quiz ARGS="review-question --all"` | Review all unreviewed questions |
| `make quiz ARGS="review-question --count 10"` | Review first 10 unreviewed |
| `make quiz ARGS="list"` | List questions |
| `make quiz ARGS="list --topic Capitals"` | List questions by topic |
| `make quiz ARGS="export-csv -o /app/apps/questions.csv"` | Export questions to CSV |
| `make quiz ARGS="import-csv -i /app/apps/questions.csv"` | Import questions from CSV |

For more quiz CLI examples, see [QUIZ-GENERATOR-EXAMPLES.md](./QUIZ-GENERATOR-EXAMPLES.md).
