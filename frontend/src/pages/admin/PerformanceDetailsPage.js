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
  _panzoomInstance: null,

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
      
      <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div class="space-y-6 lg:space-y-8 max-w-7xl mx-auto">
          ${this.renderPerformanceInfo(performance, venue)}
          ${this.renderShowtimesList()}
          ${this.renderSeatMapViewer()}
        </div>
      </div>
      
      <!-- Screen reader announcements -->
      <div id="sr-announcements" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></div>
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
        
        <button
          id="manage-seats-btn"
          class="flex items-center justify-center w-12 h-12 bg-indigo-600 text-white hover:bg-indigo-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          aria-label="Manage seats for this performance"
          title="Manage Seats"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
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
            
            <button
              id="manage-seats-btn-mobile"
              class="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-150"
              aria-label="Manage seats for this performance"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
              <span>Manage</span>
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
      <section id="performance-info" class="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-200" aria-labelledby="performance-info-heading">
        ${imageUrl ? `
          <div class="relative h-64 lg:h-80 overflow-hidden bg-gradient-to-br from-indigo-900 to-purple-900">
            <img 
              src="${imageUrl}" 
              alt="${this.formatValue(performance.title, "Performance")}" 
              class="w-full h-full object-cover opacity-90"
              onerror="this.onerror=null; this.src='${getImageFallbackSvg()}';"
              onerror="this.onerror=null; this.src='/img/default-performance.jpg';"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
          </div>
        ` : ""}
        
        <div class="p-6 lg:p-8">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
            <div class="flex-1">
              <h1 class="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">${this.formatValue(performance.title, "Performance Details")}</h1>
              <p class="text-base text-gray-600">
                <i class="fas fa-user-music text-indigo-600 mr-1"></i>
                ${this.formatValue(performance.composer, "Unknown Composer")}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <button
                id="edit-performance-btn"
                class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm hover:shadow flex items-center gap-2"
                aria-label="Edit performance"
              >
                <i class="fas fa-edit"></i>
                <span class="hidden sm:inline">Edit</span>
              </button>
              <button
                id="delete-performance-btn"
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium shadow-sm hover:shadow flex items-center gap-2"
                aria-label="Delete performance"
              >
                <i class="fas fa-trash"></i>
                <span class="hidden sm:inline">Delete</span>
              </button>
            </div>
          </div>
          
          <div class="space-y-6 lg:space-y-8">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div class="space-y-4">
                <h3 class="text-sm font-bold text-gray-800 flex items-center gap-2 uppercase tracking-wide">
                  <i class="fas fa-music text-blue-600"></i>
                  <span>Basic Information</span>
                </h3>
                <div class="space-y-3">
                  <div class="flex items-start gap-3 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                    <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <i class="fas fa-wand-magic-sparkles text-purple-600"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Conductor</div>
                      <div class="text-base font-bold text-gray-900 truncate">${this.formatValue(performance.conductor)}</div>
                    </div>
                  </div>
                  
                  <div class="grid grid-cols-2 gap-3">
                    <div class="flex items-start gap-2 p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100">
                      <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <i class="fas fa-guitar text-green-600 text-sm"></i>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-0.5">Genre</div>
                        <div class="text-sm font-bold text-gray-900 truncate">${this.formatValue(performance.genre)}</div>
                      </div>
                    </div>
                    
                    <div class="flex items-start gap-2 p-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-100">
                      <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                        <i class="fas fa-clock text-amber-600 text-sm"></i>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-0.5">Duration</div>
                        <div class="text-sm font-bold text-gray-900">${this.formatValue(performance.duration)} ${performance.duration ? "min" : ""}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="flex items-start gap-3 p-4 bg-gradient-to-br from-rose-50 to-red-50 rounded-lg border border-rose-100">
                    <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
                      <i class="fas fa-map-marker-alt text-rose-600"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Venue</div>
                      <div class="text-base font-bold text-gray-900">${this.formatValue(venue?.name || venue)}</div>
                      ${venue?.address ? `<div class="text-xs text-gray-600 mt-1">${venue.address}</div>` : ""}
                      ${venue?.capacity ? `<div class="text-xs text-gray-500 mt-1"><i class="fas fa-chair mr-1"></i>Capacity: ${venue.capacity} seats</div>` : ""}
                    </div>
                  </div>
                </div>
              </div>

              <div class="space-y-4">
                <h3 class="text-sm font-bold text-gray-800 flex items-center gap-2 uppercase tracking-wide">
                  <i class="fas fa-align-left text-purple-600"></i>
                  <span>Description</span>
                </h3>
                <div class="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-5 text-sm border border-purple-100 min-h-[300px] lg:min-h-[400px]">
                  <p class="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    ${this.formatValue(performance.description, "No description available")}
                  </p>
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
            const availableSeats = bookedSeats !== null ? Math.max(0, totalSeats - bookedSeats) : st.availableSeats || totalSeats;
            const occupancyPercentage = bookedSeats !== null && totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;

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

    const manageSeatsBtn = document.getElementById("manage-seats-btn");
    const manageSeatsBtnMobile = document.getElementById("manage-seats-btn-mobile");

    if (manageSeatsBtn) {
      manageSeatsBtn.addEventListener("click", () => {
        this.navigateToSeatManagement();
      });
    }

    if (manageSeatsBtnMobile) {
      manageSeatsBtnMobile.addEventListener("click", () => {
        this.navigateToSeatManagement();
      });
    }

    const editBtn = document.getElementById("edit-performance-btn");
    if (editBtn) {
      editBtn.addEventListener("click", () => {
        this.handleEditPerformance();
      });
    }

    const deleteBtn = document.getElementById("delete-performance-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => {
        this.handleDeletePerformance();
      });
    }

    this.attachShowtimeHandlers();
  },

  async handleEditPerformance() {
    const performanceId = this._currentPerformance?.id;
    if (!performanceId) {
      console.error("No performance ID available");
      return;
    }

    window.dispatchEvent(new CustomEvent("edit-performance", {
      detail: { performanceId }
    }));
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

    // Announce to screen readers
    this.announceToScreenReader(`Showtime ${showtimeDate} selected. Loading seat map.`);

    // Render seat map for selected showtime
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
      const availableSeats = Math.max(0, totalSeats - bookedSeats);
      const occupancyPercentage = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;

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
      const bookings = await bookingService.getBookingsByPerformance(performance.id);

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
    console.log("Performance:", this._currentPerformance);
    console.log("SeatMap:", this._currentPerformance?.seatMap);
    console.log("Venue:", this._currentVenue);

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

    const showtimeBookings = this._bookingsData.filter(booking => {
      const bookingShowtimeId = booking.showtimeId || booking.showtime?.id;
      return String(bookingShowtimeId) === String(showtimeId);
    });

    const contentContainer = document.getElementById("seat-map-content");
    if (contentContainer) {
      contentContainer.innerHTML = this.renderSeatMapViewerContent(showtimeId, showtimeBookings);

      setTimeout(() => {
        const container = document.querySelector(".seat-map-container");
        if (container) {
          this.attachSeatTooltipHandlers(container);
        }

        if (this._panzoomInstance) {
          this._panzoomInstance.dispose();
        }
        this._panzoomInstance = initSeatMapPanzoom(".seat-map-container");
      }, 100);
    }
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
    this._seatStatusMap = buildSeatStatusMap(bookings, seatMap);
    this._selectedShowtimeId = showtimeId;

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

      for (let seat = 0; seat < seatsPerRow; seat++) {
        const seatNumber = seat + 1;
        const seatId = `${rowLetter}${seatNumber}`;

        const seatStatus = this._seatStatusMap.get(seatId);

        if (seatStatus) {
          seatDetails[seatId] = {
            status: seatStatus.status,
            booking: seatStatus.booking,
            seatTicket: seatStatus.seatTicket,
            price: seatStatus.seatTicket?.price || defaultPrice,
          };
        } else {
          seatDetails[seatId] = {
            status: "available",
            price: defaultPrice,
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

    const bookedCount = Array.from(this._seatStatusMap.values()).filter(
      s => s.status === "booked" || s.status === "reserved"
    ).length;
    const availableCount = totalSeats - bookedCount;
    const occupancyPercentage = totalSeats > 0
      ? Math.round((bookedCount / totalSeats) * 100)
      : 0;

    const occupancyColor = occupancyPercentage > 80
      ? "text-red-600 bg-red-50"
      : occupancyPercentage > 50
        ? "text-amber-600 bg-amber-50"
        : "text-green-600 bg-green-50";

    setTimeout(() => {
      this.announceToScreenReader(`Seat map loaded. ${totalSeats} total seats, ${availableCount} available, ${bookedCount} booked. ${occupancyPercentage}% occupancy.`);
    }, 500);

    return `
      <div class="seat-map-viewer space-y-4">
        <div class="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200 shadow-sm" role="region" aria-label="Seat availability statistics">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div class="grid grid-cols-3 gap-4 flex-1">
              <div class="flex items-center gap-3 px-4 py-3 bg-white rounded-lg shadow-sm" role="group" aria-label="Total seats: ${totalSeats}">
                <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <i class="fas fa-chair text-gray-600" aria-hidden="true"></i>
                </div>
                <div>
                  <div class="text-xs text-gray-500 font-medium">Total Seats</div>
                  <div class="text-lg font-bold text-gray-900">${totalSeats}</div>
                </div>
              </div>
              <div class="flex items-center gap-3 px-4 py-3 bg-white rounded-lg shadow-sm" role="group" aria-label="Available seats: ${availableCount}">
                <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <i class="fas fa-check-circle text-green-600" aria-hidden="true"></i>
                </div>
                <div>
                  <div class="text-xs text-gray-500 font-medium">Available</div>
                  <div class="text-lg font-bold text-green-700">${availableCount}</div>
                </div>
              </div>
              <div class="flex items-center gap-3 px-4 py-3 bg-white rounded-lg shadow-sm" role="group" aria-label="Booked seats: ${bookedCount}">
                <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <i class="fas fa-ticket-alt text-gray-700" aria-hidden="true"></i>
                </div>
                <div>
                  <div class="text-xs text-gray-500 font-medium">Booked</div>
                  <div class="text-lg font-bold text-gray-900">${bookedCount}</div>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-3 px-5 py-3 ${occupancyColor} rounded-xl shadow-sm border-2 ${occupancyPercentage > 80 ? "border-red-200" : occupancyPercentage > 50 ? "border-amber-200" : "border-green-200"}" role="group" aria-label="Occupancy rate: ${occupancyPercentage} percent">
              <i class="fas fa-chart-pie text-2xl" aria-hidden="true"></i>
              <div>
                <div class="text-xs font-medium opacity-75">Occupancy Rate</div>
                <div class="text-2xl font-bold">${occupancyPercentage}%</div>
              </div>
            </div>
          </div>
        </div>

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

        seatDetails[fullId] = {
          status: seatStatus?.status || "available",
          booking: seatStatus?.booking,
          seatTicket: seatStatus?.seatTicket,
          tier: tier,
          section: sectionName,
          price: price,
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
        [],
        false
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

    const bookedCount = Array.from(this._seatStatusMap.values()).filter(
      s => s.status === "booked" || s.status === "reserved"
    ).length;
    const availableCount = totalSeats - bookedCount;
    const occupancyPercentage = totalSeats > 0
      ? Math.round((bookedCount / totalSeats) * 100)
      : 0;

    const occupancyColor = occupancyPercentage > 80
      ? "text-red-600 bg-red-50"
      : occupancyPercentage > 50
        ? "text-amber-600 bg-amber-50"
        : "text-green-600 bg-green-50";

    const legend = this.renderSeatMapLegend();

    // Announce seat map loaded to screen readers
    setTimeout(() => {
      this.announceToScreenReader(`Seat map loaded with ${layoutConfig.sections.length} sections. ${totalSeats} total seats, ${availableCount} available, ${bookedCount} booked. ${occupancyPercentage}% occupancy.`);
    }, 500);

    return `
      <div class="seat-map-viewer space-y-4">
        <div class="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200 shadow-sm" role="region" aria-label="Seat availability statistics">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div class="grid grid-cols-3 gap-4 flex-1">
              <div class="flex items-center gap-3 px-4 py-3 bg-white rounded-lg shadow-sm" role="group" aria-label="Total seats: ${totalSeats}">
                <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <i class="fas fa-chair text-gray-600" aria-hidden="true"></i>
                </div>
                <div>
                  <div class="text-xs text-gray-500 font-medium">Total Seats</div>
                  <div class="text-lg font-bold text-gray-900">${totalSeats}</div>
                </div>
              </div>
              <div class="flex items-center gap-3 px-4 py-3 bg-white rounded-lg shadow-sm" role="group" aria-label="Available seats: ${availableCount}">
                <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <i class="fas fa-check-circle text-green-600" aria-hidden="true"></i>
                </div>
                <div>
                  <div class="text-xs text-gray-500 font-medium">Available</div>
                  <div class="text-lg font-bold text-green-700">${availableCount}</div>
                </div>
              </div>
              <div class="flex items-center gap-3 px-4 py-3 bg-white rounded-lg shadow-sm" role="group" aria-label="Booked seats: ${bookedCount}">
                <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <i class="fas fa-ticket-alt text-gray-700" aria-hidden="true"></i>
                </div>
                <div>
                  <div class="text-xs text-gray-500 font-medium">Booked</div>
                  <div class="text-lg font-bold text-gray-900">${bookedCount}</div>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-3 px-5 py-3 ${occupancyColor} rounded-xl shadow-sm border-2 ${occupancyPercentage > 80 ? "border-red-200" : occupancyPercentage > 50 ? "border-amber-200" : "border-green-200"}" role="group" aria-label="Occupancy rate: ${occupancyPercentage} percent">
              <i class="fas fa-chart-pie text-2xl" aria-hidden="true"></i>
              <div>
                <div class="text-xs font-medium opacity-75">Occupancy Rate</div>
                <div class="text-2xl font-bold">${occupancyPercentage}%</div>
              </div>
            </div>
          </div>
        </div>

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

  attachSeatTooltipHandlers(container) {
    if (!container) {return;}

    let tooltip = document.getElementById("seat-tooltip");
    if (!tooltip) {
      tooltip = document.createElement("div");
      tooltip.id = "seat-tooltip";
      tooltip.className = "seat-tooltip";
      tooltip.style.cssText = `
        position: fixed;
        display: none;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        z-index: 10000;
        pointer-events: none;
        max-width: 280px;
      `;
      document.body.appendChild(tooltip);
    }

    const seatElements = container.querySelectorAll(".seat, .interactive-seat");

    seatElements.forEach(seatElement => {
      const seatId = seatElement.getAttribute("data-seat-id");
      const fullId = seatElement.getAttribute("data-full-id");
      const status = seatElement.getAttribute("data-status");
      const zone = seatElement.getAttribute("data-zone");
      const price = seatElement.getAttribute("data-price");

      seatElement.addEventListener("mouseenter", (e) => {
        if (this._hoverDebounceTimer) {
          clearTimeout(this._hoverDebounceTimer);
        }

        this._hoverDebounceTimer = setTimeout(() => {
          let tooltipContent = "";

          if (status === "occupied" || status === "booked" || status === "reserved") {
            const seatStatus = this._seatStatusMap?.get(fullId) || this._seatStatusMap?.get(seatId);

            if (seatStatus && seatStatus.booking) {
              tooltipContent = formatBookingTooltip(seatStatus.booking, seatStatus.seatTicket);
            } else {
              tooltipContent = this.formatUnavailableTooltip(fullId || seatId, status);
            }
          } else {
            tooltipContent = this.formatAvailableTooltip(fullId || seatId, zone, price);
          }

          if (tooltipContent) {
            tooltip.innerHTML = tooltipContent;
            tooltip.style.display = "block";
            this.positionTooltip(tooltip, e);
          }
        }, this._hoverDebounceDelay);
      });

      seatElement.addEventListener("mousemove", (e) => {
        if (tooltip.style.display === "block") {
          this.positionTooltip(tooltip, e);
        }
      });

      seatElement.addEventListener("mouseleave", () => {
        if (this._hoverDebounceTimer) {
          clearTimeout(this._hoverDebounceTimer);
          this._hoverDebounceTimer = null;
        }

        tooltip.style.display = "none";
      });
    });
  },

  formatAvailableTooltip(seatId, zone, price) {
    const priceValue = parseFloat(price);
    const formattedPrice = !isNaN(priceValue) ? `HKD ${priceValue.toFixed(2)}` : "Price not set";
    const seatLabel = seatId.toUpperCase();
    const zoneName = zone || "Unknown Section";

    return `
      <div class="booking-tooltip text-left text-sm">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-3 h-3 rounded-full bg-green-500"></div>
          <div class="font-semibold text-green-700">Available</div>
        </div>
        <div class="text-xs space-y-1">
          <div class="flex justify-between gap-3">
            <span class="text-gray-500">Seat:</span>
            <span class="font-medium">${seatLabel}</span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="text-gray-500">Section:</span>
            <span class="font-medium">${zoneName}</span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="text-gray-500">Price:</span>
            <span class="font-semibold text-green-600">${formattedPrice}</span>
          </div>
        </div>
      </div>
    `.trim();
  },

  formatUnavailableTooltip(seatId, status) {
    const seatLabel = seatId.toUpperCase();
    const statusText = status === "blocked" ? "Blocked" : "Unavailable";
    const statusColor = status === "blocked" ? "red" : "gray";

    return `
      <div class="booking-tooltip text-left text-sm">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-3 h-3 rounded-full bg-${statusColor}-500"></div>
          <div class="font-semibold text-${statusColor}-700">${statusText}</div>
        </div>
        <div class="text-xs space-y-1">
          <div class="flex justify-between gap-3">
            <span class="text-gray-500">Seat:</span>
            <span class="font-medium">${seatLabel}</span>
          </div>
          <div class="text-gray-500 mt-2">
            This seat is not available for booking.
          </div>
        </div>
      </div>
    `.trim();
  },

  positionTooltip(tooltip, event) {
    const offset = 15;
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = event.clientX + offset;
    let top = event.clientY + offset;

    if (left + tooltipRect.width > viewportWidth) {
      left = event.clientX - tooltipRect.width - offset;
    }

    if (top + tooltipRect.height > viewportHeight) {
      top = event.clientY - tooltipRect.height - offset;
    }

    if (left < 0) {
      left = offset;
    }

    if (top < 0) {
      top = offset;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  },

  renderTicketTypesSection(ticketTypes) {
    if (!ticketTypes || ticketTypes.length === 0) {
      return `
        <div class="pt-6 border-t border-gray-200">
          <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2 uppercase tracking-wide">
            <i class="fas fa-ticket-alt text-indigo-600"></i>
            <span>Ticket Types</span>
          </h3>
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p class="text-sm text-blue-800 flex items-center gap-2">
              <i class="fas fa-info-circle"></i>
              <span>No ticket types configured. Pricing will be based on venue sections.</span>
            </p>
          </div>
        </div>
      `;
    }

    return `
      <div class="pt-6 border-t border-gray-200">
        <h3 class="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2 uppercase tracking-wide">
          <i class="fas fa-ticket-alt text-yellow-600"></i>
          <span>Ticket Types</span>
          <span class="ml-auto text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">${ticketTypes.length} ${ticketTypes.length === 1 ? "type" : "types"}</span>
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          ${ticketTypes
            .map(
              (tt) => `
            <div class="bg-gradient-to-br from-white to-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div class="flex items-start justify-between mb-2">
                <div class="flex-1">
                  <div class="font-bold text-gray-900 text-base mb-1">${this.getSectionName(tt)}</div>
                  ${tt.tier ? this.renderTierBadge(tt.tier) : ""}
                </div>
              </div>
              <div class="flex items-baseline gap-1 mt-3">
                <span class="text-xs text-gray-500">HKD</span>
                <span class="text-2xl font-bold text-indigo-600">${this.formatNumber(tt.basePrice || tt.price, 0)}</span>
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

  cleanup() {
    // Abort any pending requests
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }

    // Clear any pending debounce timers
    if (this._hoverDebounceTimer) {
      clearTimeout(this._hoverDebounceTimer);
      this._hoverDebounceTimer = null;
    }

    // Remove tooltip element
    const tooltip = document.getElementById("seat-tooltip");
    if (tooltip) {
      tooltip.remove();
    }

    // Reset state
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

    // Note: We keep the cache intact for potential reuse
    // Cache will naturally expire based on TTL
  },
};

export default PerformanceDetailsPage;
