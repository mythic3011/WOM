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
    const seatSize = 28;
    const seatGap = 6;
    const aisleUnit = seatSize + seatGap;
    const defaultAisleWidth = aisleUnit;
    const sectionGap = 60;
    const stagePadding = 40;
    const stageHeight = 40;

    const sectionLayouts = [];
    let totalHeight = stagePadding + stageHeight + stagePadding;
    let maxSectionWidth = 0;

    layoutConfig.sections.forEach((section, sectionIndex) => {
      const rawAisles = Array.isArray(section.aisles) ? section.aisles : [];
      const verticalAisles = rawAisles
        .filter((a) => a && a.type === "vertical")
        .map((a) => ({
          position:
            a.position !== undefined
              ? a.position
              : a.afterSeat !== undefined
              ? a.afterSeat
              : 0,
          widthPx:
            (a.width !== undefined && a.width !== null ? a.width : 1) *
            aisleUnit,
        }));
      const horizontalAisles = rawAisles
        .filter((a) => a && a.type === "horizontal")
        .map((a) => ({
          position:
            a.position !== undefined
              ? a.position
              : a.afterRow !== undefined
              ? a.afterRow
              : 0,
          widthPx:
            (a.width !== undefined && a.width !== null ? a.width : 1) *
            aisleUnit,
        }));

      const widthFromAisles = verticalAisles.reduce(
        (acc, a) => acc + (a.widthPx || defaultAisleWidth),
        0
      );
      const heightFromAisles = horizontalAisles.reduce(
        (acc, a) => acc + (a.widthPx || defaultAisleWidth),
        0
      );

      const sectionWidth = section.seatsPerRow * aisleUnit + widthFromAisles;
      const sectionHeight = section.rows * aisleUnit + heightFromAisles;

      sectionLayouts.push({
        sectionIndex,
        x: stagePadding,
        y: totalHeight,
        width: sectionWidth,
        height: sectionHeight,
        seatSize,
        seatGap,
        aisleUnit,
        verticalAisles,
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
      const { seatSize, seatGap, aisleUnit } = layout;

      const sortedV = [...layout.verticalAisles].sort(
        (a, b) => a.position - b.position
      );
      const sortedH = [...layout.horizontalAisles].sort(
        (a, b) => a.position - b.position
      );

      let accV = 0;
      const verticalRects = sortedV
        .map((a) => {
          const xOffset = (seatSize + seatGap) * (a.position + 1) + accV;
          accV += a.widthPx || aisleUnit;
          const x = layout.x + xOffset;
          const y = layout.y;
          const w = a.widthPx || aisleUnit;
          const h = layout.height;
          const label = a.label || "";
          return `
            <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#f3f4f6" pointer-events="none" />
            ${
              label
                ? `<text x="${x + w / 2}" y="${
                    y + 12
                  }" fill="#6b7280" text-anchor="middle" font-size="10">${label}</text>`
                : ""
            }
          `;
        })
        .join("");

      let accH = 0;
      const horizontalRects = sortedH
        .map((a) => {
          const yOffset = (seatSize + seatGap) * (a.position + 1) + accH;
          accH += a.widthPx || aisleUnit;
          const x = layout.x;
          const y = layout.y + yOffset;
          const w = layout.width;
          const h = a.widthPx || aisleUnit;
          const label = a.label || "";
          return `
            <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#f3f4f6" pointer-events="none" />
            ${
              label
                ? `<text x="${x + 6}" y="${
                    y + h / 2 + 3
                  }" fill="#6b7280" font-size="10">${label}</text>`
                : ""
            }
          `;
        })
        .join("");
      html += verticalRects + horizontalRects;

      let currentY = layout.y;
      console.log(
        `Section ${sectionIndex}: Starting Y = ${currentY}, layout.x = ${layout.x}`
      );

      for (let rowIndex = 0; rowIndex < section.rows; rowIndex++) {
        const rowLabel = this.computeRowLabel(section, rowIndex);
        let currentX = layout.x;

        for (let seatIndex = 0; seatIndex < section.seatsPerRow; seatIndex++) {
          const numbering = section.seatNumbering || {
            globalDirection: "L_TO_R",
            startNumber: 1,
          };
          const skipIndices = numbering.skipSeatIndices || [];
          if (skipIndices.includes(seatIndex)) {
            continue;
          }
          const direction = numbering.globalDirection || "L_TO_R";
          const startNumber = numbering.startNumber || 1;
          const effectiveIndex =
            direction === "R_TO_L"
              ? section.seatsPerRow - 1 - seatIndex
              : seatIndex;
          const seatNumber = startNumber + effectiveIndex;
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

            const fillColor = isSelected
              ? SeatStatusColors.selected.rgb
              : isBooked
              ? getSeatStatusColor("reserved")
              : getSectionColor(sectionIndex);

            const gClass = interactive
              ? `interactive-seat ${isBooked ? "opacity-60" : "cursor-pointer"}`
              : "seat-item";

            html += `
              <g tabindex="0" class="${gClass}" data-seat-id="${seatId}" data-full-id="${fullId}" data-section="${sectionIndex}" ${
              isBooked ? 'style="pointer-events: none;"' : ""
            }>
                <rect x="${currentX}" y="${currentY}" width="${seatSize}" height="${seatSize}"
                  fill="${fillColor}" rx="4" stroke="${
              isSelected ? "rgb(202, 138, 4)" : "#ffffff"
            }" stroke-width="${isSelected ? "3" : "1"}" />
                <text x="${currentX + seatSize / 2}" y="${
              currentY + seatSize / 2 + 4
            }" fill="white"
                  text-anchor="middle" font-size="10" font-weight="bold">${seatId}</text>
              </g>
            `;
          }

          currentX += seatSize + seatGap;

          const vertAisle = layout.verticalAisles.find(
            (a) => a.position === seatIndex
          );
          if (vertAisle) {
            currentX += vertAisle.widthPx || aisleUnit;
          }
        }

        currentY += seatSize + seatGap;

        const horizAisle = layout.horizontalAisles.find(
          (a) => a.position === rowIndex
        );
        if (horizAisle) {
          currentY += horizAisle.widthPx || aisleUnit;
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

    const direction = numbering.globalDirection || "L_TO_R";
    const startNumber = numbering.startNumber || 1;
    const prefix = numbering.prefix || "";
    const suffix = numbering.suffix || "";

    const effectiveIndex =
      direction === "R_TO_L" ? section.seatsPerRow - 1 - seatIndex : seatIndex;

    let seatNumber = startNumber + effectiveIndex;

    return `${prefix}${seatNumber}${suffix}`;
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
    return `
      <div class="overflow-y-auto overflow-x-hidden">
      <div class="flex justify-end mb-2 pr-1 gap-1 text-xs">
        <button type="button" class="zoom-btn px-2 py-1 border rounded" data-zoom="in">+</button>
        <button type="button" class="zoom-btn px-2 py-1 border rounded" data-zoom="out">-</button>
        <button type="button" class="zoom-btn px-2 py-1 border rounded" data-zoom="reset">Reset</button>
      </div>
      <svg viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}" class="${className}" preserveAspectRatio="xMinYMin meet" style="display: block;">
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
