import { body, param, query } from "express-validator";

export const createVenueValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 255 })
    .withMessage("Name must not exceed 255 characters"),

  body("address")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Address must not exceed 500 characters"),

  body("capacity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Capacity must be a non-negative integer"),

  body("facilities").optional().isArray().withMessage("Facilities must be an array"),

  body("layout").optional().isObject().withMessage("Layout must be an object"),

  body("contact")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Contact must not exceed 100 characters"),

  body("status")
    .optional()
    .isIn(["active", "inactive", "maintenance"])
    .withMessage("Invalid status"),
];

export const updateVenueValidator = [
  param("id").isInt({ min: 1 }).withMessage("Invalid venue ID"),

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Name cannot be empty")
    .isLength({ max: 255 })
    .withMessage("Name must not exceed 255 characters"),

  body("address")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Address must not exceed 500 characters"),

  body("capacity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Capacity must be a non-negative integer"),

  body("facilities").optional().isArray().withMessage("Facilities must be an array"),

  body("layout").optional().isObject().withMessage("Layout must be an object"),

  body("contact")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Contact must not exceed 100 characters"),

  body("status")
    .optional()
    .isIn(["active", "inactive", "maintenance"])
    .withMessage("Invalid status"),
];

export const getVenueValidator = [
  param("id").isInt({ min: 1 }).withMessage("Invalid venue ID"),
];

export const deleteVenueValidator = [
  param("id").isInt({ min: 1 }).withMessage("Invalid venue ID"),
];

export const listVenuesValidator = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be >= 1"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("status")
    .optional()
    .isIn(["active", "inactive", "maintenance"])
    .withMessage("Invalid status"),

  query("search").optional().trim(),
];
