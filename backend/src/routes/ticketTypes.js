import express from "express";
import { body, param } from "express-validator";
import * as ticketTypeController from "#controllers/ticketTypeController.js";
import { validate } from "#middleware/validation.js";
import { isAuthenticated, isAdmin, optionalAuth } from "#middleware/auth.js";

const router = express.Router();

/**
 * @openapi
 * /api/ticket-types:
 *   get:
 *     tags: [Ticket Types]
 *     summary: Get all ticket types
 *     responses:
 *       200:
 *         description: List of ticket types
 */
router.get("/", optionalAuth, ticketTypeController.getAllTicketTypes);

/**
 * @openapi
 * /api/ticket-types/{id}:
 *   get:
 *     tags: [Ticket Types]
 *     summary: Get ticket type by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket type details
 */
router.get(
  "/:id",
  optionalAuth,
  [param("id").notEmpty(), validate],
  ticketTypeController.getTicketTypeById
);

/**
 * @openapi
 * /api/ticket-types:
 *   post:
 *     tags: [Ticket Types]
 *     summary: Create new ticket type (Admin only)
 *     description: |
 *       Creates a new ticket type with pricing and discount information. Admin only.
 *       
 *       **Admin Only:**
 *       - Requires authentication with admin role
 *       
 *       **Ticket Types:**
 *       - Standard: Full price tickets
 *       - Premium: Enhanced seating with amenities
 *       - Student: Discounted for students
 *       - Senior: Discounted for seniors
 *       - Child: Discounted for children
 *       - Group: Bulk purchase discounts
 *       
 *       **Pricing:**
 *       - Base price set per performance
 *       - Discount percentage applied to base price
 *       - Final price = base price * (1 - discount)
 *       
 *       **Related Endpoints:**
 *       - GET /api/ticket-types - List all ticket types
 *       - PUT /api/ticket-types/{id} - Update ticket type
 *       - POST /api/bookings - Use ticket type in booking
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id, name, discount]
 *             properties:
 *               id:
 *                 type: string
 *                 description: Unique ticket type identifier
 *                 example: student
 *               name:
 *                 type: string
 *                 description: Display name
 *                 example: Student
 *               description:
 *                 type: string
 *                 description: Ticket type description
 *                 example: Discounted ticket for students with valid ID
 *               discount:
 *                 type: number
 *                 description: Discount percentage (0-1)
 *                 example: 0.4
 *               color:
 *                 type: string
 *                 description: Color code for UI display
 *                 example: '#10B981'
 *           examples:
 *             studentTicket:
 *               summary: Student ticket type
 *               value:
 *                 id: student
 *                 name: Student
 *                 description: Discounted ticket for students with valid ID
 *                 discount: 0.4
 *                 color: '#10B981'
 *             seniorTicket:
 *               summary: Senior ticket type
 *               value:
 *                 id: senior
 *                 name: Senior
 *                 description: Discounted ticket for seniors (65+)
 *                 discount: 0.3
 *                 color: '#8B5CF6'
 *     responses:
 *       201:
 *         description: Ticket type created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TicketType'
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
  [
    body("id").trim().notEmpty(),
    body("name").trim().notEmpty(),
    body("discount").isDecimal(),
    validate,
  ],
  ticketTypeController.createTicketType
);

/**
 * @openapi
 * /api/ticket-types/{id}:
 *   put:
 *     tags: [Ticket Types]
 *     summary: Update ticket type
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket type updated
 */
router.put(
  "/:id",
  isAuthenticated,
  isAdmin,
  [param("id").notEmpty(), validate],
  ticketTypeController.updateTicketType
);

/**
 * @openapi
 * /api/ticket-types/{id}:
 *   delete:
 *     tags: [Ticket Types]
 *     summary: Delete ticket type
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket type deleted
 */
router.delete(
  "/:id",
  isAuthenticated,
  isAdmin,
  [param("id").notEmpty(), validate],
  ticketTypeController.deleteTicketType
);

export default router;
