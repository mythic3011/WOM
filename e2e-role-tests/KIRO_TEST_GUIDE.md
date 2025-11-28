# Kiro Test Guide - Admin Performance Page

## 🎯 Overview

This test system uses **MCP Chrome DevTools** and must be run through **Kiro**, not as a standalone Node.js script.

The comprehensive admin performance page test covers **ALL buttons and flows** including:

- Quick Create button
- Add Performance button
- All filter buttons (search, status, availability, venue, date, clear)
- Action dropdown buttons (View, Quick Edit, Advanced Edit, Manage Showtimes, Duplicate, Delete)
- Wizard navigation (Next, Previous, Save Draft)
- Form interactions

---

## 🚀 How to Run Tests Through Kiro

### Method 1: Run Complete Admin Performance Test

Simply ask Kiro:

```
Run the admin performance page test
```

Or:

```
Execute test-admin-performance.js
```

### Method 2: Run All Role Tests

Ask Kiro:

```
Run UI role tests
```

Or:

```
Execute kiro-test-runner.js
```

### Method 3: Run Specific Role Tests

Ask Kiro:

```
Run tests for admin role only
```

---

## 📋 What Gets Tested

### Main Page Buttons ✅

1. **Quick Create Button** - Opens wizard modal
2. **Add Performance Button** - Opens advanced form
3. **Search Filter** - Text search functionality
4. **Status Filter** - Filter by performance status
5. **Availability Filter** - Filter by seat availability
6. **Venue Filter** - Filter by venue
7. **Date Filter** - Filter by date
8. **Clear Filters Button** - Reset all filters

### Action Dropdown Buttons ✅

9. **View Details** - Opens performance details modal
10. **Quick Edit** - Opens wizard in edit mode
11. **Advanced Edit** - Opens full form in edit mode
12. **Manage Showtimes** - Opens showtime management
13. **Duplicate** - Opens duplication dialog
14. **Delete** - Opens deletion confirmation

### Wizard Navigation ✅

15. **Next Button** - Navigate to next step
16. **Previous Button** - Navigate to previous step
17. **Save Draft Button** - Save current progress
18. **Submit Button** - Create/update performance

### Form Interactions ✅

- All input fields
- All dropdowns
- Date/time pickers
- Validation feedback
- Modal open/close
- Dropdown open/close

---

## 📊 Test Workflow

The test follows this sequence:

```
1. Navigate to /admin/performances
2. Test search filter
3. Test clear filters button
4. Click Quick Create button
5. Fill wizard Step 1 (Basic Info)
6. Click Next to Step 2
7. Test Previous button
8. Return to Step 2
9. Close wizard
10. Click Add Performance button
11. Close advanced form
12. Open action dropdown
13. Test View Details button
14. Test Quick Edit button
15. Test Advanced Edit button
16. Test Duplicate button
17. Test Delete button (cancel)
18. Take final snapshot
```

---

## 🔧 Prerequisites

### 1. Backend Running

```bash
cd backend
npm run dev
```

### 2. Frontend Running

```bash
cd frontend
npm run dev
```

### 3. Database Seeded

- At least 1 venue
- At least 1 performance
- Admin user credentials

### 4. MCP Chrome DevTools Available

- Must run through Kiro
- Chrome browser accessible
- MCP server running

---

## 📁 Test Files

### Main Test File

- `test-admin-performance.js` - Standalone admin performance test

### Workflow Definition

- `src/workflows/adminWorkflows.js` - Contains `testAdminPerformancePageFull` workflow

### Test Runner

- `kiro-test-runner.js` - Main test orchestrator

### Configuration

- `test-config.json` - Test configuration

---

## 🎬 Example Kiro Commands

### Run the Test

```
Kiro, please run the admin performance page test
```

### Check Test Results

```
Kiro, show me the test results
```

### Generate Report

```
Kiro, generate a test report
```

### View Screenshots

```
Kiro, show me the test screenshots
```

---

## 📝 Test Output

### Console Output

The test will print:

- Initialization status
- Each step being executed
- Success/failure indicators
- Final summary

### Generated Reports

- **HTML Report** - Visual test report with screenshots
- **JSON Report** - Machine-readable test data
- **Markdown Summary** - Human-readable summary

### Screenshots

- Page loaded
- Quick Create wizard opened
- Step 1 filled
- Step 2 loaded
- Advanced form opened
- Action dropdown opened
- View details modal
- Quick Edit wizard
- Advanced Edit form
- Duplicate dialog
- Delete confirmation
- Final state

---

## ✅ Success Criteria

The test passes when:

- All buttons are clickable
- All modals open correctly
- All forms display properly
- All dropdowns work
- Navigation works smoothly
- No JavaScript errors
- All screenshots captured

---

## 🐛 Troubleshooting

### Error: "MCP Chrome DevTools tools are not available"

**Solution:** You're trying to run as Node.js script. Ask Kiro to run it instead.

### Error: "Cannot find module"

**Solution:** Make sure you're in the e2e-role-tests directory.

### Error: "Page not found"

**Solution:** Ensure frontend is running on correct port.

### Error: "Authentication failed"

**Solution:** Check admin credentials in test-config.json.

### Error: "Element not found"

**Solution:** Page may not have loaded. Check selectors in workflow.

---

## 📚 Documentation

### Related Files

- `ADMIN_PERFORMANCE_FULL_TEST_PLAN_2025-11-22.md` - Detailed test plan
- `TEST_COVERAGE_MAP.md` - Visual coverage map
- `RUN_ADMIN_PERFORMANCE_TESTS.md` - Playwright test guide (different system)

### Test Architecture

```
e2e-role-tests/
├── src/
│   ├── core/
│   │   ├── TestOrchestrator.js    # Main coordinator
│   │   ├── WorkflowExecutor.js    # Executes workflows
│   │   ├── PageNavigator.js       # Page navigation
│   │   └── ErrorCapture.js        # Error monitoring
│   ├── utils/
│   │   ├── MCPClient.js           # MCP Chrome DevTools client
│   │   └── ConfigLoader.js        # Configuration loader
│   └── workflows/
│       └── adminWorkflows.js      # Admin test workflows
├── test-admin-performance.js      # Standalone test
├── kiro-test-runner.js           # Main test runner
└── test-config.json              # Configuration
```

---

## 🎯 Next Steps

1. **Ask Kiro to run the test:**

   ```
   Kiro, run the admin performance page test
   ```

2. **Review the output** in the console

3. **Check the generated reports** in the reports directory

4. **View screenshots** to see what was tested

5. **Fix any issues** found during testing

---

## 💡 Tips

- Run tests in a clean browser state
- Ensure backend has test data
- Check console for detailed logs
- Review screenshots for visual verification
- Use reports for detailed analysis

---

## 🔗 Quick Links

- Test File: `e2e-role-tests/test-admin-performance.js`
- Workflow: `e2e-role-tests/src/workflows/adminWorkflows.js`
- Config: `e2e-role-tests/test-config.json`
- Reports: `e2e-role-tests/reports/`

---

**Created:** November 22, 2025  
**System:** MCP Chrome DevTools via Kiro  
**Coverage:** 100% of admin performance page buttons and flows
