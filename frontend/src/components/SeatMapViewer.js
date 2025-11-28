import { SeatMap } from "@components/SeatMap.js";
import { buildSeatStatusMap, buildSeatDetails } from "@utils/seatStatusCalculator.js";
import { initSeatMapPanzoom } from "@utils/panzoomSeatMap.js";
import { SeatMapTooltip } from "@utils/ui/seatMapTooltip.js";

export class SeatMapViewer {
  constructor(options = {}) {
    this.containerId = options.containerId || "seat-map-container";
    this.performance = options.performance || null;
    this.bookings = options.bookings || [];
    this.showtimeId = options.showtimeId || null;
    this.userRole = options.userRole || "user";
    this.interactive = options.interactive !== false;
    this.enablePanzoom = options.enablePanzoom !== false;
    this.enableTooltip = options.enableTooltip !== false;
    this.onSeatClick = options.onSeatClick || null;
    this.onSeatHover = options.onSeatHover || null;
    
    this.seatStatusMap = null;
    this.seatDetails = null;
    this.panzoomInstance = null;
    this.tooltipInstance = null;
    this.selectedSeats = [];
  }

  async render() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`Container with id "${this.containerId}" not found`);
      return;
    }

    if (!this.performance || !this.performance.seatMap) {
      container.innerHTML = this.renderError("No seat map available");
      return;
    }

    const seatMap = this.performance.seatMap;
    
    this.seatStatusMap = buildSeatStatusMap(
      this.bookings,
      seatMap,
      this.showtimeId
    );

    this.seatDetails = buildSeatDetails(
      seatMap,
      this.seatStatusMap,
      this.performance.pricingSections || []
    );

    const hasSections = seatMap.sections && seatMap.sections.length > 0;

    let seatMapHTML;
    if (hasSections) {
      seatMapHTML = SeatMap.generateFromLayout(
        seatMap,
        this.seatDetails,
        this.selectedSeats,
        this.interactive
      );
    } else {
      const rows = parseInt(seatMap.rows) || 0;
      const seatsPerRow = parseInt(seatMap.seatsPerRow || seatMap.seats) || 0;
      
      if (rows === 0 || seatsPerRow === 0) {
        container.innerHTML = this.renderError("Invalid seat map configuration");
        return;
      }

      seatMapHTML = SeatMap.generateWithDetails(
        rows,
        seatsPerRow,
        this.seatDetails,
        seatMap.sections || [],
        this.selectedSeats,
        this.interactive
      );
    }

    container.innerHTML = `
      <div class="seat-map-wrapper">
        <div class="seat-map-container" style="overflow: hidden; position: relative;">
          ${seatMapHTML}
        </div>
      </div>
    `;

    await this.initializeFeatures();
  }

  async initializeFeatures() {
    const container = document.querySelector(`#${this.containerId} .seat-map-container`);
    if (!container) {
      return;
    }

    if (this.enableTooltip) {
      this.initializeTooltip(container);
    }

    if (this.enablePanzoom) {
      this.initializePanzoom(container);
    }

    if (this.interactive && this.onSeatClick) {
      this.attachSeatClickHandlers(container);
    }
  }

  initializeTooltip(container) {
    if (this.tooltipInstance) {
      this.tooltipInstance.destroy();
    }

    this.tooltipInstance = new SeatMapTooltip({
      role: this.userRole,
    });

    this.tooltipInstance.attach(
      container,
      this.seatStatusMap,
      this.seatDetails
    );
  }

  initializePanzoom(container) {
    if (this.panzoomInstance) {
      this.panzoomInstance.dispose();
    }

    setTimeout(() => {
      this.panzoomInstance = initSeatMapPanzoom(`#${this.containerId} .seat-map-container`);
    }, 100);
  }

  attachSeatClickHandlers(container) {
    const seatElements = container.querySelectorAll(".seat, .interactive-seat");
    
    seatElements.forEach(seatElement => {
      const fullId = seatElement.getAttribute("data-full-id");
      const status = seatElement.getAttribute("data-status");

      if (!fullId) {
        return;
      }

      seatElement.addEventListener("click", (e) => {
        e.stopPropagation();
        
        if (this.onSeatClick) {
          this.onSeatClick({
            seatId: fullId,
            status: status,
            element: seatElement,
            seatDetail: this.seatDetails[fullId],
          });
        }
      });

      if (this.onSeatHover) {
        seatElement.addEventListener("mouseenter", (e) => {
          this.onSeatHover({
            seatId: fullId,
            status: status,
            element: seatElement,
            seatDetail: this.seatDetails[fullId],
            event: e,
          });
        });
      }
    });
  }

  updateSelectedSeats(seatIds) {
    this.selectedSeats = seatIds;
    this.render();
  }

  updateBookings(bookings) {
    this.bookings = bookings;
    this.render();
  }

  updateShowtime(showtimeId) {
    this.showtimeId = showtimeId;
    this.render();
  }

  destroy() {
    if (this.tooltipInstance) {
      this.tooltipInstance.destroy();
      this.tooltipInstance = null;
    }

    if (this.panzoomInstance) {
      this.panzoomInstance.dispose();
      this.panzoomInstance = null;
    }

    const container = document.getElementById(this.containerId);
    if (container) {
      container.innerHTML = "";
    }
  }

  renderError(message) {
    return `
      <div class="text-center py-12">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 mb-4">
          <i class="fas fa-exclamation-circle text-4xl text-red-400"></i>
        </div>
        <p class="text-gray-700 font-semibold text-lg">${message}</p>
      </div>
    `;
  }

  getSeatStatusMap() {
    return this.seatStatusMap;
  }

  getSeatDetails() {
    return this.seatDetails;
  }

  getSelectedSeats() {
    return this.selectedSeats;
  }
}

export function createSeatMapViewer(options) {
  return new SeatMapViewer(options);
}
