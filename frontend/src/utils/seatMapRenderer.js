import { SeatNumberingSystem } from "/src/utils/SeatNumberingSystem.js";
import { seatMapGenerator } from "/src/utils/booking/seatMapGenerator.js";

export function summarizeCapacity(layoutConfig) {
  const sys = new SeatNumberingSystem(layoutConfig);
  let total = 0;
  const sections = (layoutConfig?.sections || []).map((s, idx) => {
    const cap = sys.computeEffectiveCapacity(idx);
    total += cap;
    return { name: s.name, index: idx, capacity: cap };
  });
  return { totalCapacity: total, sections };
}

export function renderPreview(
  layoutConfig,
  seatDetails = {},
  selectedSeats = []
) {
  if (!layoutConfig?.sections?.length) {
    return seatMapGenerator.generatePreviewSVG(5, 8, seatDetails);
  }
  return seatMapGenerator.generateFromLayout(
    layoutConfig,
    seatDetails,
    selectedSeats,
    false
  );
}

export function renderInteractive(
  layoutConfig,
  seatDetails = {},
  selectedSeats = []
) {
  if (!layoutConfig?.sections?.length) {
    return seatMapGenerator.generateInteractiveSeatMap(
      5,
      8,
      seatDetails,
      selectedSeats
    );
  }
  return seatMapGenerator.generateFromLayout(
    layoutConfig,
    seatDetails,
    selectedSeats,
    true
  );
}
