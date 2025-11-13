import { APP_CONFIG } from "../config/config.js";
import { notify } from "../utils/ui/notification.js";
import { storage } from "./storageService.js";

const API_BASE = APP_CONFIG.apiBaseUrl;

class ApiClient {
  constructor() {
    this.baseURL = API_BASE;
    this.defaultHeaders = {
      "Content-Type": "application/json",
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      credentials: "include",
    };

    try {
      const response = await fetch(url, config);
      const contentType = response.headers.get("content-type");

      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const error = new Error(data.message || `HTTP ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error) {
      if (error.status === 401) {
        this.handleUnauthorized();
      } else if (error.status === 403) {
        this.handleForbidden();
      }

      console.error("API request failed:", error);
      throw error;
    }
  }

  handleUnauthorized() {
    const currentPath = window.location.pathname;
    if (
      !currentPath.startsWith("/login") &&
      !currentPath.startsWith("/register")
    ) {
      storage.clearUser();
      window.location.href = `/login?redirect=${encodeURIComponent(
        currentPath
      )}`;
    }
  }

  handleForbidden() {
    const currentPath = window.location.pathname;
    if (currentPath.startsWith("/admin")) {
      storage.clearUser();
      notify.error("You don't have permission to access this resource");
      window.location.href = "/login";
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "GET",
    });
  }

  post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "DELETE",
    });
  }

  patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();

export const authAPI = {
  async register(userData) {
    return apiClient.post("/auth/register", userData);
  },

  async login(usernameOrEmail, password) {
    const payload = {};
    if (usernameOrEmail.includes("@")) {
      payload.email = usernameOrEmail;
    } else {
      payload.username = usernameOrEmail;
    }
    payload.password = password;
    return apiClient.post("/auth/login", payload);
  },

  async logout() {
    return apiClient.post("/auth/logout");
  },

  async getCurrentUser() {
    return apiClient.get("/auth/me");
  },

  async checkSession() {
    return apiClient.get("/auth/check");
  },
};

export const userAPI = {
  async getAll(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/users?${queryString}` : "/users";
    return apiClient.get(endpoint);
  },

  async getById(id) {
    return apiClient.get(`/users/${id}`);
  },

  async create(userData) {
    return apiClient.post("/users", userData);
  },

  async update(id, userData) {
    return apiClient.put(`/users/${id}`, userData);
  },

  async delete(id) {
    return apiClient.delete(`/users/${id}`);
  },

  async deleteSelf(password) {
    return apiClient.post("/users/me/delete", { password });
  },

  async getUserBookings(id, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/users/${id}/bookings?${queryString}`
      : `/users/${id}/bookings`;
    return apiClient.get(endpoint);
  },
};

export const performanceAPI = {
  async getAll(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/performances?${queryString}`
      : "/performances";
    return apiClient.get(endpoint);
  },

  async getById(id) {
    return apiClient.get(`/performances/${id}`);
  },

  async create(performanceData) {
    return apiClient.post("/performances", performanceData);
  },

  async update(id, performanceData) {
    return apiClient.put(`/performances/${id}`, performanceData);
  },

  async delete(id) {
    return apiClient.delete(`/performances/${id}`);
  },

  async getAvailability(id, showtimeId = null) {
    const endpoint = showtimeId
      ? `/performances/${id}/availability?showtimeId=${showtimeId}`
      : `/performances/${id}/availability`;
    return apiClient.get(endpoint);
  },
};

export const bookingAPI = {
  async getAll(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/bookings?${queryString}` : "/bookings";
    return apiClient.get(endpoint);
  },

  async getById(id) {
    return apiClient.get(`/bookings/${id}`);
  },

  async create(bookingData) {
    return apiClient.post("/bookings", bookingData);
  },

  async update(id, bookingData) {
    return apiClient.put(`/bookings/${id}`, bookingData);
  },

  async cancel(id) {
    return apiClient.post(`/bookings/${id}/cancel`);
  },

  async confirm(id) {
    return apiClient.post(`/bookings/${id}/confirm`);
  },

  async getStats() {
    return apiClient.get("/bookings/stats");
  },
};

export const venueAPI = {
  async getAll(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/venues?${queryString}` : "/venues";
    return apiClient.get(endpoint);
  },

  async getById(id) {
    return apiClient.get(`/venues/${id}`);
  },

  async create(venueData) {
    return apiClient.post("/venues", venueData);
  },

  async update(id, venueData) {
    return apiClient.put(`/venues/${id}`, venueData);
  },

  async delete(id) {
    return apiClient.delete(`/venues/${id}`);
  },
};

export const ticketTypeAPI = {
  async getAll() {
    return apiClient.get("/ticket-types");
  },

  async getById(id) {
    return apiClient.get(`/ticket-types/${id}`);
  },

  async create(ticketTypeData) {
    return apiClient.post("/ticket-types", ticketTypeData);
  },

  async update(id, ticketTypeData) {
    return apiClient.put(`/ticket-types/${id}`, ticketTypeData);
  },

  async delete(id) {
    return apiClient.delete(`/ticket-types/${id}`);
  },
};

export const statsAPI = {
  async getDashboardStats() {
    return apiClient.get("/stats/dashboard");
  },

  async getUserStats(userId = null) {
    const endpoint = userId ? `/stats/user/${userId}` : "/stats/user";
    return apiClient.get(endpoint);
  },

  async getPerformanceStats(performanceId) {
    return apiClient.get(`/stats/performance/${performanceId}`);
  },
};

export const handleApiError = (error, customMessage = null) => {
  const message = customMessage || error.message || "An error occurred";

  if (error.status === 401) {
    notify.error("Please login to continue");
  } else if (error.status === 403) {
    notify.error("You don't have permission to perform this action");
  } else if (error.status === 404) {
    notify.error("Resource not found");
  } else if (error.status === 422 || error.status === 400) {
    if (error.data && error.data.errors && Array.isArray(error.data.errors)) {
      const errorMessages = error.data.errors.map((e) => e.message).join(", ");
      notify.error(errorMessages);
    } else {
      notify.error(message);
    }
  } else if (error.status >= 500) {
    notify.error("Server error. Please try again later.");
  } else {
    notify.error(message);
  }
};

export default apiClient;
