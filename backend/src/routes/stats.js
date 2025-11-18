import express from "express";
import * as statsController from "#controllers/statsController.js";
import { isAuthenticated, isAdmin } from "#middleware/auth.js";

const router = express.Router();

/**
 * @openapi
 * /api/stats/dashboard:
 *   get:
 *     tags: [Statistics]
 *     summary: Get dashboard statistics
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats
 */
router.get("/dashboard", isAuthenticated, isAdmin, statsController.getDashboardStats);

/**
 * @openapi
 * /api/stats/user/{userId}:
 *   get:
 *     tags: [Statistics]
 *     summary: Get user statistics
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User stats
 */
router.get("/user/:userId?", isAuthenticated, statsController.getUserStats);

/**
 * @openapi
 * /api/stats/performance/{performanceId}:
 *   get:
 *     tags: [Statistics]
 *     summary: Get performance statistics
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: performanceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Performance stats
 */
router.get(
  "/performance/:performanceId",
  isAuthenticated,
  isAdmin,
  statsController.getPerformanceStats
);

export default router;
