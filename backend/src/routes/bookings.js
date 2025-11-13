import express from "express";
import * as bookingController from "../controllers/bookingController.js";
import { validate } from "../middleware/validation.js";
import { isAuthenticated, isAdmin } from "../middleware/auth.js";
import { bookingLimiter } from "../middleware/rateLimiter.js";
import {
  createBookingValidator,
  updateBookingValidator,
  getBookingValidator,
  cancelBookingValidator,
  confirmBookingValidator,
  listBookingsValidator,
} from "../middleware/validators/bookingValidators.js";

const router = express.Router();

/**
 * @openapi
 * /api/bookings/stats:
 *   get:
 *     tags: [Bookings]
 *     summary: Get booking statistics
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Booking statistics
 */
router.get("/stats", isAuthenticated, isAdmin, bookingController.getBookingStats);

/**
 * @openapi
 * /api/bookings:
 *   get:
 *     tags: [Bookings]
 *     summary: Get all bookings
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: List of bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 */
router.get(
  "/",
  isAuthenticated,
  listBookingsValidator,
  validate,
  bookingController.getAllBookings
);

/**
 * @openapi
 * /api/bookings/{id}:
 *   get:
 *     tags: [Bookings]
 *     summary: Get booking by ID
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Booking details
 */
router.get(
  "/:id",
  isAuthenticated,
  getBookingValidator,
  validate,
  bookingController.getBookingById
);

/**
 * @openapi
 * /api/bookings:
 *   post:
 *     tags: [Bookings]
 *     summary: Create booking
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingInput'
 *     responses:
 *       201:
 *         description: Booking created
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntity'
 */
router.post(
  "/",
  isAuthenticated,
  bookingLimiter,
  createBookingValidator,
  validate,
  bookingController.createBooking
);

/**
 * @openapi
 * /api/bookings/{id}:
 *   put:
 *     tags: [Bookings]
 *     summary: Update booking
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Booking updated
 */
router.put(
  "/:id",
  isAuthenticated,
  updateBookingValidator,
  validate,
  bookingController.updateBooking
);

/**
 * @openapi
 * /api/bookings/{id}/cancel:
 *   post:
 *     tags: [Bookings]
 *     summary: Cancel booking
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Booking cancelled
 */
router.post(
  "/:id/cancel",
  isAuthenticated,
  cancelBookingValidator,
  validate,
  bookingController.cancelBooking
);

/**
 * @openapi
 * /api/bookings/{id}/confirm:
 *   post:
 *     tags: [Bookings]
 *     summary: Confirm booking
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Booking confirmed
 */
router.post(
  "/:id/confirm",
  isAuthenticated,
  isAdmin,
  confirmBookingValidator,
  validate,
  bookingController.confirmBooking
);

export default router;
