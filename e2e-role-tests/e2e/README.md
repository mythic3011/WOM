# E2E Tests with Playwright

This directory contains end-to-end tests for the application using Playwright.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Install Playwright browsers:

```bash
npx playwright install
```

3. Ensure backend is running with seeded data:

```bash
cd backend
npm run dev
```

## Test Credentials

The tests use the following seeded credentials:

- **Admin User**

  - Username: `admin`
  - Password: `adminpass`
  - Email: `admin@wom.hk`

- **Regular User**
  - Username: `user`
  - Password: `userpass`
  - Email: `user@example.com`

## Running Tests

### UI Mode (Interactive)

```bash
npx playwright test --ui
```

### Headless Mode

```bash
npx playwright test
```

### Specific Test File

```bash
npx playwright test e2e/performances.spec.js
```

### Debug Mode

```bash
npx playwright test --debug
```

### With Headed Browser

```bash
npx playwright test --headed
```

## Test Structure

### Authentication Tests

- `auth.spec.js` - Login/logout functionality
  - Admin login
  - User login
  - Invalid credentials
  - Password visibility toggle
  - Remember me functionality
  - Redirect handling

### Performance Tests

- `performances.spec.js` - Main performance management tests

  - Display performances page
  - Add new performance
  - Edit existing performance
  - Delete performance
  - Filter and search
  - View details
  - Duplicate performance

- `performance-form.spec.js` - Detailed form testing

  - Fill all form fields
  - Upload images
  - Add/remove showtimes
  - Add pricing sections
  - Form validation
  - Submit complete forms

- `performance-workflow.spec.js` - Complete workflows
  - End-to-end CRUD operations
  - Multi-step processes
  - Complex scenarios

### Helpers

- `helpers/auth.js` - Authentication utilities
  - `loginAsAdmin(page)` - Login as admin user
  - `loginAsUser(page, username, password)` - Login as regular user
  - `logout(page)` - Logout current user
- `helpers/performance-helpers.js` - Performance-specific test utilities
  - `createPerformance(page, data)` - Create a new performance
  - `editPerformance(page, title, updates)` - Edit existing performance
  - `deletePerformance(page, title, confirm)` - Delete performance
  - `searchPerformances(page, query)` - Search performances
  - `filterByStatus(page, status)` - Filter by status
  - `mockPerformanceData` - Test data objects

## Test Data

Mock performance data is available in `helpers/performance-helpers.js`:

- `mockPerformanceData.basic` - Basic performance data
- `mockPerformanceData.complete` - Complete performance with all fields
- `mockPerformanceData.minimal` - Minimal required fields

## Configuration

Test configuration is in `playwright.config.js`:

- Base URL: `http://localhost:5173`
- Test directory: `./e2e`
- Automatic dev server startup
- Screenshot on failure
- Trace on first retry

## Writing Tests

Example test with authentication:

```javascript
import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth.js";
import {
  createPerformance,
  mockPerformanceData,
} from "./helpers/performance-helpers.js";

test("should create performance", async ({ page }) => {
  // Login first
  await loginAsAdmin(page);

  // Navigate to performances page
  await page.goto("/admin/performances");

  // Create performance
  await createPerformance(page, mockPerformanceData.basic);

  // Verify it appears
  await expect(page.locator("#performancesTable")).toContainText(
    "Test Symphony"
  );
});
```

## Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

## Tips

- Use `--ui` mode for interactive debugging
- Use `page.pause()` to pause execution and inspect
- Check `test-results/` for screenshots and traces
- Use `--headed` to see browser actions
- Use `--debug` to step through tests
