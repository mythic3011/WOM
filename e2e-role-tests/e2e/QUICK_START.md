# Quick Start Guide - E2E Testing

## Prerequisites

1. **Backend must be running** with seeded data:

```bash
cd backend
npm install
npm run dev
```

2. **Frontend must be running**:

```bash
cd frontend
npm install
npm run dev
```

## Running Tests

### Option 1: UI Mode (Recommended for Development)

```bash
npx playwright test --ui
```

This opens an interactive UI where you can:

- See all tests
- Run individual tests
- Watch tests execute in real-time
- Debug with time-travel
- View screenshots and traces

### Option 2: Headless Mode (CI/CD)

```bash
npx playwright test
```

### Option 3: Headed Mode (Watch Browser)

```bash
npx playwright test --headed
```

## Test Credentials

All tests automatically login using these credentials:

- **Admin**: `admin` / `adminpass`
- **User**: `user` / `userpass`

## Quick Test Examples

### Run only authentication tests:

```bash
npx playwright test auth.spec.js
```

### Run only performance tests:

```bash
npx playwright test performances.spec.js
```

### Run specific test:

```bash
npx playwright test -g "should create a new performance"
```

### Debug a specific test:

```bash
npx playwright test --debug -g "should create a new performance"
```

## Common Issues

### Issue: Tests fail with "Cannot find element"

**Solution**: Make sure both backend and frontend are running

### Issue: Login fails

**Solution**: Ensure database is seeded with test users:

```bash
cd backend
npm run db:seed
```

### Issue: Timeout errors

**Solution**: Increase timeout in playwright.config.js or check if servers are slow

### Issue: Port already in use

**Solution**: Stop other instances of the dev server or change port in config

## Test Structure

```
e2e/
├── auth.spec.js                    # Login/logout tests
├── performances.spec.js            # Performance CRUD tests
├── performance-form.spec.js        # Form field tests
├── performance-workflow.spec.js    # Complete workflows
└── helpers/
    ├── auth.js                     # Login helpers
    └── performance-helpers.js      # Performance utilities
```

## Writing Your First Test

1. Create a new file in `e2e/` folder:

```javascript
// e2e/my-test.spec.js
import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth.js";

test("my first test", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/performances");
  await expect(page.locator("h1")).toContainText("Performance");
});
```

2. Run it:

```bash
npx playwright test my-test.spec.js --headed
```

## Debugging Tips

1. **Pause execution**:

```javascript
await page.pause();
```

2. **Take screenshot**:

```javascript
await page.screenshot({ path: "debug.png" });
```

3. **Console logs**:

```javascript
page.on("console", (msg) => console.log(msg.text()));
```

4. **Slow down execution**:

```bash
npx playwright test --headed --slow-mo=1000
```

## Next Steps

- Read the full [README.md](./README.md)
- Check out [Playwright documentation](https://playwright.dev)
- Explore existing tests for examples
- Use `--ui` mode to learn interactively
