
import dayjs from "dayjs";

import { bookingAPI, handleApiError } from "./apiClient.js";
import { ResponseExtractor } from "./responseExtractor.js";

export const bookingService = {
  async getAll() {
    try {
      const response = await bookingAPI.getAll();
      return ResponseExtractor.extract(response, "bookings");
    } catch (error) {
      handleApiError(error);
      return [];
    }
  },

  async getById(bookingId) {
    try {
      const response = await bookingAPI.getById(bookingId);
      return ResponseExtractor.extractSingle(response, "booking");
    } catch (error) {
      handleApiError(error);
      return null;
    }
  },

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

  async getUserBookings(userId) {
    const allBookings = await this.getAll();
    return this.filterUserBookings(allBookings, userId);
  },

  getUpcomingBookings(bookings) {
    const now = dayjs();
    return bookings.filter(
      (b) => dayjs(b.performanceDate).isAfter(now) && b.status === "confirmed"
    );
  },

  getPastBookings(bookings) {
    const now = dayjs();
    return bookings.filter((b) => dayjs(b.performanceDate).isBefore(now));
  },

  getConfirmedBookings(bookings) {
    return bookings.filter((b) => b.status === "confirmed");
  },

  getPendingBookings(bookings) {
    return bookings.filter((b) => b.status === "pending");
  },

  getCancelledBookings(bookings) {
    return bookings.filter((b) => b.status === "cancelled");
  },

  calculateTotalSpent(bookings) {
    return bookings.reduce((sum, b) => {
      const amount = parseFloat(b.amount || b.totalAmount || 0);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
  },

  calculateAverageSpent(bookings) {
    if (!bookings.length) {return 0;}
    return this.calculateTotalSpent(bookings) / bookings.length;
  },

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

  sortByDate(bookings, ascending = false) {
    return [...bookings].sort((a, b) => {
      const dateA = dayjs(a.performanceDate || a.bookingDate);
      const dateB = dayjs(b.performanceDate || b.bookingDate);
      return ascending
        ? dateA.valueOf() - dateB.valueOf()
        : dateB.valueOf() - dateA.valueOf();
    });
  },

  sortByAmount(bookings, ascending = true) {
    return [...bookings].sort((a, b) => {
      const amountA = a.amount || 0;
      const amountB = b.amount || 0;
      return ascending ? amountA - amountB : amountB - amountA;
    });
  },

  groupByStatus(bookings) {
    return {
      confirmed: this.getConfirmedBookings(bookings),
      pending: this.getPendingBookings(bookings),
      cancelled: this.getCancelledBookings(bookings),
    };
  },

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

  getBookingsByPerformance(bookings, performanceId) {
    return bookings.filter(
      (b) =>
        b.performanceId === performanceId ||
        String(b.performanceId) === String(performanceId)
    );
  },

  getTotalSeatsBooked(bookings) {
    return bookings.reduce((total, booking) => {
      const seats = booking.seats || [];
      return total + seats.length;
    }, 0);
  },

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
   * Fetch bookings for a specific performance with retry logic
   * @param {number} performanceId - Performance ID
   * @param {Object} options - Options for retry behavior
   * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
   * @param {number} options.retryDelay - Delay between retries in ms (default: 1000)
   * @returns {Promise<Array>} Array of bookings with seatTickets
   */
  async getBookingsByPerformance(performanceId, options = {}) {
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
   * Fetch bookings for a specific showtime with retry logic
   * @param {number} performanceId - Performance ID
   * @param {string} showtimeId - Showtime ID
   * @param {Object} options - Options for retry behavior
   * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
   * @param {number} options.retryDelay - Delay between retries in ms (default: 1000)
   * @returns {Promise<Array>} Array of bookings for the showtime
   */
  async getBookingsByShowtime(performanceId, showtimeId, options = {}) {
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
