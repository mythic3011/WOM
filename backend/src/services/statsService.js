/**
 * @file statsService.js
 * @description Statistics service providing aggregated data for admin, users, performances, and venues
 * @author LI Ning 25127563d
 * @author SHEK chinhei 25017482d
 * @dependency sequelize - Database ORM
 * @see #controllers/statsController.js
 */

import sequelize from "#config/database.js";

export const statsService = {
  /**
   * @returns {Promise<Object>}
   */
  async getAdminStats() {
    const [results] = await sequelize.query(`
      SELECT * FROM admin_stats_view
    `);
    return results[0] || {};
  },

  /**
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async getUserStats(userId) {
    const [results] = await sequelize.query(`
      SELECT * FROM user_stats_view
      WHERE user_id = :userId
    `, {
      replacements: { userId }
    });
    return results[0] || {};
  },

  /**
   * @param {string} performanceId
   * @returns {Promise<Object>}
   */
  async getPerformanceStats(performanceId) {
    const [results] = await sequelize.query(`
      SELECT * FROM performance_stats_view
      WHERE performance_id = :performanceId
    `, {
      replacements: { performanceId }
    });
    return results[0] || {};
  },

  /**
   * @returns {Promise<Array>}
   */
  async getAllPerformanceStats() {
    const [results] = await sequelize.query(`
      SELECT * FROM performance_stats_view
      ORDER BY performance_date DESC
    `);
    return results;
  },

  /**
   * @param {string} venueId
   * @returns {Promise<Object>}
   */
  async getVenueStats(venueId) {
    const [results] = await sequelize.query(`
      SELECT * FROM venue_stats_view
      WHERE venue_id = :venueId
    `, {
      replacements: { venueId }
    });
    return results[0] || {};
  },

  /**
   * @returns {Promise<Array>}
   */
  async getAllVenueStats() {
    const [results] = await sequelize.query(`
      SELECT * FROM venue_stats_view
      ORDER BY total_revenue DESC
    `);
    return results;
  }
};
