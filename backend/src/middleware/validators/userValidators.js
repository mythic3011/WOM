import { body, param, query } from "express-validator";

export const createUserValidator = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),

  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be 3-30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  body("name").trim().notEmpty().withMessage("Name is required"),

  body("role")
    .optional()
    .isIn(["admin", "user"])
    .withMessage("Role must be either admin or user"),

  body("status")
    .optional()
    .isIn(["active", "inactive", "suspended"])
    .withMessage("Invalid status"),

  body("phone").optional().trim().isLength({ max: 20 }),

  body("address").optional().trim().isLength({ max: 500 }),

  body("birthday").optional().isDate().withMessage("Birthday must be a valid date"),

  body("gender")
    .optional()
    .isIn(["male", "female", "prefer_not_to_say"])
    .withMessage("Invalid gender"),
];

export const updateUserValidator = [
  param("id").isUUID().withMessage("Invalid user ID"),

  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),

  body("username")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Username cannot be empty")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be 3-30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),

  body("password")
    .optional()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),

  body("role")
    .optional()
    .isIn(["admin", "user"])
    .withMessage("Role must be either admin or user"),

  body("status")
    .optional()
    .isIn(["active", "inactive", "suspended"])
    .withMessage("Invalid status"),

  body("phone").optional().trim().isLength({ max: 20 }),

  body("address").optional().trim().isLength({ max: 500 }),

  body("birthday").optional().isDate().withMessage("Birthday must be a valid date"),

  body("gender")
    .optional()
    .isIn(["male", "female", "prefer_not_to_say"])
    .withMessage("Invalid gender"),
];

export const getUserValidator = [param("id").isUUID().withMessage("Invalid user ID")];

export const deleteUserValidator = [
  param("id").isUUID().withMessage("Invalid user ID"),
];

export const selfDeleteValidator = [
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

export const listUsersValidator = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be >= 1"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("role")
    .optional()
    .isIn(["admin", "user"])
    .withMessage("Role must be either admin or user"),

  query("status")
    .optional()
    .isIn(["active", "inactive", "suspended"])
    .withMessage("Invalid status"),

  query("search").optional().trim(),
];
