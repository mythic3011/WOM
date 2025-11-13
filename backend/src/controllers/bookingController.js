import * as bookingService from "../services/bookingService.js";

export const createBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.createBooking(req.body, req.session.userId);

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: { booking },
    });
  } catch (error) {
    if (
      error.message === "Performance not found" ||
      error.message === "User not found"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    if (
      error.message.includes("Not enough seats") ||
      error.message.includes("already booked")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

export const getAllBookings = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      performanceId: req.query.performanceId,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
    };

    const isAdmin = req.session.userRole === "admin";
    const userId = isAdmin ? null : req.session.userId;

    const bookings = await bookingService.getAllBookings(filters, userId, isAdmin);

    res.json({
      success: true,
      data: { bookings },
      count: bookings.length,
    });
  } catch (error) {
    next(error);
  }
};

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
