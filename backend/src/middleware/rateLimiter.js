import rateLimit from "express-rate-limit";

const isDevelopment = process.env.NODE_ENV === "development";

const bypassLimiter = (req, res, next) => next();

const createLimiter = (config) => {
  if (isDevelopment) {
    return bypassLimiter;
  }
  return rateLimit(config);
};

export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many login attempts. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

export const apiLimiter = createLimiter({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || "15") * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || "100"),
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const bookingLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many booking attempts. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const uploadLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Too many upload requests. Please try again in an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
