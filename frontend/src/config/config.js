/**
 * Application Configuration
 * Centralized configuration for the entire application
 */

// Application metadata
export const APP_CONFIG = {
  name: "Western Orchestral Music Performance",
  shortName: "WOM",
  version: "1.0.0",
  apiBaseUrl: "/api",
  environment: import.meta.env.MODE || "development",
};

// Company/Organization information
export const COMPANY_INFO = {
  name: "Western Orchestral Music",
  fullName: "Western Orchestral Music Performance",
  shortName: "WOM",

  // Primary business address
  businessAddress: {
    line1: "123 Concert Hall Avenue",
    line2: "",
    city: "Hong Kong",
    country: "Hong Kong SAR",
  },

  // Office/Contact address
  officeAddress: {
    line1: "Room M101, 1/F",
    line2: "Li Ka Shing Tower (Block M)",
    line3: "The Hong Kong Polytechnic University",
    city: "Hong Kong",
  },

  // Contact information
  contact: {
    phone: "+852 2333 0600",
    phoneLink: "tel:+85223330600",
    email: "info@wom.hk",
    emailLink: "mailto:info@wom.hk",
    supportEmail: "ar.jupas@polyu.edu.hk",
    supportEmailLink: "mailto:ar.jupas@polyu.edu.hk",
    website: "www.wom.hk",
  },

  // Business hours
  hours: {
    visitCenter: "9am-1pm & 2pm-7pm",
    hotline: "9am-1pm & 2pm-5.35pm",
  },

  // Business registration
  business: {
    registrationNumber: "BR-123456789",
    taxId: "TAX-987654321",
  },
};

// User roles
export const USER_ROLES = {
  ADMIN: "admin",
  USER: "user",
};

// Calendar/iCalendar configuration
export const CALENDAR_CONFIG = {
  // Organization details (uses company info)
  organizer: {
    name: `${COMPANY_INFO.shortName} Ticketing`,
    email: COMPANY_INFO.contact.email,
  },

  // Product identifier for iCalendar
  prodId: `-//${COMPANY_INFO.shortName} Ticketing System//Event Calendar//EN`,

  // Calendar name
  calendarName: `${COMPANY_INFO.shortName} Performance`,

  // Default timezone
  timezone: "Asia/Hong_Kong",

  // Default event duration (in hours) if end time not specified
  defaultDuration: 2,

  // Reminder/Alarm settings
  alarm: {
    enabled: true,
    minutesBefore: 60, // 1 hour before event
    action: "DISPLAY",
  },

  // Event categories
  categories: ["Performance", "Entertainment", "Booking"],

  // Event status
  status: "CONFIRMED",

  // Transparency (OPAQUE = shows as busy, TRANSPARENT = shows as free)
  transparency: "OPAQUE",

  // Event class (PUBLIC, PRIVATE, CONFIDENTIAL)
  eventClass: "PUBLIC",

  // Booking instructions
  instructions: {
    arrivalTime: 30, // minutes before performance
    reminderText: "Remember to bring your e-ticket or booking reference.",
  },

  // URL settings
  get baseUrl() {
    return typeof window !== "undefined" ? window.location.origin : "";
  },
  bookingsPath: "/user/bookings",

  // Helper methods
  getBookingsUrl() {
    return `${this.baseUrl}${this.bookingsPath}`;
  },
  getOrganizerMailto() {
    return `mailto:${this.organizer.email}`;
  },
  getAlarmTrigger() {
    return `-PT${this.alarm.minutesBefore}M`;
  },
};

// Legacy export for backward compatibility
export const CONTACT_INFO = {
  address: COMPANY_INFO.officeAddress,
  phone: {
    number: COMPANY_INFO.contact.phone,
    link: COMPANY_INFO.contact.phoneLink,
  },
  email: {
    address: COMPANY_INFO.contact.supportEmail,
    link: COMPANY_INFO.contact.supportEmailLink,
  },
  hours: COMPANY_INFO.hours,
};

// Export default config object
export default {
  APP_CONFIG,
  COMPANY_INFO,
  CONTACT_INFO,
  USER_ROLES,
  CALENDAR_CONFIG,
};
