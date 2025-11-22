
import dayjs from "dayjs";
import Swal from "sweetalert2";

import { createModal, openModal, closeModal } from "@components/Modal.js";
import { performanceService } from "@services/performanceService.js";
import { storage } from "@services/storageService.js";
import { seatMapGenerator } from "@utils/booking/seatMapGenerator.js";
import { attachSeatTooltipListeners } from "@utils/booking/seatTooltip.js";
import { seatUtils } from "@utils/booking/seatUtils.js";
import { initializeSeatDetails, calculateStats } from "@utils/booking/seatUtils.js";
import { createDebounceSearch } from "@utils/data/filters.js";
import { initSeatMapPanzoom } from "@utils/panzoomSeatMap.js";
import { performanceOptimizer } from "@utils/performance.js";
import { reportingUtils } from "@utils/reports/reporting.js";
import { keyboard, registerGlobalShortcuts } from "@utils/ui/keyboard.js";
import { notify } from "@utils/ui/notification.js";

export default {
  title: "Seat Management | Admin",

  selectedPerformance: null,
  selectedShowtime: null,
  selectedSeats: [],
  panzoomInstance: null,

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
                  <button id="editLayoutBtn" class="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    <i class="fas fa-cog mr-2"></i>Edit Layout
                  </button>
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
    await this.loadPerformances();
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
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
    $("#performanceSelect").on("change", (e) =>
      this.handlePerformanceChange(e)
    );
    $("#showtimeSelect").on("change", (e) => this.handleShowtimeChange(e));
    $("#editLayoutBtn").on("click", () => this.editLayout());
    $("#editSeatsBtn").on("click", () => this.editSeats());
    $("#advancedSelectionBtn").on("click", () => this.advancedSelection());
    $("#batchOperationsBtn").on("click", () => this.batchOperations());
    $("#generateReportBtn").on("click", () => this.generateReport());
    $("#exportSeatsBtn").on("click", () => this.exportSeatMap());
  },

  async handlePerformanceChange(e) {
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
      return;
    }

    try {
      const performance = await performanceService.getById(performanceId);
      this.selectedPerformance = performance;

      const $showtimeSelect = $("#showtimeSelect");
      $showtimeSelect
        .empty()
        .append('<option value="">Select a showtime...</option>');

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
    } catch (error) {
      console.error("Error loading performance:", error);
      notify.error("Failed to load performance details");
    }
  },

  handleShowtimeChange(e) {
    const showtimeIndex = parseInt(e.target.value);

    if (isNaN(showtimeIndex)) {
      $("#statsContainer").addClass("hidden");
      $("#actionsContainer").addClass("hidden");
      $("#legendContainer").addClass("hidden");
      return;
    }

    this.selectedShowtime = this.selectedPerformance.showtimes[showtimeIndex];
    this.renderSeatMap();
    this.updateStats();
    $("#statsContainer").removeClass("hidden");
    $("#actionsContainer").removeClass("hidden");
    $("#legendContainer").removeClass("hidden");
  },

  getSeatTypes() {
    const showtime = this.selectedShowtime;
    const pricingSections = showtime?.pricing?.sections || [];

    const systemTypes = [
      { value: "available", label: "Available", color: "#10b981" },
      { value: "blocked", label: "Blocked", color: "#ef4444" },
      { value: "reserved", label: "Reserved", color: "#f59e0b" },
    ];

    const sectionTypes = pricingSections.map((section, index) => ({
      value: `section-${index}`,
      label: section.section || `Section ${index + 1}`,
      color: this.getSectionColor(index),
      sectionIndex: index,
    }));

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
    this.updateLegend();

    setTimeout(() => {
      if (this.panzoomInstance) {
        this.panzoomInstance.dispose();
      }
      this.panzoomInstance = initSeatMapPanzoom();
    }, 100);
  },

  getSeatColor(seatDetail) {
    const seatTypes = this.getSeatTypes();
    const seatType = seatTypes.find(
      (type) =>
        seatDetail.status === type.value ||
        (seatDetail.sectionIndex !== undefined &&
          type.sectionIndex === seatDetail.sectionIndex)
    );
    return seatType?.color || "#10b981";
  },

  updateLegend() {
    const seatTypes = this.getSeatTypes();
    const usedTypes = new Set();

    Object.values(this.selectedShowtime.seatDetails || {}).forEach((seat) => {
      if (seat.status) usedTypes.add(seat.status);
      if (seat.sectionIndex !== undefined)
        usedTypes.add(`section-${seat.sectionIndex}`);
    });

    const legendHTML = seatTypes
      .filter(
        (type) =>
          usedTypes.has(type.value) ||
          ["available", "blocked", "reserved"].includes(type.value)
      )
      .map(
        (type) => `
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded" style="background-color: ${type.color}"></div>
          <span class="text-black">${type.label}</span>
        </div>
      `
      )
      .join("");

    $("#legendContainer").html(legendHTML);
  },

  generateSeatMapSVG(rows, seats, seatDetails) {
    const seatSize = 32;
    const seatGap = 8;
    const stageWidth = seats * (seatSize + seatGap) + seatGap;
    const stageHeight = 35;
    const stagePadding = 25;
    const svgWidth = stageWidth + stagePadding * 2;
    const svgHeight =
      rows * (seatSize + seatGap) + stageHeight + stagePadding * 3;

    let seatsHTML = "";
    for (let row = 0; row < rows; row++) {
      const rowY =
        stagePadding + stageHeight + stagePadding + row * (seatSize + seatGap);
      const rowLetter = String.fromCharCode(65 + row);

      for (let seat = 0; seat < seats; seat++) {
        const seatX = stagePadding + seat * (seatSize + seatGap);
        const seatNumber = seat + 1;
        const seatId = `${rowLetter}${seatNumber}`;
        const seatDetail = seatDetails[seatId] || { status: "available" };

        const fillColor = this.getSeatColor(seatDetail);

        seatsHTML += `
          <g class="seat-item" data-seat-id="${seatId}">
            <rect x="${seatX}" y="${rowY}" width="${seatSize}" height="${seatSize}"
              fill="${fillColor}" rx="4" stroke="#ffffff" stroke-width="2" />
            <text x="${seatX + seatSize / 2}" y="${rowY + seatSize / 2 + 4
          }" fill="white"
              text-anchor="middle" font-size="11" font-weight="bold">${seatId}</text>
          </g>
        `;
      }
    }

    return `
      <svg id="seatMap" width="${svgWidth}" height="${svgHeight}" class="bg-white rounded shadow-lg" viewBox="0 0 ${svgWidth} ${svgHeight}">
        <g id="content-layer">
          <rect x="${stagePadding}" y="${stagePadding}" width="${stageWidth}" height="${stageHeight}"
            fill="#374151" rx="5" class="stage" />
          <text x="${svgWidth / 2}" y="${stagePadding + stageHeight / 2 + 6
      }" fill="white"
            text-anchor="middle" font-size="16" font-weight="bold">STAGE</text>
          ${seatsHTML}
        </g>
      </svg>
    `;
  },

  initializeSeatDetails(rows, seatsPerRow) {
    return initializeSeatDetails(rows, seatsPerRow);
  },

  updateStats() {
    const seatDetails = this.selectedShowtime.seatDetails || {};
    const layout = this.selectedShowtime.seatLayout || {
      rows: 5,
      seatsPerRow: 8,
    };

    const stats = calculateStats(seatDetails);
    stats.total = layout.rows * layout.seatsPerRow;

    const seatTypes = this.getSeatTypes();
    seatTypes.forEach((type) => {
      if (type.value !== "available" && type.value !== "blocked") {
        const key = `section-${type.sectionIndex}`;
        stats[key] = 0;
      }
    });

    Object.values(seatDetails).forEach((detail) => {
      if (detail.sectionIndex !== undefined) {
        const key = `section-${detail.sectionIndex}`;
        if (stats[key] !== undefined) stats[key]++;
      }
    });

    $("#totalSeats").text(stats.total);
    $("#availableSeats").text(stats.available);
    $("#blockedSeats").text(stats.blocked);

    const pricingSections = this.selectedShowtime?.pricing?.sections || [];
    const otherStatsHTML = pricingSections
      .map((section, index) => {
        const count = stats[`section-${index}`] || 0;
        return `
        <div class="flex justify-between text-sm">
          <span class="text-gray-600">${section.section}:</span>
          <span class="font-bold" style="color: ${this.getSectionColor(
          index
        )}">${count}</span>
        </div>
      `;
      })
      .join("");

    $("#dynamicStats").html(otherStatsHTML);
  },

  async editLayout() {
    const showtime = this.selectedShowtime;
    const currentLayout = showtime.seatLayout || { rows: 5, seatsPerRow: 8 };

    const result = await Swal.fire({
      title: '<i class="fas fa-cog text-indigo-600 mr-2"></i>Edit Seat Layout',
      html: `
        <div class="text-left p-4">
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium mb-2">Number of Rows</label>
              <input type="number" id="rows" class="swal2-input" value="${currentLayout.rows}" min="1" max="20">
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Seats Per Row</label>
              <input type="number" id="seatsPerRow" class="swal2-input" value="${currentLayout.seatsPerRow}" min="1" max="30">
            </div>
          </div>
          <p class="text-xs text-red-600">Warning: Changing layout will reset all seat configurations!</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Apply",
      preConfirm: () => {
        const rows = parseInt(document.getElementById("rows").value);
        const seatsPerRow = parseInt(
          document.getElementById("seatsPerRow").value
        );
        if (!rows || !seatsPerRow) {
          Swal.showValidationMessage("Please enter valid numbers");
          return false;
        }
        return { rows, seatsPerRow };
      },
    });

    if (result.isConfirmed) {
      showtime.seatLayout = result.value;
      showtime.seatDetails = this.initializeSeatDetails(
        result.value.rows,
        result.value.seatsPerRow
      );
      await this.saveChanges();
      this.renderSeatMap();
      this.updateStats();
      notify.success("Seat layout updated successfully!");
    }
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

    const result = await Swal.fire({
      title: '<i class="fas fa-edit text-green-600 mr-2"></i>Edit Seats',
      html: `
        <div class="text-left p-4">
          <div class="bg-blue-50 p-3 rounded mb-4">
            <p class="text-sm">Click seats to select. Selected: <span id="modal-selected-count" class="font-bold">0</span></p>
            <div class="flex gap-2 mt-2">
              <button type="button" id="select-all" class="px-3 py-1 bg-blue-500 text-white rounded text-xs">Select All</button>
              <button type="button" id="clear-all" class="px-3 py-1 bg-gray-400 text-white rounded text-xs">Clear</button>
            </div>
          </div>

          <div id="interactive-map" class="mb-4 overflow-auto" style="max-height: 400px;"></div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Seat Type</label>
              <select id="status-select" class="swal2-input w-full">
                <option value="">- No Change -</option>
                ${seatTypes
          .map(
            (type) => `
                  <option value="${type.value}" data-section-index="${type.sectionIndex || ""
              }">${type.label}</option>
                `
          )
          .join("")}
              </select>
            </div>
            <div>
              <button type="button" id="apply-btn" class="w-full px-4 py-2 bg-indigo-600 text-white rounded mt-6">Apply to Selected</button>
            </div>
          </div>
        </div>
      `,
      width: "800px",
      showCancelButton: true,
      confirmButtonText: "Save Changes",
      didOpen: () => {
        const renderMap = () => {
          const mapHTML = this.generateInteractiveSeatMap(
            layout.rows,
            layout.seatsPerRow,
            showtime.seatDetails,
            selectedSeats
          );
          document.getElementById("interactive-map").innerHTML = mapHTML;
          document.getElementById("modal-selected-count").textContent =
            selectedSeats.length;

          setTimeout(() => {
            attachSeatTooltipListeners("#interactive-map svg");
          }, 100);

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
              renderMap();
            });
          });
        };

        renderMap();

        document.getElementById("select-all").addEventListener("click", () => {
          selectedSeats = Object.keys(showtime.seatDetails);
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
                showtime.seatDetails[seatId].sectionIndex =
                  parseInt(sectionIndex);
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
      },
      preConfirm: () => {
        return { seatDetails: showtime.seatDetails };
      },
    });

    if (result.isConfirmed) {
      await this.saveChanges();
      this.renderSeatMap();
      this.updateStats();
      notify.success("Seat changes saved successfully!");
    }
  },

  generateInteractiveSeatMap(rows, seats, seatDetails, selectedSeats) {
    const seatSize = 32;
    const seatGap = 8;
    const stageWidth = seats * (seatSize + seatGap) + seatGap;
    const stageHeight = 30;
    const stagePadding = 20;
    const svgWidth = stageWidth + stagePadding * 2;
    const svgHeight =
      rows * (seatSize + seatGap) + stageHeight + stagePadding * 3;

    let seatsHTML = "";
    for (let row = 0; row < rows; row++) {
      const rowY =
        stagePadding + stageHeight + stagePadding + row * (seatSize + seatGap);
      const rowLetter = String.fromCharCode(65 + row);

      for (let seat = 0; seat < seats; seat++) {
        const seatX = stagePadding + seat * (seatSize + seatGap);
        const seatNumber = seat + 1;
        const seatId = `${rowLetter}${seatNumber}`;
        const seatDetail = seatDetails[seatId] || { status: "available" };
        const isSelected = selectedSeats.includes(seatId);

        const fillColor = isSelected
          ? "#eab308"
          : this.getSeatColor(seatDetail);

        seatsHTML += `
          <g class="interactive-seat cursor-pointer" data-seat-id="${seatId}">
            <rect x="${seatX}" y="${rowY}" width="${seatSize}" height="${seatSize}"
              fill="${fillColor}" rx="4" stroke="${isSelected ? "#ca8a04" : "#ffffff"
          }" stroke-width="${isSelected ? "3" : "1"}" />
            <text x="${seatX + seatSize / 2}" y="${rowY + seatSize / 2 + 4
          }" fill="white"
              text-anchor="middle" font-size="11" font-weight="bold">${seatId}</text>
          </g>
        `;
      }
    }

    return `
      <svg width="${svgWidth}" height="${svgHeight}" class="bg-white rounded shadow-sm mx-auto">
        <rect x="${stagePadding}" y="${stagePadding}" width="${stageWidth}" height="${stageHeight}" fill="#374151" rx="4" />
        <text x="${svgWidth / 2}" y="${stagePadding + stageHeight / 2 + 5
      }" fill="white"
          text-anchor="middle" font-size="14" font-weight="bold">STAGE</text>
        ${seatsHTML}
      </svg>
    `;
  },

  async batchOperations() {
    const result = await Swal.fire({
      title:
        '<i class="fas fa-layer-group text-purple-600 mr-2"></i>Batch Operations',
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
    const layout = showtime.seatLayout || { rows: 5, seatsPerRow: 8 };

    const data = {
      performance: this.selectedPerformance.title,
      showtime: dayjs(showtime.dateTime).format("YYYY-MM-DD HH:mm"),
      venue: showtime.venueName,
      layout: layout,
      seats: showtime.seatDetails,
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `seat-map-${this.selectedPerformance.title.replace(
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
    const layout = showtime.seatLayout || { rows: 5, seatsPerRow: 8 };
    const seatDetails = showtime.seatDetails || {};

    const rows = layout.rows || 8;
    const rowLetters = [];
    for (let i = 0; i < rows; i++) {
      rowLetters.push(String.fromCharCode(65 + i));
    }

    const result = await Swal.fire({
      title:
        '<i class="fas fa-mouse-pointer text-blue-600 mr-2"></i>Advanced Selection Tools',
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
          const rowSeats = seatUtils.selectRow(seatDetails, layout, row);
          selectedSeats = [...new Set([...selectedSeats, ...rowSeats])];
          $(this).addClass("bg-indigo-500 text-white");
          updateCount();
        });

        $("#selectRowRange").on("click", function () {
          const startRow = $("#rowRangeStart").val();
          const endRow = $("#rowRangeEnd").val();
          const rangeSeats = seatUtils.selectRowRange(
            seatDetails,
            layout,
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
            layout,
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
          selectedSeats.push(...seatUtils.selectRow(seatDetails, layout, row));
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
        '<i class="fas fa-chart-bar text-teal-600 mr-2"></i>Seat Utilization & Revenue Report',
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
};
