
import dayjs from "dayjs";
import { SeatMap } from "../SeatMap.js";
import { buildSeatStatusMap, getSeatColor, formatBookingTooltip } from "@utils/seatStatusCalculator.js";
import { generateFullId } from "@utils/seatIdHelper.js";
import { bookingService } from "@services/bookingService.js";

export const PerformanceDetails = {
  _currentPerformance: null,
  _currentShowtimes: null,
  _bookingsData: null,
  _seatStatusMap: null,
  _selectedShowtimeId: null,
  _bookingsLoaded: false,
  _bookingsLoading: false,
  _bookingsError: null,
  _abortController: null,
  _bookingsCache: new Map(), // Cache for booking data with TTL
  _cacheTTL: 30000, // 30 seconds cache TTL
  _hoverDebounceTimer: null, // Timer for debouncing hover events
  _hoverDebounceDelay: 100, // 100ms debounce delay

  render(performance, venue, showtimes, ticketTypes) {
    this._currentPerformance = performance;
    this._currentShowtimes = showtimes;

    const tabNavigation = this.renderTabNavigation();
    const detailsContent = this.renderDetailsTab(performance, venue, showtimes, ticketTypes);
    const seatMapContent = this.renderSeatMapTab();

    return `
      <div class="text-left">
        ${tabNavigation}
        <div class="tab-content-container mt-4">
          ${detailsContent}
          ${seatMapContent}
        </div>
      </div>
    `;
  },

  renderTabNavigation() {
    return `
      <div class="border-b border-gray-200" role="tablist" aria-label="Performance information tabs">
        <nav class="-mb-px flex space-x-8">
          <button
            id="tab-details"
            class="performance-tab active whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            role="tab"
            aria-selected="true"
            aria-controls="panel-details"
            tabindex="0"
            data-tab="details"
          >
            <i class="fas fa-info-circle mr-2"></i>
            Details
          </button>
          <button
            id="tab-seat-map"
            class="performance-tab whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            role="tab"
            aria-selected="false"
            aria-controls="panel-seat-map"
            tabindex="-1"
            data-tab="seat-map"
          >
            <i class="fas fa-chair mr-2"></i>
            Seat Map
          </button>
        </nav>
      </div>
    `;
  },

  renderDetailsTab(performance, venue, showtimes, ticketTypes) {
    const showtimesHtml = this.renderShowtimesSection(showtimes);
    const ticketTypesHtml = this.renderTicketTypesSection(ticketTypes);

    return `
      <div
        id="panel-details"
        class="tab-panel active"
        role="tabpanel"
        aria-labelledby="tab-details"
        tabindex="0"
      >
        <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 class="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <i class="fas fa-info-circle text-blue-600"></i>
                Basic Information
              </h3>
              <div class="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div><span class="font-medium">Composer:</span> ${performance.composer || "N/A"}</div>
                <div><span class="font-medium">Genre:</span> ${performance.genre || "N/A"}</div>
                <div><span class="font-medium">Duration:</span> ${performance.duration || "N/A"} minutes</div>
                <div><span class="font-medium">Venue:</span> ${venue?.name || venue || "N/A"}</div>
              </div>
            </div>

            <div>
              <h3 class="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <i class="fas fa-align-left text-purple-600"></i>
                Description
              </h3>
              <div class="bg-gray-50 rounded-lg p-4 text-sm">
                ${performance.description || "No description available"}
              </div>
            </div>
          </div>

          ${showtimesHtml}
          ${ticketTypesHtml}
        </div>
      </div>
    `;
  },

  renderSeatMapTab() {
    return `
      <div
        id="panel-seat-map"
        class="tab-panel hidden"
        role="tabpanel"
        aria-labelledby="tab-seat-map"
        tabindex="0"
      >
        <div id="seat-map-content">
          <div class="text-center py-8 text-gray-500">
            <p class="text-sm">Click on a showtime to view the seat map</p>
          </div>
        </div>
      </div>
    `;
  },

  renderLoadingState() {
    return `
      <div class="text-center py-8 text-gray-500">
        <i class="fas fa-spinner fa-spin text-4xl mb-4"></i>
        <p>Loading booking data...</p>
      </div>
    `;
  },

  renderErrorState(errorMessage) {
    return `
      <div class="text-center py-8">
        <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
        <p class="text-gray-700 font-medium mb-2">Failed to load booking data</p>
        <p class="text-sm text-gray-500 mb-4">${errorMessage || "An error occurred while fetching booking information."}</p>
        <button
          id="retry-booking-load"
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <i class="fas fa-redo mr-2"></i>
          Retry
        </button>
      </div>
    `;
  },

  renderShowtimeSelector() {
    const showtimes = this._currentShowtimes;

    if (!showtimes || showtimes.length === 0) {
      return `
        <div class="text-center py-8">
          <i class="fas fa-calendar-times text-4xl text-gray-400 mb-4"></i>
          <p class="text-gray-600 font-medium">No showtimes available</p>
          <p class="text-sm text-gray-500 mt-2">This performance has no scheduled showtimes.</p>
        </div>
      `;
    }

    return `
      <div class="showtime-selector mb-6">
        <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <i class="fas fa-calendar text-indigo-600"></i>
          Select a Showtime
        </h3>
        <div class="space-y-2">
          ${showtimes.map((st, index) => {
            const showtimeId = st.id || st.showtimeId || `showtime-${index}`;
            const date = dayjs(st.dateTime || st.datetime).format("MMM D, YYYY");
            const time = dayjs(st.dateTime || st.datetime).format("h:mm A");

            // Calculate total seats from seat map configuration
            const totalSeats = this.calculateTotalSeatsFromSeatMap();

            // Calculate booked seats from booking data for this showtime
            const bookedSeats = this.calculateBookedSeatsForShowtime(showtimeId);
            const availableSeats = totalSeats - bookedSeats;
            const occupancyPercentage = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;

            const isSelected = this._selectedShowtimeId === showtimeId;
            const selectedClass = isSelected ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-indigo-300";
            const occupancyColor = occupancyPercentage > 80 ? "text-red-600" : occupancyPercentage > 50 ? "text-yellow-600" : "text-green-600";

            return `
              <button
                class="showtime-item w-full text-left bg-white border-2 ${selectedClass} rounded-lg p-4 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                data-showtime-id="${showtimeId}"
                data-showtime-index="${index}"
              >
                <div class="flex items-center justify-between mb-2">
                  <div class="font-medium text-gray-900">
                    <i class="fas fa-calendar-day mr-2 text-indigo-600"></i>
                    ${date} at ${time}
                  </div>
                  ${isSelected ? "<i class=\"fas fa-check-circle text-indigo-600\"></i>" : ""}
                </div>
                <div class="flex items-center gap-4 text-xs text-gray-600">
                  <div>
                    <i class="fas fa-chair mr-1"></i>
                    Total: <span class="font-medium">${totalSeats}</span>
                  </div>
                  <div>
                    <i class="fas fa-check-circle mr-1 text-green-600"></i>
                    Available: <span class="font-medium">${availableSeats}</span>
                  </div>
                  <div>
                    <i class="fas fa-ticket-alt mr-1 text-gray-700"></i>
                    Booked: <span class="font-medium">${bookedSeats}</span>
                  </div>
                  <div class="${occupancyColor}">
                    <i class="fas fa-chart-pie mr-1"></i>
                    Occupancy: <span class="font-semibold">${occupancyPercentage}%</span>
                  </div>
                </div>
              </button>
            `;
          }).join("")}
        </div>
      </div>
    `;
  },

  calculateTotalSeatsFromSeatMap() {
    const performance = this._currentPerformance;

    if (!performance || !performance.seatMap) {
      return 0;
    }

    const seatMap = performance.seatMap;

    // Check if using sections layout
    if (seatMap.sections && Array.isArray(seatMap.sections)) {
      let total = 0;
      seatMap.sections.forEach(section => {
        const rows = section.rows || 0;
        const seatsPerRow = section.seatsPerRow || 0;
        total += rows * seatsPerRow;
      });
      return total;
    }

    // Simple layout
    const rows = seatMap.rows || 0;
    const seatsPerRow = seatMap.seats || 0;
    return rows * seatsPerRow;
  },

  calculateBookedSeatsForShowtime(showtimeId) {
    if (!this._bookingsData || !Array.isArray(this._bookingsData)) {
      return 0;
    }

    // Filter bookings for this showtime
    const showtimeBookings = this._bookingsData.filter(booking => {
      const bookingShowtimeId = booking.showtimeId || booking.showtime?.id;
      return String(bookingShowtimeId) === String(showtimeId);
    });

    // Count total booked seats
    let bookedCount = 0;
    showtimeBookings.forEach(booking => {
      if (booking.seatTickets && Array.isArray(booking.seatTickets)) {
        bookedCount += booking.seatTickets.length;
      }
    });

    return bookedCount;
  },

  async loadBookingData() {
    if (this._bookingsLoading) {
      return; // Already loading
    }

    const performance = this._currentPerformance;
    if (!performance || !performance.id) {
      this.renderSeatMapError("Invalid performance data");
      return;
    }

    // Check cache first
    const cacheKey = `bookings-${performance.id}`;
    const cachedData = this._bookingsCache.get(cacheKey);

    if (cachedData && Date.now() - cachedData.timestamp < this._cacheTTL) {
      // Use cached data
      this._bookingsData = cachedData.data;
      this._bookingsLoaded = true;
      this.renderSeatMapContent();
      return;
    }

    if (this._bookingsLoaded && this._bookingsData) {
      // Data already loaded, just render the showtime selector
      this.renderSeatMapContent();
      return;
    }

    // Set loading state
    this._bookingsLoading = true;
    this._bookingsError = null;

    // Create abort controller for cleanup
    // eslint-disable-next-line no-undef
    this._abortController = new AbortController();

    // Update UI to show loading
    const contentContainer = document.getElementById("seat-map-content");
    if (contentContainer) {
      contentContainer.innerHTML = this.renderLoadingState();
    }

    try {
      // Fetch booking data with retry logic
      const bookings = await bookingService.getBookingsByPerformance(performance.id);

      // Check if request was aborted
      if (this._abortController.signal.aborted) {
        return;
      }

      // Store booking data
      this._bookingsData = bookings;
      this._bookingsLoaded = true;
      this._bookingsLoading = false;

      // Cache the booking data with timestamp
      this._bookingsCache.set(cacheKey, {
        data: bookings,
        timestamp: Date.now(),
      });

      // Render the showtime selector and initial state
      this.renderSeatMapContent();

    } catch (error) {
      // Check if request was aborted
      if (this._abortController.signal.aborted) {
        return;
      }

      // eslint-disable-next-line no-console
      console.error("Failed to load booking data:", error);
      this._bookingsError = error.message || "Failed to load booking data";
      this._bookingsLoading = false;

      // Render error state
      this.renderSeatMapError(this._bookingsError);
    }
  },

  renderSeatMapContent() {
    const contentContainer = document.getElementById("seat-map-content");
    if (!contentContainer) {return;}

    // Render showtime selector
    const showtimeSelector = this.renderShowtimeSelector();

    // Render seat map viewer placeholder
    const seatMapPlaceholder = `
      <div id="seat-map-viewer-container">
        ${this._selectedShowtimeId
          ? this.renderSeatMapForShowtime(this._selectedShowtimeId)
          : `<div class="text-center py-8 text-gray-500">
              <i class="fas fa-hand-pointer text-4xl mb-4"></i>
              <p>Select a showtime above to view the seat map</p>
            </div>`
        }
      </div>
    `;

    contentContainer.innerHTML = showtimeSelector + seatMapPlaceholder;

    // Attach showtime selection handlers
    this.attachShowtimeHandlers(contentContainer);
  },

  renderSeatMapError(errorMessage) {
    const contentContainer = document.getElementById("seat-map-content");
    if (!contentContainer) {return;}

    contentContainer.innerHTML = this.renderErrorState(errorMessage);

    // Attach retry button handler
    const retryButton = document.getElementById("retry-booking-load");
    if (retryButton) {
      retryButton.addEventListener("click", () => {
        // Reset state and retry
        this._bookingsLoaded = false;
        this._bookingsData = null;
        this._bookingsError = null;
        this.loadBookingData();
      });
    }
  },

  renderSeatMapForShowtime(showtimeId) {
    if (!this._bookingsData) {
      return `
        <div class="text-center py-8 text-gray-500">
          <p>No booking data available</p>
        </div>
      `;
    }

    // Filter bookings for the selected showtime
    const showtimeBookings = this._bookingsData.filter(booking => {
      const bookingShowtimeId = booking.showtimeId || booking.showtime?.id;
      return String(bookingShowtimeId) === String(showtimeId);
    });

    // Render the seat map viewer with filtered bookings
    return this.renderSeatMapViewer(showtimeId, showtimeBookings);
  },

  attachShowtimeHandlers(container) {
    if (!container) {return;}

    const showtimeButtons = container.querySelectorAll(".showtime-item");

    showtimeButtons.forEach(button => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        const showtimeId = button.getAttribute("data-showtime-id");

        // Update selected showtime
        this._selectedShowtimeId = showtimeId;

        // Update UI - highlight selected showtime
        showtimeButtons.forEach(btn => {
          const isSelected = btn.getAttribute("data-showtime-id") === showtimeId;
          btn.classList.toggle("border-indigo-500", isSelected);
          btn.classList.toggle("bg-indigo-50", isSelected);
          btn.classList.toggle("border-gray-200", !isSelected);
          btn.classList.toggle("hover:border-indigo-300", !isSelected);

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

        // Render seat map for selected showtime
        const viewerContainer = document.getElementById("seat-map-viewer-container");
        if (viewerContainer) {
          viewerContainer.innerHTML = this.renderSeatMapForShowtime(showtimeId);
        }
      });
    });
  },

  cleanupBookingData() {
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

    // Reset state
    this._bookingsData = null;
    this._bookingsLoaded = false;
    this._bookingsLoading = false;
    this._bookingsError = null;
    this._selectedShowtimeId = null;
    this._seatStatusMap = null;

    // Note: We keep the cache intact for potential reuse
    // Cache will naturally expire based on TTL
  },

  renderSeatMapViewer(showtimeId, bookings) {
    const performance = this._currentPerformance;

    // Check if performance has seat map configuration
    if (!performance || !performance.seatMap) {
      return `
        <div class="text-center py-8">
          <i class="fas fa-exclamation-circle text-4xl text-gray-400 mb-4"></i>
          <p class="text-gray-600 font-medium">Seat map not configured for this performance</p>
          <p class="text-sm text-gray-500 mt-2">Please configure the venue layout in the performance settings.</p>
        </div>
      `;
    }

    const seatMap = performance.seatMap;

    // Build seat status map from bookings
    this._seatStatusMap = buildSeatStatusMap(bookings, seatMap);
    this._selectedShowtimeId = showtimeId;

    // Check if using sections layout or simple layout
    const hasSections = seatMap.sections && seatMap.sections.length > 0;

    const html = hasSections
      ? this.renderSectionedSeatMap(seatMap)
      : this.renderSimpleSeatMap(seatMap);

    // Schedule tooltip handler attachment after DOM update
    setTimeout(() => {
      const container = document.querySelector(".seat-map-container");
      if (container) {
        this.attachSeatTooltipHandlers(container);
      }
    }, 0);

    return html;
  },

  renderSimpleSeatMap(seatMap) {
    // Extract layout configuration
    const rows = seatMap.rows || 0;
    const seatsPerRow = seatMap.seats || 0;
    const totalSeats = rows * seatsPerRow;

    if (totalSeats === 0) {
      return `
        <div class="text-center py-8">
          <i class="fas fa-exclamation-circle text-4xl text-gray-400 mb-4"></i>
          <p class="text-gray-600 font-medium">Invalid seat map configuration</p>
          <p class="text-sm text-gray-500 mt-2">The venue layout has no seats configured.</p>
        </div>
      `;
    }

    // Build seat details object with booking status
    // The seat map generator uses format like "A1", "A2", "B1", etc.
    const seatDetails = {};

    for (let row = 0; row < rows; row++) {
      const rowLetter = String.fromCharCode(65 + row); // A, B, C, etc.

      for (let seat = 0; seat < seatsPerRow; seat++) {
        const seatNumber = seat + 1;
        const seatId = `${rowLetter}${seatNumber}`; // e.g., "A1", "A2", "B1"

        // Check if this seat has a booking
        const seatStatus = this._seatStatusMap.get(seatId);

        if (seatStatus) {
          seatDetails[seatId] = {
            status: seatStatus.status,
            booking: seatStatus.booking,
            seatTicket: seatStatus.seatTicket,
          };
        } else {
          seatDetails[seatId] = {
            status: "available",
          };
        }
      }
    }

    // Generate seat map SVG using static rendering
    const seatMapSVG = SeatMap.generateStatic(
      rows,
      seatsPerRow,
      seatDetails,
      (seatDetail) => {
        if (!seatDetail) {return getSeatColor("available");}
        return getSeatColor(seatDetail.status || "available");
      }
    );

    // Create legend
    const legend = this.renderSeatMapLegend();

    // Calculate statistics
    const bookedCount = Array.from(this._seatStatusMap.values()).filter(
      s => s.status === "booked" || s.status === "reserved"
    ).length;
    const availableCount = totalSeats - bookedCount;
    const occupancyPercentage = totalSeats > 0
      ? Math.round((bookedCount / totalSeats) * 100)
      : 0;

    return `
      <div class="seat-map-viewer">
        <!-- Statistics Bar -->
        <div class="bg-gray-50 rounded-lg p-4 mb-4">
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-4">
              <div>
                <i class="fas fa-chair mr-1 text-gray-600"></i>
                <span class="font-medium">Total:</span> ${totalSeats}
              </div>
              <div>
                <i class="fas fa-check-circle mr-1 text-green-600"></i>
                <span class="font-medium">Available:</span> ${availableCount}
              </div>
              <div>
                <i class="fas fa-ticket-alt mr-1 text-gray-700"></i>
                <span class="font-medium">Booked:</span> ${bookedCount}
              </div>
            </div>
            <div class="text-right">
              <span class="text-xs text-gray-500">Occupancy</span>
              <div class="font-semibold ${occupancyPercentage > 80 ? "text-red-600" : "text-gray-900"}">
                ${occupancyPercentage}%
              </div>
            </div>
          </div>
        </div>

        <!-- Seat Map -->
        <div class="seat-map-container bg-white rounded-lg p-4 mb-4 overflow-auto" style="max-height: 400px;">
          ${seatMapSVG}
        </div>

        <!-- Legend -->
        ${legend}
      </div>
    `;
  },

  renderSectionedSeatMap(seatMap) {
    // For sectioned layouts, use the layout-based generator
    const layoutConfig = seatMap;

    // Build seat details with booking status
    const seatDetails = {};

    // Process each section
    if (layoutConfig.sections) {
      layoutConfig.sections.forEach((section, sectionIndex) => {
        const sectionName = section.name || `section-${sectionIndex}`;

        for (let rowIndex = 0; rowIndex < section.rows; rowIndex++) {
          const rowLabel = this.computeRowLabel(section, rowIndex);

          for (let seatIndex = 0; seatIndex < section.seatsPerRow; seatIndex++) {
            const seatNumber = seatIndex + 1;
            const seatId = `${rowLabel}${seatNumber}`;
            const fullId = generateFullId(sectionName, rowLabel, seatNumber);

            // Check both formats for booking status
            const seatStatus = this._seatStatusMap.get(fullId) || this._seatStatusMap.get(seatId);

            if (seatStatus) {
              seatDetails[fullId] = {
                status: seatStatus.status,
                booking: seatStatus.booking,
                seatTicket: seatStatus.seatTicket,
              };
            } else {
              seatDetails[fullId] = {
                status: "available",
              };
            }
          }
        }
      });
    }

    // Generate seat map using layout generator
    const seatMapSVG = SeatMap.generateFromLayout(
      layoutConfig,
      seatDetails,
      [], // no selected seats
      false // not interactive
    );

    // Calculate total seats
    let totalSeats = 0;
    layoutConfig.sections.forEach(section => {
      totalSeats += section.rows * section.seatsPerRow;
    });

    // Calculate statistics
    const bookedCount = Array.from(this._seatStatusMap.values()).filter(
      s => s.status === "booked" || s.status === "reserved"
    ).length;
    const availableCount = totalSeats - bookedCount;
    const occupancyPercentage = totalSeats > 0
      ? Math.round((bookedCount / totalSeats) * 100)
      : 0;

    // Create legend
    const legend = this.renderSeatMapLegend();

    return `
      <div class="seat-map-viewer">
        <!-- Statistics Bar -->
        <div class="bg-gray-50 rounded-lg p-4 mb-4">
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-4">
              <div>
                <i class="fas fa-chair mr-1 text-gray-600"></i>
                <span class="font-medium">Total:</span> ${totalSeats}
              </div>
              <div>
                <i class="fas fa-check-circle mr-1 text-green-600"></i>
                <span class="font-medium">Available:</span> ${availableCount}
              </div>
              <div>
                <i class="fas fa-ticket-alt mr-1 text-gray-700"></i>
                <span class="font-medium">Booked:</span> ${bookedCount}
              </div>
            </div>
            <div class="text-right">
              <span class="text-xs text-gray-500">Occupancy</span>
              <div class="font-semibold ${occupancyPercentage > 80 ? "text-red-600" : "text-gray-900"}">
                ${occupancyPercentage}%
              </div>
            </div>
          </div>
        </div>

        <!-- Seat Map -->
        <div class="seat-map-container bg-white rounded-lg p-4 mb-4 overflow-auto" style="max-height: 500px;">
          ${seatMapSVG}
        </div>

        <!-- Legend -->
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
      <div class="bg-gray-50 rounded-lg p-4">
        <div class="flex flex-wrap gap-4 justify-center text-sm">
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded" style="background-color: rgb(16, 185, 129);"></div>
            <span class="text-gray-700">Available</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded" style="background-color: rgb(55, 65, 81);"></div>
            <span class="text-gray-700">Booked</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded" style="background-color: rgb(245, 158, 11);"></div>
            <span class="text-gray-700">Reserved</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 rounded" style="background-color: rgb(239, 68, 68);"></div>
            <span class="text-gray-700">Blocked</span>
          </div>
        </div>
      </div>
    `;
  },

  attachTabHandlers(container) {
    if (!container) {return;}

    const tabs = container.querySelectorAll(".performance-tab");
    const panels = container.querySelectorAll(".tab-panel");

    const switchTab = (targetTab) => {
      const targetTabName = targetTab.getAttribute("data-tab");
      const targetPanel = container.querySelector(`#panel-${targetTabName}`);

      if (!targetPanel) {return;}

      // Update tab states
      tabs.forEach(tab => {
        const isActive = tab === targetTab;
        tab.classList.toggle("active", isActive);
        tab.setAttribute("aria-selected", isActive ? "true" : "false");
        tab.setAttribute("tabindex", isActive ? "0" : "-1");
      });

      // Update panel states
      panels.forEach(panel => {
        const isActive = panel === targetPanel;
        panel.classList.toggle("active", isActive);
        panel.classList.toggle("hidden", !isActive);
      });

      // Lazy load booking data when seat map tab is activated
      if (targetTabName === "seat-map" && !this._bookingsLoaded && !this._bookingsLoading) {
        this.loadBookingData();
      }

      // Focus the newly active panel for screen readers
      targetPanel.focus();
    };

    // Click handlers
    tabs.forEach(tab => {
      tab.addEventListener("click", (e) => {
        e.preventDefault();
        switchTab(tab);
      });

      // Keyboard handlers
      tab.addEventListener("keydown", (e) => {
        let targetTab = null;

        switch (e.key) {
          case "Enter":
          case " ":
            e.preventDefault();
            switchTab(tab);
            break;
          case "ArrowRight":
            e.preventDefault();
            targetTab = tab.nextElementSibling || tabs[0];
            targetTab.focus();
            break;
          case "ArrowLeft":
            e.preventDefault();
            targetTab = tab.previousElementSibling || tabs[tabs.length - 1];
            targetTab.focus();
            break;
          case "Home":
            e.preventDefault();
            tabs[0].focus();
            break;
          case "End":
            e.preventDefault();
            tabs[tabs.length - 1].focus();
            break;
        }
      });
    });
  },

  attachSeatTooltipHandlers(container) {
    if (!container) {return;}

    // Create tooltip element if it doesn't exist
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
        max-width: 250px;
      `;
      document.body.appendChild(tooltip);
    }

    // Find all seat elements in the SVG
    const seatElements = container.querySelectorAll(".seat, .interactive-seat");

    seatElements.forEach(seatElement => {
      // Get seat data
      const seatId = seatElement.getAttribute("data-seat-id");
      const fullId = seatElement.getAttribute("data-full-id");
      const status = seatElement.getAttribute("data-status");

      // Only add tooltips to booked/occupied seats
      if (status === "occupied" || status === "booked" || status === "reserved") {
        // Get seat status from the status map
        const seatStatus = this._seatStatusMap?.get(fullId) || this._seatStatusMap?.get(seatId);

        if (seatStatus && seatStatus.booking) {
          // Add hover handlers with debouncing
          seatElement.addEventListener("mouseenter", (e) => {
            // Clear any existing debounce timer
            if (this._hoverDebounceTimer) {
              clearTimeout(this._hoverDebounceTimer);
            }

            // Debounce the tooltip display
            this._hoverDebounceTimer = setTimeout(() => {
              const tooltipContent = formatBookingTooltip(seatStatus.booking, seatStatus.seatTicket);
              tooltip.innerHTML = tooltipContent;
              tooltip.style.display = "block";

              // Position tooltip near cursor
              this.positionTooltip(tooltip, e);
            }, this._hoverDebounceDelay);
          });

          seatElement.addEventListener("mousemove", (e) => {
            // Only update position if tooltip is visible
            if (tooltip.style.display === "block") {
              this.positionTooltip(tooltip, e);
            }
          });

          seatElement.addEventListener("mouseleave", () => {
            // Clear debounce timer if user leaves before tooltip shows
            if (this._hoverDebounceTimer) {
              clearTimeout(this._hoverDebounceTimer);
              this._hoverDebounceTimer = null;
            }

            tooltip.style.display = "none";
          });
        }
      }
    });
  },

  positionTooltip(tooltip, event) {
    const offset = 15;
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = event.clientX + offset;
    let top = event.clientY + offset;

    // Adjust if tooltip would go off right edge
    if (left + tooltipRect.width > viewportWidth) {
      left = event.clientX - tooltipRect.width - offset;
    }

    // Adjust if tooltip would go off bottom edge
    if (top + tooltipRect.height > viewportHeight) {
      top = event.clientY - tooltipRect.height - offset;
    }

    // Ensure tooltip doesn't go off left edge
    if (left < 0) {
      left = offset;
    }

    // Ensure tooltip doesn't go off top edge
    if (top < 0) {
      top = offset;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  },

  cleanupTooltips() {
    // Remove tooltip element when modal closes
    const tooltip = document.getElementById("seat-tooltip");
    if (tooltip) {
      tooltip.remove();
    }

    // Cleanup booking data and abort pending requests
    this.cleanupBookingData();
  },

  /**
   * Clean up expired cache entries to prevent memory leaks
   * This should be called periodically or when memory is a concern
   */
  cleanupExpiredCache() {
    const now = Date.now();
    const keysToDelete = [];

    // Find expired entries
    this._bookingsCache.forEach((value, key) => {
      if (now - value.timestamp >= this._cacheTTL) {
        keysToDelete.push(key);
      }
    });

    // Delete expired entries
    keysToDelete.forEach(key => {
      this._bookingsCache.delete(key);
    });

    return keysToDelete.length; // Return number of entries cleaned
  },

  /**
   * Clear all cached booking data
   * Useful for forcing a refresh or when memory needs to be freed
   */
  clearCache() {
    this._bookingsCache.clear();
  },

  renderShowtimesSection(showtimes) {
    if (!showtimes || showtimes.length === 0) {
      return `
        <div>
          <h3 class="text-sm font-semibold text-gray-700 mb-2">Showtimes</h3>
          <p class="text-sm text-gray-500 italic">No showtimes scheduled</p>
        </div>
      `;
    }

    return `
      <div>
        <h3 class="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <i class="fas fa-calendar text-green-600"></i>
          Showtimes (${showtimes.length})
        </h3>
        <div class="space-y-2">
          ${showtimes
        .map((st) => {
          const date = dayjs(st.dateTime || st.datetime).format("MMM D, YYYY");
          const time = dayjs(st.dateTime || st.datetime).format("h:mm A");
          const totalSeats = st.totalSeats || st.capacity || 0;
          const availableSeats = st.availableSeats !== undefined ? st.availableSeats : totalSeats;
          const bookedSeats = totalSeats - availableSeats;
          const availability = totalSeats > 0 ? Math.round((availableSeats / totalSeats) * 100) : 0;

          const availabilityColor = availability > 50 ? "text-green-600" : availability > 20 ? "text-yellow-600" : "text-red-600";
          const availabilityBg = availability > 50 ? "bg-green-100" : availability > 20 ? "bg-yellow-100" : "bg-red-100";

          return `
              <div class="bg-gray-50 rounded p-3 text-sm">
                <div class="flex items-center justify-between mb-2">
                  <div class="font-medium">${date} at ${time}</div>
                  <span class="text-xs px-2 py-1 rounded font-medium ${availabilityBg} ${availabilityColor}">
                    ${availability}% Available
                  </span>
                </div>
                <div class="flex items-center gap-4 text-xs text-gray-600">
                  <div><i class="fas fa-chair mr-1"></i>Total: ${totalSeats}</div>
                  <div><i class="fas fa-check-circle mr-1 text-green-600"></i>Available: ${availableSeats}</div>
                  <div><i class="fas fa-ticket-alt mr-1 text-gray-500"></i>Booked: ${bookedSeats}</div>
                </div>
              </div>
            `;
        })
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

  renderTicketTypesSection(ticketTypes) {
    if (!ticketTypes || ticketTypes.length === 0) {
      return `
        <div>
          <h3 class="text-sm font-semibold text-gray-700 mb-2">Ticket Types</h3>
          <p class="text-sm text-gray-500 italic">No ticket types defined</p>
        </div>
      `;
    }

    return `
      <div>
        <h3 class="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <i class="fas fa-ticket-alt text-yellow-600"></i>
          Ticket Types (${ticketTypes.length})
        </h3>
        <div class="space-y-2">
          ${ticketTypes
        .map(
          (tt) => `
            <div class="bg-gray-50 rounded p-3 flex items-center justify-between text-sm">
              <div class="flex items-center gap-2">
                <span class="font-medium">${this.getSectionName(tt)}</span>
                ${tt.tier ? this.renderTierBadge(tt.tier) : ""}
              </div>
              <div class="font-semibold text-gray-900">HKD $${tt.basePrice || tt.price || 0}</div>
            </div>
          `
        )
        .join("")}
        </div>
      </div>
    `;
  },
};
