import { performanceService } from "/src/services/dataService.js";
import { getStatusBadge } from "/src/utils/status.js";
import { createDebounceSearch } from "/src/utils/data/filters.js";
import { createModal, openModal, closeModal } from "/src/components/Modal.js";
import {
  createImageUpload,
  initImageUpload,
  getImageDataURL,
} from "/src/components/ImageUpload.js";
import { notify } from "/src/utils/ui/notification.js";
import { storage } from "/src/services/storageService.js";
import { MOCK_VENUES } from "/src/data/mockData.js";
import { ticketTypeService } from "/src/services/ticketTypeService.js";
import { templateService } from "/src/services/templateService.js";
import { venueService } from "/src/services/venueService.js";
import {
  createTemplateSelector,
  initTemplateSelector,
} from "/src/components/TemplateSelector.js";
import {
  createZoneEditor,
  showZoneEditorDialog,
} from "/src/components/ZoneEditor.js";
import { seatMapGenerator } from "/src/utils/booking/seatMapGenerator.js";
import { showtimeManager } from "/src/utils/booking/showtimeManager.js";
import { formValidator } from "/src/utils/forms/formValidator.js";
import { performanceOptimizer } from "/src/utils/performance.js";
import dayjs from "dayjs";
import Swal from "sweetalert2";

export default {
  title: "Manage Performances | Admin",

  currentPerformance: null,
  showtimes: [],
  groupDiscounts: [],
  ticketTypes: [],

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
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              id="searchInput"
              placeholder="Search performances..."
              class="text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <select
              id="statusFilter"
              class="text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="on_sale">On Sale</option>
              <option value="sold_out">Sold Out</option>
            </select>
            <input
              type="date"
              id="dateFilter"
              class="text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
<button
  id="clearFilters"
  class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-transparent border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 active:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
>
  <i class="fas fa-filter-circle-xmark"></i>
  Clear Filters
</button>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Image</th>
                <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Title</th>
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
      this.performances = await performanceService.getAll();
      this.displayPerformances(this.performances);
      this.setupEventListeners();
      this.renderPerformanceModal();
    } catch (error) {
      console.error("Error loading performances:", error);
    }
  },

  displayPerformances(data) {
    const $tbody = $("#performancesTable");
    $tbody.empty();

    if (!data || data.length === 0) {
      $tbody.append(`
        <tr>
          <td colspan="6" class="px-6 py-8 text-center text-gray-500">
            No performances found. Click "Add Performance" to create one.
          </td>
        </tr>
      `);
      return;
    }

    data.forEach((perf) => {
      const statusBadge = getStatusBadge(
        perf.ticketingInfo?.status || "upcoming",
        "performance"
      );
      const imageHtml = perf.imageUrl
        ? `<img src="${perf.imageUrl}" class="h-16 w-16 object-cover rounded" />`
        : `<div class="h-16 w-16 bg-gray-200 rounded flex items-center justify-center"><i class="fas fa-image text-gray-400"></i></div>`;

      $tbody.append(`
        <tr class="hover:bg-gray-50">
          <td class="px-6 py-4">${imageHtml}</td>
          <td class="px-6 py-4">
            <div class="text-sm font-medium text-gray-900">${perf.title}</div>
            <div class="text-xs text-gray-500">${perf.orchestra || "N/A"}</div>
          </td>
          <td class="px-6 py-4 text-sm text-gray-600">${perf.composer}</td>
          <td class="px-6 py-4 text-sm text-gray-600">${perf.conductor}</td>
          <td class="px-6 py-4">${statusBadge}</td>
          <td class="px-6 py-4">
            <div class="flex gap-2">
              <button class="edit-btn text-indigo-600 hover:text-indigo-800 transition-colors" data-id="${
                perf.id
              }" title="Edit">
                <i class="fas fa-edit"></i>
              </button>
              <button class="delete-btn text-red-600 hover:text-red-800 transition-colors" data-id="${
                perf.id
              }" title="Delete">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `);
    });

    $(".edit-btn").on("click", (e) => {
      const id = $(e.currentTarget).data("id");
      this.editPerformance(id);
    });

    $(".delete-btn").on("click", (e) => {
      const id = $(e.currentTarget).data("id");
      this.deletePerformance(id);
    });
  },

  setupEventListeners() {
    const debouncedFilter = createDebounceSearch(
      () => this.filterPerformances(),
      300
    );

    $("#searchInput").on("input", debouncedFilter);
    $("#statusFilter, #dateFilter").on("change", () =>
      this.filterPerformances()
    );
    $("#clearFilters").on("click", () => this.clearFilters());
    $("#addPerformanceBtn").on("click", () => this.openPerformanceForm());
  },

  filterPerformances() {
    const search = $("#searchInput").val().toLowerCase();
    const status = $("#statusFilter").val();

    let filtered = this.performances.filter((p) => {
      const matchesSearch =
        !search ||
        p.title.toLowerCase().includes(search) ||
        p.composer.toLowerCase().includes(search);

      const matchesStatus = !status || p.ticketingInfo?.status === status;

      return matchesSearch && matchesStatus;
    });

    this.displayPerformances(filtered);
  },

  clearFilters() {
    $("#searchInput, #dateFilter, #statusFilter").val("");
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
        <div class="bg-gray-50 p-6 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            <i class="fas fa-info-circle text-indigo-600 mr-2"></i>Basic Information
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="md:col-span-2">
              ${createImageUpload({
                id: "performanceImage",
                label: "Performance Image",
                shape: "rounded-lg",
                previewSize: "32",
                helpText:
                  "PNG, JPG, GIF up to 5MB - Recommended size 800x600px",
              })}
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Title <span class="text-red-500">*</span>
              </label>
              <input type="text" id="title" required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Symphony No. 9 - Beethoven" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Composer <span class="text-red-500">*</span>
              </label>
              <input type="text" id="composer" required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Ludwig van Beethoven" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Conductor <span class="text-red-500">*</span>
              </label>
              <input type="text" id="conductor" required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="John Eliot Gardiner" />
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Orchestra <span class="text-red-500">*</span>
              </label>
              <input type="text" id="orchestra" required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Hong Kong Philharmonic Orchestra" />
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Description <span class="text-red-500">*</span>
              </label>
              <textarea id="description" required rows="4"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Experience Beethoven's monumental Ninth Symphony featuring the iconic Ode to Joy"></textarea>
            </div>
          </div>
        </div>

        <div class="bg-gray-50 p-6 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            <i class="fas fa-theater-masks text-indigo-600 mr-2"></i>Performance Information
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Presenter <span class="text-red-500">*</span>
              </label>
              <input type="text" id="presenter" required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Hong Kong Philharmonic Orchestra" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Event Categories <span class="text-red-500">*</span>
              </label>
              <div class="space-y-2">
                <div class="flex items-center">
                  <input type="checkbox" id="cat_western" value="Western Instrumental Music" class="mr-2 event-category">
                  <label for="cat_western" class="text-sm">Western Instrumental Music</label>
                </div>
                <div class="flex items-center">
                  <input type="checkbox" id="cat_symphony" value="Symphony" class="mr-2 event-category">
                  <label for="cat_symphony" class="text-sm">Symphony</label>
                </div>
                <div class="flex items-center">
                  <input type="checkbox" id="cat_chamber" value="Chamber Music" class="mr-2 event-category">
                  <label for="cat_chamber" class="text-sm">Chamber Music</label>
                </div>
                <div class="flex items-center">
                  <input type="checkbox" id="cat_concerto" value="Concerto" class="mr-2 event-category">
                  <label for="cat_concerto" class="text-sm">Concerto</label>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Mode of Tickets <span class="text-red-500">*</span>
              </label>
              <div class="space-y-2">
                <div class="flex items-center">
                  <input type="checkbox" id="mode_printed" value="Printed Ticket" class="mr-2 ticket-mode">
                  <label for="mode_printed" class="text-sm">Printed Ticket</label>
                </div>
                <div class="flex items-center">
                  <input type="checkbox" id="mode_eticket" value="e-Ticket" class="mr-2 ticket-mode">
                  <label for="mode_eticket" class="text-sm">e-Ticket</label>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Age Limit <span class="text-red-500">*</span>
              </label>
              <select id="ageLimit" required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="">Select age limit</option>
                <option value="0">No age limit</option>
                <option value="3">3+</option>
                <option value="6">6+</option>
                <option value="12">12+</option>
                <option value="18">18+</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Duration
              </label>
              <input type="text" id="duration"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Approx. 75 minutes" />
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <input type="url" id="website"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="https://www.example.com" />
            </div>
          </div>
        </div>

        <div class="bg-gray-50 p-6 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            <i class="fas fa-ticket-alt text-indigo-600 mr-2"></i>Ticketing Information
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Status <span class="text-red-500">*</span>
              </label>
              <select id="status" required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="upcoming">Upcoming</option>
                <option value="early_bird">Early Bird</option>
                <option value="on_sale">On Sale</option>
                <option value="sold_out">Sold Out</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Ticket Sale Start <span class="text-red-500">*</span>
              </label>
              <input type="datetime-local" id="ticketSaleStart" required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Pre-order Start Date
              </label>
              <input type="date" id="preOrderStartDate"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Early Bird End Date
              </label>
              <input type="date" id="earlyBirdEndDate"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Interval Information
              </label>
              <input type="text" id="interval"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="One 20-minute interval" />
            </div>

            <div class="md:col-span-2">
              <label class="flex items-center">
                <input type="checkbox" id="eTicketAvailable" class="mr-2">
                <span class="text-sm font-medium text-gray-700">E-ticket Available</span>
              </label>
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Additional Information
              </label>
              <textarea id="additionalInfo" rows="3"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Any additional ticketing information..."></textarea>
            </div>
          </div>
        </div>

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
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="10" />
                </div>
                <div>
                  <label class="block text-xs text-gray-600 mb-1">Discount Type</label>
                  <select id="groupDiscountType"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    <option value="percentage">Percentage (%)</option>
                    <option value="amount">Fixed Amount ($)</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs text-gray-600 mb-1">
                    <span id="groupDiscountLabel">Discount (%)</span>
                  </label>
                  <input type="number" id="groupDiscount" min="0"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="10" />
                </div>
                <div>
                  <label class="block text-xs text-gray-600 mb-1">Note</label>
                  <input type="text" id="groupNote"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="10% off for groups" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-gray-50 p-6 rounded-lg">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900">
              <i class="fas fa-calendar-alt text-indigo-600 mr-2"></i>Showtimes & Pricing
            </h3>
            <button type="button" id="addShowtimeBtn"
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <i class="fas fa-plus mr-2"></i>Add Showtime
            </button>
          </div>
          <div id="showtimesContainer" class="space-y-4">
          </div>
        </div>

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

  async addCustomTicketType(showtimeIndex) {
    const result = await Swal.fire({
      title:
        '<i class="fas fa-ticket-alt text-green-600 mr-2"></i>Add Custom Ticket Type',
      html: `
        <div class="text-left space-y-4">
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
                  <span class="text-sm">Discount</span>
                </label>
                <label class="flex items-center">
                  <input type="radio" name="pricingModifier" value="markup" class="mr-2">
                  <span class="text-sm">Markup</span>
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
        const pricingType = document.getElementById("pricingType");
        const pricingValue = document.getElementById("pricingValue");
        const pricingPreview = document.getElementById("pricingPreview");

        pricingType.addEventListener("change", (e) => {
          if (e.target.value === "none") {
            pricingValue.disabled = true;
            pricingValue.value = "";
            pricingPreview.classList.add("hidden");
          } else {
            pricingValue.disabled = false;
            pricingPreview.classList.remove("hidden");
            updatePreview();
          }
        });

        pricingValue.addEventListener("input", updatePreview);
        document
          .querySelectorAll('input[name="pricingModifier"]')
          .forEach((radio) => {
            radio.addEventListener("change", updatePreview);
          });

        function updatePreview() {
          const type = pricingType.value;
          const value = parseFloat(pricingValue.value) || 0;
          const modifier = document.querySelector(
            'input[name="pricingModifier"]:checked'
          ).value;

          if (type === "none" || !value) {
            pricingPreview.classList.add("hidden");
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

          pricingPreview.textContent = example;
          pricingPreview.classList.remove("hidden");
        }
      },
      preConfirm: () => {
        const name = document
          .getElementById("customTicketTypeName")
          .value.trim();
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

        const pricingType = document.getElementById("pricingType").value;
        const pricingValue =
          parseFloat(document.getElementById("pricingValue").value) || 0;
        const pricingModifier = document.querySelector(
          'input[name="pricingModifier"]:checked'
        ).value;

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
              <input type="datetime-local" class="showtime-datetime w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                ${MOCK_VENUES.map(
                  (v) =>
                    `<option value="${v.id}" ${
                      showtime.venueId == v.id ? "selected" : ""
                    }>${v.name}</option>`
                ).join("")}
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
      const venue = MOCK_VENUES.find((v) => v.id === venueId);
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
    const currentLayout = showtime.seatLayout || { rows: 5, seatsPerRow: 8 };

    const result = await Swal.fire({
      title:
        '<i class="fas fa-chair text-indigo-600 mr-2"></i>Customize Seat Layout',
      html: `
        <div class="text-left p-4">
          <div class="grid grid-cols-2 gap-6 mb-6">
            <div class="bg-gray-50 p-4 rounded-lg">
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                <i class="fas fa-arrows-alt-v text-indigo-600 mr-1"></i>Number of Rows
              </label>
              <div class="flex items-center gap-2">
                <button type="button" id="decrease-rows" class="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors">
                  <i class="fas fa-minus"></i>
                </button>
                <input type="number" id="swal-rows" class="swal2-input flex-1 text-center" value="${
                  currentLayout.rows
                }" min="1" max="20" style="margin: 0; padding: 8px;">
                <button type="button" id="increase-rows" class="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors">
                  <i class="fas fa-plus"></i>
                </button>
              </div>
              <input type="range" id="rows-slider" min="1" max="20" value="${
                currentLayout.rows
              }" class="w-full mt-2">
              <p class="text-xs text-gray-500 mt-1">Min: 1, Max: 20</p>
            </div>

            <div class="bg-gray-50 p-4 rounded-lg">
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                <i class="fas fa-arrows-alt-h text-indigo-600 mr-1"></i>Seats Per Row
              </label>
              <div class="flex items-center gap-2">
                <button type="button" id="decrease-seats" class="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors">
                  <i class="fas fa-minus"></i>
                </button>
                <input type="number" id="swal-seatsPerRow" class="swal2-input flex-1 text-center" value="${
                  currentLayout.seatsPerRow
                }" min="1" max="30" style="margin: 0; padding: 8px;">
                <button type="button" id="increase-seats" class="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors">
                  <i class="fas fa-plus"></i>
                </button>
              </div>
              <input type="range" id="seats-slider" min="1" max="30" value="${
                currentLayout.seatsPerRow
              }" class="w-full mt-2">
              <p class="text-xs text-gray-500 mt-1">Min: 1, Max: 30</p>
            </div>
          </div>

          <div class="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4 mb-4">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-semibold text-gray-800">
                <i class="fas fa-eye text-indigo-600 mr-1"></i>Live Preview
              </h4>
              <div class="text-sm">
                <span class="font-semibold text-indigo-600" id="preview-total">40</span>
                <span class="text-gray-600"> seats</span>
              </div>
            </div>
            <div id="preview-container" class="flex justify-center overflow-auto" style="max-height: 300px;">
              ${this.generatePreviewSVG(
                currentLayout.rows,
                currentLayout.seatsPerRow
              )}
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3 text-center">
            <div class="bg-blue-50 p-3 rounded-lg">
              <div class="text-xs text-gray-600 mb-1">Rows</div>
              <div class="text-xl font-bold text-blue-600" id="display-rows">${
                currentLayout.rows
              }</div>
            </div>
            <div class="bg-green-50 p-3 rounded-lg">
              <div class="text-xs text-gray-600 mb-1">Per Row</div>
              <div class="text-xl font-bold text-green-600" id="display-seats">${
                currentLayout.seatsPerRow
              }</div>
            </div>
            <div class="bg-purple-50 p-3 rounded-lg">
              <div class="text-xs text-gray-600 mb-1">Total</div>
              <div class="text-xl font-bold text-purple-600" id="display-total">${
                currentLayout.rows * currentLayout.seatsPerRow
              }</div>
            </div>
          </div>

          <div class="mt-4 flex gap-2">
            <button type="button" id="preset-small" class="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-xs transition-colors">
              <i class="fas fa-compress-alt mr-1"></i>Small (4x6)
            </button>
            <button type="button" id="preset-medium" class="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-xs transition-colors">
              <i class="fas fa-th mr-1"></i>Medium (5x8)
            </button>
            <button type="button" id="preset-large" class="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-xs transition-colors">
              <i class="fas fa-expand-alt mr-1"></i>Large (8x12)
            </button>
          </div>
        </div>
      `,
      width: "700px",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#6b7280",
      confirmButtonText: '<i class="fas fa-check mr-1"></i>Apply Layout',
      cancelButtonText: '<i class="fas fa-times mr-1"></i>Cancel',
      didOpen: () => {
        const updatePreview = () => {
          const rows =
            parseInt(document.getElementById("swal-rows").value) || 5;
          const seats =
            parseInt(document.getElementById("swal-seatsPerRow").value) || 8;
          const total = rows * seats;

          document.getElementById("preview-container").innerHTML =
            this.generatePreviewSVG(rows, seats);
          document.getElementById("preview-total").textContent = total;
          document.getElementById("display-rows").textContent = rows;
          document.getElementById("display-seats").textContent = seats;
          document.getElementById("display-total").textContent = total;
        };

        document.getElementById("swal-rows").addEventListener("input", (e) => {
          document.getElementById("rows-slider").value = e.target.value;
          updatePreview();
        });

        document
          .getElementById("swal-seatsPerRow")
          .addEventListener("input", (e) => {
            document.getElementById("seats-slider").value = e.target.value;
            updatePreview();
          });

        document
          .getElementById("rows-slider")
          .addEventListener("input", (e) => {
            document.getElementById("swal-rows").value = e.target.value;
            updatePreview();
          });

        document
          .getElementById("seats-slider")
          .addEventListener("input", (e) => {
            document.getElementById("swal-seatsPerRow").value = e.target.value;
            updatePreview();
          });

        document
          .getElementById("decrease-rows")
          .addEventListener("click", () => {
            const input = document.getElementById("swal-rows");
            const current = parseInt(input.value);
            if (current > 1) {
              input.value = current - 1;
              document.getElementById("rows-slider").value = current - 1;
              updatePreview();
            }
          });

        document
          .getElementById("increase-rows")
          .addEventListener("click", () => {
            const input = document.getElementById("swal-rows");
            const current = parseInt(input.value);
            if (current < 20) {
              input.value = current + 1;
              document.getElementById("rows-slider").value = current + 1;
              updatePreview();
            }
          });

        document
          .getElementById("decrease-seats")
          .addEventListener("click", () => {
            const input = document.getElementById("swal-seatsPerRow");
            const current = parseInt(input.value);
            if (current > 1) {
              input.value = current - 1;
              document.getElementById("seats-slider").value = current - 1;
              updatePreview();
            }
          });

        document
          .getElementById("increase-seats")
          .addEventListener("click", () => {
            const input = document.getElementById("swal-seatsPerRow");
            const current = parseInt(input.value);
            if (current < 30) {
              input.value = current + 1;
              document.getElementById("seats-slider").value = current + 1;
              updatePreview();
            }
          });

        document
          .getElementById("preset-small")
          .addEventListener("click", () => {
            document.getElementById("swal-rows").value = 4;
            document.getElementById("swal-seatsPerRow").value = 6;
            document.getElementById("rows-slider").value = 4;
            document.getElementById("seats-slider").value = 6;
            updatePreview();
          });

        document
          .getElementById("preset-medium")
          .addEventListener("click", () => {
            document.getElementById("swal-rows").value = 5;
            document.getElementById("swal-seatsPerRow").value = 8;
            document.getElementById("rows-slider").value = 5;
            document.getElementById("seats-slider").value = 8;
            updatePreview();
          });

        document
          .getElementById("preset-large")
          .addEventListener("click", () => {
            document.getElementById("swal-rows").value = 8;
            document.getElementById("swal-seatsPerRow").value = 12;
            document.getElementById("rows-slider").value = 8;
            document.getElementById("seats-slider").value = 12;
            updatePreview();
          });
      },
      preConfirm: () => {
        const rows = parseInt(document.getElementById("swal-rows").value);
        const seatsPerRow = parseInt(
          document.getElementById("swal-seatsPerRow").value
        );

        if (!rows || rows < 1 || rows > 20) {
          Swal.showValidationMessage("Rows must be between 1 and 20");
          return false;
        }
        if (!seatsPerRow || seatsPerRow < 1 || seatsPerRow > 30) {
          Swal.showValidationMessage("Seats per row must be between 1 and 30");
          return false;
        }

        return { rows, seatsPerRow };
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
    const layout = showtime.seatLayout || { rows: 5, seatsPerRow: 8 };

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
        <div class="text-left p-4">
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

          <div class="flex gap-2 text-xs flex-wrap">
            <div class="flex items-center gap-1">
              <div class="w-4 h-4 rounded" style="background-color: #10b981"></div>
              <span>Available</span>
            </div>
            <div class="flex items-center gap-1">
              <div class="w-4 h-4 bg-yellow-500 rounded"></div>
              <span>Selected</span>
            </div>
            <div class="flex items-center gap-1">
              <div class="w-4 h-4 rounded" style="background-color: #ef4444"></div>
              <span>Blocked</span>
            </div>
            <div class="flex items-center gap-1">
              <div class="w-4 h-4 rounded" style="background-color: #f59e0b"></div>
              <span>Reserved</span>
            </div>
            ${sections
              .map(
                (s, idx) => `
            <div class="flex items-center gap-1">
              <div class="w-4 h-4 rounded" style="background-color: ${this.getSectionColor(
                idx
              )}"></div>
              <span>${s.section}</span>
            </div>
            `
              )
              .join("")}
          </div>
        </div>
      `,
      width: "800px",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
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
          document.getElementById("interactive-seat-map").innerHTML = mapHTML;

          document.querySelectorAll(".interactive-seat").forEach((seat) => {
            seat.addEventListener("click", function (e) {
              e.stopPropagation();
              const seatElement = e.target.closest(".interactive-seat");
              if (!seatElement) return;

              const seatId = seatElement.dataset.seatId;
              const index = selectedSeats.indexOf(seatId);

              if (index > -1) {
                selectedSeats.splice(index, 1);
              } else {
                selectedSeats.push(seatId);
              }

              document.getElementById("selected-count").textContent =
                selectedSeats.length;
              renderInteractiveMap();
            });
          });
        };

        renderInteractiveMap();

        document
          .getElementById("select-all-btn")
          .addEventListener("click", () => {
            selectedSeats = [];
            for (let row = 0; row < layout.rows; row++) {
              for (let seat = 0; seat < layout.seatsPerRow; seat++) {
                const rowLetter = String.fromCharCode(65 + row);
                const seatNumber = seat + 1;
                selectedSeats.push(`${rowLetter}${seatNumber}`);
              }
            }
            document.getElementById("selected-count").textContent =
              selectedSeats.length;
            renderInteractiveMap();
          });

        document
          .getElementById("clear-selection-btn")
          .addEventListener("click", () => {
            selectedSeats = [];
            document.getElementById("selected-count").textContent = 0;
            renderInteractiveMap();
          });

        document
          .getElementById("apply-changes-btn")
          .addEventListener("click", () => {
            if (selectedSeats.length === 0) {
              notify.warning("Please select at least one seat");
              return;
            }

            const typeSelectEl = document.getElementById("seat-type");
            const seatType = typeSelectEl.value;
            const category = document.getElementById("seat-category").value;
            const companion = document
              .getElementById("seat-companion")
              .value.trim();
            const notes = document.getElementById("seat-notes").value.trim();

            if (!seatType && !category && !companion && !notes) {
              notify.warning("Please make at least one change to apply");
              return;
            }

            selectedSeats.forEach((seatId) => {
              if (!showtime.seatDetails[seatId]) {
                showtime.seatDetails[seatId] = {};
              }

              if (seatType) {
                const selectedOption =
                  typeSelectEl.options[typeSelectEl.selectedIndex];
                const sectionIndex = selectedOption.dataset.sectionIndex;

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
                showtime.seatDetails[seatId].companion =
                  companion.toUpperCase();
              }
              if (notes) {
                showtime.seatDetails[seatId].notes = notes;
              }
            });

            notify.success(
              `Applied changes to ${selectedSeats.length} seat(s)`
            );
            selectedSeats = [];
            document.getElementById("selected-count").textContent = 0;
            document.getElementById("seat-type").value = "";
            document.getElementById("seat-category").value = "";
            document.getElementById("seat-companion").value = "";
            document.getElementById("seat-notes").value = "";
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
    return seatMapGenerator.initializeSeatDetails(rows, seatsPerRow);
  },

  getSectionColor(index) {
    const colors = [
      "#a855f7",
      "#3b82f6",
      "#ec4899",
      "#f59e0b",
      "#10b981",
      "#6366f1",
      "#f97316",
      "#14b8a6",
    ];
    return colors[index % colors.length];
  },

  getSeatColorForShowtime(seatDetail, showtime) {
    const systemColors = {
      available: "#10b981",
      blocked: "#ef4444",
      reserved: "#f59e0b",
    };

    if (seatDetail.sectionIndex !== undefined) {
      return this.getSectionColor(seatDetail.sectionIndex);
    }

    return systemColors[seatDetail.status] || "#10b981";
  },

  generateInteractiveSeatMap(rows, seats, seatDetails, selectedSeats) {
    return seatMapGenerator.generateInteractiveSeatMap(
      rows,
      seats,
      seatDetails,
      selectedSeats,
      (seatDetail) => this.getSeatColorForShowtime(seatDetail)
    );
  },

  generatePreviewSVG(rows, seats) {
    const seatSize = 18;
    const seatGap = 4;
    const stageWidth = seats * (seatSize + seatGap) + seatGap;
    const stageHeight = 24;
    const stagePadding = 15;
    const svgWidth = stageWidth + stagePadding * 2;
    const svgHeight =
      rows * (seatSize + seatGap) + stageHeight + stagePadding * 3;

    let seatsHTML = "";
    for (let row = 0; row < rows; row++) {
      const rowY =
        stagePadding + stageHeight + stagePadding + row * (seatSize + seatGap);
      for (let seat = 0; seat < seats; seat++) {
        const seatX = stagePadding + seat * (seatSize + seatGap);
        seatsHTML += `<rect x="${seatX}" y="${rowY}" width="${seatSize}" height="${seatSize}" fill="#10b981" rx="2" />`;
      }
    }

    return `
      <svg width="${svgWidth}" height="${svgHeight}" class="bg-white rounded shadow-sm">
        <rect x="${stagePadding}" y="${stagePadding}" width="${stageWidth}" height="${stageHeight}" fill="#374151" rx="3" />
        <text x="${svgWidth / 2}" y="${
      stagePadding + stageHeight / 2 + 4
    }" fill="white" text-anchor="middle" font-size="11" font-weight="bold">STAGE</text>
        ${seatsHTML}
      </svg>
    `;
  },

  renderSeatPlanSVG(showtime, showtimeIndex) {
    let rows = 5;
    let seatsPerRow = 8;

    if (showtime.seatLayout) {
      rows = showtime.seatLayout.rows;
      seatsPerRow = showtime.seatLayout.seatsPerRow;
    } else if (showtime.venueId) {
      const venue = MOCK_VENUES.find((v) => v.id === showtime.venueId);
      if (venue?.layout?.sections?.[0]) {
        rows = venue.layout.sections[0].rows || 5;
        seatsPerRow = venue.layout.sections[0].seatsPerRow || 8;
      }
    }

    const seatSize = 24;
    const seatGap = 6;
    const stageWidth = seatsPerRow * (seatSize + seatGap) + seatGap;
    const stageHeight = 30;
    const stagePadding = 20;
    const svgWidth = stageWidth + stagePadding * 2;
    const svgHeight =
      rows * (seatSize + seatGap) + stageHeight + stagePadding * 3;

    const sections = showtime.pricing?.sections || [];
    const seatDetails = showtime.seatDetails || {};

    let seatsHTML = "";
    for (let row = 0; row < rows; row++) {
      const rowY =
        stagePadding + stageHeight + stagePadding + row * (seatSize + seatGap);
      const sectionIndex = Math.floor(
        (row / rows) * Math.min(sections.length, 4)
      );
      const defaultSeatColor = this.getSectionColor(sectionIndex);

      for (let seat = 0; seat < seatsPerRow; seat++) {
        const seatX = stagePadding + seat * (seatSize + seatGap);
        const rowLetter = String.fromCharCode(65 + row);
        const seatNumber = seat + 1;
        const seatId = `${rowLetter}${seatNumber}`;

        const seatDetail = seatDetails[seatId];
        let seatColor = seatDetail
          ? this.getSeatColorForShowtime(seatDetail)
          : defaultSeatColor;

        seatsHTML += `
          <rect x="${seatX}" y="${rowY}" width="${seatSize}" height="${seatSize}" fill="${seatColor}" rx="3" />
          <text x="${seatX + seatSize / 2}" y="${
          rowY + seatSize / 2 + 4
        }" fill="white" text-anchor="middle" font-size="10" font-weight="bold">${rowLetter}${seatNumber}</text>
        `;
      }
    }

    const totalSeats = rows * seatsPerRow;

    let legendHTML = "";
    if (sections.length > 0) {
      legendHTML = `
        <div class="mt-3 flex flex-wrap gap-3 justify-center text-xs">
          ${sections
            .slice(0, 4)
            .map((section, idx) => {
              const color = this.getSectionColor(idx);
              return `
              <div class="flex items-center gap-1">
                <div style="width: 16px; height: 16px; background-color: ${color}; border-radius: 3px;"></div>
                <span class="text-gray-700">${section.section} (${section.sectionCode})</span>
              </div>
            `;
            })
            .join("")}
        </div>
      `;
    }

    return `
      <div>
        <svg width="${svgWidth}" height="${svgHeight}" class="bg-white rounded shadow-sm">
          <rect x="${stagePadding}" y="${stagePadding}" width="${stageWidth}" height="${stageHeight}" fill="#374151" rx="4" />
          <text x="${svgWidth / 2}" y="${
      stagePadding + stageHeight / 2 + 5
    }" fill="white" text-anchor="middle" font-size="14" font-weight="bold">STAGE</text>
          ${seatsHTML}
        </svg>
        <div class="mt-2 text-center text-xs text-gray-600">
          <span class="font-semibold">${rows} Rows</span> ×
          <span class="font-semibold">${seatsPerRow} Seats</span> =
          <span class="font-semibold text-indigo-600">${totalSeats} Total Seats</span>
        </div>
        ${legendHTML}
      </div>
    `;
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
        const sectionColor = this.getSectionColor(sectionIndex);
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
        <div class="bg-gray-50 rounded-lg p-3">
          ${
            sectionIndex === 0 &&
            this.ticketTypes.some(
              (t) =>
                t.id &&
                ["standard", "student", "senior", "pwd", "cssa"].includes(t.id)
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
                    !["standard", "student", "senior", "pwd", "cssa"].includes(
                      type.id
                    )
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

        if (this.showtimes[showtimeIndex]?.pricing?.sections[sectionIndex]) {
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
        imageUrl ||
        this.currentPerformance?.imageUrl ||
        "/img/default-performance.jpg",
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

    const storedPerformances = storage.getItem("performances", []);

    if (this.currentPerformance) {
      const index = storedPerformances.findIndex(
        (p) => p.id === this.currentPerformance.id
      );
      if (index !== -1) {
        storedPerformances[index] = performanceData;
        notify.success("Performance updated successfully!");
      }
    } else {
      storedPerformances.push(performanceData);
      notify.success("Performance created successfully!");
    }

    storage.setItem("performances", storedPerformances);

    closeModal("performanceModal");

    this.performances = await performanceService.getAll();
    this.displayPerformances(this.performances);
  },

  editPerformance(id) {
    const performance = this.performances.find((p) => p.id === id);
    if (performance) {
      this.openPerformanceForm(performance);
    }
  },

  async deletePerformance(id) {
    const performance = this.performances.find((p) => p.id === id);
    if (!performance) return;

    const result = await Swal.fire({
      title: "Delete Performance?",
      html: `Are you sure you want to delete <strong>"${performance.title}"</strong>?<br><span class="text-sm text-gray-600">This action cannot be undone.</span>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      const storedPerformances = storage.getItem("performances", []);
      const filtered = storedPerformances.filter((p) => p.id !== id);
      storage.setItem("performances", filtered);

      notify.success("Performance deleted successfully!");

      this.performances = await performanceService.getAll();
      this.displayPerformances(this.performances);
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
    const layout = showtime.seatLayout || { rows: 5, seatsPerRow: 8 };
    const seatDetails =
      showtime.seatDetails ||
      this.initializeSeatDetails(layout.rows, layout.seatsPerRow);

    const result = await Swal.fire({
      title: "Save as Template",
      html: `
        <div class="text-left space-y-4">
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
                confirmButtonColor: "#ef4444",
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
                <div class="text-left space-y-4">
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
                    return [
                      ...new Set(
                        $("#zone-seat-map")
                          .find(".interactive-seat")
                          .filter(function () {
                            const seatId = $(this).data("seat-id");
                            return (
                              zone.seats.includes(seatId) ||
                              $(this).find("rect").attr("stroke") === "#ca8a04"
                            );
                          })
                          .map(function () {
                            return $(this).data("seat-id");
                          })
                          .get()
                      ),
                    ];
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
