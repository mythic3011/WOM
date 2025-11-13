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
  const parts = fullId.split("-");
  if (parts.length < 2) {
    return null;
  }

  const rowAndSeat = parts[parts.length - 1];
  const rowMatch = rowAndSeat.match(/^([a-z]+)(\d+)$/i);

  if (!rowMatch) {
    return null;
  }

  const sectionSlug = parts.slice(0, -1).join("-");
  const rowLabel = rowMatch[1];
  const seatNumber = parseInt(rowMatch[2], 10);

  return {
    sectionSlug,
    rowLabel,
    seatNumber,
    displayLabel: `${rowLabel.toUpperCase()}${seatNumber}`,
  };
}

export function getDisplayLabel(fullId) {
  const parsed = parseFullId(fullId);
  return parsed ? parsed.displayLabel : fullId;
}
