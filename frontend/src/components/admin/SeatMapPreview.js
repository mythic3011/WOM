/**
 * SeatMapPreview Component
 * 
 * Real-time visual preview of venue seat layout with:
 * - SVG-based rendering for scalability
 * - Color coding by pricing tier
 * - Interactive features (zoom, pan, hover, click)
 * - Real-time updates on configuration changes
 * - Support for gaps, aisles, and variable seat shapes
 */

export const SeatMapPreview = {
    // Component state
    venueLayout: null,
    seatMap: null,
    selectedSeats: new Set(),
    hoveredSeat: null,

    // View state
    scale: 1.0,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,

    // Constants
    SEAT_WIDTH: 40,
    SEAT_HEIGHT: 40,
    ROW_SPACING: 10,
    GAP_WIDTH: 20,
    SECTION_SPACING: 60,

    // Tier colors
    TIER_COLORS: {
        vip: '#9333ea',      // Purple
        premium: '#3b82f6',  // Blue
        standard: '#10b981', // Green
        economy: '#f59e0b',  // Amber
    },

    /**
     * Initialize and render the preview component
     * @param {Object} venueLayout - Venue layout configuration
     * @returns {string} HTML string
     */
    render(venueLayout = null) {
        this.venueLayout = venueLayout || { sections: [] };
        this.seatMap = this.buildSeatMap(this.venueLayout);

        return `
      <div class="seat-map-preview-container">
        ${this.renderHeader()}
        ${this.renderControls()}
        ${this.renderCanvas()}
        ${this.renderLegend()}
        ${this.renderSeatDetails()}
      </div>
    `;
    },

    /**
     * Render preview header
     * @returns {string}
     */
    renderHeader() {
        const totalSeats = this.seatMap?.total || 0;
        const sections = this.venueLayout?.sections?.length || 0;

        return `
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <i class="fas fa-eye text-indigo-600"></i>
              Seat Map Preview
            </h3>
            <p class="text-sm text-gray-600 mt-1">
              ${sections} section${sections !== 1 ? 's' : ''} • ${totalSeats} total seats
            </p>
          </div>
          <button
            type="button"
            id="preview-refresh-btn"
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium"
            title="Refresh preview"
          >
            <i class="fas fa-sync-alt mr-2"></i>Refresh
          </button>
        </div>
      </div>
    `;
    },

    /**
     * Render zoom and pan controls
     * @returns {string}
     */
    renderControls() {
        return `
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <button
              type="button"
              id="preview-zoom-out-btn"
              class="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
              title="Zoom out"
            >
              <i class="fas fa-search-minus"></i>
            </button>
            <span class="text-sm font-medium text-gray-700 min-w-16 text-center" id="preview-zoom-level">
              ${Math.round(this.scale * 100)}%
            </span>
            <button
              type="button"
              id="preview-zoom-in-btn"
              class="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
              title="Zoom in"
            >
              <i class="fas fa-search-plus"></i>
            </button>
            <button
              type="button"
              id="preview-reset-view-btn"
              class="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all text-sm font-medium"
              title="Reset view"
            >
              <i class="fas fa-compress-arrows-alt mr-2"></i>Reset
            </button>
          </div>
          <div class="text-sm text-gray-600">
            <i class="fas fa-hand-paper mr-2"></i>
            Click and drag to pan
          </div>
        </div>
      </div>
    `;
    },

    /**
     * Render SVG canvas
     * @returns {string}
     */
    renderCanvas() {
        const { width, height } = this.calculateCanvasSize();

        return `
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div 
          id="seat-map-canvas-container" 
          class="relative overflow-hidden bg-gray-50 rounded-lg border-2 border-gray-300"
          style="height: 600px; cursor: grab;"
        >
          <svg
            id="seat-map-canvas"
            width="${width}"
            height="${height}"
            viewBox="0 0 ${width} ${height}"
            class="absolute top-0 left-0"
            style="transform: translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale});"
          >
            ${this.renderSeatMapSVG()}
          </svg>
        </div>
      </div>
    `;
    },

    /**
     * Calculate canvas size based on seat map
     * @returns {Object} {width, height}
     */
    calculateCanvasSize() {
        if (!this.seatMap || !this.seatMap.sections || this.seatMap.sections.length === 0) {
            return { width: 800, height: 600 };
        }

        let maxWidth = 0;
        let totalHeight = 0;

        this.seatMap.sections.forEach((section, sectionIndex) => {
            const sectionLayout = this.venueLayout.sections[sectionIndex];
            let sectionWidth = 0;
            let sectionHeight = 0;

            section.rows.forEach((row, rowIndex) => {
                // Calculate row width
                let rowWidth = 0;
                row.seats.forEach(seat => {
                    rowWidth += (seat.width || 1.0) * this.SEAT_WIDTH;
                });
                sectionWidth = Math.max(sectionWidth, rowWidth);

                // Calculate row height
                sectionHeight += this.SEAT_HEIGHT + this.ROW_SPACING;

                // Add horizontal aisle height if present
                const horizontalAisles = sectionLayout?.horizontalAisles || [];
                const rowLabel = row.rowLabel;
                const aisleAfterRow = horizontalAisles.find(a => a.afterRow === rowLabel);
                if (aisleAfterRow) {
                    sectionHeight += (aisleAfterRow.height || 1) * (this.SEAT_HEIGHT + this.ROW_SPACING);
                }
            });

            maxWidth = Math.max(maxWidth, sectionWidth);
            totalHeight += sectionHeight + this.SECTION_SPACING;
        });

        return {
            width: Math.max(maxWidth + 100, 800),
            height: Math.max(totalHeight + 100, 600)
        };
    },

    /**
     * Render seat map as SVG
     * @returns {string}
     */
    renderSeatMapSVG() {
        if (!this.seatMap || !this.seatMap.sections || this.seatMap.sections.length === 0) {
            return this.renderEmptyState();
        }

        let svg = '';
        let currentY = 50;

        this.seatMap.sections.forEach((section, sectionIndex) => {
            const sectionLayout = this.venueLayout.sections[sectionIndex];

            // Render section label
            svg += `
        <text x="50" y="${currentY}" class="text-lg font-bold fill-gray-900">
          ${section.name}
        </text>
      `;
            currentY += 30;

            // Render rows
            section.rows.forEach((row, rowIndex) => {
                const rowY = currentY;
                let currentX = 50;

                // Render row label
                svg += `
          <text x="20" y="${rowY + this.SEAT_HEIGHT / 2 + 5}" class="text-sm font-medium fill-gray-600">
            ${row.rowLabel}
          </text>
        `;

                // Render seats
                row.seats.forEach(seat => {
                    const seatWidth = (seat.width || 1.0) * this.SEAT_WIDTH;
                    const color = this.TIER_COLORS[seat.tier] || this.TIER_COLORS.standard;
                    const isSelected = this.selectedSeats.has(seat.fullId);
                    const isHovered = this.hoveredSeat === seat.fullId;

                    svg += this.renderSeat(
                        currentX,
                        rowY,
                        seatWidth,
                        this.SEAT_HEIGHT,
                        seat,
                        color,
                        isSelected,
                        isHovered
                    );

                    currentX += seatWidth;
                });

                currentY += this.SEAT_HEIGHT + this.ROW_SPACING;

                // Add horizontal aisle spacing if present
                const horizontalAisles = sectionLayout?.horizontalAisles || [];
                const aisleAfterRow = horizontalAisles.find(a => a.afterRow === row.rowLabel);
                if (aisleAfterRow) {
                    const aisleHeight = (aisleAfterRow.height || 1) * (this.SEAT_HEIGHT + this.ROW_SPACING);

                    // Render aisle indicator
                    svg += `
            <line 
              x1="50" 
              y1="${currentY}" 
              x2="${currentX}" 
              y2="${currentY}" 
              stroke="#cbd5e1" 
              stroke-width="2" 
              stroke-dasharray="5,5"
            />
            <text x="${currentX + 10}" y="${currentY + 5}" class="text-xs fill-gray-400">
              Aisle
            </text>
          `;

                    currentY += aisleHeight;
                }
            });

            currentY += this.SECTION_SPACING;
        });

        return svg;
    },

    /**
     * Render a single seat
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Seat width
     * @param {number} height - Seat height
     * @param {Object} seat - Seat data
     * @param {string} color - Fill color
     * @param {boolean} isSelected - Is seat selected
     * @param {boolean} isHovered - Is seat hovered
     * @returns {string}
     */
    renderSeat(x, y, width, height, seat, color, isSelected, isHovered) {
        const strokeColor = isSelected ? '#1f2937' : (isHovered ? '#4b5563' : '#e5e7eb');
        const strokeWidth = isSelected ? 3 : (isHovered ? 2 : 1);
        const opacity = isSelected ? 1 : (isHovered ? 0.9 : 0.8);

        return `
      <g class="seat-group" data-seat-id="${seat.fullId}">
        <rect
          x="${x}"
          y="${y}"
          width="${width}"
          height="${height}"
          rx="4"
          fill="${color}"
          stroke="${strokeColor}"
          stroke-width="${strokeWidth}"
          opacity="${opacity}"
          class="seat-rect cursor-pointer transition-all"
        />
        <text
          x="${x + width / 2}"
          y="${y + height / 2 + 5}"
          text-anchor="middle"
          class="text-xs font-medium fill-white pointer-events-none"
        >
          ${seat.displayLabel}
        </text>
      </g>
    `;
    },

    /**
     * Render empty state
     * @returns {string}
     */
    renderEmptyState() {
        return `
      <g>
        <text x="400" y="280" text-anchor="middle" class="text-2xl fill-gray-400">
          <tspan x="400" dy="0">No seat map available</tspan>
          <tspan x="400" dy="30" class="text-base">Configure sections in the Layout tab</tspan>
        </text>
      </g>
    `;
    },

    /**
     * Render tier legend
     * @returns {string}
     */
    renderLegend() {
        const tiers = [
            { key: 'vip', label: 'VIP' },
            { key: 'premium', label: 'Premium' },
            { key: 'standard', label: 'Standard' },
            { key: 'economy', label: 'Economy' }
        ];

        return `
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <h4 class="text-sm font-semibold text-gray-900 mb-3">Pricing Tiers</h4>
        <div class="flex flex-wrap gap-4">
          ${tiers.map(tier => `
            <div class="flex items-center gap-2">
              <div 
                class="w-6 h-6 rounded border-2 border-gray-300"
                style="background-color: ${this.TIER_COLORS[tier.key]};"
              ></div>
              <span class="text-sm text-gray-700">${tier.label}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    },

    /**
     * Render seat details panel
     * @returns {string}
     */
    renderSeatDetails() {
        return `
      <div id="seat-details-panel" class="bg-white rounded-lg shadow-sm border border-gray-200 p-4" style="display: none;">
        <h4 class="text-sm font-semibold text-gray-900 mb-3">Seat Details</h4>
        <div id="seat-details-content" class="text-sm text-gray-700">
          <!-- Populated dynamically on hover/click -->
        </div>
      </div>
    `;
    },

    /**
     * Build seat map from venue layout
     * @param {Object} layout - Venue layout configuration
     * @returns {Object} Seat map
     */
    buildSeatMap(layout) {
        if (!layout || !layout.sections || layout.sections.length === 0) {
            return { sections: [], indexMap: {}, total: 0 };
        }

        const sections = [];
        const indexMap = {};
        let total = 0;

        layout.sections.forEach((section, sectionIndex) => {
            const rows = [];

            for (let rowIndex = 0; rowIndex < (section.rows || 0); rowIndex++) {
                const rowLabel = this.computeRowLabel(section, rowIndex);
                const seats = this.generateRowSeats(section, sectionIndex, rowIndex, rowLabel);

                rows.push({
                    rowLabel,
                    seats
                });

                seats.forEach(seat => {
                    indexMap[seat.fullId.toLowerCase()] = seat;
                    total++;
                });
            }

            sections.push({
                name: section.name,
                tier: section.tier || 'standard',
                rows
            });
        });

        return { sections, indexMap, total };
    },

    /**
     * Compute row label
     * @param {Object} section - Section configuration
     * @param {number} rowIndex - Row index
     * @returns {string}
     */
    computeRowLabel(section, rowIndex) {
        const startRow = section.startRow || 'A';
        const charCode = startRow.charCodeAt(0) + rowIndex;
        return String.fromCharCode(charCode);
    },

    /**
     * Generate seats for a row
     * @param {Object} section - Section configuration
     * @param {number} sectionIndex - Section index
     * @param {number} rowIndex - Row index
     * @param {string} rowLabel - Row label
     * @returns {Array} Array of seat objects
     */
    generateRowSeats(section, sectionIndex, rowIndex, rowLabel) {
        const seats = [];
        const numbering = section.seatNumbering || {
            globalDirection: 'ltr',
            startNumber: 1,
            prefix: '',
            suffix: '',
            skipNumbers: []
        };

        // Check for row override
        const rowConfig = section.rowsConfig?.find(r => r.rowLabel === rowLabel);
        const config = rowConfig || numbering;

        // Parse pattern if available
        const pattern = rowConfig?.pattern || '';
        const seatsPerRow = section.seatsPerRow || 20;

        if (pattern) {
            // Use pattern to generate seats
            return this.generateSeatsFromPattern(
                pattern,
                section,
                sectionIndex,
                rowLabel,
                config
            );
        } else {
            // Generate default seats
            return this.generateDefaultSeats(
                seatsPerRow,
                section,
                sectionIndex,
                rowLabel,
                config
            );
        }
    },

    /**
     * Generate seats from pattern string
     * @param {string} pattern - Pattern string (S=seat, H=gap, E=empty)
     * @param {Object} section - Section configuration
     * @param {number} sectionIndex - Section index
     * @param {string} rowLabel - Row label
     * @param {Object} config - Numbering configuration
     * @returns {Array} Array of seat objects
     */
    generateSeatsFromPattern(pattern, section, sectionIndex, rowLabel, config) {
        const seats = [];
        const sectionSlug = this.slugify(section.name);
        const skipNumbers = new Set(config.skip || config.skipNumbers || []);

        let seatNumber = config.startNumber || 1;
        let seatIndex = 0;

        for (let i = 0; i < pattern.length; i++) {
            const char = pattern[i].toUpperCase();

            if (char === 'S') {
                // Skip numbers in skip list
                while (skipNumbers.has(seatNumber)) {
                    seatNumber++;
                }

                const displayLabel = `${config.prefix || ''}${seatNumber}${config.suffix || ''}`;
                const fullId = `${sectionSlug}-${rowLabel.toLowerCase()}${seatNumber}`;

                seats.push({
                    fullId,
                    displayLabel,
                    sectionName: section.name,
                    rowLabel,
                    seatNumber,
                    tier: section.tier || 'standard',
                    seatIndex,
                    width: 1.0 // Default width, can be overridden by seat shapes
                });

                seatNumber++;
                seatIndex++;
            } else if (char === 'H') {
                // Gap - skip this position
                continue;
            } else if (char === 'E') {
                // Empty - skip this position
                continue;
            }
        }

        return seats;
    },

    /**
     * Generate default seats (no pattern)
     * @param {number} seatsPerRow - Number of seats per row
     * @param {Object} section - Section configuration
     * @param {number} sectionIndex - Section index
     * @param {string} rowLabel - Row label
     * @param {Object} config - Numbering configuration
     * @returns {Array} Array of seat objects
     */
    generateDefaultSeats(seatsPerRow, section, sectionIndex, rowLabel, config) {
        const seats = [];
        const sectionSlug = this.slugify(section.name);
        const skipNumbers = new Set(config.skip || config.skipNumbers || []);

        let seatNumber = config.startNumber || 1;

        for (let i = 0; i < seatsPerRow; i++) {
            // Skip numbers in skip list
            while (skipNumbers.has(seatNumber)) {
                seatNumber++;
            }

            const displayLabel = `${config.prefix || ''}${seatNumber}${config.suffix || ''}`;
            const fullId = `${sectionSlug}-${rowLabel.toLowerCase()}${seatNumber}`;

            seats.push({
                fullId,
                displayLabel,
                sectionName: section.name,
                rowLabel,
                seatNumber,
                tier: section.tier || 'standard',
                seatIndex: i,
                width: 1.0
            });

            seatNumber++;
        }

        return seats;
    },

    /**
     * Slugify string
     * @param {string} str - String to slugify
     * @returns {string}
     */
    slugify(str) {
        return str
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    },

    /**
     * Update preview with new venue layout
     * @param {Object} venueLayout - New venue layout
     */
    update(venueLayout) {
        this.venueLayout = venueLayout;
        this.seatMap = this.buildSeatMap(venueLayout);
        // Trigger re-render
    },

    /**
     * Zoom in
     */
    zoomIn() {
        this.scale = Math.min(this.scale * 1.2, 3.0);
        this.updateTransform();
    },

    /**
     * Zoom out
     */
    zoomOut() {
        this.scale = Math.max(this.scale / 1.2, 0.3);
        this.updateTransform();
    },

    /**
     * Reset view
     */
    resetView() {
        this.scale = 1.0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.updateTransform();
    },

    /**
     * Update SVG transform
     */
    updateTransform() {
        const canvas = document.getElementById('seat-map-canvas');
        if (canvas) {
            canvas.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
        }

        const zoomLevel = document.getElementById('preview-zoom-level');
        if (zoomLevel) {
            zoomLevel.textContent = `${Math.round(this.scale * 100)}%`;
        }
    },

    /**
     * Handle seat hover
     * @param {string} seatId - Seat ID
     */
    handleSeatHover(seatId) {
        this.hoveredSeat = seatId;
        const seat = this.seatMap.indexMap[seatId.toLowerCase()];

        if (seat) {
            this.showSeatDetails(seat);
        }
    },

    /**
     * Handle seat click
     * @param {string} seatId - Seat ID
     */
    handleSeatClick(seatId) {
        if (this.selectedSeats.has(seatId)) {
            this.selectedSeats.delete(seatId);
        } else {
            this.selectedSeats.add(seatId);
        }
    },

    /**
     * Show seat details
     * @param {Object} seat - Seat object
     */
    showSeatDetails(seat) {
        const panel = document.getElementById('seat-details-panel');
        const content = document.getElementById('seat-details-content');

        if (panel && content) {
            panel.style.display = 'block';
            content.innerHTML = `
        <div class="space-y-2">
          <div class="flex justify-between">
            <span class="font-medium">Seat:</span>
            <span>${seat.displayLabel}</span>
          </div>
          <div class="flex justify-between">
            <span class="font-medium">Row:</span>
            <span>${seat.rowLabel}</span>
          </div>
          <div class="flex justify-between">
            <span class="font-medium">Section:</span>
            <span>${seat.sectionName}</span>
          </div>
          <div class="flex justify-between">
            <span class="font-medium">Tier:</span>
            <span class="capitalize">${seat.tier}</span>
          </div>
          <div class="flex justify-between">
            <span class="font-medium">ID:</span>
            <span class="text-xs font-mono">${seat.fullId}</span>
          </div>
        </div>
      `;
        }
    },

    /**
     * Hide seat details
     */
    hideSeatDetails() {
        const panel = document.getElementById('seat-details-panel');
        if (panel) {
            panel.style.display = 'none';
        }
        this.hoveredSeat = null;
    }
};
