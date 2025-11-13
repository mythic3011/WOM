import express from "express";
import { body, param } from "express-validator";
import * as ticketTypeController from "../controllers/ticketTypeController.js";
import { validate } from "../middleware/validation.js";
import { isAuthenticated, isAdmin, optionalAuth } from "../middleware/auth.js";

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
 *     summary: Create ticket type
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
 *               name:
 *                 type: string
 *               discount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Ticket type created
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
