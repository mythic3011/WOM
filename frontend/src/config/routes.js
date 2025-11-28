export const ROUTES = {
  HOME: "/",

  AUTH: {
    LOGIN: "/login",
    REGISTER: "/register",
  },

  PUBLIC: {
    PERFORMANCES: "/performances",
    PERFORMANCE_DETAIL: "/performances/:id",
    DEV_TOOLS: "/dev-tools",
  },

  TEST: {
    SEAT_MAP: "/test/seat-map",
  },

  USER: {
    DASHBOARD: "/user/dashboard",
    BOOKINGS: "/user/bookings",
    BOOKING: "/user/booking",
    BOOKING_DETAIL: "/user/booking/:id",
    PROFILE: "/user/profile",
    PAYMENT: "/user/payment",
    CONFIRMATION: "/user/confirmation",
  },

  ADMIN: {
    DASHBOARD: "/admin/dashboard",
    PERFORMANCES: "/admin/performances",
    PERFORMANCE_DETAILS: "/admin/performances/:id",
    VENUES: "/admin/venues",
    BOOKINGS: "/admin/bookings",
    USERS: "/admin/users",
    SEAT_MANAGEMENT: "/admin/seat-management",
    SETTINGS: "/admin/settings",
  },
};

export const ROUTE_METADATA = {
  [ROUTES.HOME]: {
    title: "Home | WOM",
    icon: "fa-home",
    label: "Home",
    requiresAuth: false,
    roles: ["guest", "user", "admin"],
    breadcrumb: [{ label: "Home", path: ROUTES.HOME }],
  },

  [ROUTES.AUTH.LOGIN]: {
    title: "Login | WOM",
    icon: "fa-sign-in-alt",
    label: "Login",
    requiresAuth: false,
    roles: ["guest"],
    breadcrumb: [{ label: "Login", path: null }],
  },

  [ROUTES.AUTH.REGISTER]: {
    title: "Register | WOM",
    icon: "fa-user-plus",
    label: "Register",
    requiresAuth: false,
    roles: ["guest"],
    breadcrumb: [{ label: "Register", path: null }],
  },

  [ROUTES.PUBLIC.PERFORMANCES]: {
    title: "Performances | WOM",
    icon: "fa-music",
    label: "Performances",
    requiresAuth: false,
    roles: ["guest", "user", "admin"],
    breadcrumb: [{ label: "Performances", path: ROUTES.PUBLIC.PERFORMANCES }],
  },

  [ROUTES.PUBLIC.PERFORMANCE_DETAIL]: {
    title: "Performance Details | WOM",
    icon: "fa-music",
    label: "Performance Details",
    requiresAuth: false,
    roles: ["guest", "user", "admin"],
    breadcrumb: [
      { label: "Performances", path: ROUTES.PUBLIC.PERFORMANCES },
      { label: "Details", path: null },
    ],
  },

  [ROUTES.USER.DASHBOARD]: {
    title: "Dashboard | User",
    icon: "fa-home",
    label: "Dashboard",
    requiresAuth: true,
    roles: ["user"],
    breadcrumb: [{ label: "Dashboard", path: ROUTES.USER.DASHBOARD }],
  },

  [ROUTES.USER.BOOKINGS]: {
    title: "My Bookings | User",
    icon: "fa-ticket-alt",
    label: "My Bookings",
    requiresAuth: true,
    roles: ["user"],
    breadcrumb: [{ label: "My Bookings", path: ROUTES.USER.BOOKINGS }],
  },

  [ROUTES.USER.BOOKING]: {
    title: "Book Your Seats",
    icon: "fa-ticket-alt",
    label: "Book Seats",
    requiresAuth: false,
    roles: ["guest", "user", "admin"],
    hideInNav: true,
    breadcrumb: [
      { label: "Performances", path: ROUTES.PUBLIC.PERFORMANCES },
      { label: "Book Seats", path: null },
    ],
  },

  [ROUTES.USER.PAYMENT]: {
    title: "Payment | User",
    icon: "fa-credit-card",
    label: "Payment",
    requiresAuth: true,
    roles: ["user"],
    breadcrumb: [
      { label: "Book Seats", path: ROUTES.USER.BOOKING },
      { label: "Payment", path: null },
    ],
  },

  [ROUTES.USER.CONFIRMATION]: {
    title: "Booking Confirmation | User",
    icon: "fa-check-circle",
    label: "Confirmation",
    requiresAuth: true,
    roles: ["user"],
    breadcrumb: [
      { label: "Book Seats", path: ROUTES.USER.BOOKING },
      { label: "Confirmation", path: null },
    ],
  },

  [ROUTES.USER.PROFILE]: {
    title: "Profile | User",
    icon: "fa-user-circle",
    label: "Profile",
    requiresAuth: true,
    roles: ["user", "admin"],
    breadcrumb: [{ label: "Profile", path: ROUTES.USER.PROFILE }],
  },

  [ROUTES.ADMIN.DASHBOARD]: {
    title: "Admin Dashboard",
    icon: "fa-tachometer-alt",
    label: "Dashboard",
    requiresAuth: true,
    roles: ["admin"],
    breadcrumb: [{ label: "Admin Dashboard", path: ROUTES.ADMIN.DASHBOARD }],
  },

  [ROUTES.ADMIN.PERFORMANCES]: {
    title: "Performances | Admin",
    icon: "fa-music",
    label: "Performances",
    requiresAuth: true,
    roles: ["admin"],
    breadcrumb: [
      { label: "Admin Dashboard", path: ROUTES.ADMIN.DASHBOARD },
      { label: "Performances", path: null },
    ],
  },

  [ROUTES.ADMIN.PERFORMANCE_DETAILS]: {
    title: "Performance Details | Admin",
    icon: "fa-music",
    label: "Performance Details",
    requiresAuth: true,
    roles: ["admin"],
    breadcrumb: [
      { label: "Admin Dashboard", path: ROUTES.ADMIN.DASHBOARD },
      { label: "Performances", path: ROUTES.ADMIN.PERFORMANCES },
      { label: "Details", path: null },
    ],
    hideInNav: true,
  },

  [ROUTES.ADMIN.USERS]: {
    title: "User Management | Admin",
    icon: "fa-users",
    label: "User Management",
    requiresAuth: true,
    roles: ["admin"],
    breadcrumb: [
      { label: "Admin Dashboard", path: ROUTES.ADMIN.DASHBOARD },
      { label: "User Management", path: null },
    ],
  },

  [ROUTES.ADMIN.BOOKINGS]: {
    title: "Bookings | Admin",
    icon: "fa-clipboard-list",
    label: "Bookings",
    requiresAuth: true,
    roles: ["admin"],
    breadcrumb: [
      { label: "Admin Dashboard", path: ROUTES.ADMIN.DASHBOARD },
      { label: "Bookings", path: null },
    ],
  },

  [ROUTES.ADMIN.VENUES]: {
    title: "Venue Management | Admin",
    icon: "fa-building",
    label: "Venue Management",
    requiresAuth: true,
    roles: ["admin"],
    breadcrumb: [
      { label: "Admin Dashboard", path: ROUTES.ADMIN.DASHBOARD },
      { label: "Venue Management", path: null },
    ],
  },

  [ROUTES.ADMIN.SEAT_MANAGEMENT]: {
    title: "Seat Management | Admin",
    icon: "fa-chair",
    label: "Seat Management",
    requiresAuth: true,
    roles: ["admin"],
    breadcrumb: [
      { label: "Admin Dashboard", path: ROUTES.ADMIN.DASHBOARD },
      { label: "Seat Management", path: null },
    ],
  },

  [ROUTES.ADMIN.SETTINGS]: {
    title: "Settings | Admin",
    icon: "fa-cog",
    label: "Settings",
    requiresAuth: true,
    roles: ["admin"],
    breadcrumb: [
      { label: "Admin Dashboard", path: ROUTES.ADMIN.DASHBOARD },
      { label: "Settings", path: null },
    ],
  },

  [ROUTES.PUBLIC.DEV_TOOLS]: {
    title: "Developer Tools",
    icon: "fa-code",
    label: "Dev Tools",
    requiresAuth: false,
    roles: ["guest", "user", "admin"],
    breadcrumb: [{ label: "Developer Tools", path: null }],
    hideInNav: true,
  },

  "/test/seat-map": {
    title: "Seat Map Test | Pan-Zoom Testing",
    icon: "fa-vial",
    label: "Seat Map Test",
    requiresAuth: false,
    roles: ["guest", "user", "admin"],
    breadcrumb: [{ label: "Seat Map Test", path: null }],
    hideInNav: false,
  },
};

export function buildRoute(routeTemplate, params = {}) {
  let route = routeTemplate;
  Object.keys(params).forEach((key) => {
    route = route.replace(`:${key}`, params[key]);
  });
  return route;
}

export function getRouteMetadata(path) {
  const basePath = path.split("?")[0];

  if (ROUTE_METADATA[basePath]) {
    return ROUTE_METADATA[basePath];
  }

  const pathSegments = basePath.split("/").filter(Boolean);
  for (const [route, metadata] of Object.entries(ROUTE_METADATA)) {
    const routeSegments = route.split("/").filter(Boolean);

    if (pathSegments.length !== routeSegments.length) {continue;}

    const isMatch = routeSegments.every((segment, index) => {
      return segment.startsWith(":") || segment === pathSegments[index];
    });

    if (isMatch) {
      return metadata;
    }
  }

  return null;
}

export function getNavigationByRole(role) {
  const routes = [];

  Object.entries(ROUTE_METADATA).forEach(([path, metadata]) => {
    if (metadata.hideInNav) {return;}
    if (!metadata.roles.includes(role)) {return;}

    routes.push({
      path,
      label: metadata.label,
      icon: metadata.icon,
      requiresAuth: metadata.requiresAuth,
    });
  });

  return routes;
}

export function canAccessRoute(path, userRole) {
  const metadata = getRouteMetadata(path);
  if (!metadata) {return true;}

  if (!userRole) {
    return metadata.roles.includes("guest");
  }

  return metadata.roles.includes(userRole);
}
