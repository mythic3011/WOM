#!/usr/bin/env node

/**
 * Pre-Deployment Checklist Script
 * 
 * This script validates that all requirements are met before deploying
 * the booking data structure optimization to production.
 * 
 * Usage:
 *   node src/scripts/deploymentChecklist.js
 */

import { Booking } from '#models/index.js';
import sequelize from '#config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
};

const CHECK_MARK = '✓';
const CROSS_MARK = '✗';
const WARNING_MARK = '⚠';

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
let warningChecks = 0;

/**
 * Print a check result
 */
function printCheck(description, passed, isWarning = false) {
    totalChecks++;

    if (passed) {
        passedChecks++;
        console.log(`  ${colors.green}${CHECK_MARK}${colors.reset} ${description}`);
    } else if (isWarning) {
        warningChecks++;
        console.log(`  ${colors.yellow}${WARNING_MARK}${colors.reset} ${description}`);
    } else {
        failedChecks++;
        console.log(`  ${colors.red}${CROSS_MARK}${colors.reset} ${description}`);
    }
}

/**
 * Print section header
 */
function printSection(title) {
    console.log(`\n${colors.bright}${colors.cyan}${title}${colors.reset}`);
    console.log(`${colors.cyan}${'─'.repeat(60)}${colors.reset}`);
}

/**
 * Check if database migrations are applied
 */
async function checkMigrations() {
    printSection('1. Database Migrations');

    try {
        // Check if seatTickets column exists
        const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'bookings' AND column_name = 'seatTickets'
    `);

        printCheck('seatTickets column exists', columns.length > 0);

        if (columns.length > 0) {
            const column = columns[0];
            printCheck('seatTickets is JSONB type', column.data_type === 'jsonb');
            printCheck('seatTickets is NOT NULL', column.is_nullable === 'NO');
        }

        // Check if GIN index exists
        const [indexes] = await sequelize.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'bookings' AND (indexname LIKE '%seatTickets%' OR indexname LIKE '%seat_tickets%')
    `);

        printCheck('GIN index on seatTickets exists', indexes.length > 0);

        if (indexes.length > 0) {
            const index = indexes[0];
            printCheck('Index uses GIN method', index.indexdef.includes('USING gin'));
        }

        // Check if seats column still exists (for backward compatibility)
        const [seatsColumn] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'bookings' AND column_name = 'seats'
    `);

        printCheck('Legacy seats column exists (backward compatibility)', seatsColumn.length > 0);

    } catch (error) {
        printCheck(`Database migration check failed: ${error.message}`, false);
    }
}

/**
 * Check if model validation is in place
 */
async function checkModelValidation() {
    printSection('2. Model Validation');

    try {
        // Test creating a booking with invalid seatTickets
        let validationWorks = false;

        try {
            await Booking.build({
                bookingReference: 'TEST123',
                userId: '00000000-0000-0000-0000-000000000000',
                performanceId: 1,
                seatTickets: 'invalid', // Should fail - not an array
                seatCount: 1,
                amount: 100,
                totalAmount: 100,
                status: 'pending',
                paymentStatus: 'pending',
            }).validate();
        } catch (error) {
            validationWorks = error.message.includes('seatTickets must be an array');
        }

        printCheck('seatTickets array validation works', validationWorks);

        // Test required fields validation
        let requiredFieldsValidation = false;

        try {
            await Booking.build({
                bookingReference: 'TEST124',
                userId: '00000000-0000-0000-0000-000000000000',
                performanceId: 1,
                seatTickets: [{ seatId: 'test-A-1' }], // Missing required fields
                seatCount: 1,
                amount: 100,
                totalAmount: 100,
                status: 'pending',
                paymentStatus: 'pending',
            }).validate();
        } catch (error) {
            requiredFieldsValidation = error.message.includes('ticketTypeId') ||
                error.message.includes('price');
        }

        printCheck('Required fields validation works', requiredFieldsValidation);

        // Test duplicate seatId validation
        let duplicateValidation = false;

        try {
            await Booking.build({
                bookingReference: 'TEST125',
                userId: '00000000-0000-0000-0000-000000000000',
                performanceId: 1,
                seatTickets: [
                    { seatId: 'test-A-1', seatLabel: 'A1', ticketTypeId: 'adult', ticketTypeName: 'Adult', price: 100 },
                    { seatId: 'test-A-1', seatLabel: 'A1', ticketTypeId: 'student', ticketTypeName: 'Student', price: 80 },
                ],
                seatCount: 2,
                amount: 180,
                totalAmount: 180,
                status: 'pending',
                paymentStatus: 'pending',
            }).validate();
        } catch (error) {
            duplicateValidation = error.message.includes('duplicate seatId');
        }

        printCheck('Duplicate seatId validation works', duplicateValidation);

    } catch (error) {
        printCheck(`Model validation check failed: ${error.message}`, false);
    }
}

/**
 * Check if helper functions exist
 */
async function checkHelperFunctions() {
    printSection('3. Helper Functions');

    try {
        const helperPath = path.join(__dirname, '..', 'utils', 'seatIdHelper.js');
        const helperExists = fs.existsSync(helperPath);

        printCheck('seatIdHelper.js exists', helperExists);

        if (helperExists) {
            const {
                parseSeatId,
                extractSection,
                extractRow,
                getDisplayLabel,
                validateSeatTicketStructure,
                transformToSeatTickets
            } = await import('#utils/seatIdHelper.js');

            printCheck('parseSeatId function exists', typeof parseSeatId === 'function');
            printCheck('extractSection function exists', typeof extractSection === 'function');
            printCheck('extractRow function exists', typeof extractRow === 'function');
            printCheck('getDisplayLabel function exists', typeof getDisplayLabel === 'function');
            printCheck('validateSeatTicketStructure function exists', typeof validateSeatTicketStructure === 'function');
            printCheck('transformToSeatTickets function exists', typeof transformToSeatTickets === 'function');

            // Test helper functions
            const testSeatId = 'orchestra-A-12';
            const parsed = parseSeatId(testSeatId);
            printCheck('parseSeatId works correctly',
                parsed && parsed.section === 'orchestra' && parsed.row === 'A' && parsed.number === 12);

            const section = extractSection(testSeatId);
            printCheck('extractSection works correctly', section === 'orchestra');

            const row = extractRow(testSeatId);
            printCheck('extractRow works correctly', row === 'A');
        }

    } catch (error) {
        printCheck(`Helper functions check failed: ${error.message}`, false);
    }
}

/**
 * Check if booking service has dual-write support
 */
async function checkBookingService() {
    printSection('4. Booking Service');

    try {
        const servicePath = path.join(__dirname, '..', 'services', 'bookingService.js');
        const serviceExists = fs.existsSync(servicePath);

        printCheck('bookingService.js exists', serviceExists);

        if (serviceExists) {
            const serviceContent = fs.readFileSync(servicePath, 'utf-8');

            // Check for dual-write support
            printCheck('Service handles seatTickets parameter', serviceContent.includes('seatTickets'));
            printCheck('Service handles legacy seats parameter', serviceContent.includes('seats'));
            printCheck('Service has transformation logic', serviceContent.includes('transformToSeatTickets'));
            printCheck('Service validates seatTickets structure', serviceContent.includes('validateSeatTicketStructure'));
            printCheck('Service calculates total from seatTickets', serviceContent.includes('reduce'));

            // Check for new query functions
            printCheck('getBookingsByTicketType function exists', serviceContent.includes('getBookingsByTicketType'));
            printCheck('getTicketTypeDistribution function exists', serviceContent.includes('getTicketTypeDistribution'));

            // Check for JSONB queries
            printCheck('Service uses JSONB containment operator', serviceContent.includes('@>'));
        }

    } catch (error) {
        printCheck(`Booking service check failed: ${error.message}`, false);
    }
}

/**
 * Check if tests are passing
 */
async function checkTests() {
    printSection('5. Test Coverage');

    try {
        const testDir = path.join(__dirname, '..', '__tests__');
        const testFiles = [
            'bookingModel.test.js',
            'bookingService.property.test.js',
            'seatIdHelper.test.js',
            'seatIdHelper.property.test.js',
            'bookingRetrieval.test.js',
            'ticketTypeQuery.test.js',
            'migrationScript.test.js',
            'migrationCompleteness.property.test.js',
        ];

        for (const testFile of testFiles) {
            const testPath = path.join(testDir, testFile);
            const exists = fs.existsSync(testPath);
            printCheck(`${testFile} exists`, exists);
        }

        // Note: We don't run tests here, just check they exist
        console.log(`\n  ${colors.yellow}Note: Run 'npm test' to verify all tests pass${colors.reset}`);

    } catch (error) {
        printCheck(`Test coverage check failed: ${error.message}`, false);
    }
}

/**
 * Check if migration script is ready
 */
async function checkMigrationScript() {
    printSection('6. Migration Script');

    try {
        const migrationPath = path.join(__dirname, 'migrateBookingData.js');
        const migrationExists = fs.existsSync(migrationPath);

        printCheck('migrateBookingData.js exists', migrationExists);

        if (migrationExists) {
            const migrationContent = fs.readFileSync(migrationPath, 'utf-8');

            printCheck('Migration has dry-run mode', migrationContent.includes('--dry-run'));
            printCheck('Migration has batch processing', migrationContent.includes('batch'));
            printCheck('Migration has error handling', migrationContent.includes('try') && migrationContent.includes('catch'));
            printCheck('Migration has progress tracking', migrationContent.includes('progress') || migrationContent.includes('processed'));
            printCheck('Migration uses transformToSeatTickets', migrationContent.includes('transformToSeatTickets'));
        }

        // Check if migration guide exists
        const guideExists = fs.existsSync(path.join(__dirname, 'MIGRATION_GUIDE.md'));
        printCheck('MIGRATION_GUIDE.md exists', guideExists);

    } catch (error) {
        printCheck(`Migration script check failed: ${error.message}`, false);
    }
}

/**
 * Check if documentation is updated
 */
async function checkDocumentation() {
    printSection('7. Documentation');

    try {
        const docsDir = path.join(__dirname, '..', '..', 'docs');

        const apiMigrationGuide = fs.existsSync(path.join(docsDir, 'API_MIGRATION_GUIDE.md'));
        printCheck('API_MIGRATION_GUIDE.md exists', apiMigrationGuide);

        const deploymentGuide = fs.existsSync(path.join(__dirname, '..', '..', 'PRODUCTION_DEPLOYMENT_GUIDE.md'));
        printCheck('PRODUCTION_DEPLOYMENT_GUIDE.md exists', deploymentGuide);

        // Check if OpenAPI spec is updated
        const openApiPath = path.join(__dirname, '..', 'config', 'openapi.js');
        if (fs.existsSync(openApiPath)) {
            const openApiContent = fs.readFileSync(openApiPath, 'utf-8');
            printCheck('OpenAPI spec mentions seatTickets', openApiContent.includes('seatTickets'));
            printCheck('OpenAPI spec marks seats as deprecated',
                openApiContent.includes('deprecated') && openApiContent.includes('seats'),
                true); // Warning if not found
        }

    } catch (error) {
        printCheck(`Documentation check failed: ${error.message}`, false);
    }
}

/**
 * Check current database state
 */
async function checkDatabaseState() {
    printSection('8. Current Database State');

    try {
        // Count total bookings
        const totalBookings = await Booking.count();
        console.log(`  Total bookings in database: ${totalBookings}`);

        // Count bookings with seatTickets
        const [withSeatTickets] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM bookings
      WHERE jsonb_array_length("seatTickets") > 0
    `);

        const seatTicketsCount = parseInt(withSeatTickets[0].count, 10);
        console.log(`  Bookings with seatTickets: ${seatTicketsCount}`);

        // Count bookings without seatTickets
        const withoutSeatTickets = totalBookings - seatTicketsCount;
        console.log(`  Bookings without seatTickets: ${withoutSeatTickets}`);

        if (withoutSeatTickets > 0) {
            console.log(`\n  ${colors.yellow}${WARNING_MARK} ${withoutSeatTickets} bookings need migration${colors.reset}`);
        } else {
            console.log(`\n  ${colors.green}${CHECK_MARK} All bookings have seatTickets${colors.reset}`);
        }

        // Check if any bookings have invalid structure
        const bookings = await Booking.findAll({
            attributes: ['id', 'seatTickets'],
            limit: 100,
        });

        let invalidCount = 0;
        for (const booking of bookings) {
            const data = booking.toJSON();
            if (data.seatTickets && Array.isArray(data.seatTickets) && data.seatTickets.length > 0) {
                const hasInvalid = data.seatTickets.some(st =>
                    !st.seatId || !st.ticketTypeId || typeof st.price !== 'number'
                );
                if (hasInvalid) { invalidCount++; }
            }
        }

        printCheck('No invalid seatTickets structures found (sample check)', invalidCount === 0);

    } catch (error) {
        printCheck(`Database state check failed: ${error.message}`, false);
    }
}

/**
 * Check monitoring setup
 */
async function checkMonitoring() {
    printSection('9. Monitoring Setup');

    try {
        const monitoringScript = fs.existsSync(path.join(__dirname, 'monitorProduction.js'));
        printCheck('monitorProduction.js exists', monitoringScript);

        // Check if pg_stat_statements is available
        try {
            await sequelize.query('SELECT * FROM pg_stat_statements LIMIT 1');
            printCheck('pg_stat_statements extension available', true);
        } catch {
            printCheck('pg_stat_statements extension available', false, true);
            console.log(`    ${colors.yellow}Consider enabling pg_stat_statements for query monitoring${colors.reset}`);
        }

    } catch (error) {
        printCheck(`Monitoring setup check failed: ${error.message}`, false);
    }
}

/**
 * Print summary
 */
function printSummary() {
    console.log(`\n${colors.bright}${colors.cyan}${'═'.repeat(60)}${colors.reset}`);
    console.log(`${colors.bright}Summary${colors.reset}`);
    console.log(`${colors.cyan}${'═'.repeat(60)}${colors.reset}`);

    console.log(`\n  Total Checks: ${totalChecks}`);
    console.log(`  ${colors.green}Passed: ${passedChecks}${colors.reset}`);
    console.log(`  ${colors.yellow}Warnings: ${warningChecks}${colors.reset}`);
    console.log(`  ${colors.red}Failed: ${failedChecks}${colors.reset}`);

    const successRate = ((passedChecks / totalChecks) * 100).toFixed(1);
    console.log(`\n  Success Rate: ${successRate}%`);

    if (failedChecks === 0 && warningChecks === 0) {
        console.log(`\n  ${colors.green}${colors.bright}✓ All checks passed! Ready for deployment.${colors.reset}`);
        return true;
    } else if (failedChecks === 0) {
        console.log(`\n  ${colors.yellow}${WARNING_MARK} All critical checks passed, but there are warnings.${colors.reset}`);
        console.log(`  ${colors.yellow}Review warnings before deployment.${colors.reset}`);
        return true;
    } else {
        console.log(`\n  ${colors.red}✗ Some checks failed. Fix issues before deployment.${colors.reset}`);
        return false;
    }
}

/**
 * Main execution
 */
async function main() {
    console.log(`${colors.bright}${colors.cyan}Pre-Deployment Checklist${colors.reset}`);
    console.log(`${colors.cyan}${'═'.repeat(60)}${colors.reset}\n`);

    try {
        await checkMigrations();
        await checkModelValidation();
        await checkHelperFunctions();
        await checkBookingService();
        await checkTests();
        await checkMigrationScript();
        await checkDocumentation();
        await checkDatabaseState();
        await checkMonitoring();

        const ready = printSummary();

        await sequelize.close();
        process.exit(ready ? 0 : 1);

    } catch (error) {
        console.error(`\n${colors.red}Fatal error:${colors.reset}`, error);
        await sequelize.close();
        process.exit(1);
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { main };
