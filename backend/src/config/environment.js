export const NODE_ENV = process.env.NODE_ENV || "development";

export const isDevelopment = NODE_ENV === "development";
export const isProduction = NODE_ENV === "production";
export const isTest = NODE_ENV === "test";

export const config = {
  env: NODE_ENV,
  isDevelopment,
  isProduction,
  isTest,

  database: {
    logging: isDevelopment,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX || "5"),
      min: parseInt(process.env.DB_POOL_MIN || "0"),
      acquire: 30000,
      idle: 10000,
    },
  },

  autoSetup: {
    enabled: process.env.AUTO_SETUP !== "false",
    strategy: isDevelopment
      ? "development"
      : isTest
        ? "test"
        : "production",
    resetOnStart: isDevelopment && process.env.RESET_DB === "true",
    seedData: process.env.SEED_DATA_AMOUNT || (isDevelopment ? "full" : "minimal"),
    logging: isDevelopment ? "verbose" : "minimal",
  },

  rateLimit: {
    enabled: !isDevelopment,
    window: parseInt(process.env.RATE_LIMIT_WINDOW || "15"),
    max: parseInt(process.env.RATE_LIMIT_MAX || "100"),
  },

  session: {
    secret: process.env.SESSION_SECRET || "dev-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  },

  cors: {
    origin: isDevelopment
      ? ["http://localhost:3000", "http://localhost:5173"]
      : process.env.CORS_ORIGIN?.split(",") || [],
    credentials: true,
  },

  logging: {
    level: isDevelopment ? "debug" : "info",
    format: isDevelopment ? "dev" : "combined",
  },
};

export default config;
