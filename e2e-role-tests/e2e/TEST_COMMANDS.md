# Quick Test Commands

## NPM Scripts (Recommended)

```bash
# Open Playwright UI (Interactive - Best for development)
npm run test:ui

# Run all tests (headless)
npm test

# Run all tests with visible browser
npm run test:headed

# Debug mode
npm run test:debug

# Run authentication tests only
npm run test:auth

# Run all performance tests
npm run test:performances

# Run add/edit tests only
npm run test:add-edit

# Show test report
npm run test:report
```

## Direct Playwright Commands

```bash
# UI Mode
npx playwright test --ui

# Run all tests
npx playwright test

# Run specific file
npx playwright test e2e/performances.spec.js

# Run specific test by name
npx playwright test -g "should create a new performance"

# Run with headed browser
npx playwright test --headed

# Debug mode
npx playwright test --debug

# Slow motion (for watching)
npx playwright test --headed --slow-mo=1000

# Run in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Shell Script (Alternative)

```bash
# Make executable (first time only)
chmod +x run-tests.sh

# Run the script
./run-tests.sh
```

## Common Workflows

### Development Workflow

```bash
# 1. Start backend
cd backend && npm run dev

# 2. Start frontend (in another terminal)
cd frontend && npm run dev

# 3. Open Playwright UI (in another terminal)
npm run test:ui

# 4. Select and run tests interactively
```

### Quick Test Run

```bash
# Run specific test quickly
npm run test:add-edit -- --headed
```

### CI/CD Workflow

```bash
# Run all tests headless
npm test

# Generate report
npm run test:report
```

### Debugging Workflow

```bash
# Debug specific test
npx playwright test --debug -g "should create a new performance"

# Or use UI mode for visual debugging
npm run test:ui
```

## Test File Locations

- `e2e/auth.spec.js` - Authentication tests
- `e2e/performances.spec.js` - Main performance tests
- `e2e/performance-form.spec.js` - Form field tests
- `e2e/performance-workflow.spec.js` - Workflow tests
- `e2e/performance-add-edit.spec.js` - Add/edit comprehensive tests

## Tips

1. **Use UI mode for development** - It's the best way to see what's happening
2. **Use headed mode to watch** - See the browser in action
3. **Use debug mode to troubleshoot** - Step through tests
4. **Use headless for CI/CD** - Faster and no GUI needed

## Current Status

✅ Playwright UI is running (Process ID: 13)
✅ All test files created
✅ Authentication helpers ready
✅ Test data available
✅ Documentation complete

**You're ready to test!** 🚀
