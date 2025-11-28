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

export function extractSection(seatId) {
  if (!seatId || typeof seatId !== "string") {
    return null;
  }

  const parts = seatId.split("-");
  if (parts.length < 2) {
    return null;
  }

  const lastPart = parts[parts.length - 1];
  if (/^\d+$/.test(lastPart) && parts.length >= 3) {
    return parts[0];
  }

  return parts.slice(0, -1).join("-");
}

export function extractRow(seatId) {
  if (!seatId || typeof seatId !== "string") {
    return null;
  }

  const parts = seatId.split("-");
  if (parts.length < 2) {
    return null;
  }

  const lastPart = parts[parts.length - 1];
  if (/^\d+$/.test(lastPart) && parts.length >= 3) {
    return parts[1];
  }

  const rowAndNumber = parts[parts.length - 1];
  const match = rowAndNumber.match(/^([a-z]+)(\d+)$/i);

  if (!match) {
    return null;
  }

  return match[1].toLowerCase();
}

export function parseSeatId(seatId) {
  if (!seatId || typeof seatId !== "string") {
    return null;
  }

  const parts = seatId.split("-");
  if (parts.length < 2) {
    return null;
  }

  const lastPart = parts[parts.length - 1];
  if (/^\d+$/.test(lastPart) && parts.length >= 3) {
    const section = parts[0];
    const row = parts[1];
    const number = parseInt(lastPart, 10);

    if (isNaN(number) || number <= 0) {
      return null;
    }

    return {
      section,
      row,
      number,
    };
  }

  const rowAndNumber = parts[parts.length - 1];
  const match = rowAndNumber.match(/^([a-z]+)(\d+)$/i);

  if (!match) {
    return null;
  }

  const section = parts.slice(0, -1).join("-");
  const row = match[1].toLowerCase();
  const number = parseInt(match[2], 10);

  if (isNaN(number) || number <= 0) {
    return null;
  }

  return {
    section,
    row,
    number,
  };
}

export function getDisplayLabel(seatId) {
  const parsed = parseSeatId(seatId);
  if (!parsed) {
    return seatId;
  }

  const sectionDisplay = parsed.section
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return `${sectionDisplay} ${parsed.row.toUpperCase()}${parsed.number}`;
}
