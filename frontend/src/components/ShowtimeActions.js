export const ShowtimeActions = {
  createActionButtons(showtimeIndex) {
    return `
      <div class="flex gap-2 flex-wrap">
        <button type="button" class="auto-populate-btn text-xs px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors" data-showtime="${showtimeIndex}" title="Auto-populate from venue">
          <i class="fas fa-magic mr-1"></i>Auto-fill
        </button>
        <button type="button" class="load-template-btn text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors" data-showtime="${showtimeIndex}" title="Load from template">
          <i class="fas fa-folder-open mr-1"></i>Load
        </button>
        <button type="button" class="save-template-btn text-xs px-3 py-1 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors" data-showtime="${showtimeIndex}" title="Save as template">
          <i class="fas fa-save mr-1"></i>Save
        </button>
        <button type="button" class="manage-zones-btn text-xs px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors" data-showtime="${showtimeIndex}" title="Manage pricing zones">
          <i class="fas fa-layer-group mr-1"></i>Zones
        </button>
        <button type="button" class="edit-seats-btn text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors" data-showtime="${showtimeIndex}" title="Edit individual seats">
          <i class="fas fa-edit mr-1"></i>Edit Seats
        </button>
        <button type="button" class="customize-layout-btn text-xs px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors" data-showtime="${showtimeIndex}" title="Customize seat layout">
          <i class="fas fa-cog mr-1"></i>Layout
        </button>
      </div>
    `;
  },

  createSeatPlanPreview(showtimeIndex, seatPlanSVG) {
    return `
      <div class="mb-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
        <div class="flex justify-between items-start mb-3">
          <div>
            <h5 class="text-sm font-semibold text-gray-900 mb-1">Seat Layout Preview</h5>
            <p class="text-xs text-gray-600">Visual representation of the seating arrangement</p>
          </div>
          ${this.createActionButtons(showtimeIndex)}
        </div>
        <div id="seatPlan_${showtimeIndex}" class="flex justify-center">
          ${seatPlanSVG}
        </div>
      </div>
    `;
  },

  createShowtimeHeader(index) {
    return `
      <div class="flex justify-between items-center mb-4">
        <h4 class="font-semibold text-gray-900">Showtime ${index + 1}</h4>
        <button type="button" class="remove-showtime text-red-600 hover:text-red-800 transition-colors" data-index="${index}" title="Remove this showtime">
          <i class="fas fa-trash mr-1"></i> Remove
        </button>
      </div>
    `;
  },

  createDateTimeVenueFields(showtime, venues, index) {
    const dateTimeValue = showtime.dateTime
      ? new Date(showtime.dateTime).toISOString().slice(0, 16)
      : "";

    return `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-xs text-gray-600 mb-1">
            <i class="fas fa-calendar-alt mr-1"></i>Date & Time
          </label>
          <input type="datetime-local" class="showtime-datetime w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black" value="${dateTimeValue}" />
        </div>
        <div>
          <label class="block text-xs text-gray-600 mb-1">
            <i class="fas fa-map-marker-alt mr-1"></i>Venue
          </label>
          <select class="showtime-venue w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black">
            <option value="">Select venue</option>
            ${venues
        .map(
          (v) =>
            `<option value="${v.id}" ${showtime.venueId == v.id ? "selected" : ""
            }>${v.name}</option>`
        )
        .join("")}
          </select>
        </div>
      </div>
    `;
  },

  createEmptyState() {
    return `
      <div class="text-center py-8 text-gray-500">
        <i class="fas fa-calendar-times text-4xl mb-2"></i>
        <p>No showtimes added yet. Click "Add Showtime" to create one.</p>
      </div>
    `;
  },
};
