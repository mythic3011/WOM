import {
  getSectionColor,
  getSeatStatusColor,
  StageColor,
  SeatStatusColors,
} from "/src/utils/colors.js";

export const seatMapGenerator = {
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
    const stageHeight = 30;
    const stagePadding = 20;
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
      wheelchair: "♿",
      "assisted-listening": "🎧",
      "restricted-view": "⚠️",
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
      <svg width="${svgWidth}" height="${svgHeight}" class="${className}">
        <rect x="${stagePadding}" y="${stagePadding}" width="${stageWidth}" height="${stageHeight}"
          fill="${StageColor}" rx="4" />
        <text x="${svgWidth / 2}" y="${
      stagePadding + stageHeight / 2 + 5
    }" fill="white"
          text-anchor="middle" font-size="14" font-weight="bold">STAGE</text>
        ${seatsHTML}
      </svg>
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
