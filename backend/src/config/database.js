import { Sequelize } from "sequelize";
import env from "./env.js";
import logger from "./logger.js";

const requiredEnvVars = ["DB_NAME", "DB_USER", "DB_PASSWORD", "DB_HOST"];
const missingVars = requiredEnvVars.filter((varName) => !env[varName]);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required database environment variables: ${missingVars.join(", ")}`
  );
}

const sequelize = new Sequelize(
  env.DB_NAME,
  env.DB_USER,
  env.DB_PASSWORD,
  {
    host: env.DB_HOST,
    port: parseInt(env.DB_PORT) || 5432,
    dialect: "postgres",
    logging:
      env.NODE_ENV === "development" ? (msg) => logger.debug(msg) : false,
    pool: {
      max: env.NODE_ENV === "production" ? 20 : 5,
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
