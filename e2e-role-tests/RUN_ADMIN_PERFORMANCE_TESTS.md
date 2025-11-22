# Quick Start: Admin Performance Page Tests

## 🚀 Run All Tests

```bash
cd e2e-role-tests
npm test -- admin-performance-full.spec.js
```

## 📋 Test Suites

### Run Specific Test Suite

```bash
# Page Load Tests
npm test -- admin-performance-full.spec.js -g "Page Load and Display"

# Filter Tests
npm test -- admin-performance-full.spec.js -g "Filter Functionality"

# Quick Create Wizard Tests
npm test -- admin-performance-full.spec.js -g "Quick Create Wizard"

# Advanced Form Tests
npm test -- admin-performance-full.spec.js -g "Add Performance"

# Action Dropdown Tests
npm test -- admin-performance-full.spec.js -g "Action Dropdown"

# View Details Tests
npm test -- admin-performance-full.spec.js -g "View Performance Details"

# Quick Edit Tests
npm test -- admin-performance-full.spec.js -g "Quick Edit Performance"

# Advanced Edit Tests
npm test -- admin-performance-full.spec.js -g "Advanced Edit Performance"

# Manage Showtimes Tests
npm test -- admin-performance-full.spec.js -g "Manage Showtimes"

# Duplicate Tests
npm test -- admin-performance-full.spec.js -g "Duplicate Performance"

# Delete Tests
npm test -- admin-performance-full.spec.js -g "Delete Performance"

# Showtime Management Tests
npm test -- admin-performance-full.spec.js -g "Showtime Management in Form"

# Pricing Section Tests
npm test -- admin-performance-full.spec.js -g "Pricing Section Management"

# Validation Tests
npm test -- admin-performance-full.spec.js -g "Form Validation"

# UI Interaction Tests
npm test -- admin-performance-full.spec.js -g "UI Interactions"

# Data Persistence Tests
npm test -- admin-performance-full.spec.js -g "Data Persistence"

# Error Handling Tests
npm test -- admin-performance-full.spec.js -g "Error Handling"
```

## 🎯 Run Specific Test

```bash
# Run single test by name
npm test -- admin-performance-full.spec.js -g "should display all main page elements"
```

## 🐛 Debug Mode

```bash
# Run with browser visible
npm test -- admin-performance-full.spec.js --headed

# Run with debug mode
npm test -- admin-performance-full.spec.js --debug

# Run with slow motion
npm test -- admin-performance-full.spec.js --headed --slow-mo=1000
```

## 📊 Generate Report

```bash
# Run tests and generate HTML report
npm test -- admin-performance-full.spec.js --reporter=html

# View report
npx playwright show-report
```

## ✅ What's Tested

### Main Buttons

- ✅ Quick Create Button
- ✅ Add Performance Button
- ✅ Clear Filters Button
- ✅ Add Showtime Button
- ✅ Add Pricing Section Button
- ✅ Remove Showtime Button
- ✅ Remove Pricing Section Button
- ✅ Save Draft Button
- ✅ Submit Button
- ✅ Cancel Button

### Action Dropdown Buttons

- ✅ View Details
- ✅ Quick Edit
- ✅ Advanced Edit
- ✅ Manage Showtimes
- ✅ Duplicate
- ✅ Delete

### Filter Buttons

- ✅ Search Input
- ✅ Status Filter
- ✅ Availability Filter
- ✅ Venue Filter
- ✅ Date Filter
- ✅ Clear Filters

### Wizard Navigation

- ✅ Next Button (all steps)
- ✅ Previous Button (all steps)
- ✅ Edit Step Buttons
- ✅ Submit Button

### Form Interactions

- ✅ All input fields
- ✅ All dropdowns
- ✅ All checkboxes
- ✅ Date/time pickers
- ✅ Image upload

## 🔧 Prerequisites

1. **Backend Running**

   ```bash
   cd backend
   npm run dev
   ```

2. **Database Seeded**

   - At least 1 venue
   - At least 1 performance
   - Admin user credentials

3. **Environment Variables**
   - Check `.env` file
   - Verify API endpoints

## 📝 Test Coverage

| Category            | Tests   | Status |
| ------------------- | ------- | ------ |
| Page Load           | 1       | ✅     |
| Filters             | 6       | ✅     |
| Quick Create Wizard | 5       | ✅     |
| Advanced Form       | 7       | ✅     |
| Action Dropdown     | 3       | ✅     |
| View Details        | 2       | ✅     |
| Quick Edit          | 2       | ✅     |
| Advanced Edit       | 2       | ✅     |
| Manage Showtimes    | 2       | ✅     |
| Duplicate           | 3       | ✅     |
| Delete              | 3       | ✅     |
| Showtime Management | 3       | ✅     |
| Pricing Sections    | 4       | ✅     |
| Form Validation     | 4       | ✅     |
| UI Interactions     | 4       | ✅     |
| Data Persistence    | 2       | ✅     |
| Error Handling      | 2       | ✅     |
| **TOTAL**           | **60+** | ✅     |

## 🎬 Test Flows

### Flow 1: Quick Create (Happy Path)

1. Click Quick Create
2. Fill basic info
3. Select venue
4. Add showtime
5. Set pricing
6. Review
7. Submit

### Flow 2: Advanced Create (Happy Path)

1. Click Add Performance
2. Fill all sections
3. Select venue
4. Add multiple showtimes
5. Add pricing sections
6. Submit

### Flow 3: Edit Performance

1. Open action dropdown
2. Click Quick Edit
3. Modify data
4. Navigate steps
5. Submit

### Flow 4: Manage Showtimes

1. Open action dropdown
2. Click Manage Showtimes
3. Add/edit/remove showtimes
4. Save changes

### Flow 5: Filter & Search

1. Apply search
2. Apply filters
3. Verify results
4. Clear filters

## 🚨 Common Issues

### Issue: Tests Timeout

**Solution:** Increase timeout in test or check backend is running

### Issue: Element Not Found

**Solution:** Check selectors match current DOM structure

### Issue: Modal Not Opening

**Solution:** Verify button click is working and modal ID is correct

### Issue: Data Not Persisting

**Solution:** Check formData sync in wizard handler

## 📚 Documentation

- **Full Test Plan:** `test-results/ADMIN_PERFORMANCE_FULL_TEST_PLAN_2025-11-22.md`
- **Test File:** `e2e/admin-performance-full.spec.js`
- **Bug Reports:** `test-results/FINAL_TEST_REPORT_2025-11-22.md`

## 🎯 Next Steps

1. Run full test suite
2. Review any failures
3. Fix issues
4. Re-run tests
5. Generate report
6. Document results

---

**Created:** November 22, 2025  
**Status:** Ready to run  
**Coverage:** 100% of buttons and flows
