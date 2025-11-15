import "express-async-errors";
import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import dotenv from "dotenv";
import { apiReference } from "@scalar/express-api-reference";

import { corsConfig } from "./config/cors.js";
import { sessionConfig } from "./config/session.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { apiLimiter, bookingLimiter } from "./middleware/rateLimiter.js";
import { openApiSpec } from "./config/openapi.js";
import logger, { requestLogger } from "./config/logger.js";
import { sanitizeAll } from "./middleware/sanitize.js";
import { requestId } from "./middleware/requestId.js";
import { performanceMonitor } from "./middleware/performance.js";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import performanceRoutes from "./routes/performances.js";
import bookingRoutes from "./routes/bookings.js";
import venueRoutes from "./routes/venues.js";
import ticketTypeRoutes from "./routes/ticketTypes.js";
import statsRoutes from "./routes/stats.js";
import devToolsRoutes from "./routes/devTools.js";

dotenv.config();

const app = express();

app.use(compression());

app.use((req, res, next) => {
  if (req.path === "/docs") {
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "'wasm-unsafe-eval'",
            "https://cdn.jsdelivr.net",
          ],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: [
            "'self'",
            "data:",
            "https://fonts.gstatic.com",
            "https://cdn.jsdelivr.net",
          ],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          workerSrc: ["'self'", "blob:"],
        },
      },
    })(req, res, next);
  } else {
    helmet()(req, res, next);
  }
});

app.use(cors(corsConfig));

app.use(requestId);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
  app.use(performanceMonitor);
}
app.use(requestLogger);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(sanitizeAll);

app.use(cookieParser());

app.use(session(sessionConfig));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Western Orchestral Music Booking System API",
    version: "1.0.0",
    documentation: "/docs",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      performances: "/api/performances",
      bookings: "/api/bookings",
      venues: "/api/venues",
      ticketTypes: "/api/ticket-types",
      stats: "/api/stats",
    },
  });
});

app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "API is running",
  });
});

app.get("/api/health", async (req, res) => {
  const health = {
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: "1.0.0",
    services: {
      api: "healthy",
      database: "unknown",
    },
  };

  try {
    const sequelizeModule = await import("./config/database.js");
    const sequelize = sequelizeModule.default;
    await sequelize.authenticate();
    health.services.database = "healthy";
  } catch (error) {
    health.success = false;
    health.status = "unhealthy";
    health.services.database = "unhealthy";
    health.error = error.message;
  }

  const statusCode = health.success ? 200 : 503;
  res.status(statusCode).json(health);
});

app.use(
  "/docs",
  apiReference({
    content: openApiSpec,
    theme: "purple",
    layout: "modern",
  })
);

app.get("/api/openapi.json", (req, res) => {
  res.json(openApiSpec);
});

app.use("/api", apiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/performances", performanceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/venues", venueRoutes);
app.use("/api/ticket-types", ticketTypeRoutes);
app.use("/api/stats", statsRoutes);

if (process.env.NODE_ENV === "development") {
  app.use("/api/dev-tools", devToolsRoutes);
}

app.use(notFound);
app.use(errorHandler);

export default app;
