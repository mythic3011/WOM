import apiClient from "./apiClient.js";

export const statsService = {
  async getAdminStats() {
    const response = await apiClient.get("/stats/admin");
    return response.data;
  },

  async getUserStats() {
    const response = await apiClient.get("/stats/user");
    return response.data;
  },

  async getPerformanceStats(performanceId) {
    const response = await apiClient.get(`/stats/performances/${performanceId}`);
    return response.data;
  },

  async getAllPerformanceStats() {
    const response = await apiClient.get("/stats/performances");
    return response.data;
  },

  async getVenueStats(venueId) {
    const response = await apiClient.get(`/stats/venues/${venueId}`);
    return response.data;
  },

  async getAllVenueStats() {
    const response = await apiClient.get("/stats/venues");
    return response.data;
  }
};
