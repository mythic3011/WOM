import config from "#config/environment.js";
import logger from "#config/logger.js";
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

export const autoSetupDatabase = async () => {
  const startTime = Date.now();

  try {
    if (!config.autoSetup.enabled) {
      logger.info("Auto-setup disabled, skipping...");
      return false;
    }

    logProgress("Checking database status...");
    const isEmpty = await isDatabaseEmpty();

    if (!isEmpty) {
      logger.info("Database already populated, skipping auto-setup");
      return false;
    }

    logger.info(`Starting auto-setup (strategy: ${config.autoSetup.strategy})...`);

    logProgress("Seeding ticket types...");
    await measureTime("Ticket types", async () => {
      await TicketType.bulkCreate(ticketTypesData);
      logProgress(`Created ${ticketTypesData.length} ticket types`);
    });

    logProgress("Seeding venues...");
    await measureTime("Venues", async () => {
      await Venue.bulkCreate(venuesData);
      logProgress(`Created ${venuesData.length} venues`);
    });

    // Get mock data configuration
    const mockConfig = getMockDataConfig();
    logProgress(`Using mock data mode: ${mockConfig.mode}`);

    // Generate venue conditions (broken seats)
    logProgress("Generating venue conditions...");
    const venueConditionsMap = new Map();
    await measureTime("Venue conditions", async () => {
      // Initialize faker with seed for deterministic generation
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

          // Store broken seats for later use
          venueConditionsMap.set(venue.id, brokenSeats);

          // Update venue with conditions metadata
          const updatedLayout = updateVenueWithConditions(venue, brokenSeats);
          await venue.update({ layout: updatedLayout });

          logProgress(`Venue ${venue.id} (${venue.name}): ${brokenSeats.length} broken seats`);
        }
      }

      logProgress(`Generated venue conditions: ${venuesWithBrokenSeats} venues with ${totalBrokenSeats} total broken seats`);
    });

    logProgress("Seeding users...");
    const users = await measureTime("Users", async () => {
      const generatedUsers = await generateUsers();
      await User.bulkCreate(generatedUsers);
      logProgress(`Created ${generatedUsers.length} users`);
      return generatedUsers;
    });

    logProgress("Seeding performances...");
    await measureTime("Performances", async () => {
      await Performance.bulkCreate(performancesData);
      logProgress(`Created ${performancesData.length} performances`);
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

    logger.info("Database auto-setup completed successfully");
    logger.info("\nSetup Summary:");
    logger.info(`- Environment: ${config.env}`);
    logger.info(`- Mock Data Mode: ${mockConfig.mode}`);
    logger.info(`- Total Time: ${totalDuration}ms`);
    logger.info(`- Users: ${users.length}`);
    logger.info(`- Venues: ${venuesData.length}`);
    logger.info(`- Performances: ${performancesData.length}`);
    logger.info(`- Ticket Types: ${ticketTypesData.length}`);
    logger.info(`- Bookings: ${bookings.length}`);

    // Add venue conditions summary
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

    return true;
  } catch (error) {
    logger.error("Error in auto-setup:", error);
    logger.error("Rolling back changes...");
    throw error;
  }
};
