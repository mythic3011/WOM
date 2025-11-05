# WOM - Western Orchestral Music Performance Booking System

## Quick Start

### 1. First Time Setup

Before logging in, you need to create the test users:

1. Navigate to `/dev-tools` page (or click "Dev Tools" in the footer)
2. Click **"Create Test Users"** button in the Users section
3. Wait for the success notification

This will create users with properly hashed passwords.

### 2. Test User Credentials

After creating test users, you can login with:

#### Admin Account

- **Username:** `admin`
- **Password:** `adminpass`
- **Role:** Administrator (full access)

#### Regular User Account

- **Username:** `user`
- **Password:** `userpass`
- **Role:** Regular User

#### Additional Test Users (user1-user10)

- **Usernames:** `user1`, `user2`, `user3`, etc.
- **Password:** `test123`
- **Role:** Regular User

### 3. Quick Login (Dev Tools)

Alternatively, use Dev Tools for instant login:

1. Go to `/dev-tools`
2. Click **"Login as Admin"** or **"Login as User"**

## Test Payment Cards

For testing payment functionality:

- **Visa:** 4111 1111 1111 1111
- **Mastercard:** 5500 0000 0000 0004
- **AMEX:** 3400 0000 0000 009 (note: 4-digit CVV)
- **Any future expiry date** (e.g., 12/25)
- **Any CVV** (3 or 4 digits depending on card type)

## Features

- User authentication & authorization
- Performance browsing and searching
- Interactive seat selection and booking
- Multiple payment methods (Credit Card, Alipay, WeChat Pay, PayPal)
- Professional e-ticket PDF generation (QR code + barcode)
- Invoice PDF generation with detailed breakdown
- Print and download PDF options for tickets & invoices
- Booking management (view, cancel, refund)
- Admin dashboard and controls
- User profile management

## Development

### Dev Tools

Access comprehensive development utilities at `/dev-tools`:

- **Storage Management:** View, export, import, clear data
- **User Management:** Create test users, quick login/logout
- **Mock Data:** Generate performances and bookings
- **Debug Console:** Real-time logging and notifications

### Tech Stack

- **Frontend:** Vite + Vanilla JavaScript + jQuery + Tailwind CSS
- **Storage:** localStorage with v2.0 features (TTL, backup, events)
- **Routing:** page.js (SPA)
- **UI:** SweetAlert2, Font Awesome icons
- **Date:** Day.js
- **QR/Barcode:** qrcode, jsbarcode
- **PDF Generation:** jspdf, html2canvas

### To-Do

#### High Priority

- [ ] Fix the user management page functionality
- [ ] Add autocomplete search functionality for performances search bar
- [ ] Complete user profile data implementation (full name, email, date of birth, gender, username, password)
- [ ] Add favicon using music icon for the website
- [ ] Fix icon padding on payment pages (payment type icons and credit card icons)

#### Booking Enhancements

- [ ] Enable booking downloads:
  - iCalendar (.ics) file export
  - E-ticket download (conditional on performance settings)
  - Invoice download (conditional on payment method)
  - Note: Implement native formats instead of HTML-to-PDF conversion
- [ ] Enable booking modification feature:
  - Allow users to change to different performance
  - Allow showtime selection
  - Allow seat reselection
  - Support ticket type changes per seat

#### Payment & Refund Management

- [ ] Implement makeup payment and refund logic for booking fee changes:
  - Calculate and charge additional fees when customer requests booking changes
  - Process refunds when fees decrease
  - No additional charges for system/admin-initiated changes
  - Automatic fee adjustment notifications

#### Event Management

- [ ] Add check-in functionality:
  - QR code scanning for ticket verification
  - Barcode scanning support
  - Manual code input option
  - Real-time check-in status tracking

#### Code Quality & Refactoring

- [ ] Convert vanilla JavaScript to jQuery for consistency across the codebase
- [ ] Dev-tools improvements and enhancements:
  - Enhanced debugging capabilities
  - Better data visualization
  - Additional utility functions
  - Improved UI/UX for developer experience

#### Future Improvements

- [ ] Implement showtime-based booking logic and seat availability
