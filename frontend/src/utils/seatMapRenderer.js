
import { seatHelpers } from "@services/seatHelpers.js";
import { seatMapGenerator } from "@utils/booking/seatMapGenerator.js";

export function summarizeCapacity(layoutConfig) {
  return seatHelpers.calculateCapacityBySections(layoutConfig);
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
