.PHONY: up up-build down logs logs-app logs-postgres db-shell quiz

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
# Example: make quiz ARGS="review-question --all"
# Example: make quiz ARGS="list --topic Capitals"
quiz:
	docker compose run --rm app node dist/apps/cli/quiz.js $(ARGS)
