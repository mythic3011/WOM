import app from "./app.js";
import sequelize, { testConnection, syncDatabase } from "./config/database.js";
import { autoSetupDatabase } from "./db/autoSetup.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

const startServer = async () => {
  try {
    console.log("Connecting to database...");
    const connected = await testConnection();

    if (!connected) {
      console.error("Failed to connect to database");
      process.exit(1);
    }

    const FORCE_SYNC = process.env.DB_SYNC_FORCE === "true";
    if (FORCE_SYNC) {
      console.log("Force synchronizing database...");
      await syncDatabase(true);
    } else {
      console.log("Skipping sync (using migrations)...");
    }

    const ENABLE_AUTOSETUP =
      (process.env.DB_AUTOSETUP || "true") === "true" &&
      NODE_ENV === "development";
    if (ENABLE_AUTOSETUP) {
      console.log("Checking database setup...");
      await autoSetupDatabase();
    }

    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${NODE_ENV}`);
      console.log(`API: http://localhost:${PORT}/api`);
      console.log(`Auth: http://localhost:${PORT}/api/auth`);
      console.log("Ready to accept requests");
    });

    const gracefulShutdown = async (signal) => {
      console.log(`${signal} received. Closing server gracefully...`);

      server.close(async () => {
        console.log("HTTP server closed");

        try {
          await sequelize.close();
          console.log("Database connection closed");
          process.exit(0);
        } catch (error) {
          console.error("Error closing database:", error);
          process.exit(1);
        }
      });

      setTimeout(() => {
        console.error("Forcefully shutting down");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
