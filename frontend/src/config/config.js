export const APP_CONFIG = {
  name: "Western Orchestral Music Performance",
  version: "1.0.0",
  apiBaseUrl: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  environment: import.meta.env.MODE || "development",
};

export const ROUTES = {
  auth: {
    login: "/pages/auth/login.html",
    register: "/pages/auth/register.html",
  },
  user: {
    dashboard: "/pages/user/dashboard.html",
    profile: "/pages/user/profile.html",
    bookings: "/pages/user/bookings.html",
    booking: "/pages/user/booking.html",
    payment: "/pages/user/payment.html",
    confirmation: "/pages/user/booking-confirmation.html",
  },
  admin: {
    dashboard: "/pages/admin/dashboard.html",
    users: "/pages/admin/users.html",
    performances: "/pages/admin/performances.html",
    venues: "/pages/admin/venues.html",
    bookings: "/pages/admin/bookings.html",
    seats: "/pages/admin/seats.html",
  },
  public: {
    performances: "/pages/performances.html",
    performanceDetail: "/pages/performance-detail.html",
    seatDetail: "/pages/seat-detail.html",
  },
  dev: {
    tools: "/pages/dev-tools.html",
  },
};

export const STORAGE_KEYS = {
  user: "user",
  token: "token",
  preferences: "preferences",
};

export const USER_ROLES = {
  ADMIN: "admin",
  USER: "user",
};

export const API_ENDPOINTS = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    logout: "/auth/logout",
  },
  user: {
    profile: "/user/profile",
    dashboard: "/user/dashboard",
  },
  admin: {
    dashboard: "/admin/dashboard",
    users: "/admin/users",
  },
  performances: {
    list: "/performances",
    detail: "/performances/:id",
  },
  seats: {
    list: "/seats",
    detail: "/seats/:id",
    available: "/seats/available/:performanceId",
  },
  bookings: {
    create: "/bookings",
    list: "/bookings",
    detail: "/bookings/:id",
  },
};
