export const VenueLayoutEditorSVG = {
  createFloatingToolbar() {
    return `
      <div id="floating-toolbar" class="absolute top-4 left-4 rounded-xl shadow-2xl z-50 overflow-hidden" style="backdrop-filter: blur(12px); background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(249, 250, 251, 0.98) 100%); border: 1px solid rgba(99, 102, 241, 0.2); min-width: 220px;">
        <div class="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white cursor-move">
          <div class="w-8 h-8 rounded-lg bg-white bg-opacity-20 flex items-center justify-center">
            <i class="fas fa-tools text-sm"></i>
          </div>
          <div class="flex-1">
            <div class="text-sm font-bold tracking-wide">EDITOR TOOLS</div>
            <div class="text-xs opacity-80">Click & Edit</div>
          </div>
          <button type="button" id="toggle-toolbar-btn" class="w-6 h-6 rounded hover:bg-white hover:bg-opacity-20 flex items-center justify-center transition-all" title="Minimize toolbar">
            <i class="fas fa-chevron-up text-xs"></i>
          </button>
        </div>
        
        <div id="toolbar-content" class="p-2 space-y-1">
          <button type="button" id="tool-select-btn" class="tool-btn group w-full px-3 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm rounded-lg hover:from-indigo-700 hover:to-indigo-800 border-2 border-indigo-600 flex items-center justify-between transition-all shadow-md hover:shadow-lg transform hover:scale-105" data-tool="select" title="Select Tool - Default interaction mode">
            <span class="flex items-center gap-2">
              <i class="fas fa-mouse-pointer w-4"></i>
              <span class="font-medium">Select</span>
            </span>
            <kbd class="text-xs bg-indigo-500 bg-opacity-50 px-2 py-1 rounded font-mono">V</kbd>
          </button>
          
          <button type="button" id="tool-add-aisle-btn" class="tool-btn group w-full px-3 py-2.5 bg-white text-gray-700 text-sm rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border-2 border-gray-200 hover:border-indigo-300 flex items-center justify-between transition-all hover:shadow-md transform hover:scale-105" data-tool="add-aisle" title="Add Vertical Aisle - Click between seats">
            <span class="flex items-center gap-2">
              <i class="fas fa-grip-lines-vertical w-4 text-indigo-600"></i>
              <span class="font-medium">V-Aisle</span>
            </span>
            <kbd class="text-xs bg-gray-100 group-hover:bg-indigo-100 px-2 py-1 rounded font-mono transition-colors">A</kbd>
          </button>
          
          <button type="button" id="tool-add-h-aisle-btn" class="tool-btn group w-full px-3 py-2.5 bg-white text-gray-700 text-sm rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 border-2 border-gray-200 hover:border-purple-300 flex items-center justify-between transition-all hover:shadow-md transform hover:scale-105" data-tool="add-h-aisle" title="Add Horizontal Aisle - Click between rows">
            <span class="flex items-center gap-2">
              <i class="fas fa-grip-lines w-4 text-purple-600"></i>
              <span class="font-medium">H-Aisle</span>
            </span>
            <kbd class="text-xs bg-gray-100 group-hover:bg-purple-100 px-2 py-1 rounded font-mono transition-colors">H</kbd>
          </button>
          
          <button type="button" id="tool-skip-seat-btn" class="tool-btn group w-full px-3 py-2.5 bg-white text-gray-700 text-sm rounded-lg hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 border-2 border-gray-200 hover:border-red-300 flex items-center justify-between transition-all hover:shadow-md transform hover:scale-105" data-tool="skip-seat" title="Skip Seat - Click seats to toggle skip">
            <span class="flex items-center gap-2">
              <i class="fas fa-ban w-4 text-red-600"></i>
              <span class="font-medium">Skip Seat</span>
            </span>
            <kbd class="text-xs bg-gray-100 group-hover:bg-red-100 px-2 py-1 rounded font-mono transition-colors">S</kbd>
          </button>
          
          <button type="button" id="tool-edit-btn" class="tool-btn group w-full px-3 py-2.5 bg-white text-gray-700 text-sm rounded-lg hover:bg-gradient-to-r hover:from-amber-50 hover:to-yellow-50 border-2 border-gray-200 hover:border-amber-300 flex items-center justify-between transition-all hover:shadow-md transform hover:scale-105" data-tool="edit" title="Edit Mode - Click to edit or remove">
            <span class="flex items-center gap-2">
              <i class="fas fa-edit w-4 text-amber-600"></i>
              <span class="font-medium">Edit</span>
            </span>
            <kbd class="text-xs bg-gray-100 group-hover:bg-amber-100 px-2 py-1 rounded font-mono transition-colors">E</kbd>
          </button>
        </div>
        
        <div id="tool-status" class="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-indigo-100">
          <div class="flex items-center gap-2 text-xs">
            <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span id="tool-status-text" class="text-gray-700 font-medium">Select tool active</span>
          </div>
        </div>
        
        <div class="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div class="flex items-center gap-2 mb-2">
            <i class="fas fa-keyboard text-indigo-600 text-xs"></i>
            <span class="text-xs font-bold text-gray-700 uppercase tracking-wide">Quick Keys</span>
          </div>
          <div class="grid grid-cols-2 gap-1.5 text-xs">
            <div class="flex items-center gap-1.5 bg-white px-2 py-1 rounded border border-gray-200">
              <kbd class="bg-gradient-to-br from-gray-100 to-gray-200 px-1.5 py-0.5 rounded text-xs font-mono shadow-sm">Esc</kbd>
              <span class="text-gray-600">Reset</span>
            </div>
            <div class="flex items-center gap-1.5 bg-white px-2 py-1 rounded border border-gray-200">
              <kbd class="bg-gradient-to-br from-gray-100 to-gray-200 px-1.5 py-0.5 rounded text-xs font-mono shadow-sm">+/-</kbd>
              <span class="text-gray-600">Zoom</span>
            </div>
            <div class="flex items-center gap-1.5 bg-white px-2 py-1 rounded border border-gray-200 col-span-2">
              <kbd class="bg-gradient-to-br from-gray-100 to-gray-200 px-1.5 py-0.5 rounded text-xs font-mono shadow-sm">R</kbd>
              <span class="text-gray-600">Refresh Preview</span>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderSVGPreview(section, zoomLevel = 1) {
    if (!section || !section.rows || !section.seatsPerRow) {
      return `
        ${this.createFloatingToolbar()}
        <div class="text-center text-gray-500 py-8">
          <i class="fas fa-exclamation-triangle text-4xl mb-2"></i>
          <p>Invalid section configuration</p>
        </div>
      `;
    }

    const seatSize = 35;
    const seatGap = 2;
    const aisleWidth = 25;
    const rowGap = 2;
    const rowLabelWidth = 45;
    const padding = 20;

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

    const capacity = this.calculateCapacity(section);
    const totalSeats = section.rows * section.seatsPerRow;
    const aisleCount = verticalAisles.length;

    const tierColors = {
      vip: { fill: "#f3e8ff", stroke: "#a855f7", text: "#7e22ce" },
      premium: { fill: "#dbeafe", stroke: "#3b82f6", text: "#1e40af" },
      standard: { fill: "#dcfce7", stroke: "#22c55e", text: "#15803d" },
      economy: { fill: "#f3f4f6", stroke: "#6b7280", text: "#374151" }
    };

    const tierColor = tierColors[section.tier] || tierColors.standard;

    let totalWidth = rowLabelWidth * 2 + section.seatsPerRow * (seatSize + seatGap);
    verticalAisles.forEach(aisle => {
      totalWidth += aisleWidth * (aisle.width || 1);
    });

    let totalHeight = section.rows * (seatSize + rowGap) + padding * 2;
    horizontalAisles.forEach(aisle => {
      totalHeight += 20 * (aisle.height || 1);
    });

    const viewBoxWidth = Math.max(totalWidth + padding * 2, 2000);
    const viewBoxHeight = Math.max(totalHeight + 100, 1500);

    let html = `
      ${this.createFloatingToolbar()}
      <div class="grid grid-cols-12 gap-4">
        <div class="col-span-3">
          <div class="sticky top-4 space-y-4">
            <div class="p-4 bg-white rounded-lg border-2 border-slate-200 shadow-sm">
              <div class="flex items-center gap-2 mb-3">
                <i class="fas fa-theater-masks text-indigo-600 text-lg"></i>
                <span class="font-bold text-lg text-gray-800">${section.name}</span>
              </div>
              <span class="inline-block px-3 py-1 bg-${this.getTierColorClass(section.tier)}-100 border-${this.getTierColorClass(section.tier)}-400 text-${this.getTierColorClass(section.tier)}-700 text-xs font-semibold rounded-full border mb-3">
                ${section.tier.toUpperCase()}
              </span>
              <div class="mt-3 pt-3 border-t border-slate-200">
                <div class="text-xs text-gray-500 mb-1">Effective Capacity</div>
                <div class="text-3xl font-bold text-indigo-600">${capacity}</div>
              </div>
            </div>
            
            <div class="p-4 bg-white rounded-lg border-2 border-slate-200 shadow-sm">
              <div class="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">Section Details</div>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between items-center py-2 border-b border-slate-100">
                  <span class="text-gray-600">Rows</span>
                  <span class="font-semibold text-gray-800">${section.rows}</span>
                </div>
                <div class="flex justify-between items-center py-2 border-b border-slate-100">
                  <span class="text-gray-600">Seats/Row</span>
                  <span class="font-semibold text-gray-800">${section.seatsPerRow}</span>
                </div>
                <div class="flex justify-between items-center py-2 border-b border-slate-100">
                  <span class="text-gray-600">Aisles</span>
                  <span class="font-semibold text-gray-800">${aisleCount}</span>
                </div>
                <div class="flex justify-between items-center py-2">
                  <span class="text-gray-600">Total Seats</span>
                  <span class="font-semibold text-gray-800">${totalSeats}</span>
                </div>
              </div>
            </div>
            
            <div class="p-4 bg-white rounded-lg border-2 border-slate-200 shadow-sm">
              <div class="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">Legend</div>
              <div class="space-y-2">
                <div class="flex items-center gap-2">
                  <svg width="20" height="20"><rect x="1" y="1" width="18" height="18" fill="${tierColor.fill}" stroke="${tierColor.stroke}" stroke-width="2" rx="3"/></svg>
                  <span class="text-xs text-gray-600">Available</span>
                </div>
                <div class="flex items-center gap-2">
                  <svg width="20" height="20"><rect x="1" y="1" width="18" height="18" fill="#fee2e2" stroke="#f87171" stroke-width="2" rx="3"/></svg>
                  <span class="text-xs text-gray-600">Skipped Number</span>
                </div>
                <div class="flex items-center gap-2">
                  <svg width="20" height="20"><rect x="1" y="1" width="18" height="18" fill="#f9fafb" stroke="#d1d5db" stroke-width="2" stroke-dasharray="4" rx="3"/></svg>
                  <span class="text-xs text-gray-600">Skipped Seat</span>
                </div>
                <div class="flex items-center gap-2">
                  <svg width="20" height="20"><rect x="1" y="1" width="18" height="18" fill="#fffbeb" stroke="#fbbf24" stroke-width="2" rx="3"/></svg>
                  <span class="text-xs text-gray-600">Aisle</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-span-9">
          <div class="bg-slate-800 rounded-lg p-2 mb-4 text-center">
            <div class="text-white text-xs font-semibold tracking-wider">
              <i class="fas fa-film mr-2"></i>STAGE / SCREEN
            </div>
          </div>
          
          <div id="panzoom-container" style="width: 100%; height: 600px; overflow: hidden; position: relative; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
            <svg id="seat-map-svg" width="100%" height="100%" viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}" 
              style="cursor: grab;">
              <g id="content-layer">
    `;

    const rowLabels = this.generateRowLabels(section);
    let currentY = padding + 40;

    for (let rowIdx = 0; rowIdx < section.rows; rowIdx++) {
      const rowLabel = rowLabels[rowIdx];
      let currentX = padding + rowLabelWidth;

      html += `<text x="${padding + 20}" y="${currentY + seatSize / 2 + 5}" font-size="14" font-weight="bold" fill="#374151" text-anchor="middle">${rowLabel}</text>`;

      for (let seatIdx = 0; seatIdx < section.seatsPerRow; seatIdx++) {
        const aisleAtPosition = verticalAisles.find(a => a.position === seatIdx);

        if (aisleAtPosition) {
          const aisleWidthPx = aisleWidth * (aisleAtPosition.width || 1);
          const aisleIndex = verticalAisles.indexOf(aisleAtPosition);
          
          html += `<rect x="${currentX}" y="${currentY}" width="${aisleWidthPx}" height="${seatSize}" 
            fill="#fffbeb" stroke="#fbbf24" stroke-width="2" rx="4" 
            class="aisle-rect cursor-pointer hover:fill-amber-100 transition-colors" 
            data-aisle-index="${aisleIndex}"
            data-type="vertical"
            data-position="${seatIdx}">
            <title>Aisle: ${aisleAtPosition.label || "Unnamed"} (Width: ${aisleAtPosition.width}) - Click to edit or remove</title>
          </rect>`;

          if (aisleAtPosition.label) {
            html += `<text x="${currentX + aisleWidthPx / 2}" y="${currentY + seatSize / 2 + 4}" 
              font-size="10" font-weight="600" fill="#d97706" text-anchor="middle" 
              pointer-events="none">${aisleAtPosition.label}</text>`;
          }

          currentX += aisleWidthPx + seatGap;
        }

        const effectiveIndex = numbering.globalDirection === "R_TO_L"
          ? section.seatsPerRow - 1 - seatIdx
          : seatIdx;
        const seatNumber = numbering.startNumber + effectiveIndex;
        const isSkipped = skipIndices.has(seatIdx);
        const isSkippedNumber = skipNumbers.has(seatNumber);

        if (isSkipped) {
          html += `<rect x="${currentX}" y="${currentY}" width="${seatSize}" height="${seatSize}" 
            fill="#f9fafb" stroke="#d1d5db" stroke-width="2" stroke-dasharray="4" rx="4" 
            class="seat-rect">
            <title>Skipped seat at index ${seatIdx}</title>
          </rect>`;
          html += `<text x="${currentX + seatSize / 2}" y="${currentY + seatSize / 2 + 4}" 
            font-size="16" font-weight="bold" fill="#9ca3af" text-anchor="middle" pointer-events="none">×</text>`;
        } else {
          const displayLabel = `${numbering.prefix}${seatNumber}${numbering.suffix}`;
          const seatFill = isSkippedNumber ? "#fee2e2" : tierColor.fill;
          const seatStroke = isSkippedNumber ? "#f87171" : tierColor.stroke;
          const seatTextColor = isSkippedNumber ? "#b91c1c" : tierColor.text;

          html += `<rect x="${currentX}" y="${currentY}" width="${seatSize}" height="${seatSize}" 
            fill="${seatFill}" stroke="${seatStroke}" stroke-width="2" rx="4" 
            class="seat-rect cursor-pointer hover:opacity-80 transition-all" 
            data-row="${rowIdx}" data-seat="${seatIdx}" data-position-x="${currentX}">
            <title>Seat ${rowLabel}${displayLabel}${isSkippedNumber ? " (Skipped Number)" : ""} - Click to add aisle before this seat</title>
          </rect>`;
          html += `<text x="${currentX + seatSize / 2}" y="${currentY + seatSize / 2 + 5}" 
            font-size="11" font-weight="600" fill="${seatTextColor}" text-anchor="middle" 
            pointer-events="none">${displayLabel}</text>`;
        }

        currentX += seatSize + seatGap;
      }

      html += `<text x="${currentX + 20}" y="${currentY + seatSize / 2 + 5}" font-size="14" font-weight="bold" fill="#374151" text-anchor="middle">${rowLabel}</text>`;

      currentY += seatSize + rowGap;

      const horizontalAisleAfterRow = horizontalAisles.find(a => a.position === rowIdx);
      if (horizontalAisleAfterRow) {
        const hAisleHeight = 20 * (horizontalAisleAfterRow.height || 1);
        const hAisleIndex = horizontalAisles.indexOf(horizontalAisleAfterRow);
        
        html += `<rect x="${padding}" y="${currentY}" width="${totalWidth}" height="${hAisleHeight}" 
          fill="#fffbeb" stroke="#fbbf24" stroke-width="2" rx="4" 
          class="aisle-rect cursor-pointer hover:fill-amber-100 transition-colors" 
          data-aisle-index="${hAisleIndex}"
          data-type="horizontal"
          data-position="${rowIdx}">
          <title>Horizontal Aisle after row ${rowLabel}${horizontalAisleAfterRow.label ? ": " + horizontalAisleAfterRow.label : ""} - Click to edit or remove</title>
        </rect>`;
        
        const displayLabel = horizontalAisleAfterRow.label || "HORIZONTAL AISLE";
        html += `<text x="${padding + totalWidth / 2}" y="${currentY + hAisleHeight / 2 + 4}" 
          font-size="10" font-weight="600" fill="#d97706" text-anchor="middle" 
          pointer-events="none">${displayLabel}</text>`;
        currentY += hAisleHeight + rowGap;
      }
    }

    html += "</g></svg></div></div></div>";

    return html;
  },

  getTierColorClass(tier) {
    const map = {
      vip: "purple",
      premium: "blue",
      standard: "green",
      economy: "gray"
    };
    return map[tier] || "green";
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

  calculateCapacity(section) {
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

  attachSVGInteractions($preview, section, stateManager, VenueLayoutEditor, initSeatMapPanzoom) {
    let currentTool = "select";
    let toolbarMinimized = false;
    let panzoomInstance = null;
    const $container = $preview.closest(".bg-white.border.rounded-lg");
    const $floatingToolbar = $preview.find("#floating-toolbar");

    if (initSeatMapPanzoom && typeof initSeatMapPanzoom === "function") {
      const $panzoomContainer = $preview.find("#panzoom-container");
      if ($panzoomContainer.length) {
        panzoomInstance = initSeatMapPanzoom($panzoomContainer);
        if (panzoomInstance) {
          setTimeout(() => {
            panzoomInstance._fit();
          }, 100);
        }
      }
    }

    const setActiveTool = (tool) => {
      currentTool = tool;
      
      $container.find(".tool-btn").each(function() {
        const $btn = $(this);
        const btnTool = $btn.data("tool");
        
        if (btnTool === tool) {
          $btn.removeClass("bg-white text-gray-700 border-gray-200")
            .removeClass("hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-indigo-300")
            .removeClass("hover:from-purple-50 hover:to-pink-50 hover:border-purple-300")
            .removeClass("hover:from-red-50 hover:to-orange-50 hover:border-red-300")
            .removeClass("hover:from-amber-50 hover:to-yellow-50 hover:border-amber-300")
            .addClass("bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-indigo-600 shadow-md");
          $btn.find("kbd").removeClass("bg-gray-100 group-hover:bg-indigo-100 group-hover:bg-purple-100 group-hover:bg-red-100 group-hover:bg-amber-100")
            .addClass("bg-indigo-500 bg-opacity-50");
        } else {
          $btn.removeClass("bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-indigo-600 shadow-md")
            .addClass("bg-white text-gray-700 border-gray-200");
          $btn.find("kbd").removeClass("bg-indigo-500 bg-opacity-50")
            .addClass("bg-gray-100");
        }
      });

      const cursorMap = {
        "select": "default",
        "add-aisle": "crosshair",
        "add-h-aisle": "crosshair",
        "skip-seat": "not-allowed",
        "edit": "pointer"
      };

      const statusMap = {
        "select": "Select tool active",
        "add-aisle": "Click between seats",
        "add-h-aisle": "Click between rows",
        "skip-seat": "Click seats to skip",
        "edit": "Click to edit/remove"
      };

      $preview.find("#seat-map-svg").css("cursor", cursorMap[tool] || "default");
      $container.find("#tool-status-text").text(statusMap[tool]);
    };

    $container.find("#toggle-toolbar-btn").off("click").on("click", function() {
      toolbarMinimized = !toolbarMinimized;
      const $icon = $(this).find("i");
      const $content = $floatingToolbar.find("#toolbar-content, #tool-status");
      
      if (toolbarMinimized) {
        $content.slideUp(200);
        $icon.removeClass("fa-chevron-up").addClass("fa-chevron-down");
        $(this).attr("title", "Expand toolbar");
      } else {
        $content.slideDown(200);
        $icon.removeClass("fa-chevron-down").addClass("fa-chevron-up");
        $(this).attr("title", "Minimize toolbar");
      }
    });

    $container.find(".tool-btn").off("click").on("click", function() {
      const tool = $(this).data("tool");
      setActiveTool(tool);
    });

    $(document).off("keydown.layoutEditor").on("keydown.layoutEditor", function(e) {
      if ($(e.target).is("input, textarea, select")) {
        return;
      }

      const key = e.key.toLowerCase();
      const toolMap = {
        "v": "select",
        "a": "add-aisle",
        "h": "add-h-aisle",
        "s": "skip-seat",
        "e": "edit",
        "+": "zoom-in",
        "=": "zoom-in",
        "-": "zoom-out",
        "r": "refresh"
      };

      if (toolMap[key]) {
        e.preventDefault();
        
        if (key === "+" || key === "=" || key === "-") {
          if (panzoomInstance) {
            if (key === "+" || key === "=") {
              panzoomInstance.zoomIn();
            } else {
              panzoomInstance.zoomOut();
            }
          } else {
            if (key === "+" || key === "=") {
              stateManager.zoomIn();
            } else {
              stateManager.zoomOut();
            }
          }
        } else if (key === "r") {
          stateManager.updatePreview();
        } else {
          setActiveTool(toolMap[key]);
        }
      }

      if (e.key === "Escape") {
        setActiveTool("select");
      }
    });

    $preview.find(".seat-rect[data-position-x]").off("click").on("click", function(e) {
      const seatIdx = parseInt($(this).data("seat"));
      const rowIdx = parseInt($(this).data("row"));

      if (currentTool === "add-aisle") {
        if (!section.aisles) {
          section.aisles = [];
        }

        const existingAisle = section.aisles.find(a => a.type === "vertical" && a.position === seatIdx);
        if (existingAisle) {
          alert("An aisle already exists at this position!");
          return;
        }

        section.aisles.push({
          type: "vertical",
          mode: "afterSeat",
          position: seatIdx,
          width: 1.0,
          label: `Aisle ${section.aisles.filter(a => a.type === "vertical").length + 1}`
        });

        const activeTab = $preview.closest(".flex.flex-col").find(".layout-tab.border-b-2").data("tab");
        if (activeTab === "aisles") {
          stateManager.refreshAislesTab();
        }

        stateManager.updatePreview();
      } else if (currentTool === "skip-seat") {
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

        const skipIndex = section.seatNumbering.skipSeatIndices.indexOf(seatIdx);
        if (skipIndex > -1) {
          section.seatNumbering.skipSeatIndices.splice(skipIndex, 1);
        } else {
          section.seatNumbering.skipSeatIndices.push(seatIdx);
        }

        const activeTab = $preview.closest(".flex.flex-col").find(".layout-tab.border-b-2").data("tab");
        if (activeTab === "numbering") {
          const $tabContent = $preview.closest(".flex.flex-col").find("#tab-content");
          $tabContent.html(VenueLayoutEditor.createNumberingTab(section));
        }

        stateManager.updatePreview();
      }
    });

    $preview.find(".aisle-rect").off("click").on("click", function(e) {
      e.stopPropagation();
      
      if (currentTool !== "edit" && currentTool !== "select") {
        return;
      }

      const aisleIndex = parseInt($(this).data("aisle-index"));
      const aisleType = $(this).data("type");
      const position = parseInt($(this).data("position"));

      if (!section.aisles) {
        return;
      }

      const aisles = section.aisles.filter(a => a.type === aisleType);
      const aisle = aisles[aisleIndex];

      if (!aisle) {
        console.error("Aisle not found:", { aisleType, aisleIndex, position });
        return;
      }

      const aisleTypeLabel = aisleType === "horizontal" ? "Horizontal" : "Vertical";
      const action = confirm(`Edit ${aisleTypeLabel} aisle at position ${position}?\n\nOK = Edit Label\nCancel = Remove Aisle`);
      
      if (action) {
        const newLabel = prompt("Edit aisle label:", aisle.label || "");
        if (newLabel !== null) {
          aisle.label = newLabel;
          
          const activeTab = $preview.closest(".flex.flex-col").find(".layout-tab.border-b-2").data("tab");
          if (activeTab === "aisles") {
            stateManager.refreshAislesTab();
          }
          
          stateManager.updatePreview();
        }
      } else {
        const allAisleIndex = section.aisles.indexOf(aisle);
        if (allAisleIndex > -1) {
          section.aisles.splice(allAisleIndex, 1);
          
          const activeTab = $preview.closest(".flex.flex-col").find(".layout-tab.border-b-2").data("tab");
          if (activeTab === "aisles") {
            stateManager.refreshAislesTab();
          }
          
          stateManager.updatePreview();
        }
      }
    });

    $preview.find("#seat-map-svg, #content-layer").off("click.haisle").on("click.haisle", function(e) {
      if (currentTool !== "add-h-aisle") return;
      
      if ($(e.target).closest(".seat-rect, .aisle-rect").length > 0) {
        return;
      }

      const $svg = $(this).closest("svg");
      if (!$svg.length) return;

      const svg = $svg[0];
      const svgRect = svg.getBoundingClientRect();
      const clickY = e.clientY - svgRect.top;
      const viewBox = svg.viewBox.baseVal;
      const scaleY = viewBox.height / svgRect.height;
      const svgY = clickY * scaleY;

      const seatSize = 35;
      const rowGap = 2;
      const padding = 20;
      const headerHeight = 40;

      const rowHeight = seatSize + rowGap;
      const clickedRow = Math.floor((svgY - padding - headerHeight) / rowHeight);

      if (clickedRow >= 0 && clickedRow < section.rows) {
        if (!section.aisles) {
          section.aisles = [];
        }

        const existingHAisle = section.aisles.find(a => a.type === "horizontal" && a.position === clickedRow);
        if (existingHAisle) {
          alert("A horizontal aisle already exists after this row!");
          return;
        }

        section.aisles.push({
          type: "horizontal",
          mode: "afterRow",
          position: clickedRow,
          width: 1.0,
          height: 1.0,
          label: `H-Aisle ${section.aisles.filter(a => a.type === "horizontal").length + 1}`
        });

        const activeTab = $preview.closest(".flex.flex-col").find(".layout-tab.border-b-2").data("tab");
        if (activeTab === "aisles") {
          stateManager.refreshAislesTab();
        }

        stateManager.updatePreview();
      }
    });

    this.makeToolbarDraggable($floatingToolbar);

    setActiveTool("select");
  },

  makeToolbarDraggable($toolbar) {
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    const $handle = $toolbar.find(".flex.items-center.gap-2.mb-2");
    $handle.css("cursor", "move");

    $handle.on("mousedown", function(e) {
      if ($(e.target).closest("#toggle-toolbar-btn").length) {
        return;
      }

      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;

      isDragging = true;
      $toolbar.css("transition", "none");
    });

    $(document).on("mousemove", function(e) {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        xOffset = currentX;
        yOffset = currentY;

        $toolbar.css("transform", `translate(${currentX}px, ${currentY}px)`);
      }
    });

    $(document).on("mouseup", function() {
      if (isDragging) {
        isDragging = false;
        $toolbar.css("transition", "");
      }
    });
  },

  detachKeyboardShortcuts() {
    $(document).off("keydown.layoutEditor");
  }
};
