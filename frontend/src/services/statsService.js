import { storage } from "/src/services/storageService.js";
import {
  MOCK_SIMPLE_PERFORMANCES,
  MOCK_BOOKINGS,
  MOCK_USERS,
} from "/src/data/mockData.js";

export const statsService = {
  async getAdminStats() {
    const performances = this.getPerformances();
    const bookings = this.getBookings();
    const users = this.getUsers();
    const revenue = this.calculateRevenue(bookings);

    return {
      totalPerformances: performances.length,
      upcomingPerformances: performances.filter((p) => p.status === "upcoming")
        .length,
      totalBookings: bookings.length,
      pendingBookings: bookings.filter((b) => b.status === "pending").length,
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.status === "active").length,
      revenue: revenue,
      monthlyRevenue: this.getMonthlyRevenue(bookings),
    };
  },

  getPerformances() {
    const stored = storage.getItem("performances", []);
    if (stored.length > 0) return stored;
    return MOCK_SIMPLE_PERFORMANCES;
  },

  getBookings() {
    const stored = storage.getItem("bookings", []);
    if (stored.length > 0) return stored;
    return MOCK_BOOKINGS;
  },

  getUsers() {
    const stored = storage.getItem("users", []);
    if (stored.length > 0) return stored;
    return MOCK_USERS;
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
    return `HKD ${amount.toLocaleString("en-HK")}`;
  },

  formatNumber(num) {
    return num.toLocaleString("en-HK");
  },
};
