'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Check if column already exists (in case migration was run from updated initial migration)
        const tableDescription = await queryInterface.describeTable('ticket_types');

        if (!tableDescription.minGroupSize) {
            await queryInterface.addColumn('ticket_types', 'minGroupSize', {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: null,
                comment: 'Minimum number of seats required for this ticket type (for group tickets)',
            });

            console.log('✓ Added minGroupSize column to ticket_types table');
        } else {
            console.log('✓ minGroupSize column already exists, skipping');
        }
    },

    async down(queryInterface, Sequelize) {
        const tableDescription = await queryInterface.describeTable('ticket_types');

        if (tableDescription.minGroupSize) {
            await queryInterface.removeColumn('ticket_types', 'minGroupSize');
            console.log('✓ Removed minGroupSize column from ticket_types table');
        }
    }
};
