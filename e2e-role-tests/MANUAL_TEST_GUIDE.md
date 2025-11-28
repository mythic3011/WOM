# Manual UI Role Testing Guide

This guide provides step-by-step instructions for manually testing all user roles using MCP Chrome DevTools through Kiro.

## Prerequisites

1. Ensure your application is running at `http://localhost:5173`
2. Have MCP Chrome DevTools connected in Kiro
3. Have test user accounts set up:
   - Admin: username `admin`, password `adminpass`
   - User: username `user`, password `userpass`

## How to Run These Tests

Ask Kiro to perform each test section below. For example:

- "Test the guest role workflows"
- "Navigate to the login page and take a snapshot"
- "Test the admin dashboard"

---

## 🔓 Guest Role Testing (Unauthenticated)

### Test 1: View Public Pages

**Objective**: Verify that public pages are accessible without authentication

**Steps**:

1. Ask Kiro: "Navigate to http://localhost:5173 and take a snapshot"
2. Verify home page loads correctly
3. Ask Kiro: "Navigate to http://localhost:5173/performances and take a snapshot"
4. Verify performances page is accessible
5. Ask Kiro: "Navigate to http://localhost:5173/login and take a snapshot"
6. Verify login page is accessible

**Expected Results**:

- ✅ All public pages load without errors
- ✅ No authentication required
- ✅ Navigation works correctly

### Test 2: Attempt Restricted Access

**Objective**: Verify that restricted pages redirect to login

**Steps**:

1. Ask Kiro: "Navigate to http://localhost:5173/admin/dashboard and take a snapshot"
2. Verify redirect to login page
3. Ask Kiro: "Navigate to http://localhost:5173/user/dashboard and take a snapshot"
4. Verify redirect to login page
5. Ask Kiro: "Navigate to http://localhost:5173/user/bookings and take a snapshot"
6. Verify redirect to login page

**Expected Results**:

- ✅ All restricted pages redirect to login
- ✅ No unauthorized access allowed
- ✅ Proper security enforcement

### Test 3: Login Form Accessibility

**Objective**: Verify login and registration forms are accessible

**Steps**:

1. Ask Kiro: "Navigate to http://localhost:5173/login and take a snapshot"
2. Verify login form is visible
3. Check for username/email field
4. Check for password field
5. Check for submit button
6. Check for "Register" link

**Expected Results**:

- ✅ Login form displays correctly
- ✅ All form fields are present
- ✅ Registration link is available

---

## 👤 User Role Testing (Regular User)

### Test 4: User Authentication

**Objective**: Verify user can log in successfully

**Steps**:

1. Ask Kiro: "Navigate to http://localhost:5173/login"
2. Ask Kiro: "Take a snapshot and find the username field"
3. Ask Kiro: "Fill the username field with 'user'"
4. Ask Kiro: "Fill the password field with 'userpass'"
5. Ask Kiro: "Click the login/submit button"
6. Ask Kiro: "Wait for navigation and take a snapshot"
7. Verify redirect to user dashboard

**Expected Results**:

- ✅ Login form accepts credentials
- ✅ Successful authentication
- ✅ Redirect to user dashboard
- ✅ User session established

### Test 5: View User Dashboard

**Objective**: Verify user dashboard loads correctly

**Steps**:

1. After logging in as user
2. Ask Kiro: "Take a snapshot of the current page"
3. Verify dashboard elements are present
4. Check for navigation menu
5. Check for user profile information
6. Check for bookings section

**Expected Results**:

- ✅ Dashboard loads without errors
- ✅ User-specific content displayed
- ✅ Navigation menu available

### Test 6: View User Profile

**Objective**: Verify user can view their profile

**Steps**:

1. While logged in as user
2. Ask Kiro: "Navigate to http://localhost:5173/user/profile"
3. Ask Kiro: "Take a snapshot"
4. Verify profile information is displayed
5. Check for edit profile option

**Expected Results**:

- ✅ Profile page loads correctly
- ✅ User information displayed
- ✅ Edit functionality available

### Test 7: View User Bookings

**Objective**: Verify user can view their bookings

**Steps**:

1. While logged in as user
2. Ask Kiro: "Navigate to http://localhost:5173/user/bookings"
3. Ask Kiro: "Take a snapshot"
4. Verify bookings list is displayed
5. Check for booking details

**Expected Results**:

- ✅ Bookings page loads correctly
- ✅ User's bookings are displayed
- ✅ Booking details are accessible

### Test 8: Create Booking Workflow

**Objective**: Test complete booking flow with seat selection

**Steps**:

1. While logged in as user
2. Ask Kiro: "Navigate to http://localhost:5173/booking?performance=1"
3. Ask Kiro: "Take a snapshot and show me the seat map"
4. Ask Kiro: "Click on an available seat"
5. Ask Kiro: "Click the continue button"
6. Ask Kiro: "Take a snapshot of the ticket assignment page"
7. Ask Kiro: "Click assign ticket button"
8. Ask Kiro: "Click continue to review"
9. Ask Kiro: "Take a snapshot of the payment page"
10. Verify booking flow works correctly

**Expected Results**:

- ✅ Seat map displays correctly
- ✅ Seat selection works
- ✅ Ticket assignment works
- ✅ Payment form displays
- ✅ Complete flow is functional

### Test 9: User Logout

**Objective**: Verify user can log out

**Steps**:

1. While logged in as user
2. Ask Kiro: "Find and click the logout button"
3. Ask Kiro: "Take a snapshot after logout"
4. Verify redirect to login or home page

**Expected Results**:

- ✅ Logout button is accessible
- ✅ Logout successful
- ✅ Session cleared
- ✅ Redirect to public page

---

## 👨‍💼 Admin Role Testing (Administrator)

### Test 10: Admin Authentication

**Objective**: Verify admin can log in successfully

**Steps**:

1. Ask Kiro: "Navigate to http://localhost:5173/login"
2. Ask Kiro: "Fill the username field with 'admin'"
3. Ask Kiro: "Fill the password field with 'adminpass'"
4. Ask Kiro: "Click the login button"
5. Ask Kiro: "Wait and take a snapshot"
6. Verify redirect to admin dashboard

**Expected Results**:

- ✅ Admin login successful
- ✅ Redirect to admin dashboard
- ✅ Admin session established

### Test 11: View Admin Dashboard

**Objective**: Verify admin dashboard loads with admin features

**Steps**:

1. After logging in as admin
2. Ask Kiro: "Take a snapshot of the admin dashboard"
3. Verify admin-specific features are present
4. Check for performance management
5. Check for user management
6. Check for booking management
7. Check for venue management

**Expected Results**:

- ✅ Admin dashboard loads correctly
- ✅ Admin navigation menu present
- ✅ Management features accessible

### Test 12: Performance Management

**Objective**: Test performance CRUD operations

**Steps**:

1. While logged in as admin
2. Ask Kiro: "Navigate to http://localhost:5173/admin/performances"
3. Ask Kiro: "Take a snapshot"
4. Verify performance list displays
5. Ask Kiro: "Click the add performance button"
6. Ask Kiro: "Take a snapshot of the form"
7. Verify performance creation form

**Expected Results**:

- ✅ Performance list loads
- ✅ Add performance button works
- ✅ Performance form displays
- ✅ All form fields present

### Test 13: User Management

**Objective**: Test user management functionality

**Steps**:

1. While logged in as admin
2. Ask Kiro: "Navigate to http://localhost:5173/admin/users"
3. Ask Kiro: "Take a snapshot"
4. Verify user list displays
5. Check for search/filter functionality
6. Check for user actions (edit, delete, etc.)

**Expected Results**:

- ✅ User list loads correctly
- ✅ User information displayed
- ✅ Management actions available
- ✅ Search/filter works

### Test 14: Booking Management

**Objective**: Test viewing and managing all bookings

**Steps**:

1. While logged in as admin
2. Ask Kiro: "Navigate to http://localhost:5173/admin/bookings"
3. Ask Kiro: "Take a snapshot"
4. Verify all bookings are displayed
5. Check for sorting functionality
6. Check for filtering options
7. Check for booking details

**Expected Results**:

- ✅ All bookings displayed
- ✅ Sorting works correctly
- ✅ Filtering works correctly
- ✅ Booking details accessible

### Test 15: Venue Management

**Objective**: Test venue management functionality

**Steps**:

1. While logged in as admin
2. Ask Kiro: "Navigate to http://localhost:5173/admin/venues"
3. Ask Kiro: "Take a snapshot"
4. Verify venue list displays
5. Ask Kiro: "Click add venue button"
6. Verify venue creation form

**Expected Results**:

- ✅ Venue list loads correctly
- ✅ Add venue button works
- ✅ Venue form displays
- ✅ Venue management functional

### Test 16: Admin Logout

**Objective**: Verify admin can log out

**Steps**:

1. While logged in as admin
2. Ask Kiro: "Find and click the logout button"
3. Ask Kiro: "Take a snapshot after logout"
4. Verify logout successful

**Expected Results**:

- ✅ Logout successful
- ✅ Admin session cleared
- ✅ Redirect to public page

---

## 🔍 Error Detection Tests

### Test 17: Console Error Monitoring

**Objective**: Check for JavaScript errors on each page

**Steps**:

1. After navigating to any page
2. Ask Kiro: "List all console messages and show me any errors"
3. Review console output for errors

**Expected Results**:

- ✅ No critical JavaScript errors
- ✅ No uncaught exceptions
- ✅ Clean console output

### Test 18: Network Error Monitoring

**Objective**: Check for failed network requests

**Steps**:

1. After navigating to any page
2. Ask Kiro: "List all network requests and show me any failures"
3. Review network requests for 4xx or 5xx errors

**Expected Results**:

- ✅ No 500 server errors
- ✅ No 404 not found errors
- ✅ All API calls successful

### Test 19: Screenshot on Error

**Objective**: Capture screenshots when errors occur

**Steps**:

1. When any error is detected
2. Ask Kiro: "Take a screenshot and save it to e2e-role-tests/screenshots/errors/"
3. Document the error context

**Expected Results**:

- ✅ Screenshots captured on errors
- ✅ Error context documented
- ✅ Visual evidence available

---

## 📊 Test Results Template

After completing all tests, document results:

### Summary Statistics

- Total Tests: \_\_\_
- Passed: \_\_\_
- Failed: \_\_\_
- Errors Found: \_\_\_
- Duration: \_\_\_

### Errors by Severity

- Critical: \_\_\_
- High: \_\_\_
- Medium: \_\_\_
- Low: \_\_\_

### Issues Found

1. [Issue description]
   - Severity: [critical/high/medium/low]
   - Page: [URL]
   - Role: [guest/user/admin]
   - Steps to reproduce: [...]

### Recommendations

1. [Recommendation based on findings]

---

## 🚀 Quick Test Commands

Copy and paste these to Kiro for quick testing:

### Guest Tests

```
Navigate to http://localhost:5173 and take a snapshot
Navigate to http://localhost:5173/performances and take a snapshot
Navigate to http://localhost:5173/admin/dashboard and verify redirect to login
```

### User Tests

```
Navigate to http://localhost:5173/login
Fill username with 'user' and password with 'userpass'
Click login and take a snapshot of the dashboard
Navigate to http://localhost:5173/user/bookings and take a snapshot
```

### Admin Tests

```
Navigate to http://localhost:5173/login
Fill username with 'admin' and password with 'adminpass'
Click login and take a snapshot of the admin dashboard
Navigate to http://localhost:5173/admin/performances and take a snapshot
Navigate to http://localhost:5173/admin/users and take a snapshot
```

### Error Checking

```
List all console messages and show errors
List all network requests and show failures
Take a screenshot if any errors are found
```

---

## 📝 Notes

- Always ensure the application is running before testing
- Test in order: Guest → User → Admin
- Document all errors with screenshots
- Check console and network after each page load
- Verify all workflows complete successfully

## 🆘 Troubleshooting

If tests fail:

1. Verify application is running at http://localhost:5173
2. Check that test users exist in database
3. Ensure MCP Chrome DevTools is connected
4. Review console and network errors
5. Take screenshots for debugging

---

**Last Updated**: November 21, 2025
**Test Framework Version**: 1.0.0
