#!/usr/bin/env node

/**
 * Quick Staging Migration Validation Script
 * 
 * This script performs quick validation checks on the staging database
 * to ensure the migration was successful and data is intact.
 * 
 * Usage:
 *   node backend/src/scripts/validateStagingMigration.js
 */

import { Booking } from '../models/index.js';
import sequelize from '../config/database.js';
import { validateSeatTicketStructure } from '../utils/seatIdHelper.js';

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function validateMigration() {
    console.log(`\n${  '='.repeat(60)}`);
    log('STAGING MIGRATION VALIDATION', 'cyan');
    console.log(`${'='.repeat(60)  }\n`);

    const results = {
        totalBookings: 0,
        validBookings: 0,
        invalidBookings: 0,
        emptyBookings: 0,
        issues: []
    };

    try {
        // Get all bookings
        const bookings = await Booking.findAll({
            attributes: ['id', 'bookingReference', 'seatTickets', 'seats', 'totalAmount']
        });

        results.totalBookings = bookings.length;
        log(`Found ${bookings.length} booking(s) in database`, 'cyan');

        // Validate each booking
        for (const booking of bookings) {
            if (!booking.seatTickets || booking.seatTickets.length === 0) {
                if (booking.seats && booking.seats.length > 0) {
                    results.emptyBookings++;
                    results.issues.push({
                        id: booking.id,
                        reference: booking.bookingReference,
                        issue: 'Empty seatTickets but has seats data'
                    });
                }
                continue;
            }

            if (validateSeatTicketStructure(booking.seatTickets)) {
                results.validBookings++;
            } else {
                results.invalidBookings++;
                results.issues.push({
                    id: booking.id,
                    reference: booking.bookingReference,
                    issue: 'Invalid seatTickets structure'
                });
            }
        }

        // Print results
        console.log('\nValidation Results:');
        console.log('─'.repeat(60));
        log(`✓ Total bookings: ${results.totalBookings}`, 'cyan');
        log(`✓ Valid bookings: ${results.validBookings}`, 'green');

        if (results.invalidBookings > 0) {
            log(`✗ Invalid bookings: ${results.invalidBookings}`, 'red');
        } else {
            log(`✓ Invalid bookings: 0`, 'green');
        }

        if (results.emptyBookings > 0) {
            log(`⚠ Empty seatTickets: ${results.emptyBookings}`, 'yellow');
        } else {
            log(`✓ Empty seatTickets: 0`, 'green');
        }

        // Show issues if any
        if (results.issues.length > 0) {
            console.log('\nIssues Found:');
            console.log('─'.repeat(60));
            results.issues.forEach((issue, index) => {
                log(`${index + 1}. ${issue.reference} (ID: ${issue.id})`, 'yellow');
                log(`   ${issue.issue}`, 'yellow');
            });
        }

        // Test a sample query
        console.log('\nTesting Analytics Query:');
        console.log('─'.repeat(60));
        try {
            const adultBookings = await Booking.findAll({
                where: sequelize.literal(
                    `"seatTickets" @> '[{"ticketTypeId": "adult"}]'`
                )
            });
            log(`✓ Found ${adultBookings.length} booking(s) with adult tickets`, 'green');
        } catch (error) {
            log(`✗ Analytics query failed: ${error.message}`, 'red');
        }

        // Final verdict
        console.log(`\n${  '='.repeat(60)}`);
        if (results.invalidBookings === 0 && results.emptyBookings === 0) {
            log('✓ VALIDATION PASSED - All bookings are valid', 'green');
        } else {
            log('⚠ VALIDATION WARNING - Some bookings have issues', 'yellow');
        }
        console.log(`${'='.repeat(60)  }\n`);

        process.exit(results.invalidBookings === 0 && results.emptyBookings === 0 ? 0 : 1);

    } catch (error) {
        log(`\n✗ Validation failed: ${error.message}`, 'red');
        console.error(error.stack);
        process.exit(1);
    }
}

// Run validation
if (import.meta.url === `file://${process.argv[1]}`) {
    validateMigration();
}

export { validateMigration };
