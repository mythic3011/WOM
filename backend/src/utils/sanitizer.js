import sanitizeHtml from "sanitize-html";
import validator from "validator";

export const sanitizeString = (str) => {
  if (!str || typeof str !== "string") {
    return "";
  }
  return validator.escape(validator.trim(str));
};

export const sanitizeEmail = (email) => {
  if (!email || typeof email !== "string") {
    return "";
  }
  return validator.normalizeEmail(email);
};

export const sanitizeHTML = (html, options = {}) => {
  const defaultOptions = {
    allowedTags: ["b", "i", "em", "strong", "a", "p", "br"],
    allowedAttributes: {
      a: ["href", "target"],
    },
    allowedSchemes: ["http", "https"],
    ...options,
  };

  return sanitizeHtml(html, defaultOptions);
};

export const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((value) => {
      if (typeof value === "string") return sanitizeString(value);
      if (typeof value === "object" && value !== null) return sanitizeObject(value);
      return value;
    });
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

export const isValidEmail = (email) => validator.isEmail(email);

export const isValidURL = (url) => validator.isURL(url);

export const isValidPhoneNumber = (phone) => validator.isMobilePhone(phone, "any");

export const isStrongPassword = (password) =>
  validator.isStrongPassword(password, {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 0,
  });

export const normalizeWhitespace = (str) => {
  if (!str || typeof str !== "string") {
    return "";
  }
  return str.replace(/\s+/g, " ").trim();
};

export const stripTags = (str) =>
  sanitizeHtml(str, {
    allowedTags: [],
    allowedAttributes: {},
  });

export default {
  sanitizeString,
  sanitizeEmail,
  sanitizeHTML,
  sanitizeObject,
  isValidEmail,
  isValidURL,
  isValidPhoneNumber,
  isStrongPassword,
  normalizeWhitespace,
  stripTags,
};
