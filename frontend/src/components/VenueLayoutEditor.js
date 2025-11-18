import { SeatNumberingSystem } from "@utils/SeatNumberingSystem.js";

export const VenueLayoutEditor = {
  create(layoutConfig = null, sectionIndex = 0) {
    const config = layoutConfig || { sections: [], globalAisles: [] };
    const section = config.sections[sectionIndex] || {
      name: "Main Section",
      rows: 10,
      seatsPerRow: 20,
      startRow: "A",
      seatNumbering: {
        globalDirection: "L_TO_R",
        startNumber: 1,
        prefix: "",
        suffix: "",
        skipNumbers: [],
        skipSeatIndices: [],
      },
      aisles: [],
      rowsConfig: [],
    };

    return `
      <div class="flex flex-col gap-6">
        ${this.createSectionSelector(config, sectionIndex)}
        ${this.createTabs()}
        <div id="tab-content" class="min-h-96">
          ${this.createAislesTab(section)}
        </div>
        ${this.createPreviewPanel(section, config)}
      </div>
    `;
  },

  createSectionSelector(config, currentIndex) {
    return `
      <div class="bg-white border rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Section</label>
            <select id="section-selector" class="border rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500">
              ${config.sections
        .map(
          (s, idx) =>
            `<option value="${idx}" ${idx === currentIndex ? "selected" : ""
            }>${s.name}</option>`
        )
        .join("")}
            </select>
          </div>
          <div class="flex gap-2">
            <button type="button" id="add-section-btn" class="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700">
              <i class="fas fa-plus mr-1"></i>Add Section
            </button>
            ${config.sections.length > 1
        ? `<button type="button" id="remove-section-btn" class="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700">
              <i class="fas fa-trash mr-1"></i>Remove
            </button>`
        : ""
      }
          </div>
        </div>
      </div>
    `;
  },

  createTabs() {
    return `
      <div class="flex border-b bg-white rounded-t-lg">
        <button type="button" class="layout-tab px-4 py-2 text-sm font-medium hover:bg-gray-100 border-b-2 border-indigo-600" data-tab="aisles">
          <i class="fas fa-th-large mr-1"></i>Aisles
        </button>
        <button type="button" class="layout-tab px-4 py-2 text-sm font-medium hover:bg-gray-100" data-tab="numbering">
          <i class="fas fa-sort-numeric-down mr-1"></i>Numbering
        </button>
        <button type="button" class="layout-tab px-4 py-2 text-sm font-medium hover:bg-gray-100" data-tab="per-row">
          <i class="fas fa-cog mr-1"></i>Per-Row Override
        </button>
      </div>
    `;
  },

  createAislesTab(section) {
    const aisles = section.aisles || [];
    return `
      <div class="bg-white border rounded-b-lg p-4 space-y-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">Aisles Configuration</h3>
          <button type="button" id="add-aisle-btn" class="px-3 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700">
            <i class="fas fa-plus mr-1"></i>Add Aisle
          </button>
        </div>

        <div id="aisles-list" class="space-y-3">
          ${aisles.length === 0
        ? `<div class="text-center text-gray-500 py-8">
              <i class="fas fa-th-large text-4xl mb-2"></i>
              <p>No aisles configured. Click "Add Aisle" to start.</p>
            </div>`
        : aisles
          .map((aisle, idx) =>
            this.createAisleItem(aisle, idx, section)
          )
          .join("")
      }
        </div>
      </div>
    `;
  },

  createAisleItem(aisle, index, section) {
    const maxPosition =
      aisle.mode === "afterSeat" ? section.seatsPerRow : section.rows;
    const isInvalid = aisle.position >= maxPosition;

    return `
      <div class="border rounded-lg p-4 ${isInvalid ? "border-red-300 bg-red-50" : "border-gray-200"
      }" data-aisle-index="${index}">
        <div class="grid grid-cols-5 gap-3 items-center">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Type</label>
            <select class="aisle-type border rounded-md px-2 py-1 text-sm w-full focus:ring-indigo-500 focus:border-indigo-500">
              <option value="vertical" ${aisle.type === "vertical" ? "selected" : ""
      }>Vertical</option>
              <option value="horizontal" ${aisle.type === "horizontal" ? "selected" : ""
      }>Horizontal</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Mode</label>
            <input type="text" class="aisle-mode border rounded-md px-2 py-1 text-sm w-full bg-gray-100" value="${aisle.mode
      }" readonly>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Position</label>
            <input type="number" class="aisle-position border rounded-md px-2 py-1 text-sm w-full focus:ring-indigo-500 focus:border-indigo-500 ${isInvalid ? "border-red-500" : ""
      }" value="${aisle.position}" min="0" max="${maxPosition - 1}">
            ${isInvalid
        ? `<p class="text-xs text-red-600 mt-1">Max: ${maxPosition - 1
        }</p>`
        : ""
      }
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Width</label>
            <input type="number" class="aisle-width border rounded-md px-2 py-1 text-sm w-full focus:ring-indigo-500 focus:border-indigo-500" value="${aisle.width
      }" min="0.5" max="10" step="0.5">
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Label</label>
            <div class="flex gap-1">
              <input type="text" class="aisle-label border rounded-md px-2 py-1 text-sm flex-1 focus:ring-indigo-500 focus:border-indigo-500" value="${aisle.label || ""
      }" maxlength="8">
              <button type="button" class="remove-aisle-btn px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  createNumberingTab(section) {
    const numbering = section.seatNumbering || {
      globalDirection: "L_TO_R",
      startNumber: 1,
      prefix: "",
      suffix: "",
      skipNumbers: [],
      skipSeatIndices: [],
    };

    return `
      <div class="bg-white border rounded-b-lg p-4 space-y-4">
        <h3 class="text-lg font-semibold mb-4">Global Seat Numbering</h3>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Direction</label>
            <select id="global-direction" class="border rounded-md px-3 py-2 text-sm w-full focus:ring-indigo-500 focus:border-indigo-500">
              <option value="L_TO_R" ${numbering.globalDirection === "L_TO_R" ? "selected" : ""
      }>Left to Right</option>
              <option value="R_TO_L" ${numbering.globalDirection === "R_TO_L" ? "selected" : ""
      }>Right to Left</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Start Number</label>
            <input type="number" id="start-number" class="border rounded-md px-3 py-2 text-sm w-full focus:ring-indigo-500 focus:border-indigo-500" value="${numbering.startNumber
      }" min="1" max="500">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Prefix</label>
            <input type="text" id="seat-prefix" class="border rounded-md px-3 py-2 text-sm w-full focus:ring-indigo-500 focus:border-indigo-500" value="${numbering.prefix || ""
      }" maxlength="5" placeholder="e.g., S">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Suffix</label>
            <input type="text" id="seat-suffix" class="border rounded-md px-3 py-2 text-sm w-full focus:ring-indigo-500 focus:border-indigo-500" value="${numbering.suffix || ""
      }" maxlength="5" placeholder="e.g., -A">
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Skip Numbers (e.g., 13, 14)</label>
          <div id="skip-numbers-container" class="flex flex-wrap gap-2 bg-gray-50 p-2 rounded-md min-h-16">
            ${numbering.skipNumbers
        .map(
          (num) =>
            `<span class="inline-flex items-center bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-1 rounded">
                ${num}
                <button type="button" class="ml-1 text-indigo-500 hover:text-indigo-700" onclick="this.parentElement.remove()">×</button>
              </span>`
        )
        .join("")}
          </div>
          <div class="flex gap-2 mt-2">
            <input type="number" id="skip-number-input" class="border rounded-md px-3 py-2 text-sm flex-1 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Enter number to skip" min="1" max="500">
            <button type="button" id="add-skip-number-btn" class="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700">Add</button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Skip Seat Indices (0-based)</label>
          <div id="skip-indices-container" class="flex flex-wrap gap-2 bg-gray-50 p-2 rounded-md min-h-16">
            ${numbering.skipSeatIndices
        .map(
          (idx) =>
            `<span class="inline-flex items-center bg-amber-100 text-amber-700 text-xs font-medium px-2 py-1 rounded">
                ${idx}
                <button type="button" class="ml-1 text-amber-500 hover:text-amber-700" onclick="this.parentElement.remove()">×</button>
              </span>`
        )
        .join("")}
          </div>
          <div class="flex gap-2 mt-2">
            <input type="number" id="skip-index-input" class="border rounded-md px-3 py-2 text-sm flex-1 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Enter index to skip" min="0" max="${section.seatsPerRow - 1
      }">
            <button type="button" id="add-skip-index-btn" class="px-4 py-2 bg-amber-600 text-white text-sm rounded-md hover:bg-amber-700">Add</button>
          </div>
        </div>

        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 class="text-sm font-semibold text-gray-800 mb-2">
            <i class="fas fa-eye text-blue-600 mr-1"></i>Preview (First Row)
          </h4>
          <div id="numbering-preview" class="flex flex-wrap gap-1">
            ${this.generateNumberingPreview(section)}
          </div>
        </div>
      </div>
    `;
  },

  createPerRowTab(section) {
    const rowsConfig = section.rowsConfig || [];
    const allRowLabels = this.generateRowLabels(section);

    return `
      <div class="bg-white border rounded-b-lg p-4">
        <div class="grid grid-cols-3 gap-4">
          <div class="border-r pr-4">
            <h3 class="text-sm font-semibold mb-3">Rows</h3>
            <div id="row-list" class="space-y-1 max-h-96 overflow-auto">
              ${allRowLabels
        .map((label) => {
          const hasOverride = rowsConfig.some(
            (r) => r.rowLabel === label
          );
          return `
                  <button type="button" class="row-item w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 ${hasOverride
              ? "bg-indigo-50 border-l-4 border-indigo-600"
              : ""
            }" data-row-label="${label}">
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

          <div class="col-span-2" id="row-config-panel">
            <div class="text-center text-gray-500 py-8">
              <i class="fas fa-arrow-left text-4xl mb-2"></i>
              <p>Select a row to configure overrides</p>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  createRowConfigPanel(section, rowLabel) {
    const override = (section.rowsConfig || []).find(
      (r) => r.rowLabel === rowLabel
    );
    const config = override || {
      rowLabel,
      direction: section.seatNumbering?.globalDirection || "L_TO_R",
      startNumber: section.seatNumbering?.startNumber || 1,
      prefix: section.seatNumbering?.prefix || "",
      suffix: section.seatNumbering?.suffix || "",
      skipNumbers: [],
      skipSeatIndices: [],
      paddingStart: 0,
      paddingEnd: 0,
      emptySeatIndices: [],
    };

    return `
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Row ${rowLabel} Override</h3>
          ${override
        ? `<button type="button" id="remove-override-btn" class="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700">
            <i class="fas fa-trash mr-1"></i>Remove Override
          </button>`
        : ""
      }
        </div>

        <div class="bg-gray-50 p-4 rounded-lg space-y-3">
          <h4 class="text-sm font-semibold">Core Settings</h4>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Direction</label>
              <select class="row-direction border rounded-md px-2 py-1 text-sm w-full">
                <option value="L_TO_R" ${config.direction === "L_TO_R" ? "selected" : ""
      }>Left to Right</option>
                <option value="R_TO_L" ${config.direction === "R_TO_L" ? "selected" : ""
      }>Right to Left</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Start Number</label>
              <input type="number" class="row-start-number border rounded-md px-2 py-1 text-sm w-full" value="${config.startNumber
      }" min="1" max="500">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Prefix</label>
              <input type="text" class="row-prefix border rounded-md px-2 py-1 text-sm w-full" value="${config.prefix || ""
      }" maxlength="5">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Suffix</label>
              <input type="text" class="row-suffix border rounded-md px-2 py-1 text-sm w-full" value="${config.suffix || ""
      }" maxlength="5">
            </div>
          </div>
        </div>

        <details class="bg-gray-50 p-4 rounded-lg">
          <summary class="text-sm font-semibold cursor-pointer">Advanced Settings</summary>
          <div class="mt-3 space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Padding Start</label>
                <input type="number" class="row-padding-start border rounded-md px-2 py-1 text-sm w-full" value="${config.paddingStart
      }" min="0" max="20">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Padding End</label>
                <input type="number" class="row-padding-end border rounded-md px-2 py-1 text-sm w-full" value="${config.paddingEnd
      }" min="0" max="20">
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Skip Numbers</label>
              <div class="row-skip-numbers flex flex-wrap gap-1 bg-white p-2 rounded min-h-10">
                ${config.skipNumbers
        .map(
          (n) =>
            `<span class="inline-flex items-center bg-red-100 text-red-700 text-xs px-2 py-1 rounded">${n} <button type="button" class="ml-1" onclick="this.parentElement.remove()">×</button></span>`
        )
        .join("")}
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Empty Seat Indices</label>
              <div class="row-empty-indices flex flex-wrap gap-1 bg-white p-2 rounded min-h-10">
                ${config.emptySeatIndices
        .map(
          (i) =>
            `<span class="inline-flex items-center bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">${i} <button type="button" class="ml-1" onclick="this.parentElement.remove()">×</button></span>`
        )
        .join("")}
              </div>
            </div>
          </div>
        </details>

        <button type="button" id="save-row-config-btn" class="w-full px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700">
          <i class="fas fa-save mr-1"></i>Save Row Configuration
        </button>
      </div>
    `;
  },

  createPreviewPanel(section, config) {
    return `
      <div class="bg-white border rounded-lg p-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">Layout Preview</h3>
          <div class="flex gap-2">
            <button type="button" id="zoom-in-btn" class="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded">
              <i class="fas fa-search-plus"></i>
            </button>
            <button type="button" id="zoom-out-btn" class="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded">
              <i class="fas fa-search-minus"></i>
            </button>
            <button type="button" id="refresh-preview-btn" class="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700">
              <i class="fas fa-sync mr-1"></i>Refresh
            </button>
          </div>
        </div>
        <div id="layout-preview" class="relative bg-slate-50 border rounded-lg p-4 overflow-auto" style="height: 400px;">
          <div class="text-center text-gray-500 py-8">
            <i class="fas fa-image text-4xl mb-2"></i>
            <p>Preview will appear here</p>
          </div>
        </div>
        <div class="mt-3 text-sm text-gray-600">
          <span class="font-semibold">Effective Capacity:</span>
          <span id="effective-capacity">Calculating...</span>
        </div>
      </div>
    `;
  },

  generateRowLabels(section) {
    const labels = [];
    const startRow = section.startRow || "A";
    for (let i = 0; i < section.rows; i++) {
      labels.push(this.deriveRowLabel(startRow, i));
    }
    return labels;
  },

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

  generateNumberingPreview(section) {
    const numbering = section.seatNumbering || {};
    const direction = numbering.globalDirection || "L_TO_R";
    const startNumber = numbering.startNumber || 1;
    const prefix = numbering.prefix || "";
    const suffix = numbering.suffix || "";
    const skipNumbers = new Set(numbering.skipNumbers || []);
    const skipIndices = new Set(numbering.skipSeatIndices || []);

    const preview = [];
    const rowLabel = section.startRow || "A";

    for (let i = 0; i < Math.min(section.seatsPerRow, 20); i++) {
      const effectiveIndex =
        direction === "R_TO_L" ? section.seatsPerRow - 1 - i : i;
      const isSkipped = skipIndices.has(i);
      const seatNumber = startNumber + effectiveIndex;
      const isSkippedNumber = skipNumbers.has(seatNumber);

      if (isSkipped) {
        preview.push(
          `<span class="px-2 py-1 bg-gray-200 text-gray-500 text-xs rounded line-through">SKIP</span>`
        );
      } else if (isSkippedNumber) {
        preview.push(
          `<span class="px-2 py-1 bg-red-100 text-red-600 text-xs rounded">${rowLabel}${prefix}${seatNumber + 1
          }${suffix}</span>`
        );
      } else {
        preview.push(
          `<span class="px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-mono">${rowLabel}${prefix}${seatNumber}${suffix}</span>`
        );
      }
    }

    return preview.join("");
  },
};
