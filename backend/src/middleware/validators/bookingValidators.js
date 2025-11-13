import { body, param, query } from "express-validator";

export const createBookingValidator = [
  body("performanceId")
    .notEmpty()
    .withMessage("Performance ID is required")
    .isInt({ min: 1 })
    .withMessage("Performance ID must be a positive integer"),

  body("showtimeId")
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Showtime ID must not exceed 255 characters"),

  body("seats")
    .notEmpty()
    .withMessage("Seats are required")
    .isArray({ min: 1 })
    .withMessage("At least one seat must be selected"),

  body("amount")
    .notEmpty()
    .withMessage("Amount is required")
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("Amount must be a valid decimal number")
    .custom((value) => {
      if (parseFloat(value) <= 0) {
        throw new Error("Amount must be greater than 0");
      }
      return true;
    }),

  body("paymentMethod")
    .optional()
    .isIn(["credit_card", "debit_card", "paypal", "bank_transfer", "cash"])
    .withMessage("Invalid payment method"),

  body("customerInfo")
    .optional()
    .isObject()
    .withMessage("Customer info must be an object"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Notes must not exceed 1000 characters"),
];

export const updateBookingValidator = [
  param("id").isInt({ min: 1 }).withMessage("Invalid booking ID"),

  body("status")
    .optional()
    .isIn(["pending", "confirmed", "cancelled", "completed"])
    .withMessage("Invalid status"),

  body("paymentStatus")
    .optional()
    .isIn(["pending", "paid", "failed", "refunded"])
    .withMessage("Invalid payment status"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Notes must not exceed 1000 characters"),
];

export const getBookingValidator = [
  param("id").isInt({ min: 1 }).withMessage("Invalid booking ID"),
];

export const deleteBookingValidator = [
  param("id").isInt({ min: 1 }).withMessage("Invalid booking ID"),
];

export const cancelBookingValidator = [
  param("id").isInt({ min: 1 }).withMessage("Invalid booking ID"),
];

export const confirmBookingValidator = [
  param("id").isInt({ min: 1 }).withMessage("Invalid booking ID"),
];

export const listBookingsValidator = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be >= 1"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("status")
    .optional()
    .isIn(["pending", "confirmed", "cancelled", "completed"])
    .withMessage("Invalid status"),

  query("paymentStatus")
    .optional()
    .isIn(["pending", "paid", "failed", "refunded"])
    .withMessage("Invalid payment status"),

  query("userId").optional().isUUID().withMessage("Invalid user ID"),

  query("performanceId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Invalid performance ID"),

  query("search").optional().trim(),
];
