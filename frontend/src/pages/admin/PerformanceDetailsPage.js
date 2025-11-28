import dayjs from "dayjs";
import page from "page";
import { SeatMap } from "@components/SeatMap.js";
import { buildSeatStatusMap, getSeatColor, formatBookingTooltip } from "@utils/seatStatusCalculator.js";
import { generateFullId } from "@utils/seatIdHelper.js";
import { bookingService } from "@services/bookingService.js";
import { performanceAPI } from "@services/index.js";
import { ROUTES } from "@config/routes.js";
import { getPerformanceImageUrl, getImageFallbackSvg } from "@utils/imageUtils.js";
import { initSeatMapPanzoom } from "@utils/panzoomSeatMap.js";
import { SeatMapTooltip } from "@utils/ui/seatMapTooltip.js";

const PerformanceDetailsPage = {
  title: "Performance Details | Admin",

  _currentPerformance: null,
  _currentVenue: null,
  _currentShowtimes: null,
  _currentTicketTypes: null,
  _bookingsData: null,
  _seatStatusMap: null,
  _selectedShowtimeId: null,
  _bookingsLoaded: false,
  _bookingsLoading: false,
  _bookingsError: null,
  _abortController: null,
  _bookingsCache: new Map(),
  _cacheTTL: 30000,
  _hoverDebounceTimer: null,
  _hoverDebounceDelay: 100,
  _seatMapTooltip: null,
  _panzoomInstance: null,
  _editMode: true,
  _selectedSeats: [],
  _contextMenu: null,
  _pollingInterval: null,
  _keyboardHandler: null,
  _undoStack: [],
  _redoStack: [],
  _seatFilter: null,

  async render(params) {
    const { id } = params;

    if (!id) {
      return this.renderError("Invalid performance ID", true);
    }

    // Show loading state while fetching performance data
    const loadingHtml = this.renderLoadingPage();

    // Return loading state immediately, then fetch data
    setTimeout(async () => {
      try {
        const response = await performanceAPI.getById(id);
        const performance = response.data?.performance || response.performance || response;

        // Validate performance data
        if (!performance || !performance.id) {
          throw new Error("Invalid performance data received");
        }

        this._currentPerformance = performance;
        this._currentVenue = performance.venue;
        this._currentShowtimes = performance.showtimes || [];
        this._currentTicketTypes = performance.pricingSections || performance.ticketTypes || [];

        // Update the page with actual content
        const container = document.getElementById("performance-details-container");
        if (container) {
          container.innerHTML = this.renderPageContent();
          // Re-attach event handlers after content update
          this.attachEventHandlers();
          // Load booking data
          await this.loadBookingData();
        }
      } catch (error) {
        console.error("Failed to load performance:", error);

        // Check if it's a 404 error (invalid performance ID)
        const isNotFound = error.response?.status === 404 ||
                          error.message?.includes("not found") ||
                          error.message?.includes("Invalid performance");

        const container = document.getElementById("performance-details-container");
        if (container) {
          container.innerHTML = this.renderError(
            isNotFound
              ? "Performance not found. The performance may have been deleted or the ID is invalid."
              : "Failed to load performance details. Please try again.",
            isNotFound
          );
          this.attachErrorHandlers();
        }
      }
    }, 0);

    return loadingHtml;
  },

  renderLoadingPage() {
    return `
      <div id="performance-details-container" class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div class="text-center max-w-md">
          <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white shadow-lg mb-6">
            <i class="fas fa-spinner fa-spin text-5xl text-indigo-600"></i>
          </div>
          <h2 class="text-2xl text-gray-900 font-bold mb-2">Loading Performance Details</h2>
          <p class="text-base text-gray-600">Please wait while we fetch the information...</p>
          <div class="mt-6 flex items-center justify-center gap-2">
            <div class="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style="animation-delay: 0ms;"></div>
            <div class="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style="animation-delay: 150ms;"></div>
            <div class="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style="animation-delay: 300ms;"></div>
          </div>
        </div>
      </div>
    `;
  },

  renderPage() {
    return `
      <div id="performance-details-container" class="min-h-screen bg-gray-50">
        ${this.renderPageContent()}
      </div>
    `;
  },

  renderPageContent() {
    const performance = this._currentPerformance;
    const venue = this._currentVenue;

    return `
      ${this.renderSkipLinks()}
      ${this.renderPageHeader()}
      ${this.renderEditModeToolbar()}
      ${this.renderSelectionToolbar()}
      
      <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div id="main-content" class="space-y-6 lg:space-y-8 max-w-7xl mx-auto ${this._selectedShowtimeId ? 'lg:pr-80' : ''}">
          ${this.renderPerformanceInfo(performance, venue)}
          ${this.renderShowtimesList()}
          ${this.renderSeatMapViewer()}
        </div>
      </div>
      
      <!-- Screen reader announcements -->
      <div id="sr-announcements" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></div>
    `;
  },

  renderEditModeToolbar() {
    const visibilityClass = this._selectedShowtimeId ? 'lg:block' : 'lg:hidden';
    
    return `
      <div id="edit-mode-toolbar" class="hidden ${visibilityClass} fixed top-20 right-6 z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-4 space-y-3 w-72 transition-all">
        <div class="flex items-center gap-2 pb-3 border-b border-gray-200">
          <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span class="text-sm font-semibold text-gray-900">Seat Management</span>
        </div>

        <div class="space-y-2">
          <button
            id="select-all-seats"
            class="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm font-medium transition-colors flex items-center gap-2"
          >
            <i class="fas fa-check-double"></i>
            <span>Select All Available</span>
          </button>

          <button
            id="select-all-blocked"
            class="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm font-medium transition-colors flex items-center gap-2"
          >
            <i class="fas fa-ban text-red-500"></i>
            <span>Select All Blocked</span>
          </button>

          <button
            id="clear-selection"
            class="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm font-medium transition-colors flex items-center gap-2"
          >
            <i class="fas fa-times-circle"></i>
            <span>Clear Selection</span>
          </button>

          <div class="relative">
            <button
              id="batch-operations-btn"
              class="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm font-medium transition-colors flex items-center justify-between"
            >
              <span class="flex items-center gap-2">
                <i class="fas fa-layer-group"></i>
                <span>Batch Operations</span>
              </span>
              <i class="fas fa-chevron-down text-xs"></i>
            </button>
            <div id="batch-operations-menu" class="hidden absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              <button class="batch-op-item w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors" data-action="block-row">
                <i class="fas fa-minus-circle text-red-500 mr-2"></i>
                Block Row
              </button>
              <button class="batch-op-item w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors" data-action="block-section">
                <i class="fas fa-ban text-red-500 mr-2"></i>
                Block Section
              </button>
              <button class="batch-op-item w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors" data-action="select-by-status">
                <i class="fas fa-filter text-blue-500 mr-2"></i>
                Select by Status
              </button>
            </div>
          </div>

          <div class="relative">
            <button
              id="filter-seats-btn"
              class="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm font-medium transition-colors flex items-center justify-between"
            >
              <span class="flex items-center gap-2">
                <i class="fas fa-filter"></i>
                <span>Filter View</span>
              </span>
              <i class="fas fa-chevron-down text-xs"></i>
            </button>
            <div id="filter-seats-menu" class="hidden absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              <button class="filter-item w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors" data-filter="available">
                <i class="fas fa-check-circle text-green-500 mr-2"></i>
                Show Only Available
              </button>
              <button class="filter-item w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors" data-filter="blocked">
                <i class="fas fa-ban text-red-500 mr-2"></i>
                Show Only Blocked
              </button>
              <button class="filter-item w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors" data-filter="booked">
                <i class="fas fa-ticket-alt text-gray-600 mr-2"></i>
                Show Only Booked
              </button>
              <div class="border-t border-gray-200 my-1"></div>
              <button class="filter-item w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors" data-filter="clear">
                <i class="fas fa-times-circle text-gray-500 mr-2"></i>
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-gray-200 space-y-2">
          <div class="text-xs text-gray-500 space-y-1">
            <div><kbd class="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Esc</kbd> Clear Selection</div>
            <div><kbd class="px-1.5 py-0.5 bg-gray-100 rounded text-xs">${this.getModifierKeyLabel()}+A</kbd> Select All</div>
            <div><kbd class="px-1.5 py-0.5 bg-gray-100 rounded text-xs">B</kbd> Block Selected</div>
            <div><kbd class="px-1.5 py-0.5 bg-gray-100 rounded text-xs">U</kbd> Unblock Selected</div>
            <div><kbd class="px-1.5 py-0.5 bg-gray-100 rounded text-xs">${this.getModifierKeyLabel()}+Z</kbd> Undo</div>
            <div><kbd class="px-1.5 py-0.5 bg-gray-100 rounded text-xs">${this.getModifierKeyLabel()}+Shift+Z</kbd> Redo</div>
          </div>
        </div>
      </div>
    `;
  },

  renderSelectionToolbar() {
    const selectedCount = this._selectedSeats.length;

    if (selectedCount === 0) {
      return "";
    }

    return `
      <div id="selection-toolbar" class="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-2xl border border-gray-200 px-6 py-4 flex items-center gap-6 z-50 animate-slide-up">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
            <span class="text-sm font-bold text-indigo-600">${selectedCount}</span>
          </div>
          <span class="text-sm font-medium text-gray-700">${selectedCount === 1 ? "seat" : "seats"} selected</span>
        </div>

        <div class="h-6 w-px bg-gray-300"></div>

        <div class="flex gap-2">
          <button
            id="toolbar-block-btn"
            data-action="block"
            class="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors flex items-center gap-2 shadow-sm"
          >
            <i class="fas fa-ban"></i>
            <span>Block</span>
          </button>
          <button
            id="toolbar-unblock-btn"
            data-action="unblock"
            class="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center gap-2 shadow-sm"
          >
            <i class="fas fa-check-circle"></i>
            <span>Make Available</span>
          </button>
          <button
            id="toolbar-clear-btn"
            data-action="clear"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors flex items-center gap-2"
          >
            <i class="fas fa-times"></i>
            <span>Clear</span>
          </button>
        </div>
      </div>
      <style>
        @keyframes slide-up {
          from {
            transform: translate(-50%, 20px);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      </style>
    `;
  },

  renderSkipLinks() {
    return `
      <div class="skip-links">
        <a href="#performance-info" class="skip-link">Skip to performance information</a>
        <a href="#showtimes-section" class="skip-link">Skip to showtimes</a>
        <a href="#seat-map-section" class="skip-link">Skip to seat map</a>
      </div>
      <style>
        .skip-links {
          position: absolute;
          top: -100px;
          left: 0;
          z-index: 9999;
        }
        .skip-link {
          position: absolute;
          left: -10000px;
          top: auto;
          width: 1px;
          height: 1px;
          overflow: hidden;
          background: #4f46e5;
          color: white;
          padding: 0.75rem 1.5rem;
          text-decoration: none;
          border-radius: 0 0 0.5rem 0;
          font-weight: 600;
        }
        .skip-link:focus {
          position: static;
          width: auto;
          height: auto;
          left: 0;
          top: 0;
          overflow: visible;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }
        .seat.selected rect,
        .interactive-seat.selected rect {
          stroke: #eab308;
          stroke-width: 3;
          filter: drop-shadow(0 0 4px rgba(234, 179, 8, 0.5));
        }
        .seat.selectable:hover rect,
        .interactive-seat.selectable:hover rect {
          filter: brightness(1.1);
          cursor: pointer;
        }
        .seat.non-selectable:hover,
        .interactive-seat.non-selectable:hover {
          cursor: not-allowed;
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }
        .seat-updating {
          animation: pulse 1s ease-in-out infinite;
        }
        .seat-updated {
          animation: flash-success 1s ease-in-out;
        }
        @keyframes flash-success {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
            filter: brightness(1.3);
          }
        }
      </style>
    `;
  },

  renderPageHeader() {
    return `
      <div class="fixed left-6 top-24 z-40 hidden lg:flex flex-col gap-3">
        <button
          id="back-to-performances"
          class="flex items-center justify-center w-12 h-12 bg-white text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 group"
          aria-label="Back to performances list"
          title="Back to Performances"
        >
          <svg class="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
      </div>
      
      <div class="lg:hidden bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div class="container mx-auto px-4 py-3">
          <div class="flex items-center justify-between">
            <button
              id="back-to-performances-mobile"
              class="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md px-2 py-1 -ml-2"
              aria-label="Back to performances list"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
              <span class="text-sm font-medium">Back</span>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  formatValue(value, defaultValue = "–") {
    if (value === null || value === undefined || value === "" || value === "N/A") {
      return defaultValue;
    }
    if (typeof value === "number" && isNaN(value)) {
      return defaultValue;
    }
    return value;
  },

  formatNumber(value, defaultValue = "–") {
    const num = Number(value);
    if (isNaN(num) || num === null || num === undefined) {
      return defaultValue;
    }
    return num;
  },

  renderPerformanceInfo(performance, venue) {
    const ticketTypesHtml = this.renderTicketTypesSection(this._currentTicketTypes);
    const imageUrl = getPerformanceImageUrl(performance.image || performance.imageUrl);

    return `
      <section id="performance-info" class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow" aria-labelledby="performance-info-heading">
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-0">
          <div class="lg:col-span-2 relative h-80 lg:h-auto min-h-[500px] bg-gradient-to-br from-gray-900 to-gray-800">
            ${imageUrl ? `
              <img 
                src="${imageUrl}" 
                alt="${this.formatValue(performance.title, "Performance")}" 
                class="w-full h-full object-cover opacity-95"
                onerror="this.onerror=null; this.src='${getImageFallbackSvg()}';"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
            ` : `
              <div class="w-full h-full flex items-center justify-center">
                <i class="fas fa-music text-7xl text-gray-700"></i>
              </div>
            `}
            <div class="absolute top-6 right-6 flex gap-3">
              <button
                id="delete-performance-btn"
                class="p-3.5 bg-red-500/95 backdrop-blur-sm text-white rounded-xl hover:bg-red-600 hover:scale-105 transition-all shadow-lg hover:shadow-xl"
                aria-label="Delete performance"
              >
                <i class="fas fa-trash text-lg"></i>
              </button>
            </div>
          </div>

          <div class="lg:col-span-3 p-8 lg:p-10">
            <div class="mb-8">
              <h1 class="text-4xl font-bold text-gray-900 mb-3 leading-tight">${this.formatValue(performance.title, "Performance Details")}</h1>
              <div class="flex items-center gap-2 text-lg text-gray-600">
                <i class="fas fa-user-music text-indigo-600"></i>
                <span class="font-medium">${this.formatValue(performance.composer, "Unknown Composer")}</span>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div class="group bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-xl p-5 border border-indigo-200 hover:shadow-md transition-all">
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <i class="fas fa-wand-magic-sparkles text-white text-lg"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-xs text-indigo-700 font-semibold uppercase tracking-wider mb-1">Conductor</div>
                    <div class="text-base font-bold text-gray-900">${this.formatValue(performance.conductor)}</div>
                  </div>
                </div>
              </div>

              <div class="group bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-5 border border-green-200 hover:shadow-md transition-all">
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <i class="fas fa-guitar text-white text-lg"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-xs text-green-700 font-semibold uppercase tracking-wider mb-1">Genre</div>
                    <div class="text-base font-bold text-gray-900">${this.formatValue(performance.genre)}</div>
                  </div>
                </div>
              </div>

              <div class="group bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-5 border border-amber-200 hover:shadow-md transition-all">
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <i class="fas fa-clock text-white text-lg"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-xs text-amber-700 font-semibold uppercase tracking-wider mb-1">Duration</div>
                    <div class="text-base font-bold text-gray-900">${this.formatValue(performance.duration)} ${performance.duration ? "min" : ""}</div>
                  </div>
                </div>
              </div>

              <div class="group bg-gradient-to-br from-rose-50 to-rose-100/50 rounded-xl p-5 border border-rose-200 hover:shadow-md transition-all">
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <i class="fas fa-map-marker-alt text-white text-lg"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-xs text-rose-700 font-semibold uppercase tracking-wider mb-1">Venue</div>
                    <div class="text-base font-bold text-gray-900">${this.formatValue(venue?.name || venue)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <i class="fas fa-align-left text-gray-600"></i>
                </div>
                <h3 class="text-sm font-bold text-gray-700 uppercase tracking-wider">About This Performance</h3>
              </div>
              <div class="relative bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 rounded-2xl p-8 border border-slate-200 shadow-sm">
                <div class="absolute top-4 left-4 text-indigo-200 opacity-20">
                  <i class="fas fa-quote-left text-4xl"></i>
                </div>
                <div class="relative z-10">
                  <p class="text-gray-800 leading-relaxed whitespace-pre-wrap text-base font-light">
                    ${this.formatValue(performance.description, "No description available")}
                  </p>
                </div>
                <div class="absolute bottom-4 right-4 text-indigo-200 opacity-20">
                  <i class="fas fa-quote-right text-4xl"></i>
                </div>
              </div>
            </div>

            ${ticketTypesHtml}
          </div>
        </div>
      </section>
    `;
  },



  renderShowtimesList() {
    const showtimes = this._currentShowtimes;

    if (!showtimes || showtimes.length === 0) {
      return `
        <section id="showtimes-section" class="bg-white rounded-xl shadow-md border border-gray-100 p-6 lg:p-8" aria-labelledby="showtimes-heading">
          <h2 id="showtimes-heading" class="text-lg sm:text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 pb-3 border-b border-gray-200">
            <i class="fas fa-calendar text-indigo-600" aria-hidden="true"></i>
            <span>Showtimes</span>
          </h2>
          <div class="text-center py-12">
            <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
              <i class="fas fa-calendar-times text-4xl text-gray-400"></i>
            </div>
            <p class="text-gray-700 font-semibold text-lg">No showtimes available</p>
            <p class="text-sm text-gray-500 mt-2 max-w-md mx-auto">This performance has no scheduled showtimes. Please add showtimes to enable seat map viewing.</p>
          </div>
        </section>
      `;
    }

    return `
      <section id="showtimes-section" class="bg-white rounded-xl shadow-md border border-gray-100 p-6 lg:p-8 hover:shadow-lg transition-shadow duration-200" aria-labelledby="showtimes-heading">
        <h2 id="showtimes-heading" class="text-lg sm:text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 pb-3 border-b border-gray-200">
          <i class="fas fa-calendar text-indigo-600" aria-hidden="true"></i>
          <span>Showtimes</span>
          <span class="ml-auto text-sm font-normal text-gray-500" aria-label="${showtimes.length} showtimes available">${showtimes.length} ${showtimes.length === 1 ? "showtime" : "showtimes"}</span>
        </h2>
        
        <div id="showtimes-list" role="list" class="grid grid-cols-1 gap-3" aria-label="Available showtimes">
          ${showtimes.map((st, index) => {
            const showtimeId = st.id || st.showtimeId || `showtime-${index}`;
            const date = dayjs(st.dateTime || st.datetime).format("MMM D, YYYY");
            const time = dayjs(st.dateTime || st.datetime).format("h:mm A");
            const dayOfWeek = dayjs(st.dateTime || st.datetime).format("dddd");

            const totalSeats = st.totalSeats || this._currentPerformance?.totalSeats || this.calculateTotalSeatsFromSeatMap() || 0;
            const bookedSeats = this._bookingsLoaded ? this.calculateBookedSeatsForShowtime(showtimeId) : null;
            const blockedSeats = this.calculateBlockedSeatsForShowtime(showtimeId);
            const availableSeats = bookedSeats !== null ? Math.max(0, totalSeats - bookedSeats - blockedSeats) : st.availableSeats || totalSeats;
            const occupancyPercentage = bookedSeats !== null && totalSeats > 0 ? Math.round(((bookedSeats + blockedSeats) / totalSeats) * 100) : 0;

            const isSelected = this._selectedShowtimeId === showtimeId;
            const selectedClass = isSelected
              ? "border-indigo-500 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-md"
              : "border-gray-200 hover:border-indigo-300 hover:shadow-md";

            const occupancyColor = occupancyPercentage > 80
              ? "text-red-600 bg-red-50"
              : occupancyPercentage > 50
                ? "text-amber-600 bg-amber-50"
                : "text-green-600 bg-green-50";

            return `
              <button
                role="listitem"
                class="showtime-item w-full text-left bg-white border-2 ${selectedClass} rounded-xl p-4 lg:p-5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 group"
                data-showtime-id="${showtimeId}"
                data-showtime-index="${index}"
                aria-label="Select showtime for ${date} at ${time}, ${availableSeats} of ${totalSeats} seats available, ${occupancyPercentage}% occupancy"
                aria-pressed="${isSelected}"
                tabindex="0"
              >
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div class="flex items-center gap-3">
                    <div class="flex-shrink-0 w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center ${isSelected ? "bg-indigo-200" : "group-hover:bg-indigo-200"} transition-colors">
                      <i class="fas fa-calendar-day text-indigo-600 text-lg"></i>
                    </div>
                    <div>
                      <div class="font-bold text-gray-900 text-base sm:text-lg">
                        ${date}
                      </div>
                      <div class="text-sm text-gray-600 flex items-center gap-2 mt-0.5">
                        <i class="fas fa-clock text-gray-400"></i>
                        <span>${time}</span>
                        <span class="text-gray-400">•</span>
                        <span>${dayOfWeek}</span>
                      </div>
                    </div>
                  </div>
                  ${isSelected ? `
                    <div class="flex items-center gap-2 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                      <i class="fas fa-check-circle"></i>
                      <span>Selected</span>
                    </div>
                  ` : ""}
                </div>
                
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm">
                  <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                    <i class="fas fa-chair text-gray-500"></i>
                    <div>
                      <div class="text-gray-500 text-xs">Total</div>
                      <div class="font-bold text-gray-900">${totalSeats > 0 ? totalSeats : "–"}</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg">
                    <i class="fas fa-check-circle text-green-600"></i>
                    <div>
                      <div class="text-gray-500 text-xs">Available</div>
                      <div class="font-bold text-green-700">${bookedSeats !== null ? availableSeats : "<i class=\"fas fa-spinner fa-spin text-xs\"></i>"}</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                    <i class="fas fa-ticket-alt text-gray-600"></i>
                    <div>
                      <div class="text-gray-500 text-xs">Booked</div>
                      <div class="font-bold text-gray-900">${bookedSeats !== null ? bookedSeats : "<i class=\"fas fa-spinner fa-spin text-xs\"></i>"}</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 px-3 py-2 ${occupancyColor} rounded-lg">
                    <i class="fas fa-chart-pie"></i>
                    <div>
                      <div class="text-xs opacity-75">Occupancy</div>
                      <div class="font-bold">${bookedSeats !== null ? occupancyPercentage + "%" : "<i class=\"fas fa-spinner fa-spin text-xs\"></i>"}</div>
                    </div>
                  </div>
                </div>
              </button>
            `;
          }).join("")}
        </div>
        
        <div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div class="flex items-start gap-2">
            <i class="fas fa-info-circle text-blue-600 mt-0.5"></i>
            <p class="text-sm text-blue-800">
              <span class="font-semibold">Tip:</span> Click on a showtime or press Enter/Space to view its seat map and booking details below.
            </p>
          </div>
        </div>
      </section>
    `;
  },

  calculateStatistics(seatDetails) {
    const total = Object.keys(seatDetails).length;
    
    let available = 0;
    let booked = 0;
    let reserved = 0;
    let blocked = 0;
    let revenue = 0;

    Object.entries(seatDetails).forEach(([seatId, detail]) => {
      const status = detail.status || "available";
      
      if (status === "available") {
        available++;
      } else if (status === "booked") {
        booked++;
        if (detail.seatTicket) {
          const price = parseFloat(detail.seatTicket.price) || 0;
          revenue += price;
        }
      } else if (status === "reserved") {
        reserved++;
      } else if (status === "blocked") {
        blocked++;
      }
    });

    const occupancyPercentage = total > 0
      ? Math.round(((booked + reserved + blocked) / total) * 100)
      : 0;

    const sectionBreakdown = this.calculateSectionBreakdown(seatDetails);

    return {
      total,
      available,
      booked,
      reserved,
      blocked,
      occupancyPercentage,
      revenue,
      sectionBreakdown
    };
  },

  calculateSectionBreakdown(seatDetails) {
    const sections = {};

    if (!seatDetails || Object.keys(seatDetails).length === 0) {
      return sections;
    }

    Object.entries(seatDetails).forEach(([seatId, detail]) => {
      const sectionName = detail.section || "Main";
      const status = detail.status || "available";

      if (!sections[sectionName]) {
        sections[sectionName] = {
          total: 0,
          available: 0,
          booked: 0,
          reserved: 0,
          blocked: 0,
          revenue: 0
        };
      }

      sections[sectionName].total++;

      if (status === "available") {
        sections[sectionName].available++;
      } else if (status === "booked") {
        sections[sectionName].booked++;
        if (detail.seatTicket) {
          const price = parseFloat(detail.seatTicket.price) || 0;
          sections[sectionName].revenue += price;
        }
      } else if (status === "reserved") {
        sections[sectionName].reserved++;
      } else if (status === "blocked") {
        sections[sectionName].blocked++;
      }
    });

    return sections;
  },

  renderStatisticsPanel(statistics, showSectionBreakdown = false) {
    const occupancyColor = statistics.occupancyPercentage > 80
      ? "text-red-600 bg-red-50 border-red-200"
      : statistics.occupancyPercentage > 50
        ? "text-amber-600 bg-amber-50 border-amber-200"
        : "text-green-600 bg-green-50 border-green-200";

    const sectionBreakdownHtml = showSectionBreakdown && Object.keys(statistics.sectionBreakdown).length > 1
      ? this.renderSectionBreakdown(statistics.sectionBreakdown)
      : "";

    return `
      <div id="statistics-panel" class="bg-white rounded-xl p-5 border border-gray-200 shadow-sm" role="region" aria-label="Seat availability statistics">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 flex-1">
            <div class="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg" role="group" aria-label="Total seats: ${statistics.total}">
              <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <i class="fas fa-chair text-gray-600" aria-hidden="true"></i>
              </div>
              <div>
                <div class="text-xs text-gray-500 font-medium">Total</div>
                <div class="text-lg font-bold text-gray-900">${statistics.total}</div>
              </div>
            </div>
            <div class="flex items-center gap-3 px-4 py-3 bg-green-50 rounded-lg" role="group" aria-label="Available seats: ${statistics.available}">
              <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <i class="fas fa-check-circle text-green-600" aria-hidden="true"></i>
              </div>
              <div>
                <div class="text-xs text-gray-500 font-medium">Available</div>
                <div class="text-lg font-bold text-green-700">${statistics.available}</div>
              </div>
            </div>
            <div class="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg" role="group" aria-label="Booked seats: ${statistics.booked}">
              <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <i class="fas fa-ticket-alt text-gray-700" aria-hidden="true"></i>
              </div>
              <div>
                <div class="text-xs text-gray-500 font-medium">Booked</div>
                <div class="text-lg font-bold text-gray-900">${statistics.booked}</div>
              </div>
            </div>
            <div class="flex items-center gap-3 px-4 py-3 bg-amber-50 rounded-lg" role="group" aria-label="Reserved seats: ${statistics.reserved}">
              <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <i class="fas fa-clock text-amber-600" aria-hidden="true"></i>
              </div>
              <div>
                <div class="text-xs text-gray-500 font-medium">Reserved</div>
                <div class="text-lg font-bold text-amber-700">${statistics.reserved}</div>
              </div>
            </div>
            <div class="flex items-center gap-3 px-4 py-3 bg-red-50 rounded-lg" role="group" aria-label="Blocked seats: ${statistics.blocked}">
              <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <i class="fas fa-ban text-red-600" aria-hidden="true"></i>
              </div>
              <div>
                <div class="text-xs text-gray-500 font-medium">Blocked</div>
                <div class="text-lg font-bold text-red-700">${statistics.blocked}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="flex items-center gap-3 px-5 py-3 ${occupancyColor} rounded-xl shadow-sm border-2" role="group" aria-label="Occupancy rate: ${statistics.occupancyPercentage} percent">
            <i class="fas fa-chart-pie text-2xl" aria-hidden="true"></i>
            <div>
              <div class="text-xs font-medium opacity-75">Occupancy Rate</div>
              <div class="text-2xl font-bold">${statistics.occupancyPercentage}%</div>
            </div>
          </div>
          <div class="flex items-center gap-3 px-5 py-3 bg-indigo-50 rounded-xl shadow-sm border-2 border-indigo-200 text-indigo-600" role="group" aria-label="Total revenue: $${statistics.revenue.toFixed(2)}">
            <i class="fas fa-dollar-sign text-2xl" aria-hidden="true"></i>
            <div>
              <div class="text-xs font-medium opacity-75">Total Revenue</div>
              <div class="text-2xl font-bold">$${statistics.revenue.toFixed(2)}</div>
            </div>
          </div>
        </div>
        ${sectionBreakdownHtml}
      </div>
    `;
  },

  renderSectionBreakdown(sectionBreakdown) {
    const sections = Object.entries(sectionBreakdown);

    if (sections.length <= 1) {
      return "";
    }

    return `
      <div class="mt-4 pt-4 border-t border-gray-200">
        <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <i class="fas fa-layer-group text-indigo-600" aria-hidden="true"></i>
          <span>Section Breakdown</span>
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          ${sections.map(([sectionName, stats]) => {
            const occupancy = stats.total > 0
              ? Math.round(((stats.booked + stats.reserved) / stats.total) * 100)
              : 0;

            return `
              <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div class="font-semibold text-gray-900 mb-2 flex items-center justify-between">
                  <span>${sectionName}</span>
                  <span class="text-xs font-normal text-gray-500">${occupancy}%</span>
                </div>
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div class="flex justify-between">
                    <span class="text-gray-600">Total:</span>
                    <span class="font-semibold text-gray-900">${stats.total}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Available:</span>
                    <span class="font-semibold text-green-700">${stats.available}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Booked:</span>
                    <span class="font-semibold text-gray-900">${stats.booked}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Reserved:</span>
                    <span class="font-semibold text-amber-700">${stats.reserved}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Blocked:</span>
                    <span class="font-semibold text-red-700">${stats.blocked}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Revenue:</span>
                    <span class="font-semibold text-indigo-700">$${stats.revenue.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  },

  renderSeatMapViewer() {
    return `
      <section id="seat-map-section" class="bg-white rounded-xl shadow-md border border-gray-100 p-6 lg:p-8 hover:shadow-lg transition-shadow duration-200" aria-labelledby="seat-map-heading">
        <h2 id="seat-map-heading" class="text-lg sm:text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 pb-3 border-b border-gray-200">
          <i class="fas fa-chair text-indigo-600" aria-hidden="true"></i>
          <span>Seat Map</span>
        </h2>
        
        <div id="seat-map-content" role="region" aria-live="polite" aria-label="Seat map visualization">
          <div class="text-center py-16">
            <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-indigo-50 to-purple-50 mb-6">
              <i class="fas fa-hand-pointer text-5xl text-indigo-400"></i>
            </div>
            <p class="text-gray-700 font-semibold text-lg mb-2">Select a Showtime</p>
            <p class="text-sm text-gray-500 max-w-md mx-auto">
              Choose a showtime from the list above to view the interactive seat map with real-time booking status.
            </p>
          </div>
        </div>
      </section>
    `;
  },

  renderError(message, isInvalidId = false) {
    return `
      <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl p-8 sm:p-12 max-w-lg text-center border border-gray-200">
          <div class="inline-flex items-center justify-center w-24 h-24 rounded-full ${isInvalidId ? "bg-red-100" : "bg-yellow-100"} mb-6">
            <i class="fas ${isInvalidId ? "fa-exclamation-circle" : "fa-exclamation-triangle"} text-5xl ${isInvalidId ? "text-red-500" : "text-yellow-500"}"></i>
          </div>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            ${isInvalidId ? "Performance Not Found" : "Something Went Wrong"}
          </h1>
          <p class="text-gray-600 text-base mb-8 leading-relaxed">${message}</p>
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            ${!isInvalidId ? `
              <button
                id="retry-performance-load"
                class="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-md hover:shadow-lg"
              >
                <i class="fas fa-redo mr-2"></i>
                Try Again
              </button>
            ` : ""}
            <button
              id="back-to-performances-error"
              class="px-6 py-3 ${isInvalidId ? "bg-indigo-600 hover:bg-indigo-700" : "bg-gray-600 hover:bg-gray-700"} text-white rounded-lg transition-all duration-200 font-semibold focus:outline-none focus:ring-2 focus:ring-${isInvalidId ? "indigo" : "gray"}-500 focus:ring-offset-2 shadow-md hover:shadow-lg"
            >
              <i class="fas fa-arrow-left mr-2"></i>
              Back to Performances
            </button>
          </div>
        </div>
      </div>
    `;
  },

  async afterRender(params) {
  },

  attachEventHandlers() {
    const backButton = document.getElementById("back-to-performances");
    const backButtonMobile = document.getElementById("back-to-performances-mobile");

    if (backButton) {
      backButton.addEventListener("click", () => {
        page.redirect(ROUTES.ADMIN.PERFORMANCES);
      });
    }

    if (backButtonMobile) {
      backButtonMobile.addEventListener("click", () => {
        page.redirect(ROUTES.ADMIN.PERFORMANCES);
      });
    }


    const deleteBtn = document.getElementById("delete-performance-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => {
        this.handleDeletePerformance();
      });
    }

    this.attachShowtimeHandlers();
    this.attachEditModeToolbarHandlers();
    this.attachSelectionToolbarHandlers();
    this.attachKeyboardShortcuts();
  },

  attachKeyboardShortcuts() {
    if (this._keyboardHandler) {
      document.removeEventListener("keydown", this._keyboardHandler);
    }

    this._keyboardHandler = (e) => {
      const target = e.target;
      const isInputField = target.tagName === "INPUT" ||
                          target.tagName === "TEXTAREA" ||
                          target.tagName === "SELECT" ||
                          target.isContentEditable;

      if (isInputField) {
        return;
      }

      const userAgent = navigator.userAgent.toLowerCase();
      const isMac = userAgent.includes("mac") || userAgent.includes("macintosh");
      const modifierKey = isMac ? e.metaKey : e.ctrlKey;

      switch (e.key.toLowerCase()) {
        case "escape":
          if (this._editMode && this._selectedSeats.length > 0) {
            e.preventDefault();
            this.clearSeatSelection();
          }
          break;

        case "a":
          if (modifierKey && !e.shiftKey && this._editMode) {
            e.preventDefault();
            this.selectAllAvailableSeats();
          }
          break;

        case "b":
          if (!modifierKey && !e.shiftKey && !e.altKey && this._editMode && this._selectedSeats.length > 0) {
            e.preventDefault();
            this.handleToolbarAction("block");
          }
          break;

        case "u":
          if (!modifierKey && !e.shiftKey && !e.altKey && this._editMode && this._selectedSeats.length > 0) {
            e.preventDefault();
            this.handleToolbarAction("unblock");
          }
          break;

        case "z":
          if (modifierKey && e.shiftKey && this._editMode) {
            e.preventDefault();
            this.handleRedo();
          } else if (modifierKey && !e.shiftKey && this._editMode) {
            e.preventDefault();
            this.handleUndo();
          }
          break;

        default:
          break;
      }
    };

    document.addEventListener("keydown", this._keyboardHandler);

    this.announceToScreenReader("Keyboard shortcuts enabled.");
  },

  async handleUndo() {
    if (this._undoStack.length === 0) {
      const Notyf = window.Notyf;
      if (Notyf) {
        const notyf = new Notyf({
          duration: 2000,
          position: { x: "right", y: "top" },
        });
        notyf.error("Nothing to undo");
      }
      this.announceToScreenReader("Nothing to undo");
      return;
    }

    const change = this._undoStack.pop();

    try {
      await this.updateSeatStatus(change.seatIds, change.previousStatus, false);

      this._redoStack.push(change);

      const Notyf = window.Notyf;
      if (Notyf) {
        const notyf = new Notyf({
          duration: 2000,
          position: { x: "right", y: "top" },
        });
        notyf.success(`Undone: ${change.seatIds.length} seat(s) reverted to ${change.previousStatus}`);
      }

      this.announceToScreenReader(`Undone: ${change.seatIds.length} seats reverted to ${change.previousStatus}`);
    } catch (error) {
      console.error("Undo failed:", error);

      this._undoStack.push(change);

      const Notyf = window.Notyf;
      if (Notyf) {
        const notyf = new Notyf({
          duration: 3000,
          position: { x: "right", y: "top" },
        });
        notyf.error("Failed to undo: " + error.message);
      }

      this.announceToScreenReader("Failed to undo: " + error.message);
    }
  },

  async handleRedo() {
    if (this._redoStack.length === 0) {
      const Notyf = window.Notyf;
      if (Notyf) {
        const notyf = new Notyf({
          duration: 2000,
          position: { x: "right", y: "top" },
        });
        notyf.error("Nothing to redo");
      }
      this.announceToScreenReader("Nothing to redo");
      return;
    }

    const change = this._redoStack.pop();

    try {
      await this.updateSeatStatus(change.seatIds, change.newStatus, false);

      this._undoStack.push(change);

      const Notyf = window.Notyf;
      if (Notyf) {
        const notyf = new Notyf({
          duration: 2000,
          position: { x: "right", y: "top" },
        });
        notyf.success(`Redone: ${change.seatIds.length} seat(s) changed to ${change.newStatus}`);
      }

      this.announceToScreenReader(`Redone: ${change.seatIds.length} seats changed to ${change.newStatus}`);
    } catch (error) {
      console.error("Redo failed:", error);

      this._redoStack.push(change);

      const Notyf = window.Notyf;
      if (Notyf) {
        const notyf = new Notyf({
          duration: 3000,
          position: { x: "right", y: "top" },
        });
        notyf.error("Failed to redo: " + error.message);
      }

      this.announceToScreenReader("Failed to redo: " + error.message);
    }
  },

  pushToUndoStack(seatIds, previousStatus, newStatus) {
    const change = {
      action: newStatus === "blocked" ? "block" : "unblock",
      seatIds: [...seatIds],
      previousStatus: previousStatus,
      newStatus: newStatus,
      timestamp: Date.now(),
    };

    this._undoStack.push(change);

    if (this._undoStack.length > 10) {
      this._undoStack.shift();
    }

    this._redoStack = [];
  },

  getModifierKeyLabel() {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMac = userAgent.includes("mac") || userAgent.includes("macintosh");
    return isMac ? "⌘" : "Ctrl";
  },



  attachEditModeToolbarHandlers() {
    $("#select-all-seats").on("click", () => {
      this.selectAllAvailableSeats();
    });

    $("#select-all-blocked").on("click", () => {
      this.selectAllBlockedSeats();
    });

    $("#clear-selection").on("click", () => {
      this.clearSeatSelection();
    });

    const batchOperationsBtn = document.getElementById("batch-operations-btn");
    const batchOperationsMenu = document.getElementById("batch-operations-menu");

    if (batchOperationsBtn && batchOperationsMenu) {
      batchOperationsBtn.addEventListener("click", () => {
        batchOperationsMenu.classList.toggle("hidden");
      });

      document.addEventListener("click", (e) => {
        if (!batchOperationsBtn.contains(e.target) && !batchOperationsMenu.contains(e.target)) {
          batchOperationsMenu.classList.add("hidden");
        }
      });
    }

    const batchOpItems = document.querySelectorAll(".batch-op-item");
    batchOpItems.forEach(item => {
      item.addEventListener("click", () => {
        const action = item.getAttribute("data-action");
        this.handleBatchOperation(action);
        if (batchOperationsMenu) {
          batchOperationsMenu.classList.add("hidden");
        }
      });
    });

    const filterSeatsBtn = document.getElementById("filter-seats-btn");
    const filterSeatsMenu = document.getElementById("filter-seats-menu");

    if (filterSeatsBtn && filterSeatsMenu) {
      filterSeatsBtn.addEventListener("click", () => {
        filterSeatsMenu.classList.toggle("hidden");
      });

      document.addEventListener("click", (e) => {
        if (!filterSeatsBtn.contains(e.target) && !filterSeatsMenu.contains(e.target)) {
          filterSeatsMenu.classList.add("hidden");
        }
      });
    }

    const filterItems = document.querySelectorAll(".filter-item");
    filterItems.forEach(item => {
      item.addEventListener("click", () => {
        const filter = item.getAttribute("data-filter");
        this.applySeatFilter(filter);
        if (filterSeatsMenu) {
          filterSeatsMenu.classList.add("hidden");
        }
      });
    });
  },

  attachSelectionToolbarHandlers() {
    const toolbarBlockBtn = document.getElementById("toolbar-block-btn");
    if (toolbarBlockBtn) {
      toolbarBlockBtn.addEventListener("click", () => {
        this.handleToolbarAction("block");
      });
    }

    const toolbarUnblockBtn = document.getElementById("toolbar-unblock-btn");
    if (toolbarUnblockBtn) {
      toolbarUnblockBtn.addEventListener("click", () => {
        this.handleToolbarAction("unblock");
      });
    }

    const toolbarClearBtn = document.getElementById("toolbar-clear-btn");
    if (toolbarClearBtn) {
      toolbarClearBtn.addEventListener("click", () => {
        this.handleToolbarAction("clear");
      });
    }
  },

  selectAllAvailableSeats() {
    if (!this._seatStatusMap) {
      return;
    }

    this.clearSeatSelection();

    const container = $(".seat-map-container");
    if (!container.length) {
      return;
    }

    const seatElements = container.find(".seat, .interactive-seat");
    let selectedCount = 0;

    seatElements.each((index, seatElement) => {
      const $seat = $(seatElement);
      const fullId = $seat.attr("data-full-id");

      if (!fullId) {
        return;
      }

      const seatStatus = this._seatStatusMap.get(fullId);
      const status = seatStatus?.status || $seat.attr("data-status") || "available";

      if (status === "available") {
        this._selectedSeats.push(fullId);
        this.addSeatHighlight(seatElement);
        selectedCount++;
      }
    });

    this.announceToScreenReader(`All available seats selected. ${selectedCount} seats selected.`);

    const Notyf = window.Notyf;
    if (Notyf) {
      const notyf = new Notyf({
        duration: 2000,
        position: { x: "right", y: "top" },
      });
      notyf.success(`${selectedCount} available seats selected`);
    }

    this.refreshSelectionToolbar();
  },

  selectAllBlockedSeats() {
    if (!this._seatStatusMap) {
      return;
    }

    this.clearSeatSelection();

    const container = $(".seat-map-container");
    if (!container.length) {
      return;
    }

    const seatElements = container.find(".seat, .interactive-seat");
    let selectedCount = 0;

    seatElements.each((index, seatElement) => {
      const $seat = $(seatElement);
      const fullId = $seat.attr("data-full-id");

      if (!fullId) {
        return;
      }

      const seatStatus = this._seatStatusMap.get(fullId);
      const status = seatStatus?.status || $seat.attr("data-status");

      if (status === "blocked") {
        this._selectedSeats.push(fullId);
        this.addSeatHighlight(seatElement);
        selectedCount++;
      }
    });

    if (selectedCount === 0) {
      const Notyf = window.Notyf;
      if (Notyf) {
        const notyf = new Notyf({
          duration: 2000,
          position: { x: "right", y: "top" },
        });
        notyf.error("No blocked seats found");
      }
      return;
    }

    this.announceToScreenReader(`All blocked seats selected. ${selectedCount} seats selected.`);

    const Notyf = window.Notyf;
    if (Notyf) {
      const notyf = new Notyf({
        duration: 2000,
        position: { x: "right", y: "top" },
      });
      notyf.success(`${selectedCount} blocked seats selected`);
    }

    this.refreshSelectionToolbar();
  },

  clearSeatSelection() {
    if (this._selectedSeats.length === 0) {
      return;
    }

    const container = document.querySelector(".seat-map-container");
    if (container) {
      this._selectedSeats.forEach(fullId => {
        const seatElement = container.querySelector(`[data-full-id="${fullId}"]`);
        if (seatElement) {
          this.removeSeatHighlight(seatElement);
        }
      });
    }

    const count = this._selectedSeats.length;
    this._selectedSeats = [];

    this.announceToScreenReader(`Selection cleared. ${count} seats deselected.`);

    const Notyf = window.Notyf;
    if (Notyf) {
      const notyf = new Notyf({
        duration: 2000,
        position: { x: "right", y: "top" },
      });
      notyf.success(`Selection cleared (${count} seats)`);
    }

    this.refreshSelectionToolbar();
  },

  async handleBatchOperation(action) {
    if (!this._selectedShowtimeId) {
      const Notyf = window.Notyf;
      if (Notyf) {
        const notyf = new Notyf({
          duration: 3000,
          position: { x: "right", y: "top" },
        });
        notyf.error("Please select a showtime first");
      }
      return;
    }

    switch (action) {
      case "block-row":
        await this.showBlockRowDialog();
        break;

      case "block-section":
        await this.showBlockSectionDialog();
        break;

      case "select-by-status":
        await this.showSelectByStatusDialog();
        break;

      default:
        console.warn(`Unknown batch operation: ${action}`);
    }
  },

  async showBlockRowDialog() {
    const Swal = (await import("sweetalert2")).default;

    const rowOptions = this.generateRowOptions();

    if (rowOptions.length === 0) {
      await Swal.fire({
        title: "No Rows Available",
        text: "No rows found in the current seat map.",
        icon: "info",
        confirmButtonText: "OK",
        confirmButtonColor: "#4f46e5",
        customClass: {
          popup: "rounded-xl shadow-2xl",
          confirmButton: "rounded-lg px-6 py-3 font-semibold"
        }
      });
      return;
    }

    const result = await Swal.fire({
      title: "Block Row",
      html: `
        <div class="text-left space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Select Row</label>
            <select id="row-selector" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              ${rowOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join("")}
            </select>
          </div>
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p class="text-sm text-yellow-800">
              <i class="fas fa-exclamation-triangle mr-2"></i>
              This will block all available seats in the selected row.
            </p>
          </div>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Block Row",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      customClass: {
        popup: "rounded-xl shadow-2xl",
        confirmButton: "rounded-lg px-6 py-3 font-semibold",
        cancelButton: "rounded-lg px-6 py-3 font-semibold"
      },
      preConfirm: () => {
        const selector = document.getElementById("row-selector");
        return selector ? selector.value : null;
      }
    });

    if (result.isConfirmed && result.value) {
      await this.executeBatchBlockRow(result.value);
    }
  },

  async showBlockSectionDialog() {
    const Swal = (await import("sweetalert2")).default;

    const sectionOptions = this.generateSectionOptions();

    if (sectionOptions.length === 0) {
      await Swal.fire({
        title: "No Sections Available",
        text: "This venue does not have multiple sections.",
        icon: "info",
        confirmButtonText: "OK",
        confirmButtonColor: "#4f46e5",
        customClass: {
          popup: "rounded-xl shadow-2xl",
          confirmButton: "rounded-lg px-6 py-3 font-semibold"
        }
      });
      return;
    }

    const result = await Swal.fire({
      title: "Block Section",
      html: `
        <div class="text-left space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Select Section</label>
            <select id="section-selector" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              ${sectionOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join("")}
            </select>
          </div>
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p class="text-sm text-yellow-800">
              <i class="fas fa-exclamation-triangle mr-2"></i>
              This will block all available seats in the selected section.
            </p>
          </div>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Block Section",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      customClass: {
        popup: "rounded-xl shadow-2xl",
        confirmButton: "rounded-lg px-6 py-3 font-semibold",
        cancelButton: "rounded-lg px-6 py-3 font-semibold"
      },
      preConfirm: () => {
        const selector = document.getElementById("section-selector");
        return selector ? selector.value : null;
      }
    });

    if (result.isConfirmed && result.value) {
      await this.executeBatchBlockSection(result.value);
    }
  },

  async showSelectByStatusDialog() {
    const Swal = (await import("sweetalert2")).default;

    const result = await Swal.fire({
      title: "Select by Status",
      html: `
        <div class="text-left space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Select Status</label>
            <select id="status-selector" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option value="available">Available</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p class="text-sm text-blue-800">
              <i class="fas fa-info-circle mr-2"></i>
              This will select all seats matching the chosen status.
            </p>
          </div>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Select Seats",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#6b7280",
      customClass: {
        popup: "rounded-xl shadow-2xl",
        confirmButton: "rounded-lg px-6 py-3 font-semibold",
        cancelButton: "rounded-lg px-6 py-3 font-semibold"
      },
      preConfirm: () => {
        const selector = document.getElementById("status-selector");
        return selector ? selector.value : null;
      }
    });

    if (result.isConfirmed && result.value) {
      this.executeBatchSelectByStatus(result.value);
    }
  },

  generateRowOptions() {
    const performance = this._currentPerformance;
    if (!performance || !performance.seatMap) {
      return [];
    }

    const seatMap = performance.seatMap;
    const rowSet = new Set();

    if (seatMap.indexMap && typeof seatMap.indexMap === "object") {
      Object.values(seatMap.indexMap).forEach(seatData => {
        if (seatData.row) {
          rowSet.add(seatData.row);
        }
      });
    } else if (seatMap.rows) {
      const rows = parseInt(seatMap.rows) || 0;
      for (let i = 0; i < rows; i++) {
        const rowLetter = String.fromCharCode(65 + i);
        rowSet.add(rowLetter);
      }
    }

    const sortedRows = Array.from(rowSet).sort();

    return sortedRows.map(row => ({
      value: row,
      label: `Row ${row}`
    }));
  },

  generateSectionOptions() {
    const venue = this._currentVenue;
    if (!venue || !venue.layout || !venue.layout.sections) {
      return [];
    }

    const sections = venue.layout.sections;

    if (!Array.isArray(sections) || sections.length === 0) {
      return [];
    }

    return sections.map(section => ({
      value: section.name || section.id,
      label: section.name || section.id || "Unnamed Section"
    }));
  },

  async executeBatchBlockRow(rowIdentifier) {
    const container = document.querySelector(".seat-map-container");
    if (!container) {
      return;
    }

    const seatElements = container.querySelectorAll(".seat, .interactive-seat");
    const seatsToBlock = [];

    seatElements.forEach(seatElement => {
      const fullId = seatElement.getAttribute("data-full-id");
      const status = seatElement.getAttribute("data-status");

      if (!fullId) {
        return;
      }

      const seatData = this._currentPerformance?.seatMap?.indexMap?.[fullId];
      const seatRow = seatData?.row || fullId.charAt(0);

      if (seatRow === rowIdentifier && (status === "available" || status === "blocked")) {
        seatsToBlock.push(fullId);
      }
    });

    if (seatsToBlock.length === 0) {
      const Notyf = window.Notyf;
      if (Notyf) {
        const notyf = new Notyf({
          duration: 3000,
          position: { x: "right", y: "top" },
        });
        notyf.error(`No available seats found in row ${rowIdentifier}`);
      }
      return;
    }

    await this.executeBatchOperationWithProgress(
      seatsToBlock,
      "blocked",
      `Blocking row ${rowIdentifier}`,
      `Row ${rowIdentifier} blocked`
    );
  },

  async executeBatchBlockSection(sectionIdentifier) {
    const container = document.querySelector(".seat-map-container");
    if (!container) {
      return;
    }

    const seatElements = container.querySelectorAll(".seat, .interactive-seat");
    const seatsToBlock = [];

    seatElements.forEach(seatElement => {
      const fullId = seatElement.getAttribute("data-full-id");
      const status = seatElement.getAttribute("data-status");

      if (!fullId) {
        return;
      }

      const seatData = this._currentPerformance?.seatMap?.indexMap?.[fullId];
      const seatSection = seatData?.sectionName || seatData?.section;

      if (seatSection === sectionIdentifier && (status === "available" || status === "blocked")) {
        seatsToBlock.push(fullId);
      }
    });

    if (seatsToBlock.length === 0) {
      const Notyf = window.Notyf;
      if (Notyf) {
        const notyf = new Notyf({
          duration: 3000,
          position: { x: "right", y: "top" },
        });
        notyf.error(`No available seats found in section ${sectionIdentifier}`);
      }
      return;
    }

    await this.executeBatchOperationWithProgress(
      seatsToBlock,
      "blocked",
      `Blocking section ${sectionIdentifier}`,
      `Section ${sectionIdentifier} blocked`
    );
  },

  executeBatchSelectByStatus(statusFilter) {
    const container = $(".seat-map-container");
    if (!container.length) {
      return;
    }

    this.clearSeatSelection();

    const seatElements = container.find(".seat, .interactive-seat");
    let selectedCount = 0;

    seatElements.each((index, seatElement) => {
      const $seat = $(seatElement);
      const fullId = $seat.attr("data-full-id");

      if (!fullId) {
        return;
      }

      const seatStatus = this._seatStatusMap?.get(fullId);
      const status = seatStatus?.status || $seat.attr("data-status") || "available";

      if (status === statusFilter) {
        this._selectedSeats.push(fullId);
        this.addSeatHighlight(seatElement);
        selectedCount++;
      }
    });

    if (selectedCount === 0) {
      const Notyf = window.Notyf;
      if (Notyf) {
        const notyf = new Notyf({
          duration: 3000,
          position: { x: "right", y: "top" },
        });
        notyf.error(`No ${statusFilter} seats found`);
      }
      return;
    }

    this.announceToScreenReader(`${selectedCount} ${statusFilter} seats selected`);

    const Notyf = window.Notyf;
    if (Notyf) {
      const notyf = new Notyf({
        duration: 2000,
        position: { x: "right", y: "top" },
      });
      notyf.success(`${selectedCount} ${statusFilter} seats selected`);
    }

    this.refreshSelectionToolbar();
  },

  applySeatFilter(filter) {
    if (filter === "clear") {
      this.clearSeatFilter();
      return;
    }

    this._seatFilter = filter;

    const container = document.querySelector(".seat-map-container");
    if (!container) {
      return;
    }

    const seatElements = container.querySelectorAll(".seat, .interactive-seat");

    seatElements.forEach(seatElement => {
      const status = seatElement.getAttribute("data-status");

      if (!status) {
        return;
      }

      const shouldShow = this.shouldShowSeat(status, filter);

      if (shouldShow) {
        seatElement.style.opacity = "1";
        seatElement.style.filter = "";
        seatElement.style.pointerEvents = "auto";
      } else {
        seatElement.style.opacity = "0.15";
        seatElement.style.filter = "grayscale(100%)";
        seatElement.style.pointerEvents = "none";
      }
    });

    const filterLabels = {
      available: "available",
      blocked: "blocked",
      booked: "booked and reserved",
    };

    const filterLabel = filterLabels[filter] || filter;

    this.announceToScreenReader(`Filter applied: showing only ${filterLabel} seats.`);

    const Notyf = window.Notyf;
    if (Notyf) {
      const notyf = new Notyf({
        duration: 2000,
        position: { x: "right", y: "top" },
      });
      notyf.success(`Showing only ${filterLabel} seats`);
    }
  },

  shouldShowSeat(status, filter) {
    switch (filter) {
      case "available":
        return status === "available";
      case "blocked":
        return status === "blocked";
      case "booked":
        return status === "booked" || status === "reserved";
      default:
        return true;
    }
  },

  clearSeatFilter() {
    this._seatFilter = null;

    const container = document.querySelector(".seat-map-container");
    if (!container) {
      return;
    }

    const seatElements = container.querySelectorAll(".seat, .interactive-seat");

    seatElements.forEach(seatElement => {
      seatElement.style.opacity = "1";
      seatElement.style.filter = "";
      seatElement.style.pointerEvents = "auto";
    });

    this.announceToScreenReader("Filters cleared. All seats are now visible.");

    const Notyf = window.Notyf;
    if (Notyf) {
      const notyf = new Notyf({
        duration: 2000,
        position: { x: "right", y: "top" },
      });
      notyf.success("Filters cleared");
    }
  },

  reapplySeatFilter() {
    if (!this._seatFilter) {
      return;
    }

    const container = document.querySelector(".seat-map-container");
    if (!container) {
      return;
    }

    const seatElements = container.querySelectorAll(".seat, .interactive-seat");

    seatElements.forEach(seatElement => {
      const status = seatElement.getAttribute("data-status");

      if (!status) {
        return;
      }

      const shouldShow = this.shouldShowSeat(status, this._seatFilter);

      if (shouldShow) {
        seatElement.style.opacity = "1";
        seatElement.style.filter = "";
        seatElement.style.pointerEvents = "auto";
      } else {
        seatElement.style.opacity = "0.15";
        seatElement.style.filter = "grayscale(100%)";
        seatElement.style.pointerEvents = "none";
      }
    });
  },

  async executeBatchOperationWithProgress(seatIds, status, progressMessage, successMessage) {
    if (!seatIds || seatIds.length === 0) {
      return;
    }

    const Swal = (await import("sweetalert2")).default;

    const batchSize = 50;
    const totalBatches = Math.ceil(seatIds.length / batchSize);
    let completedBatches = 0;
    let successCount = 0;
    let failCount = 0;

    if (seatIds.length > batchSize) {
      Swal.fire({
        title: progressMessage,
        html: `
          <div class="space-y-4">
            <div class="text-sm text-gray-600">Processing ${seatIds.length} seats...</div>
            <div class="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div id="progress-bar" class="bg-indigo-600 h-4 rounded-full transition-all duration-300" style="width: 0%"></div>
            </div>
            <div id="progress-text" class="text-sm font-semibold text-gray-700">0%</div>
          </div>
        `,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
    }

    for (let i = 0; i < seatIds.length; i += batchSize) {
      const batch = seatIds.slice(i, i + batchSize);

      try {
        await this.updateSeatStatus(batch, status);
        successCount += batch.length;
      } catch (error) {
        console.error(`Batch operation failed for batch ${completedBatches + 1}:`, error);
        failCount += batch.length;
      }

      completedBatches++;

      if (seatIds.length > batchSize) {
        const progressPercentage = Math.round((completedBatches / totalBatches) * 100);
        const progressBar = document.getElementById("progress-bar");
        const progressText = document.getElementById("progress-text");

        if (progressBar) {
          progressBar.style.width = `${progressPercentage}%`;
        }

        if (progressText) {
          progressText.textContent = `${progressPercentage}%`;
        }
      }
    }

    if (seatIds.length > batchSize) {
      Swal.close();
    }

    const Notyf = window.Notyf;
    if (Notyf) {
      const notyf = new Notyf({
        duration: 4000,
        position: { x: "right", y: "top" },
      });

      if (failCount === 0) {
        notyf.success(`${successMessage}: ${successCount} seat(s) updated successfully`);
      } else if (successCount > 0) {
        notyf.error(`Partial success: ${successCount} succeeded, ${failCount} failed`);
      } else {
        notyf.error(`Operation failed: ${failCount} seat(s) could not be updated`);
      }
    }

    this.announceToScreenReader(`Batch operation complete. ${successCount} seats updated, ${failCount} failed.`);
  },

  async handleToolbarAction(action) {
    if (this._selectedSeats.length === 0) {
      return;
    }

    const Notyf = window.Notyf;
    const notyf = Notyf ? new Notyf({
      duration: 3000,
      position: { x: "right", y: "top" },
    }) : null;

    switch (action) {
      case "block":
        await this.updateSeatStatus(this._selectedSeats, "blocked");
        break;

      case "unblock":
        await this.updateSeatStatus(this._selectedSeats, "available");
        break;

      case "clear":
        this.clearSeatSelection();
        this.refreshSelectionToolbar();
        break;

      default:
        console.warn(`Unknown toolbar action: ${action}`);
    }
  },

  async updateSeatStatus(seatIds, status, trackInUndoStack = true) {
    if (!seatIds || seatIds.length === 0) {
      return;
    }

    if (!this._selectedShowtimeId) {
      const Notyf = window.Notyf;
      if (Notyf) {
        const notyf = new Notyf({
          duration: 3000,
          position: { x: "right", y: "top" },
        });
        notyf.error("No showtime selected");
      }
      return;
    }

    const performanceId = this._currentPerformance?.id;
    if (!performanceId) {
      const Notyf = window.Notyf;
      if (Notyf) {
        const notyf = new Notyf({
          duration: 3000,
          position: { x: "right", y: "top" },
        });
        notyf.error("Invalid performance data");
      }
      return;
    }

    const container = document.querySelector(".seat-map-container");
    if (!container) {
      return;
    }

    const previousStates = new Map();
    seatIds.forEach(seatId => {
      const seatElement = container.querySelector(`[data-full-id="${seatId}"]`);
      if (seatElement) {
        const currentStatus = seatElement.getAttribute("data-status");
        const rect = seatElement.querySelector("rect");
        const currentFill = rect ? rect.getAttribute("fill") : null;
        previousStates.set(seatId, { status: currentStatus, fill: currentFill, element: seatElement });
      }
    });

    this.showSeatUpdateLoading(seatIds);

    try {
      const response = await fetch(
        `/api/performances/${performanceId}/seats/batch-update`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            showtimeId: this._selectedShowtimeId,
            seatIds: seatIds,
            status: status,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update seats: ${response.statusText}`);
      }

      const result = await response.json();

      this.updateSeatColorsImmediately(seatIds, status);

      if (this._seatStatusMap) {
        seatIds.forEach(seatId => {
          const existingStatus = this._seatStatusMap.get(seatId);
          if (existingStatus) {
            existingStatus.status = status;
          } else {
            this._seatStatusMap.set(seatId, { status: status });
          }
        });
      }

      if (trackInUndoStack) {
        const previousStatusValues = Array.from(previousStates.values()).map(s => s.status);
        const mostCommonPreviousStatus = previousStatusValues.length > 0
          ? previousStatusValues.sort((a, b) =>
              previousStatusValues.filter(v => v === a).length - previousStatusValues.filter(v => v === b).length
            ).pop()
          : "available";

        this.pushToUndoStack(seatIds, mostCommonPreviousStatus, status);
      }

      this.clearSeatSelection();
      this.refreshSelectionToolbar();

      const Notyf = window.Notyf;
      if (Notyf) {
        const notyf = new Notyf({
          duration: 3000,
          position: { x: "right", y: "top" },
        });
        const statusLabel = status === "blocked" ? "blocked" : "made available";
        notyf.success(`${result.updated || seatIds.length} seat(s) ${statusLabel} successfully`);
      }

      this.announceToScreenReader(`${seatIds.length} seats updated to ${status}`);

      this.updateShowtimeStats();
      this.updateStatisticsPanel();

    } catch (error) {
      console.error("Failed to update seat status:", error);

      this.revertSeatVisuals(previousStates);

      const Notyf = window.Notyf;
      if (Notyf) {
        const notyf = new Notyf({
          duration: 4000,
          position: { x: "right", y: "top" },
        });
        notyf.error(error.message || "Failed to update seats. Please try again.");
      }

      this.announceToScreenReader(`Failed to update seats: ${error.message}`);
    }
  },

  showSeatUpdateLoading(seatIds) {
    const container = document.querySelector(".seat-map-container");
    if (!container) {
      return;
    }

    seatIds.forEach(seatId => {
      const seatElement = container.querySelector(`[data-full-id="${seatId}"]`);
      if (seatElement) {
        const rect = seatElement.querySelector("rect");
        if (rect) {
          rect.classList.add("seat-updating");
          rect.style.opacity = "0.6";
          rect.style.animation = "pulse 1s ease-in-out infinite";
        }
      }
    });
  },

  updateSeatColorsImmediately(seatIds, status) {
    const container = document.querySelector(".seat-map-container");
    if (!container) {
      return;
    }

    const newColor = getSeatColor(status);

    seatIds.forEach(seatId => {
      const seatElement = container.querySelector(`[data-full-id="${seatId}"]`);
      if (seatElement) {
        const rect = seatElement.querySelector("rect");
        if (rect) {
          rect.classList.remove("seat-updating");
          rect.style.opacity = "1";
          rect.style.animation = "";
          rect.setAttribute("fill", newColor);
          seatElement.setAttribute("data-status", status);

          seatElement.classList.add("seat-updated");
          setTimeout(() => {
            seatElement.classList.remove("seat-updated");
          }, 1000);
        }
      }
    });

    if (this._seatFilter) {
      this.reapplySeatFilter();
    }
  },

  revertSeatVisuals(previousStates) {
    previousStates.forEach((state, seatId) => {
      const seatElement = state.element;
      if (seatElement) {
        const rect = seatElement.querySelector("rect");
        if (rect) {
          rect.classList.remove("seat-updating");
          rect.style.opacity = "1";
          rect.style.animation = "";

          if (state.fill) {
            rect.setAttribute("fill", state.fill);
          }
          if (state.status) {
            seatElement.setAttribute("data-status", state.status);
          }
        }
      }
    });
  },

  refreshSelectionToolbar() {
    const container = document.getElementById("performance-details-container");
    if (container) {
      const existingToolbar = document.getElementById("selection-toolbar");
      if (existingToolbar) {
        existingToolbar.remove();
      }

      if (this._selectedSeats.length > 0) {
        const toolbarHtml = this.renderSelectionToolbar();
        container.insertAdjacentHTML("beforeend", toolbarHtml);
        this.attachSelectionToolbarHandlers();
      }
    }
  },

  async handleDeletePerformance() {
    const performance = this._currentPerformance;
    if (!performance) {
      console.error("No performance data available");
      return;
    }

    const Swal = (await import("sweetalert2")).default;

    const result = await Swal.fire({
      title: "Delete Performance?",
      html: `
        <div class="text-left space-y-3">
          <p class="text-gray-700">Are you sure you want to delete this performance?</p>
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <p class="font-semibold text-gray-900 mb-1">${performance.title}</p>
            <p class="text-sm text-gray-600">${performance.composer}</p>
          </div>
          <p class="text-sm text-red-600 font-semibold">
            <i class="fas fa-exclamation-triangle mr-1"></i>
            This action cannot be undone.
          </p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      customClass: {
        popup: "rounded-xl shadow-2xl",
        confirmButton: "rounded-lg px-6 py-3 font-semibold",
        cancelButton: "rounded-lg px-6 py-3 font-semibold"
      }
    });

    if (result.isConfirmed) {
      try {
        await performanceAPI.delete(performance.id);

        await Swal.fire({
          title: "Deleted!",
          text: "Performance has been deleted successfully.",
          icon: "success",
          confirmButtonText: "OK",
          confirmButtonColor: "#10b981",
          customClass: {
            popup: "rounded-xl shadow-2xl",
            confirmButton: "rounded-lg px-6 py-3 font-semibold"
          }
        });

        page.redirect(ROUTES.ADMIN.PERFORMANCES);
      } catch (error) {
        console.error("Failed to delete performance:", error);

        await Swal.fire({
          title: "Error",
          text: error.message || "Failed to delete performance. Please try again.",
          icon: "error",
          confirmButtonText: "OK",
          confirmButtonColor: "#ef4444",
          customClass: {
            popup: "rounded-xl shadow-2xl",
            confirmButton: "rounded-lg px-6 py-3 font-semibold"
          }
        });
      }
    }
  },

  attachErrorHandlers() {
    // Attach error back button handler
    const errorBackButton = document.getElementById("back-to-performances-error");
    if (errorBackButton) {
      errorBackButton.addEventListener("click", () => {
        page.redirect(ROUTES.ADMIN.PERFORMANCES);
      });
    }

    // Attach retry button handler
    const retryButton = document.getElementById("retry-performance-load");
    if (retryButton) {
      retryButton.addEventListener("click", async () => {
        const container = document.getElementById("performance-details-container");
        if (container) {
          container.innerHTML = this.renderLoadingPage();
        }

        // Get performance ID from URL
        const pathParts = window.location.pathname.split("/");
        const id = pathParts[pathParts.length - 1];

        try {
          const response = await performanceAPI.getById(id);
          const performance = response.data?.performance || response.performance || response;

          if (!performance || !performance.id) {
            throw new Error("Invalid performance data received");
          }

          this._currentPerformance = performance;
          this._currentVenue = performance.venue;
          this._currentShowtimes = performance.showtimes || [];
          this._currentTicketTypes = performance.pricingSections || performance.ticketTypes || [];

          if (container) {
            container.innerHTML = this.renderPageContent();
            this.attachEventHandlers();
            await this.loadBookingData();
          }
        } catch (error) {
          console.error("Retry failed:", error);
          const isNotFound = error.response?.status === 404;
          if (container) {
            container.innerHTML = this.renderError(
              isNotFound
                ? "Performance not found. The performance may have been deleted or the ID is invalid."
                : "Failed to load performance details. Please try again.",
              isNotFound
            );
            this.attachErrorHandlers();
          }
        }
      });
    }
  },

  navigateToSeatManagement() {
    const performanceId = this._currentPerformance?.id;
    const showtimeId = this._selectedShowtimeId;

    if (!performanceId) {
      console.error("No performance ID available for seat management navigation");
      return;
    }

    // Build URL with query parameters
    let url = `${ROUTES.ADMIN.SEAT_MANAGEMENT}?performanceId=${performanceId}`;

    // Add showtime ID if one is selected
    if (showtimeId) {
      url += `&showtimeId=${showtimeId}`;
    }

    page.redirect(url);
  },

  attachShowtimeHandlers() {
    const showtimeButtons = document.querySelectorAll(".showtime-item");

    showtimeButtons.forEach((button, index) => {
      // Click handler
      button.addEventListener("click", (e) => {
        e.preventDefault();
        this.selectShowtime(button, showtimeButtons);
      });

      // Keyboard navigation handler
      button.addEventListener("keydown", (e) => {
        const currentIndex = parseInt(button.getAttribute("data-showtime-index"));

        switch(e.key) {
          case "Enter":
          case " ": // Space key
            e.preventDefault();
            this.selectShowtime(button, showtimeButtons);
            break;

          case "ArrowDown":
          case "Down":
            e.preventDefault();
            this.focusNextShowtime(currentIndex, showtimeButtons, 1);
            break;

          case "ArrowUp":
          case "Up":
            e.preventDefault();
            this.focusNextShowtime(currentIndex, showtimeButtons, -1);
            break;

          case "Home":
            e.preventDefault();
            showtimeButtons[0]?.focus();
            break;

          case "End":
            e.preventDefault();
            showtimeButtons[showtimeButtons.length - 1]?.focus();
            break;
        }
      });
    });
  },

  selectShowtime(button, allButtons) {
    const showtimeId = button.getAttribute("data-showtime-id");
    const showtimeDate = button.querySelector(".font-bold.text-gray-900")?.textContent || "selected showtime";

    // Update selected showtime
    this._selectedShowtimeId = showtimeId;

    // Update UI - highlight selected showtime
    allButtons.forEach(btn => {
      const isSelected = btn.getAttribute("data-showtime-id") === showtimeId;
      btn.classList.toggle("border-indigo-500", isSelected);
      btn.classList.toggle("bg-gradient-to-r", isSelected);
      btn.classList.toggle("from-indigo-50", isSelected);
      btn.classList.toggle("to-purple-50", isSelected);
      btn.classList.toggle("shadow-md", isSelected);
      btn.classList.toggle("border-gray-200", !isSelected);
      btn.classList.toggle("hover:border-indigo-300", !isSelected);
      btn.classList.toggle("hover:shadow-md", !isSelected);

      // Update aria-pressed attribute
      btn.setAttribute("aria-pressed", isSelected);

      // Update check icon
      const existingCheck = btn.querySelector(".fa-check-circle");
      if (isSelected && !existingCheck) {
        const checkIcon = document.createElement("i");
        checkIcon.className = "fas fa-check-circle text-indigo-600";
        btn.querySelector(".flex.items-center.justify-between").appendChild(checkIcon);
      } else if (!isSelected && existingCheck) {
        existingCheck.remove();
      }
    });

    $("#edit-mode-toolbar").removeClass("hidden lg:hidden").addClass("lg:block");
    $("#main-content").addClass("lg:pr-80");

    this.announceToScreenReader(`Showtime ${showtimeDate} selected. Loading seat map.`);

    this.renderSeatMapForShowtime(showtimeId);
  },

  focusNextShowtime(currentIndex, buttons, direction) {
    const nextIndex = currentIndex + direction;

    if (nextIndex >= 0 && nextIndex < buttons.length) {
      buttons[nextIndex]?.focus();
    }
  },

  announceToScreenReader(message) {
    const announcer = document.getElementById("sr-announcements");
    if (announcer) {
      announcer.textContent = "";
      setTimeout(() => {
        announcer.textContent = message;
      }, 100);
    }
  },

  updateShowtimeStats() {
    const showtimeItems = document.querySelectorAll(".showtime-item");

    showtimeItems.forEach((item) => {
      const showtimeId = item.getAttribute("data-showtime-id");
      const showtimeIndex = parseInt(item.getAttribute("data-showtime-index"));
      const showtime = this._currentShowtimes[showtimeIndex];

      if (!showtime) {return;}

      const totalSeats = showtime.totalSeats || this._currentPerformance?.totalSeats || this.calculateTotalSeatsFromSeatMap() || 0;
      const bookedSeats = this.calculateBookedSeatsForShowtime(showtimeId);
      const blockedSeats = this.calculateBlockedSeatsForShowtime(showtimeId);
      const availableSeats = Math.max(0, totalSeats - bookedSeats - blockedSeats);
      const occupancyPercentage = totalSeats > 0 ? Math.round(((bookedSeats + blockedSeats) / totalSeats) * 100) : 0;

      const statsContainer = item.querySelector(".grid.grid-cols-2");
      if (statsContainer) {
        const availableDiv = statsContainer.children[1]?.querySelector("div:last-child");
        const bookedDiv = statsContainer.children[2]?.querySelector("div:last-child");
        const occupancyDiv = statsContainer.children[3]?.querySelector("div:last-child");

        if (availableDiv) {availableDiv.innerHTML = `<div class="font-bold text-green-700">${availableSeats}</div>`;}
        if (bookedDiv) {bookedDiv.innerHTML = `<div class="font-bold text-gray-900">${bookedSeats}</div>`;}
        if (occupancyDiv) {occupancyDiv.innerHTML = `<div class="font-bold">${occupancyPercentage}%</div>`;}

        const occupancyColor = occupancyPercentage > 80
          ? "text-red-600 bg-red-50"
          : occupancyPercentage > 50
            ? "text-amber-600 bg-amber-50"
            : "text-green-600 bg-green-50";

        const occupancyCard = statsContainer.children[3];
        if (occupancyCard) {
          occupancyCard.className = `flex items-center gap-2 px-3 py-2 ${occupancyColor} rounded-lg`;
        }
      }
    });
  },

  calculateTotalSeatsFromSeatMap() {
    const performance = this._currentPerformance;

    if (!performance || !performance.seatMap) {
      return 0;
    }

    const seatMap = performance.seatMap;

    if (seatMap.sections && Array.isArray(seatMap.sections)) {
      let total = 0;
      seatMap.sections.forEach(section => {
        const rows = section.rows || 0;
        const seatsPerRow = section.seatsPerRow || 0;
        total += rows * seatsPerRow;
      });
      return total;
    }

    const rows = seatMap.rows || 0;
    const seatsPerRow = seatMap.seats || 0;
    return rows * seatsPerRow;
  },

  calculateBookedSeatsForShowtime(showtimeId) {
    if (!this._bookingsData || !Array.isArray(this._bookingsData)) {
      return 0;
    }

    const showtimeBookings = this._bookingsData.filter(booking => {
      const bookingShowtimeId = booking.showtimeId || booking.showtime?.id;
      return String(bookingShowtimeId) === String(showtimeId);
    });

    let bookedCount = 0;
    showtimeBookings.forEach(booking => {
      if (booking.seatTickets && Array.isArray(booking.seatTickets)) {
        bookedCount += booking.seatTickets.length;
      }
    });

    return bookedCount;
  },

  calculateBlockedSeatsForShowtime(showtimeId) {
    const performance = this._currentPerformance;
    if (!performance?.seatMap?.blockedSeats || !showtimeId) {
      return 0;
    }

    const blockedSeatsMap = performance.seatMap.blockedSeats;
    const blockedSeatsForShowtime = blockedSeatsMap[showtimeId];

    if (!blockedSeatsForShowtime || !Array.isArray(blockedSeatsForShowtime)) {
      return 0;
    }

    return blockedSeatsForShowtime.length;
  },

  async loadBookingData(retryCount = 0, maxRetries = 3) {
    if (this._bookingsLoading) {
      return;
    }

    const performance = this._currentPerformance;
    if (!performance || !performance.id) {
      this.renderSeatMapError("Invalid performance data");
      return;
    }

    const cacheKey = `bookings-${performance.id}`;
    const cachedData = this._bookingsCache.get(cacheKey);

    if (cachedData && Date.now() - cachedData.timestamp < this._cacheTTL) {
      this._bookingsData = cachedData.data;
      this._bookingsLoaded = true;
      return;
    }

    if (this._bookingsLoaded && this._bookingsData) {
      return;
    }

    this._bookingsLoading = true;
    this._bookingsError = null;

    this._abortController = new AbortController();

    const contentContainer = document.getElementById("seat-map-content");
    if (contentContainer) {
      contentContainer.innerHTML = this.renderLoadingState();
    }

    try {
      const bookings = await bookingService.getBookingsByPerformance(performance.id, {
        maxRetries: maxRetries,
        retryDelay: 1000
      });

      if (this._abortController.signal.aborted) {
        return;
      }

      this._bookingsData = bookings;
      this._bookingsLoaded = true;
      this._bookingsLoading = false;

      this._bookingsCache.set(cacheKey, {
        data: bookings,
        timestamp: Date.now(),
      });

      this.updateShowtimeStats();

      if (contentContainer && !this._selectedShowtimeId) {
        contentContainer.innerHTML = `
          <div class="text-center py-16">
            <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-indigo-50 to-purple-50 mb-6">
              <i class="fas fa-hand-pointer text-5xl text-indigo-400"></i>
            </div>
            <p class="text-gray-700 font-semibold text-lg mb-2">Select a Showtime</p>
            <p class="text-sm text-gray-500 max-w-md mx-auto">
              Choose a showtime from the list above to view the interactive seat map with real-time booking status.
            </p>
          </div>
        `;
      }

    } catch (error) {
      if (this._abortController.signal.aborted) {
        return;
      }

      console.error("Failed to load booking data:", error);

      // Implement retry logic with exponential backoff
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
        console.log(`Retrying booking data load in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})...`);

        this._bookingsLoading = false;

        // Show retry message in UI
        if (contentContainer) {
          contentContainer.innerHTML = `
            <div class="text-center py-8 text-gray-500">
              <i class="fas fa-spinner fa-spin text-4xl mb-4"></i>
              <p>Loading booking data...</p>
              <p class="text-sm mt-2">Retry attempt ${retryCount + 1} of ${maxRetries}</p>
            </div>
          `;
        }

        await new Promise(resolve => setTimeout(resolve, delay));

        // Check if aborted during delay
        if (this._abortController.signal.aborted) {
          return;
        }

        return this.loadBookingData(retryCount + 1, maxRetries);
      }

      // All retries exhausted
      this._bookingsError = error.message || "Failed to load booking data";
      this._bookingsLoading = false;

      this.renderSeatMapError(this._bookingsError);
    }
  },

  renderLoadingState() {
    return `
      <div class="text-center py-12">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-50 mb-4">
          <i class="fas fa-spinner fa-spin text-4xl text-indigo-600"></i>
        </div>
        <p class="text-gray-700 font-semibold text-lg">Loading booking data...</p>
        <p class="text-sm text-gray-500 mt-2">Please wait while we fetch seat availability</p>
      </div>
    `;
  },

  renderSeatMapError(errorMessage) {
    const contentContainer = document.getElementById("seat-map-content");
    if (!contentContainer) {return;}

    contentContainer.innerHTML = `
      <div class="text-center py-12">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 mb-4">
          <i class="fas fa-exclamation-triangle text-4xl text-red-500"></i>
        </div>
        <p class="text-gray-900 font-bold text-lg mb-2">Failed to Load Booking Data</p>
        <p class="text-sm text-gray-600 mb-6 max-w-md mx-auto">${errorMessage || "An error occurred while fetching booking information. Please try again."}</p>
        <button
          id="retry-booking-load"
          class="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-md hover:shadow-lg"
        >
          <i class="fas fa-redo mr-2"></i>
          Try Again
        </button>
      </div>
    `;

    const retryButton = document.getElementById("retry-booking-load");
    if (retryButton) {
      retryButton.addEventListener("click", () => {
        this._bookingsLoaded = false;
        this._bookingsData = null;
        this._bookingsError = null;
        this.loadBookingData();
      });
    }
  },

  renderSeatMapForShowtime(showtimeId) {
    console.log("=== renderSeatMapForShowtime DEBUG ===");
    console.log("Showtime ID:", showtimeId);
    console.log("Performance:", this._currentPerformance);
    console.log("SeatMap:", this._currentPerformance?.seatMap);
    console.log("Venue:", this._currentVenue);
    console.log("Bookings Data:", this._bookingsData);

    if (!this._bookingsData) {
      const contentContainer = document.getElementById("seat-map-content");
      if (contentContainer) {
        contentContainer.innerHTML = `
          <div class="text-center py-8 text-gray-500">
            <p>No booking data available</p>
          </div>
        `;
      }
      return;
    }

    if (!this._currentPerformance?.seatMap) {
      const contentContainer = document.getElementById("seat-map-content");
      if (contentContainer) {
        contentContainer.innerHTML = `
          <div class="text-center py-12">
            <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-50 mb-4">
              <i class="fas fa-exclamation-circle text-4xl text-yellow-500"></i>
            </div>
            <p class="text-gray-900 font-bold text-lg mb-2">Seat Map Not Configured</p>
            <p class="text-sm text-gray-600 mt-2 max-w-md mx-auto">
              This performance doesn't have a seat map configured.
            </p>
          </div>
        `;
      }
      return;
    }

    const showtimeBookings = this._bookingsData.filter(booking => {
      const bookingShowtimeId = booking.showtimeId || booking.showtime?.id;
      const matches = String(bookingShowtimeId) === String(showtimeId);
      if (matches) {
        console.log("Matched booking:", booking.bookingReference, "for showtime:", showtimeId);
      }
      return matches;
    });

    console.log("Filtered bookings for showtime:", showtimeBookings.length);

    const contentContainer = document.getElementById("seat-map-content");
    if (contentContainer) {
      contentContainer.innerHTML = this.renderSeatMapViewerContent(showtimeId, showtimeBookings);

      setTimeout(() => {
        const container = document.querySelector(".seat-map-container");
        if (container) {
          if (!this._seatMapTooltip) {
            this._seatMapTooltip = new SeatMapTooltip("seat-tooltip-performance");
          }

          const seatDetails = {};
          if (this._currentPerformance?.seatMap?.indexMap) {
            Object.keys(this._currentPerformance.seatMap.indexMap).forEach(fullId => {
              const seatData = this._currentPerformance.seatMap.indexMap[fullId];
              const seatStatus = this._seatStatusMap?.get(fullId);
              const pricing = this._currentTicketTypes?.find(
                ps => ps.sectionName?.toLowerCase() === seatData.sectionName?.toLowerCase()
              );

              const isBlocked = seatStatus?.status === "blocked";

              seatDetails[fullId] = {
                status: seatStatus?.status || "available",
                booking: seatStatus?.booking,
                seatTicket: seatStatus?.seatTicket,
                tier: seatData.tier,
                section: seatData.sectionName,
                price: pricing ? parseFloat(pricing.basePrice) : 0,
                updatedAt: isBlocked ? this._currentPerformance.updatedAt : undefined,
              };
            });
          }

          this._seatMapTooltip.attach(container, this._seatStatusMap, seatDetails);
          this.attachSeatClickHandlers(container);
        }

        if (this._panzoomInstance) {
          this._panzoomInstance.dispose();
        }
        this._panzoomInstance = initSeatMapPanzoom(".seat-map-container");
      }, 100);
    }

    this.startBookingPolling();
  },

  renderSeatMapViewerContent(showtimeId, bookings) {
    const performance = this._currentPerformance;

    if (!performance || !performance.seatMap) {
      return `
        <div class="text-center py-12">
          <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-50 mb-4">
            <i class="fas fa-exclamation-circle text-4xl text-yellow-500"></i>
          </div>
          <p class="text-gray-900 font-bold text-lg mb-2">Seat Map Not Configured</p>
          <p class="text-sm text-gray-600 mt-2 max-w-md mx-auto">
            This performance doesn't have a seat map configured. Please configure the venue layout in the performance settings to view seat availability.
          </p>
        </div>
      `;
    }

    const seatMap = performance.seatMap;

    console.log("Building seat status map with:", {
      bookingsCount: bookings.length,
      seatMapType: seatMap.sections ? "sectioned" : "simple",
      seatMapRows: seatMap.rows,
      seatMapSeatsPerRow: seatMap.seatsPerRow || seatMap.seats,
      seatMapTotal: seatMap.total
    });

    this._seatStatusMap = buildSeatStatusMap(bookings, seatMap, showtimeId);
    this._selectedShowtimeId = showtimeId;

    console.log("Seat status map built with", this._seatStatusMap.size, "entries");

    const hasSections = seatMap.sections && seatMap.sections.length > 0;

    return hasSections
      ? this.renderSectionedSeatMap(seatMap)
      : this.renderSimpleSeatMap(seatMap);
  },

  renderSimpleSeatMap(seatMap) {
    const rows = parseInt(seatMap.rows) || 0;
    const seatsPerRow = parseInt(seatMap.seatsPerRow || seatMap.seats) || 0;
    const totalSeats = rows * seatsPerRow;
    const performance = this._currentPerformance;
    const pricingSections = performance?.pricingSections || [];
    const defaultPrice = pricingSections.length > 0 ? parseFloat(pricingSections[0].basePrice) || 0 : 0;

    console.log("renderSimpleSeatMap - seatMap:", seatMap);
    console.log("renderSimpleSeatMap - rows:", rows, "seatsPerRow:", seatsPerRow, "totalSeats:", totalSeats);

    if (totalSeats === 0) {
      return `
        <div class="text-center py-12">
          <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 mb-4">
            <i class="fas fa-exclamation-circle text-4xl text-red-400" aria-hidden="true"></i>
          </div>
          <p class="text-gray-700 font-semibold text-lg">Invalid seat map configuration</p>
          <p class="text-sm text-gray-500 mt-2 max-w-md mx-auto">The venue layout has no seats configured. Please update the venue settings.</p>
        </div>
      `;
    }

    const seatDetails = {};

    for (let row = 0; row < rows; row++) {
      const rowLetter = String.fromCharCode(65 + row);
      const sectionIndex = Math.floor(row / Math.max(1, Math.ceil(rows / 4)));

      for (let seat = 0; seat < seatsPerRow; seat++) {
        const seatNumber = seat + 1;
        const seatId = `${rowLetter}${seatNumber}`;

        const seatStatus = this._seatStatusMap.get(seatId);

        if (seatStatus) {
          const isBlocked = seatStatus.status === "blocked";

          seatDetails[seatId] = {
            status: seatStatus.status,
            booking: seatStatus.booking,
            seatTicket: seatStatus.seatTicket,
            price: seatStatus.seatTicket?.price || defaultPrice,
            updatedAt: isBlocked ? this._currentPerformance?.updatedAt : undefined,
            sectionIndex: seatStatus.status === "available" ? sectionIndex : undefined,
          };
        } else {
          seatDetails[seatId] = {
            status: "available",
            price: defaultPrice,
            sectionIndex,
          };
        }
      }
    }

    let seatMapSVG = "";

    if (rows > 0 && seatsPerRow > 0) {
      try {
        seatMapSVG = SeatMap.generateStatic(
          rows,
          seatsPerRow,
          seatDetails,
          (seatDetail) => {
            if (!seatDetail) {return getSeatColor("available");}
            return getSeatColor(seatDetail.status || "available");
          }
        );
      } catch (error) {
        console.error("Error generating seat map:", error);
        return `
          <div class="text-center py-12">
            <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 mb-4">
              <i class="fas fa-exclamation-circle text-4xl text-red-400"></i>
            </div>
            <p class="text-gray-700 font-semibold text-lg">Error Generating Seat Map</p>
            <p class="text-sm text-gray-500 mt-2 max-w-md mx-auto">${error.message}</p>
          </div>
        `;
      }
    } else {
      return `
        <div class="text-center py-12">
          <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-50 mb-4">
            <i class="fas fa-exclamation-triangle text-4xl text-yellow-400"></i>
          </div>
          <p class="text-gray-700 font-semibold text-lg">Invalid Seat Map Data</p>
          <p class="text-sm text-gray-500 mt-2 max-w-md mx-auto">Rows: ${rows}, Seats per row: ${seatsPerRow}</p>
        </div>
      `;
    }

    const legend = this.renderSeatMapLegend();
    const statistics = this.calculateStatistics(seatDetails);
    const statisticsHtml = this.renderStatisticsPanel(statistics, false);

    setTimeout(() => {
      this.announceToScreenReader(`Seat map loaded. ${statistics.total} total seats, ${statistics.available} available, ${statistics.booked} booked, ${statistics.reserved} reserved, ${statistics.blocked} blocked. ${statistics.occupancyPercentage}% occupancy. Total revenue: $${statistics.revenue.toFixed(2)}.`);
    }, 500);

    return `
      <div class="seat-map-viewer space-y-4">
        ${statisticsHtml}

        <div class="seat-map-container bg-gradient-to-b from-white to-gray-50 rounded-xl p-6 border border-gray-200 shadow-inner overflow-auto" style="max-height: 1200px; min-height: 600px;" role="img" aria-label="Venue seat map showing ${rows} rows with ${seatsPerRow} seats per row">
          ${seatMapSVG}
        </div>

        ${legend}
      </div>
    `;
  },

  renderSectionedSeatMap(seatMap) {
    const venue = this._currentVenue;
    const layoutConfig = venue?.layout || {};
    const performance = this._currentPerformance;
    const pricingSections = performance?.pricingSections || [];
    const seatDetails = {};

    if (seatMap.indexMap && typeof seatMap.indexMap === "object") {
      Object.entries(seatMap.indexMap).forEach(([fullId, seatData]) => {
        const seatStatus = this._seatStatusMap?.get(fullId);
        const sectionName = seatData.sectionName || seatData.section;
        const tier = seatData.tier;

        let price = 0;
        const pricing = pricingSections.find(ps => {
          const byName = ps.sectionName && sectionName &&
            ps.sectionName.toLowerCase() === sectionName.toLowerCase();
          const byTier = ps.tier && tier &&
            ps.tier.toLowerCase() === tier.toLowerCase();
          return byName || byTier;
        });

        if (pricing) {
          price = parseFloat(pricing.basePrice) || 0;
        }

        const isBlocked = seatStatus?.status === "blocked";

        seatDetails[fullId] = {
          status: seatStatus?.status || "available",
          booking: seatStatus?.booking,
          seatTicket: seatStatus?.seatTicket,
          tier: tier,
          section: sectionName,
          price: price,
          updatedAt: isBlocked ? performance.updatedAt : undefined,
        };
      });
    }

    let seatMapSVG = "";

    try {
      console.log("renderSectionedSeatMap - layoutConfig:", layoutConfig);
      console.log("renderSectionedSeatMap - seatDetails count:", Object.keys(seatDetails).length);

      seatMapSVG = SeatMap.generateFromLayout(
        layoutConfig,
        seatDetails,
        this._selectedSeats,
        this._editMode
      );
    } catch (error) {
      console.error("Error generating sectioned seat map:", error);
      return `
        <div class="text-center py-12">
          <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 mb-4">
            <i class="fas fa-exclamation-circle text-4xl text-red-400"></i>
          </div>
          <p class="text-gray-700 font-semibold text-lg">Error Generating Seat Map</p>
          <p class="text-sm text-gray-500 mt-2 max-w-md mx-auto">${error.message}</p>
        </div>
      `;
    }

    const totalSeats = seatMap.total || 0;
    const sectionNames = [];
    if (layoutConfig.sections && Array.isArray(layoutConfig.sections)) {
      layoutConfig.sections.forEach(section => {
        sectionNames.push(section.name || "unnamed section");
      });
    }

    const legend = this.renderSeatMapLegend();
    const statistics = this.calculateStatistics(seatDetails);
    const statisticsHtml = this.renderStatisticsPanel(statistics, true);

    setTimeout(() => {
      this.announceToScreenReader(`Seat map loaded with ${layoutConfig.sections.length} sections. ${statistics.total} total seats, ${statistics.available} available, ${statistics.booked} booked, ${statistics.reserved} reserved, ${statistics.blocked} blocked. ${statistics.occupancyPercentage}% occupancy. Total revenue: $${statistics.revenue.toFixed(2)}.`);
    }, 500);

    return `
      <div class="seat-map-viewer space-y-4">
        ${statisticsHtml}

        <div class="seat-map-container bg-gradient-to-b from-white to-gray-50 rounded-xl p-6 border border-gray-200 shadow-inner overflow-auto" style="max-height: 1200px; min-height: 700px;" role="img" aria-label="Venue seat map with sections: ${sectionNames.join(", ")}">

          ${seatMapSVG}
        </div>

        ${legend}
      </div>
    `;
  },

  computeRowLabel(section, rowIndex) {
    const startRow = section.startRow || "A";
    const startCode = startRow.charCodeAt(startRow.length - 1) - 65;
    const totalIndex = startCode + rowIndex;

    if (totalIndex < 26) {
      return String.fromCharCode(65 + totalIndex);
    }

    const first = Math.floor(totalIndex / 26) - 1;
    const second = totalIndex % 26;
    return String.fromCharCode(65 + first) + String.fromCharCode(65 + second);
  },

  renderSeatMapLegend() {
    return `
      <div class="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200" role="region" aria-labelledby="legend-heading">
        <div class="flex items-center gap-2 mb-3">
          <i class="fas fa-palette text-indigo-600" aria-hidden="true"></i>
          <h3 id="legend-heading" class="text-sm font-bold text-gray-800 uppercase tracking-wide">Seat Status Legend</h3>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3" role="list">
          <div class="flex items-center gap-3 px-4 py-3 bg-white rounded-lg shadow-sm border border-gray-200" role="listitem">
            <div class="w-6 h-6 rounded-md shadow-sm" style="background-color: rgb(16, 185, 129);" aria-label="Green color indicator"></div>
            <div>
              <div class="text-sm font-semibold text-gray-900">Available</div>
              <div class="text-xs text-gray-500">Ready to book</div>
            </div>
          </div>
          <div class="flex items-center gap-3 px-4 py-3 bg-white rounded-lg shadow-sm border border-gray-200" role="listitem">
            <div class="w-6 h-6 rounded-md shadow-sm" style="background-color: rgb(55, 65, 81);" aria-label="Dark gray color indicator"></div>
            <div>
              <div class="text-sm font-semibold text-gray-900">Booked</div>
              <div class="text-xs text-gray-500">Confirmed</div>
            </div>
          </div>
          <div class="flex items-center gap-3 px-4 py-3 bg-white rounded-lg shadow-sm border border-gray-200" role="listitem">
            <div class="w-6 h-6 rounded-md shadow-sm" style="background-color: rgb(245, 158, 11);" aria-label="Amber color indicator"></div>
            <div>
              <div class="text-sm font-semibold text-gray-900">Reserved</div>
              <div class="text-xs text-gray-500">On hold</div>
            </div>
          </div>
          <div class="flex items-center gap-3 px-4 py-3 bg-white rounded-lg shadow-sm border border-gray-200" role="listitem">
            <div class="w-6 h-6 rounded-md shadow-sm" style="background-color: rgb(239, 68, 68);" aria-label="Red color indicator"></div>
            <div>
              <div class="text-sm font-semibold text-gray-900">Blocked</div>
              <div class="text-xs text-gray-500">Unavailable</div>
            </div>
          </div>
        </div>
        <div class="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg" role="note">
          <div class="flex items-start gap-2">
            <i class="fas fa-mouse-pointer text-indigo-600 mt-0.5" aria-hidden="true"></i>
            <p class="text-xs text-indigo-800">
              <span class="font-semibold">Hover over any seat</span> to view details. Booked seats show customer info and booking ID. Available seats show pricing and section information.
            </p>
          </div>
        </div>
      </div>
    `;
  },

  renderTicketTypesSection(ticketTypes) {
    if (!ticketTypes || ticketTypes.length === 0) {
      return `
        <div class="mt-8 pt-8 border-t border-gray-200">
          <div class="flex items-center gap-2 mb-4">
            <i class="fas fa-ticket-alt text-gray-400"></i>
            <h3 class="text-sm font-bold text-gray-700 uppercase tracking-wider">Ticket Types</h3>
          </div>
          <div class="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <div class="flex items-start gap-3">
              <i class="fas fa-info-circle text-blue-600 text-lg mt-0.5"></i>
              <p class="text-sm text-blue-800">No ticket types configured. Pricing will be based on venue sections.</p>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="mt-8 pt-8 border-t border-gray-200">
        <div class="flex items-center justify-between mb-5">
          <div class="flex items-center gap-2">
            <i class="fas fa-ticket-alt text-gray-400"></i>
            <h3 class="text-sm font-bold text-gray-700 uppercase tracking-wider">Ticket Types</h3>
          </div>
          <span class="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">${ticketTypes.length} ${ticketTypes.length === 1 ? "Type" : "Types"}</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          ${ticketTypes
            .map(
              (tt) => `
            <div class="group relative bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all">
              <div class="flex flex-col h-full">
                <div class="mb-4">
                  <div class="font-bold text-gray-900 text-lg mb-2">${this.getSectionName(tt)}</div>
                  ${tt.tier ? this.renderTierBadge(tt.tier) : ""}
                </div>
                <div class="mt-auto">
                  <div class="flex items-baseline gap-1.5">
                    <span class="text-sm text-gray-500 font-medium">HKD</span>
                    <span class="text-3xl font-bold text-indigo-600">${this.formatNumber(tt.basePrice || tt.price, 0)}</span>
                  </div>
                </div>
              </div>
              <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <i class="fas fa-arrow-right text-indigo-600"></i>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  },

  getSectionName(ticketType) {
    if (ticketType.section) {return ticketType.section;}
    if (ticketType.name) {return ticketType.name;}

    if (ticketType.tier) {
      const tierLabels = {
        vip: "VIP",
        premium: "Premium",
        standard: "Standard",
        economy: "Economy",
      };
      return tierLabels[ticketType.tier.toLowerCase()] || ticketType.tier;
    }

    return "General Admission";
  },

  renderTierBadge(tier) {
    const tierColors = {
      vip: "bg-yellow-100 text-yellow-800",
      premium: "bg-purple-100 text-purple-800",
      standard: "bg-green-100 text-green-800",
      economy: "bg-blue-100 text-blue-800",
    };

    const tierLabels = {
      vip: "VIP",
      premium: "Premium",
      standard: "Standard",
      economy: "Economy",
    };

    const color = tierColors[tier?.toLowerCase()] || tierColors.standard;
    const label = tierLabels[tier?.toLowerCase()] || tier || "Standard";

    return `<span class="text-xs px-2 py-1 rounded font-medium ${color}">${label}</span>`;
  },

  attachSeatClickHandlers(container) {
    const seatElements = container.querySelectorAll(".seat, .interactive-seat");

    seatElements.forEach(seatElement => {
      const fullId = seatElement.getAttribute("data-full-id");
      const status = seatElement.getAttribute("data-status");

      if (!fullId) {
        return;
      }

      if (status === "booked" || status === "reserved") {
        seatElement.style.cursor = "not-allowed";
      } else {
        seatElement.style.cursor = "pointer";
      }

      seatElement.addEventListener("click", (e) => {
        e.stopPropagation();
        if (status !== "booked" && status !== "reserved") {
          this.toggleSeatSelection(fullId, seatElement);
        }
      });

      seatElement.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.showContextMenu(fullId, status, e);
      });
    });
  },

  toggleSeatSelection(fullId, seatElement) {
    const seatStatus = this._seatStatusMap?.get(fullId);
    const status = seatStatus?.status || "available";

    if (status === "booked" || status === "reserved") {
      const Notyf = window.Notyf;
      if (Notyf) {
        const notyf = new Notyf({
          duration: 2000,
          position: { x: "right", y: "top" },
        });
        notyf.error("Cannot select booked or reserved seats");
      }
      return;
    }

    const index = this._selectedSeats.indexOf(fullId);

    if (index > -1) {
      this._selectedSeats.splice(index, 1);
      this.removeSeatHighlight(seatElement);
    } else {
      this._selectedSeats.push(fullId);
      this.addSeatHighlight(seatElement);
    }

    this.announceToScreenReader(`Seat ${fullId} ${index > -1 ? "deselected" : "selected"}. ${this._selectedSeats.length} seats selected.`);

    this.refreshSelectionToolbar();
  },

  addSeatHighlight(seatElement) {
    const rect = seatElement.querySelector("rect");
    if (rect) {
      rect.setAttribute("stroke", "#eab308");
      rect.setAttribute("stroke-width", "3");
      rect.style.filter = "drop-shadow(0 0 4px rgba(234, 179, 8, 0.5))";
    }
    seatElement.classList.add("selected");
  },

  removeSeatHighlight(seatElement) {
    const rect = seatElement.querySelector("rect");
    if (rect) {
      rect.removeAttribute("stroke");
      rect.removeAttribute("stroke-width");
      rect.style.filter = "";
    }
    seatElement.classList.remove("selected");
  },

  renderContextMenu(seatId, status, position) {
    const actions = [];

    if (status === "available") {
      actions.push({
        icon: "fa-ban",
        label: "Block Seat",
        action: "block",
        color: "text-red-600",
      });
    } else if (status === "blocked") {
      actions.push({
        icon: "fa-check-circle",
        label: "Make Available",
        action: "unblock",
        color: "text-green-600",
      });
    } else if (status === "booked" || status === "reserved") {
      actions.push({
        icon: "fa-info-circle",
        label: "View Booking Details",
        action: "view-booking",
        color: "text-blue-600",
      });
    }

    if (actions.length === 0) {
      return "";
    }

    return `
      <div
        id="seat-context-menu"
        class="fixed bg-white rounded-lg shadow-2xl border border-gray-200 py-2 z-[100] min-w-[200px]"
        style="left: ${position.x}px; top: ${position.y}px;"
        data-seat-id="${seatId}"
      >
        <div class="px-3 py-2 border-b border-gray-100">
          <div class="text-xs font-semibold text-gray-500 uppercase">Seat ${seatId.toUpperCase()}</div>
        </div>
        ${actions
          .map(
            (action) => `
          <button
            class="context-menu-item w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-3"
            data-action="${action.action}"
          >
            <i class="fas ${action.icon} ${action.color}"></i>
            <span class="text-gray-700">${action.label}</span>
          </button>
        `
          )
          .join("")}
      </div>
    `;
  },

  positionContextMenu(event) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const menuWidth = 200;
    const menuHeight = 150;

    let x = event.clientX;
    let y = event.clientY;

    if (x + menuWidth > viewportWidth) {
      x = viewportWidth - menuWidth - 10;
    }

    if (y + menuHeight > viewportHeight) {
      y = viewportHeight - menuHeight - 10;
    }

    if (x < 10) {
      x = 10;
    }

    if (y < 10) {
      y = 10;
    }

    return { x, y };
  },

  showContextMenu(seatId, status, event) {
    event.preventDefault();
    event.stopPropagation();

    this.closeContextMenu();

    const position = this.positionContextMenu(event);

    const menuHtml = this.renderContextMenu(seatId, status, position);

    if (!menuHtml) {
      return;
    }

    document.body.insertAdjacentHTML("beforeend", menuHtml);

    const menu = document.getElementById("seat-context-menu");
    if (!menu) {
      return;
    }

    this._contextMenu = menu;

    const menuItems = menu.querySelectorAll(".context-menu-item");
    menuItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        const action = item.getAttribute("data-action");
        this.handleContextMenuAction(action, seatId, status);
        this.closeContextMenu();
      });
    });

    const closeOnOutsideClick = (e) => {
      if (menu && !menu.contains(e.target)) {
        this.closeContextMenu();
        document.removeEventListener("click", closeOnOutsideClick);
      }
    };

    setTimeout(() => {
      document.addEventListener("click", closeOnOutsideClick);
    }, 0);

    const closeOnEscape = (e) => {
      if (e.key === "Escape") {
        this.closeContextMenu();
        document.removeEventListener("keydown", closeOnEscape);
      }
    };

    document.addEventListener("keydown", closeOnEscape);

    menu.addEventListener("keydown", (e) => {
      const items = Array.from(menu.querySelectorAll(".context-menu-item"));
      const currentIndex = items.indexOf(document.activeElement);

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % items.length;
        items[nextIndex]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
        items[prevIndex]?.focus();
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (document.activeElement && items.includes(document.activeElement)) {
          document.activeElement.click();
        }
      }
    });

    if (menuItems.length > 0) {
      menuItems[0].focus();
    }

    this.announceToScreenReader(`Context menu opened for seat ${seatId}. ${menuItems.length} actions available.`);
  },

  closeContextMenu() {
    if (this._contextMenu) {
      this._contextMenu.remove();
      this._contextMenu = null;
    }

    const existingMenu = document.getElementById("seat-context-menu");
    if (existingMenu) {
      existingMenu.remove();
    }
  },

  async handleContextMenuAction(action, seatId, status) {
    switch (action) {
      case "block":
        await this.updateSeatStatus([seatId], "blocked");
        break;

      case "unblock":
        await this.updateSeatStatus([seatId], "available");
        break;

      case "view-booking":
        await this.viewBookingDetails(seatId);
        break;

      default:
        console.warn(`Unknown context menu action: ${action}`);
    }
  },

  async viewBookingDetails(seatId) {
    const seatStatus = this._seatStatusMap?.get(seatId);

    if (!seatStatus || !seatStatus.booking) {
      const Notyf = window.Notyf;
      if (Notyf) {
        const notyf = new Notyf({
          duration: 3000,
          position: { x: "right", y: "top" },
        });
        notyf.error("No booking information available for this seat");
      }
      return;
    }

    const booking = seatStatus.booking;
    const seatTicket = seatStatus.seatTicket;

    const Swal = (await import("sweetalert2")).default;

    await Swal.fire({
      title: `Booking Details - Seat ${seatId.toUpperCase()}`,
      html: `
        <div class="text-left space-y-4">
          <div class="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div class="text-xs text-gray-500 font-semibold uppercase mb-1">Booking Reference</div>
                <div class="font-bold text-gray-900">${booking.bookingReference || "N/A"}</div>
              </div>
              <div>
                <div class="text-xs text-gray-500 font-semibold uppercase mb-1">Status</div>
                <div class="font-bold text-gray-900 capitalize">${booking.status || "N/A"}</div>
              </div>
            </div>
          </div>

          <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div class="text-xs text-gray-500 font-semibold uppercase mb-2">Customer Information</div>
            <div class="space-y-2 text-sm">
              <div class="flex items-center gap-2">
                <i class="fas fa-user text-gray-400"></i>
                <span class="text-gray-900">${booking.customerName || booking.user?.name || "N/A"}</span>
              </div>
              <div class="flex items-center gap-2">
                <i class="fas fa-envelope text-gray-400"></i>
                <span class="text-gray-900">${booking.customerEmail || booking.user?.email || "N/A"}</span>
              </div>
            </div>
          </div>

          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <div class="text-xs text-gray-500 font-semibold uppercase mb-2">Ticket Information</div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Ticket Type:</span>
                <span class="font-semibold text-gray-900">${seatTicket?.ticketType || "Standard"}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Price:</span>
                <span class="font-bold text-green-700">HKD ${seatTicket?.price || 0}</span>
              </div>
            </div>
          </div>

          ${booking.bookingDate ? `
            <div class="text-xs text-gray-500 text-center pt-2 border-t border-gray-200">
              Booked on ${dayjs(booking.bookingDate).format("MMM D, YYYY [at] h:mm A")}
            </div>
          ` : ""}
        </div>
      `,
      icon: "info",
      confirmButtonText: "Close",
      confirmButtonColor: "#4f46e5",
      customClass: {
        popup: "rounded-xl shadow-2xl",
        confirmButton: "rounded-lg px-6 py-3 font-semibold"
      }
    });
  },

  startBookingPolling() {
    if (this._pollingInterval) {
      clearInterval(this._pollingInterval);
    }

    this._pollingInterval = setInterval(async () => {
      if (!this._selectedShowtimeId) {
        return;
      }

      if (!this._currentPerformance?.id) {
        return;
      }

      try {
        const bookings = await bookingService.getBookingsByPerformance(
          this._currentPerformance.id,
          { maxRetries: 1, retryDelay: 500 }
        );

        const hasChanges = this.detectBookingChanges(bookings);

        if (hasChanges) {
          this._bookingsData = bookings;
          this._seatStatusMap = buildSeatStatusMap(
            bookings.filter(b => {
              const bookingShowtimeId = b.showtimeId || b.showtime?.id;
              return String(bookingShowtimeId) === String(this._selectedShowtimeId);
            }),
            this._currentPerformance.seatMap,
            this._selectedShowtimeId
          );

          this.updateAffectedSeats();
          this.updateShowtimeStats();
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 30000);
  },

  detectBookingChanges(newBookings) {
    if (!this._bookingsData) {
      return true;
    }

    const oldMap = new Map(
      this._bookingsData.map((b) => [b.id, b.status])
    );
    const newMap = new Map(
      newBookings.map((b) => [b.id, b.status])
    );

    if (oldMap.size !== newMap.size) {
      return true;
    }

    for (const [id, status] of newMap) {
      if (oldMap.get(id) !== status) {
        return true;
      }
    }

    return false;
  },

  updateAffectedSeats() {
    const container = document.querySelector(".seat-map-container");
    if (!container) {
      return;
    }

    const seatElements = container.querySelectorAll(".seat, .interactive-seat");

    seatElements.forEach((seatElement) => {
      const fullId = seatElement.getAttribute("data-full-id");
      const currentStatus = seatElement.getAttribute("data-status");
      const newStatus = this._seatStatusMap?.get(fullId)?.status || "available";

      if (currentStatus !== newStatus) {
        const newColor = getSeatColor(newStatus);
        const rect = seatElement.querySelector("rect");
        if (rect) {
          rect.setAttribute("fill", newColor);
          seatElement.setAttribute("data-status", newStatus);

          seatElement.classList.add("seat-updated");
          setTimeout(() => {
            seatElement.classList.remove("seat-updated");
          }, 1000);
        }
      }
    });

    if (this._seatFilter) {
      this.reapplySeatFilter();
    }

    this.updateStatisticsPanel();
  },

  updateStatisticsPanel() {
    const statisticsPanel = document.getElementById("statistics-panel");
    if (!statisticsPanel) {
      console.log("Statistics panel not found in DOM");
      return;
    }

    const performance = this._currentPerformance;
    if (!performance || !performance.seatMap) {
      console.log("No performance or seat map");
      return;
    }

    if (!this._seatStatusMap || this._seatStatusMap.size === 0) {
      console.log("No seat status map or empty");
      return;
    }

    const seatMap = performance.seatMap;
    const seatDetails = {};

    if (seatMap.indexMap && typeof seatMap.indexMap === "object") {
      Object.entries(seatMap.indexMap).forEach(([fullId, seatData]) => {
        const seatStatus = this._seatStatusMap?.get(fullId);
        seatDetails[fullId] = {
          status: seatStatus?.status || "available",
          section: seatData.sectionName || seatData.section || "Main",
          booking: seatStatus?.booking,
          seatTicket: seatStatus?.seatTicket,
        };
      });
    } else {
      this._seatStatusMap.forEach((seatStatus, seatId) => {
        seatDetails[seatId] = {
          status: seatStatus.status || "available",
          section: "Main",
          booking: seatStatus.booking,
          seatTicket: seatStatus.seatTicket,
        };
      });
    }

    console.log("Updating statistics with", Object.keys(seatDetails).length, "seats");

    const statistics = this.calculateStatistics(seatDetails);
    const hasSections = seatMap.sections && Array.isArray(seatMap.sections) && seatMap.sections.length > 0;
    
    console.log("Statistics calculated:", statistics);
    console.log("Has sections:", hasSections);

    const newStatisticsHtml = this.renderStatisticsPanel(statistics, hasSections);

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = newStatisticsHtml;
    const newPanel = tempDiv.firstElementChild;

    if (newPanel) {
      statisticsPanel.replaceWith(newPanel);
      console.log("Statistics panel updated successfully");
    } else {
      console.log("Failed to create new panel element");
    }
  },

  cleanup() {
    if (this._pollingInterval) {
      clearInterval(this._pollingInterval);
      this._pollingInterval = null;
    }

    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }

    if (this._hoverDebounceTimer) {
      clearTimeout(this._hoverDebounceTimer);
      this._hoverDebounceTimer = null;
    }

    if (this._seatMapTooltip) {
      this._seatMapTooltip.destroy();
      this._seatMapTooltip = null;
    }

    this.closeContextMenu();

    if (this._keyboardHandler) {
      document.removeEventListener("keydown", this._keyboardHandler);
      this._keyboardHandler = null;
    }

    this._currentPerformance = null;
    this._currentVenue = null;
    this._currentShowtimes = null;
    this._currentTicketTypes = null;
    this._bookingsData = null;
    this._bookingsLoaded = false;
    this._bookingsLoading = false;
    this._bookingsError = null;
    this._selectedShowtimeId = null;
    this._seatStatusMap = null;
    this._editMode = true;
    this._selectedSeats = [];
    this._contextMenu = null;
    this._undoStack = [];
    this._redoStack = [];
  },
};

export default PerformanceDetailsPage;
