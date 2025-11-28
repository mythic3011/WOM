# Booking Data Migration Scripts

This directory contains scripts for migrating booking data from the old verbose `seats` format to the new optimized `seatTickets` format.

## Scripts Overview

### 1. migrateBookingData.js

**Purpose:** Core migration script that transforms booking data

**Features:**
- Dry-run mode for safe preview
- Automatic backup creation
- Batch processing
- Error handling and logging
- Rollback capability

**Usage:**
```bash
# Dry run (preview only)
node backend/src/scripts/migrateBookingData.js --dry-run

# Full migration with backup
node backend/src/scripts/migrateBookingData.js

# Migrate specific booking
node backend/src/scripts/migrateBookingData.js --booking-id=123

# Custom batch size
node backend/src/scripts/migrateBookingData.js --batch-size=50
```

### 2. runStagingMigration.js

**Purpose:** Comprehensive staging migration validation script

**Features:**
- Executes full migration workflow
- Validates all data integrity
- Tests API responses
- Validates analytics queries
- Tests end-to-end booking flow

**Usage:**
```bash
node backend/src/scripts/runStagingMigration.js
```

**Steps Performed:**
1. Dry-run migration
2. Review dry-run results
3. Execute actual migration
4. Verify all bookings
5. Test API responses
6. Validate analytics queries
7. Test end-to-end booking creation/retrieval

### 3. validateStagingMigration.js

**Purpose:** Quick validation check for staging environment

**Features:**
- Fast validation of all bookings
- Tests analytics queries
- Provides summary report

**Usage:**
```bash
node backend/src/scripts/validateStagingMigration.js
```

## Migration Workflow

### For Staging Environment

1. **Run comprehensive staging migration:**
   ```bash
   node backend/src/scripts/runStagingMigration.js
   ```

2. **Quick validation check:**
   ```bash
   node backend/src/scripts/validateStagingMigration.js
   ```

3. **Review reports:**
   - `STAGING_MIGRATION_REPORT.md` - Detailed report
   - `STAGING_MIGRATION_SUMMARY.md` - Quick summary

### For Production Environment

1. **Dry run first:**
   ```bash
   node backend/src/scripts/migrateBookingData.js --dry-run
   ```

2. **Review dry-run output carefully**

3. **Execute migration:**
   ```bash
   node backend/src/scripts/migrateBookingData.js
   ```

4. **Validate results:**
   ```bash
   node backend/src/scripts/validateStagingMigration.js
   ```

## Data Structure

### Old Format (Verbose)
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
      "y": 80
    }
  ]
}
```

### New Format (Compact)
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

## Validation Checks

The migration scripts perform the following validation checks:

1. **Structure Validation:**
   - seatTickets is an array
   - Each seat ticket has required fields
   - All prices are positive numbers
   - All IDs are valid strings

2. **Data Integrity:**
   - Total amount matches sum of seat prices
   - All seat IDs follow correct format
   - All ticket types are valid

3. **Functionality Testing:**
   - API responses return correct structure
   - Analytics queries work correctly
   - Booking creation/retrieval works end-to-end

## Error Handling

The scripts handle various error scenarios:

- **Already Migrated:** Skips bookings with existing seatTickets
- **No Seats Data:** Skips bookings with empty seats array
- **Malformed Seat IDs:** Attempts to salvage valid seats
- **Validation Failures:** Logs detailed errors and continues

## Backup and Rollback

### Automatic Backup

The migration script automatically creates a backup file:
```
backend/src/scripts/booking_backup_[timestamp].json
```

### Manual Rollback

To rollback from a backup:
```javascript
import { rollback } from './backend/src/scripts/migrateBookingData.js';
await rollback('/path/to/booking_backup_1234567890.json');
```

## Monitoring

### During Migration

Monitor the following:
- Migration progress logs
- Error messages
- Database performance
- Application logs

### After Migration

Validate the following:
- All bookings have valid seatTickets
- API responses are correct
- Analytics queries work
- Booking creation/retrieval works
- No performance degradation

## Troubleshooting

### Issue: "No bookings found that need migration"

**Cause:** All bookings already have seatTickets populated.

**Solution:** No action needed - migration is complete.

### Issue: "Invalid seatTickets structure"

**Cause:** Booking has malformed data.

**Solution:** 
1. Check error logs for details
2. Manually inspect the booking
3. Fix data or exclude from migration

### Issue: Analytics queries fail

**Cause:** Column name mismatch or missing GIN index.

**Solution:**
1. Verify GIN index exists on seatTickets column
2. Check column name casing in queries (use "seatTickets" not "seat_tickets")

## Performance Considerations

- **Batch Size:** Default 100, adjust based on database performance
- **GIN Indexes:** Required for efficient JSONB queries
- **Database Load:** Run during low-traffic periods
- **Memory Usage:** Monitor for large datasets

## Documentation

- **MIGRATION_GUIDE.md** - Detailed migration guide
- **STAGING_MIGRATION_REPORT.md** - Staging migration results
- **STAGING_MIGRATION_SUMMARY.md** - Quick summary

## Testing

Run the migration tests:
```bash
cd backend
npm test -- migrationScript.test.js
npm test -- migrationCompleteness.property.test.js
```

## Support

For issues or questions:
1. Check error logs in migration output
2. Review property-based tests
3. Consult design document at `.kiro/specs/booking-data-structure-optimization/design.md`

## Version History

- **v1.0** (2025-11-20) - Initial release
  - Core migration script
  - Staging validation script
  - Quick validation script
  - Comprehensive documentation
