/**
 * @file bookingService.js
 * @description Service for managing booking data and operations
 * @author LI Ning 25127563d
 * @author SHEK chinhei 25017482d
 * @dependency dayjs
 * @dependency ./apiClient.js
 * @dependency ./responseExtractor.js
 * @see apiClient.js
 * @see bookingHelpers.js
 */

import dayjs from "dayjs";

import { bookingAPI, handleApiError } from "./apiClient.js";
import { ResponseExtractor } from "./responseExtractor.js";

/**
 * @description Booking service for managing booking data
 */
export const bookingService = {
  /**
   * @description Gets all bookings
   * @returns {Promise<Array>} Array of bookings
   */
  async getAll() {
    try {
      const response = await bookingAPI.getAll();
      return ResponseExtractor.extract(response, "bookings");
    } catch (error) {
      handleApiError(error);
      return [];
    }
  },

  /**
   * @description Gets a booking by ID
   * @param {number|string} bookingId - Booking ID
   * @returns {Promise<Object|null>} Booking data or null
   */
  async getById(bookingId) {
    try {
      const response = await bookingAPI.getById(bookingId);
      return ResponseExtractor.extractSingle(response, "booking");
    } catch (error) {
      handleApiError(error);
      return null;
    }
  },

  /**
   * @description Filters bookings for a specific user
   * @param {Array} bookings - Bookings array
   * @param {number|string} userId - User ID
   * @returns {Array} Filtered user bookings
   */
  filterUserBookings(bookings, userId) {
    if (!userId || !Array.isArray(bookings)) {return [];}

    return bookings.filter((b) => {
      return (
        b.userId === userId ||
        b.userId === String(userId) ||
        String(b.userId) === String(userId) ||
        b.customerInfo?.id === userId
      );
    });
  },

  /**
   * @description Gets all bookings for a specific user
   * @param {number|string} userId - User ID
   * @returns {Promise<Array>} User bookings
   */
  async getUserBookings(userId) {
    const allBookings = await this.getAll();
    return this.filterUserBookings(allBookings, userId);
  },

  /**
   * @description Gets upcoming confirmed bookings
   * @param {Array} bookings - Bookings array
   * @returns {Array} Upcoming bookings
   */
  getUpcomingBookings(bookings) {
    const now = dayjs();
    return bookings.filter(
      (b) => dayjs(b.performanceDate).isAfter(now) && b.status === "confirmed"
    );
  },

  /**
   * @description Gets past bookings
   * @param {Array} bookings - Bookings array
   * @returns {Array} Past bookings
   */
  getPastBookings(bookings) {
    const now = dayjs();
    return bookings.filter((b) => dayjs(b.performanceDate).isBefore(now));
  },

  /**
   * @description Gets confirmed bookings
   * @param {Array} bookings - Bookings array
   * @returns {Array} Confirmed bookings
   */
  getConfirmedBookings(bookings) {
    return bookings.filter((b) => b.status === "confirmed");
  },

  /**
   * @description Gets pending bookings
   * @param {Array} bookings - Bookings array
   * @returns {Array} Pending bookings
   */
  getPendingBookings(bookings) {
    return bookings.filter((b) => b.status === "pending");
  },

  /**
   * @description Gets cancelled bookings
   * @param {Array} bookings - Bookings array
   * @returns {Array} Cancelled bookings
   */
  getCancelledBookings(bookings) {
    return bookings.filter((b) => b.status === "cancelled");
  },

  /**
   * @description Calculates total amount spent on confirmed bookings
   * @param {Array} bookings - Bookings array
   * @returns {number} Total amount spent
   */
  calculateTotalSpent(bookings) {
    return bookings
      .filter((b) => b.status === "confirmed")
      .reduce((sum, b) => {
        const amount = parseFloat(b.totalAmount || b.amount || 0);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
  },

  /**
   * @description Calculates average amount spent per booking
   * @param {Array} bookings - Bookings array
   * @returns {number} Average amount spent
   */
  calculateAverageSpent(bookings) {
    if (!bookings.length) {return 0;}
    return this.calculateTotalSpent(bookings) / bookings.length;
  },

  /**
   * @description Gets comprehensive statistics for a user
   * @param {number|string} userId - User ID
   * @returns {Promise<Object>} User booking statistics
   */
  async getUserStats(userId) {
    const userBookings = await this.getUserBookings(userId);

    return {
      total: userBookings.length,
      upcoming: this.getUpcomingBookings(userBookings).length,
      past: this.getPastBookings(userBookings).length,
      confirmed: this.getConfirmedBookings(userBookings).length,
      pending: this.getPendingBookings(userBookings).length,
      cancelled: this.getCancelledBookings(userBookings).length,
      totalSpent: this.calculateTotalSpent(userBookings),
      averageSpent: this.calculateAverageSpent(userBookings),
      upcomingBookings: this.getUpcomingBookings(userBookings),
      pastBookings: this.getPastBookings(userBookings),
    };
  },

  /**
   * @description Filters bookings by status
   * @param {Array} bookings - Bookings array
   * @param {string} status - Status filter
   * @returns {Array} Filtered bookings
   */
  filterByStatus(bookings, status) {
    if (!status || status === "all") {return bookings;}

    const statusMap = {
      confirmed: this.getConfirmedBookings,
      pending: this.getPendingBookings,
      cancelled: this.getCancelledBookings,
    };

    const filterFn = statusMap[status];
    return filterFn ? filterFn.call(this, bookings) : bookings;
  },

  /**
   * @description Searches bookings by term
   * @param {Array} bookings - Bookings array
   * @param {string} searchTerm - Search term
   * @returns {Array} Matching bookings
   */
  searchBookings(bookings, searchTerm) {
    if (!searchTerm || !searchTerm.trim()) {return bookings;}

    const term = searchTerm.toLowerCase().trim();

    return bookings.filter((booking) => {
      const bookingRef = (booking.bookingReference || "").toLowerCase();
      const performanceTitle = (
        booking.performance?.title ||
        booking.performanceTitle ||
        ""
      ).toLowerCase();
      const customerName = (
        booking.customerInfo?.name ||
        booking.customerName ||
        ""
      ).toLowerCase();
      const customerEmail = (
        booking.customerInfo?.email ||
        booking.customerEmail ||
        ""
      ).toLowerCase();

      return (
        bookingRef.includes(term) ||
        performanceTitle.includes(term) ||
        customerName.includes(term) ||
        customerEmail.includes(term)
      );
    });
  },

  /**
   * @description Filters and searches bookings
   * @param {Array} bookings - Bookings array
   * @param {Object} filters - Filter criteria
   * @returns {Array} Filtered bookings
   */
  filterAndSearch(bookings, filters = {}) {
    let filtered = bookings;

    if (filters.status) {
      filtered = this.filterByStatus(filtered, filters.status);
    }

    if (filters.search) {
      filtered = this.searchBookings(filtered, filters.search);
    }

    return filtered;
  },

  /**
   * @description Sorts bookings by date
   * @param {Array} bookings - Bookings array
   * @param {boolean} ascending - Sort order
   * @returns {Array} Sorted bookings
   */
  sortByDate(bookings, ascending = false) {
    return [...bookings].sort((a, b) => {
      const dateA = dayjs(a.performanceDate || a.bookingDate);
      const dateB = dayjs(b.performanceDate || b.bookingDate);
      return ascending
        ? dateA.valueOf() - dateB.valueOf()
        : dateB.valueOf() - dateA.valueOf();
    });
  },

  /**
   * @description Sorts bookings by amount
   * @param {Array} bookings - Bookings array
   * @param {boolean} ascending - Sort order
   * @returns {Array} Sorted bookings
   */
  sortByAmount(bookings, ascending = true) {
    return [...bookings].sort((a, b) => {
      const amountA = a.amount || 0;
      const amountB = b.amount || 0;
      return ascending ? amountA - amountB : amountB - amountA;
    });
  },

  /**
   * @description Groups bookings by status
   * @param {Array} bookings - Bookings array
   * @returns {Object} Bookings grouped by status
   */
  groupByStatus(bookings) {
    return {
      confirmed: this.getConfirmedBookings(bookings),
      pending: this.getPendingBookings(bookings),
      cancelled: this.getCancelledBookings(bookings),
    };
  },

  /**
   * @description Groups bookings by month
   * @param {Array} bookings - Bookings array
   * @returns {Object} Bookings grouped by month
   */
  groupByMonth(bookings) {
    const grouped = {};

    bookings.forEach((booking) => {
      const monthKey = dayjs(
        booking.performanceDate || booking.bookingDate
      ).format("YYYY-MM");

      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }

      grouped[monthKey].push(booking);
    });

    return grouped;
  },

  /**
   * @description Gets bookings for a specific performance
   * @param {Array} bookings - Bookings array
   * @param {number|string} performanceId - Performance ID
   * @returns {Array} Performance bookings
   */
  getBookingsByPerformance(bookings, performanceId) {
    return bookings.filter(
      (b) =>
        b.performanceId === performanceId ||
        String(b.performanceId) === String(performanceId)
    );
  },

  /**
   * @description Calculates total seats booked
   * @param {Array} bookings - Bookings array
   * @returns {number} Total seats booked
   */
  getTotalSeatsBooked(bookings) {
    return bookings.reduce((total, booking) => {
      const seats = booking.seats || [];
      return total + seats.length;
    }, 0);
  },

  /**
   * @description Calculates revenue by performance
   * @param {Array} bookings - Bookings array
   * @returns {Array} Revenue data by performance
   */
  getRevenueByPerformance(bookings) {
    const revenueMap = {};

    bookings.forEach((booking) => {
      const perfId = booking.performanceId;
      if (!revenueMap[perfId]) {
        revenueMap[perfId] = {
          performanceId: perfId,
          performanceTitle: booking.performance?.title || "Unknown",
          totalRevenue: 0,
          bookingCount: 0,
          seatsBooked: 0,
        };
      }

      revenueMap[perfId].totalRevenue += booking.amount || 0;
      revenueMap[perfId].bookingCount += 1;
      revenueMap[perfId].seatsBooked += (booking.seats || []).length;
    });

    return Object.values(revenueMap);
  },

  /**
   * @description Fetches bookings for a specific performance from API with retry logic
   * @param {number} performanceId - Performance ID
   * @param {Object} options - Options for retry behavior
   * @returns {Promise<Array>} Array of bookings with seatTickets
   */
  async fetchBookingsByPerformance(performanceId, options = {}) {
    const { maxRetries = 3, retryDelay = 1000 } = options;
    let lastError = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await bookingAPI.getAll({
          performanceId,
        });
        const allBookings = ResponseExtractor.extract(response, "bookings");
        return allBookings.filter(b => b.status === "confirmed" || b.status === "pending");
      } catch (error) {
        lastError = error;
        console.warn(
          `Attempt ${attempt + 1}/${maxRetries} failed for getBookingsByPerformance:`,
          error.message
        );

        if (error.status && error.status >= 400 && error.status < 500) {
          break;
        }

        if (attempt < maxRetries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * Math.pow(2, attempt))
          );
        }
      }
    }

    handleApiError(
      lastError,
      `Failed to fetch bookings for performance ${performanceId}`
    );
    return [];
  },

  /**
   * @description Fetches bookings for a specific showtime from API with retry logic
   * @param {number} performanceId - Performance ID
   * @param {string} showtimeId - Showtime ID
   * @param {Object} options - Options for retry behavior
   * @returns {Promise<Array>} Array of bookings for the showtime
   */
  async fetchBookingsByShowtime(performanceId, showtimeId, options = {}) {
    const { maxRetries = 3, retryDelay = 1000 } = options;
    let lastError = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await bookingAPI.getAll({
          performanceId,
          showtimeId,
          status: "confirmed,pending",
        });
        return ResponseExtractor.extract(response, "bookings");
      } catch (error) {
        lastError = error;
        console.warn(
          `Attempt ${attempt + 1}/${maxRetries} failed for getBookingsByShowtime:`,
          error.message
        );

        // Don't retry on client errors (4xx), only on network/server errors
        if (error.status && error.status >= 400 && error.status < 500) {
          break;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * Math.pow(2, attempt))
          );
        }
      }
    }

    // All retries failed
    handleApiError(
      lastError,
      `Failed to fetch bookings for showtime ${showtimeId}`
    );
    return [];
  },
};
