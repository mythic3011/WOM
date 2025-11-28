
import { venueAPI, handleApiError } from "@services/apiClient.js";
import { ResponseExtractor } from "@services/responseExtractor.js";
import { notify } from "@utils/ui/notification.js";

const COMMON_FACILITIES = [
  { id: "wifi", label: "WiFi", icon: "fa-wifi" },
  { id: "parking", label: "Parking", icon: "fa-square-parking" },
  { id: "restaurant", label: "Restaurant", icon: "fa-utensils" },
  { id: "bar", label: "Bar / Lounge", icon: "fa-martini-glass" },
  { id: "wheelchair", label: "Wheelchair Access", icon: "fa-wheelchair" },
  { id: "elevator", label: "Elevator", icon: "fa-elevator" },
  { id: "ac", label: "Air Conditioning", icon: "fa-snowflake" },
  { id: "cloakroom", label: "Cloakroom", icon: "fa-shirt" },
  { id: "restroom", label: "Restrooms", icon: "fa-restroom" },
  { id: "stage", label: "Stage Equipment", icon: "fa-microphone-lines" },
  { id: "sound", label: "Sound System", icon: "fa-volume-high" },
  { id: "lighting", label: "Stage Lighting", icon: "fa-lightbulb" },
];

export default {
  title: "Venue Form | Admin",
  venueId: null,
  venue: null,

  async render() {
    this.venueId = new URLSearchParams(window.location.search).get("id");
    const isEdit = !!this.venueId;

    if (isEdit) {
      try {
        const response = await venueAPI.getById(this.venueId);
        this.venue = ResponseExtractor.extractSingle(response, "venue");
      } catch (error) {
        handleApiError(error, "Failed to load venue");
        window.location.href = "/admin/venues";
        return "";
      }
    } else {
      this.venue = null;
    }

    return `
      <div class="min-h-screen bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div class="mb-6 flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">
                ${isEdit ? "Edit Venue" : "Create New Venue"}
              </h1>
              <p class="mt-2 text-sm text-gray-600">
                ${isEdit ? "Update venue information and layout" : "Add a new venue to the system"}
              </p>
            </div>
            <button
              onclick="window.location.href='/admin/venues'"
              class="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <i class="fas fa-arrow-left"></i>
              Back to Venues
            </button>
          </div>

          <form id="venueForm" class="space-y-6">
            <div class="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div class="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div class="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <i class="fas fa-info-circle text-indigo-600 text-lg"></i>
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-gray-900">Basic Information</h2>
                  <p class="text-xs text-gray-500">Core venue details and configuration</p>
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    <i class="fas fa-building text-indigo-500 mr-2"></i>
                    Venue Name <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i class="fas fa-theater-masks text-gray-400"></i>
                    </div>
                    <input
                      type="text"
                      name="name"
                      id="venueName"
                      value="${this.venue?.name || ""}"
                      required
                      class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-all"
                      placeholder="Hong Kong Cultural Centre Concert Hall"
                    />
                  </div>
                </div>

                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    <i class="fas fa-map-marker-alt text-indigo-500 mr-2"></i>
                    Address <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <div class="absolute top-3 left-3 pointer-events-none">
                      <i class="fas fa-location-dot text-gray-400"></i>
                    </div>
                    <textarea
                      name="address"
                      id="venueAddress"
                      rows="3"
                      required
                      class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-all"
                      placeholder="10 Salisbury Road, Tsim Sha Tsui, Kowloon"
                    >${this.venue?.address || ""}</textarea>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    <i class="fas fa-users text-indigo-500 mr-2"></i>
                    Capacity <span class="text-red-500">*</span>
                    <span class="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-normal">
                      <i class="fas fa-calculator text-xs"></i> Auto
                    </span>
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i class="fas fa-user-group text-gray-400"></i>
                    </div>
                    <input
                      type="number"
                      name="capacity"
                      id="venueCapacity"
                      value="${this.venue?.capacity || 0}"
                      readonly
                      required
                      min="0"
                      class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 cursor-not-allowed"
                      placeholder="0"
                    />
                  </div>
                  <p class="mt-1 text-xs text-gray-500">
                    <i class="fas fa-info-circle"></i>
                    Calculated from total seats in all sections
                  </p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    <i class="fas fa-phone text-indigo-500 mr-2"></i>
                    Contact
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i class="fas fa-phone-alt text-gray-400"></i>
                    </div>
                    <input
                      type="text"
                      name="contact"
                      id="venueContact"
                      value="${this.venue?.contact || ""}"
                      class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-all"
                      placeholder="+852 2734 2009"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    <i class="fas fa-toggle-on text-indigo-500 mr-2"></i>
                    Status <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i class="fas fa-circle-dot text-gray-400"></i>
                    </div>
                    <select
                      name="status"
                      id="venueStatus"
                      required
                      class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white transition-all appearance-none"
                    >
                      <option value="active" ${this.venue?.status === "active" ? "selected" : ""}>✓ Active</option>
                      <option value="inactive" ${this.venue?.status === "inactive" ? "selected" : ""}>✗ Inactive</option>
                      <option value="maintenance" ${this.venue?.status === "maintenance" ? "selected" : ""}>🔧 Maintenance</option>
                    </select>
                    <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <i class="fas fa-chevron-down text-gray-400 text-sm"></i>
                    </div>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    <i class="fas fa-image text-indigo-500 mr-2"></i>
                    Image URL
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i class="fas fa-link text-gray-400"></i>
                    </div>
                    <input
                      type="text"
                      name="image"
                      id="venueImage"
                      value="${this.venue?.image || ""}"
                      class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-all"
                      placeholder="https://example.com/venue.jpg"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div class="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <i class="fas fa-concierge-bell text-green-600 text-lg"></i>
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-gray-900">Facilities & Amenities</h2>
                  <p class="text-xs text-gray-500">Available services and features</p>
                </div>
              </div>
              <div id="facilitiesContainer" class="space-y-2">
                ${this.renderFacilities()}
              </div>
              <button
                type="button"
                id="addCustomFacilityBtn"
                class="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 hover:shadow-lg transition-all font-medium shadow-md"
              >
                <i class="fas fa-plus-circle"></i>
                Add Custom Facility
              </button>
            </div>

            <div class="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div class="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <i class="fas fa-th-large text-purple-600 text-lg"></i>
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-gray-900">Seating Layout</h2>
                  <p class="text-xs text-gray-500">Configure venue sections and capacity</p>
                </div>
              </div>
              <div id="layoutContainer" class="space-y-4">
                ${this.renderLayout()}
              </div>
              <button
                type="button"
                id="addSectionBtn"
                class="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 hover:shadow-lg transition-all font-medium shadow-md"
              >
                <i class="fas fa-plus-circle"></i>
                Add Section
              </button>
            </div>

            <div class="flex items-center justify-between gap-4 bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div class="flex items-center gap-2 text-sm text-gray-600">
                <i class="fas fa-info-circle text-blue-500"></i>
                <span>All fields marked with <span class="text-red-500">*</span> are required</span>
              </div>
              <div class="flex items-center gap-4">
                <button
                  type="button"
                  onclick="window.location.href='/admin/venues'"
                  class="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all text-gray-700 font-medium"
                >
                  <i class="fas fa-times mr-2"></i>
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submitBtn"
                  class="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i class="fas fa-save mr-2"></i>
                  <span id="submitText">${isEdit ? "Update Venue" : "Create Venue"}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  renderFacilities() {
    const facilities = this.venue?.facilities || [];

    const commonHtml = COMMON_FACILITIES.map((facility) => {
      const isChecked = facilities.includes(facility.label);
      return `
        <label class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all cursor-pointer group">
          <input
            type="checkbox"
            class="common-facility-checkbox w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-2 focus:ring-green-500"
            data-facility-label="${facility.label}"
            ${isChecked ? "checked" : ""}
          />
          <div class="flex items-center gap-2 flex-1">
            <div class="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <i class="fas ${facility.icon} text-green-600"></i>
            </div>
            <span class="text-gray-900 font-medium">${facility.label}</span>
          </div>
        </label>
      `;
    }).join("");

    const customFacilities = facilities.filter(
      (f) => !COMMON_FACILITIES.some((cf) => cf.label === f)
    );

    const customHtml = customFacilities.length > 0
      ? customFacilities
        .map(
          (facility, index) => `
          <div class="flex items-center gap-2 custom-facility-item group">
            <div class="relative flex-1">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i class="fas fa-star text-yellow-500"></i>
              </div>
              <input
                type="text"
                value="${facility}"
                class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-900 transition-all"
                data-custom-facility-index="${index}"
                placeholder="Custom facility name"
              />
            </div>
            <button
              type="button"
              class="remove-custom-facility px-3 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 hover:shadow-md transition-all border border-red-200 opacity-0 group-hover:opacity-100"
              data-custom-facility-index="${index}"
              title="Remove custom facility"
            >
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        `
        )
        .join("")
      : "";

    return `
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <i class="fas fa-list-check text-green-600"></i>
            Common Facilities
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            ${commonHtml}
          </div>
        </div>
        
        <div class="border-t border-gray-200 pt-4">
          <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <i class="fas fa-star text-yellow-600"></i>
            Custom Facilities
          </h3>
          <div id="customFacilitiesContainer" class="space-y-2">
            ${customHtml ||
      "<p class=\"text-gray-500 text-sm italic\">No custom facilities added</p>"
      }
          </div>
        </div>
      </div>
    `;
  },

  renderLayout() {
    const sections = this.venue?.layout?.sections || [];
    if (sections.length === 0) {
      return `
        <div class="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-purple-100 flex items-center justify-center">
            <i class="fas fa-th-large text-purple-600 text-2xl"></i>
          </div>
          <p class="text-gray-600 font-medium">No sections configured</p>
          <p class="text-gray-400 text-sm mt-1">Add seating sections to define your venue layout</p>
        </div>
      `;
    }
    return sections
      .map(
        (section, index) => `
      <div class="border-2 border-gray-200 rounded-lg p-5 section-item hover:border-purple-300 transition-all bg-gray-50">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <span class="text-purple-600 font-bold text-sm">${index + 1}</span>
            </div>
            <h3 class="font-semibold text-gray-900">Section ${index + 1}</h3>
          </div>
          <button
            type="button"
            class="remove-section px-3 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 hover:shadow-md transition-all border border-red-200"
            data-section-index="${index}"
            title="Remove section"
          >
            <i class="fas fa-trash-alt mr-1"></i>Remove
          </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Section Name</label>
            <input
              type="text"
              value="${section.name || ""}"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
              data-section-index="${index}"
              data-field="name"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Rows</label>
            <input
              type="number"
              value="${section.rows || ""}"
              min="1"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
              data-section-index="${index}"
              data-field="rows"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Seats Per Row</label>
            <input
              type="number"
              value="${section.seatsPerRow || ""}"
              min="1"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
              data-section-index="${index}"
              data-field="seatsPerRow"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Tier</label>
            <select
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
              data-section-index="${index}"
              data-field="tier"
            >
              <option value="vip" ${section.tier === "vip" ? "selected" : ""}>VIP</option>
              <option value="premium" ${section.tier === "premium" ? "selected" : ""}>Premium</option>
              <option value="standard" ${section.tier === "standard" ? "selected" : ""}>Standard</option>
              <option value="economy" ${section.tier === "economy" ? "selected" : ""}>Economy</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Start Row</label>
            <input
              type="text"
              value="${section.startRow || ""}"
              maxlength="1"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
              data-section-index="${index}"
              data-field="startRow"
              placeholder="A"
            />
          </div>
        </div>
      </div>
    `
      )
      .join("");
  },

  async afterRender() {
    this.setupEventListeners();
    this.calculateCapacity();
  },

  calculateCapacity() {
    let totalCapacity = 0;
    $(".section-item").each(function () {
      const rows = parseInt($(this).find("[data-field=\"rows\"]").val()) || 0;
      const seatsPerRow = parseInt($(this).find("[data-field=\"seatsPerRow\"]").val()) || 0;
      totalCapacity += rows * seatsPerRow;
    });
    $("#venueCapacity").val(totalCapacity);
    return totalCapacity;
  },

  setupEventListeners() {
    $("#venueForm").on("submit", (e) => this.handleSubmit(e));
    $("#addCustomFacilityBtn").on("click", () => this.addCustomFacility());
    $("#addSectionBtn").on("click", () => this.addSection());

    $(document).on("click", ".remove-custom-facility", (e) =>
      this.removeCustomFacility($(e.currentTarget).data("custom-facility-index"))
    );

    $(document).on("click", ".remove-section", (e) => {
      this.removeSection($(e.currentTarget).data("section-index"));
      this.calculateCapacity();
    });

    $(document).on("input change", "[data-field=\"rows\"], [data-field=\"seatsPerRow\"]", () => {
      this.calculateCapacity();
    });
  },

  addCustomFacility() {
    const $container = $("#customFacilitiesContainer");
    const $emptyMsg = $container.find("p.italic");
    if ($emptyMsg.length) {
      $emptyMsg.remove();
    }

    const index = $container.find(".custom-facility-item").length;

    const html = `
      <div class="flex items-center gap-2 custom-facility-item group">
        <div class="relative flex-1">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i class="fas fa-star text-yellow-500"></i>
          </div>
          <input
            type="text"
            class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-900 transition-all"
            data-custom-facility-index="${index}"
            placeholder="Enter custom facility name"
          />
        </div>
        <button
          type="button"
          class="remove-custom-facility px-3 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 hover:shadow-md transition-all border border-red-200 opacity-0 group-hover:opacity-100"
          data-custom-facility-index="${index}"
          title="Remove custom facility"
        >
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    `;
    $container.append(html);
  },

  removeCustomFacility(index) {
    $(".custom-facility-item").eq(index).remove();
    const $container = $("#customFacilitiesContainer");
    if ($container.find(".custom-facility-item").length === 0) {
      $container.html("<p class=\"text-gray-500 text-sm italic\">No custom facilities added</p>");
    }
  },

  addSection() {
    const $container = $("#layoutContainer");
    const index = $container.find(".section-item").length;

    if (index === 0) {
      $container.empty();
    }
    const html = `
      <div class="border-2 border-gray-200 rounded-lg p-5 section-item hover:border-purple-300 transition-all bg-gray-50">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <span class="text-purple-600 font-bold text-sm">${index + 1}</span>
            </div>
            <h3 class="font-semibold text-gray-900">Section ${index + 1}</h3>
          </div>
          <button
            type="button"
            class="remove-section px-3 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 hover:shadow-md transition-all border border-red-200"
            data-section-index="${index}"
            title="Remove section"
          >
            <i class="fas fa-trash-alt mr-1"></i>Remove
          </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Section Name</label>
            <input
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
              data-section-index="${index}"
              data-field="name"
              placeholder="Orchestra Stalls"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Rows</label>
            <input
              type="number"
              min="1"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
              data-section-index="${index}"
              data-field="rows"
              placeholder="8"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Seats Per Row</label>
            <input
              type="number"
              min="1"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
              data-section-index="${index}"
              data-field="seatsPerRow"
              placeholder="26"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Tier</label>
            <select
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
              data-section-index="${index}"
              data-field="tier"
            >
              <option value="vip">VIP</option>
              <option value="premium">Premium</option>
              <option value="standard">Standard</option>
              <option value="economy">Economy</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Start Row</label>
            <input
              type="text"
              maxlength="1"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
              data-section-index="${index}"
              data-field="startRow"
              placeholder="A"
            />
          </div>
        </div>
      </div>
    `;
    $container.append(html);
    this.calculateCapacity();
  },

  removeSection(index) {
    $(".section-item").eq(index).remove();
  },

  async handleSubmit(e) {
    e.preventDefault();

    const $submitBtn = $("#submitBtn");
    const $submitText = $("#submitText");
    const originalText = $submitText.text();

    $submitBtn.prop("disabled", true);
    $submitBtn.addClass("opacity-75 cursor-wait");
    $submitText.html("<i class=\"fas fa-spinner fa-spin mr-2\"></i>Saving...");

    const facilities = [];

    $(".common-facility-checkbox:checked").each(function () {
      const label = $(this).data("facility-label");
      facilities.push(label);
    });

    $(".custom-facility-item input").each(function () {
      const value = $(this).val().trim();
      if (value) {facilities.push(value);}
    });

    const sections = [];
    $(".section-item").each(function () {
      const section = {};
      $(this)
        .find("[data-field]")
        .each(function () {
          const field = $(this).data("field");
          let value = $(this).val();
          if (field === "rows" || field === "seatsPerRow") {
            value = parseInt(value) || 0;
          }
          section[field] = value;
        });
      if (section.name) {sections.push(section);}
    });

    const capacity = this.calculateCapacity();

    const formData = {
      name: $("#venueName").val().trim(),
      address: $("#venueAddress").val().trim(),
      capacity: capacity,
      contact: $("#venueContact").val().trim(),
      status: $("#venueStatus").val(),
      image: $("#venueImage").val().trim() || null,
      facilities: facilities,
      layout: { sections },
    };

    try {
      if (this.venueId) {
        await venueAPI.update(this.venueId, formData);
        notify.success("Venue updated successfully");
      } else {
        await venueAPI.create(formData);
        notify.success("Venue created successfully");
      }
      window.location.href = "/admin/venues";
    } catch (error) {
      $submitBtn.prop("disabled", false);
      $submitBtn.removeClass("opacity-75 cursor-wait");
      $submitText.html(`<i class="fas fa-save mr-2"></i>${originalText}`);
      handleApiError(error, "Failed to save venue");
    }
  },
};
