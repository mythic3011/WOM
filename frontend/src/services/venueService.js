/**
 * @file venueService.js
 * @description Service for managing venue data and operations
 * @author LI Ning 25127563d
 * @author SHEK chinhei 25017482d
 * @dependency ./apiClient.js
 * @see apiClient.js
 */

import { venueAPI } from "./apiClient.js";

/**
 * @description Venue service for managing venue data
 */
export const venueService = {
  /**
   * @description Gets all venues with optional filters
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} Array of venues
   */
  async getAll(params = {}) {
    try {
      const response = await venueAPI.getAll(params);
      return response.success ? response.data : [];
    } catch (error) {
      console.error("Failed to fetch venues:", error);
      return [];
    }
  },

  /**
   * @description Gets a venue by ID
   * @param {number|string} id - Venue ID
   * @returns {Promise<Object|null>} Venue data or null
   */
  async getById(id) {
    try {
      const response = await venueAPI.getById(id);
      return response.success ? response.data : null;
    } catch (error) {
      console.error(`Failed to fetch venue ${id}:`, error);
      return null;
    }
  },

  /**
   * @description Creates a new venue
   * @param {Object} venueData - Venue data
   * @returns {Promise<Object|null>} Created venue or null
   * @throws {Error} When creation fails
   */
  async create(venueData) {
    try {
      const response = await venueAPI.create(venueData);
      return response.success ? response.data : null;
    } catch (error) {
      console.error("Failed to create venue:", error);
      throw error;
    }
  },

  /**
   * @description Updates a venue
   * @param {number|string} id - Venue ID
   * @param {Object} venueData - Updated venue data
   * @returns {Promise<Object|null>} Updated venue or null
   * @throws {Error} When update fails
   */
  async update(id, venueData) {
    try {
      const response = await venueAPI.update(id, venueData);
      return response.success ? response.data : null;
    } catch (error) {
      console.error(`Failed to update venue ${id}:`, error);
      throw error;
    }
  },

  /**
   * @description Deletes a venue
   * @param {number|string} id - Venue ID
   * @returns {Promise<boolean>} Success status
   * @throws {Error} When deletion fails
   */
  async delete(id) {
    try {
      const response = await venueAPI.delete(id);
      return response.success;
    } catch (error) {
      console.error(`Failed to delete venue ${id}:`, error);
      throw error;
    }
  },

  /**
   * @description Searches venues by query and filters
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>} Matching venues
   */
  async search(query, filters = {}) {
    try {
      const params = {
        ...filters,
        ...(query && { search: query }),
      };
      const response = await venueAPI.getAll(params);
      return response.success ? response.data : [];
    } catch (error) {
      console.error("Failed to search venues:", error);
      return [];
    }
  },

  /**
   * @description Calculates total capacity from venue layout
   * @param {Object} layout - Venue layout object
   * @returns {number} Total capacity
   */
  calculateCapacity(layout) {
    if (!layout?.sections) {return 0;}
    return layout.sections.reduce((total, section) => {
      return total + section.rows * section.seatsPerRow;
    }, 0);
  },

  /**
   * @description Exports venue data as JSON file
   * @param {number|string} id - Venue ID
   * @returns {Promise<boolean|null>} Success status or null
   */
  async exportVenue(id) {
    const venue = await this.getById(id);
    if (!venue) {return null;}

    const dataStr = JSON.stringify(venue, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `venue-${venue.name
      .replace(/\s+/g, "-")
      .toLowerCase()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  },

  /**
   * @description Imports venue from JSON data
   * @param {string} jsonData - JSON string of venue data
   * @returns {Promise<Object>} Created venue
   * @throws {Error} When import fails or data is invalid
   */
  async importVenue(jsonData) {
    try {
      const venue = JSON.parse(jsonData);
      delete venue.id;
      return await this.create(venue);
    } catch (error) {
      console.error("Failed to import venue:", error);
      throw new Error("Invalid venue data format");
    }
  },
};
