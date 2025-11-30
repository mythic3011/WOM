/**
 * @file statsService.js
 * @description Service for fetching statistics data
 * @author LI Ning 25127563d
 * @author SHEK chinhei 25017482d
 * @dependency ./apiClient.js
 * @see apiClient.js
 */

import apiClient from "./apiClient.js";

/**
 * @description Statistics service for fetching stats data
 */
export const statsService = {
  /**
   * @description Gets admin dashboard statistics
   * @returns {Promise<Object>} Admin statistics
   */
  async getAdminStats() {
    const response = await apiClient.get("/stats/admin");
    return response.data;
  },

  /**
   * @description Gets current user statistics
   * @returns {Promise<Object>} User statistics
   */
  async getUserStats() {
    const response = await apiClient.get("/stats/user");
    return response.data;
  },

  /**
   * @description Gets statistics for a specific performance
   * @param {number|string} performanceId - Performance ID
   * @returns {Promise<Object>} Performance statistics
   */
  async getPerformanceStats(performanceId) {
    const response = await apiClient.get(`/stats/performances/${performanceId}`);
    return response.data;
  },

  /**
   * @description Gets statistics for all performances
   * @returns {Promise<Object>} All performance statistics
   */
  async getAllPerformanceStats() {
    const response = await apiClient.get("/stats/performances");
    return response.data;
  },

  /**
   * @description Gets statistics for a specific venue
   * @param {number|string} venueId - Venue ID
   * @returns {Promise<Object>} Venue statistics
   */
  async getVenueStats(venueId) {
    const response = await apiClient.get(`/stats/venues/${venueId}`);
    return response.data;
  },

  /**
   * @description Gets statistics for all venues
   * @returns {Promise<Object>} All venue statistics
   */
  async getAllVenueStats() {
    const response = await apiClient.get("/stats/venues");
    return response.data;
  }
};
