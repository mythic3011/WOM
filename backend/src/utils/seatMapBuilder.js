import { SeatNumberingSystem } from "./SeatNumberingSystem.js";

function slugify(text) {
  return (text || "")
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

export function buildSeatMapFromVenueLayout(layout = {}) {
  const sections = layout?.sections || [];
  if (!sections.length) {
    return { sections: [], indexMap: {}, total: 0, version: 1 };
  }
  const sys = new SeatNumberingSystem(layout);
  const indexMap = {};

  const mapped = sections.map((section, sectionIndex) => {
    const sectionSlug = slugify(section.name);
    const rows = Array.from({ length: section.rows || 0 }, (_, rowIndex) => {
      const rowLabel = sys.computeRowLabel(sectionIndex, rowIndex);
      const rowSeats = sys
        .enumerateRow(sectionIndex, rowIndex)
        .filter((s) => !s.skipped && !s.empty && s.label && !s.label.endsWith("-SKIP"))
        .map((s) => {
          const seatNumber = Number((s.label || "").replace(/[^0-9]/g, ""));
          const displayLabel = s.label;
          const fullId = `${sectionSlug}-${rowLabel}${seatNumber}`;
          const seat = {
            fullId,
            displayLabel,
            sectionName: section.name,
            rowLabel,
            seatNumber,
            tier: section.tier || "standard",
            seatIndex: s.seatIndex,
            effectiveIndex: s.effectiveIndex,
          };
          indexMap[fullId] = seat;
          return seat;
        });
      return { rowLabel, seats: rowSeats };
    });
    return {
      name: section.name,
      tier: section.tier || "standard",
      rows,
    };
  });

  const total = mapped.reduce(
    (sum, sec) => sum + sec.rows.reduce((r, row) => r + row.seats.length, 0),
    0
  );

  return { sections: mapped, indexMap, total, version: 1 };
}

export function countSeats(seatMap) {
  if (!seatMap?.sections?.length) return 0;
  return seatMap.sections.reduce(
    (sum, sec) => sum + sec.rows.reduce((r, row) => r + row.seats.length, 0),
    0
  );
}

export function resolveSeatId(seatMap, inputId) {
  if (!seatMap?.indexMap) return null;
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
