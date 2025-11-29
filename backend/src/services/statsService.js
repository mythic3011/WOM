import sequelize from "#config/database.js";

export const statsService = {
  async getAdminStats() {
    const [results] = await sequelize.query(`
      SELECT * FROM admin_stats_view
    `);
    return results[0] || {};
  },

  async getUserStats(userId) {
    const [results] = await sequelize.query(`
      SELECT * FROM user_stats_view
      WHERE user_id = :userId
    `, {
      replacements: { userId }
    });
    return results[0] || {};
  },

  async getPerformanceStats(performanceId) {
    const [results] = await sequelize.query(`
      SELECT * FROM performance_stats_view
      WHERE performance_id = :performanceId
    `, {
      replacements: { performanceId }
    });
    return results[0] || {};
  },

  async getAllPerformanceStats() {
    const [results] = await sequelize.query(`
      SELECT * FROM performance_stats_view
      ORDER BY performance_date DESC
    `);
    return results;
  },

  async getVenueStats(venueId) {
    const [results] = await sequelize.query(`
      SELECT * FROM venue_stats_view
      WHERE venue_id = :venueId
    `, {
      replacements: { venueId }
    });
    return results[0] || {};
  },

  async getAllVenueStats() {
    const [results] = await sequelize.query(`
      SELECT * FROM venue_stats_view
      ORDER BY total_revenue DESC
    `);
    return results;
  }
};
