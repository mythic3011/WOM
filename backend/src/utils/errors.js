export class AppError extends Error {
  constructor(message, statusCode = 500, options = {}) {
    super(message);
    this.name = options.name || this.constructor.name;
    this.statusCode = statusCode;
    this.code = options.code;
    this.errors = options.errors;
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", errors = [], code = "VALIDATION_ERROR") {
    super(message, 422, { code, errors, name: "ValidationError" });
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", code = "NOT_FOUND") {
    super(message, 404, { code, name: "NotFoundError" });
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict", code = "CONFLICT") {
    super(message, 409, { code, name: "ConflictError" });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", code = "UNAUTHORIZED") {
    super(message, 401, { code, name: "UnauthorizedError" });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", code = "FORBIDDEN") {
    super(message, 403, { code, name: "ForbiddenError" });
  }
}

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
