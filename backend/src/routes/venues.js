import express from "express";
import * as venueController from "#controllers/venueController.js";
import { validate } from "#middleware/validation.js";
import { isAuthenticated, isAdmin, optionalAuth } from "#middleware/auth.js";
import {
  createVenueValidator,
  updateVenueValidator,
  getVenueValidator,
  deleteVenueValidator,
  listVenuesValidator,
} from "#middleware/validators/venueValidators.js";

const router = express.Router();

/**
 * @openapi
 * /api/venues:
 *   get:
 *     tags: [Venues]
 *     summary: Get all venues
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, maintenance]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of venues
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Venue'
 */
router.get(
  "/",
  optionalAuth,
  listVenuesValidator,
  validate,
  venueController.getAllVenues
);

/**
 * @openapi
 * /api/venues/{id}:
 *   get:
 *     tags: [Venues]
 *     summary: Get venue by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Venue details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Venue'
 *       404:
 *         description: Venue not found
 */
router.get(
  "/:id",
  optionalAuth,
  getVenueValidator,
  validate,
  venueController.getVenueById
);

/**
 * @openapi
 * /api/venues:
 *   post:
 *     tags: [Venues]
 *     summary: Create new venue (Admin only)
 *     description: |
 *       Creates a new performance venue with layout configuration. Admin only.
 *       
 *       **Admin Only:**
 *       - Requires authentication with admin role
 *       
 *       **Venue Layout:**
 *       - Define sections with rows and seats
 *       - Configure aisles and gaps
 *       - Set capacity and facilities
 *       - Layout used for automatic seat map generation
 *       
 *       **Validation:**
 *       - Name must be unique
 *       - Layout must be valid (semantic validation)
 *       - Capacity must match layout
 *       
 *       **Related Endpoints:**
 *       - PUT /api/venues/{id} - Update venue
 *       - GET /api/venues - List all venues
 *       - POST /api/performances - Create performance at venue
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VenueInput'
 *     responses:
 *       201:
 *         description: Venue created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Venue'
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
  createVenueValidator,
  validate,
  venueController.createVenue
);

/**
 * @openapi
 * /api/venues/{id}:
 *   put:
 *     tags: [Venues]
 *     summary: Update venue
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VenueInput'
 *     responses:
 *       200:
 *         description: Venue updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Venue'
 *       404:
 *         description: Venue not found
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntity'
 */
router.put(
  "/:id",
  isAuthenticated,
  isAdmin,
  updateVenueValidator,
  validate,
  venueController.updateVenue
);

/**
 * @openapi
 * /api/venues/{id}:
 *   delete:
 *     tags: [Venues]
 *     summary: Delete venue
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Venue deleted
 *       404:
 *         description: Venue not found
 */
router.delete(
  "/:id",
  isAuthenticated,
  isAdmin,
  deleteVenueValidator,
  validate,
  venueController.deleteVenue
);

/**
 * @openapi
 * /api/venues/{id}/preview:
 *   get:
 *     tags: [Venues]
 *     summary: Get venue seat map preview
 *     description: |
 *       Generates a seat map preview from the venue's layout configuration. 
 *       Returns seat positions, labels, and layout information for visual rendering.
 *       
 *       **Public Access:**
 *       - No authentication required
 *       - Returns complete seat map with positions
 *       
 *       **Returned Information:**
 *       - Venue layout configuration
 *       - Generated seat map with sections and rows
 *       - Individual seat details with positions and labels
 *       - Total seat count
 *       
 *       **Use Cases:**
 *       - Venue layout preview in admin interface
 *       - Seat map visualization
 *       - Layout validation before saving
 *       - Real-time preview during venue editing
 *       
 *       **Related Endpoints:**
 *       - PUT /api/venues/{id} - Update venue layout
 *       - GET /api/venues/{id} - Get venue details
 *       - GET /api/performances/{id}/seatmap - Performance-specific seat map
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Venue ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Seat map preview generated successfully
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
 *                     venueId:
 *                       type: integer
 *                       example: 1
 *                     venueName:
 *                       type: string
 *                       example: "Royal Concert Hall"
 *                     layout:
 *                       type: object
 *                       description: Venue layout configuration
 *                     seatMap:
 *                       type: object
 *                       properties:
 *                         sections:
 *                           type: array
 *                           description: Seat map sections
 *                         total:
 *                           type: integer
 *                           example: 2019
 *                         version:
 *                           type: integer
 *                           example: 1
 *                     seats:
 *                       type: array
 *                       description: Individual seat details with positions
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "orchestra-stalls-a1"
 *                           label:
 *                             type: string
 *                             example: "A1"
 *                           section:
 *                             type: string
 *                             example: "Orchestra Stalls"
 *                           row:
 *                             type: string
 *                             example: "A"
 *                           seatNumber:
 *                             type: integer
 *                             example: 1
 *                           tier:
 *                             type: string
 *                             example: "vip"
 *                           position:
 *                             type: object
 *                             properties:
 *                               x:
 *                                 type: number
 *                               y:
 *                                 type: number
 *                               width:
 *                                 type: number
 *                               height:
 *                                 type: number
 *       404:
 *         description: Venue not found
 */
router.get(
  "/:id/preview",
  optionalAuth,
  getVenueValidator,
  validate,
  venueController.getVenuePreview
);

export default router;
