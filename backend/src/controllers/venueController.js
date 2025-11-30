/**
 * @file venueController.js
 * @description Venue management controller handling CRUD operations and venue preview
 * @author LI Ning 25127563d
 * @author SHEK chinhei 25017482d
 * @dependency #services/venueService.js
 */

import * as venueService from "#services/venueService.js";

/**
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @returns {Promise<void>}
 */
export const getAllVenues = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      search: req.query.search,
    };

    const venues = await venueService.getAllVenues(filters);

    res.json({
      success: true,
      data: { venues },
      count: venues.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @returns {Promise<void>}
 */
export const getVenueById = async (req, res, next) => {
  try {
    const venue = await venueService.getVenueById(req.params.id);

    res.json({
      success: true,
      data: { venue },
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

/**
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @returns {Promise<void>}
 */
export const createVenue = async (req, res, next) => {
  try {
    const venue = await venueService.createVenue(req.body);

    res.status(201).json({
      success: true,
      message: "Venue created successfully",
      data: { venue },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @returns {Promise<void>}
 */
export const updateVenue = async (req, res, next) => {
  try {
    const venue = await venueService.updateVenue(req.params.id, req.body);

    res.json({
      success: true,
      message: "Venue updated successfully",
      data: { venue },
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

/**
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @returns {Promise<void>}
 */
export const deleteVenue = async (req, res, next) => {
  try {
    await venueService.deleteVenue(req.params.id);

    res.json({
      success: true,
      message: "Venue deleted successfully",
    });
  } catch (error) {
    if (error.message === "Venue not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    if (error.message.includes("associated performances")) {
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
export const getVenuePreview = async (req, res, next) => {
  try {
    const preview = await venueService.getVenuePreview(req.params.id);

    res.json({
      success: true,
      data: preview,
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
