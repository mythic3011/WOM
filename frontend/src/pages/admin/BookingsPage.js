import { createEmptyState } from "/src/components/EmptyState.js";
import { FormComponents } from "/src/components/FormComponents.js";
import { createTable, initTableFeatures } from "/src/components/Table.js";
import { ticketTypeService } from "/src/services/ticketTypeService.js";
import { bookingService } from "/src/services/bookingService.js";
import { performanceService } from "/src/services/performanceService.js";
import { SwalColors } from "/src/utils/colors.js";
import dayjs from "dayjs";
import Swal from "sweetalert2";
import { notify } from "/src/utils/ui/notification.js";
import {
  getStatusBadge,
  getStatusConfig,
  STATUS_CONFIGS,
} from "/src/utils/status.js";
import { userAPI, handleApiError } from "/src/services/apiClient.js";
import { formatCurrency } from "/src/utils/utils.js";
import { getTierBadge } from "/src/config/tierConfig.js";
import { getDisplayLabel, parseFullId } from "/src/utils/seatIdHelper.js";
import { bookingAPI } from "../../services/apiClient";
const SEAT_GRID_CONFIG = {
  rows: ["A", "B", "C", "D", "E", "F", "G", "H"],
  seatsPerRow: 15,
};

export default {
  title: "Manage Bookings | Admin",
  bookings: [],
  performances: [],
  users: [],
  ticketTypes: [],
  filteredBookings: [],
  currentFilter: "all",

  async render() {
    this.bookings = [];
    this.performances = [];
    this.users = [];
    this.ticketTypes = ticketTypeService.getAll();
    this.filteredBookings = [];

    return `
      <main class="container mx-auto px-4 py-8 max-w-7xl">
        ${FormComponents.pageHeader({
          title: "Manage Bookings",
          subtitle: "View and manage all customer bookings",
          icon: "fa-clipboard-list",
          actions: [
            FormComponents.button({
              id: "exportBookings",
              text: "Export",
              icon: "fa-download",
              color: "green",
            }),
          ],
        })}

        ${this.renderStats()}
        ${this.renderFilters()}

        <div id="bookingsTable"></div>
      </main>
    `;
  },

  renderStats() {
    const stats = this.calculateStats();
    return `
      <div id="bookingsStats" class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        ${stats.map((stat) => FormComponents.statCard(stat)).join("")}
      </div>
    `;
  },

  calculateStats() {
    const stats = bookingService.groupByStatus(this.bookings);
    const revenue = bookingService.calculateTotalSpent(stats.confirmed);

    return [
      {
        title: "Total",
        value: this.bookings.length,
        icon: "fa-clipboard-list",
        color: "indigo",
      },
      {
        title: "Confirmed",
        value: stats.confirmed.length,
        icon: "fa-check-circle",
        color: "green",
      },
      {
        title: "Pending",
        value: stats.pending.length,
        icon: "fa-clock",
        color: "yellow",
      },
      {
        title: "Cancelled",
        value: stats.cancelled.length,
        icon: "fa-times-circle",
        color: "red",
      },
      {
        title: "Revenue",
        value: formatCurrency(revenue),
        icon: "fa-dollar-sign",
        color: "purple",
      },
    ];
  },

  renderFilters() {
    return `
      <div class="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">
            <i class="fas fa-filter text-indigo-600 mr-2"></i>Filters
          </h3>
          <button id="clearFilters" class="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <i class="fas fa-times mr-2"></i>Clear All
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          ${this.renderSearchFilter()}
          ${this.renderStatusFilter()}
          ${this.renderPerformanceFilter()}
          ${this.renderSortFilter()}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          ${this.renderDateRangeFilter()}
          ${this.renderAmountRangeFilter()}
        </div>
      </div>
    `;
  },

  renderSearchFilter() {
    return `
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          <i class="fas fa-search mr-1"></i>Search
        </label>
        <input
          type="text"
          id="searchBookings"
          placeholder="Booking ID, user, performance..."
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
    `;
  },

  renderStatusFilter() {
    return `
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          <i class="fas fa-info-circle mr-1"></i>Status
        </label>
        <select id="statusFilter" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
          <option value="all">All Status</option>
          ${Object.entries(STATUS_CONFIGS.booking)
            .map(
              ([key, config]) =>
                `<option value="${key}">${config.text}</option>`
            )
            .join("")}
        </select>
      </div>
    `;
  },

  renderPerformanceFilter() {
    return `
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          <i class="fas fa-music mr-1"></i>Performance
        </label>
        <select id="performanceFilter" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
          <option value="all">All Performances</option>
          ${this.performances
            .map((p) => `<option value="${p.id}">${p.title}</option>`)
            .join("")}
        </select>
      </div>
    `;
  },

  renderSortFilter() {
    return `
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          <i class="fas fa-sort mr-1"></i>Sort By
        </label>
        <select id="sortFilter" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
          <option value="date-desc">Date (Newest First)</option>
          <option value="date-asc">Date (Oldest First)</option>
          <option value="amount-desc">Amount (High to Low)</option>
          <option value="amount-asc">Amount (Low to High)</option>
          <option value="status">Status</option>
        </select>
      </div>
    `;
  },

  renderDateRangeFilter() {
    return `
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          <i class="fas fa-calendar mr-1"></i>Date Range
        </label>
        <div class="flex gap-2">
          <input type="date" id="dateFrom" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="From" />
          <input type="date" id="dateTo" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="To" />
        </div>
      </div>
    `;
  },

  renderAmountRangeFilter() {
    return `
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          <i class="fas fa-dollar-sign mr-1"></i>Amount Range (HKD)
        </label>
        <div class="flex gap-2">
          <input type="number" id="amountFrom" min="0" placeholder="Min" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          <input type="number" id="amountTo" min="0" placeholder="Max" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
      </div>
    `;
  },

  async afterRender() {
    await this.loadBookings();
    this.attachEventListeners();
  },

  async loadBookings() {
    try {
      $("#bookingsTableContainer").html(
        '<div class="text-center py-12"><i class="fas fa-spinner fa-spin text-4xl text-indigo-600"></i><p class="mt-4 text-gray-600">Loading bookings...</p></div>'
      );

      const [allBookings, allPerformances, usersResponse] = await Promise.all([
        bookingService.getAll(),
        performanceService.getAll(),
        userAPI.getAll(),
      ]);

      this.bookings = allBookings;
      this.performances = allPerformances;
      this.users = usersResponse.data?.users || [];
      this.filteredBookings = [...this.bookings];

      this.renderBookingsTable();
      this.updateStatsBar();
    } catch (error) {
      console.error("Failed to load bookings:", error);
      $("#bookingsTableContainer").html(
        createEmptyState(
          "Failed to load bookings",
          "Unable to fetch booking data from server",
          "fa-exclamation-circle"
        )
      );
      handleApiError(error, "Failed to load bookings");
    }
  },

  attachEventListeners() {
    const filterInputs = [
      "#searchBookings",
      "#statusFilter",
      "#performanceFilter",
      "#sortFilter",
      "#dateFrom",
      "#dateTo",
      "#amountFrom",
      "#amountTo",
    ];
    filterInputs.forEach((selector) => {
      $(selector).on(
        selector.includes("search") || selector.includes("amount")
          ? "input"
          : "change",
        () => this.filterBookings()
      );
    });

    $("#clearFilters").on("click", () => this.clearAllFilters());
    $("#exportBookings").on("click", () => this.exportBookings());

    const actionHandlers = {
      ".view-booking-btn": this.viewBooking,
      ".cancel-booking-btn": this.cancelBooking,
      ".confirm-booking-btn": this.confirmBooking,
      ".edit-booking-btn": this.editBooking,
      ".refund-booking-btn": this.refundBooking,
      ".email-booking-btn": this.emailBooking,
    };

    Object.entries(actionHandlers).forEach(([selector, handler]) => {
      $(document).on("click", selector, (e) => {
        const bookingId = $(e.currentTarget).data("id");
        handler.call(this, bookingId);
      });
    });
  },

  clearAllFilters() {
    $("#searchBookings").val("");
    $("#statusFilter").val("all");
    $("#performanceFilter").val("all");
    $("#sortFilter").val("date-desc");
    $("#dateFrom").val("");
    $("#dateTo").val("");
    $("#amountFrom").val("");
    $("#amountTo").val("");
    this.filterBookings();
  },

  filterBookings() {
    const filters = this.getFilterValues();
    this.filteredBookings = this.bookings.filter((booking) =>
      this.matchesAllFilters(booking, filters)
    );
    this.sortBookings(filters.sortBy);
    this.renderBookingsTable();
    this.updateStatsBar();
  },

  getFilterValues() {
    return {
      searchTerm: $("#searchBookings").val().toLowerCase(),
      statusFilter: $("#statusFilter").val(),
      performanceFilter: $("#performanceFilter").val(),
      sortBy: $("#sortFilter").val(),
      dateFrom: $("#dateFrom").val(),
      dateTo: $("#dateTo").val(),
      amountFrom: parseFloat($("#amountFrom").val()) || 0,
      amountTo: parseFloat($("#amountTo").val()) || Infinity,
    };
  },

  matchesAllFilters(booking, filters) {
    return (
      this.matchesSearch(booking, filters.searchTerm) &&
      this.matchesStatus(booking, filters.statusFilter) &&
      this.matchesPerformance(booking, filters.performanceFilter) &&
      this.matchesDateRange(booking, filters.dateFrom, filters.dateTo) &&
      this.matchesAmountRange(booking, filters.amountFrom, filters.amountTo)
    );
  },

  matchesSearch(booking, searchTerm) {
    if (!searchTerm) return true;

    const performance = this.getPerformanceById(booking.performanceId);
    const customer = this.getCustomerData(booking);
    const bookingIdStr = String(
      booking.bookingReference || booking.id
    ).toLowerCase();

    return (
      bookingIdStr.includes(searchTerm) ||
      (performance?.title || "").toLowerCase().includes(searchTerm) ||
      customer.name.toLowerCase().includes(searchTerm) ||
      customer.email.toLowerCase().includes(searchTerm)
    );
  },

  matchesStatus(booking, statusFilter) {
    return statusFilter === "all" || booking.status === statusFilter;
  },

  matchesPerformance(booking, performanceFilter) {
    return (
      performanceFilter === "all" ||
      String(booking.performanceId) === String(performanceFilter)
    );
  },

  matchesDateRange(booking, dateFrom, dateTo) {
    const bookingDate = dayjs(booking.bookingDate || booking.date);
    const matchesFrom =
      !dateFrom || bookingDate.isAfter(dayjs(dateFrom).subtract(1, "day"));
    const matchesTo =
      !dateTo || bookingDate.isBefore(dayjs(dateTo).add(1, "day"));
    return matchesFrom && matchesTo;
  },

  matchesAmountRange(booking, amountFrom, amountTo) {
    const amount = booking.amount || 0;
    return amount >= amountFrom && amount <= amountTo;
  },

  sortBookings(sortBy) {
    const sortFunctions = {
      "date-desc": (a, b) =>
        dayjs(b.bookingDate || b.date).valueOf() -
        dayjs(a.bookingDate || a.date).valueOf(),
      "date-asc": (a, b) =>
        dayjs(a.bookingDate || a.date).valueOf() -
        dayjs(b.bookingDate || b.date).valueOf(),
      "amount-desc": (a, b) => (b.amount || 0) - (a.amount || 0),
      "amount-asc": (a, b) => (a.amount || 0) - (b.amount || 0),
      status: (a, b) => (a.status || "").localeCompare(b.status || ""),
    };

    const sortFn = sortFunctions[sortBy];
    if (sortFn) {
      this.filteredBookings.sort(sortFn);
    }
  },

  renderBookingsTable() {
    const totalRevenue = this.calculateFilteredRevenue();
    const filteredCount = this.filteredBookings.length;
    const totalCount = this.bookings.length;

    const tableHTML = createTable({
      columns: this.getTableColumns(),
      data: this.filteredBookings,
      title: "Bookings List",
      icon: "fa-table",
      subtitle: this.getTableSubtitle(filteredCount, totalCount),
      headerStats: [
        {
          label: "Filtered Revenue",
          value: formatCurrency(totalRevenue),
          colorClass: "text-green-600",
        },
      ],
      rowActions: (booking) => [this.renderBookingActions(booking)],
      emptyState: {
        icon: "fa-clipboard-list",
        title: "No bookings found",
        message: "Try adjusting your filters",
      },
    });

    $("#bookingsTable").html(tableHTML);
  },

  calculateFilteredRevenue() {
    return this.filteredBookings
      .filter((b) => b.status === "confirmed")
      .reduce((sum, b) => sum + b.amount, 0);
  },

  getTableSubtitle(filteredCount, totalCount) {
    const filterBadge =
      filteredCount < totalCount
        ? ` <span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Filtered</span>`
        : "";
    return `Showing <span class="font-semibold text-indigo-600">${filteredCount}</span> of <span class="font-semibold">${totalCount}</span> bookings${filterBadge}`;
  },

  getTableColumns() {
    return [
      {
        label: "Booking ID",
        key: "id",
        nowrap: true,
        render: (booking) =>
          `<span class="font-mono text-sm font-semibold text-indigo-700">${
            booking.bookingReference || booking.id
          }</span>`,
      },
      {
        label: "Performance",
        key: "performance",
        render: (booking) => this.renderPerformanceCell(booking),
      },
      {
        label: "Customer",
        key: "customer",
        render: (booking) => this.renderCustomerCell(booking),
      },
      {
        label: "Seats",
        key: "seats",
        nowrap: true,
        render: (booking) => this.renderSeatsCell(booking),
      },
      {
        label: "Amount",
        key: "amount",
        nowrap: true,
        render: (booking) => this.renderAmountCell(booking),
      },
      {
        label: "Date",
        key: "date",
        nowrap: true,
        render: (booking) => this.renderDateCell(booking),
      },
      {
        label: "Status",
        key: "status",
        nowrap: true,
        render: (booking) => this.renderStatusBadge(booking),
      },
    ];
  },

  renderPerformanceCell(booking) {
    const performance = this.getPerformanceById(booking.performanceId);
    const performanceData = this.getPerformanceData(booking, performance);
    return `
      <div class="text-sm font-medium text-gray-900">${performanceData.title}</div>
      <div class="text-xs text-gray-500">${performanceData.venue}</div>
    `;
  },

  renderCustomerCell(booking) {
    const customer = this.getCustomerData(booking);
    return `
      <div class="text-sm font-medium text-gray-900">${customer.name}</div>
      <div class="text-xs text-gray-500">${customer.email}</div>
    `;
  },

  renderSeatsCell(booking) {
    const seats = this.extractSeatNumbers(booking.seats);
    return `
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
        <i class="fas fa-chair mr-1"></i>
        ${seats.length} seat${seats.length > 1 ? "s" : ""}
      </span>
      <div class="text-xs text-gray-500 mt-1 font-mono">${seats.join(
        ", "
      )}</div>
    `;
  },

  renderAmountCell(booking) {
    const ticketTypeName =
      typeof booking.ticketType === "object"
        ? booking.ticketType?.name
        : booking.ticketType;
    const ticketTypeInfo = ticketTypeName
      ? `<div class="text-xs text-gray-500">${ticketTypeName}</div>`
      : "";
    return `
      <span class="text-sm font-bold text-gray-900">${formatCurrency(
        booking.amount
      )}</span>
      ${ticketTypeInfo}
    `;
  },

  renderDateCell(booking) {
    const date = dayjs(booking.bookingDate || booking.date);
    return `
      <span class="text-sm text-gray-900">${date.format("MMM D, YYYY")}</span>
      <div class="text-xs text-gray-500">${date.format("h:mm A")}</div>
    `;
  },

  renderStatusBadge(booking) {
    const status = booking.status || "pending";
    return getStatusBadge(status, "booking");
  },

  renderBookingActions(booking) {
    const actions = [];

    actions.push(
      this.createActionButton(
        "fa-eye",
        "View Details",
        "indigo",
        booking.id,
        "view-booking-btn"
      )
    );

    if (booking.status === "pending") {
      actions.push(
        this.createActionButton(
          "fa-check",
          "Confirm Booking",
          "green",
          booking.id,
          "confirm-booking-btn"
        )
      );
    }

    if (booking.status !== "cancelled") {
      actions.push(
        this.createActionButton(
          "fa-edit",
          "Edit Booking",
          "blue",
          booking.id,
          "edit-booking-btn"
        )
      );
      actions.push(
        this.createActionButton(
          "fa-envelope",
          "Send Email",
          "purple",
          booking.id,
          "email-booking-btn"
        )
      );
    }

    if (booking.status === "confirmed") {
      actions.push(
        this.createActionButton(
          "fa-undo",
          "Refund",
          "orange",
          booking.id,
          "refund-booking-btn"
        )
      );
    }

    if (booking.status !== "cancelled") {
      actions.push(
        this.createActionButton(
          "fa-ban",
          "Cancel Booking",
          "red",
          booking.id,
          "cancel-booking-btn"
        )
      );
    }

    return `<div class="flex gap-1.5">${actions.join("")}</div>`;
  },

  createActionButton(icon, tooltip, color, bookingId, className) {
    return FormComponents.actionButton({
      icon,
      tooltip,
      color,
      dataAttributes: { id: bookingId },
    }).replace("<button", `<button class="${className}"`);
  },

  getPerformanceById(performanceId) {
    return this.performances.find(
      (p) => String(p.id) === String(performanceId)
    );
  },

  getPerformanceData(booking, performance = null) {
    if (!performance) {
      performance = this.getPerformanceById(booking.performanceId);
    }
    return {
      title: performance?.title || booking.performanceTitle || "Unknown",
      venue:
        performance?.venueName ||
        booking.venueName ||
        performance?.location ||
        performance?.venue ||
        "N/A",
      date: performance?.date || booking.showtime || null,
    };
  },

  getCustomerData(booking) {
    return {
      name: booking.userName || booking.name || "Unknown",
      email: booking.userEmail || booking.email || "N/A",
      phone: booking.userPhone || booking.phone || "",
    };
  },

  extractSeatNumbers(seats) {
    if (!Array.isArray(seats)) return [];
    return seats
      .map((s) => {
        if (typeof s === "string") {
          return getDisplayLabel(s);
        }
        return (
          s.displayLabel ||
          s.seatNumber ||
          s.seat ||
          s.id ||
          getDisplayLabel(s.fullId || s.seatId || "")
        );
      })
      .filter((s) => s);
  },

  parseSeatDetails(seat, index) {
    if (typeof seat === "string") {
      const parsed = parseFullId(seat);
      if (parsed) {
        return {
          index: index + 1,
          seatNumber: parsed.displayLabel,
          section: parsed.sectionSlug
            .replace(/-/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
          tier: null,
          ticketType: "-",
          price: "-",
        };
      }
      return {
        index: index + 1,
        seatNumber: seat,
        section: "-",
        tier: null,
        ticketType: "-",
        price: "-",
      };
    }

    return {
      index: index + 1,
      seatNumber:
        seat.displayLabel ||
        seat.seatNumber ||
        getDisplayLabel(seat.fullId || seat.seatId || ""),
      section: seat.sectionName || seat.section || "-",
      tier: seat.tier || null,
      ticketType:
        typeof seat.ticketType === "object"
          ? seat.ticketType?.name || "-"
          : seat.ticketType || "-",
      price: seat.finalPrice ? formatCurrency(seat.finalPrice) : "-",
    };
  },

  renderSeatDetailRow(seatData) {
    const tierBadge = seatData.tier
      ? `<span class="px-2 py-0.5 rounded-full text-xs font-semibold ${getTierBadge(
          seatData.tier
        )}">${seatData.tier}</span>`
      : "-";

    return `
      <tr class="border-b border-gray-200 hover:bg-gray-50">
        <td class="py-2 px-3 text-sm">${seatData.index}</td>
        <td class="py-2 px-3 text-sm font-mono font-semibold text-indigo-700">${seatData.seatNumber}</td>
        <td class="py-2 px-3 text-sm">${seatData.section}</td>
        <td class="py-2 px-3 text-sm">${tierBadge}</td>
        <td class="py-2 px-3 text-sm">${seatData.ticketType}</td>
        <td class="py-2 px-3 text-sm text-right font-semibold">${seatData.price}</td>
      </tr>
    `;
  },

  viewBooking(bookingId) {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const performance = this.getPerformanceById(booking.performanceId);
    const performanceData = this.getPerformanceData(booking, performance);
    const customer = this.getCustomerData(booking);
    const seats = Array.isArray(booking.seats) ? booking.seats : [];

    Swal.fire({
      title: `<i class="fas fa-ticket-alt text-indigo-600"></i> Booking Details`,
      html: this.generateBookingDetailsHTML(
        booking,
        performanceData,
        customer,
        seats
      ),
      width: "800px",
      confirmButtonText: "Close",
      confirmButtonColor: "#4f46e5",
    });
  },

  generateBookingDetailsHTML(booking, performanceData, customer, seats) {
    const statusConfig = getStatusConfig(
      booking.status || "pending",
      "booking"
    );

    return `
      <div class="text-left space-y-4">
        ${this.renderBookingInfoSection(booking, statusConfig)}
        ${this.renderPerformanceInfoSection(performanceData)}
        ${this.renderCustomerInfoSection(customer)}
        ${this.renderSeatsDetailsSection(
          seats,
          booking.amount || booking.totalAmount
        )}
      </div>
    `;
  },

  renderBookingInfoSection(booking, statusConfig) {
    return `
      <div class="bg-gray-50 rounded-lg p-4">
        <h3 class="font-semibold text-gray-900 mb-2">
          <i class="fas fa-info-circle text-gray-600 mr-2"></i>Booking Information
        </h3>
        <div class="space-y-2 text-sm">
          <p><span class="font-medium">Booking ID:</span> <span class="font-mono font-semibold text-indigo-700">${
            booking.bookingReference || booking.id
          }</span></p>
          <p><span class="font-medium">Booking Date:</span> ${dayjs(
            booking.bookingDate || booking.date
          ).format("MMMM D, YYYY h:mm A")}</p>
          <p>
            <span class="font-medium">Status:</span>
            <span class="px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${
              statusConfig.badgeClass
            }">
              <i class="fas ${statusConfig.icon}"></i>
              ${statusConfig.text}
            </span>
          </p>
        </div>
      </div>
    `;
  },

  renderPerformanceInfoSection(performanceData) {
    const dateDisplay = performanceData.date
      ? dayjs(performanceData.date).format("MMMM D, YYYY")
      : "N/A";

    return `
      <div class="bg-blue-50 rounded-lg p-4">
        <h3 class="font-semibold text-gray-900 mb-2">
          <i class="fas fa-music text-indigo-600 mr-2"></i>Performance
        </h3>
        <div class="space-y-2 text-sm">
          <p class="font-semibold text-indigo-900 text-base">${performanceData.title}</p>
          <p><span class="font-medium">Venue:</span> ${performanceData.venue}</p>
          <p><span class="font-medium">Date:</span> ${dateDisplay}</p>
        </div>
      </div>
    `;
  },

  renderCustomerInfoSection(customer) {
    const phoneDisplay = customer.phone
      ? `<p><span class="font-medium">Phone:</span> ${customer.phone}</p>`
      : "";

    return `
      <div class="bg-purple-50 rounded-lg p-4">
        <h3 class="font-semibold text-gray-900 mb-2">
          <i class="fas fa-user text-purple-600 mr-2"></i>Customer
        </h3>
        <div class="space-y-2 text-sm">
          <p><span class="font-medium">Name:</span> ${customer.name}</p>
          <p><span class="font-medium">Email:</span> ${customer.email}</p>
          ${phoneDisplay}
        </div>
      </div>
    `;
  },

  renderSeatsDetailsSection(seats, totalAmount) {
    const seatRows = seats
      .map((seat, index) => {
        const seatData = this.parseSeatDetails(seat, index);
        return this.renderSeatDetailRow(seatData);
      })
      .join("");

    return `
      <div class="bg-green-50 rounded-lg p-4 border-2 border-green-300 shadow-sm">
        <h3 class="font-semibold text-gray-900 mb-3">
          <i class="fas fa-chair text-green-600 mr-2"></i>Seats Details
        </h3>
        <div class="bg-white rounded-lg overflow-hidden shadow-sm">
          <table class="w-full">
            <thead class="bg-gray-100 border-b border-gray-200">
              <tr>
                <th class="py-2 px-3 text-left text-xs font-semibold text-gray-700">#</th>
                <th class="py-2 px-3 text-left text-xs font-semibold text-gray-700">Seat</th>
                <th class="py-2 px-3 text-left text-xs font-semibold text-gray-700">Section/Zone</th>
                <th class="py-2 px-3 text-left text-xs font-semibold text-gray-700">Tier</th>
                <th class="py-2 px-3 text-left text-xs font-semibold text-gray-700">Ticket Type</th>
                <th class="py-2 px-3 text-right text-xs font-semibold text-gray-700">Price</th>
              </tr>
            </thead>
            <tbody>
              ${seatRows}
            </tbody>
            <tfoot class="bg-gray-50 border-t-2 border-gray-300">
              <tr>
                <td colspan="5" class="py-3 px-3 text-sm font-semibold text-gray-900 text-right">Total Amount:</td>
                <td class="py-3 px-3 text-right">
                  <span class="text-lg font-bold text-green-700">${formatCurrency(
                    totalAmount
                  )}</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    `;
  },

  async cancelBooking(bookingId) {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const result = await Swal.fire({
      title: "Cancel Booking?",
      html: `Are you sure you want to cancel booking <strong>${bookingId}</strong>?<br><br><span class="text-sm text-gray-600">This action cannot be undone.</span>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: SwalColors.danger,
      confirmButtonText: "Yes, Cancel Booking",
      cancelButtonText: "No, Keep It",
    });

    if (result.isConfirmed) {
      try {
        await bookingAPI.cancel(bookingId);

        const bookingIndex = this.bookings.findIndex((b) => b.id === bookingId);
        if (bookingIndex !== -1) {
          this.bookings[bookingIndex].status = "cancelled";
        }

        this.filterBookings();
        notify.success("Booking cancelled successfully");
      } catch (error) {
        console.error("Error cancelling booking:", error);
        handleApiError(error, "Failed to cancel booking");
      }
    }
  },

  async confirmBooking(bookingId) {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const result = await Swal.fire({
      title: "Confirm Booking?",
      html: `Confirm booking <strong>${bookingId}</strong>?<br><br><span class="text-sm text-gray-600">This will change the status to confirmed.</span>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: SwalColors.success,
      confirmButtonText: "Yes, Confirm",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        await bookingAPI.confirm(bookingId);

        const bookingIndex = this.bookings.findIndex((b) => b.id === bookingId);
        if (bookingIndex !== -1) {
          this.bookings[bookingIndex].status = "confirmed";
        }

        this.filterBookings();
        notify.success("Booking confirmed successfully");
      } catch (error) {
        console.error("Error confirming booking:", error);
        handleApiError(error, "Failed to confirm booking");
      }
    }
  },

  async editBooking(bookingId) {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const performance = this.getPerformanceById(booking.performanceId);
    const customer = this.getCustomerData(booking);

    const { value: formValues } = await Swal.fire({
      title: '<i class="fas fa-edit text-blue-600"></i> Edit Booking',
      html: this.generateEditBookingFormHTML(booking, customer.email),
      width: "600px",
      showCancelButton: true,
      confirmButtonText: "Save Changes",
      cancelButtonText: "Cancel",
      confirmButtonColor: SwalColors.info,
      didOpen: () => this.setupEditBookingHandlers(performance),
      preConfirm: () => this.validateEditBookingForm(),
    });

    if (formValues) {
      try {
        const updatedBooking = await bookingAPI.update(bookingId, formValues);

        const bookingIndex = this.bookings.findIndex((b) => b.id === bookingId);
        if (bookingIndex !== -1) {
          this.bookings[bookingIndex] = {
            ...this.bookings[bookingIndex],
            ...updatedBooking,
          };
        }

        this.filterBookings();
        notify.success("Booking updated successfully");
      } catch (error) {
        console.error("Error updating booking:", error);
        handleApiError(error, "Failed to update booking");
      }
    }
  },

  generateEditBookingFormHTML(booking, customerEmail) {
    const ticketTypes = ticketTypeService.getAll() || [];
    const seats = Array.isArray(booking.seats) ? booking.seats : [];

    return `
      <div class="text-left space-y-4">
        ${this.renderEditField(
          "Booking ID",
          "edit-booking-id",
          "text",
          booking.id,
          true
        )}
        ${this.renderEditPerformanceSelect(booking.performanceId)}
        ${this.renderEditCustomerSelect(customerEmail)}
        ${this.renderEditSeatsField(seats)}
        ${this.renderEditField(
          "Amount (HKD)",
          "edit-amount",
          "number",
          booking.amount,
          false,
          { min: "0", step: "1" }
        )}
        ${this.renderEditTicketTypeSelect(booking.ticketType, ticketTypes)}
        ${this.renderEditStatusSelect(booking.status)}
      </div>
    `;
  },

  renderEditField(label, id, type, value, disabled = false, attrs = {}) {
    const disabledClass = disabled
      ? "bg-gray-50 text-gray-500 cursor-not-allowed"
      : "";
    const attrsStr = Object.entries(attrs)
      .map(([k, v]) => `${k}="${v}"`)
      .join(" ");

    return `
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">${label}</label>
        <input
          id="${id}"
          type="${type}"
          value="${value}"
          ${disabled ? "disabled" : ""}
          ${attrsStr}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${disabledClass}"
        >
      </div>
    `;
  },

  renderEditPerformanceSelect(selectedId) {
    const options = this.performances
      .map(
        (p) =>
          `<option value="${p.id}" ${
            String(p.id) === String(selectedId) ? "selected" : ""
          }>${p.title}</option>`
      )
      .join("");

    return `
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Performance</label>
        <select id="edit-performance" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
          ${options}
        </select>
      </div>
    `;
  },

  renderEditCustomerSelect(selectedEmail) {
    const options = this.users
      .map(
        (u) =>
          `<option value="${u.id}" ${
            u.email === selectedEmail ? "selected" : ""
          }>${u.name} (${u.email})</option>`
      )
      .join("");

    return `
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Customer</label>
        <select id="edit-customer" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
          ${options}
        </select>
      </div>
    `;
  },

  renderEditSeatsField(seats) {
    const labels = this.extractSeatNumbers(seats);
    return `
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Selected Seats</label>
        <div class="flex gap-2">
          <input id="edit-seats" type="text" value="${labels.join(
            ", "
          )}" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="A1, A2, A3" readonly>
          <button id="select-seats-btn" type="button" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 transition-colors">
            <i class="fas fa-chair mr-2"></i>Select Seats
          </button>
        </div>
        <p class="text-xs text-gray-500 mt-1">Click "Select Seats" to choose from available seats</p>
      </div>
    `;
  },

  renderEditTicketTypeSelect(selectedType, ticketTypes) {
    const selectedName =
      typeof selectedType === "object" ? selectedType?.name : selectedType;
    const options =
      ticketTypes.length > 0
        ? ticketTypes
            .map(
              (type) =>
                `<option value="${type.name}" ${
                  type.name === selectedName ? "selected" : ""
                }>${type.name}${type.isCustom ? " (Custom)" : ""}</option>`
            )
            .join("")
        : `<option value="${selectedName}" selected>${selectedName}</option>`;

    return `
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Ticket Type</label>
        <select id="edit-ticket-type" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
          ${options}
        </select>
      </div>
    `;
  },

  renderEditStatusSelect(selectedStatus) {
    const statuses = ["pending", "confirmed", "cancelled"];
    const options = statuses
      .map(
        (status) =>
          `<option value="${status}" ${
            status === selectedStatus ? "selected" : ""
          }>${getStatusConfig(status, "booking").text}</option>`
      )
      .join("");

    return `
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select id="edit-status" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
          ${options}
        </select>
      </div>
    `;
  },

  setupEditBookingHandlers(performance) {
    $("#select-seats-btn").on("click", async () => {
      const $seatsInput = $("#edit-seats");
      const currentSeats = $seatsInput
        .val()
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);
      const selectedPerformance =
        this.getPerformanceById($("#edit-performance").val()) || performance;

      const result = await this.showSeatSelectionModal(
        currentSeats,
        selectedPerformance
      );
      if (result) {
        $seatsInput.val(result.join(", ")).trigger("change");
      }
    });
  },

  validateEditBookingForm() {
    const seats = document
      .getElementById("edit-seats")
      .value.split(",")
      .map((s) => s.trim())
      .filter((s) => s);
    const amount = parseFloat(document.getElementById("edit-amount").value);

    if (!seats.length) {
      Swal.showValidationMessage("Please enter at least one seat");
      return false;
    }

    if (isNaN(amount) || amount < 0) {
      Swal.showValidationMessage("Please enter a valid amount");
      return false;
    }

    return {
      performanceId: document.getElementById("edit-performance").value,
      userId: document.getElementById("edit-customer").value,
      seats,
      amount,
      ticketType: document.getElementById("edit-ticket-type").value,
      status: document.getElementById("edit-status").value,
    };
  },

  updateBookingData(booking, formValues) {
    Object.assign(booking, formValues);
  },

  async refundBooking(bookingId) {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const { value: refundData } = await Swal.fire({
      title: '<i class="fas fa-undo text-orange-600"></i> Process Refund',
      html: this.generateRefundFormHTML(booking),
      width: "600px",
      showCancelButton: true,
      confirmButtonText: "Process Refund",
      cancelButtonText: "Cancel",
      confirmButtonColor: SwalColors.warning,
      didOpen: () => this.setupRefundHandlers(),
      preConfirm: () => this.validateRefundForm(booking.amount),
    });

    if (refundData) {
      await this.processRefund(booking, refundData);
    }
  },

  generateRefundFormHTML(booking) {
    return `
      <div class="text-left space-y-4">
        <div class="bg-gray-50 rounded-lg p-4 mb-4">
          <p class="text-sm"><span class="font-medium">Booking ID:</span> ${
            booking.id
          }</p>
          <p class="text-sm"><span class="font-medium">Original Amount:</span> ${formatCurrency(
            booking.amount
          )}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Refund Type</label>
          <select id="refund-type" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
            <option value="full">Full Refund (${formatCurrency(
              booking.amount
            )})</option>
            <option value="partial">Partial Refund</option>
          </select>
        </div>

        <div id="partial-refund-container" style="display: none;">
          <label class="block text-sm font-medium text-gray-700 mb-1">Refund Amount (HKD)</label>
          <input id="refund-amount" type="number" max="${
            booking.amount
          }" min="1" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="Enter amount">
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Refund Reason</label>
          <textarea id="refund-reason" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="Enter reason for refund"></textarea>
        </div>
      </div>
    `;
  },

  setupRefundHandlers() {
    const typeSelect = document.getElementById("refund-type");
    const partialContainer = document.getElementById(
      "partial-refund-container"
    );

    typeSelect.addEventListener("change", () => {
      partialContainer.style.display =
        typeSelect.value === "partial" ? "block" : "none";
    });
  },

  validateRefundForm(maxAmount) {
    const type = document.getElementById("refund-type").value;
    const reason = document.getElementById("refund-reason").value;
    let amount = maxAmount;

    if (type === "partial") {
      const partialAmount = parseFloat(
        document.getElementById("refund-amount").value
      );
      if (
        isNaN(partialAmount) ||
        partialAmount <= 0 ||
        partialAmount > maxAmount
      ) {
        Swal.showValidationMessage(
          `Please enter a valid amount between 1 and ${maxAmount}`
        );
        return false;
      }
      amount = partialAmount;
    }

    if (!reason.trim()) {
      Swal.showValidationMessage("Please provide a reason for the refund");
      return false;
    }

    return { type, amount, reason };
  },

  async processRefund(booking, refundData) {
    await Swal.fire({
      title: "Refund Processed",
      html: this.generateRefundSuccessHTML(refundData),
      icon: "success",
      confirmButtonText: "Close",
    });

    if (refundData.type === "full") {
      booking.status = "cancelled";
    }
    booking.refunded = true;
    booking.refundAmount = refundData.amount;
    booking.refundReason = refundData.reason;

    this.filterBookings();
    notify.success(
      `Refund of ${formatCurrency(refundData.amount)} processed successfully`
    );
  },

  generateRefundSuccessHTML(refundData) {
    return `
      <div class="text-left space-y-3">
        <div class="bg-green-50 rounded-lg p-4">
          <p class="text-sm text-green-800 mb-2"><i class="fas fa-check-circle mr-2"></i>Refund successfully processed</p>
          <hr class="my-2 border-green-200">
          <p class="text-sm"><span class="font-medium">Amount:</span> ${formatCurrency(
            refundData.amount
          )}</p>
          <p class="text-sm"><span class="font-medium">Type:</span> ${
            refundData.type === "full" ? "Full Refund" : "Partial Refund"
          }</p>
          <p class="text-sm"><span class="font-medium">Reason:</span> ${
            refundData.reason
          }</p>
        </div>
      </div>
    `;
  },

  async showSeatSelectionModal(currentSeats = [], performance) {
    let selectedSeats = [...currentSeats];
    const bookedSeats = this.getBookedSeatsForPerformance(
      performance?.id,
      currentSeats
    );

    const result = await Swal.fire({
      title: '<i class="fas fa-chair text-indigo-600"></i> Select Seats',
      html: this.generateSeatSelectionHTML(
        performance,
        selectedSeats,
        bookedSeats,
        currentSeats
      ),
      width: "900px",
      showCancelButton: true,
      confirmButtonText: `Confirm Selection (${selectedSeats.length})`,
      cancelButtonText: "Cancel",
      confirmButtonColor: SwalColors.primary,
      didOpen: () => {
        this.setupSeatSelectionHandlers(
          selectedSeats,
          bookedSeats,
          currentSeats
        );
      },
    });

    return result.isConfirmed ? selectedSeats : null;
  },

  getBookedSeatsForPerformance(performanceId, excludeSeats = []) {
    const seats = this.bookings
      .filter(
        (b) =>
          String(b.performanceId) === String(performanceId) &&
          b.status !== "cancelled"
      )
      .flatMap((b) => (Array.isArray(b.seats) ? b.seats : []));
    const toLabel = (s) => {
      if (typeof s === "string") return getDisplayLabel(s);
      return (
        s.displayLabel ||
        s.seatNumber ||
        s.seat ||
        s.id ||
        getDisplayLabel(s.fullId || s.seatId || "")
      );
    };
    const exclude = excludeSeats;
    return seats
      .map((s) => toLabel(s))
      .filter((v) => v)
      .filter((seat) => !exclude.includes(seat));
  },

  generateSeatSelectionHTML(
    performance,
    selectedSeats,
    bookedSeats,
    currentSeats
  ) {
    return `
      <div class="text-left">
        ${this.renderSeatSelectionHeader(performance)}
        ${this.renderSeatSelectionLegend()}
        ${this.renderSelectedSeatsDisplay(selectedSeats)}
        ${this.renderSeatGrid(bookedSeats, currentSeats, selectedSeats)}
        ${this.renderSeatSelectionActions()}
      </div>
    `;
  },

  renderSeatSelectionHeader(performance) {
    return `
      <div class="bg-gray-50 rounded-lg p-4 mb-4">
        <p class="text-sm mb-2"><span class="font-medium">Performance:</span> ${
          performance?.title || "Unknown"
        }</p>
        <p class="text-sm"><span class="font-medium">Venue:</span> ${
          performance?.venue || "N/A"
        }</p>
      </div>
    `;
  },

  renderSeatSelectionLegend() {
    return `
      <div class="flex items-center gap-4 mb-4 text-xs">
        <div class="flex items-center gap-1">
          <div class="w-6 h-6 bg-white border-2 border-gray-300 rounded"></div>
          <span>Available</span>
        </div>
        <div class="flex items-center gap-1">
          <div class="w-6 h-6 bg-indigo-600 rounded"></div>
          <span>Selected</span>
        </div>
        <div class="flex items-center gap-1">
          <div class="w-6 h-6 bg-gray-300 rounded"></div>
          <span>Booked</span>
        </div>
      </div>
    `;
  },

  updateStatsBar() {
    const stats = this.calculateStats();
    const html = stats.map((stat) => FormComponents.statCard(stat)).join("");
    const el = document.getElementById("bookingsStats");
    if (el) el.innerHTML = html;
  },

  renderSelectedSeatsDisplay(selectedSeats) {
    return `
      <div class="mb-4 p-3 bg-indigo-50 rounded-lg">
        <p class="text-sm font-medium text-indigo-900">
          Selected Seats (<span id="selected-count">${
            selectedSeats.length
          }</span>):
          <span id="selected-seats-display" class="font-normal">${
            selectedSeats.join(", ") || "None"
          }</span>
        </p>
      </div>
    `;
  },

  renderSeatGrid(bookedSeats, currentSeats, selectedSeats) {
    const gridHTML = SEAT_GRID_CONFIG.rows
      .map((row) =>
        this.renderSeatRow(row, bookedSeats, currentSeats, selectedSeats)
      )
      .join("");

    return `
      <div class="bg-white border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
        <div class="mb-4 text-center">
          <div class="inline-block bg-gray-800 text-white px-8 py-2 rounded-lg font-semibold">
            <i class="fas fa-tv mr-2"></i>STAGE
          </div>
        </div>
        <div id="seat-grid">
          ${gridHTML}
        </div>
      </div>
    `;
  },

  renderSeatRow(row, bookedSeats, currentSeats, selectedSeats) {
    const seatsHTML = Array.from(
      { length: SEAT_GRID_CONFIG.seatsPerRow },
      (_, i) => i + 1
    )
      .map((num) =>
        this.renderSeatButton(
          row,
          num,
          bookedSeats,
          currentSeats,
          selectedSeats
        )
      )
      .join("");

    return `
      <div class="mb-3">
        <div class="flex items-center gap-2 mb-2">
          <span class="font-semibold text-gray-700 w-6">${row}</span>
          <div class="flex flex-wrap gap-2">
            ${seatsHTML}
          </div>
        </div>
      </div>
    `;
  },

  renderSeatButton(row, num, bookedSeats, currentSeats, selectedSeats) {
    const seatId = `${row}${num}`;
    const isSelected = selectedSeats.includes(seatId);
    const isBooked =
      bookedSeats.includes(seatId) && !currentSeats.includes(seatId);

    let classes =
      "seat-btn w-10 h-10 rounded-lg font-medium text-xs transition-all duration-200 ";
    if (isBooked) {
      classes += "bg-gray-300 text-gray-500 cursor-not-allowed";
    } else if (isSelected) {
      classes += "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md";
    } else {
      classes +=
        "bg-white border-2 border-gray-300 text-gray-700 hover:border-indigo-400 hover:bg-indigo-50";
    }

    return `
      <button
        type="button"
        class="${classes}"
        data-seat="${seatId}"
        ${isBooked ? "disabled" : ""}
      >
        ${num}
      </button>
    `;
  },

  renderSeatSelectionActions() {
    return `
      <div class="mt-4 flex gap-2">
        <button id="clear-selection-btn" type="button" class="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
          <i class="fas fa-times mr-2"></i>Clear Selection
        </button>
        <button id="select-row-btn" type="button" class="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
          <i class="fas fa-chair mr-2"></i>Select Row
        </button>
      </div>
    `;
  },

  setupSeatSelectionHandlers(selectedSeats, bookedSeats, currentSeats) {
    const updateDisplay = () => {
      $("#selected-count").text(selectedSeats.length);
      $("#selected-seats-display").text(selectedSeats.join(", ") || "None");
      Swal.getConfirmButton().textContent = `Confirm Selection (${selectedSeats.length})`;

      $(".seat-btn").each(function () {
        const seatId = $(this).attr("data-seat");
        if ($(this).prop("disabled")) return;

        if (selectedSeats.includes(seatId)) {
          $(this).attr(
            "class",
            "seat-btn w-10 h-10 rounded-lg font-medium text-xs transition-all duration-200 bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
          );
        } else {
          $(this).attr(
            "class",
            "seat-btn w-10 h-10 rounded-lg font-medium text-xs transition-all duration-200 bg-white border-2 border-gray-300 text-gray-700 hover:border-indigo-400 hover:bg-indigo-50"
          );
        }
      });
    };

    $(".seat-btn").on("click", function () {
      const seatId = $(this).attr("data-seat");
      const index = selectedSeats.indexOf(seatId);

      if (index > -1) {
        selectedSeats.splice(index, 1);
      } else {
        selectedSeats.push(seatId);
        selectedSeats.sort((a, b) => {
          const rowA = a.match(/[A-Z]/)[0];
          const rowB = b.match(/[A-Z]/)[0];
          const numA = parseInt(a.match(/\d+/)[0]);
          const numB = parseInt(b.match(/\d+/)[0]);
          if (rowA !== rowB) return rowA.localeCompare(rowB);
          return numA - numB;
        });
      }
      updateDisplay();
    });

    $("#clear-selection-btn").on("click", () => {
      selectedSeats.length = 0;
      updateDisplay();
    });

    $("#select-row-btn").on("click", () =>
      this.selectEntireRow(
        selectedSeats,
        bookedSeats,
        currentSeats,
        updateDisplay
      )
    );
  },

  async selectEntireRow(
    selectedSeats,
    bookedSeats,
    currentSeats,
    updateDisplay
  ) {
    const { value: row } = await Swal.fire({
      title: "Select Row",
      input: "select",
      inputOptions: SEAT_GRID_CONFIG.rows.reduce(
        (acc, r) => ({ ...acc, [r]: `Row ${r}` }),
        {}
      ),
      inputPlaceholder: "Choose a row",
      showCancelButton: true,
    });

    if (row) {
      const rowSeats = Array.from(
        { length: SEAT_GRID_CONFIG.seatsPerRow },
        (_, i) => `${row}${i + 1}`
      );
      const availableRowSeats = rowSeats.filter(
        (seat) => !bookedSeats.includes(seat) || currentSeats.includes(seat)
      );

      availableRowSeats.forEach((seat) => {
        if (!selectedSeats.includes(seat)) {
          selectedSeats.push(seat);
        }
      });

      selectedSeats.sort((a, b) => {
        const rowA = a.match(/[A-Z]/)[0];
        const rowB = b.match(/[A-Z]/)[0];
        const numA = parseInt(a.match(/\d+/)[0]);
        const numB = parseInt(b.match(/\d+/)[0]);
        if (rowA !== rowB) return rowA.localeCompare(rowB);
        return numA - numB;
      });

      updateDisplay();
    }
  },

  async emailBooking(bookingId) {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const customer = this.getCustomerData(booking);

    const { value: emailData } = await Swal.fire({
      title: '<i class="fas fa-envelope text-purple-600"></i> Send Email',
      html: this.generateEmailFormHTML(booking, customer),
      width: "600px",
      showCancelButton: true,
      confirmButtonText: "Send Email",
      cancelButtonText: "Cancel",
      confirmButtonColor: SwalColors.purple,
      didOpen: () => this.setupEmailHandlers(),
      preConfirm: () => this.validateEmailForm(),
    });

    if (emailData) {
      await this.sendEmail(booking, customer, emailData);
    }
  },

  generateEmailFormHTML(booking, customer) {
    return `
      <div class="text-left space-y-4">
        <div class="bg-gray-50 rounded-lg p-4 mb-4">
          <p class="text-sm"><span class="font-medium">To:</span> ${customer.email}</p>
          <p class="text-sm"><span class="font-medium">Customer:</span> ${customer.name}</p>
          <p class="text-sm"><span class="font-medium">Booking:</span> ${booking.id}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email Template</label>
          <select id="email-template" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
            <option value="confirmation">Booking Confirmation</option>
            <option value="reminder">Event Reminder</option>
            <option value="update">Booking Update</option>
            <option value="cancellation">Cancellation Notice</option>
            <option value="custom">Custom Message</option>
          </select>
        </div>

        <div id="custom-message-container" style="display: none;">
          <label class="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <input id="email-subject" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 mb-2" placeholder="Email subject">

          <label class="block text-sm font-medium text-gray-700 mb-1">Message</label>
          <textarea id="email-message" rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="Enter your message"></textarea>
        </div>

        <div class="bg-blue-50 rounded-lg p-3">
          <p class="text-xs text-blue-800">
            <i class="fas fa-info-circle mr-1"></i>
            The email will include booking details, seat information, and QR code.
          </p>
        </div>
      </div>
    `;
  },

  setupEmailHandlers() {
    const templateSelect = document.getElementById("email-template");
    const customContainer = document.getElementById("custom-message-container");

    templateSelect.addEventListener("change", () => {
      customContainer.style.display =
        templateSelect.value === "custom" ? "block" : "none";
    });
  },

  validateEmailForm() {
    const template = document.getElementById("email-template").value;
    let subject = "";
    let message = "";

    if (template === "custom") {
      subject = document.getElementById("email-subject").value;
      message = document.getElementById("email-message").value;

      if (!subject.trim() || !message.trim()) {
        Swal.showValidationMessage("Please provide both subject and message");
        return false;
      }
    }

    return { template, subject, message };
  },

  async sendEmail(booking, customer, emailData) {
    const templateTitles = {
      confirmation: "Booking Confirmation",
      reminder: "Event Reminder",
      update: "Booking Update",
      cancellation: "Cancellation Notice",
      custom: emailData.subject,
    };

    await Swal.fire({
      title: "Email Sent Successfully",
      html: `
        <div class="text-left space-y-3">
          <div class="bg-green-50 rounded-lg p-4">
            <p class="text-sm text-green-800 mb-2"><i class="fas fa-check-circle mr-2"></i>Email sent successfully</p>
            <hr class="my-2 border-green-200">
            <p class="text-sm"><span class="font-medium">To:</span> ${
              customer.email
            }</p>
            <p class="text-sm"><span class="font-medium">Template:</span> ${
              templateTitles[emailData.template]
            }</p>
            <p class="text-sm"><span class="font-medium">Booking ID:</span> ${
              booking.id
            }</p>
          </div>
        </div>
      `,
      icon: "success",
      confirmButtonText: "Close",
    });

    notify.success("Email sent successfully");
  },

  exportBookings() {
    const csv = this.bookingsToCSV();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bookings-${dayjs().format("YYYY-MM-DD")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    notify.success("Bookings exported successfully");
  },

  bookingsToCSV() {
    const headers = [
      "Booking ID",
      "Performance",
      "Customer",
      "Email",
      "Seats",
      "Amount",
      "Status",
      "Date",
    ];
    const rows = this.filteredBookings.map((booking) => {
      const performance = this.getPerformanceById(booking.performanceId);
      const customer = this.getCustomerData(booking);
      const seats = this.extractSeatNumbers(booking.seats);

      return [
        booking.id,
        performance?.title || "Unknown",
        customer.name,
        customer.email,
        seats.join("; "),
        booking.amount,
        booking.status,
        dayjs(booking.bookingDate || booking.date).format("YYYY-MM-DD HH:mm"),
      ];
    });

    return [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
  },
};
