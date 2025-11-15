import { getStatusBadge } from "/src/utils/status.js";
import { createDebounceSearch } from "/src/utils/data/filters.js";
import { performanceUtils } from "/src/utils/performanceUtils.js";
import { createModal, openModal, closeModal } from "/src/components/Modal.js";
import { ResponseExtractor } from "/src/services/responseExtractor.js";
import { getTierBadge } from "/src/config/tierConfig.js";
import { getDisplayLabel } from "/src/utils/seatIdHelper.js";
import {
  initImageUpload,
  getImageDataURL,
} from "/src/components/ImageUpload.js";
import { notify } from "/src/utils/ui/notification.js";
import { SYSTEM_TICKET_TYPE_IDS } from "/src/data/mockData.js";
import { ticketTypeService } from "/src/services/ticketTypeService.js";
import { templateService } from "/src/services/templateService.js";
import { venueService } from "/src/services/venueService.js";
import { showtimeManager } from "/src/utils/booking/showtimeManager.js";
import {
  performanceAPI,
  venueAPI,
  handleApiError,
} from "/src/services/apiClient.js";
import {
  createTemplateSelector,
  initTemplateSelector,
} from "/src/components/TemplateSelector.js";
import {
  createZoneEditor,
  showZoneEditorDialog,
} from "/src/components/ZoneEditor.js";
import { attachSeatTooltipListeners } from "/src/utils/booking/seatTooltip.js";
import {
  getSectionColor,
  getSeatStatusColor,
  SwalColors,
} from "/src/utils/colors.js";
import { SeatMap } from "/src/components/SeatMap.js";
import { SeatLayoutCustomizer } from "/src/components/SeatLayoutCustomizer.js";
import { PerformanceFormSections } from "/src/components/PerformanceFormSections.js";
import { FormComponents } from "/src/components/FormComponents.js";
import dayjs from "dayjs";
import Swal from "sweetalert2";
import { storage } from "../../services/storageService.js";

const DEFAULT_SEAT_LAYOUT = {
  rows: 5,
  seatsPerRow: 8,
};

const TIER_OPTIONS = ["vip", "premium", "standard", "economy"];

const SEAT_STATUS_OPTIONS = {
  available: "Available",
  blocked: "Blocked",
  reserved: "Reserved",
};

const ACCESSIBILITY_CATEGORIES = {
  wheelchair: "Wheelchair Accessible",
  "assisted-listening": "Assisted Listening",
  "restricted-view": "Restricted View",
  "extra-legroom": "Extra Legroom",
};

const DEFAULT_IMAGE_PATH = "/img/default-performance.jpg";

export default {
  title: "Manage Performances | Admin",

  currentPerformance: null,
  showtimes: [],
  groupDiscounts: [],
  ticketTypes: [],
  venues: [],

  getVenueDisplay(performance) {
    return (
      performance.venueName ||
      performance.venue ||
      performance.location ||
      "N/A"
    );
  },

  getShowtimeDateTime(showtime) {
    return showtime.dateTime || showtime.datetime;
  },

  formatShowtimeDate(showtime, format = "MMM D, YYYY") {
    return dayjs(this.getShowtimeDateTime(showtime)).format(format);
  },

  formatShowtimeTime(showtime, format = "h:mm A") {
    return dayjs(this.getShowtimeDateTime(showtime)).format(format);
  },

  getSeatLayout(showtime) {
    if (showtime.seatLayout) {
      return showtime.seatLayout;
    }
    if (showtime.venueId && this.venues.length > 0) {
      const venue = this.venues.find((v) => v.id === showtime.venueId);
      if (venue?.layout?.sections?.[0]) {
        return {
          rows: venue.layout.sections[0].rows || DEFAULT_SEAT_LAYOUT.rows,
          seatsPerRow:
            venue.layout.sections[0].seatsPerRow ||
            DEFAULT_SEAT_LAYOUT.seatsPerRow,
        };
      }
    }
    return DEFAULT_SEAT_LAYOUT;
  },

  getPerformanceById(id) {
    return this.performances.find((p) => p.id === id);
  },

  async getVenueById(id) {
    if (this.venues.length > 0) {
      return this.venues.find((v) => v.id === id);
    }
    try {
      const response = await venueAPI.getById(id);
      return ResponseExtractor.extractSingle(response, "venue");
    } catch (error) {
      console.error("Failed to fetch venue:", error);
      return null;
    }
  },

  async render() {
    return `
      <main class="container mx-auto px-4 py-8">
        <div class="flex justify-between items-center mb-8">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">
              <i class="fas fa-music text-indigo-600 mr-3"></i>Performance Management
            </h1>
            <p class="text-gray-600 mt-2">Create and manage orchestral performances</p>
          </div>
          <button
            id="addPerformanceBtn"
            class="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md transition-colors"
          >
            <i class="fas fa-plus mr-2"></i>Add Performance
          </button>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <input
              type="text"
              id="searchInput"
              placeholder="Search performances..."
              class="text-gray-900 bg-white px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-400"
            />
            <select
              id="statusFilter"
              class="text-gray-900 bg-white px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option class="text-gray-900 bg-white" value="">All Status</option>
              <option class="text-gray-900 bg-white" value="on_sale">On Sale</option>
              <option class="text-gray-900 bg-white" value="upcoming">Upcoming</option>
              <option class="text-gray-900 bg-white" value="sold_out">Sold Out</option>
              <option class="text-gray-900 bg-white" value="early_bird">Early Bird</option>
              <option class="text-gray-900 bg-white" value="pre_order">Pre-Order</option>
            </select>
            <select
              id="availabilityFilter"
              class="text-gray-900 bg-white px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option class="text-gray-900 bg-white" value="">All Availability</option>
              <option class="text-gray-900 bg-white" value="high">High (>50%)</option>
              <option class="text-gray-900 bg-white" value="medium">Limited (10-50%)</option>
              <option class="text-gray-900 bg-white" value="low">Very Limited (<10%)</option>
              <option class="text-gray-900 bg-white" value="sold_out">Sold Out</option>
            </select>
            <select
              id="venueFilter"
              class="text-gray-900 bg-white px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option class="text-gray-900 bg-white" value="">All Venues</option>
            </select>
            <input
              type="date"
              id="dateFilter"
              class="text-gray-900 bg-white px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div class="flex items-center justify-between">
            <button
              id="clearFilters"
              class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-transparent border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 active:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <i class="fas fa-filter-circle-xmark"></i>
              Clear Filters
            </button>
            <div class="text-sm text-gray-600">
              <span id="resultCount">0</span> performance(s) found
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Image</th>
                <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Title</th>
                <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Venue</th>
                <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Date</th>
                <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Composer</th>
                <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Conductor</th>
                <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody id="performancesTable" class="divide-y divide-gray-200"></tbody>
          </table>
        </div>

        <div id="performanceModalContainer"></div>
      </main>
    `;
  },

  async afterRender() {
    try {
      this.ticketTypes = await ticketTypeService.getAll();
      const [performancesResponse, venuesResponse] = await Promise.all([
        performanceAPI.getAll(),
        venueAPI.getAll(),
      ]);
      this.performances = ResponseExtractor.extract(
        performancesResponse,
        "performances"
      );
      this.venues = ResponseExtractor.extract(venuesResponse, "venues");
      this.populateVenueFilter();
      this.displayPerformances(this.performances);
      this.setupEventListeners();
      this.renderPerformanceModal();
    } catch (error) {
      console.error("Error loading performances:", error);
      handleApiError(error, "Failed to load performances");
    }
  },

  populateVenueFilter() {
    const venues = new Set();
    this.performances.forEach((p) => {
      const venue = p.venueName || p.venue;
      if (venue) venues.add(venue);
    });

    const $venueFilter = $("#venueFilter");
    Array.from(venues)
      .sort()
      .forEach((venue) => {
        $venueFilter.append(
          `<option class="text-gray-900 bg-white" value="${venue}">${venue}</option>`
        );
      });
  },

  displayPerformances(data) {
    const $tbody = $("#performancesTable");
    $tbody.empty();

    $("#resultCount").text(data.length);

    if (!data || data.length === 0) {
      $tbody.append(this.renderEmptyPerformancesRow());
      return;
    }

    data.forEach((perf) => {
      $tbody.append(this.renderPerformanceRow(perf));
    });

    window.PerformancesPage = this;
  },

  renderEmptyPerformancesRow() {
    return `
      <tr>
        <td colspan="8" class="px-6 py-8 text-center text-gray-500">
            No performances found. Click "Add Performance" to create one.
          </td>
        </tr>
    `;
  },

  renderPerformanceRow(perf) {
    const statusBadge = getStatusBadge(
      perf.ticketingInfo?.status || "upcoming",
      "performance"
    );
    const imageHtml = this.renderPerformanceImage(perf);
    const venue = this.getVenueDisplay(perf);
    const showtimes = perf.showtimes || [];
    const showtimeCount = showtimes.length;
    const dateDisplay = this.renderDateDisplay(perf, showtimes);

    return `
      <tr class="hover:bg-gray-50 transition-colors">
          <td class="px-6 py-4">${imageHtml}</td>
          <td class="px-6 py-4">
            <div class="text-sm font-medium text-gray-900">${perf.title}</div>
            <div class="text-xs text-gray-500">${perf.orchestra || "N/A"}</div>
          </td>
        <td class="px-6 py-4">
          <div class="text-sm text-gray-900">${venue}</div>
        </td>
        <td class="px-6 py-4">${dateDisplay}</td>
          <td class="px-6 py-4 text-sm text-gray-600">${perf.composer}</td>
          <td class="px-6 py-4 text-sm text-gray-600">${perf.conductor}</td>
          <td class="px-6 py-4">${statusBadge}</td>
          <td class="px-6 py-4">
          <div class="flex items-center gap-2">
            ${this.renderPerformanceActions(perf, showtimeCount)}
            </div>
          </td>
        </tr>
    `;
  },

  renderPerformanceImage(perf) {
    return perf.imageUrl
      ? `<img src="${perf.imageUrl}" class="h-16 w-16 object-cover rounded" />`
      : `<div class="h-16 w-16 bg-gray-200 rounded flex items-center justify-center"><i class="fas fa-image text-gray-400"></i></div>`;
  },

  renderDateDisplay(perf, showtimes) {
    const showtimeCount = showtimes.length;

    if (showtimeCount > 0) {
      const firstShowtime = dayjs(this.getShowtimeDateTime(showtimes[0]));

      if (showtimeCount === 1) {
        return `
          <div class="text-sm font-medium text-gray-900">${firstShowtime.format(
            "MMM D, YYYY"
          )}</div>
          <div class="text-xs text-gray-500">${firstShowtime.format(
            "h:mm A"
          )}</div>
        `;
      }

      const lastShowtime = dayjs(
        this.getShowtimeDateTime(showtimes[showtimeCount - 1])
      );
      return `
        <div class="flex items-center gap-2 mb-1">
          <span class="text-sm font-medium text-gray-900">${firstShowtime.format(
            "MMM D"
          )}</span>
          <i class="fas fa-arrow-right text-xs text-gray-400"></i>
          <span class="text-sm font-medium text-gray-900">${lastShowtime.format(
            "MMM D, YYYY"
          )}</span>
        </div>
        <div class="inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
          <i class="fas fa-calendar-day"></i>
          <span>${showtimeCount} Showtimes</span>
        </div>
      `;
    }

    if (perf.date) {
      return `
        <div class="text-sm text-gray-900">${dayjs(perf.date).format(
          "MMM D, YYYY"
        )}</div>
        <div class="text-xs text-gray-500">No showtimes set</div>
      `;
    }

    return `<div class="text-sm text-gray-500">N/A</div>`;
  },

  renderPerformanceActions(perf, showtimeCount) {
    const actions = [];

    actions.push(
      FormComponents.actionButton({
        icon: "fa-eye",
        color: "blue",
        size: "sm",
        title: "View Details",
        onClick: `window.PerformancesPage.viewPerformance(${perf.id})`,
      })
    );

    if (showtimeCount > 0) {
      actions.push(
        FormComponents.actionButton({
          icon: "fa-calendar-alt",
          color: "green",
          size: "sm",
          title: `Manage ${showtimeCount} Showtime${
            showtimeCount > 1 ? "s" : ""
          }`,
          onClick: `window.PerformancesPage.manageShowtimes(${perf.id})`,
        })
      );
    }

    actions.push(
      FormComponents.actionButton({
        icon: "fa-edit",
        color: "yellow",
        size: "sm",
        title: "Edit Performance",
        onClick: `window.PerformancesPage.editPerformance(${perf.id})`,
      }),
      FormComponents.actionButton({
        icon: "fa-copy",
        color: "indigo",
        size: "sm",
        title: "Duplicate Performance",
        onClick: `window.PerformancesPage.duplicatePerformance(${perf.id})`,
      }),
      FormComponents.actionButton({
        icon: "fa-trash",
        color: "red",
        size: "sm",
        title: "Delete Performance",
        onClick: `window.PerformancesPage.deletePerformance(${perf.id})`,
      })
    );

    return actions.join("");
  },

  setupEventListeners() {
    const debouncedFilter = createDebounceSearch(
      () => this.filterPerformances(),
      300
    );

    $("#searchInput").on("input", debouncedFilter);
    $("#statusFilter, #dateFilter, #availabilityFilter, #venueFilter").on(
      "change",
      () => this.filterPerformances()
    );
    $("#clearFilters").on("click", () => this.clearFilters());
    $("#addPerformanceBtn").on("click", () => this.openPerformanceForm());
  },

  filterPerformances() {
    const search = $("#searchInput").val()?.toLowerCase() || "";
    const status = $("#statusFilter").val();
    const availability = $("#availabilityFilter").val();
    const venue = $("#venueFilter").val();
    const dateFilter = $("#dateFilter").val();

    let filtered = this.performances.filter((p) => {
      const matchesSearch =
        !search ||
        (p.title && p.title.toLowerCase().includes(search)) ||
        (p.composer && p.composer.toLowerCase().includes(search)) ||
        (p.conductor && p.conductor.toLowerCase().includes(search)) ||
        (p.orchestra && p.orchestra.toLowerCase().includes(search));

      const matchesStatus =
        !status || performanceUtils.getPerformanceStatus(p) === status;

      const matchesAvailability = performanceUtils.filterByAvailability(
        p,
        availability
      );

      const matchesVenue = !venue || performanceUtils.getVenueName(p) === venue;

      let matchesDate = true;
      if (dateFilter) {
        const filterDate = new Date(dateFilter);
        const perfDate = new Date(
          p.showtimes?.[0]?.dateTime || p.date || new Date()
        );
        matchesDate = perfDate.toDateString() === filterDate.toDateString();
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesAvailability &&
        matchesVenue &&
        matchesDate
      );
    });

    this.displayPerformances(filtered);
  },

  clearFilters() {
    $(
      "#searchInput, #dateFilter, #statusFilter, #availabilityFilter, #venueFilter"
    ).val("");
    this.displayPerformances(this.performances);
  },

  renderPerformanceModal() {
    const modalBody = this.getPerformanceFormHTML();
    const modalFooter = `
      <button type="button" class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" onclick="closeModal('performanceModal')">
        Cancel
      </button>
      <button type="submit" form="performanceForm" class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
        <i class="fas fa-save mr-2"></i>Save Performance
      </button>
    `;

    const modal = createModal({
      id: "performanceModal",
      title: "Add Performance",
      subtitle: "Create a new orchestral performance",
      body: modalBody,
      footer: modalFooter,
      size: "xl",
    });

    $("#performanceModalContainer").html(modal);
  },

  getPerformanceFormHTML() {
    return `
      <form id="performanceForm" class="space-y-8">
        ${PerformanceFormSections.basicInformation()}
        ${PerformanceFormSections.performanceInformation()}
        ${PerformanceFormSections.ticketingInformation()}

        <div class="bg-gray-50 p-6 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            <i class="fas fa-users text-indigo-600 mr-2"></i>Group Booking Discounts
          </h3>
          <div class="space-y-4" id="groupDiscountsContainer">
            <div class="p-4 bg-white rounded-lg border border-gray-200">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label class="block text-xs text-gray-600 mb-1">Minimum Tickets</label>
                  <input type="number" id="groupMinTickets" min="1"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
                    placeholder="10" />
                </div>
                <div>
                  <label class="block text-xs text-gray-600 mb-1">Discount Type</label>
                  <select id="groupDiscountType"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black">
                    <option value="percentage">Percentage (%)</option>
                    <option value="amount">Fixed Amount ($)</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs text-gray-600 mb-1">
                    <span id="groupDiscountLabel">Discount (%)</span>
                  </label>
                  <input type="number" id="groupDiscount" min="0"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
                    placeholder="10" />
                </div>
                <div>
                  <label class="block text-xs text-gray-600 mb-1">Note</label>
                  <input type="text" id="groupNote"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
                    placeholder="10% off for groups" />
                </div>
              </div>
            </div>
          </div>
        </div>

        ${PerformanceFormSections.showtimesSection()}

        <div class="bg-gray-50 p-6 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            <i class="fas fa-tags text-indigo-600 mr-2"></i>Sponsors & Tags
          </h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Sponsors (comma-separated)
              </label>
              <input type="text" id="sponsors"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="HSBC, Swire Group, Hong Kong Jockey Club" />
            </div>
          </div>
        </div>
      </form>
    `;
  },

  openPerformanceForm(performance = null) {
    this.currentPerformance = performance;
    this.showtimes = performance?.showtimes || [];

    const modalTitle = performance ? "Edit Performance" : "Add Performance";
    const modalSubtitle = performance
      ? `Update details for ${performance.title}`
      : "Create a new orchestral performance";

    $("#performanceModal .bg-indigo-600 h2").text(modalTitle);
    $("#performanceModal .bg-indigo-600 p").text(modalSubtitle);

    if (performance) {
      this.populateForm(performance);
    } else {
      $("#performanceForm")[0].reset();
      this.showtimes = [];
      $("#showtimesContainer").empty();
    }

    initImageUpload("performanceImageInput", "performanceImagePreview", {
      shape: "rounded-lg",
      previewSize: "32",
    });

    this.renderShowtimes();

    $("#groupDiscountType").on("change", (e) => this.updateDiscountLabel(e));

    $("#addShowtimeBtn")
      .off("click")
      .on("click", () => this.addShowtime());
    $("#performanceForm")
      .off("submit")
      .on("submit", (e) => this.handleSubmit(e));

    openModal("performanceModal");
  },

  updateDiscountLabel(e) {
    const type = $(e.target).val();
    const label = $("#groupDiscountLabel");
    const input = $("#groupDiscount");

    if (type === "percentage") {
      label.text("Discount (%)");
      input.attr("max", "100");
      input.attr("placeholder", "10");
    } else {
      label.text("Discount Amount ($)");
      input.removeAttr("max");
      input.attr("placeholder", "50");
    }
  },

  populateForm(perf) {
    $("#title").val(perf.title);
    $("#composer").val(perf.composer);
    $("#conductor").val(perf.conductor);
    $("#orchestra").val(perf.orchestra);
    $("#description").val(perf.description);
    $("#presenter").val(perf.performanceInfo?.presenter || "");
    $("#ageLimit").val(perf.performanceInfo?.ageLimit || "");
    $("#duration").val(perf.ticketingInfo?.duration || "");
    $("#website").val(perf.performanceInfo?.website || "");
    $("#status").val(perf.ticketingInfo?.status || "upcoming");

    if (perf.ticketingInfo?.ticketSaleStart) {
      const saleStart = dayjs(perf.ticketingInfo.ticketSaleStart).format(
        "YYYY-MM-DDTHH:mm"
      );
      $("#ticketSaleStart").val(saleStart);
    }

    if (perf.ticketingInfo?.preOrderStartDate) {
      $("#preOrderStartDate").val(perf.ticketingInfo.preOrderStartDate);
    }

    if (perf.ticketingInfo?.earlyBirdEndDate) {
      $("#earlyBirdEndDate").val(perf.ticketingInfo.earlyBirdEndDate);
    }

    $("#interval").val(perf.ticketingInfo?.interval || "");
    $("#eTicketAvailable").prop(
      "checked",
      perf.ticketingInfo?.eTicketArrangement?.available || false
    );
    $("#additionalInfo").val(perf.ticketingInfo?.additionalInfo || "");

    if (perf.performanceInfo?.eventCategory) {
      perf.performanceInfo.eventCategory.forEach((cat) => {
        $(`.event-category[value="${cat}"]`).prop("checked", true);
      });
    }

    if (perf.performanceInfo?.modeOfTickets) {
      perf.performanceInfo.modeOfTickets.forEach((mode) => {
        $(`.ticket-mode[value="${mode}"]`).prop("checked", true);
      });
    }

    if (perf.ticketingInfo?.groupBookingDiscount) {
      const discount = perf.ticketingInfo.groupBookingDiscount;
      $("#groupMinTickets").val(discount.minimumTickets || "");
      $("#groupDiscountType").val(discount.discountType || "percentage");

      if (discount.discountType === "amount") {
        $("#groupDiscount").val(discount.discountAmount || "");
        $("#groupDiscountLabel").text("Discount Amount ($)");
        $("#groupDiscount").removeAttr("max").attr("placeholder", "50");
      } else {
        $("#groupDiscount").val(discount.discountPercentage || "");
        $("#groupDiscountLabel").text("Discount (%)");
        $("#groupDiscount").attr("max", "100").attr("placeholder", "10");
      }

      $("#groupNote").val(discount.note || "");
    }

    this.showtimes = perf.showtimes || [];
  },

  addShowtime() {
    const newShowtime = showtimeManager.createEmptyShowtime(this.ticketTypes);
    this.showtimes.push(newShowtime);
    this.renderShowtimes();
  },

  removeShowtime(index) {
    this.showtimes.splice(index, 1);
    this.renderShowtimes();
  },

  addPricingSection(showtimeIndex) {
    if (!this.showtimes[showtimeIndex]) return;

    const existingSections =
      this.showtimes[showtimeIndex].pricing?.sections || [];
    const sectionNumber = existingSections.length + 1;

    if (!this.showtimes[showtimeIndex].pricing) {
      this.showtimes[showtimeIndex].pricing = { sections: [] };
    }

    const newSection = showtimeManager.createPricingSection(
      sectionNumber,
      this.ticketTypes
    );

    this.showtimes[showtimeIndex].pricing.sections.push(newSection);
    this.renderShowtimes();
  },

  removePricingSection(showtimeIndex, sectionIndex) {
    if (!this.showtimes[showtimeIndex]?.pricing?.sections) return;

    this.showtimes[showtimeIndex].pricing.sections.splice(sectionIndex, 1);
    this.renderShowtimes();
  },

  async addCustomTier(showtimeIndex, sectionIndex) {
    const { value: customTier } = await Swal.fire({
      title:
        '<i class="fas fa-layer-group text-purple-600 mr-2"></i>Add Custom Tier',
      html: `
        <div class="text-left space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Custom Tier Name</label>
            <input id="custom-tier-name" type="text"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
              placeholder="e.g., Gold, Silver, Box Seats, Gallery">
            <p class="text-xs text-gray-500 mt-2">
              <i class="fas fa-info-circle mr-1"></i>
              Enter a custom tier name for this seating section
            </p>
          </div>
          <div class="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <p class="text-xs text-purple-900">
              <strong>Examples:</strong> Gold Circle, Silver Circle, Box Seats, Gallery, Dress Circle, Upper Circle, Stalls
            </p>
          </div>
        </div>
      `,
      width: "500px",
      showCancelButton: true,
      confirmButtonText: "Add Tier",
      cancelButtonText: "Cancel",
      confirmButtonColor: SwalColors.primary,
      preConfirm: () => {
        const name = $("#custom-tier-name").val().trim();
        if (!name) {
          Swal.showValidationMessage("Please enter a tier name");
          return false;
        }
        if (name.length > 30) {
          Swal.showValidationMessage("Tier name must be 30 characters or less");
          return false;
        }
        return name;
      },
    });

    if (
      customTier &&
      this.showtimes[showtimeIndex]?.pricing?.sections[sectionIndex]
    ) {
      this.showtimes[showtimeIndex].pricing.sections[sectionIndex].tier =
        customTier;
      this.renderShowtimes();
      notify.success(`Custom tier "${customTier}" added successfully`);
    }
  },

  parseRowsInput(input) {
    if (!input || typeof input !== "string") return [];

    const rows = [];
    const parts = input.split(",").map((p) => p.trim().toUpperCase());

    for (const part of parts) {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map((s) => s.trim());
        if (start && end && start.length === 1 && end.length === 1) {
          const startCode = start.charCodeAt(0);
          const endCode = end.charCodeAt(0);
          if (startCode <= endCode) {
            for (let code = startCode; code <= endCode; code++) {
              rows.push(String.fromCharCode(code));
            }
          }
        }
      } else if (part.length > 0) {
        rows.push(part);
      }
    }

    return [...new Set(rows)];
  },

  async addCustomTicketType(showtimeIndex) {
    const result = await Swal.fire({
      title:
        '<i class="fas fa-ticket-alt text-green-600 mr-2"></i>Add Custom Ticket Type',
      html: `
        <div class="text-left space-y-4 text-gray-900">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Ticket Type Name</label>
            <input type="text" id="customTicketTypeName" class="swal2-input w-full" placeholder="e.g., Military, Group, Family Pass">
          </div>

          <div class="border-t pt-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-tag mr-1"></i>Default Pricing (Optional)
            </label>
            <div class="space-y-3">
              <div class="flex gap-2">
                <select id="pricingType" class="swal2-select w-1/2">
                  <option value="none">No Default</option>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
                <input type="number" id="pricingValue" class="swal2-input w-1/2" placeholder="Value" disabled min="0" step="0.01">
              </div>
              <div class="flex gap-2">
                <label class="flex items-center">
                  <input type="radio" name="pricingModifier" value="discount" checked class="mr-2">
                  <span class="text-sm text-gray-900">Discount</span>
                </label>
                <label class="flex items-center">
                  <input type="radio" name="pricingModifier" value="markup" class="mr-2">
                  <span class="text-sm text-gray-900">Markup</span>
                </label>
              </div>
              <div id="pricingPreview" class="text-xs text-gray-600 bg-gray-50 p-2 rounded hidden"></div>
            </div>
          </div>

          <div class="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
            <i class="fas fa-info-circle mr-2"></i>
            This ticket type will be saved and available for all future performances. Default pricing will auto-calculate prices based on the first ticket type in each section.
          </div>
        </div>
      `,
      width: "600px",
      showCancelButton: true,
      confirmButtonText: "Add Ticket Type",
      didOpen: () => {
        const $pricingType = $("#pricingType");
        const $pricingValue = $("#pricingValue");
        const $pricingPreview = $("#pricingPreview");

        $pricingType.on("change", (e) => {
          if ($(e.target).val() === "none") {
            $pricingValue.prop("disabled", true).val("");
            $pricingPreview.addClass("hidden");
          } else {
            $pricingValue.prop("disabled", false);
            $pricingPreview.removeClass("hidden");
            updatePreview();
          }
        });

        $pricingValue.on("input", updatePreview);
        $('input[name="pricingModifier"]').on("change", updatePreview);

        function updatePreview() {
          const type = $pricingType.val();
          const value = parseFloat($pricingValue.val()) || 0;
          const modifier = $('input[name="pricingModifier"]:checked').val();

          if (type === "none" || !value) {
            $pricingPreview.addClass("hidden");
            return;
          }

          let example = "";
          if (type === "percentage") {
            if (modifier === "discount") {
              const discounted = 100 - value;
              example = `Example: $100 standard ticket → $${discounted.toFixed(
                2
              )} (${value}% off)`;
            } else {
              const marked = 100 + value;
              example = `Example: $100 standard ticket → $${marked.toFixed(
                2
              )} (+${value}%)`;
            }
          } else if (type === "fixed") {
            if (modifier === "discount") {
              const discounted = 100 - value;
              example = `Example: $100 standard ticket → $${discounted.toFixed(
                2
              )} (-$${value})`;
            } else {
              const marked = 100 + value;
              example = `Example: $100 standard ticket → $${marked.toFixed(
                2
              )} (+$${value})`;
            }
          }

          $pricingPreview.text(example).removeClass("hidden");
        }
      },
      preConfirm: () => {
        const name = $("#customTicketTypeName").val().trim();
        if (!name) {
          Swal.showValidationMessage("Please enter a ticket type name");
          return false;
        }

        const exists = this.ticketTypes.some(
          (t) => t.name.toLowerCase() === name.toLowerCase()
        );

        if (exists) {
          Swal.showValidationMessage("This ticket type already exists");
          return false;
        }

        const pricingType = $("#pricingType").val();
        const pricingValue = parseFloat($("#pricingValue").val()) || 0;
        const pricingModifier = $(
          'input[name="pricingModifier"]:checked'
        ).val();

        if (pricingType !== "none" && pricingValue <= 0) {
          Swal.showValidationMessage("Please enter a valid pricing value");
          return false;
        }

        return {
          name,
          pricing:
            pricingType !== "none"
              ? {
                  type: pricingType,
                  value: pricingValue,
                  modifier: pricingModifier,
                }
              : null,
        };
      },
    });

    if (result.isConfirmed) {
      try {
        const newType = await ticketTypeService.create(result.value);
        this.ticketTypes = await ticketTypeService.getAll();

        this.showtimes = showtimeManager.addTicketTypeToShowtimes(
          this.showtimes,
          newType
        );

        this.renderShowtimes();

        const pricingMsg = newType.pricing
          ? ` with ${
              newType.pricing.modifier === "discount" ? "discount" : "markup"
            } auto-calculated`
          : "";
        notify.success(
          `Ticket type "${newType.name}" added successfully${pricingMsg}!`
        );
      } catch (error) {
        console.error("Error adding ticket type:", error);
        notify.error("Failed to add ticket type");
      }
    }
  },

  renderShowtimes() {
    const container = $("#showtimesContainer");
    container.empty();

    if (this.showtimes.length === 0) {
      container.html(`
        <div class="text-center py-8 text-gray-500">
          <i class="fas fa-calendar-times text-4xl mb-2"></i>
          <p>No showtimes added yet. Click "Add Showtime" to create one.</p>
        </div>
      `);
      return;
    }

    this.showtimes.forEach((showtime, index) => {
      const showtimeHTML = `
        <div class="bg-white p-4 rounded-lg border-2 border-indigo-200" data-showtime-index="${index}">
          <div class="flex justify-between items-center mb-4">
            <h4 class="font-semibold text-gray-900">Showtime ${index + 1}</h4>
            <button type="button" class="remove-showtime text-red-600 hover:text-red-800" data-index="${index}">
              <i class="fas fa-trash"></i> Remove
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-xs text-gray-600 mb-1">Date & Time</label>
              <input type="datetime-local" class="showtime-datetime w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-indigo-500"
                value="${
                  showtime.dateTime
                    ? dayjs(showtime.dateTime).format("YYYY-MM-DDTHH:mm")
                    : ""
                }" />
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">Venue</label>
              <select class="showtime-venue w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="">Select venue</option>
                ${this.venues
                  .map(
                    (v) =>
                      `<option value="${v.id}" ${
                        showtime.venueId == v.id ? "selected" : ""
                      }>${v.name}</option>`
                  )
                  .join("")}
              </select>
            </div>
          </div>

          <div class="mb-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <div class="flex justify-between items-start mb-3">
              <div>
                <h5 class="text-sm font-semibold text-gray-900 mb-1">Seat Layout Preview</h5>
                <p class="text-xs text-gray-600">Visual representation of the seating arrangement</p>
              </div>
              <div class="flex gap-2 flex-wrap">
                <button type="button" class="auto-populate-btn text-xs px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700" data-showtime="${index}" title="Auto-populate from venue">
                  <i class="fas fa-magic mr-1"></i>Auto-fill
                </button>
                <button type="button" class="load-template-btn text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700" data-showtime="${index}" title="Load from template">
                  <i class="fas fa-folder-open mr-1"></i>Load
                </button>
                <button type="button" class="save-template-btn text-xs px-3 py-1 bg-teal-600 text-white rounded hover:bg-teal-700" data-showtime="${index}" title="Save as template">
                  <i class="fas fa-save mr-1"></i>Save
                </button>
                <button type="button" class="manage-zones-btn text-xs px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700" data-showtime="${index}" title="Manage pricing zones">
                  <i class="fas fa-layer-group mr-1"></i>Zones
                </button>
                <button type="button" class="edit-seats-btn text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700" data-showtime="${index}">
                  <i class="fas fa-edit mr-1"></i>Edit Seats
                </button>
                <button type="button" class="customize-layout-btn text-xs px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700" data-showtime="${index}">
                  <i class="fas fa-cog mr-1"></i>Layout
                </button>
              </div>
            </div>
            <div id="seatPlan_${index}" class="flex justify-center">
              ${this.renderSeatPlanSVG(showtime, index)}
            </div>
          </div>

          <div class="border-t pt-4">
            ${this.renderPricingSections(showtime, index)}
          </div>
        </div>
      `;
      container.append(showtimeHTML);
    });

    $(".remove-showtime").on("click", (e) => {
      const index = $(e.currentTarget).data("index");
      this.removeShowtime(index);
    });

    $(".showtime-datetime").on("change", (e) => {
      const index = $(e.currentTarget)
        .closest("[data-showtime-index]")
        .data("showtime-index");
      this.showtimes[index].dateTime = $(e.currentTarget).val();
    });

    $(".showtime-venue").on("change", (e) => {
      const index = $(e.currentTarget)
        .closest("[data-showtime-index]")
        .data("showtime-index");
      const venueId = parseInt($(e.currentTarget).val());
      const venue = this.venues.find((v) => v.id === venueId);
      this.showtimes[index].venueId = venueId;
      this.showtimes[index].venueName = venue?.name || "";

      delete this.showtimes[index].seatLayout;
      $(`#seatPlan_${index}`).html(
        this.renderSeatPlanSVG(this.showtimes[index], index)
      );
    });

    $(".add-custom-ticket-type-btn").on("click", (e) => {
      const showtimeIndex = $(e.currentTarget).data("showtime");
      this.addCustomTicketType(showtimeIndex);
    });

    $(".add-section-btn").on("click", (e) => {
      const showtimeIndex = $(e.currentTarget).data("showtime");
      this.addPricingSection(showtimeIndex);
    });

    $(".remove-section-btn").on("click", (e) => {
      const showtimeIndex = $(e.currentTarget).data("showtime");
      const sectionIndex = $(e.currentTarget).data("section");
      this.removePricingSection(showtimeIndex, sectionIndex);
    });

    $(".section-name").on("input", (e) => {
      const showtimeIndex = $(e.currentTarget).data("showtime");
      const sectionIndex = $(e.currentTarget).data("section");
      if (this.showtimes[showtimeIndex]?.pricing?.sections[sectionIndex]) {
        this.showtimes[showtimeIndex].pricing.sections[sectionIndex].section =
          $(e.currentTarget).val();
      }
    });

    $(".section-code").on("input", (e) => {
      const showtimeIndex = $(e.currentTarget).data("showtime");
      const sectionIndex = $(e.currentTarget).data("section");
      if (this.showtimes[showtimeIndex]?.pricing?.sections[sectionIndex]) {
        this.showtimes[showtimeIndex].pricing.sections[
          sectionIndex
        ].sectionCode = $(e.currentTarget).val().toUpperCase();
      }
    });

    $(".section-tier").on("change", (e) => {
      const showtimeIndex = $(e.currentTarget).data("showtime");
      const sectionIndex = $(e.currentTarget).data("section");
      if (this.showtimes[showtimeIndex]?.pricing?.sections[sectionIndex]) {
        this.showtimes[showtimeIndex].pricing.sections[sectionIndex].tier = $(
          e.currentTarget
        ).val();
      }
    });

    $(".add-custom-tier-btn").on("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const showtimeIndex = $(e.currentTarget).data("showtime");
      const sectionIndex = $(e.currentTarget).data("section");
      await this.addCustomTier(showtimeIndex, sectionIndex);
    });

    $(".section-rows").on("input", (e) => {
      const showtimeIndex = $(e.currentTarget).data("showtime");
      const sectionIndex = $(e.currentTarget).data("section");
      if (this.showtimes[showtimeIndex]?.pricing?.sections[sectionIndex]) {
        const rowsInput = $(e.currentTarget).val();
        this.showtimes[showtimeIndex].pricing.sections[sectionIndex].rows =
          this.parseRowsInput(rowsInput);
      }
    });

    $(".section-base-price").on("input", (e) => {
      const showtimeIndex = $(e.currentTarget).data("showtime");
      const sectionIndex = $(e.currentTarget).data("section");
      if (this.showtimes[showtimeIndex]?.pricing?.sections[sectionIndex]) {
        this.showtimes[showtimeIndex].pricing.sections[sectionIndex].basePrice =
          parseFloat($(e.currentTarget).val()) || 0;
      }
    });

    $(".customize-layout-btn").on("click", (e) => {
      const showtimeIndex = $(e.currentTarget).data("showtime");
      this.customizeSeatLayout(showtimeIndex);
    });

    $(".edit-seats-btn").on("click", (e) => {
      const showtimeIndex = $(e.currentTarget).data("showtime");
      this.editSeats(showtimeIndex);
    });

    $(".auto-populate-btn").on("click", (e) => {
      const showtimeIndex = $(e.currentTarget).data("showtime");
      this.autoPopulateFromVenue(showtimeIndex);
    });

    $(".load-template-btn").on("click", (e) => {
      const showtimeIndex = $(e.currentTarget).data("showtime");
      this.loadSeatTemplate(showtimeIndex);
    });

    $(".save-template-btn").on("click", (e) => {
      const showtimeIndex = $(e.currentTarget).data("showtime");
      this.saveSeatTemplate(showtimeIndex);
    });

    $(".manage-zones-btn").on("click", (e) => {
      const showtimeIndex = $(e.currentTarget).data("showtime");
      this.manageZones(showtimeIndex);
    });
  },

  async customizeSeatLayout(showtimeIndex) {
    const showtime = this.showtimes[showtimeIndex];
    const currentLayout = showtime.seatLayout || DEFAULT_SEAT_LAYOUT;

    const result = await Swal.fire({
      title:
        '<i class="fas fa-chair text-indigo-600 mr-2"></i>Customize Seat Layout',
      html: SeatLayoutCustomizer.createDialog(currentLayout),
      width: "700px",
      showCancelButton: true,
      confirmButtonColor: SwalColors.primary,
      cancelButtonColor: SwalColors.cancel,
      confirmButtonText: '<i class="fas fa-check mr-1"></i>Apply Layout',
      cancelButtonText: '<i class="fas fa-times mr-1"></i>Cancel',
      didOpen: () => {
        SeatLayoutCustomizer.setupEventHandlers();
      },
      preConfirm: () => {
        const validation = SeatLayoutCustomizer.validateAndGetValues();
        if (!validation.valid) {
          Swal.showValidationMessage(validation.message);
          return false;
        }
        return validation.data;
      },
    });

    if (result.isConfirmed) {
      this.showtimes[showtimeIndex].seatLayout = result.value;
      $(`#seatPlan_${showtimeIndex}`).html(
        this.renderSeatPlanSVG(this.showtimes[showtimeIndex], showtimeIndex)
      );
      notify.success(
        `Seat layout updated! ${result.value.rows} rows × ${
          result.value.seatsPerRow
        } seats = ${result.value.rows * result.value.seatsPerRow} total seats`
      );
    }
  },

  async editSeats(showtimeIndex) {
    const showtime = this.showtimes[showtimeIndex];
    const layout = showtime.seatLayout || DEFAULT_SEAT_LAYOUT;

    if (!showtime.seatDetails) {
      showtime.seatDetails = this.initializeSeatDetails(
        layout.rows,
        layout.seatsPerRow
      );
    }

    const sections = showtime.pricing?.sections || [];
    let selectedSeats = [];

    const result = await Swal.fire({
      title: '<i class="fas fa-chair text-green-600 mr-2"></i>Edit Seats',
      html: `
        <div class="text-left p-4 text-gray-900">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div class="flex items-center justify-between mb-2">
              <div class="text-sm font-semibold text-gray-800">
                <i class="fas fa-info-circle text-blue-600 mr-1"></i>Selection Mode
              </div>
              <div class="flex gap-2">
                <button type="button" id="select-all-btn" class="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">
                  <i class="fas fa-check-double mr-1"></i>Select All
                </button>
                <button type="button" id="clear-selection-btn" class="px-2 py-1 text-xs bg-gray-400 text-white rounded hover:bg-gray-500">
                  <i class="fas fa-times mr-1"></i>Clear
                </button>
              </div>
            </div>
            <p class="text-xs text-gray-600">Click seats to select. Selected: <span id="selected-count" class="font-bold text-blue-600">0</span></p>
          </div>

          <div class="bg-gray-50 rounded-lg p-4 mb-4 overflow-auto" style="max-height: 400px;">
            <div id="interactive-seat-map" class="flex justify-center">
            </div>
          </div>

          <div class="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 class="text-sm font-semibold text-gray-800 mb-3">
              <i class="fas fa-paint-brush text-indigo-600 mr-1"></i>Modify Selected Seats
            </h4>

            <div class="grid grid-cols-2 gap-4">
              <div class="col-span-2">
                <label class="block text-xs font-medium text-gray-700 mb-1">Seat Type</label>
                <select id="seat-type" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg">
                  <option value="">- No Change -</option>
                  <optgroup label="System Status">
                    <option value="available">Available</option>
                    <option value="blocked">Blocked</option>
                    <option value="reserved">Reserved</option>
                  </optgroup>
                  ${
                    sections.length > 0
                      ? `
                  <optgroup label="Pricing Sections">
                    ${sections
                      .map(
                        (s, idx) =>
                          `<option value="section-${idx}" data-section-index="${idx}">${s.section} (${s.sectionCode})</option>`
                      )
                      .join("")}
                  </optgroup>
                  `
                      : ""
                  }
                </select>
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">
                  <i class="fas fa-wheelchair mr-1"></i>Accessibility Category
                </label>
                <select id="seat-category" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg">
                  <option value="">- No Change -</option>
                  <option value="wheelchair">Wheelchair Accessible</option>
                  <option value="assisted-listening">Assisted Listening</option>
                  <option value="restricted-view">Restricted View</option>
                  <option value="extra-legroom">Extra Legroom</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">
                  <i class="fas fa-user-friends mr-1"></i>Companion Seat
                </label>
                <input type="text" id="seat-companion" placeholder="e.g., A2" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg">
              </div>
            </div>

            <div class="mt-3">
              <label class="block text-xs font-medium text-gray-700 mb-1">
                <i class="fas fa-sticky-note mr-1"></i>Notes
              </label>
              <textarea id="seat-notes" rows="2" placeholder="Add any special notes for these seats..." class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"></textarea>
            </div>

            <button type="button" id="apply-changes-btn" class="w-full mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <i class="fas fa-check mr-2"></i>Apply to Selected Seats
            </button>
          </div>

          ${SeatMap.createLegend(sections, true)}
        </div>
      `,
      width: "800px",
      showCancelButton: true,
      confirmButtonColor: SwalColors.success,
      cancelButtonColor: SwalColors.cancel,
      confirmButtonText: '<i class="fas fa-save mr-1"></i>Save Changes',
      cancelButtonText: '<i class="fas fa-times mr-1"></i>Cancel',
      didOpen: () => {
        const renderInteractiveMap = () => {
          const mapHTML = this.generateInteractiveSeatMap(
            layout.rows,
            layout.seatsPerRow,
            showtime.seatDetails,
            selectedSeats
          );
          $("#interactive-seat-map").html(mapHTML);

          setTimeout(() => {
            attachSeatTooltipListeners("#interactive-seat-map svg");
          }, 100);

          $(".interactive-seat").on("click", function (e) {
            e.stopPropagation();
            const $seatElement = $(e.target).closest(".interactive-seat");
            if (!$seatElement.length) return;

            const seatId = $seatElement.data("seat-id");
            const index = selectedSeats.indexOf(seatId);

            if (index > -1) {
              selectedSeats.splice(index, 1);
            } else {
              selectedSeats.push(seatId);
            }

            $("#selected-count").text(selectedSeats.length);
            renderInteractiveMap();
          });
        };

        renderInteractiveMap();

        $("#select-all-btn").on("click", () => {
          selectedSeats = [];
          for (let row = 0; row < layout.rows; row++) {
            for (let seat = 0; seat < layout.seatsPerRow; seat++) {
              const rowLetter = String.fromCharCode(65 + row);
              const seatNumber = seat + 1;
              selectedSeats.push(`${rowLetter}${seatNumber}`);
            }
          }
          $("#selected-count").text(selectedSeats.length);
          renderInteractiveMap();
        });

        $("#clear-selection-btn").on("click", () => {
          selectedSeats = [];
          $("#selected-count").text(0);
          renderInteractiveMap();
        });

        $("#apply-changes-btn").on("click", () => {
          if (selectedSeats.length === 0) {
            notify.warning("Please select at least one seat");
            return;
          }

          const $typeSelectEl = $("#seat-type");
          const seatType = $typeSelectEl.val();
          const category = $("#seat-category").val();
          const companion = $("#seat-companion").val().trim();
          const notes = $("#seat-notes").val().trim();

          if (!seatType && !category && !companion && !notes) {
            notify.warning("Please make at least one change to apply");
            return;
          }

          selectedSeats.forEach((seatId) => {
            if (!showtime.seatDetails[seatId]) {
              showtime.seatDetails[seatId] = {};
            }

            if (seatType) {
              const $selectedOption = $typeSelectEl.find("option:selected");
              const sectionIndex = $selectedOption.data("section-index");

              if (sectionIndex !== "" && sectionIndex !== undefined) {
                showtime.seatDetails[seatId].status = "assigned";
                showtime.seatDetails[seatId].sectionIndex =
                  parseInt(sectionIndex);
                delete showtime.seatDetails[seatId].section;
              } else {
                showtime.seatDetails[seatId].status = seatType;
                delete showtime.seatDetails[seatId].sectionIndex;
                delete showtime.seatDetails[seatId].section;
              }
            }

            if (category) {
              showtime.seatDetails[seatId].category = category;
            }
            if (companion) {
              showtime.seatDetails[seatId].companion = companion.toUpperCase();
            }
            if (notes) {
              showtime.seatDetails[seatId].notes = notes;
            }
          });

          notify.success(`Applied changes to ${selectedSeats.length} seat(s)`);
          selectedSeats = [];
          $("#selected-count").text(0);
          $("#seat-type").val("");
          $("#seat-category").val("");
          $("#seat-companion").val("");
          $("#seat-notes").val("");
          renderInteractiveMap();
        });
      },
      preConfirm: () => {
        return { seatDetails: showtime.seatDetails };
      },
    });

    if (result.isConfirmed) {
      this.showtimes[showtimeIndex].seatDetails = result.value.seatDetails;
      $(`#seatPlan_${showtimeIndex}`).html(
        this.renderSeatPlanSVG(this.showtimes[showtimeIndex], showtimeIndex)
      );
      notify.success("Seat configuration saved successfully!");
    }
  },

  initializeSeatDetails(rows, seatsPerRow) {
    return SeatMap.initializeSeatDetails(rows, seatsPerRow);
  },

  getSeatColorForShowtime(seatDetail, showtime) {
    if (seatDetail.sectionIndex !== undefined) {
      return getSectionColor(seatDetail.sectionIndex);
    }

    return getSeatStatusColor(seatDetail.status);
  },

  generateInteractiveSeatMap(rows, seats, seatDetails, selectedSeats) {
    return SeatMap.generateInteractive(
      rows,
      seats,
      seatDetails,
      selectedSeats,
      (seatDetail) => this.getSeatColorForShowtime(seatDetail)
    );
  },

  generatePreviewSVG(rows, seats) {
    return SeatMap.generateSimplePreview(rows, seats);
  },

  renderSeatPlanSVG(showtime, showtimeIndex) {
    const layout = this.getSeatLayout(showtime);
    const sections = showtime.pricing?.sections || [];
    let seatDetails = { ...(showtime.seatDetails || {}) };

    const bookings = storage.getItem("bookings", []);
    const showtimeBookings = bookings.filter(
      (b) => b.showtimeId === showtime.id && b.status !== "cancelled"
    );

    showtimeBookings.forEach((booking) => {
      if (booking.seats && Array.isArray(booking.seats)) {
        booking.seats.forEach((seat) => {
          const seatId =
            typeof seat === "string"
              ? seat
              : seat.fullId || seat.seatId || seat;
          if (seatId) {
            if (!seatDetails[seatId]) {
              seatDetails[seatId] = {};
            }
            seatDetails[seatId].status = "reserved";
            seatDetails[seatId].bookingId = booking.id;
            seatDetails[seatId].customerName =
              booking.customerInfo?.name || booking.userName;
          }
        });
      }
    });

    return SeatMap.createSeatPlanWithStats(
      layout.rows,
      layout.seatsPerRow,
      seatDetails,
      sections
    );
  },

  renderPricingSections(showtime, showtimeIndex) {
    const sections = showtime.pricing?.sections || [];

    let html = `
      <div class="flex justify-between items-center mb-4">
        <div>
          <h5 class="text-sm font-semibold text-gray-900">Pricing by Section</h5>
          <p class="text-xs text-gray-500 mt-0.5">Define pricing tiers for different seating areas</p>
        </div>
        <div class="flex gap-2">
          <button type="button" class="add-custom-ticket-type-btn text-sm px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors" data-showtime="${showtimeIndex}">
            <i class="fas fa-ticket-alt mr-1"></i>New Ticket Type
          </button>
          <button type="button" class="add-section-btn text-sm px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm" data-showtime="${showtimeIndex}">
            <i class="fas fa-plus mr-1"></i>Add Section
          </button>
        </div>
      </div>
    `;

    if (sections.length === 0) {
      html += `
        <div class="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-dashed border-indigo-300 rounded-lg p-8 text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <i class="fas fa-th-large text-3xl text-indigo-600"></i>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">No Pricing Sections Yet</h3>
          <p class="text-sm text-gray-600 mb-4 max-w-md mx-auto">
            Create pricing sections to organize your seats by area (e.g., Orchestra, Balcony, VIP) with different price points.
          </p>
          <button type="button" class="add-section-btn inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md" data-showtime="${showtimeIndex}">
            <i class="fas fa-plus mr-2"></i>Create First Section
          </button>
        </div>
      `;
      return html;
    }

    html += sections
      .map((section, sectionIndex) => {
        const sectionColor = getSectionColor(sectionIndex);
        return `
      <div class="mb-4 p-4 bg-white rounded-lg border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex justify-between items-center mb-4">
          <div class="flex gap-3 flex-1 items-center">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm" style="background-color: ${sectionColor};">
              ${section.sectionCode || sectionIndex + 1}
            </div>
            <div class="flex gap-2 flex-1">
              <div class="flex-1">
                <label class="block text-xs text-gray-500 mb-1">Section Name</label>
                <input type="text"
                  class="section-name w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  data-showtime="${showtimeIndex}"
                  data-section="${sectionIndex}"
                  value="${section.section}"
                  placeholder="e.g., Orchestra, Balcony, VIP" />
              </div>
              <div class="w-24">
                <label class="block text-xs text-gray-500 mb-1">Code</label>
                <input type="text"
                  class="section-code w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-center font-mono uppercase focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  data-showtime="${showtimeIndex}"
                  data-section="${sectionIndex}"
                  value="${section.sectionCode}"
                  placeholder="A"
                  maxlength="2" />
              </div>
            </div>
          </div>
          <button type="button" class="remove-section-btn ml-3 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" data-showtime="${showtimeIndex}" data-section="${sectionIndex}" title="Remove section">
            <i class="fas fa-trash"></i>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
              <span>
                <i class="fas fa-layer-group mr-1"></i>Zone Tier
              </span>
              <button type="button" class="add-custom-tier-btn text-xs px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded hover:bg-purple-100 transition-colors"
                data-showtime="${showtimeIndex}"
                data-section="${sectionIndex}"
                title="Add custom tier">
                <i class="fas fa-plus mr-1"></i>Custom
              </button>
            </label>
            <div class="relative">
              <select class="section-tier w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
                data-showtime="${showtimeIndex}"
                data-section="${sectionIndex}">
                <option value="vip" ${
                  section.tier === "vip" ? "selected" : ""
                }>VIP</option>
                <option value="premium" ${
                  section.tier === "premium" ? "selected" : ""
                }>Premium</option>
                <option value="standard" ${
                  section.tier === "standard" ? "selected" : ""
                }>Standard</option>
                <option value="economy" ${
                  section.tier === "economy" ? "selected" : ""
                }>Economy</option>
                ${
                  section.tier &&
                  !["vip", "premium", "standard", "economy"].includes(
                    section.tier.toLowerCase()
                  )
                    ? `<option value="${section.tier}" selected>${section.tier}</option>`
                    : ""
                }
              </select>
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">
              <i class="fas fa-chair mr-1"></i>Seat Rows
            </label>
            <input type="text"
              class="section-rows w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
              data-showtime="${showtimeIndex}"
              data-section="${sectionIndex}"
              value="${
                Array.isArray(section.rows)
                  ? section.rows.join(",")
                  : section.rows || ""
              }"
              placeholder="e.g., A,B,C,D or A-D" />
            <p class="text-xs text-gray-500 mt-1">Comma-separated: A,B,C or range: A-D</p>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">
              <i class="fas fa-dollar-sign mr-1"></i>Base Price (HKD)
            </label>
            <input type="number"
              class="section-base-price w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
              data-showtime="${showtimeIndex}"
              data-section="${sectionIndex}"
              value="${section.basePrice || ""}"
              placeholder="e.g., 600"
              min="0"
              step="10" />
            <p class="text-xs text-gray-500 mt-1">Standard ticket price before discounts</p>
          </div>
        </div>
        <div class="bg-gray-50 rounded-lg p-3">
          ${
            sectionIndex === 0 &&
            this.ticketTypes.some(
              (t) => t.id && SYSTEM_TICKET_TYPE_IDS.includes(t.id)
            )
              ? `
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-2.5 mb-3 flex items-start gap-2">
              <i class="fas fa-info-circle text-blue-600 mt-0.5 text-sm"></i>
              <div class="flex-1">
                <p class="text-[11px] leading-relaxed text-blue-900">
                  <strong>Default ticket types are active.</strong> Customize in <a href="/admin/settings" data-link class="underline font-semibold hover:text-blue-700">Settings</a>
                  or click <strong>"New Ticket Type"</strong> to add custom types like Military, Group, or Family Pass.
                </p>
              </div>
            </div>
          `
              : ""
          }
          <div class="text-xs font-semibold text-gray-600 mb-3 flex items-center justify-between">
            <div class="flex items-center">
              <i class="fas fa-dollar-sign text-green-600 mr-1"></i>
              Pricing (${this.ticketTypes.length} ticket types)
            </div>
            <a href="/admin/settings" data-link class="text-indigo-600 hover:text-indigo-800 text-xs font-normal flex items-center gap-1">
              <i class="fas fa-cog"></i>
              Manage Types
            </a>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            ${this.ticketTypes
              .map(
                (type) => `
              <div class="bg-white rounded-lg p-2 border border-gray-200 hover:border-indigo-300 transition-colors">
                <label class="block text-xs font-medium text-gray-700 mb-1 truncate" title="${
                  type.name
                }">
                  ${type.name}
                  ${
                    !SYSTEM_TICKET_TYPE_IDS.includes(type.id)
                      ? '<i class="fas fa-star text-yellow-500 text-[8px] ml-1" title="Custom type"></i>'
                      : ""
                  }
                </label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input type="number"
                    class="section-price w-full pl-7 pr-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    data-showtime="${showtimeIndex}"
                    data-section="${sectionIndex}"
                    data-ticket-type="${type.name}"
                    value="${section.prices?.[type.name] || ""}"
                    placeholder="0.00"
                    min="0"
                    step="0.01" />
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      </div>
    `;
      })
      .join("");

    return html;
  },

  async handleSubmit(e) {
    e.preventDefault();

    const eventCategories = [];
    $(".event-category:checked").each(function () {
      eventCategories.push($(this).val());
    });

    const ticketModes = [];
    $(".ticket-mode:checked").each(function () {
      ticketModes.push($(this).val());
    });

    $(".section-price").each(
      function () {
        const showtimeIndex = $(this).data("showtime");
        const sectionIndex = $(this).data("section");
        const ticketType = $(this).data("ticket-type");
        const price = parseFloat($(this).val()) || 0;

        if (
          ticketType &&
          this.showtimes[showtimeIndex]?.pricing?.sections[sectionIndex]
        ) {
          if (
            !this.showtimes[showtimeIndex].pricing.sections[sectionIndex].prices
          ) {
            this.showtimes[showtimeIndex].pricing.sections[
              sectionIndex
            ].prices = {};
          }
          this.showtimes[showtimeIndex].pricing.sections[sectionIndex].prices[
            ticketType
          ] = price;
        }
      }.bind(this)
    );

    const imageUrl = await getImageDataURL("performanceImageInput");

    const discountType = $("#groupDiscountType").val();
    const discountValue = parseInt($("#groupDiscount").val()) || 0;
    const groupDiscount = {
      enabled: !!$("#groupMinTickets").val(),
      minimumTickets: parseInt($("#groupMinTickets").val()) || 0,
      discountType: discountType,
      note: $("#groupNote").val(),
    };

    if (discountType === "percentage") {
      groupDiscount.discountPercentage = discountValue;
    } else {
      groupDiscount.discountAmount = discountValue;
    }

    const performanceData = {
      id: this.currentPerformance?.id || Date.now(),
      title: $("#title").val(),
      composer: $("#composer").val(),
      conductor: $("#conductor").val(),
      orchestra: $("#orchestra").val(),
      description: $("#description").val(),
      imageUrl:
        imageUrl || this.currentPerformance?.imageUrl || DEFAULT_IMAGE_PATH,
      performanceInfo: {
        presenter: $("#presenter").val(),
        eventCategory: eventCategories,
        modeOfTickets: ticketModes,
        ageLimit: parseInt($("#ageLimit").val()) || 0,
        website: $("#website").val(),
      },
      ticketingInfo: {
        status: $("#status").val(),
        ticketSaleStart: $("#ticketSaleStart").val(),
        preOrderStartDate: $("#preOrderStartDate").val(),
        earlyBirdEndDate: $("#earlyBirdEndDate").val(),
        duration: $("#duration").val(),
        interval: $("#interval").val(),
        groupBookingDiscount: groupDiscount,
        eTicketArrangement: {
          available: $("#eTicketAvailable").is(":checked"),
        },
        additionalInfo: $("#additionalInfo").val(),
      },
      showtimes: this.showtimes,
      sponsors: $("#sponsors")
        .val()
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s),
    };

    try {
      if (this.currentPerformance) {
        await performanceAPI.update(
          this.currentPerformance.id,
          performanceData
        );
        notify.success("Performance updated successfully!");
      } else {
        await performanceAPI.create(performanceData);
        notify.success("Performance created successfully!");
      }

      closeModal("performanceModal");

      const response = await performanceAPI.getAll();
      this.performances = ResponseExtractor.extract(response, "performances");
      this.displayPerformances(this.performances);
    } catch (error) {
      console.error("Error saving performance:", error);
      handleApiError(
        error,
        `Failed to ${this.currentPerformance ? "update" : "create"} performance`
      );
    }
  },

  editPerformance(id) {
    const performance = this.getPerformanceById(id);
    if (performance) {
      this.openPerformanceForm(performance);
    }
  },

  async viewPerformance(id) {
    const performance = this.getPerformanceById(id);
    if (!performance) return;

    const venue = this.getVenueDisplay(performance);
    const ticketTypes = performance.pricingSections || [];
    const showtimes = performance.showtimes || [];

    await Swal.fire({
      title: `<i class="fas fa-music text-indigo-600 mr-2"></i>${performance.title}`,
      html: this.generatePerformanceDetailsHTML(
        performance,
        venue,
        showtimes,
        ticketTypes
      ),
      width: "700px",
      confirmButtonText: "Close",
      confirmButtonColor: SwalColors.primary,
    });
  },

  generatePerformanceDetailsHTML(performance, venue, showtimes, ticketTypes) {
    const showtimesHtml = this.renderShowtimesSection(showtimes);
    const ticketTypesHtml = this.renderTicketTypesSection(ticketTypes);

    return `
      <div class="text-left space-y-4">
        ${this.renderPerformanceImageSection(performance)}
        ${this.renderPerformanceInfoGrid(performance, venue)}
        ${this.renderPerformanceDescription(performance)}

        <div>
          <p class="text-xs text-gray-500 uppercase font-semibold mb-2">Showtimes</p>
          <div class="space-y-2">${showtimesHtml}</div>
        </div>

        <div>
          <p class="text-xs text-gray-500 uppercase font-semibold mb-2">Ticket Pricing</p>
          <div class="space-y-2">${ticketTypesHtml}</div>
        </div>

        <div>
          <p class="text-xs text-gray-500 uppercase font-semibold">Status</p>
          ${getStatusBadge(
            performance.ticketingInfo?.status || "upcoming",
            "performance"
          )}
        </div>
      </div>
    `;
  },

  renderPerformanceImageSection(performance) {
    return performance.imageUrl
      ? `<div class="mb-4">
           <img src="${performance.imageUrl}" class="w-full h-48 object-cover rounded-lg" />
         </div>`
      : "";
  },

  renderPerformanceInfoGrid(performance, venue) {
    return `
      <div class="grid grid-cols-2 gap-4">
        <div>
          <p class="text-xs text-gray-500 uppercase font-semibold">Composer</p>
          <p class="text-sm text-gray-900">${performance.composer || "N/A"}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500 uppercase font-semibold">Conductor</p>
          <p class="text-sm text-gray-900">${performance.conductor || "N/A"}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500 uppercase font-semibold">Orchestra</p>
          <p class="text-sm text-gray-900">${performance.orchestra || "N/A"}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500 uppercase font-semibold">Venue</p>
          <p class="text-sm text-gray-900">${venue}</p>
        </div>
      </div>
    `;
  },

  renderPerformanceDescription(performance) {
    return performance.description
      ? `<div>
           <p class="text-xs text-gray-500 uppercase font-semibold mb-1">Description</p>
           <p class="text-sm text-gray-700">${performance.description}</p>
         </div>`
      : "";
  },

  renderShowtimesSection(showtimes) {
    if (showtimes.length === 0) {
      return "<p class='text-gray-500'>No showtimes scheduled</p>";
    }

    return showtimes
      .map(
        (st) => `
        <div class="py-2 px-3 bg-gray-50 rounded-lg">
          <div class="font-semibold text-gray-900">${this.formatShowtimeDate(
            st,
            "MMM D, YYYY"
          )} ${this.formatShowtimeTime(st)}</div>
          ${
            st.available !== undefined
              ? `<div class="text-sm text-gray-600">${st.available} seats available</div>`
              : ""
          }
        </div>
      `
      )
      .join("");
  },

  renderTicketTypesSection(ticketTypes) {
    if (ticketTypes.length === 0) {
      return "<p class='text-gray-500'>No pricing information</p>";
    }

    return ticketTypes.map((tt) => this.renderTicketTypeCard(tt)).join("");
  },

  renderTicketTypeCard(tt) {
    const tierBadge = tt.tier
      ? `<span class="ml-2 text-xs px-2 py-0.5 rounded-full ${getTierBadge(
          tt.tier
        )}">${tt.tier.charAt(0).toUpperCase() + tt.tier.slice(1)}</span>`
      : "";

    return `
      <div class="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
        <div>
          <span class="font-medium text-gray-900">${
            tt.sectionName || tt.name || tt.section || "Unnamed Section"
          }</span>
          ${tierBadge}
        </div>
        <span class="text-indigo-600 font-semibold">HKD ${
          tt.basePrice || tt.price || "N/A"
        }</span>
      </div>
    `;
  },

  async manageShowtimes(id) {
    const performance = this.getPerformanceById(id);
    if (!performance) return;

    const showtimes = performance.showtimes || [];
    const bookings = storage.getItem("bookings", []);

    await Swal.fire({
      title: `<i class="fas fa-calendar-day text-indigo-600 mr-2"></i>Manage Showtimes`,
      html: this.generateManageShowtimesHTML(
        performance,
        showtimes,
        bookings,
        id
      ),
      width: "700px",
      showConfirmButton: true,
      confirmButtonText: "Close",
      confirmButtonColor: SwalColors.primary,
    });
  },

  generateManageShowtimesHTML(performance, showtimes, bookings, performanceId) {
    const showtimesHtml = showtimes
      .map((st, index) =>
        this.renderShowtimeCard(st, index, performanceId, bookings)
      )
      .join("");

    return `
      <div class="text-left">
        <div class="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 class="font-semibold text-gray-900 mb-1">${performance.title}</h3>
          <p class="text-sm text-gray-600">${performance.composer} • ${
      performance.conductor
    }</p>
        </div>

        <div class="mb-3 flex items-center justify-between">
          <h4 class="font-semibold text-gray-700">
            ${showtimes.length} Showtime${showtimes.length !== 1 ? "s" : ""}
          </h4>
          <div class="text-xs text-gray-500">
            ${this.formatShowtimeDate(showtimes[0], "MMM YYYY")}
            ${
              showtimes.length > 1
                ? ` - ${this.formatShowtimeDate(
                    showtimes[showtimes.length - 1],
                    "MMM YYYY"
                  )}`
                : ""
            }
          </div>
        </div>

        <div class="space-y-3 max-h-96 overflow-y-auto pr-2">
          ${showtimesHtml}
        </div>
      </div>
    `;
  },

  renderShowtimeCard(st, index, performanceId, bookings) {
    const showtimeBookings = bookings.filter(
      (b) => b.showtimeId === st.id && b.status !== "cancelled"
    );
    const stats = this.calculateShowtimeStats(st, showtimeBookings);

    return `
      <div class="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:shadow-md transition-all">
        ${this.renderShowtimeHeader(st, stats)}
        ${this.renderShowtimeProgress(stats)}
        ${this.renderShowtimeActions(performanceId, index, st.id)}
      </div>
    `;
  },

  calculateShowtimeStats(st, showtimeBookings) {
    const bookedSeats = showtimeBookings.reduce(
      (sum, b) => sum + (b.seats?.length || 0),
      0
    );
    const totalSeats = st.capacity || 500;
    const availableSeats = totalSeats - bookedSeats;
    const occupancyPercent = Math.round((bookedSeats / totalSeats) * 100);
    const occupancyColor = this.getOccupancyColor(occupancyPercent);

    return {
      bookedSeats,
      totalSeats,
      availableSeats,
      occupancyPercent,
      occupancyColor,
      bookingCount: showtimeBookings.length,
    };
  },

  getOccupancyColor(occupancyPercent) {
    if (occupancyPercent >= 90) return "bg-red-500";
    if (occupancyPercent >= 70) return "bg-yellow-500";
    if (occupancyPercent >= 40) return "bg-blue-500";
    return "bg-green-500";
  },

  renderShowtimeHeader(st, stats) {
    const cancelledBadge =
      st.status === "cancelled"
        ? '<span class="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Cancelled</span>'
        : "";

    return `
      <div class="flex items-start justify-between mb-3">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <h4 class="text-base font-semibold text-gray-900">
              ${this.formatShowtimeDate(st, "ddd, MMM D, YYYY")}
            </h4>
            ${cancelledBadge}
          </div>
          <div class="flex items-center gap-3 text-sm text-gray-600">
            <span class="flex items-center gap-1">
              <i class="fas fa-clock text-indigo-600"></i>
              ${this.formatShowtimeTime(st)}
            </span>
            <span class="flex items-center gap-1">
              <i class="fas fa-users text-indigo-600"></i>
              ${stats.bookingCount} bookings
            </span>
          </div>
        </div>
        <div class="text-right">
          <div class="text-2xl font-bold text-indigo-600">${
            stats.occupancyPercent
          }%</div>
          <div class="text-xs text-gray-500">Occupied</div>
        </div>
      </div>
    `;
  },

  renderShowtimeProgress(stats) {
    return `
      <div class="mb-3">
        <div class="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>${stats.bookedSeats} / ${stats.totalSeats} seats</span>
          <span>${stats.availableSeats} available</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div class="${stats.occupancyColor} h-2 rounded-full transition-all" style="width: ${stats.occupancyPercent}%"></div>
        </div>
      </div>
    `;
  },

  renderShowtimeActions(performanceId, index, showtimeId) {
    return `
      <div class="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100">
        <button
          onclick="window.PerformancesPage.viewShowtimeDetails(${performanceId}, ${index})"
          class="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center justify-center gap-1"
        >
          <i class="fas fa-eye text-xs"></i>
          Details
        </button>
        <button
          onclick="window.PerformancesPage.viewShowtimeBookings(${performanceId}, '${showtimeId}')"
          class="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium flex items-center justify-center gap-1"
        >
          <i class="fas fa-ticket-alt text-xs"></i>
          Bookings
        </button>
      </div>
    `;
  },

  async duplicatePerformance(id) {
    const performance = this.getPerformanceById(id);
    if (!performance) return;

    const result = await Swal.fire({
      title: "Duplicate Performance",
      html: `Create a copy of <strong>"${performance.title}"</strong>?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: SwalColors.primary,
      cancelButtonColor: SwalColors.cancel,
      confirmButtonText: "Yes, duplicate it",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        const newPerformanceData = {
          ...performance,
          title: `${performance.title} (Copy)`,
          showtimes: performance.showtimes
            ? performance.showtimes.map((st) => {
                const { id, ...stData } = st;
                return stData;
              })
            : [],
        };

        delete newPerformanceData.id;
        delete newPerformanceData.createdAt;
        delete newPerformanceData.updatedAt;

        await performanceAPI.create(newPerformanceData);
        notify.success("Performance duplicated successfully!");

        const response = await performanceAPI.getAll();
        this.performances = ResponseExtractor.extract(response, "performances");
        this.displayPerformances(this.performances);
      } catch (error) {
        console.error("Error duplicating performance:", error);
        handleApiError(error, "Failed to duplicate performance");
      }
    }
  },

  async viewShowtimeDetails(performanceId, showtimeIndex) {
    const performance = this.getPerformanceById(performanceId);
    if (!performance || !performance.showtimes) return;

    const showtime = performance.showtimes[showtimeIndex];
    if (!showtime) return;

    await Swal.fire({
      title: `<i class="fas fa-info-circle text-blue-600 mr-2"></i>Showtime Details`,
      html: this.generateShowtimeDetailsHTML(performance, showtime),
      width: "600px",
      confirmButtonText: "Close",
      confirmButtonColor: SwalColors.primary,
    });
  },

  generateShowtimeDetailsHTML(performance, showtime) {
    const sections =
      showtime.pricingSections || performance.pricingSections || [];
    const venue = this.getVenueDisplay(performance);
    const sectionsHtml = this.renderPricingSectionsDetails(sections);

    return `
      <div class="text-left space-y-4">
        <div class="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4">
          <h3 class="font-bold text-lg text-gray-900 mb-1">${
            performance.title
          }</h3>
          <div class="text-sm text-gray-700">${performance.composer}</div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-xs text-gray-500 uppercase font-semibold mb-1">Date & Time</p>
            <p class="text-sm font-medium text-gray-900">${this.formatShowtimeDate(
              showtime,
              "ddd, MMM D, YYYY"
            )}</p>
            <p class="text-sm text-gray-600">${this.formatShowtimeTime(
              showtime
            )}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 uppercase font-semibold mb-1">Venue</p>
            <p class="text-sm text-gray-900">${venue}</p>
          </div>
        </div>

        ${
          sections.length > 0
            ? `
          <div>
            <p class="text-xs text-gray-500 uppercase font-semibold mb-2">Pricing Sections</p>
            <div class="space-y-2">${sectionsHtml}</div>
          </div>
        `
            : ""
        }

        <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p class="text-sm text-blue-800">
            <i class="fas fa-id-badge mr-1"></i>
            Showtime ID: <code class="bg-blue-100 px-2 py-0.5 rounded text-xs font-mono">${
              showtime.id
            }</code>
          </p>
        </div>
      </div>
    `;
  },

  renderPricingSectionsDetails(sections) {
    return sections
      .map(
        (section) => `
        <div class="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
          <div class="flex items-center gap-2">
            <span class="font-medium text-gray-900">${
              section.sectionName || section.name
            }</span>
            ${
              section.tier
                ? `<span class="text-xs px-2 py-0.5 rounded-full ${getTierBadge(
                    section.tier
                  )}">${section.tier}</span>`
                : ""
            }
          </div>
          <span class="font-semibold text-indigo-600">HKD ${
            section.basePrice || section.price
          }</span>
        </div>
      `
      )
      .join("");
  },

  async viewShowtimeBookings(performanceId, showtimeId) {
    const performance = this.performances.find((p) => p.id === performanceId);
    if (!performance) return;

    const bookings = storage
      .getItem("bookings", [])
      .filter((b) => b.showtimeId === showtimeId);

    const bookingsHtml =
      bookings.length > 0
        ? bookings
            .map(
              (booking) => `
          <div class="border border-gray-200 rounded-lg p-3 hover:border-indigo-300 transition-colors">
            <div class="flex items-start justify-between mb-2">
              <div class="flex-1">
                <div class="font-semibold text-gray-900">${
                  booking.customerInfo?.name || "Guest"
                }</div>
                <div class="text-xs text-gray-500">${
                  booking.customerInfo?.email || "N/A"
                }</div>
              </div>
              <div class="text-right">
                ${getStatusBadge(booking.status, "booking")}
              </div>
            </div>

            <div class="flex items-center gap-4 text-xs text-gray-600">
              <span class="flex items-center gap-1">
                <i class="fas fa-ticket-alt text-indigo-600"></i>
                ${booking.seats?.length || 0} seat${
                booking.seats?.length !== 1 ? "s" : ""
              }
              </span>
              <span class="flex items-center gap-1">
                <i class="fas fa-dollar-sign text-green-600"></i>
                HKD ${booking.amount || 0}
              </span>
              <span class="flex items-center gap-1">
                <i class="fas fa-calendar text-gray-600"></i>
                ${dayjs(booking.date).format("MMM D, YYYY")}
              </span>
            </div>

            ${
              booking.seats?.length > 0
                ? `
              <div class="mt-2 pt-2 border-t border-gray-100">
                <div class="flex flex-wrap gap-1">
                  ${booking.seats
                    .map((seat) => {
                      const seatId =
                        typeof seat === "string"
                          ? seat
                          : seat.fullId || seat.seatId || seat;
                      return `<span class="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-mono">${getDisplayLabel(
                        seatId
                      )}</span>`;
                    })
                    .join("")}
                </div>
              </div>
            `
                : ""
            }
          </div>
        `
            )
            .join("")
        : '<div class="text-center py-8 text-gray-500"><i class="fas fa-inbox text-3xl mb-2"></i><p>No bookings for this showtime yet</p></div>';

    const totalRevenue = bookings
      .filter((b) => b.status !== "cancelled")
      .reduce((sum, b) => sum + (b.amount || 0), 0);
    const totalSeatsBooked = bookings
      .filter((b) => b.status !== "cancelled")
      .reduce((sum, b) => sum + (b.seats?.length || 0), 0);

    await Swal.fire({
      title: `<i class="fas fa-ticket-alt text-green-600 mr-2"></i>Showtime Bookings`,
      html: `
        <div class="text-left">
          <div class="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 class="font-semibold text-gray-900 mb-2">${performance.title}</h3>
            <div class="grid grid-cols-3 gap-3 text-center">
              <div>
                <div class="text-2xl font-bold text-indigo-600">${bookings.length}</div>
                <div class="text-xs text-gray-500">Total Bookings</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-green-600">${totalSeatsBooked}</div>
                <div class="text-xs text-gray-500">Seats Booked</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-purple-600">$${totalRevenue}</div>
                <div class="text-xs text-gray-500">Revenue</div>
              </div>
            </div>
          </div>

          <div class="space-y-2 max-h-96 overflow-y-auto pr-2">
            ${bookingsHtml}
          </div>
        </div>
      `,
      width: "700px",
      confirmButtonText: "Close",
      confirmButtonColor: SwalColors.primary,
    });
  },

  async deletePerformance(id) {
    const performance = this.performances.find((p) => p.id === id);
    if (!performance) return;

    const result = await Swal.fire({
      title: "Delete Performance?",
      html: `Are you sure you want to delete <strong>"${performance.title}"</strong>?<br><span class="text-sm text-gray-600">This action cannot be undone.</span>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: SwalColors.dangerDark,
      cancelButtonColor: SwalColors.cancel,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        await performanceAPI.delete(id);
        notify.success("Performance deleted successfully!");

        const response = await performanceAPI.getAll();
        this.performances = ResponseExtractor.extract(response, "performances");
        this.displayPerformances(this.performances);
      } catch (error) {
        console.error("Error deleting performance:", error);
        handleApiError(error, "Failed to delete performance");
      }
    }
  },

  async loadSeatTemplate(showtimeIndex) {
    const templateSelectorHtml = await createTemplateSelector();

    const result = await Swal.fire({
      title: "Load Seat Layout Template",
      html: templateSelectorHtml,
      width: "900px",
      showCancelButton: true,
      showConfirmButton: false,
      didOpen: () => {
        initTemplateSelector(async (templateId) => {
          const template = await templateService.getById(templateId);
          if (template) {
            this.showtimes[showtimeIndex].seatLayout = template.layout;
            this.showtimes[showtimeIndex].seatDetails = JSON.parse(
              JSON.stringify(template.seatDetails)
            );

            $(`#seatPlan_${showtimeIndex}`).html(
              this.renderSeatPlanSVG(
                this.showtimes[showtimeIndex],
                showtimeIndex
              )
            );

            Swal.close();
            notify.success(`Template "${template.name}" loaded successfully!`);
          }
        });
      },
    });
  },

  async saveSeatTemplate(showtimeIndex) {
    const showtime = this.showtimes[showtimeIndex];
    const layout = showtime.seatLayout || DEFAULT_SEAT_LAYOUT;
    const seatDetails =
      showtime.seatDetails ||
      this.initializeSeatDetails(layout.rows, layout.seatsPerRow);

    const result = await Swal.fire({
      title: "Save as Template",
      html: `
        <div class="text-left space-y-4 text-gray-900">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Template Name *</label>
            <input type="text" id="templateName" class="swal2-input w-full" placeholder="e.g., Standard Theater Layout">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea id="templateDescription" class="swal2-textarea w-full" placeholder="Describe this layout..."></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
            <input type="text" id="templateTags" class="swal2-input w-full" placeholder="e.g., Theater, Medium, Standard">
          </div>

          <div class="bg-gray-50 rounded-lg p-3">
            <div class="text-sm text-gray-700">
              <div>Rows: <span class="font-semibold">${layout.rows}</span></div>
              <div>Seats per row: <span class="font-semibold">${
                layout.seatsPerRow
              }</span></div>
              <div>Total seats: <span class="font-semibold">${
                layout.rows * layout.seatsPerRow
              }</span></div>
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Save Template",
      preConfirm: () => {
        const name = $("#templateName").val().trim();
        const description = $("#templateDescription").val().trim();
        const tagsStr = $("#templateTags").val().trim();
        const tags = tagsStr
          ? tagsStr
              .split(",")
              .map((t) => t.trim())
              .filter((t) => t)
          : [];

        if (!name) {
          Swal.showValidationMessage("Please enter a template name");
          return false;
        }

        return { name, description, tags };
      },
    });

    if (result.isConfirmed) {
      try {
        await templateService.saveTemplate(
          result.value.name,
          result.value.description,
          layout,
          seatDetails,
          result.value.tags
        );
        notify.success("Template saved successfully!");
      } catch (error) {
        console.error("Error saving template:", error);
        notify.error("Failed to save template");
      }
    }
  },

  async autoPopulateFromVenue(showtimeIndex) {
    const showtime = this.showtimes[showtimeIndex];
    const venueId = showtime.venue;

    if (!venueId) {
      notify.error("Please select a venue first");
      return;
    }

    const venue = await venueService.getById(venueId);

    if (
      !venue ||
      !venue.layout ||
      !venue.layout.sections ||
      venue.layout.sections.length === 0
    ) {
      notify.error("This venue does not have a defined layout");
      return;
    }

    let totalRows = 0;
    let maxSeatsPerRow = 0;

    venue.layout.sections.forEach((section) => {
      totalRows += section.rows;
      maxSeatsPerRow = Math.max(maxSeatsPerRow, section.seatsPerRow);
    });

    const previewHtml = `
      <div class="text-left space-y-4">
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 class="font-semibold text-blue-900 mb-2">
            <i class="fas fa-building mr-2"></i>${venue.name}
          </h4>
          <div class="text-sm text-blue-800">
            <div>Total capacity: <span class="font-semibold">${
              venue.capacity || venueService.calculateCapacity(venue.layout)
            }</span> seats</div>
            <div>Sections: <span class="font-semibold">${
              venue.layout.sections.length
            }</span></div>
          </div>
        </div>

        <div>
          <h4 class="font-semibold text-gray-900 mb-2">Sections:</h4>
          <div class="space-y-2">
            ${venue.layout.sections
              .map(
                (section) => `
              <div class="bg-gray-50 rounded p-3 text-sm">
                <div class="font-semibold text-gray-900">${section.name}</div>
                <div class="text-gray-600">
                  ${section.rows} rows × ${section.seatsPerRow} seats = ${
                  section.rows * section.seatsPerRow
                } total
                  <span class="ml-2 px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs">${
                    section.tier
                  }</span>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Action</label>
          <select id="populateAction" class="swal2-select w-full">
            <option value="replace">Replace existing layout</option>
            <option value="merge">Merge with existing (add rows)</option>
          </select>
        </div>

        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p class="text-sm text-yellow-800">
            <i class="fas fa-exclamation-triangle mr-2"></i>
            This will populate the seat layout with ${totalRows} rows and up to ${maxSeatsPerRow} seats per row based on the venue's configuration.
          </p>
        </div>
      </div>
    `;

    const result = await Swal.fire({
      title: "Auto-Populate from Venue",
      html: previewHtml,
      width: "700px",
      showCancelButton: true,
      confirmButtonText: "Apply Layout",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      const action = $("#populateAction").val();

      if (action === "replace") {
        this.showtimes[showtimeIndex].seatLayout = {
          rows: totalRows,
          seatsPerRow: maxSeatsPerRow,
        };
        this.showtimes[showtimeIndex].seatDetails = this.initializeSeatDetails(
          totalRows,
          maxSeatsPerRow
        );
      } else {
        const currentLayout = showtime.seatLayout || {
          rows: 0,
          seatsPerRow: 0,
        };
        this.showtimes[showtimeIndex].seatLayout = {
          rows: currentLayout.rows + totalRows,
          seatsPerRow: Math.max(currentLayout.seatsPerRow, maxSeatsPerRow),
        };

        const newSeatDetails = this.initializeSeatDetails(
          currentLayout.rows + totalRows,
          Math.max(currentLayout.seatsPerRow, maxSeatsPerRow)
        );

        this.showtimes[showtimeIndex].seatDetails = {
          ...(showtime.seatDetails || {}),
          ...newSeatDetails,
        };
      }

      $(`#seatPlan_${showtimeIndex}`).html(
        this.renderSeatPlanSVG(this.showtimes[showtimeIndex], showtimeIndex)
      );

      notify.success(`Seat layout populated from venue "${venue.name}"!`);
    }
  },

  async manageZones(showtimeIndex) {
    const showtime = this.showtimes[showtimeIndex];
    const pricingSections = showtime.pricing?.sections || [];

    if (pricingSections.length === 0) {
      notify.error("Please add pricing sections first");
      return;
    }

    if (!showtime.pricingZones) {
      showtime.pricingZones = [];
    }

    const zonesHtml = createZoneEditor(showtime.pricingZones, pricingSections);

    const result = await Swal.fire({
      title:
        '<i class="fas fa-layer-group text-orange-600 mr-2"></i>Manage Pricing Zones',
      html: zonesHtml,
      width: "800px",
      showCancelButton: true,
      confirmButtonText: "Save Zones",
      didOpen: () => {
        $("#addZoneBtn").on("click", () => {
          showZoneEditorDialog(
            showtime.pricingZones,
            pricingSections,
            (newZone) => {
              showtime.pricingZones.push({
                ...newZone,
                id: Date.now(),
              });

              $("#zonesList").html(
                showtime.pricingZones.length === 0
                  ? '<p class="text-gray-500 text-sm">No zones defined. Click "Add Zone" to create your first pricing zone.</p>'
                  : showtime.pricingZones
                      .map(
                        (zone, index) => `
                  <div class="zone-item border border-gray-300 rounded-lg p-4" data-zone-index="${index}">
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded" style="background-color: ${
                          zone.color
                        }"></div>
                        <div>
                          <h4 class="font-semibold text-gray-900">${
                            zone.name
                          }</h4>
                          <p class="text-xs text-gray-600">${
                            zone.seats.length
                          } seats</p>
                        </div>
                      </div>
                      <div class="flex gap-2">
                        <button class="assign-zone-seats-btn px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm" data-zone-index="${index}">
                          <i class="fas fa-mouse-pointer mr-1"></i>Assign Seats
                        </button>
                        <button class="delete-zone-btn px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm" data-zone-index="${index}">
                          <i class="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                    <div class="text-sm text-gray-600">
                      <span>Pricing: ${
                        pricingSections[zone.sectionIndex]?.category || "N/A"
                      }</span>
                    </div>
                  </div>
                `
                      )
                      .join("")
              );

              attachZoneHandlers();
              notify.success(`Zone "${newZone.name}" created`);
            }
          );
        });

        const attachZoneHandlers = () => {
          $(".delete-zone-btn")
            .off("click")
            .on("click", function () {
              const zoneIndex = parseInt($(this).data("zone-index"));
              const zone = showtime.pricingZones[zoneIndex];

              Swal.fire({
                title: "Delete Zone?",
                text: `Remove "${zone.name}" zone?`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: SwalColors.danger,
                confirmButtonText: "Delete",
              }).then((result) => {
                if (result.isConfirmed) {
                  showtime.pricingZones.splice(zoneIndex, 1);
                  $(this).closest(".zone-item").remove();
                  notify.success("Zone deleted");
                }
              });
            });

          $(".assign-zone-seats-btn")
            .off("click")
            .on(
              "click",
              async function () {
                const zoneIndex = parseInt($(this).data("zone-index"));
                const zone = showtime.pricingZones[zoneIndex];

                const layout = showtime.seatLayout || {
                  rows: 5,
                  seatsPerRow: 8,
                };
                const seatDetails = showtime.seatDetails || {};

                const assignResult = await Swal.fire({
                  title: `Assign Seats to "${zone.name}"`,
                  html: `
                <div class="text-left space-y-4 text-gray-900">
                  <div class="bg-${zone.color.replace(
                    "#",
                    ""
                  )}-50 border border-${zone.color.replace(
                    "#",
                    ""
                  )}-200 rounded-lg p-3">
                    <p class="text-sm">Click seats on the map to add/remove them from this zone</p>
                    <p class="text-xs text-gray-600 mt-1">Currently assigned: <span id="zone-seat-count" class="font-bold">${
                      zone.seats.length
                    }</span> seats</p>
                  </div>

                  <div class="bg-gray-50 rounded-lg p-4 overflow-auto" style="max-height: 400px;">
                    <div id="zone-seat-map" class="flex justify-center"></div>
                  </div>

                  <div class="flex gap-2">
                    <button type="button" id="clear-zone-btn" class="flex-1 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm">
                      Clear All
                    </button>
                    <button type="button" id="select-all-zone-btn" class="flex-1 px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm">
                      Select All
                    </button>
                  </div>
                </div>
              `,
                  width: "700px",
                  showCancelButton: true,
                  confirmButtonText: "Save Selection",
                  didOpen: () => {
                    let selectedSeats = [...zone.seats];

                    const renderZoneMap = () => {
                      const mapHTML = this.generateInteractiveSeatMap(
                        layout.rows,
                        layout.seatsPerRow,
                        seatDetails,
                        selectedSeats
                      );
                      $("#zone-seat-map").html(mapHTML);
                      $("#zone-seat-count").text(selectedSeats.length);

                      $(".interactive-seat").on("click", function () {
                        const seatId = $(this).data("seat-id");
                        const index = selectedSeats.indexOf(seatId);

                        if (index > -1) {
                          selectedSeats.splice(index, 1);
                        } else {
                          selectedSeats.push(seatId);
                        }

                        renderZoneMap();
                      });
                    };

                    renderZoneMap();

                    $("#clear-zone-btn").on("click", () => {
                      selectedSeats = [];
                      renderZoneMap();
                    });

                    $("#select-all-zone-btn").on("click", () => {
                      selectedSeats = [];
                      for (let row = 0; row < layout.rows; row++) {
                        for (let seat = 0; seat < layout.seatsPerRow; seat++) {
                          const rowLetter = String.fromCharCode(65 + row);
                          const seatNumber = seat + 1;
                          selectedSeats.push(`${rowLetter}${seatNumber}`);
                        }
                      }
                      renderZoneMap();
                    });
                  },
                  preConfirm: () => {
                    const uniqueSeats = new Set();
                    $("#zone-seat-map")
                      .find(".interactive-seat")
                      .each(function () {
                        const seatId = $(this).data("seat-id");
                        if (
                          zone.seats.includes(seatId) ||
                          $(this).find("rect").attr("stroke") === "#ca8a04"
                        ) {
                          uniqueSeats.add(seatId);
                        }
                      });
                    return [...uniqueSeats];
                  },
                });

                if (assignResult.isConfirmed) {
                  const seatCount = $("#zone-seat-count").text();
                  zone.seats = Array.from(
                    new Set([...zone.seats, ...assignResult.value])
                  );
                  $(this)
                    .closest(".zone-item")
                    .find(".text-xs")
                    .text(`${zone.seats.length} seats`);
                  notify.success(
                    `${zone.seats.length} seats assigned to "${zone.name}"`
                  );

                  $(`#seatPlan_${showtimeIndex}`).html(
                    this.renderSeatPlanSVG(showtime, showtimeIndex)
                  );
                }
              }.bind(this)
            );
        };

        attachZoneHandlers();
      },
    });

    if (result.isConfirmed) {
      notify.success(`${showtime.pricingZones.length} pricing zones saved`);
      $(`#seatPlan_${showtimeIndex}`).html(
        this.renderSeatPlanSVG(showtime, showtimeIndex)
      );
    }
  },
};
