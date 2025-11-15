import { seatHelpers } from "../../services/seatHelpers.js";

export const seatUtils = {
  selectRow(seatDetails, layout, rowLetter) {
    return seatHelpers.selectRow(seatDetails, layout, rowLetter);
  },

  selectRowRange(seatDetails, layout, startRow, endRow) {
    return seatHelpers.selectRowRange(seatDetails, layout, startRow, endRow);
  },

  selectSeatRange(seatDetails, fromSeat, toSeat) {
    return seatHelpers.selectSeatRange(seatDetails, fromSeat, toSeat);
  },

  selectPattern(seatDetails, layout, pattern) {
    const selectedSeats = [];
    const rows = layout.rows || 8;
    const seatsPerRow = layout.seatsPerRow || 10;

    for (let i = 0; i < rows; i++) {
      const rowLetter = String.fromCharCode(65 + i);
      for (let j = 1; j <= seatsPerRow; j++) {
        const seatId = `${rowLetter}${j}`;
        if (!seatDetails[seatId]) continue;

        let shouldSelect = false;

        switch (pattern) {
          case "alternating":
            shouldSelect = (i + j) % 2 === 0;
            break;
          case "checkerboard":
            shouldSelect =
              (i % 2 === 0 && j % 2 === 1) || (i % 2 === 1 && j % 2 === 0);
            break;
          case "front":
            shouldSelect = i < Math.floor(rows / 3);
            break;
          case "back":
            shouldSelect = i >= Math.ceil((rows * 2) / 3);
            break;
          case "center":
            shouldSelect =
              j > Math.floor(seatsPerRow / 3) &&
              j <= Math.ceil((seatsPerRow * 2) / 3);
            break;
          case "sides":
            shouldSelect =
              j <= Math.floor(seatsPerRow / 3) ||
              j > Math.ceil((seatsPerRow * 2) / 3);
            break;
          case "aisle":
            shouldSelect = j === 1 || j === seatsPerRow;
            break;
        }

        if (shouldSelect) {
          selectedSeats.push(seatId);
        }
      }
    }

    return selectedSeats;
  },

  selectByStatus(seatDetails, status) {
    return seatHelpers.selectByStatus(seatDetails, status);
  },

  applyBulkOperation(seatDetails, selectedSeats, operation, value) {
    return seatHelpers.applyBulkOperation(
      seatDetails,
      selectedSeats,
      operation,
      value
    );
  },

  calculateStats(seatDetails) {
    return seatHelpers.calculateStats(seatDetails);
  },

  generateSeatLayout(rows, seatsPerRow) {
    return seatHelpers.initializeSeatDetails(rows, seatsPerRow);
  },

  getSeatColor(seat) {
    const info = seatHelpers.getStatusInfo(seat.status);
    return info.color;
  },

  getSeatIcon(seat) {
    return seatHelpers.getCategoryIcon(seat.category);
  },
};
