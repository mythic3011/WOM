# Production Migration Execution Report

## Overview

This document provides a comprehensive guide for executing the booking data structure migration in production, along with monitoring and verification procedures.

## Pre-Migration Checklist

### ✅ Prerequisites

- [ ] Staging migration completed successfully
- [ ] All tests passing in staging environment
- [ ] API consumers notified of migration timeline
- [ ] Backup strategy confirmed and tested
- [ ] Rollback procedure documented and tested
- [ ] Low-traffic time window scheduled
- [ ] Team members on standby for support
- [ ] Monitoring tools configured and ready

### ✅ Environment Verification

- [ ] Database connection verified
- [ ] GIN indexes created on `seatTickets` field
- [ ] Sufficient disk space available
- [ ] Backup directory writable
- [ ] Migration script tested on staging

## Migration Execution

### Step 1: Pre-Migration Backup

**Command:**
```bash
# Automatic backup is included in migration script
# To create manual backup:
pg_dump -h localhost -U postgres -d wom_production -t bookings > bookings_backup_$(date +%Y%m%d_%H%M%S).sql
```

**Verification:**
- Backup file created successfully
- Backup file size is reasonable
- Backup file is readable

### Step 2: Execute Migration

**Command:**
```bash
cd backend
node src/scripts/runProductionMigration.js
```

**Options:**
- `--batch-size=N` - Process N bookings at a time (default: 50)
- `--max-errors=N` - Stop if more than N errors occur (default: 10)
- `--skip-backup` - Skip automatic backup (NOT RECOMMENDED)

**Recommended Settings:**
```bash
# Conservative approach (recommended for first run)
node src/scripts/runProductionMigration.js --batch-size=25 --max-errors=5

# Standard approach
node src/scripts/runProductionMigration.js

# Aggressive approach (only if confident)
node src/scripts/runProductionMigration.js --batch-size=100
```

### Step 3: Monitor Progress

The migration script provides real-time progress updates:

```
[2025-11-20T10:00:00.000Z] [INFO] Starting production migration...
[2025-11-20T10:00:00.100Z] [INFO] Batch size: 50
[2025-11-20T10:00:00.200Z] [INFO] Found 1000 booking(s) to migrate
[2025-11-20T10:00:05.000Z] [INFO] Processing batch: 1 to 50 of 1000
[2025-11-20T10:00:10.000Z] [INFO] Progress: 50/1000 (5.0%)
...
```

**Key Metrics to Watch:**
- Success rate (should be > 99%)
- Error count (should be < max-errors threshold)
- Processing speed (bookings per second)
- Memory usage
- Database CPU usage

### Step 4: Post-Migration Verification

The script automatically performs verification:

1. **Data Integrity Check**
   - Validates all seatTickets structures
   - Verifies price consistency
   - Checks for missing data

2. **System Health Check**
   - Adoption rate (target: > 95%)
   - Storage efficiency (target: > 40% reduction)
   - Data integrity (target: > 99%)

3. **Dashboard Update**
   - Saves metrics to `production_migration_dashboard.json`
   - Can be integrated with monitoring tools

## Monitoring After Migration

### Continuous Monitoring (24 hours)

**Command:**
```bash
# Monitor every 5 minutes for 24 hours
node src/scripts/monitorProduction.js --interval 300 --duration 24
```

**What to Monitor:**

1. **Adoption Metrics**
   - New bookings using seatTickets format
   - Old bookings still using seats format
   - Adoption rate percentage

2. **Storage Efficiency**
   - Average size reduction
   - Total storage saved
   - Database size trends

3. **Data Integrity**
   - Validation success rate
   - Missing fields count
   - Price mismatch count

4. **Performance Metrics**
   - Query execution times
   - Index usage statistics
   - Database load

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Adoption Rate | < 95% | < 80% |
| Storage Reduction | < 30% | < 20% |
| Data Integrity | < 99% | < 95% |
| Failed Bookings | > 1% | > 5% |

## Rollback Procedure

### When to Rollback

- Critical errors exceed threshold (> 10 errors)
- Data integrity below 95%
- System performance degraded significantly
- Business-critical functionality broken

### Rollback Steps

1. **Stop New Bookings (if necessary)**
   ```bash
   # Put application in maintenance mode
   ```

2. **Restore from Backup**
   ```bash
   # Using automatic backup
   node src/scripts/migrateBookingData.js --rollback backup_file.json

   # Using database backup
   psql -h localhost -U postgres -d wom_production < bookings_backup_YYYYMMDD_HHMMSS.sql
   ```

3. **Verify Restoration**
   ```bash
   # Check booking counts
   psql -h localhost -U postgres -d wom_production -c "SELECT COUNT(*) FROM bookings WHERE seats IS NOT NULL"
   ```

4. **Resume Operations**
   ```bash
   # Take application out of maintenance mode
   ```

## Troubleshooting

### Common Issues

#### Issue: High Error Rate

**Symptoms:**
- Many bookings failing migration
- Error count exceeding threshold

**Solutions:**
1. Review error logs for patterns
2. Check for malformed seat IDs
3. Verify ticket type data availability
4. Consider running with smaller batch size

#### Issue: Slow Performance

**Symptoms:**
- Migration taking longer than expected
- Database CPU high
- Queries timing out

**Solutions:**
1. Reduce batch size
2. Check database indexes
3. Verify no other heavy operations running
4. Consider running during off-peak hours

#### Issue: Price Mismatches

**Symptoms:**
- Verification showing price inconsistencies
- Total amounts not matching

**Solutions:**
1. Review price calculation logic
2. Check for rounding errors
3. Verify original data integrity
4. May need manual correction for affected bookings

#### Issue: Missing Data

**Symptoms:**
- Empty seatTickets arrays
- Missing required fields

**Solutions:**
1. Check if seats data exists in original format
2. Verify transformation logic
3. Review default value assignments
4. May need to re-run migration for affected bookings

## Success Criteria

### Migration Considered Successful When:

- ✅ All bookings migrated (or skipped with valid reason)
- ✅ Error rate < 1%
- ✅ Data integrity > 99%
- ✅ Storage reduction > 40%
- ✅ All verification checks pass
- ✅ System health checks pass
- ✅ No critical alerts
- ✅ API responses correct
- ✅ Analytics queries working

## Post-Migration Tasks

### Immediate (Day 1)

- [ ] Verify all monitoring dashboards
- [ ] Check application logs for errors
- [ ] Test booking creation end-to-end
- [ ] Test booking retrieval and display
- [ ] Verify analytics reports
- [ ] Monitor system performance

### Short-term (Week 1)

- [ ] Continue monitoring adoption rate
- [ ] Review any reported issues
- [ ] Optimize queries if needed
- [ ] Update documentation
- [ ] Train support team on new structure

### Long-term (Month 1)

- [ ] Analyze storage savings
- [ ] Review query performance improvements
- [ ] Plan deprecation of old `seats` field
- [ ] Consider removing backward compatibility code
- [ ] Update API documentation

## Contact Information

### Support Team

- **Database Team**: [contact info]
- **Backend Team**: [contact info]
- **DevOps Team**: [contact info]
- **On-Call Engineer**: [contact info]

### Escalation Path

1. Backend Developer
2. Tech Lead
3. Engineering Manager
4. CTO

## Appendix

### Migration Script Output Example

```
╔════════════════════════════════════════════════════════════════════════════════╗
║                    PRODUCTION MIGRATION EXECUTION                              ║
╚════════════════════════════════════════════════════════════════════════════════╝

[2025-11-20T10:00:00.000Z] [WARN] This script will modify production data. Ensure you have:
[2025-11-20T10:00:00.001Z] [WARN]   1. Reviewed and tested the migration on staging
[2025-11-20T10:00:00.002Z] [WARN]   2. Scheduled this during low-traffic period
[2025-11-20T10:00:00.003Z] [WARN]   3. Notified relevant stakeholders
[2025-11-20T10:00:00.004Z] [WARN]   4. Have rollback plan ready
[2025-11-20T10:00:00.005Z] [INFO] Starting in 5 seconds... (Ctrl+C to cancel)

================================================================================
PRE-MIGRATION VALIDATION
================================================================================

[2025-11-20T10:00:05.000Z] [INFO] Checking database connection...
[2025-11-20T10:00:05.100Z] [SUCCESS] ✓ Database connection OK
[2025-11-20T10:00:05.200Z] [INFO] Counting bookings to migrate...
[2025-11-20T10:00:05.300Z] [INFO] Found 1000 booking(s) to migrate
[2025-11-20T10:00:05.400Z] [SUCCESS] ✓ All pre-migration checks passed

================================================================================
MIGRATION EXECUTION
================================================================================

[2025-11-20T10:00:05.500Z] [INFO] Starting production migration...
[2025-11-20T10:00:05.600Z] [INFO] Batch size: 50
[2025-11-20T10:00:05.700Z] [INFO] Max errors: 10
[2025-11-20T10:00:05.800Z] [INFO] Backup: ENABLED
[2025-11-20T10:00:10.000Z] [SUCCESS] ✓ Migration completed

Migration Results:
  Total bookings: 1000
  Successful: 995
  Skipped: 3
  Failed: 2

================================================================================
POST-MIGRATION VERIFICATION
================================================================================

[2025-11-20T10:00:15.000Z] [INFO] Verifying migrated data...
[2025-11-20T10:00:20.000Z] [SUCCESS] ✓ All bookings verified successfully

Verification Results:
  Total checked: 1000
  Valid: 998
  Invalid structure: 0
  Empty seatTickets: 0
  Price mismatches: 2

================================================================================
SYSTEM HEALTH MONITORING
================================================================================

[2025-11-20T10:00:25.000Z] [INFO] Running post-migration health check...
[2025-11-20T10:00:30.000Z] [SUCCESS] ✓ System health is good

Health Check Results:
  ✓ Adoption rate: 99.5%
  ✓ Storage efficiency: 45.2%
  ✓ Data integrity: 99.8%
  ✓ System alerts: None

================================================================================
MONITORING DASHBOARD UPDATE
================================================================================

[2025-11-20T10:00:35.000Z] [INFO] Updating monitoring dashboards...
[2025-11-20T10:00:36.000Z] [SUCCESS] ✓ Dashboard data saved to: backend/src/scripts/production_migration_dashboard.json

Dashboard Metrics:
  Adoption Rate: 99.5%
  Storage Reduction: 45.2%
  Data Integrity: 99.8%

================================================================================
MIGRATION REPORT
================================================================================

================================================================================
✓ PRODUCTION MIGRATION COMPLETED SUCCESSFULLY
================================================================================

Step Summary:
  Pre-validation: ✓
  Migration: ✓
  Verification: ✓
  Health Check: ✓
  Dashboard Update: ✓

Migration Statistics:
  Total: 1000
  Successful: 995
  Skipped: 3
  Failed: 2

Verification Results:
  Success Rate: 99.80%
  Valid: 998
  Issues: 2

================================================================================

[2025-11-20T10:00:40.000Z] [INFO] Full report saved to: backend/src/scripts/PRODUCTION_MIGRATION_REPORT_1732096840000.json
[2025-11-20T10:00:40.001Z] [SUCCESS] ✓ Production migration completed successfully
[2025-11-20T10:00:40.002Z] [INFO] Continue monitoring system health for the next 24 hours
[2025-11-20T10:00:40.003Z] [INFO] Use: node backend/src/scripts/monitorProduction.js --interval 300 --duration 24
```

### Monitoring Dashboard JSON Example

```json
{
  "timestamp": "2025-11-20T10:00:36.000Z",
  "migration": {
    "completed": true,
    "completedAt": "2025-11-20T10:00:36.000Z"
  },
  "adoption": {
    "rate": 99.5,
    "withSeatTickets": 995,
    "withoutSeatTickets": 5,
    "total": 1000
  },
  "storage": {
    "reductionPercentage": 45.2,
    "avgSeatsSize": 720,
    "avgSeatTicketsSize": 395
  },
  "integrity": {
    "validPercentage": 99.8,
    "valid": 998,
    "invalid": 2,
    "total": 1000
  }
}
```

## Conclusion

This migration is a critical step in optimizing the booking data structure. Following this guide carefully will ensure a smooth transition with minimal risk to production systems.

**Remember:**
- Test thoroughly on staging first
- Schedule during low-traffic periods
- Monitor continuously after migration
- Have rollback plan ready
- Communicate with stakeholders

**Questions or Issues?**
Contact the backend team immediately if you encounter any problems during migration.
