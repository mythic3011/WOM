/**
 * @file bookingController.js
 * @description Booking management controller handling booking creation, retrieval, updates, and cancellations
 * @author LI Ning 25127563d
 * @author SHEK chinhei 25017482d
 * @dependency #services/bookingService.js
 * @dependency #middleware/asyncHandler.js
 * @dependency #utils/response.js
 */

import * as bookingService from "#services/bookingService.js";
import { asyncHandler } from "#middleware/asyncHandler.js";
import { successResponse } from "#utils/response.js";

/**
 * @param {Object} req
 * @param {Object} res
 * @returns {Promise<Object>}
 */
export const createBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.createBooking(req.body, req.session.userId);
  return successResponse(res, { booking }, "Booking created successfully", 201);
});

/**
 * @param {Object} req
 * @param {Object} res
 * @returns {Promise<Object>}
 */
export const getAllBookings = asyncHandler(async (req, res) => {
  const filters = {
    status: req.query.status,
    performanceId: req.query.performanceId,
    dateFrom: req.query.dateFrom,
    dateTo: req.query.dateTo,
  };

  const isAdmin = req.session.userRole === "admin";
  const userId = isAdmin ? null : req.session.userId;

  const bookings = await bookingService.getAllBookings(filters, userId, isAdmin);

  return successResponse(res, { bookings, count: bookings.length });
});

/**
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @returns {Promise<void>}
 */
export const getBookingById = async (req, res, next) => {
  try {
    const isAdmin = req.session.userRole === "admin";
    const userId = isAdmin ? null : req.session.userId;

    const booking = await bookingService.getBookingById(req.params.id, userId, isAdmin);

    res.json({
      success: true,
      data: { booking },
    });
  } catch (error) {
    if (error.message === "Booking not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

/**
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @returns {Promise<void>}
 */
export const updateBooking = async (req, res, next) => {
  try {
    const isAdmin = req.session.userRole === "admin";
    const userId = isAdmin ? null : req.session.userId;

    const booking = await bookingService.updateBooking(
      req.params.id,
      req.body,
      userId,
      isAdmin
    );

    res.json({
      success: true,
      message: "Booking updated successfully",
      data: { booking },
    });
  } catch (error) {
    if (error.message === "Booking not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    if (
      error.message.includes("Cannot update") ||
      error.message.includes("Only admin")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

/**
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @returns {Promise<void>}
 */
export const cancelBooking = async (req, res, next) => {
  try {
    const isAdmin = req.session.userRole === "admin";
    const userId = isAdmin ? null : req.session.userId;

    const booking = await bookingService.cancelBooking(req.params.id, userId, isAdmin);

    res.json({
      success: true,
      message: "Booking cancelled successfully",
      data: { booking },
    });
  } catch (error) {
    if (error.message === "Booking not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

/**
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @returns {Promise<void>}
 */
export const confirmBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.confirmBooking(req.params.id);

    res.json({
      success: true,
      message: "Booking confirmed successfully",
      data: { booking },
    });
  } catch (error) {
    if (error.message === "Booking not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

/**
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @returns {Promise<void>}
 */
export const getBookingStats = async (req, res, next) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
    };

    const stats = await bookingService.getBookingStats(filters);

    res.json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
};
