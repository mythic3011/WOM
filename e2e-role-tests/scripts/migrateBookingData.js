#!/usr/bin/env node

/**
 * Booking Data Migration Script
 * 
 * Migrates existing booking records from old seats format to new seatTickets format.
 * 
 * Features:
 * - Dry-run mode to preview changes without committing
 * - Backup capability to preserve old data
 * - Error handling with detailed logging
 * - Progress tracking
 * - Graceful handling of malformed data
 * 
 * Usage:
 *   node backend/src/scripts/migrateBookingData.js [options]
 * 
 * Options:
 *   --dry-run          Preview changes without committing to database
 *   --no-backup        Skip backup of old data (not recommended)
 *   --batch-size=N     Process N bookings at a time (default: 100)
 *   --booking-id=ID    Migrate only a specific booking by ID
 *   --help             Show this help message
 * 
 * Examples:
 *   # Dry run to preview changes
 *   node backend/src/scripts/migrateBookingData.js --dry-run
 * 
 *   # Migrate all bookings with backup
 *   node backend/src/scripts/migrateBookingData.js
 * 
 *   # Migrate specific booking
 *   node backend/src/scripts/migrateBookingData.js --booking-id=123
 * 
 *   # Migrate without backup (not recommended)
 *   node backend/src/scripts/migrateBookingData.js --no-backup
 */

import { Booking } from '../models/index.js';
import sequelize from '../config/database.js';
import { transformToSeatTickets, validateSeatTicketStructure } from '../utils/seatIdHelper.js';
import { Op } from 'sequelize';

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
    dryRun: args.includes('--dry-run'),
    noBackup: args.includes('--no-backup'),
    batchSize: parseInt(args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1] || '100', 10),
    bookingId: args.find(arg => arg.startsWith('--booking-id='))?.split('=')[1],
    help: args.includes('--help')
};

// Show help message
if (options.help) {
    console.log(`
Booking Data Migration Script

Migrates existing booking records from old seats format to new seatTickets format.

Usage:
  node backend/src/scripts/migrateBookingData.js [options]

Options:
  --dry-run          Preview changes without committing to database
  --no-backup        Skip backup of old data (not recommended)
  --batch-size=N     Process N bookings at a time (default: 100)
  --booking-id=ID    Migrate only a specific booking by ID
  --help             Show this help message

Examples:
  # Dry run to preview changes
  node backend/src/scripts/migrateBookingData.js --dry-run

  # Migrate all bookings with backup
  node backend/src/scripts/migrateBookingData.js

  # Migrate specific booking
  node backend/src/scripts/migrateBookingData.js --booking-id=123

  # Migrate without backup (not recommended)
  node backend/src/scripts/migrateBookingData.js --no-backup
  `);
    process.exit(0);
}

// Migration statistics
const stats = {
    total: 0,
    successful: 0,
    skipped: 0,
    failed: 0,
    errors: []
};

/**
 * Log message with timestamp
 */
function log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const prefix = options.dryRun ? '[DRY-RUN] ' : '';
    console.log(`${timestamp} [${level}] ${prefix}${message}`);
}

/**
 * Log error with details
 */
function logError(message, error, bookingId = null) {
    const timestamp = new Date().toISOString();
    const bookingInfo = bookingId ? ` (Booking ID: ${bookingId})` : '';
    console.error(`${timestamp} [ERROR]${bookingInfo} ${message}`);
    if (error) {
        console.error(`  Error: ${error.message}`);
        if (error.stack) {
            console.error(`  Stack: ${error.stack}`);
        }
    }

    stats.errors.push({
        timestamp,
        bookingId,
        message,
        error: error?.message,
        stack: error?.stack
    });
}

/**
 * Backup old data before migration
 */
async function backupOldData(bookings) {
    if (options.noBackup) {
        log('Skipping backup (--no-backup flag set)', 'WARN');
        return null;
    }

    log('Creating backup of old data...');

    const backup = bookings.map(booking => ({
        id: booking.id,
        bookingReference: booking.bookingReference,
        seats: booking.seats,
        seatTickets: booking.seatTickets,
        totalAmount: booking.totalAmount,
        seatCount: booking.seatCount
    }));

    const backupFilename = `booking_backup_${Date.now()}.json`;
    const fs = await import('fs/promises');
    const path = await import('path');
    const backupPath = path.join(process.cwd(), 'backend', 'src', 'scripts', backupFilename);

    try {
        await fs.writeFile(backupPath, JSON.stringify(backup, null, 2));
        log(`Backup created: ${backupPath}`);
        return backupPath;
    } catch (error) {
        logError('Failed to create backup', error);
        throw new Error('Backup failed - aborting migration');
    }
}

/**
 * Migrate a single booking
 */
async function migrateBooking(booking, transaction = null) {
    const bookingId = booking.id;

    try {
        // Check if already migrated
        if (booking.seatTickets && Array.isArray(booking.seatTickets) && booking.seatTickets.length > 0) {
            log(`Booking ${bookingId} already has seatTickets - skipping`, 'INFO');
            stats.skipped++;
            return { success: true, skipped: true };
        }

        // Check if seats data exists
        if (!booking.seats || !Array.isArray(booking.seats) || booking.seats.length === 0) {
            log(`Booking ${bookingId} has no seats data - skipping`, 'WARN');
            stats.skipped++;
            return { success: true, skipped: true };
        }

        // Transform seats to seatTickets
        let seatTickets;
        try {
            seatTickets = transformToSeatTickets(booking.seats, booking.totalAmount);
        } catch (error) {
            // Handle malformed seat IDs gracefully
            logError(`Failed to transform seats for booking ${bookingId}`, error, bookingId);

            // Try to salvage what we can
            const salvageableSeats = [];
            for (let i = 0; i < booking.seats.length; i++) {
                const seat = booking.seats[i];
                const seatId = seat.fullId || seat.seatId || seat.id;

                // Check if seat ID is valid format (section-row-number)
                if (seatId && typeof seatId === 'string' && seatId.split('-').length >= 3) {
                    salvageableSeats.push(seat);
                } else {
                    log(`  Skipping malformed seat at index ${i}: ${JSON.stringify(seat)}`, 'WARN');
                }
            }

            if (salvageableSeats.length === 0) {
                log(`  No salvageable seats found for booking ${bookingId} - skipping`, 'ERROR');
                stats.failed++;
                return { success: false, error: 'No salvageable seats' };
            }

            // Try again with salvageable seats
            try {
                seatTickets = transformToSeatTickets(salvageableSeats, booking.totalAmount);
                log(`  Salvaged ${salvageableSeats.length} of ${booking.seats.length} seats`, 'WARN');
            } catch (salvageError) {
                logError(`Failed to salvage seats for booking ${bookingId}`, salvageError, bookingId);
                stats.failed++;
                return { success: false, error: salvageError.message };
            }
        }

        // Validate transformed structure
        if (!validateSeatTicketStructure(seatTickets)) {
            logError(`Invalid seatTickets structure for booking ${bookingId}`, null, bookingId);
            stats.failed++;
            return { success: false, error: 'Invalid seatTickets structure' };
        }

        // Update booking
        if (!options.dryRun) {
            await booking.update(
                { seatTickets },
                { transaction }
            );
        }

        log(`Successfully migrated booking ${bookingId} (${seatTickets.length} seats)`);
        stats.successful++;

        return {
            success: true,
            bookingId,
            seatCount: seatTickets.length,
            seatTickets
        };

    } catch (error) {
        logError(`Unexpected error migrating booking ${bookingId}`, error, bookingId);
        stats.failed++;
        return { success: false, error: error.message };
    }
}

/**
 * Migrate bookings in batches
 */
async function migrateBatch(bookings) {
    const results = [];

    for (const booking of bookings) {
        const result = await migrateBooking(booking);
        results.push(result);
    }

    return results;
}

/**
 * Main migration function
 */
async function migrate() {
    log('Starting booking data migration...');
    log(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}`);
    log(`Batch size: ${options.batchSize}`);
    log(`Backup: ${options.noBackup ? 'DISABLED' : 'ENABLED'}`);

    try {
        // Build query
        const where = {};

        if (options.bookingId) {
            where.id = options.bookingId;
            log(`Migrating specific booking: ${options.bookingId}`);
        } else {
            // Find bookings that need migration
            // (have seats but no seatTickets, or empty seatTickets)
            where[Op.or] = [
                { seatTickets: null },
                { seatTickets: [] },
                sequelize.literal(`jsonb_array_length("seatTickets") = 0`)
            ];
            where.seats = { [Op.ne]: null };
        }

        // Count total bookings to migrate
        const totalCount = await Booking.count({ where });
        stats.total = totalCount;

        if (totalCount === 0) {
            log('No bookings found that need migration');
            return;
        }

        log(`Found ${totalCount} booking(s) to migrate`);

        // Fetch bookings in batches
        let offset = 0;
        let processedCount = 0;
        let backupPath = null;

        while (offset < totalCount) {
            const bookings = await Booking.findAll({
                where,
                limit: options.batchSize,
                offset,
                order: [['id', 'ASC']]
            });

            if (bookings.length === 0) {
                break;
            }

            // Create backup before first batch
            if (offset === 0 && !options.dryRun) {
                backupPath = await backupOldData(bookings);
            }

            log(`Processing batch: ${offset + 1} to ${offset + bookings.length} of ${totalCount}`);

            // Migrate batch
            await migrateBatch(bookings);

            processedCount += bookings.length;
            offset += options.batchSize;

            // Show progress
            const progress = ((processedCount / totalCount) * 100).toFixed(1);
            log(`Progress: ${processedCount}/${totalCount} (${progress}%)`);
        }

        // Print summary
        log('');
        log('=== Migration Summary ===');
        log(`Total bookings: ${stats.total}`);
        log(`Successful: ${stats.successful}`);
        log(`Skipped: ${stats.skipped}`);
        log(`Failed: ${stats.failed}`);

        if (stats.errors.length > 0) {
            log('');
            log('=== Errors ===');
            stats.errors.forEach((error, index) => {
                log(`${index + 1}. Booking ${error.bookingId || 'N/A'}: ${error.message}`);
            });
        }

        if (backupPath) {
            log('');
            log(`Backup saved to: ${backupPath}`);
        }

        if (options.dryRun) {
            log('');
            log('DRY RUN COMPLETE - No changes were made to the database');
            log('Run without --dry-run to perform actual migration');
        }

    } catch (error) {
        logError('Migration failed', error);
        throw error;
    }
}

/**
 * Rollback function (restore from backup)
 */
async function rollback(backupPath) {
    log(`Rolling back from backup: ${backupPath}`);

    try {
        const fs = await import('fs/promises');
        const backupData = JSON.parse(await fs.readFile(backupPath, 'utf8'));

        log(`Found ${backupData.length} bookings in backup`);

        for (const backup of backupData) {
            const booking = await Booking.findByPk(backup.id);
            if (booking) {
                await booking.update({
                    seats: backup.seats,
                    seatTickets: backup.seatTickets
                });
                log(`Restored booking ${backup.id}`);
            }
        }

        log('Rollback complete');
    } catch (error) {
        logError('Rollback failed', error);
        throw error;
    }
}

// Run migration
if (import.meta.url === `file://${process.argv[1]}`) {
    migrate()
        .then(() => {
            log('Migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            logError('Migration failed with fatal error', error);
            process.exit(1);
        });
}

// Export functions for testing
export {
    migrate,
    migrateBooking,
    migrateBatch,
    backupOldData,
    rollback,
    stats
};
