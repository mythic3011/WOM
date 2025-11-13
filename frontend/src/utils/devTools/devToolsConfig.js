export const DEV_TOOLS_CONFIG = {
  console: {
    maxHeight: "max-h-96",
    colors: {
      info: "text-green-400",
      error: "text-red-400",
      warn: "text-yellow-400",
      success: "text-blue-400",
    },
    icons: {
      info: "→",
      error: "✗",
      warn: "⚠",
      success: "✓",
    },
  },
  storage: {
    exportPrefix: "wom-storage",
    importAccept: "application/json",
  },
  performance: {
    testIterations: 10000,
  },
  mockData: {
    defaultSeed: 12345,
    faker: {
      locale: "en",
      users: {
        defaultCount: 10,
        adminRatio: 0.2,
      },
      performances: {
        defaultCount: 10,
        statusDistribution: {
          sold_out: 0.15,
          upcoming: 0.25,
          on_sale: 0.45,
          early_bird: 0.1,
          pre_order: 0.05,
        },
        statuses: {
          on_sale: "On Sale - Tickets available now",
          upcoming: "Upcoming - Sales start soon",
          sold_out: "Sold Out - No seats available",
          early_bird: "Early Bird - Special pricing",
          pre_order: "Pre-Order - Reserve your seats",
        },
      },
      bookings: {
        defaultCount: 20,
        maxSeatsPerBooking: 4,
      },
    },
  },
};

export const UTILS_STRUCTURE = {
  core: ["api.js", "auth.js", "crypto.js", "navigation.js", "state.js"],
  ui: [
    "animations.js",
    "contextMenu.js",
    "dialogUtils.js",
    "dom.js",
    "dragDrop.js",
    "keyboard.js",
    "modal.js",
    "notification.js",
    "touchGestures.js",
    "uiPatterns.js",
  ],
  data: ["filters.js", "table.js", "tableUtils.js", "validation.js"],
  forms: ["form.js", "formValidator.js", "phoneFormat.js"],
  booking: [
    "heatMap.js",
    "pricing.js",
    "seatMapGenerator.js",
    "seatUtils.js",
    "showtimeManager.js",
  ],
  reports: ["invoiceGenerator.js", "reporting.js", "ticketGenerator.js"],
  root: [
    "index.js",
    "initApp.js",
    "performance.js",
    "seo.js",
    "status.js",
    "utils.js",
  ],
};

export const DOCUMENTATION_LINKS = [
  {
    title: "Project Structure",
    file: "PROJECT_STRUCTURE.md",
    desc: "Complete architecture guide",
  },
  {
    title: "Contributing",
    file: "CONTRIBUTING.md",
    desc: "Development guidelines",
  },
  {
    title: "Utils Organization",
    file: "UTILS_ORGANIZATION.md",
    desc: "Utilities guide",
  },
  {
    title: "Quick Start",
    file: "QUICK_START.md",
    desc: "5-minute setup",
  },
  {
    title: "Frontend README",
    file: "frontend/README.md",
    desc: "Frontend docs",
  },
];

export const HEALTH_CHECKS = [
  { name: "Storage", check: () => localStorage.length > 0 },
  { name: "Routes", check: (ROUTES) => Object.keys(ROUTES).length > 0 },
  { name: "Utils", check: () => true },
  { name: "Services", check: (storage) => typeof storage !== "undefined" },
  {
    name: "Components",
    check: (FormComponents) => typeof FormComponents !== "undefined",
  },
  {
    name: "Backend Connection",
    check: async () => {
      try {
        const response = await fetch(`${APP_CONFIG.apiBaseUrl}/health`);
        const data = await response.json();
        return response.ok && data.success;
      } catch (error) {
        return false;
      }
    },
  },
];

export const NAVIGATION_SHORTCUTS = {
  public: [
    { href: "/", icon: "fa-home", label: "Home" },
    { href: "/performances", icon: "fa-music", label: "Performances" },
    { href: "/login", icon: "fa-sign-in-alt", label: "Login" },
    { href: "/register", icon: "fa-user-plus", label: "Register" },
  ],
  user: [
    {
      href: "/user/dashboard",
      icon: "fa-tachometer-alt",
      label: "User Dashboard",
    },
    { href: "/user/bookings", icon: "fa-ticket-alt", label: "User Bookings" },
    { href: "/user/profile", icon: "fa-user", label: "Profile" },
  ],
  admin: [
    {
      href: "/admin/dashboard",
      icon: "fa-user-shield",
      label: "Admin Dashboard",
    },
    {
      href: "/admin/performances",
      icon: "fa-music",
      label: "Admin Performances",
    },
    {
      href: "/admin/bookings",
      icon: "fa-calendar-check",
      label: "Admin Bookings",
    },
    { href: "/admin/users", icon: "fa-users", label: "Admin Users" },
    { href: "/admin/settings", icon: "fa-cog", label: "Settings" },
  ],
};

export const NAV_SHORTCUT_STYLES = {
  public: "bg-gray-100 hover:bg-gray-200 text-gray-700",
  user: "bg-blue-100 hover:bg-blue-200 text-blue-700",
  admin: "bg-purple-100 hover:bg-purple-200 text-purple-700",
};
