import { SeatNumberingSystem } from "../utils/SeatNumberingSystem.js";

export const seatHelpers = {
  calculateCapacity(layoutConfig) {
    if (!layoutConfig?.sections) return 0;

    const sys = new SeatNumberingSystem(layoutConfig);
    let total = 0;

    layoutConfig.sections.forEach((section, idx) => {
      total += sys.computeEffectiveCapacity(idx);
    });

    return total;
  },

  calculateCapacityBySections(layoutConfig) {
    if (!layoutConfig?.sections) return { totalCapacity: 0, sections: [] };

    const sys = new SeatNumberingSystem(layoutConfig);
    let total = 0;
    const sections = layoutConfig.sections.map((s, idx) => {
      const cap = sys.computeEffectiveCapacity(idx);
      total += cap;
      return { name: s.name, index: idx, capacity: cap };
    });

    return { totalCapacity: total, sections };
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
      if (seat.status) {
        if (stats[seat.status] !== undefined) {
          stats[seat.status]++;
        }
      }
      if (seat.category === "wheelchair") stats.wheelchair++;
    });

    return stats;
  },

  getStatusInfo(status) {
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
  },

  getCategoryIcon(category) {
    const iconMap = {
      wheelchair: "fa-wheelchair",
      "assisted-listening": "fa-assistive-listening-systems",
      "restricted-view": "fa-eye-slash",
      vip: "fa-star",
      standard: "fa-chair",
    };

    return iconMap[category] || null;
  },

  parseSeatId(fullId) {
    const parts = fullId.split("-");
    if (parts.length < 2) return null;

    const rowAndSeat = parts[parts.length - 1];
    const rowMatch = rowAndSeat.match(/^([a-z]+)(\d+)$/i);

    if (!rowMatch) return null;

    const sectionSlug = parts.slice(0, -1).join("-");
    const rowLabel = rowMatch[1];
    const seatNumber = parseInt(rowMatch[2], 10);

    return {
      sectionSlug,
      rowLabel,
      seatNumber,
      displayLabel: `${rowLabel.toUpperCase()}${seatNumber}`,
    };
  },

  getSeatDisplayLabel(fullId) {
    const parsed = this.parseSeatId(fullId);
    return parsed ? parsed.displayLabel : fullId;
  },

  groupBySection(seatDetails) {
    const grouped = {};

    Object.entries(seatDetails).forEach(([seatId, details]) => {
      const section = details.section || "default";
      if (!grouped[section]) {
        grouped[section] = [];
      }
      grouped[section].push({ id: seatId, ...details });
    });

    return grouped;
  },

  groupByStatus(seatDetails) {
    const grouped = {};

    Object.entries(seatDetails).forEach(([seatId, details]) => {
      const status = details.status || "unknown";
      if (!grouped[status]) {
        grouped[status] = [];
      }
      grouped[status].push({ id: seatId, ...details });
    });

    return grouped;
  },

  filterSeats(seatDetails, filters) {
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
  },

  isAvailable(seat) {
    return seat && seat.status === "available";
  },

  canSelect(seat, maxSelection, currentSelection) {
    if (!this.isAvailable(seat)) return false;
    if (!maxSelection) return true;
    return currentSelection.length < maxSelection;
  },
};
