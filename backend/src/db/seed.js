import sequelize, { syncDatabase } from "#config/database.js";
import { User, Performance, Venue, TicketType, Booking } from "#models/index.js";
import { buildSeatMapFromVenueLayout, countSeats } from "#utils/seatMapBuilder.js";
import { generateUsers } from "./data/users.js";
import { performancesData } from "./data/performances.js";
import { ticketTypesData } from "./data/ticketTypes.js";
import { venuesData } from "./data/venues.js";
import { getMockDataConfig } from "#config/mockDataConfig.js";
import { generateBookings } from "./data/bookings.js";
import { generateBrokenSeats, markSeatsAsUnavailable, updateVenueWithConditions } from "./data/venueConditions.js";
import { validateMockData, handleEdgeCases } from "./data/mockDataValidator.js";
import { faker } from "@faker-js/faker";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const seedDatabase = async () => {
  try {
    console.log("Starting database seed...");

    console.log("Connecting to database...");
    await sequelize.authenticate();

    console.log("Dropping and recreating tables...");
    await syncDatabase(true);

    console.log("Running migrations to create views...");
    try {
      await execAsync("npx sequelize-cli db:migrate");
      console.log("Migrations completed successfully");
    } catch (error) {
      console.warn("Migration warning:", error.message);
      console.log("Continuing with seed...");
    }

    console.log("Seeding ticket types...");
    await TicketType.bulkCreate(ticketTypesData);
    console.log(`Created ${ticketTypesData.length} ticket types`);

    console.log("Seeding venues...");
    await Venue.bulkCreate(venuesData);
    console.log(`Created ${venuesData.length} venues`);

    // Get mock data configuration
    const mockConfig = getMockDataConfig();
    console.log(`Using mock data mode: ${mockConfig.mode}`);

    // Generate venue conditions (broken seats)
    console.log("Generating venue conditions...");
    const venueConditionsMap = new Map();

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
        const updatedVenue = updateVenueWithConditions(venue, brokenSeats);
        await venue.update({ layout: updatedVenue.layout });

        console.log(`Venue ${venue.id} (${venue.name}): ${brokenSeats.length} broken seats`);
      }
    }

    console.log(`Generated venue conditions: ${venuesWithBrokenSeats} venues with ${totalBrokenSeats} total broken seats`);

    console.log("Seeding users...");
    const users = await generateUsers();

    console.log("Validating mock data...");
    const validationResults = validateMockData(users, performancesData);

    if (validationResults.users.invalid > 0) {
      console.warn(`Warning: ${validationResults.users.invalid} invalid user records found`);
      validationResults.users.errors.forEach(error => {
        console.warn(`User ${error.userId}:`, error.errors);
      });
    }

    if (validationResults.performances.invalid > 0) {
      console.warn(`Warning: ${validationResults.performances.invalid} invalid performance records found`);
      validationResults.performances.errors.forEach(error => {
        console.warn(`Performance ${error.id} (${error.title}):`, error.errors);
      });
    }

    const sanitizedUsers = users.map(user => handleEdgeCases(user, "user"));
    const sanitizedPerformances = performancesData.map(perf => handleEdgeCases(perf, "performance"));

    const createdUsers = await User.bulkCreate(sanitizedUsers, { returning: true });
    console.log(`Created ${createdUsers.length} users`);

    console.log("Seeding performances...");
    await Performance.bulkCreate(sanitizedPerformances);
    console.log(`Created ${sanitizedPerformances.length} performances`);

    console.log("Computing seat maps for performances...");
    const performances = await Performance.findAll({
      include: [{ model: Venue, as: "venue" }],
    });
    for (const perf of performances) {
      const layout = perf.venue?.layout || {};
      let seatMap = buildSeatMapFromVenueLayout(layout);

      // Apply broken seats to the seat map if venue has conditions
      const brokenSeats = venueConditionsMap.get(perf.venueId) || [];
      if (brokenSeats.length > 0) {
        seatMap = markSeatsAsUnavailable(seatMap, brokenSeats);
        console.log(`Applied ${brokenSeats.length} broken seats to performance ${perf.id}`);
      }

      const total = seatMap.total || countSeats(seatMap) || 0;
      await perf.update({
        seatMap,
        totalSeats: total,
        availableSeats: total,
        seatMapVersion: 1,
      });
    }
    console.log("Seat maps computed for performances");

    // Generate bookings
    console.log("Generating bookings...");
    let bookings = [];
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
        users: createdUsers,
        performances,
        ticketTypes,
        count: mockConfig.volumes.bookings,
        seed: mockConfig.seed,
        patterns: mockConfig.bookingPatterns,
        brokenSeats: brokenSeatsMap,
      });

      if (generatedBookings.length > 0) {
        await Booking.bulkCreate(generatedBookings);
        console.log(`Created ${generatedBookings.length} bookings`);

        console.log("Updating performance seat availability...");
        for (const update of performanceUpdates) {
          const performance = performances.find(p => p.id === update.id);
          if (performance) {
            await performance.update({
              bookedSeats: update.bookedSeats,
              availableSeats: update.availableSeats,
            });

            console.log(`Performance ${update.id}: ${update.bookedSeats} booked, ${update.availableSeats} available`);
          }
        }

        bookings = generatedBookings;
      } else {
        console.log("No bookings generated");
      }
    } catch (error) {
      console.error("Error generating bookings:", error);
      console.warn("Continuing setup without bookings...");
    }

    console.log("Database seeding completed successfully");
    console.log("\nSummary:");
    console.log(`- Mock Data Mode: ${mockConfig.mode}`);
    console.log(`- Users: ${createdUsers.length}`);
    console.log(`- Venues: ${venuesData.length}`);
    console.log(`- Performances: ${performancesData.length}`);
    console.log(`- Ticket Types: ${ticketTypesData.length}`);
    console.log(`- Bookings: ${bookings.length}`);

    // Add venue conditions summary
    if (totalBrokenSeats > 0) {
      console.log(`- Venues with broken seats: ${venuesWithBrokenSeats}`);
      console.log(`- Total broken seats: ${totalBrokenSeats}`);
    }

    console.log("\nDefault accounts:");
    console.log("Admin: admin@wom.hk / adminpass");
    console.log("User: user@example.com / userpass");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
