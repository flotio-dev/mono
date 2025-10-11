# Makefile for Flotio development environment

.PHONY: help up down setup gateway front project-service clean

# Default target
help:
	@echo "Available commands:"
	@echo "  up              - Start Docker Compose services (PostgreSQL + Keycloak)"
	@echo "  down            - Stop Docker Compose services"
	@echo "  setup           - Setup Keycloak realm and client"
	@echo "  gateway         - Run the gateway service"
	@echo "  front           - Run the frontend service"
	@echo "  project-service - Run the project service"
	@echo "  devenv          - Enter devenv shell"
	@echo "  clean           - Clean up containers and volumes"

# Docker Compose commands
up:
	docker-compose up -d

down:
	docker-compose down

# Setup Keycloak
setup:
	devenv run setup-keycloak

# Run services
gateway:
	cd gateway && go run cmd/main.go

front:
	cd front && pnpm dev

project-service:
	cd project-service && go run cmd/main.go

# Devenv
devenv:
	devenv shell

# Clean up
clean:
	docker-compose down -v
	docker system prune -f
