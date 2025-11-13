import { venueAPI } from "./apiClient.js";

export const venueService = {
  async getAll(params = {}) {
    try {
      const response = await venueAPI.getAll(params);
      return response.success ? response.data : [];
    } catch (error) {
      console.error("Failed to fetch venues:", error);
      return [];
    }
  },

  async getById(id) {
    try {
      const response = await venueAPI.getById(id);
      return response.success ? response.data : null;
    } catch (error) {
      console.error(`Failed to fetch venue ${id}:`, error);
      return null;
    }
  },

  async create(venueData) {
    try {
      const response = await venueAPI.create(venueData);
      return response.success ? response.data : null;
    } catch (error) {
      console.error("Failed to create venue:", error);
      throw error;
    }
  },

  async update(id, venueData) {
    try {
      const response = await venueAPI.update(id, venueData);
      return response.success ? response.data : null;
    } catch (error) {
      console.error(`Failed to update venue ${id}:`, error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const response = await venueAPI.delete(id);
      return response.success;
    } catch (error) {
      console.error(`Failed to delete venue ${id}:`, error);
      throw error;
    }
  },

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

  calculateCapacity(layout) {
    if (!layout?.sections) return 0;
    return layout.sections.reduce((total, section) => {
      return total + section.rows * section.seatsPerRow;
    }, 0);
  },

  async exportVenue(id) {
    const venue = await this.getById(id);
    if (!venue) return null;

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
