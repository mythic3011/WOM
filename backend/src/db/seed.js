import sequelize, { syncDatabase } from "../config/database.js";
import { User, Performance, Venue, TicketType } from "../models/index.js";
import { generateUsers } from "./data/users.js";
import { venuesData } from "./data/venues.js";
import { performancesData } from "./data/performances.js";
import { ticketTypesData } from "./data/ticketTypes.js";
import { buildSeatMapFromVenueLayout, countSeats } from "../utils/seatMapBuilder.js";

const seedDatabase = async () => {
  try {
    console.log("Starting database seed...");

    console.log("Connecting to database...");
    await sequelize.authenticate();

    console.log("Dropping and recreating tables...");
    await syncDatabase(true);

    console.log("Seeding ticket types...");
    await TicketType.bulkCreate(ticketTypesData);
    console.log(`Created ${ticketTypesData.length} ticket types`);

    console.log("Seeding venues...");
    await Venue.bulkCreate(venuesData);
    console.log(`Created ${venuesData.length} venues`);

    console.log("Seeding users...");
    const users = await generateUsers();
    await User.bulkCreate(users);
    console.log(`Created ${users.length} users`);

    console.log("Seeding performances...");
    await Performance.bulkCreate(performancesData);
    console.log(`Created ${performancesData.length} performances`);

    console.log("Computing seat maps for performances...");
    const perfWithVenues = await Performance.findAll({
      include: [{ model: Venue, as: "venue" }],
    });
    for (const perf of perfWithVenues) {
      const layout = perf.venue?.layout || {};
      const seatMap = buildSeatMapFromVenueLayout(layout);
      const total = seatMap.total || countSeats(seatMap) || 0;
      await perf.update({
        seatMap,
        totalSeats: total,
        availableSeats: total,
        seatMapVersion: 1,
      });
    }
    console.log("Seat maps computed for performances");

    console.log("Database seeding completed successfully");
    console.log("\nSummary:");
    console.log(`- Users: ${users.length}`);
    console.log(`- Venues: ${venuesData.length}`);
    console.log(`- Performances: ${performancesData.length}`);
    console.log(`- Ticket Types: ${ticketTypesData.length}`);
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
