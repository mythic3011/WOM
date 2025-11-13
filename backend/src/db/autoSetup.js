import { User, Performance, Venue, TicketType } from "../models/index.js";
import { generateUsers } from "./data/users.js";
import { venuesData } from "./data/venues.js";
import { performancesData } from "./data/performances.js";
import { ticketTypesData } from "./data/ticketTypes.js";
import { buildSeatMapFromVenueLayout, countSeats } from "../utils/seatMapBuilder.js";
import logger from "../config/logger.js";

const isDatabaseEmpty = async () => {
  try {
    const userCount = await User.count();
    return userCount === 0;
  } catch (error) {
    logger.error("Error checking database:", error);
    return true;
  }
};

export const autoSetupDatabase = async () => {
  try {
    const isEmpty = await isDatabaseEmpty();

    if (!isEmpty) {
      logger.info("Database already populated, skipping auto-setup");
      return false;
    }

    logger.info("Empty database detected, starting auto-setup...");

    logger.info("Seeding ticket types...");
    await TicketType.bulkCreate(ticketTypesData);
    logger.info(`Created ${ticketTypesData.length} ticket types`);

    logger.info("Seeding venues...");
    await Venue.bulkCreate(venuesData);
    logger.info(`Created ${venuesData.length} venues`);

    logger.info("Seeding users...");
    const users = await generateUsers();
    await User.bulkCreate(users);
    logger.info(`Created ${users.length} users`);

    logger.info("Seeding performances...");
    await Performance.bulkCreate(performancesData);
    logger.info(`Created ${performancesData.length} performances`);

    logger.info("Computing seat maps for performances...");
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
    logger.info("Seat maps computed for all performances");

    logger.info("Database auto-setup completed successfully");
    logger.info("\nSummary:");
    logger.info(`- Users: ${users.length}`);
    logger.info(`- Venues: ${venuesData.length}`);
    logger.info(`- Performances: ${performancesData.length}`);
    logger.info(`- Ticket Types: ${ticketTypesData.length}`);
    logger.info("\nDefault accounts:");
    logger.info("Admin: admin@wom.hk / adminpass");
    logger.info("User: user@example.com / userpass");

    return true;
  } catch (error) {
    logger.error("Error in auto-setup:", error);
    throw error;
  }
};
