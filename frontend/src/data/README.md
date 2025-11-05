# Mock Data & Storage Service Documentation

## Overview

This directory contains improved mock data management and storage services with enhanced features for data generation, validation, querying, and storage management.

## Files

### 1. `mockData.js`

Core mock data exports with static datasets for development and testing.

**Exports:**

- `MOCK_VENUES` - Venue data
- `MOCK_USERS` - User accounts
- `MOCK_PERFORMANCES` - Performance/event data
- `MOCK_BOOKINGS` - Booking records
- `MOCK_SEATS` - Seat configurations
- `MOCK_TICKET_TYPES` - Ticket type definitions
- `MOCK_TRANSACTIONS` - Transaction history
- `MOCK_NOTIFICATIONS` - Notification data
- `MockDataHelpers` - Utility functions for data manipulation

### 2. `mockDataFactory.js`

Data generation and manipulation utilities.

**Exports:**

- `DataFactory` - Data generation functions
- `DateUtils` - Date formatting and manipulation
- `DataValidation` - Data validation utilities
- `DataQuery` - Query and filter operations

### 3. `../services/storageService.js`

Enhanced localStorage/sessionStorage wrapper with advanced features.

## Features

### Storage Service (v2.0)

#### New Features

1. **Data Versioning & Migration**

   - Automatic schema migration from v1.0 to v2.0
   - Preserves data integrity during upgrades

2. **Storage Management**

   - Automatic cleanup of expired data
   - Storage quota monitoring
   - Automatic cleanup when quota is exceeded
   - Storage size and usage statistics

3. **TTL (Time-to-Live) Support**

   ```javascript
   storage.set("tempData", value, { ttl: 60000 }); // Expires in 60 seconds
   ```

4. **Backup & Restore**

   ```javascript
   const backup = storage.backup();
   storage.restore(backup, { merge: false });
   ```

5. **Event Listeners**

   ```javascript
   storage.on("change", (data) => {
     console.log("Storage changed:", data);
   });
   ```

6. **Data Validation**

   ```javascript
   const result = storage.validate("users", {
     type: "object",
     required: ["id", "name", "email"],
   });
   ```

7. **Namespace Support**

   - All keys are namespaced with `wom_` prefix
   - Prevents conflicts with other apps

8. **Storage Info**
   ```javascript
   const info = storage.getStorageInfo();
   // {
   //   size: 12345,
   //   maxSize: 5242880,
   //   used: "0.24%",
   //   keys: 10,
   //   available: 5230535
   // }
   ```

### Mock Data Factory

#### Data Generation

**Generate Single Items:**

```javascript
import { DataFactory } from "./mockDataFactory.js";

const user = DataFactory.generateUser();
const performance = DataFactory.generatePerformance();
const booking = DataFactory.generateBooking(userId, perfId);
```

**Generate Batches:**

```javascript
const users = DataFactory.seedUsers(20);
const performances = DataFactory.seedPerformances(30);
const bookings = DataFactory.seedBookings(users, performances, 5);
```

**Generate Complete Dataset:**

```javascript
const dataset = DataFactory.createMockDataSet();
// Returns: { users, performances, bookings, venues, stats }
```

#### Date Utilities

```javascript
import { DateUtils } from "./mockDataFactory.js";

DateUtils.formatDate(date, "YYYY-MM-DD");
DateUtils.formatDateTime(date);
DateUtils.isUpcoming(date);
DateUtils.isPast(date);
DateUtils.daysUntil(date);
DateUtils.daysAgo(date);
DateUtils.relativeTime(date); // "2 days ago"
```

#### Data Validation

```javascript
import { DataValidation } from "./mockDataFactory.js";

const result = DataValidation.validateUser(user);
// { valid: true, errors: [] }

const result2 = DataValidation.validateBooking(booking);
// { valid: false, errors: ['Missing fields: seats'] }
```

#### Data Querying

```javascript
import { DataQuery } from "./mockDataFactory.js";

const confirmed = DataQuery.filterByStatus(bookings, "confirmed");
const recent = DataQuery.filterByDateRange(items, startDate, endDate);
const sorted = DataQuery.sortByDate(items, "date", true);
const grouped = DataQuery.groupBy(items, "status");
const results = DataQuery.search(items, "beethoven", ["title", "composer"]);
const paginated = DataQuery.paginate(items, 1, 20);
```

### Mock Data Helpers

The `MockDataHelpers` object provides convenient methods for working with mock data:

#### Data Retrieval

```javascript
import { MockDataHelpers } from "./mockData.js";

const user = MockDataHelpers.getUserById("user1");
const performance = MockDataHelpers.getPerformanceById("perf_1");
const booking = MockDataHelpers.getBookingById("BK001");
const venue = MockDataHelpers.getVenueById(1);
```

#### Filtering & Searching

```javascript
const userBookings = MockDataHelpers.getUserBookings("user1");
const perfBookings = MockDataHelpers.getPerformanceBookings("perf_1");
const upcoming = MockDataHelpers.getUpcomingPerformances();
const available = MockDataHelpers.getAvailablePerformances();
const confirmed = MockDataHelpers.getBookingsByStatus("confirmed");

const searchResults = MockDataHelpers.searchPerformances("beethoven");
const users = MockDataHelpers.searchUsers("john");
const bookings = MockDataHelpers.searchBookings("BK001");
```

#### Statistics

```javascript
const revenue = MockDataHelpers.getTotalRevenue();

const bookingStats = MockDataHelpers.getBookingStats();
// { total, confirmed, pending, cancelled, revenue }

const perfStats = MockDataHelpers.getPerformanceStats();
// { total, upcoming, onSale, soldOut, totalSeats, bookedSeats }

const userStats = MockDataHelpers.getUserStats();
// { total, active, inactive, admins, regularUsers }
```

#### Analytics

```javascript
const revenueByPerf = MockDataHelpers.getRevenueByPerformance();
const revenueByMonth = MockDataHelpers.getRevenueByMonth();
const popular = MockDataHelpers.getPopularPerformances(5);
const topCustomers = MockDataHelpers.getTopCustomers(10);
const seatAvail = MockDataHelpers.getSeatAvailability("perf_1");
```

#### Data Enrichment

```javascript
const enriched = MockDataHelpers.enrichBooking(booking);
// Adds performance and user objects to booking

const enrichedList = MockDataHelpers.enrichBookings(bookings);
```

#### Export

```javascript
const csv = MockDataHelpers.exportToCSV(bookings, "bookings");
const csv2 = MockDataHelpers.exportToCSV(performances, "performances");
const csv3 = MockDataHelpers.exportToCSV(users, "users");
```

#### Data Management

```javascript
const defaults = MockDataHelpers.resetToDefaults();
const merged = MockDataHelpers.mergeData(storedData, defaultData);
const generated = MockDataHelpers.generateMockData({
  users: 50,
  performances: 100,
  bookingsPerUser: 10,
});
```

## Migration Guide

### From Storage v1.0 to v2.0

The storage service automatically migrates data on first load:

**Property Changes:**

- `userId` → `id`
- `nickname` → `name`
- `passwordHash` → `password`
- `createdAt` → `registeredAt`

**What You Need to Do:**

1. Update code to use new property names
2. The migration runs automatically on page load
3. Verify data integrity after migration

## Best Practices

### Storage

1. **Use TTL for temporary data:**

   ```javascript
   storage.set("cart", items, { ttl: 3600000 }); // 1 hour
   ```

2. **Regular backups for production:**

   ```javascript
   setInterval(() => {
     const backup = storage.backup();
     sendToServer(backup);
   }, 86400000); // Daily
   ```

3. **Monitor storage usage:**

   ```javascript
   const info = storage.getStorageInfo();
   if (info.size > info.maxSize * 0.8) {
     console.warn("Storage nearly full!");
   }
   ```

4. **Use validation for critical data:**

   ```javascript
   const result = storage.validate("user", {
     type: "object",
     required: ["id", "email", "role"],
   });

   if (!result.valid) {
     console.error("Invalid user data:", result.errors);
   }
   ```

### Mock Data

1. **Use factories for dynamic data:**

   ```javascript
   // Good
   const newUser = DataFactory.generateUser({ role: "admin" });

   // Avoid hardcoding
   const newUser = { id: "123", name: "Test" };
   ```

2. **Use helpers for queries:**

   ```javascript
   // Good
   const bookings = MockDataHelpers.getUserBookings(userId);

   // Less efficient
   const bookings = MOCK_BOOKINGS.filter((b) => b.userId === userId);
   ```

3. **Validate generated data:**

   ```javascript
   const user = DataFactory.generateUser();
   const validation = DataValidation.validateUser(user);

   if (validation.valid) {
     saveUser(user);
   }
   ```

4. **Use enriched data for UI:**
   ```javascript
   const bookings = storage.getItem("bookings", []);
   const enriched = MockDataHelpers.enrichBookings(bookings);
   // Now each booking has full performance and user objects
   ```

## Examples

### Complete Workflow Example

```javascript
import { storage } from "../services/storageService.js";
import { DataFactory, MockDataHelpers } from "../data/mockData.js";

const users = storage.getItem("registeredUsers", []);

if (users.length === 0) {
  const generatedUsers = DataFactory.seedUsers(10);
  storage.setItem("registeredUsers", generatedUsers);
}

const user = storage.getUser();
if (user) {
  const bookings = MockDataHelpers.getUserBookings(user.id);
  const stats = MockDataHelpers.getBookingStats(bookings);

  console.log(`Total bookings: ${stats.total}`);
  console.log(`Revenue: $${stats.revenue}`);
}

const backup = storage.backup();
console.log("Backup created with", Object.keys(backup.data).length, "keys");

const info = storage.getStorageInfo();
console.log(`Storage: ${info.used} used, ${info.keys} keys`);
```

### Dev Tools Integration Example

```javascript
import { DataFactory, MockDataHelpers } from "../data/mockData.js";
import { storage } from "../services/storageService.js";

async function seedDatabase() {
  const dataset = DataFactory.createMockDataSet();

  storage.setItem("registeredUsers", dataset.users);
  storage.setItem("performances", dataset.performances);
  storage.setItem("bookings", dataset.bookings);
  storage.setItem("venues", dataset.venues);

  console.log("Database seeded:", dataset.stats);
}

async function generateReport() {
  const popular = MockDataHelpers.getPopularPerformances(10);
  const topCustomers = MockDataHelpers.getTopCustomers(10);
  const revenueByMonth = MockDataHelpers.getRevenueByMonth();

  return {
    popularPerformances: popular,
    topCustomers,
    revenueByMonth,
    totalRevenue: MockDataHelpers.getTotalRevenue(),
  };
}
```

## API Reference

### Storage Service

- `get(key, defaultValue)` - Get item from storage
- `set(key, value, options)` - Set item with optional TTL
- `remove(key)` - Remove item
- `clear()` - Clear all namespaced items
- `has(key)` - Check if key exists
- `keys()` - Get all keys
- `getStorageSize()` - Get total storage size
- `getStorageInfo()` - Get detailed storage info
- `backup()` - Create backup
- `restore(backup, options)` - Restore from backup
- `on(event, callback)` - Add event listener
- `off(event, callback)` - Remove event listener
- `validate(key, schema)` - Validate stored data
- `getUser()` / `setUser(user)` - User management
- `isAuthenticated()` - Check auth status
- `clearAuthData()` - Clear auth data

### Data Factory

- `generateId(prefix)` - Generate unique ID
- `generateUser(overrides)` - Generate user
- `generatePerformance(overrides)` - Generate performance
- `generateBooking(userId, perfId, overrides)` - Generate booking
- `generateVenue(overrides)` - Generate venue
- `generateBatch(generator, count)` - Generate multiple items
- `seedUsers(count)` - Generate multiple users
- `seedPerformances(count)` - Generate multiple performances
- `seedBookings(users, performances, max)` - Generate bookings
- `createMockDataSet()` - Generate complete dataset

### Date Utils

- `formatDate(date, format)` - Format date
- `formatDateTime(date)` - Format date and time
- `isUpcoming(date)` - Check if date is future
- `isPast(date)` - Check if date is past
- `daysUntil(date)` - Calculate days until
- `daysAgo(date)` - Calculate days ago
- `relativeTime(date)` - Get relative time string

### Data Query

- `filterByStatus(items, status)` - Filter by status
- `filterByDateRange(items, start, end, field)` - Filter by date range
- `sortByDate(items, field, ascending)` - Sort by date
- `groupBy(items, key)` - Group items by key
- `search(items, term, fields)` - Search items
- `paginate(items, page, pageSize)` - Paginate items

## Troubleshooting

### Storage Quota Exceeded

If you see quota errors:

1. Check storage usage: `storage.getStorageInfo()`
2. Clear old data: `storage.cleanOldData()`
3. Remove expired items: `storage.cleanExpired()`
4. Backup and clear: `const backup = storage.backup(); storage.clear()`

### Data Not Persisting

1. Check if storage is available: `storage.has('key')`
2. Verify data is being set: `storage.set('key', value)`
3. Check console for errors
4. Verify browser allows localStorage

### Migration Issues

If data is corrupted after migration:

1. Export current data: `const data = storage.exportData()`
2. Clear storage: `storage.clear()`
3. Import data: `storage.importData(data)`
4. Manually fix property names if needed

## Performance Tips

1. **Batch operations** - Use `setItem` for multiple writes
2. **Use TTL** - Automatically clean temporary data
3. **Monitor size** - Keep storage under 80% capacity
4. **Lazy load** - Load data only when needed
5. **Use indexes** - Create maps for faster lookups
6. **Cache results** - Store computed values
7. **Validate sparingly** - Only validate on write, not read
