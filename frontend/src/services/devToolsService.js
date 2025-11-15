import { apiClient } from "./apiClient.js";

export const devToolsService = {
  async generateMockUsers(count = 10, role = "user") {
    const response = await apiClient.post("/dev-tools/generate/users", {
      count,
      role,
    });
    return response.data;
  },

  async generateMockPerformances(count = 10) {
    const response = await apiClient.post("/dev-tools/generate/performances", {
      count,
    });
    return response.data;
  },

  async generateMockBookings(count = 20) {
    const response = await apiClient.post("/dev-tools/generate/bookings", {
      count,
    });
    return response.data;
  },

  async clearAllData(confirm) {
    const response = await apiClient.post("/dev-tools/clear-all", {
      confirm,
    });
    return response.data;
  },

  async getSystemStats() {
    const response = await apiClient.get("/dev-tools/stats");
    return response.data;
  },
};
