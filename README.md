# Orchestra Seat Booking System

**Backend**  
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Sequelize](https://img.shields.io/badge/Sequelize-ORM-52B0E7?logo=sequelize&logoColor=white)](https://sequelize.org/)

**Frontend**  
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

**Tooling**  
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.1-6BA539?logo=openapiinitiative&logoColor=white)](https://www.openapis.org/)
[![Jest](https://img.shields.io/badge/Jest-Test-C21325?logo=jest&logoColor=white)](https://jestjs.io/)
[![Vitest](https://img.shields.io/badge/Vitest-Test-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev/)

**Documentation**  
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/mythic3011/orchestra-seat-booking-system)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Full-stack concert ticket booking system for western orchestral performances. Built with Node.js, Express, PostgreSQL, Vite, and Docker.

This project demonstrates an end-to-end booking workflow with interactive seat selection, real-time availability tracking, session-based authentication, role-based admin tools, image upload processing, Docker setup, and OpenAPI documentation.

> [!NOTE]
> Portfolio project demonstrating backend API design, database modelling, frontend integration, authentication flow, admin tooling, file upload handling, and Docker-based local deployment.

> [!TIP]
> Use the **Ask DeepWiki** badge to inspect the repository structure, source flow, and implementation details in a documentation-style view.

> [!IMPORTANT]
> Before running the backend, create a valid `.env` file and set `SESSION_SECRET` to at least 32 characters. The app rejects weak session configuration by design.

> [!WARNING]
> Seeded demo accounts are for local development only. Do not reuse default credentials in any public or production deployment.

> [!CAUTION]
> Production requires extra hardening: HTTPS, persistent session storage, reviewed CORS settings, secure database credentials, restricted upload handling, and environment-specific rate limits.

## Features

### User

- Browse upcoming orchestral performances
- Interactive seat map with real-time availability
- Multiple ticket types: Adult, Student, Senior, and others
- Booking history and management
- Profile image upload
- Session-based authentication

### Admin

- Performance, venue, and ticket type management
- Customisable seat layouts per venue
- Booking oversight and user management
- Dashboard with statistics

### Technical

- RESTful API with OpenAPI 3.1 and Scalar documentation
- Session-based authentication with secure cookies and role-based access control
- Image upload and processing through Sharp
- Helmet, CORS, bcryptjs, input validation, and rate limiting
- PostgreSQL JSONB fields for complex data structures
- Backend, frontend, and E2E test coverage

## Architecture

```text
User Browser
    |
    | Vite SPA
    v
Frontend Application
    |
    | REST API / Session Cookie
    v
Express.js Backend
    |
    | Sequelize ORM
    v
PostgreSQL Database
````

## Quick Start

### Prerequisites

* Node.js 18+
* PostgreSQL 14+
* npm or yarn
* Docker and Docker Compose

### Local Development

Clone the repository:

```bash
git clone https://github.com/mythic3011/orchestra-seat-booking-system
cd orchestra-seat-booking-system
```

Install backend dependencies:

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:

```env
DB_NAME=wom_booking
DB_USER=postgres
DB_PASSWORD=your-secure-password-here
DB_HOST=localhost
DB_PORT=5432
SESSION_SECRET=your-session-secret-32-chars-minimum-here
CORS_ORIGIN=http://localhost:5173
```

Generate a secure session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Create the database:

```bash
createdb wom_booking
```

Create upload directories:

```bash
mkdir -p backend/public/uploads/profiles
mkdir -p backend/public/uploads/performances
```

Initialise the database:

```bash
npm run db:setup
```

Start the backend:

```bash
npm run dev
```

Install frontend dependencies:

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

Start the frontend:

```bash
npm run dev
```

### Docker Setup

```bash
git clone https://github.com/mythic3011/orchestra-seat-booking-system
cd orchestra-seat-booking-system
cp backend/.env.example .env
docker-compose up
```

Initialise the database inside Docker:

```bash
docker-compose exec backend npm run db:setup
```

Services:

| Service     | URL                                                      |
| ----------- | -------------------------------------------------------- |
| Frontend    | [http://localhost:5173](http://localhost:5173)           |
| Backend API | [http://localhost:3000](http://localhost:3000)           |
| API Docs    | [http://localhost:3000/docs](http://localhost:3000/docs) |
| pgAdmin     | [http://localhost:5050](http://localhost:5050)           |

Stop services:

```bash
docker-compose down
```

Remove volumes:

```bash
docker-compose down -v
```

## Default Accounts

| Role  | Email                                       | Password  |
| ----- | ------------------------------------------- | --------- |
| Admin | [admin@wom.hk](mailto:admin@wom.hk)         | adminpass |
| User  | [user@example.com](mailto:user@example.com) | userpass  |

> [!WARNING]
> These accounts are seeded for local testing only. Replace or remove them before any public deployment.

## Tech Stack

### Backend

| Area           | Technology                            |
| -------------- | ------------------------------------- |
| Runtime        | Node.js 18+ with ES modules           |
| Framework      | Express.js 4.x                        |
| Database       | PostgreSQL 14+                        |
| ORM            | Sequelize                             |
| Authentication | express-session                       |
| Validation     | Joi, express-validator                |
| Security       | helmet, cors, bcryptjs, rate limiting |
| File Upload    | multer, sharp                         |
| Testing        | Jest, fast-check                      |

### Frontend

| Area         | Technology                              |
| ------------ | --------------------------------------- |
| Build Tool   | Vite 7.x                                |
| Language     | Vanilla JavaScript ES6+                 |
| DOM Utility  | jQuery 3.7                              |
| Routing      | page.js                                 |
| Styling      | Tailwind CSS 3.x                        |
| UI Libraries | sweetalert2, notyf, panzoom, sortablejs |
| Testing      | Vitest, jsdom                           |

### Infrastructure and Tooling

| Area              | Technology             |
| ----------------- | ---------------------- |
| Containerization  | Docker, Docker Compose |
| Database Admin    | pgAdmin 4              |
| API Documentation | Scalar, OpenAPI 3.1    |
| E2E Testing       | Playwright             |

## Project Structure

```text
project-root/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── models/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── db/
│   ├── public/uploads/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── router/
│   │   └── store/
│   └── package.json
├── e2e-role-tests/
├── docker/
├── docs/
├── docker-compose.yml
└── docker-compose.prod.yml
```

## Development Commands

### Backend

```bash
cd backend

npm run dev
npm start

npm run db:migrate
npm run db:seed:all
npm run db:setup
npm run db:fresh
npm run db:reset

npm run lint
npm run lint:fix
npm run format
npm run format:check
```

### Frontend

```bash
cd frontend

npm run dev
npm run build
npm run preview

npm run test
npm run test:watch
npm run test:ui

npm run lint
npm run lint:fix
npm run format
npm run format:check
```

### E2E

```bash
cd e2e-role-tests

npm test
npm run test:headed
npm run test:ui
```

## Profile Image Upload

* Endpoint: `POST /api/users/upload-profile-image`
* Accepted formats: JPEG, JPG, PNG, WebP
* Maximum size: 5MB
* Processing: resize to 300x300 and convert to JPEG
* Storage: `backend/public/uploads/profiles/`
* Served from: `/uploads/profiles/{filename}`

## Security

| Requirement      | Detail                                               |
| ---------------- | ---------------------------------------------------- |
| Session secret   | Minimum 32 characters, enforced at startup           |
| Password policy  | 8+ characters with uppercase, lowercase, and numbers |
| Rate limiting    | Brute-force protection                               |
| Input validation | Joi and express-validator                            |
| HTTPS            | Required for production                              |

Before production:

* Set a strong `SESSION_SECRET`
* Replace memory session storage with Redis or PostgreSQL
* Enable HTTPS
* Review `backend/SECURITY.md`
* Remove seeded demo accounts
* Review CORS and upload restrictions

## Troubleshooting

### Database does not exist

```bash
createdb wom_booking
```

### Password authentication failed

Check `DB_PASSWORD` and `DB_USER` in `.env`.

### Session secret is too short

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Port 3000 is already in use

```bash
lsof -ti:3000 | xargs kill -9
```

### Upload directory missing

```bash
mkdir -p backend/public/uploads/profiles
mkdir -p backend/public/uploads/performances
```

## Contributing

* Follow `.prettierrc` and `.eslintrc`
* Keep code self-documenting
* Use conventional commit messages
* Run tests before opening a pull request

## License

MIT
