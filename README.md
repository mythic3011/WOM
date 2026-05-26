# Orchestra Seat Booking System

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Sequelize](https://img.shields.io/badge/Sequelize-ORM-52B0E7?logo=sequelize&logoColor=white)](https://sequelize.org/)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.1-6BA539?logo=openapiinitiative&logoColor=white)](https://www.openapis.org/)
[![Jest](https://img.shields.io/badge/Jest-Test-C21325?logo=jest&logoColor=white)](https://jestjs.io/)
[![Vitest](https://img.shields.io/badge/Vitest-Test-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev/)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/mythic3011/orchestra-seat-booking-system)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Full-stack concert ticket booking system for western orchestral performances. Built with Node.js, Express, PostgreSQL, Vite, and Docker.

> [!NOTE]
> Portfolio project demonstrating backend API design, database modelling, frontend integration, authentication flow, admin tooling, file upload handling, and Docker-based local deployment.

> [!IMPORTANT]
> Before running the backend, create a valid `.env` and set `SESSION_SECRET` to at least 32 characters. The app rejects weak session config by design.

> [!WARNING]
> Seeded demo accounts are for local development only. Do not reuse default credentials in any public or production deployment.

> [!CAUTION]
> Production requires extra hardening: HTTPS, persistent session store, reviewed CORS, secure DB credentials, restricted upload handling, and environment-specific rate limits.

## Features

### User
- Browse upcoming orchestral performances
- Interactive seat map with real-time availability
- Multiple ticket types (Adult, Student, Senior, etc.)
- Booking history and management
- Profile with image upload
- Session-based authentication

### Admin
- Performance, venue, and ticket type management
- Customisable seat layouts per venue
- Booking oversight and user management
- Dashboard with statistics

### Technical
- RESTful API with OpenAPI 3.1 + Scalar docs
- Session-based auth with secure cookies and RBAC
- Image upload and processing via Sharp (resize to 300×300, JPEG)
- Helmet, CORS, bcryptjs, input validation, rate limiting
- JSONB fields for complex data structures
- Property-based testing with fast-check
- Backend (Jest), frontend (Vitest), and E2E (Playwright) test coverage

## Architecture

```
Browser (Vite SPA)
    ↓ REST API / Session Cookie
Express.js Backend
    ↓ Sequelize ORM
PostgreSQL Database
```

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn
- Docker + Docker Compose (optional)

---

### Option A: Local Development

**1. Clone**

```bash
git clone https://github.com/mythic3011/orchestra-seat-booking-system
cd orchestra-seat-booking-system
```

**2. Backend**

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:

```env
DB_NAME=wom_booking
DB_USER=postgres
DB_PASSWORD=your-secure-password-here
DB_HOST=localhost
DB_PORT=5432

# Minimum 32 characters
SESSION_SECRET=your-session-secret-32-chars-minimum-here

CORS_ORIGIN=http://localhost:5173
```

Generate a strong session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**3. Create database**

```bash
createdb wom_booking
# or via psql: CREATE DATABASE wom_booking;
```

**4. Create upload directories**

```bash
mkdir -p backend/public/uploads/profiles
mkdir -p backend/public/uploads/performances
```

**5. Initialise schema**

```bash
# Production (migrations + seeders)
npm run db:setup

# Dev (drop, recreate, seed with mock data)
npm run db:fresh
```

**6. Start backend**

```bash
npm run dev
# http://localhost:3000
# API docs: http://localhost:3000/docs
```

**7. Frontend**

```bash
cd ../frontend
npm install
cp .env.example .env
```

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_BACKEND_URL=http://localhost:3000
```

```bash
npm run dev
# http://localhost:5173
```

---

### Option B: Docker

**1. Clone and configure**

```bash
git clone https://github.com/mythic3011/orchestra-seat-booking-system
cd orchestra-seat-booking-system
cp backend/.env.example .env
```

**2. Start all services**

```bash
docker-compose up
```

Services started:
| Service | Port |
|---|---|
| PostgreSQL | 5432 |
| Backend API | 3000 |
| Frontend | 5173 |
| pgAdmin | 5050 |

**3. Initialise database**

```bash
docker-compose exec backend npm run db:setup
```

**4. Stop / clean up**

```bash
docker-compose down        # Stop services
docker-compose down -v     # Also remove volumes
```

---

## Default Accounts

Seeded after running `db:setup` or `db:fresh`.

| Role | Email | Password |
|---|---|---|
| Admin | admin@wom.hk | adminpass |
| User | user@example.com | userpass |

> [!WARNING]
> Do not use these credentials outside local development.

## Project Structure

```
project-root/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── models/          # Sequelize models
│   │   ├── controllers/
│   │   ├── services/        # Business logic
│   │   ├── routes/
│   │   ├── middleware/      # Auth, validation, error handling
│   │   ├── utils/
│   │   └── db/              # Migrations and seeders
│   ├── public/uploads/      # User-uploaded files
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/        # API clients
│   │   ├── utils/
│   │   ├── router/
│   │   └── store/
│   └── package.json
│
├── e2e-role-tests/          # Playwright tests
├── docker/                  # Volume data
├── docs/
├── docker-compose.yml
└── docker-compose.prod.yml
```

## Development Commands

### Backend

```bash
cd backend

npm run dev              # Nodemon hot-reload
npm start                # Production

npm run db:migrate       # Run migrations
npm run db:seed:all      # Run seeders
npm run db:setup         # Migrate + seed
npm run db:fresh         # Drop/recreate with mock data
npm run db:reset         # Undo all, re-migrate, re-seed

npm run lint             # ESLint check
npm run lint:fix
npm run format           # Prettier
npm run format:check
```

### Frontend

```bash
cd frontend

npm run dev              # Vite dev server (port 5173)
npm run build
npm run preview

npm run test
npm run test:watch
npm run test:ui          # Vitest UI

npm run lint
npm run lint:fix
npm run format
npm run format:check
```

### E2E

```bash
cd e2e-role-tests

npm test                 # All Playwright tests
npm run test:headed      # With visible browser
npm run test:ui          # Playwright UI mode
```

## Environment Variables

### Backend (`backend/.env`)

```env
NODE_ENV=development
PORT=3000

DB_NAME=wom_booking
DB_USER=postgres
DB_PASSWORD=your-secure-password-here
DB_HOST=localhost
DB_PORT=5432

SESSION_SECRET=your-session-secret-32-chars-minimum-here

CORS_ORIGIN=http://localhost:5173

RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Optional mock data controls
MOCK_DATA_MODE=standard
MOCK_DATA_SEED=12345
MOCK_BOOKINGS_COUNT=50
MOCK_BOOKING_OCCUPANCY=0.3
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:3000/api
VITE_BACKEND_URL=http://localhost:3000
```

## Profile Image Upload

- **Endpoint**: `POST /api/users/upload-profile-image`
- **Accepted formats**: JPEG, JPG, PNG, WebP
- **Max size**: 5MB
- **Processing**: Resized to 300×300, converted to JPEG, secure filename generated
- **Storage**: `backend/public/uploads/profiles/`
- **Served at**: `/uploads/profiles/{filename}` with 1-year cache

Old images are deleted on update.

## API Documentation

Interactive docs via Scalar at `http://localhost:3000/docs`. Supports request testing, response examples, and code generation.

## Security

| Requirement | Detail |
|---|---|
| SESSION_SECRET | Minimum 32 characters — enforced at startup |
| Password policy | 8+ chars, mixed case, numbers |
| Rate limiting | Brute force protection on all endpoints |
| Input sanitisation | All user input sanitised automatically |
| HTTPS | Required for production |

**Before deploying to production:**
- Set a strong `SESSION_SECRET` (32+ chars)
- Replace memory session store with Redis or PostgreSQL
- Enable HTTPS/SSL
- Review `backend/SECURITY.md`

## Troubleshooting

**`database does not exist`**
```bash
createdb wom_booking
```

**`password authentication failed`**
Check `DB_PASSWORD` and `DB_USER` permissions in `.env`.

**`SESSION_SECRET must be at least 32 characters`**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**`Port 3000 is already in use`**
```bash
lsof -ti:3000 | xargs kill -9
# or change PORT in .env
```

**`ENOENT: no such file or directory` (uploads)**
```bash
mkdir -p backend/public/uploads/profiles
mkdir -p backend/public/uploads/performances
```

## Contributing

- Follow `.prettierrc` and `.eslintrc` for code style
- Code should be self-documenting — no inline comments
- No emojis or decorative symbols in code or output
- Use conventional commit messages
- Test before opening a pull request

## License

MIT

---

> Use the **Ask DeepWiki** badge at the top to inspect repository structure, source flow, and implementation details.
