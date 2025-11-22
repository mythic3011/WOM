export class SeatNumberingSystem {
  constructor(layoutConfig) {
    this.sections = layoutConfig?.sections || [];
    this.globalAisles = layoutConfig?.globalAisles || [];
    this.rowCache = new Map();
    this.labelCache = new Map();
  }

  configure(sectionConfig) {
    this.sections = sectionConfig?.sections || [];
    this.globalAisles = sectionConfig?.globalAisles || [];
    return this;
  }

  getSectionMeta(sectionIndex) {
    const section = this.sections[sectionIndex];
    if (!section) {
      return null;
    }

    return {
      rows: section.rows,
      seatsPerRow: section.seatsPerRow,
      startRow: section.startRow || "A",
      seatNumbering: section.seatNumbering || {
        globalDirection: "L_TO_R",
        startNumber: 1,
        prefix: "",
        suffix: "",
        skipNumbers: [],
        skipSeatIndices: [],
      },
    };
  }

  computeRowLabel(sectionIndex, rowIndex) {
    const cacheKey = `${sectionIndex}-${rowIndex}`;
    const cached = this.labelCache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const meta = this.getSectionMeta(sectionIndex);
    if (!meta) {
      return "";
    }

    const startRow = meta.startRow || "A";
    const startCode = startRow.charCodeAt(startRow.length - 1) - 65;
    const totalIndex = startCode + rowIndex;

    let result;
    if (totalIndex < 26) {
      result = String.fromCharCode(65 + totalIndex);
    } else {
      const first = Math.floor(totalIndex / 26) - 1;
      const second = totalIndex % 26;
      result = String.fromCharCode(65 + first) + String.fromCharCode(65 + second);
    }

    this.labelCache.set(cacheKey, result);
    return result;
  }

  getRowOverride(sectionIndex, rowLabel) {
    const section = this.sections[sectionIndex];
    if (!section?.rowsConfig) {
      return null;
    }

    return section.rowsConfig.find((config) => config.rowLabel === rowLabel) || null;
  }

  computeSeatLabel(sectionIndex, rowIndex, seatIndex) {
    const meta = this.getSectionMeta(sectionIndex);
    if (!meta) {
      return "";
    }

    const rowLabel = this.computeRowLabel(sectionIndex, rowIndex);
    const override = this.getRowOverride(sectionIndex, rowLabel);
    const config = override || meta.seatNumbering;

    const direction = config.direction || config.globalDirection || "L_TO_R";
    const startNumber = config.startNumber || 1;
    const prefix = config.prefix || "";
    const suffix = config.suffix || "";
    const skipNumbers = config.skipNumbers || [];
    const skipSeatIndices = config.skipSeatIndices || [];

    if (skipSeatIndices.includes(seatIndex)) {
      return "";
    }

    const paddingStart = override?.paddingStart || 0;
    const paddingEnd = override?.paddingEnd || 0;

    if (seatIndex < paddingStart || seatIndex >= meta.seatsPerRow - paddingEnd) {
      return "";
    }

    const effectiveIndex =
      direction === "R_TO_L" ? meta.seatsPerRow - 1 - seatIndex : seatIndex;

    let seatNumber = startNumber + effectiveIndex;
    let skipped = 0;

    for (let i = 0; i < effectiveIndex; i++) {
      if (skipSeatIndices.includes(i)) {
        skipped++;
      }
    }

    seatNumber -= skipped;

    for (const skipNum of skipNumbers) {
      if (seatNumber >= skipNum) {
        seatNumber++;
      }
    }

    return `${prefix}${seatNumber}${suffix}`;
  }

  shouldSkipNumber(sectionIndex, rowIndex, seatNumber) {
    const meta = this.getSectionMeta(sectionIndex);
    if (!meta) {
      return false;
    }

    const rowLabel = this.computeRowLabel(sectionIndex, rowIndex);
    const override = this.getRowOverride(sectionIndex, rowLabel);
    const config = override || meta.seatNumbering;

    return (config.skipNumbers || []).includes(seatNumber);
  }

  shouldSkipIndex(sectionIndex, rowIndex, seatIndex) {
    const meta = this.getSectionMeta(sectionIndex);
    if (!meta) {
      return false;
    }

    const rowLabel = this.computeRowLabel(sectionIndex, rowIndex);
    const override = this.getRowOverride(sectionIndex, rowLabel);
    const config = override || meta.seatNumbering;

    return (config.skipSeatIndices || []).includes(seatIndex);
  }

  isSeatEmpty(sectionIndex, rowIndex, seatIndex) {
    const rowLabel = this.computeRowLabel(sectionIndex, rowIndex);
    const override = this.getRowOverride(sectionIndex, rowLabel);

    if (!override?.emptySeatIndices) {
      return false;
    }
    return override.emptySeatIndices.includes(seatIndex);
  }

  /**
   * Parses a pattern string into an array of position types
   * @param {string} pattern - Pattern string using S (seat), H (gap), E (empty)
   * @returns {Array} Array of position objects with type property
   */
  parsePattern(pattern) {
    if (!pattern || typeof pattern !== 'string') {
      return [];
    }

    const positions = [];
    for (let i = 0; i < pattern.length; i++) {
      const char = pattern[i].toUpperCase();

      if (char === 'S') {
        positions.push({ type: 'seat', index: i });
      } else if (char === 'H') {
        positions.push({ type: 'gap', index: i });
      } else if (char === 'E') {
        positions.push({ type: 'empty', index: i });
      } else {
        // Invalid character - treat as empty
        positions.push({ type: 'empty', index: i });
      }
    }

    return positions;
  }

  /**
   * Gets the seat shape configuration for a specific position
   * @param {number} position - Seat position/index in the row
   * @param {Object} rowConfig - Row configuration object
   * @returns {Object} Shape configuration with type, width, and metadata
   */
  getSeatShape(position, rowConfig) {
    // Default shape configuration
    const defaultShape = {
      shape: 'standard',
      width: 1.0,
      metadata: {}
    };

    // If no row config or no seat shapes defined, return default
    if (!rowConfig || !rowConfig.seatShapes || !Array.isArray(rowConfig.seatShapes)) {
      return defaultShape;
    }

    // Find the seat shape configuration that includes this position
    for (const shapeConfig of rowConfig.seatShapes) {
      if (shapeConfig.positions && Array.isArray(shapeConfig.positions)) {
        if (shapeConfig.positions.includes(position)) {
          return {
            shape: shapeConfig.shape || 'standard',
            width: shapeConfig.width || 1.0,
            metadata: shapeConfig.metadata || {}
          };
        }
      }
    }

    // No specific shape found, return default
    return defaultShape;
  }

  enumerateRow(sectionIndex, rowIndex) {
    const cacheKey = `${sectionIndex}-${rowIndex}`;
    const cached = this.rowCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const meta = this.getSectionMeta(sectionIndex);
    if (!meta) {
      return [];
    }

    const rowLabel = this.computeRowLabel(sectionIndex, rowIndex);
    const rowOverride = this.getRowOverride(sectionIndex, rowLabel);
    const seats = [];
    let effectiveIndex = 0;

    // Check if row has a custom pattern
    let positions = [];
    if (rowOverride && rowOverride.pattern) {
      // Use pattern from row override
      positions = this.parsePattern(rowOverride.pattern);
    } else {
      // Generate default pattern (all seats)
      for (let i = 0; i < meta.seatsPerRow; i++) {
        positions.push({ type: 'seat', index: i });
      }
    }

    // Process each position in the pattern
    for (let i = 0; i < positions.length; i++) {
      const position = positions[i];

      if (position.type === 'gap') {
        // Gap position - add as gap marker
        seats.push({
          seatIndex: i,
          label: null,
          skipped: false,
          empty: false,
          gap: true,
          effectiveIndex: null,
          shape: null
        });
      } else if (position.type === 'empty') {
        // Empty position - add as empty marker
        seats.push({
          seatIndex: i,
          label: null,
          skipped: false,
          empty: true,
          gap: false,
          effectiveIndex: null,
          shape: null
        });
      } else {
        // Seat position
        const skipped = this.shouldSkipIndex(sectionIndex, rowIndex, i);
        const empty = this.isSeatEmpty(sectionIndex, rowIndex, i);
        const label = this.computeSeatLabel(sectionIndex, rowIndex, i);

        // Get seat shape configuration
        const shape = this.getSeatShape(i, rowOverride);

        seats.push({
          seatIndex: i,
          label: label || `${rowLabel}-SKIP`,
          skipped,
          empty,
          gap: false,
          effectiveIndex: skipped || empty ? null : effectiveIndex,
          shape: shape
        });

        if (!skipped && !empty) {
          effectiveIndex++;
        }
      }
    }

    this.rowCache.set(cacheKey, seats);
    return seats;
  }

  buildIndexMap(sectionIndex) {
    const meta = this.getSectionMeta(sectionIndex);
    if (!meta) {
      return {};
    }

    const indexMap = {};

    for (let rowIndex = 0; rowIndex < meta.rows; rowIndex++) {
      const rowLabel = this.computeRowLabel(sectionIndex, rowIndex);
      const seats = this.enumerateRow(sectionIndex, rowIndex);

      seats.forEach((seat) => {
        if (!seat.skipped && !seat.empty && seat.label) {
          indexMap[seat.label] = {
            sectionIndex,
            rowIndex,
            seatIndex: seat.seatIndex,
            rowLabel,
          };
        }
      });
    }

    return indexMap;
  }

  computeEffectiveCapacity(sectionIndex) {
    const meta = this.getSectionMeta(sectionIndex);
    if (!meta) {
      return 0;
    }

    let capacity = 0;

    for (let rowIndex = 0; rowIndex < meta.rows; rowIndex++) {
      const seats = this.enumerateRow(sectionIndex, rowIndex);
      capacity += seats.filter((s) => !s.skipped && !s.empty).length;
    }

    return capacity;
  }

  invertDirectionIfNeeded(rowMeta) {
    const direction = rowMeta.direction || "L_TO_R";
    return direction === "R_TO_L" ? "reversed" : "normal";
  }

  exportDebugSnapshot() {
    const snapshot = {
      sections: this.sections.map((section, idx) => ({
        index: idx,
        name: section.name,
        capacity: this.computeEffectiveCapacity(idx),
      })),
      rows: [],
    };

    this.sections.forEach((section, sectionIndex) => {
      for (let rowIndex = 0; rowIndex < section.rows; rowIndex++) {
        const rowLabel = this.computeRowLabel(sectionIndex, rowIndex);
        const seats = this.enumerateRow(sectionIndex, rowIndex);

        snapshot.rows.push({
          sectionIndex,
          rowIndex,
          rowLabel,
          seatCount: seats.filter((s) => !s.skipped && !s.empty).length,
          seats: seats.map((s) => s.label),
        });
      }
    });

    return snapshot;
  }

  validateInternal() {
    const errors = [];

    this.sections.forEach((section, idx) => {
      if (!section.rows || section.rows < 1) {
        errors.push(`Section ${idx}: rows must be >= 1`);
      }
      if (!section.seatsPerRow || section.seatsPerRow < 1) {
        errors.push(`Section ${idx}: seatsPerRow must be >= 1`);
      }

      if (section.aisles) {
        section.aisles.forEach((aisle, aidx) => {
          if (aisle.type === "vertical" && aisle.mode !== "afterSeat") {
            errors.push(`Section ${idx}, Aisle ${aidx}: vertical must use afterSeat`);
          }
          if (aisle.type === "horizontal" && aisle.mode !== "afterRow") {
            errors.push(`Section ${idx}, Aisle ${aidx}: horizontal must use afterRow`);
          }

          const maxPos =
            aisle.mode === "afterSeat" ? section.seatsPerRow : section.rows;
          if (aisle.position >= maxPos) {
            errors.push(
              `Section ${idx}, Aisle ${aidx}: position ${aisle.position} >= ${maxPos}`
            );
          }
        });
      }

      if (section.rowsConfig) {
        section.rowsConfig.forEach((rowConfig, rcidx) => {
          if (rowConfig.skipSeatIndices && rowConfig.emptySeatIndices) {
            const overlap = rowConfig.skipSeatIndices.filter((idx) =>
              rowConfig.emptySeatIndices.includes(idx)
            );
            if (overlap.length > 0) {
              errors.push(
                `Section ${idx}, RowConfig ${rcidx}: skipSeatIndices and emptySeatIndices overlap: ${overlap}`
              );
            }
          }
        });
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
