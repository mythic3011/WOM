/**
 * @file performanceService.js
 * @description Service for managing performance data and operations
 * @author LI Ning 25127563d
 * @author SHEK chinhei 25017482d
 * @dependency dayjs
 * @dependency ./apiClient.js
 * @dependency ./responseExtractor.js
 * @see apiClient.js
 * @see performanceHelpers.js
 */

import dayjs from "dayjs";

import { performanceAPI, handleApiError } from "./apiClient.js";
import { ResponseExtractor } from "./responseExtractor.js";

/**
 * @description Performance service for managing performance data
 */
export const performanceService = {
  /**
   * @description Gets all performances with optional filters
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} Array of performances
   */
  async getAll(params = {}) {
    try {
      const response = await performanceAPI.getAll(params);
      return ResponseExtractor.extract(response, "performances");
    } catch (error) {
      console.error("Failed to fetch performances:", error);
      handleApiError(error);
      return [];
    }
  },

  /**
   * @description Gets a performance by ID
   * @param {number|string} id - Performance ID
   * @returns {Promise<Object>} Performance data
   * @throws {Error} When fetch fails
   */
  async getById(id) {
    try {
      const response = await performanceAPI.getById(id);
      return ResponseExtractor.extractSingle(response, "performance");
    } catch (error) {
      console.error(`Failed to fetch performance ${id}:`, error);
      throw error;
    }
  },

  /**
   * @description Creates a new performance
   * @param {Object} performanceData - Performance data
   * @returns {Promise<Object>} Created performance
   * @throws {Error} When creation fails
   */
  async create(performanceData) {
    try {
      const response = await performanceAPI.create(performanceData);
      return response.data;
    } catch (error) {
      console.error("Failed to create performance:", error);
      throw error;
    }
  },

  /**
   * @description Updates a performance
   * @param {number|string} id - Performance ID
   * @param {Object} performanceData - Updated performance data
   * @returns {Promise<Object>} Updated performance
   * @throws {Error} When update fails
   */
  async update(id, performanceData) {
    try {
      const response = await performanceAPI.update(id, performanceData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update performance ${id}:`, error);
      throw error;
    }
  },

  /**
   * @description Deletes a performance
   * @param {number|string} id - Performance ID
   * @returns {Promise<Object>} Deletion response
   * @throws {Error} When deletion fails
   */
  async delete(id) {
    try {
      const response = await performanceAPI.delete(id);
      return response.data;
    } catch (error) {
      console.error(`Failed to delete performance ${id}:`, error);
      throw error;
    }
  },

  /**
   * @description Gets seat availability for a performance
   * @param {number|string} id - Performance ID
   * @param {number|string|null} showtimeId - Optional showtime ID
   * @returns {Promise<Object>} Availability data
   * @throws {Error} When fetch fails
   */
  async getAvailability(id, showtimeId = null) {
    try {
      const response = await performanceAPI.getAvailability(id, showtimeId);
      return response.data;
    } catch (error) {
      console.error(
        `Failed to fetch availability for performance ${id}:`,
        error
      );
      throw error;
    }
  },

  /**
   * @description Gets upcoming performances
   * @param {Array|null} performances - Optional performances array
   * @returns {Promise<Array>|Array} Upcoming performances
   */
  getUpcoming(performances = null) {
    if (performances) {
      return this.filterUpcoming(performances);
    }
    return this.getAll().then((perfs) => this.filterUpcoming(perfs));
  },

  /**
   * @description Filters performances to only upcoming ones
   * @param {Array} performances - Performances array
   * @returns {Array} Filtered upcoming performances
   */
  filterUpcoming(performances) {
    const now = dayjs();
    return performances.filter(
      (p) => dayjs(p.date).isAfter(now) && p.status !== "sold_out"
    );
  },

  /**
   * @description Gets performances that are on sale
   * @param {Array} performances - Performances array
   * @returns {Array} On sale performances
   */
  getOnSale(performances) {
    return performances.filter(
      (p) => p.ticketingInfo?.status === "on_sale" || p.status === "on_sale"
    );
  },

  /**
   * @description Gets sold out performances
   * @param {Array} performances - Performances array
   * @returns {Array} Sold out performances
   */
  getSoldOut(performances) {
    return performances.filter(
      (p) => p.ticketingInfo?.status === "sold_out" || p.status === "sold_out"
    );
  },

  /**
   * @description Calculates statistics for performances
   * @param {Array} performances - Performances array
   * @returns {Object} Statistics including total, onSale, upcoming, soldOut, and priceRange
   */
  getPerformanceStats(performances) {
    const onSale = this.getOnSale(performances).length;
    const upcoming = performances.filter(
      (p) =>
        p.ticketingInfo?.status === "upcoming" ||
        p.status === "upcoming" ||
        (!p.ticketingInfo?.status && !p.status)
    ).length;
    const soldOut = this.getSoldOut(performances).length;

    // Get prices from ticketTypes or pricingSections
    const validPrices = performances
      .map((p) => {
        let minPrice = null;

        // Check ticketTypes
        if (p.ticketTypes && Array.isArray(p.ticketTypes)) {
          const prices = p.ticketTypes
            .map(tt => tt.price || tt.basePrice)
            .filter(price => price != null && price > 0);
          if (prices.length > 0) {
            minPrice = Math.min(...prices);
          }
        }

        // Check pricingSections
        if (!minPrice && p.pricingSections && Array.isArray(p.pricingSections)) {
          const prices = p.pricingSections
            .map(ps => ps.basePrice || ps.price)
            .filter(price => price != null && price > 0);
          if (prices.length > 0) {
            const sectionMin = Math.min(...prices);
            minPrice = minPrice ? Math.min(minPrice, sectionMin) : sectionMin;
          }
        }

        // Fallback to direct price fields
        if (!minPrice) {
          minPrice = p.price || p.basePrice;
        }

        return minPrice || 0;
      })
      .filter((p) => p > 0);

    let priceRange = { min: 0, max: 0, display: "Price TBA" };

    if (validPrices.length > 0) {
      const minPrice = Math.min(...validPrices);
      const maxPrice = Math.max(...validPrices);
      priceRange = {
        min: minPrice,
        max: maxPrice,
        display:
          minPrice === maxPrice
            ? `HKD ${maxPrice.toLocaleString()}`
            : `HKD ${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()}`,
      };
    }

    return {
      total: performances.length,
      onSale,
      upcoming,
      soldOut,
      priceRange,
    };
  },

  /**
   * @description Filters performances based on criteria
   * @param {Array} performances - Performances array
   * @param {Object} filters - Filter criteria
   * @returns {Array} Filtered performances
   */
  filterPerformances(performances, filters = {}) {
    let filtered = performances;

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter((p) => p.title.toLowerCase().includes(search));
    }

    if (filters.status && filters.status !== "all") {
      filtered = filtered.filter((p) => p.status === filters.status);
    }

    if (filters.venue && filters.venue !== "all") {
      filtered = filtered.filter(
        (p) =>
          p.venueId === filters.venue ||
          String(p.venueId) === String(filters.venue)
      );
    }

    if (filters.date) {
      const filterDate = new Date(filters.date);
      filtered = filtered.filter((p) => {
        const perfDate = new Date(
          p.showtimes?.[0]?.dateTime || p.date || new Date()
        );
        return (
          perfDate.getFullYear() === filterDate.getFullYear() &&
          perfDate.getMonth() === filterDate.getMonth() &&
          perfDate.getDate() === filterDate.getDate()
        );
      });
    }

    if (filters.priceMin !== undefined) {
      filtered = filtered.filter((p) => (p.price || 0) >= filters.priceMin);
    }

    if (filters.priceMax !== undefined) {
      filtered = filtered.filter((p) => (p.price || 0) <= filters.priceMax);
    }

    if (filters.availability && filters.availability !== "all") {
      filtered = filtered.filter((p) => {
        const availPercent =
          ((p.availableSeats || 0) / (p.totalSeats || 1)) * 100;
        switch (filters.availability) {
          case "high":
            return availPercent > 50;
          case "medium":
            return availPercent > 20 && availPercent <= 50;
          case "low":
            return availPercent > 0 && availPercent <= 20;
          case "sold_out":
            return availPercent === 0;
          default:
            return true;
        }
      });
    }

    return filtered;
  },

  /**
   * @description Sorts performances by specified criteria
   * @param {Array} performances - Performances array
   * @param {string} sortBy - Sort criteria
   * @returns {Array} Sorted performances
   */
  sortPerformances(performances, sortBy = "date-asc") {
    const sorted = [...performances];

    const getPerformanceDate = (p) =>
      p.showtimes?.[0]?.dateTime || p.date || new Date();

    switch (sortBy) {
      case "date-asc":
        return sorted.sort((a, b) => {
          const dateA = getPerformanceDate(a);
          const dateB = getPerformanceDate(b);
          return dayjs(dateA).valueOf() - dayjs(dateB).valueOf();
        });

      case "date-desc":
        return sorted.sort((a, b) => {
          const dateA = getPerformanceDate(a);
          const dateB = getPerformanceDate(b);
          return dayjs(dateB).valueOf() - dayjs(dateA).valueOf();
        });

      case "title":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));

      case "price-asc":
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));

      case "price-desc":
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));

      default:
        return sorted;
    }
  },

  /**
   * @description Filters and sorts performances
   * @param {Array} performances - Performances array
   * @param {Object} filters - Filter criteria
   * @param {string} sortBy - Sort criteria
   * @returns {Array} Filtered and sorted performances
   */
  filterAndSort(performances, filters = {}, sortBy = "date-asc") {
    const filtered = this.filterPerformances(performances, filters);
    return this.sortPerformances(filtered, sortBy);
  },
};
