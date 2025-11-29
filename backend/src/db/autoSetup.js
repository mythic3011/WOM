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

const fixVenueSequence = async () => {
  try {
    await sequelize.query(`
      SELECT setval(
        pg_get_serial_sequence('venues', 'id'),
        COALESCE((SELECT MAX(id) FROM venues), 0) + 1,
        false
      );
    `);
  } catch (error) {
    logger.error("Error fixing venue sequence:", error);
    throw error;
  }
};

const fixPerformanceSequence = async () => {
  try {
    await sequelize.query(`
      SELECT setval(
        pg_get_serial_sequence('performances', 'id'),
        COALESCE((SELECT MAX(id) FROM performances), 0) + 1,
        false
      );
    `);
  } catch (error) {
    logger.error("Error fixing performance sequence:", error);
    throw error;
  }
};

const createDatabaseViews = async () => {
  try {
    logger.info("Creating database views...");

    await sequelize.query(`
      CREATE OR REPLACE VIEW bookings_view AS
      SELECT 
        b.id,
        b."bookingReference",
        b."userId",
        b."userName",
        b."userEmail",
        b."performanceId",
        b."performanceTitle",
        b."venueId",
        b."venueName",
        b."showtimeId",
        b.showtime,
        b.seats,
        b."seatTickets",
        b."seatCount",
        b.amount,
        b."totalAmount",
        b."bookingDate",
        b.status,
        b."paymentMethod",
        b."paymentStatus",
        b.notes,
        b."customerInfo",
        b."createdAt",
        b."updatedAt",
        u.name as user_name,
        u.email as user_email,
        u.phone as user_phone,
        p.title as performance_title,
        p.date as performance_date,
        p.status as performance_status,
        p.image as performance_image,
        v.name as venue_name,
        v.address as venue_address,
        v.capacity as venue_capacity
      FROM bookings b
      LEFT JOIN users u ON b."userId" = u.id
      LEFT JOIN performances p ON b."performanceId" = p.id
      LEFT JOIN venues v ON b."venueId" = v.id;
    `);

    await sequelize.query(`
      CREATE OR REPLACE VIEW user_stats_view AS
      SELECT 
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        COUNT(DISTINCT b.id) as total_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'confirmed' THEN b.id END) as confirmed_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'pending' THEN b.id END) as pending_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'cancelled' THEN b.id END) as cancelled_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) as completed_bookings,
        COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.amount ELSE 0 END), 0) as total_spent,
        COALESCE(AVG(CASE WHEN b.status = 'confirmed' THEN b.amount END), 0) as average_spent,
        COUNT(DISTINCT CASE 
          WHEN b.status IN ('confirmed', 'pending') 
          AND p.date > NOW() 
          THEN b.id 
        END) as upcoming_bookings,
        MIN(b."bookingDate") as first_booking_date,
        MAX(b."bookingDate") as last_booking_date,
        COALESCE(SUM(b."seatCount"), 0) as total_seats_booked
      FROM users u
      LEFT JOIN bookings b ON u.id = b."userId"
      LEFT JOIN performances p ON b."performanceId" = p.id
      GROUP BY u.id, u.name, u.email;
    `);

    await sequelize.query(`
      CREATE OR REPLACE VIEW admin_stats_view AS
      SELECT 
        COUNT(DISTINCT b.id) as total_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'confirmed' THEN b.id END) as confirmed_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'pending' THEN b.id END) as pending_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'cancelled' THEN b.id END) as cancelled_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) as completed_bookings,
        COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.amount ELSE 0 END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN b.status = 'confirmed' THEN b.amount END), 0) as average_booking_value,
        COUNT(DISTINCT b."userId") as total_customers,
        COUNT(DISTINCT b."performanceId") as performances_with_bookings,
        COALESCE(SUM(b."seatCount"), 0) as total_seats_sold,
        COUNT(DISTINCT CASE 
          WHEN b.status IN ('confirmed', 'pending') 
          AND p.date > NOW() 
          THEN b.id 
        END) as upcoming_bookings,
        COUNT(DISTINCT CASE 
          WHEN b."bookingDate" >= CURRENT_DATE - INTERVAL '7 days' 
          THEN b.id 
        END) as bookings_last_7_days,
        COUNT(DISTINCT CASE 
          WHEN b."bookingDate" >= CURRENT_DATE - INTERVAL '30 days' 
          THEN b.id 
        END) as bookings_last_30_days,
        COALESCE(SUM(CASE 
          WHEN b.status = 'confirmed' 
          AND b."bookingDate" >= CURRENT_DATE - INTERVAL '30 days' 
          THEN b.amount 
          ELSE 0 
        END), 0) as revenue_last_30_days
      FROM bookings b
      LEFT JOIN performances p ON b."performanceId" = p.id;
    `);

    await sequelize.query(`
      CREATE OR REPLACE VIEW performance_stats_view AS
      SELECT 
        p.id as performance_id,
        p.title as performance_title,
        p.date as performance_date,
        p.status as performance_status,
        v.name as venue_name,
        p."totalSeats" as total_seats,
        p."availableSeats" as available_seats,
        p."bookedSeats" as booked_seats,
        COUNT(DISTINCT b.id) as total_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'confirmed' THEN b.id END) as confirmed_bookings,
        COUNT(DISTINCT CASE WHEN b.status = 'pending' THEN b.id END) as pending_bookings,
        COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.amount ELSE 0 END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN b.status = 'confirmed' THEN b.amount END), 0) as average_ticket_price,
        COUNT(DISTINCT b."userId") as unique_customers,
        CASE 
          WHEN p."totalSeats" > 0 
          THEN ROUND((p."bookedSeats"::numeric / p."totalSeats"::numeric * 100), 2)
          ELSE 0 
        END as occupancy_rate
      FROM performances p
      LEFT JOIN venues v ON p."venueId" = v.id
      LEFT JOIN bookings b ON p.id = b."performanceId"
      GROUP BY p.id, p.title, p.date, p.status, v.name, p."totalSeats", p."availableSeats", p."bookedSeats";
    `);

    await sequelize.query(`
      CREATE OR REPLACE VIEW venue_stats_view AS
      SELECT 
        v.id as venue_id,
        v.name as venue_name,
        v.address as venue_address,
        v.capacity as venue_capacity,
        COUNT(DISTINCT p.id) as total_performances,
        COUNT(DISTINCT CASE WHEN p.date > NOW() THEN p.id END) as upcoming_performances,
        COUNT(DISTINCT b.id) as total_bookings,
        COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.amount ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(b."seatCount"), 0) as total_seats_sold,
        COUNT(DISTINCT b."userId") as unique_customers
      FROM venues v
      LEFT JOIN performances p ON v.id = p."venueId"
      LEFT JOIN bookings b ON p.id = b."performanceId"
      GROUP BY v.id, v.name, v.address, v.capacity;
    `);

    logger.info("Database views created successfully");
    return true;
  } catch (error) {
    logger.error("Error creating database views:", error);
    logger.warn("Continuing without views - some features may not work");
    return false;
  }
};

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
    
    await createDatabaseViews();
    
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
        const { bookings: generatedBookings, performanceUpdates } = await generateBookings({
          users,
          performances,
          ticketTypes,
          count: mockConfig.volumes.bookings,
          seed: mockConfig.seed,
          patterns: mockConfig.bookingPatterns,
          brokenSeats: brokenSeatsMap,
        });

        if (generatedBookings.length > 0) {
          await Booking.bulkCreate(generatedBookings);
          logProgress(`Created ${generatedBookings.length} bookings`);

          logProgress("Updating performance seat availability...");
          for (const update of performanceUpdates) {
            const performance = performances.find(p => p.id === update.id);
            if (performance) {
              await performance.update({
                bookedSeats: update.bookedSeats,
                availableSeats: update.availableSeats,
              });

              logProgress(`Performance ${update.id}: ${update.bookedSeats} booked, ${update.availableSeats} available`);
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

    logProgress("Fixing database sequences...");
    await measureTime("Sequence fixes", async () => {
      try {
        await fixVenueSequence();
        await fixPerformanceSequence();
        logger.info("Database sequences fixed successfully");
      } catch (error) {
        logger.error("Failed to fix sequences:", error);
        logger.warn("Sequences may need manual fixing if creation fails");
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
