import { ticketTypeAPI } from "./apiClient.js";

export const ticketTypeService = {
  async getAll() {
    try {
      const response = await ticketTypeAPI.getAll();
      return response.success ? response.data : [];
    } catch (error) {
      console.error("Failed to fetch ticket types:", error);
      return [];
    }
  },

  async getById(id) {
    try {
      const response = await ticketTypeAPI.getById(id);
      return response.success ? response.data : null;
    } catch (error) {
      console.error(`Failed to fetch ticket type ${id}:`, error);
      return null;
    }
  },

  async create(typeData) {
    try {
      const response = await ticketTypeAPI.create(typeData);
      return response.success ? response.data : null;
    } catch (error) {
      console.error("Failed to create ticket type:", error);
      throw error;
    }
  },

  async update(id, typeData) {
    try {
      const response = await ticketTypeAPI.update(id, typeData);
      return response.success ? response.data : null;
    } catch (error) {
      console.error(`Failed to update ticket type ${id}:`, error);
      throw error;
    }
  },

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
