# Quick Start - Kiro MCP Tests

## 🚀 Run Test (Simple)

Just ask Kiro:

```
Run the admin performance page test
```

That's it! Kiro will handle everything.

---

## 📋 What Gets Tested

✅ Quick Create button  
✅ Add Performance button  
✅ Search filter  
✅ Status filter  
✅ Availability filter  
✅ Venue filter  
✅ Date filter  
✅ Clear Filters button  
✅ View Details button  
✅ Quick Edit button  
✅ Advanced Edit button  
✅ Manage Showtimes button  
✅ Duplicate button  
✅ Delete button  
✅ Wizard navigation  
✅ Form interactions

**Total:** 18+ buttons, 50+ interactions

---

## ✅ Prerequisites

```bash
# 1. Start backend
cd backend && npm run dev

# 2. Start frontend
cd frontend && npm run dev

# 3. Ensure database has:
- At least 1 venue
- At least 1 performance
- Admin user
```

---

## 🎯 Alternative Commands

```
# Run all role tests
Kiro, run UI role tests

# Run admin tests only
Kiro, run tests for admin role

# Execute specific file
Kiro, execute test-admin-performance.js
```

---

## 📊 Expected Output

```
✓ MCP Client initialized
✓ Navigated to admin performances page
✓ Executing workflow: testAdminPerformancePageFull
✓ All buttons and flows tested successfully!

Reports Generated:
📄 HTML report
📊 JSON data
📝 Markdown summary
```

---

## 📁 Find Results

```
e2e-role-tests/
├── reports/          # Test reports
├── screenshots/      # Visual proof
└── logs/            # Execution logs
```

---

## 🐛 Common Issues

**Error:** "MCP Chrome DevTools tools are not available"  
**Fix:** Don't run as Node.js script, ask Kiro instead

**Error:** "Page not found"  
**Fix:** Start frontend with `npm run dev`

**Error:** "Authentication failed"  
**Fix:** Check admin credentials in test-config.json

---

## 📚 Full Documentation

- `KIRO_TEST_GUIDE.md` - Complete guide
- `KIRO_TEST_SETUP_2025-11-22.md` - Setup details
- `TEST_COVERAGE_MAP.md` - Visual coverage

---

**Ready to run!** Just ask Kiro to execute the test.
