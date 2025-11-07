import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { createBadge } from "/src/components/Badge.js";
import { statsService } from "/src/services/statsService.js";

dayjs.extend(relativeTime);

export const BookingCard = {
  renderCompact(booking) {
    const statusBadge = this.getStatusBadge(booking.status);

    return `
      <div class="border-l-4 border-indigo-600 bg-gradient-to-r from-indigo-50 to-white p-4 rounded-lg hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <h3 class="font-bold text-gray-900 text-lg mb-1">${
              booking.performanceTitle
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
                ${booking.venue}
              </p>
              <p>
                <i class="fas fa-chair text-indigo-600 w-5"></i>
                ${
                  Array.isArray(booking.seats)
                    ? booking.seats.join(", ")
                    : booking.seats
                }
              </p>
            </div>
          </div>
          <div class="text-right ml-4">
            ${statusBadge}
            <p class="text-2xl font-bold text-indigo-600 mt-2">${statsService.formatCurrency(
              booking.amount
            )}</p>
            <p class="text-xs text-gray-500">${
              booking.ticketType || "Standard"
            }</p>
          </div>
        </div>
        <div class="mt-3 flex gap-2">
          <a href="/user/bookings" data-link class="flex-1 px-3 py-1.5 bg-indigo-600 text-white text-center text-sm rounded hover:bg-indigo-700 transition-colors">
            <i class="fas fa-ticket-alt mr-1"></i>
            View Ticket
          </a>
          <button class="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors">
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
    const isPast = performanceDate && performanceDate < new Date();

    const statusConfig = {
      confirmed: {
        gradient: "from-emerald-500 to-green-600",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
        textColor: "text-emerald-800",
        iconColor: "text-emerald-600",
        icon: "fa-check-circle",
        text: "Confirmed",
      },
      pending: {
        gradient: "from-amber-500 to-orange-600",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        textColor: "text-amber-800",
        iconColor: "text-amber-600",
        icon: "fa-clock",
        text: "Pending",
      },
      cancelled: {
        gradient: "from-rose-500 to-red-600",
        bgColor: "bg-rose-50",
        borderColor: "border-rose-200",
        textColor: "text-rose-800",
        iconColor: "text-rose-600",
        icon: "fa-times-circle",
        text: "Cancelled",
      },
      completed: {
        gradient: "from-blue-500 to-indigo-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        textColor: "text-blue-800",
        iconColor: "text-blue-600",
        icon: "fa-check-double",
        text: "Completed",
      },
    };

    const status = statusConfig[booking.status] || statusConfig.pending;
    const seatCount = booking.seats?.length || 0;

    return `
      <div class="group relative bg-white rounded-2xl shadow-lg border-2 ${
        status.borderColor
      } hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden ${
      isPast ? "opacity-60" : ""
    }">
        ${
          isPast
            ? `<div class="absolute top-4 right-4 z-10 px-3 py-1 bg-gray-800/90 text-white text-xs font-bold rounded-full uppercase tracking-wider">
              <i class="fas fa-history mr-1"></i>Past Event
            </div>`
            : isUpcoming
            ? `<div class="absolute top-4 right-4 z-10 px-3 py-1 bg-indigo-600/90 text-white text-xs font-bold rounded-full uppercase tracking-wider animate-pulse">
              <i class="fas fa-calendar-star mr-1"></i>Upcoming
            </div>`
            : ""
        }

        <div class="relative bg-gradient-to-br ${
          status.gradient
        } text-white p-6 pb-20">
          <div class="absolute inset-0 bg-black/10"></div>
          <div class="relative z-10">
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <i class="fas fa-ticket-alt text-2xl"></i>
                </div>
                <div>
                  <p class="text-xs font-semibold opacity-90 uppercase tracking-wider mb-1">Booking ID</p>
                  <p class="text-xl font-mono font-black">${
                    booking.bookingReference || booking.id
                  }</p>
                </div>
              </div>
            </div>

            <div class="inline-flex items-center gap-2 px-4 py-2 bg-white/95 backdrop-blur-sm rounded-full ${
              status.textColor
            } shadow-lg">
              <i class="fas ${status.icon} ${status.iconColor}"></i>
              <span class="text-sm font-bold">${status.text}</span>
            </div>
          </div>
        </div>

        <div class="p-6 -mt-16 relative z-10">
          <div class="bg-white rounded-xl shadow-md p-5 mb-4 border border-gray-100">
            <h3 class="text-xl font-bold text-gray-900 mb-3 line-clamp-2 leading-tight">
              <i class="fas fa-music text-indigo-600 mr-2"></i>${
                performance?.title || "Unknown Performance"
              }
            </h3>

            <div class="grid grid-cols-2 gap-3 text-sm">
              <div class="flex items-center gap-2 text-gray-600">
                <i class="fas fa-calendar-alt w-4"></i>
                <span>${
                  performanceDate
                    ? dayjs(performanceDate).format("MMM D, YYYY")
                    : "N/A"
                }</span>
              </div>
              <div class="flex items-center gap-2 text-gray-600">
                <i class="fas fa-map-marker-alt w-4"></i>
                <span>${
                  performance?.venueName ||
                  performance?.location ||
                  performance?.venue ||
                  "N/A"
                }</span>
              </div>
              <div class="flex items-center gap-2 text-gray-600">
                <i class="fas fa-chair w-4"></i>
                <span>${seatCount} seat${seatCount > 1 ? "s" : ""}</span>
              </div>
              <div class="flex items-center gap-2 text-gray-600">
                <i class="fas fa-clock w-4"></i>
                <span>${
                  performanceDate
                    ? dayjs(performanceDate).format("h:mm A")
                    : "N/A"
                }</span>
              </div>
            </div>

            ${
              booking.seats && booking.seats.length > 0
                ? `
              <div class="mt-4 pt-3 border-t border-gray-100">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  <i class="fas fa-couch mr-1"></i>Seats
                </p>
                <div class="flex flex-wrap gap-1.5">
                  ${booking.seats
                    .slice(0, 6)
                    .map(
                      (seat) => `
                    <span class="inline-flex items-center px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                      ${seat}
                    </span>
                  `
                    )
                    .join("")}
                  ${
                    seatCount > 6
                      ? `<span class="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">+${
                          seatCount - 6
                        } more</span>`
                      : ""
                  }
                </div>
              </div>
            `
                : ""
            }
          </div>

          <div class="${status.bgColor} rounded-xl p-4 mb-4 border ${
      status.borderColor
    }">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-semibold ${
                  status.textColor
                } uppercase tracking-wide mb-1">Total Amount</p>
                <p class="text-2xl font-bold ${
                  status.textColor
                }">${statsService.formatCurrency(booking.amount)}</p>
              </div>
              <div class="text-right">
                <p class="text-xs text-gray-500 mb-1">Booked</p>
                <p class="text-sm font-semibold text-gray-700">${dayjs(
                  booking.bookingDate || booking.date
                ).format("MMM D")}</p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <button class="view-booking-btn flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold shadow-md hover:shadow-lg text-sm" data-id="${
              booking.id
            }">
              <i class="fas fa-eye mr-2"></i>Details
            </button>
            <button class="download-ticket-btn flex-1 px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-lg hover:border-indigo-600 hover:text-indigo-600 transition-colors font-semibold text-sm" data-id="${
              booking.id
            }">
              <i class="fas fa-download mr-2"></i>Ticket
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
              <h3 class="text-2xl font-bold text-gray-900">${
                booking.performanceTitle
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
            <p class="text-sm text-gray-500">${
              booking.ticketType || "Standard Ticket"
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
      .map(
        (seat) => `
        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
          <i class="fas fa-chair mr-1"></i>
          ${seat}
        </span>
      `
      )
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
};
