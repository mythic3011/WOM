import { FormComponents } from "@components/FormComponents.js";

export const SeatSelectionStep = {
  render(zoneSummary, selectedSeats) {
    return `
      <div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <i class="fas fa-info-circle text-indigo-600"></i>
          Instructions
        </h3>

        ${zoneSummary}

        <div class="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <div class="mb-3">
            <h4 class="font-semibold text-indigo-900 mb-2">How to Select Seats:</h4>
            <ol class="list-decimal list-inside space-y-1 text-sm text-indigo-800">
              <li>Click on available seats to select them</li>
              <li>Selected seats will be highlighted</li>
              <li>Click again to deselect</li>
              <li>Review your selection below the map</li>
            </ol>
          </div>
        </div>

        <div id="seatMapContainer" class="mt-6 bg-gray-50 rounded-lg p-4 overflow-hidden">
          <div class="mb-4 flex items-center justify-between">
            <h4 class="font-semibold text-gray-900">Seat Map</h4>
            <div class="flex gap-2">
              <button id="zoomIn" class="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm">
                <i class="fas fa-plus"></i>
              </button>
              <button id="zoomOut" class="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm">
                <i class="fas fa-minus"></i>
              </button>
              <button id="resetZoom" class="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm">
                <i class="fas fa-redo"></i>
              </button>
            </div>
          </div>
          <div id="seatMapSvg" class="min-h-[400px] border border-gray-300 rounded bg-white overflow-auto"></div>
        </div>

        <div class="mt-6 p-4 bg-white border border-gray-200 rounded-lg">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-semibold text-gray-900">Your Selection</h4>
            <div class="text-right">
              <p class="text-xs text-gray-500">Selected</p>
              <p class="text-2xl font-bold text-indigo-600">${selectedSeats.length}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div class="text-center p-2 bg-green-50 rounded">
              <div class="w-6 h-6 bg-green-500 rounded mx-auto mb-1"></div>
              <p class="text-xs">Available</p>
            </div>
            <div class="text-center p-2 bg-indigo-50 rounded">
              <div class="w-6 h-6 bg-indigo-600 rounded mx-auto mb-1"></div>
              <p class="text-xs">Selected</p>
            </div>
            <div class="text-center p-2 bg-red-50 rounded">
              <div class="w-6 h-6 bg-red-500 rounded mx-auto mb-1"></div>
              <p class="text-xs">Occupied</p>
            </div>
            <div class="text-center p-2 bg-gray-50 rounded">
              <div class="w-6 h-6 bg-gray-400 rounded mx-auto mb-1"></div>
              <p class="text-xs">Blocked</p>
            </div>
          </div>

          <div class="bg-gray-50 p-3 rounded">
            <p class="text-xs text-gray-600 mb-1">Selected Seats</p>
            <p class="text-sm font-bold text-indigo-900 min-h-[20px]">
              Click on available seats to select
            </p>
          </div>
        </div>

        <div class="mt-6 flex justify-end">
          ${FormComponents.button({
      id: "continueToTickets",
      text: "Continue to Ticket Selection",
      icon: "fa-arrow-right",
      color: "indigo",
      fullWidth: true,
      disabled: selectedSeats.length === 0,
    })}
        </div>
      </div>
    `;
  },
};
