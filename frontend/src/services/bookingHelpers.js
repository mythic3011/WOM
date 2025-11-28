
import dayjs from "dayjs";

import { calculationService } from "@utils/calculations.js";

export const bookingHelpers = {
  calculateTotalPrice(selectedSeats, pricing, ticketTypes) {
    if (!selectedSeats || selectedSeats.length === 0) {
      return {
        subtotal: 0,
        fees: 0,
        total: 0,
        breakdown: [],
      };
    }

    const breakdown = selectedSeats.map((seat) => {
      const basePrice = this.getSeatPrice(seat, pricing);
      const ticketTypeMultiplier =
        ticketTypes?.[seat.ticketType]?.discount || 1.0;
      const seatPrice = basePrice * ticketTypeMultiplier;

      return {
        seatId: seat.id || seat.seatId,
        basePrice,
        ticketType: seat.ticketType,
        multiplier: ticketTypeMultiplier,
        price: seatPrice,
      };
    });

    const subtotal = breakdown.reduce((sum, item) => sum + item.price, 0);
    const fees = calculationService.calculateBookingFees(subtotal).fees;
    const total = subtotal + fees;

    return {
      subtotal,
      fees,
      total,
      breakdown,
      seatCount: selectedSeats.length,
    };
  },

  getSeatPrice(seat, pricing) {
    if (!pricing) {return 0;}

    const tierPricing = {
      VIP: pricing.vipPrice || pricing.basePrice * 1.5,
      PREMIUM: pricing.premiumPrice || pricing.basePrice * 1.2,
      STANDARD: pricing.standardPrice || pricing.basePrice,
      ECONOMY: pricing.economyPrice || pricing.basePrice * 0.8,
    };

    const tier = seat.tier || seat.section || "STANDARD";
    return tierPricing[tier] || pricing.basePrice;
  },

  canCancelBooking(booking, currentDate = new Date()) {
    if (!booking) {return false;}

    if (booking.status === "cancelled" || booking.status === "completed") {
      return false;
    }

    const performanceDate = new Date(
      booking.performanceDate || booking.showtime?.date
    );
    const now =
      currentDate instanceof Date ? currentDate : new Date(currentDate);

    const hoursDiff = (performanceDate - now) / (1000 * 60 * 60);

    return hoursDiff >= 24;
  },

  getStatusInfo(status) {
    const statusMap = {
      pending: {
        label: "Pending",
        color: "yellow",
        icon: "fa-clock",
        description: "Awaiting confirmation",
        badgeClass: "bg-yellow-100 text-yellow-800",
      },
      confirmed: {
        label: "Confirmed",
        color: "green",
        icon: "fa-check-circle",
        description: "Booking confirmed",
        badgeClass: "bg-green-100 text-green-800",
      },
      cancelled: {
        label: "Cancelled",
        color: "red",
        icon: "fa-times-circle",
        description: "Booking cancelled",
        badgeClass: "bg-red-100 text-red-800",
      },
      completed: {
        label: "Completed",
        color: "blue",
        icon: "fa-check-double",
        description: "Event completed",
        badgeClass: "bg-blue-100 text-blue-800",
      },
      expired: {
        label: "Expired",
        color: "gray",
        icon: "fa-calendar-times",
        description: "Booking expired",
        badgeClass: "bg-gray-100 text-gray-800",
      },
    };

    return (
      statusMap[status] || {
        label: status || "Unknown",
        color: "gray",
        icon: "fa-question-circle",
        description: "Unknown status",
        badgeClass: "bg-gray-100 text-gray-800",
      }
    );
  },

  filterBookings(bookings, filters) {
    if (!bookings) {return [];}

    let filtered = [...bookings];

    if (filters.status) {
      filtered = filtered.filter((b) => b.status === filters.status);
    }

    if (filters.dateFrom) {
      const dateFrom = dayjs(filters.dateFrom);
      filtered = filtered.filter((b) =>
        dayjs(b.performanceDate).isAfter(dateFrom)
      );
    }

    if (filters.dateTo) {
      const dateTo = dayjs(filters.dateTo);
      filtered = filtered.filter((b) =>
        dayjs(b.performanceDate).isBefore(dateTo)
      );
    }

    if (filters.performanceId) {
      filtered = filtered.filter(
        (b) => b.performanceId === filters.performanceId
      );
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.performanceTitle?.toLowerCase().includes(search) ||
          b.customerInfo?.name?.toLowerCase().includes(search) ||
          b.id?.toLowerCase().includes(search)
      );
    }

    return filtered;
  },

  sortBookings(bookings, sortBy = "date-desc") {
    if (!bookings) {return [];}

    const sorted = [...bookings];

    switch (sortBy) {
      case "date-asc":
        return sorted.sort(
          (a, b) => new Date(a.performanceDate) - new Date(b.performanceDate)
        );
      case "date-desc":
        return sorted.sort(
          (a, b) => new Date(b.performanceDate) - new Date(a.performanceDate)
        );
      case "amount-asc":
        return sorted.sort(
          (a, b) => (a.totalAmount || 0) - (b.totalAmount || 0)
        );
      case "amount-desc":
        return sorted.sort(
          (a, b) => (b.totalAmount || 0) - (a.totalAmount || 0)
        );
      case "status":
        return sorted.sort((a, b) =>
          (a.status || "").localeCompare(b.status || "")
        );
      default:
        return sorted;
    }
  },

  groupByStatus(bookings) {
    if (!bookings) {return {};}

    return bookings.reduce((groups, booking) => {
      const status = booking.status || "unknown";
      if (!groups[status]) {
        groups[status] = [];
      }
      groups[status].push(booking);
      return groups;
    }, {});
  },

  groupByDate(bookings) {
    if (!bookings) {return {};}

    return bookings.reduce((groups, booking) => {
      const date = dayjs(booking.performanceDate).format("YYYY-MM-DD");
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(booking);
      return groups;
    }, {});
  },
};
