'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE VIEW bookings_view AS
      SELECT 
        b.id,
        b."bookingReference",
        b."userId",
        b."userName",
        b."userEmail",
        b."performanceId",
        b."performanceTitle",
        b."venueId",
        b."venueName",
        b."showtimeId",
        b.showtime,
        b.seats,
        b."seatTickets",
        b."seatCount",
        b.amount,
        b."totalAmount",
        b."bookingDate",
        b.status,
        b."paymentMethod",
        b."paymentStatus",
        b.notes,
        b."customerInfo",
        b."createdAt",
        b."updatedAt",
        u.name as user_name,
        u.email as user_email,
        u.phone as user_phone,
        p.title as performance_title,
        p.date as performance_date,
        p.status as performance_status,
        p.image as performance_image,
        v.name as venue_name,
        v.address as venue_address,
        v.capacity as venue_capacity
      FROM bookings b
      LEFT JOIN users u ON b."userId" = u.id
      LEFT JOIN performances p ON b."performanceId" = p.id
      LEFT JOIN venues v ON b."venueId" = v.id;
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DROP VIEW IF EXISTS bookings_view;
    `);
  }
};
