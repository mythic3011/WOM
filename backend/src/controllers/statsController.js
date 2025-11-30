/**
 * @file statsController.js
 * @description Statistics controller handling admin, user, performance, and venue statistics
 * @author LI Ning 25127563d
 * @author SHEK chinhei 25017482d
 * @dependency #middleware/asyncHandler.js
 * @dependency #services/statsService.js
 * @dependency #utils/response.js
 */

import { asyncHandler } from "#middleware/asyncHandler.js";
import { statsService } from "#services/statsService.js";
import { successResponse } from "#utils/response.js";

/**
 * @param {Object} req
 * @param {Object} res
 * @returns {Promise<Object>}
 */
export const getAdminStats = asyncHandler(async (req, res) => {
  const stats = await statsService.getAdminStats();
  return successResponse(res, stats, "Admin statistics retrieved successfully");
});

/**
 * @param {Object} req
 * @param {Object} res
 * @returns {Promise<Object>}
 */
export const getUserStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const stats = await statsService.getUserStats(userId);
  return successResponse(res, stats, "User statistics retrieved successfully");
});

/**
 * @param {Object} req
 * @param {Object} res
 * @returns {Promise<Object>}
 */
export const getPerformanceStats = asyncHandler(async (req, res) => {
  const { performanceId } = req.params;
  const stats = await statsService.getPerformanceStats(performanceId);
  return successResponse(res, stats, "Performance statistics retrieved successfully");
});

/**
 * @param {Object} req
 * @param {Object} res
 * @returns {Promise<Object>}
 */
export const getAllPerformanceStats = asyncHandler(async (req, res) => {
  const stats = await statsService.getAllPerformanceStats();
  return successResponse(res, stats, "All performance statistics retrieved successfully");
});

/**
 * @param {Object} req
 * @param {Object} res
 * @returns {Promise<Object>}
 */
export const getVenueStats = asyncHandler(async (req, res) => {
  const { venueId } = req.params;
  const stats = await statsService.getVenueStats(venueId);
  return successResponse(res, stats, "Venue statistics retrieved successfully");
});

/**
 * @param {Object} req
 * @param {Object} res
 * @returns {Promise<Object>}
 */
export const getAllVenueStats = asyncHandler(async (req, res) => {
  const stats = await statsService.getAllVenueStats();
  return successResponse(res, stats, "All venue statistics retrieved successfully");
});
