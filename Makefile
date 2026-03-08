.PHONY: up up-build down logs logs-app logs-postgres db-shell

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
