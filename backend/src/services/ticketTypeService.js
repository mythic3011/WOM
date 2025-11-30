/**
 * @file ticketTypeService.js
 * @description Ticket type management service handling ticket type CRUD operations
 * @author LI Ning 25127563d
 * @author SHEK chinhei 25017482d
 * @dependency #models/TicketType.js - TicketType model
 * @see #controllers/ticketTypeController.js
 */

import { TicketType } from "#models/index.js";
import { findEntityOrThrow } from "./helpers/entityHelpers.js";

/**
 * @returns {Promise<Array>}
 */
export const getAllTicketTypes = async () => {
  const ticketTypes = await TicketType.findAll({
    where: {
      isActive: true,
    },
    order: [["name", "ASC"]],
  });

  return ticketTypes;
};

/**
 * @param {string} id
 * @returns {Promise<Object>}
 * @throws {Error}
 */
export const getTicketTypeById = async (id) => {
  const ticketType = await findEntityOrThrow(TicketType, id, "Ticket type not found");
  return ticketType;
};

/**
 * @param {Object} ticketTypeData
 * @param {string} ticketTypeData.name
 * @param {number} ticketTypeData.multiplier
 * @returns {Promise<Object>}
 */
export const createTicketType = async (ticketTypeData) => {
  const ticketType = await TicketType.create(ticketTypeData);
  return ticketType;
};

/**
 * @param {string} id
 * @param {Object} updates
 * @returns {Promise<Object>}
 * @throws {Error}
 */
export const updateTicketType = async (id, updates) => {
  const ticketType = await findEntityOrThrow(TicketType, id, "Ticket type not found");
  await ticketType.update(updates);
  return ticketType;
};

/**
 * @param {string} id
 * @returns {Promise<boolean>}
 * @throws {Error}
 */
export const deleteTicketType = async (id) => {
  const ticketType = await findEntityOrThrow(TicketType, id, "Ticket type not found");
  await ticketType.destroy();
  return true;
};
