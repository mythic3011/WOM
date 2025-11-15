import { User, Performance, Venue, TicketType } from "../models/index.js";
import { generateUsers } from "./data/users.js";
import { venuesData } from "./data/venues.js";
import { performancesData } from "./data/performances.js";
import { ticketTypesData } from "./data/ticketTypes.js";
import { buildSeatMapFromVenueLayout, countSeats } from "../utils/seatMapBuilder.js";
import logger from "../config/logger.js";
import config from "../config/environment.js";

const isDatabaseEmpty = async () => {
  try {
    const userCount = await User.count();
    return userCount === 0;
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
    await measureTime("Seat maps", async () => {
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
      logProgress("Seat maps computed for all performances");
    });

    const totalDuration = Date.now() - startTime;

    logger.info("Database auto-setup completed successfully");
    logger.info("\nSetup Summary:");
    logger.info(`- Environment: ${config.env}`);
    logger.info(`- Total Time: ${totalDuration}ms`);
    logger.info(`- Users: ${users.length}`);
    logger.info(`- Venues: ${venuesData.length}`);
    logger.info(`- Performances: ${performancesData.length}`);
    logger.info(`- Ticket Types: ${ticketTypesData.length}`);

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
