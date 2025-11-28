#!/usr/bin/env node

/**
 * Staging Migration Execution Script
 * 
 * This script orchestrates the complete staging migration process:
 * 1. Execute migration in dry-run mode
 * 2. Review and validate dry-run results
 * 3. Run actual migration
 * 4. Verify all bookings have valid seatTickets
 * 5. Test API responses with migrated data
 * 6. Validate analytics queries
 * 7. Test booking creation and retrieval end-to-end
 * 
 * Usage:
 *   node backend/src/scripts/runStagingMigration.js
 */

import { migrate, stats } from './migrateBookingData.js';
import { Booking } from '../models/index.js';
import sequelize from '../config/database.js';
import { validateSeatTicketStructure } from '../utils/seatIdHelper.js';
import { Op } from 'sequelize';

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log(`\n${  '='.repeat(60)}`);
    log(title, 'bright');
    console.log(`${'='.repeat(60)  }\n`);
}

function logSuccess(message) {
    log(`✓ ${message}`, 'green');
}

function logWarning(message) {
    log(`⚠ ${message}`, 'yellow');
}

function logError(message) {
    log(`✗ ${message}`, 'red');
}

function logInfo(message) {
    log(`ℹ ${message}`, 'cyan');
}

/**
 * Step 1: Execute dry-run migration
 */
async function executeDryRun() {
    logSection('STEP 1: DRY-RUN MIGRATION');

    logInfo('Executing migration in dry-run mode...');
    logInfo('This will preview changes without committing to the database.');

    // Set dry-run flag
    process.argv.push('--dry-run');

    try {
        await migrate();

        logSuccess('Dry-run completed successfully');

        // Review results
        console.log('\nDry-run Results:');
        console.log(`  Total bookings to migrate: ${stats.total}`);
        console.log(`  Would be successful: ${stats.successful}`);
        console.log(`  Would be skipped: ${stats.skipped}`);
        console.log(`  Would fail: ${stats.failed}`);

        if (stats.errors.length > 0) {
            logWarning(`Found ${stats.errors.length} error(s) during dry-run`);
            console.log('\nErrors:');
            stats.errors.forEach((error, index) => {
                console.log(`  ${index + 1}. Booking ${error.bookingId || 'N/A'}: ${error.message}`);
            });
        }

        // Remove dry-run flag for actual migration
        const dryRunIndex = process.argv.indexOf('--dry-run');
        if (dryRunIndex > -1) {
            process.argv.splice(dryRunIndex, 1);
        }

        return {
            success: true,
            stats: { ...stats }
        };
    } catch (error) {
        logError(`Dry-run failed: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Step 2: Review dry-run results and check for issues
 */
async function reviewDryRunResults(dryRunStats) {
    logSection('STEP 2: REVIEW DRY-RUN RESULTS');

    const issues = [];

    // Check for failures
    if (dryRunStats.failed > 0) {
        issues.push(`${dryRunStats.failed} booking(s) would fail migration`);
    }

    // Check for errors
    if (dryRunStats.errors && dryRunStats.errors.length > 0) {
        issues.push(`${dryRunStats.errors.length} error(s) encountered`);
    }

    if (issues.length > 0) {
        logWarning('Issues found in dry-run:');
        issues.forEach(issue => console.log(`  - ${issue}`));

        // For staging, we'll continue but log warnings
        logInfo('Continuing with migration (staging environment)');
        return { hasIssues: true, issues };
    } else {
        logSuccess('No issues found in dry-run');
        return { hasIssues: false, issues: [] };
    }
}

/**
 * Step 3: Run actual migration
 */
async function runActualMigration() {
    logSection('STEP 3: ACTUAL MIGRATION');

    logInfo('Starting actual migration...');
    logInfo('This will modify the database.');

    // Reset stats
    stats.total = 0;
    stats.successful = 0;
    stats.skipped = 0;
    stats.failed = 0;
    stats.errors = [];

    try {
        await migrate();

        logSuccess('Migration completed successfully');

        console.log('\nMigration Results:');
        console.log(`  Total bookings: ${stats.total}`);
        console.log(`  Successful: ${stats.successful}`);
        console.log(`  Skipped: ${stats.skipped}`);
        console.log(`  Failed: ${stats.failed}`);

        return {
            success: true,
            stats: { ...stats }
        };
    } catch (error) {
        logError(`Migration failed: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Step 4: Verify all bookings have valid seatTickets
 */
async function verifyBookings() {
    logSection('STEP 4: VERIFY BOOKING DATA');

    logInfo('Checking all bookings for valid seatTickets...');

    try {
        // Get all bookings
        const allBookings = await Booking.findAll({
            attributes: ['id', 'bookingReference', 'seatTickets', 'seats', 'totalAmount']
        });

        logInfo(`Found ${allBookings.length} total bookings`);

        let validCount = 0;
        let invalidCount = 0;
        let emptyCount = 0;
        const invalidBookings = [];

        for (const booking of allBookings) {
            // Check if seatTickets exists and is not empty
            if (!booking.seatTickets || booking.seatTickets.length === 0) {
                // Check if this booking should have been migrated
                if (booking.seats && booking.seats.length > 0) {
                    emptyCount++;
                    invalidBookings.push({
                        id: booking.id,
                        reference: booking.bookingReference,
                        issue: 'Empty seatTickets but has seats data'
                    });
                }
                continue;
            }

            // Validate structure
            if (validateSeatTicketStructure(booking.seatTickets)) {
                validCount++;
            } else {
                invalidCount++;
                invalidBookings.push({
                    id: booking.id,
                    reference: booking.bookingReference,
                    issue: 'Invalid seatTickets structure'
                });
            }
        }

        console.log('\nValidation Results:');
        console.log(`  Valid bookings: ${validCount}`);
        console.log(`  Invalid bookings: ${invalidCount}`);
        console.log(`  Empty seatTickets: ${emptyCount}`);

        if (invalidCount > 0 || emptyCount > 0) {
            logWarning(`Found ${invalidCount + emptyCount} booking(s) with issues`);
            console.log('\nBookings with issues:');
            invalidBookings.slice(0, 10).forEach(booking => {
                console.log(`  - ${booking.reference} (ID: ${booking.id}): ${booking.issue}`);
            });
            if (invalidBookings.length > 10) {
                console.log(`  ... and ${invalidBookings.length - 10} more`);
            }
        } else {
            logSuccess('All bookings have valid seatTickets');
        }

        return {
            success: invalidCount === 0 && emptyCount === 0,
            validCount,
            invalidCount,
            emptyCount,
            invalidBookings
        };
    } catch (error) {
        logError(`Verification failed: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Step 5: Test API responses with migrated data
 */
async function testAPIResponses() {
    logSection('STEP 5: TEST API RESPONSES');

    logInfo('Testing API response structure...');

    try {
        // Get a sample booking
        const sampleBooking = await Booking.findOne({
            where: {
                seatTickets: {
                    [Op.ne]: null
                }
            },
            include: ['user', 'performance']
        });

        if (!sampleBooking) {
            logWarning('No bookings found with seatTickets to test');
            return { success: true, skipped: true };
        }

        logInfo(`Testing with booking: ${sampleBooking.bookingReference}`);

        // Check response structure
        const checks = [];

        // Check 1: seatTickets field exists
        if (sampleBooking.seatTickets) {
            checks.push({ name: 'seatTickets field exists', passed: true });
        } else {
            checks.push({ name: 'seatTickets field exists', passed: false });
        }

        // Check 2: seatTickets is an array
        if (Array.isArray(sampleBooking.seatTickets)) {
            checks.push({ name: 'seatTickets is an array', passed: true });
        } else {
            checks.push({ name: 'seatTickets is an array', passed: false });
        }

        // Check 3: Each seatTicket has required fields
        if (sampleBooking.seatTickets.length > 0) {
            const firstSeat = sampleBooking.seatTickets[0];
            const requiredFields = ['seatId', 'seatLabel', 'ticketTypeId', 'ticketTypeName', 'price'];
            const hasAllFields = requiredFields.every(field => firstSeat[field] !== undefined);
            checks.push({ name: 'Required fields present', passed: hasAllFields });
        }

        // Check 4: Total amount matches sum of prices
        const totalFromSeats = sampleBooking.seatTickets.reduce((sum, st) => sum + st.price, 0);
        const totalMatches = Math.abs(totalFromSeats - sampleBooking.totalAmount) < 0.01;
        checks.push({ name: 'Total amount matches', passed: totalMatches });

        console.log('\nAPI Response Checks:');
        checks.forEach(check => {
            if (check.passed) {
                logSuccess(check.name);
            } else {
                logError(check.name);
            }
        });

        const allPassed = checks.every(check => check.passed);

        if (allPassed) {
            logSuccess('All API response checks passed');
        } else {
            logError('Some API response checks failed');
        }

        return {
            success: allPassed,
            checks
        };
    } catch (error) {
        logError(`API response test failed: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Step 6: Validate analytics queries
 */
async function validateAnalyticsQueries() {
    logSection('STEP 6: VALIDATE ANALYTICS QUERIES');

    logInfo('Testing analytics queries on migrated data...');

    try {
        const queries = [];

        // Query 1: Get bookings by ticket type
        try {
            const adultBookings = await Booking.findAll({
                where: sequelize.literal(
                    `"seatTickets" @> '[{"ticketTypeId": "adult"}]'`
                )
            });
            queries.push({
                name: 'Filter by ticket type (adult)',
                passed: true,
                count: adultBookings.length
            });
        } catch (error) {
            queries.push({
                name: 'Filter by ticket type (adult)',
                passed: false,
                error: error.message
            });
        }

        // Query 2: Get ticket type distribution
        try {
            const result = await sequelize.query(`
                SELECT 
                    jsonb_array_elements("seatTickets")->>'ticketTypeId' as ticket_type_id,
                    jsonb_array_elements("seatTickets")->>'ticketTypeName' as ticket_type_name,
                    COUNT(*) as count
                FROM bookings
                WHERE jsonb_array_length("seatTickets") > 0
                GROUP BY ticket_type_id, ticket_type_name
                ORDER BY count DESC
            `, { type: sequelize.QueryTypes.SELECT });

            queries.push({
                name: 'Ticket type distribution',
                passed: true,
                result: result
            });
        } catch (error) {
            queries.push({
                name: 'Ticket type distribution',
                passed: false,
                error: error.message
            });
        }

        // Query 3: Revenue breakdown by ticket type
        try {
            const result = await sequelize.query(`
                WITH seat_tickets_expanded AS (
                    SELECT 
                        jsonb_array_elements("seatTickets")->>'ticketTypeId' as ticket_type_id,
                        jsonb_array_elements("seatTickets")->>'ticketTypeName' as ticket_type_name,
                        (jsonb_array_elements("seatTickets")->>'price')::numeric as price
                    FROM bookings
                    WHERE jsonb_array_length("seatTickets") > 0
                )
                SELECT 
                    ticket_type_id,
                    ticket_type_name,
                    SUM(price) as total_revenue,
                    COUNT(*) as ticket_count
                FROM seat_tickets_expanded
                GROUP BY ticket_type_id, ticket_type_name
                ORDER BY total_revenue DESC
            `, { type: sequelize.QueryTypes.SELECT });

            queries.push({
                name: 'Revenue breakdown by ticket type',
                passed: true,
                result: result
            });
        } catch (error) {
            queries.push({
                name: 'Revenue breakdown by ticket type',
                passed: false,
                error: error.message
            });
        }

        console.log('\nAnalytics Query Results:');
        queries.forEach(query => {
            if (query.passed) {
                logSuccess(query.name);
                if (query.count !== undefined) {
                    console.log(`  Found ${query.count} booking(s)`);
                }
                if (query.result && Array.isArray(query.result)) {
                    console.log(`  Results: ${query.result.length} row(s)`);
                    if (query.result.length > 0 && query.result.length <= 5) {
                        query.result.forEach(row => {
                            console.log(`    - ${JSON.stringify(row)}`);
                        });
                    }
                }
            } else {
                logError(`${query.name}: ${query.error}`);
            }
        });

        const allPassed = queries.every(query => query.passed);

        if (allPassed) {
            logSuccess('All analytics queries work correctly');
        } else {
            logError('Some analytics queries failed');
        }

        return {
            success: allPassed,
            queries
        };
    } catch (error) {
        logError(`Analytics validation failed: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Step 7: Test booking creation and retrieval end-to-end
 */
async function testEndToEnd() {
    logSection('STEP 7: END-TO-END TESTING');

    logInfo('Testing booking creation and retrieval...');

    try {
        // Get a real user and performance for testing
        const { User, Performance } = await import('../models/index.js');
        const testUser = await User.findOne();
        const testPerformance = await Performance.findOne();

        if (!testUser || !testPerformance) {
            logWarning('No user or performance found for end-to-end test');
            return { success: true, skipped: true };
        }

        // Create a test booking with new structure
        const testBookingData = {
            userId: testUser.id,
            performanceId: testPerformance.id,
            bookingReference: `TEST-${Date.now()}`,
            seatTickets: [
                {
                    seatId: 'orchestra-A-1',
                    seatLabel: 'A1',
                    ticketTypeId: 'adult',
                    ticketTypeName: 'Adult',
                    price: 500,
                    basePrice: 500,
                    section: 'orchestra',
                    row: 'A'
                },
                {
                    seatId: 'orchestra-A-2',
                    seatLabel: 'A2',
                    ticketTypeId: 'student',
                    ticketTypeName: 'Student',
                    price: 350,
                    basePrice: 500,
                    section: 'orchestra',
                    row: 'A'
                }
            ],
            seatCount: 2,
            amount: 850, // Legacy field for backward compatibility
            totalAmount: 850,
            status: 'confirmed',
            paymentMethod: 'credit_card',
            customerName: 'Test User',
            customerEmail: 'test@example.com',
            customerPhone: '1234567890'
        };

        logInfo('Creating test booking...');
        const createdBooking = await Booking.create(testBookingData);
        logSuccess(`Created booking: ${createdBooking.bookingReference}`);

        // Retrieve the booking
        logInfo('Retrieving test booking...');
        const retrievedBooking = await Booking.findByPk(createdBooking.id);

        // Validate retrieved data
        const checks = [];

        checks.push({
            name: 'Booking retrieved successfully',
            passed: retrievedBooking !== null
        });

        checks.push({
            name: 'seatTickets preserved',
            passed: retrievedBooking.seatTickets && retrievedBooking.seatTickets.length === 2
        });

        checks.push({
            name: 'Seat data intact',
            passed: retrievedBooking.seatTickets[0].seatId === 'orchestra-A-1'
        });

        checks.push({
            name: 'Ticket type data intact',
            passed: retrievedBooking.seatTickets[0].ticketTypeId === 'adult'
        });

        checks.push({
            name: 'Price data intact',
            passed: retrievedBooking.seatTickets[0].price === 500
        });

        console.log('\nEnd-to-End Checks:');
        checks.forEach(check => {
            if (check.passed) {
                logSuccess(check.name);
            } else {
                logError(check.name);
            }
        });

        // Clean up test booking
        logInfo('Cleaning up test booking...');
        await retrievedBooking.destroy();
        logSuccess('Test booking deleted');

        const allPassed = checks.every(check => check.passed);

        if (allPassed) {
            logSuccess('End-to-end test passed');
        } else {
            logError('End-to-end test failed');
        }

        return {
            success: allPassed,
            checks
        };
    } catch (error) {
        logError(`End-to-end test failed: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Main execution function
 */
async function main() {
    log('\n╔════════════════════════════════════════════════════════════╗', 'bright');
    log('║         STAGING ENVIRONMENT MIGRATION EXECUTION           ║', 'bright');
    log('╚════════════════════════════════════════════════════════════╝', 'bright');

    const results = {
        dryRun: null,
        review: null,
        migration: null,
        verification: null,
        apiTest: null,
        analytics: null,
        endToEnd: null
    };

    try {
        // Step 1: Dry-run
        results.dryRun = await executeDryRun();
        if (!results.dryRun.success) {
            throw new Error('Dry-run failed');
        }

        // Step 2: Review
        results.review = await reviewDryRunResults(results.dryRun.stats);

        // Step 3: Actual migration
        results.migration = await runActualMigration();
        if (!results.migration.success) {
            throw new Error('Migration failed');
        }

        // Step 4: Verification
        results.verification = await verifyBookings();

        // Step 5: API testing
        results.apiTest = await testAPIResponses();

        // Step 6: Analytics validation
        results.analytics = await validateAnalyticsQueries();

        // Step 7: End-to-end testing
        results.endToEnd = await testEndToEnd();

        // Final summary
        logSection('FINAL SUMMARY');

        const allSteps = [
            { name: 'Dry-run', result: results.dryRun },
            { name: 'Review', result: results.review },
            { name: 'Migration', result: results.migration },
            { name: 'Verification', result: results.verification },
            { name: 'API Testing', result: results.apiTest },
            { name: 'Analytics', result: results.analytics },
            { name: 'End-to-End', result: results.endToEnd }
        ];

        console.log('\nStep Results:');
        allSteps.forEach(step => {
            const success = step.result && (step.result.success || !step.result.hasIssues);
            if (success) {
                logSuccess(step.name);
            } else if (step.result && step.result.hasIssues) {
                logWarning(`${step.name} (with warnings)`);
            } else {
                logError(step.name);
            }
        });

        const allSuccess = allSteps.every(step =>
            step.result && (step.result.success || !step.result.hasIssues)
        );

        console.log(`\n${  '='.repeat(60)}`);
        if (allSuccess) {
            log('✓ STAGING MIGRATION COMPLETED SUCCESSFULLY', 'green');
        } else {
            log('⚠ STAGING MIGRATION COMPLETED WITH WARNINGS', 'yellow');
        }
        console.log(`${'='.repeat(60)  }\n`);

        process.exit(allSuccess ? 0 : 1);

    } catch (error) {
        logSection('MIGRATION FAILED');
        logError(error.message);
        if (error.stack) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { main };
