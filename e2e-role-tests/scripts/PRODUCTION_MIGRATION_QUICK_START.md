# Production Migration Quick Start Guide

## 🚀 Quick Reference

This is a condensed guide for executing the production migration. For complete details, see [PRODUCTION_MIGRATION_REPORT.md](./PRODUCTION_MIGRATION_REPORT.md).

## ⚠️ Before You Start

**CRITICAL CHECKLIST:**
- [ ] Staging migration completed successfully
- [ ] All tests passing
- [ ] Low-traffic time window scheduled
- [ ] Team on standby
- [ ] Rollback plan ready

## 📋 Step-by-Step Execution

### Step 1: Pre-Flight Check

```bash
# Verify database connection
psql -h localhost -U postgres -d wom_production -c "SELECT COUNT(*) FROM bookings"

# Check current bookings needing migration
psql -h localhost -U postgres -d wom_production -c "
  SELECT COUNT(*) FROM bookings 
  WHERE (seat_tickets IS NULL OR jsonb_array_length(seat_tickets) = 0) 
  AND seats IS NOT NULL
"
```

### Step 2: Execute Migration

```bash
# Navigate to backend directory
cd backend

# Run migration (recommended settings)
node src/scripts/runProductionMigration.js

# OR with conservative settings
node src/scripts/runProductionMigration.js --batch-size=25 --max-errors=5
```

**What to expect:**
- 5-second countdown before starting
- Real-time progress updates
- Automatic backup creation
- Post-migration verification
- Health check report
- Dashboard metrics update

**Duration estimate:**
- ~1-2 seconds per booking
- 1000 bookings ≈ 20-40 minutes

### Step 3: Monitor Results

The script will automatically:
1. ✅ Validate pre-migration state
2. ✅ Execute migration with progress tracking
3. ✅ Verify data integrity
4. ✅ Check system health
5. ✅ Update monitoring dashboard

**Success indicators:**
- ✓ All steps show green checkmarks
- ✓ Success rate > 99%
- ✓ No critical alerts

### Step 4: Continuous Monitoring (24 hours)

```bash
# Start continuous monitoring
node src/scripts/monitorProduction.js --interval 300 --duration 24
```

This will check every 5 minutes for 24 hours and report:
- Adoption rate
- Storage efficiency
- Data integrity
- System health

## 🔍 Quick Health Check

```bash
# Run one-time health check
node src/scripts/monitorProduction.js --once
```

## 📊 Key Metrics to Watch

| Metric | Target | Action if Below |
|--------|--------|-----------------|
| Success Rate | > 99% | Review errors, may need manual fixes |
| Adoption Rate | > 95% | Check new bookings are using new format |
| Storage Reduction | > 40% | Verify transformation is working |
| Data Integrity | > 99% | Investigate invalid bookings |

## 🚨 If Something Goes Wrong

### High Error Rate (> 1%)

```bash
# Check error logs
tail -f backend/logs/migration.log

# Review specific errors in migration report
cat backend/src/scripts/PRODUCTION_MIGRATION_REPORT_*.json | jq '.results.migration.stats.errors'
```

### Need to Rollback

```bash
# Find backup file
ls -lt backend/src/scripts/booking_backup_*.json | head -1

# Restore from backup (if needed)
# Contact database team for assistance
```

### Performance Issues

```bash
# Check database load
psql -h localhost -U postgres -d wom_production -c "
  SELECT * FROM pg_stat_activity WHERE state = 'active'
"

# Consider reducing batch size
node src/scripts/runProductionMigration.js --batch-size=25
```

## ✅ Success Confirmation

After migration completes, verify:

```bash
# 1. Check adoption rate
psql -h localhost -U postgres -d wom_production -c "
  SELECT 
    COUNT(*) FILTER (WHERE jsonb_array_length(seat_tickets) > 0) as migrated,
    COUNT(*) as total,
    ROUND(100.0 * COUNT(*) FILTER (WHERE jsonb_array_length(seat_tickets) > 0) / COUNT(*), 2) as percentage
  FROM bookings
"

# 2. Verify data integrity
psql -h localhost -U postgres -d wom_production -c "
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE seat_tickets IS NOT NULL AND jsonb_array_length(seat_tickets) > 0) as valid
  FROM bookings
"

# 3. Check storage efficiency
psql -h localhost -U postgres -d wom_production -c "
  SELECT 
    AVG(pg_column_size(seats)) as avg_seats_size,
    AVG(pg_column_size(seat_tickets)) as avg_seat_tickets_size,
    ROUND(100.0 * (1 - AVG(pg_column_size(seat_tickets))::numeric / AVG(pg_column_size(seats))), 2) as reduction_pct
  FROM bookings
  WHERE jsonb_array_length(seat_tickets) > 0 AND jsonb_array_length(seats) > 0
"
```

## 📞 Emergency Contacts

- **Backend Team**: [contact]
- **Database Team**: [contact]
- **On-Call Engineer**: [contact]

## 📝 Post-Migration Checklist

### Immediate (within 1 hour)
- [ ] Verify migration completed successfully
- [ ] Check all metrics are within targets
- [ ] Test booking creation
- [ ] Test booking retrieval
- [ ] Verify analytics queries

### Day 1
- [ ] Monitor adoption rate
- [ ] Check for any errors in logs
- [ ] Verify system performance
- [ ] Review dashboard metrics

### Week 1
- [ ] Continue monitoring
- [ ] Review any reported issues
- [ ] Optimize queries if needed
- [ ] Update documentation

## 🎯 Expected Results

**Successful migration will show:**

```
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
```

## 📚 Additional Resources

- **Full Documentation**: [PRODUCTION_MIGRATION_REPORT.md](./PRODUCTION_MIGRATION_REPORT.md)
- **Migration Script**: [migrateBookingData.js](./migrateBookingData.js)
- **Monitoring Script**: [monitorProduction.js](./monitorProduction.js)
- **Design Document**: [../../.kiro/specs/booking-data-structure-optimization/design.md](../../../.kiro/specs/booking-data-structure-optimization/design.md)

## 💡 Tips

1. **Run during off-peak hours** - Minimize impact on users
2. **Have team ready** - Ensure support available
3. **Monitor continuously** - Watch for 24 hours after migration
4. **Document everything** - Keep notes of any issues
5. **Communicate status** - Update stakeholders regularly

## ⏱️ Timeline

```
T-0:00  Start migration script
T+0:05  Pre-validation complete
T+0:10  Migration begins
T+0:30  Migration ~50% complete
T+1:00  Migration complete
T+1:05  Verification complete
T+1:10  Health check complete
T+1:15  Dashboard updated
T+1:20  Migration report generated
```

---

**Remember:** This is production. Take your time, follow the checklist, and don't hesitate to ask for help if needed.

**Good luck! 🚀**
