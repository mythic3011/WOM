import { Venue, Performance } from "../models/index.js";
import { ValidationError } from "../utils/errors.js";
import { Op } from "sequelize";

export const getAllVenues = async (filters = {}) => {
  const where = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${filters.search}%` } },
      { address: { [Op.iLike]: `%${filters.search}%` } },
    ];
  }

  const venues = await Venue.findAll({
    where,
    order: [["name", "ASC"]],
  });

  return venues;
};

export const getVenueById = async (id) => {
  const venue = await Venue.findByPk(id, {
    include: [
      {
        model: Performance,
        as: "performances",
        attributes: ["id", "title", "date", "status"],
      },
    ],
  });

  if (!venue) {
    throw new Error("Venue not found");
  }

  return venue;
};

export const createVenue = async (venueData) => {
  if (venueData.layout) {
    const semantic = validateLayoutSemantics(venueData.layout, venueData.capacity);
    if (!semantic.valid) {
      throw new ValidationError(
        "Semantic validation failed",
        semantic.errors,
        "VENUE_LAYOUT_INVALID"
      );
    }
  }
  const venue = await Venue.create(venueData);
  return venue;
};

export const updateVenue = async (id, updates) => {
  const venue = await Venue.findByPk(id);

  if (!venue) {
    throw new Error("Venue not found");
  }

  if (updates.layout) {
    const semantic = validateLayoutSemantics(
      updates.layout,
      updates.capacity ?? venue.capacity
    );
    if (!semantic.valid) {
      throw new ValidationError(
        "Semantic validation failed",
        semantic.errors,
        "VENUE_LAYOUT_INVALID"
      );
    }
  }
  await venue.update(updates);

  return venue;
};

export const deleteVenue = async (id) => {
  const venue = await Venue.findByPk(id);

  if (!venue) {
    throw new Error("Venue not found");
  }

  const performanceCount = await Performance.count({
    where: { venueId: id },
  });

  if (performanceCount > 0) {
    throw new Error("Cannot delete venue with associated performances");
  }

  await venue.destroy();

  return true;
};

function validateLayoutSemantics(layout, capacity) {
  const errors = [];
  const warnings = [];
  if (!layout || !Array.isArray(layout.sections)) {
    return { valid: true, errors, warnings, metrics: { derivedCapacity: 0 } };
  }
  let derivedCapacity = 0;
  layout.sections.forEach((section, sIdx) => {
    const aisles = section.aisles || [];
    const rows = section.rows;
    const seatsPerRow = section.seatsPerRow;
    // aisle position bounds
    aisles.forEach((a, aIdx) => {
      if (a.mode === "afterSeat" && a.position >= seatsPerRow) {
        errors.push({
          field: `layout.sections[${sIdx}].aisles[${aIdx}].position`,
          code: "AISLE_POSITION_OUT_OF_RANGE",
          message: "Aisle position must be less than seatsPerRow",
          hint: "Use position < seatsPerRow for afterSeat",
          value: a.position,
          context: { seatsPerRow },
        });
      }
      if (a.mode === "afterRow" && a.position >= rows) {
        errors.push({
          field: `layout.sections[${sIdx}].aisles[${aIdx}].position`,
          code: "AISLE_POSITION_OUT_OF_RANGE",
          message: "Aisle position must be less than rows",
          hint: "Use position < rows for afterRow",
          value: a.position,
          context: { rows },
        });
      }
    });
    // duplicate aisle slot check
    const slotKeys = new Set();
    aisles.forEach((a, aIdx) => {
      const key = `${a.mode}:${a.position}`;
      if (slotKeys.has(key)) {
        errors.push({
          field: `layout.sections[${sIdx}].aisles[${aIdx}].position`,
          code: "AISLE_DUPLICATE_SLOT",
          message: "Duplicate aisle slot in section",
          hint: "Remove or adjust duplicate aisle position",
          value: a.position,
        });
      } else {
        slotKeys.add(key);
      }
    });
    // rowsConfig basics
    const rowsConfig = section.rowsConfig || [];
    const rowLabelsUsed = new Set();
    const seatsPerRowIndices = Array.from({ length: seatsPerRow }, (_, i) => i);
    const hasOverride = new Set();
    rowsConfig.forEach((rc, rIdx) => {
      if (rowLabelsUsed.has(rc.rowLabel)) {
        errors.push({
          field: `layout.sections[${sIdx}].rowsConfig[${rIdx}].rowLabel`,
          code: "ROW_OVERRIDE_DUPLICATED",
          message: "Row override duplicated",
          hint: "Remove duplicate rowsConfig entry",
          value: rc.rowLabel,
        });
      } else {
        rowLabelsUsed.add(rc.rowLabel);
      }
      if (Array.isArray(rc.skipSeatIndices) && Array.isArray(rc.emptySeatIndices)) {
        const overlap = rc.skipSeatIndices.filter((i) =>
          rc.emptySeatIndices.includes(i)
        );
        if (overlap.length) {
          errors.push({
            field: `layout.sections[${sIdx}].rowsConfig[${rIdx}]`,
            code: "ROW_SKIP_EMPTY_CONFLICT",
            message: "skipSeatIndices and emptySeatIndices overlap",
            hint: "Remove indices from one list",
            value: overlap,
          });
        }
      }
      if (Array.isArray(rc.skipSeatIndices)) {
        const out = rc.skipSeatIndices.filter((i) => i < 0 || i >= seatsPerRow);
        if (out.length) {
          errors.push({
            field: `layout.sections[${sIdx}].rowsConfig[${rIdx}].skipSeatIndices`,
            code: "SKIP_INDEX_OUT_OF_RANGE",
            message: "Skip seat indices out of range",
            hint: "Each index must be between 0 and seatsPerRow-1",
            value: out,
            context: { seatsPerRow },
          });
        }
      }
      if (Array.isArray(rc.emptySeatIndices)) {
        const out = rc.emptySeatIndices.filter((i) => i < 0 || i >= seatsPerRow);
        if (out.length) {
          errors.push({
            field: `layout.sections[${sIdx}].rowsConfig[${rIdx}].emptySeatIndices`,
            code: "EMPTY_INDEX_OUT_OF_RANGE",
            message: "Empty seat indices out of range",
            hint: "Each index must be between 0 and seatsPerRow-1",
            value: out,
            context: { seatsPerRow },
          });
        }
      }
      hasOverride.add(rc.rowLabel);
    });

    // derive capacity per row
    for (let r = 0; r < rows; r++) {
      const label = deriveRowLabel(section.startRow || "A", r);
      const override = hasOverride.has(label)
        ? rowsConfig.find((x) => x.rowLabel === label)
        : null;
      const skipIdx = new Set(override?.skipSeatIndices || []);
      const emptyIdx = new Set(override?.emptySeatIndices || []);
      let effectiveInRow = 0;
      seatsPerRowIndices.forEach((i) => {
        const empty = emptyIdx.has(i);
        const skipped = skipIdx.has(i);
        if (!empty && !skipped) effectiveInRow += 1;
      });
      if (effectiveInRow === 0 && (skipIdx.size > 0 || emptyIdx.size > 0)) {
        warnings.push({
          field: `layout.sections[${sIdx}]`,
          code: "ROW_EFFECTIVELY_EMPTY",
          message: `Row ${label} has no effective seats`,
        });
      }
      derivedCapacity += effectiveInRow;
    }
  });
  if (typeof capacity === "number" && capacity < derivedCapacity) {
    errors.push({
      field: `capacity`,
      code: "CAPACITY_MISMATCH",
      message: "Capacity is less than derived effective seats",
      hint: "Increase capacity or adjust layout to reduce effective seats",
      context: { capacity, derivedCapacity },
    });
  }
  return { valid: errors.length === 0, errors, warnings, metrics: { derivedCapacity } };
}

function deriveRowLabel(startRow, offset) {
  const base = (startRow || "A").toUpperCase();
  // supports 1-3 letters base, then increments like Excel columns
  const toNumber = (str) =>
    str.split("").reduce((acc, c) => acc * 26 + (c.charCodeAt(0) - 64), 0);
  const toLetters = (num) => {
    let n = num;
    let res = "";
    while (n > 0) {
      const rem = (n - 1) % 26;
      res = String.fromCharCode(65 + rem) + res;
      n = Math.floor((n - 1) / 26);
    }
    return res;
  };
  const startNum = toNumber(base);
  return toLetters(startNum + offset);
}

export { validateLayoutSemantics };
