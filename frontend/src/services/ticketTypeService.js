/**
 * @file ticketTypeService.js
 * @description Service for managing ticket type data and operations
 * @author LI Ning 25127563d
 * @author SHEK chinhei 25017482d
 * @dependency ./apiClient.js
 * @dependency ./responseExtractor.js
 * @see apiClient.js
 */

import { ticketTypeAPI } from "./apiClient.js";
import { ResponseExtractor } from "./responseExtractor.js";

/**
 * @description Ticket type service for managing ticket types
 */
export const ticketTypeService = {
  /**
   * @description Gets all active ticket types
   * @returns {Promise<Array>} Array of active ticket types
   */
  async getAll() {
    try {
      const response = await ticketTypeAPI.getAll();
      const items = ResponseExtractor.extract(response, "ticketTypes");
      return items.filter(
        (t) => t && (t.isActive === undefined || t.isActive === true)
      );
    } catch (error) {
      console.error("Failed to fetch ticket types:", error);
      return [];
    }
  },

  /**
   * @description Gets a ticket type by ID
   * @param {number|string} id - Ticket type ID
   * @returns {Promise<Object|null>} Ticket type data or null
   */
  async getById(id) {
    try {
      const response = await ticketTypeAPI.getById(id);
      return response.success ? response.data : null;
    } catch (error) {
      console.error(`Failed to fetch ticket type ${id}:`, error);
      return null;
    }
  },

  /**
   * @description Creates a new ticket type
   * @param {Object} typeData - Ticket type data
   * @returns {Promise<Object|null>} Created ticket type or null
   * @throws {Error} When creation fails
   */
  async create(typeData) {
    try {
      const response = await ticketTypeAPI.create(typeData);
      return response.success ? response.data : null;
    } catch (error) {
      console.error("Failed to create ticket type:", error);
      throw error;
    }
  },

  /**
   * @description Updates a ticket type
   * @param {number|string} id - Ticket type ID
   * @param {Object} typeData - Updated ticket type data
   * @returns {Promise<Object|null>} Updated ticket type or null
   * @throws {Error} When update fails
   */
  async update(id, typeData) {
    try {
      const response = await ticketTypeAPI.update(id, typeData);
      return response.success ? response.data : null;
    } catch (error) {
      console.error(`Failed to update ticket type ${id}:`, error);
      throw error;
    }
  },

  /**
   * @description Deletes a ticket type
   * @param {number|string} id - Ticket type ID
   * @returns {Promise<boolean>} Success status
   * @throws {Error} When deletion fails
   */
  async delete(id) {
    try {
      const response = await ticketTypeAPI.delete(id);
      return response.success;
    } catch (error) {
      console.error(`Failed to delete ticket type ${id}:`, error);
      throw error;
    }
  },
};
