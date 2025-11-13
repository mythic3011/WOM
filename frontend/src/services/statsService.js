import { storage } from "/src/services/storageService.js";
import { ResponseExtractor } from "/src/services/responseExtractor.js";
import {
  performanceAPI,
  bookingAPI,
  userAPI,
} from "/src/services/apiClient.js";
import {
  formatCurrency as utilsFormatCurrency,
  formatNumber as utilsFormatNumber,
} from "/src/utils/utils.js";

export const statsService = {
  migrateShowtimes(performances) {
    return performances.map((p) => {
      if (!p.showtimes || p.showtimes.length === 0) {
        return p;
      }

      const firstShowtime = p.showtimes[0];
      if (typeof firstShowtime === "string") {
        const migratedShowtimes = p.showtimes.map((dateTime, index) => ({
          id: `showtime_${p.id}_${Date.now()}_${index}`,
          dateTime: dateTime,
          venueName: p.venue || p.venueName || "Concert Hall",
          venueId: p.venueId || 1,
        }));

        return {
          ...p,
          showtimes: migratedShowtimes,
        };
      }

      return p;
    });
  },

  async getAdminStats() {
    const performances = await this.getPerformances();
    const bookings = await this.getBookings();
    const users = await this.getUsers();
    const revenue = this.calculateRevenue(bookings);

    return {
      totalPerformances: performances.length,
      upcomingPerformances: performances.filter((p) => p.status === "upcoming")
        .length,
      performancesTrend: this.calculatePerformancesTrend(performances),
      totalBookings: bookings.length,
      pendingBookings: bookings.filter((b) => b.status === "pending").length,
      bookingsTrend: this.calculateBookingsTrend(bookings),
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.status === "active").length,
      usersTrend: this.calculateUsersTrend(users),
      revenue: revenue,
      monthlyRevenue: this.getMonthlyRevenue(bookings),
      revenueTrend: this.calculateRevenueTrend(bookings),
    };
  },

  async getPerformances() {
    try {
      const response = await performanceAPI.getAll();
      const performances = ResponseExtractor.extract(response, "performances");
      return this.migrateShowtimes(performances);
    } catch (error) {
      console.error("Failed to fetch performances:", error);
      return [];
    }
  },

  async getBookings() {
    try {
      const response = await bookingAPI.getAll();
      return ResponseExtractor.extract(response, "bookings");
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      return [];
    }
  },

  async getUsers() {
    try {
      const response = await userAPI.getAll();
      return ResponseExtractor.extract(response, "users");
    } catch (error) {
      console.error("Failed to fetch users:", error);
      return [];
    }
  },

  calculateRevenue(bookings) {
    const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
    return confirmedBookings.reduce(
      (total, booking) => total + booking.amount,
      0
    );
  },

  getMonthlyRevenue(bookings) {
    const currentMonth = new Date().getMonth();
    const monthlyBookings = bookings.filter((b) => {
      const bookingMonth = new Date(b.date).getMonth();
      return bookingMonth === currentMonth && b.status === "confirmed";
    });
    return this.calculateRevenue(monthlyBookings);
  },

  calculatePerformancesTrend(performances) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;

    const currentMonthPerf = performances.filter((p) => {
      const date = new Date(p.date || p.createdAt);
      return date.getMonth() === currentMonth;
    }).length;

    const lastMonthPerf = performances.filter((p) => {
      const date = new Date(p.date || p.createdAt);
      return date.getMonth() === lastMonth;
    }).length;

    return this.calculateTrendPercentage(currentMonthPerf, lastMonthPerf);
  },

  calculateBookingsTrend(bookings) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;

    const currentMonthBookings = bookings.filter((b) => {
      const date = new Date(b.date);
      return date.getMonth() === currentMonth;
    }).length;

    const lastMonthBookings = bookings.filter((b) => {
      const date = new Date(b.date);
      return date.getMonth() === lastMonth;
    }).length;

    return this.calculateTrendPercentage(
      currentMonthBookings,
      lastMonthBookings
    );
  },

  calculateUsersTrend(users) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;

    const currentMonthUsers = users.filter((u) => {
      const date = new Date(u.createdAt);
      return date.getMonth() === currentMonth;
    }).length;

    const lastMonthUsers = users.filter((u) => {
      const date = new Date(u.createdAt);
      return date.getMonth() === lastMonth;
    }).length;

    return this.calculateTrendPercentage(currentMonthUsers, lastMonthUsers);
  },

  calculateRevenueTrend(bookings) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;

    const currentMonthRevenue = bookings
      .filter((b) => {
        const date = new Date(b.date);
        return date.getMonth() === currentMonth && b.status === "confirmed";
      })
      .reduce((total, b) => total + b.amount, 0);

    const lastMonthRevenue = bookings
      .filter((b) => {
        const date = new Date(b.date);
        return date.getMonth() === lastMonth && b.status === "confirmed";
      })
      .reduce((total, b) => total + b.amount, 0);

    return this.calculateTrendPercentage(currentMonthRevenue, lastMonthRevenue);
  },

  calculateTrendPercentage(current, previous) {
    if (previous === 0 && current === 0) {
      return { value: "0%", isUp: false };
    }
    if (previous === 0) {
      return { value: "100%", isUp: true };
    }

    const percentage = ((current - previous) / previous) * 100;
    const isUp = percentage >= 0;
    const absPercentage = Math.abs(percentage);

    return {
      value: `${isUp ? "+" : "-"}${absPercentage.toFixed(1)}%`,
      isUp: isUp,
    };
  },

  async getRecentActivity() {
    const bookings = this.getBookings();
    const sortedBookings = bookings
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    return sortedBookings.map((booking) => ({
      id: booking.id,
      type: "booking",
      description: `New booking for ${booking.seats.length} seat(s)`,
      amount: booking.amount,
      status: booking.status,
      date: booking.date,
      icon: "fa-ticket-alt",
      color:
        booking.status === "confirmed"
          ? "green"
          : booking.status === "pending"
          ? "yellow"
          : "red",
    }));
  },

  formatCurrency(amount) {
    return utilsFormatCurrency(amount);
  },

  formatNumber(num) {
    return utilsFormatNumber(num);
  },
};
