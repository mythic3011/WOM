/**
 * @file seatMapBuilder.js
 * @description Builds seat maps from venue layouts with position calculation, caching, and seat resolution utilities
 * @author LI Ning 25127563d
 * @author SHEK chinhei 25017482d
 * @dependency backend/src/utils/SeatNumberingSystem.js
 * @dependency backend/src/utils/stringUtils.js
 * @see backend/src/services/venueService.js
 * @see backend/src/services/performanceService.js
 */

import { SeatNumberingSystem } from "./SeatNumberingSystem.js";
import { slugify } from "./stringUtils.js";

const seatMapCache = new Map();
const CACHE_MAX_SIZE = 100;

/**
 * @param {number} rowIndex - Index of the row in the section
 * @param {number} seatIndex - Index of the seat in the row
 * @param {Object} section - Section configuration object
 * @param {Array} rowSeats - All seats in the row (from enumerateRow, including gaps/empty)
 * @param {string} _rowLabel - Current row label (e.g., "A", "B")
 * @returns {Object} Seat position and dimensions object
 * @returns {number} returns.x - X coordinate in pixels
 * @returns {number} returns.y - Y coordinate in pixels
 * @returns {number} returns.width - Seat width in pixels
 * @returns {number} returns.height - Seat height in pixels
 */
export function calculateSeatPosition(rowIndex, seatIndex, section, rowSeats, _rowLabel) {
  const SEAT_WIDTH = 40;
  const SEAT_HEIGHT = 40;
  const ROW_SPACING = 10;
  const GAP_WIDTH = 20;  // Width of 'H' gaps in pattern

  // Calculate X position accounting for previous seats' widths and gaps
  let x = 0;
  for (let i = 0; i < seatIndex; i++) {
    const seat = rowSeats[i];
    if (seat.gap) {
      // 'H' in pattern = horizontal gap between seats
      x += GAP_WIDTH;
    } else if (seat.empty) {
      // 'E' in pattern = empty position (still takes space)
      x += SEAT_WIDTH;
    } else {
      // 'S' in pattern = actual seat (may have custom width)
      const seatWidth = (seat.shape?.width || 1.0) * SEAT_WIDTH;
      x += seatWidth;
    }
  }

  // Get current seat's dimensions
  const currentSeat = rowSeats[seatIndex];
  const width = (currentSeat.shape?.width || 1.0) * SEAT_WIDTH;
  const height = SEAT_HEIGHT;

  // Calculate Y position with row spacing
  let y = 0;

  // Calculate Y by iterating through rows and accounting for horizontal aisles
  const horizontalAisles = section.horizontalAisles || [];
  for (let r = 0; r < rowIndex; r++) {
    y += SEAT_HEIGHT + ROW_SPACING;

    // Check if there's a horizontal aisle after this row
    const currentRowLabel = String.fromCharCode(
      (section.startRow || "A").charCodeAt(0) + r
    );
    const aisleAfterRow = horizontalAisles.find(
      a => a.afterRow === currentRowLabel
    );
    if (aisleAfterRow) {
      y += (aisleAfterRow.height || 1) * (SEAT_HEIGHT + ROW_SPACING);
    }
  }

  return { x, y, width, height };
}

/**
 * @param {Object} [layout={}] - Venue layout configuration
 * @param {Array} layout.sections - Array of section configurations
 * @returns {Object} Complete seat map with sections, index map, and metadata
 * @returns {Array} returns.sections - Mapped sections with positioned seats
 * @returns {Object} returns.indexMap - Lookup map from seat ID to seat object
 * @returns {number} returns.total - Total number of seats
 * @returns {number} returns.version - Seat map version number
 */
export function buildSeatMapFromVenueLayout(layout = {}) {
  const sections = layout?.sections || [];
  if (!sections.length) {
    return { sections: [], indexMap: {}, total: 0, version: 1 };
  }

  const cacheKey = JSON.stringify(layout);
  const cached = seatMapCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const sys = new SeatNumberingSystem(layout);
  const indexMap = {};

  const mapped = sections.map((section, sectionIndex) => {
    const sectionSlug = slugify(section.name);
    const rows = Array.from({ length: section.rows || 0 }, (_, rowIndex) => {
      const rowLabel = sys.computeRowLabel(sectionIndex, rowIndex);
      const rowKey = String(rowLabel || "").toLowerCase();

      // Get ALL enumerated seats (including gaps and empty positions)
      const allEnumeratedSeats = sys.enumerateRow(sectionIndex, rowIndex);

      // Filter to get only actual bookable seats and calculate positions
      const rowSeats = allEnumeratedSeats
        .filter((s) => !s.skipped && !s.empty && !s.gap && s.label && !s.label.endsWith("-SKIP"))
        .map((s) => {
          const seatNumber = Number((s.label || "").replace(/[^0-9]/g, ""));
          const displayLabel = s.label;
          const fullId = `${sectionSlug}-${rowKey}${seatNumber}`;

          // Calculate position accounting for gaps and variable widths
          // Pass the full enumerated row (with gaps/empty) for accurate position calculation
          const position = calculateSeatPosition(rowIndex, s.seatIndex, section, allEnumeratedSeats, rowLabel);

          const seat = {
            fullId,
            displayLabel,
            sectionName: section.name,
            rowLabel,
            seatNumber,
            tier: section.tier || "standard",
            seatIndex: s.seatIndex,
            effectiveIndex: s.effectiveIndex,
            position,  // x, y coordinates and dimensions
            shape: s.shape  // seat shape configuration
          };
          indexMap[fullId.toLowerCase()] = seat;
          return seat;
        });
      return { rowLabel, seats: rowSeats };
    });
    return {
      name: section.name,
      tier: section.tier || "standard",
      rows,
      horizontalAisles: section.horizontalAisles || []  // horizontal aisle info
    };
  });

  const total = mapped.reduce(
    (sum, sec) => sum + sec.rows.reduce((r, row) => r + row.seats.length, 0),
    0
  );

  const result = { sections: mapped, indexMap, total, version: 1 };

  if (seatMapCache.size >= CACHE_MAX_SIZE) {
    const firstKey = seatMapCache.keys().next().value;
    seatMapCache.delete(firstKey);
  }
  seatMapCache.set(cacheKey, result);

  return result;
}

/**
 * @param {Object} seatMap - Seat map object from buildSeatMapFromVenueLayout
 * @param {Array} seatMap.sections - Array of sections
 * @param {number} [seatMap.total] - Cached total count
 * @returns {number} Total number of seats in the seat map
 */
export function countSeats(seatMap) {
  if (!seatMap?.sections?.length) { return 0; }
  if (seatMap.total !== undefined) {
    return seatMap.total;
  }
  return seatMap.sections.reduce(
    (sum, sec) => sum + sec.rows.reduce((r, row) => r + row.seats.length, 0),
    0
  );
}

/**
 * @param {Object} seatMap - Seat map object with indexMap
 * @param {Object} seatMap.indexMap - Lookup map from seat ID to seat object
 * @param {string} inputId - Seat identifier to resolve (full or partial)
 * @returns {Object|null} Resolved seat object or null if not found
 */
export function resolveSeatId(seatMap, inputId) {
  if (!seatMap?.indexMap) {
    return null;
  }
  const normalized = inputId.toLowerCase().trim();
  if (seatMap.indexMap[normalized]) {
    return seatMap.indexMap[normalized];
  }
  const matches = Object.keys(seatMap.indexMap).filter((k) =>
    k.endsWith(`-${normalized}`)
  );
  if (matches.length === 1) {
    return seatMap.indexMap[matches[0]];
  }
  return null;
}
