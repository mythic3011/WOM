import ContextMenu from "vanilla-context-menu";
import "vanilla-context-menu/dist/vanilla-context-menu.css";

export class ContextMenuManager {
  constructor() {
    this.instances = new Map();
  }

  show(x, y, items, target) {
    const normalizedItems = items.map((item) => {
      if (item.divider) {
        return { isDivider: true };
      }

      return {
        label: item.label,
        icon: item.icon ? `<i class="fas ${item.icon} mr-2"></i>` : "",
        isDisabled: item.disabled || false,
        className: item.danger ? "text-red-600" : "",
        shortcut: item.shortcut || "",
        callback: () => {
          if (item.handler) {
            item.handler(target);
          }
        },
      };
    });

    const menu = new ContextMenu({
      items: normalizedItems,
      position: { x, y },
      theme: "default",
    });

    menu.show();
    return menu;
  }

  attachToElement(element, menuItemsOrCallback) {
    element.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      
      const items = typeof menuItemsOrCallback === "function" 
        ? menuItemsOrCallback(element, e) 
        : menuItemsOrCallback;

      this.show(e.pageX, e.pageY, items, element);
    });

    this.instances.set(element, menuItemsOrCallback);
  }

  detach(element) {
    this.instances.delete(element);
  }

  destroy() {
    this.instances.clear();
  }
}

export const createSeatContextMenu = (seat, options = {}) => {
  const { onEdit, onBlock, onMakeAvailable, onDelete, onViewDetails } = options;

  return [
    {
      icon: "fa-info-circle",
      label: "View Details",
      action: "view-details",
      handler: onViewDetails,
    },
    {
      icon: "fa-edit",
      label: "Edit Seat",
      action: "edit",
      handler: onEdit,
      shortcut: "E",
    },
    { divider: true },
    {
      icon: "fa-check-circle",
      label: "Make Available",
      action: "make-available",
      handler: onMakeAvailable,
      disabled: seat.status === "available",
    },
    {
      icon: "fa-ban",
      label: "Block Seat",
      action: "block",
      handler: onBlock,
      disabled: seat.status === "blocked",
    },
    { divider: true },
    {
      icon: "fa-trash",
      label: "Delete Seat",
      action: "delete",
      handler: onDelete,
      danger: true,
      shortcut: "Del",
    },
  ];
};

export const contextMenuUtils = {
  init() {
    if (!window.contextMenuManager) {
      window.contextMenuManager = new ContextMenuManager();
    }
    return window.contextMenuManager;
  },

  showSeatMenu(x, y, seat, handlers) {
    const manager = this.init();
    const items = createSeatContextMenu(seat, handlers);
    manager.show(x, y, items, seat);
  },

  showPerformanceMenu(x, y, performance, handlers) {
    const items = [
      {
        icon: "fa-eye",
        label: "View Details",
        action: "view",
        handler: handlers.onView,
      },
      {
        icon: "fa-edit",
        label: "Edit Performance",
        action: "edit",
        handler: handlers.onEdit,
      },
      {
        icon: "fa-copy",
        label: "Duplicate",
        action: "duplicate",
        handler: handlers.onDuplicate,
      },
      { divider: true },
      {
        icon: "fa-download",
        label: "Export Data",
        action: "export",
        handler: handlers.onExport,
      },
      { divider: true },
      {
        icon: "fa-trash",
        label: "Delete",
        action: "delete",
        handler: handlers.onDelete,
        danger: true,
      },
    ];

    const manager = this.init();
    manager.show(x, y, items, performance);
  },

  showCustomMenu(x, y, items, target) {
    const manager = this.init();
    manager.show(x, y, items, target);
  },
};

export const contextMenu = new ContextMenuManager();
