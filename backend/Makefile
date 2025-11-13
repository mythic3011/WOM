.PHONY: help dev build up down logs clean migrate seed setup fresh reset restart

help:
	@echo "Available commands:"
	@echo "  make dev       - Start development environment"
	@echo "  make build     - Build Docker images"
	@echo "  make up        - Start services in detached mode"
	@echo "  make down      - Stop services"
	@echo "  make logs      - View backend logs"
	@echo "  make clean     - Remove containers and volumes"
	@echo "  make setup     - Run migrations + seeders (production)"
	@echo "  make migrate   - Run database migrations only"
	@echo "  make seed      - Quick seed with Faker.js (development)"
	@echo "  make fresh     - Same as seed (drop & recreate)"
	@echo "  make reset     - Reset database (undo, migrate, seed)"
	@echo "  make restart   - Restart backend service"

dev:
	docker-compose up

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f backend

clean:
	docker-compose down -v
	docker system prune -f

setup:
	docker-compose exec backend npm run db:setup

migrate:
	docker-compose exec backend npm run db:migrate

seed:
	docker-compose exec backend npm run db:fresh

fresh:
	docker-compose exec backend npm run db:fresh

reset:
	docker-compose exec backend npm run db:reset

restart:
	docker-compose restart backend


