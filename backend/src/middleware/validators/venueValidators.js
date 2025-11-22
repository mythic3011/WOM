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

  // Validate layout.sections array
  body("layout.sections")
    .optional()
    .isArray()
    .withMessage("Layout sections must be an array"),

  // Validate horizontal aisles in sections
  body("layout.sections.*.horizontalAisles")
    .optional()
    .isArray()
    .withMessage("Horizontal aisles must be an array"),

  body("layout.sections.*.horizontalAisles.*.afterRow")
    .optional()
    .isString()
    .withMessage("Horizontal aisle afterRow must be a string"),

  body("layout.sections.*.horizontalAisles.*.height")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Horizontal aisle height must be a positive integer"),

  // Validate seat numbering configuration
  body("layout.sections.*.seatNumbering")
    .optional()
    .isObject()
    .withMessage("Seat numbering must be an object"),

  body("layout.sections.*.seatNumbering.globalDirection")
    .optional()
    .isIn(["ltr", "rtl"])
    .withMessage("Global direction must be 'ltr' or 'rtl'"),

  body("layout.sections.*.seatNumbering.startNumber")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Start number must be a positive integer"),

  body("layout.sections.*.seatNumbering.prefix")
    .optional()
    .isString()
    .withMessage("Prefix must be a string"),

  body("layout.sections.*.seatNumbering.suffix")
    .optional()
    .isString()
    .withMessage("Suffix must be a string"),

  body("layout.sections.*.seatNumbering.skipNumbers")
    .optional()
    .isArray()
    .withMessage("Skip numbers must be an array"),

  // Validate per-row overrides
  body("layout.sections.*.rowsConfig")
    .optional()
    .isArray()
    .withMessage("Rows config must be an array"),

  body("layout.sections.*.rowsConfig.*.rowLabel")
    .optional()
    .isString()
    .withMessage("Row label must be a string"),

  body("layout.sections.*.rowsConfig.*.direction")
    .optional()
    .isIn(["ltr", "rtl"])
    .withMessage("Row direction must be 'ltr' or 'rtl'"),

  body("layout.sections.*.rowsConfig.*.pattern")
    .optional()
    .isString()
    .matches(/^[SHE]+$/)
    .withMessage("Pattern must contain only S, H, or E characters"),

  body("layout.sections.*.rowsConfig.*.seatShapes")
    .optional()
    .isArray()
    .withMessage("Seat shapes must be an array"),

  body("layout.sections.*.rowsConfig.*.seatShapes.*.shape")
    .optional()
    .isIn(["standard", "wide", "accessible", "loveseat", "table"])
    .withMessage("Invalid seat shape type"),

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

  // Validate layout.sections array
  body("layout.sections")
    .optional()
    .isArray()
    .withMessage("Layout sections must be an array"),

  // Validate horizontal aisles in sections
  body("layout.sections.*.horizontalAisles")
    .optional()
    .isArray()
    .withMessage("Horizontal aisles must be an array"),

  body("layout.sections.*.horizontalAisles.*.afterRow")
    .optional()
    .isString()
    .withMessage("Horizontal aisle afterRow must be a string"),

  body("layout.sections.*.horizontalAisles.*.height")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Horizontal aisle height must be a positive integer"),

  // Validate seat numbering configuration
  body("layout.sections.*.seatNumbering")
    .optional()
    .isObject()
    .withMessage("Seat numbering must be an object"),

  body("layout.sections.*.seatNumbering.globalDirection")
    .optional()
    .isIn(["ltr", "rtl"])
    .withMessage("Global direction must be 'ltr' or 'rtl'"),

  body("layout.sections.*.seatNumbering.startNumber")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Start number must be a positive integer"),

  body("layout.sections.*.seatNumbering.prefix")
    .optional()
    .isString()
    .withMessage("Prefix must be a string"),

  body("layout.sections.*.seatNumbering.suffix")
    .optional()
    .isString()
    .withMessage("Suffix must be a string"),

  body("layout.sections.*.seatNumbering.skipNumbers")
    .optional()
    .isArray()
    .withMessage("Skip numbers must be an array"),

  // Validate per-row overrides
  body("layout.sections.*.rowsConfig")
    .optional()
    .isArray()
    .withMessage("Rows config must be an array"),

  body("layout.sections.*.rowsConfig.*.rowLabel")
    .optional()
    .isString()
    .withMessage("Row label must be a string"),

  body("layout.sections.*.rowsConfig.*.direction")
    .optional()
    .isIn(["ltr", "rtl"])
    .withMessage("Row direction must be 'ltr' or 'rtl'"),

  body("layout.sections.*.rowsConfig.*.pattern")
    .optional()
    .isString()
    .matches(/^[SHE]+$/)
    .withMessage("Pattern must contain only S, H, or E characters"),

  body("layout.sections.*.rowsConfig.*.seatShapes")
    .optional()
    .isArray()
    .withMessage("Seat shapes must be an array"),

  body("layout.sections.*.rowsConfig.*.seatShapes.*.shape")
    .optional()
    .isIn(["standard", "wide", "accessible", "loveseat", "table"])
    .withMessage("Invalid seat shape type"),

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
