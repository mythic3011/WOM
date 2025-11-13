import {
  getSectionColor,
  getSeatStatusColor,
  StageColor,
  SeatStatusColors,
} from "/src/utils/colors.js";
import { generateFullId } from "/src/utils/seatIdHelper.js";

export const seatMapGenerator = {
  generateFromLayout(
    layoutConfig,
    seatDetails = {},
    selectedSeats = [],
    interactive = true
  ) {
    if (!layoutConfig?.sections || layoutConfig.sections.length === 0) {
      return this.generateLegacySeatMap(
        10,
        20,
        seatDetails,
        selectedSeats,
        interactive
      );
    }

    const { svgWidth, svgHeight, sectionLayouts } =
      this.calculateLayoutDimensions(layoutConfig);

    const seatsHTML = this.generateLayoutSeatsHTML(
      layoutConfig,
      sectionLayouts,
      seatDetails,
      selectedSeats,
      interactive
    );

    return this.buildSVG(
      svgWidth,
      svgHeight,
      20,
      30,
      svgWidth - 40,
      seatsHTML,
      "bg-white rounded shadow-lg"
    );
  },

  calculateLayoutDimensions(layoutConfig) {
    const seatSize = 18;
    const spacingX = 28;
    const rowSpacing = 32;
    const aisleWidth = 15;
    const sectionGap = 40;
    const stagePadding = 40;
    const stageHeight = 40;

    const sectionLayouts = [];
    let totalHeight = stagePadding + stageHeight + stagePadding;
    let maxSectionWidth = 0;

    layoutConfig.sections.forEach((section, sectionIndex) => {
      const rawAisles = Array.isArray(section.aisles) ? section.aisles : [];
      const aislePattern = this.extractAislePattern(section, rawAisles);

      const horizontalAisles = rawAisles
        .filter((a) => a && a.type === "horizontal")
        .map((a) => ({
          position:
            a.position !== undefined
              ? a.position
              : a.afterRow !== undefined
              ? a.afterRow
              : 0,
          label: a.label || "",
        }));

      const sectionWidth = this.calculateTotalWidth(
        section.seatsPerRow,
        aislePattern,
        spacingX,
        aisleWidth
      );
      const heightFromAisles = horizontalAisles.length * rowSpacing;
      const sectionHeight = section.rows * rowSpacing + heightFromAisles;

      sectionLayouts.push({
        sectionIndex,
        x: stagePadding,
        y: totalHeight,
        width: sectionWidth,
        height: sectionHeight,
        seatSize,
        spacingX,
        rowSpacing,
        aisleWidth,
        aislePattern,
        horizontalAisles,
      });

      totalHeight += sectionHeight + sectionGap;
      maxSectionWidth = Math.max(maxSectionWidth, sectionWidth);
    });

    return {
      svgWidth: stagePadding + maxSectionWidth + stagePadding,
      svgHeight: totalHeight + stagePadding,
      sectionLayouts,
    };
  },

  extractAislePattern(section, rawAisles) {
    const verticalAisles = rawAisles
      .filter((a) => a && a.type === "vertical")
      .map((a) =>
        a.position !== undefined
          ? a.position
          : a.afterSeat !== undefined
          ? a.afterSeat
          : 0
      )
      .sort((a, b) => a - b);

    if (verticalAisles.length === 0) {
      return [section.seatsPerRow];
    }

    const pattern = [];
    let lastPos = 0;

    verticalAisles.forEach((aislePos) => {
      pattern.push(aislePos - lastPos);
      lastPos = aislePos;
    });

    pattern.push(section.seatsPerRow - lastPos);

    return pattern;
  },

  calculateTotalWidth(seatsPerRow, aislePattern, spacingX, aisleWidth) {
    const numAisles = aislePattern.length - 1;
    return seatsPerRow * spacingX + numAisles * aisleWidth;
  },

  calculateSeatPosition(seatNum, aislePattern, spacingX, aisleWidth, startX) {
    let currentSeatInPattern = seatNum;
    let seatsBefore = 0;
    let patternIndex = 0;

    for (let i = 0; i < aislePattern.length; i++) {
      if (currentSeatInPattern <= aislePattern[i]) {
        patternIndex = i;
        break;
      } else {
        currentSeatInPattern -= aislePattern[i];
        seatsBefore += aislePattern[i];
      }
    }

    return (
      startX +
      seatsBefore * spacingX +
      patternIndex * aisleWidth +
      (seatNum - seatsBefore - 1) * spacingX
    );
  },

  generateLayoutSeatsHTML(
    layoutConfig,
    sectionLayouts,
    seatDetails,
    selectedSeats,
    interactive
  ) {
    let html = "";

    layoutConfig.sections.forEach((section, sectionIndex) => {
      const layout = sectionLayouts[sectionIndex];
      const { seatSize, spacingX, rowSpacing, aisleWidth } = layout;

      const zoneX = layout.x - 20;
      const zoneY = layout.y - 30;
      const zoneWidth = layout.width + 50;
      const zoneHeight = layout.height + 40;

      html += `
        <rect class="zone-bg" x="${zoneX}" y="${zoneY}" width="${zoneWidth}" height="${zoneHeight}" 
          rx="8" fill="rgba(200, 200, 200, 0.1)" pointer-events="none" />
        <text class="zone-label" x="${layout.x + layout.width / 2}" y="${
        zoneY + 15
      }" 
          fill="#1f2121" text-anchor="middle" font-size="16" font-weight="600">${
            section.name
          }</text>
      `;

      const aislePattern = layout.aislePattern;
      for (let i = 0; i < aislePattern.length - 1; i++) {
        let seatsBefore = 0;
        for (let j = 0; j <= i; j++) {
          seatsBefore += aislePattern[j];
        }

        const aisleX =
          layout.x +
          seatsBefore * spacingX +
          i * aisleWidth +
          (spacingX - aisleWidth) / 2;

        html += `
          <rect x="${aisleX}" y="${
          layout.y - 5
        }" width="${aisleWidth}" height="${layout.height + 5}" 
            fill="rgba(200, 200, 200, 0.3)" stroke="rgba(180, 180, 180, 0.5)" stroke-dasharray="4,4" pointer-events="none" />
        `;
      }

      layout.horizontalAisles.forEach((aisle) => {
        const aisleY = layout.y + aisle.position * rowSpacing + rowSpacing;
        html += `
          <rect x="${layout.x}" y="${aisleY}" width="${
          layout.width
        }" height="${rowSpacing}" 
            fill="rgba(200, 200, 200, 0.3)" stroke="rgba(180, 180, 180, 0.5)" stroke-dasharray="4,4" pointer-events="none" />
          ${
            aisle.label
              ? `<text x="${layout.x + 6}" y="${
                  aisleY + rowSpacing / 2 + 3
                }" fill="#6b7280" font-size="10">${aisle.label}</text>`
              : ""
          }
        `;
      });

      for (let rowIndex = 0; rowIndex < section.rows; rowIndex++) {
        const rowLabel = this.computeRowLabel(section, rowIndex);
        const rowY = layout.y + rowIndex * rowSpacing;
        const rowCenterY = rowY + seatSize / 2;

        html += `
          <text class="row-label" x="${layout.x - 30}" y="${rowCenterY}" 
            fill="#626c71" text-anchor="middle" font-size="14" font-weight="500">${rowLabel}</text>
        `;

        for (let seatIndex = 0; seatIndex < section.seatsPerRow; seatIndex++) {
          const numbering = section.seatNumbering || {
            globalDirection: "L_TO_R",
            startNumber: 1,
          };
          const skipIndices = numbering.skipSeatIndices || [];
          if (skipIndices.includes(seatIndex)) {
            continue;
          }

          const seatNumber = seatIndex + 1;
          const seatLabel = this.computeSeatLabel(section, rowIndex, seatIndex);

          if (seatLabel) {
            const seatId = `${rowLabel}${seatLabel}`;
            const fullId = generateFullId(
              section.name || `section-${sectionIndex}`,
              rowLabel,
              seatNumber
            );
            const seatDetail = seatDetails[fullId] ||
              seatDetails[seatId] || { status: "available" };
            const isBooked = ["reserved", "booked", "blocked"].includes(
              String(seatDetail.status || "").toLowerCase()
            );
            const isSelected =
              selectedSeats.includes(fullId) || selectedSeats.includes(seatId);

            const seatX = this.calculateSeatPosition(
              seatNumber,
              aislePattern,
              spacingX,
              aisleWidth,
              layout.x
            );

            const fillColor = isSelected
              ? SeatStatusColors.selected.rgb
              : isBooked
              ? getSeatStatusColor("reserved")
              : getSectionColor(sectionIndex);

            const gClass = interactive
              ? `seat interactive-seat ${isBooked ? "occupied" : "available"}`
              : "seat";

            html += `
              <g class="${gClass}" data-seat-id="${seatId}" data-full-id="${fullId}" data-section="${sectionIndex}" 
                data-zone="${section.name}" data-price="${
              seatDetail.price || 0
            }" ${
              isBooked
                ? 'style="pointer-events: none; cursor: not-allowed;"'
                : ""
            }>
                <rect x="${seatX}" y="${rowY}" width="${seatSize}" height="${seatSize}"
                  fill="${fillColor}" rx="3" stroke="${
              isSelected ? "rgb(202, 138, 4)" : fillColor
            }" 
                  stroke-width="${isSelected ? "2" : "1"}" />
                <text class="seat-number" x="${
                  seatX + seatSize / 2
                }" y="${rowCenterY}" 
                  fill="white" text-anchor="middle" dominant-baseline="middle" font-size="9" font-weight="bold">${seatNumber}</text>
              </g>
            `;
          }
        }
      }
    });

    return html;
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

  computeSeatLabel(section, rowIndex, seatIndex) {
    const numbering = section.seatNumbering || {
      globalDirection: "L_TO_R",
      startNumber: 1,
    };
    const skipIndices = numbering.skipSeatIndices || [];

    if (skipIndices.includes(seatIndex)) {
      return "";
    }

    const startNumber = numbering.startNumber || 1;
    const seatNumber = startNumber + seatIndex;

    return `${seatNumber}`;
  },

  generateLegacySeatMap(rows, seats, seatDetails, selectedSeats, interactive) {
    const {
      svgWidth,
      svgHeight,
      seatSize,
      seatGap,
      stagePadding,
      stageHeight,
    } = this.calculateDimensions(rows, seats);

    const getSeatColorFn = (seatDetail) => {
      if (!seatDetail) {
        return getSeatStatusColor("available");
      }
      if (seatDetail.sectionIndex !== undefined) {
        return getSectionColor(seatDetail.sectionIndex);
      }
      return getSeatStatusColor(seatDetail.status);
    };

    const seatsHTML = this.generateSeatsHTML(
      rows,
      seats,
      seatDetails,
      selectedSeats,
      getSeatColorFn,
      seatSize,
      seatGap,
      stagePadding,
      stageHeight,
      interactive
    );

    return this.buildSVG(
      svgWidth,
      svgHeight,
      stagePadding,
      stageHeight,
      seats * (seatSize + seatGap) + seatGap,
      seatsHTML,
      "bg-white rounded shadow-lg"
    );
  },

  generateInteractiveSeatMap(
    rows,
    seats,
    seatDetails,
    selectedSeats = [],
    getSeatColorFn
  ) {
    const {
      svgWidth,
      svgHeight,
      seatSize,
      seatGap,
      stagePadding,
      stageHeight,
    } = this.calculateDimensions(rows, seats);

    const seatsHTML = this.generateSeatsHTML(
      rows,
      seats,
      seatDetails,
      selectedSeats,
      getSeatColorFn,
      seatSize,
      seatGap,
      stagePadding,
      stageHeight
    );

    return this.buildSVG(
      svgWidth,
      svgHeight,
      stagePadding,
      stageHeight,
      seats * (seatSize + seatGap) + seatGap,
      seatsHTML
    );
  },

  generateStaticSeatMap(rows, seats, seatDetails, getSeatColorFn) {
    const {
      svgWidth,
      svgHeight,
      seatSize,
      seatGap,
      stagePadding,
      stageHeight,
    } = this.calculateDimensions(rows, seats);

    const seatsHTML = this.generateSeatsHTML(
      rows,
      seats,
      seatDetails,
      [],
      getSeatColorFn,
      seatSize,
      seatGap,
      stagePadding,
      stageHeight,
      false
    );

    return this.buildSVG(
      svgWidth,
      svgHeight,
      stagePadding,
      stageHeight,
      seats * (seatSize + seatGap) + seatGap,
      seatsHTML,
      "bg-white rounded shadow-lg"
    );
  },

  generatePreviewSVG(rows, seats, seatDetails = {}, getSeatColorFn) {
    const seatSize = 24;
    const seatGap = 6;
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

      for (let seat = 0; seat < seats; seat++) {
        const seatX = stagePadding + seat * (seatSize + seatGap);
        const rowLetter = String.fromCharCode(65 + row);
        const seatNumber = seat + 1;
        const seatId = `${rowLetter}${seatNumber}`;
        const seatDetail = seatDetails[seatId];
        const seatColor = getSeatColorFn
          ? getSeatColorFn(seatDetail)
          : SeatStatusColors.available.rgb;

        seatsHTML += `
          <rect x="${seatX}" y="${rowY}" width="${seatSize}" height="${seatSize}"
            fill="${seatColor}" rx="3" />
          <text x="${seatX + seatSize / 2}" y="${
          rowY + seatSize / 2 + 4
        }" fill="white"
            text-anchor="middle" font-size="10" font-weight="bold">${rowLetter}${seatNumber}</text>
        `;
      }
    }

    return this.buildSVG(
      svgWidth,
      svgHeight,
      stagePadding,
      stageHeight,
      stageWidth,
      seatsHTML,
      "bg-white rounded shadow-sm"
    );
  },

  calculateDimensions(rows, seats, seatSize = 32, seatGap = 8) {
    const stageHeight = 40;
    const stagePadding = 40;
    const stageWidth = seats * (seatSize + seatGap) + seatGap;
    const svgWidth = stageWidth + stagePadding * 2;
    const svgHeight =
      rows * (seatSize + seatGap) + stageHeight + stagePadding * 3;

    return {
      svgWidth,
      svgHeight,
      seatSize,
      seatGap,
      stagePadding,
      stageHeight,
      stageWidth,
    };
  },

  generateSeatsHTML(
    rows,
    seats,
    seatDetails,
    selectedSeats,
    getSeatColorFn,
    seatSize,
    seatGap,
    stagePadding,
    stageHeight,
    interactive = true
  ) {
    let html = "";

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
          ? SeatStatusColors.selected.rgb
          : getSeatColorFn
          ? getSeatColorFn(seatDetail)
          : SeatStatusColors.available.rgb;

        const categoryIcon = this.getCategoryIcon(seatDetail);

        const gClass = interactive
          ? "interactive-seat cursor-pointer"
          : "seat-item";

        html += `
          <g class="${gClass}" data-seat-id="${seatId}">
            <rect x="${seatX}" y="${rowY}" width="${seatSize}" height="${seatSize}"
              fill="${fillColor}" rx="4" stroke="${
          isSelected ? "rgb(202, 138, 4)" : "#ffffff"
        }" stroke-width="${isSelected ? "3" : "1"}" />
            ${this.generateSeatLabel(
              seatX,
              rowY,
              seatSize,
              seatId,
              categoryIcon
            )}
          </g>
        `;
      }
    }

    return html;
  },

  getCategoryIcon(seatDetail) {
    if (!seatDetail?.category) return "";

    const icons = {
      wheelchair: "WC",
      "assisted-listening": "AL",
      "restricted-view": "RV",
    };

    return icons[seatDetail.category] || "";
  },

  generateSeatLabel(seatX, rowY, seatSize, seatId, categoryIcon) {
    if (categoryIcon) {
      return `
        <text x="${seatX + seatSize - 6}" y="${rowY + 12}" fill="white"
          text-anchor="middle" font-size="12">${categoryIcon}</text>
        <text x="${seatX + seatSize / 2}" y="${
        rowY + seatSize - 6
      }" fill="white"
          text-anchor="middle" font-size="9" font-weight="bold">${seatId}</text>
      `;
    }

    return `
      <text x="${seatX + seatSize / 2}" y="${
      rowY + seatSize / 2 + 4
    }" fill="white"
        text-anchor="middle" font-size="11" font-weight="bold">${seatId}</text>
    `;
  },

  buildSVG(
    svgWidth,
    svgHeight,
    stagePadding,
    stageHeight,
    stageWidth,
    seatsHTML,
    className = "bg-white rounded shadow-sm mx-auto"
  ) {
    const viewBoxWidth = svgWidth * 1.5;
    const viewBoxHeight = svgHeight * 1.5;
    const offsetX = -(viewBoxWidth - svgWidth) / 2;
    const offsetY = -(viewBoxHeight - svgHeight) / 2;

    return `
      <div class="overflow-y-auto overflow-x-hidden">
      <div class="flex justify-end mb-2 pr-1 gap-1 text-xs">
        <button type="button" class="zoom-btn px-2 py-1 border rounded" data-zoom="in">+</button>
        <button type="button" class="zoom-btn px-2 py-1 border rounded" data-zoom="out">-</button>
        <button type="button" class="zoom-btn px-2 py-1 border rounded" data-zoom="reset">Reset</button>
      </div>
      <svg viewBox="${offsetX} ${offsetY} ${viewBoxWidth} ${viewBoxHeight}" width="${svgWidth}" height="${svgHeight}" class="${className}" preserveAspectRatio="xMidYMid meet" style="display: block;">
        <rect x="${stagePadding}" y="${stagePadding}" width="${stageWidth}" height="${stageHeight}"
          fill="${StageColor}" rx="4" />
        <text x="${svgWidth / 2}" y="${
      stagePadding + stageHeight / 2 + 5
    }" fill="white"
          text-anchor="middle" font-size="14" font-weight="bold">STAGE</text>
        <g id="seats-layer">${seatsHTML}</g>
      </svg>
      </div>
    `;
  },

  initializeSeatDetails(rows, seatsPerRow) {
    const details = {};
    for (let row = 0; row < rows; row++) {
      for (let seat = 0; seat < seatsPerRow; seat++) {
        const rowLetter = String.fromCharCode(65 + row);
        const seatNumber = seat + 1;
        const seatId = `${rowLetter}${seatNumber}`;
        details[seatId] = { status: "available", section: null };
      }
    }
    return details;
  },
};
