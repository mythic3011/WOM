import express from "express";
import * as bookingController from "#controllers/bookingController.js";
import { validate } from "#middleware/validation.js";
import { isAuthenticated, isAdmin } from "#middleware/auth.js";
import { bookingLimiter } from "#middleware/rateLimiter.js";
import {
  createBookingValidator,
  updateBookingValidator,
  getBookingValidator,
  cancelBookingValidator,
  confirmBookingValidator,
  listBookingsValidator,
} from "#middleware/validators/bookingValidators.js";

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
 *     description: |
 *       Retrieves a list of bookings. Users see their own bookings, admins see all bookings.
 *       
 *       **⚠️ NEW: All bookings include seatTickets field**
 *       - Optimized data structure for better performance
 *       - Legacy `seats` field included during transition period
 *       - Use `seatTickets` for new implementations
 *       
 *       **Filtering:**
 *       - Filter by status, performance, date range
 *       - Query by ticket type using JSONB operators
 *       
 *       **Pagination:**
 *       - Default: 20 bookings per page
 *       - Use `page` and `limit` query parameters
 *       
 *       **Authorization:**
 *       - Users see only their own bookings
 *       - Admins see all bookings with additional filters
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, cancelled]
 *         description: Filter by booking status
 *       - in: query
 *         name: performanceId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by performance ID
 *     responses:
 *       200:
 *         description: List of bookings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
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
 *     description: |
 *       Retrieves detailed information about a specific booking.
 *       
 *       **⚠️ NEW: Response includes seatTickets field**
 *       - All bookings now include optimized `seatTickets` array
 *       - Legacy `seats` field included during transition period (until Q2 2025)
 *       - Prioritize `seatTickets` in your application
 *       
 *       **Authorization:**
 *       - Users can view their own bookings
 *       - Admins can view any booking
 *       
 *       **Response Format:**
 *       - Includes booking details, seat assignments, and ticket types
 *       - Each seat has explicit ticket type association
 *       - Prices include both final price and base price (for discount calculation)
 *       
 *       **Deprecation Notice:**
 *       - The `seats` field is deprecated and will be removed in v2.0 (Q2 2025)
 *       - Migrate to `seatTickets` format as soon as possible
 *       - See migration guide: /docs/API_MIGRATION_GUIDE.md
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Booking ID
 *         example: "990e8400-e29b-41d4-a716-446655440005"
 *     responses:
 *       200:
 *         description: Booking details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *             examples:
 *               newFormat:
 *                 $ref: '#/components/examples/BookingResponse'
 *               withLegacyField:
 *                 $ref: '#/components/examples/BookingResponseLegacy'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
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
 *     summary: Create new booking
 *     description: |
 *       Creates a new ticket booking for a performance. Validates seat availability and processes the reservation.
 *       
 *       **⚠️ NEW: Optimized Data Structure**
 *       - Use `seatTickets` array instead of legacy `seats` format
 *       - Provides explicit ticket type associations
 *       - 22% more storage efficient
 *       - See migration guide: /docs/API_MIGRATION_GUIDE.md
 *       
 *       **Authentication Required:**
 *       - Must be logged in to create bookings
 *       
 *       **Rate Limiting:**
 *       - Maximum 10 booking attempts per 15 minutes per user
 *       - Prevents booking spam and abuse
 *       - Only failed attempts count toward limit
 *       
 *       **Booking Process:**
 *       1. Validate performance and showtime exist
 *       2. Check seat availability
 *       3. Verify no double-booking
 *       4. Calculate total amount from seatTickets
 *       5. Create booking record with seatTickets
 *       6. Mark seats as reserved
 *       7. Generate booking reference
 *       
 *       **Seat-Ticket Selection (NEW FORMAT):**
 *       - Each seat must include: seatId, seatLabel, ticketTypeId, ticketTypeName, price
 *       - Optional fields: basePrice (for discount tracking), section, row
 *       - Seat ID format: {section}-{row}-{number} (e.g., "orchestra-A-12")
 *       - All seats must be available
 *       - Seats are held for 15 minutes
 *       
 *       **Ticket Types:**
 *       - Each seat can have a different ticket type (Adult, Student, Senior, etc.)
 *       - Prices are calculated per seat based on ticket type
 *       - Discounts tracked via basePrice field
 *       
 *       **Payment:**
 *       - Booking created in pending status
 *       - Payment processed separately
 *       - Use POST /api/bookings/{id}/confirm after payment
 *       
 *       **Validation:**
 *       - Performance must be in future
 *       - Seats must exist and be available
 *       - Ticket types must be valid
 *       - Total amount must match sum of seat prices
 *       - User cannot exceed booking limits
 *       
 *       **Backward Compatibility:**
 *       - Legacy `seats` format still supported until Q2 2025
 *       - Responses include both formats during transition
 *       - New bookings should use `seatTickets` format
 *       
 *       **Related Endpoints:**
 *       - GET /api/performances/{id}/availability - Check availability first
 *       - GET /api/ticket-types - Get available ticket types
 *       - POST /api/bookings/{id}/confirm - Confirm after payment
 *       - POST /api/bookings/{id}/cancel - Cancel booking
 *     x-rate-limit:
 *       window: 15 minutes
 *       max: 10
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingInput'
 *           examples:
 *             newFormat:
 *               summary: New seatTickets format (recommended)
 *               value:
 *                 performanceId: "770e8400-e29b-41d4-a716-446655440002"
 *                 showtimeId: "show-001"
 *                 seatTickets:
 *                   - seatId: "orchestra-A-12"
 *                     seatLabel: "A12"
 *                     ticketTypeId: "adult"
 *                     ticketTypeName: "Adult"
 *                     price: 600.00
 *                     basePrice: 600.00
 *                     section: "orchestra"
 *                     row: "A"
 *                   - seatId: "orchestra-A-13"
 *                     seatLabel: "A13"
 *                     ticketTypeId: "student"
 *                     ticketTypeName: "Student"
 *                     price: 420.00
 *                     basePrice: 600.00
 *                     section: "orchestra"
 *                     row: "A"
 *                 paymentMethod: "credit_card"
 *                 customerInfo:
 *                   name: "John Doe"
 *                   email: "john.doe@example.com"
 *                   phone: "+852 9123 4567"
 *             mixedTicketTypes:
 *               summary: Booking with multiple ticket types
 *               value:
 *                 performanceId: "770e8400-e29b-41d4-a716-446655440004"
 *                 showtimeId: "show-003"
 *                 seatTickets:
 *                   - seatId: "balcony-C-5"
 *                     seatLabel: "C5"
 *                     ticketTypeId: "adult"
 *                     ticketTypeName: "Adult"
 *                     price: 500.00
 *                     section: "balcony"
 *                     row: "C"
 *                   - seatId: "balcony-C-6"
 *                     seatLabel: "C6"
 *                     ticketTypeId: "student"
 *                     ticketTypeName: "Student"
 *                     price: 350.00
 *                     basePrice: 500.00
 *                     section: "balcony"
 *                     row: "C"
 *                   - seatId: "balcony-C-7"
 *                     seatLabel: "C7"
 *                     ticketTypeId: "senior"
 *                     ticketTypeName: "Senior"
 *                     price: 400.00
 *                     basePrice: 500.00
 *                     section: "balcony"
 *                     row: "C"
 *                 paymentMethod: "bank_transfer"
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Booking'
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/BookingResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntity'
 *       429:
 *         description: Too many booking attempts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Too many booking attempts. Please try again in 15 minutes.
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
 *     description: |
 *       Cancels an existing booking and releases the reserved seats. Users can cancel their own bookings, admins can cancel any booking.
 *       
 *       **Authorization:**
 *       - Users can cancel their own bookings
 *       - Admins can cancel any booking
 *       
 *       **Cancellation Policy:**
 *       - Bookings can be cancelled up to 24 hours before performance
 *       - Refund policy applies based on cancellation time
 *       - Seats are immediately released for rebooking
 *       
 *       **Related Endpoints:**
 *       - GET /api/bookings/{id} - View booking details
 *       - POST /api/bookings - Create new booking
 *     x-rate-limit:
 *       window: 15 minutes
 *       max: 10
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Booking ID to cancel
 *         example: 990e8400-e29b-41d4-a716-446655440005
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Booking cancelled successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
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
 *     summary: Confirm booking payment (Admin only)
 *     description: |
 *       Confirms a booking after payment verification. Admin only. Updates booking and payment status.
 *       
 *       **Admin Only:**
 *       - Requires authentication with admin role
 *       - Used after manual payment verification
 *       
 *       **Process:**
 *       1. Verify booking exists and is in pending status
 *       2. Validate payment information
 *       3. Update booking status to confirmed
 *       4. Update payment status to paid
 *       5. Send confirmation email to user
 *       
 *       **Related Endpoints:**
 *       - GET /api/bookings/{id} - View booking details
 *       - POST /api/bookings - Create booking
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Booking ID to confirm
 *         example: 990e8400-e29b-41d4-a716-446655440005
 *     responses:
 *       200:
 *         description: Booking confirmed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Booking confirmed successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
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
