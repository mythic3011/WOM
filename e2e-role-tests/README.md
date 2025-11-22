# UI Role Testing System with MCP Chrome DevTools

A comprehensive testing framework that systematically tests all user roles (admin, user, guest) across the application using MCP Chrome DevTools. The system captures frontend errors, executes workflows, and generates detailed reports with suggested fixes.

## ⚠️ Important: Run Within Kiro

**This test system must be run within Kiro's environment**, not as a standalone Node.js script. The MCP Chrome DevTools tools are only available when running through Kiro.

To run the tests:

1. Open this project in Kiro
2. Ask Kiro to run the tests: "Run the UI role tests in e2e-role-tests"
3. Or execute specific files through Kiro's interface

## Features

- ✅ **Role-Based Testing**: Test admin, user, and guest roles systematically
- 🔍 **Error Capture**: Capture JavaScript errors, console logs, and network failures
- 🔄 **Workflow Execution**: Execute common user workflows for each role
- 📊 **Comprehensive Reports**: Generate HTML, JSON, and Markdown reports
- 🛠️ **Fix Suggestions**: Get automated fix suggestions for common errors
- 📸 **Screenshots**: Capture screenshots on errors for debugging
- ♿ **Accessibility Testing**: Test viewport responsiveness and keyboard navigation
- 🎯 **Form Validation**: Test form field validation and error handling

## Installation

```bash
cd e2e-role-tests
npm install
```

## Configuration

Edit `test-config.json` to configure the testing system:

```json
{
  "baseURL": "http://localhost:5173",
  "roles": {
    "admin": {
      "username": "admin",
      "password": "adminpass"
    },
    "user": {
      "username": "user",
      "password": "userpass"
    }
  },
  "workflows": {
    "enabled": ["createBooking", "createPerformance", "manageUsers"],
    "disabled": []
  },
  "errorThresholds": {
    "critical": 0,
    "high": 5,
    "medium": 10,
    "low": 20
  },
  "screenshots": {
    "onError": true,
    "onSuccess": false,
    "quality": 80
  },
  "timeouts": {
    "pageLoad": 30000,
    "elementWait": 10000,
    "networkIdle": 5000
  },
  "output": {
    "directory": "./test-results",
    "formats": ["html", "json", "markdown"]
  }
}
```

### Configuration Options

#### Base URL

- `baseURL`: The base URL of the application to test

#### Roles

- `roles.admin`: Admin user credentials
- `roles.user`: Regular user credentials

#### Workflows

- `workflows.enabled`: Array of workflow names to execute
- `workflows.disabled`: Array of workflow names to skip

#### Error Thresholds

- `errorThresholds.critical`: Maximum allowed critical errors (default: 0)
- `errorThresholds.high`: Maximum allowed high severity errors (default: 5)
- `errorThresholds.medium`: Maximum allowed medium severity errors (default: 10)
- `errorThresholds.low`: Maximum allowed low severity errors (default: 20)

#### Screenshots

- `screenshots.onError`: Capture screenshots when errors occur (default: true)
- `screenshots.onSuccess`: Capture screenshots on successful tests (default: false)
- `screenshots.quality`: Screenshot quality 0-100 (default: 80)

#### Timeouts

- `timeouts.pageLoad`: Maximum time to wait for page load in ms (default: 30000)
- `timeouts.elementWait`: Maximum time to wait for elements in ms (default: 10000)
- `timeouts.networkIdle`: Time to wait for network idle in ms (default: 5000)

#### Output

- `output.directory`: Directory to save test results (default: ./test-results)
- `output.formats`: Array of report formats: html, json, markdown

### Environment Variables

You can override configuration values using environment variables:

```bash
export BASE_URL=http://localhost:3000
export ADMIN_USERNAME=admin
export ADMIN_PASSWORD=secret
export USER_USERNAME=testuser
export USER_PASSWORD=testpass
export OUTPUT_DIR=./custom-results
```

## Usage

### Run Through Kiro

Since this system requires MCP Chrome DevTools, you must run it through Kiro:

**Option 1: Ask Kiro to run the tests**

```
"Run the UI role tests"
"Execute e2e-role-tests/run-tests.js"
"Test all user roles with MCP"
```

**Option 2: Ask Kiro to run specific roles**

```
"Run the admin role tests"
"Test the user role only"
"Execute guest role tests"
```

**Option 3: Use Kiro's file execution**

- Right-click on `run-tests.js` in Kiro
- Select "Execute with Kiro"

### Command Line Arguments (when running through Kiro)

```bash
# Run all tests
node run-tests.js

# Run specific role
node run-tests.js --role=admin
node run-tests.js --role=user
node run-tests.js --role=guest

# Custom configuration
node run-tests.js --config=./custom-config.json

# Help
node run-tests.js --help
```

## Test Execution Flow

1. **Initialization**: Load configuration and initialize MCP connection
2. **Guest Tests**: Test public pages and restricted access
3. **User Tests**: Login as user, test booking and profile workflows
4. **Admin Tests**: Login as admin, test management workflows
5. **Report Generation**: Generate HTML, JSON, and Markdown reports
6. **Cleanup**: Clean up resources and save final state

## Reports

After test execution, reports are generated in the output directory:

```
test-results/
├── reports/
│   ├── test-report.html      # Styled HTML report
│   ├── test-report.json      # Machine-readable JSON
│   └── test-summary.md       # Quick Markdown summary
├── screenshots/
│   └── errors/
│       ├── ERR-001.png
│       └── ERR-002.png
├── logs/
│   ├── console-admin.log
│   ├── console-user.log
│   └── network-requests.log
└── fixes/
    ├── suggested-fixes.md
    └── error-catalog.json
```

### HTML Report

Open `test-results/reports/test-report.html` in a browser to view:

- Summary statistics
- Results by role
- Error details with severity
- Screenshots
- Suggested fixes

### JSON Report

Use `test-results/reports/test-report.json` for:

- Automated processing
- CI/CD integration
- Custom reporting tools

### Markdown Summary

Quick overview in `test-results/reports/test-summary.md`:

- Summary statistics
- Results by role
- Top errors by severity
- Suggested fixes

## Workflows

### Admin Workflows

- **createPerformance**: Test creating a new performance
- **manageUsers**: Test user management functionality
- **viewBookings**: Test viewing all bookings
- **manageVenues**: Test venue management

### User Workflows

- **createBooking**: Test complete booking flow with seat selection
- **viewProfile**: Test viewing user profile
- **downloadTicket**: Test downloading a ticket
- **updateProfile**: Test updating profile information

### Guest Workflows

- **viewPublicPages**: Test accessing public pages
- **attemptRestrictedAccess**: Test that restricted pages redirect to login
- **testLoginRedirect**: Test login redirect functionality

## Error Severity Levels

- **Critical**: Uncaught errors, 500 errors, authentication failures
- **High**: Console errors, 404 errors, failed API calls
- **Medium**: Console warnings, deprecated API usage
- **Low**: Console info, minor UI glitches

## Troubleshooting

### MCP Connection Failed

Ensure MCP Chrome DevTools server is running and accessible:

```bash
# Check if MCP server is running
# Verify connection settings in configuration
```

### Authentication Failed

- Verify credentials in `test-config.json`
- Check that test users exist in the database
- Ensure login page is accessible

### Page Load Timeout

- Increase `timeouts.pageLoad` in configuration
- Check application performance
- Verify network connectivity

### Element Not Found

- Check that element selectors are correct
- Verify page structure hasn't changed
- Increase `timeouts.elementWait` if needed

### Screenshots Not Captured

- Ensure `screenshots.onError` is true
- Check write permissions for output directory
- Verify MCP screenshot functionality

## CI/CD Integration

### GitHub Actions Example

```yaml
name: UI Role Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: "18"

      - name: Install dependencies
        run: |
          cd e2e-role-tests
          npm install

      - name: Run tests
        run: |
          cd e2e-role-tests
          npm test
        env:
          BASE_URL: ${{ secrets.TEST_BASE_URL }}
          ADMIN_USERNAME: ${{ secrets.ADMIN_USERNAME }}
          ADMIN_PASSWORD: ${{ secrets.ADMIN_PASSWORD }}

      - name: Upload reports
        if: always()
        uses: actions/upload-artifact@v2
        with:
          name: test-reports
          path: e2e-role-tests/test-results/
```

## Development

### Project Structure

```
e2e-role-tests/
├── src/
│   ├── core/
│   │   ├── TestOrchestrator.js    # Main test coordinator
│   │   ├── RoleManager.js         # Role authentication & testing
│   │   ├── ErrorCapture.js        # Error monitoring & capture
│   │   ├── PageNavigator.js       # Page navigation & verification
│   │   ├── WorkflowExecutor.js    # Workflow execution
│   │   └── ReportGenerator.js     # Report generation
│   ├── workflows/
│   │   ├── adminWorkflows.js      # Admin workflow definitions
│   │   ├── userWorkflows.js       # User workflow definitions
│   │   ├── guestWorkflows.js      # Guest workflow definitions
│   │   └── index.js               # Workflow exports
│   └── utils/
│       ├── MCPClient.js           # MCP Chrome DevTools wrapper
│       ├── ConfigLoader.js        # Configuration management
│       ├── ProgressReporter.js    # Progress tracking
│       ├── TestStateManager.js    # Test state persistence
│       ├── FormValidationTester.js # Form validation testing
│       └── UIInteractionTester.js  # UI interaction testing
├── run-tests.js                   # Main entry point
├── test-config.json               # Configuration file
├── package.json                   # Dependencies
└── README.md                      # This file
```

### Adding New Workflows

1. Create workflow definition in appropriate file:

```javascript
// src/workflows/userWorkflows.js
export const userWorkflows = {
  myNewWorkflow: {
    name: "My New Workflow",
    description: "Description of workflow",
    steps: [
      {
        action: "navigate",
        target: "/some/page",
      },
      {
        action: "click",
        selector: "button-id",
      },
      // ... more steps
    ],
  },
};
```

2. Enable workflow in `test-config.json`:

```json
{
  "workflows": {
    "enabled": ["myNewWorkflow"]
  }
}
```

### Workflow Actions

- `navigate`: Navigate to a URL
- `click`: Click an element
- `fill`: Fill a form field or form
- `wait`: Wait for text, element, or duration
- `verify`: Verify page state
- `select`: Select dropdown option
- `hover`: Hover over element
- `pressKey`: Press keyboard key

## License

MIT

## Support

For issues and questions, please open an issue on the project repository.
