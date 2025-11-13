# Western Orchestral Music Booking System - Backend API

Express.js backend with Sequelize ORM and PostgreSQL database.

## Tech Stack

- Express.js - Web framework
- Sequelize - ORM for PostgreSQL
- PostgreSQL - Database
- bcryptjs - Password hashing
- express-session - Session management
- express-validator - Request validation
- helmet - Security headers
- cors - Cross-origin resource sharing

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Database Setup

Create PostgreSQL database:

```sql
CREATE DATABASE wom_booking;
```

### 3. Environment Configuration

**REQUIRED:** Copy the example environment file and configure:

```bash
cp .env.example .env
```

**Important:** Update all values in `.env`, especially:

- `SESSION_SECRET` - Must be at least 32 characters
- `DB_PASSWORD` - Use a strong password
- All database connection details

The application will not start without these required environment variables.

Create `.env` file manually in backend root if needed:

```env
NODE_ENV=development
PORT=3000

POSTGRES_DB=wom_booking
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=postgreshost

DB_NAME=wom_booking
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

SESSION_SECRET=your-secret-key-change-in-production-use-long-random-string

CORS_ORIGIN=http://localhost:5173

RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

PGADMIN_DEFAULT_EMAIL=admin@wom.hk
PGADMIN_DEFAULT_PASSWORD=admin
PGADMIN_PORT=5050
```

### 4. Setup Database

Choose ONE of the following methods:

**Method A: Production Setup (Migrations + Seeders)**

```bash
npm run db:setup
```

This runs migrations to create schema, then seeders to populate data.

Alternatively, run step by step:

```bash
npm run db:migrate      # Create tables
npm run db:seed:all     # Populate with seed data
```

**Method B: Quick Development Setup (Drop & Recreate)**

```bash
npm run db:fresh
```

This drops all tables, recreates them, and seeds with Faker.js generated data.

**Method C: Reset Database**

```bash
npm run db:reset
```

This undoes migrations, re-runs migrations, and re-runs seeders.

**Default Accounts (after seeding):**

- Admin: admin@wom.hk / adminpass
- User: user@example.com / userpass

**Migration Seeders Include:**

- 5 Users (basic accounts)
- 3 Venues (Hong Kong venues)
- 3 Performances (classical concerts)
- 5 Ticket types

**Faker.js Seed (`db:fresh`) Includes:**

- 20 Users (18 generated)
- 8 Venues (5 generated)
- 12 Performances (9 generated)
- 5 Ticket types

## Docker Setup

### Backend Only (Recommended for Development)

Run backend with PostgreSQL in Docker:

```bash
cd backend
docker-compose up
```

This starts:

- PostgreSQL on port 5432
- Backend API on port 3000
- pgAdmin on port 5050 (http://localhost:5050)

Login credentials for pgAdmin:

- Email: admin@wom.hk
- Password: admin

Stop services:

```bash
docker-compose down
```

Remove volumes:

```bash
docker-compose down -v
```

### Full Stack (Backend + Frontend + Database)

From project root:

```bash
docker-compose up
```

Services:

- PostgreSQL: localhost:5432
- Backend: http://localhost:3000
- Frontend: http://localhost:5173
- pgAdmin: http://localhost:5050

### Production Deployment

```bash
docker-compose -f docker-compose.prod.yml up -d
```

Environment variables required:

- `DB_PASSWORD` - Database password
- `SESSION_SECRET` - Session secret key
- `CORS_ORIGIN` - Frontend URL

Example:

```bash
export DB_PASSWORD=secure-password
export SESSION_SECRET=your-secret-key-min-32-chars
export CORS_ORIGIN=https://yourdomain.com
docker-compose -f docker-compose.prod.yml up -d
```

### Docker Commands

Build images:

```bash
docker-compose build
```

View logs:

```bash
docker-compose logs -f backend
```

Execute database setup in container:

**Option 1: Production setup (migrations + seeders)**

```bash
docker-compose exec backend npm run db:setup
```

**Option 2: Development setup (drop & recreate with Faker.js)**

```bash
docker-compose exec backend npm run db:fresh
```

Using Makefile:

```bash
make seed        # Runs db:fresh
make migrate     # Runs db:migrate only
```

## Running the Server

### Development Mode

```bash
npm run dev
```

Server runs on http://localhost:3000

API Documentation: http://localhost:3000/docs

### Production Mode

```bash
npm start
```

## Security

See `SECURITY.md` for comprehensive security guidelines.

**Critical Security Requirements:**

1. **Environment Variables:** All sensitive data must be in `.env` file
2. **Session Secret:** Minimum 32 characters required
3. **Password Policy:** 8+ characters with uppercase, lowercase, and numbers
4. **Rate Limiting:** Automatic protection against brute force attacks
5. **Input Sanitization:** All inputs automatically sanitized
6. **Session Store:** Using memory store (development only) - use Redis for production

**Before Production:**

- [ ] Set strong SESSION_SECRET (32+ characters)
- [ ] Use Redis/PostgreSQL session store
- [ ] Enable HTTPS/SSL
- [ ] Review SECURITY.md checklist

## API Documentation

Interactive API documentation is available at `/docs` endpoint using **Scalar API Reference**.

**Access Documentation:**

- Development: http://localhost:3000/docs
- Production: https://your-domain.com/docs

**Features:**

- Modern, beautiful UI with dark mode
- Interactive API testing
- Request/response examples
- Authentication support
- Schema validation
- Code generation (curl, JavaScript, Python, etc.)

**Quick Navigation:**

- All endpoints organized by tags
- Search functionality
- Try out API calls directly
- View detailed request/response schemas

## API Endpoints

### Authentication

- POST /api/auth/register - Register new user
- POST /api/auth/login - Login user
- POST /api/auth/logout - Logout user
- GET /api/auth/me - Get current user
- GET /api/auth/check - Check session status

### Users

- GET /api/users - List all users (admin only)
- GET /api/users/:id - Get user by ID
- POST /api/users - Create user (admin only)
- PUT /api/users/:id - Update user
- DELETE /api/users/:id - Delete user (admin only)
- GET /api/users/:id/bookings - Get user bookings

### Performances

- GET /api/performances - List performances with filters
- GET /api/performances/:id - Get performance details
- POST /api/performances - Create performance (admin)
- PUT /api/performances/:id - Update performance (admin)
- DELETE /api/performances/:id - Delete performance (admin)
- GET /api/performances/:id/availability - Get seat availability

### Bookings

- GET /api/bookings - List bookings (own or all for admin)
- GET /api/bookings/:id - Get booking details
- POST /api/bookings - Create booking
- PUT /api/bookings/:id - Update booking
- POST /api/bookings/:id/cancel - Cancel booking
- POST /api/bookings/:id/confirm - Confirm booking (admin)
- GET /api/bookings/stats - Get booking statistics (admin)

### Venues

- GET /api/venues - List venues
- GET /api/venues/:id - Get venue details
- POST /api/venues - Create venue (admin)
- PUT /api/venues/:id - Update venue (admin)
- DELETE /api/venues/:id - Delete venue (admin)

### Ticket Types

- GET /api/ticket-types - List ticket types
- GET /api/ticket-types/:id - Get ticket type
- POST /api/ticket-types - Create ticket type (admin)
- PUT /api/ticket-types/:id - Update ticket type (admin)
- DELETE /api/ticket-types/:id - Delete ticket type (admin)

## Database Schema

### Users

- UUID primary key
- Email, username (unique)
- Password (hashed with bcrypt)
- Role (admin/user)
- Status (active/inactive/suspended)
- Profile info (name, phone, address, birthday, gender)

### Performances

- Integer primary key
- Title, composer, conductor, orchestra
- Venue reference
- Date, duration, category
- JSONB fields: showtimes, program, soloists, pricingSections, tags
- Seat availability tracking

### Bookings

- Integer primary key
- User and Performance references
- Booking reference (unique)
- JSONB seats array
- Amount, payment method, status
- Showtime reference

### Venues

- Integer primary key
- Name, address, capacity
- JSONB layout with sections
- JSONB facilities array

### TicketTypes

- String primary key
- Name, description
- Discount multiplier
- Eligibility rules

## Authentication

Session-based authentication with express-session:

- Sessions stored in memory (for development)
- Secure HTTP-only cookies
- CSRF protection ready
- Rate limiting on auth endpoints

## Security Features

- Helmet.js security headers
- CORS with credentials
- Password hashing (bcrypt)
- Request validation
- Rate limiting
- SQL injection protection (Sequelize)
- XSS protection

## Error Handling

Centralized error handler returns consistent JSON:

```json
{
  "success": false,
  "message": "Error message"
}
```

## NPM Scripts

### Server

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon hot-reload

### Code Quality

- `npm run lint` - Check code for issues
- `npm run lint:fix` - Auto-fix linting issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Database Setup

- `npm run db:setup` - Run migrations + seeders (recommended for production)
- `npm run db:fresh` - Drop all, recreate, and seed with Faker.js data (development)
- `npm run db:reset` - Undo migrations, re-migrate, and re-seed

### Database Migrations

- `npm run db:migrate` - Run pending migrations
- `npm run db:migrate:undo` - Undo last migration
- `npm run db:migrate:undo:all` - Undo all migrations

### Database Seeders

- `npm run db:seed:all` - Run all seeders
- `npm run db:seed:undo:all` - Undo all seeders

## Key Features

### Advanced Logging (Winston)

- Console logging with colors and formatting
- File logging with daily rotation (production)
- Error logs retained for 30 days
- Combined logs retained for 14 days
- HTTP request logging middleware

### Schema Validation (Joi)

- User registration/login validation
- Performance CRUD validation
- Booking validation with custom error messages
- Venue validation

### Date Utilities (Day.js)

- Format dates/times with Hong Kong timezone
- Date arithmetic (add/subtract days/hours)
- Date comparisons and relative time
- Start/end of day/month calculations

### Input Sanitization

- XSS protection with HTML sanitization
- Email normalization
- String escaping and validation
- Object deep sanitization

### Image Processing (Sharp)

- Profile images (300x300px, optimized)
- Performance images (800x600px)
- Venue images (1200x800px)
- Thumbnail generation
- WebP conversion
- Base64 encoding

### File Uploads (Multer)

- Single and multiple file uploads
- Memory storage for processing
- File type validation (JPEG, PNG, WebP)
- Size limit (5MB per file)

### Email Notifications (Nodemailer)

- Booking confirmation emails
- Booking cancellation emails
- Welcome emails for new users
- Password reset emails
- HTML email templates

### Async Error Handling

- Automatic async/await error catching
- No need for try-catch in routes
- Centralized error handling middleware

### Code Quality Tools

- ESLint for code standards
- Prettier for consistent formatting
- Pre-configured rules for Express/Node.js

## Project Structure

```
backend/src/
├── config/          - Database, session, CORS config
├── models/          - Sequelize models
├── controllers/     - Request handlers
├── services/        - Business logic
├── routes/          - API routes
├── middleware/      - Auth, validation, error handling
├── utils/           - Helper functions
├── db/             - Seed scripts and data
├── app.js          - Express app setup
└── server.js       - Server entry point
```

## Development Notes

- All models use Sequelize ORM
- JSONB used for complex nested data
- Session management with memorystore
- Graceful shutdown on SIGTERM/SIGINT
- Follows project rules: no comments in code, no emojis
