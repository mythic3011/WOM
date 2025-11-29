import { ImageUploader } from "./common/ImageUploader.js";

export const PerformanceFormSections = {
  basicInformation() {
    return `
      <div class="bg-gray-50 p-6 rounded-lg">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
          <i class="fas fa-info-circle text-indigo-600 mr-2"></i>Basic Information
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="md:col-span-2">
            ${ImageUploader.render({
              id: "performance-image",
              label: "Performance Poster",
              maxSizeMB: 10,
              height: "280px",
              helpText: "PNG, JPG, GIF or WebP. Max 10MB - Recommended size 800x600px",
              dragDropText: "Drag and drop the performance poster here, or click to select",
              showUrlInput: true,
            })}
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Title <span class="text-red-500">*</span>
            </label>
            <input type="text" id="title" required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
              placeholder="Symphony No. 9 - Beethoven" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Composer <span class="text-red-500">*</span>
            </label>
            <input type="text" id="composer" required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
              placeholder="Ludwig van Beethoven" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Conductor <span class="text-red-500">*</span>
            </label>
            <input type="text" id="conductor" required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
              placeholder="John Eliot Gardiner" />
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Orchestra <span class="text-red-500">*</span>
            </label>
            <input type="text" id="orchestra" required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
              placeholder="Hong Kong Philharmonic Orchestra" />
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Description <span class="text-red-500">*</span>
            </label>
            <textarea id="description" required rows="4"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
              placeholder="Experience Beethoven's monumental Ninth Symphony featuring the iconic Ode to Joy"></textarea>
          </div>
        </div>
      </div>
    `;
  },

  performanceInformation() {
    return `
      <div class="bg-gray-50 p-6 rounded-lg">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
          <i class="fas fa-theater-masks text-indigo-600 mr-2"></i>Performance Details
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Presenter
            </label>
            <input type="text" id="presenter"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
              placeholder="Hong Kong Philharmonic Orchestra" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Duration (minutes) <span class="text-red-500">*</span>
            </label>
            <input type="number" id="duration" required min="1"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
              placeholder="120" />
          </div>

          ${this.eventCategories()}

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Age Limit
            </label>
            <select id="ageLimit"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black">
              <option value="0">No age limit</option>
              <option value="3">3+</option>
              <option value="6">6+</option>
              <option value="12">12+</option>
              <option value="18">18+</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Website
            </label>
            <input type="url" id="website"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
              placeholder="https://www.example.com" />
          </div>
        </div>
      </div>
    `;
  },

  eventCategories() {
    return `
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Event Categories <span class="text-red-500">*</span>
        </label>
        <div class="space-y-2">
          <div class="flex items-center">
            <input type="checkbox" id="cat_western" value="Western Instrumental Music" class="mr-2 event-category text-black">
            <label for="cat_western" class="text-sm text-black">Western Instrumental Music</label>
          </div>
          <div class="flex items-center">
            <input type="checkbox" id="cat_symphony" value="Symphony" class="mr-2 event-category text-black">
            <label for="cat_symphony" class="text-sm text-black">Symphony</label>
          </div>
          <div class="flex items-center">
            <input type="checkbox" id="cat_chamber" value="Chamber Music" class="mr-2 event-category text-black">
            <label for="cat_chamber" class="text-sm text-black">Chamber Music</label>
          </div>
          <div class="flex items-center">
            <input type="checkbox" id="cat_concerto" value="Concerto" class="mr-2 event-category text-black">
            <label for="cat_concerto" class="text-sm text-black">Concerto</label>
          </div>
        </div>
      </div>
    `;
  },


  ticketingInformation() {
    return `
      <div class="bg-gray-50 p-6 rounded-lg">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
          <i class="fas fa-ticket-alt text-indigo-600 mr-2"></i>Ticketing Information
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Status <span class="text-red-500">*</span>
            </label>
            <select id="status" required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black">
              <option value="upcoming" class="text-black">Upcoming</option>
              <option value="early_bird" class="text-black">Early Bird</option>
              <option value="on_sale" class="text-black">On Sale</option>
              <option value="sold_out" class="text-black">Sold Out</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Ticket Sale Start <span class="text-red-500">*</span>
            </label>
            <input type="datetime-local" id="ticketSaleStart" required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Pre-order Start Date
            </label>
            <input type="date" id="preOrderStartDate"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Early Bird End Date
            </label>
            <input type="date" id="earlyBirdEndDate"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black" />
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Additional Information
            </label>
            <textarea id="additionalInfo" rows="2"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
              placeholder="Special notes or instructions for this performance"></textarea>
          </div>
        </div>
      </div>
    `;
  },

  venueInformation(venues) {
    const venueOptions = venues
      .map((venue) => {
        const location = venue.location || venue.address || venue.city || "";
        const displayText = location ? `${venue.name} - ${location}` : venue.name;
        return `<option value="${venue.id}">${displayText}</option>`;
      })
      .join("");

    return `
      <div class="bg-gray-50 p-6 rounded-lg">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
          <i class="fas fa-map-marker-alt text-indigo-600 mr-2"></i>Venue Information
        </h3>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Venue <span class="text-red-500">*</span>
          </label>
          <select id="venueSelect" required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black">
            <option value="">Select venue...</option>
            ${venueOptions}
          </select>
          <p class="mt-2 text-xs text-gray-500">
            <i class="fas fa-info-circle mr-1"></i>
            Select the performance venue from available locations
          </p>
        </div>
      </div>
    `;
  },

  showtimesSection() {
    return `
      <div class="bg-gray-50 p-6 rounded-lg">
        <div class="flex justify-between items-center mb-4">
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-900">
              <i class="fas fa-calendar-alt text-indigo-600 mr-2"></i>Showtimes & Pricing
            </h3>
            <p class="text-xs text-gray-500 mt-1">Add performance dates and configure pricing tiers</p>
          </div>
          <button type="button" id="addShowtimeBtn"
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
            <i class="fas fa-plus mr-2"></i>Add Showtime
          </button>
        </div>
        <div id="showtimesContainer" class="space-y-4">
        </div>
      </div>
    `;
  },

  remarksSection() {
    return `
      <div class="bg-gray-50 p-6 rounded-lg">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
          <i class="fas fa-exclamation-circle text-indigo-600 mr-2"></i>Important Remarks
        </h3>
        <textarea id="remarks" rows="4"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
          placeholder="Add any important information or restrictions..."></textarea>
      </div>
    `;
  },
};
