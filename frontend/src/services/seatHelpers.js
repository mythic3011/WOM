import { SeatNumberingSystem } from "@utils/SeatNumberingSystem.js";

export const seatHelpers = {
  calculateCapacity(layoutConfig) {
    if (!layoutConfig?.sections) {return 0;}

    const sys = new SeatNumberingSystem(layoutConfig);
    let total = 0;

    layoutConfig.sections.forEach((section, idx) => {
      total += sys.computeEffectiveCapacity(idx);
    });

    return total;
  },

  calculateCapacityBySections(layoutConfig) {
    if (!layoutConfig?.sections) {return { totalCapacity: 0, sections: [] };}

    const sys = new SeatNumberingSystem(layoutConfig);
    let total = 0;
    const sections = layoutConfig.sections.map((s, idx) => {
      const cap = sys.computeEffectiveCapacity(idx);
      total += cap;
      return { name: s.name, index: idx, capacity: cap };
    });

    return { totalCapacity: total, sections };
  },

  isAvailable(seat) {
    return seat && seat.status === "available";
  },

  canSelect(seat, maxSelection, currentSelection) {
    if (!this.isAvailable(seat)) {return false;}
    if (!maxSelection) {return true;}
    return currentSelection.length < maxSelection;
  },
};
