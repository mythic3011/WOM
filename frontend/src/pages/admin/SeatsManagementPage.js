import dayjs from "dayjs";
import Swal from "sweetalert2";

import { createModal, openModal, closeModal } from "@components/Modal.js";
import { SeatMap } from "@components/SeatMap.js";
import { performanceService } from "@services/performanceService.js";
import { bookingService } from "@services/bookingService.js";
import { getSeatColor, buildSeatDetails, buildSeatStatusMap, formatBookingTooltip } from "@utils/seatStatusCalculator.js";
import { getSeatStatusColor, getSectionColor } from "@utils/colors.js";
import { seatUtils } from "@utils/booking/seatUtils.js";
import { initializeSeatDetails } from "@utils/booking/seatUtils.js";
import { initSeatMapPanzoom } from "@utils/panzoomSeatMap.js";
import { reportingUtils } from "@utils/reports/reporting.js";
import { keyboard } from "@utils/ui/keyboard.js";
import { notify } from "@utils/ui/notification.js";
import { URLQueryManager } from "@utils/core/URLQueryManager.js";
import { SeatMapTooltip } from "@utils/ui/seatMapTooltip.js";

export default {
  title: "Seat Management | Admin",

  selectedPerformance: null,
  selectedShowtime: null,
  selectedSeats: [],
  panzoomInstance: null,
  urlQueryManager: null,
  unsubscribeURLChanges: null,
  bookingsData: null,
  seatStatusMap: null,
  bookingsLoading: false,
  bookingsLoaded: false,
  mainViewTooltip: null,
  editModalTooltip: null,

  async render() {
    return `
      <main class="container mx-auto px-4 py-8">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">
            <i class="fas fa-chair text-indigo-600 mr-3"></i>Seat Management
          </h1>
          <p class="text-gray-600 mt-2">Manage seat layouts, availability, and configurations for all performances</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-1">
            <div class="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">
                <i class="fas fa-filter text-indigo-600 mr-2"></i>Filter & Select
              </h2>

              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Performance</label>
                  <select id="performanceSelect" class="text-black w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select a performance...</option>
                  </select>
                </div>

                <div id="showtimeSelectContainer" class="hidden">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Showtime</label>
                  <select id="showtimeSelect" class="text-black w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select a showtime...</option>
                  </select>
                </div>

                <div id="statsContainer" class="hidden">
                  <div class="bg-indigo-50 rounded-lg p-4 space-y-3">
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">Total Seats:</span>
                      <span class="font-bold text-indigo-600" id="totalSeats">0</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">Available:</span>
                      <span class="font-bold text-green-600" id="availableSeats">0</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">Blocked:</span>
                      <span class="font-bold text-red-600" id="blockedSeats">0</span>
                    </div>
                    <div id="dynamicStats"></div>
                  </div>
                </div>

                <div id="actionsContainer" class="hidden space-y-2">
                  <button id="editSeatsBtn" class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <i class="fas fa-edit mr-2"></i>Edit Individual Seats
                  </button>
                  <button id="advancedSelectionBtn" class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <i class="fas fa-mouse-pointer mr-2"></i>Advanced Selection
                  </button>
                  <button id="batchOperationsBtn" class="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    <i class="fas fa-layer-group mr-2"></i>Batch Operations
                  </button>
                  <button id="generateReportBtn" class="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
                    <i class="fas fa-chart-bar mr-2"></i>Generate Report
                  </button>
                  <button id="exportSeatsBtn" class="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                    <i class="fas fa-download mr-2"></i>Export Seat Map
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="lg:col-span-2">
            <div class="bg-white rounded-lg shadow-md p-6">
              <div class="flex justify-between items-center mb-6">
                <h2 class="text-lg font-semibold text-gray-900">
                  <i class="fas fa-map-marked-alt text-indigo-600 mr-2"></i>Seat Map
                </h2>
                <div id="selectedCountBadge" class="hidden px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                  <span id="selectedCount">0</span> Selected
                </div>
              </div>

              <div id="seatMapContainer" class="flex justify-center items-center min-h-[400px]">
                <div class="text-center text-gray-400">
                  <i class="fas fa-chair text-6xl mb-4"></i>
                  <p class="text-lg">Select a performance and showtime to view the seat map</p>
                </div>
              </div>

              <div id="legendContainer" class="hidden mt-6 flex flex-wrap gap-4 justify-center text-sm"></div>
            </div>
          </div>
        </div>
      </main>
    `;
  },

  async afterRender() {
    this.initURLQueryManager();
    await this.loadPerformances();
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
    await this.handleURLParameters();
  },

  initURLQueryManager() {
    this.urlQueryManager = new URLQueryManager({
      performanceId: null,
      showtimeId: null,
    });

    this.unsubscribeURLChanges = this.urlQueryManager.subscribe(
      async (params) => {
        await this.handleURLParamsChange(params);
      }
    );
  },

  async handleURLParamsChange(params) {
    const { performanceId, showtimeId } = params;
    const $performanceSelect = $("#performanceSelect");
    const currentPerformanceId = $performanceSelect.val();

    if (performanceId && String(performanceId) !== String(currentPerformanceId)) {
      $performanceSelect.val(performanceId);
      await this.fetchDataWithLoading(
        () => this.handlePerformanceChange(
          { target: { value: performanceId } },
          { skipURLUpdate: true }
        ),
        "Loading performance..."
      );
    }

    if (showtimeId && this.selectedPerformance) {
      const showtimeIndex = this.selectedPerformance.showtimes?.findIndex(
        (st) => String(st.id || st.showtimeId) === String(showtimeId)
      );

      if (showtimeIndex !== -1) {
        const $showtimeSelect = $("#showtimeSelect");
        const currentShowtimeIndex = $showtimeSelect.val();

        if (String(showtimeIndex) !== String(currentShowtimeIndex)) {
          $showtimeSelect.val(showtimeIndex);
          await this.handleShowtimeChange(
            { target: { value: showtimeIndex } },
            { skipURLUpdate: true }
          );
        }
      }
    }
  },

  async fetchDataWithLoading(fetchFn, loadingMessage = "Loading...") {
    const $container = $("#seatMapContainer");
    const originalContent = $container.html();

    $container.html(`
      <div class="flex flex-col items-center justify-center min-h-[400px]">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p class="text-gray-600">${loadingMessage}</p>
      </div>
    `);

    try {
      await fetchFn();
    } catch (error) {
      console.error("Error fetching data:", error);
      $container.html(`
        <div class="flex flex-col items-center justify-center min-h-[400px]">
          <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
          <p class="text-red-600 mb-4">Failed to load data</p>
          <button id="retryFetchBtn" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <i class="fas fa-redo mr-2"></i>Retry
          </button>
        </div>
      `);

      $("#retryFetchBtn").on("click", () => {
        this.fetchDataWithLoading(fetchFn, loadingMessage);
      });
    }
  },

  async handleURLParameters() {
    const params = this.urlQueryManager.getParams();
    const { performanceId, showtimeId } = params;

    if (performanceId) {
      const $performanceSelect = $("#performanceSelect");
      const optionExists = $performanceSelect.find(`option[value="${performanceId}"]`).length > 0;

      if (optionExists) {
        $performanceSelect.val(performanceId);
        await this.handlePerformanceChange(
          { target: { value: performanceId } },
          { skipURLUpdate: true }
        );

        if (showtimeId && this.selectedPerformance) {
          const showtimeIndex = this.selectedPerformance.showtimes?.findIndex(
            (st) => String(st.id || st.showtimeId) === String(showtimeId)
          );

          if (showtimeIndex !== -1) {
            const $showtimeSelect = $("#showtimeSelect");
            $showtimeSelect.val(showtimeIndex);
            await this.handleShowtimeChange(
              { target: { value: showtimeIndex } },
              { skipURLUpdate: true }
            );
          } else {
            notify.warning("Invalid showtime ID in URL, using default");
            this.urlQueryManager.removeParam("showtimeId", { silent: true, replaceState: true });
          }
        }
      } else {
        notify.warning("Invalid performance ID in URL, using default");
        this.urlQueryManager.clearAll({ silent: true, replaceState: true });
      }
    }
  },

  updateURLParams(performanceId, showtimeId) {
    if (!this.urlQueryManager) {return;}

    const params = {};
    if (performanceId) {
      params.performanceId = performanceId;
    }
    if (showtimeId) {
      params.showtimeId = showtimeId;
    }

    this.urlQueryManager.setParams(params, { silent: true });
  },

  clearURLParams() {
    if (!this.urlQueryManager) {return;}
    this.urlQueryManager.clearAll({ silent: true });
  },

  setupKeyboardShortcuts() {
    keyboard.unbindAll();

    keyboard.bind("shift+/", () => {
      notify.info(
        "Keyboard shortcuts: Ctrl+S (Save), Ctrl+F (Focus Search), Ctrl+P (Report), ESC (Close)"
      );
    });

    keyboard.bind("ctrl+s, command+s", (e) => {
      e.preventDefault();
      if (this.selectedShowtime) {
        this.saveChanges();
        notify.success("Changes saved");
      }
    });

    keyboard.bind("ctrl+z, command+z", (e) => {
      e.preventDefault();
      notify.info("Undo not implemented yet");
    });

    keyboard.bind("ctrl+f, command+f", (e) => {
      e.preventDefault();
      $("#performanceSelect").focus();
    });

    keyboard.bind("ctrl+p, command+p", (e) => {
      e.preventDefault();
      if (this.selectedShowtime) {
        this.generateReport();
      }
    });

    keyboard.bind("delete, backspace", () => {
      notify.info("Select seats in Edit Seats mode to block them");
    });

    keyboard.bind("esc", () => {
      Swal.close();
    });
  },

  async loadPerformances() {
    try {
      const performances = await performanceService.getAll();
      const $select = $("#performanceSelect");

      performances.forEach((perf) => {
        $select.append(`
          <option value="${perf.id}">${perf.title} - ${perf.composer}</option>
        `);
      });
    } catch (error) {
      console.error("Error loading performances:", error);
      notify.error("Failed to load performances");
    }
  },

  setupEventListeners() {
    $("#performanceSelect").off("change").on("change", (e) =>
      this.handlePerformanceChange(e)
    );
    $("#showtimeSelect").off("change").on("change", async (e) => await this.handleShowtimeChange(e));
    $("#editSeatsBtn").off("click").on("click", () => this.editSeats());
    $("#advancedSelectionBtn").off("click").on("click", () => this.advancedSelection());
    $("#batchOperationsBtn").off("click").on("click", () => this.batchOperations());
    $("#generateReportBtn").off("click").on("click", () => this.generateReport());
    $("#exportSeatsBtn").off("click").on("click", () => this.exportSeatMap());
  },

  async handlePerformanceChange(e, options = {}) {
    const { skipURLUpdate = false } = options;
    const performanceId = parseInt(e.target.value);

    if (!performanceId) {
      $("#showtimeSelectContainer").addClass("hidden");
      $("#statsContainer").addClass("hidden");
      $("#actionsContainer").addClass("hidden");
      $("#seatMapContainer").html(`
        <div class="text-center text-gray-400">
          <i class="fas fa-chair text-6xl mb-4"></i>
          <p class="text-lg">Select a performance and showtime to view the seat map</p>
        </div>
      `);
      this.selectedPerformance = null;
      this.selectedShowtime = null;
      if (!skipURLUpdate) {
        this.clearURLParams();
      }
      return;
    }

    try {
      const performance = await performanceService.getById(performanceId);
      this.selectedPerformance = performance;

      const $showtimeSelect = $("#showtimeSelect");
      $showtimeSelect
        .empty()
        .append("<option value=\"\">Select a showtime...</option>");

      if (performance.showtimes && performance.showtimes.length > 0) {
        performance.showtimes.forEach((showtime, index) => {
          const dateTime = dayjs(showtime.dateTime).format(
            "MMM D, YYYY h:mm A"
          );
          $showtimeSelect.append(`
            <option value="${index}">${dateTime} - ${showtime.venueName || "Venue TBA"
            }</option>
          `);
        });
        $("#showtimeSelectContainer").removeClass("hidden");
      } else {
        notify.warning("This performance has no showtimes configured");
      }

      if (!skipURLUpdate) {
        this.updateURLParams(performanceId, null);
      }
    } catch (error) {
      console.error("Error loading performance:", error);
      notify.error("Failed to load performance details");
    }
  },

  async handleShowtimeChange(e, options = {}) {
    const { skipURLUpdate = false } = options;
    const showtimeIndex = parseInt(e.target.value);

    if (isNaN(showtimeIndex)) {
      $("#statsContainer").addClass("hidden");
      $("#actionsContainer").addClass("hidden");
      $("#legendContainer").addClass("hidden");
      this.selectedShowtime = null;
      this.seatStatusMap = null;
      this.bookingsData = null;
      this.bookingsLoaded = false;
      if (!skipURLUpdate && this.selectedPerformance) {
        this.updateURLParams(this.selectedPerformance.id, null);
      }
      return;
    }

    this.selectedShowtime = this.selectedPerformance.showtimes[showtimeIndex];

    await this.loadBookingDataForShowtime();

    this.renderSeatMap();
    this.updateStats();
    $("#statsContainer").removeClass("hidden");
    $("#actionsContainer").removeClass("hidden");
    $("#legendContainer").removeClass("hidden");

    if (!skipURLUpdate) {
      const showtimeId = this.selectedShowtime.id || this.selectedShowtime.showtimeId;
      this.updateURLParams(this.selectedPerformance.id, showtimeId);
    }
  },

  async loadBookingDataForShowtime() {
    if (!this.selectedPerformance || !this.selectedShowtime) {
      this.seatStatusMap = new Map();
      this.bookingsData = [];
      this.bookingsLoaded = true;
      return;
    }

    const performanceId = this.selectedPerformance.id;
    const showtimeId = this.selectedShowtime.id || this.selectedShowtime.showtimeId;

    this.bookingsLoading = true;

    $("#seatMapContainer").html(`
      <div class="flex flex-col items-center justify-center min-h-[400px]">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p class="text-gray-600">Loading booking data...</p>
      </div>
    `);

    try {
      const bookings = await bookingService.getBookingsByShowtime(
        performanceId,
        showtimeId
      );

      this.bookingsData = bookings;
      const seatMap = this.selectedPerformance.seatMap;
      this.seatStatusMap = buildSeatStatusMap(bookings, seatMap);
      this.bookingsLoaded = true;
      this.bookingsLoading = false;
    } catch (error) {
      console.error("Error loading booking data:", error);
      this.bookingsData = [];
      this.seatStatusMap = new Map();
      this.bookingsLoaded = true;
      this.bookingsLoading = false;
      notify.warning("Failed to load booking data. Showing all seats as available.");
    }
  },

  getSeatTypes() {
    const performance = this.selectedPerformance;
    const venue = performance?.venue;
    const venueLayout = venue?.layout;

    const systemTypes = [
      { value: "available", label: "Available", color: "#10b981" },
      { value: "blocked", label: "Blocked", color: "#ef4444" },
      { value: "reserved", label: "Reserved", color: "#f59e0b" },
    ];

    let sectionTypes = [];

    if (venueLayout?.sections && venueLayout.sections.length > 0) {
      sectionTypes = venueLayout.sections.map((section, index) => ({
        value: `section-${index}`,
        label: section.name || `Section ${index + 1}`,
        color: this.getSectionColor(index),
        sectionIndex: index,
        sectionName: section.name,
      }));
    } else {
      const pricingSections = performance?.pricingSections || [];
      sectionTypes = pricingSections
        .filter(section => section && (section.sectionName || section.section))
        .map((section, index) => ({
          value: `section-${index}`,
          label: section.sectionName || section.section || `Section ${index + 1}`,
          color: this.getSectionColor(index),
          sectionIndex: index,
        }));
    }

    return [...systemTypes, ...sectionTypes];
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

  renderSeatMap() {
    const showtime = this.selectedShowtime;
    const performance = this.selectedPerformance;
    const venue = performance?.venue;
    const venueLayout = venue?.layout;

    if (venueLayout?.sections && venueLayout.sections.length > 0) {
      this.renderSectionedSeatMap(showtime, performance, venueLayout);
    } else {
      this.renderSimpleSeatMap(showtime, performance);
    }

    this.updateLegend();

    setTimeout(() => {
      if (this.panzoomInstance) {
        this.panzoomInstance.dispose();
      }
      this.panzoomInstance = initSeatMapPanzoom("#seatMapContainer");
    }, 100);
  },

  renderSectionedSeatMap(showtime, performance, venueLayout) {
    if (!venueLayout?.sections || venueLayout.sections.length === 0) {
      $("#seatMapContainer").html(`
        <div class="text-center py-12">
          <i class="fas fa-exclamation-triangle text-yellow-500 text-4xl mb-4"></i>
          <p class="text-gray-700 font-semibold mb-2">Seat Map Configuration Not Available</p>
          <p class="text-sm text-gray-500">This venue does not have a seat layout configured.</p>
        </div>
      `);
      return;
    }

    const seatMap = performance?.seatMap;
    const pricingSections = performance?.pricingSections || [];
    const statusMap = this.seatStatusMap || new Map();

    const seatDetails = buildSeatDetails(seatMap, statusMap, pricingSections);

    if (showtime.seatDetails) {
      Object.entries(showtime.seatDetails).forEach(([seatId, detail]) => {
        if (seatDetails[seatId]) {
          seatDetails[seatId].status = detail.status || seatDetails[seatId].status;
          if (detail.sectionIndex !== undefined) {
            seatDetails[seatId].sectionIndex = detail.sectionIndex;
          }
        }
      });
    }

    let seatMapHTML = "";
    try {
      seatMapHTML = SeatMap.generateFromLayout(
        venueLayout,
        seatDetails,
        [],
        false
      );
    } catch (error) {
      console.error("Error generating sectioned seat map:", error);
      seatMapHTML = `
        <div class="text-center py-12">
          <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
          <p class="text-red-600 font-semibold mb-2">Error Generating Seat Map</p>
          <p class="text-sm text-gray-600">${error.message}</p>
        </div>
      `;
    }

    $("#seatMapContainer").html(seatMapHTML);

    setTimeout(() => {
      const container = document.getElementById("seatMapContainer");
      if (container) {
        if (!this.mainViewTooltip) {
          this.mainViewTooltip = new SeatMapTooltip("seat-tooltip-main");
        }
        this.mainViewTooltip.attach(container, statusMap, seatDetails);
      }
    }, 50);
  },

  renderSimpleSeatMap(showtime, _performance) {
    const layout = showtime.seatLayout || { rows: 5, seatsPerRow: 8 };

    if (!showtime.seatDetails) {
      showtime.seatDetails = this.initializeSeatDetails(
        layout.rows,
        layout.seatsPerRow
      );
    }

    const seatMapHTML = this.generateSeatMapSVG(
      layout.rows,
      layout.seatsPerRow,
      showtime.seatDetails
    );
    $("#seatMapContainer").html(seatMapHTML);

    setTimeout(() => {
      const container = document.getElementById("seatMapContainer");
      if (container) {
        const statusMap = this.seatStatusMap || new Map();
        const seatDetails = showtime.seatDetails || {};
        if (!this.mainViewTooltip) {
          this.mainViewTooltip = new SeatMapTooltip("seat-tooltip-main");
        }
        this.mainViewTooltip.attach(container, statusMap, seatDetails);
      }
    }, 50);
  },

  getSeatColorForDetail(seatDetail) {
    // Use the existing color utility functions for consistency
    if (!seatDetail) {
      return getSeatStatusColor("available");
    }

    // If seat has a section assignment, use section color
    if (seatDetail.sectionIndex !== undefined) {
      return getSectionColor(seatDetail.sectionIndex);
    }

    // Otherwise use status color
    return getSeatColor(seatDetail.status || "available");
  },

  updateLegend() {
    const performance = this.selectedPerformance;
    const venue = performance?.venue;
    const venueLayout = venue?.layout;

    let sections = [];
    if (venueLayout?.sections && venueLayout.sections.length > 0) {
      sections = venueLayout.sections.map((section, index) => ({
        sectionName: section.name || `Section ${index + 1}`,
        tier: section.tier || "",
      }));
    } else {
      sections = performance?.pricingSections || [];
    }

    const legendHTML = SeatMap.createLegend(sections, true);

    $("#legendContainer").html(legendHTML);
  },

  generateSeatMapSVG(rows, seats, seatDetails) {
    const getSeatColorFn = (seatDetail) => this.getSeatColorForDetail(seatDetail);

    return SeatMap.generateStatic(rows, seats, seatDetails, getSeatColorFn);
  },

  generateInteractiveSeatMap(rows, seats, seatDetails, selectedSeats) {
    const performance = this.selectedPerformance;
    const venue = performance?.venue;
    const venueLayout = venue?.layout;

    if (venueLayout?.sections && venueLayout.sections.length > 0) {
      return this.generateInteractiveSectionedSeatMap(seatDetails, selectedSeats, venueLayout);
    }

    const getSeatColorFn = (seatDetail) => this.getSeatColorForDetail(seatDetail);
    return SeatMap.generateInteractive(rows, seats, seatDetails, selectedSeats, getSeatColorFn);
  },

  generateInteractiveSectionedSeatMap(seatDetails, selectedSeats, venueLayout) {
    try {
      return SeatMap.generateFromLayout(
        venueLayout,
        seatDetails,
        selectedSeats,
        true
      );
    } catch (error) {
      console.error("Error generating interactive sectioned seat map:", error);
      return `
        <div class="text-center py-12">
          <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
          <p class="text-red-600">Error generating seat map: ${error.message}</p>
        </div>
      `;
    }
  },

  initializeSeatDetails(rows, seatsPerRow) {
    return initializeSeatDetails(rows, seatsPerRow);
  },

  updateStats() {
    const performance = this.selectedPerformance;
    const venue = performance?.venue;
    const venueLayout = venue?.layout;
    const seatMap = performance?.seatMap;
    const statusMap = this.seatStatusMap || new Map();

    let totalSeats = 0;
    const sectionStats = {};

    if (venueLayout?.sections && venueLayout.sections.length > 0) {
      venueLayout.sections.forEach((section, index) => {
        const skipIndices = section.seatNumbering?.skipSeatIndices || [];
        const seatsPerRow = section.seatsPerRow - skipIndices.length;
        const sectionSeats = section.rows * seatsPerRow;
        totalSeats += sectionSeats;

        const sectionName = section.name || `Section ${index + 1}`;
        sectionStats[sectionName.toLowerCase()] = {
          name: sectionName,
          total: sectionSeats,
          count: sectionSeats,
          index: index,
        };
      });
    } else {
      const layout = this.selectedShowtime.seatLayout || { rows: 5, seatsPerRow: 8 };
      totalSeats = layout.rows * layout.seatsPerRow;
    }

    let availableCount = totalSeats;
    let blockedCount = 0;
    let bookedCount = 0;
    let reservedCount = 0;

    if (seatMap?.indexMap) {
      Object.values(seatMap.indexMap).forEach((seatData) => {
        const sectionName = (seatData.sectionName || seatData.section || "").toLowerCase();
        if (sectionStats[sectionName]) {
          sectionStats[sectionName].count = sectionStats[sectionName].total;
        }
      });
    }

    statusMap.forEach((seatStatus) => {
      if (seatStatus.status === "booked") {
        bookedCount++;
        availableCount--;
      } else if (seatStatus.status === "reserved") {
        reservedCount++;
        availableCount--;
      }
    });

    const showtimeSeatDetails = this.selectedShowtime?.seatDetails || {};
    Object.values(showtimeSeatDetails).forEach((detail) => {
      if (detail.status === "blocked") {
        blockedCount++;
        if (!statusMap.has(detail.seatId)) {
          availableCount--;
        }
      }
    });

    $("#totalSeats").text(totalSeats);
    $("#availableSeats").text(availableCount);
    $("#blockedSeats").text(blockedCount);

    let dynamicStatsHTML = "";

    if (bookedCount > 0 || reservedCount > 0) {
      dynamicStatsHTML += `
        <div class="flex justify-between text-sm">
          <span class="text-gray-600">Booked:</span>
          <span class="font-bold text-blue-600">${bookedCount}</span>
        </div>
      `;
      if (reservedCount > 0) {
        dynamicStatsHTML += `
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Reserved:</span>
            <span class="font-bold text-amber-600">${reservedCount}</span>
          </div>
        `;
      }

      const occupancyPercentage = totalSeats > 0
        ? Math.round(((bookedCount + reservedCount) / totalSeats) * 100)
        : 0;
      dynamicStatsHTML += `
        <div class="flex justify-between text-sm border-t border-gray-200 pt-2 mt-2">
          <span class="text-gray-600">Occupancy:</span>
          <span class="font-bold ${occupancyPercentage > 80 ? "text-red-600" : occupancyPercentage > 50 ? "text-amber-600" : "text-green-600"}">${occupancyPercentage}%</span>
        </div>
      `;
    }

    dynamicStatsHTML += Object.values(sectionStats)
      .sort((a, b) => a.index - b.index)
      .map((stat) => {
        return `
        <div class="flex justify-between text-sm">
          <span class="text-gray-600">${stat.name}:</span>
          <span class="font-bold" style="color: ${this.getSectionColor(stat.index)}">${stat.count}</span>
        </div>
      `;
      })
      .join("");

    $("#dynamicStats").html(dynamicStatsHTML);
  },

  async editSeats() {
    const showtime = this.selectedShowtime;
    const layout = showtime.seatLayout || { rows: 5, seatsPerRow: 8 };

    if (!showtime.seatDetails) {
      showtime.seatDetails = this.initializeSeatDetails(
        layout.rows,
        layout.seatsPerRow
      );
    }

    let selectedSeats = [];
    const seatTypes = this.getSeatTypes();
    let modalPanzoomInstance = null;

    const modalId = "editSeatsModal";
    const existingModal = document.getElementById(modalId);
    if (existingModal) {
      existingModal.remove();
    }

    const modalHTML = createModal({
      id: modalId,
      title: "Edit Seats",
      subtitle: "Click seats to select and apply changes",
      size: "xl",
      body: `
        <div class="space-y-4">
          <div class="bg-blue-50 p-3 rounded-lg">
            <p class="text-sm text-blue-800">Click seats to select. Selected: <span id="modal-selected-count" class="font-bold">0</span></p>
            <div class="flex gap-2 mt-2">
              <button type="button" id="select-all" class="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600">Select All</button>
              <button type="button" id="clear-all" class="px-3 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500">Clear</button>
            </div>
          </div>

          <div id="interactive-map" class="overflow-auto bg-gray-50 rounded-lg p-4" style="max-height: 500px; min-height: 300px;"></div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Seat Type</label>
              <select id="status-select" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="">- No Change -</option>
                ${seatTypes.map((type) => `
                  <option value="${type.value}" data-section-index="${type.sectionIndex || ""}">${type.label}</option>
                `).join("")}
              </select>
            </div>
            <div class="flex items-end">
              <button type="button" id="apply-btn" class="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                <i class="fas fa-check mr-2"></i>Apply to Selected
              </button>
            </div>
          </div>
        </div>
      `,
      footer: `
        <button type="button" class="modal-close px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors" data-modal="${modalId}">
          Cancel
        </button>
        <button type="button" id="save-seats-btn" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          <i class="fas fa-save mr-2"></i>Save Changes
        </button>
      `,
    });

    $("body").append(modalHTML);

    const renderMap = () => {
      const mapHTML = this.generateInteractiveSeatMap(
        layout.rows,
        layout.seatsPerRow,
        showtime.seatDetails,
        selectedSeats
      );
      document.getElementById("interactive-map").innerHTML = mapHTML;
      document.getElementById("modal-selected-count").textContent = selectedSeats.length;

      setTimeout(() => {
        const container = document.querySelector("#interactive-map");
        if (container) {
          const seatMap = this.selectedPerformance?.seatMap;
          const pricingSections = this.selectedPerformance?.pricingSections || [];
          const statusMap = this.seatStatusMap || new Map();
          const seatDetails = buildSeatDetails(seatMap, statusMap, pricingSections);

          if (!this.editModalTooltip) {
            this.editModalTooltip = new SeatMapTooltip("seat-tooltip-edit");
          }
          this.editModalTooltip.attach(container, statusMap, seatDetails);
        }

        if (modalPanzoomInstance) {
          modalPanzoomInstance.dispose();
        }
        modalPanzoomInstance = initSeatMapPanzoom("#interactive-map");
      }, 100);

      document.querySelectorAll("#interactive-map .interactive-seat").forEach((seat) => {
        seat.addEventListener("click", function (e) {
          e.stopPropagation();
          const seatElement = e.target.closest(".interactive-seat");
          if (!seatElement) {return;}

          const seatId = seatElement.dataset.seatId || seatElement.dataset.fullId;
          if (!seatId) {return;}

          const index = selectedSeats.indexOf(seatId);
          if (index > -1) {
            selectedSeats.splice(index, 1);
          } else {
            selectedSeats.push(seatId);
          }
          renderMap();
        });
      });
    };

    openModal(modalId, {
      onOpen: () => {
        renderMap();

        document.getElementById("select-all").addEventListener("click", () => {
          const performance = this.selectedPerformance;
          const seatMap = performance?.seatMap;
          const venue = performance?.venue;
          const venueLayout = venue?.layout;
          const statusMap = this.seatStatusMap || new Map();

          if (venueLayout?.sections && venueLayout.sections.length > 0 && seatMap?.indexMap) {
            selectedSeats = Object.keys(seatMap.indexMap).filter((fullId) => {
              const seatStatus = statusMap.get(fullId);
              return !seatStatus || (seatStatus.status !== "booked" && seatStatus.status !== "reserved");
            });
          } else {
            selectedSeats = Object.keys(showtime.seatDetails).filter((seatId) => {
              const seatStatus = statusMap.get(seatId);
              return !seatStatus || (seatStatus.status !== "booked" && seatStatus.status !== "reserved");
            });
          }
          renderMap();
        });

        document.getElementById("clear-all").addEventListener("click", () => {
          selectedSeats = [];
          renderMap();
        });

        document.getElementById("apply-btn").addEventListener("click", () => {
          const selectEl = document.getElementById("status-select");
          const value = selectEl.value;
          if (!value) {
            notify.warning("Please select a seat type");
            return;
          }
          if (selectedSeats.length === 0) {
            notify.warning("Please select at least one seat");
            return;
          }

          const selectedOption = selectEl.options[selectEl.selectedIndex];
          const sectionIndex = selectedOption.dataset.sectionIndex;

          selectedSeats.forEach((seatId) => {
            if (showtime.seatDetails[seatId]) {
              if (sectionIndex !== "") {
                showtime.seatDetails[seatId].status = "assigned";
                showtime.seatDetails[seatId].sectionIndex = parseInt(sectionIndex);
              } else {
                showtime.seatDetails[seatId].status = value;
                delete showtime.seatDetails[seatId].sectionIndex;
              }
            }
          });

          notify.success(`Applied to ${selectedSeats.length} seat(s)`);
          selectedSeats = [];
          selectEl.value = "";
          renderMap();
        });

        document.getElementById("save-seats-btn").addEventListener("click", async () => {
          if (modalPanzoomInstance) {
            modalPanzoomInstance.dispose();
          }
          closeModal(modalId);
          await this.saveChanges();
          this.renderSeatMap();
          this.updateStats();
          notify.success("Seat changes saved successfully!");
          $(`#${modalId}`).remove();
        });
      },
    });

    $(`#${modalId}`).on("modal:closed.modal", () => {
      if (modalPanzoomInstance) {
        modalPanzoomInstance.dispose();
      }
      $(`#${modalId}`).remove();
    });
  },

  async batchOperations() {
    const result = await Swal.fire({
      title:
        "<i class=\"fas fa-layer-group text-purple-600 mr-2\"></i>Batch Operations",
      html: `
        <div class="text-left p-4 space-y-4">
          <button type="button" id="block-all" class="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
            <i class="fas fa-ban mr-2"></i>Block All Seats
          </button>
          <button type="button" id="available-all" class="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
            <i class="fas fa-check mr-2"></i>Make All Available
          </button>
          <button type="button" id="block-row" class="w-full px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600">
            <i class="fas fa-minus mr-2"></i>Block Entire Row
          </button>
          <button type="button" id="block-column" class="w-full px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">
            <i class="fas fa-grip-lines-vertical mr-2"></i>Block Entire Column
          </button>
        </div>
      `,
      showCancelButton: true,
      showConfirmButton: false,
      cancelButtonText: "Close",
      didOpen: () => {
        document
          .getElementById("block-all")
          .addEventListener("click", async () => {
            const confirm = await Swal.fire({
              title: "Block All Seats?",
              text: "This will block all seats in this showtime",
              icon: "warning",
              showCancelButton: true,
              confirmButtonText: "Yes, block all",
            });

            if (confirm.isConfirmed) {
              Object.keys(this.selectedShowtime.seatDetails).forEach(
                (seatId) => {
                  this.selectedShowtime.seatDetails[seatId].status = "blocked";
                }
              );
              await this.saveChanges();
              this.renderSeatMap();
              this.updateStats();
              Swal.close();
              notify.success("All seats blocked");
            }
          });

        document
          .getElementById("available-all")
          .addEventListener("click", async () => {
            Object.keys(this.selectedShowtime.seatDetails).forEach((seatId) => {
              this.selectedShowtime.seatDetails[seatId].status = "available";
            });
            await this.saveChanges();
            this.renderSeatMap();
            this.updateStats();
            Swal.close();
            notify.success("All seats made available");
          });

        document
          .getElementById("block-row")
          .addEventListener("click", async () => {
            const { value: row } = await Swal.fire({
              title: "Enter Row Letter",
              input: "text",
              inputPlaceholder: "e.g., A, B, C",
              showCancelButton: true,
            });

            if (row) {
              const rowUpper = row.toUpperCase();
              Object.keys(this.selectedShowtime.seatDetails).forEach(
                (seatId) => {
                  if (seatId.startsWith(rowUpper)) {
                    this.selectedShowtime.seatDetails[seatId].status =
                      "blocked";
                  }
                }
              );
              await this.saveChanges();
              this.renderSeatMap();
              this.updateStats();
              Swal.close();
              notify.success(`Row ${rowUpper} blocked`);
            }
          });

        document
          .getElementById("block-column")
          .addEventListener("click", async () => {
            const { value: col } = await Swal.fire({
              title: "Enter Seat Number",
              input: "number",
              inputPlaceholder: "e.g., 1, 2, 3",
              showCancelButton: true,
            });

            if (col) {
              Object.keys(this.selectedShowtime.seatDetails).forEach(
                (seatId) => {
                  const seatNum = seatId.match(/\d+/)?.[0];
                  if (seatNum === col) {
                    this.selectedShowtime.seatDetails[seatId].status =
                      "blocked";
                  }
                }
              );
              await this.saveChanges();
              this.renderSeatMap();
              this.updateStats();
              Swal.close();
              notify.success(`Column ${col} blocked`);
            }
          });
      },
    });
  },

  exportSeatMap() {
    const showtime = this.selectedShowtime;
    const performance = this.selectedPerformance;
    const venue = performance?.venue;
    const venueLayout = venue?.layout;
    const seatMap = performance?.seatMap;
    const pricingSections = performance?.pricingSections || [];

    const data = {
      performance: performance.title,
      composer: performance.composer,
      showtime: dayjs(showtime.dateTime).format("YYYY-MM-DD HH:mm"),
      venue: {
        id: venue?.id,
        name: showtime.venueName || venue?.name,
        layout: venueLayout,
      },
      seatMap: {
        indexMap: seatMap?.indexMap || {},
      },
      pricingSections: pricingSections,
      seatDetails: showtime.seatDetails || {},
      exportedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      version: "2.0",
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `seat-map-${performance.title.replace(
      /\s+/g,
      "-"
    )}-${dayjs().format("YYYY-MM-DD")}.json`;
    link.click();
    URL.revokeObjectURL(url);

    notify.success("Seat map exported successfully!");
  },

  async saveChanges() {
    try {
      await performanceService.update(
        this.selectedPerformance.id,
        this.selectedPerformance
      );
      notify.success("Seat layout saved successfully");
    } catch (error) {
      console.error("Error saving seat layout:", error);
      notify.error("Failed to save seat layout");
    }
  },

  async advancedSelection() {
    const showtime = this.selectedShowtime;
    const performance = this.selectedPerformance;
    const seatMap = performance?.seatMap;
    const venue = performance?.venue;
    const venueLayout = venue?.layout;

    let seatDetails = {};
    let rowLetters = [];

    if (venueLayout?.sections && venueLayout.sections.length > 0 && seatMap?.indexMap) {
      const pricingSections = performance?.pricingSections || [];
      const statusMap = this.seatStatusMap || new Map();
      seatDetails = buildSeatDetails(seatMap, statusMap, pricingSections);

      if (showtime.seatDetails) {
        Object.entries(showtime.seatDetails).forEach(([seatId, detail]) => {
          if (seatDetails[seatId]) {
            seatDetails[seatId].status = detail.status || seatDetails[seatId].status;
            if (detail.sectionIndex !== undefined) {
              seatDetails[seatId].sectionIndex = detail.sectionIndex;
            }
          }
        });
      }

      const uniqueRows = new Set();
      Object.values(seatMap.indexMap).forEach((seat) => {
        if (seat.rowLabel) {
          uniqueRows.add(seat.rowLabel.toUpperCase());
        }
      });
      rowLetters = Array.from(uniqueRows).sort();
    } else {
      const layout = showtime.seatLayout || { rows: 5, seatsPerRow: 8 };
      seatDetails = showtime.seatDetails || {};
      const rows = layout.rows || 8;
      for (let i = 0; i < rows; i++) {
        rowLetters.push(String.fromCharCode(65 + i));
      }
    }

    const result = await Swal.fire({
      title:
        "<i class=\"fas fa-mouse-pointer text-blue-600 mr-2\"></i>Advanced Selection Tools",
      html: `
        <div class="text-left space-y-4">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p class="text-sm text-blue-800">
              <i class="fas fa-info-circle mr-1"></i>
              Use these tools to quickly select multiple seats based on patterns, rows, or ranges.
            </p>
          </div>

          <div>
            <h4 class="font-semibold text-gray-900 mb-3">
              <i class="fas fa-th-list mr-2"></i>Row Selection
            </h4>
            <div class="grid grid-cols-6 gap-2 mb-3">
              ${rowLetters
          .map(
            (letter) => `
                <button type="button" class="row-select-btn px-2 py-1 bg-gray-200 hover:bg-indigo-500 hover:text-white rounded text-sm transition-colors" data-row="${letter}">
                  Row ${letter}
                </button>
              `
          )
          .join("")}
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs text-gray-700 mb-1">From Row</label>
                <select id="rowRangeStart" class="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                  ${rowLetters
          .map(
            (letter) => `<option value="${letter}">${letter}</option>`
          )
          .join("")}
                </select>
              </div>
              <div>
                <label class="block text-xs text-gray-700 mb-1">To Row</label>
                <select id="rowRangeEnd" class="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                  ${rowLetters
          .map(
            (letter) => `<option value="${letter}">${letter}</option>`
          )
          .join("")}
                </select>
              </div>
            </div>
            <button type="button" id="selectRowRange" class="w-full mt-2 px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm">
              <i class="fas fa-arrows-alt-v mr-1"></i>Select Row Range
            </button>
          </div>

          <div>
            <h4 class="font-semibold text-gray-900 mb-3">
              <i class="fas fa-magic mr-2"></i>Pattern Selection
            </h4>
            <div class="grid grid-cols-2 gap-2">
              <button type="button" class="pattern-btn px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded text-sm" data-pattern="alternating">
                <i class="fas fa-chess-board mr-1"></i>Alternating
              </button>
              <button type="button" class="pattern-btn px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded text-sm" data-pattern="checkerboard">
                <i class="fas fa-th mr-1"></i>Checkerboard
              </button>
              <button type="button" class="pattern-btn px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded text-sm" data-pattern="front">
                <i class="fas fa-arrow-up mr-1"></i>Front Rows
              </button>
              <button type="button" class="pattern-btn px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded text-sm" data-pattern="back">
                <i class="fas fa-arrow-down mr-1"></i>Back Rows
              </button>
              <button type="button" class="pattern-btn px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded text-sm" data-pattern="center">
                <i class="fas fa-compress-alt mr-1"></i>Center
              </button>
              <button type="button" class="pattern-btn px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded text-sm" data-pattern="sides">
                <i class="fas fa-expand-alt mr-1"></i>Sides
              </button>
              <button type="button" class="pattern-btn px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded text-sm" data-pattern="aisle">
                <i class="fas fa-arrows-alt-h mr-1"></i>Aisle Seats
              </button>
            </div>
          </div>

          <div>
            <h4 class="font-semibold text-gray-900 mb-3">
              <i class="fas fa-filter mr-2"></i>Status Selection
            </h4>
            <div class="grid grid-cols-2 gap-2">
              <button type="button" class="status-select-btn px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded text-sm" data-status="available">
                <i class="fas fa-check mr-1"></i>Available
              </button>
              <button type="button" class="status-select-btn px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm" data-status="blocked">
                <i class="fas fa-ban mr-1"></i>Blocked
              </button>
              <button type="button" class="status-select-btn px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded text-sm" data-status="reserved">
                <i class="fas fa-lock mr-1"></i>Reserved
              </button>
              <button type="button" class="status-select-btn px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded text-sm" data-status="vip">
                <i class="fas fa-star mr-1"></i>VIP
              </button>
            </div>
          </div>

          <div class="bg-gray-50 rounded-lg p-3">
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-700">Selected Seats:</span>
              <span id="advSelectionCount" class="font-bold text-indigo-600 text-lg">0</span>
            </div>
          </div>
        </div>
      `,
      width: "700px",
      showCancelButton: true,
      showConfirmButton: true,
      confirmButtonText: "Apply Selection",
      cancelButtonText: "Close",
      didOpen: () => {
        let selectedSeats = [];

        const updateCount = () => {
          $("#advSelectionCount").text(selectedSeats.length);
        };

        $(".row-select-btn").on("click", function () {
          const row = $(this).data("row");
          const rowSeats = seatUtils.selectRow(seatDetails, null, row);
          selectedSeats = [...new Set([...selectedSeats, ...rowSeats])];
          $(this).addClass("bg-indigo-500 text-white");
          updateCount();
        });

        $("#selectRowRange").on("click", function () {
          const startRow = $("#rowRangeStart").val();
          const endRow = $("#rowRangeEnd").val();
          const rangeSeats = seatUtils.selectRowRange(
            seatDetails,
            null,
            startRow,
            endRow
          );
          selectedSeats = [...new Set([...selectedSeats, ...rangeSeats])];
          updateCount();
          notify.success(`Selected rows ${startRow} to ${endRow}`);
        });

        $(".pattern-btn").on("click", function () {
          const pattern = $(this).data("pattern");
          const patternSeats = seatUtils.selectPattern(
            seatDetails,
            null,
            pattern
          );
          selectedSeats = [...new Set([...selectedSeats, ...patternSeats])];
          updateCount();
          notify.success(`Applied ${pattern} pattern`);
        });

        $(".status-select-btn").on("click", function () {
          const status = $(this).data("status");
          const statusSeats = seatUtils.selectByStatus(seatDetails, status);
          selectedSeats = [...new Set([...selectedSeats, ...statusSeats])];
          updateCount();
          notify.success(`Selected all ${status} seats`);
        });
      },
      preConfirm: () => {
        const selectedSeats = [];

        $(".row-select-btn.bg-indigo-500").each(function () {
          const row = $(this).data("row");
          selectedSeats.push(...seatUtils.selectRow(seatDetails, null, row));
        });

        return [...new Set(selectedSeats)];
      },
    });

    if (result.isConfirmed && result.value && result.value.length > 0) {
      notify.success(
        `${result.value.length} seats selected. Use Batch Operations to modify them.`
      );
    }
  },

  async generateReport() {
    const report = reportingUtils.generateDetailedReport(
      this.selectedShowtime,
      this.selectedPerformance
    );

    const htmlReport = reportingUtils.generateHTMLReport(report);

    const result = await Swal.fire({
      title:
        "<i class=\"fas fa-chart-bar text-teal-600 mr-2\"></i>Seat Utilization & Revenue Report",
      html: `
        <div class="text-left space-y-4">
          ${htmlReport}

          <div class="mt-6 pt-4 border-t flex gap-2 justify-end">
            <button id="export-json-btn" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
              <i class="fas fa-file-code mr-2"></i>Export JSON
            </button>
            <button id="export-csv-btn" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
              <i class="fas fa-file-csv mr-2"></i>Export CSV
            </button>
            <button id="print-btn" class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors">
              <i class="fas fa-print mr-2"></i>Print
            </button>
          </div>
        </div>
      `,
      width: "900px",
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: "Close",
      didOpen: () => {
        $("#export-json-btn").on("click", () => {
          const filename = `report-${this.selectedPerformance.title.replace(
            /\s+/g,
            "-"
          )}-${dayjs().format("YYYY-MM-DD")}.json`;
          reportingUtils.exportReportAsJSON(report, filename);
          notify.success("Report exported as JSON");
        });

        $("#export-csv-btn").on("click", () => {
          const filename = `report-${this.selectedPerformance.title.replace(
            /\s+/g,
            "-"
          )}-${dayjs().format("YYYY-MM-DD")}.csv`;
          reportingUtils.exportReportAsCSV(report, filename);
          notify.success("Report exported as CSV");
        });

        $("#print-btn").on("click", () => {
          const printWindow = window.open("", "_blank");
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Seat Report - ${report.performance}</title>
              <style>
                @media print {
                  button { display: none; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              ${htmlReport}
              <script>
                window.print();
                setTimeout(() => window.close(), 100);
              </script>
            </body>
            </html>
          `);
          printWindow.document.close();
        });
      },
    });
  },

  cleanup() {
    $("#performanceSelect").off("change");
    $("#showtimeSelect").off("change");
    $("#editSeatsBtn").off("click");
    $("#advancedSelectionBtn").off("click");
    $("#batchOperationsBtn").off("click");
    $("#generateReportBtn").off("click");
    $("#exportSeatsBtn").off("click");

    if (this.unsubscribeURLChanges) {
      this.unsubscribeURLChanges();
      this.unsubscribeURLChanges = null;
    }

    if (this.urlQueryManager) {
      this.urlQueryManager.destroy();
      this.urlQueryManager = null;
    }

    if (this.panzoomInstance) {
      this.panzoomInstance.dispose();
      this.panzoomInstance = null;
    }

    if (this.mainViewTooltip) {
      this.mainViewTooltip.destroy();
      this.mainViewTooltip = null;
    }

    if (this.editModalTooltip) {
      this.editModalTooltip.destroy();
      this.editModalTooltip = null;
    }

    this.bookingsData = null;
    this.seatStatusMap = null;
    this.bookingsLoading = false;
    this.bookingsLoaded = false;

    keyboard.unbindAll();

    const tooltip = document.getElementById("seat-tooltip-edit");
    if (tooltip) {
      tooltip.remove();
    }
  },
};
