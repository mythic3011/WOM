/**
 * @file errors.js
 * @description Custom error classes for consistent error handling across the application
 * @author LI Ning 25127563d
 * @author SHEK chinhei 25017482d
 * @see backend/src/middleware/errorHandler.js
 */

/**
 * @class AppError
 * @param {string} message - Error message
 * @param {number} [statusCode=500] - HTTP status code
 * @param {Object} [options={}] - Additional error options
 * @param {string} [options.name] - Error name
 * @param {string} [options.code] - Error code
 * @param {Array} [options.errors] - Validation errors array
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, options = {}) {
    super(message);
    this.name = options.name || this.constructor.name;
    this.statusCode = statusCode;
    this.code = options.code;
    this.errors = options.errors;
  }
}

/**
 * @class ValidationError
 * @param {string} [message="Validation failed"] - Error message
 * @param {Array} [errors=[]] - Array of validation error details
 * @param {string} [code="VALIDATION_ERROR"] - Error code
 */
export class ValidationError extends AppError {
  constructor(message = "Validation failed", errors = [], code = "VALIDATION_ERROR") {
    super(message, 422, { code, errors, name: "ValidationError" });
  }
}

/**
 * @class NotFoundError
 * @param {string} [message="Resource not found"] - Error message
 * @param {string} [code="NOT_FOUND"] - Error code
 */
export class NotFoundError extends AppError {
  constructor(message = "Resource not found", code = "NOT_FOUND") {
    super(message, 404, { code, name: "NotFoundError" });
  }
}

/**
 * @class ConflictError
 * @param {string} [message="Conflict"] - Error message
 * @param {string} [code="CONFLICT"] - Error code
 */
export class ConflictError extends AppError {
  constructor(message = "Conflict", code = "CONFLICT") {
    super(message, 409, { code, name: "ConflictError" });
  }
}

/**
 * @class UnauthorizedError
 * @param {string} [message="Unauthorized"] - Error message
 * @param {string} [code="UNAUTHORIZED"] - Error code
 */
export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", code = "UNAUTHORIZED") {
    super(message, 401, { code, name: "UnauthorizedError" });
  }
}

/**
 * @class ForbiddenError
 * @param {string} [message="Forbidden"] - Error message
 * @param {string} [code="FORBIDDEN"] - Error code
 */
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", code = "FORBIDDEN") {
    super(message, 403, { code, name: "ForbiddenError" });
  }
}

/**
 * @class BadRequestError
 * @param {string} [message="Bad request"] - Error message
 * @param {string} [code="BAD_REQUEST"] - Error code
 */
export class BadRequestError extends AppError {
  constructor(message = "Bad request", code = "BAD_REQUEST") {
    super(message, 400, { code, name: "BadRequestError" });
  }
}

export default {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
};
