/**
 * @file apiClient.js
 * @description HTTP client for API communication with authentication and error handling
 * @author LI Ning 25127563d
 * @author SHEK chinhei 25017482d
 * @dependency @config/config.js
 * @dependency @utils/ui/notification.js
 * @dependency ./storageService.js
 * @see authService.js
 * @see performanceService.js
 * @see bookingService.js
 */

import { APP_CONFIG } from "@config/config.js";
import { notify } from "@utils/ui/notification.js";

import { storage } from "./storageService.js";

const API_BASE = APP_CONFIG.apiBaseUrl;

/**
 * @class ApiClient
 * @description HTTP client for making API requests with authentication and error handling
 */
class ApiClient {
  /**
   * @description Creates an instance of ApiClient
   */
  constructor() {
    this.baseURL = API_BASE;
    this.defaultHeaders = {
      "Content-Type": "application/json",
    };
  }

  /**
   * @description Makes an HTTP request to the API
   * @param {string} endpoint - API endpoint path
   * @param {Object} options - Fetch options
   * @returns {Promise<*>} Response data
   * @throws {Error} When request fails or returns non-OK status
   */
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

  /**
   * @description Handles 401 unauthorized responses by redirecting to login
   */
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

  /**
   * @description Handles 403 forbidden responses by clearing user and redirecting
   */
  handleForbidden() {
    const currentPath = window.location.pathname;
    if (currentPath.startsWith("/admin")) {
      storage.clearUser();
      notify.error("You don't have permission to access this resource");
      window.location.href = "/login";
    }
  }

  /**
   * @description Makes a GET request
   * @param {string} endpoint - API endpoint path
   * @param {Object} options - Fetch options
   * @returns {Promise<*>} Response data
   */
  get(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "GET",
    });
  }

  /**
   * @description Makes a POST request
   * @param {string} endpoint - API endpoint path
   * @param {*} data - Request body data
   * @param {Object} options - Fetch options
   * @returns {Promise<*>} Response data
   */
  post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * @description Makes a PUT request
   * @param {string} endpoint - API endpoint path
   * @param {*} data - Request body data
   * @param {Object} options - Fetch options
   * @returns {Promise<*>} Response data
   */
  put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * @description Makes a DELETE request
   * @param {string} endpoint - API endpoint path
   * @param {Object} options - Fetch options
   * @returns {Promise<*>} Response data
   */
  delete(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "DELETE",
    });
  }

  /**
   * @description Makes a PATCH request
   * @param {string} endpoint - API endpoint path
   * @param {*} data - Request body data
   * @param {Object} options - Fetch options
   * @returns {Promise<*>} Response data
   */
  patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();

/**
 * @description Authentication API endpoints
 */
export const authAPI = {
  /**
   * @description Registers a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Registration response
   */
  async register(userData) {
    return apiClient.post("/auth/register", userData);
  },

  /**
   * @description Logs in a user with username or email
   * @param {string} usernameOrEmail - Username or email address
   * @param {string} password - User password
   * @returns {Promise<Object>} Login response with user data
   */
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

  /**
   * @description Logs out the current user
   * @returns {Promise<Object>} Logout response
   */
  async logout() {
    return apiClient.post("/auth/logout");
  },

  /**
   * @description Gets the current authenticated user
   * @returns {Promise<Object>} Current user data
   */
  async getCurrentUser() {
    return apiClient.get("/auth/me");
  },

  /**
   * @description Checks if the current session is valid
   * @returns {Promise<Object>} Session status
   */
  async checkSession() {
    return apiClient.get("/auth/check");
  },

  /**
   * @description Gets the current user's profile image
   * @returns {Promise<Object>} Profile image data
   */
  async getProfileImage() {
    return apiClient.get("/auth/profile-image");
  },
};

/**
 * @description User API endpoints
 */
export const userAPI = {
  /**
   * @description Gets all users with optional filters
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Users list
   */
  async getAll(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/users?${queryString}` : "/users";
    return apiClient.get(endpoint);
  },

  /**
   * @description Gets a user by ID
   * @param {number|string} id - User ID
   * @returns {Promise<Object>} User data
   */
  async getById(id) {
    return apiClient.get(`/users/${id}`);
  },

  /**
   * @description Creates a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async create(userData) {
    return apiClient.post("/users", userData);
  },

  /**
   * @description Updates a user
   * @param {number|string} id - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} Updated user
   */
  async update(id, userData) {
    return apiClient.put(`/users/${id}`, userData);
  },

  /**
   * @description Deletes a user
   * @param {number|string} id - User ID
   * @returns {Promise<Object>} Deletion response
   */
  async delete(id) {
    return apiClient.delete(`/users/${id}`);
  },

  /**
   * @description Deletes the current user's account
   * @param {string} password - User password for confirmation
   * @returns {Promise<Object>} Deletion response
   */
  async deleteSelf(password) {
    return apiClient.post("/users/me/delete", { password });
  },

  /**
   * @description Gets bookings for a specific user
   * @param {number|string} id - User ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} User bookings
   */
  async getUserBookings(id, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/users/${id}/bookings?${queryString}`
      : `/users/${id}/bookings`;
    return apiClient.get(endpoint);
  },
};

/**
 * @description Performance API endpoints
 */
export const performanceAPI = {
  /**
   * @description Gets all performances with optional filters
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Performances list
   */
  async getAll(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/performances?${queryString}`
      : "/performances";
    return apiClient.get(endpoint);
  },

  /**
   * @description Gets a performance by ID
   * @param {number|string} id - Performance ID
   * @returns {Promise<Object>} Performance data
   */
  async getById(id) {
    return apiClient.get(`/performances/${id}`);
  },

  /**
   * @description Creates a new performance
   * @param {Object} performanceData - Performance data
   * @returns {Promise<Object>} Created performance
   */
  async create(performanceData) {
    return apiClient.post("/performances", performanceData);
  },

  /**
   * @description Updates a performance
   * @param {number|string} id - Performance ID
   * @param {Object} performanceData - Updated performance data
   * @returns {Promise<Object>} Updated performance
   */
  async update(id, performanceData) {
    return apiClient.put(`/performances/${id}`, performanceData);
  },

  /**
   * @description Deletes a performance
   * @param {number|string} id - Performance ID
   * @returns {Promise<Object>} Deletion response
   */
  async delete(id) {
    return apiClient.delete(`/performances/${id}`);
  },

  /**
   * @description Gets seat availability for a performance
   * @param {number|string} id - Performance ID
   * @param {number|string|null} showtimeId - Optional showtime ID
   * @returns {Promise<Object>} Availability data
   */
  async getAvailability(id, showtimeId = null) {
    const endpoint = showtimeId
      ? `/performances/${id}/availability?showtimeId=${showtimeId}`
      : `/performances/${id}/availability`;
    return apiClient.get(endpoint);
  },
};

/**
 * @description Booking API endpoints
 */
export const bookingAPI = {
  /**
   * @description Gets all bookings with optional filters
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Bookings list
   */
  async getAll(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/bookings?${queryString}` : "/bookings";
    return apiClient.get(endpoint);
  },

  /**
   * @description Gets a booking by ID
   * @param {number|string} id - Booking ID
   * @returns {Promise<Object>} Booking data
   */
  async getById(id) {
    return apiClient.get(`/bookings/${id}`);
  },

  /**
   * @description Creates a new booking
   * @param {Object} bookingData - Booking data
   * @returns {Promise<Object>} Created booking
   */
  async create(bookingData) {
    return apiClient.post("/bookings", bookingData);
  },

  /**
   * @description Updates a booking
   * @param {number|string} id - Booking ID
   * @param {Object} bookingData - Updated booking data
   * @returns {Promise<Object>} Updated booking
   */
  async update(id, bookingData) {
    return apiClient.put(`/bookings/${id}`, bookingData);
  },

  /**
   * @description Cancels a booking
   * @param {number|string} id - Booking ID
   * @returns {Promise<Object>} Cancellation response
   */
  async cancel(id) {
    return apiClient.post(`/bookings/${id}/cancel`);
  },

  /**
   * @description Confirms a booking
   * @param {number|string} id - Booking ID
   * @returns {Promise<Object>} Confirmation response
   */
  async confirm(id) {
    return apiClient.post(`/bookings/${id}/confirm`);
  },

  /**
   * @description Gets booking statistics
   * @returns {Promise<Object>} Booking stats
   */
  async getStats() {
    return apiClient.get("/bookings/stats");
  },
};

/**
 * @description Venue API endpoints
 */
export const venueAPI = {
  /**
   * @description Gets all venues with optional filters
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Venues list
   */
  async getAll(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/venues?${queryString}` : "/venues";
    return apiClient.get(endpoint);
  },

  /**
   * @description Gets a venue by ID
   * @param {number|string} id - Venue ID
   * @returns {Promise<Object>} Venue data
   */
  async getById(id) {
    return apiClient.get(`/venues/${id}`);
  },

  /**
   * @description Creates a new venue
   * @param {Object} venueData - Venue data
   * @returns {Promise<Object>} Created venue
   */
  async create(venueData) {
    return apiClient.post("/venues", venueData);
  },

  /**
   * @description Updates a venue
   * @param {number|string} id - Venue ID
   * @param {Object} venueData - Updated venue data
   * @returns {Promise<Object>} Updated venue
   */
  async update(id, venueData) {
    return apiClient.put(`/venues/${id}`, venueData);
  },

  /**
   * @description Deletes a venue
   * @param {number|string} id - Venue ID
   * @returns {Promise<Object>} Deletion response
   */
  async delete(id) {
    return apiClient.delete(`/venues/${id}`);
  },
};

/**
 * @description Ticket Type API endpoints
 */
export const ticketTypeAPI = {
  /**
   * @description Gets all ticket types
   * @returns {Promise<Object>} Ticket types list
   */
  async getAll() {
    return apiClient.get("/ticket-types");
  },

  /**
   * @description Gets a ticket type by ID
   * @param {number|string} id - Ticket type ID
   * @returns {Promise<Object>} Ticket type data
   */
  async getById(id) {
    return apiClient.get(`/ticket-types/${id}`);
  },

  /**
   * @description Creates a new ticket type
   * @param {Object} ticketTypeData - Ticket type data
   * @returns {Promise<Object>} Created ticket type
   */
  async create(ticketTypeData) {
    return apiClient.post("/ticket-types", ticketTypeData);
  },

  /**
   * @description Updates a ticket type
   * @param {number|string} id - Ticket type ID
   * @param {Object} ticketTypeData - Updated ticket type data
   * @returns {Promise<Object>} Updated ticket type
   */
  async update(id, ticketTypeData) {
    return apiClient.put(`/ticket-types/${id}`, ticketTypeData);
  },

  /**
   * @description Deletes a ticket type
   * @param {number|string} id - Ticket type ID
   * @returns {Promise<Object>} Deletion response
   */
  async delete(id) {
    return apiClient.delete(`/ticket-types/${id}`);
  },
};

/**
 * @description Statistics API endpoints
 */
export const statsAPI = {
  /**
   * @description Gets user statistics
   * @param {number|string|null} userId - Optional user ID
   * @returns {Promise<Object>} User statistics
   */
  async getUserStats(userId = null) {
    const endpoint = userId ? `/stats/user/${userId}` : "/stats/user";
    return apiClient.get(endpoint);
  },

  /**
   * @description Gets statistics for a specific performance
   * @param {number|string} performanceId - Performance ID
   * @returns {Promise<Object>} Performance statistics
   */
  async getPerformanceStats(performanceId) {
    return apiClient.get(`/stats/performances/${performanceId}`);
  },

  /**
   * @description Gets admin dashboard statistics
   * @returns {Promise<Object>} Admin statistics
   */
  async getAdminStats() {
    return apiClient.get("/stats/admin");
  },

  /**
   * @description Gets statistics for all performances
   * @returns {Promise<Object>} All performance statistics
   */
  async getAllPerformanceStats() {
    return apiClient.get("/stats/performances");
  },

  /**
   * @description Gets statistics for a specific venue
   * @param {number|string} venueId - Venue ID
   * @returns {Promise<Object>} Venue statistics
   */
  async getVenueStats(venueId) {
    return apiClient.get(`/stats/venues/${venueId}`);
  },

  /**
   * @description Gets statistics for all venues
   * @returns {Promise<Object>} All venue statistics
   */
  async getAllVenueStats() {
    return apiClient.get("/stats/venues");
  },
};

/**
 * @description Handles API errors and displays appropriate notifications
 * @param {Error} error - Error object with status and data
 * @param {string|null} customMessage - Optional custom error message
 */
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
