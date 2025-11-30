/**
 * @file SeatMap.js
 * @description Seat map component for rendering interactive and static venue seat layouts
 * @author LI Ning 25127563d
 * @author SHEK chinhei 25017482d
 * @dependency panzoom
 * @see @utils/booking/seatMapGenerator.js
 * @see @utils/colors.js
 */

import { seatMapGenerator } from "@utils/booking/seatMapGenerator.js";
import { getSectionColor, getSeatStatusColor } from "@utils/colors.js";

export const SeatMap = {
  /**
   * @param {Object} layoutConfig - Venue layout configuration
   * @param {Object} seatDetails - Details for each seat including status and section
   * @param {Array} selectedSeats - Array of currently selected seat IDs
   * @param {boolean} [interactive=false] - Whether the seat map should be interactive
   * @returns {string} HTML string for the seat map
   */
  generateFromLayout(
    layoutConfig,
    seatDetails,
    selectedSeats,
    interactive = false
  ) {
    return seatMapGenerator.generateFromLayout(
      layoutConfig,
      seatDetails,
      selectedSeats,
      interactive
    );
  },

  /**
   * @param {number} rows - Number of rows in the venue
   * @param {number} seats - Number of seats per row
   * @param {Object} seatDetails - Details for each seat
   * @param {Array} selectedSeats - Array of selected seat IDs
   * @param {Function} getSeatColorFn - Function to determine seat color
   * @returns {string} HTML string for interactive seat map
   */
  generateInteractive(rows, seats, seatDetails, selectedSeats, getSeatColorFn) {
    return seatMapGenerator.generateInteractiveSeatMap(
      rows,
      seats,
      seatDetails,
      selectedSeats,
      getSeatColorFn
    );
  },

  /**
   * @param {number} rows - Number of rows in the venue
   * @param {number} seats - Number of seats per row
   * @param {Object} seatDetails - Details for each seat
   * @param {Function} getSeatColorFn - Function to determine seat color
   * @returns {string} HTML string for static seat map
   */
  generateStatic(rows, seats, seatDetails, getSeatColorFn) {
    return seatMapGenerator.generateStaticSeatMap(
      rows,
      seats,
      seatDetails,
      getSeatColorFn
    );
  },

  /**
   * @param {number} rows - Number of rows in the venue
   * @param {number} seats - Number of seats per row
   * @param {Object} [seatDetails={}] - Details for each seat
   * @param {Function} getSeatColorFn - Function to determine seat color
   * @returns {string} SVG string for seat map preview
   */
  generatePreview(rows, seats, seatDetails = {}, getSeatColorFn) {
    return seatMapGenerator.generatePreviewSVG(
      rows,
      seats,
      seatDetails,
      getSeatColorFn
    );
  },

  /**
   * @param {number} rows - Number of rows in the venue
   * @param {number} seats - Number of seats per row
   * @param {Object} seatDetails - Details for each seat
   * @param {Array} sections - Pricing sections configuration
   * @param {Array} [selectedSeats=[]] - Array of selected seat IDs
   * @param {boolean} [interactive=false] - Whether the seat map should be interactive
   * @returns {string} HTML string for seat map with section details
   */
  generateWithDetails(
    rows,
    seats,
    seatDetails,
    sections,
    selectedSeats = [],
    interactive = false
  ) {
    const getSeatColorFn = (seatDetail) => {
      if (!seatDetail) {return getSeatStatusColor("available");}

      if (seatDetail.sectionIndex !== undefined) {
        return getSectionColor(seatDetail.sectionIndex);
      }

      return getSeatStatusColor(seatDetail.status);
    };

    if (interactive) {
      return this.generateInteractive(
        rows,
        seats,
        seatDetails,
        selectedSeats,
        getSeatColorFn
      );
    } else {
      return this.generateStatic(rows, seats, seatDetails, getSeatColorFn);
    }
  },

  /**
   * @param {number} rows - Number of rows in the venue
   * @param {number} seats - Number of seats per row
   * @returns {string} SVG string for simple seat map preview
   */
  generateSimplePreview(rows, seats) {
    const getSeatColorFn = () => getSeatStatusColor("available");
    return seatMapGenerator.generatePreviewSVG(rows, seats, {}, getSeatColorFn);
  },

  /**
   * @param {Array} sections - Pricing sections to display in legend
   * @param {boolean} [showSystemColors=true] - Whether to show seat status colors
   * @returns {string} HTML string for seat map legend
   */
  createLegend(sections, showSystemColors = true) {
    let legendHTML = "<div class=\"legend-container space-y-3\">";

    if (showSystemColors) {
      legendHTML += `
        <div class="legend-section">
          <div class="text-xs font-semibold text-gray-600 mb-2">Seat Status</div>
          <div class="flex flex-wrap gap-3">
            <div class="flex items-center gap-1.5">
              <div class="w-4 h-4 rounded" style="background-color: #10b981"></div>
              <span class="text-xs text-gray-700">Available</span>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-4 h-4 rounded" style="background-color: #eab308"></div>
              <span class="text-xs text-gray-700">Selected</span>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-4 h-4 rounded" style="background-color: #ef4444"></div>
              <span class="text-xs text-gray-700">Blocked</span>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-4 h-4 rounded" style="background-color: #f59e0b"></div>
              <span class="text-xs text-gray-700">Reserved</span>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-4 h-4 rounded" style="background-color: #374151"></div>
              <span class="text-xs text-gray-700">Booked</span>
            </div>
          </div>
        </div>
      `;
    }

    if (sections && sections.length > 0) {
      const validSections = sections.filter(
        (section) =>
          section && (section.sectionName || section.section || section.name)
      );

      if (validSections.length > 0) {
        legendHTML += `
          <div class="legend-section">
            <div class="text-xs font-semibold text-gray-600 mb-2">Pricing Zones</div>
            <div class="flex flex-wrap gap-3">
        `;

        validSections.forEach((section, idx) => {
          const color = getSectionColor(idx);
          const sectionName =
            section.sectionName ||
            section.section ||
            section.name ||
            `Section ${idx + 1}`;
          const tier = section.tier || section.sectionCode || "";
          const label = tier ? `${sectionName} (${tier})` : sectionName;

          legendHTML += `
            <div class="flex items-center gap-1.5">
              <div class="w-4 h-4 rounded" style="background-color: ${color}"></div>
              <span class="text-xs text-gray-700">${label}</span>
            </div>
          `;
        });

        legendHTML += `
            </div>
          </div>
        `;
      }
    }

    legendHTML += "</div>";
    return legendHTML;
  },

  /**
   * @param {number} rows - Number of rows in the venue
   * @param {number} seats - Number of seats per row
   * @param {Object} seatDetails - Details for each seat
   * @param {Array} sections - Pricing sections configuration
   * @returns {string} HTML string for seat plan with statistics and legend
   */
  createSeatPlanWithStats(rows, seats, seatDetails, sections) {
    const totalSeats = rows * seats;
    const getSeatColorFn = (seatDetail) => {
      if (!seatDetail) {return getSeatStatusColor("available");}
      if (seatDetail.sectionIndex !== undefined) {
        return getSectionColor(seatDetail.sectionIndex);
      }
      return getSeatStatusColor(seatDetail.status);
    };

    const seatMapSVG = seatMapGenerator.generatePreviewSVG(
      rows,
      seats,
      seatDetails,
      getSeatColorFn
    );

    const legend = this.createLegend(sections, true);

    return `
      <div>
        ${seatMapSVG}
        <div class="mt-2 text-center text-xs text-gray-600">
          <span class="font-semibold">${rows} Rows</span> ×
          <span class="font-semibold">${seats} Seats</span> =
          <span class="font-semibold text-indigo-600">${totalSeats} Total Seats</span>
        </div>
        ${legend ? `<div class="mt-3">${legend}</div>` : ""}
      </div>
    `;
  },

  /**
   * @param {number} rows - Number of rows in the venue
   * @param {number} seats - Number of seats per row
   * @returns {Object} Initialized seat details object
   */
  initializeSeatDetails(rows, seats) {
    return seatMapGenerator.initializeSeatDetails(rows, seats);
  },
};
