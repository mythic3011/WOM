import { SeatStatusColors, getSeatStatusOpacity } from "@utils/colors.js";

export class VirtualizationManager {
  constructor(options = {}) {
    this.svg = null;
    this.seatsLayer = null;
    this.viewport = { top: 0, bottom: 0, left: 0, right: 0 };
    this.buffer = options.buffer || 100;
    this.throttleDelay = options.throttleDelay || 16;
    this.lastUpdate = 0;
    this.pendingUpdate = false;
    this.placeholders = new Map();
    this.renderQueue = [];
    this.isProcessing = false;
    this.metrics = {
      totalSeats: 0,
      renderedSeats: 0,
      placeholders: 0,
      lastRenderTime: 0,
      avgRenderTime: 0,
      renderCount: 0,
    };
    this.onMetricsUpdate = options.onMetricsUpdate || null;
  }

  initialize(svgElement) {
    this.svg = svgElement;
    this.seatsLayer = this.svg.querySelector("#seats-layer");

    if (!this.seatsLayer) {
      console.warn("seats-layer not found in SVG");
      return false;
    }

    this.collectPlaceholders();
    this.attachScrollListener();
    this.updateViewport();

    return true;
  }

  collectPlaceholders() {
    const placeholderElements =
      this.seatsLayer.querySelectorAll(".seat-placeholder");
    this.metrics.totalSeats = this.seatsLayer.querySelectorAll(
      ".seat, .seat-placeholder"
    ).length;
    this.metrics.placeholders = placeholderElements.length;

    placeholderElements.forEach((placeholder) => {
      const section = placeholder.getAttribute("data-section");
      const row = placeholder.getAttribute("data-row");
      const key = `${section}-${row}`;

      if (!this.placeholders.has(key)) {
        this.placeholders.set(key, []);
      }
      this.placeholders.get(key).push(placeholder);
    });
  }

  attachScrollListener() {
    if (!this.svg) {return;}

    const container =
      this.svg.closest(".overflow-y-auto, .overflow-auto") ||
      this.svg.parentElement;

    if (container) {
      container.addEventListener("scroll", () => this.handleScroll(), {
        passive: true,
      });
    }

    const observer = new MutationObserver(() => {
      this.throttledUpdate();
    });

    observer.observe(this.seatsLayer, {
      attributes: true,
      attributeFilter: ["transform"],
    });
  }

  handleScroll() {
    this.throttledUpdate();
  }

  throttledUpdate() {
    const now = performance.now();

    if (now - this.lastUpdate < this.throttleDelay) {
      if (!this.pendingUpdate) {
        this.pendingUpdate = true;
        requestAnimationFrame(() => {
          this.pendingUpdate = false;
          this.updateViewport();
          this.processRenderQueue();
        });
      }
      return;
    }

    this.lastUpdate = now;
    this.updateViewport();
    this.processRenderQueue();
  }

  updateViewport() {
    if (!this.svg) {return;}

    const svgRect = this.svg.getBoundingClientRect();
    const transform = this.seatsLayer.getAttribute("transform");

    let panX = 0,
      panY = 0,
      scale = 1;

    if (transform) {
      const translateMatch = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
      const scaleMatch = transform.match(/scale\(([^)]+)\)/);

      if (translateMatch) {
        panX = parseFloat(translateMatch[1]) || 0;
        panY = parseFloat(translateMatch[2]) || 0;
      }

      if (scaleMatch) {
        scale = parseFloat(scaleMatch[1]) || 1;
      }
    }

    this.viewport = {
      top: (-panY - this.buffer) / scale,
      bottom: (svgRect.height - panY + this.buffer) / scale,
      left: (-panX - this.buffer) / scale,
      right: (svgRect.width - panX + this.buffer) / scale,
    };

    this.checkVisiblePlaceholders();
  }

  checkVisiblePlaceholders() {
    this.placeholders.forEach((placeholders, key) => {
      if (placeholders.length === 0) {return;}

      const firstPlaceholder = placeholders[0];
      const y = parseFloat(firstPlaceholder.getAttribute("y"));
      const height = parseFloat(firstPlaceholder.getAttribute("height"));

      const isVisible =
        y + height >= this.viewport.top && y <= this.viewport.bottom;

      if (isVisible && !this.renderQueue.includes(key)) {
        this.renderQueue.push(key);
      }
    });
  }

  async processRenderQueue() {
    if (this.isProcessing || this.renderQueue.length === 0) {return;}

    this.isProcessing = true;
    const startTime = performance.now();
    const batch = this.renderQueue.splice(0, 3);

    for (const key of batch) {
      await this.loadRowSeats(key);
    }

    const renderTime = performance.now() - startTime;
    this.updateMetrics(renderTime);

    this.isProcessing = false;

    if (this.renderQueue.length > 0) {
      requestAnimationFrame(() => this.processRenderQueue());
    }
  }

  async loadRowSeats(key) {
    const placeholders = this.placeholders.get(key);
    if (!placeholders || placeholders.length === 0) {return;}

    const firstPlaceholder = placeholders[0];
    const section = parseInt(firstPlaceholder.getAttribute("data-section"));
    const row = parseInt(firstPlaceholder.getAttribute("data-row"));

    const loadingColor = SeatStatusColors.loading.rgb;
    const loadingOpacity = getSeatStatusOpacity("loading");

    placeholders.forEach((placeholder) => {
      placeholder.setAttribute("fill", loadingColor);
      placeholder.setAttribute("opacity", loadingOpacity);
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    const seatData = this.generateRowSeats(section, row, placeholders);

    placeholders.forEach((placeholder, index) => {
      if (seatData[index]) {
        this.replacePlaceholder(placeholder, seatData[index]);
      }
    });

    this.placeholders.delete(key);
    this.metrics.renderedSeats += placeholders.length;
    this.metrics.placeholders -= placeholders.length;
  }

  generateRowSeats(section, row, placeholders) {
    return placeholders.map((placeholder, index) => {
      const x = parseFloat(placeholder.getAttribute("x"));
      const y = parseFloat(placeholder.getAttribute("y"));
      const width = parseFloat(placeholder.getAttribute("width"));
      const height = parseFloat(placeholder.getAttribute("height"));

      const rowLabel = String.fromCharCode(65 + row);
      const seatNumber = index + 1;
      const seatId = `${rowLabel}${seatNumber}`;

      return {
        x,
        y,
        width,
        height,
        seatId,
        rowLabel,
        seatNumber,
        section,
        status: "available",
        color: this.getSectionColor(section),
      };
    });
  }

  replacePlaceholder(placeholder, seatData) {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("class", "seat interactive-seat available");
    group.setAttribute("data-seat-id", seatData.seatId);
    group.setAttribute("data-section", seatData.section);
    group.setAttribute("data-status", seatData.status);
    group.setAttribute("data-virtualized", "loaded");

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", seatData.x);
    rect.setAttribute("y", seatData.y);
    rect.setAttribute("width", seatData.width);
    rect.setAttribute("height", seatData.height);
    rect.setAttribute("fill", seatData.color);
    rect.setAttribute("rx", "3");
    rect.setAttribute("class", "fill-emerald-500 stroke-emerald-600");

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", seatData.x + seatData.width / 2);
    text.setAttribute("y", seatData.y + seatData.height / 2);
    text.setAttribute("fill", "white");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.setAttribute("font-size", "9");
    text.setAttribute("font-weight", "bold");
    text.setAttribute("class", "seat-number");
    text.textContent = seatData.seatNumber;

    group.appendChild(rect);
    group.appendChild(text);

    placeholder.parentNode.replaceChild(group, placeholder);
  }

  getSectionColor(sectionIndex) {
    const colors = [
      "rgb(168, 85, 247)",
      "rgb(59, 130, 246)",
      "rgb(236, 72, 153)",
      "rgb(245, 158, 11)",
      "rgb(16, 185, 129)",
      "rgb(99, 102, 241)",
    ];
    return colors[sectionIndex % colors.length];
  }

  updateMetrics(renderTime) {
    this.metrics.lastRenderTime = renderTime;
    this.metrics.renderCount++;
    this.metrics.avgRenderTime =
      (this.metrics.avgRenderTime * (this.metrics.renderCount - 1) +
        renderTime) /
      this.metrics.renderCount;

    if (this.onMetricsUpdate) {
      this.onMetricsUpdate(this.metrics);
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      placeholdersRemaining: this.placeholders.size,
      queueLength: this.renderQueue.length,
      viewport: { ...this.viewport },
    };
  }

  destroy() {
    this.placeholders.clear();
    this.renderQueue = [];
    this.svg = null;
    this.seatsLayer = null;
  }
}
