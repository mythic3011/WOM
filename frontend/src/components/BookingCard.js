
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import { createBadge } from "@components/common/Badge.js";
import { statsService } from "@services/statsService.js";
import { getDisplayLabel } from "@utils/seatIdHelper.js";

dayjs.extend(relativeTime);

export const BookingCard = {
  renderCompact(booking) {
    const statusBadge = this.getStatusBadge(booking.status);
    const { seatLabels, ticketInfo, isNewFormat } = this.extractBookingData(booking);

    return `
      <div class="border-l-4 border-indigo-600 bg-indigo-50 p-4 rounded-lg hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <h3 class="font-bold text-gray-900 text-lg mb-1">${booking.performanceTitle
      }</h3>
            <div class="space-y-1 text-sm text-gray-600">
              <p>
                <i class="fas fa-calendar text-indigo-600 w-5"></i>
                ${dayjs(booking.performanceDate).format("dddd, MMMM D, YYYY")}
              </p>
              <p>
                <i class="fas fa-clock text-indigo-600 w-5"></i>
                ${dayjs(booking.performanceDate).format("h:mm A")}
                <span class="text-gray-400">• ${dayjs(
        booking.performanceDate
      ).fromNow()}</span>
              </p>
              <p>
                <i class="fas fa-map-marker-alt text-indigo-600 w-5"></i>
                ${booking.venueName || booking.venue?.name || booking.venue || "Venue TBA"}
              </p>
              <p>
                <i class="fas fa-chair text-indigo-600 w-5"></i>
                ${seatLabels.join(", ")}
                ${isNewFormat ? '<span class="ml-1 text-xs text-green-600" title="Using optimized format"><i class="fas fa-check-circle"></i></span>' : ''}
              </p>
            </div>
          </div>
          <div class="text-right ml-4">
            ${statusBadge}
            <p class="text-2xl font-bold text-indigo-600 mt-2">${statsService.formatCurrency(
        booking.amount
      )}</p>
            <p class="text-xs text-gray-500">${ticketInfo || "Standard"
      }</p>
          </div>
        </div>
        <div class="mt-3 flex gap-2">
          <a href="/user/bookings" data-link class="flex-1 px-3 py-1.5 bg-indigo-600 text-white text-center text-sm rounded hover:bg-indigo-700 transition-colors">
            <i class="fas fa-ticket-alt mr-1"></i>
            View Ticket
          </a>
          <button 
            class="add-to-calendar-btn px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors" 
            data-booking-id="${booking.id}"
            data-title="${booking.performanceTitle}"
            data-date="${booking.performanceDate}"
            data-venue="${booking.venueName || booking.venue?.name || booking.venue || 'Venue TBA'}"
            title="Add to Calendar">
            <i class="fas fa-calendar-plus"></i>
          </button>
        </div>
      </div>
    `;
  },

  renderGrid(booking, performance, showtime = null) {
    const eventDate = showtime
      ? new Date(showtime.dateTime || showtime.datetime)
      : performance
        ? new Date(performance.date)
        : null;
    const performanceDate = eventDate;
    const isUpcoming = performanceDate && performanceDate > new Date();

    const statusConfig = {
      confirmed: {
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
        textColor: "text-emerald-700",
        badgeBg: "bg-emerald-100",
        badgeText: "text-emerald-700",
        icon: "fa-check-circle",
        text: "Confirmed",
      },
      pending: {
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        textColor: "text-amber-700",
        badgeBg: "bg-amber-100",
        badgeText: "text-amber-700",
        icon: "fa-clock",
        text: "Pending",
      },
      cancelled: {
        bgColor: "bg-rose-50",
        borderColor: "border-rose-200",
        textColor: "text-rose-700",
        badgeBg: "bg-rose-100",
        badgeText: "text-rose-700",
        icon: "fa-times-circle",
        text: "Cancelled",
      },
      completed: {
        bgColor: "bg-sky-50",
        borderColor: "border-sky-200",
        textColor: "text-sky-700",
        badgeBg: "bg-sky-100",
        badgeText: "text-sky-700",
        icon: "fa-check-double",
        text: "Completed",
      },
    };

    const status = statusConfig[booking.status] || statusConfig.pending;
    const { seatLabels, isNewFormat } = this.extractBookingData(booking);
    const seatCount = seatLabels.length;

    return `
      <div class="group bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-indigo-300 transition-all duration-300 overflow-hidden">
        <!-- Status Header -->
        <div class="px-5 pt-4 pb-3 flex items-center justify-between">
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 ${status.badgeBg} ${status.badgeText} rounded-full text-xs font-bold tracking-wide">
            <i class="fas ${status.icon}"></i>
            ${status.text.toUpperCase()}
          </span>
          ${isUpcoming
        ? `<span class="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full text-xs font-bold shadow-sm">
                <i class="fas fa-star"></i>UPCOMING
              </span>`
        : ""
      }
        </div>

        <!-- Content -->
        <div class="px-5 pb-4">
          <h3 class="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
            ${performance?.title || "Unknown Performance"}
          </h3>

          <div class="space-y-2.5 text-sm">
            <div class="flex items-center gap-2.5 text-gray-700">
              <div class="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <i class="fas fa-calendar text-indigo-600 text-xs"></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold truncate">${performanceDate ? dayjs(performanceDate).format("MMM D, YYYY") : "N/A"}</p>
                <p class="text-xs text-gray-500">${performanceDate ? dayjs(performanceDate).format("h:mm A") : ""}</p>
              </div>
            </div>

            <div class="flex items-center gap-2.5 text-gray-700">
              <div class="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                <i class="fas fa-map-marker-alt text-purple-600 text-xs"></i>
              </div>
              <p class="flex-1 min-w-0 font-medium truncate">${performance?.venueName || performance?.location || performance?.venue || "N/A"}</p>
            </div>

            <div class="flex items-center gap-2.5 text-gray-700">
              <div class="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0">
                <i class="fas fa-couch text-pink-600 text-xs"></i>
              </div>
              <p class="font-semibold">${seatCount} Seat${seatCount !== 1 ? "s" : ""}</p>
            </div>
          </div>

          ${seatLabels.length > 0
        ? `
            <div class="mt-4 pt-4 border-t border-gray-100">
              <div class="flex flex-wrap gap-1.5">
                ${seatLabels
          .slice(0, 6)
          .map((label) => {
            return `<span class="px-2.5 py-1 bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold">${label}</span>`;
          })
          .join("")}
                ${seatCount > 6 ? `<span class="px-2.5 py-1 bg-gray-100 text-gray-600 border border-gray-200 rounded-lg text-xs font-semibold">+${seatCount - 6} more</span>` : ""}
                ${isNewFormat ? '<span class="px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-semibold" title="Using optimized format"><i class="fas fa-check-circle"></i> Optimized</span>' : ''}
              </div>
            </div>
          `
        : ""
      }
        </div>

        <!-- Price Footer -->
        <div class="${status.bgColor} border-t ${status.borderColor} px-5 py-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-bold ${status.textColor} uppercase tracking-wider mb-1">Total Amount</p>
              <p class="text-2xl font-black ${status.textColor}">${statsService.formatCurrency(booking.amount)}</p>
            </div>
            <div class="text-right">
              <p class="text-xs text-gray-500 font-medium">Booked on</p>
              <p class="text-sm font-bold text-gray-700">${dayjs(booking.bookingDate || booking.date).format("MMM D, YYYY")}</p>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="px-5 py-4 bg-gray-50 border-t border-gray-100 space-y-2">
          <button class="view-booking-btn w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 font-bold text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow-md" data-id="${booking.id}">
            <i class="fas fa-eye"></i>
            <span>View Details</span>
          </button>
          <div class="grid grid-cols-3 gap-2">
            <button class="download-ticket-btn px-3 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-200 text-xs font-semibold flex items-center justify-center gap-1.5" data-id="${booking.id}">
              <i class="fas fa-ticket-alt"></i>
              <span>E-Ticket</span>
            </button>
            <button class="download-invoice-btn px-3 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-200 text-xs font-semibold flex items-center justify-center gap-1.5" data-id="${booking.id}">
              <i class="fas fa-file-invoice"></i>
              <span>Invoice</span>
            </button>
            <button 
              class="add-to-calendar-btn px-3 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 transition-all duration-200 text-xs font-semibold flex items-center justify-center gap-1.5" 
              data-booking-id="${booking.id}"
              data-title="${performance?.title || 'Performance'}"
              data-date="${performanceDate ? performanceDate.toISOString() : ''}"
              data-venue="${performance?.venueName || performance?.location || performance?.venue || 'Venue TBA'}"
              title="Add to Calendar">
              <i class="fas fa-calendar-plus"></i>
              <span>Calendar</span>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  renderDetailed(booking) {
    const statusBadge = this.getStatusBadge(booking.status);

    return `
      <div class="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
        <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
          <div class="flex-1">
            <div class="flex items-start justify-between mb-2">
              <h3 class="text-2xl font-bold text-gray-900">${booking.performanceTitle
      }</h3>
              ${statusBadge}
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 mt-4">
              <div class="flex items-center gap-2">
                <i class="fas fa-calendar text-indigo-600 w-5"></i>
                <span>${dayjs(booking.performanceDate).format(
        "dddd, MMMM D, YYYY"
      )}</span>
              </div>
              <div class="flex items-center gap-2">
                <i class="fas fa-clock text-indigo-600 w-5"></i>
                <span>${dayjs(booking.performanceDate).format("h:mm A")}</span>
              </div>
              <div class="flex items-center gap-2">
                <i class="fas fa-map-marker-alt text-indigo-600 w-5"></i>
                <span>${booking.venue}</span>
              </div>
              <div class="flex items-center gap-2">
                <i class="fas fa-ticket-alt text-indigo-600 w-5"></i>
                <span>Booking ID: ${booking.id}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-200 pt-4 mb-4">
          <h4 class="font-semibold text-gray-900 mb-2">
            <i class="fas fa-chair text-indigo-600 mr-2"></i>
            Seats
          </h4>
          <div class="flex flex-wrap gap-2">
            ${this.renderSeats(booking.seats)}
          </div>
        </div>

        <div class="flex items-center justify-between pt-4 border-t border-gray-200">
          <div>
            <p class="text-sm text-gray-600">Total Amount</p>
            <p class="text-3xl font-bold text-indigo-600">$${booking.amount}</p>
            <p class="text-sm text-gray-500">${booking.ticketType || "Standard Ticket"
      }</p>
          </div>
          <div class="flex gap-2">
            <button class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <i class="fas fa-download mr-2"></i>
              Download Ticket
            </button>
            <button class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
              <i class="fas fa-ellipsis-v"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  renderSeats(seats) {
    if (!seats) return "";

    const seatArray = Array.isArray(seats) ? seats : [seats];
    return seatArray
      .map((seat) => {
        const seatId =
          typeof seat === "string" ? seat : seat.fullId || seat.seatId || seat;
        return `
        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
          <i class="fas fa-chair mr-1"></i>
          ${getDisplayLabel(seatId)}
        </span>
      `;
      })
      .join("");
  },

  getStatusBadge(status) {
    const statusConfig = {
      confirmed: { text: "Confirmed", color: "green", icon: "fa-check-circle" },
      pending: { text: "Pending", color: "yellow", icon: "fa-clock" },
      cancelled: { text: "Cancelled", color: "red", icon: "fa-times-circle" },
      completed: { text: "Completed", color: "blue", icon: "fa-check-double" },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return createBadge({
      text: config.text,
      variant:
        config.color === "green"
          ? "success"
          : config.color === "yellow"
            ? "warning"
            : config.color === "red"
              ? "danger"
              : "info",
      icon: config.icon,
    });
  },

  /**
   * Extract booking data from either seatTickets (new format) or seats (old format)
   * Returns seat labels, ticket info, and format indicator
   */
  extractBookingData(booking) {
    // Check if using new seatTickets format
    if (booking.seatTickets && Array.isArray(booking.seatTickets) && booking.seatTickets.length > 0) {
      const seatLabels = booking.seatTickets.map(st => st.seatLabel || getDisplayLabel(st.seatId));

      // Get unique ticket type names
      const ticketTypes = [...new Set(booking.seatTickets.map(st => st.ticketTypeName))];
      const ticketInfo = ticketTypes.length === 1
        ? ticketTypes[0]
        : `${ticketTypes.length} types`;

      return {
        seatLabels,
        ticketInfo,
        isNewFormat: true
      };
    }

    // Fallback to old seats format
    if (booking.seats) {
      const seatArray = Array.isArray(booking.seats) ? booking.seats : [booking.seats];
      const seatLabels = seatArray.map(s => {
        const seatId = typeof s === "string" ? s : s.fullId || s.seatId || s;
        return getDisplayLabel(seatId);
      });

      const ticketInfo = booking.ticketType || null;

      return {
        seatLabels,
        ticketInfo,
        isNewFormat: false
      };
    }

    return {
      seatLabels: [],
      ticketInfo: null,
      isNewFormat: false
    };
  },

  /**
   * Render seats from booking data (supports both formats)
   */
  renderSeatsFromData(booking) {
    // Use new format if available
    if (booking.seatTickets && Array.isArray(booking.seatTickets) && booking.seatTickets.length > 0) {
      return booking.seatTickets
        .map((st) => {
          const label = st.seatLabel || getDisplayLabel(st.seatId);
          const ticketName = st.ticketTypeName || "Standard";
          return `
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
              <i class="fas fa-chair mr-1"></i>
              ${label}
              <span class="ml-1 text-xs text-indigo-600">(${ticketName})</span>
            </span>
          `;
        })
        .join("");
    }

    // Fallback to old format
    return this.renderSeats(booking.seats);
  },
};
