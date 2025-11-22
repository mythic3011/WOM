import express from "express";
import {
    SEAT_TIERS,
    SEAT_TIER_LABELS,
    SEAT_STATUSES,
    BOOKING_STATUSES,
    BOOKING_STATUS_LABELS,
    PAYMENT_STATUSES,
    PAYMENT_STATUS_LABELS,
    PAYMENT_METHODS,
    PERFORMANCE_STATUSES,
    USER_ROLES,
    VENUE_STATUSES,
    TICKET_TYPES,
    SYSTEM_TICKET_TYPE_IDS,
    DEFAULT_TICKET_TYPES,
    TICKET_DISCOUNTS,
} from "#config/dataConstants.js";
import { DEFAULT_VENUE_TEMPLATES } from "#config/venueTemplates.js";

const router = express.Router();

/**
 * @openapi
 * /api/constants:
 *   get:
 *     tags: [Constants]
 *     summary: Get application constants
 *     description: Returns all application constants for frontend use
 *     responses:
 *       200:
 *         description: Application constants
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 seatTiers:
 *                   type: object
 *                 seatTierLabels:
 *                   type: object
 *                 seatStatuses:
 *                   type: object
 *                 bookingStatuses:
 *                   type: object
 *                 bookingStatusLabels:
 *                   type: object
 *                 paymentStatuses:
 *                   type: object
 *                 paymentStatusLabels:
 *                   type: object
 *                 paymentMethods:
 *                   type: object
 *                 performanceStatuses:
 *                   type: object
 *                 userRoles:
 *                   type: object
 *                 venueStatuses:
 *                   type: object
 *                 ticketTypes:
 *                   type: object
 *                 systemTicketTypeIds:
 *                   type: array
 *                 defaultTicketTypes:
 *                   type: array
 *                 ticketDiscounts:
 *                   type: object
 */
router.get("/", (req, res) => {
    res.json({
        seatTiers: SEAT_TIERS,
        seatTierLabels: SEAT_TIER_LABELS,
        seatStatuses: SEAT_STATUSES,
        bookingStatuses: BOOKING_STATUSES,
        bookingStatusLabels: BOOKING_STATUS_LABELS,
        paymentStatuses: PAYMENT_STATUSES,
        paymentStatusLabels: PAYMENT_STATUS_LABELS,
        paymentMethods: PAYMENT_METHODS,
        performanceStatuses: PERFORMANCE_STATUSES,
        userRoles: USER_ROLES,
        venueStatuses: VENUE_STATUSES,
        ticketTypes: TICKET_TYPES,
        systemTicketTypeIds: SYSTEM_TICKET_TYPE_IDS,
        defaultTicketTypes: DEFAULT_TICKET_TYPES,
        ticketDiscounts: TICKET_DISCOUNTS,
        venueTemplates: DEFAULT_VENUE_TEMPLATES,
    });
});

export default router;
