# Makefile for E-commerce Platform

.PHONY: help install build test lint clean up down logs

# Default target
help:
	@echo "E-commerce Platform - Available Commands:"
	@echo ""
	@echo "Development:"
	@echo "  make install    - Install all dependencies"
	@echo "  make build      - Build all services"
	@echo "  make up         - Start all services with docker-compose"
	@echo "  make down       - Stop all services"
	@echo "  make logs       - View logs from all services"
	@echo "  make clean      - Clean build artifacts and containers"
	@echo ""
	@echo "Testing:"
	@echo "  make test       - Run tests for all services"
	@echo "  make test-user  - Run User Service tests"
	@echo "  make lint       - Run linter for all services"
	@echo ""
	@echo "Database:"
	@echo "  make migrate    - Run database migrations"
	@echo "  make seed       - Seed database with sample data"
	@echo ""
	@echo "Infrastructure:"
	@echo "  make tf-init    - Initialize Terraform"
	@echo "  make tf-plan    - Plan Terraform changes"
	@echo "  make tf-apply   - Apply Terraform changes"
	@echo ""

install:
	@echo "Installing dependencies for all services..."
	cd services/user-service && npm install
	@echo "Done!"

build:
	@echo "Building all services..."
	docker-compose build
	@echo "Done!"

up:
	@echo "Starting all services..."
	docker-compose up -d
	@echo "Services started!"
	@echo ""
	@echo "Access points:"
	@echo "  User Service:    http://localhost:8001"
	@echo "  Prometheus:      http://localhost:9090"
	@echo "  Grafana:         http://localhost:3001 (admin/admin123)"
	@echo "  RabbitMQ:        http://localhost:15672 (admin/password123)"
	@echo "  PostgreSQL:      localhost:5432 (admin/password123)"
	@echo "  MongoDB:         localhost:27017 (admin/password123)"
	@echo "  Redis:           localhost:6379 (password123)"
	@echo "  Elasticsearch:   http://localhost:9200"

down:
	@echo "Stopping all services..."
	docker-compose down
	@echo "Done!"

logs:
	@echo "Viewing logs..."
	docker-compose logs -f

logs-user:
	@echo "Viewing User Service logs..."
	docker-compose logs -f user-service

clean:
	@echo "Cleaning up..."
	docker-compose down -v
	find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
	find . -name "dist" -type d -prune -exec rm -rf '{}' +
	find . -name "coverage" -type d -prune -exec rm -rf '{}' +
	@echo "Done!"

test:
	@echo "Running tests for all services..."
	cd services/user-service && npm test
	@echo "Done!"

test-user:
	@echo "Running User Service tests..."
	cd services/user-service && npm test -- --coverage
	@echo "Done!"

lint:
	@echo "Running linter for all services..."
	cd services/user-service && npm run lint
	@echo "Done!"

migrate:
	@echo "Running database migrations..."
	cd services/user-service && npm run migrate
	@echo "Done!"

seed:
	@echo "Seeding database..."
	@echo "TODO: Implement seed script"

tf-init:
	@echo "Initializing Terraform..."
	cd terraform/environments/production && terraform init
	@echo "Done!"

tf-plan:
	@echo "Planning Terraform changes..."
	cd terraform/environments/production && terraform plan

tf-apply:
	@echo "Applying Terraform changes..."
	cd terraform/environments/production && terraform apply

tf-destroy:
	@echo "Destroying Terraform infrastructure..."
	cd terraform/environments/production && terraform destroy

dev:
	@echo "Starting development environment..."
	make up
	sleep 10
	make logs
