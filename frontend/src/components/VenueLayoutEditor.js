import { VenueLayoutEditorSVG } from "./VenueLayoutEditorSVG.js";

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
    const section = config.sections[currentIndex] || {};
    return `
      <div class="bg-white border rounded-lg p-4 space-y-4">
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
        
        ${config.sections.length > 0 ? `
        <div class="border-t pt-4">
          <h3 class="text-sm font-semibold text-gray-700 mb-3">Section Configuration</h3>
          <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div class="col-span-2">
              <label class="block text-xs font-medium text-gray-700 mb-1">Section Name</label>
              <input type="text" id="section-name" class="border rounded-md px-3 py-2 text-sm w-full focus:ring-indigo-500 focus:border-indigo-500" value="${section.name || ""}" placeholder="e.g., Orchestra Stalls">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Rows</label>
              <input type="number" id="section-rows" class="border rounded-md px-3 py-2 text-sm w-full focus:ring-indigo-500 focus:border-indigo-500" value="${section.rows || 10}" min="1" max="100">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Seats/Row</label>
              <input type="number" id="section-seats-per-row" class="border rounded-md px-3 py-2 text-sm w-full focus:ring-indigo-500 focus:border-indigo-500" value="${section.seatsPerRow || 20}" min="1" max="200">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Tier</label>
              <select id="section-tier" class="border rounded-md px-3 py-2 text-sm w-full focus:ring-indigo-500 focus:border-indigo-500">
                <option value="vip" ${section.tier === "vip" ? "selected" : ""}>VIP</option>
                <option value="premium" ${section.tier === "premium" ? "selected" : ""}>Premium</option>
                <option value="standard" ${section.tier === "standard" ? "selected" : ""}>Standard</option>
                <option value="economy" ${section.tier === "economy" ? "selected" : ""}>Economy</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Start Row</label>
              <input type="text" id="section-start-row" class="border rounded-md px-3 py-2 text-sm w-full focus:ring-indigo-500 focus:border-indigo-500" value="${section.startRow || "A"}" maxlength="3" placeholder="A">
            </div>
          </div>
        </div>
        ` : ""}
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
              ? "<i class=\"fas fa-cog text-indigo-600 float-right\"></i>"
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
            <button type="button" id="zoom-in-btn" class="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded" title="Zoom In (+)">
              <i class="fas fa-search-plus"></i>
            </button>
            <button type="button" id="zoom-out-btn" class="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded" title="Zoom Out (-)">
              <i class="fas fa-search-minus"></i>
            </button>
            <button type="button" id="refresh-preview-btn" class="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700" title="Refresh Preview (R)">
              <i class="fas fa-sync mr-1"></i>Refresh
            </button>
          </div>
        </div>
        
        <div id="layout-preview" class="relative bg-slate-50 border rounded-lg p-4 overflow-auto" style="height: 600px;">
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
          "<span class=\"px-2 py-1 bg-gray-200 text-gray-500 text-xs rounded line-through\">SKIP</span>"
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

  attachEventHandlers(container, stateManager) {
    const $container = $(container);

    $container.on("click", ".layout-tab", function() {
      const tab = $(this).data("tab");
      $container.find(".layout-tab").removeClass("border-b-2 border-indigo-600");
      $(this).addClass("border-b-2 border-indigo-600");

      const section = stateManager.getCurrentSection();
      let content = "";

      if (tab === "aisles") {
        content = VenueLayoutEditor.createAislesTab(section);
      } else if (tab === "numbering") {
        content = VenueLayoutEditor.createNumberingTab(section);
      } else if (tab === "per-row") {
        content = VenueLayoutEditor.createPerRowTab(section);
      }

      $container.find("#tab-content").html(content);
      stateManager.setActiveTab(tab);
    });

    $container.on("click", "#add-section-btn", function() {
      stateManager.addSection();
      const config = stateManager.getConfig();
      const currentIndex = stateManager.getCurrentSectionIndex();
      
      const $selectorContainer = $container.find("#section-selector").closest(".bg-white.border.rounded-lg");
      $selectorContainer.replaceWith(VenueLayoutEditor.createSectionSelector(config, currentIndex));

      const section = stateManager.getCurrentSection();
      const activeTab = stateManager.getActiveTab();
      let content = "";
      if (activeTab === "aisles") {
        content = VenueLayoutEditor.createAislesTab(section);
      } else if (activeTab === "numbering") {
        content = VenueLayoutEditor.createNumberingTab(section);
      } else if (activeTab === "per-row") {
        content = VenueLayoutEditor.createPerRowTab(section);
      }
      $container.find("#tab-content").html(content);

      stateManager.updatePreview();
    });

    $container.on("click", "#remove-section-btn", function() {
      stateManager.removeSection();
      const config = stateManager.getConfig();
      const currentIndex = stateManager.getCurrentSectionIndex();
      
      const $selectorContainer = $container.find("#section-selector").closest(".bg-white.border.rounded-lg");
      $selectorContainer.replaceWith(VenueLayoutEditor.createSectionSelector(config, currentIndex));

      const section = stateManager.getCurrentSection();
      if (section) {
        const activeTab = stateManager.getActiveTab();
        let content = "";
        if (activeTab === "aisles") {
          content = VenueLayoutEditor.createAislesTab(section);
        } else if (activeTab === "numbering") {
          content = VenueLayoutEditor.createNumberingTab(section);
        } else if (activeTab === "per-row") {
          content = VenueLayoutEditor.createPerRowTab(section);
        }
        $container.find("#tab-content").html(content);
      } else {
        $container.find("#tab-content").html(`
          <div class="bg-white border rounded-b-lg p-8 text-center text-gray-500">
            <i class="fas fa-inbox text-4xl mb-2"></i>
            <p>No sections available. Click "Add Section" to start.</p>
          </div>
        `);
      }

      stateManager.updatePreview();
    });

    $container.on("change", "#section-selector", function() {
      const newIndex = parseInt($(this).val(), 10);
      stateManager.setCurrentSectionIndex(newIndex);
      const section = stateManager.getCurrentSection();
      const config = stateManager.getConfig();
      
      $container.find("#section-selector").parent().parent().parent().html(
        VenueLayoutEditor.createSectionSelector(config, newIndex)
      );
      
      const activeTab = stateManager.getActiveTab();

      let content = "";
      if (activeTab === "aisles") {
        content = VenueLayoutEditor.createAislesTab(section);
      } else if (activeTab === "numbering") {
        content = VenueLayoutEditor.createNumberingTab(section);
      } else if (activeTab === "per-row") {
        content = VenueLayoutEditor.createPerRowTab(section);
      }

      $container.find("#tab-content").html(content);
      stateManager.updatePreview();
    });

    $container.on("change", "#section-name", function() {
      const section = stateManager.getCurrentSection();
      if (section) {
        section.name = $(this).val().trim();
        const config = stateManager.getConfig();
        const currentIndex = stateManager.getCurrentSectionIndex();
        $container.find("#section-selector").html(
          config.sections.map((s, idx) => 
            `<option value="${idx}" ${idx === currentIndex ? "selected" : ""}>${s.name}</option>`
          ).join("")
        );
        stateManager.updatePreview();
      }
    });

    $container.on("change", "#section-rows", function() {
      const section = stateManager.getCurrentSection();
      if (section) {
        section.rows = parseInt($(this).val(), 10) || 1;
        stateManager.updatePreview();
      }
    });

    $container.on("change", "#section-seats-per-row", function() {
      const section = stateManager.getCurrentSection();
      if (section) {
        section.seatsPerRow = parseInt($(this).val(), 10) || 1;
        stateManager.updatePreview();
      }
    });

    $container.on("change", "#section-tier", function() {
      const section = stateManager.getCurrentSection();
      if (section) {
        section.tier = $(this).val();
        stateManager.updatePreview();
      }
    });

    $container.on("change", "#section-start-row", function() {
      const section = stateManager.getCurrentSection();
      if (section) {
        section.startRow = $(this).val().trim().toUpperCase();
        stateManager.updatePreview();
      }
    });

    $container.on("click", "#add-aisle-btn", function() {
      const section = stateManager.getCurrentSection();
      if (!section.aisles) {
        section.aisles = [];
      }
      section.aisles.push({
        type: "vertical",
        mode: "afterSeat",
        position: 0,
        width: 1.0,
        label: ""
      });
      $container.find("#tab-content").html(VenueLayoutEditor.createAislesTab(section));
      stateManager.updatePreview();
    });

    $container.on("click", ".remove-aisle-btn", function() {
      const index = $(this).closest("[data-aisle-index]").data("aisle-index");
      const section = stateManager.getCurrentSection();
      section.aisles.splice(index, 1);
      $container.find("#tab-content").html(VenueLayoutEditor.createAislesTab(section));
      stateManager.updatePreview();
    });

    $container.on("change", ".aisle-type", function() {
      const $aisleItem = $(this).closest("[data-aisle-index]");
      const index = $aisleItem.data("aisle-index");
      const section = stateManager.getCurrentSection();
      if (section && section.aisles && section.aisles[index]) {
        section.aisles[index].type = $(this).val();
        stateManager.refreshAislesTab();
        stateManager.updatePreview();
      }
    });

    $container.on("change", ".aisle-position", function() {
      const $aisleItem = $(this).closest("[data-aisle-index]");
      const index = $aisleItem.data("aisle-index");
      const section = stateManager.getCurrentSection();
      if (section && section.aisles && section.aisles[index]) {
        const position = parseInt($(this).val(), 10);
        const maxPosition = section.aisles[index].type === "vertical" 
          ? section.seatsPerRow 
          : section.rows;
        
        if (!isNaN(position) && position >= 0 && position < maxPosition) {
          section.aisles[index].position = position;
          $(this).removeClass("border-red-500");
          $aisleItem.removeClass("border-red-300 bg-red-50");
        } else {
          $(this).addClass("border-red-500");
          $aisleItem.addClass("border-red-300 bg-red-50");
        }
        stateManager.updatePreview();
      }
    });

    $container.on("change", ".aisle-width", function() {
      const $aisleItem = $(this).closest("[data-aisle-index]");
      const index = $aisleItem.data("aisle-index");
      const section = stateManager.getCurrentSection();
      if (section && section.aisles && section.aisles[index]) {
        const width = parseFloat($(this).val());
        if (!isNaN(width) && width >= 0.5 && width <= 10) {
          section.aisles[index].width = width;
        }
        stateManager.updatePreview();
      }
    });

    $container.on("change", ".aisle-label", function() {
      const $aisleItem = $(this).closest("[data-aisle-index]");
      const index = $aisleItem.data("aisle-index");
      const section = stateManager.getCurrentSection();
      if (section && section.aisles && section.aisles[index]) {
        section.aisles[index].label = $(this).val().trim();
        stateManager.updatePreview();
      }
    });

    $container.on("change", "#global-direction", function() {
      const section = stateManager.getCurrentSection();
      if (section) {
        if (!section.seatNumbering) {
          section.seatNumbering = {
            globalDirection: "L_TO_R",
            startNumber: 1,
            prefix: "",
            suffix: "",
            skipNumbers: [],
            skipSeatIndices: []
          };
        }
        section.seatNumbering.globalDirection = $(this).val();
        $container.find("#numbering-preview").html(VenueLayoutEditor.generateNumberingPreview(section));
        stateManager.updatePreview();
      }
    });

    $container.on("change", "#start-number", function() {
      const section = stateManager.getCurrentSection();
      if (section) {
        if (!section.seatNumbering) {
          section.seatNumbering = {
            globalDirection: "L_TO_R",
            startNumber: 1,
            prefix: "",
            suffix: "",
            skipNumbers: [],
            skipSeatIndices: []
          };
        }
        const value = parseInt($(this).val(), 10);
        if (!isNaN(value) && value > 0) {
          section.seatNumbering.startNumber = value;
        }
        $container.find("#numbering-preview").html(VenueLayoutEditor.generateNumberingPreview(section));
        stateManager.updatePreview();
      }
    });

    $container.on("change", "#seat-prefix", function() {
      const section = stateManager.getCurrentSection();
      if (section) {
        if (!section.seatNumbering) {
          section.seatNumbering = {
            globalDirection: "L_TO_R",
            startNumber: 1,
            prefix: "",
            suffix: "",
            skipNumbers: [],
            skipSeatIndices: []
          };
        }
        section.seatNumbering.prefix = $(this).val().trim();
        $container.find("#numbering-preview").html(VenueLayoutEditor.generateNumberingPreview(section));
        stateManager.updatePreview();
      }
    });

    $container.on("change", "#seat-suffix", function() {
      const section = stateManager.getCurrentSection();
      if (section) {
        if (!section.seatNumbering) {
          section.seatNumbering = {
            globalDirection: "L_TO_R",
            startNumber: 1,
            prefix: "",
            suffix: "",
            skipNumbers: [],
            skipSeatIndices: []
          };
        }
        section.seatNumbering.suffix = $(this).val().trim();
        $container.find("#numbering-preview").html(VenueLayoutEditor.generateNumberingPreview(section));
        stateManager.updatePreview();
      }
    });

    $container.on("click", "#add-skip-number-btn", function() {
      const value = parseInt($container.find("#skip-number-input").val(), 10);
      if (!isNaN(value) && value > 0) {
        const section = stateManager.getCurrentSection();
        if (section) {
          if (!section.seatNumbering) {
            section.seatNumbering = {
              globalDirection: "L_TO_R",
              startNumber: 1,
              prefix: "",
              suffix: "",
              skipNumbers: [],
              skipSeatIndices: []
            };
          }
          if (!section.seatNumbering.skipNumbers) {
            section.seatNumbering.skipNumbers = [];
          }
          if (!section.seatNumbering.skipNumbers.includes(value)) {
            section.seatNumbering.skipNumbers.push(value);
            $container.find("#skip-number-input").val("");
            $container.find("#tab-content").html(VenueLayoutEditor.createNumberingTab(section));
            stateManager.updatePreview();
          }
        }
      }
    });

    $container.on("click", "#add-skip-index-btn", function() {
      const value = parseInt($container.find("#skip-index-input").val(), 10);
      const section = stateManager.getCurrentSection();
      if (section && !isNaN(value) && value >= 0 && value < section.seatsPerRow) {
        if (!section.seatNumbering) {
          section.seatNumbering = {
            globalDirection: "L_TO_R",
            startNumber: 1,
            prefix: "",
            suffix: "",
            skipNumbers: [],
            skipSeatIndices: []
          };
        }
        if (!section.seatNumbering.skipSeatIndices) {
          section.seatNumbering.skipSeatIndices = [];
        }
        if (!section.seatNumbering.skipSeatIndices.includes(value)) {
          section.seatNumbering.skipSeatIndices.push(value);
          $container.find("#skip-index-input").val("");
          $container.find("#tab-content").html(VenueLayoutEditor.createNumberingTab(section));
          stateManager.updatePreview();
        }
      }
    });

    $container.on("click", "#refresh-preview-btn", function() {
      stateManager.updatePreview();
    });

    $container.on("click", "#zoom-in-btn", function() {
      stateManager.zoomIn();
    });

    $container.on("click", "#zoom-out-btn", function() {
      stateManager.zoomOut();
    });
  },

  extractLayoutData(container) {
    const $container = $(container);
    const sections = [];

    $container.find("[data-section-index]").each(function() {
      const $section = $(this);

      const name = $section.find(".section-name").val() || "";
      const rows = parseInt($section.find(".section-rows").val(), 10) || 0;
      const seatsPerRow = parseInt($section.find(".section-seats-per-row").val(), 10) || 0;
      const tier = $section.find(".section-tier").val() || "standard";
      const startRow = $section.find(".section-start-row").val() || "A";

      const aisles = [];
      $section.find("[data-aisle-index]").each(function() {
        const $aisle = $(this);
        aisles.push({
          type: $aisle.find(".aisle-type").val(),
          mode: $aisle.find(".aisle-mode").val(),
          position: parseInt($aisle.find(".aisle-position").val(), 10),
          width: parseFloat($aisle.find(".aisle-width").val()),
          label: $aisle.find(".aisle-label").val() || ""
        });
      });

      const seatNumbering = {
        globalDirection: $section.find("#global-direction").val() || "L_TO_R",
        startNumber: parseInt($section.find("#start-number").val(), 10) || 1,
        prefix: $section.find("#seat-prefix").val() || "",
        suffix: $section.find("#seat-suffix").val() || "",
        skipNumbers: [],
        skipSeatIndices: []
      };

      $section.find("#skip-numbers-container span").each(function() {
        const num = parseInt($(this).text().trim(), 10);
        if (!isNaN(num)) {
          seatNumbering.skipNumbers.push(num);
        }
      });

      $section.find("#skip-indices-container span").each(function() {
        const idx = parseInt($(this).text().trim(), 10);
        if (!isNaN(idx)) {
          seatNumbering.skipSeatIndices.push(idx);
        }
      });

      sections.push({
        name,
        rows,
        seatsPerRow,
        tier,
        startRow,
        seatNumbering,
        aisles,
        rowsConfig: [],
        horizontalAisles: []
      });
    });

    return {
      sections: sections.length > 0 ? sections : []
    };
  },

  updatePreview(container, section, zoomLevel = 1) {
    const $container = $(container);
    const $preview = $container.find("#layout-preview");

    if (!section || !section.rows || !section.seatsPerRow) {
      $preview.html(`
        <div class="text-center text-gray-500 py-8">
          <i class="fas fa-exclamation-triangle text-4xl mb-2"></i>
          <p>Invalid section configuration</p>
        </div>
      `);
      return;
    }

    const seatSize = 32 * zoomLevel;
    const seatGap = 3 * zoomLevel;
    const aisleWidth = 30 * zoomLevel;
    const rowGap = 2 * zoomLevel;

    const aisles = section.aisles || [];
    const verticalAisles = aisles.filter(a => a.type === "vertical").sort((a, b) => a.position - b.position);
    const horizontalAisles = aisles.filter(a => a.type === "horizontal").sort((a, b) => a.position - b.position);

    const numbering = section.seatNumbering || {
      globalDirection: "L_TO_R",
      startNumber: 1,
      prefix: "",
      suffix: "",
      skipNumbers: [],
      skipSeatIndices: []
    };

    const skipIndices = new Set(numbering.skipSeatIndices || []);
    const skipNumbers = new Set(numbering.skipNumbers || []);

    const capacity = this.calculateSectionCapacity(section);
    const totalSeats = section.rows * section.seatsPerRow;
    const aisleCount = verticalAisles.length;

    const tierColors = {
      vip: { bg: "bg-purple-100", border: "border-purple-400", text: "text-purple-700" },
      premium: { bg: "bg-blue-100", border: "border-blue-400", text: "text-blue-700" },
      standard: { bg: "bg-green-100", border: "border-green-400", text: "text-green-700" },
      economy: { bg: "bg-gray-100", border: "border-gray-400", text: "text-gray-700" }
    };

    const tierColor = tierColors[section.tier] || tierColors.standard;

    let html = `
      <div class="mb-4 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border-2 border-slate-200 shadow-sm">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2">
              <i class="fas fa-theater-masks text-indigo-600 text-lg"></i>
              <span class="font-bold text-lg text-gray-800">${section.name}</span>
            </div>
            <span class="px-3 py-1 ${tierColor.bg} ${tierColor.border} ${tierColor.text} text-xs font-semibold rounded-full border">
              ${section.tier.toUpperCase()}
            </span>
          </div>
          <div class="text-right">
            <div class="text-xs text-gray-500">Effective Capacity</div>
            <div class="text-2xl font-bold text-indigo-600">${capacity}</div>
          </div>
        </div>
        <div class="grid grid-cols-4 gap-3 text-xs">
          <div class="bg-white rounded px-3 py-2 border border-slate-200">
            <div class="text-gray-500">Rows</div>
            <div class="font-semibold text-gray-800">${section.rows}</div>
          </div>
          <div class="bg-white rounded px-3 py-2 border border-slate-200">
            <div class="text-gray-500">Seats/Row</div>
            <div class="font-semibold text-gray-800">${section.seatsPerRow}</div>
          </div>
          <div class="bg-white rounded px-3 py-2 border border-slate-200">
            <div class="text-gray-500">Aisles</div>
            <div class="font-semibold text-gray-800">${aisleCount}</div>
          </div>
          <div class="bg-white rounded px-3 py-2 border border-slate-200">
            <div class="text-gray-500">Total Seats</div>
            <div class="font-semibold text-gray-800">${totalSeats}</div>
          </div>
        </div>
      </div>
      
      <div class="mb-3 flex items-center gap-4 text-xs">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 ${tierColor.bg} ${tierColor.border} border rounded"></div>
          <span class="text-gray-600">Available Seat</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 bg-red-100 border-red-300 border rounded"></div>
          <span class="text-gray-600">Skipped Number</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 border-2 border-dashed border-gray-300 bg-gray-50 rounded"></div>
          <span class="text-gray-600">Skipped Seat</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 bg-amber-50 border-amber-300 border-2 rounded"></div>
          <span class="text-gray-600">Aisle</span>
        </div>
      </div>
      
      <div class="bg-slate-800 rounded-lg p-2 mb-4 text-center">
        <div class="text-white text-xs font-semibold tracking-wider">
          <i class="fas fa-film mr-2"></i>STAGE / SCREEN
        </div>
      </div>
      
      <div class="relative overflow-auto" style="max-height: 500px;">
        <div style="transform: scale(${zoomLevel}); transform-origin: top left; display: inline-block;">
    `;

    const rowLabels = this.generateRowLabels(section);

    for (let rowIdx = 0; rowIdx < section.rows; rowIdx++) {
      const rowLabel = rowLabels[rowIdx];

      const horizontalAisleAfterRow = horizontalAisles.find(a => a.position === rowIdx);

      html += `<div class="flex items-center" style="margin-bottom: ${rowGap}px;">`;
      html += `<div style="width: 40px; min-width: 40px;" class="text-xs font-bold text-gray-700 text-center mr-2 bg-slate-100 rounded px-2 py-1">${rowLabel}</div>`;
      html += "<div class=\"flex items-center\">";

      for (let seatIdx = 0; seatIdx < section.seatsPerRow; seatIdx++) {
        const aisleAtPosition = verticalAisles.find(a => a.position === seatIdx);

        if (aisleAtPosition) {
          const aisleWidthPx = aisleWidth * (aisleAtPosition.width || 1);
          html += `<div style="width: ${aisleWidthPx}px; height: ${seatSize}px; margin: 0 ${seatGap}px;" 
            class="flex flex-col items-center justify-center bg-amber-50 border-2 border-amber-300 rounded relative"
            title="Aisle: ${aisleAtPosition.label || "Unnamed"} (Width: ${aisleAtPosition.width})">
            <div class="text-xs text-amber-700 font-semibold" style="writing-mode: vertical-rl; transform: rotate(180deg);">
              ${aisleAtPosition.label || "AISLE"}
            </div>
          </div>`;
        }

        const effectiveIndex = numbering.globalDirection === "R_TO_L"
          ? section.seatsPerRow - 1 - seatIdx
          : seatIdx;
        const seatNumber = numbering.startNumber + effectiveIndex;
        const isSkipped = skipIndices.has(seatIdx);
        const isSkippedNumber = skipNumbers.has(seatNumber);

        if (isSkipped) {
          html += `<div style="width: ${seatSize}px; height: ${seatSize}px; margin-right: ${seatGap}px;" 
            class="border-2 border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors"
            title="Skipped seat at index ${seatIdx}">
            <span class="text-xs text-gray-400 font-bold">×</span>
          </div>`;
        } else {
          const displayLabel = `${numbering.prefix}${seatNumber}${numbering.suffix}`;
          const seatBg = isSkippedNumber ? "bg-red-100 hover:bg-red-200" : `${tierColor.bg} hover:brightness-95`;
          const seatBorder = isSkippedNumber ? "border-red-400" : tierColor.border;
          const seatText = isSkippedNumber ? "text-red-700" : tierColor.text;

          html += `<div style="width: ${seatSize}px; height: ${seatSize}px; margin-right: ${seatGap}px;" 
            class="border-2 ${seatBorder} ${seatBg} rounded flex items-center justify-center transition-all cursor-pointer shadow-sm hover:shadow-md"
            title="Seat ${rowLabel}${displayLabel}${isSkippedNumber ? " (Skipped Number)" : ""}">
            <span class="text-xs font-mono font-semibold ${seatText}">${displayLabel}</span>
          </div>`;
        }
      }

      html += "</div>";
      html += `<div style="width: 40px; min-width: 40px;" class="text-xs font-bold text-gray-700 text-center ml-2 bg-slate-100 rounded px-2 py-1">${rowLabel}</div>`;
      html += "</div>";

      if (horizontalAisleAfterRow) {
        const hAisleHeight = 20 * (horizontalAisleAfterRow.height || 1) * zoomLevel;
        html += `<div style="height: ${hAisleHeight}px; margin: ${seatGap}px 0;" 
          class="w-full bg-amber-50 border-2 border-amber-300 rounded flex items-center justify-center"
          title="Horizontal Aisle after row ${rowLabel}">
          <span class="text-xs text-amber-700 font-semibold">HORIZONTAL AISLE</span>
        </div>`;
      }
    }

    html += "</div></div>";

    $preview.html(html);

    $container.find("#effective-capacity").text(`${capacity} seats`);
  },

  updatePreviewSVG(container, section, zoomLevel, stateManager) {
    const $container = $(container);
    const $preview = $container.find("#layout-preview");

    const $toolbar = $preview.find("#floating-toolbar");
    const toolbarExists = $toolbar.length > 0;
    let toolbarHtml = "";
    
    if (toolbarExists) {
      toolbarHtml = $toolbar.prop("outerHTML");
    }

    const svgHtml = VenueLayoutEditorSVG.renderSVGPreview(section, zoomLevel);
    $preview.html(svgHtml);

    if (toolbarExists) {
      $preview.prepend(toolbarHtml);
    }

    const capacity = VenueLayoutEditorSVG.calculateCapacity(section);
    $container.find("#effective-capacity").text(`${capacity} seats`);

    const { initSeatMapPanzoom } = window;
    VenueLayoutEditorSVG.attachSVGInteractions($preview, section, stateManager, VenueLayoutEditor, initSeatMapPanzoom);
  },

  calculateSectionCapacity(section) {
    if (!section || !section.rows || !section.seatsPerRow) {
      return 0;
    }

    let capacity = section.rows * section.seatsPerRow;

    const skipIndices = section.seatNumbering?.skipSeatIndices || [];
    capacity -= skipIndices.length * section.rows;

    const rowsConfig = section.rowsConfig || [];
    rowsConfig.forEach(rowConfig => {
      const emptySeats = rowConfig.emptySeatIndices?.length || 0;
      capacity -= emptySeats;
    });

    return Math.max(0, capacity);
  },

  validateLayout(layout) {
    const errors = [];

    if (!layout || !layout.sections || layout.sections.length === 0) {
      errors.push({
        field: "sections",
        message: "At least one section is required"
      });
      return errors;
    }

    layout.sections.forEach((section, idx) => {
      if (!section.name || section.name.trim() === "") {
        errors.push({
          field: `sections[${idx}].name`,
          message: `Section ${idx + 1}: Name is required`
        });
      }

      if (!section.rows || typeof section.rows !== "number" || section.rows <= 0) {
        errors.push({
          field: `sections[${idx}].rows`,
          message: `Section ${idx + 1}: Rows must be a positive number`
        });
      }

      if (!section.seatsPerRow || typeof section.seatsPerRow !== "number" || section.seatsPerRow <= 0) {
        errors.push({
          field: `sections[${idx}].seatsPerRow`,
          message: `Section ${idx + 1}: Seats per row must be a positive number`
        });
      }

      if (section.aisles && Array.isArray(section.aisles)) {
        section.aisles.forEach((aisle, aisleIdx) => {
          if (typeof aisle.position !== "number" || aisle.position < 0) {
            errors.push({
              field: `sections[${idx}].aisles[${aisleIdx}].position`,
              message: `Section ${idx + 1}, Aisle ${aisleIdx + 1}: Position must be a non-negative number`
            });
          }

          if (aisle.type === "vertical" && aisle.position >= section.seatsPerRow) {
            errors.push({
              field: `sections[${idx}].aisles[${aisleIdx}].position`,
              message: `Section ${idx + 1}, Aisle ${aisleIdx + 1}: Position must be less than seats per row (${section.seatsPerRow})`
            });
          }

          if (aisle.type === "horizontal" && aisle.position >= section.rows) {
            errors.push({
              field: `sections[${idx}].aisles[${aisleIdx}].position`,
              message: `Section ${idx + 1}, Aisle ${aisleIdx + 1}: Position must be less than number of rows (${section.rows})`
            });
          }

          if (typeof aisle.width !== "number" || aisle.width < 0.5 || aisle.width > 10) {
            errors.push({
              field: `sections[${idx}].aisles[${aisleIdx}].width`,
              message: `Section ${idx + 1}, Aisle ${aisleIdx + 1}: Width must be between 0.5 and 10`
            });
          }
        });
      }

      if (section.seatNumbering) {
        const numbering = section.seatNumbering;

        if (numbering.startNumber && (typeof numbering.startNumber !== "number" || numbering.startNumber <= 0)) {
          errors.push({
            field: `sections[${idx}].seatNumbering.startNumber`,
            message: `Section ${idx + 1}: Start number must be a positive number`
          });
        }
      }
    });

    return errors;
  },
};
