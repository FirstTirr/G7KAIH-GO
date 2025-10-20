.PHONY: help dev build run stop logs test clean deploy-mono deploy-micro docker-build docker-clean cors-dev cors-staging cors-prod

# Variables
APP_NAME=g7kaih-backend
DOCKER_IMAGE=$(APP_NAME):latest
GO_VERSION=1.23

# Colors
YELLOW=\033[1;33m
GREEN=\033[0;32m
NC=\033[0m

help: ## Show this help message
	@echo "$(GREEN)G7KAIH Backend - Available Commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'

# Development
dev: ## Run development server with hot reload
	@echo "$(GREEN)Starting development server...$(NC)"
	@go run cmd/server/main.go

build: ## Build the application
	@echo "$(GREEN)Building application...$(NC)"
	@go build -o bin/server cmd/server/main.go
	@echo "$(GREEN)Build complete! Binary: bin/server$(NC)"

run: build ## Build and run the application
	@echo "$(GREEN)Running application...$(NC)"
	@./bin/server

test: ## Run tests
	@echo "$(GREEN)Running tests...$(NC)"
	@go test -v ./...

test-coverage: ## Run tests with coverage
	@echo "$(GREEN)Running tests with coverage...$(NC)"
	@go test -v -coverprofile=coverage.out ./...
	@go tool cover -html=coverage.out -o coverage.html
	@echo "$(GREEN)Coverage report: coverage.html$(NC)"

# Dependencies
deps: ## Download dependencies
	@echo "$(GREEN)Downloading dependencies...$(NC)"
	@go mod download

deps-update: ## Update dependencies
	@echo "$(GREEN)Updating dependencies...$(NC)"
	@go get -u ./...
	@go mod tidy

# Docker - Monolith
docker-build: ## Build Docker image
	@echo "$(GREEN)Building Docker image...$(NC)"
	@docker build -t $(DOCKER_IMAGE) .

docker-run: ## Run Docker container
	@echo "$(GREEN)Running Docker container...$(NC)"
	@docker run -p 8080:8080 --env-file .env $(DOCKER_IMAGE)

docker-compose-up: ## Start services with docker-compose
	@echo "$(GREEN)Starting services with docker-compose...$(NC)"
	@docker-compose up -d
	@echo "$(GREEN)Services started! API: http://localhost:8080$(NC)"

docker-compose-down: ## Stop docker-compose services
	@echo "$(GREEN)Stopping services...$(NC)"
	@docker-compose down

docker-compose-logs: ## View docker-compose logs
	@docker-compose logs -f

# Docker - Microservices
docker-micro-up: ## Start microservices with docker-compose
	@echo "$(GREEN)Starting microservices...$(NC)"
	@docker-compose -f docker-compose.microservices.yml up -d
	@echo "$(GREEN)Microservices started! Nginx: http://localhost:80$(NC)"

docker-micro-down: ## Stop microservices
	@echo "$(GREEN)Stopping microservices...$(NC)"
	@docker-compose -f docker-compose.microservices.yml down

docker-micro-logs: ## View microservices logs
	@docker-compose -f docker-compose.microservices.yml logs -f

# Deployment
deploy-mono: ## Deploy monolith mode
	@echo "$(GREEN)Deploying monolith...$(NC)"
	@chmod +x deploy.sh
	@./deploy.sh monolith production

deploy-micro: ## Deploy microservices mode
	@echo "$(GREEN)Deploying microservices...$(NC)"
	@chmod +x deploy.sh
	@./deploy.sh microservices production

# CORS Configuration Quick Switch
cors-dev: ## Switch to development CORS mode
	@echo "$(GREEN)Switching to development CORS mode...$(NC)"
	@sed -i 's/^CORS_MODE=.*/CORS_MODE=development/' .env || true
	@echo "$(GREEN)CORS_MODE=development$(NC)"
	@echo "$(YELLOW)Restart the server for changes to take effect$(NC)"

cors-staging: ## Switch to staging CORS mode
	@echo "$(GREEN)Switching to staging CORS mode...$(NC)"
	@sed -i 's/^CORS_MODE=.*/CORS_MODE=staging/' .env || true
	@echo "$(GREEN)CORS_MODE=staging$(NC)"
	@echo "$(YELLOW)Restart the server for changes to take effect$(NC)"

cors-prod: ## Switch to production CORS mode
	@echo "$(GREEN)Switching to production CORS mode...$(NC)"
	@sed -i 's/^CORS_MODE=.*/CORS_MODE=production/' .env || true
	@echo "$(GREEN)CORS_MODE=production$(NC)"
	@echo "$(YELLOW)Restart the server for changes to take effect$(NC)"

cors-custom: ## Switch to custom CORS mode (provide ORIGINS)
	@echo "$(GREEN)Switching to custom CORS mode...$(NC)"
	@sed -i 's/^CORS_MODE=.*/CORS_MODE=custom/' .env || true
	@echo "$(GREEN)CORS_MODE=custom$(NC)"
	@echo "$(YELLOW)Set CORS_CUSTOM_ORIGINS in .env file$(NC)"

# Database
db-migrate: ## Run database migrations
	@echo "$(GREEN)Running migrations...$(NC)"
	@go run cmd/server/main.go migrate

db-seed: ## Seed database with sample data
	@echo "$(GREEN)Seeding database...$(NC)"
	@go run scripts/seed.go

db-reset: ## Reset database (drop and recreate)
	@echo "$(YELLOW)WARNING: This will delete all data!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "\n$(GREEN)Resetting database...$(NC)"; \
		docker-compose exec postgres psql -U postgres -c "DROP DATABASE IF EXISTS g7kaih;"; \
		docker-compose exec postgres psql -U postgres -c "CREATE DATABASE g7kaih;"; \
		$(MAKE) db-migrate; \
	fi

# Swagger
swagger: ## Generate swagger documentation
	@echo "$(GREEN)Generating Swagger docs...$(NC)"
	@swag init -g cmd/server/main.go -o docs
	@echo "$(GREEN)Swagger docs generated!$(NC)"

swagger-serve: swagger ## Generate and serve swagger UI
	@echo "$(GREEN)Swagger UI available at: http://localhost:8080/swagger/index.html$(NC)"

# Logs
logs: ## View application logs
	@docker-compose logs -f api

logs-api: ## View API Gateway logs
	@docker-compose -f docker-compose.microservices.yml logs -f api-gateway

logs-auth: ## View Auth Service logs
	@docker-compose -f docker-compose.microservices.yml logs -f auth-service

logs-storage: ## View Storage Service logs
	@docker-compose -f docker-compose.microservices.yml logs -f storage-service

# Clean
clean: ## Clean build artifacts
	@echo "$(GREEN)Cleaning...$(NC)"
	@rm -rf bin/
	@rm -rf coverage.out coverage.html
	@go clean

docker-clean: ## Remove Docker images and volumes
	@echo "$(GREEN)Cleaning Docker resources...$(NC)"
	@docker-compose down -v
	@docker rmi $(DOCKER_IMAGE) || true

clean-all: clean docker-clean ## Clean everything

# Health Check
health: ## Check service health
	@echo "$(GREEN)Checking service health...$(NC)"
	@curl -f http://localhost:8080/health || echo "$(YELLOW)Service not running$(NC)"

# IP Configuration
set-cors-ip: ## Set custom CORS IP (usage: make set-cors-ip IP=192.168.1.100 PORT=3000)
	@echo "$(GREEN)Setting CORS for IP: $(IP):$(PORT)$(NC)"
	@sed -i 's|^CORS_CUSTOM_ORIGINS=.*|CORS_CUSTOM_ORIGINS=http://$(IP):$(PORT)|' .env
	@sed -i 's/^CORS_MODE=.*/CORS_MODE=custom/' .env
	@echo "$(GREEN)CORS configured for http://$(IP):$(PORT)$(NC)"

# Environment
env-check: ## Check environment variables
	@echo "$(GREEN)Environment Configuration:$(NC)"
	@grep -v "^#" .env | grep -v "^$$" | sort

env-example: ## Create .env from .env.example
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "$(GREEN).env file created from .env.example$(NC)"; \
	else \
		echo "$(YELLOW).env file already exists$(NC)"; \
	fi

# Quick start
quick-start: env-example docker-compose-up ## Quick start for development
	@echo "$(GREEN)========================================$(NC)"
	@echo "$(GREEN)G7KAIH Backend is running!$(NC)"
	@echo "$(GREEN)========================================$(NC)"
	@echo "API: http://localhost:8080"
	@echo "Swagger: http://localhost:8080/swagger/index.html"
	@echo "Health: http://localhost:8080/health"
	@echo "$(GREEN)========================================$(NC)"

stop: docker-compose-down ## Stop all services
