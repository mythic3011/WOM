import { venueAPI } from "@services/apiClient.js";
import { DEFAULT_VENUE_TEMPLATES } from "@/data/index.js";
import { ResponseExtractor } from "@services/responseExtractor.js";

export class VenueModel {
  constructor() {
    this.venues = [];
    this.currentVenue = null;
    this.searchQuery = "";
    this.filterStatus = "";
  }

  async loadVenues() {
    try {
      const response = await venueAPI.getAll();
      const allVenues = ResponseExtractor.extract(response, "venues");

      let filteredVenues = allVenues;

      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        filteredVenues = filteredVenues.filter(
          (v) =>
            v.name.toLowerCase().includes(query) ||
            (v.address && v.address.toLowerCase().includes(query)) ||
            (v.description && v.description.toLowerCase().includes(query))
        );
      }

      if (this.filterStatus) {
        filteredVenues = filteredVenues.filter(
          (v) => v.status === this.filterStatus
        );
      }

      this.venues = filteredVenues;
      return this.venues;
    } catch (error) {
      throw new Error(`Failed to load venues: ${error.message}`);
    }
  }

  async getVenueById(venueId) {
    try {
      const response = await venueAPI.getById(venueId);
      this.currentVenue = ResponseExtractor.extractSingle(response, "venue");
      return this.currentVenue;
    } catch (error) {
      throw new Error(`Failed to get venue: ${error.message}`);
    }
  }

  async createVenue(venueData) {
    try {
      const newVenue = await venueAPI.create(venueData);
      await this.loadVenues();
      return newVenue;
    } catch (error) {
      throw new Error(`Failed to create venue: ${error.message}`);
    }
  }

  async updateVenue(venueId, venueData) {
    try {
      const updatedVenue = await venueAPI.update(venueId, venueData);
      await this.loadVenues();
      return updatedVenue;
    } catch (error) {
      throw new Error(`Failed to update venue: ${error.message}`);
    }
  }

  async deleteVenue(venueId) {
    try {
      await venueAPI.delete(venueId);
      await this.loadVenues();
      return true;
    } catch (error) {
      throw new Error(`Failed to delete venue: ${error.message}`);
    }
  }

  async cloneVenue(venueId) {
    try {
      const response = await venueAPI.getById(venueId);
      const venue = ResponseExtractor.extractSingle(response, "venue");
      if (!venue) throw new Error("Venue not found");

      const clonedData = {
        ...venue,
        name: `${venue.name} (Copy)`,
      };

      delete clonedData.id;
      delete clonedData.createdAt;
      delete clonedData.updatedAt;

      const cloned = await venueAPI.create(clonedData);
      await this.loadVenues();
      return cloned;
    } catch (error) {
      throw new Error(`Failed to clone venue: ${error.message}`);
    }
  }

  async exportVenue(venueId) {
    try {
      const response = await venueAPI.getById(venueId);
      const venue = ResponseExtractor.extractSingle(response, "venue");
      if (!venue) throw new Error("Venue not found");

      const dataStr = JSON.stringify(venue, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);

      const $link = $("<a>")
        .attr("href", url)
        .attr(
          "download",
          `venue-${venue.name.replace(/\s+/g, "-").toLowerCase()}.json`
        )
        .appendTo("body");

      $link[0].click();
      $link.remove();
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      throw new Error(`Failed to export venue: ${error.message}`);
    }
  }

  async importVenue(fileContent) {
    try {
      const venueData = JSON.parse(fileContent);

      delete venueData.id;
      delete venueData.createdAt;
      delete venueData.updatedAt;

      await venueAPI.create(venueData);
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
    if (!layout || !layout.sections) return 0;

    return layout.sections.reduce((total, section) => {
      const sectionCapacity = (section.rows || 0) * (section.seatsPerRow || 0);
      return total + sectionCapacity;
    }, 0);
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
