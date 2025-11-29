'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE VIEW user_stats_view AS
      SELECT 
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        COUNT(DISTINCT b.id) as total_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'confirmed' THEN b.id END) as confirmed_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'pending' THEN b.id END) as pending_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'cancelled' THEN b.id END) as cancelled_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) as completed_bookings,
        COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.amount ELSE 0 END), 0) as total_spent,
        COALESCE(AVG(CASE WHEN b.status = 'confirmed' THEN b.amount END), 0) as average_spent,
        COUNT(DISTINCT CASE 
          WHEN b.status IN ('confirmed', 'pending') 
          AND p.date > NOW() 
          THEN b.id 
        END) as upcoming_bookings,
        MIN(b."bookingDate") as first_booking_date,
        MAX(b."bookingDate") as last_booking_date,
        COALESCE(SUM(b."seatCount"), 0) as total_seats_booked
      FROM users u
      LEFT JOIN bookings b ON u.id = b."userId"
      LEFT JOIN performances p ON b."performanceId" = p.id
      GROUP BY u.id, u.name, u.email;
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

    await queryInterface.sequelize.query(`
      CREATE OR REPLACE VIEW performance_stats_view AS
      SELECT 
        p.id as performance_id,
        p.title as performance_title,
        p.date as performance_date,
        p.status as performance_status,
        v.name as venue_name,
        p."totalSeats" as total_seats,
        p."availableSeats" as available_seats,
        p."bookedSeats" as booked_seats,
        COUNT(DISTINCT b.id) as total_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'confirmed' THEN b.id END) as confirmed_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'pending' THEN b.id END) as pending_bookings,
        COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.amount ELSE 0 END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN b.status = 'confirmed' THEN b.amount END), 0) as average_ticket_price,
        COUNT(DISTINCT b."userId") as unique_customers,
        CASE 
          WHEN p."totalSeats" > 0 
          THEN ROUND((p."bookedSeats"::numeric / p."totalSeats"::numeric * 100), 2)
          ELSE 0 
        END as occupancy_rate
      FROM performances p
      LEFT JOIN venues v ON p."venueId" = v.id
      LEFT JOIN bookings b ON p.id = b."performanceId"
      GROUP BY p.id, p.title, p.date, p.status, v.name, p."totalSeats", p."availableSeats", p."bookedSeats";
    `);

    await queryInterface.sequelize.query(`
      CREATE OR REPLACE VIEW venue_stats_view AS
      SELECT 
        v.id as venue_id,
        v.name as venue_name,
        v.address as venue_address,
        v.capacity as venue_capacity,
        COUNT(DISTINCT p.id) as total_performances,
        COUNT(DISTINCT CASE WHEN p.date > NOW() THEN p.id END) as upcoming_performances,
        COUNT(DISTINCT b.id) as total_bookings,
        COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.amount ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(b."seatCount"), 0) as total_seats_sold,
        COUNT(DISTINCT b."userId") as unique_customers
      FROM venues v
      LEFT JOIN performances p ON v.id = p."venueId"
      LEFT JOIN bookings b ON p.id = b."performanceId"
      GROUP BY v.id, v.name, v.address, v.capacity;
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`DROP VIEW IF EXISTS user_stats_view;`);
    await queryInterface.sequelize.query(`DROP VIEW IF EXISTS admin_stats_view;`);
    await queryInterface.sequelize.query(`DROP VIEW IF EXISTS performance_stats_view;`);
    await queryInterface.sequelize.query(`DROP VIEW IF EXISTS venue_stats_view;`);
  }
};
