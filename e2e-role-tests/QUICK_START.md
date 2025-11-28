# Quick Start Guide

Get started with the UI Role Testing System in 5 minutes!

## ⚠️ Important

**This test system must be run within Kiro**, not as a standalone Node.js script. The MCP Chrome DevTools tools are only available through Kiro.

## Prerequisites

- Kiro IDE installed and running
- MCP Chrome DevTools configured in Kiro
- Application running at configured URL
- Node.js 18 or higher (for dependencies)

## Step 1: Install Dependencies

```bash
cd e2e-role-tests
npm install
```

## Step 2: Configure

Edit `test-config.json` with your application details:

```json
{
  "baseURL": "http://localhost:5173",
  "roles": {
    "admin": {
      "username": "admin",
      "password": "your-admin-password"
    },
    "user": {
      "username": "user",
      "password": "your-user-password"
    }
  }
}
```

## Step 3: Run Tests Through Kiro

Open Kiro and ask it to run the tests:

```
"Run the UI role tests in e2e-role-tests"
```

Or run specific roles:

```
"Run the admin role tests"
"Test the user role"
"Execute guest role tests"
```

Or execute the file directly through Kiro:

- Right-click on `run-tests.js` in Kiro's file explorer
- Select "Execute with Kiro"

## Step 4: View Reports

After tests complete, open the HTML report:

```bash
open test-results/reports/test-report.html
```

Or view the Markdown summary:

```bash
cat test-results/reports/test-summary.md
```

## What Gets Tested?

### Guest Role

- ✅ Public pages accessible
- ✅ Restricted pages redirect to login
- ✅ Login/register forms work

### User Role

- ✅ User can login
- ✅ Booking workflow works
- ✅ Profile management works
- ✅ Ticket download works

### Admin Role

- ✅ Admin can login
- ✅ Performance management works
- ✅ User management works
- ✅ Booking management works
- ✅ Venue management works

## Error Detection

The system automatically captures:

- 🔴 JavaScript errors
- 🟡 Console warnings and errors
- 🔵 Network failures (4xx, 5xx)
- 📸 Screenshots on errors
- 🎯 Suggested fixes

## Next Steps

- Review the full [README.md](./README.md) for detailed documentation
- Customize workflows in `src/workflows/`
- Adjust error thresholds in `test-config.json`
- Integrate with CI/CD pipeline

## Troubleshooting

### Tests won't start

- Ensure MCP Chrome DevTools is running
- Check that application is accessible at baseURL
- Verify Node.js version is 18+

### Authentication fails

- Verify credentials in test-config.json
- Check that test users exist in database
- Ensure login page is accessible

### Need help?

- Check [README.md](./README.md) for full documentation
- Review error reports in test-results/
- Open an issue on the project repository

## Example Output

```
╔════════════════════════════════════════════════════════════╗
║     UI Role Testing System with MCP Chrome DevTools       ║
╚════════════════════════════════════════════════════════════╝

Loading configuration...
✓ Configuration loaded

Initializing Test Orchestrator...
✓ MCP Client initialized
✓ Error Capture initialized
✓ Page Navigator initialized
✓ Workflow Executor initialized
✓ Role Manager initialized
✓ Progress Reporter initialized
✓ Test State Manager initialized
All components initialized successfully

============================================================
Starting Comprehensive UI Role Testing
============================================================

============================================================
Testing Role: GUEST
============================================================

Testing as guest (no authentication)

Pages to test: 4

  Testing page: http://localhost:5173/
  ✓ Page loaded successfully

  Testing page: http://localhost:5173/login
  ✓ Page loaded successfully

...

╔════════════════════════════════════════════════════════════╗
║                      Test Summary                          ║
╚════════════════════════════════════════════════════════════╝

  Total Tests:    3
  Passed:         3 ✓
  Failed:         0
  Errors Found:   0
  Duration:       45.23s

Reports Generated:
  📄 HTML:     test-results/reports/test-report.html
  📊 JSON:     test-results/reports/test-report.json
  📝 Markdown: test-results/reports/test-summary.md

  🎉 All tests passed! No errors found.
```

Happy Testing! 🚀
