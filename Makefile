.PHONY: up up-build down logs logs-app logs-postgres db-shell quiz db-generate db-migrate db-migrate-deploy db-push db-studio db-seed

# Start Docker containers (detached)
up:
	docker compose up -d

# Start Docker containers and rebuild images
up-build:
	docker compose up -d --build

# Stop and remove containers
down:
	docker compose down

# Tail logs from all containers
logs:
	docker compose logs -f

# Tail logs from app container
logs-app:
	docker compose logs -f app

# Tail logs from postgres container
logs-postgres:
	docker compose logs -f postgres

# Open interactive PostgreSQL CLI
db-shell:
	docker compose exec postgres psql -U quiz_user -d quiz_db

# Run quiz-generator CLI in Docker (pass command and options via ARGS)
# Example: make quiz ARGS="generate-question --count 5 --save-to-db --judge"
quiz:
	docker compose run --rm app npm start -- $(ARGS)

# Prisma commands (Docker) - ensure postgres is running: make up
db-generate:
	docker compose --profile tools run --rm prisma npm run db:generate

db-migrate:
	docker compose --profile tools run --rm prisma npm run db:migrate

db-migrate-deploy:
	docker compose --profile tools run --rm prisma npm run db:migrate:deploy

db-push:
	docker compose --profile tools run --rm prisma npm run db:push

db-studio:
	docker compose --profile tools run --rm -p 5555:5555 prisma npx prisma studio --schema=libs/db/prisma/schema.prisma --browser none --port 5555

db-seed:
	docker compose --profile tools run --rm prisma npm run db:seed
