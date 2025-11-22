import express from "express";
import * as statsController from "#controllers/statsController.js";
import { isAuthenticated, isAdmin } from "#middleware/auth.js";

const router = express.Router();

/**
 * @openapi
 * /api/stats/dashboard:
 *   get:
 *     tags: [Statistics]
 *     summary: Get admin dashboard statistics
 *     description: |
 *       Retrieves comprehensive statistics for the admin dashboard including bookings, revenue, users, and performances.
 *       
 *       **Admin Only:**
 *       - Requires authentication with admin role
 *       
 *       **Returned Statistics:**
 *       - Total bookings (all time, this month, today)
 *       - Total revenue (all time, this month, today)
 *       - Active users count
 *       - Upcoming performances count
 *       - Booking trends (daily, weekly, monthly)
 *       - Popular performances
 *       - Revenue by ticket type
 *       
 *       **Use Cases:**
 *       - Admin dashboard overview
 *       - Business intelligence
 *       - Performance monitoring
 *       - Revenue tracking
 *       
 *       **Performance:**
 *       - Results may be cached for 5-15 minutes
 *       - Expensive aggregation queries
 *       - Consider background job for real-time updates
 *       
 *       **Related Endpoints:**
 *       - GET /api/stats/performance/{id} - Performance-specific stats
 *       - GET /api/stats/user/{id} - User-specific stats
 *       - GET /api/bookings/stats - Booking statistics
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
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
 *                     bookings:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 1543
 *                         thisMonth:
 *                           type: integer
 *                           example: 234
 *                         today:
 *                           type: integer
 *                           example: 12
 *                     revenue:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                           example: 1234567.89
 *                         thisMonth:
 *                           type: number
 *                           example: 123456.78
 *                         today:
 *                           type: number
 *                           example: 12345.67
 *                     users:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 5432
 *                         active:
 *                           type: integer
 *                           example: 4321
 *                     performances:
 *                       type: object
 *                       properties:
 *                         upcoming:
 *                           type: integer
 *                           example: 45
 *                         thisMonth:
 *                           type: integer
 *                           example: 12
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get("/dashboard", isAuthenticated, isAdmin, statsController.getDashboardStats);

/**
 * @openapi
 * /api/stats/user/{userId}:
 *   get:
 *     tags: [Statistics]
 *     summary: Get user statistics
 *     description: |
 *       Retrieves booking and spending statistics for a specific user. Users can view their own stats, admins can view any user's stats.
 *       
 *       **Authorization:**
 *       - Users can view their own statistics
 *       - Admins can view any user's statistics
 *       - If userId is omitted, returns current user's stats
 *       
 *       **Returned Statistics:**
 *       - Total bookings count
 *       - Total amount spent
 *       - Booking history summary
 *       - Favorite performances/venues
 *       - Upcoming bookings count
 *       
 *       **Use Cases:**
 *       - User profile statistics
 *       - Loyalty program calculations
 *       - User behavior analysis
 *       - Personalized recommendations
 *       
 *       **Related Endpoints:**
 *       - GET /api/users/{id}/bookings - Detailed booking list
 *       - GET /api/auth/me - Current user profile
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID (optional, defaults to current user)
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
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
 *                     totalBookings:
 *                       type: integer
 *                       example: 23
 *                     totalSpent:
 *                       type: number
 *                       example: 12345.67
 *                     upcomingBookings:
 *                       type: integer
 *                       example: 3
 *                     favoriteVenue:
 *                       type: string
 *                       example: Hong Kong Cultural Centre
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get("/user/:userId?", isAuthenticated, statsController.getUserStats);

/**
 * @openapi
 * /api/stats/performance/{performanceId}:
 *   get:
 *     tags: [Statistics]
 *     summary: Get performance statistics (Admin only)
 *     description: |
 *       Retrieves detailed statistics for a specific performance including bookings, revenue, and seat occupancy.
 *       
 *       **Admin Only:**
 *       - Requires authentication with admin role
 *       
 *       **Returned Statistics:**
 *       - Total bookings count
 *       - Total revenue
 *       - Seats sold vs available
 *       - Occupancy percentage
 *       - Revenue by ticket type
 *       - Booking timeline
 *       - Average ticket price
 *       
 *       **Use Cases:**
 *       - Performance analytics
 *       - Revenue optimization
 *       - Pricing strategy
 *       - Marketing effectiveness
 *       
 *       **Related Endpoints:**
 *       - GET /api/performances/{id} - Performance details
 *       - GET /api/performances/{id}/availability - Seat availability
 *       - GET /api/bookings - Booking list
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: performanceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Performance ID
 *         example: 770e8400-e29b-41d4-a716-446655440002
 *     responses:
 *       200:
 *         description: Performance statistics retrieved successfully
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
 *                     totalBookings:
 *                       type: integer
 *                       example: 234
 *                     totalRevenue:
 *                       type: number
 *                       example: 123456.78
 *                     seatsSold:
 *                       type: integer
 *                       example: 456
 *                     seatsAvailable:
 *                       type: integer
 *                       example: 1563
 *                     occupancyRate:
 *                       type: number
 *                       example: 0.226
 *                     averageTicketPrice:
 *                       type: number
 *                       example: 540.25
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  "/performance/:performanceId",
  isAuthenticated,
  isAdmin,
  statsController.getPerformanceStats
);

export default router;
