import { body, param, query } from "express-validator";

export const createPerformanceValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 255 })
    .withMessage("Title must not exceed 255 characters"),

  body("composer")
    .trim()
    .notEmpty()
    .withMessage("Composer is required")
    .isLength({ max: 255 })
    .withMessage("Composer must not exceed 255 characters"),

  body("venueId")
    .notEmpty()
    .withMessage("Venue ID is required")
    .isInt({ min: 1 })
    .withMessage("Venue ID must be a positive integer"),

  body("date")
    .notEmpty()
    .withMessage("Date is required")
    .isISO8601({ strict: false })
    .withMessage("Date must be valid ISO 8601 format")
    .custom((value) => {
      const inputDate = new Date(value);
      const now = new Date();
      
      if (isNaN(inputDate.getTime())) {
        throw new Error("Invalid date format");
      }
      
      const minDate = new Date(now.getTime() - 60000);
      
      if (inputDate < minDate) {
        throw new Error("Date must be in the future");
      }
      
      return true;
    }),

  body("duration")
    .optional()
    .isInt({ min: 1, max: 600 })
    .withMessage("Duration must be between 1 and 600 minutes"),

  body("category").optional().trim().isLength({ max: 100 }),

  body("status")
    .optional()
    .isIn([
      "upcoming",
      "on_sale",
      "sold_out",
      "early_bird",
      "pre_order",
      "completed",
      "cancelled",
    ])
    .withMessage("Invalid status"),

  body("orchestra").optional().trim().isLength({ max: 255 }),

  body("conductor").optional().trim().isLength({ max: 255 }),

  body("soloists").optional().isArray().withMessage("Soloists must be an array"),

  body("program").optional().isArray().withMessage("Program must be an array"),

  body("showtimes").optional().isArray().withMessage("Showtimes must be an array"),

  body("pricingSections")
    .optional()
    .isArray()
    .withMessage("Pricing sections must be an array"),

  // Validate pricing tiers
  body("priceTiers")
    .optional()
    .isArray()
    .withMessage("Price tiers must be an array"),

  body("priceTiers.*.name")
    .optional()
    .isString()
    .withMessage("Price tier name must be a string"),

  body("priceTiers.*.basePrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Base price must be a non-negative number"),

  body("priceTiers.*.tier")
    .optional()
    .isString()
    .withMessage("Tier must be a string"),

  body("priceTiers.*.seatRefs")
    .optional()
    .isArray()
    .withMessage("Seat refs must be an array"),

  body("priceTiers.*.zoneRefs")
    .optional()
    .isArray()
    .withMessage("Zone refs must be an array"),

  // Validate pricing zones
  body("pricingZones")
    .optional()
    .isArray()
    .withMessage("Pricing zones must be an array"),

  body("pricingZones.*.id")
    .optional()
    .isString()
    .withMessage("Zone id must be a string"),

  body("pricingZones.*.name")
    .optional()
    .isString()
    .withMessage("Zone name must be a string"),

  body("pricingZones.*.tier")
    .optional()
    .isString()
    .withMessage("Zone tier must be a string"),

  body("pricingZones.*.sections")
    .optional()
    .isArray()
    .withMessage("Zone sections must be an array"),

  body("pricingZones.*.rows")
    .optional()
    .isArray()
    .withMessage("Zone rows must be an array"),

  body("tags").optional().isArray().withMessage("Tags must be an array"),

  body("totalSeats")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Total seats must be non-negative"),

  body("availableSeats")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Available seats must be non-negative"),
];

export const updatePerformanceValidator = [
  param("id").isInt({ min: 1 }).withMessage("Invalid performance ID"),

  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Title cannot be empty")
    .isLength({ max: 255 }),

  body("composer")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Composer cannot be empty")
    .isLength({ max: 255 }),

  body("venueId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Venue ID must be a positive integer"),

  body("date")
    .optional()
    .isISO8601({ strict: false })
    .withMessage("Invalid date format")
    .custom((value) => {
      if (value) {
        const inputDate = new Date(value);
        if (isNaN(inputDate.getTime())) {
          throw new Error("Invalid date format");
        }
      }
      return true;
    }),

  body("duration")
    .optional()
    .isInt({ min: 1, max: 600 })
    .withMessage("Duration must be between 1 and 600 minutes"),

  body("status")
    .optional()
    .isIn([
      "upcoming",
      "on_sale",
      "sold_out",
      "early_bird",
      "pre_order",
      "completed",
      "cancelled",
    ])
    .withMessage("Invalid status"),

  // Validate pricing tiers
  body("priceTiers")
    .optional()
    .isArray()
    .withMessage("Price tiers must be an array"),

  body("priceTiers.*.name")
    .optional()
    .isString()
    .withMessage("Price tier name must be a string"),

  body("priceTiers.*.basePrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Base price must be a non-negative number"),

  body("priceTiers.*.tier")
    .optional()
    .isString()
    .withMessage("Tier must be a string"),

  body("priceTiers.*.seatRefs")
    .optional()
    .isArray()
    .withMessage("Seat refs must be an array"),

  body("priceTiers.*.zoneRefs")
    .optional()
    .isArray()
    .withMessage("Zone refs must be an array"),

  // Validate pricing zones
  body("pricingZones")
    .optional()
    .isArray()
    .withMessage("Pricing zones must be an array"),

  body("pricingZones.*.id")
    .optional()
    .isString()
    .withMessage("Zone id must be a string"),

  body("pricingZones.*.name")
    .optional()
    .isString()
    .withMessage("Zone name must be a string"),

  body("pricingZones.*.tier")
    .optional()
    .isString()
    .withMessage("Zone tier must be a string"),

  body("pricingZones.*.sections")
    .optional()
    .isArray()
    .withMessage("Zone sections must be an array"),

  body("pricingZones.*.rows")
    .optional()
    .isArray()
    .withMessage("Zone rows must be an array"),
];

export const getPerformanceValidator = [
  param("id").isInt({ min: 1 }).withMessage("Invalid performance ID"),
];

export const deletePerformanceValidator = [
  param("id").isInt({ min: 1 }).withMessage("Invalid performance ID"),
];

export const listPerformancesValidator = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be >= 1"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("status")
    .optional()
    .isIn([
      "upcoming",
      "on_sale",
      "sold_out",
      "early_bird",
      "pre_order",
      "completed",
      "cancelled",
    ])
    .withMessage("Invalid status"),

  query("venueId").optional().isInt({ min: 1 }).withMessage("Invalid venue ID"),

  query("search").optional().trim(),
];
