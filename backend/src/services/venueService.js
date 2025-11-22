import { Venue, Performance } from "#models/index.js";
import { ValidationError } from "#utils/errors.js";
import { toNumber, toLetters } from "#utils/venueUtils.js";
import { buildWhereClause } from "./helpers/filters.js";
import { findEntityOrThrow, checkRelatedEntitiesCount } from "./helpers/entityHelpers.js";

const validationCache = new Map();
const VALIDATION_CACHE_MAX = 50;

export const getAllVenues = async (filters = {}) => {
  const where = buildWhereClause(filters, {
    statusField: "status",
    searchFields: ["name", "address"],
  });

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
  const venue = await findEntityOrThrow(Venue, id, "Venue not found");

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
  const venue = await findEntityOrThrow(Venue, id, "Venue not found");

  // Check for linked performances before deletion
  const performanceCount = await Performance.count({ where: { venueId: id } });

  if (performanceCount > 0) {
    throw new Error(
      `Cannot delete venue with ${performanceCount} linked performance${performanceCount > 1 ? 's' : ''}. ` +
      `Please delete or reassign the performances first.`
    );
  }

  await venue.destroy();

  return true;
};

function validateLayoutSemantics(layout, capacity) {
  const cacheKey = JSON.stringify({ layout, capacity });
  const cached = validationCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const errors = [];
  const warnings = [];
  if (!layout || !Array.isArray(layout.sections)) {
    const result = { valid: true, errors, warnings, metrics: { derivedCapacity: 0 } };
    return result;
  }
  let derivedCapacity = 0;
  layout.sections.forEach((section, sIdx) => {
    const aisles = section.aisles || [];
    const rows = section.rows;
    const seatsPerRow = section.seatsPerRow;

    // Validate horizontal aisles
    const horizontalAisles = section.horizontalAisles || [];
    horizontalAisles.forEach((aisle, aIdx) => {
      if (!aisle.afterRow || typeof aisle.afterRow !== 'string') {
        errors.push({
          field: `layout.sections[${sIdx}].horizontalAisles[${aIdx}].afterRow`,
          code: "HORIZONTAL_AISLE_MISSING_AFTER_ROW",
          message: "Horizontal aisle must specify afterRow",
          hint: "Provide a row label (e.g., 'A', 'B', 'C')",
        });
      }
      if (aisle.height !== undefined && (typeof aisle.height !== 'number' || aisle.height < 1)) {
        errors.push({
          field: `layout.sections[${sIdx}].horizontalAisles[${aIdx}].height`,
          code: "HORIZONTAL_AISLE_INVALID_HEIGHT",
          message: "Horizontal aisle height must be a positive number",
          hint: "Use height >= 1",
          value: aisle.height,
        });
      }
    });

    // Validate seat numbering configuration
    const seatNumbering = section.seatNumbering || {};
    if (seatNumbering.globalDirection && !['ltr', 'rtl'].includes(seatNumbering.globalDirection)) {
      errors.push({
        field: `layout.sections[${sIdx}].seatNumbering.globalDirection`,
        code: "INVALID_GLOBAL_DIRECTION",
        message: "Global direction must be 'ltr' or 'rtl'",
        value: seatNumbering.globalDirection,
      });
    }
    if (seatNumbering.startNumber !== undefined && (typeof seatNumbering.startNumber !== 'number' || seatNumbering.startNumber < 1)) {
      errors.push({
        field: `layout.sections[${sIdx}].seatNumbering.startNumber`,
        code: "INVALID_START_NUMBER",
        message: "Start number must be a positive integer",
        value: seatNumbering.startNumber,
      });
    }
    if (seatNumbering.skipNumbers && !Array.isArray(seatNumbering.skipNumbers)) {
      errors.push({
        field: `layout.sections[${sIdx}].seatNumbering.skipNumbers`,
        code: "INVALID_SKIP_NUMBERS",
        message: "Skip numbers must be an array",
        value: seatNumbering.skipNumbers,
      });
    }
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

      // Validate row direction
      if (rc.direction && !['ltr', 'rtl'].includes(rc.direction)) {
        errors.push({
          field: `layout.sections[${sIdx}].rowsConfig[${rIdx}].direction`,
          code: "INVALID_ROW_DIRECTION",
          message: "Row direction must be 'ltr' or 'rtl'",
          value: rc.direction,
        });
      }

      // Validate pattern string
      if (rc.pattern && typeof rc.pattern === 'string') {
        if (!/^[SHE]+$/.test(rc.pattern)) {
          errors.push({
            field: `layout.sections[${sIdx}].rowsConfig[${rIdx}].pattern`,
            code: "INVALID_PATTERN",
            message: "Pattern must contain only S, H, or E characters",
            hint: "S = seat, H = gap, E = empty",
            value: rc.pattern,
          });
        }
      }

      // Validate seat shapes
      if (rc.seatShapes && Array.isArray(rc.seatShapes)) {
        rc.seatShapes.forEach((shape, shapeIdx) => {
          const validShapes = ['standard', 'wide', 'accessible', 'loveseat', 'table'];
          if (shape.shape && !validShapes.includes(shape.shape)) {
            errors.push({
              field: `layout.sections[${sIdx}].rowsConfig[${rIdx}].seatShapes[${shapeIdx}].shape`,
              code: "INVALID_SEAT_SHAPE",
              message: "Invalid seat shape type",
              hint: `Must be one of: ${validShapes.join(', ')}`,
              value: shape.shape,
            });
          }
          if (shape.width !== undefined && (typeof shape.width !== 'number' || shape.width <= 0)) {
            errors.push({
              field: `layout.sections[${sIdx}].rowsConfig[${rIdx}].seatShapes[${shapeIdx}].width`,
              code: "INVALID_SEAT_WIDTH",
              message: "Seat width must be a positive number",
              value: shape.width,
            });
          }
        });
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

    const overrideMap = new Map();
    rowsConfig.forEach((rc) => {
      overrideMap.set(rc.rowLabel, rc);
    });

    for (let r = 0; r < rows; r++) {
      const label = deriveRowLabel(section.startRow || "A", r);
      const override = overrideMap.get(label);
      const skipIdx = override?.skipSeatIndices || [];
      const emptyIdx = override?.emptySeatIndices || [];
      const skipSet = skipIdx.length > 0 ? new Set(skipIdx) : null;
      const emptySet = emptyIdx.length > 0 ? new Set(emptyIdx) : null;

      let effectiveInRow = seatsPerRow;
      if (skipSet || emptySet) {
        effectiveInRow = 0;
        for (let i = 0; i < seatsPerRow; i++) {
          const empty = emptySet && emptySet.has(i);
          const skipped = skipSet && skipSet.has(i);
          if (!empty && !skipped) { effectiveInRow += 1; }
        }
      }

      if (effectiveInRow === 0 && (skipIdx.length > 0 || emptyIdx.length > 0)) {
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

  const result = { valid: errors.length === 0, errors, warnings, metrics: { derivedCapacity } };

  if (validationCache.size >= VALIDATION_CACHE_MAX) {
    const firstKey = validationCache.keys().next().value;
    validationCache.delete(firstKey);
  }
  validationCache.set(cacheKey, result);

  return result;
}

const rowLabelCache = new Map();

function deriveRowLabel(startRow, offset) {
  const cacheKey = `${startRow}-${offset}`;
  const cached = rowLabelCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const base = (startRow || "A").toUpperCase();
  const startNum = toNumber(base);
  const result = toLetters(startNum + offset);

  if (rowLabelCache.size < 1000) {
    rowLabelCache.set(cacheKey, result);
  }

  return result;
}

export const getVenuePreview = async (id) => {
  const venue = await findEntityOrThrow(Venue, id, "Venue not found");

  // Import buildSeatMapFromVenueLayout
  const { buildSeatMapFromVenueLayout } = await import("#utils/seatMapBuilder.js");

  // Generate seat map from venue layout
  const seatMap = buildSeatMapFromVenueLayout(venue.layout || {});

  return {
    venueId: venue.id,
    venueName: venue.name,
    layout: venue.layout,
    seatMap: {
      sections: seatMap.sections,
      total: seatMap.total,
      version: seatMap.version,
    },
    // Include seat positions and labels for preview rendering
    seats: Object.values(seatMap.indexMap || {}).map(seat => ({
      id: seat.fullId,
      label: seat.displayLabel,
      section: seat.sectionName,
      row: seat.rowLabel,
      seatNumber: seat.seatNumber,
      tier: seat.tier,
      position: seat.position,
    })),
  };
};

export { validateLayoutSemantics };
