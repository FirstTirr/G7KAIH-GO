#!/bin/bash

# G7KAIH Backend Deployment Script
# Usage: ./deploy.sh [mode] [environment]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Parse arguments
MODE=${1:-monolith}
ENVIRONMENT=${2:-development}

print_info "Deploying G7KAIH Backend"
print_info "Mode: $MODE"
print_info "Environment: $ENVIRONMENT"

# Check if .env exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from .env.example..."
    cp .env.example .env
    print_info "Please edit .env file with your configuration"
    exit 1
fi

# Function to start monolith
start_monolith() {
    print_info "Starting monolith deployment..."
    docker-compose down
    docker-compose build
    docker-compose up -d
    
    print_info "Waiting for services to be ready..."
    sleep 10
    
    # Check health
    if curl -f http://localhost:8080/health > /dev/null 2>&1; then
        print_info "✓ API is healthy"
    else
        print_error "✗ API health check failed"
        docker-compose logs api
        exit 1
    fi
    
    print_info "Monolith deployment completed!"
    print_info "API: http://localhost:8080"
    print_info "Swagger: http://localhost:8080/swagger/index.html"
}

# Function to start microservices
start_microservices() {
    print_info "Starting microservices deployment..."
    docker-compose -f docker-compose.microservices.yml down
    docker-compose -f docker-compose.microservices.yml build
    docker-compose -f docker-compose.microservices.yml up -d
    
    print_info "Waiting for services to be ready..."
    sleep 15
    
    # Check health of each service
    services=("api-gateway:8080" "auth-service:8081" "storage-service:8082" "notification-service:8083")
    for service in "${services[@]}"; do
        IFS=':' read -r name port <<< "$service"
        if curl -f http://localhost:$port/health > /dev/null 2>&1; then
            print_info "✓ $name is healthy"
        else
            print_warning "✗ $name health check failed"
        fi
    done
    
    print_info "Microservices deployment completed!"
    print_info "Nginx: http://localhost:80"
    print_info "API Gateway: http://localhost:8080"
}

# Main deployment
case $MODE in
    monolith|mono)
        start_monolith
        ;;
    microservices|micro)
        start_microservices
        ;;
    *)
        print_error "Invalid mode: $MODE"
        print_info "Usage: ./deploy.sh [monolith|microservices] [development|staging|production]"
        exit 1
        ;;
esac

# Show running containers
print_info "\nRunning containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

print_info "\nTo view logs: docker-compose logs -f"
print_info "To stop: docker-compose down"
