import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import logger from "./logger.js";

dotenv.config();

const requiredEnvVars = ["DB_NAME", "DB_USER", "DB_PASSWORD", "DB_HOST"];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required database environment variables: ${missingVars.join(", ")}`
  );
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 5432,
    dialect: "postgres",
    logging:
      process.env.NODE_ENV === "development" ? (msg) => logger.debug(msg) : false,
    pool: {
      max: process.env.NODE_ENV === "production" ? 20 : 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully.");
    return true;
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    return false;
  }
};

export const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log(`Database synchronized ${force ? "(forced)" : ""}.`);
  } catch (error) {
    console.error("Error synchronizing database:", error);
    throw error;
  }
};

export default sequelize;
