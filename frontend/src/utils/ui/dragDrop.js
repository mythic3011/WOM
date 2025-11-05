export class DragDropManager {
  constructor(options = {}) {
    this.gridSize = options.gridSize || 8;
    this.snapToGrid = options.snapToGrid !== false;
    this.draggedElement = null;
    this.offsetX = 0;
    this.offsetY = 0;
    this.isDragging = false;
    this.onDragStart = options.onDragStart || (() => {});
    this.onDrag = options.onDrag || (() => {});
    this.onDragEnd = options.onDragEnd || (() => {});
  }

  makeElementDraggable(element, options = {}) {
    const { handle, containment, grid = this.gridSize } = options;

    const dragHandle = handle ? element.querySelector(handle) : element;
    if (!dragHandle) return;

    dragHandle.style.cursor = "grab";
    dragHandle.dataset.draggable = "true";

    const handleMouseDown = (e) => {
      if (e.button !== 0) return;

      e.preventDefault();
      e.stopPropagation();

      this.startDrag(element, e, { containment, grid });
      dragHandle.style.cursor = "grabbing";
    };

    const handleTouchStart = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.startDrag(element, touch, { containment, grid });
      dragHandle.style.cursor = "grabbing";
    };

    dragHandle.addEventListener("mousedown", handleMouseDown);
    dragHandle.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });

    element._dragDropCleanup = () => {
      dragHandle.removeEventListener("mousedown", handleMouseDown);
      dragHandle.removeEventListener("touchstart", handleTouchStart);
      this.stopDrag();
    };
  }

  startDrag(element, event, options = {}) {
    this.draggedElement = element;
    this.isDragging = true;

    const rect = element.getBoundingClientRect();
    this.offsetX = event.clientX - rect.left;
    this.offsetY = event.clientY - rect.top;

    element.style.position = "absolute";
    element.style.zIndex = "1000";
    element.classList.add("dragging");

    this.onDragStart(element, { x: event.clientX, y: event.clientY });

    const handleMouseMove = (e) => this.drag(e, options);
    const handleTouchMove = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.drag(touch, options);
    };
    const handleMouseUp = (e) => this.stopDrag(e, options);
    const handleTouchEnd = (e) => {
      const touch = e.changedTouches[0];
      this.stopDrag(touch, options);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchend", handleTouchEnd);

    this._cleanupHandlers = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }

  drag(event, options = {}) {
    if (!this.isDragging || !this.draggedElement) return;

    let x = event.clientX - this.offsetX;
    let y = event.clientY - this.offsetY;

    if (options.containment) {
      const container =
        typeof options.containment === "string"
          ? document.querySelector(options.containment)
          : options.containment;

      if (container) {
        const containerRect = container.getBoundingClientRect();
        const elementRect = this.draggedElement.getBoundingClientRect();

        x = Math.max(
          containerRect.left,
          Math.min(x, containerRect.right - elementRect.width)
        );
        y = Math.max(
          containerRect.top,
          Math.min(y, containerRect.bottom - elementRect.height)
        );
      }
    }

    if (this.snapToGrid && options.grid) {
      x = Math.round(x / options.grid) * options.grid;
      y = Math.round(y / options.grid) * options.grid;
    }

    this.draggedElement.style.left = `${x}px`;
    this.draggedElement.style.top = `${y}px`;

    this.onDrag(this.draggedElement, { x, y });
  }

  stopDrag(event, options = {}) {
    if (!this.isDragging || !this.draggedElement) return;

    this.isDragging = false;

    const element = this.draggedElement;
    const rect = element.getBoundingClientRect();

    element.classList.remove("dragging");
    element.style.cursor = "grab";
    element.style.zIndex = "";

    this.onDragEnd(element, {
      x: rect.left,
      y: rect.top,
    });

    if (this._cleanupHandlers) {
      this._cleanupHandlers();
      this._cleanupHandlers = null;
    }

    this.draggedElement = null;
  }

  destroy(element) {
    if (element._dragDropCleanup) {
      element._dragDropCleanup();
      delete element._dragDropCleanup;
    }
  }
}

export class SeatDragDropEditor {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.seats = {};
    this.gridSize = options.gridSize || 40;
    this.onChange = options.onChange || (() => {});

    this.dragManager = new DragDropManager({
      gridSize: this.gridSize,
      snapToGrid: true,
      onDragEnd: (element, position) => {
        this.updateSeatPosition(element.dataset.seatId, position);
      },
    });
  }

  initializeSeats(seatDetails) {
    this.seats = { ...seatDetails };
    this.render();
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = "";
    this.container.style.position = "relative";
    this.container.style.minHeight = "600px";
    this.container.classList.add("bg-gray-100", "rounded-lg", "p-4");

    this.drawGrid();

    Object.entries(this.seats).forEach(([seatId, seatData]) => {
      this.createDraggableSeat(seatId, seatData);
    });
  }

  drawGrid() {
    const canvas = document.createElement("canvas");
    canvas.width = this.container.offsetWidth;
    canvas.height = this.container.offsetHeight || 600;
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.pointerEvents = "none";

    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;

    for (let x = 0; x < canvas.width; x += this.gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y < canvas.height; y += this.gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    this.container.appendChild(canvas);
  }

  createDraggableSeat(seatId, seatData) {
    const seatElement = document.createElement("div");
    seatElement.dataset.seatId = seatId;
    seatElement.className =
      "seat-draggable absolute w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold shadow-md transition-all hover:scale-110";

    const color = this.getSeatColor(seatData);
    seatElement.style.backgroundColor = color;

    const position = seatData.position || this.getDefaultPosition(seatId);
    seatElement.style.left = `${position.x}px`;
    seatElement.style.top = `${position.y}px`;

    seatElement.textContent = seatId;

    this.dragManager.makeElementDraggable(seatElement, {
      containment: this.container,
      grid: this.gridSize,
    });

    this.container.appendChild(seatElement);
  }

  getSeatColor(seatData) {
    const colors = {
      available: "#10b981",
      blocked: "#ef4444",
      reserved: "#f59e0b",
      vip: "#8b5cf6",
    };
    return colors[seatData.status] || colors.available;
  }

  getDefaultPosition(seatId) {
    const rowLetter = seatId.charAt(0);
    const seatNumber = parseInt(seatId.slice(1));
    const row = rowLetter.charCodeAt(0) - 65;

    return {
      x: seatNumber * this.gridSize + 10,
      y: (row + 2) * this.gridSize + 10,
    };
  }

  updateSeatPosition(seatId, position) {
    if (this.seats[seatId]) {
      this.seats[seatId].position = position;
      this.onChange(this.seats);
    }
  }

  getSeatData() {
    return this.seats;
  }

  destroy() {
    document
      .querySelectorAll(".seat-draggable")
      .forEach((el) => this.dragManager.destroy(el));
  }
}

export const createDraggableList = (listId, options = {}) => {
  const list = document.getElementById(listId);
  if (!list) return null;

  let draggedItem = null;
  let placeholder = null;

  const items = Array.from(list.children);

  items.forEach((item) => {
    item.draggable = true;
    item.style.cursor = "grab";

    item.addEventListener("dragstart", (e) => {
      draggedItem = item;
      item.style.opacity = "0.5";
      item.style.cursor = "grabbing";

      placeholder = document.createElement("div");
      placeholder.className = "drag-placeholder";
      placeholder.style.height = `${item.offsetHeight}px`;
      placeholder.style.background = "#e5e7eb";
      placeholder.style.border = "2px dashed #9ca3af";
      placeholder.style.borderRadius = "0.5rem";
      placeholder.style.margin = "0.5rem 0";

      e.dataTransfer.effectAllowed = "move";
    });

    item.addEventListener("dragend", (e) => {
      item.style.opacity = "";
      item.style.cursor = "grab";

      if (placeholder && placeholder.parentNode) {
        placeholder.parentNode.removeChild(placeholder);
      }

      if (options.onReorder) {
        const newOrder = Array.from(list.children).map((el) => el.dataset.id);
        options.onReorder(newOrder);
      }
    });

    item.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      if (item === draggedItem) return;

      const rect = item.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;

      if (e.clientY < midpoint) {
        list.insertBefore(placeholder, item);
      } else {
        list.insertBefore(placeholder, item.nextSibling);
      }
    });

    item.addEventListener("drop", (e) => {
      e.preventDefault();
      if (placeholder && placeholder.parentNode) {
        placeholder.parentNode.replaceChild(draggedItem, placeholder);
      }
    });
  });

  return {
    destroy: () => {
      items.forEach((item) => {
        item.draggable = false;
        item.style.cursor = "";
      });
    },
  };
};
