# Western Orchestral Music Performance Seat Booking System

A full-stack web application for managing classical music concert bookings with interactive seat selection, user authentication, and comprehensive admin tools.

## Overview

This system provides a complete solution for orchestral performance ticket booking, featuring:

- Interactive seat map visualization and selection
- Real-time seat availability tracking
- User authentication with role-based access control
- Admin dashboard for managing performances, venues, and bookings
- Responsive design for desktop and mobile devices
- RESTful API with comprehensive documentation

## Tech Stack

### Backend
- **Runtime**: Node.js 18+ with ES modules
- **Framework**: Express.js 4.x
- **Database**: PostgreSQL 14+ with Sequelize ORM
- **Authentication**: Session-based with express-session
- **Validation**: Joi + express-validator
- **Security**: helmet, cors, bcryptjs, rate limiting
- **File Upload**: multer + sharp (image processing)
- **Testing**: Jest + fast-check (property-based testing)

### Frontend
- **Build Tool**: Vite 7.x
- **JavaScript**: Vanilla JS (ES6+) with jQuery 3.7
- **Routing**: page.js (client-side SPA routing)
- **Styling**: Tailwind CSS 3.x
- **UI Libraries**: sweetalert2, notyf, panzoom, sortablejs
- **Testing**: Vitest + jsdom

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Database Admin**: pgAdmin 4
- **API Documentation**: Scalar (OpenAPI 3.1)

## Quick Start

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 14 or higher
- npm or yarn package manager
- Docker and Docker Compose (optional, for containerized setup)

### Installation

#### Option 1: Local Development Setup

**1. Clone the repository**

```bash
git clone https://github.com/mythic3011/WOM
cd WOM
```

**2. Backend Setup**

```bash
cd backend
npm install
```

**3. Configure Environment Variables**

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure the following required variables:

```env
# Database Configuration
DB_NAME=wom_booking
DB_USER=postgres
DB_PASSWORD=your-secure-password-here
DB_HOST=localhost
DB_PORT=5432

# Session Secret (REQUIRED - minimum 32 characters)
SESSION_SECRET=your-session-secret-32-chars-minimum-here

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

**Generate a secure session secret:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**4. Create Database**

```bash
createdb wom_booking
```

Or using PostgreSQL CLI:

```sql
CREATE DATABASE wom_booking;
```

**5. Create Uploads Directory**

```bash
mkdir -p backend/public/uploads/profiles
mkdir -p backend/public/uploads/performances
```

**6. Setup Database Schema and Seed Data**

Choose one of the following methods:

**Method A: Production Setup (Migrations + Seeders)**
```bash
npm run db:setup
```

**Method B: Development Setup (Drop & Recreate with Mock Data)**
```bash
npm run db:fresh
```

**7. Start Backend Server**

```bash
npm run dev
```

Backend will be available at: http://localhost:3000

API Documentation: http://localhost:3000/docs

**8. Frontend Setup**

Open a new terminal:

```bash
cd frontend
npm install
```

Configure frontend environment:

```bash
cp .env.example .env
```

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_BACKEND_URL=http://localhost:3000
```

**9. Start Frontend Development Server**

```bash
npm run dev
```

Frontend will be available at: http://localhost:5173

#### Option 2: Docker Setup

**1. Clone the repository**

```bash
git clone https://github.com/mythic3011/WOM
cd WOM
```

**2. Configure Environment**

Create `.env` file in project root:

```bash
cp backend/.env.example .env
```

Update the environment variables as needed.

**3. Start All Services**

```bash
docker-compose up
```

This starts:
- PostgreSQL database on port 5432
- Backend API on port 3000
- Frontend on port 5173
- pgAdmin on port 5050

**4. Setup Database (in Docker)**

In a new terminal:

```bash
docker-compose exec backend npm run db:setup
```

**5. Access the Application**

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Documentation: http://localhost:3000/docs
- pgAdmin: http://localhost:5050

**Stop Services:**

```bash
docker-compose down
```

**Remove Volumes:**

```bash
docker-compose down -v
```

## Default Accounts

After seeding the database, you can log in with these accounts:

**Admin Account:**
- Email: admin@wom.hk / admin
- Password: adminpass

**Regular User Account:**
- Email: user@example.com /user
- Password: userpass

## Project Structure

```
project-root/
├── backend/              # Express.js API server
│   ├── src/
│   │   ├── config/      # Configuration files
│   │   ├── models/      # Sequelize models
│   │   ├── controllers/ # Request handlers
│   │   ├── services/    # Business logic
│   │   ├── routes/      # API routes
│   │   ├── middleware/  # Auth, validation, error handling
│   │   ├── utils/       # Helper functions
│   │   └── db/          # Migrations and seeders
│   ├── public/
│   │   └── uploads/     # User-uploaded files
│   └── package.json
│
├── frontend/            # Vite SPA application
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   ├── utils/       # Utility functions
│   │   ├── router/      # Client-side routing
│   │   └── store/       # State management
│   └── package.json
│
├── e2e-role-tests/      # Playwright E2E tests
├── docker/              # Docker data volumes
├── docs/                # Documentation
├── docker-compose.yml   # Development stack
└── docker-compose.prod.yml
```

## Key Features

### User Features
- Browse upcoming orchestral performances
- Interactive seat map with real-time availability
- Multiple ticket types (Adult, Student, Senior, etc.)
- Booking management and history
- User profile with image upload
- Secure authentication and session management

### Admin Features
- Performance management (create, edit, delete)
- Venue management with customizable seat layouts
- Booking oversight and management
- User management
- Ticket type configuration
- Dashboard with statistics and analytics

### Technical Features
- RESTful API with OpenAPI documentation
- Session-based authentication with secure cookies
- Role-based access control (admin/user)
- Image upload and processing with Sharp
- Rate limiting and security headers
- Input validation and sanitization
- JSONB fields for complex data structures
- Property-based testing with fast-check

## Profile Image Upload System

The application uses a URL-based profile image system:

**Features:**
- Upload via multipart/form-data
- Automatic image processing (resize to 300x300, JPEG conversion)
- Secure filename generation
- Old image cleanup on update
- Static file serving with browser caching

**Endpoint:**
- POST /api/users/upload-profile-image
- Accepts: JPEG, JPG, PNG, WebP
- Maximum size: 5MB
- Returns: URL path to uploaded image

**Storage:**
- Location: `backend/public/uploads/profiles/`
- Served via: `/uploads/profiles/{filename}`
- Cache: 1-year max-age for optimal performance

## API Documentation

Interactive API documentation is available using Scalar:

- Development: http://localhost:3000/docs
- Features: Interactive testing, request/response examples, code generation

## Development

### Backend Commands

```bash
cd backend

# Development
npm run dev              # Start with nodemon hot-reload
npm start                # Production mode

# Database
npm run db:migrate       # Run migrations
npm run db:seed:all      # Run seeders
npm run db:setup         # Migrate + seed (production)
npm run db:fresh         # Drop/recreate with mock data (dev)
npm run db:reset         # Undo all, re-migrate, re-seed

# Code Quality
npm run lint             # Check code
npm run lint:fix         # Auto-fix issues
npm run format           # Format with Prettier
npm run format:check     # Check formatting
```

### Frontend Commands

```bash
cd frontend

# Development
npm run dev              # Start Vite dev server (port 5173)
npm run build            # Production build
npm run preview          # Preview production build

# Testing
npm run test             # Run tests once
npm run test:watch       # Watch mode
npm run test:ui          # Vitest UI

# Code Quality
npm run lint             # ESLint check
npm run lint:fix         # Auto-fix
npm run format           # Prettier format
npm run format:check     # Check formatting
```

### E2E Tests

```bash
cd e2e-role-tests

npm test                 # Run all Playwright tests
npm run test:headed      # Run with browser visible
npm run test:ui          # Playwright UI mode
```

## Environment Variables

### Backend (.env)

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DB_NAME=wom_booking
DB_USER=postgres
DB_PASSWORD=your-secure-password-here
DB_HOST=localhost
DB_PORT=5432

# Session (REQUIRED - minimum 32 characters)
SESSION_SECRET=your-session-secret-32-chars-minimum-here

# CORS
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Mock Data (optional)
MOCK_DATA_MODE=standard
MOCK_DATA_SEED=12345
MOCK_BOOKINGS_COUNT=50
MOCK_BOOKING_OCCUPANCY=0.3
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000/api
VITE_BACKEND_URL=http://localhost:3000
```

## Security

**Critical Security Requirements:**

1. **Session Secret**: Minimum 32 characters required
2. **Password Policy**: 8+ characters with uppercase, lowercase, and numbers
3. **Rate Limiting**: Automatic protection against brute force attacks
4. **Input Sanitization**: All inputs automatically sanitized
5. **HTTPS**: Required for production deployment

**Before Production:**
- Set strong SESSION_SECRET (32+ characters)
- Use Redis or PostgreSQL session store (not memory store)
- Enable HTTPS/SSL
- Review security checklist in backend/SECURITY.md

## Troubleshooting

### Database Connection Issues

**Error: "database does not exist"**
```bash
createdb wom_booking
```

**Error: "password authentication failed"**
- Check DB_PASSWORD in .env matches PostgreSQL user password
- Verify DB_USER has proper permissions

### Session Secret Error

**Error: "SESSION_SECRET must be at least 32 characters"**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output to SESSION_SECRET in .env

### Port Already in Use

**Error: "Port 3000 is already in use"**
```bash
lsof -ti:3000 | xargs kill -9
```

Or change PORT in .env to a different value

### Uploads Directory Issues

**Error: "ENOENT: no such file or directory"**
```bash
mkdir -p backend/public/uploads/profiles
mkdir -p backend/public/uploads/performances
```

## Contributing

1. Follow the code style guidelines in `.prettierrc` and `.eslintrc`
2. No code comments (code should be self-documenting)
3. No symbols or emojis in code or output
4. Use meaningful commit messages following conventional commits
5. Test thoroughly before submitting pull requests

## License

MIT

## Support

For issues and questions:
- Check the API documentation at http://localhost:3000/docs
- Review backend/README.md for detailed backend information
- Review frontend/README.md for detailed frontend information
- Check the troubleshooting section above
