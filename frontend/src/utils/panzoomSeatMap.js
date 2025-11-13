class CustomSVGPanZoom {
  constructor(svg, layer, options = {}) {
    this.svg = svg;
    this.layer = layer;

    this.scale = 1;
    this.panX = 0;
    this.panY = 0;
    this.isPanning = false;
    this.isZooming = false;
    this.lastTouchDistance = null;

    this.minZoom = options.minZoom || 0.5;
    this.maxZoom = options.maxZoom || 3;
    this.zoomSensitivity = options.zoomSensitivity || 0.1;
    this.minZoomRelativeToFit =
      options.minZoomRelativeToFit !== undefined
        ? options.minZoomRelativeToFit
        : 0.85;

    this.dragStart = { x: 0, y: 0 };
    this.panStart = { x: 0, y: 0 };

    this.viewBox = this._getViewBox();
    this.containerSize = this._getContainerSize();
    this.contentSize = this._getContentSize();

    this.boundHandleWheel = this._handleWheel.bind(this);
    this.boundHandleMouseDown = this._handleMouseDown.bind(this);
    this.boundHandleMouseMove = this._handleMouseMove.bind(this);
    this.boundHandleMouseUp = this._handleMouseUp.bind(this);
    this.boundHandleTouchStart = this._handleTouchStart.bind(this);
    this.boundHandleTouchMove = this._handleTouchMove.bind(this);
    this.boundHandleTouchEnd = this._handleTouchEnd.bind(this);

    this.layer.style.transformOrigin = "0 0";
    this.layer.style.transformBox = "fill-box";
    this.layer.style.pointerEvents = "all";

    this._attachEventListeners();
    this._updateTransform();
  }

  _getViewBox() {
    const viewBoxAttr = this.svg.getAttribute("viewBox");
    if (viewBoxAttr) {
      const [x, y, width, height] = viewBoxAttr.split(" ").map(Number);
      return { x, y, width, height };
    }
    const rect = this.svg.getBoundingClientRect();
    return { x: 0, y: 0, width: rect.width, height: rect.height };
  }

  _getContainerSize() {
    const rect = this.svg.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }

  _getContentSize() {
    try {
      const box = this.layer.getBBox();
      const width = Math.max(1, box.width);
      const height = Math.max(1, box.height);
      return { width, height };
    } catch (e) {
      return { width: this.viewBox.width, height: this.viewBox.height };
    }
  }

  _attachEventListeners() {
    this.svg.addEventListener("wheel", this.boundHandleWheel, {
      passive: false,
    });
    this.svg.addEventListener("mousedown", this.boundHandleMouseDown);
    this.svg.addEventListener("touchstart", this.boundHandleTouchStart, {
      passive: true,
    });
    this.svg.addEventListener("touchmove", this.boundHandleTouchMove, {
      passive: true,
    });
    this.svg.addEventListener("touchend", this.boundHandleTouchEnd, {
      passive: true,
    });
  }

  _handleWheel(e) {
    e.preventDefault();

    const rect = this.svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = -e.deltaY;
    const scaleFactor =
      delta > 0 ? 1 + this.zoomSensitivity : 1 - this.zoomSensitivity;

    this._zoomAtPoint(mouseX, mouseY, scaleFactor);
  }

  _handleMouseDown(e) {
    if (e.target.closest(".seat, .interactive-seat")) {
      this.isPanning = false;
      return;
    }

    this.dragStart = { x: e.clientX, y: e.clientY };
    this.panStart = { x: this.panX, y: this.panY };
    this.isPanCandidate = true;
    this.isPanning = false;

    this.layer.style.transition = "none";

    document.addEventListener("mousemove", this.boundHandleMouseMove);
    document.addEventListener("mouseup", this.boundHandleMouseUp);
  }

  _handleMouseMove(e) {
    if (this.isPanCandidate && !this.isPanning) {
      const dx = e.clientX - this.dragStart.x;
      const dy = e.clientY - this.dragStart.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > 5) {
        this.isPanning = true;
        this.isPanCandidate = false;
      }
    }

    if (!this.isPanning) return;

    const dx = e.clientX - this.dragStart.x;
    const dy = e.clientY - this.dragStart.y;

    this.panX = this.panStart.x + dx;
    this.panY = this.panStart.y + dy;

    this._clampPan();
    this._updateTransform();
  }

  _handleMouseUp() {
    this.isPanning = false;
    this.isPanCandidate = false;
    this.layer.style.transition = "none";

    document.removeEventListener("mousemove", this.boundHandleMouseMove);
    document.removeEventListener("mouseup", this.boundHandleMouseUp);
  }

  _handleTouchStart(e) {
    if (e.touches.length === 1) {
      if (e.target.closest(".seat, .interactive-seat")) {
        return;
      }
      this.isPanning = true;
      this.dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      this.panStart = { x: this.panX, y: this.panY };
      this.layer.style.transition = "none";
    } else if (e.touches.length === 2) {
      this.isPanning = false;
      const distance = this._getTouchDistance(e.touches[0], e.touches[1]);
      this.lastTouchDistance = distance;
      this.layer.style.transition = "none";
    }
  }

  _handleTouchMove(e) {
    if (e.touches.length === 1 && this.isPanning) {
      const dx = e.touches[0].clientX - this.dragStart.x;
      const dy = e.touches[0].clientY - this.dragStart.y;

      this.panX = this.panStart.x + dx;
      this.panY = this.panStart.y + dy;

      this._clampPan();
      this._updateTransform();
    } else if (e.touches.length === 2 && this.lastTouchDistance !== null) {
      const distance = this._getTouchDistance(e.touches[0], e.touches[1]);
      const scaleFactor = distance / this.lastTouchDistance;

      const rect = this.svg.getBoundingClientRect();
      const midX =
        (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;

      this._zoomAtPoint(midX, midY, scaleFactor);
      this.lastTouchDistance = distance;
    }
  }

  _handleTouchEnd(e) {
    if (e.touches.length < 2) {
      this.lastTouchDistance = null;
    }
    if (e.touches.length === 0) {
      this.isPanning = false;
      this.layer.style.transition = "none";
    }
  }

  _getTouchDistance(touch1, touch2) {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  _zoomAtPoint(x, y, scaleFactor) {
    const calculatedScale = this.scale * scaleFactor;
    const dynamicMinZoom = this._calculateDynamicMinZoom();

    const newScale = Math.max(
      dynamicMinZoom,
      Math.min(this.maxZoom, calculatedScale)
    );

    if (newScale === this.scale) return;

    const scaleChange = newScale / this.scale;

    this.panX = x - (x - this.panX) * scaleChange;
    this.panY = y - (y - this.panY) * scaleChange;

    this.scale = newScale;

    this._clampPan();
    this._updateTransform();
  }

  _calculateDynamicMinZoom() {
    const { width, height } = this.containerSize;
    const content = this.contentSize || this._getContentSize();
    const scaleX = width / content.width;
    const scaleY = height / content.height;

    const fitScale = Math.min(scaleX, scaleY);

    const absoluteMinZoom = this.minZoom;
    const dynamicMinZoom = Math.max(
      absoluteMinZoom,
      fitScale * this.minZoomRelativeToFit
    );

    return Math.min(dynamicMinZoom, 1.0);
  }

  _clampPan() {
    this.containerSize = this._getContainerSize();

    const margin = 50;
    const minVisibleRatio = 0.2;

    const content = this.contentSize || this._getContentSize();
    const scaledWidth = content.width * this.scale;
    const scaledHeight = content.height * this.scale;
    const { width, height } = this.containerSize;

    let leftLimit, rightLimit, topLimit, bottomLimit;

    if (scaledWidth > width) {
      leftLimit = -(scaledWidth - width) - margin;
      rightLimit = margin;
    } else {
      const minVisible = scaledWidth * minVisibleRatio;
      leftLimit = minVisible - scaledWidth;
      rightLimit = width - minVisible;
    }

    if (scaledHeight > height) {
      topLimit = -(scaledHeight - height) - margin;
      bottomLimit = margin;
    } else {
      const minVisible = scaledHeight * minVisibleRatio;
      topLimit = minVisible - scaledHeight;
      bottomLimit = height - minVisible;
    }

    this.panX = Math.max(leftLimit, Math.min(rightLimit, this.panX));
    this.panY = Math.max(topLimit, Math.min(bottomLimit, this.panY));
  }

  _updateTransform() {
    const t = `translate(${this.panX}, ${this.panY}) scale(${this.scale})`;
    this.layer.setAttribute("transform", t);
  }

  _animateZoom(targetScale, duration = 150) {
    this.isZooming = true;

    this.containerSize = this._getContainerSize();
    const dynamicMinZoom = this._calculateDynamicMinZoom();
    const newScale = Math.max(
      dynamicMinZoom,
      Math.min(this.maxZoom, targetScale)
    );

    const rect = this.svg.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const scaleChange = newScale / this.scale;

    const endPanX = centerX - (centerX - this.panX) * scaleChange;
    const endPanY = centerY - (centerY - this.panY) * scaleChange;
    const startPanX = this.panX;
    const startPanY = this.panY;
    const startScale = this.scale;

    const start = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);

    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const k = ease(t);
      this.scale = startScale + (newScale - startScale) * k;
      this.panX = startPanX + (endPanX - startPanX) * k;
      this.panY = startPanY + (endPanY - startPanY) * k;
      this._clampPan();
      this._updateTransform();
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        this.isZooming = false;
      }
    };
    requestAnimationFrame(step);
  }

  smoothZoom(x, y, scaleBy) {
    const newScale = this.scale * scaleBy;
    this._animateZoom(newScale);
  }

  zoomTo(x, y, newScale) {
    this._animateZoom(newScale);
  }

  zoomIn() {
    this._animateZoom(this.scale * 1.1);
  }

  zoomOut() {
    this._animateZoom(this.scale * 0.9);
  }

  resetZoom() {
    this._animateZoom(1);
  }

  resetPan() {
    this.panX = 0;
    this.panY = 0;
    this._clampPan();
    this._updateTransform();
  }

  moveTo(x, y) {
    this.panX = x;
    this.panY = y;
    this._clampPan();
    this._updateTransform();
  }

  panBy(delta) {
    this.panX += delta.x || 0;
    this.panY += delta.y || 0;
    this._clampPan();
    this._updateTransform();
  }

  panUp(amount = 50) {
    this.panBy({ x: 0, y: amount });
  }

  panDown(amount = 50) {
    this.panBy({ x: 0, y: -amount });
  }

  panLeft(amount = 50) {
    this.panBy({ x: amount, y: 0 });
  }

  panRight(amount = 50) {
    this.panBy({ x: -amount, y: 0 });
  }

  center() {
    this.containerSize = this._getContainerSize();
    this.contentSize = this._getContentSize();
    const { width, height } = this.containerSize;
    const scaledWidth = this.contentSize.width * this.scale;
    const scaledHeight = this.contentSize.height * this.scale;

    this.panX = (width - scaledWidth) / 2;
    this.panY = (height - scaledHeight) / 2;

    this._updateTransform();
  }

  fit() {
    this.containerSize = this._getContainerSize();
    this.contentSize = this._getContentSize();
    const { width, height } = this.containerSize;
    const scaleX = width / this.contentSize.width;
    const scaleY = height / this.contentSize.height;
    const newScale = Math.min(scaleX, scaleY, this.maxZoom);

    this.scale = Math.max(this.minZoom, newScale);
    this.center();
  }

  resize() {
    this.containerSize = this._getContainerSize();
    this.contentSize = this._getContentSize();
    this._clampPan();
    this._updateTransform();
  }

  destroy() {
    this.svg.removeEventListener("wheel", this.boundHandleWheel);
    this.svg.removeEventListener("mousedown", this.boundHandleMouseDown);
    this.svg.removeEventListener("touchstart", this.boundHandleTouchStart);
    this.svg.removeEventListener("touchmove", this.boundHandleTouchMove);
    this.svg.removeEventListener("touchend", this.boundHandleTouchEnd);

    document.removeEventListener("mousemove", this.boundHandleMouseMove);
    document.removeEventListener("mouseup", this.boundHandleMouseUp);
  }
}

export function initSeatMapPanzoom() {
  const svg = document.querySelector("#seatMap svg");
  if (!svg) return null;

  const layer = svg.querySelector("#seats-layer");
  if (!layer) {
    console.warn("seats-layer not found in SVG");
    return null;
  }

  const instance = new CustomSVGPanZoom(svg, layer, {
    minZoom: 0.5,
    maxZoom: 3,
    zoomSensitivity: 0.1,
  });

  svg.addEventListener(
    "wheel",
    function (e) {
      e.stopPropagation();
    },
    { passive: true }
  );

  svg.addEventListener(
    "touchstart",
    function (e) {
      e.stopPropagation();
    },
    { passive: true }
  );

  svg.addEventListener(
    "touchmove",
    function (e) {
      e.stopPropagation();
    },
    { passive: true }
  );

  document.addEventListener("keydown", function (e) {
    if (
      !svg.contains(document.activeElement) &&
      document.activeElement.tagName !== "BODY"
    ) {
      return;
    }

    const panStep = 50;
    let handled = false;

    switch (e.key) {
      case "ArrowUp":
      case "Up":
      case "w":
      case "W":
        instance.panBy({ x: 0, y: panStep });
        handled = true;
        break;
      case "ArrowDown":
      case "Down":
      case "s":
      case "S":
        instance.panBy({ x: 0, y: -panStep });
        handled = true;
        break;
      case "ArrowLeft":
      case "Left":
      case "a":
      case "A":
        instance.panBy({ x: panStep, y: 0 });
        handled = true;
        break;
      case "ArrowRight":
      case "Right":
      case "d":
      case "D":
        instance.panBy({ x: -panStep, y: 0 });
        handled = true;
        break;
    }

    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  setTimeout(() => {
    instance.resize();
    instance.fit();
  }, 100);

  const isTouchDevice =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;

  if (isTouchDevice) {
    const hint = document.createElement("div");
    hint.className =
      "fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-4 py-2 rounded-full shadow-lg z-50 pointer-events-none";
    hint.textContent = "Pinch to zoom, drag to pan";
    hint.style.opacity = "0.9";
    document.body.appendChild(hint);
    setTimeout(() => {
      hint.style.transition = "opacity 0.5s";
      hint.style.opacity = "0";
      setTimeout(() => hint.remove(), 500);
    }, 3000);
  }

  return {
    smoothZoom: function (x, y, scaleBy) {
      instance.smoothZoom(x, y, scaleBy);
    },
    zoomTo: function (x, y, newScale) {
      instance.zoomTo(x, y, newScale);
    },
    zoomIn: function () {
      instance.zoomIn();
    },
    zoomOut: function () {
      instance.zoomOut();
    },
    resetZoom: function () {
      instance.resetZoom();
    },
    resetPan: function () {
      instance.resetPan();
    },
    moveTo: function (x, y) {
      instance.moveTo(x, y);
    },
    panBy: function (delta) {
      instance.panBy(delta);
    },
    panUp: function (amount = 50) {
      instance.panUp(amount);
    },
    panDown: function (amount = 50) {
      instance.panDown(amount);
    },
    panLeft: function (amount = 50) {
      instance.panLeft(amount);
    },
    panRight: function (amount = 50) {
      instance.panRight(amount);
    },
    _center: function () {
      instance.center();
    },
    _fit: function () {
      instance.fit();
    },
    _clamp: function () {
      instance.resize();
    },
    resize: function () {
      instance.resize();
    },
    updateBBox: function () {},
    isPanning: function () {
      return instance.isPanning;
    },
    dispose: function () {
      instance.destroy();
    },
    getInstance: function () {
      return instance;
    },
  };
}
