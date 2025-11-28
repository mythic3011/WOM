export const selectRow = (seatDetails, layout, rowLetter) => {
  const selectedSeats = [];
  const seatsPerRow = layout.seatsPerRow || 10;

  for (let i = 1; i <= seatsPerRow; i++) {
    const seatId = `${rowLetter}${i}`;
    if (seatDetails[seatId]) {
      selectedSeats.push(seatId);
    }
  }

  return selectedSeats;
};

export const selectRowRange = (seatDetails, layout, startRow, endRow) => {
  const selectedSeats = [];
  const startCode = startRow.charCodeAt(0);
  const endCode = endRow.charCodeAt(0);

  for (let code = startCode; code <= endCode; code++) {
    const rowLetter = String.fromCharCode(code);
    selectedSeats.push(...selectRow(seatDetails, layout, rowLetter));
  }

  return selectedSeats;
};

export const selectSeatRange = (seatDetails, fromSeat, toSeat) => {
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
};

export const selectByStatus = (seatDetails, status) => {
  return Object.keys(seatDetails).filter(
    (seatId) => seatDetails[seatId].status === status
  );
};

export const applyBulkOperation = (seatDetails, selectedSeats, operation, value) => {
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
};

export const calculateStats = (seatDetails) => {
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
    if (seat.status) {
      if (stats[seat.status] !== undefined) {
        stats[seat.status]++;
      }
    }
    if (seat.category === "wheelchair") {stats.wheelchair++;}
  });

  return stats;
};

export const initializeSeatDetails = (rows, seatsPerRow) => {
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
};

export const getStatusInfo = (status) => {
  const statusMap = {
    available: {
      label: "Available",
      color: "rgb(16, 185, 129)",
      colorClass: "bg-green-500",
      icon: "fa-chair",
    },
    blocked: {
      label: "Blocked",
      color: "rgb(239, 68, 68)",
      colorClass: "bg-red-500",
      icon: "fa-ban",
    },
    reserved: {
      label: "Reserved",
      color: "rgb(245, 158, 11)",
      colorClass: "bg-amber-500",
      icon: "fa-bookmark",
    },
    selected: {
      label: "Selected",
      color: "rgb(234, 179, 8)",
      colorClass: "bg-yellow-500",
      icon: "fa-check",
    },
    vip: {
      label: "VIP",
      color: "rgb(139, 92, 246)",
      colorClass: "bg-purple-500",
      icon: "fa-star",
    },
    wheelchair: {
      label: "Wheelchair",
      color: "rgb(59, 130, 246)",
      colorClass: "bg-blue-500",
      icon: "fa-wheelchair",
    },
  };

  return statusMap[status] || statusMap.available;
};

export const getCategoryIcon = (category) => {
  const iconMap = {
    wheelchair: "fa-wheelchair",
    "assisted-listening": "fa-assistive-listening-systems",
    "restricted-view": "fa-eye-slash",
    vip: "fa-star",
    standard: "fa-chair",
  };

  return iconMap[category] || null;
};

export const parseSeatId = (fullId) => {
  const parts = fullId.split("-");
  if (parts.length < 2) {return null;}

  const rowAndSeat = parts[parts.length - 1];
  const rowMatch = rowAndSeat.match(/^([a-z]+)(\d+)$/i);

  if (!rowMatch) {return null;}

  const sectionSlug = parts.slice(0, -1).join("-");
  const rowLabel = rowMatch[1];
  const seatNumber = parseInt(rowMatch[2], 10);

  return {
    sectionSlug,
    rowLabel,
    seatNumber,
    displayLabel: `${rowLabel.toUpperCase()}${seatNumber}`,
  };
};

export const getSeatDisplayLabel = (fullId) => {
  const parsed = parseSeatId(fullId);
  return parsed ? parsed.displayLabel : fullId;
};

export const groupBySection = (seatDetails) => {
  const grouped = {};

  Object.entries(seatDetails).forEach(([seatId, details]) => {
    const section = details.section || "default";
    if (!grouped[section]) {
      grouped[section] = [];
    }
    grouped[section].push({ id: seatId, ...details });
  });

  return grouped;
};

export const groupByStatus = (seatDetails) => {
  const grouped = {};

  Object.entries(seatDetails).forEach(([seatId, details]) => {
    const status = details.status || "unknown";
    if (!grouped[status]) {
      grouped[status] = [];
    }
    grouped[status].push({ id: seatId, ...details });
  });

  return grouped;
};

export const filterSeats = (seatDetails, filters) => {
  let filtered = Object.entries(seatDetails);

  if (filters.status) {
    filtered = filtered.filter(([_, seat]) => seat.status === filters.status);
  }

  if (filters.category) {
    filtered = filtered.filter(
      ([_, seat]) => seat.category === filters.category
    );
  }

  if (filters.section) {
    filtered = filtered.filter(
      ([_, seat]) => seat.section === filters.section
    );
  }

  if (filters.row) {
    filtered = filtered.filter(([seatId]) => seatId.startsWith(filters.row));
  }

  return Object.fromEntries(filtered);
};

export const selectPattern = (seatDetails, layout, pattern) => {
  const selectedSeats = [];
  const rows = layout.rows || 8;
  const seatsPerRow = layout.seatsPerRow || 10;

  for (let i = 0; i < rows; i++) {
    const rowLetter = String.fromCharCode(65 + i);
    for (let j = 1; j <= seatsPerRow; j++) {
      const seatId = `${rowLetter}${j}`;
      if (!seatDetails[seatId]) {continue;}

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
};

export const generateSeatLayout = (rows, seatsPerRow) => {
  return initializeSeatDetails(rows, seatsPerRow);
};

export const getSeatColor = (seat) => {
  const info = getStatusInfo(seat.status);
  return info.color;
};

export const getSeatIcon = (seat) => {
  return getCategoryIcon(seat.category);
};

export const seatUtils = {
  selectRow,
  selectRowRange,
  selectSeatRange,
  selectByStatus,
  applyBulkOperation,
  calculateStats,
  initializeSeatDetails,
  getStatusInfo,
  getCategoryIcon,
  parseSeatId,
  getSeatDisplayLabel,
  groupBySection,
  groupByStatus,
  filterSeats,
  selectPattern,
  generateSeatLayout,
  getSeatColor,
  getSeatIcon,
};
