import { SeatStatusColors, StageColor } from "@utils/colors.js";

export class HeatMapGenerator {
  constructor(options = {}) {
    this.colorScheme = options.colorScheme || "availability";
    this.width = options.width || 800;
    this.height = options.height || 600;
  }

  generateAvailabilityHeatMap(seatDetails, layout) {
    const { rows, seatsPerRow } = layout;
    const seatSize = Math.min(
      this.width / (seatsPerRow + 2),
      this.height / (rows + 2)
    );
    const seatGap = seatSize * 0.2;

    const availabilityScores = this.calculateAvailabilityScores(seatDetails);

    return this.renderHeatMap(
      rows,
      seatsPerRow,
      seatDetails,
      availabilityScores,
      seatSize,
      seatGap,
      "Availability Heat Map",
      this.getAvailabilityColorScale()
    );
  },

  generatePricingHeatMap(seatDetails, pricingSections, layout) {
    const { rows, seatsPerRow } = layout;
    const seatSize = Math.min(
      this.width / (seatsPerRow + 2),
      this.height / (rows + 2)
    );
    const seatGap = seatSize * 0.2;

    const priceScores = this.calculatePriceScores(
      seatDetails,
      pricingSections
    );

    return this.renderHeatMap(
      rows,
      seatsPerRow,
      seatDetails,
      priceScores,
      seatSize,
      seatGap,
      "Pricing Heat Map",
      this.getPricingColorScale()
    );
  },

  generateRevenueHeatMap(seatDetails, pricingSections, layout) {
    const { rows, seatsPerRow } = layout;
    const seatSize = Math.min(
      this.width / (seatsPerRow + 2),
      this.height / (rows + 2)
    );
    const seatGap = seatSize * 0.2;

    const revenueScores = this.calculateRevenueScores(
      seatDetails,
      pricingSections
    );

    return this.renderHeatMap(
      rows,
      seatsPerRow,
      seatDetails,
      revenueScores,
      seatSize,
      seatGap,
      "Revenue Potential Heat Map",
      this.getRevenueColorScale()
    );
  },

  calculateAvailabilityScores(seatDetails) {
    const scores = {};
    Object.entries(seatDetails).forEach(([seatId, seat]) => {
      if (seat.status === "available") {
        scores[seatId] = 1;
      } else if (seat.status === "reserved") {
        scores[seatId] = 0;
      } else {
        scores[seatId] = 0.5;
      }
    });
    return scores;
  },

  calculatePriceScores(seatDetails, pricingSections) {
    const scores = {};
    const prices = [];

    Object.entries(seatDetails).forEach(([seatId, seat]) => {
      if (seat.sectionIndex !== undefined && pricingSections[seat.sectionIndex]) {
        const section = pricingSections[seat.sectionIndex];
        const avgPrice =
          Object.values(section.prices).reduce(
            (sum, p) => sum + (parseFloat(p) || 0),
            0
          ) / Object.keys(section.prices).length;
        prices.push(avgPrice);
      }
    });

    const minPrice = Math.min(...prices, 0);
    const maxPrice = Math.max(...prices, 1);

    Object.entries(seatDetails).forEach(([seatId, seat]) => {
      if (seat.sectionIndex !== undefined && pricingSections[seat.sectionIndex]) {
        const section = pricingSections[seat.sectionIndex];
        const avgPrice =
          Object.values(section.prices).reduce(
            (sum, p) => sum + (parseFloat(p) || 0),
            0
          ) / Object.keys(section.prices).length;

        scores[seatId] =
          maxPrice > minPrice
            ? (avgPrice - minPrice) / (maxPrice - minPrice)
            : 0.5;
      } else {
        scores[seatId] = 0;
      }
    });

    return scores;
  },

  calculateRevenueScores(seatDetails, pricingSections) {
    const scores = {};
    const revenues = [];

    Object.entries(seatDetails).forEach(([seatId, seat]) => {
      if (
        seat.status === "reserved" &&
        seat.sectionIndex !== undefined &&
        pricingSections[seat.sectionIndex]
      ) {
        const section = pricingSections[seat.sectionIndex];
        const avgPrice =
          Object.values(section.prices).reduce(
            (sum, p) => sum + (parseFloat(p) || 0),
            0
          ) / Object.keys(section.prices).length;
        revenues.push(avgPrice);
      }
    });

    const minRevenue = Math.min(...revenues, 0);
    const maxRevenue = Math.max(...revenues, 1);

    Object.entries(seatDetails).forEach(([seatId, seat]) => {
      if (
        seat.status === "reserved" &&
        seat.sectionIndex !== undefined &&
        pricingSections[seat.sectionIndex]
      ) {
        const section = pricingSections[seat.sectionIndex];
        const avgPrice =
          Object.values(section.prices).reduce(
            (sum, p) => sum + (parseFloat(p) || 0),
            0
          ) / Object.keys(section.prices).length;

        scores[seatId] =
          maxRevenue > minRevenue
            ? (avgPrice - minRevenue) / (maxRevenue - minRevenue)
            : 0.5;
      } else {
        scores[seatId] = 0;
      }
    });

    return scores;
  },

  getAvailabilityColorScale() {
    return [
      { value: 0, color: "rgb(239, 68, 68)" },
      { value: 0.5, color: "rgb(245, 158, 11)" },
      { value: 1, color: "rgb(16, 185, 129)" },
    ];
  },

  getPricingColorScale() {
    return [
      { value: 0, color: "rgb(59, 130, 246)" },
      { value: 0.25, color: "rgb(16, 185, 129)" },
      { value: 0.5, color: "rgb(245, 158, 11)" },
      { value: 0.75, color: "rgb(249, 115, 22)" },
      { value: 1, color: "rgb(239, 68, 68)" },
    ];
  },

  getRevenueColorScale() {
    return [
      { value: 0, color: "rgb(203, 213, 225)" },
      { value: 0.3, color: "rgb(96, 165, 250)" },
      { value: 0.6, color: "rgb(52, 211, 153)" },
      { value: 0.8, color: "rgb(251, 191, 36)" },
      { value: 1, color: "rgb(248, 113, 113)" },
    ];
  },

  interpolateColor(score, colorScale) {
    if (score <= 0) return colorScale[0].color;
    if (score >= 1) return colorScale[colorScale.length - 1].color;

    for (let i = 0; i < colorScale.length - 1; i++) {
      const lower = colorScale[i];
      const upper = colorScale[i + 1];

      if (score >= lower.value && score <= upper.value) {
        const range = upper.value - lower.value;
        const ratio = (score - lower.value) / range;

        return this.blendColors(lower.color, upper.color, ratio);
      }
    }

    return colorScale[0].color;
  },

  blendColors(color1, color2, ratio) {
    const rgb1 = color1.match(/\d+/g).map(Number);
    const rgb2 = color2.match(/\d+/g).map(Number);

    const r = Math.round(rgb1[0] + (rgb2[0] - rgb1[0]) * ratio);
    const g = Math.round(rgb1[1] + (rgb2[1] - rgb1[1]) * ratio);
    const b = Math.round(rgb1[2] + (rgb2[2] - rgb1[2]) * ratio);

    return `rgb(${r}, ${g}, ${b})`;
  },

  renderHeatMap(
    rows,
    seatsPerRow,
    seatDetails,
    scores,
    seatSize,
    seatGap,
    title,
    colorScale
  ) {
    const stagePadding = 40;
    const stageHeight = 40;
    const svgWidth = seatsPerRow * (seatSize + seatGap) + stagePadding * 2;
    const svgHeight =
      rows * (seatSize + seatGap) + stageHeight + stagePadding * 3;

    let seatsHTML = "";
    for (let row = 0; row < rows; row++) {
      const rowY =
        stagePadding +
        stageHeight +
        stagePadding +
        row * (seatSize + seatGap);
      const rowLetter = String.fromCharCode(65 + row);

      for (let seat = 0; seat < seatsPerRow; seat++) {
        const seatX = stagePadding + seat * (seatSize + seatGap);
        const seatNumber = seat + 1;
        const seatId = `${rowLetter}${seatNumber}`;
        const score = scores[seatId] || 0;
        const color = this.interpolateColor(score, colorScale);

        seatsHTML += `
          <g class="heat-seat" data-seat-id="${seatId}" data-score="${score.toFixed(
          2
        )}">
            <rect x="${seatX}" y="${rowY}" width="${seatSize}" height="${seatSize}" 
              fill="${color}" rx="4" stroke="rgb(255, 255, 255)" stroke-width="1" 
              class="transition-all hover:stroke-width-2">
              <title>${seatId}: ${(score * 100).toFixed(1)}%</title>
            </rect>
            <text x="${seatX + seatSize / 2}" y="${rowY + seatSize / 2 + 4
          }" fill="rgb(255, 255, 255)" 
              text-anchor="middle" font-size="${Math.min(
            seatSize * 0.3,
            12
          )}" font-weight="bold">${seatId}</text>
          </g>
        `;
      }
    }

    const legendHTML = this.generateLegend(colorScale, svgWidth);

    return `
      <div class="heat-map-container">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">${title}</h3>
        <svg width="${svgWidth}" height="${svgHeight + 60}" class="bg-white rounded shadow-lg mx-auto">
          <rect x="${stagePadding}" y="${stagePadding}" width="${seatsPerRow * (seatSize + seatGap)
      }" height="${stageHeight}" 
            fill="${StageColor}" rx="4" />
          <text x="${svgWidth / 2}" y="${stagePadding + stageHeight / 2 + 5
      }" fill="rgb(255, 255, 255)" 
            text-anchor="middle" font-size="16" font-weight="bold">STAGE</text>
          ${seatsHTML}
          ${legendHTML}
        </svg>
      </div>
    `;
  },

  generateLegend(colorScale, svgWidth) {
    const legendY = this.height - 30;
    const legendWidth = svgWidth * 0.6;
    const legendX = (svgWidth - legendWidth) / 2;
    const segmentWidth = legendWidth / (colorScale.length - 1);

    let legendHTML = `<g class="legend">`;

    for (let i = 0; i < colorScale.length - 1; i++) {
      const x = legendX + i * segmentWidth;
      legendHTML += `
        <rect x="${x}" y="${legendY}" width="${segmentWidth}" height="20" 
          fill="url(#gradient-${i})" stroke="rgb(209, 213, 219)" />
        <defs>
          <linearGradient id="gradient-${i}" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="${colorScale[i].color}" />
            <stop offset="100%" stop-color="${colorScale[i + 1].color}" />
          </linearGradient>
        </defs>
      `;
    }

    colorScale.forEach((item, i) => {
      const x = legendX + i * segmentWidth;
      legendHTML += `
        <text x="${x}" y="${legendY + 35}" fill="rgb(107, 114, 128)" 
          text-anchor="middle" font-size="10">${(item.value * 100).toFixed(
        0
      )}%</text>
      `;
    });

    legendHTML += `</g>`;
    return legendHTML;
  }
}

export const heatMapUtils = {
  createHeatMapToggle(containerId, modes = ["availability", "pricing", "revenue"]) {
    return `
      <div class="heat-map-controls mb-4">
        <div class="flex gap-2">
          ${modes
        .map(
          (mode) => `
            <button id="heat-${mode}" 
              class="heat-mode-btn px-4 py-2 rounded-lg border transition-colors ${mode === "availability"
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }" 
              data-mode="${mode}">
              <i class="fas fa-fire mr-2"></i>${mode.charAt(0).toUpperCase() + mode.slice(1)
            }
            </button>
          `
        )
        .join("")}
        </div>
      </div>
      <div id="${containerId}" class="heat-map-display"></div>
    `;
  },

  initHeatMapControls(generator, seatDetails, pricingSections, layout) {
    const $buttons = $(".heat-mode-btn");

    $buttons.on("click", function () {
      $buttons.removeClass("bg-indigo-600 text-white border-indigo-600")
        .addClass("bg-white text-gray-700 border-gray-300 hover:bg-gray-50");

      $(this).removeClass("bg-white text-gray-700 border-gray-300 hover:bg-gray-50")
        .addClass("bg-indigo-600 text-white border-indigo-600");

      const mode = $(this).data("mode");
      const $display = $(".heat-map-display");

      let html = "";
      switch (mode) {
        case "availability":
          html = generator.generateAvailabilityHeatMap(seatDetails, layout);
          break;
        case "pricing":
          html = generator.generatePricingHeatMap(
            seatDetails,
            pricingSections,
            layout
          );
          break;
        case "revenue":
          html = generator.generateRevenueHeatMap(
            seatDetails,
            pricingSections,
            layout
          );
          break;
      }

      $display.html(html);
    });

    $buttons.first().trigger("click");
  },
};

