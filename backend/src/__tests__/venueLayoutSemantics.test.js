import { describe, it, expect } from "@jest/globals";
import { validateLayoutSemantics } from "../services/venueService.js";

function baseLayout() {
  return {
    sections: [
      {
        id: "S1",
        name: "Main",
        startRow: "A",
        rows: 2,
        seatsPerRow: 5,
        aisles: [{ mode: "afterSeat", position: 2, label: "A1" }],
        rowsConfig: [],
      },
    ],
  };
}

describe("validateLayoutSemantics", () => {
  it("passes with consistent layout and capacity", () => {
    const layout = baseLayout();
    const result = validateLayoutSemantics(layout, 10);
    expect(result.valid).toBe(true);
    expect(result.metrics.derivedCapacity).toBe(10);
    expect(result.errors).toHaveLength(0);
  });

  it("fails when capacity is lower than derived capacity", () => {
    const layout = baseLayout();
    const result = validateLayoutSemantics(layout, 9);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "CAPACITY_MISMATCH")).toBe(true);
  });

  it("fails on aisle position out of range (afterSeat)", () => {
    const layout = baseLayout();
    layout.sections[0].aisles = [{ mode: "afterSeat", position: 5 }];
    const result = validateLayoutSemantics(layout, 10);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "AISLE_POSITION_OUT_OF_RANGE")).toBe(
      true
    );
  });

  it("fails on duplicate aisle slot", () => {
    const layout = baseLayout();
    layout.sections[0].aisles = [
      { mode: "afterSeat", position: 2 },
      { mode: "afterSeat", position: 2 },
    ];
    const result = validateLayoutSemantics(layout, 10);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "AISLE_DUPLICATE_SLOT")).toBe(true);
  });

  it("fails on skipSeatIndices out of range", () => {
    const layout = baseLayout();
    layout.sections[0].rowsConfig = [{ rowLabel: "A", skipSeatIndices: [5] }];
    const result = validateLayoutSemantics(layout, 10);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "SKIP_INDEX_OUT_OF_RANGE")).toBe(true);
  });

  it("fails when skipSeatIndices and emptySeatIndices overlap", () => {
    const layout = baseLayout();
    layout.sections[0].rowsConfig = [
      { rowLabel: "A", skipSeatIndices: [3], emptySeatIndices: [3] },
    ];
    const result = validateLayoutSemantics(layout, 10);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "ROW_SKIP_EMPTY_CONFLICT")).toBe(true);
  });

  it("warns on effectively empty row by per-row override", () => {
    const layout = baseLayout();
    layout.sections[0].rowsConfig = [
      { rowLabel: "A", skipSeatIndices: [0, 1, 2, 3, 4] },
    ];
    const result = validateLayoutSemantics(layout, 10);
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.code === "ROW_EFFECTIVELY_EMPTY")).toBe(true);
  });
});
