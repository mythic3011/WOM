import { venueService } from "/src/services/venueService.js";
import { DEFAULT_VENUE_TEMPLATES } from "/src/data/defaultTemplates.js";

export class VenueModel {
  constructor() {
    this.venues = [];
    this.currentVenue = null;
    this.searchQuery = "";
    this.filterStatus = "";
  }

  async loadVenues() {
    try {
      this.venues = await venueService.search(this.searchQuery, {
        status: this.filterStatus,
      });
      return this.venues;
    } catch (error) {
      throw new Error(`Failed to load venues: ${error.message}`);
    }
  }

  async getVenueById(venueId) {
    try {
      this.currentVenue = await venueService.getById(venueId);
      return this.currentVenue;
    } catch (error) {
      throw new Error(`Failed to get venue: ${error.message}`);
    }
  }

  async createVenue(venueData) {
    try {
      const newVenue = await venueService.create(venueData);
      await this.loadVenues();
      return newVenue;
    } catch (error) {
      throw new Error(`Failed to create venue: ${error.message}`);
    }
  }

  async updateVenue(venueId, venueData) {
    try {
      const updatedVenue = await venueService.update(venueId, venueData);
      await this.loadVenues();
      return updatedVenue;
    } catch (error) {
      throw new Error(`Failed to update venue: ${error.message}`);
    }
  }

  async deleteVenue(venueId) {
    try {
      await venueService.delete(venueId);
      await this.loadVenues();
      return true;
    } catch (error) {
      throw new Error(`Failed to delete venue: ${error.message}`);
    }
  }

  async cloneVenue(venueId) {
    try {
      const cloned = await venueService.clone(venueId);
      await this.loadVenues();
      return cloned;
    } catch (error) {
      throw new Error(`Failed to clone venue: ${error.message}`);
    }
  }

  async exportVenue(venueId) {
    try {
      await venueService.exportVenue(venueId);
      return true;
    } catch (error) {
      throw new Error(`Failed to export venue: ${error.message}`);
    }
  }

  async importVenue(fileContent) {
    try {
      await venueService.importVenue(fileContent);
      await this.loadVenues();
      return true;
    } catch (error) {
      throw new Error(`Failed to import venue: ${error.message}`);
    }
  }

  getTemplates() {
    return DEFAULT_VENUE_TEMPLATES;
  }

  calculateCapacity(layout) {
    return venueService.calculateCapacity(layout);
  }

  setSearchQuery(query) {
    this.searchQuery = query;
  }

  setFilterStatus(status) {
    this.filterStatus = status;
  }

  getVenues() {
    return this.venues;
  }

  getFilteredVenues() {
    return this.venues;
  }

  validateVenueData(data) {
    const errors = [];

    if (!data.name || !data.name.trim()) {
      errors.push("Venue name is required");
    }

    if (data.layout?.sections) {
      data.layout.sections.forEach((section, index) => {
        if (!section.name) {
          errors.push(`Section ${index + 1}: Name is required`);
        }
        if (!section.rows || section.rows < 1) {
          errors.push(`Section ${index + 1}: Invalid number of rows`);
        }
        if (!section.seatsPerRow || section.seatsPerRow < 1) {
          errors.push(`Section ${index + 1}: Invalid seats per row`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}


