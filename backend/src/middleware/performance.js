import logger from "#config/logger.js";

export const performanceMonitor = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    if (duration > 1000) {
      logger.warn("Slow request detected", {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration}ms`,
        statusCode: res.statusCode,
      });
    }

    logger.debug("Request completed", {
      method: req.method,
      url: req.originalUrl,
      duration: `${duration}ms`,
      statusCode: res.statusCode,
    });
  });

  next();
};
