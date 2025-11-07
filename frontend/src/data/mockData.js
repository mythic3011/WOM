import { DataFactory, DateUtils, DataQuery } from "./mockDataFactory.js";
import { MOCK_USERS_STATIC } from "./mockUsers.js";
import {
  MOCK_VENUES,
  calculateVenueCapacity,
  getVenueById,
  getActiveVenues,
  getVenuesByCapacity,
  searchVenues,
} from "./mockVenues.js";
import {
  MOCK_PERFORMANCES,
  getPerformanceById,
  getPerformancesByVenue,
  getPerformancesByStatus,
  getUpcomingPerformances,
  searchPerformances,
  getPerformancesByComposer,
  getPerformancesByCategory,
} from "./mockPerformances.js";
import {
  MOCK_SEATS,
  MOCK_BOOKINGS,
  MOCK_TRANSACTIONS,
  generateAllSeats,
  generateAllBookings,
  getSeatsForPerformance,
  getAvailableSeats,
  getSeatById,
  getBookingsForUser,
  getBookingByReference,
  getBookingsForPerformance,
  getTransactionsForUser,
  formatSeatDisplay,
  formatSeatsDisplay,
  getSeatsSummary,
  formatBookingForDisplay,
} from "./mockSeatsAndBookings.js";
import {
  TICKET_TYPES,
  SYSTEM_TICKET_TYPE_IDS,
  DEFAULT_TICKET_TYPES,
  SEAT_TIERS,
  SEAT_TIER_LABELS,
  SEAT_STATUSES,
  BOOKING_STATUSES,
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_COLORS,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_METHODS,
  PERFORMANCE_STATUSES,
  USER_ROLES,
  VENUE_STATUSES,
  NOTIFICATION_TYPES,
  getBookingStatusLabel,
  getBookingStatusColor,
  getPaymentStatusLabel,
  getPaymentStatusColor,
} from "./mockDataConfig.js";

export { DataFactory, DateUtils, DataQuery };

export {
  MOCK_VENUES,
  MOCK_PERFORMANCES,
  MOCK_SEATS,
  MOCK_BOOKINGS,
  MOCK_TRANSACTIONS,
};

export {
  TICKET_TYPES,
  SYSTEM_TICKET_TYPE_IDS,
  DEFAULT_TICKET_TYPES,
  SEAT_TIERS,
  SEAT_TIER_LABELS,
  SEAT_STATUSES,
  BOOKING_STATUSES,
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_COLORS,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_METHODS,
  PERFORMANCE_STATUSES,
  USER_ROLES,
  VENUE_STATUSES,
  NOTIFICATION_TYPES,
  getBookingStatusLabel,
  getBookingStatusColor,
  getPaymentStatusLabel,
  getPaymentStatusColor,
};

export {
  formatSeatDisplay,
  formatSeatsDisplay,
  getSeatsSummary,
  formatBookingForDisplay,
};

export { ZonePricing } from "/src/utils/booking/zonePricing.js";

export const MOCK_USERS_REFERENCE = MOCK_USERS_STATIC;
export const MOCK_USERS = MOCK_USERS_REFERENCE;

export const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    userId: 1,
    type: NOTIFICATION_TYPES.BOOKING_CONFIRMED,
    title: "Booking Confirmed",
    message: "Your booking for Symphony No. 9 - Beethoven has been confirmed",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: 2,
    userId: 1,
    type: NOTIFICATION_TYPES.PERFORMANCE_REMINDER,
    title: "Performance Reminder",
    message: "Your performance is tomorrow at 7:30 PM",
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: 3,
    userId: 1,
    type: NOTIFICATION_TYPES.PAYMENT_SUCCESS,
    title: "Payment Successful",
    message: "Payment of HKD 1200 has been processed successfully",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
];

export const MOCK_SIMPLE_PERFORMANCES = MOCK_PERFORMANCES.map((p) => ({
  id: String(p.id),
  title: p.title,
  date: p.date,
  venue: p.venueName,
  venueName: p.venueName,
  price: p.pricingSections?.[0]?.basePrice || 200,
  pricingSections: p.pricingSections || [],
  showtimes: p.showtimes || [],
  composer: p.composer,
  conductor: p.conductor,
  orchestra: p.orchestra,
  description: p.description,
  imageUrl: p.imageUrl,
  status: p.status || "upcoming",
  ticketingInfo: p.ticketingInfo,
}));

export const MOCK_EVENTS = MOCK_PERFORMANCES;
export const MOCK_STALLS = MOCK_SEATS;
export const MOCK_SIMPLE_USERS = MOCK_USERS;

export const MockDataHelpers = {
  getUserById(id) {
    return MOCK_USERS.find((u) => u.id === id || u.id === String(id));
  },

  getVenueById(id) {
    return getVenueById(id);
  },

  getPerformanceById(id) {
    return getPerformanceById(id);
  },

  getBookingById(id) {
    return MOCK_BOOKINGS.find((b) => b.id === id || b.id === String(id));
  },

  getSeatById(id) {
    return getSeatById(id);
  },

  getBookingsByUserId(userId) {
    return getBookingsForUser(userId);
  },

  getBookingsByPerformanceId(performanceId) {
    return getBookingsForPerformance(performanceId);
  },

  getTransactionsByUserId(userId) {
    return getTransactionsForUser(userId);
  },

  getAvailableSeatsForPerformance(performanceId, showtimeIndex = 0) {
    return getAvailableSeats(performanceId, showtimeIndex);
  },

  getSeatsForPerformance(performanceId, showtimeIndex = 0) {
    return getSeatsForPerformance(performanceId, showtimeIndex);
  },

  formatSeatDisplay(seat) {
    return formatSeatDisplay(seat);
  },

  formatSeatsDisplay(seats) {
    return formatSeatsDisplay(seats);
  },

  getSeatsSummary(seats) {
    return getSeatsSummary(seats);
  },

  formatBookingForDisplay(booking) {
    return formatBookingForDisplay(booking);
  },

  getBookingStatusLabel(status) {
    return getBookingStatusLabel(status);
  },

  getBookingStatusColor(status) {
    return getBookingStatusColor(status);
  },

  getPaymentStatusLabel(status) {
    return getPaymentStatusLabel(status);
  },

  getPaymentStatusColor(status) {
    return getPaymentStatusColor(status);
  },

  getUpcomingPerformances() {
    return getUpcomingPerformances();
  },

  searchPerformances(query) {
    return searchPerformances(query);
  },

  searchVenues(query) {
    return searchVenues(query);
  },

  getPerformanceStats() {
    const total = MOCK_PERFORMANCES.length;
    const byStatus = {};
    Object.values(PERFORMANCE_STATUSES).forEach((status) => {
      byStatus[status] = MOCK_PERFORMANCES.filter(
        (p) => p.status === status
      ).length;
    });

    return {
      total,
      byStatus,
      upcoming: getUpcomingPerformances().length,
    };
  },

  getBookingStats() {
    const total = MOCK_BOOKINGS.length;
    const byStatus = {};
    Object.values(BOOKING_STATUSES).forEach((status) => {
      byStatus[status] = MOCK_BOOKINGS.filter(
        (b) => b.status === status
      ).length;
    });

    const totalRevenue = MOCK_BOOKINGS.filter(
      (b) => b.status === BOOKING_STATUSES.CONFIRMED
    ).reduce((sum, b) => sum + b.totalAmount, 0);

    return {
      total,
      byStatus,
      totalRevenue,
    };
  },

  getVenueStats() {
    const total = MOCK_VENUES.length;
    const active = getActiveVenues().length;
    const totalCapacity = MOCK_VENUES.reduce((sum, v) => sum + v.capacity, 0);

    return {
      total,
      active,
      totalCapacity,
      averageCapacity: Math.round(totalCapacity / total),
    };
  },

  getUserStats() {
    const total = MOCK_USERS.length;
    const byRole = {};
    Object.values(USER_ROLES).forEach((role) => {
      byRole[role] = MOCK_USERS.filter((u) => u.role === role).length;
    });

    return {
      total,
      byRole,
    };
  },

  getRevenueByPerformance() {
    const revenueMap = {};
    MOCK_BOOKINGS.filter(
      (b) => b.status === BOOKING_STATUSES.CONFIRMED
    ).forEach((booking) => {
      if (!revenueMap[booking.performanceId]) {
        revenueMap[booking.performanceId] = {
          performanceId: booking.performanceId,
          performanceTitle: booking.performanceTitle,
          revenue: 0,
          bookingCount: 0,
        };
      }
      revenueMap[booking.performanceId].revenue += booking.totalAmount;
      revenueMap[booking.performanceId].bookingCount++;
    });

    return Object.values(revenueMap).sort((a, b) => b.revenue - a.revenue);
  },

  getTopPerformances(limit = 10) {
    return this.getRevenueByPerformance().slice(0, limit);
  },

  getTopCustomers(limit = 10) {
    const customerStats = {};

    MOCK_BOOKINGS.filter(
      (b) => b.status === BOOKING_STATUSES.CONFIRMED
    ).forEach((booking) => {
      const userId = booking.userId;
      if (!customerStats[userId]) {
        customerStats[userId] = {
          user: this.getUserById(userId),
          totalSpent: 0,
          bookingCount: 0,
        };
      }
      customerStats[userId].totalSpent += booking.totalAmount;
      customerStats[userId].bookingCount++;
    });

    return Object.values(customerStats)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit);
  },

  exportToCSV(data, type) {
    let headers = [];
    let rows = [];

    switch (type) {
      case "bookings":
        headers = [
          "Booking ID",
          "Reference",
          "Performance",
          "User",
          "Seats",
          "Amount",
          "Status",
          "Date",
        ];
        rows = data.map((b) => [
          b.id,
          b.bookingReference,
          b.performanceTitle,
          b.userName,
          b.seatCount,
          b.totalAmount,
          b.status,
          new Date(b.bookingDate).toLocaleDateString(),
        ]);
        break;

      case "performances":
        headers = ["ID", "Title", "Composer", "Venue", "Date", "Status"];
        rows = data.map((p) => [
          p.id,
          p.title,
          p.composer,
          p.venueName,
          new Date(p.date).toLocaleDateString(),
          p.status,
        ]);
        break;

      case "venues":
        headers = ["ID", "Name", "Address", "Capacity", "Status"];
        rows = data.map((v) => [v.id, v.name, v.address, v.capacity, v.status]);
        break;

      default:
        return "";
    }

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");
    return csvContent;
  },

  downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  refreshData() {
    console.log("Refreshing mock data...");
    return {
      venues: MOCK_VENUES.length,
      performances: MOCK_PERFORMANCES.length,
      users: MOCK_USERS.length,
      seats: MOCK_SEATS.length,
      bookings: MOCK_BOOKINGS.length,
      transactions: MOCK_TRANSACTIONS.length,
    };
  },
};

export default {
  MOCK_VENUES,
  MOCK_USERS,
  MOCK_PERFORMANCES,
  MOCK_SEATS,
  MOCK_BOOKINGS,
  MOCK_TRANSACTIONS,
  MOCK_NOTIFICATIONS,
  MockDataHelpers,
  DataFactory,
  DateUtils,
  DataQuery,
};
