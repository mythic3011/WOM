import { sanitizeObject, sanitizeString } from "#utils/sanitizer.js";

export const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }
  next();
};

export const sanitizeQuery = (req, res, next) => {
  if (req.query && typeof req.query === "object") {
    Object.keys(req.query).forEach((key) => {
      if (typeof req.query[key] === "string") {
        req.query[key] = sanitizeString(req.query[key]);
      }
    });
  }
  next();
};

export const sanitizeParams = (req, res, next) => {
  if (req.params && typeof req.params === "object") {
    Object.keys(req.params).forEach((key) => {
      if (typeof req.params[key] === "string") {
        req.params[key] = sanitizeString(req.params[key]);
      }
    });
  }
  next();
};

export const sanitizeAll = (req, res, next) => {
  sanitizeBody(req, res, () => {
    sanitizeQuery(req, res, () => {
      sanitizeParams(req, res, next);
    });
  });
};
