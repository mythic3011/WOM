import * as performanceService from "#services/performanceService.js";

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

export const filterPerformances = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      venueId: req.query.venue,
      genre: req.query.genre,
      search: req.query.search,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
    };

    const performances = await performanceService.filterPerformances(filters);

    res.json({
      success: true,
      data: performances,
      count: performances.length,
    });
  } catch (error) {
    next(error);
  }
};

export const autocompletePerformances = async (req, res, next) => {
  try {
    const query = req.query.q;

    if (!query || query.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Query parameter 'q' is required",
      });
    }

    const suggestions = await performanceService.autocompletePerformances(query);

    res.json({
      success: true,
      data: suggestions,
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

export const getSeatsWithBookingInfo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { showtimeId } = req.query;
    const userRole = req.user?.role || "user";

    const seatDetails = await performanceService.getSeatsWithBookingInfo(
      id,
      showtimeId,
      userRole
    );

    res.json({
      success: true,
      data: seatDetails,
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

export const uploadPerformanceImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    const imageUrl = await performanceService.uploadPerformanceImage(req.file);

    res.json({
      success: true,
      message: "Image uploaded successfully",
      data: { imageUrl },
    });
  } catch (error) {
    if (error.message.includes("Invalid file type") || error.message.includes("File size")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

export const batchUpdateSeats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { showtimeId, seatIds, status } = req.body;

    const result = await performanceService.batchUpdateSeatStatus(
      id,
      showtimeId,
      seatIds,
      status
    );

    res.json({
      success: true,
      message: `Successfully updated ${result.updated} seat(s)`,
      data: result,
    });
  } catch (error) {
    if (error.message === "Performance not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    if (error.message.includes("Invalid seat IDs")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    if (error.message.includes("Cannot modify booked seats")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};
