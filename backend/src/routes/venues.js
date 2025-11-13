import express from "express";
import * as venueController from "../controllers/venueController.js";
import { validate } from "../middleware/validation.js";
import { isAuthenticated, isAdmin, optionalAuth } from "../middleware/auth.js";
import {
  createVenueValidator,
  updateVenueValidator,
  getVenueValidator,
  deleteVenueValidator,
  listVenuesValidator,
} from "../middleware/validators/venueValidators.js";

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
 *     summary: Create venue
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
 *         description: Venue created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Venue'
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

export default router;
