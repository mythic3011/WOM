import Joi from "joi";
import {
  validateVenueLayoutSemantic,
  validatePricingLinkage,
} from "./validation/seatLayoutValidation.js";

const startRowSchema = Joi.string()
  .pattern(/^[A-Za-z]{1,3}$/)
  .optional();

const seatNumberingSchema = Joi.object({
  globalDirection: Joi.string().valid("L_TO_R", "R_TO_L").default("L_TO_R"),
  startNumber: Joi.number().integer().min(1).max(500).default(1),
  prefix: Joi.string().max(5).allow(""),
  suffix: Joi.string().max(5).allow(""),
  skipNumbers: Joi.array().items(Joi.number().integer().min(1).max(500)).unique(),
  skipSeatIndices: Joi.array().items(Joi.number().integer().min(0)).unique(),
});

const aisleSchema = Joi.object({
  type: Joi.string().valid("vertical", "horizontal").required(),
  mode: Joi.when("type", {
    is: "vertical",
    then: Joi.string().valid("afterSeat").required(),
    otherwise: Joi.string().valid("afterRow").required(),
  }),
  position: Joi.number().integer().min(0).required(),
  width: Joi.number().min(0.5).max(10).required(),
  label: Joi.string().max(8).optional(),
});

const rowConfigSchema = Joi.object({
  rowLabel: Joi.string().required(),
  direction: Joi.string().valid("L_TO_R", "R_TO_L").optional(),
  startNumber: Joi.number().integer().min(1).max(500).optional(),
  prefix: Joi.string().max(5).allow("").optional(),
  suffix: Joi.string().max(5).allow("").optional(),
  skipNumbers: Joi.array()
    .items(Joi.number().integer().min(1).max(500))
    .unique()
    .optional(),
  skipSeatIndices: Joi.array().items(Joi.number().integer().min(0)).unique().optional(),
  paddingStart: Joi.number().min(0).max(20).default(0),
  paddingEnd: Joi.number().min(0).max(20).default(0),
  emptySeatIndices: Joi.array()
    .items(Joi.number().integer().min(0))
    .unique()
    .optional(),
});

const sectionSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  tier: Joi.string().max(30).optional(),
  rows: Joi.number().integer().min(1).max(200).required(),
  seatsPerRow: Joi.number().integer().min(1).max(200).required(),
  startRow: startRowSchema,
  seatNumbering: seatNumberingSchema.optional(),
  aisles: Joi.array().items(aisleSchema).optional(),
  rowsConfig: Joi.array().items(rowConfigSchema).optional(),
});

const venueLayoutSchema = Joi.object({
  sections: Joi.array().items(sectionSchema).min(1).required(),
  globalAisles: Joi.array().items(aisleSchema).default([]).optional(),
}).external(validateVenueLayoutSemantic);

const pricingSectionSchema = Joi.object({
  sectionName: Joi.string().min(2).max(100).required(),
  sectionCode: Joi.string().alphanum().min(1).max(10).required(),
  basePrice: Joi.number().integer().min(0).required(),
  tier: Joi.string().max(30).optional(),
  rows: Joi.number().integer().min(1).max(300).optional(),
  seatsPerRow: Joi.number().integer().min(1).max(400).optional(),
}).external(validatePricingLinkage);

export const userSchemas = {
  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required().messages({
      "string.alphanum": "Username must only contain alphanumeric characters",
      "string.min": "Username must be at least 3 characters long",
      "string.max": "Username cannot exceed 30 characters",
      "any.required": "Username is required",
    }),
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
    password: Joi.string().min(8).required().messages({
      "string.min": "Password must be at least 8 characters long",
      "any.required": "Password is required",
    }),
    name: Joi.string().min(2).max(100).required().messages({
      "string.min": "Name must be at least 2 characters long",
      "string.max": "Name cannot exceed 100 characters",
      "any.required": "Name is required",
    }),
    title: Joi.string().valid("Mr.", "Mrs.", "Ms.", "Dr.", "Prof.").optional(),
    birthday: Joi.date().max("now").optional().messages({
      "date.max": "Birthday cannot be in the future",
    }),
    gender: Joi.string().valid("male", "female", "prefer_not_to_say").optional(),
    phone: Joi.string()
      .pattern(/^[0-9]{8,20}$/)
      .optional()
      .messages({
        "string.pattern.base": "Phone number must be 8-20 digits",
      }),
    address: Joi.string().max(500).optional(),
  }),

  update: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).optional(),
    email: Joi.string().email().optional(),
    name: Joi.string().min(2).max(100).optional(),
    title: Joi.string().valid("Mr.", "Mrs.", "Ms.", "Dr.", "Prof.").optional(),
    birthday: Joi.date().max("now").optional(),
    gender: Joi.string().valid("male", "female", "prefer_not_to_say").optional(),
    phone: Joi.string()
      .pattern(/^[0-9]{8,20}$/)
      .optional(),
    address: Joi.string().max(500).optional(),
    profileImage: Joi.string().uri().optional().allow(null),
  }),

  login: Joi.object({
    username: Joi.string().optional(),
    email: Joi.string().email().optional(),
    password: Joi.string().required().messages({
      "any.required": "Password is required",
    }),
  })
    .xor("username", "email")
    .messages({
      "object.missing": "Either username or email is required",
      "object.xor": "Provide either username or email, not both",
    }),
};

export const performanceSchemas = {
  create: Joi.object({
    title: Joi.string().min(2).max(200).required().messages({
      "string.min": "Title must be at least 2 characters long",
      "any.required": "Title is required",
    }),
    composer: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(2000).optional().allow(""),
    venueId: Joi.number().integer().positive().required(),
    date: Joi.date().min("now").required().messages({
      "date.min": "Performance date cannot be in the past",
    }),
    duration: Joi.number().integer().min(1).max(600).optional(),
    category: Joi.string().max(50).optional(),
    subcategory: Joi.string().max(50).optional(),
    status: Joi.string()
      .valid(
        "upcoming",
        "on_sale",
        "sold_out",
        "early_bird",
        "pre_order",
        "completed",
        "cancelled"
      )
      .optional(),
    orchestra: Joi.string().max(100).optional(),
    conductor: Joi.string().max(100).optional(),
    soloists: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().required(),
          instrument: Joi.string().required(),
        })
      )
      .optional(),
    program: Joi.array().items(Joi.object()).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    ageRestriction: Joi.string().max(10).optional().allow(null),
    dresscode: Joi.string().max(50).optional(),
    pricingSections: Joi.array().items(pricingSectionSchema).min(1).optional(),
  }),

  update: Joi.object({
    title: Joi.string().min(2).max(200).optional(),
    composer: Joi.string().min(2).max(100).optional(),
    description: Joi.string().max(2000).optional().allow(""),
    venueId: Joi.number().integer().positive().optional(),
    date: Joi.date().min("now").optional(),
    duration: Joi.number().integer().min(1).max(600).optional(),
    category: Joi.string().max(50).optional(),
    subcategory: Joi.string().max(50).optional(),
    status: Joi.string()
      .valid(
        "upcoming",
        "on_sale",
        "sold_out",
        "early_bird",
        "pre_order",
        "completed",
        "cancelled"
      )
      .optional(),
    orchestra: Joi.string().max(100).optional(),
    conductor: Joi.string().max(100).optional(),
    soloists: Joi.array().items(Joi.object()).optional(),
    program: Joi.array().items(Joi.object()).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    ageRestriction: Joi.string().max(10).optional().allow(null),
    dresscode: Joi.string().max(50).optional(),
    pricingSections: Joi.array().items(pricingSectionSchema).min(1).optional(),
  }),
};

export const bookingSchemas = {
  create: Joi.object({
    performanceId: Joi.number().integer().positive().required(),
    showtimeId: Joi.string().required(),
    seats: Joi.array()
      .items(
        Joi.alternatives().try(
          Joi.string(),
          Joi.object({
            seatId: Joi.string().optional(),
            fullId: Joi.string().optional(),
            section: Joi.string().optional(),
            row: Joi.string().optional(),
            number: Joi.number().integer().optional(),
            price: Joi.number().positive().optional(),
            ticketType: Joi.string().optional(),
          })
        )
      )
      .min(1)
      .required()
      .messages({
        "array.min": "At least one seat must be selected",
      }),
    paymentMethod: Joi.string()
      .valid("credit_card", "ailpay", "wechat", "paypal", "bank_transfer", "cash")
      .optional(),
    customerInfo: Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      phone: Joi.string().required(),
    }).optional(),
    notes: Joi.string().max(1000).optional().allow(""),
  }),

  update: Joi.object({
    status: Joi.string()
      .valid("pending", "confirmed", "cancelled", "completed")
      .optional(),
    paymentStatus: Joi.string()
      .valid("pending", "paid", "failed", "refunded")
      .optional(),
    paymentMethod: Joi.string()
      .valid("credit_card", "ailpay", "wechat", "paypal", "bank_transfer", "cash")
      .optional(),
    notes: Joi.string().max(1000).optional().allow(""),
  }),
};

export const venueSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(200).required(),
    address: Joi.string().max(500).optional().allow(""),
    capacity: Joi.number().integer().positive().optional(),
    facilities: Joi.array().items(Joi.string()).optional(),
    layout: venueLayoutSchema.optional(),
    contact: Joi.string().max(100).optional().allow(""),
    status: Joi.string().valid("active", "inactive", "maintenance").optional(),
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(200).optional(),
    address: Joi.string().max(500).optional().allow(""),
    capacity: Joi.number().integer().positive().optional(),
    facilities: Joi.array().items(Joi.string()).optional(),
    layout: venueLayoutSchema.optional(),
    contact: Joi.string().max(100).optional().allow(""),
    status: Joi.string().valid("active", "inactive", "maintenance").optional(),
  }),
};

export const validateWithJoi = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message,
    }));

    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  req.validatedBody = value;
  next();
};

export default {
  userSchemas,
  performanceSchemas,
  bookingSchemas,
  venueSchemas,
  validateWithJoi,
};
