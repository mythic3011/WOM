import { seatMapGenerator } from "@utils/booking/seatMapGenerator.js";
import { getSectionColor, getSeatStatusColor } from "@utils/colors.js";

export const SeatMap = {
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

  generateInteractive(rows, seats, seatDetails, selectedSeats, getSeatColorFn) {
    return seatMapGenerator.generateInteractiveSeatMap(
      rows,
      seats,
      seatDetails,
      selectedSeats,
      getSeatColorFn
    );
  },

  generateStatic(rows, seats, seatDetails, getSeatColorFn) {
    return seatMapGenerator.generateStaticSeatMap(
      rows,
      seats,
      seatDetails,
      getSeatColorFn
    );
  },

  generatePreview(rows, seats, seatDetails = {}, getSeatColorFn) {
    return seatMapGenerator.generatePreviewSVG(
      rows,
      seats,
      seatDetails,
      getSeatColorFn
    );
  },

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

  generateSimplePreview(rows, seats) {
    const getSeatColorFn = () => getSeatStatusColor("available");
    return seatMapGenerator.generatePreviewSVG(rows, seats, {}, getSeatColorFn);
  },

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

  initializeSeatDetails(rows, seats) {
    return seatMapGenerator.initializeSeatDetails(rows, seats);
  },
};
