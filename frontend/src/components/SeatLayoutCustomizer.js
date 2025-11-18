import { SeatMap } from "@components/SeatMap.js";

export const SeatLayoutCustomizer = {
  createDialog(currentLayout) {
    const rows = currentLayout?.rows || 5;
    const seatsPerRow = currentLayout?.seatsPerRow || 8;

    return `
      <div class="text-left p-4">
        <div class="grid grid-cols-2 gap-6 mb-6">
          <div class="bg-gray-50 p-4 rounded-lg">
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              <i class="fas fa-arrows-alt-v text-indigo-600 mr-1"></i>Number of Rows
            </label>
            <div class="flex items-center gap-2">
              <button type="button" id="decrease-rows" class="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors">
                <i class="fas fa-minus"></i>
              </button>
              <input type="number" id="swal-rows" class="swal2-input flex-1 text-center" value="${rows}" min="1" max="20" style="margin: 0; padding: 8px;">
              <button type="button" id="increase-rows" class="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors">
                <i class="fas fa-plus"></i>
              </button>
            </div>
            <input type="range" id="rows-slider" min="1" max="20" value="${rows}" class="w-full mt-2">
            <p class="text-xs text-gray-500 mt-1">Min: 1, Max: 20</p>
          </div>

          <div class="bg-gray-50 p-4 rounded-lg">
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              <i class="fas fa-arrows-alt-h text-indigo-600 mr-1"></i>Seats Per Row
            </label>
            <div class="flex items-center gap-2">
              <button type="button" id="decrease-seats" class="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors">
                <i class="fas fa-minus"></i>
              </button>
              <input type="number" id="swal-seatsPerRow" class="swal2-input flex-1 text-center" value="${seatsPerRow}" min="1" max="30" style="margin: 0; padding: 8px;">
              <button type="button" id="increase-seats" class="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors">
                <i class="fas fa-plus"></i>
              </button>
            </div>
            <input type="range" id="seats-slider" min="1" max="30" value="${seatsPerRow}" class="w-full mt-2">
            <p class="text-xs text-gray-500 mt-1">Min: 1, Max: 30</p>
          </div>
        </div>

        <div class="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4 mb-4">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-semibold text-gray-800">
              <i class="fas fa-eye text-indigo-600 mr-1"></i>Live Preview
            </h4>
            <div class="text-sm">
              <span class="font-semibold text-indigo-600" id="preview-total">${rows * seatsPerRow
      }</span>
              <span class="text-gray-600"> seats</span>
            </div>
          </div>
          <div id="preview-container" class="flex justify-center overflow-auto" style="max-height: 300px;">
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3 text-center">
          <div class="bg-blue-50 p-3 rounded-lg">
            <div class="text-xs text-gray-600 mb-1">Rows</div>
            <div class="text-xl font-bold text-blue-600" id="display-rows">${rows}</div>
          </div>
          <div class="bg-green-50 p-3 rounded-lg">
            <div class="text-xs text-gray-600 mb-1">Per Row</div>
            <div class="text-xl font-bold text-green-600" id="display-seats">${seatsPerRow}</div>
          </div>
          <div class="bg-purple-50 p-3 rounded-lg">
            <div class="text-xs text-gray-600 mb-1">Total</div>
            <div class="text-xl font-bold text-purple-600" id="display-total">${rows * seatsPerRow
      }</div>
          </div>
        </div>

        <div class="mt-4 flex gap-2">
          <button type="button" id="preset-small" class="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-xs transition-colors">
            <i class="fas fa-compress-alt mr-1"></i>Small (4x6)
          </button>
          <button type="button" id="preset-medium" class="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-xs transition-colors">
            <i class="fas fa-th mr-1"></i>Medium (5x8)
          </button>
          <button type="button" id="preset-large" class="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-xs transition-colors">
            <i class="fas fa-expand-alt mr-1"></i>Large (8x12)
          </button>
        </div>
      </div>
    `;
  },

  setupEventHandlers() {
    const updatePreview = () => {
      const rows = parseInt($("#swal-rows").val()) || 5;
      const seats = parseInt($("#swal-seatsPerRow").val()) || 8;
      const total = rows * seats;

      $("#preview-container").html(SeatMap.generateSimplePreview(rows, seats));
      $("#preview-total").text(total);
      $("#display-rows").text(rows);
      $("#display-seats").text(seats);
      $("#display-total").text(total);
    };

    $("#swal-rows").on("input", (e) => {
      $("#rows-slider").val($(e.target).val());
      updatePreview();
    });

    $("#swal-seatsPerRow").on("input", (e) => {
      $("#seats-slider").val($(e.target).val());
      updatePreview();
    });

    $("#rows-slider").on("input", (e) => {
      $("#swal-rows").val($(e.target).val());
      updatePreview();
    });

    $("#seats-slider").on("input", (e) => {
      $("#swal-seatsPerRow").val($(e.target).val());
      updatePreview();
    });

    $("#decrease-rows").on("click", () => {
      const $input = $("#swal-rows");
      const current = parseInt($input.val());
      if (current > 1) {
        $input.val(current - 1);
        $("#rows-slider").val(current - 1);
        updatePreview();
      }
    });

    $("#increase-rows").on("click", () => {
      const $input = $("#swal-rows");
      const current = parseInt($input.val());
      if (current < 20) {
        $input.val(current + 1);
        $("#rows-slider").val(current + 1);
        updatePreview();
      }
    });

    $("#decrease-seats").on("click", () => {
      const $input = $("#swal-seatsPerRow");
      const current = parseInt($input.val());
      if (current > 1) {
        $input.val(current - 1);
        $("#seats-slider").val(current - 1);
        updatePreview();
      }
    });

    $("#increase-seats").on("click", () => {
      const $input = $("#swal-seatsPerRow");
      const current = parseInt($input.val());
      if (current < 30) {
        $input.val(current + 1);
        $("#seats-slider").val(current + 1);
        updatePreview();
      }
    });

    $("#preset-small").on("click", () => {
      $("#swal-rows").val(4);
      $("#swal-seatsPerRow").val(6);
      $("#rows-slider").val(4);
      $("#seats-slider").val(6);
      updatePreview();
    });

    $("#preset-medium").on("click", () => {
      $("#swal-rows").val(5);
      $("#swal-seatsPerRow").val(8);
      $("#rows-slider").val(5);
      $("#seats-slider").val(8);
      updatePreview();
    });

    $("#preset-large").on("click", () => {
      $("#swal-rows").val(8);
      $("#swal-seatsPerRow").val(12);
      $("#rows-slider").val(8);
      $("#seats-slider").val(12);
      updatePreview();
    });

    updatePreview();
  },

  validateAndGetValues() {
    const rows = parseInt($("#swal-rows").val());
    const seatsPerRow = parseInt($("#swal-seatsPerRow").val());

    if (!rows || rows < 1 || rows > 20) {
      return { valid: false, message: "Rows must be between 1 and 20" };
    }
    if (!seatsPerRow || seatsPerRow < 1 || seatsPerRow > 30) {
      return {
        valid: false,
        message: "Seats per row must be between 1 and 30",
      };
    }

    return { valid: true, data: { rows, seatsPerRow } };
  },
};
