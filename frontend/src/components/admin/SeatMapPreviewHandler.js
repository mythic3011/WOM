/**
 * SeatMapPreviewHandler
 * 
 * Event handlers and real-time update logic for SeatMapPreview component
 */

import { SeatMapPreview } from './SeatMapPreview.js';

export const SeatMapPreviewHandler = {
    previewContainer: null,
    updateDebounceTimer: null,

    /**
     * Initialize event handlers
     * @param {HTMLElement} container - Container element
     * @param {Object} venueLayout - Initial venue layout
     */
    init(container, venueLayout) {
        this.previewContainer = container;

        // Render initial preview
        container.innerHTML = SeatMapPreview.render(venueLayout);

        // Attach event handlers
        this.attachZoomControls();
        this.attachPanControls();
        this.attachSeatInteractions();
        this.attachRefreshButton();

        // Watch for venue configuration changes
        this.watchVenueChanges();
    },

    /**
     * Attach zoom control handlers
     */
    attachZoomControls() {
        const zoomInBtn = document.getElementById('preview-zoom-in-btn');
        const zoomOutBtn = document.getElementById('preview-zoom-out-btn');
        const resetViewBtn = document.getElementById('preview-reset-view-btn');

        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => {
                SeatMapPreview.zoomIn();
            });
        }

        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => {
                SeatMapPreview.zoomOut();
            });
        }

        if (resetViewBtn) {
            resetViewBtn.addEventListener('click', () => {
                SeatMapPreview.resetView();
            });
        }

        // Mouse wheel zoom
        const canvas = document.getElementById('seat-map-canvas-container');
        if (canvas) {
            canvas.addEventListener('wheel', (e) => {
                e.preventDefault();
                if (e.deltaY < 0) {
                    SeatMapPreview.zoomIn();
                } else {
                    SeatMapPreview.zoomOut();
                }
            });
        }
    },

    /**
     * Attach pan control handlers
     */
    attachPanControls() {
        const container = document.getElementById('seat-map-canvas-container');
        if (!container) return;

        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let initialOffsetX = 0;
        let initialOffsetY = 0;

        container.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialOffsetX = SeatMapPreview.offsetX;
            initialOffsetY = SeatMapPreview.offsetY;
            container.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            SeatMapPreview.offsetX = initialOffsetX + deltaX;
            SeatMapPreview.offsetY = initialOffsetY + deltaY;
            SeatMapPreview.updateTransform();
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                container.style.cursor = 'grab';
            }
        });
    },

    /**
     * Attach seat interaction handlers
     */
    attachSeatInteractions() {
        const canvas = document.getElementById('seat-map-canvas');
        if (!canvas) return;

        // Hover handler
        canvas.addEventListener('mouseover', (e) => {
            const seatGroup = e.target.closest('.seat-group');
            if (seatGroup) {
                const seatId = seatGroup.getAttribute('data-seat-id');
                SeatMapPreview.handleSeatHover(seatId);
                this.refreshSeatHighlight();
            }
        });

        canvas.addEventListener('mouseout', (e) => {
            const seatGroup = e.target.closest('.seat-group');
            if (seatGroup && !e.relatedTarget?.closest('.seat-group')) {
                SeatMapPreview.hideSeatDetails();
                this.refreshSeatHighlight();
            }
        });

        // Click handler
        canvas.addEventListener('click', (e) => {
            const seatGroup = e.target.closest('.seat-group');
            if (seatGroup) {
                const seatId = seatGroup.getAttribute('data-seat-id');
                SeatMapPreview.handleSeatClick(seatId);
                this.refreshSeatHighlight();
            }
        });
    },

    /**
     * Attach refresh button handler
     */
    attachRefreshButton() {
        const refreshBtn = document.getElementById('preview-refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshPreview();
            });
        }
    },

    /**
     * Watch for venue configuration changes
     */
    watchVenueChanges() {
        // Watch for changes in form inputs
        const formInputs = document.querySelectorAll(
            '.venue-edit-form input, .venue-edit-form select, .venue-edit-form textarea'
        );

        formInputs.forEach(input => {
            input.addEventListener('input', () => {
                this.scheduleUpdate();
            });

            input.addEventListener('change', () => {
                this.scheduleUpdate();
            });
        });

        // Watch for section/aisle/tier additions and removals
        const observer = new MutationObserver(() => {
            this.scheduleUpdate();
        });

        const sectionsContainer = document.getElementById('sections-container');
        if (sectionsContainer) {
            observer.observe(sectionsContainer, {
                childList: true,
                subtree: true
            });
        }
    },

    /**
     * Schedule preview update (debounced)
     */
    scheduleUpdate() {
        if (this.updateDebounceTimer) {
            clearTimeout(this.updateDebounceTimer);
        }

        this.updateDebounceTimer = setTimeout(() => {
            this.refreshPreview();
        }, 500); // 500ms debounce
    },

    /**
     * Refresh preview with current form data
     */
    refreshPreview() {
        // Get current venue layout from form
        const venueLayout = this.getVenueLayoutFromForm();

        // Update preview
        SeatMapPreview.update(venueLayout);

        // Re-render
        if (this.previewContainer) {
            this.previewContainer.innerHTML = SeatMapPreview.render(venueLayout);

            // Re-attach event handlers
            this.attachZoomControls();
            this.attachPanControls();
            this.attachSeatInteractions();
            this.attachRefreshButton();
        }
    },

    /**
     * Get venue layout from form data
     * @returns {Object} Venue layout
     */
    getVenueLayoutFromForm() {
        // This should integrate with VenueEditForm to get current form state
        // For now, we'll use a simplified version

        const sections = [];
        const sectionElements = document.querySelectorAll('[data-section-index]');

        const sectionIndices = new Set();
        sectionElements.forEach(el => {
            const index = parseInt(el.getAttribute('data-section-index'));
            if (!isNaN(index)) {
                sectionIndices.add(index);
            }
        });

        sectionIndices.forEach(index => {
            const nameInput = document.querySelector(`.section-name[data-section-index="${index}"]`);
            const rowsInput = document.querySelector(`.section-rows[data-section-index="${index}"]`);
            const seatsInput = document.querySelector(`.section-seats-per-row[data-section-index="${index}"]`);
            const tierSelect = document.querySelector(`.section-tier[data-section-index="${index}"]`);
            const startRowInput = document.querySelector(`.section-start-row[data-section-index="${index}"]`);

            if (nameInput && rowsInput && seatsInput) {
                const section = {
                    name: nameInput.value || `Section ${index + 1}`,
                    rows: parseInt(rowsInput.value) || 10,
                    seatsPerRow: parseInt(seatsInput.value) || 20,
                    tier: tierSelect?.value || 'standard',
                    startRow: startRowInput?.value || 'A',
                    horizontalAisles: this.getHorizontalAisles(index),
                    seatNumbering: this.getSeatNumbering(index),
                    rowsConfig: this.getRowsConfig(index)
                };

                sections.push(section);
            }
        });

        return { sections };
    },

    /**
     * Get horizontal aisles for a section
     * @param {number} sectionIndex - Section index
     * @returns {Array} Horizontal aisles
     */
    getHorizontalAisles(sectionIndex) {
        const aisles = [];
        const aisleElements = document.querySelectorAll(
            `.aisle-after-row[data-section-index="${sectionIndex}"]`
        );

        aisleElements.forEach((el, aisleIndex) => {
            const afterRowInput = el;
            const heightInput = document.querySelector(
                `.aisle-height[data-section-index="${sectionIndex}"][data-aisle-index="${aisleIndex}"]`
            );

            if (afterRowInput && heightInput) {
                aisles.push({
                    afterRow: afterRowInput.value,
                    height: parseFloat(heightInput.value) || 1
                });
            }
        });

        return aisles;
    },

    /**
     * Get seat numbering configuration for a section
     * @param {number} sectionIndex - Section index
     * @returns {Object} Seat numbering config
     */
    getSeatNumbering(sectionIndex) {
        const directionSelect = document.querySelector(
            `.numbering-direction[data-section-index="${sectionIndex}"]`
        );
        const startNumberInput = document.querySelector(
            `.numbering-start-number[data-section-index="${sectionIndex}"]`
        );
        const prefixInput = document.querySelector(
            `.numbering-prefix[data-section-index="${sectionIndex}"]`
        );
        const suffixInput = document.querySelector(
            `.numbering-suffix[data-section-index="${sectionIndex}"]`
        );

        // Get skip numbers
        const skipNumbers = [];
        const skipContainer = document.querySelector(
            `[data-skip-container][data-section-index="${sectionIndex}"]`
        );
        if (skipContainer) {
            const skipSpans = skipContainer.querySelectorAll('span');
            skipSpans.forEach(span => {
                const text = span.textContent.trim();
                const num = parseInt(text);
                if (!isNaN(num)) {
                    skipNumbers.push(num);
                }
            });
        }

        return {
            globalDirection: directionSelect?.value || 'ltr',
            startNumber: parseInt(startNumberInput?.value) || 1,
            prefix: prefixInput?.value || '',
            suffix: suffixInput?.value || '',
            skipNumbers
        };
    },

    /**
     * Get row configurations for a section
     * @param {number} sectionIndex - Section index
     * @returns {Array} Row configurations
     */
    getRowsConfig(sectionIndex) {
        // This would need to be implemented based on the per-row override tab
        // For now, return empty array
        return [];
    },

    /**
     * Refresh seat highlight based on hover/selection state
     */
    refreshSeatHighlight() {
        // Re-render the SVG with updated hover/selection state
        const canvas = document.getElementById('seat-map-canvas');
        if (canvas) {
            const svgContent = SeatMapPreview.renderSeatMapSVG();
            // Update only the seat elements to avoid full re-render
            // This is a simplified approach - in production, you'd want more efficient updates
        }
    },

    /**
     * Destroy handler and clean up
     */
    destroy() {
        if (this.updateDebounceTimer) {
            clearTimeout(this.updateDebounceTimer);
        }

        // Remove event listeners
        // (In a real implementation, you'd track and remove all listeners)
    }
};
