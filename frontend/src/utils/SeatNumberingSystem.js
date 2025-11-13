export class SeatNumberingSystem {
  constructor(layoutConfig) {
    this.sections = layoutConfig?.sections || [];
    this.globalAisles = layoutConfig?.globalAisles || [];
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
    const meta = this.getSectionMeta(sectionIndex);
    if (!meta) {
      return "";
    }

    const startRow = meta.startRow || "A";
    const startCode = startRow.charCodeAt(startRow.length - 1) - 65;
    const totalIndex = startCode + rowIndex;

    if (totalIndex < 26) {
      return String.fromCharCode(65 + totalIndex);
    }

    const first = Math.floor(totalIndex / 26) - 1;
    const second = totalIndex % 26;
    return String.fromCharCode(65 + first) + String.fromCharCode(65 + second);
  }

  getRowOverride(sectionIndex, rowLabel) {
    const section = this.sections[sectionIndex];
    if (!section?.rowsConfig) {
      return null;
    }

    return (
      section.rowsConfig.find((config) => config.rowLabel === rowLabel) || null
    );
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

    if (
      seatIndex < paddingStart ||
      seatIndex >= meta.seatsPerRow - paddingEnd
    ) {
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

  enumerateRow(sectionIndex, rowIndex) {
    const meta = this.getSectionMeta(sectionIndex);
    if (!meta) {
      return [];
    }

    const rowLabel = this.computeRowLabel(sectionIndex, rowIndex);
    const seats = [];
    let effectiveIndex = 0;

    for (let seatIndex = 0; seatIndex < meta.seatsPerRow; seatIndex++) {
      const skipped = this.shouldSkipIndex(sectionIndex, rowIndex, seatIndex);
      const empty = this.isSeatEmpty(sectionIndex, rowIndex, seatIndex);
      const label = this.computeSeatLabel(sectionIndex, rowIndex, seatIndex);

      seats.push({
        seatIndex,
        label: label || `${rowLabel}-SKIP`,
        skipped,
        empty,
        effectiveIndex: skipped || empty ? null : effectiveIndex,
      });

      if (!skipped && !empty) {
        effectiveIndex++;
      }
    }

    return seats;
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
            errors.push(
              `Section ${idx}, Aisle ${aidx}: vertical must use afterSeat`
            );
          }
          if (aisle.type === "horizontal" && aisle.mode !== "afterRow") {
            errors.push(
              `Section ${idx}, Aisle ${aidx}: horizontal must use afterRow`
            );
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
