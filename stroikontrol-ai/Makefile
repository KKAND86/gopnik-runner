.PHONY: help setup dev build test lint clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

setup: ## Initial project setup
	docker-compose up -d postgres redis minio
	cd backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt
	cd ai-models && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt

cd mobile && npm install

dev: ## Start development environment
	docker-compose up -d
	@echo "API: http://localhost:8000"
	@echo "Dashboard: http://localhost:3001"
	@echo "MinIO Console: http://localhost:9001"

build: ## Build production Docker images
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

test: ## Run all tests
	cd backend && pytest
	cd mobile && npm test

lint: ## Run linters
	cd backend && flake8 app/
	cd mobile && npm run lint

clean: ## Clean up Docker volumes and temp files
	docker-compose down -v
	docker system prune -f
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

migrate: ## Run database migrations
	cd backend && alembic upgrade head

seed: ## Seed test data
	cd backend && python -m app.scripts.seed

logs: ## Show Docker logs
	docker-compose logs -f api ml-worker
