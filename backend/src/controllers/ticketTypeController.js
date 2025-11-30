/**
 * @file ticketTypeController.js
 * @description Ticket type management controller handling CRUD operations for ticket types
 * @author LI Ning 25127563d
 * @author SHEK chinhei 25017482d
 * @dependency #services/ticketTypeService.js
 */

import * as ticketTypeService from "#services/ticketTypeService.js";

/**
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @returns {Promise<void>}
 */
export const getAllTicketTypes = async (req, res, next) => {
  try {
    const ticketTypes = await ticketTypeService.getAllTicketTypes();

    res.json({
      success: true,
      data: { ticketTypes },
      count: ticketTypes.length,
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
export const getTicketTypeById = async (req, res, next) => {
  try {
    const ticketType = await ticketTypeService.getTicketTypeById(req.params.id);

    res.json({
      success: true,
      data: { ticketType },
    });
  } catch (error) {
    if (error.message === "Ticket type not found") {
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
export const createTicketType = async (req, res, next) => {
  try {
    const ticketType = await ticketTypeService.createTicketType(req.body);

    res.status(201).json({
      success: true,
      message: "Ticket type created successfully",
      data: { ticketType },
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
export const updateTicketType = async (req, res, next) => {
  try {
    const ticketType = await ticketTypeService.updateTicketType(
      req.params.id,
      req.body
    );

    res.json({
      success: true,
      message: "Ticket type updated successfully",
      data: { ticketType },
    });
  } catch (error) {
    if (error.message === "Ticket type not found") {
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
export const deleteTicketType = async (req, res, next) => {
  try {
    await ticketTypeService.deleteTicketType(req.params.id);

    res.json({
      success: true,
      message: "Ticket type deleted successfully",
    });
  } catch (error) {
    if (error.message === "Ticket type not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};
