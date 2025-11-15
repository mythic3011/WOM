import { createEmptyState } from "/src/components/EmptyState.js";
import { FormComponents } from "/src/components/FormComponents.js";
import { BookingCard } from "/src/components/BookingCard.js";
import { SwalColors } from "/src/utils/colors.js";
import { bookingService } from "/src/services/bookingService.js";
import { performanceService } from "/src/services/performanceService.js";
import dayjs from "dayjs";
import Swal from "sweetalert2";
import { notify } from "/src/utils/ui/notification.js";
import { TicketGenerator } from "/src/utils/reports/ticketGenerator.js";
import { InvoiceGenerator } from "/src/utils/reports/invoiceGenerator.js";
import { getStatusConfig } from "/src/utils/status.js";
import { handleApiError } from "/src/services/apiClient.js";
import { getCurrentUser } from "/src/utils/core/auth.js";
import { formatCurrency } from "/src/utils/utils.js";
import { getDisplayLabel } from "/src/utils/seatIdHelper.js";

export default {
  title: "My Bookings | User",
  bookings: [],
  performances: [],
  filteredBookings: [],
  currentFilter: "all",

  async render() {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      this.bookings = [];
      this.performances = [];
      this.filteredBookings = [];
    } else {
      try {
        const [userBookings, allPerformances] = await Promise.all([
          bookingService.getUserBookings(currentUser.id),
          performanceService.getAll(),
        ]);

        this.bookings = userBookings;
        this.performances = allPerformances;
        this.filteredBookings = [...this.bookings];
      } catch (error) {
        console.error("Error loading bookings:", error);
        handleApiError(error);
        this.bookings = [];
        this.performances = [];
        this.filteredBookings = [];
      }
    }

    return `
      <main class="container mx-auto px-4 py-8 max-w-7xl">
        ${FormComponents.pageHeader({
          title: "My Bookings",
          subtitle: "View and manage your performance bookings",
          icon: "fa-ticket-alt",
          actions: [
            FormComponents.button({
              id: "browsePerformances",
              text: "Browse Performances",
              icon: "fa-music",
              color: "indigo",
            }),
          ],
        })}

        ${this.renderStats()}

        ${FormComponents.filterBar({
          searchId: "searchBookings",
          searchPlaceholder: "Search by booking ID or performance...",
          filters: [
            {
              id: "statusFilter",
              options: [
                { value: "all", label: "All Status" },
                { value: "confirmed", label: "Confirmed" },
                { value: "pending", label: "Pending" },
                { value: "cancelled", label: "Cancelled" },
              ],
            },
          ],
          clearButtonId: "clearFilters",
        })}

        <div id="bookingsList"></div>
      </main>
    `;
  },

  renderStats() {
    const total = this.bookings.length;
    const upcoming = this.bookings.filter((b) => {
      const perf = this.performances.find((p) => p.id === b.performanceId);
      return (
        perf && new Date(perf.date) > new Date() && b.status !== "cancelled"
      );
    }).length;
    const confirmed = this.bookings.filter(
      (b) => b.status === "confirmed"
    ).length;
    const totalSpent = this.bookings
      .filter((b) => b.status === "confirmed")
      .reduce((sum, b) => sum + b.amount, 0);

    const stats = [
      {
        title: "Total Bookings",
        value: total,
        icon: "fa-ticket-alt",
        color: "indigo",
      },
      {
        title: "Upcoming",
        value: upcoming,
        icon: "fa-calendar-check",
        color: "blue",
      },
      {
        title: "Confirmed",
        value: confirmed,
        icon: "fa-check-circle",
        color: "green",
      },
      {
        title: "Total Spent",
        value: formatCurrency(totalSpent),
        icon: "fa-dollar-sign",
        color: "purple",
      },
    ];

    return `
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        ${stats.map((stat) => FormComponents.statCard(stat)).join("")}
      </div>
    `;
  },

  async afterRender() {
    this.refreshBookings();
    this.attachEventListeners();
  },

  async refreshBookings() {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      this.bookings = [];
      this.filteredBookings = [];
      this.renderBookingsList();
      return;
    }

    try {
      this.bookings = await bookingService.getUserBookings(currentUser.id);

      this.filteredBookings = [...this.bookings];

      $("#bookingsList")
        .closest("main")
        .find(".grid.grid-cols-1.md\\:grid-cols-4")
        .first()
        .replaceWith(this.renderStats());
      this.renderBookingsList();
    } catch (error) {
      console.error("Error refreshing bookings:", error);
      handleApiError(error);
    }
  },

  attachEventListeners() {
    $("#searchBookings").on("input", () => {
      this.filterBookings();
    });

    $("#statusFilter").on("change", (e) => {
      this.currentFilter = e.target.value;
      this.filterBookings();
    });

    $("#clearFilters").on("click", () => {
      $("#searchBookings").val("");
      $("#statusFilter").val("all");
      this.currentFilter = "all";
      this.filteredBookings = [...this.bookings];
      this.renderBookingsList();
    });

    $("#browsePerformances").on("click", () => {
      window.location.href = "/performances";
    });

    $(document).on("click", ".view-booking-btn", (e) => {
      const bookingId = $(e.currentTarget).attr("data-id");
      this.viewBooking(bookingId);
    });

    $(document).on(
      "click",
      ".download-ticket-btn, .download-ticket-btn-modal",
      async (e) => {
        const bookingId = $(e.currentTarget).attr("data-id");
        await this.downloadTicket(bookingId);
      }
    );

    $(document).on("click", ".print-ticket-btn", async (e) => {
      const bookingId = $(e.currentTarget).attr("data-id");
      await this.printTicket(bookingId);
    });

    $(document).on("click", ".download-invoice-btn", async (e) => {
      const bookingId = $(e.currentTarget).attr("data-id");
      await this.downloadInvoice(bookingId);
    });

    $(document).on("click", ".print-invoice-btn", async (e) => {
      const bookingId = $(e.currentTarget).attr("data-id");
      await this.printInvoice(bookingId);
    });

    $(document).on("click", ".cancel-booking-btn", (e) => {
      const bookingId = $(e.currentTarget).attr("data-id");
      this.cancelBooking(bookingId);
    });
  },

  filterBookings() {
    const searchTerm = $("#searchBookings").val().toLowerCase();
    const status = this.currentFilter;

    this.filteredBookings = bookingService.filterAndSearch(this.bookings, {
      search: searchTerm,
      status: status,
    });

    this.renderBookingsList();
  },

  renderBookingsList() {
    if (this.filteredBookings.length === 0) {
      $("#bookingsList").html(
        createEmptyState({
          icon: "fa-ticket-alt",
          title:
            this.bookings.length === 0
              ? "No bookings yet"
              : "No bookings found",
          message:
            this.bookings.length === 0
              ? "Book your first performance and start your musical journey!"
              : "Try adjusting your filters",
          actionText: this.bookings.length === 0 ? "Browse Performances" : "",
          actionLink: this.bookings.length === 0 ? "/performances" : "",
        })
      );
      return;
    }

    const bookingsHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${this.filteredBookings
          .map((booking) => {
            const performance = this.performances.find(
              (p) => String(p.id) === String(booking.performanceId)
            );
            let showtime = null;
            if (booking.showtimeId && performance?.showtimes) {
              showtime = performance.showtimes.find(
                (s) => String(s.id) === String(booking.showtimeId)
              );
            }
            return BookingCard.renderGrid(booking, performance, showtime);
          })
          .join("")}
      </div>
      <div class="mt-6 text-center text-sm text-gray-600">
        <p>Showing <span class="font-semibold">${
          this.filteredBookings.length
        }</span> of <span class="font-semibold">${
      this.bookings.length
    }</span> bookings</p>
      </div>
    `;

    $("#bookingsList").html(bookingsHTML);
  },

  viewBooking(bookingId) {
    const booking = this.bookings.find(
      (b) => String(b.id) === String(bookingId)
    );
    if (!booking) return;

    const performance = this.performances.find(
      (p) => String(p.id) === String(booking.performanceId)
    );

    let showtime = null;
    if (booking.showtimeId && performance?.showtimes) {
      showtime = performance.showtimes.find(
        (s) => String(s.id) === String(booking.showtimeId)
      );
    }

    const performanceDate = showtime
      ? new Date(showtime.dateTime || showtime.datetime)
      : performance
      ? new Date(performance.date)
      : null;

    const statusConfig = getStatusConfig(
      booking.status || "pending",
      "booking"
    );
    const statusStyle = {
      bg: statusConfig.badgeClass.split(" ")[0],
      text: statusConfig.badgeClass.split(" ")[1],
      icon: statusConfig.icon,
    };

    Swal.fire({
      title: `<div class="flex items-center justify-center gap-3 text-indigo-900">
        <i class="fas fa-ticket-alt text-indigo-600"></i>
        <span>Booking Details</span>
      </div>`,
      html: `
        <div class="text-left space-y-3">
          <div class="bg-indigo-600 text-white rounded-xl p-4 shadow-lg border-2 border-indigo-700">
            <div class="flex justify-between items-start mb-2">
              <div>
                <p class="text-xs font-semibold uppercase tracking-wider opacity-90 mb-1">Booking ID</p>
                <p class="text-lg font-mono font-bold">${booking.id}</p>
              </div>
              <span class="px-3 py-1.5 rounded-lg text-xs font-bold ${
                statusStyle.bg
              } ${statusStyle.text} shadow-md">
                <i class="fas ${statusStyle.icon} mr-1"></i>${statusConfig.text}
              </span>
            </div>
            <div class="flex items-center gap-2 text-xs opacity-90">
              <i class="fas fa-calendar-check"></i>
              <span>Booked: ${dayjs(booking.date).format(
                "MMM D, YYYY h:mm A"
              )}</span>
            </div>
          </div>

          <div class="bg-white rounded-lg p-4 border-2 border-indigo-100 shadow-sm">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <i class="fas fa-music text-indigo-600"></i>
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-bold text-gray-900 text-base leading-tight mb-2">${
                  performance?.title || "Unknown"
                }</h3>
                <div class="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                  <div class="flex items-center gap-1.5 text-gray-600">
                    <i class="fas fa-calendar w-3"></i>
                    <span class="truncate">${
                      performanceDate
                        ? dayjs(performanceDate).format("MMM D, YYYY")
                        : "N/A"
                    }</span>
                  </div>
                  <div class="flex items-center gap-1.5 text-gray-600">
                    <i class="fas fa-clock w-3"></i>
                    <span>${
                      performanceDate
                        ? dayjs(performanceDate).format("h:mm A")
                        : "N/A"
                    }</span>
                  </div>
                  <div class="flex items-center gap-1.5 text-gray-600 col-span-2">
                    <i class="fas fa-map-marker-alt w-3"></i>
                    <span class="truncate">${
                      performance?.venueName ||
                      performance?.location ||
                      performance?.venue ||
                      "N/A"
                    }</span>
                  </div>
                  ${
                    performance?.conductor
                      ? `
                  <div class="flex items-center gap-1.5 text-gray-600 col-span-2">
                    <i class="fas fa-user-tie w-3"></i>
                    <span class="truncate">${performance.conductor}</span>
                  </div>
                  `
                      : ""
                  }
                </div>
              </div>
            </div>
          </div>

          <div class="bg-purple-50 rounded-lg p-3 border border-purple-200">
            <div class="flex items-center gap-2 mb-2">
              <i class="fas fa-couch text-purple-600"></i>
              <h3 class="font-semibold text-gray-900 text-sm">Seats & Tickets</h3>
              <span class="ml-auto text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                ${booking.seats.length} seat${
        booking.seats.length > 1 ? "s" : ""
      }
              </span>
            </div>
            <div class="space-y-1.5 max-h-44 overflow-y-auto">
              ${
                booking.seatTicketTypes
                  ? Object.entries(booking.seatTicketTypes)
                      .map(([seatId, ticket]) => {
                        const seatParts = seatId.split("-");
                        const seatNumber =
                          seatParts[seatParts.length - 1] || seatId;
                        const section =
                          seatParts.length >= 3 ? seatParts[2] : "";
                        const tier = ticket.tier || ticket.category || "";
                        return `
                <div class="bg-white rounded-lg border border-purple-200 p-2 hover:border-purple-300 transition-colors">
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <span class="px-2.5 py-1 bg-indigo-600 text-white rounded-lg font-bold text-xs min-w-[3rem] text-center">${seatNumber}</span>
                      <div class="flex flex-col gap-0.5">
                        ${
                          section
                            ? `<span class="text-gray-700 font-medium text-xs">${section}</span>`
                            : ""
                        }
                        <div class="flex items-center gap-1.5">
                          ${
                            tier
                              ? `<span class="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-semibold">${tier}</span>`
                              : ""
                          }
                          <span class="text-gray-600 text-[10px]">${
                            ticket.name
                          }</span>
                        </div>
                      </div>
                    </div>
                    <span class="font-bold text-gray-900 text-xs whitespace-nowrap">${formatCurrency(
                      ticket.price
                    )}</span>
                  </div>
                </div>
              `;
                      })
                      .join("")
                  : booking.seats
                      .map((seat) => {
                        const seatId =
                          typeof seat === "string"
                            ? seat
                            : seat.fullId || seat.seatId || seat;
                        const seatParts =
                          typeof seatId === "string" ? seatId.split("-") : [];
                        const seatNumber =
                          typeof seat === "string"
                            ? seatParts[seatParts.length - 1] || seatId
                            : seat.displayLabel ||
                              seat.seatNumber ||
                              seatParts[seatParts.length - 1] ||
                              seatId;
                        const section =
                          typeof seat === "string"
                            ? seatParts.length >= 3
                              ? seatParts[2]
                              : ""
                            : seat.sectionName ||
                              (seatParts.length >= 3 ? seatParts[2] : "");
                        return `
                <div class="bg-white rounded-lg border border-purple-200 p-2 hover:border-purple-300 transition-colors">
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <span class="px-2.5 py-1 bg-indigo-600 text-white rounded-lg font-bold text-xs min-w-[3rem] text-center">${seatNumber}</span>
                      <div class="flex flex-col gap-0.5">
                        ${
                          section
                            ? `<span class="text-gray-700 font-medium text-xs">${section}</span>`
                            : ""
                        }
                        <span class="text-gray-600 text-[10px]">${
                          booking.ticketType || "Standard"
                        }</span>
                      </div>
                    </div>
                    <span class="font-bold text-gray-900 text-xs whitespace-nowrap">${formatCurrency(
                      booking.amount / booking.seats.length
                    )}</span>
                  </div>
                </div>
              `;
                      })
                      .join("")
              }
            </div>
          </div>

          <div class="bg-green-50 rounded-lg p-4 border-2 border-green-300 shadow-sm">
            <div class="flex justify-between items-center">
              <div>
                <p class="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Total Amount</p>
                <p class="text-2xl font-black text-green-700">${formatCurrency(
                  booking.amount
                )}</p>
              </div>
              <div class="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                <i class="fas fa-check text-white text-xl"></i>
              </div>
            </div>
          </div>

          ${
            booking.status === "confirmed"
              ? `
            <div class="bg-indigo-50 rounded-lg p-2.5 border-l-4 border-indigo-600">
              <p class="text-xs text-indigo-900 flex items-start gap-2">
                <i class="fas fa-info-circle mt-0.5 flex-shrink-0"></i>
                <span>Arrive 30 minutes early. Present this booking confirmation at the entrance.</span>
              </p>
            </div>
          `
              : ""
          }

          ${
            booking.status === "confirmed"
              ? `
          <div class="border-t border-gray-200 pt-3 mt-3">
            <p class="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
              <i class="fas fa-file-download mr-1"></i>Download Documents
            </p>
            <div class="grid grid-cols-2 gap-2">
              <button class="download-ticket-btn-modal px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-xs shadow-sm hover:shadow-md" data-id="${booking.id}">
                <i class="fas fa-ticket-alt mr-1.5"></i>E-Ticket
              </button>
              <button class="download-invoice-btn px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-xs shadow-sm hover:shadow-md" data-id="${booking.id}">
                <i class="fas fa-file-invoice-dollar mr-1.5"></i>Invoice
              </button>
            </div>
          </div>
          `
              : ""
          }
        </div>
      `,
      width: "550px",
      showConfirmButton: true,
      showCancelButton: false,
      confirmButtonText: '<i class="fas fa-times mr-2"></i>Close',
      confirmButtonColor: "#6366f1",
      customClass: {
        popup: "booking-details-modal",
        confirmButton: "swal2-confirm-styled",
      },
    });
  },

  async downloadTicket(bookingId) {
    const booking = this.bookings.find(
      (b) => String(b.id) === String(bookingId)
    );
    if (!booking) return;

    const performance = this.performances.find(
      (p) => String(p.id) === String(booking.performanceId)
    );

    let showtime = null;
    if (booking.showtimeId && performance?.showtimes) {
      showtime = performance.showtimes.find(
        (s) => String(s.id) === String(booking.showtimeId)
      );
    }

    const currentUser = getCurrentUser();

    try {
      notify.info("Generating PDF...");
      await TicketGenerator.downloadAsPDF(
        booking,
        performance,
        currentUser,
        showtime
      );
      notify.success("E-Ticket PDF downloaded successfully");
    } catch (error) {
      console.error("Error generating ticket:", error);
      notify.error("Failed to generate e-ticket PDF");
    }
  },

  async printTicket(bookingId) {
    const booking = this.bookings.find(
      (b) => String(b.id) === String(bookingId)
    );
    if (!booking) return;

    const performance = this.performances.find(
      (p) => String(p.id) === String(booking.performanceId)
    );

    let showtime = null;
    if (booking.showtimeId && performance?.showtimes) {
      showtime = performance.showtimes.find(
        (s) => String(s.id) === String(booking.showtimeId)
      );
    }

    const currentUser = getCurrentUser();

    try {
      notify.info("Preparing print...");
      await TicketGenerator.printTicket(
        booking,
        performance,
        currentUser,
        showtime
      );
      notify.success("Opening print dialog...");
    } catch (error) {
      console.error("Error printing ticket:", error);
      notify.error("Failed to print e-ticket");
    }
  },

  async downloadInvoice(bookingId) {
    const booking = this.bookings.find(
      (b) => String(b.id) === String(bookingId)
    );
    if (!booking) return;

    const performance = this.performances.find(
      (p) => String(p.id) === String(booking.performanceId)
    );

    let showtime = null;
    if (booking.showtimeId && performance?.showtimes) {
      showtime = performance.showtimes.find(
        (s) => String(s.id) === String(booking.showtimeId)
      );
    }

    const currentUser = getCurrentUser();

    try {
      notify.info("Generating invoice PDF...");
      await InvoiceGenerator.downloadAsPDF(
        booking,
        performance,
        currentUser,
        showtime
      );
      notify.success("Invoice PDF downloaded successfully");
    } catch (error) {
      console.error("Error generating invoice:", error);
      notify.error("Failed to generate invoice PDF");
    }
  },

  async printInvoice(bookingId) {
    const booking = this.bookings.find(
      (b) => String(b.id) === String(bookingId)
    );
    if (!booking) return;

    const performance = this.performances.find(
      (p) => String(p.id) === String(booking.performanceId)
    );

    let showtime = null;
    if (booking.showtimeId && performance?.showtimes) {
      showtime = performance.showtimes.find(
        (s) => String(s.id) === String(booking.showtimeId)
      );
    }

    const currentUser = getCurrentUser();

    try {
      notify.info("Preparing invoice print...");
      await InvoiceGenerator.printInvoice(
        booking,
        performance,
        currentUser,
        showtime
      );
      notify.success("Opening print dialog...");
    } catch (error) {
      console.error("Error printing invoice:", error);
      notify.error("Failed to print invoice");
    }
  },

  async cancelBooking(bookingId) {
    const booking = this.bookings.find(
      (b) => String(b.id) === String(bookingId)
    );
    if (!booking) return;

    const result = await Swal.fire({
      title: "Cancel Booking?",
      html: `
        <p>Are you sure you want to cancel booking <strong>${bookingId}</strong>?</p>
        <div class="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <p class="text-sm text-yellow-800">
            <i class="fas fa-exclamation-triangle mr-1"></i>
            This action cannot be undone. A refund will be processed according to our cancellation policy.
          </p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: SwalColors.danger,
      confirmButtonText: "Yes, Cancel Booking",
      cancelButtonText: "No, Keep It",
    });

    if (result.isConfirmed) {
      booking.status = "cancelled";
      this.filterBookings();

      await Swal.fire({
        title: "Booking Cancelled",
        html: `
          <div class="text-center">
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <i class="fas fa-check text-green-600 text-xl"></i>
            </div>
            <p class="mb-2">Your booking has been cancelled successfully.</p>
            <p class="text-sm text-gray-600">Refund will be processed within 5-7 business days.</p>
          </div>
        `,
        icon: "success",
        confirmButtonText: "OK",
      });

      notify.success("Booking cancelled successfully");
    }
  },
};
