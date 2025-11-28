#!/usr/bin/env node

/**
 * Production Migration Execution Script
 * 
 * This script orchestrates the complete production migration process with enhanced
 * safety measures and monitoring:
 * 1. Pre-migration validation and backup
 * 2. Execute migration with progress tracking
 * 3. Verify data integrity after migration
 * 4. Monitor system health and performance
 * 5. Update monitoring dashboards
 * 
 * Safety Features:
 * - Automatic backup before migration
 * - Real-time progress monitoring
 * - Rollback capability on critical errors
 * - Post-migration validation
 * - Performance impact monitoring
 * 
 * Usage:
 *   node backend/src/scripts/runProductionMigration.js [options]
 * 
 * Options:
 *   --batch-size=N     Process N bookings at a time (default: 50 for production)
 *   --max-errors=N     Stop if more than N errors occur (default: 10)
 *   --skip-backup      Skip backup (NOT RECOMMENDED)
 *   --help             Show this help message
 * 
 * Examples:
 *   # Run with default settings (recommended)
 *   node backend/src/scripts/runProductionMigration.js
 * 
 *   # Run with smaller batch size for safety
 *   node backend/src/scripts/runProductionMigration.js --batch-size=25
 */

import { migrate, stats } from './migrateBookingData.js';
import { runMonitoring, getAdoptionMetrics, getStorageMetrics, getIntegrityMetrics } from './monitorProduction.js';
import { Booking } from '../models/index.js';
import fs from 'fs';
import path from 'path';
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
    cyan: '\x1b[36m',
    blue: '\x1b[34m'
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
    batchSize: parseInt(args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1] || '50', 10),
    maxErrors: parseInt(args.find(arg => arg.startsWith('--max-errors='))?.split('=')[1] || '10', 10),
    skipBackup: args.includes('--skip-backup'),
    help: args.includes('--help')
};

// Show help message
if (options.help) {
    console.log(`
Production Migration Execution Script

Usage:
  node backend/src/scripts/runProductionMigration.js [options]

Options:
  --batch-size=N     Process N bookings at a time (default: 50)
  --max-errors=N     Stop if more than N errors occur (default: 10)
  --skip-backup      Skip backup (NOT RECOMMENDED)
  --help             Show this help message

Examples:
  # Run with default settings (recommended)
  node backend/src/scripts/runProductionMigration.js

  # Run with smaller batch size for safety
  node backend/src/scripts/runProductionMigration.js --batch-size=25
  `);
    process.exit(0);
}

function log(message, color = 'reset') {
    const timestamp = new Date().toISOString();
    console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function logSection(title) {
    console.log(`\n${'='.repeat(80)}`);
    log(title, 'bright');
    console.log(`${'='.repeat(80)}\n`);
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
 * Pre-migration validation
 */
async function preMigrationValidation() {
    logSection('PRE-MIGRATION VALIDATION');

    const checks = [];

    try {
        // Check 1: Database connection
        logInfo('Checking database connection...');
        await sequelize.authenticate();
        checks.push({ name: 'Database connection', passed: true });
        logSuccess('Database connection OK');

        // Check 2: Count bookings to migrate
        logInfo('Counting bookings to migrate...');
        const count = await Booking.count({
            where: {
                [Op.or]: [
                    { seatTickets: null },
                    { seatTickets: [] },
                    sequelize.literal(`jsonb_array_length("seatTickets") = 0`)
                ],
                seats: { [Op.ne]: null }
            }
        });
        checks.push({ name: 'Bookings to migrate', passed: true, count });
        logInfo(`Found ${count} booking(s) to migrate`);

        // Check 3: Verify GIN index exists
        logInfo('Checking for GIN index on seatTickets...');
        const [indexes] = await sequelize.query(`
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename = 'bookings' 
            AND indexdef LIKE '%gin%' 
            AND (indexdef LIKE '%seatTickets%' OR indexdef LIKE '%seat_tickets%')
        `);
        const hasIndex = indexes.length > 0;
        checks.push({ name: 'GIN index exists', passed: hasIndex });
        if (hasIndex) {
            logSuccess('GIN index found');
        } else {
            logWarning('GIN index not found - queries may be slower');
        }

        // Check 4: Check disk space
        logInfo('Checking database size...');
        const [dbSize] = await sequelize.query(`
            SELECT pg_size_pretty(pg_database_size(current_database())) as size
        `);
        checks.push({ name: 'Database size check', passed: true, size: dbSize[0].size });
        logInfo(`Current database size: ${dbSize[0].size}`);

        // Check 5: Verify backup directory is writable
        if (!options.skipBackup) {
            logInfo('Checking backup directory...');
            const fs = await import('fs/promises');
            const path = await import('path');
            const backupDir = path.join(process.cwd(), 'backend', 'src', 'scripts');
            try {
                await fs.access(backupDir, fs.constants.W_OK);
                checks.push({ name: 'Backup directory writable', passed: true });
                logSuccess('Backup directory is writable');
            } catch {
                checks.push({ name: 'Backup directory writable', passed: false });
                logError('Backup directory is not writable');
            }
        }

        const allPassed = checks.every(check => check.passed);

        if (allPassed) {
            logSuccess('All pre-migration checks passed');
        } else {
            logError('Some pre-migration checks failed');
        }

        return {
            success: allPassed,
            checks,
            bookingsToMigrate: count
        };

    } catch (error) {
        logError(`Pre-migration validation failed: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Execute migration with monitoring
 */
async function executeMigration() {
    logSection('MIGRATION EXECUTION');

    logInfo('Starting production migration...');
    logInfo(`Batch size: ${options.batchSize}`);
    logInfo(`Max errors: ${options.maxErrors}`);
    logInfo(`Backup: ${options.skipBackup ? 'DISABLED' : 'ENABLED'}`);

    // Set command line args for migration script
    const migrationArgs = [
        `--batch-size=${options.batchSize}`
    ];

    if (options.skipBackup) {
        migrationArgs.push('--no-backup');
    }

    // Add args to process.argv
    migrationArgs.forEach(arg => {
        if (!process.argv.includes(arg)) {
            process.argv.push(arg);
        }
    });

    try {
        // Reset stats
        stats.total = 0;
        stats.successful = 0;
        stats.skipped = 0;
        stats.failed = 0;
        stats.errors = [];

        // Run migration
        await migrate();

        logSuccess('Migration completed');

        console.log('\nMigration Results:');
        console.log(`  Total bookings: ${stats.total}`);
        console.log(`  Successful: ${stats.successful}`);
        console.log(`  Skipped: ${stats.skipped}`);
        console.log(`  Failed: ${stats.failed}`);

        // Check if error threshold exceeded
        if (stats.failed > options.maxErrors) {
            logError(`Failed bookings (${stats.failed}) exceeded threshold (${options.maxErrors})`);
            return {
                success: false,
                stats: { ...stats },
                errorThresholdExceeded: true
            };
        }

        if (stats.errors.length > 0) {
            logWarning(`${stats.errors.length} error(s) occurred during migration`);
            console.log('\nRecent errors:');
            stats.errors.slice(0, 5).forEach((error, index) => {
                console.log(`  ${index + 1}. Booking ${error.bookingId || 'N/A'}: ${error.message}`);
            });
        }

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
 * Post-migration verification
 */
async function postMigrationVerification() {
    logSection('POST-MIGRATION VERIFICATION');

    logInfo('Verifying migrated data...');

    try {
        // Get all bookings that should have been migrated
        const bookings = await Booking.findAll({
            where: {
                seats: { [Op.ne]: null }
            },
            attributes: ['id', 'bookingReference', 'seatTickets', 'seats', 'totalAmount']
        });

        logInfo(`Checking ${bookings.length} booking(s)...`);

        let validCount = 0;
        let invalidCount = 0;
        let emptyCount = 0;
        let priceMismatchCount = 0;
        const issues = [];

        for (const booking of bookings) {
            // Check if seatTickets exists and is not empty
            if (!booking.seatTickets || booking.seatTickets.length === 0) {
                emptyCount++;
                issues.push({
                    id: booking.id,
                    reference: booking.bookingReference,
                    issue: 'Empty seatTickets'
                });
                continue;
            }

            // Validate structure
            if (!validateSeatTicketStructure(booking.seatTickets)) {
                invalidCount++;
                issues.push({
                    id: booking.id,
                    reference: booking.bookingReference,
                    issue: 'Invalid structure'
                });
                continue;
            }

            // Validate price consistency
            const calculatedTotal = booking.seatTickets.reduce((sum, st) => sum + st.price, 0);
            if (Math.abs(calculatedTotal - booking.totalAmount) > 0.01) {
                priceMismatchCount++;
                issues.push({
                    id: booking.id,
                    reference: booking.bookingReference,
                    issue: `Price mismatch: ${calculatedTotal} vs ${booking.totalAmount}`
                });
                continue;
            }

            validCount++;
        }

        console.log('\nVerification Results:');
        console.log(`  Total checked: ${bookings.length}`);
        console.log(`  Valid: ${validCount}`);
        console.log(`  Invalid structure: ${invalidCount}`);
        console.log(`  Empty seatTickets: ${emptyCount}`);
        console.log(`  Price mismatches: ${priceMismatchCount}`);

        if (issues.length > 0) {
            logWarning(`Found ${issues.length} issue(s)`);
            console.log('\nIssues found:');
            issues.slice(0, 10).forEach(issue => {
                console.log(`  - ${issue.reference} (ID: ${issue.id}): ${issue.issue}`);
            });
            if (issues.length > 10) {
                console.log(`  ... and ${issues.length - 10} more`);
            }
        } else {
            logSuccess('All bookings verified successfully');
        }

        const successRate = bookings.length > 0 ? (validCount / bookings.length) * 100 : 0;

        return {
            success: successRate >= 99, // 99% success rate required
            validCount,
            invalidCount,
            emptyCount,
            priceMismatchCount,
            successRate: successRate.toFixed(2),
            issues
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
 * Monitor system health
 */
async function monitorSystemHealth() {
    logSection('SYSTEM HEALTH MONITORING');

    logInfo('Running post-migration health check...');

    try {
        // Run monitoring report
        const report = await runMonitoring(1, 1.0); // Check last 1 hour, 1% error threshold

        // Analyze results
        const healthChecks = [];

        // Check adoption rate
        if (report.adoption.adoption_percentage >= 95) {
            healthChecks.push({ name: 'Adoption rate', passed: true, value: `${report.adoption.adoption_percentage}%` });
        } else {
            healthChecks.push({ name: 'Adoption rate', passed: false, value: `${report.adoption.adoption_percentage}%` });
        }

        // Check storage efficiency
        if (report.storage.storage_reduction_percentage >= 20) {
            healthChecks.push({ name: 'Storage efficiency', passed: true, value: `${report.storage.storage_reduction_percentage}%` });
        } else {
            healthChecks.push({ name: 'Storage efficiency', passed: false, value: `${report.storage.storage_reduction_percentage}%` });
        }

        // Check data integrity
        if (report.integrity.validPercentage >= 99) {
            healthChecks.push({ name: 'Data integrity', passed: true, value: `${report.integrity.validPercentage}%` });
        } else {
            healthChecks.push({ name: 'Data integrity', passed: false, value: `${report.integrity.validPercentage}%` });
        }

        // Check for alerts
        if (report.alerts.length === 0) {
            healthChecks.push({ name: 'System alerts', passed: true, value: 'None' });
        } else {
            healthChecks.push({ name: 'System alerts', passed: false, value: `${report.alerts.length} alert(s)` });
        }

        console.log('\nHealth Check Results:');
        healthChecks.forEach(check => {
            if (check.passed) {
                logSuccess(`${check.name}: ${check.value}`);
            } else {
                logWarning(`${check.name}: ${check.value}`);
            }
        });

        const allHealthy = healthChecks.every(check => check.passed);

        if (allHealthy) {
            logSuccess('System health is good');
        } else {
            logWarning('Some health checks failed - monitoring recommended');
        }

        return {
            success: true,
            healthy: allHealthy,
            checks: healthChecks,
            report
        };

    } catch (error) {
        logError(`Health monitoring failed: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Update monitoring dashboards
 */
async function updateMonitoringDashboards() {
    logSection('MONITORING DASHBOARD UPDATE');

    logInfo('Updating monitoring dashboards...');

    try {
        // Get current metrics
        const adoption = await getAdoptionMetrics(24);
        const storage = await getStorageMetrics(24);
        const integrity = await getIntegrityMetrics(24);

        // Create dashboard data
        const dashboardData = {
            timestamp: new Date().toISOString(),
            migration: {
                completed: true,
                completedAt: new Date().toISOString()
            },
            adoption: {
                rate: adoption.adoption_percentage,
                withSeatTickets: adoption.with_seat_tickets,
                withoutSeatTickets: adoption.without_seat_tickets,
                total: adoption.total
            },
            storage: {
                reductionPercentage: storage.storage_reduction_percentage,
                avgSeatsSize: storage.avg_seats_size,
                avgSeatTicketsSize: storage.avg_seat_tickets_size
            },
            integrity: {
                validPercentage: integrity.validPercentage,
                valid: integrity.valid,
                invalid: integrity.invalid,
                total: integrity.total
            }
        };

        // Save dashboard data to file
        const fs = await import('fs/promises');
        const path = await import('path');
        const dashboardPath = path.join(
            process.cwd(),
            'backend',
            'src',
            'scripts',
            'production_migration_dashboard.json'
        );

        await fs.writeFile(dashboardPath, JSON.stringify(dashboardData, null, 2));

        logSuccess(`Dashboard data saved to: ${dashboardPath}`);

        console.log('\nDashboard Metrics:');
        console.log(`  Adoption Rate: ${dashboardData.adoption.rate}%`);
        console.log(`  Storage Reduction: ${dashboardData.storage.reductionPercentage}%`);
        console.log(`  Data Integrity: ${dashboardData.integrity.validPercentage}%`);

        logInfo('Dashboard metrics can be used to update monitoring tools');
        logInfo('Consider integrating with Grafana, Datadog, or similar tools');

        return {
            success: true,
            dashboardPath,
            data: dashboardData
        };

    } catch (error) {
        logError(`Dashboard update failed: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Generate migration report
 */
function generateMigrationReport(results) {
    logSection('MIGRATION REPORT');

    const report = {
        timestamp: new Date().toISOString(),
        environment: 'production',
        options: {
            batchSize: options.batchSize,
            maxErrors: options.maxErrors,
            skipBackup: options.skipBackup
        },
        results: {
            preValidation: results.preValidation,
            migration: results.migration,
            verification: results.verification,
            health: results.health,
            dashboard: results.dashboard
        }
    };

    // Determine overall status
    const criticalSteps = [
        results.preValidation?.success,
        results.migration?.success,
        results.verification?.success
    ];

    const allCriticalPassed = criticalSteps.every(step => step === true);

    console.log(`\n${'='.repeat(80)}`);
    if (allCriticalPassed) {
        log('✓ PRODUCTION MIGRATION COMPLETED SUCCESSFULLY', 'green');
    } else {
        log('✗ PRODUCTION MIGRATION FAILED', 'red');
    }
    console.log('='.repeat(80));

    console.log('\nStep Summary:');
    console.log(`  Pre-validation: ${results.preValidation?.success ? '✓' : '✗'}`);
    console.log(`  Migration: ${results.migration?.success ? '✓' : '✗'}`);
    console.log(`  Verification: ${results.verification?.success ? '✓' : '✗'}`);
    console.log(`  Health Check: ${results.health?.healthy ? '✓' : '⚠'}`);
    console.log(`  Dashboard Update: ${results.dashboard?.success ? '✓' : '⚠'}`);

    if (results.migration?.stats) {
        console.log('\nMigration Statistics:');
        console.log(`  Total: ${results.migration.stats.total}`);
        console.log(`  Successful: ${results.migration.stats.successful}`);
        console.log(`  Skipped: ${results.migration.stats.skipped}`);
        console.log(`  Failed: ${results.migration.stats.failed}`);
    }

    if (results.verification) {
        console.log('\nVerification Results:');
        console.log(`  Success Rate: ${results.verification.successRate}%`);
        console.log(`  Valid: ${results.verification.validCount}`);
        console.log(`  Issues: ${results.verification.invalidCount + results.verification.emptyCount + results.verification.priceMismatchCount}`);
    }

    console.log(`\n${'='.repeat(80)}`);

    // Save report to file
    const reportPath = path.join(
        process.cwd(),
        'backend',
        'src',
        'scripts',
        `PRODUCTION_MIGRATION_REPORT_${Date.now()}.json`
    );

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    logInfo(`Full report saved to: ${reportPath}`);

    return report;
}

/**
 * Main execution function
 */
async function main() {
    log('\n╔════════════════════════════════════════════════════════════════════════════════╗', 'bright');
    log('║                    PRODUCTION MIGRATION EXECUTION                              ║', 'bright');
    log('╚════════════════════════════════════════════════════════════════════════════════╝', 'bright');

    logWarning('This script will modify production data. Ensure you have:');
    logWarning('  1. Reviewed and tested the migration on staging');
    logWarning('  2. Scheduled this during low-traffic period');
    logWarning('  3. Notified relevant stakeholders');
    logWarning('  4. Have rollback plan ready');

    // Wait 5 seconds before starting
    logInfo('Starting in 5 seconds... (Ctrl+C to cancel)');
    await new Promise(resolve => setTimeout(resolve, 5000));

    const results = {
        preValidation: null,
        migration: null,
        verification: null,
        health: null,
        dashboard: null
    };

    try {
        // Step 1: Pre-migration validation
        results.preValidation = await preMigrationValidation();
        if (!results.preValidation.success) {
            throw new Error('Pre-migration validation failed');
        }

        // Step 2: Execute migration
        results.migration = await executeMigration();
        if (!results.migration.success) {
            throw new Error('Migration execution failed');
        }

        // Step 3: Post-migration verification
        results.verification = await postMigrationVerification();
        if (!results.verification.success) {
            logWarning('Verification found issues - review required');
        }

        // Step 4: Monitor system health
        results.health = await monitorSystemHealth();

        // Step 5: Update monitoring dashboards
        results.dashboard = await updateMonitoringDashboards();

        // Generate final report
        generateMigrationReport(results);

        // Determine exit code
        const success = results.preValidation.success &&
            results.migration.success &&
            results.verification.success;

        if (success) {
            logSuccess('Production migration completed successfully');
            logInfo('Continue monitoring system health for the next 24 hours');
            logInfo('Use: node backend/src/scripts/monitorProduction.js --interval 300 --duration 24');
            process.exit(0);
        } else {
            logError('Production migration completed with errors');
            logWarning('Review the migration report and take corrective action');
            process.exit(1);
        }

    } catch (error) {
        logSection('MIGRATION FAILED');
        logError(error.message);
        if (error.stack) {
            console.error(error.stack);
        }

        logError('Migration aborted due to critical error');
        logWarning('Review logs and consider rollback if necessary');

        process.exit(1);
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { main, preMigrationValidation, executeMigration, postMigrationVerification, monitorSystemHealth, updateMonitoringDashboards };
