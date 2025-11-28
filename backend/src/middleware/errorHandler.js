import logger from "#config/logger.js";
import { AppError } from "#utils/errors.js";
import EnvironmentValidator from "#config/EnvironmentValidator.js";

const validator = new EnvironmentValidator();

const sanitizeErrorMessage = (message) => {
  const sensitiveKeys = validator.schema.sensitive;
  let sanitized = message;
  
  for (const key of sensitiveKeys) {
    const value = process.env[key];
    if (value) {
      const regex = new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      sanitized = sanitized.replace(regex, "***");
    }
  }
  
  return sanitized;
};

const sanitizeStack = (stack) => {
  if (!stack) {
    return stack;
  }
  return sanitizeErrorMessage(stack);
};

export const errorHandler = (err, req, res, _next) => {
  const sanitizedMessage = sanitizeErrorMessage(err.message);
  const sanitizedStack = sanitizeStack(err.stack);
  
  logger.error("Error:", {
    message: sanitizedMessage,
    stack: sanitizedStack,
    url: req.originalUrl,
    method: req.method,
    name: err.name,
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: sanitizeErrorMessage(err.message),
      ...(err.code ? { code: err.code } : {}),
      ...(err.errors ? { errors: err.errors } : {}),
    });
  }

  if (err.name === "SequelizeValidationError") {
    const errors = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));

    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors,
    });
  }

  if (err.name === "SequelizeUniqueConstraintError") {
    const field = err.errors[0]?.path || "field";
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  if (err.name === "SequelizeForeignKeyConstraintError") {
    return res.status(400).json({
      success: false,
      message: "Invalid reference to related resource",
    });
  }

  const statusCode = err.statusCode || 500;
  const message = sanitizeErrorMessage(err.message || "Internal server error");

  res.status(statusCode).json({
    success: false,
    message,
    ...(err.code ? { code: err.code } : {}),
    ...(err.errors ? { errors: err.errors } : {}),
    ...(process.env.NODE_ENV === "development" && { stack: sanitizedStack }),
  });
};

export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};
