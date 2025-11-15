# Docker Configuration

This directory contains all Docker-related configuration files for the WOM Booking System.

## Files

- `docker-compose.yml` - Development environment configuration
- `docker-compose.prod.yml` - Production environment configuration
- `pgadmin-servers.json` - Pre-configured pgAdmin server settings
- `pgadmin-passfile.example` - Template for pgAdmin password file

## Quick Start

### Development

From project root:

```bash
docker compose -f docker/docker-compose.yml up --build
```

Or with explicit env file:

```bash
docker compose --env-file .env -f docker/docker-compose.yml up --build
```

### Production

```bash
docker compose -f docker/docker-compose.prod.yml up -d
```

## Services

- **postgres** - PostgreSQL 15 database (port 5432)
- **backend** - Express.js API server (port 3000)
- **frontend** - Vite development server (port 5173)
- **pgadmin** - Database management tool (port 5050)

## Environment Variables

Create a `.env` file in the root directory based on `backend/.env.example`:

```env
NODE_ENV=development
DB_NAME=wom_booking
DB_USER=postgres
DB_PASSWORD=postgres
PORT=3000
```

## Volumes

- `postgres_data` - PostgreSQL database data
- `pgadmin_data` - pgAdmin configuration and data

## Networking

All services are connected via the `orchestral_network` bridge network.

## Health Checks

- **PostgreSQL**: `pg_isready` command
- **Backend**: HTTP GET to `/api`

## Commands

Run from project root:

```bash
docker compose -f docker/docker-compose.yml ps              # List running containers
docker compose -f docker/docker-compose.yml logs -f         # Follow logs from all services
docker compose -f docker/docker-compose.yml logs backend    # View backend logs
docker compose -f docker/docker-compose.yml restart backend # Restart backend service
docker compose -f docker/docker-compose.yml down            # Stop all services
docker compose -f docker/docker-compose.yml down -v         # Stop and remove volumes
```
