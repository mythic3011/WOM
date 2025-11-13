import svgPanZoom from "svg-pan-zoom";

export function initSeatMapPanzoom() {
  const svg = document.querySelector("#seatMap svg");
  if (!svg) return null;

  const layer = svg.querySelector("#seats-layer");
  if (!layer) {
    console.warn("seats-layer not found in SVG");
    return null;
  }

  const instance = svgPanZoom(svg, {
    viewportSelector: "#seats-layer",
    panEnabled: true,
    controlIconsEnabled: false,
    zoomEnabled: true,
    dblClickZoomEnabled: false,
    mouseWheelZoomEnabled: true,
    preventMouseEventsDefault: true,
    zoomScaleSensitivity: 0.3,
    minZoom: 0.5,
    maxZoom: 3,
    fit: false,
    contain: false,
    center: true,
    refreshRate: "auto",
    beforePan: function (oldPan, newPan) {
      const sizes = this.getSizes();
      const viewBox = sizes.viewBox;
      const realZoom = sizes.realZoom;
      const width = sizes.width;
      const height = sizes.height;

      const scaledWidth = viewBox.width * realZoom;
      const scaledHeight = viewBox.height * realZoom;

      const margin = 20;

      let leftLimit, rightLimit, topLimit, bottomLimit;

      if (scaledWidth > width) {
        leftLimit = -(scaledWidth - width) - margin;
        rightLimit = margin;
      } else {
        leftLimit = rightLimit = (width - scaledWidth) / 2;
      }

      if (scaledHeight > height) {
        topLimit = -(scaledHeight - height) - margin;
        bottomLimit = margin;
      } else {
        topLimit = bottomLimit = (height - scaledHeight) / 2;
      }

      const customPan = {
        x: Math.max(leftLimit, Math.min(rightLimit, newPan.x)),
        y: Math.max(topLimit, Math.min(bottomLimit, newPan.y)),
      };

      return customPan;
    },
    onZoom: function (scale) {
      layer.classList.add("seats-transform-ease");
    },
    onPan: function (point) {
      layer.classList.add("seats-transform-ease");
    },
  });

  svg.addEventListener(
    "wheel",
    function (e) {
      e.stopPropagation();
    },
    { passive: false }
  );

  svg.addEventListener(
    "touchmove",
    function (e) {
      e.stopPropagation();
    },
    { passive: false }
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
        instance.panBy({ x: 0, y: panStep });
        handled = true;
        break;
      case "ArrowDown":
        instance.panBy({ x: 0, y: -panStep });
        handled = true;
        break;
      case "ArrowLeft":
        instance.panBy({ x: panStep, y: 0 });
        handled = true;
        break;
      case "ArrowRight":
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
    instance.center();
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
      const currentZoom = instance.getZoom();
      const newZoom = currentZoom * scaleBy;
      instance.zoom(newZoom);
    },
    zoomTo: function (x, y, newScale) {
      instance.zoom(newScale);
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
      instance.pan({ x, y });
    },
    panBy: function (delta) {
      instance.panBy(delta);
    },
    panUp: function (amount = 50) {
      instance.panBy({ x: 0, y: amount });
    },
    panDown: function (amount = 50) {
      instance.panBy({ x: 0, y: -amount });
    },
    panLeft: function (amount = 50) {
      instance.panBy({ x: amount, y: 0 });
    },
    panRight: function (amount = 50) {
      instance.panBy({ x: -amount, y: 0 });
    },
    _center: function () {
      instance.center();
      instance.fit();
    },
    _clamp: function () {
      instance.resize();
    },
    resize: function () {
      instance.resize();
    },
    updateBBox: function () {
      instance.updateBBox();
    },
    isPanning: function () {
      return false;
    },
    dispose: function () {
      instance.destroy();
    },
    getInstance: function () {
      return instance;
    },
  };
}
