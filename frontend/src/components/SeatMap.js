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
    const legendItems = [];

    if (showSystemColors) {
      legendItems.push(
        { label: "Available", color: "#10b981", useInlineStyle: true },
        { label: "Selected", color: "#eab308", useInlineStyle: true },
        { label: "Blocked", color: "#ef4444", useInlineStyle: true },
        { label: "Reserved", color: "#f59e0b", useInlineStyle: true }
      );
    }

    if (sections && sections.length > 0) {
      sections
        .filter(section => section && (section.sectionName || section.section || section.name))
        .forEach((section, idx) => {
          const color = getSectionColor(idx);
          const sectionName = section.sectionName || section.section || section.name || `Section ${idx + 1}`;
          const sectionCode = section.sectionCode || section.tier || "";
          const label = sectionCode ? `${sectionName} (${sectionCode})` : sectionName;
          legendItems.push({
            label: label,
            color: color,
            useInlineStyle: true,
          });
        });
    }

    return `
      <div class="flex flex-wrap gap-3 justify-center text-xs">
        ${legendItems
        .map((item) => {
          const colorStyle = item.useInlineStyle
            ? `style="background-color: ${item.color}"`
            : `class="${item.colorClass}"`;
          return `
            <div class="flex items-center gap-1">
              <div class="w-4 h-4 rounded" ${colorStyle}></div>
              <span class="text-gray-700">${item.label}</span>
            </div>
          `;
        })
        .join("")}
      </div>
    `;
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
