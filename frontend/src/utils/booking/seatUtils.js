export const seatUtils = {
  selectRow(seatDetails, layout, rowLetter) {
    const selectedSeats = [];
    const seatsPerRow = layout.seatsPerRow || 10;

    for (let i = 1; i <= seatsPerRow; i++) {
      const seatId = `${rowLetter}${i}`;
      if (seatDetails[seatId]) {
        selectedSeats.push(seatId);
      }
    }

    return selectedSeats;
  },

  selectRowRange(seatDetails, layout, startRow, endRow) {
    const selectedSeats = [];
    const startCode = startRow.charCodeAt(0);
    const endCode = endRow.charCodeAt(0);

    for (let code = startCode; code <= endCode; code++) {
      const rowLetter = String.fromCharCode(code);
      selectedSeats.push(...this.selectRow(seatDetails, layout, rowLetter));
    }

    return selectedSeats;
  },

  selectSeatRange(seatDetails, fromSeat, toSeat) {
    const fromRow = fromSeat.charCodeAt(0);
    const fromCol = parseInt(fromSeat.substring(1));
    const toRow = toSeat.charCodeAt(0);
    const toCol = parseInt(toSeat.substring(1));

    const selectedSeats = [];
    const minRow = Math.min(fromRow, toRow);
    const maxRow = Math.max(fromRow, toRow);
    const minCol = Math.min(fromCol, toCol);
    const maxCol = Math.max(fromCol, toCol);

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const seatId = `${String.fromCharCode(row)}${col}`;
        if (seatDetails[seatId]) {
          selectedSeats.push(seatId);
        }
      }
    }

    return selectedSeats;
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
    return Object.keys(seatDetails).filter(
      (seatId) => seatDetails[seatId].status === status
    );
  },

  applyBulkOperation(seatDetails, selectedSeats, operation, value) {
    const updated = { ...seatDetails };

    selectedSeats.forEach((seatId) => {
      if (updated[seatId]) {
        switch (operation) {
          case "status":
            updated[seatId] = { ...updated[seatId], status: value };
            break;
          case "category":
            updated[seatId] = { ...updated[seatId], category: value };
            break;
          case "section":
            updated[seatId] = { ...updated[seatId], section: value };
            break;
          case "notes":
            updated[seatId] = { ...updated[seatId], notes: value };
            break;
        }
      }
    });

    return updated;
  },

  calculateStats(seatDetails) {
    const stats = {
      total: 0,
      available: 0,
      blocked: 0,
      reserved: 0,
      vip: 0,
      wheelchair: 0,
    };

    Object.values(seatDetails).forEach((seat) => {
      stats.total++;
      if (seat.status) stats[seat.status]++;
      if (seat.category === "wheelchair") stats.wheelchair++;
    });

    return stats;
  },

  generateSeatLayout(rows, seatsPerRow) {
    const seatDetails = {};

    for (let i = 0; i < rows; i++) {
      const rowLetter = String.fromCharCode(65 + i);
      for (let j = 1; j <= seatsPerRow; j++) {
        const seatId = `${rowLetter}${j}`;
        seatDetails[seatId] = { status: "available" };
      }
    }

    return seatDetails;
  },

  getSeatColor(seat) {
    const colors = {
      available: "rgb(16, 185, 129)",
      blocked: "rgb(239, 68, 68)",
      reserved: "rgb(245, 158, 11)",
      vip: "rgb(139, 92, 246)",
      wheelchair: "rgb(59, 130, 246)",
    };

    return colors[seat.status] || colors.available;
  },

  getSeatIcon(seat) {
    if (seat.category === "wheelchair") return "wheelchair";
    if (seat.category === "assisted-listening")
      return "assistive-listening-systems";
    if (seat.category === "restricted-view") return "eye-slash";
    return null;
  },
};
