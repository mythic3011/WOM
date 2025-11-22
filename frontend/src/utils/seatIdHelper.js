import { parseSeatId as parseSeatIdFromUtils, getSeatDisplayLabel } from "./booking/seatUtils.js";

function slugify(text) {
  return (text || "")
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

export function generateFullId(sectionName, rowLabel, seatNumber) {
  const sectionSlug = slugify(sectionName);
  const normalizedRow = rowLabel.toLowerCase();
  return `${sectionSlug}-${normalizedRow}${seatNumber}`;
}

export function parseFullId(fullId) {
  return parseSeatIdFromUtils(fullId);
}

export function getDisplayLabel(fullId) {
  return getSeatDisplayLabel(fullId);
}

/**
 * Extract section from seat ID
 * @param {string} seatId - Seat ID in format "section-row-number"
 * @returns {string|null} Section name or null if invalid
 * @example
 * extractSection("orchestra-a-12") // returns "orchestra"
 * extractSection("balcony-b-5") // returns "balcony"
 */
export function extractSection(seatId) {
  if (!seatId || typeof seatId !== 'string') {
    return null;
  }

  const parts = seatId.split('-');
  if (parts.length < 2) {
    return null;
  }

  // Handle format: "section-rowNumber" (e.g., "orchestra-a12")
  // or "section-row-number" (e.g., "orchestra-a-12")

  // Check if last part is just a number (format: section-row-number)
  const lastPart = parts[parts.length - 1];
  if (/^\d+$/.test(lastPart) && parts.length >= 3) {
    // Format: section-row-number
    return parts[0];
  }

  // Format: section-rowNumber (e.g., "orchestra-a12")
  // Section is everything except the last part
  return parts.slice(0, -1).join('-');
}

/**
 * Extract row from seat ID
 * @param {string} seatId - Seat ID in format "section-row-number" or "section-rowNumber"
 * @returns {string|null} Row identifier or null if invalid
 * @example
 * extractRow("orchestra-a-12") // returns "a"
 * extractRow("orchestra-a12") // returns "a"
 * extractRow("balcony-aa-5") // returns "aa"
 */
export function extractRow(seatId) {
  if (!seatId || typeof seatId !== 'string') {
    return null;
  }

  const parts = seatId.split('-');
  if (parts.length < 2) {
    return null;
  }

  // Check if last part is just a number (format: section-row-number)
  const lastPart = parts[parts.length - 1];
  if (/^\d+$/.test(lastPart) && parts.length >= 3) {
    // Format: section-row-number
    return parts[1];
  }

  // Format: section-rowNumber (e.g., "orchestra-a12")
  // Extract row letters from the last part
  const rowAndNumber = parts[parts.length - 1];
  const match = rowAndNumber.match(/^([a-z]+)(\d+)$/i);

  if (!match) {
    return null;
  }

  return match[1].toLowerCase();
}

/**
 * Parse seat ID into its components
 * @param {string} seatId - Seat ID in format "section-row-number" or "section-rowNumber"
 * @returns {Object|null} Object with section, row, and number properties, or null if invalid
 * @example
 * parseSeatId("orchestra-a-12") // returns { section: "orchestra", row: "a", number: 12 }
 * parseSeatId("orchestra-a12") // returns { section: "orchestra", row: "a", number: 12 }
 * parseSeatId("balcony-aa-5") // returns { section: "balcony", row: "aa", number: 5 }
 */
export function parseSeatId(seatId) {
  if (!seatId || typeof seatId !== 'string') {
    return null;
  }

  const parts = seatId.split('-');
  if (parts.length < 2) {
    return null;
  }

  // Check if last part is just a number (format: section-row-number)
  const lastPart = parts[parts.length - 1];
  if (/^\d+$/.test(lastPart) && parts.length >= 3) {
    // Format: section-row-number
    const section = parts[0];
    const row = parts[1];
    const number = parseInt(lastPart, 10);

    if (isNaN(number) || number <= 0) {
      return null;
    }

    return {
      section,
      row,
      number
    };
  }

  // Format: section-rowNumber (e.g., "orchestra-a12")
  const rowAndNumber = parts[parts.length - 1];
  const match = rowAndNumber.match(/^([a-z]+)(\d+)$/i);

  if (!match) {
    return null;
  }

  const section = parts.slice(0, -1).join('-');
  const row = match[1].toLowerCase();
  const number = parseInt(match[2], 10);

  if (isNaN(number) || number <= 0) {
    return null;
  }

  return {
    section,
    row,
    number
  };
}
