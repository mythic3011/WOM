const { faker } = require('@faker-js/faker');

module.exports = {
    async up(queryInterface, Sequelize) {
        // Import booking generation utilities
        const { generateBookings } = require('../data/bookings.js');
        const { getMockDataConfig } = require('../../config/mockDataConfig.js');

        // Get mock data configuration
        const mockConfig = getMockDataConfig();

        // Fetch required data
        const users = await queryInterface.sequelize.query(
            'SELECT id, name, email FROM users',
            { type: Sequelize.QueryTypes.SELECT }
        );

        const performances = await queryInterface.sequelize.query(
            'SELECT id, "venueId", date, status, "totalSeats", "availableSeats", "bookedSeats", "seatMap" FROM performances',
            { type: Sequelize.QueryTypes.SELECT }
        );

        const ticketTypes = await queryInterface.sequelize.query(
            'SELECT id, name, discount, "minGroupSize" FROM ticket_types',
            { type: Sequelize.QueryTypes.SELECT }
        );

        // Parse seatMap JSON for each performance
        performances.forEach(perf => {
            if (typeof perf.seatMap === 'string') {
                perf.seatMap = JSON.parse(perf.seatMap);
            }
        });

        // Initialize faker with seed
        faker.seed(mockConfig.seed);

        // Create broken seats map (empty for now since we don't have broken seats in seeders)
        const brokenSeatsMap = new Map();

        // Generate bookings
        const generatedBookings = await generateBookings({
            users,
            performances,
            ticketTypes,
            count: mockConfig.volumes.bookings,
            seed: mockConfig.seed,
            patterns: mockConfig.bookingPatterns,
            brokenSeats: brokenSeatsMap,
        });

        if (generatedBookings.length > 0) {
            // Insert bookings
            await queryInterface.bulkInsert('bookings', generatedBookings);

            // Update performance seat availability
            const bookingsByPerformance = new Map();

            generatedBookings.forEach(booking => {
                if (!bookingsByPerformance.has(booking.performanceId)) {
                    bookingsByPerformance.set(booking.performanceId, []);
                }
                bookingsByPerformance.get(booking.performanceId).push(booking);
            });

            // Update each performance's seat counts
            for (const [performanceId, perfBookings] of bookingsByPerformance) {
                const performance = performances.find(p => p.id === performanceId);
                if (performance) {
                    const bookedSeats = perfBookings.reduce((sum, b) => sum + b.seatCount, 0);
                    const availableSeats = Math.max(0, performance.totalSeats - bookedSeats);

                    await queryInterface.sequelize.query(
                        `UPDATE performances 
             SET "bookedSeats" = :bookedSeats, 
                 "availableSeats" = :availableSeats,
                 "updatedAt" = NOW()
             WHERE id = :performanceId`,
                        {
                            replacements: { bookedSeats, availableSeats, performanceId },
                            type: Sequelize.QueryTypes.UPDATE
                        }
                    );
                }
            }

            console.log(`Created ${generatedBookings.length} bookings`);
        } else {
            console.log('No bookings generated');
        }
    },

    async down(queryInterface, _Sequelize) {
        await queryInterface.bulkDelete('bookings', null, {});

        // Reset performance seat counts
        await queryInterface.sequelize.query(
            `UPDATE performances 
       SET "bookedSeats" = 0, 
           "availableSeats" = "totalSeats",
           "updatedAt" = NOW()`
        );
    },
};
