import { FormComponents } from "@components/FormComponents.js";

export const VenueEditForm = {
    currentTab: "layout",
    formData: {},
    isDirty: false,
    validationErrors: {},

    /**
     * Initialize and render the venue edit form
     * @param {Object} venue - Existing venue data or null for new venue
     * @returns {string} HTML string
     */
    render(venue = null) {
        this.formData = venue || this.getDefaultVenueData();
        this.isDirty = false;
        this.validationErrors = {};

        return `
      <div class="venue-edit-form">
        ${this.renderHeader()}
        ${this.renderTabNavigation()}
        <div class="tab-content mt-6">
          ${this.renderTabContent()}
        </div>
        ${this.renderActions()}
      </div>
    `;
    },

    /**
     * Get default venue data structure
     * @returns {Object}
     */
    getDefaultVenueData() {
        return {
            name: "",
            address: "",
            capacity: 0,
            facilities: [],
            contact: "",
            status: "active",
            image: "",
            layout: {
                sections: [
                    {
                        name: "Main Section",
                        rows: 10,
                        seatsPerRow: 20,
                        tier: "standard",
                        startRow: "A",
                        horizontalAisles: [],
                        seatNumbering: {
                            globalDirection: "ltr",
                            startNumber: 1,
                            prefix: "",
                            suffix: "",
                            skipNumbers: [],
                        },
                        rowsConfig: [],
                    },
                ],
            },
        };
    },

    /**
     * Render form header
     * @returns {string}
     */
    renderHeader() {
        const isEdit = !!this.formData.id;
        return `
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <i class="fas fa-building text-indigo-600"></i>
              ${isEdit ? "Edit Venue" : "Create New Venue"}
            </h2>
            <p class="text-sm text-gray-600 mt-1">
              ${isEdit
                ? "Update venue information and layout configuration"
                : "Set up a new venue with custom layout and pricing"
            }
            </p>
          </div>
          ${this.isDirty
                ? `
            <div class="flex items-center gap-2 text-sm text-amber-600">
              <i class="fas fa-exclamation-circle"></i>
              <span>Unsaved changes</span>
            </div>
          `
                : ""
            }
        </div>
      </div>
    `;
    },

    /**
     * Render tab navigation
     * @returns {string}
     */
    renderTabNavigation() {
        const tabs = [
            { id: "layout", label: "Layout", icon: "fa-th-large" },
            { id: "numbering", label: "Numbering", icon: "fa-sort-numeric-down" },
            { id: "per-row", label: "Per-Row Override", icon: "fa-cog" },
            { id: "pricing", label: "Pricing", icon: "fa-dollar-sign" },
        ];

        return `
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div class="flex border-b">
          ${tabs
                .map(
                    (tab) => `
            <button
              type="button"
              class="venue-tab flex-1 px-6 py-4 text-sm font-medium transition-all ${this.currentTab === tab.id
                            ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }"
              data-tab="${tab.id}"
            >
              <i class="fas ${tab.icon} mr-2"></i>
              ${tab.label}
            </button>
          `
                )
                .join("")}
        </div>
      </div>
    `;
    },

    /**
     * Render current tab content
     * @returns {string}
     */
    renderTabContent() {
        switch (this.currentTab) {
            case "layout":
                return this.renderLayoutTab();
            case "numbering":
                return this.renderNumberingTab();
            case "per-row":
                return this.renderPerRowTab();
            case "pricing":
                return this.renderPricingTab();
            default:
                return "";
        }
    },

    /**
     * Render Layout tab
     * @returns {string}
     */
    renderLayoutTab() {
        const sections = this.formData.layout?.sections || [];

        return `
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Section Configuration</h3>
            <p class="text-sm text-gray-600 mt-1">Define the sections and layout of your venue</p>
          </div>
          <button
            type="button"
            id="add-section-btn"
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md text-sm font-medium"
          >
            <i class="fas fa-plus mr-2"></i>Add Section
          </button>
        </div>

        <div id="sections-container" class="space-y-4">
          ${sections.length === 0
                ? this.renderEmptySections()
                : sections.map((section, index) => this.renderSectionCard(section, index)).join("")
            }
        </div>
      </div>
    `;
    },

    /**
     * Render empty sections placeholder
     * @returns {string}
     */
    renderEmptySections() {
        return `
      <div class="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300">
        <i class="fas fa-th-large text-5xl text-gray-400 mb-3"></i>
        <p class="text-sm font-medium text-gray-700">No sections configured</p>
        <p class="text-xs text-gray-500 mt-1">Click "Add Section" to create your first section</p>
      </div>
    `;
    },

    /**
     * Render a section card
     * @param {Object} section
     * @param {number} index
     * @returns {string}
     */
    renderSectionCard(section, index) {
        const horizontalAisles = section.horizontalAisles || [];

        return `
      <div class="border border-gray-200 rounded-lg p-5 bg-gradient-to-r from-white to-gray-50 hover:border-indigo-300 transition-all" data-section-index="${index}">
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <h4 class="text-md font-semibold text-gray-900 mb-3">Section ${index + 1}</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">
                  Section Name <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  class="section-name w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value="${section.name || ""}"
                  placeholder="e.g., Orchestra, Balcony"
                  data-section-index="${index}"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">
                  Rows <span class="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  class="section-rows w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value="${section.rows || 10}"
                  min="1"
                  max="200"
                  data-section-index="${index}"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">
                  Seats per Row <span class="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  class="section-seats-per-row w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value="${section.seatsPerRow || 20}"
                  min="1"
                  max="200"
                  data-section-index="${index}"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">
                  Tier
                </label>
                <select
                  class="section-tier w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  data-section-index="${index}"
                >
                  <option value="vip" ${section.tier === "vip" ? "selected" : ""}>VIP</option>
                  <option value="premium" ${section.tier === "premium" ? "selected" : ""}>Premium</option>
                  <option value="standard" ${section.tier === "standard" ? "selected" : ""}>Standard</option>
                  <option value="economy" ${section.tier === "economy" ? "selected" : ""}>Economy</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">
                  Start Row
                </label>
                <input
                  type="text"
                  class="section-start-row w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value="${section.startRow || "A"}"
                  maxlength="3"
                  placeholder="A"
                  data-section-index="${index}"
                />
              </div>
            </div>
          </div>
          <button
            type="button"
            class="remove-section-btn ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
            data-section-index="${index}"
            title="Remove section"
          >
            <i class="fas fa-trash"></i>
          </button>
        </div>

        <div class="mt-4 pt-4 border-t border-gray-200">
          <div class="flex items-center justify-between mb-3">
            <h5 class="text-sm font-semibold text-gray-900">Horizontal Aisles</h5>
            <button
              type="button"
              class="add-aisle-btn px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all text-xs font-medium"
              data-section-index="${index}"
            >
              <i class="fas fa-plus mr-1"></i>Add Aisle
            </button>
          </div>
          
          <div class="aisles-container space-y-2" data-section-index="${index}">
            ${horizontalAisles.length === 0
                ? `<p class="text-xs text-gray-500 italic">No horizontal aisles configured</p>`
                : horizontalAisles.map((aisle, aisleIndex) => this.renderAisleRow(aisle, index, aisleIndex)).join("")
            }
          </div>
        </div>
      </div>
    `;
    },

    /**
     * Render a horizontal aisle row
     * @param {Object} aisle
     * @param {number} sectionIndex
     * @param {number} aisleIndex
     * @returns {string}
     */
    renderAisleRow(aisle, sectionIndex, aisleIndex) {
        return `
      <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200" data-aisle-index="${aisleIndex}">
        <div class="flex-1 grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">After Row</label>
            <input
              type="text"
              class="aisle-after-row w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value="${aisle.afterRow || ""}"
              placeholder="e.g., H"
              data-section-index="${sectionIndex}"
              data-aisle-index="${aisleIndex}"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Height (units)</label>
            <input
              type="number"
              class="aisle-height w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value="${aisle.height || 1}"
              min="0.5"
              max="10"
              step="0.5"
              data-section-index="${sectionIndex}"
              data-aisle-index="${aisleIndex}"
            />
          </div>
        </div>
        <button
          type="button"
          class="remove-aisle-btn p-2 text-red-600 hover:bg-red-100 rounded transition-all"
          data-section-index="${sectionIndex}"
          data-aisle-index="${aisleIndex}"
          title="Remove aisle"
        >
          <i class="fas fa-trash text-sm"></i>
        </button>
      </div>
    `;
    },

    /**
     * Render Numbering tab
     * @returns {string}
     */
    renderNumberingTab() {
        const sections = this.formData.layout?.sections || [];

        if (sections.length === 0) {
            return `
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
          <div class="text-center py-12">
            <i class="fas fa-exclamation-circle text-5xl text-gray-400 mb-3"></i>
            <p class="text-sm font-medium text-gray-700">No sections available</p>
            <p class="text-xs text-gray-500 mt-1">Please add at least one section in the Layout tab first</p>
          </div>
        </div>
      `;
        }

        return `
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-gray-900">Seat Numbering Configuration</h3>
          <p class="text-sm text-gray-600 mt-1">Configure how seats are numbered in each section</p>
        </div>

        <div class="space-y-6">
          ${sections.map((section, index) => this.renderSectionNumbering(section, index)).join("")}
        </div>
      </div>
    `;
    },

    /**
     * Render numbering configuration for a section
     * @param {Object} section
     * @param {number} index
     * @returns {string}
     */
    renderSectionNumbering(section, index) {
        const numbering = section.seatNumbering || {
            globalDirection: "ltr",
            startNumber: 1,
            prefix: "",
            suffix: "",
            skipNumbers: [],
        };

        return `
      <div class="border border-gray-200 rounded-lg p-5 bg-gradient-to-r from-white to-gray-50" data-section-index="${index}">
        <h4 class="text-md font-semibold text-gray-900 mb-4">
          ${section.name || `Section ${index + 1}`}
        </h4>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Direction
            </label>
            <select
              class="numbering-direction w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              data-section-index="${index}"
            >
              <option value="ltr" ${numbering.globalDirection === "ltr" ? "selected" : ""}>Left to Right (LTR)</option>
              <option value="rtl" ${numbering.globalDirection === "rtl" ? "selected" : ""}>Right to Left (RTL)</option>
            </select>
            <p class="text-xs text-gray-500 mt-1">Direction of seat numbering</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Start Number
            </label>
            <input
              type="number"
              class="numbering-start-number w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value="${numbering.startNumber || 1}"
              min="1"
              max="500"
              data-section-index="${index}"
            />
            <p class="text-xs text-gray-500 mt-1">First seat number</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Prefix
            </label>
            <input
              type="text"
              class="numbering-prefix w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value="${numbering.prefix || ""}"
              maxlength="5"
              placeholder="e.g., S"
              data-section-index="${index}"
            />
            <p class="text-xs text-gray-500 mt-1">Text before seat number</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Suffix
            </label>
            <input
              type="text"
              class="numbering-suffix w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value="${numbering.suffix || ""}"
              maxlength="5"
              placeholder="e.g., -A"
              data-section-index="${index}"
            />
            <p class="text-xs text-gray-500 mt-1">Text after seat number</p>
          </div>
        </div>

        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Skip Numbers
          </label>
          <div class="flex flex-wrap gap-2 bg-gray-50 p-3 rounded-lg min-h-16 border border-gray-200" data-skip-container data-section-index="${index}">
            ${(numbering.skipNumbers || [])
                .map(
                    (num) => `
              <span class="inline-flex items-center bg-red-100 text-red-700 text-xs font-medium px-2.5 py-1 rounded">
                ${num}
                <button type="button" class="ml-1.5 text-red-500 hover:text-red-700 remove-skip-number" data-section-index="${index}" data-skip-number="${num}">×</button>
              </span>
            `
                )
                .join("")}
          </div>
          <div class="flex gap-2 mt-2">
            <input
              type="number"
              class="skip-number-input flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter number to skip (e.g., 13)"
              min="1"
              max="500"
              data-section-index="${index}"
            />
            <button
              type="button"
              class="add-skip-number-btn px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm font-medium"
              data-section-index="${index}"
            >
              <i class="fas fa-plus mr-1"></i>Add
            </button>
          </div>
          <p class="text-xs text-gray-500 mt-1">Numbers to skip in the sequence (e.g., 13, 14 for superstition)</p>
        </div>

        <div class="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 class="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <i class="fas fa-eye text-blue-600"></i>
            Preview (First Row)
          </h5>
          <div class="flex flex-wrap gap-1" data-preview-container data-section-index="${index}">
            ${this.generateNumberingPreview(section, numbering)}
          </div>
        </div>
      </div>
    `;
    },

    /**
     * Generate numbering preview for a section
     * @param {Object} section
     * @param {Object} numbering
     * @returns {string}
     */
    generateNumberingPreview(section, numbering) {
        const direction = numbering.globalDirection || "ltr";
        const startNumber = numbering.startNumber || 1;
        const prefix = numbering.prefix || "";
        const suffix = numbering.suffix || "";
        const skipNumbers = new Set(numbering.skipNumbers || []);
        const seatsToShow = Math.min(section.seatsPerRow || 20, 20);

        const preview = [];
        const rowLabel = section.startRow || "A";

        for (let i = 0; i < seatsToShow; i++) {
            const effectiveIndex = direction === "rtl" ? seatsToShow - 1 - i : i;
            let seatNumber = startNumber + effectiveIndex;

            // Skip numbers that are in the skip list
            let skippedCount = 0;
            for (let j = startNumber; j < seatNumber; j++) {
                if (skipNumbers.has(j)) {
                    skippedCount++;
                }
            }
            seatNumber += skippedCount;

            // Check if this number should be skipped
            while (skipNumbers.has(seatNumber)) {
                seatNumber++;
            }

            const label = `${rowLabel}${prefix}${seatNumber}${suffix}`;
            preview.push(
                `<span class="px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-mono">${label}</span>`
            );
        }

        if (section.seatsPerRow > 20) {
            preview.push(`<span class="px-2 py-1 text-gray-500 text-xs">... +${section.seatsPerRow - 20} more</span>`);
        }

        return preview.join("");
    },

    /**
     * Render Per-Row Override tab
     * @returns {string}
     */
    renderPerRowTab() {
        const sections = this.formData.layout?.sections || [];

        if (sections.length === 0) {
            return `
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
          <div class="text-center py-12">
            <i class="fas fa-exclamation-circle text-5xl text-gray-400 mb-3"></i>
            <p class="text-sm font-medium text-gray-700">No sections available</p>
            <p class="text-xs text-gray-500 mt-1">Please add at least one section in the Layout tab first</p>
          </div>
        </div>
      `;
        }

        return `
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-gray-900">Per-Row Configuration Overrides</h3>
          <p class="text-sm text-gray-600 mt-1">Customize individual rows with specific patterns and numbering</p>
        </div>

        <div class="space-y-6">
          ${sections.map((section, index) => this.renderSectionRowOverrides(section, index)).join("")}
        </div>
      </div>
    `;
    },

    /**
     * Render row overrides for a section
     * @param {Object} section
     * @param {number} sectionIndex
     * @returns {string}
     */
    renderSectionRowOverrides(section, sectionIndex) {
        const rowLabels = this.generateRowLabels(section);
        const rowsConfig = section.rowsConfig || [];

        return `
      <div class="border border-gray-200 rounded-lg p-5 bg-gradient-to-r from-white to-gray-50">
        <h4 class="text-md font-semibold text-gray-900 mb-4">
          ${section.name || `Section ${sectionIndex + 1}`}
        </h4>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div class="border-r pr-4">
            <h5 class="text-sm font-semibold text-gray-700 mb-3">Rows</h5>
            <div class="space-y-1 max-h-96 overflow-auto">
              ${rowLabels
                .map((label) => {
                    const hasOverride = rowsConfig.some((r) => r.rowLabel === label);
                    return `
                  <button
                    type="button"
                    class="row-select-btn w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 transition-all ${hasOverride
                            ? "bg-indigo-50 border-l-4 border-indigo-600 font-medium"
                            : "border-l-4 border-transparent"
                        }"
                    data-section-index="${sectionIndex}"
                    data-row-label="${label}"
                  >
                    ${label}
                    ${hasOverride
                            ? '<i class="fas fa-cog text-indigo-600 float-right"></i>'
                            : ""
                        }
                  </button>
                `;
                })
                .join("")}
            </div>
          </div>

          <div class="col-span-2" id="row-config-panel-${sectionIndex}">
            <div class="text-center text-gray-500 py-12">
              <i class="fas fa-arrow-left text-4xl mb-2"></i>
              <p class="text-sm">Select a row to configure overrides</p>
            </div>
          </div>
        </div>
      </div>
    `;
    },

    /**
     * Render row configuration panel
     * @param {Object} section
     * @param {number} sectionIndex
     * @param {string} rowLabel
     * @returns {string}
     */
    renderRowConfigPanel(section, sectionIndex, rowLabel) {
        const rowsConfig = section.rowsConfig || [];
        const override = rowsConfig.find((r) => r.rowLabel === rowLabel);
        const numbering = section.seatNumbering || {};

        const config = override || {
            rowLabel,
            direction: numbering.globalDirection || "ltr",
            startNumber: numbering.startNumber || 1,
            prefix: numbering.prefix || "",
            suffix: numbering.suffix || "",
            skip: [],
            pattern: "",
            seatShapes: [],
        };

        return `
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h5 class="text-sm font-semibold text-gray-900">Row ${rowLabel} Configuration</h5>
          ${override
                ? `
            <button
              type="button"
              class="remove-row-override-btn px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-xs font-medium"
              data-section-index="${sectionIndex}"
              data-row-label="${rowLabel}"
            >
              <i class="fas fa-trash mr-1"></i>Remove Override
            </button>
          `
                : ""
            }
        </div>

        <div class="bg-gray-50 p-4 rounded-lg space-y-3">
          <h6 class="text-xs font-semibold text-gray-700 uppercase">Pattern String</h6>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">
              Pattern (S=Seat, H=Gap, E=Empty)
            </label>
            <input
              type="text"
              class="row-pattern w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value="${config.pattern || ""}"
              placeholder="e.g., SSSSHSSSS (4 seats, gap, 4 seats)"
              data-section-index="${sectionIndex}"
              data-row-label="${rowLabel}"
            />
            <p class="text-xs text-gray-500 mt-1">
              S = Seat, H = Horizontal gap, E = Empty position
            </p>
          </div>
        </div>

        <div class="bg-gray-50 p-4 rounded-lg space-y-3">
          <h6 class="text-xs font-semibold text-gray-700 uppercase">Numbering Override</h6>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Direction</label>
              <select
                class="row-direction w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                data-section-index="${sectionIndex}"
                data-row-label="${rowLabel}"
              >
                <option value="ltr" ${config.direction === "ltr" ? "selected" : ""}>Left to Right</option>
                <option value="rtl" ${config.direction === "rtl" ? "selected" : ""}>Right to Left</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Start Number</label>
              <input
                type="number"
                class="row-start-number w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value="${config.startNumber || 1}"
                min="1"
                max="500"
                data-section-index="${sectionIndex}"
                data-row-label="${rowLabel}"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Prefix</label>
              <input
                type="text"
                class="row-prefix w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value="${config.prefix || ""}"
                maxlength="5"
                data-section-index="${sectionIndex}"
                data-row-label="${rowLabel}"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Suffix</label>
              <input
                type="text"
                class="row-suffix w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value="${config.suffix || ""}"
                maxlength="5"
                data-section-index="${sectionIndex}"
                data-row-label="${rowLabel}"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Skip Numbers</label>
            <div class="flex flex-wrap gap-1 bg-white p-2 rounded min-h-10 border border-gray-200" data-row-skip-container data-section-index="${sectionIndex}" data-row-label="${rowLabel}">
              ${(config.skip || [])
                .map(
                    (n) => `
                <span class="inline-flex items-center bg-red-100 text-red-700 text-xs px-2 py-1 rounded">
                  ${n}
                  <button type="button" class="ml-1 remove-row-skip" data-section-index="${sectionIndex}" data-row-label="${rowLabel}" data-skip-number="${n}">×</button>
                </span>
              `
                )
                .join("")}
            </div>
            <div class="flex gap-2 mt-2">
              <input
                type="number"
                class="row-skip-input flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Number to skip"
                min="1"
                max="500"
                data-section-index="${sectionIndex}"
                data-row-label="${rowLabel}"
              />
              <button
                type="button"
                class="add-row-skip-btn px-3 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700"
                data-section-index="${sectionIndex}"
                data-row-label="${rowLabel}"
              >
                <i class="fas fa-plus mr-1"></i>Add
              </button>
            </div>
          </div>
        </div>

        <div class="bg-gray-50 p-4 rounded-lg space-y-3">
          <div class="flex items-center justify-between">
            <h6 class="text-xs font-semibold text-gray-700 uppercase">Seat Shapes</h6>
            <button
              type="button"
              class="add-seat-shape-btn px-3 py-1.5 bg-gray-600 text-white rounded text-xs font-medium hover:bg-gray-700"
              data-section-index="${sectionIndex}"
              data-row-label="${rowLabel}"
            >
              <i class="fas fa-plus mr-1"></i>Add Shape
            </button>
          </div>
          <div class="seat-shapes-container space-y-2" data-section-index="${sectionIndex}" data-row-label="${rowLabel}">
            ${(config.seatShapes || []).length === 0
                ? `<p class="text-xs text-gray-500 italic">No custom seat shapes configured</p>`
                : (config.seatShapes || []).map((shape, shapeIndex) => this.renderSeatShapeRow(shape, sectionIndex, rowLabel, shapeIndex)).join("")
            }
          </div>
        </div>

        <button
          type="button"
          class="save-row-config-btn w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium shadow-sm hover:shadow-md"
          data-section-index="${sectionIndex}"
          data-row-label="${rowLabel}"
        >
          <i class="fas fa-save mr-2"></i>Save Row Configuration
        </button>
      </div>
    `;
    },

    /**
     * Render seat shape configuration row
     * @param {Object} shape
     * @param {number} sectionIndex
     * @param {string} rowLabel
     * @param {number} shapeIndex
     * @returns {string}
     */
    renderSeatShapeRow(shape, sectionIndex, rowLabel, shapeIndex) {
        return `
      <div class="flex items-center gap-3 p-3 bg-white rounded border border-gray-200" data-shape-index="${shapeIndex}">
        <div class="flex-1 grid grid-cols-3 gap-2">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Positions</label>
            <input
              type="text"
              class="shape-positions w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value="${(shape.positions || []).join(",")}"
              placeholder="0,1,2"
              data-section-index="${sectionIndex}"
              data-row-label="${rowLabel}"
              data-shape-index="${shapeIndex}"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Shape Type</label>
            <select
              class="shape-type w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              data-section-index="${sectionIndex}"
              data-row-label="${rowLabel}"
              data-shape-index="${shapeIndex}"
            >
              <option value="standard" ${shape.shape === "standard" ? "selected" : ""}>Standard</option>
              <option value="wide" ${shape.shape === "wide" ? "selected" : ""}>Wide</option>
              <option value="accessible" ${shape.shape === "accessible" ? "selected" : ""}>Accessible</option>
              <option value="loveseat" ${shape.shape === "loveseat" ? "selected" : ""}>Loveseat</option>
              <option value="table" ${shape.shape === "table" ? "selected" : ""}>Table</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Width</label>
            <input
              type="number"
              class="shape-width w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value="${shape.width || 1.0}"
              min="0.5"
              max="5"
              step="0.5"
              data-section-index="${sectionIndex}"
              data-row-label="${rowLabel}"
              data-shape-index="${shapeIndex}"
            />
          </div>
        </div>
        <button
          type="button"
          class="remove-seat-shape-btn p-2 text-red-600 hover:bg-red-100 rounded transition-all"
          data-section-index="${sectionIndex}"
          data-row-label="${rowLabel}"
          data-shape-index="${shapeIndex}"
          title="Remove shape"
        >
          <i class="fas fa-trash text-xs"></i>
        </button>
      </div>
    `;
    },

    /**
     * Generate row labels for a section
     * @param {Object} section
     * @returns {Array<string>}
     */
    generateRowLabels(section) {
        const labels = [];
        const startRow = section.startRow || "A";
        const rows = section.rows || 0;

        for (let i = 0; i < rows; i++) {
            labels.push(this.deriveRowLabel(startRow, i));
        }

        return labels;
    },

    /**
     * Derive row label from start row and offset
     * @param {string} startRow
     * @param {number} offset
     * @returns {string}
     */
    deriveRowLabel(startRow, offset) {
        const toNumber = (str) =>
            str.split("").reduce((acc, c) => acc * 26 + (c.charCodeAt(0) - 64), 0);
        const toLetters = (num) => {
            let n = num;
            let res = "";
            while (n > 0) {
                const rem = (n - 1) % 26;
                res = String.fromCharCode(65 + rem) + res;
                n = Math.floor((n - 1) / 26);
            }
            return res;
        };
        const startNum = toNumber(startRow.toUpperCase());
        return toLetters(startNum + offset);
    },

    /**
     * Render Pricing tab
     * @returns {string}
     */
    renderPricingTab() {
        const priceTiers = this.formData.priceTiers || [];
        const pricingZones = this.formData.pricingZones || [];

        return `
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-gray-900">Pricing Configuration</h3>
          <p class="text-sm text-gray-600 mt-1">Define pricing tiers and zones for your venue</p>
        </div>

        <div class="space-y-6">
          <!-- Pricing Tiers Section -->
          <div class="border border-gray-200 rounded-lg p-5 bg-gradient-to-r from-white to-gray-50">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h4 class="text-md font-semibold text-gray-900">Pricing Tiers</h4>
                <p class="text-xs text-gray-600 mt-1">Define different price levels for your venue</p>
              </div>
              <button
                type="button"
                id="add-price-tier-btn"
                class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md text-sm font-medium"
              >
                <i class="fas fa-plus mr-2"></i>Add Tier
              </button>
            </div>

            <div id="price-tiers-container" class="space-y-3">
              ${priceTiers.length === 0
                ? `
                <div class="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <i class="fas fa-dollar-sign text-4xl text-gray-400 mb-2"></i>
                  <p class="text-sm text-gray-600">No pricing tiers configured</p>
                  <p class="text-xs text-gray-500 mt-1">Click "Add Tier" to create one</p>
                </div>
              `
                : priceTiers.map((tier, index) => this.renderPriceTierRow(tier, index)).join("")
            }
            </div>
          </div>

          <!-- Pricing Zones Section -->
          <div class="border border-gray-200 rounded-lg p-5 bg-gradient-to-r from-white to-gray-50">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h4 class="text-md font-semibold text-gray-900">Pricing Zones</h4>
                <p class="text-xs text-gray-600 mt-1">Map sections and rows to pricing tiers</p>
              </div>
              <button
                type="button"
                id="add-pricing-zone-btn"
                class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md text-sm font-medium"
              >
                <i class="fas fa-plus mr-2"></i>Add Zone
              </button>
            </div>

            <div id="pricing-zones-container" class="space-y-3">
              ${pricingZones.length === 0
                ? `
                <div class="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <i class="fas fa-map-marked-alt text-4xl text-gray-400 mb-2"></i>
                  <p class="text-sm text-gray-600">No pricing zones configured</p>
                  <p class="text-xs text-gray-500 mt-1">Click "Add Zone" to create one</p>
                </div>
              `
                : pricingZones.map((zone, index) => this.renderPricingZoneRow(zone, index)).join("")
            }
            </div>
          </div>
        </div>
      </div>
    `;
    },

    /**
     * Render a pricing tier row
     * @param {Object} tier
     * @param {number} index
     * @returns {string}
     */
    renderPriceTierRow(tier, index) {
        return `
      <div class="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 transition-all" data-tier-index="${index}">
        <div class="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Tier Name</label>
            <input
              type="text"
              class="tier-name w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value="${tier.name || ""}"
              placeholder="e.g., VIP"
              data-tier-index="${index}"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Base Price (HKD)</label>
            <input
              type="number"
              class="tier-base-price w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value="${tier.basePrice || 0}"
              min="0"
              step="10"
              placeholder="800"
              data-tier-index="${index}"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Tier Level</label>
            <select
              class="tier-level w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              data-tier-index="${index}"
            >
              <option value="vip" ${tier.tier === "vip" ? "selected" : ""}>VIP</option>
              <option value="premium" ${tier.tier === "premium" ? "selected" : ""}>Premium</option>
              <option value="standard" ${tier.tier === "standard" ? "selected" : ""}>Standard</option>
              <option value="economy" ${tier.tier === "economy" ? "selected" : ""}>Economy</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Seat References</label>
            <input
              type="text"
              class="tier-seat-refs w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value="${(tier.seatRefs || []).join(", ")}"
              placeholder="e.g., a1, a2, b1"
              data-tier-index="${index}"
            />
          </div>
        </div>
        <button
          type="button"
          class="remove-tier-btn p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
          data-tier-index="${index}"
          title="Remove tier"
        >
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    },

    /**
     * Render a pricing zone row
     * @param {Object} zone
     * @param {number} index
     * @returns {string}
     */
    renderPricingZoneRow(zone, index) {
        const sections = this.formData.layout?.sections || [];

        return `
      <div class="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 transition-all" data-zone-index="${index}">
        <div class="flex-1 grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Zone ID</label>
            <input
              type="text"
              class="zone-id w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value="${zone.id || ""}"
              placeholder="e.g., zone-vip-front"
              data-zone-index="${index}"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Zone Name</label>
            <input
              type="text"
              class="zone-name w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value="${zone.name || ""}"
              placeholder="e.g., VIP Front Section"
              data-zone-index="${index}"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Tier</label>
            <select
              class="zone-tier w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              data-zone-index="${index}"
            >
              <option value="vip" ${zone.tier === "vip" ? "selected" : ""}>VIP</option>
              <option value="premium" ${zone.tier === "premium" ? "selected" : ""}>Premium</option>
              <option value="standard" ${zone.tier === "standard" ? "selected" : ""}>Standard</option>
              <option value="economy" ${zone.tier === "economy" ? "selected" : ""}>Economy</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Sections</label>
            <select
              multiple
              class="zone-sections w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              data-zone-index="${index}"
              style="height: 60px;"
            >
              ${sections.map((section) => `
                <option value="${section.name}" ${(zone.sections || []).includes(section.name) ? "selected" : ""}>
                  ${section.name}
                </option>
              `).join("")}
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Rows</label>
            <input
              type="text"
              class="zone-rows w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value="${(zone.rows || []).join(", ")}"
              placeholder="e.g., A, B, C"
              data-zone-index="${index}"
            />
          </div>
        </div>
        <button
          type="button"
          class="remove-zone-btn p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
          data-zone-index="${index}"
          title="Remove zone"
        >
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    },

    /**
     * Render action buttons
     * @returns {string}
     */
    renderActions() {
        return `
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
        <div class="flex items-center justify-between">
          <button
            type="button"
            id="venue-cancel-btn"
            class="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium text-gray-700 shadow-sm hover:shadow"
          >
            <i class="fas fa-times mr-2"></i>Cancel
          </button>
          <div class="flex items-center gap-3">
            <button
              type="button"
              id="venue-preview-btn"
              class="px-6 py-3 border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all font-medium shadow-sm hover:shadow"
            >
              <i class="fas fa-eye mr-2"></i>Preview
            </button>
            <button
              type="button"
              id="venue-save-btn"
              class="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-semibold shadow-md hover:shadow-lg"
            >
              <i class="fas fa-save mr-2"></i>Save Venue
            </button>
          </div>
        </div>
      </div>
    `;
    },

    /**
     * Mark form as dirty (has unsaved changes)
     */
    markDirty() {
        this.isDirty = true;
    },

    /**
     * Validate form data
     * @returns {boolean} True if valid
     */
    validate() {
        this.validationErrors = {};

        // Validate basic venue info
        if (!this.formData.name || this.formData.name.trim() === "") {
            this.validationErrors.name = "Venue name is required";
        }

        // Validate layout
        if (!this.formData.layout || !this.formData.layout.sections || this.formData.layout.sections.length === 0) {
            this.validationErrors.layout = "At least one section is required";
        }

        // Validate sections
        if (this.formData.layout && this.formData.layout.sections) {
            this.formData.layout.sections.forEach((section, index) => {
                if (!section.name || section.name.trim() === "") {
                    this.validationErrors[`section_${index}_name`] = "Section name is required";
                }
                if (!section.rows || section.rows < 1) {
                    this.validationErrors[`section_${index}_rows`] = "At least 1 row is required";
                }
                if (!section.seatsPerRow || section.seatsPerRow < 1) {
                    this.validationErrors[`section_${index}_seats`] = "At least 1 seat per row is required";
                }

                // Validate pattern strings in row configs
                if (section.rowsConfig) {
                    section.rowsConfig.forEach((rowConfig, rowIndex) => {
                        if (rowConfig.pattern && !this.validatePattern(rowConfig.pattern)) {
                            this.validationErrors[`section_${index}_row_${rowIndex}_pattern`] =
                                "Pattern must only contain S, H, and E characters";
                        }
                    });
                }

                // Validate numbering
                if (section.seatNumbering) {
                    const numbering = section.seatNumbering;
                    if (numbering.startNumber && (numbering.startNumber < 1 || numbering.startNumber > 500)) {
                        this.validationErrors[`section_${index}_start_number`] =
                            "Start number must be between 1 and 500";
                    }
                    if (numbering.prefix && numbering.prefix.length > 5) {
                        this.validationErrors[`section_${index}_prefix`] =
                            "Prefix must be 5 characters or less";
                    }
                    if (numbering.suffix && numbering.suffix.length > 5) {
                        this.validationErrors[`section_${index}_suffix`] =
                            "Suffix must be 5 characters or less";
                    }
                }
            });
        }

        // Validate pricing tiers
        if (this.formData.priceTiers) {
            this.formData.priceTiers.forEach((tier, index) => {
                if (!tier.name || tier.name.trim() === "") {
                    this.validationErrors[`tier_${index}_name`] = "Tier name is required";
                }
                if (tier.basePrice === undefined || tier.basePrice < 0) {
                    this.validationErrors[`tier_${index}_price`] = "Base price must be 0 or greater";
                }
            });
        }

        // Validate pricing zones
        if (this.formData.pricingZones) {
            this.formData.pricingZones.forEach((zone, index) => {
                if (!zone.id || zone.id.trim() === "") {
                    this.validationErrors[`zone_${index}_id`] = "Zone ID is required";
                }
                if (!zone.name || zone.name.trim() === "") {
                    this.validationErrors[`zone_${index}_name`] = "Zone name is required";
                }
            });
        }

        return Object.keys(this.validationErrors).length === 0;
    },

    /**
     * Validate pattern string (only S, H, E characters allowed)
     * @param {string} pattern
     * @returns {boolean}
     */
    validatePattern(pattern) {
        if (!pattern || pattern.trim() === "") {
            return true; // Empty pattern is valid
        }
        return /^[SHE]+$/i.test(pattern.trim());
    },

    /**
     * Show validation errors to user
     * @returns {string} HTML string with error messages
     */
    showValidationErrors() {
        if (Object.keys(this.validationErrors).length === 0) {
            return "";
        }

        const errorMessages = Object.entries(this.validationErrors)
            .map(([key, message]) => `<li class="text-sm">${message}</li>`)
            .join("");

        return `
      <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div class="flex items-start gap-3">
          <i class="fas fa-exclamation-circle text-red-600 text-lg mt-0.5"></i>
          <div class="flex-1">
            <h4 class="text-sm font-semibold text-red-900 mb-2">Validation Errors</h4>
            <ul class="list-disc list-inside text-red-800 space-y-1">
              ${errorMessages}
            </ul>
          </div>
        </div>
      </div>
    `;
    },

    /**
     * Get form data
     * @returns {Object}
     */
    getData() {
        return this.formData;
    },

    /**
     * Set form data
     * @param {Object} data
     */
    setData(data) {
        this.formData = data;
    },

    /**
     * Save venue data to backend
     * @returns {Promise<Object>} Saved venue data
     */
    async save() {
        // Validate before saving
        if (!this.validate()) {
            throw new Error("Validation failed");
        }

        const isEdit = !!this.formData.id;
        const url = isEdit
            ? `/api/venues/${this.formData.id}`
            : "/api/venues";
        const method = isEdit ? "PUT" : "POST";

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(this.formData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to save venue");
            }

            const savedVenue = await response.json();
            this.isDirty = false;
            return savedVenue;
        } catch (error) {
            console.error("Error saving venue:", error);
            throw error;
        }
    },

    /**
     * Handle save button click
     * @param {Function} onSuccess - Callback on successful save
     * @param {Function} onError - Callback on error
     */
    async handleSave(onSuccess, onError) {
        try {
            const savedVenue = await this.save();
            if (onSuccess) {
                onSuccess(savedVenue);
            }
        } catch (error) {
            if (onError) {
                onError(error);
            }
        }
    },

    /**
     * Show success message
     * @param {string} message
     */
    showSuccess(message) {
        return `
      <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div class="flex items-start gap-3">
          <i class="fas fa-check-circle text-green-600 text-lg mt-0.5"></i>
          <div class="flex-1">
            <h4 class="text-sm font-semibold text-green-900">${message}</h4>
          </div>
        </div>
      </div>
    `;
    },

    /**
     * Show error message
     * @param {string} message
     */
    showError(message) {
        return `
      <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div class="flex items-start gap-3">
          <i class="fas fa-times-circle text-red-600 text-lg mt-0.5"></i>
          <div class="flex-1">
            <h4 class="text-sm font-semibold text-red-900">${message}</h4>
          </div>
        </div>
      </div>
    `;
    },
};
