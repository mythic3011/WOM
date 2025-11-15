# Backend Improvement Plan

## Overview
Comprehensive plan to enhance backend auto-setup, models, seeders, and migrations for better development experience and maintainability.

## 1. Rate Limiting ✅ COMPLETED

### Changes Made
- **Disabled in Development**: Rate limiters now bypass in `NODE_ENV=development`
- **Increased API Limit**: Changed from 60 to 100 requests per window for production
- **Flexible Configuration**: Uses environment-aware wrapper

### Benefits
- Faster development without hitting rate limits
- Easier API testing and debugging
- Production security maintained

---

## 2. Auto-Setup Enhancements

### Current Issues
- No environment differentiation
- Limited error handling
- No progress indicators
- Hardcoded data dependencies

### Proposed Improvements

#### 2.1 Environment-Aware Setup
```javascript
const setupStrategies = {
  development: {
    resetOnStart: true,
    seedData: 'full',
    logging: 'verbose'
  },
  production: {
    resetOnStart: false,
    seedData: 'minimal',
    logging: 'minimal'
  },
  test: {
    resetOnStart: true,
    seedData: 'test',
    logging: 'silent'
  }
};
```

#### 2.2 Progress Tracking
- Add spinner/progress bars for long operations
- Detailed step-by-step logging
- Time tracking for each phase
- Success/failure summary with colors

#### 2.3 Dependency Management
- Check database connectivity before starting
- Verify all required models exist
- Validate data files before seeding
- Rollback on any failure

#### 2.4 Idempotency
- Check existing data before creating
- Update instead of fail on duplicates
- Skip already-seeded entities
- Clear specific tables only when needed

---

## 3. Model Improvements

### 3.1 Add Validation Hooks
```javascript
// User model
hooks: {
  beforeValidate: (user) => {
    if (user.email) user.email = user.email.toLowerCase();
    if (user.username) user.username = user.username.trim();
  },
  beforeCreate: async (user) => {
    if (user.password) {
      user.password = await bcrypt.hash(user.password, 10);
    }
  }
}
```

### 3.2 Add Virtual Fields
- `fullName` for User (combines title + name)
- `isExpired` for Performance (checks date)
- `occupancyRate` for Performance (available/total)
- `displayName` for Venue (name + location)

### 3.3 Add Instance Methods
```javascript
User.prototype.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

Performance.prototype.hasAvailableSeats = function() {
  return this.availableSeats > 0;
};

Booking.prototype.canCancel = function() {
  const deadline = dayjs(this.performance.date).subtract(24, 'hours');
  return dayjs().isBefore(deadline);
};
```

### 3.4 Add Scopes
```javascript
// Performance scopes
scopes: {
  active: {
    where: {
      status: ['on_sale', 'upcoming']
    }
  },
  withAvailability: {
    where: {
      availableSeats: { [Op.gt]: 0 }
    }
  },
  upcoming: {
    where: {
      date: { [Op.gt]: new Date() }
    },
    order: [['date', 'ASC']]
  }
}
```

### 3.5 Add Indexes
- Composite indexes for common queries
- JSONB indexes for nested data (already done)
- Full-text search indexes for titles/descriptions

---

## 4. Seeder System Enhancement

### 4.1 Unified Seeder Manager
```javascript
class SeederManager {
  constructor() {
    this.seeders = [];
    this.executed = new Set();
  }

  register(name, dependencies, seeder) {
    this.seeders.push({ name, dependencies, seeder });
  }

  async runAll() {
    const order = this.resolveDependencies();
    for (const name of order) {
      await this.runSeeder(name);
    }
  }

  resolveDependencies() {
    // Topological sort
  }
}
```

### 4.2 Seeder Templates
```javascript
// Base seeder class
class BaseSeeder {
  constructor(model) {
    this.model = model;
  }

  async run(data) {
    const created = [];
    for (const item of data) {
      try {
        const instance = await this.model.create(item);
        created.push(instance);
      } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
          await this.handleDuplicate(item);
        } else {
          throw error;
        }
      }
    }
    return created;
  }

  async handleDuplicate(item) {
    // Update or skip logic
  }

  async rollback() {
    // Cleanup logic
  }
}
```

### 4.3 Data Factory System
```javascript
// User factory
export const UserFactory = {
  admin: (overrides = {}) => ({
    role: 'admin',
    email: faker.internet.email(),
    password: 'adminpass',
    ...overrides
  }),
  
  user: (count = 1) => {
    return Array.from({ length: count }, () => ({
      role: 'user',
      email: faker.internet.email(),
      name: faker.person.fullName(),
      password: 'userpass'
    }));
  }
};
```

### 4.4 Seeder CLI Commands
```bash
npm run db:seed:create -- --name=add-new-venues
npm run db:seed:run -- --name=venues
npm run db:seed:undo -- --name=venues
npm run db:seed:status
```

---

## 5. Migration Enhancements

### 5.1 Migration Versioning
- Add version tracking table
- Store migration metadata (executed_at, duration, status)
- Support for migration branches

### 5.2 Better Rollback Support
```javascript
// Each migration
export default {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Migration logic
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
  
  down: async (queryInterface, Sequelize) => {
    // Proper rollback logic with validation
  }
};
```

### 5.3 Migration Templates
```bash
npm run migration:create -- --name=add-column-to-users --type=addColumn
npm run migration:create -- --name=create-reviews-table --type=createTable
```

### 5.4 Data Migrations
- Separate schema migrations from data migrations
- Support for large-scale data transformations
- Batch processing for big tables

---

## 6. Database Utilities

### 6.1 Database Health Check
```javascript
export const healthCheck = async () => {
  return {
    connection: await testConnection(),
    migrations: await getMigrationStatus(),
    seeders: await getSeederStatus(),
    tableStats: await getTableStats(),
    indexes: await getIndexStats()
  };
};
```

### 6.2 Backup & Restore
```javascript
export const backup = async (filename) => {
  // Create database dump
};

export const restore = async (filename) => {
  // Restore from dump
};
```

### 6.3 Query Performance Monitor
- Log slow queries (> 100ms)
- Track N+1 query issues
- Suggest missing indexes
- Generate query optimization reports

---

## 7. Testing Infrastructure

### 7.1 Test Database Setup
```javascript
// testSetup.js
export const setupTestDB = async () => {
  await sequelize.sync({ force: true });
  await seedTestData();
};

export const teardownTestDB = async () => {
  await sequelize.truncate({ cascade: true });
};
```

### 7.2 Model Factories for Tests
```javascript
// In tests
const user = await UserFactory.create();
const performance = await PerformanceFactory.create({ 
  venueId: venue.id 
});
```

### 7.3 Integration Test Helpers
```javascript
export const withAuth = async (role = 'user') => {
  const user = await UserFactory.create({ role });
  const token = generateToken(user);
  return { user, token };
};
```

---

## Implementation Priority

### Phase 1 - Immediate (This Session)
1. ✅ Disable rate limiting in dev
2. Write improvement plan

### Phase 2 - Quick Wins (Next)
1. Add model validation hooks
2. Add common scopes
3. Improve auto-setup logging
4. Add environment-aware config

### Phase 3 - Medium Term
1. Create seeder manager
2. Add data factories
3. Improve migration rollback
4. Add health check endpoint

### Phase 4 - Long Term
1. Add performance monitoring
2. Create backup/restore system
3. Build test infrastructure
4. Add query optimization tools

---

## Configuration

### Environment Variables to Add
```env
NODE_ENV=development
DB_LOGGING=true
AUTO_SETUP=true
AUTO_SETUP_STRATEGY=development
SEED_DATA_AMOUNT=full
MIGRATION_AUTO_RUN=false
QUERY_LOGGING=verbose
SLOW_QUERY_THRESHOLD=100
```

### Package.json Scripts to Add
```json
{
  "scripts": {
    "db:health": "node src/db/health.js",
    "db:backup": "node src/db/backup.js",
    "db:restore": "node src/db/restore.js",
    "db:clean": "node src/db/clean.js",
    "migration:create": "node src/db/createMigration.js",
    "seed:create": "node src/db/createSeeder.js",
    "seed:status": "node src/db/seederStatus.js"
  }
}
```

---

## Testing Plan

### Unit Tests
- Model validation
- Instance methods
- Virtual fields
- Hooks

### Integration Tests
- Auto-setup process
- Seeder execution
- Migration rollback
- API endpoints with seeded data

### Performance Tests
- Query performance
- Bulk operations
- Concurrent requests
- Memory usage

---

## Monitoring & Maintenance

### Logging
- Structured logging with Winston
- Log levels per environment
- Separate logs for queries, errors, and access
- Log rotation and archival

### Metrics to Track
- Database connection pool usage
- Query execution times
- Migration execution duration
- Seeder success/failure rates
- API response times

### Alerts
- Failed migrations
- Slow queries (> 1s)
- Connection pool exhaustion
- Disk space warnings

---

## Documentation

### Developer Guide
- How to create migrations
- How to write seeders
- How to use factories in tests
- Database conventions and best practices

### API Documentation
- OpenAPI/Swagger specs
- Request/response examples
- Authentication flows
- Error codes and handling

---

## Summary

This improvement plan transforms the backend from a basic setup into a robust, developer-friendly system with:

- **Better DX**: Faster development, easier testing
- **Reliability**: Proper error handling, rollback support
- **Maintainability**: Clear structure, good documentation
- **Performance**: Optimized queries, proper indexes
- **Flexibility**: Environment-aware, configurable

The phased approach allows gradual implementation without disrupting current functionality.
