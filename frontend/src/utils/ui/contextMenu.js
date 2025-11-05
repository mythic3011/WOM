export class ContextMenuManager {
  constructor() {
    this.activeMenu = null;
    this.menuItems = [];
    this.init();
  }

  init() {
    document.addEventListener("click", () => this.hide());
    document.addEventListener("contextmenu", (e) => {
      if (!e.target.closest("[data-context-menu]")) {
        this.hide();
      }
    });
  }

  show(x, y, items, target) {
    this.hide();

    const menu = document.createElement("div");
    menu.className =
      "context-menu fixed bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 min-w-48 animate-fadeIn";
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;

    menu.innerHTML = items
      .map((item) => {
        if (item.divider) {
          return '<div class="border-t border-gray-200 my-2"></div>';
        }

        return `
          <button 
            class="context-menu-item w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-3 transition-colors ${
              item.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            } ${item.danger ? "text-red-600 hover:bg-red-50" : "text-gray-700"}"
            data-action="${item.action}"
            ${item.disabled ? "disabled" : ""}
          >
            ${
              item.icon
                ? `<i class="fas ${item.icon} w-4"></i>`
                : '<span class="w-4"></span>'
            }
            <span class="flex-1">${item.label}</span>
            ${
              item.shortcut
                ? `<span class="text-xs text-gray-400">${item.shortcut}</span>`
                : ""
            }
          </button>
        `;
      })
      .join("");

    document.body.appendChild(menu);
    this.activeMenu = menu;

    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      menu.style.left = `${x - rect.width}px`;
    }
    if (rect.bottom > window.innerHeight) {
      menu.style.top = `${y - rect.height}px`;
    }

    menu.querySelectorAll(".context-menu-item").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!btn.disabled) {
          const action = btn.dataset.action;
          const item = items.find((i) => i.action === action);
          if (item && item.handler) {
            item.handler(target);
          }
          this.hide();
        }
      });
    });
  }

  hide() {
    if (this.activeMenu) {
      this.activeMenu.remove();
      this.activeMenu = null;
    }
  }

  attachToElement(element, menuItems) {
    element.dataset.contextMenu = "true";

    element.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.show(e.pageX, e.pageY, menuItems, element);
    });
  }

  destroy() {
    this.hide();
    document.removeEventListener("click", () => this.hide());
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
};
