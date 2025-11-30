/**
 * @file sanitizer.js
 * @description Input sanitization and validation utilities for security
 * @author LI Ning 25127563d
 * @author SHEK chinhei 25017482d
 * @dependency sanitize-html
 * @dependency validator
 * @see backend/src/middleware/sanitize.js
 */

import sanitizeHtml from "sanitize-html";
import validator from "validator";

/**
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized and trimmed string with HTML entities escaped
 */
export const sanitizeString = (str) => {
  if (!str || typeof str !== "string") {
    return "";
  }
  return validator.escape(validator.trim(str));
};

/**
 * @param {string} email - Email address to normalize
 * @returns {string} Normalized email address in lowercase
 */
export const sanitizeEmail = (email) => {
  if (!email || typeof email !== "string") {
    return "";
  }
  return validator.normalizeEmail(email);
};

/**
 * @param {string} html - HTML string to sanitize
 * @param {Object} [options={}] - Sanitization options
 * @returns {string} Sanitized HTML with only allowed tags and attributes
 */
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

/**
 * @param {Object|Array} obj - Object or array to sanitize recursively
 * @returns {Object|Array} Sanitized object with string values escaped
 */
export const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((value) => {
      if (typeof value === "string") {return sanitizeString(value);}
      if (typeof value === "object" && value !== null) {return sanitizeObject(value);}
      return value;
    });
  }

  const skipSanitizeFields = ['image', 'imageUrl', 'profileImage', 'avatar', 'url', 'link', 'href'];

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      if (skipSanitizeFields.includes(key)) {
        sanitized[key] = value;
      } else {
        sanitized[key] = sanitizeString(value);
      }
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

/**
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email is valid
 */
export const isValidEmail = (email) => validator.isEmail(email);

/**
 * @param {string} url - URL to validate
 * @returns {boolean} True if URL is valid
 */
export const isValidURL = (url) => validator.isURL(url);

/**
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if phone number is valid for any locale
 */
export const isValidPhoneNumber = (phone) => validator.isMobilePhone(phone, "any");

/**
 * @param {string} password - Password to validate
 * @returns {boolean} True if password meets strength requirements (8+ chars, 1 lowercase, 1 uppercase, 1 number)
 */
export const isStrongPassword = (password) =>
  validator.isStrongPassword(password, {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 0,
  });

/**
 * @param {string} str - String to normalize
 * @returns {string} String with normalized whitespace (single spaces, trimmed)
 */
export const normalizeWhitespace = (str) => {
  if (!str || typeof str !== "string") {
    return "";
  }
  return str.replace(/\s+/g, " ").trim();
};

/**
 * @param {string} str - HTML string to strip tags from
 * @returns {string} Plain text with all HTML tags removed
 */
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
