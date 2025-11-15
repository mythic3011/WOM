import { seatHelpers } from "../services/seatHelpers.js";

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
  return seatHelpers.parseSeatId(fullId);
}

export function getDisplayLabel(fullId) {
  return seatHelpers.getSeatDisplayLabel(fullId);
}
