import { initSeatMapPanzoom } from "/src/utils/panzoomSeatMap.js";
import { attachSeatTooltipListeners } from "/src/utils/booking/seatTooltip.js";

export default {
  title: "Seat Map Pan-Zoom Test",

  panzoomInstance: null,
  selected: new Set(),

  async render() {
    return `
      <main class="container mx-auto px-4 py-8">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">
            <i class="fas fa-vial text-purple-600 mr-3"></i>Seat Map Pan-Zoom Test
          </h1>
          <p class="text-gray-600 mt-2">Test custom pan-zoom implementation with interactive controls</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div class="lg:col-span-1">
            <div class="bg-white rounded-lg shadow-md p-6 sticky top-4 space-y-4">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">
                <i class="fas fa-sliders-h text-purple-600 mr-2"></i>Controls
              </h2>

              <div class="space-y-3">
                <h3 class="text-sm font-semibold text-gray-700 border-b pb-2">Zoom Controls</h3>
                <button id="zoomInBtn" class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <i class="fas fa-search-plus mr-2"></i>Zoom In
                </button>
                <button id="zoomOutBtn" class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <i class="fas fa-search-minus mr-2"></i>Zoom Out
                </button>
                <button id="resetZoomBtn" class="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                  <i class="fas fa-undo mr-2"></i>Reset Zoom
                </button>
                <button id="centerBtn" class="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  <i class="fas fa-crosshairs mr-2"></i>Center
                </button>
              </div>

              <div class="space-y-3">
                <h3 class="text-sm font-semibold text-gray-700 border-b pb-2">Pan Controls</h3>
                <div class="grid grid-cols-3 gap-2">
                  <div></div>
                  <button id="panUpBtn" class="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                    <i class="fas fa-arrow-up"></i>
                  </button>
                  <div></div>
                  <button id="panLeftBtn" class="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                    <i class="fas fa-arrow-left"></i>
                  </button>
                  <button id="resetPanBtn" class="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                    <i class="fas fa-times"></i>
                  </button>
                  <button id="panRightBtn" class="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                    <i class="fas fa-arrow-right"></i>
                  </button>
                  <div></div>
                  <button id="panDownBtn" class="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                    <i class="fas fa-arrow-down"></i>
                  </button>
                  <div></div>
                </div>
              </div>

              <div class="space-y-3">
                <h3 class="text-sm font-semibold text-gray-700 border-b pb-2">Test Scenarios</h3>
                <button id="smallMapBtn" class="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                  <i class="fas fa-compress mr-2"></i>Small Map (5x8)
                </button>
                <button id="mediumMapBtn" class="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                  <i class="fas fa-expand mr-2"></i>Medium Map (10x15)
                </button>
                <button id="largeMapBtn" class="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
                  <i class="fas fa-expand-arrows-alt mr-2"></i>Large Map (20x30)
                </button>
              </div>

              <div class="bg-purple-50 rounded-lg p-4">
                <h3 class="text-sm font-semibold text-gray-700 mb-2">Status</h3>
                <div class="space-y-1 text-xs">
                  <div class="flex justify-between">
                    <span class="text-gray-600">Scale:</span>
                    <span id="scaleDisplay" class="font-mono font-bold text-purple-600">1.0x</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Pan X:</span>
                    <span id="panXDisplay" class="font-mono font-bold text-purple-600">0px</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Pan Y:</span>
                    <span id="panYDisplay" class="font-mono font-bold text-purple-600">0px</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Panning:</span>
                    <span id="panningDisplay" class="font-mono font-bold text-purple-600">No</span>
                  </div>
                </div>
              </div>

              <div class="bg-blue-50 rounded-lg p-4">
                <h3 class="text-sm font-semibold text-gray-700 mb-2">
                  <i class="fas fa-keyboard mr-1"></i>Keyboard Shortcuts
                </h3>
                <div class="space-y-1 text-xs text-gray-600">
                  <div>Arrow Keys / WASD: Pan</div>
                  <div>Mouse Wheel: Zoom</div>
                  <div>Drag: Pan map</div>
                  <div>Touch Pinch: Zoom (mobile)</div>
                </div>
              </div>

              <div class="bg-emerald-50 rounded-lg p-4">
                <h3 class="text-sm font-semibold text-gray-700 mb-2">
                  <i class="fas fa-check-square mr-1"></i>Selected Seats
                </h3>
                <div class="flex items-center justify-between text-sm mb-2">
                  <span class="text-gray-600">Count:</span>
                  <span id="selectedCount" class="font-mono font-bold text-emerald-700">0</span>
                </div>
                <div class="flex items-center justify-between text-sm mb-2">
                  <span class="text-gray-600">Total:</span>
                  <span id="selectedTotal" class="font-mono font-bold text-emerald-700">$0</span>
                </div>
                <div id="selectedList" class="text-xs text-gray-700 min-h-[20px] break-words max-h-[80px] overflow-y-auto"></div>
                <button id="clearSelectionsBtn" class="mt-3 w-full px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">
                  <i class="fas fa-trash mr-1"></i>Clear Selections
                </button>
              </div>
            </div>
          </div>

          <div class="lg:col-span-3">
            <div class="bg-white rounded-lg shadow-md p-6">
              <div class="flex justify-between items-center mb-6">
                <h2 class="text-lg font-semibold text-gray-900">
                  <i class="fas fa-map-marked-alt text-purple-600 mr-2"></i>Interactive Seat Map
                </h2>
                <div class="flex gap-2">
                  <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                    <i class="fas fa-check-circle mr-1"></i>Custom Pan-Zoom Active
                  </span>
                </div>
              </div>

              <div id="seatMap" class="border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50 min-h-[600px] flex items-center justify-center">
              </div>

              <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <i class="fas fa-info-circle text-blue-500"></i>
                    Seat Status
                  </h3>
                  <div class="grid grid-cols-2 gap-2 text-sm">
                    <div class="flex items-center gap-2">
                      <div class="w-4 h-4 rounded bg-emerald-500"></div>
                      <span class="text-gray-700">Available</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <div class="w-4 h-4 rounded bg-amber-400"></div>
                      <span class="text-gray-700">Selected</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <div class="w-4 h-4 rounded bg-rose-500"></div>
                      <span class="text-gray-700">Occupied</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <div class="w-4 h-4 rounded bg-gray-500"></div>
                      <span class="text-gray-700">Blocked</span>
                    </div>
                  </div>
                </div>
                <div class="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <i class="fas fa-th-large text-purple-500"></i>
                    Seating Zones & Pricing
                  </h3>
                  <div class="space-y-2 text-sm">
                    <div class="flex justify-between items-center">
                      <span class="text-gray-700 font-medium">Orchestra Center</span>
                      <span class="text-purple-600 font-bold">$1200</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-gray-700">Orchestra Left/Right</span>
                      <span class="text-purple-600 font-bold">$800</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-gray-700">Mezzanine Center</span>
                      <span class="text-blue-600 font-bold">$900</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-gray-700">Mezzanine Left/Right</span>
                      <span class="text-blue-600 font-bold">$600</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div class="flex">
                <div class="flex-shrink-0">
                  <i class="fas fa-info-circle text-yellow-400 text-xl"></i>
                </div>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-yellow-800">Testing Instructions</h3>
                  <div class="mt-2 text-sm text-yellow-700">
                    <ul class="list-disc list-inside space-y-1">
                      <li>Try mouse wheel to zoom in/out</li>
                      <li>Click and drag to pan the map</li>
                      <li>Use arrow keys or WASD to navigate</li>
                      <li>On mobile: pinch to zoom, drag to pan</li>
                      <li>Click seats to select/deselect</li>
                      <li>Hover over seats to see tooltips</li>
                      <li>Check Chrome DevTools Console for any warnings</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    `;
  },

  async afterRender() {
    this.renderSeatMap(10, 15);
    this.attachEventListeners();
    this.startStatusUpdates();
  },

  calculateSections(seatsPerRow, rows, verticalAisles, horizontalAisles) {
    const colSections = [];
    let prevCol = 0;
    verticalAisles.forEach((aisleCol) => {
      colSections.push({ start: prevCol, end: aisleCol });
      prevCol = aisleCol;
    });
    colSections.push({ start: prevCol, end: seatsPerRow });

    const rowSections = [];
    let prevRow = 0;
    horizontalAisles.forEach((aisleRow) => {
      rowSections.push({ start: prevRow, end: aisleRow });
      prevRow = aisleRow;
    });
    rowSections.push({ start: prevRow, end: rows });

    return { colSections, rowSections };
  },

  getZoneName(colSection, rowSection) {
    const colNames = ["Left", "Center", "Right"];
    const rowNames = ["Orchestra", "Mezzanine"];
    return `${rowNames[rowSection] || "Upper"} ${
      colNames[colSection] || "Section"
    }`;
  },

  getZonePrice(colSection, rowSection) {
    const prices = [
      [800, 1200, 800],
      [600, 900, 600],
    ];
    return `$${prices[rowSection]?.[colSection] || 500}`;
  },

  renderSeatMap(rows, seatsPerRow) {
    const seatSize = 30;
    const seatGap = 4;
    const aisleWidth = 50;
    const rowLabelWidth = 40;

    const verticalAisles = [
      Math.floor(seatsPerRow * 0.33),
      Math.floor(seatsPerRow * 0.67),
    ];
    const horizontalAisles = [Math.floor(rows * 0.4)];

    const sections = this.calculateSections(
      seatsPerRow,
      rows,
      verticalAisles,
      horizontalAisles
    );

    const stageWidth =
      seatsPerRow * seatSize +
      (seatsPerRow - 1) * seatGap +
      verticalAisles.length * aisleWidth;
    const stageHeight = 50;
    const stagePadding = 40;
    const svgWidth = stageWidth + stagePadding * 2 + rowLabelWidth;
    const totalSeatsHeight =
      rows * seatSize +
      (rows - 1) * seatGap +
      horizontalAisles.length * aisleWidth;
    const svgHeight = totalSeatsHeight + stageHeight + stagePadding * 3;

    const viewBoxWidth = svgWidth * 1.5;
    const viewBoxHeight = svgHeight * 1.5;
    const offsetX = -(viewBoxWidth - svgWidth) / 2;
    const offsetY = -(viewBoxHeight - svgHeight) / 2;

    const selectedSeats = this.selected || new Set();
    const occupiedSeats = new Set([
      "C5",
      "C6",
      "D10",
      "E8",
      "F12",
      "G3",
      "H8",
      "B12",
    ]);
    const blockedSeats = new Set(["A1", "A" + seatsPerRow]);

    const baseX = stagePadding + rowLabelWidth;
    const baseY = stagePadding + stageHeight + stagePadding;

    let stageHTML = `
      <rect x="${baseX}" y="${stagePadding}" width="${stageWidth}" height="${stageHeight}"
        fill="url(#stageGradient)" rx="8" stroke="#6b7280" stroke-width="2"/>
      <text x="${baseX + stageWidth / 2}" y="${
      stagePadding + stageHeight / 2 + 6
    }" 
        class="fill-amber-400" text-anchor="middle" font-size="20" font-weight="bold" 
        style="letter-spacing: 3px;">STAGE</text>
      <line x1="${baseX + 20}" y1="${stagePadding + stageHeight}" x2="${
      baseX + stageWidth - 20
    }" y2="${stagePadding + stageHeight}" 
        stroke="#fbbf24" stroke-width="3" opacity="0.6"/>
    `;

    let aislesHTML = "";
    verticalAisles.forEach((aisleCol, idx) => {
      let x = baseX;
      for (let i = 0; i < idx + 1; i++) {
        const section = sections.colSections[i];
        const sectionWidth = section.end - section.start;
        x += sectionWidth * seatSize + (sectionWidth - 1) * seatGap;
        if (i < idx) x += aisleWidth;
      }

      const totalHeight =
        rows * seatSize +
        (rows - 1) * seatGap +
        horizontalAisles.length * aisleWidth;
      aislesHTML += `
        <rect x="${x}" y="${baseY - 10}" width="${aisleWidth}" height="${
        totalHeight + 20
      }" 
          class="fill-gray-700 stroke-gray-600" stroke-width="2" stroke-dasharray="6,4" rx="6" opacity="0.8"/>
        <text x="${x + aisleWidth / 2}" y="${baseY + 20}" 
          class="fill-gray-400" text-anchor="middle" font-size="11" font-weight="600" 
          transform="rotate(-90 ${x + aisleWidth / 2} ${baseY + 20})"></text>
      `;
    });

    horizontalAisles.forEach((aisleRow, idx) => {
      let y = baseY;
      for (let i = 0; i < idx + 1; i++) {
        const section = sections.rowSections[i];
        const sectionHeight = section.end - section.start;
        y += sectionHeight * seatSize + (sectionHeight - 1) * seatGap;
        if (i < idx) y += aisleWidth;
      }

      const totalWidth =
        seatsPerRow * seatSize +
        (seatsPerRow - 1) * seatGap +
        verticalAisles.length * aisleWidth;
      aislesHTML += `
        <rect x="${baseX}" y="${y}" width="${totalWidth}" height="${aisleWidth}" 
          class="fill-gray-700 stroke-gray-600" stroke-width="2" stroke-dasharray="6,4" rx="6" opacity="0.8"/>
        <text x="${baseX + totalWidth / 2}" y="${y + aisleWidth / 2 + 4}" 
          class="fill-gray-400" text-anchor="middle" font-size="11" font-weight="600"></text>
      `;
    });

    let seatsHTML = "";
    for (let row = 0; row < rows; row++) {
      const rowLetter = String.fromCharCode(65 + row);
      const rowSectionIdx = sections.rowSections.findIndex(
        (s) => row >= s.start && row < s.end
      );

      let rowY = baseY;
      for (let i = 0; i < rowSectionIdx; i++) {
        const section = sections.rowSections[i];
        rowY +=
          (section.end - section.start) * seatSize +
          (section.end - section.start - 1) * seatGap +
          aisleWidth;
      }
      rowY +=
        (row - sections.rowSections[rowSectionIdx].start) *
        (seatSize + seatGap);

      seatsHTML += `
        <text x="${stagePadding + rowLabelWidth - 10}" y="${
        rowY + seatSize / 2 + 5
      }" 
          class="fill-gray-400" text-anchor="end" font-size="15" font-weight="700" 
          style="pointer-events: none;">${rowLetter}</text>
      `;

      for (let seat = 0; seat < seatsPerRow; seat++) {
        const colSectionIdx = sections.colSections.findIndex(
          (s) => seat >= s.start && seat < s.end
        );

        let seatX = baseX;
        for (let i = 0; i < colSectionIdx; i++) {
          const section = sections.colSections[i];
          seatX +=
            (section.end - section.start) * seatSize +
            (section.end - section.start - 1) * seatGap +
            aisleWidth;
        }
        seatX +=
          (seat - sections.colSections[colSectionIdx].start) *
          (seatSize + seatGap);

        const seatNumber = seat + 1;
        const seatId = `${rowLetter}${seatNumber}`;
        const zoneName = this.getZoneName(colSectionIdx, rowSectionIdx);
        const price = this.getZonePrice(colSectionIdx, rowSectionIdx);

        let status = "available";
        let fillClass = "fill-emerald-500";
        let strokeClass = "stroke-emerald-600";

        if (blockedSeats.has(seatId)) {
          status = "blocked";
          fillClass = "fill-gray-500";
          strokeClass = "stroke-gray-600";
        } else if (occupiedSeats.has(seatId)) {
          status = "occupied";
          fillClass = "fill-rose-500";
          strokeClass = "stroke-rose-600";
        } else if (selectedSeats.has(seatId)) {
          status = "selected";
          fillClass = "fill-amber-400";
          strokeClass = "stroke-amber-500";
        }

        seatsHTML += `
          <g class="seat interactive-seat cursor-pointer transition-all hover:opacity-90" 
             data-seat-id="${seatId}" 
             data-full-id="${rowLetter}-${seatNumber}"
             data-zone="${zoneName}"
             data-price="${price}"
             data-status="${status}"
             style="pointer-events: all;">
            <rect x="${seatX}" y="${rowY}" width="${seatSize}" height="${seatSize}"
              class="${fillClass} ${strokeClass}" stroke-width="2" rx="5" 
              filter="url(#seatShadow)" style="pointer-events: all;"/>
            <text x="${seatX + seatSize / 2}" y="${rowY + seatSize / 2 + 4}" 
              class="fill-white" text-anchor="middle" font-size="10" font-weight="700" 
              style="pointer-events: none; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">${seatNumber}</text>
          </g>
        `;
      }
    }

    const svgHTML = `
      <svg width="100%" height="600" viewBox="${offsetX} ${offsetY} ${viewBoxWidth} ${viewBoxHeight}" 
           preserveAspectRatio="xMidYMid meet" class="mx-auto bg-gradient-to-b from-gray-800 to-gray-900">
        <defs>
          <filter id="seatShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
          </filter>
          <linearGradient id="stageGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#1f2937;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#111827;stop-opacity:1" />
          </linearGradient>
        </defs>
        <g id="seats-layer">
          ${stageHTML}
          ${aislesHTML}
          ${seatsHTML}
        </g>
      </svg>
    `;

    $("#seatMap").html(svgHTML);
    this.initializeInteractions();
  },

  initializeInteractions() {
    if (this.panzoomInstance && this.panzoomInstance.dispose) {
      this.panzoomInstance.dispose();
    }

    setTimeout(() => {
      console.log("Initializing seat map interactions...");
      this.panzoomInstance = initSeatMapPanzoom();
      attachSeatTooltipListeners("#seatMap svg");

      const $seats = $("#seatMap svg g.interactive-seat");
      console.log("Found seats:", $seats.length);

      $seats.each((index, seatEl) => {
        const $seat = $(seatEl);
        $seat.attr("tabindex", "0");

        $seat.on("click", (e) => {
          e.stopPropagation();
          this.handleSeatToggle($seat);
        });

        $seat.on("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            this.handleSeatToggle($seat);
          }
        });
      });

      console.log("Attached jQuery listeners to", $seats.length, "seats");
      this.updateSelectedUI();
    }, 100);
  },

  handleSeatToggle($seat) {
    const seatId = $seat.data("seat-id");
    const status = $seat.data("status");

    console.log("Toggle seat:", seatId, "status:", status);

    if (status === "occupied" || status === "blocked") {
      console.log("Seat unavailable, ignoring");
      return;
    }

    const $rect = $seat.find("rect");

    if (status === "selected") {
      $seat
        .data("status", "available")
        .removeClass("selected")
        .attr("data-status", "available");
      $rect
        .removeClass("fill-amber-400 stroke-amber-500")
        .addClass("fill-emerald-500 stroke-emerald-600");
      this.selected.delete(seatId);
    } else {
      $seat
        .data("status", "selected")
        .addClass("selected")
        .attr("data-status", "selected");
      $rect
        .removeClass("fill-emerald-500 stroke-emerald-600")
        .addClass("fill-amber-400 stroke-amber-500");
      this.selected.add(seatId);
    }

    console.log("Selected seats:", Array.from(this.selected));
    this.updateSelectedUI();
  },

  attachEventListeners() {
    $("#zoomInBtn").on("click", () => {
      if (this.panzoomInstance) this.panzoomInstance.zoomIn();
    });

    $("#zoomOutBtn").on("click", () => {
      if (this.panzoomInstance) this.panzoomInstance.zoomIn();
    });

    $("#zoomOutBtn").on("click", () => {
      if (this.panzoomInstance) this.panzoomInstance.zoomOut();
    });

    $("#resetZoomBtn").on("click", () => {
      if (this.panzoomInstance) this.panzoomInstance.resetZoom();
    });

    $("#centerBtn").on("click", () => {
      if (this.panzoomInstance) this.panzoomInstance._center();
    });

    $("#resetPanBtn").on("click", () => {
      if (this.panzoomInstance) this.panzoomInstance.resetPan();
    });

    $("#panUpBtn").on("click", () => {
      if (this.panzoomInstance) this.panzoomInstance.panUp();
    });

    $("#panDownBtn").on("click", () => {
      if (this.panzoomInstance) this.panzoomInstance.panDown();
    });

    $("#panLeftBtn").on("click", () => {
      if (this.panzoomInstance) this.panzoomInstance.panLeft();
    });

    $("#panRightBtn").on("click", () => {
      if (this.panzoomInstance) this.panzoomInstance.panRight();
    });

    $("#smallMapBtn").on("click", () => {
      this.renderSeatMap(5, 8);
    });

    $("#mediumMapBtn").on("click", () => {
      this.renderSeatMap(10, 15);
    });

    $("#largeMapBtn").on("click", () => {
      this.renderSeatMap(20, 30);
    });

    $("#clearSelectionsBtn").on("click", () => {
      this.selected.clear();
      // Rerender current map size by reading first row to infer seatsPerRow
      const anySeat = document.querySelector("#seatMap svg g.interactive-seat");
      let rows = 10;
      let seats = 15;
      if (anySeat) {
        // Try to preserve current size from view content
        // Fallback to medium size if parsing is complex
      }
      this.renderSeatMap(rows, seats);
    });
  },

  updateSelectedUI() {
    const list = Array.from(this.selected).sort((a, b) => a.localeCompare(b));
    const countEl = document.getElementById("selectedCount");
    const totalEl = document.getElementById("selectedTotal");
    const listEl = document.getElementById("selectedList");

    let totalPrice = 0;
    list.forEach((seatId) => {
      const seatEl = document.querySelector(
        `#seatMap svg g[data-seat-id="${seatId}"]`
      );
      if (seatEl) {
        const price = seatEl.getAttribute("data-price");
        if (price) {
          totalPrice += parseInt(price.replace("$", ""));
        }
      }
    });

    if (countEl) countEl.textContent = String(list.length);
    if (totalEl) totalEl.textContent = `$${totalPrice.toLocaleString()}`;
    if (listEl) {
      if (list.length) {
        const seatDetails = list.map((seatId) => {
          const seatEl = document.querySelector(
            `#seatMap svg g[data-seat-id="${seatId}"]`
          );
          const zone = seatEl?.getAttribute("data-zone") || "";
          const price = seatEl?.getAttribute("data-price") || "";
          return `${seatId} (${zone} - ${price})`;
        });
        listEl.innerHTML = seatDetails.join("<br>");
      } else {
        listEl.innerHTML = "No seats selected";
      }
    }
  },

  startStatusUpdates() {
    setInterval(() => {
      if (this.panzoomInstance && this.panzoomInstance.getInstance) {
        const instance = this.panzoomInstance.getInstance();
        $("#scaleDisplay").text(instance.scale.toFixed(2) + "x");
        $("#panXDisplay").text(Math.round(instance.panX) + "px");
        $("#panYDisplay").text(Math.round(instance.panY) + "px");
        $("#panningDisplay").text(instance.isPanning ? "Yes" : "No");
      }
    }, 100);
  },
};
