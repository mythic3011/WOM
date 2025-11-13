import * as performanceService from "../services/performanceService.js";

export const getAllPerformances = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      venueId: req.query.venueId,
      search: req.query.search,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
    };

    const performances = await performanceService.getAllPerformances(filters);

    res.json({
      success: true,
      data: { performances },
      count: performances.length,
    });
  } catch (error) {
    next(error);
  }
};

export const getPerformanceById = async (req, res, next) => {
  try {
    const performance = await performanceService.getPerformanceById(req.params.id);

    res.json({
      success: true,
      data: { performance },
    });
  } catch (error) {
    if (error.message === "Performance not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

export const createPerformance = async (req, res, next) => {
  try {
    const performance = await performanceService.createPerformance(req.body);

    res.status(201).json({
      success: true,
      message: "Performance created successfully",
      data: { performance },
    });
  } catch (error) {
    if (error.message === "Venue not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

export const updatePerformance = async (req, res, next) => {
  try {
    const performance = await performanceService.updatePerformance(
      req.params.id,
      req.body
    );

    res.json({
      success: true,
      message: "Performance updated successfully",
      data: { performance },
    });
  } catch (error) {
    if (
      error.message === "Performance not found" ||
      error.message === "Venue not found"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

export const deletePerformance = async (req, res, next) => {
  try {
    await performanceService.deletePerformance(req.params.id);

    res.json({
      success: true,
      message: "Performance deleted successfully",
    });
  } catch (error) {
    if (error.message === "Performance not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    if (error.message.includes("active bookings")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

export const getPerformanceAvailability = async (req, res, next) => {
  try {
    const availability = await performanceService.getPerformanceAvailability(
      req.params.id,
      req.query.showtimeId
    );

    res.json({
      success: true,
      data: { availability },
    });
  } catch (error) {
    if (error.message === "Performance not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

export const getPerformanceSeatMap = async (req, res, next) => {
  try {
    const performance = await performanceService.getPerformanceById(req.params.id);

    res.json({
      success: true,
      data: {
        seatMap: performance.seatMap,
        totalSeats: performance.totalSeats,
        availableSeats: performance.availableSeats,
        seatMapVersion: performance.seatMapVersion,
      },
    });
  } catch (error) {
    if (error.message === "Performance not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

export const rebuildPerformanceSeatMap = async (req, res, next) => {
  try {
    const result = await performanceService.rebuildSeatMap(req.params.id);

    res.json({
      success: true,
      message: "Seat map rebuilt successfully",
      data: result,
    });
  } catch (error) {
    if (error.message === "Performance not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};
