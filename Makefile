# Makefile for Flotio development environment

.PHONY: help up down setup env gateway front project-service organization-service devenv clean

# Default target
help:
	@echo "Available commands:"
	@echo "  up              - Start Docker Compose services (PostgreSQL + Keycloak)"
	@echo "  down            - Stop Docker Compose services"
	@echo "  setup           - Setup Keycloak realm and client"
	@echo "  env             - Copy .env.example files to .env files"
	@echo "  gateway         - Run the gateway service"
	@echo "  front           - Run the frontend service"
	@echo "  project-service - Run the project service"
	@echo "  organization-service - Run the organization service"
	@echo "  devenv          - Enter devenv shell"
	@echo "  clean           - Clean up containers and volumes"

# Docker Compose commands
up:
	docker-compose up -d

down:
	docker-compose down

# Setup Keycloak
setup:
	go run setup-keycloak.go

# Setup environment files
env:
	cp .env.example .env
	cp front/.env.example front/.env
	cp gateway/.env.example gateway/.env
	cp organization-service/.env.example organization-service/.env
	cp project-service/.env.example project-service/.env

# Run services
gateway:
	cd gateway && go run cmd/main.go

front:
	cd front && pnpm dev

project-service:
	cd project-service && go run cmd/main.go

organization-service:
	cd organization-service && go run cmd/main.go

# Devenv
devenv:
	devenv shell

# Clean up
clean:
	docker-compose down -v
	docker system prune -f
