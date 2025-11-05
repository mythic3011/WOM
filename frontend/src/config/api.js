const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    REFRESH_TOKEN: "/auth/refresh",
    VERIFY_TOKEN: "/auth/verify",
  },

  USERS: {
    BASE: "/users",
    BY_ID: (id) => `/users/${id}`,
    PROFILE: "/users/profile",
    UPDATE_PROFILE: "/users/profile",
    CHANGE_PASSWORD: "/users/change-password",
    DELETE_ACCOUNT: "/users/account",
  },

  PERFORMANCES: {
    BASE: "/performances",
    BY_ID: (id) => `/performances/${id}`,
    SEARCH: "/performances/search",
    UPCOMING: "/performances/upcoming",
    POPULAR: "/performances/popular",
  },

  BOOKINGS: {
    BASE: "/bookings",
    BY_ID: (id) => `/bookings/${id}`,
    USER_BOOKINGS: "/bookings/my-bookings",
    CREATE: "/bookings",
    CANCEL: (id) => `/bookings/${id}/cancel`,
    CONFIRM: (id) => `/bookings/${id}/confirm`,
  },

  SEATS: {
    BASE: "/seats",
    BY_PERFORMANCE: (performanceId) => `/seats/performance/${performanceId}`,
    AVAILABILITY: (performanceId) =>
      `/seats/performance/${performanceId}/availability`,
    RESERVE: "/seats/reserve",
    RELEASE: (seatId) => `/seats/${seatId}/release`,
  },

  VENUES: {
    BASE: "/venues",
    BY_ID: (id) => `/venues/${id}`,
    SEATING_MAP: (id) => `/venues/${id}/seating-map`,
  },

  PAYMENTS: {
    BASE: "/payments",
    PROCESS: "/payments/process",
    VERIFY: "/payments/verify",
    REFUND: (id) => `/payments/${id}/refund`,
  },

  ADMIN: {
    STATS: "/admin/stats",
    USERS: {
      BASE: "/admin/users",
      BY_ID: (id) => `/admin/users/${id}`,
      SUSPEND: (id) => `/admin/users/${id}/suspend`,
      ACTIVATE: (id) => `/admin/users/${id}/activate`,
    },
    PERFORMANCES: {
      BASE: "/admin/performances",
      CREATE: "/admin/performances",
      UPDATE: (id) => `/admin/performances/${id}`,
      DELETE: (id) => `/admin/performances/${id}`,
    },
    VENUES: {
      BASE: "/admin/venues",
      CREATE: "/admin/venues",
      UPDATE: (id) => `/admin/venues/${id}`,
      DELETE: (id) => `/admin/venues/${id}`,
    },
    BOOKINGS: {
      BASE: "/admin/bookings",
      BY_ID: (id) => `/admin/bookings/${id}`,
      STATS: "/admin/bookings/stats",
    },
  },
};

export function buildApiUrl(endpoint, params = {}) {
  let url = typeof endpoint === "function" ? endpoint(params) : endpoint;

  if (!url.startsWith("http")) {
    url = `${API_BASE_URL}${url}`;
  }

  return url;
}

export function buildQueryString(params) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      searchParams.append(key, value);
    }
  });
  return searchParams.toString();
}
