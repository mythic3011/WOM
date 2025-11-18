# Docker Configuration

Docker-related configuration files for the WOM Booking System.

## Files

- `docker-compose.yml` - Development environment configuration (root directory)
- `docker-compose.prod.yml` - Production environment configuration (root directory)
- `pgadmin-servers.json` - Pre-configured pgAdmin server settings (root directory)
- `pgadmin-passfile.example` - Template for pgAdmin password file (root directory)
- `.env.example` - Environment variables template (this directory)

## Quick Start

### Development

From project root:

```bash
docker compose up --build
```

Or with explicit env file:

```bash
docker compose --env-file .env up --build
```

### Production

```bash
docker compose -f docker-compose.prod.yml up -d
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
docker compose ps              # List running containers
docker compose logs -f         # Follow logs from all services
docker compose logs backend    # View backend logs
docker compose restart backend # Restart backend service
docker compose down            # Stop all services
docker compose down -v         # Stop and remove volumes
```
