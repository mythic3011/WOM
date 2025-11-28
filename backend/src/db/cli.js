#!/usr/bin/env node

import { Command } from "commander";
import logger from "#config/logger.js";
import db, { User, Performance, Venue, TicketType, Booking } from "#models/index.js";
import { syncDatabaseSchema, seedMockData } from "./autoSetup.js";

const program = new Command();

program
  .name("db-setup")
  .description("Database setup and management CLI")
  .version("1.0.0");

program
  .command("clean")
  .description("Drop all data from the database (keeps schema)")
  .action(async () => {
    try {
      logger.info("Cleaning database...");
      
      await Booking.destroy({ where: {}, truncate: true, cascade: true });
      logger.info("Cleared bookings");
      
      await Performance.destroy({ where: {}, truncate: true, cascade: true });
      logger.info("Cleared performances");
      
      await Venue.destroy({ where: {}, truncate: true, cascade: true });
      logger.info("Cleared venues");
      
      await TicketType.destroy({ where: {}, truncate: true, cascade: true });
      logger.info("Cleared ticket types");
      
      await User.destroy({ where: {}, truncate: true, cascade: true });
      logger.info("Cleared users");
      
      logger.info("Database cleaned successfully");
      process.exit(0);
    } catch (error) {
      logger.error("Error cleaning database:", error);
      process.exit(1);
    }
  });

program
  .command("init")
  .description("Initialize database schema only (no data)")
  .action(async () => {
    try {
      logger.info("Initializing database schema...");
      
      await syncDatabaseSchema();
      
      logger.info("Database schema initialized successfully");
      process.exit(0);
    } catch (error) {
      logger.error("Error initializing database:", error);
      process.exit(1);
    }
  });

program
  .command("seed")
  .description("Seed mock data only (assumes schema exists)")
  .option("-f, --force", "Force seeding even if data exists")
  .action(async (options) => {
    try {
      logger.info("Seeding mock data...");
      
      const result = await seedMockData({ force: options.force });
      
      if (result && result.success) {
        logger.info("Mock data seeded successfully");
        process.exit(0);
      } else {
        logger.warn("Seeding skipped (database not empty, use --force to override)");
        process.exit(0);
      }
    } catch (error) {
      logger.error("Error seeding mock data:", error);
      process.exit(1);
    }
  });

program
  .command("setup")
  .description("Full setup: initialize schema and seed data")
  .option("-f, --force", "Force seeding even if data exists")
  .action(async (options) => {
    try {
      logger.info("Running full database setup...");
      
      await syncDatabaseSchema();
      logger.info("Schema synchronized");
      
      const result = await seedMockData({ force: options.force });
      
      if (result && result.success) {
        logger.info("Full database setup completed successfully");
        process.exit(0);
      } else {
        logger.warn("Setup completed but seeding was skipped");
        process.exit(0);
      }
    } catch (error) {
      logger.error("Error in database setup:", error);
      process.exit(1);
    }
  });

program
  .command("reset")
  .description("Reset database: clean all data and re-seed")
  .action(async () => {
    const transaction = await db.sequelize.transaction();
    
    try {
      logger.info("Resetting database...");
      
      logger.info("Step 1/2: Cleaning existing data...");
      await Booking.destroy({ where: {}, truncate: true, cascade: true, transaction });
      logger.info("  - Cleared bookings");
      
      await Performance.destroy({ where: {}, truncate: true, cascade: true, transaction });
      logger.info("  - Cleared performances");
      
      await Venue.destroy({ where: {}, truncate: true, cascade: true, transaction });
      logger.info("  - Cleared venues");
      
      await TicketType.destroy({ where: {}, truncate: true, cascade: true, transaction });
      logger.info("  - Cleared ticket types");
      
      await User.destroy({ where: {}, truncate: true, cascade: true, transaction });
      logger.info("  - Cleared users");
      
      await transaction.commit();
      logger.info("Data cleaned successfully");
      
      logger.info("Step 2/2: Seeding fresh data...");
      const result = await seedMockData({ force: true });
      
      if (result && result.success) {
        logger.info("Database reset completed successfully");
        logger.info("\nRecords created:");
        logger.info(`  - Users: ${result.counts.users}`);
        logger.info(`  - Venues: ${result.counts.venues}`);
        logger.info(`  - Performances: ${result.counts.performances}`);
        logger.info(`  - Ticket Types: ${result.counts.ticketTypes}`);
        logger.info(`  - Bookings: ${result.counts.bookings}`);
        if (result.counts.brokenSeats > 0) {
          logger.info(`  - Broken Seats: ${result.counts.brokenSeats}`);
        }
        process.exit(0);
      } else {
        logger.error("Reset failed during seeding");
        process.exit(1);
      }
    } catch (error) {
      await transaction.rollback();
      logger.error("Error resetting database:", error);
      logger.error("Transaction rolled back - database state preserved");
      process.exit(1);
    }
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
