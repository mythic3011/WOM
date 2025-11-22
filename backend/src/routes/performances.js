import express from "express";
import * as performanceController from "#controllers/performanceController.js";
import { validate } from "#middleware/validation.js";
import { isAuthenticated, isAdmin, optionalAuth } from "#middleware/auth.js";
import {
  createPerformanceValidator,
  updatePerformanceValidator,
  getPerformanceValidator,
  deletePerformanceValidator,
  listPerformancesValidator,
} from "#middleware/validators/performanceValidators.js";

const router = express.Router();

/**
 * @openapi
 * /api/performances:
 *   get:
 *     tags: [Performances]
 *     summary: Get all performances with optional filtering
 *     description: |
 *       Retrieves a list of all orchestral performances. Supports filtering by status and text search. This endpoint is public and does not require authentication.
 *       
 *       **Public Access:**
 *       - No authentication required
 *       - Returns all publicly visible performances
 *       - Suitable for public-facing performance listings
 *       
 *       **Filtering Options:**
 *       - **status**: Filter by ticket availability status
 *         - `on_sale`: Tickets currently available for purchase
 *         - `upcoming`: Future performances not yet on sale
 *         - `sold_out`: All tickets sold
 *         - `early_bird`: Early bird pricing available
 *         - `pre_order`: Pre-order phase
 *       - **search**: Text search across title, composer, conductor, orchestra
 *       
 *       **Use Cases:**
 *       - Public performance browsing
 *       - Homepage performance listings
 *       - Search functionality
 *       - Performance discovery
 *       
 *       **Performance:**
 *       - Results may be cached for better performance
 *       - Consider pagination for large result sets
 *       
 *       **Related Endpoints:**
 *       - GET /api/performances/{id} - Get specific performance details
 *       - GET /api/performances/{id}/availability - Check seat availability
 *       - POST /api/performances - Create performance (admin)
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [on_sale, upcoming, sold_out, early_bird, pre_order]
 *         description: Filter by ticket availability status
 *         example: on_sale
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search text for title, composer, conductor, or orchestra
 *         example: Beethoven
 *     responses:
 *       200:
 *         description: List of performances retrieved successfully
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
 *                     $ref: '#/components/schemas/Performance'
 *             examples:
 *               allPerformances:
 *                 $ref: '#/components/examples/PerformanceListResponse'
 *               filteredByStatus:
 *                 summary: Performances filtered by status
 *                 value:
 *                   success: true
 *                   data:
 *                     - id: 770e8400-e29b-41d4-a716-446655440002
 *                       title: Symphony No. 9 in D minor
 *                       composer: Ludwig van Beethoven
 *                       status: on_sale
 *                       date: '2025-12-15T19:30:00Z'
 *               searchResults:
 *                 summary: Search results for "Beethoven"
 *                 value:
 *                   success: true
 *                   data:
 *                     - id: 770e8400-e29b-41d4-a716-446655440002
 *                       title: Symphony No. 9 in D minor
 *                       composer: Ludwig van Beethoven
 *                       date: '2025-12-15T19:30:00Z'
 */
router.get(
  "/",
  optionalAuth,
  listPerformancesValidator,
  validate,
  performanceController.getAllPerformances
);

/**
 * @openapi
 * /api/performances/{id}:
 *   get:
 *     tags: [Performances]
 *     summary: Get performance details by ID
 *     description: |
 *       Retrieves complete details for a specific orchestral performance including venue information, showtimes, and availability. Public endpoint.
 *       
 *       **Public Access:**
 *       - No authentication required
 *       - Returns full performance details
 *       
 *       **Returned Information:**
 *       - Performance metadata (title, composer, conductor, orchestra)
 *       - Venue details and location
 *       - All showtimes with availability
 *       - Pricing information
 *       - Performance status and category
 *       
 *       **Use Cases:**
 *       - Performance detail page
 *       - Booking flow initialization
 *       - Performance information display
 *       
 *       **Related Endpoints:**
 *       - GET /api/performances/{id}/availability - Detailed seat availability
 *       - GET /api/performances/{id}/seatmap - Visual seat map
 *       - POST /api/bookings - Create booking for this performance
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Performance unique identifier
 *         example: 770e8400-e29b-41d4-a716-446655440002
 *     responses:
 *       200:
 *         description: Performance details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Performance'
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/PerformanceResponse'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  "/:id",
  optionalAuth,
  getPerformanceValidator,
  validate,
  performanceController.getPerformanceById
);

/**
 * @openapi
 * /api/performances:
 *   post:
 *     tags: [Performances]
 *     summary: Create new performance (Admin only)
 *     description: |
 *       Creates a new orchestral performance with venue, date, and showtime information. Admin only.
 *       
 *       **Admin Only:**
 *       - Requires authentication with admin role
 *       - Creates performance with initial seat map
 *       
 *       **Required Information:**
 *       - Title and composer (minimum)
 *       - Venue ID (must exist)
 *       - Performance date and time
 *       
 *       **Automatic Processing:**
 *       - Seat map generated from venue layout
 *       - Showtimes initialized
 *       - Status set to appropriate value
 *       
 *       **Validation:**
 *       - Venue must exist and be active
 *       - Date must be in the future
 *       - No overlapping performances at same venue
 *       
 *       **Related Endpoints:**
 *       - PUT /api/performances/{id} - Update performance
 *       - POST /api/performances/{id}/rebuild-seatmap - Regenerate seat map
 *       - GET /api/venues - List available venues
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PerformanceInput'
 *     responses:
 *       201:
 *         description: Performance created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Performance'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntity'
 */
router.post(
  "/",
  isAuthenticated,
  isAdmin,
  createPerformanceValidator,
  validate,
  performanceController.createPerformance
);

/**
 * @openapi
 * /api/performances/{id}:
 *   put:
 *     tags: [Performances]
 *     summary: Update performance details (Admin only)
 *     description: |
 *       Updates performance information. Admin only. Be cautious when updating performances with existing bookings.
 *       
 *       **Admin Only:**
 *       - Requires authentication with admin role
 *       
 *       **Updatable Fields:**
 *       - Title, composer, conductor, orchestra
 *       - Date and duration
 *       - Status and category
 *       - Image and description
 *       
 *       **Booking Impact:**
 *       - Changing date/venue affects existing bookings
 *       - Consider notifying users of changes
 *       - Seat map may need rebuilding after venue change
 *       
 *       **Validation:**
 *       - Cannot change to past date
 *       - Venue must exist if changed
 *       - No overlapping performances if date/venue changed
 *       
 *       **Related Endpoints:**
 *       - POST /api/performances/{id}/rebuild-seatmap - Rebuild after venue change
 *       - GET /api/bookings - Check existing bookings
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Performance ID to update
 *         example: 770e8400-e29b-41d4-a716-446655440002
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PerformanceInput'
 *     responses:
 *       200:
 *         description: Performance updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Performance'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntity'
 */
router.put(
  "/:id",
  isAuthenticated,
  isAdmin,
  updatePerformanceValidator,
  validate,
  performanceController.updatePerformance
);

/**
 * @openapi
 * /api/performances/{id}:
 *   delete:
 *     tags: [Performances]
 *     summary: Delete performance (Admin only)
 *     description: |
 *       Permanently deletes a performance. Use with caution if bookings exist.
 *       
 *       **Admin Only:**
 *       - Requires authentication with admin role
 *       
 *       **Cascade Behavior:**
 *       - Associated bookings are cancelled
 *       - Seat map is removed
 *       - Cannot be undone
 *       
 *       **Safety Recommendations:**
 *       - Check for existing bookings first
 *       - Consider cancelling performance instead of deleting
 *       - Notify users if bookings exist
 *       - Implement soft delete for data retention
 *       
 *       **Related Endpoints:**
 *       - GET /api/bookings - Check for existing bookings
 *       - PUT /api/performances/{id} - Update status to cancelled instead
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Performance ID to delete
 *         example: 770e8400-e29b-41d4-a716-446655440002
 *     responses:
 *       200:
 *         description: Performance deleted successfully
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
 *                   example: Performance deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete(
  "/:id",
  isAuthenticated,
  isAdmin,
  deletePerformanceValidator,
  validate,
  performanceController.deletePerformance
);

/**
 * @openapi
 * /api/performances/{id}/availability:
 *   get:
 *     tags: [Performances]
 *     summary: Get detailed seat availability
 *     description: |
 *       Retrieves detailed seat availability information for a performance, including available seats by section, row, and pricing tier.
 *       
 *       **Public Access:**
 *       - No authentication required
 *       - Real-time availability data
 *       
 *       **Returned Information:**
 *       - Total available seats
 *       - Availability by section
 *       - Availability by ticket type
 *       - Pricing information
 *       - Seat map metadata
 *       
 *       **Use Cases:**
 *       - Booking flow seat selection
 *       - Availability display
 *       - Pricing calculation
 *       - Seat recommendation
 *       
 *       **Performance:**
 *       - May be cached with short TTL
 *       - Refreshed after each booking
 *       
 *       **Related Endpoints:**
 *       - GET /api/performances/{id}/seatmap - Visual seat map
 *       - POST /api/bookings - Create booking
 *       - GET /api/performances/{id} - Performance details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Performance ID
 *         example: 770e8400-e29b-41d4-a716-446655440002
 *     responses:
 *       200:
 *         description: Seat availability retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalSeats:
 *                       type: integer
 *                       example: 2019
 *                     availableSeats:
 *                       type: integer
 *                       example: 1543
 *                     sections:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           available:
 *                             type: integer
 *                           total:
 *                             type: integer
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  "/:id/availability",
  optionalAuth,
  getPerformanceValidator,
  validate,
  performanceController.getPerformanceAvailability
);

/**
 * @openapi
 * /api/performances/{id}/seatmap:
 *   get:
 *     tags: [Performances]
 *     summary: Get visual seat map
 *     description: |
 *       Retrieves the complete seat map for a performance with seat status (available, booked, reserved). Used for visual seat selection.
 *       
 *       **Public Access:**
 *       - No authentication required
 *       - Returns complete seat map with status
 *       
 *       **Returned Information:**
 *       - Seat layout by section and row
 *       - Seat status for each seat
 *       - Pricing tier for each seat
 *       - Aisle and gap information
 *       
 *       **Use Cases:**
 *       - Interactive seat selection UI
 *       - Visual availability display
 *       - Seat map rendering
 *       
 *       **Related Endpoints:**
 *       - GET /api/performances/{id}/availability - Availability summary
 *       - POST /api/bookings - Book selected seats
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Performance ID
 *         example: 770e8400-e29b-41d4-a716-446655440002
 *     responses:
 *       200:
 *         description: Seat map retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  "/:id/seatmap",
  optionalAuth,
  getPerformanceValidator,
  validate,
  performanceController.getPerformanceSeatMap
);

/**
 * @openapi
 * /api/performances/{id}/rebuild-seatmap:
 *   post:
 *     tags: [Performances]
 *     summary: Rebuild performance seat map (Admin only)
 *     description: |
 *       Regenerates the seat map for a performance from the venue layout. Use after venue changes or seat map corruption.
 *       
 *       **Admin Only:**
 *       - Requires authentication with admin role
 *       
 *       **When to Use:**
 *       - After venue layout changes
 *       - Seat map data corruption
 *       - Venue change for performance
 *       - Initial seat map generation failed
 *       
 *       **Caution:**
 *       - Preserves existing bookings
 *       - May affect seat numbering
 *       - Test thoroughly before use on live performances
 *       
 *       **Related Endpoints:**
 *       - GET /api/performances/{id}/seatmap - View current seat map
 *       - PUT /api/venues/{id} - Update venue layout
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Performance ID
 *         example: 770e8400-e29b-41d4-a716-446655440002
 *     responses:
 *       200:
 *         description: Seat map rebuilt successfully
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
 *                   example: Seat map rebuilt successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post(
  "/:id/rebuild-seatmap",
  isAuthenticated,
  isAdmin,
  getPerformanceValidator,
  validate,
  performanceController.rebuildPerformanceSeatMap
);

export default router;
