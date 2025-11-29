
import dayjs from "dayjs";
import page from "page";
import Swal from "sweetalert2";

import { SYSTEM_TICKET_TYPE_IDS } from "@/store/constants.js";
import {
  createModal,
  openModal,
  closeModal,
  initImageUpload,
  getImageDataURL,
  createTemplateSelector,
  initTemplateSelector,
  createZoneEditor,
  showZoneEditorDialog,
  SeatMap,
  SeatLayoutCustomizer,
  PerformanceFormSections,
  FormComponents,
  admin,
} from "@components/index.js";
import { PerformanceFilter } from "@components/PerformanceFilter.js";
import { getTierBadge } from "@config/tierConfig.js";
import { ResponseExtractor, ticketTypeService, templateService, venueService, performanceAPI, venueAPI, handleApiError, storage } from "@services/index.js";
import { attachSeatTooltipListeners } from "@utils/booking/seatTooltip.js";
import { getPerformanceImageUrl, getImageFallbackSvg } from "@utils/imageUtils.js";
import { initializeSeatDetails } from "@utils/booking/seatUtils.js";
import { showtimeManager } from "@utils/booking/showtimeManager.js";
import {
  getSectionColor,
  getSeatStatusColor,
  SwalColors,
} from "@utils/colors.js";
import { createDebounceSearch } from "@utils/data/filters.js";
import { performanceUtils } from "@utils/performanceUtils.js";
import { getDisplayLabel } from "@utils/seatIdHelper.js";
import { getStatusBadge } from "@utils/status.js";
import { notify } from "@utils/ui/notification.js";

const { PerformanceDetails, ShowtimeManager, PerformanceWizardHandler, openQuickEdit, ShowtimeAvailabilityBadge } = admin;

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
  performanceFilter: null,

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
          <div class="flex gap-2">
            <button
              id="addPerformanceBtn"
              class="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md transition-colors flex items-center gap-2"
            >
              <i class="fas fa-plus"></i>
              <span>Create Performance</span>
            </button>
          </div>
        </div>

        <div id="performanceFilterContainer"></div>

        <div class="bg-white rounded-lg shadow-md overflow-x-auto overflow-y-visible">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Image</th>
                <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Title</th>
                <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Venue</th>
                <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Date</th>
                <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Availability</th>
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

      this.performanceFilter = new PerformanceFilter("#performanceFilterContainer", {
        enableURLSync: true,
        debounceDelay: 300,
        showGenreFilter: false,
        showStatusFilter: true,
        showDateFilter: true,
        showVenueFilter: true,
        venues: this.venues,
        performances: this.performances,
      });

      this.performanceFilter.render();

      this.performanceFilter.onFilterChange((filters) => {
        const filtered = this.performanceFilter.applyFilters(this.performances);
        this.displayPerformances(filtered);
      });

      this.displayPerformances(this.performances);
      this.setupEventListeners();
    } catch (error) {
      console.error("Error loading performances:", error);
      handleApiError(error, "Failed to load performances");
    }
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

    const availabilityDisplay =
      ShowtimeAvailabilityBadge.renderCompact(showtimes);

    return `
      <tr class="hover:bg-gray-50 transition-colors">
          <td class="px-6 py-4">${imageHtml}</td>
          <td class="px-6 py-4">
            <a href="/admin/performances/${perf.id}" data-link class="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors cursor-pointer">${perf.title}</a>
            <div class="text-xs text-gray-500">${perf.orchestra || "N/A"}</div>
          </td>
        <td class="px-6 py-4">
          <div class="text-sm text-gray-900">${venue}</div>
        </td>
        <td class="px-6 py-4">${dateDisplay}</td>
        <td class="px-6 py-4">${availabilityDisplay}</td>
          <td class="px-6 py-4">${statusBadge}</td>
          <td class="px-6 py-4 relative overflow-visible">
          <div class="flex items-center gap-2">
            ${this.renderPerformanceActions(perf, showtimeCount)}
            </div>
          </td>
        </tr>
    `;
  },

  renderPerformanceImage(perf) {
    const imageUrl = getPerformanceImageUrl(perf.image || perf.imageUrl);

    return imageUrl
      ? `<img 
          src="${imageUrl}" 
          class="h-16 w-16 object-cover rounded" 
          onerror="this.onerror=null; this.src='${getImageFallbackSvg()}';"
          alt="Performance image"
        />`
      : "<div class=\"h-16 w-16 bg-gray-200 rounded flex items-center justify-center\"><i class=\"fas fa-image text-gray-400\"></i></div>";
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

    return "<div class=\"text-sm text-gray-500\">N/A</div>";
  },

  renderPerformanceActions(perf, showtimeCount) {
    return `
      <div class="relative inline-block group">
        <button
          class="action-dropdown-btn inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-all text-sm font-medium shadow-sm hover:shadow group-hover:border-indigo-300"
          data-perf-id="${perf.id}"
        >
          <span>Actions</span>
          <i class="fas fa-chevron-down text-xs transition-transform group-hover:rotate-180"></i>
        </button>
        <div class="action-dropdown-menu hidden w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-[9999]">
          <div class="py-1">
            <div class="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
              Quick Actions
            </div>
            <button
              class="action-view-btn w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 flex items-center gap-3 transition-colors group/item"
              data-perf-id="${perf.id}"
            >
              <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center group-hover/item:bg-blue-200 transition-colors">
                <i class="fas fa-eye text-blue-600 text-sm"></i>
              </div>
              <div class="flex-1">
                <div class="font-medium text-gray-900">View Details</div>
                <div class="text-xs text-gray-500">Quick overview</div>
              </div>
            </button>
            <button
              class="action-edit-btn w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 flex items-center gap-3 transition-colors group/item"
              data-perf-id="${perf.id}"
            >
              <div class="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center group-hover/item:bg-indigo-200 transition-colors">
                <i class="fas fa-edit text-indigo-600 text-sm"></i>
              </div>
              <div class="flex-1">
                <div class="font-medium text-gray-900">Quick Edit</div>
                <div class="text-xs text-gray-500">Fast wizard</div>
              </div>
            </button>
            
            <div class="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-t border-b border-gray-100 bg-gray-50 mt-1">
              More Options
            </div>
            <button
              class="action-duplicate-btn w-full text-left px-4 py-2.5 text-sm hover:bg-purple-50 flex items-center gap-3 transition-colors group/item"
              data-perf-id="${perf.id}"
            >
              <div class="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center group-hover/item:bg-purple-200 transition-colors">
                <i class="fas fa-copy text-purple-600 text-sm"></i>
              </div>
              <div class="flex-1">
                <div class="font-medium text-gray-900">Duplicate</div>
                <div class="text-xs text-gray-500">Clone performance</div>
              </div>
            </button>
            
            <div class="border-t border-gray-200 mt-1"></div>
            <button
              class="action-delete-btn w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 flex items-center gap-3 transition-colors group/item"
              data-perf-id="${perf.id}"
            >
              <div class="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center group-hover/item:bg-red-200 transition-colors">
                <i class="fas fa-trash text-red-600 text-sm"></i>
              </div>
              <div class="flex-1">
                <div class="font-medium text-red-600">Delete</div>
                <div class="text-xs text-red-500">Permanent action</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  setupEventListeners() {
    $(document).on("click", ".action-dropdown-btn", (e) => {
      e.stopPropagation();
      const $btn = $(e.currentTarget);
      const $dropdown = $btn.next();
      const rect = $btn[0].getBoundingClientRect();

      $(".action-dropdown-btn").not($btn).next().addClass("hidden");

      $dropdown.css({
        position: "fixed",
        top: (rect.bottom + 4) + "px",
        right: (window.innerWidth - rect.right) + "px"
      }).toggleClass("hidden");

      if (!$dropdown.hasClass("hidden")) {
        const closeDropdown = (e) => {
          const $target = $(e.target);
          // Check if clicking inside the dropdown or on an action button
          const isInsideDropdown = $target.closest(".action-dropdown-menu").length > 0;
          const isActionButton = $target.closest("[class*=\"action-\"]").length > 0;

          // Only close if clicking outside both the dropdown and action buttons
          if (!isInsideDropdown && !isActionButton && !$target.closest(".group").length) {
            $dropdown.addClass("hidden");
            $(document).off("click", closeDropdown);
            $(document).off("scroll", closeOnScroll);
          }
        };
        const closeOnScroll = () => {
          $dropdown.addClass("hidden");
          $(document).off("click", closeDropdown);
          $(document).off("scroll", closeOnScroll);
        };
        setTimeout(() => {
          $(document).on("click", closeDropdown);
          $(document).on("scroll", closeOnScroll);
        }, 0);
      }
    });

    // Action dropdown button handlers
    $(document).on("click", ".action-view-btn", (e) => {
      e.stopPropagation();
      const perfId = $(e.currentTarget).data("perf-id");
      $(".action-dropdown-menu").addClass("hidden"); // Close dropdown
      this.viewPerformance(perfId);
    });

    $(document).on("click", ".action-edit-btn", (e) => {
      e.stopPropagation();
      const perfId = $(e.currentTarget).data("perf-id");
      $(".action-dropdown-menu").addClass("hidden"); // Close dropdown
      this.editPerformance(perfId);
    });

    $(document).on("click", ".action-duplicate-btn", (e) => {
      e.stopPropagation();
      const perfId = $(e.currentTarget).data("perf-id");
      $(".action-dropdown-menu").addClass("hidden"); // Close dropdown
      this.duplicatePerformance(perfId);
    });

    $(document).on("click", ".action-delete-btn", (e) => {
      e.stopPropagation();
      const perfId = $(e.currentTarget).data("perf-id");
      $(".action-dropdown-menu").addClass("hidden"); // Close dropdown
      this.deletePerformance(perfId);
    });

    $("#addPerformanceBtn").on("click", () => this.openQuickCreate());
  },













  removePricingSection(showtimeIndex, sectionIndex) {
    if (!this.showtimes[showtimeIndex]?.pricing?.sections) {return;}

    const section = this.showtimes[showtimeIndex].pricing.sections[sectionIndex];
    const sectionName = section?.section || `Section ${sectionIndex + 1}`;

    Swal.fire({
      title: "<i class=\"fas fa-exclamation-triangle text-yellow-500 mr-2\"></i>Remove Price Tier?",
      html: `
        <div class="text-left">
          <p class="text-gray-700 mb-3">
            Are you sure you want to remove the price tier <strong>"${sectionName}"</strong>?
          </p>
          <div class="bg-gray-50 rounded-lg p-3 text-sm">
            <p class="text-gray-600 mb-1"><strong>Tier:</strong> ${section?.tier || "N/A"}</p>
            <p class="text-gray-600"><strong>Base Price:</strong> $${section?.basePrice || 0}</p>
          </div>
          <p class="text-red-600 text-sm mt-3">
            <i class="fas fa-info-circle mr-1"></i>This action cannot be undone.
          </p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "<i class=\"fas fa-trash mr-2\"></i>Yes, Remove",
      cancelButtonText: "Cancel",
      confirmButtonColor: SwalColors.danger,
      cancelButtonColor: SwalColors.secondary,
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.showtimes[showtimeIndex].pricing.sections.splice(sectionIndex, 1);
        this.renderShowtimes();
        notify.success(`Price tier "${sectionName}" removed successfully`);
      }
    });
  },

  async addCustomTier(showtimeIndex, sectionIndex) {
    const { value: customTier } = await Swal.fire({
      title:
        "<i class=\"fas fa-layer-group text-purple-600 mr-2\"></i>Add Custom Tier",
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
    if (!input || typeof input !== "string") {return [];}

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
        "<i class=\"fas fa-ticket-alt text-green-600 mr-2\"></i>Add Custom Ticket Type",
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
        $("input[name=\"pricingModifier\"]").on("change", updatePreview);

        function updatePreview() {
          const type = $pricingType.val();
          const value = parseFloat($pricingValue.val()) || 0;
          const modifier = $("input[name=\"pricingModifier\"]:checked").val();

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
          "input[name=\"pricingModifier\"]:checked"
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
          ? ` with ${newType.pricing.modifier === "discount" ? "discount" : "markup"
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
      const selectedVenueId = $("#venueSelect").val();
      const hasVenue = selectedVenueId && selectedVenueId !== "Select venue...";

      if (!hasVenue) {
        container.html(`
          <div class="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-dashed border-yellow-300 rounded-lg p-8 text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
              <i class="fas fa-exclamation-triangle text-2xl text-yellow-600"></i>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Venue Required</h3>
            <p class="text-sm text-gray-600 mb-4 max-w-md mx-auto">
              Please select a venue above before adding showtimes. The venue determines seating capacity and layout.
            </p>
            <div class="flex items-center justify-center gap-2 text-xs text-gray-500">
              <div class="flex items-center gap-1">
                <span class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">1</span>
                <span>Select venue</span>
              </div>
              <i class="fas fa-arrow-right text-gray-400"></i>
              <div class="flex items-center gap-1">
                <span class="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold text-xs">2</span>
                <span>Add showtime</span>
              </div>
              <i class="fas fa-arrow-right text-gray-400"></i>
              <div class="flex items-center gap-1">
                <span class="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold text-xs">3</span>
                <span>Set pricing</span>
              </div>
            </div>
          </div>
        `);
      } else {
        container.html(`
          <div class="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-dashed border-indigo-200 rounded-lg p-8 text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <i class="fas fa-calendar-plus text-2xl text-indigo-600"></i>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Ready to Add Showtimes</h3>
            <p class="text-sm text-gray-600 mb-4 max-w-md mx-auto">
              Click "Add Showtime" above to create your first performance date and configure pricing tiers.
            </p>
            <div class="flex items-center justify-center gap-2 text-xs text-gray-500">
              <div class="flex items-center gap-1">
                <i class="fas fa-check-circle text-green-500"></i>
                <span>Venue selected</span>
              </div>
              <i class="fas fa-arrow-right text-gray-400"></i>
              <div class="flex items-center gap-1">
                <span class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">2</span>
                <span>Add showtime</span>
              </div>
              <i class="fas fa-arrow-right text-gray-400"></i>
              <div class="flex items-center gap-1">
                <span class="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold text-xs">3</span>
                <span>Set pricing</span>
              </div>
            </div>
          </div>
        `);
      }
      return;
    }

    this.showtimes.forEach((showtime, index) => {
      const hasPricing = showtime.pricing?.sections?.length > 0;
      const pricingCount = showtime.pricing?.sections?.length || 0;

      const showtimeHTML = `
        <div class="bg-white p-6 rounded-lg border-2 ${hasPricing ? "border-indigo-200" : "border-gray-200"} shadow-sm hover:shadow-md transition-all" data-showtime-index="${index}">
          <div class="flex justify-between items-center mb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <span class="font-bold text-indigo-600">${index + 1}</span>
              </div>
              <div>
                <h4 class="font-semibold text-gray-900">Showtime ${index + 1}</h4>
                <p class="text-xs text-gray-500">Configure date, time and pricing</p>
              </div>
              ${hasPricing ? `
                <div class="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  <i class="fas fa-check-circle"></i>
                  <span>${pricingCount} tier${pricingCount > 1 ? "s" : ""}</span>
                </div>
              ` : `
                <div class="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                  <i class="fas fa-exclamation-circle"></i>
                  <span>No pricing</span>
                </div>
              `}
            </div>
            <button type="button" class="remove-showtime px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" data-index="${index}">
              <i class="fas fa-trash mr-1"></i> Remove
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Date & Time <span class="text-red-500">*</span></label>
              <input type="datetime-local" class="showtime-datetime w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value="${showtime.dateTime ? dayjs(showtime.dateTime).format("YYYY-MM-DDTHH:mm") : ""}" required />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Total Seats
                <i class="fas fa-info-circle text-gray-400 ml-1 text-xs" title="Auto-calculated from venue capacity"></i>
              </label>
              <div class="relative">
                <input type="number" class="showtime-total-seats w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 cursor-not-allowed"
                  value="${showtime.totalSeats || 200}" readonly disabled />
                <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <i class="fas fa-lock text-gray-400 text-xs"></i>
                </div>
              </div>
              <p class="text-xs text-gray-500 mt-1">
                <i class="fas fa-building mr-1"></i>From venue capacity
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Available Seats
                <i class="fas fa-info-circle text-gray-400 ml-1 text-xs" title="Updates automatically based on bookings"></i>
              </label>
              <div class="relative">
                <input type="number" class="showtime-available-seats w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 cursor-not-allowed"
                  value="${showtime.availableSeats || showtime.totalSeats || 200}" readonly disabled />
                <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <i class="fas fa-lock text-gray-400 text-xs"></i>
                </div>
              </div>
              <p class="text-xs text-gray-500 mt-1">
                <i class="fas fa-sync-alt mr-1"></i>Updates with bookings
              </p>
            </div>
          </div>

          <div class="border-t pt-4 mt-4">
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

    // Total Seats and Available Seats are now auto-calculated from venue
    // No manual input handlers needed

    $(".add-section-btn").on("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const showtimeIndex = $(e.currentTarget).data("showtime");
      this.addPricingSection(showtimeIndex);
    });

    $(".add-first-section-btn").on("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const showtimeIndex = $(e.currentTarget).data("showtime");
      this.addPricingSection(showtimeIndex);
    });

    $(".add-custom-ticket-type-btn").on("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const showtimeIndex = $(e.currentTarget).data("showtime");
      this.addCustomTicketType(showtimeIndex);
    });

    $(".remove-section-btn").on("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
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

    $(".section-tier").on("change", (e) => {
      const showtimeIndex = $(e.currentTarget).data("showtime");
      const sectionIndex = $(e.currentTarget).data("section");
      if (this.showtimes[showtimeIndex]?.pricing?.sections[sectionIndex]) {
        this.showtimes[showtimeIndex].pricing.sections[sectionIndex].tier = $(
          e.currentTarget
        ).val();
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
  },

  async customizeSeatLayout(showtimeIndex) {
    const showtime = this.showtimes[showtimeIndex];
    const currentLayout = showtime.seatLayout || DEFAULT_SEAT_LAYOUT;

    const result = await Swal.fire({
      title:
        "<i class=\"fas fa-chair text-indigo-600 mr-2\"></i>Customize Seat Layout",
      html: SeatLayoutCustomizer.createDialog(currentLayout),
      width: "700px",
      showCancelButton: true,
      confirmButtonColor: SwalColors.primary,
      cancelButtonColor: SwalColors.cancel,
      confirmButtonText: "<i class=\"fas fa-check mr-1\"></i>Apply Layout",
      cancelButtonText: "<i class=\"fas fa-times mr-1\"></i>Cancel",
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
        `Seat layout updated! ${result.value.rows} rows × ${result.value.seatsPerRow
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
      title: "<i class=\"fas fa-chair text-green-600 mr-2\"></i>Edit Seats",
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
                  ${sections.length > 0
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
      confirmButtonText: "<i class=\"fas fa-save mr-1\"></i>Save Changes",
      cancelButtonText: "<i class=\"fas fa-times mr-1\"></i>Cancel",
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
            if (!$seatElement.length) {return;}

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
    return initializeSeatDetails(rows, seatsPerRow);
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
    const seatDetails = { ...(showtime.seatDetails || {}) };

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
        <div class="flex-1">
          <h5 class="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <i class="fas fa-layer-group text-indigo-600"></i>
            Price Tiers
          </h5>
          <p class="text-xs text-gray-500 mt-1">
            Create pricing tiers for different seating areas (e.g., Orchestra $100, Balcony $75, Gallery $50)
          </p>
        </div>
        <div class="flex gap-2">
          <button type="button" class="add-custom-ticket-type-btn text-sm px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors" data-showtime="${showtimeIndex}" title="Add special ticket types like Student, Senior, Group">
            <i class="fas fa-ticket-alt mr-1"></i>New Ticket Type
          </button>
          <button type="button" class="add-section-btn text-sm px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm" data-showtime="${showtimeIndex}">
            <i class="fas fa-plus mr-1"></i>Add Price Tier
          </button>
        </div>
      </div>
    `;

    if (sections.length === 0) {
      html += `
        <div class="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-dashed border-indigo-200 rounded-lg p-8 text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <i class="fas fa-layer-group text-2xl text-indigo-600"></i>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">No Price Tiers Yet</h3>
          <p class="text-sm text-gray-600 mb-2 max-w-md mx-auto">
            Create price tiers to organize your seating by area and price point
          </p>
          <p class="text-xs text-gray-500 mb-6 max-w-md mx-auto">
            <strong>Example:</strong> Orchestra ($150), Mezzanine ($100), Balcony ($75)
          </p>
          <button type="button" class="add-section-btn inline-flex items-center px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md" data-showtime="${showtimeIndex}">
            <i class="fas fa-plus mr-2"></i>Create First Price Tier
          </button>
        </div>
      `;
      return html;
    }

    sections.forEach((section, sectionIndex) => {
      html += `
        <div class="bg-white p-4 rounded-lg border border-gray-200 hover:border-indigo-300 transition-all" data-section-index="${sectionIndex}">
          <div class="flex justify-between items-start mb-3">
            <div class="flex items-center gap-3 flex-1">
              <div class="w-10 h-10 rounded-lg ${getTierBadge(
        section.tier
      )} flex items-center justify-center font-bold">
                ${String.fromCharCode(65 + sectionIndex)}
              </div>
              <div class="flex-1">
                <label class="block text-xs font-medium text-gray-600 mb-1">Tier Name</label>
                <input type="text" class="section-name text-base font-semibold text-gray-900 border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-indigo-500" 
                  value="${section.section}" 
                  placeholder="e.g., Orchestra, Balcony, Gallery" 
                  data-showtime="${showtimeIndex}" 
                  data-section="${sectionIndex}">
              </div>
            </div>
            <button type="button" class="remove-section-btn text-red-600 hover:bg-red-50 rounded-lg p-2 transition-colors" 
              data-showtime="${showtimeIndex}" 
              data-section="${sectionIndex}"
              title="Remove this price tier">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Tier</label>
              <select class="section-tier w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" 
                data-showtime="${showtimeIndex}" 
                data-section="${sectionIndex}">
                ${TIER_OPTIONS.map(
        (tier) =>
          `<option value="${tier}" ${section.tier === tier ? "selected" : ""
          }>${tier.charAt(0).toUpperCase() + tier.slice(1)}</option>`
      ).join("")}
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Base Price (HKD) <span class="text-red-500">*</span></label>
              <div class="relative">
                <span class="absolute left-3 top-3 text-gray-500">$</span>
                <input type="number" class="section-base-price w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" 
                  value="${section.basePrice || ""}" 
                  placeholder="500" 
                  min="0" 
                  step="10"
                  required
                  data-showtime="${showtimeIndex}" 
                  data-section="${sectionIndex}">
              </div>
            </div>
          </div>

        <div class="bg-gray-50 rounded-lg p-3 mt-3">${sectionIndex === 0 &&
          (this.ticketTypes || []).some(
            (t) => t.id && SYSTEM_TICKET_TYPE_IDS.includes(t.id)
          )
          ? `
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-2.5 mb-3 flex items-start gap-2">
              <i class="fas fa-info-circle text-blue-600 mt-0.5 text-sm"></i>
              <div class="flex-1">
                <p class="text-xs leading-relaxed text-blue-900">
                  <strong>Default ticket types</strong> - Customize in <a href="/admin/settings" data-link class="underline hover:text-blue-700">Settings</a>
                </p>
              </div>
            </div>
          `
          : ""
        }
          <div class="text-xs font-semibold text-gray-600 mb-3 flex items-center justify-between">
            <div class="flex items-center">
              <i class="fas fa-dollar-sign text-green-600 mr-1"></i>
              Pricing (${(this.ticketTypes || []).length} ticket types)
            </div>
            <a href="/admin/settings" data-link class="text-indigo-600 hover:text-indigo-800 text-xs font-normal flex items-center gap-1">
              <i class="fas fa-cog"></i>
              Manage Types
            </a>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            ${(this.ticketTypes || [])
          .map(
            (type) => `
              <div class="bg-white rounded-lg p-2 border border-gray-200 hover:border-indigo-300 transition-colors">
                <label class="block text-xs font-medium text-gray-700 mb-1 truncate" title="${type.name
              }">
                  ${type.name}
                  ${!SYSTEM_TICKET_TYPE_IDS.includes(type.id)
                ? "<i class=\"fas fa-star text-yellow-500 text-[8px] ml-1\" title=\"Custom type\"></i>"
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

  initializeFormValidation() {
    const touchedFields = new Set();

    const validateField = ($field) => {
      const fieldId = $field.attr("id") || $field.attr("name");

      if (!touchedFields.has(fieldId)) {
        return true;
      }

      const isValid = $field[0].checkValidity();

      if (isValid) {
        $field.removeClass("border-red-500 ring-red-500")
              .addClass("border-gray-300");
        $field.next(".validation-error").remove();
      } else {
        $field.removeClass("border-gray-300")
              .addClass("border-red-500 ring-red-500");

        if (!$field.next(".validation-error").length) {
          const errorMsg = $field[0].validationMessage || "This field is required";
          $field.after(`<p class="validation-error text-xs text-red-600 mt-1"><i class="fas fa-exclamation-circle mr-1"></i>${errorMsg}</p>`);
        }
      }

      return isValid;
    };

    $("#performanceModal").on("blur change", "input[required], select[required], textarea[required]", function() {
      const fieldId = $(this).attr("id") || $(this).attr("name");
      if (fieldId) {
        touchedFields.add(fieldId);
        validateField($(this));
      }
    });

    // Clear validation on input
    $("#performanceModal").on("input", "input, select, textarea", function() {
      const $field = $(this);
      const fieldId = $field.attr("id") || $field.attr("name");

      if (touchedFields.has(fieldId)) {
        validateField($field);
      }
    });

    $("#performanceForm").on("submit", function(e) {
      let isValid = true;

      $(this).find("input[required], select[required], textarea[required]").each(function() {
        const fieldId = $(this).attr("id") || $(this).attr("name");
        touchedFields.add(fieldId);
        if (!validateField($(this))) {
          isValid = false;
        }
      });

      if (!isValid) {
        e.preventDefault();
        e.stopImmediatePropagation();
        notify.error("Please fill in all required fields correctly");

        // Scroll to first error
        const $firstError = $(".border-red-500").first();
        if ($firstError.length) {
          $firstError[0].scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => $firstError.focus(), 300);
        }

        return false;
      }
    });
  },

  async handleSubmit(e) {
    e.preventDefault();

    const eventCategories = [];
    $(".event-category:checked").each(function () {
      eventCategories.push($(this).val());
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
        ageLimit: parseInt($("#ageLimit").val()) || 0,
        website: $("#website").val(),
      },
      ticketingInfo: {
        status: $("#status").val(),
        ticketSaleStart: $("#ticketSaleStart").val(),
        preOrderStartDate: $("#preOrderStartDate").val(),
        earlyBirdEndDate: $("#earlyBirdEndDate").val(),
        additionalInfo: $("#additionalInfo").val(),
      },
      duration: parseInt($("#duration").val()) || 0,
      venueId: $("#venueSelect").val(),
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

  async openQuickCreate() {
    const wizard = new PerformanceWizardHandler(
      this.venues,
      async (formData) => {
        await this.createPerformanceFromWizard(formData);
      }
    );

    await wizard.show();
  },

  async createPerformanceFromWizard(formData) {
    try {
      // Ensure venueId is a number
      const venueId = parseInt(formData.venueId);

      if (!venueId || isNaN(venueId)) {
        throw new Error("Valid venue selection is required");
      }

      // Validate showtimes
      if (!formData.showtimes || formData.showtimes.length === 0) {
        throw new Error("At least one showtime is required");
      }

      const venue = this.venues.find(v => v.id === venueId);
      if (!venue) {
        throw new Error("Selected venue not found");
      }

      const venueCapacity = venue.capacity || 200;

      const showtimes = formData.showtimes.map((st) => {
        const dateTimeStr = `${st.date}T${st.time}:00.000Z`;
        return {
          dateTime: dateTimeStr,
          totalSeats: venueCapacity,
          availableSeats: venueCapacity,
        };
      });

      const mainDate = `${formData.showtimes[0].date}T${formData.showtimes[0].time}:00.000Z`;

      const performanceData = {
        title: formData.title,
        composer: formData.composer,
        conductor: formData.conductor,
        description: formData.description,
        duration: parseInt(formData.duration) || 120,
        category: formData.genre || "symphony",
        venueId: venueId,
        status: "upcoming",
        date: mainDate, // Required field for the backend
        showtimes: showtimes,
        pricingSections: [
          {
            section: "Standard",
            basePrice: parseFloat(formData.basePrice),
            tier: "standard",
          },
        ],
      };

      if (formData.vipPrice) {
        performanceData.pricingSections.push({
          section: "VIP",
          basePrice: formData.vipPrice,
          tier: "vip",
        });
      }

      if (formData.premiumPrice) {
        performanceData.pricingSections.push({
          section: "Premium",
          basePrice: formData.premiumPrice,
          tier: "premium",
        });
      }

      if (formData.economyPrice) {
        performanceData.pricingSections.push({
          section: "Economy",
          basePrice: formData.economyPrice,
          tier: "economy",
        });
      }

      delete performanceData.id;

      console.log("Final performanceData being sent to API:", performanceData);

      await performanceAPI.create(performanceData);

      const response = await performanceAPI.getAll();
      this.performances = ResponseExtractor.extract(response, "performances");
      this.displayPerformances(this.performances);

      notify.success("Performance created successfully!");
    } catch (error) {
      console.error("Error creating performance:", error);
      handleApiError(error, "Failed to create performance");
      throw error;
    }
  },

  async quickEdit(id) {
    const performance = this.getPerformanceById(id);
    if (!performance) {return;}

    await openQuickEdit(performance, this.venues, async (updatedData) => {
      await this.updatePerformanceFromWizard(id, updatedData);
    });
  },

  async updatePerformanceFromWizard(id, formData) {
    try {
      await performanceAPI.update(id, formData);

      const response = await performanceAPI.getAll();
      this.performances = ResponseExtractor.extract(response, "performances");
      this.displayPerformances(this.performances);

      notify.success("Performance updated successfully!");
    } catch (error) {
      console.error("Error updating performance:", error);
      handleApiError(error, "Failed to update performance");
      throw error;
    }
  },

  async editPerformance(id) {
    const performance = this.getPerformanceById(id);
    if (performance) {
      await this.quickEdit(id);
    }
  },

  async viewPerformance(id) {
    const performance = this.getPerformanceById(id);
    if (!performance) {
      notify.error("Performance not found");
      return;
    }

    // Navigate to the dedicated performance details page
    page.redirect(`/admin/performances/${id}`);
  },

  generatePerformanceDetailsHTML(performance, venue, showtimes, ticketTypes) {
    return PerformanceDetails.render(
      performance,
      venue,
      showtimes,
      ticketTypes
    );
  },

  _legacyRenderShowtimesSection(showtimes) {
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
    const imageUrl = getPerformanceImageUrl(performance.image || performance.imageUrl);

    return imageUrl
      ? `<div class="mb-4">
           <img 
             src="${imageUrl}" 
             class="w-full h-48 object-cover rounded-lg" 
             onerror="this.onerror=null; this.src='${getImageFallbackSvg()}';"
             alt="Performance image"
           />
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
          ${st.available !== undefined
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
          <span class="font-medium text-gray-900">${tt.sectionName || tt.name || tt.section || "Unnamed Section"
      }</span>
          ${tierBadge}
        </div>
        <span class="text-indigo-600 font-semibold">HKD ${tt.basePrice || tt.price || "N/A"
      }</span>
      </div>
    `;
  },

  async duplicatePerformance(id) {
    const performance = this.getPerformanceById(id);
    if (!performance) {return;}

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
    if (!performance || !performance.showtimes) {return;}

    const showtime = performance.showtimes[showtimeIndex];
    if (!showtime) {return;}

    await Swal.fire({
      title: "<i class=\"fas fa-info-circle text-blue-600 mr-2\"></i>Showtime Details",
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
          <h3 class="font-bold text-lg text-gray-900 mb-1">${performance.title
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

        ${sections.length > 0
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
            Showtime ID: <code class="bg-blue-100 px-2 py-0.5 rounded text-xs font-mono">${showtime.id
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
            <span class="font-medium text-gray-900">${section.sectionName || section.name
          }</span>
            ${section.tier
            ? `<span class="text-xs px-2 py-0.5 rounded-full ${getTierBadge(
              section.tier
            )}">${section.tier}</span>`
            : ""
          }
          </div>
          <span class="font-semibold text-indigo-600">HKD ${section.basePrice || section.price
          }</span>
        </div>
      `
      )
      .join("");
  },

  async viewShowtimeBookings(performanceId, showtimeId) {
    const performance = this.performances.find((p) => p.id === performanceId);
    if (!performance) {return;}

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
                <div class="font-semibold text-gray-900">${booking.customerInfo?.name || "Guest"
              }</div>
                <div class="text-xs text-gray-500">${booking.customerInfo?.email || "N/A"
              }</div>
              </div>
              <div class="text-right">
                ${getStatusBadge(booking.status, "booking")}
              </div>
            </div>

            <div class="flex items-center gap-4 text-xs text-gray-600">
              <span class="flex items-center gap-1">
                <i class="fas fa-ticket-alt text-indigo-600"></i>
                ${booking.seats?.length || 0} seat${booking.seats?.length !== 1 ? "s" : ""
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

            ${booking.seats?.length > 0
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
        : "<div class=\"text-center py-8 text-gray-500\"><i class=\"fas fa-inbox text-3xl mb-2\"></i><p>No bookings for this showtime yet</p></div>";

    const totalRevenue = bookings
      .filter((b) => b.status !== "cancelled")
      .reduce((sum, b) => sum + (b.amount || 0), 0);
    const totalSeatsBooked = bookings
      .filter((b) => b.status !== "cancelled")
      .reduce((sum, b) => sum + (b.seats?.length || 0), 0);

    await Swal.fire({
      title: "<i class=\"fas fa-ticket-alt text-green-600 mr-2\"></i>Showtime Bookings",
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
    if (!performance) {return;}

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
              <div>Seats per row: <span class="font-semibold">${layout.seatsPerRow
        }</span></div>
              <div>Total seats: <span class="font-semibold">${layout.rows * layout.seatsPerRow
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
            <div>Total capacity: <span class="font-semibold">${venue.capacity || venueService.calculateCapacity(venue.layout)
      }</span> seats</div>
            <div>Sections: <span class="font-semibold">${venue.layout.sections.length
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
                  ${section.rows} rows × ${section.seatsPerRow} seats = ${section.rows * section.seatsPerRow
            } total
                  <span class="ml-2 px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs">${section.tier
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
        "<i class=\"fas fa-layer-group text-orange-600 mr-2\"></i>Manage Pricing Zones",
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
                  ? "<p class=\"text-gray-500 text-sm\">No zones defined. Click \"Add Zone\" to create your first pricing zone.</p>"
                  : showtime.pricingZones
                    .map((zone, index) => {
                      const colorClass = zone.color.replace("#", "");
                      return `
                  <div class="zone-item border border-gray-300 rounded-lg p-4" data-zone-index="${index}">
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded" style="background-color: ${zone.color}"></div>
                        <div>
                          <h4 class="font-semibold text-gray-900">${zone.name}</h4>
                          <p class="text-xs text-gray-600">${zone.seats.length} seats</p>
                        </div>
                      </div>
                      <button type="button" class="delete-zone-btn" data-zone-index="${index}">
                        <i class="fas fa-trash-alt text-red-600"></i>
                      </button>
                    </div>
                    <button type="button" class="assign-zone-seats-btn" data-zone-index="${index}">
                      Assign Seats
                    </button>
                  </div>
                `;
                    })
                    .join("")
              );
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
                  <div class="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                    <p class="text-sm">Click seats on the map to add/remove them from this zone</p>
                    <p class="text-xs text-gray-600 mt-1">Currently assigned: <span id="zone-seat-count" class="font-bold">${zone.seats.length}</span> seats</p>
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

  cleanup() {
    if (this.performanceFilter) {
      this.performanceFilter.destroy();
      this.performanceFilter = null;
    }
  },
};
