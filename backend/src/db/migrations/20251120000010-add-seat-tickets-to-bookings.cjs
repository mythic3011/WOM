module.exports = {
    async up(queryInterface, Sequelize) {
        // Add seatTickets column with default empty array
        await queryInterface.addColumn('bookings', 'seatTickets', {
            type: Sequelize.JSONB,
            allowNull: false,
            defaultValue: [],
            comment: 'Array of seat-ticket assignments with compact structure',
        });

        // Add GIN index for efficient JSONB queries on seatTickets
        await queryInterface.sequelize.query(
            'CREATE INDEX IF NOT EXISTS bookings_seat_tickets_gin_idx ON bookings USING GIN ("seatTickets");'
        );

        // Update seats column to be nullable for backward compatibility
        await queryInterface.changeColumn('bookings', 'seats', {
            type: Sequelize.JSONB,
            allowNull: true,
            defaultValue: null,
            comment: 'DEPRECATED: Use seatTickets instead. Kept for backward compatibility.',
        });
    },

    async down(queryInterface, Sequelize) {
        // Drop the GIN index
        await queryInterface.sequelize.query(
            'DROP INDEX IF EXISTS bookings_seat_tickets_gin_idx;'
        );

        // Remove seatTickets column
        await queryInterface.removeColumn('bookings', 'seatTickets');

        // Restore seats column to original state
        await queryInterface.changeColumn('bookings', 'seats', {
            type: Sequelize.JSONB,
            allowNull: false,
            defaultValue: [],
        });
    },
};
