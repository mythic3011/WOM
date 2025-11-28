import config from "#config/environment.js";
import logger from "#config/logger.js";
import sequelize from "#config/database.js";
import { User, Performance, Venue, TicketType, Booking } from "#models/index.js";
import { buildSeatMapFromVenueLayout, countSeats } from "#utils/seatMapBuilder.js";
import { generateUsers } from "./data/users.js";
import { performancesData } from "./data/performances.js";
import { ticketTypesData } from "./data/ticketTypes.js";
import { venuesData } from "./data/venues.js";
import { getMockDataConfig } from "#config/mockDataConfig.js";
import { generateBookings } from "./data/bookings.js";
import { generateBrokenSeats, markSeatsAsUnavailable, updateVenueWithConditions } from "./data/venueConditions.js";
import { faker } from "@faker-js/faker";

const isDatabaseEmpty = async () => {
  try {
    const [userCount, ticketTypeCount, venueCount, performanceCount] = await Promise.all([
      User.count(),
      TicketType.count(),
      Venue.count(),
      Performance.count(),
    ]);
    return userCount === 0 && ticketTypeCount === 0 && venueCount === 0 && performanceCount === 0;
  } catch (error) {
    logger.error("Error checking database:", error);
    return true;
  }
};

export const syncDatabaseSchema = async () => {
  try {
    logger.info("Synchronizing database schema...");
    
    await sequelize.sync({ alter: false });
    
    logger.info("Database schema synchronized successfully");
    return true;
  } catch (error) {
    logger.error("Error synchronizing database schema:", error);
    
    if (error.name === "SequelizeConnectionError") {
      logger.error("Suggested fix: Check database connection settings in .env file");
      logger.error("  - Verify DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD");
    } else if (error.name === "SequelizeDatabaseError") {
      logger.error("Suggested fix: Database error occurred");
      logger.error("  - Check if database exists and user has proper permissions");
    } else {
      logger.error("Suggested fix: Review error details above and check database configuration");
    }
    
    throw error;
  }
};

const logProgress = (message, data = {}) => {
  if (config.autoSetup.logging === "verbose") {
    logger.info(message, data);
  } else {
    logger.info(message);
  }
};

const measureTime = async (label, fn) => {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  logProgress(`${label} completed`, { duration: `${duration}ms` });
  return result;
};

export const seedMockData = async (options = {}) => {
  const { force = false } = options;
  const startTime = Date.now();

  try {
    if (!force) {
      logProgress("Checking database status...");
      const isEmpty = await isDatabaseEmpty();

      if (!isEmpty) {
        logger.info("Database already populated, skipping seeding");
        return false;
      }
    }

    logger.info("Starting mock data seeding...");

    logProgress("Seeding ticket types...");
    await measureTime("Ticket types", async () => {
      try {
        await TicketType.bulkCreate(ticketTypesData);
        logger.info(`Created ${ticketTypesData.length} ticket types`);
      } catch (error) {
        logger.error("Failed to seed ticket types:", error);
        logger.error("Suggested fix: Check ticketTypesData structure in data/ticketTypes.js");
        throw error;
      }
    });

    logProgress("Seeding venues...");
    await measureTime("Venues", async () => {
      try {
        await Venue.bulkCreate(venuesData);
        logger.info(`Created ${venuesData.length} venues`);
      } catch (error) {
        logger.error("Failed to seed venues:", error);
        logger.error("Suggested fix: Check venuesData structure in data/venues.js");
        throw error;
      }
    });

    // Get mock data configuration
    const mockConfig = getMockDataConfig();
    logProgress(`Using mock data mode: ${mockConfig.mode}`);

    // Generate venue conditions (broken seats)
    logProgress("Generating venue conditions...");
    const venueConditionsMap = new Map();
    await measureTime("Venue conditions", async () => {
      try {
        faker.seed(mockConfig.seed);

        const venues = await Venue.findAll();
        let totalBrokenSeats = 0;
        let venuesWithBrokenSeats = 0;

        for (const venue of venues) {
          const brokenSeats = generateBrokenSeats(venue, {
            probability: mockConfig.venueConditions.brokenSeatProbability,
            maxBrokenSeats: mockConfig.venueConditions.maxBrokenSeatsPerVenue,
          });

          if (brokenSeats.length > 0) {
            venuesWithBrokenSeats++;
            totalBrokenSeats += brokenSeats.length;

            venueConditionsMap.set(venue.id, brokenSeats);

            const updatedLayout = updateVenueWithConditions(venue, brokenSeats);
            await venue.update({ layout: updatedLayout });

            logProgress(`Venue ${venue.id} (${venue.name}): ${brokenSeats.length} broken seats`);
          }
        }

        logger.info(`Generated venue conditions: ${venuesWithBrokenSeats} venues with ${totalBrokenSeats} total broken seats`);
      } catch (error) {
        logger.error("Failed to generate venue conditions:", error);
        logger.error("Suggested fix: Check venue layout structure and broken seat generation logic");
        throw error;
      }
    });

    logProgress("Seeding users...");
    const users = await measureTime("Users", async () => {
      try {
        const generatedUsers = await generateUsers();
        await User.bulkCreate(generatedUsers);
        logger.info(`Created ${generatedUsers.length} users`);
        return generatedUsers;
      } catch (error) {
        logger.error("Failed to seed users:", error);
        logger.error("Suggested fix: Check generateUsers function in data/users.js");
        logger.error("  - Verify password hashing is working correctly");
        throw error;
      }
    });

    logProgress("Seeding performances...");
    await measureTime("Performances", async () => {
      try {
        await Performance.bulkCreate(performancesData);
        logger.info(`Created ${performancesData.length} performances`);
      } catch (error) {
        logger.error("Failed to seed performances:", error);
        logger.error("Suggested fix: Check performancesData structure in data/performances.js");
        logger.error("  - Verify all required fields are present");
        logger.error("  - Check that venueId references exist");
        throw error;
      }
    });

    logProgress("Computing seat maps for performances...");
    const performances = await measureTime("Seat maps", async () => {
      const perfWithVenues = await Performance.findAll({
        include: [{ model: Venue, as: "venue" }],
      });

      let totalSeatsGenerated = 0;
      let performancesWithZeroSeats = 0;

      for (const perf of perfWithVenues) {
        const layout = perf.venue?.layout || {};
        let seatMap = buildSeatMapFromVenueLayout(layout);

        // Validate seat map has sections and non-zero total
        const hasSections = seatMap.sections && seatMap.sections.length > 0;
        const total = seatMap.total || countSeats(seatMap) || 0;

        if (!hasSections || total === 0) {
          logger.warn(`Performance ${perf.id} (Venue ${perf.venueId}): Seat map generation produced zero seats or no sections`);
          performancesWithZeroSeats++;
        } else {
          logProgress(`Performance ${perf.id} (Venue ${perf.venueId}): Generated ${total} seats`);
          totalSeatsGenerated += total;
        }

        // Apply broken seats to the seat map if venue has conditions
        const brokenSeats = venueConditionsMap.get(perf.venueId) || [];
        if (brokenSeats.length > 0) {
          seatMap = markSeatsAsUnavailable(seatMap, brokenSeats);
          logProgress(`Applied ${brokenSeats.length} broken seats to performance ${perf.id}`);
        }

        await perf.update({
          seatMap,
          totalSeats: total,
          availableSeats: total,
          bookedSeats: 0,
          seatMapVersion: 1,
        });
      }

      // Summary logging
      logger.info(`Seat map generation summary:`);
      logger.info(`- Total performances: ${perfWithVenues.length}`);
      logger.info(`- Total seats generated: ${totalSeatsGenerated}`);
      logger.info(`- Performances with zero seats: ${performancesWithZeroSeats}`);

      return perfWithVenues;
    });

    // Generate bookings
    logProgress("Generating bookings...");
    const bookings = await measureTime("Bookings", async () => {
      try {
        // Get all ticket types
        const ticketTypes = await TicketType.findAll();

        // Create broken seats map for booking generation
        const brokenSeatsMap = new Map();
        venueConditionsMap.forEach((brokenSeats, venueId) => {
          // Find all performances for this venue and add broken seats
          performances.forEach(perf => {
            if (perf.venueId === venueId) {
              brokenSeatsMap.set(perf.id, new Set(brokenSeats.map(id => id.toLowerCase())));
            }
          });
        });

        // Generate bookings
        const generatedBookings = await generateBookings({
          users,
          performances,
          ticketTypes,
          count: mockConfig.volumes.bookings,
          seed: mockConfig.seed,
          patterns: mockConfig.bookingPatterns,
          brokenSeats: brokenSeatsMap,
        });

        if (generatedBookings.length > 0) {
          // Insert bookings into database
          await Booking.bulkCreate(generatedBookings);
          logProgress(`Created ${generatedBookings.length} bookings`);

          // Update performance seat availability
          logProgress("Updating performance seat availability...");
          const bookingsByPerformance = new Map();

          generatedBookings.forEach(booking => {
            if (!bookingsByPerformance.has(booking.performanceId)) {
              bookingsByPerformance.set(booking.performanceId, []);
            }
            bookingsByPerformance.get(booking.performanceId).push(booking);
          });

          for (const [performanceId, perfBookings] of bookingsByPerformance) {
            const performance = performances.find(p => p.id === performanceId);
            if (performance) {
              const bookedSeats = perfBookings.reduce((sum, b) => sum + b.seatCount, 0);
              const availableSeats = Math.max(0, performance.totalSeats - bookedSeats);

              await performance.update({
                bookedSeats,
                availableSeats,
              });

              logProgress(`Performance ${performanceId}: ${bookedSeats} booked, ${availableSeats} available`);
            }
          }
        } else {
          logProgress("No bookings generated");
        }

        return generatedBookings;
      } catch (error) {
        logger.error("Error generating bookings:", error);
        logger.warn("Continuing setup without bookings...");
        return [];
      }
    });

    // Validate seat inventory consistency
    logProgress("Validating seat inventory...");
    await measureTime("Seat inventory validation", async () => {
      const allPerformances = await Performance.findAll();
      const inconsistencies = [];

      for (const perf of allPerformances) {
        // Validation 1: bookedSeats + availableSeats === totalSeats
        const sumMatches = (perf.bookedSeats + perf.availableSeats) === perf.totalSeats;

        // Validation 2: bookedSeats <= totalSeats
        const bookedNotExceeding = perf.bookedSeats <= perf.totalSeats;

        if (!sumMatches || !bookedNotExceeding) {
          inconsistencies.push({
            performanceId: perf.id,
            totalSeats: perf.totalSeats,
            bookedSeats: perf.bookedSeats,
            availableSeats: perf.availableSeats,
            sumMatches,
            bookedNotExceeding
          });

          logger.error(`Seat inventory inconsistency detected for performance ${perf.id}:`);
          logger.error(`  Total: ${perf.totalSeats}, Booked: ${perf.bookedSeats}, Available: ${perf.availableSeats}`);
          if (!sumMatches) {
            logger.error(`  ERROR: bookedSeats + availableSeats (${perf.bookedSeats + perf.availableSeats}) !== totalSeats (${perf.totalSeats})`);
          }
          if (!bookedNotExceeding) {
            logger.error(`  ERROR: bookedSeats (${perf.bookedSeats}) > totalSeats (${perf.totalSeats})`);
          }
        }
      }

      if (inconsistencies.length === 0) {
        logger.info("✓ All performances have consistent seat inventory");
      } else {
        logger.warn(`✗ Found ${inconsistencies.length} performances with seat inventory inconsistencies`);
      }
    });

    const totalDuration = Date.now() - startTime;

    logger.info("Mock data seeding completed successfully");
    logger.info("\nSeeding Summary:");
    logger.info(`- Environment: ${config.env}`);
    logger.info(`- Mock Data Mode: ${mockConfig.mode}`);
    logger.info(`- Total Time: ${totalDuration}ms`);
    logger.info(`- Users: ${users.length}`);
    logger.info(`- Venues: ${venuesData.length}`);
    logger.info(`- Performances: ${performancesData.length}`);
    logger.info(`- Ticket Types: ${ticketTypesData.length}`);
    logger.info(`- Bookings: ${bookings.length}`);

    const totalBrokenSeats = Array.from(venueConditionsMap.values()).reduce(
      (sum, seats) => sum + seats.length,
      0
    );
    if (totalBrokenSeats > 0) {
      logger.info(`- Venues with broken seats: ${venueConditionsMap.size}`);
      logger.info(`- Total broken seats: ${totalBrokenSeats}`);
    }

    if (config.isDevelopment) {
      logger.info("\nDefault Accounts:");
      logger.info("Admin: admin@wom.hk / adminpass");
      logger.info("User: user@example.com / userpass");
    }

    return {
      success: true,
      counts: {
        users: users.length,
        venues: venuesData.length,
        performances: performancesData.length,
        ticketTypes: ticketTypesData.length,
        bookings: bookings.length,
        brokenSeats: totalBrokenSeats,
      },
      duration: totalDuration,
    };
  } catch (error) {
    logger.error("Error in mock data seeding:", error);
    throw error;
  }
};

export const autoSetupDatabase = async () => {
  try {
    if (!config.autoSetup.enabled) {
      logger.info("Auto-setup disabled, skipping...");
      return false;
    }

    logger.info(`Starting auto-setup (strategy: ${config.autoSetup.strategy})...`);

    await syncDatabaseSchema();
    
    const result = await seedMockData();
    
    if (result && result.success) {
      logger.info("Database auto-setup completed successfully");
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error("Error in auto-setup:", error);
    throw error;
  }
};
