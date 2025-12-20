.PHONY: logs logs-app logs-postgres

# Tail logs from all containers
logs:
	docker-compose logs -f

# Tail logs from app container
logs-app:
	docker-compose logs -f app

# Tail logs from postgres container
logs-postgres:
	docker-compose logs -f postgres

