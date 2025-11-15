# pgAdmin Setup Guide

## Access pgAdmin

URL: http://localhost:5050

**Login Credentials:**
- Email: `admin@wom.hk`
- Password: `admin`

## Pre-configured Server

The database server "WOM Database" is automatically configured when you start pgAdmin.

### Server Details

- **Name**: WOM Database
- **Host**: postgres
- **Port**: 5432
- **Database**: wom_booking
- **Username**: postgres
- **Password**: (your postgres password from .env)

## First Time Connection

1. Open http://localhost:5050
2. Login with the credentials above
3. In the left sidebar, you'll see "Servers" > "WOM Database"
4. Click on "WOM Database"
5. Enter the PostgreSQL password when prompted
6. Check "Save Password" if you want to avoid entering it each time

## Password

The default PostgreSQL password is in your `.env` file as `DB_PASSWORD` or `POSTGRES_PASSWORD`.

Default: `postgres` (change this in production!)

## Configuration Files

- `pgadmin-servers.json` - Pre-configures the database server
- `pgadmin-passfile` - (optional) Can store password for auto-login
- `pgadmin-passfile.example` - Template for passfile

## Features

- Browse database schemas, tables, and data
- Execute SQL queries
- Import/Export data
- View query plans
- Manage users and permissions
- Backup and restore databases

## Troubleshooting

### Can't see the pre-configured server?

The server configuration is loaded on first startup. If pgAdmin was already running, you need to:

```bash
docker compose down pgadmin
docker volume rm eie4432_project_pgadmin_data
docker compose up -d pgadmin
```

### Connection refused

Make sure the PostgreSQL container is running and healthy:

```bash
docker compose ps postgres
```

### Wrong password

Check your `.env` file for the correct `DB_PASSWORD` or `POSTGRES_PASSWORD`.
