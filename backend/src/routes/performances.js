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
 *     summary: Get all performances
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [on_sale, upcoming, sold_out, early_bird, pre_order]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of performances
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
 *                     $ref: '#/components/schemas/Performance'
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
 *     summary: Get performance by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Performance details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Performance'
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
 *     summary: Create performance
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
 *         description: Performance created
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
 *     summary: Update performance
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PerformanceInput'
 *     responses:
 *       200:
 *         description: Performance updated
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
 *     summary: Delete performance
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
 *         description: Performance deleted
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
 *     summary: Get performance availability
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Performance seat availability
 */
router.get(
  "/:id/availability",
  optionalAuth,
  getPerformanceValidator,
  validate,
  performanceController.getPerformanceAvailability
);

router.get(
  "/:id/seatmap",
  optionalAuth,
  getPerformanceValidator,
  validate,
  performanceController.getPerformanceSeatMap
);

router.post(
  "/:id/rebuild-seatmap",
  isAuthenticated,
  isAdmin,
  getPerformanceValidator,
  validate,
  performanceController.rebuildPerformanceSeatMap
);

export default router;
