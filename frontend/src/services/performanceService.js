import { performanceAPI, handleApiError } from "./apiClient.js";
import { ResponseExtractor } from "./responseExtractor.js";
import dayjs from "dayjs";

export const performanceService = {
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

  async getById(id) {
    try {
      const response = await performanceAPI.getById(id);
      return ResponseExtractor.extractSingle(response, "performance");
    } catch (error) {
      console.error(`Failed to fetch performance ${id}:`, error);
      throw error;
    }
  },

  async create(performanceData) {
    try {
      const response = await performanceAPI.create(performanceData);
      return response.data;
    } catch (error) {
      console.error("Failed to create performance:", error);
      throw error;
    }
  },

  async update(id, performanceData) {
    try {
      const response = await performanceAPI.update(id, performanceData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update performance ${id}:`, error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const response = await performanceAPI.delete(id);
      return response.data;
    } catch (error) {
      console.error(`Failed to delete performance ${id}:`, error);
      throw error;
    }
  },

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

  getUpcoming(performances = null) {
    if (performances) {
      return this.filterUpcoming(performances);
    }
    return this.getAll().then((perfs) => this.filterUpcoming(perfs));
  },

  filterUpcoming(performances) {
    const now = dayjs();
    return performances.filter(
      (p) => dayjs(p.date).isAfter(now) && p.status !== "sold_out"
    );
  },

  getOnSale(performances) {
    return performances.filter(
      (p) => p.ticketingInfo?.status === "on_sale" || p.status === "on_sale"
    );
  },

  getSoldOut(performances) {
    return performances.filter(
      (p) => p.ticketingInfo?.status === "sold_out" || p.status === "sold_out"
    );
  },

  getPerformanceStats(performances) {
    const onSale = this.getOnSale(performances).length;
    const upcoming = performances.filter(
      (p) =>
        p.ticketingInfo?.status === "upcoming" ||
        p.status === "upcoming" ||
        (!p.ticketingInfo?.status && !p.status)
    ).length;
    const soldOut = this.getSoldOut(performances).length;

    const validPrices = performances
      .map((p) => p.price || 0)
      .filter((p) => p > 0);

    let priceRange = { min: 0, max: 0, display: "N/A" };

    if (validPrices.length > 0) {
      const minPrice = Math.min(...validPrices);
      const maxPrice = Math.max(...validPrices);
      priceRange = {
        min: minPrice,
        max: maxPrice,
        display:
          minPrice === maxPrice
            ? `HKD ${maxPrice}`
            : `HKD ${minPrice}-${maxPrice}`,
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

  filterAndSort(performances, filters = {}, sortBy = "date-asc") {
    const filtered = this.filterPerformances(performances, filters);
    return this.sortPerformances(filtered, sortBy);
  },
};
