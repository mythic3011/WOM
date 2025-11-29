'use strict';

module.exports = {
  async up(queryInterface, _Sequelize) {
    await queryInterface.sequelize.query(`
      DROP VIEW IF EXISTS admin_stats_view;
    `);

    await queryInterface.sequelize.query(`
      CREATE VIEW admin_stats_view AS
      WITH user_counts AS (
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
          COUNT(CASE WHEN role = 'user' THEN 1 END) as regular_users,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
          COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended_users,
          COUNT(CASE 
            WHEN DATE_TRUNC('month', "createdAt") = DATE_TRUNC('month', CURRENT_DATE) 
            THEN 1 
          END) as users_this_month
        FROM users
      ),
      booking_counts AS (
        SELECT 
          COUNT(*) as total_bookings,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
          COALESCE(SUM(CASE WHEN status = 'confirmed' THEN amount ELSE 0 END), 0) as total_revenue,
          COALESCE(AVG(CASE WHEN status = 'confirmed' THEN amount END), 0) as average_booking_value,
          COUNT(CASE 
            WHEN "bookingDate" >= CURRENT_DATE - INTERVAL '7 days' 
            THEN 1 
          END) as bookings_last_7_days,
          COUNT(CASE 
            WHEN "bookingDate" >= CURRENT_DATE - INTERVAL '30 days' 
            THEN 1 
          END) as bookings_last_30_days,
          COALESCE(SUM(CASE 
            WHEN status = 'confirmed' 
            AND "bookingDate" >= CURRENT_DATE - INTERVAL '30 days' 
            THEN amount 
            ELSE 0 
          END), 0) as revenue_last_30_days,
          COALESCE(SUM("seatCount"), 0) as total_seats_sold,
          COUNT(DISTINCT "performanceId") as performances_with_bookings
        FROM bookings
      ),
      performance_counts AS (
        SELECT 
          COUNT(*) as total_performances,
          COUNT(CASE WHEN date > NOW() THEN 1 END) as upcoming_performances
        FROM performances
      ),
      venue_counts AS (
        SELECT 
          COUNT(*) as total_venues
        FROM venues
      )
      SELECT 
        COALESCE(uc.total_users, 0)::INTEGER as total_users,
        COALESCE(uc.admin_users, 0)::INTEGER as admin_users,
        COALESCE(uc.regular_users, 0)::INTEGER as regular_users,
        COALESCE(uc.active_users, 0)::INTEGER as active_users,
        COALESCE(uc.suspended_users, 0)::INTEGER as suspended_users,
        COALESCE(uc.users_this_month, 0)::INTEGER as users_this_month,
        COALESCE(bc.total_bookings, 0)::INTEGER as total_bookings,
        COALESCE(bc.confirmed_bookings, 0)::INTEGER as confirmed_bookings,
        COALESCE(bc.pending_bookings, 0)::INTEGER as pending_bookings,
        COALESCE(bc.cancelled_bookings, 0)::INTEGER as cancelled_bookings,
        COALESCE(bc.completed_bookings, 0)::INTEGER as completed_bookings,
        COALESCE(bc.total_revenue, 0)::NUMERIC as total_revenue,
        COALESCE(bc.average_booking_value, 0)::NUMERIC as average_booking_value,
        COALESCE(bc.bookings_last_7_days, 0)::INTEGER as bookings_last_7_days,
        COALESCE(bc.bookings_last_30_days, 0)::INTEGER as bookings_last_30_days,
        COALESCE(bc.revenue_last_30_days, 0)::NUMERIC as revenue_last_30_days,
        COALESCE(pc.total_performances, 0)::INTEGER as total_performances,
        COALESCE(pc.upcoming_performances, 0)::INTEGER as upcoming_performances,
        COALESCE(bc.performances_with_bookings, 0)::INTEGER as performances_with_bookings,
        COALESCE(vc.total_venues, 0)::INTEGER as total_venues,
        COALESCE(bc.total_seats_sold, 0)::INTEGER as total_seats_sold
      FROM user_counts uc
      CROSS JOIN booking_counts bc
      CROSS JOIN performance_counts pc
      CROSS JOIN venue_counts vc;
    `);
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.sequelize.query(`
      DROP VIEW IF EXISTS admin_stats_view;
    `);

    await queryInterface.sequelize.query(`
      CREATE OR REPLACE VIEW admin_stats_view AS
      SELECT 
        COUNT(DISTINCT b.id) as total_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'confirmed' THEN b.id END) as confirmed_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'pending' THEN b.id END) as pending_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'cancelled' THEN b.id END) as cancelled_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) as completed_bookings,
        COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.amount ELSE 0 END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN b.status = 'confirmed' THEN b.amount END), 0) as average_booking_value,
        COUNT(DISTINCT b."userId") as total_customers,
        COUNT(DISTINCT b."performanceId") as performances_with_bookings,
        COALESCE(SUM(b."seatCount"), 0) as total_seats_sold,
        COUNT(DISTINCT CASE 
          WHEN b.status IN ('confirmed', 'pending') 
          AND p.date > NOW() 
          THEN b.id 
        END) as upcoming_bookings,
        COUNT(DISTINCT CASE 
          WHEN b."bookingDate" >= CURRENT_DATE - INTERVAL '7 days' 
          THEN b.id 
        END) as bookings_last_7_days,
        COUNT(DISTINCT CASE 
          WHEN b."bookingDate" >= CURRENT_DATE - INTERVAL '30 days' 
          THEN b.id 
        END) as bookings_last_30_days,
        COALESCE(SUM(CASE 
          WHEN b.status = 'confirmed' 
          AND b."bookingDate" >= CURRENT_DATE - INTERVAL '30 days' 
          THEN b.amount 
          ELSE 0 
        END), 0) as revenue_last_30_days
      FROM bookings b
      LEFT JOIN performances p ON b."performanceId" = p.id;
    `);
  }
};
