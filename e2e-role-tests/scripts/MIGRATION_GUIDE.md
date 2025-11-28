# Booking Data Migration Guide

## Overview

This guide explains how to use the booking data migration script to transform existing booking records from the old verbose `seats` format to the new optimized `seatTickets` format.

## Migration Script

**Location:** `backend/src/scripts/migrateBookingData.js`

The migration script provides a safe, reliable way to migrate booking data with the following features:

- **Dry-run mode** - Preview changes without committing to database
- **Automatic backup** - Creates JSON backup of old data before migration
- **Batch processing** - Processes bookings in configurable batches
- **Error handling** - Gracefully handles malformed data and logs errors
- **Progress tracking** - Shows real-time progress during migration
- **Rollback capability** - Can restore from backup if needed

## Usage

### 1. Dry Run (Recommended First Step)

Preview what the migration will do without making any changes:

```bash
node backend/src/scripts/migrateBookingData.js --dry-run
```

This will:
- Show how many bookings need migration
- Display any errors or warnings
- NOT make any changes to the database

### 2. Full Migration with Backup

Migrate all bookings with automatic backup:

```bash
node backend/src/scripts/migrateBookingData.js
```

This will:
- Create a backup file in `backend/src/scripts/booking_backup_[timestamp].json`
- Transform all bookings from old to new format
- Log progress and any errors
- Provide a summary at the end

### 3. Migrate Specific Booking

Test migration on a single booking:

```bash
node backend/src/scripts/migrateBookingData.js --booking-id=123
```

### 4. Custom Batch Size

Process bookings in smaller or larger batches:

```bash
node backend/src/scripts/migrateBookingData.js --batch-size=50
```

### 5. Skip Backup (Not Recommended)

Migrate without creating a backup:

```bash
node backend/src/scripts/migrateBookingData.js --no-backup
```

⚠️ **Warning:** Only use this if you have already created a manual backup.

## Migration Process

### What Gets Migrated

The script transforms each booking's `seats` array into the new `seatTickets` format:

**Old Format (Verbose):**
```json
{
  "seats": [
    {
      "fullId": "orchestra-A-12",
      "seatId": "orchestra-A-12",
      "label": "A12",
      "section": "orchestra",
      "row": "A",
      "number": 12,
      "tier": "standard",
      "price": 500,
      "status": "selected",
      "x": 120,
      "y": 80,
      "ticketTypeId": "adult",
      "ticketTypeName": "Adult"
    }
  ]
}
```

**New Format (Compact):**
```json
{
  "seatTickets": [
    {
      "seatId": "orchestra-A-12",
      "seatLabel": "A12",
      "ticketTypeId": "adult",
      "ticketTypeName": "Adult",
      "price": 500,
      "basePrice": 500,
      "section": "orchestra",
      "row": "A"
    }
  ]
}
```

### Data Preservation

The migration preserves all essential information:
- ✅ Seat identifiers (seatId)
- ✅ Display labels (seatLabel)
- ✅ Ticket types (ticketTypeId, ticketTypeName)
- ✅ Pricing (price, basePrice)
- ✅ Location (section, row)

### Default Values

When data is missing, the script applies sensible defaults:
- **Missing ticket type:** Defaults to `'adult'` / `'Adult'`
- **Missing basePrice:** Uses the final price
- **Missing section/row:** Extracts from seat ID

### Error Handling

The script handles various error scenarios:

1. **Already Migrated:** Skips bookings that already have `seatTickets`
2. **No Seats Data:** Skips bookings with empty or null `seats` array
3. **Malformed Seat IDs:** Attempts to salvage valid seats, logs errors for invalid ones
4. **Validation Failures:** Logs detailed error information and continues with other bookings

## Migration Output

### Success Example

```
2025-11-20T00:00:00.000Z [INFO] Starting booking data migration...
2025-11-20T00:00:00.001Z [INFO] Mode: LIVE
2025-11-20T00:00:00.001Z [INFO] Batch size: 100
2025-11-20T00:00:00.001Z [INFO] Backup: ENABLED
2025-11-20T00:00:00.002Z [INFO] Found 250 booking(s) to migrate
2025-11-20T00:00:00.010Z [INFO] Creating backup of old data...
2025-11-20T00:00:00.050Z [INFO] Backup created: /path/to/booking_backup_1234567890.json
2025-11-20T00:00:00.051Z [INFO] Processing batch: 1 to 100 of 250
2025-11-20T00:00:01.000Z [INFO] Progress: 100/250 (40.0%)
2025-11-20T00:00:01.001Z [INFO] Processing batch: 101 to 200 of 250
2025-11-20T00:00:02.000Z [INFO] Progress: 200/250 (80.0%)
2025-11-20T00:00:02.001Z [INFO] Processing batch: 201 to 250 of 250
2025-11-20T00:00:03.000Z [INFO] Progress: 250/250 (100.0%)

=== Migration Summary ===
Total bookings: 250
Successful: 245
Skipped: 3
Failed: 2

Backup saved to: /path/to/booking_backup_1234567890.json
```

### Error Example

```
2025-11-20T00:00:00.000Z [ERROR] (Booking ID: 123) Failed to transform seats for booking 123
  Error: Seat at index 0 has malformed seat ID: invalid-format
2025-11-20T00:00:00.001Z [WARN]   Skipping malformed seat at index 0: {"fullId":"invalid-format","label":"A1","price":500}
2025-11-20T00:00:00.002Z [ERROR]   No salvageable seats found for booking 123 - skipping
```

## Rollback

If you need to rollback the migration, you can restore from the backup:

```javascript
import { rollback } from './backend/src/scripts/migrateBookingData.js';

await rollback('/path/to/booking_backup_1234567890.json');
```

## Testing

### Property-Based Tests

The migration has comprehensive property-based tests that verify:

- **Property 14: Migration completeness** - All old-format bookings are transformed
- **Property 16: Migration validation** - All migrated data passes validation rules

Run the tests:

```bash
cd backend
npm test -- migrationCompleteness.property.test.js
```

### Unit Tests

Unit tests verify specific migration scenarios:

```bash
cd backend
npm test -- migrationScript.test.js
```

## Best Practices

1. **Always run dry-run first** to preview changes
2. **Test on staging** before running on production
3. **Keep the backup file** until you've verified the migration
4. **Monitor logs** during migration for any errors
5. **Verify data** after migration by checking a sample of bookings
6. **Run during low-traffic** periods to minimize impact

## Verification

After migration, verify the results:

1. **Check migration summary** for any failed bookings
2. **Review error logs** for any issues
3. **Query a sample of bookings** to verify data integrity
4. **Test booking creation** to ensure new bookings work correctly
5. **Test booking retrieval** to ensure display works correctly

### SQL Verification Query

```sql
-- Check how many bookings have been migrated
SELECT 
  COUNT(*) as total_bookings,
  COUNT(CASE WHEN jsonb_array_length(seat_tickets) > 0 THEN 1 END) as migrated,
  COUNT(CASE WHEN jsonb_array_length(seat_tickets) = 0 THEN 1 END) as not_migrated
FROM bookings;

-- Check for any validation issues
SELECT id, booking_reference, seat_tickets
FROM bookings
WHERE jsonb_array_length(seat_tickets) > 0
  AND NOT (
    seat_tickets @> '[{"seatId": ""}]'::jsonb OR
    seat_tickets @> '[{"ticketTypeId": ""}]'::jsonb OR
    seat_tickets @> '[{"price": 0}]'::jsonb
  )
LIMIT 10;
```

## Troubleshooting

### Issue: "No bookings found that need migration"

**Cause:** All bookings already have `seatTickets` populated.

**Solution:** No action needed - migration is already complete.

### Issue: "Failed to transform seats for booking X"

**Cause:** Booking has malformed seat data.

**Solution:** 
1. Check the error log for details
2. Manually inspect the booking data
3. Fix the data or exclude the booking from migration

### Issue: "Backup failed - aborting migration"

**Cause:** Unable to write backup file (permissions, disk space, etc.)

**Solution:**
1. Check disk space
2. Verify write permissions on `backend/src/scripts/` directory
3. Try running with `--no-backup` if you have a manual backup

### Issue: Migration is slow

**Cause:** Large number of bookings or slow database connection.

**Solution:**
1. Reduce batch size: `--batch-size=50`
2. Run during off-peak hours
3. Check database performance

## Support

For issues or questions:
1. Check the error logs in the migration output
2. Review the property-based tests for expected behavior
3. Consult the design document at `.kiro/specs/booking-data-structure-optimization/design.md`
