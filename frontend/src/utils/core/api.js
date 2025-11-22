import { APP_CONFIG } from "@config/config.js";

const API_BASE = APP_CONFIG.apiBaseUrl;

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }

    return data;
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}

export const authAPI = {
  async login(username, password) {
    return apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  async register(userData) {
    return apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  async getProfile() {
    return apiRequest("/auth/profile");
  },

  async updateProfile(profileData) {
    return apiRequest("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  },

  async getProfileImage() {
    return apiRequest("/auth/profile-image");
  },

  async logout() {
    return apiRequest("/auth/logout", {
      method: "POST",
    });
  },

  async checkSession() {
    return apiRequest("/auth/check");
  },
};

export const performanceAPI = {
  async getAll(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/performances?${queryString}`
      : "/performances";
    return apiRequest(endpoint);
  },

  async getById(id) {
    return apiRequest(`/performances/${id}`);
  },

  async getSeats(performanceId) {
    return apiRequest(`/seats/available/${performanceId}`);
  },
};

export const bookingAPI = {
  async create(bookingData) {
    return apiRequest("/bookings", {
      method: "POST",
      body: JSON.stringify(bookingData),
    });
  },

  async getAll() {
    return apiRequest("/bookings");
  },

  async getById(id) {
    return apiRequest(`/bookings/${id}`);
  },

  async cancel(id) {
    return apiRequest(`/bookings/${id}/cancel`, {
      method: "POST",
    });
  },
};
