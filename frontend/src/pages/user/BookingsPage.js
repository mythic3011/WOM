import { createEmptyState } from "/src/components/EmptyState.js";
import { FormComponents } from "/src/components/FormComponents.js";
import { statsService } from "/src/services/statsService.js";
import { storage } from "/src/services/storageService.js";
import dayjs from "dayjs";
import Swal from "sweetalert2";
import { notify } from "/src/utils/ui/notification.js";
import { TicketGenerator } from "/src/utils/reports/ticketGenerator.js";
import { InvoiceGenerator } from "/src/utils/reports/invoiceGenerator.js";

export default {
  title: "My Bookings | User",
  bookings: [],
  performances: [],
  filteredBookings: [],
  currentFilter: "all",

  async render() {
    const currentUser = storage.getUser();

    if (!currentUser) {
      this.bookings = [];
      this.performances = statsService.getPerformances();
      this.filteredBookings = [];
    } else {
      const storedBookings = storage.getItem("bookings", []);
      const allBookings =
        storedBookings.length > 0 ? storedBookings : statsService.getBookings();

      this.bookings = allBookings.filter((b) => {
        return (
          b.userId === currentUser.id ||
          b.userId === String(currentUser.id) ||
          String(b.userId) === String(currentUser.id) ||
          b.customerInfo?.id === currentUser.id
        );
      });

      this.performances = statsService.getPerformances();
      this.filteredBookings = [...this.bookings];
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
        value: statsService.formatCurrency(totalSpent),
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

  refreshBookings() {
    const currentUser = storage.getUser();

    if (!currentUser) {
      this.bookings = [];
      this.filteredBookings = [];
      this.renderBookingsList();
      return;
    }

    const storedBookings = storage.getItem("bookings", []);
    const allBookings =
      storedBookings.length > 0 ? storedBookings : statsService.getBookings();

    this.bookings = allBookings.filter((b) => {
      return (
        b.userId === currentUser.id ||
        b.userId === String(currentUser.id) ||
        String(b.userId) === String(currentUser.id) ||
        b.customerInfo?.id === currentUser.id
      );
    });

    this.filteredBookings = [...this.bookings];

    $("#bookingsList")
      .closest("main")
      .find(".grid.grid-cols-1.md\\:grid-cols-4")
      .first()
      .replaceWith(this.renderStats());
    this.renderBookingsList();
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

    $(document).on("click", ".download-ticket-btn", async (e) => {
      const bookingId = $(e.currentTarget).attr("data-id");
      await this.downloadTicket(bookingId);
    });

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

    this.filteredBookings = this.bookings.filter((booking) => {
      const performance = this.performances.find(
        (p) => p.id === booking.performanceId
      );

      const matchesSearch =
        booking.id.toLowerCase().includes(searchTerm) ||
        performance?.title.toLowerCase().includes(searchTerm);

      const matchesStatus = status === "all" || booking.status === status;

      return matchesSearch && matchesStatus;
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
          .map((booking) => this.renderBookingCard(booking))
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

  renderBookingCard(booking) {
    const performance = this.performances.find(
      (p) => p.id === booking.performanceId
    );
    const performanceDate = performance ? new Date(performance.date) : null;
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
    };

    const status = statusConfig[booking.status];

    const seatCount = booking.seats?.length || 0;
    const seatDisplay =
      seatCount <= 3
        ? booking.seats.join(", ")
        : `${booking.seats.slice(0, 3).join(", ")} +${seatCount - 3} more`;

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
                  <p class="text-xl font-mono font-black">${booking.id}</p>
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
              <span>${performance?.venue || "N/A"}</span>
            </div>
            <div class="flex items-center gap-2 text-gray-600">
              <i class="fas fa-chair w-4"></i>
              <span>${booking.seats.length} seat${
      booking.seats.length > 1 ? "s" : ""
    }: ${booking.seats.slice(0, 3).join(", ")}${
      booking.seats.length > 3 ? "..." : ""
    }</span>
            </div>
            <div class="flex items-start gap-2 text-gray-600">
              <i class="fas fa-tags w-4 mt-0.5"></i>
              <div class="flex-1">
                ${
                  booking.seatTicketTypes
                    ? `
                  <div class="space-y-0.5">
                    ${Object.entries(booking.seatTicketTypes)
                      .slice(0, 2)
                      .map(
                        ([seat, ticket]) =>
                          `<div class="text-xs"><span class="font-medium">${seat}:</span> ${ticket.name}</div>`
                      )
                      .join("")}
                    ${
                      Object.keys(booking.seatTicketTypes).length > 2
                        ? `<div class="text-xs text-gray-500">+${
                            Object.keys(booking.seatTicketTypes).length - 2
                          } more</div>`
                        : ""
                    }
                  </div>
                `
                    : `<span>${booking.ticketType || "Standard"}</span>`
                }
              </div>
            </div>
          </div>

          <div class="mt-4 pt-4 border-t-2 border-dashed border-gray-200 flex justify-between items-center">
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Amount</p>
              <p class="text-2xl font-black text-indigo-600">${statsService.formatCurrency(
                booking.amount
              )}</p>
            </div>
            <div class="text-right">
              <p class="text-xs text-gray-500">Booked on</p>
              <p class="text-sm font-semibold text-gray-700">${dayjs(
                booking.date
              ).format("MMM D, YYYY")}</p>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-gray-50 to-gray-100 px-6 py-4 space-y-3">
          <div class="flex gap-2">
            <button
              class="view-booking-btn flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 hover:scale-105 transition-all duration-200 shadow-md text-sm font-bold group"
              data-id="${booking.id}"
            >
              <i class="fas fa-eye group-hover:scale-110 transition-transform"></i>
              <span>View Details</span>
            </button>
            ${
              booking.status !== "cancelled" && isUpcoming
                ? `
            <button
              class="cancel-booking-btn inline-flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 hover:scale-105 transition-all duration-200 shadow-md text-sm font-bold"
              data-id="${booking.id}"
              title="Cancel Booking"
            >
              <i class="fas fa-times"></i>
            </button>
          `
                : ""
            }
          </div>
          ${
            booking.status === "confirmed"
              ? `
        <div class="grid grid-cols-2 gap-2">
          <div class="bg-gradient-to-br from-emerald-500 to-green-600 p-0.5 rounded-xl">
            <div class="bg-white rounded-[10px] p-2 flex gap-1">
              <button
                class="download-ticket-btn flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg hover:from-emerald-600 hover:to-green-700 transition-all duration-200 text-xs font-bold shadow-md hover:shadow-lg hover:scale-105 group"
                data-id="${booking.id}"
                title="Download E-Ticket PDF"
              >
                <i class="fas fa-file-pdf group-hover:scale-110 transition-transform"></i>
                <span>Ticket</span>
              </button>
              <button
                class="print-ticket-btn inline-flex items-center justify-center px-3 py-2.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-all duration-200 text-xs font-bold hover:scale-105"
                data-id="${booking.id}"
                title="Print E-Ticket"
              >
                <i class="fas fa-print"></i>
              </button>
            </div>
          </div>
          <div class="bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5 rounded-xl">
            <div class="bg-white rounded-[10px] p-2 flex gap-1">
              <button
                class="download-invoice-btn flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 text-xs font-bold shadow-md hover:shadow-lg hover:scale-105 group"
                data-id="${booking.id}"
                title="Download Invoice PDF"
              >
                <i class="fas fa-file-invoice group-hover:scale-110 transition-transform"></i>
                <span>Invoice</span>
              </button>
              <button
                class="print-invoice-btn inline-flex items-center justify-center px-3 py-2.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all duration-200 text-xs font-bold hover:scale-105"
                data-id="${booking.id}"
                title="Print Invoice"
              >
                <i class="fas fa-print"></i>
              </button>
            </div>
          </div>
        </div>
        `
              : ""
          }
        </div>
      </div>
    `;
  },

  viewBooking(bookingId) {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const performance = this.performances.find(
      (p) => p.id === booking.performanceId
    );
    const performanceDate = performance ? new Date(performance.date) : null;

    Swal.fire({
      title: `<i class="fas fa-ticket-alt text-indigo-600"></i> Booking Details`,
      html: `
        <div class="text-left space-y-4">
          <div class="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
            <div class="flex justify-between items-center mb-3">
              <h3 class="font-semibold text-gray-900">Booking Information</h3>
              <span class="px-3 py-1 rounded-full text-xs font-semibold ${
                booking.status === "confirmed"
                  ? "bg-green-100 text-green-800"
                  : booking.status === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }">
                <i class="fas ${
                  booking.status === "confirmed"
                    ? "fa-check-circle"
                    : booking.status === "pending"
                    ? "fa-clock"
                    : "fa-times-circle"
                } mr-1"></i>
                ${
                  booking.status.charAt(0).toUpperCase() +
                  booking.status.slice(1)
                }
              </span>
            </div>
            <div class="space-y-2 text-sm">
              <p><span class="font-medium">Booking ID:</span> <span class="font-mono">${
                booking.id
              }</span></p>
              <p><span class="font-medium">Booking Date:</span> ${dayjs(
                booking.date
              ).format("MMMM D, YYYY h:mm A")}</p>
            </div>
          </div>

          <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 class="font-semibold text-gray-900 mb-2">Performance Details</h3>
            <div class="space-y-2 text-sm">
              <p class="font-medium text-indigo-900 text-base">${
                performance?.title || "Unknown"
              }</p>
              <p><span class="font-medium">Date:</span> ${
                performanceDate
                  ? dayjs(performanceDate).format("MMMM D, YYYY")
                  : "N/A"
              }</p>
              <p><span class="font-medium">Venue:</span> ${
                performance?.venue || "N/A"
              }</p>
              <p><span class="font-medium">Conductor:</span> ${
                performance?.conductor || "N/A"
              }</p>
            </div>
          </div>

          <div class="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <h3 class="font-semibold text-gray-900 mb-3">Ticket Information</h3>
            ${
              booking.seatTicketTypes
                ? `
              <div class="space-y-2 mb-3">
                <p class="text-sm font-medium text-gray-700">Seat & Ticket Breakdown:</p>
                <div class="space-y-1.5">
                  ${Object.entries(booking.seatTicketTypes)
                    .map(
                      ([seat, ticket]) => `
                    <div class="flex items-center justify-between p-2 bg-white rounded border border-purple-200 text-xs">
                      <div class="flex items-center gap-2">
                        <span class="px-2 py-1 bg-indigo-600 text-white rounded font-bold">${seat}</span>
                        <span class="text-gray-700">${ticket.name}</span>
                      </div>
                      <span class="font-semibold text-gray-900">${statsService.formatCurrency(
                        ticket.price
                      )}</span>
                    </div>
                  `
                    )
                    .join("")}
                </div>
              </div>
            `
                : `
              <div class="space-y-2 text-sm">
                <p><span class="font-medium">Seats:</span> ${booking.seats.join(
                  ", "
                )}</p>
                <p><span class="font-medium">Ticket Type:</span> ${
                  booking.ticketType
                }</p>
              </div>
            `
            }
            <p class="text-sm mt-2 pt-2 border-t border-purple-200">
              <span class="font-medium">Total Seats:</span> ${
                booking.seats.length
              }
            </p>
          </div>

          <div class="bg-green-50 rounded-lg p-4 border border-green-200">
            <h3 class="font-semibold text-gray-900 mb-2">Payment</h3>
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium">Total Amount:</span>
              <span class="text-2xl font-bold text-green-700">${statsService.formatCurrency(
                booking.amount
              )}</span>
            </div>
          </div>

          ${
            booking.status === "confirmed"
              ? `
            <div class="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
              <p class="text-xs text-indigo-800">
                <i class="fas fa-info-circle mr-1"></i>
                Please arrive 30 minutes before the performance starts. Present this booking confirmation at the entrance.
              </p>
            </div>
          `
              : ""
          }
        </div>
      `,
      width: "600px",
      showCancelButton: booking.status === "confirmed",
      confirmButtonText: "Close",
      cancelButtonText:
        booking.status === "confirmed" ? "Download E-Ticket" : "",
      confirmButtonColor: "#4f46e5",
    }).then((result) => {
      if (
        result.dismiss === Swal.DismissReason.cancel &&
        booking.status === "confirmed"
      ) {
        this.downloadTicket(bookingId);
      }
    });
  },

  async downloadTicket(bookingId) {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const performance = this.performances.find(
      (p) => p.id === booking.performanceId
    );
    const currentUser = storage.getUser();

    try {
      notify.info("Generating PDF...");
      await TicketGenerator.downloadAsPDF(booking, performance, currentUser);
      notify.success("E-Ticket PDF downloaded successfully");
    } catch (error) {
      console.error("Error generating ticket:", error);
      notify.error("Failed to generate e-ticket PDF");
    }
  },

  async printTicket(bookingId) {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const performance = this.performances.find(
      (p) => p.id === booking.performanceId
    );
    const currentUser = storage.getUser();

    try {
      notify.info("Preparing print...");
      await TicketGenerator.printTicket(booking, performance, currentUser);
      notify.success("Opening print dialog...");
    } catch (error) {
      console.error("Error printing ticket:", error);
      notify.error("Failed to print e-ticket");
    }
  },

  async downloadInvoice(bookingId) {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const performance = this.performances.find(
      (p) => p.id === booking.performanceId
    );
    const currentUser = storage.getUser();

    try {
      notify.info("Generating PDF...");
      await InvoiceGenerator.downloadAsPDF(booking, performance, currentUser);
      notify.success("Invoice PDF downloaded successfully");
    } catch (error) {
      console.error("Error generating invoice:", error);
      notify.error("Failed to generate invoice PDF");
    }
  },

  async printInvoice(bookingId) {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const performance = this.performances.find(
      (p) => p.id === booking.performanceId
    );
    const currentUser = storage.getUser();

    try {
      notify.info("Preparing print...");
      await InvoiceGenerator.printInvoice(booking, performance, currentUser);
      notify.success("Opening print dialog...");
    } catch (error) {
      console.error("Error printing invoice:", error);
      notify.error("Failed to print invoice");
    }
  },

  async cancelBooking(bookingId) {
    const booking = this.bookings.find((b) => b.id === bookingId);
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
      confirmButtonColor: "#ef4444",
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
