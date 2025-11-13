# Western Orchestral Music Performance Booking System

## Architecture Overview

**Full-stack SPA** with session-based authentication and localStorage-driven frontend state:

- **Backend**: Express.js REST API with Sequelize ORM, PostgreSQL, session-based auth
- **Frontend**: Vite + Vanilla JS/jQuery SPA with page.js routing, no framework
- **Data Flow**: Backend API → Frontend localStorage cache → UI components
- **Deployment**: Docker Compose with separate containers for frontend, backend, database, and pgAdmin

**Critical Pattern**: Frontend uses localStorage v4.0 with compression (LZString), encryption (crypto-js), TTL, and automatic cleanup. Session cookies handle auth state; localStorage caches data for offline-first UX.

## Project Structure

```
backend/src/
├── models/       # Sequelize models with JSONB fields (showtimes, seats, layout, facilities)
├── services/     # Business logic (booking, performance, email)
├── controllers/  # Request handlers (thin layer calling services)
├── routes/       # Express routes with validation middleware
├── middleware/   # auth, rateLimiter, sanitize, validation
├── utils/        # dateUtils, hash, imageProcessor, joiSchemas, sanitizer
├── config/       # database, session, cors, logger, openapi
└── db/           # migrations, seeders, seed.js (Faker.js auto-setup)

frontend/src/
├── pages/        # Page modules (Auth, User, Admin, Public) with render/afterRender
├── components/   # Reusable UI (Modal, SeatMap, Card, Button, Table) as factory functions
├── services/     # API calls (storageService, api helpers)
├── router/       # page.js SPA routing with auth guards
├── utils/        # crypto, navigation, seo, healthCheck
└── common/       # navbar, footer (dynamically loaded HTML)
```

## Development Commands

**Backend** (from `backend/`):

- `npm run dev` - nodemon hot-reload
- `npm run db:fresh` - drop all, recreate, seed with Faker.js data (development)
- `npm run db:setup` - migrations + seeders (production)
- `npm run db:reset` - undo migrations, re-migrate, re-seed

**Docker** (from project root):

- `docker-compose up` - start all services (postgres, backend, frontend, phppgadmin)
- `make seed` or `make fresh` - exec into backend container and run `db:fresh`
- `make logs` - tail backend logs

**Frontend** (from `frontend/`):

- `npm run dev` - Vite dev server on :5173

## Critical Conventions

### Code Style (ENFORCED)

- **NO CODE COMMENTS**: Write self-documenting code. Remove all inline/block/JSDoc comments.
- **NO SYMBOLS/EMOJIS**: No ✓✗✅❌ in code, logs, or console output.
- **NO LINEAR GRADIENTS**: Use solid colors with borders/shadows instead of `linear-gradient()` or Tailwind `bg-gradient-to-*`.
- **NO SUMMARY DOCUMENTS**: Never create `SETUP_SUMMARY.md` or similar; keep docs minimal.

### Git Commits

Format: `type: message` (e.g., `feat: Add seat reservation`, `fix: Fix login crash`)

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `build`, `ci`, `revert`

### Database Patterns

- **JSONB for complex data**: `Performance.showtimes`, `Performance.pricingSections`, `Venue.layout`, `Booking.seats` are all JSONB arrays/objects
- **No ORMs for nested updates**: Use raw JSONB operators when updating nested structures
- **Generated fields**: `Booking.bookingReference` auto-generated as `BK${timestamp36}${random36}`

### Frontend Component Pattern

Components export factory functions returning HTML strings:

```javascript
export function createButton({
  text,
  onClick,
  variant = "primary",
  icon,
  disabled,
}) {
  return `<button class="btn btn-${variant}" ${
    disabled ? "disabled" : ""
  }>${text}</button>`;
}
```

Modules export `{ render, afterRender, title }`:

```javascript
export const LoginPage = {
  title: "Login - WOM",
  async render() {
    return `<div>...</div>`;
  },
  async afterRender() {
    $("#loginForm").on("submit", handleLogin);
  },
};
```

### API & Authentication

- **Session-based auth**: `express-session` with `memorystore` (dev) or Redis (prod)
- **CORS**: `credentials: true` required for session cookies
- **Rate limiting**: 100 req/15min global, 5 req/15min on auth endpoints
- **Validation**: Joi schemas in `backend/src/utils/joiSchemas.js`, express-validator in routes
- **Error responses**: Always `{ success: false, message: "..." }`

### Frontend Storage

Access via `storage` service (`frontend/src/services/storageService.js`):

```javascript
import { storage } from "/src/services/storageService.js";
storage.getUser(); // returns current user object or null
storage.setUser(user); // sets user with encryption
storage.get("performances"); // gets performances array from cache
storage.set("key", value, { ttl: 3600, compress: true }); // set with 1hr TTL
```

### SPA Routing

Use `page.redirect(ROUTES.XXX)` for navigation, never `window.location.href`. Routes defined in `frontend/src/config/routes.js`:

```javascript
import { ROUTES } from "/src/config/routes.js";
page.redirect(ROUTES.AUTH.LOGIN);
page.redirect(ROUTES.USER.BOOKINGS);
```

## Key Workflows

### Adding a New Feature

1. **Backend**: Model → Service → Controller → Route → Validation schema
2. **Frontend**: Page module → API service → Component → Router entry
3. **Database**: Migration file → run `npm run db:migrate`

### Debugging

- Backend logs: Winston logger with daily rotation (`backend/logs/`)
- API docs: `http://localhost:3000/docs` (Scalar API Reference)
- Dev tools: `/dev-tools` page (development only) for mock data, storage inspection, quick login

### Testing Authentication

Default seeded users:

- Admin: `admin@wom.hk` / `adminpass`
- User: `user@example.com` / `userpass`

Or use `/dev-tools` → "Login as Admin/User" buttons.

### Environment Setup

**REQUIRED**: Copy `backend/.env.example` to `backend/.env` and set:

- `SESSION_SECRET` (min 32 chars, generate with `openssl rand -hex 32`)
- `DB_PASSWORD` (secure password)
- `CORS_ORIGIN` (frontend URL, e.g., `http://localhost:5173`)

### Image Uploads

Multer → Sharp processing → base64 encoding:

- Profile images: 300×300px
- Performance images: 800×600px
- Venue images: 1200×800px

All converted to WebP, optimized, and stored as base64 in DB.

## Common Pitfalls

1. **Seat booking race conditions**: `bookingService.js` checks existing bookings for seat conflicts via `showtimeId` and `seats` JSONB array. Always validate seat availability before confirming.

2. **JSONB querying**: Use Sequelize operators correctly:

   ```javascript
   where: { showtimes: { [Op.contains]: [{ id: showtimeId }] } }
   ```

3. **Frontend auth state**: `checkAuth()` middleware in router validates `storage.getUser()` and redirects to login if null. Update navbar via `updateNavigation()` after auth changes.

4. **Session persistence**: Backend sessions use `memorystore` (dev only). Production MUST use Redis or PostgreSQL session store.

5. **Date handling**: Use Day.js with Hong Kong timezone (`backend/src/utils/dateUtils.js`). All dates stored as ISO 8601 strings.

## External Dependencies

- **PDF Generation**: jspdf + html2canvas for e-tickets and invoices
- **QR/Barcode**: qrcode, jsbarcode libraries
- **Email**: Nodemailer with SMTP configuration
- **Icons**: Font Awesome 6.7.2 (webfonts copied via postinstall script)

## When Editing

- Preserve existing JSONB structures when modifying Performance/Venue/Booking models
- Update OpenAPI spec (`backend/src/config/openapi.js`) when adding/changing endpoints
- Keep validation schemas in sync between Joi (backend) and client-side (frontend)
- Never add comments - write self-documenting code
