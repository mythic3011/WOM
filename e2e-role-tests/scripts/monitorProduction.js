#!/usr/bin/env node

/**
 * Production Monitoring Script for Booking Data Structure Optimization
 * 
 * This script monitors the adoption and performance of the new seatTickets structure
 * in production. It provides real-time metrics on:
 * - Adoption rate of new structure
 * - Storage efficiency gains
 * - Data integrity validation
 * - Performance metrics
 * 
 * Usage:
 *   node src/scripts/monitorProduction.js [options]
 * 
 * Options:
 *   --interval <seconds>  Monitoring interval in seconds (default: 300 = 5 minutes)
 *   --duration <hours>    Total monitoring duration in hours (default: 24)
 *   --alert-threshold     Error threshold percentage for alerts (default: 1.0)
 *   --once                Run once and exit (no continuous monitoring)
 * 
 * Examples:
 *   # Monitor every 5 minutes for 24 hours
 *   node src/scripts/monitorProduction.js
 * 
 *   # Monitor every minute for 2 hours
 *   node src/scripts/monitorProduction.js --interval 60 --duration 2
 * 
 *   # Run once and exit
 *   node src/scripts/monitorProduction.js --once
 */

import { Booking } from '#models/index.js';
import sequelize from '#config/database.js';
import { Op } from 'sequelize';

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    blue: '\x1b[34m',
};

/**
 * Format a number with commas for readability
 */
function formatNumber(num) {
    return num.toLocaleString('en-US');
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes) {
    if (bytes === 0) { return '0 Bytes'; }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

/**
 * Print a section header
 */
function printHeader(title) {
    console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(80)}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}${title}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}${'='.repeat(80)}${colors.reset}\n`);
}

/**
 * Print a metric with color coding based on status
 */
function printMetric(label, value, status = 'neutral') {
    const statusColors = {
        good: colors.green,
        warning: colors.yellow,
        error: colors.red,
        neutral: colors.reset,
    };
    const color = statusColors[status] || colors.reset;
    console.log(`  ${label}: ${color}${value}${colors.reset}`);
}

/**
 * Get adoption metrics for seatTickets structure
 */
async function getAdoptionMetrics(hoursBack = 24) {
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    const [results] = await sequelize.query(`
    SELECT 
      COUNT(*) FILTER (WHERE jsonb_array_length("seatTickets") > 0) as with_seat_tickets,
      COUNT(*) FILTER (WHERE jsonb_array_length("seatTickets") = 0) as without_seat_tickets,
      COUNT(*) as total,
      ROUND(100.0 * COUNT(*) FILTER (WHERE jsonb_array_length("seatTickets") > 0) / NULLIF(COUNT(*), 0), 2) as adoption_percentage
    FROM bookings
    WHERE created_at > :since
  `, {
        replacements: { since },
        type: sequelize.QueryTypes.SELECT,
    });

    return results[0] || {
        with_seat_tickets: 0,
        without_seat_tickets: 0,
        total: 0,
        adoption_percentage: 0,
    };
}

/**
 * Get storage efficiency metrics
 */
async function getStorageMetrics(hoursBack = 24) {
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    const [results] = await sequelize.query(`
    SELECT 
      AVG(pg_column_size(seats)) as avg_seats_size,
      AVG(pg_column_size("seatTickets")) as avg_seat_tickets_size,
      ROUND(100.0 * (1 - AVG(pg_column_size("seatTickets"))::numeric / NULLIF(AVG(pg_column_size(seats)), 0)), 2) as storage_reduction_percentage,
      SUM(pg_column_size(seats)) as total_seats_size,
      SUM(pg_column_size("seatTickets")) as total_seat_tickets_size
    FROM bookings
    WHERE created_at > :since
      AND jsonb_array_length("seatTickets") > 0
      AND jsonb_array_length(seats) > 0
  `, {
        replacements: { since },
        type: sequelize.QueryTypes.SELECT,
    });

    return results[0] || {
        avg_seats_size: 0,
        avg_seat_tickets_size: 0,
        storage_reduction_percentage: 0,
        total_seats_size: 0,
        total_seat_tickets_size: 0,
    };
}

/**
 * Get data integrity metrics
 */
async function getIntegrityMetrics(hoursBack = 24) {
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    // Check for bookings with invalid seatTickets structure
    const bookings = await Booking.findAll({
        where: {
            createdAt: {
                [Op.gte]: since,
            },
        },
        attributes: ['id', 'bookingReference', 'seatTickets', 'seats', 'totalAmount'],
    });

    let validCount = 0;
    let invalidCount = 0;
    let missingFieldsCount = 0;
    let priceMismatchCount = 0;
    const errors = [];

    for (const booking of bookings) {
        const bookingData = booking.toJSON();
        let isValid = true;

        // Check if seatTickets exists and is an array
        if (!bookingData.seatTickets || !Array.isArray(bookingData.seatTickets)) {
            invalidCount++;
            errors.push({
                id: bookingData.id,
                reference: bookingData.bookingReference,
                error: 'seatTickets is not an array',
            });
            continue;
        }

        // Check if seatTickets is empty (should have data for new bookings)
        if (bookingData.seatTickets.length === 0) {
            invalidCount++;
            errors.push({
                id: bookingData.id,
                reference: bookingData.bookingReference,
                error: 'seatTickets array is empty',
            });
            continue;
        }

        // Validate each seatTicket
        for (const [index, seatTicket] of bookingData.seatTickets.entries()) {
            if (!seatTicket.seatId || !seatTicket.ticketTypeId || typeof seatTicket.price !== 'number') {
                isValid = false;
                missingFieldsCount++;
                errors.push({
                    id: bookingData.id,
                    reference: bookingData.bookingReference,
                    error: `seatTickets[${index}] missing required fields`,
                });
                break;
            }
        }

        // Check price consistency
        const calculatedTotal = bookingData.seatTickets.reduce((sum, st) => sum + st.price, 0);
        const totalAmount = parseFloat(bookingData.totalAmount);
        if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
            isValid = false;
            priceMismatchCount++;
            errors.push({
                id: bookingData.id,
                reference: bookingData.bookingReference,
                error: `Price mismatch: calculated ${calculatedTotal}, stored ${totalAmount}`,
            });
        }

        if (isValid) {
            validCount++;
        } else {
            invalidCount++;
        }
    }

    return {
        total: bookings.length,
        valid: validCount,
        invalid: invalidCount,
        missingFields: missingFieldsCount,
        priceMismatch: priceMismatchCount,
        validPercentage: bookings.length > 0 ? ((validCount / bookings.length) * 100).toFixed(2) : 0,
        errors: errors.slice(0, 10), // Return first 10 errors
    };
}

/**
 * Get performance metrics
 */
async function getPerformanceMetrics() {
    // Check if pg_stat_statements extension is available
    try {
        const [results] = await sequelize.query(`
      SELECT 
        query,
        calls,
        ROUND(mean_exec_time::numeric, 2) as mean_exec_time_ms,
        ROUND(max_exec_time::numeric, 2) as max_exec_time_ms,
        ROUND(total_exec_time::numeric, 2) as total_exec_time_ms
      FROM pg_stat_statements 
      WHERE query LIKE '%seatTickets%'
      ORDER BY mean_exec_time DESC 
      LIMIT 5
    `, {
            type: sequelize.QueryTypes.SELECT,
        });

        return results;
    } catch {
        // pg_stat_statements not available
        return null;
    }
}

/**
 * Get index usage statistics
 */
async function getIndexUsage() {
    try {
        const [results] = await sequelize.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan as scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched
      FROM pg_stat_user_indexes 
      WHERE indexname LIKE '%seatTickets%' OR indexname LIKE '%seat_tickets%'
    `, {
            type: sequelize.QueryTypes.SELECT,
        });

        return results;
    } catch {
        return null;
    }
}

/**
 * Get database size metrics
 */
async function getDatabaseMetrics() {
    try {
        const [results] = await sequelize.query(`
      SELECT 
        pg_size_pretty(pg_total_relation_size('bookings')) as total_size,
        pg_size_pretty(pg_relation_size('bookings')) as table_size,
        pg_size_pretty(pg_indexes_size('bookings')) as indexes_size,
        pg_total_relation_size('bookings') as total_size_bytes,
        pg_relation_size('bookings') as table_size_bytes,
        pg_indexes_size('bookings') as indexes_size_bytes
      FROM pg_class 
      WHERE relname = 'bookings'
      LIMIT 1
    `, {
            type: sequelize.QueryTypes.SELECT,
        });

        return results[0] || null;
    } catch {
        return null;
    }
}

/**
 * Main monitoring function
 */
async function runMonitoring(hoursBack = 24, alertThreshold = 1.0) {
    const timestamp = new Date().toISOString();

    printHeader(`Production Monitoring Report - ${timestamp}`);

    // 1. Adoption Metrics
    console.log(`${colors.bright}1. Adoption Metrics (Last ${hoursBack} hours)${colors.reset}`);
    const adoption = await getAdoptionMetrics(hoursBack);

    printMetric('Total Bookings', formatNumber(adoption.total));
    printMetric('With seatTickets', formatNumber(adoption.with_seat_tickets), 'good');
    printMetric('Without seatTickets', formatNumber(adoption.without_seat_tickets),
        adoption.without_seat_tickets > 0 ? 'warning' : 'good');
    printMetric('Adoption Rate', `${adoption.adoption_percentage}%`,
        adoption.adoption_percentage >= 95 ? 'good' : adoption.adoption_percentage >= 80 ? 'warning' : 'error');

    // 2. Storage Efficiency
    console.log(`\n${colors.bright}2. Storage Efficiency${colors.reset}`);
    const storage = await getStorageMetrics(hoursBack);

    if (storage.avg_seats_size > 0) {
        printMetric('Avg seats size', formatBytes(storage.avg_seats_size));
        printMetric('Avg seatTickets size', formatBytes(storage.avg_seat_tickets_size));
        printMetric('Storage Reduction', `${storage.storage_reduction_percentage}%`,
            storage.storage_reduction_percentage >= 40 ? 'good' : storage.storage_reduction_percentage >= 20 ? 'warning' : 'error');
        printMetric('Total Saved', formatBytes(storage.total_seats_size - storage.total_seat_tickets_size), 'good');
    } else {
        printMetric('Status', 'No dual-write bookings yet', 'neutral');
    }

    // 3. Data Integrity
    console.log(`\n${colors.bright}3. Data Integrity${colors.reset}`);
    const integrity = await getIntegrityMetrics(hoursBack);

    printMetric('Total Checked', formatNumber(integrity.total));
    printMetric('Valid', formatNumber(integrity.valid), 'good');
    printMetric('Invalid', formatNumber(integrity.invalid),
        integrity.invalid === 0 ? 'good' : integrity.invalid < integrity.total * 0.01 ? 'warning' : 'error');
    printMetric('Validation Rate', `${integrity.validPercentage}%`,
        integrity.validPercentage >= 99 ? 'good' : integrity.validPercentage >= 95 ? 'warning' : 'error');

    if (integrity.missingFields > 0) {
        printMetric('Missing Fields', formatNumber(integrity.missingFields), 'error');
    }
    if (integrity.priceMismatch > 0) {
        printMetric('Price Mismatches', formatNumber(integrity.priceMismatch), 'error');
    }

    if (integrity.errors.length > 0) {
        console.log(`\n  ${colors.red}Recent Errors:${colors.reset}`);
        integrity.errors.forEach(err => {
            console.log(`    - Booking ${err.reference} (ID: ${err.id}): ${err.error}`);
        });
    }

    // 4. Database Metrics
    console.log(`\n${colors.bright}4. Database Metrics${colors.reset}`);
    const dbMetrics = await getDatabaseMetrics();

    if (dbMetrics) {
        printMetric('Table Size', dbMetrics.table_size);
        printMetric('Indexes Size', dbMetrics.indexes_size);
        printMetric('Total Size', dbMetrics.total_size);
    } else {
        printMetric('Status', 'Unable to fetch database metrics', 'warning');
    }

    // 5. Index Usage
    console.log(`\n${colors.bright}5. Index Usage${colors.reset}`);
    const indexUsage = await getIndexUsage();

    if (indexUsage && indexUsage.length > 0) {
        indexUsage.forEach(idx => {
            printMetric(`${idx.indexname}`,
                `Scans: ${formatNumber(idx.scans)}, Tuples: ${formatNumber(idx.tuples_fetched)}`,
                idx.scans > 0 ? 'good' : 'warning');
        });
    } else {
        printMetric('Status', 'No index usage data available', 'neutral');
    }

    // 6. Query Performance
    console.log(`\n${colors.bright}6. Query Performance${colors.reset}`);
    const performance = await getPerformanceMetrics();

    if (performance && performance.length > 0) {
        console.log(`  ${colors.cyan}Top queries by execution time:${colors.reset}`);
        performance.forEach((query, index) => {
            console.log(`\n  ${index + 1}. Calls: ${query.calls}, Mean: ${query.mean_exec_time_ms}ms, Max: ${query.max_exec_time_ms}ms`);
            console.log(`     ${query.query.substring(0, 100)}...`);
        });
    } else {
        printMetric('Status', 'pg_stat_statements not available', 'neutral');
    }

    // 7. Alerts
    console.log(`\n${colors.bright}7. Alerts${colors.reset}`);
    const alerts = [];

    if (adoption.adoption_percentage < 95 && adoption.total > 10) {
        alerts.push({
            level: 'warning',
            message: `Adoption rate is ${adoption.adoption_percentage}% (target: 95%+)`,
        });
    }

    if (storage.storage_reduction_percentage < 40 && storage.avg_seats_size > 0) {
        alerts.push({
            level: 'warning',
            message: `Storage reduction is ${storage.storage_reduction_percentage}% (target: 40%+)`,
        });
    }

    if (integrity.validPercentage < 99) {
        alerts.push({
            level: 'error',
            message: `Data integrity is ${integrity.validPercentage}% (target: 99%+)`,
        });
    }

    if (integrity.invalid > integrity.total * alertThreshold / 100) {
        alerts.push({
            level: 'error',
            message: `Invalid bookings exceed threshold: ${integrity.invalid} (${alertThreshold}%)`,
        });
    }

    if (alerts.length === 0) {
        printMetric('Status', '✓ All systems operational', 'good');
    } else {
        alerts.forEach(alert => {
            const color = alert.level === 'error' ? colors.red : colors.yellow;
            console.log(`  ${color}${alert.level.toUpperCase()}: ${alert.message}${colors.reset}`);
        });
    }

    console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(80)}${colors.reset}\n`);

    return {
        timestamp,
        adoption,
        storage,
        integrity,
        alerts,
    };
}

/**
 * Parse command line arguments
 */
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        interval: 300, // 5 minutes default
        duration: 24, // 24 hours default
        alertThreshold: 1.0, // 1% error threshold
        once: false,
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--interval':
                options.interval = parseInt(args[++i], 10);
                break;
            case '--duration':
                options.duration = parseInt(args[++i], 10);
                break;
            case '--alert-threshold':
                options.alertThreshold = parseFloat(args[++i]);
                break;
            case '--once':
                options.once = true;
                break;
            case '--help':
                console.log(`
Production Monitoring Script

Usage: node src/scripts/monitorProduction.js [options]

Options:
  --interval <seconds>     Monitoring interval in seconds (default: 300)
  --duration <hours>       Total monitoring duration in hours (default: 24)
  --alert-threshold <pct>  Error threshold percentage for alerts (default: 1.0)
  --once                   Run once and exit
  --help                   Show this help message

Examples:
  # Monitor every 5 minutes for 24 hours
  node src/scripts/monitorProduction.js

  # Monitor every minute for 2 hours
  node src/scripts/monitorProduction.js --interval 60 --duration 2

  # Run once and exit
  node src/scripts/monitorProduction.js --once
        `);
                process.exit(0);
        }
    }

    return options;
}

/**
 * Main execution
 */
async function main() {
    const options = parseArgs();

    console.log(`${colors.bright}${colors.blue}Starting Production Monitoring${colors.reset}`);
    console.log(`Interval: ${options.interval}s, Duration: ${options.duration}h, Alert Threshold: ${options.alertThreshold}%\n`);

    if (options.once) {
        await runMonitoring(24, options.alertThreshold);
        await sequelize.close();
        process.exit(0);
    }

    const endTime = Date.now() + options.duration * 60 * 60 * 1000;
    let iteration = 0;

    while (Date.now() < endTime) {
        iteration++;
        console.log(`${colors.bright}Iteration ${iteration}${colors.reset}`);

        try {
            await runMonitoring(24, options.alertThreshold);
        } catch (error) {
            console.error(`${colors.red}Error during monitoring:${colors.reset}`, error.message);
        }

        if (Date.now() + options.interval * 1000 < endTime) {
            console.log(`${colors.cyan}Next check in ${options.interval} seconds...${colors.reset}\n`);
            await new Promise(resolve => setTimeout(resolve, options.interval * 1000));
        } else {
            break;
        }
    }

    console.log(`${colors.bright}${colors.green}Monitoring completed${colors.reset}`);
    await sequelize.close();
    process.exit(0);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error(`${colors.red}Fatal error:${colors.reset}`, error);
        process.exit(1);
    });
}

export { runMonitoring, getAdoptionMetrics, getStorageMetrics, getIntegrityMetrics };
