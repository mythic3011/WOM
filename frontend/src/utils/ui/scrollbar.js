import { OverlayScrollbars } from "overlayscrollbars";
import "overlayscrollbars/overlayscrollbars.css";

const defaultOptions = {
  scrollbars: {
    theme: "os-theme-dark",
    visibility: "auto",
    autoHide: "leave",
    autoHideDelay: 800,
  },
  overflow: {
    x: "hidden",
  },
};

export const scrollbarUtils = {
  init(element, options = {}) {
    if (!element) return null;

    const el = typeof element === "string" ? document.querySelector(element) : element;
    if (!el) return null;

    const config = { ...defaultOptions, ...options };
    return OverlayScrollbars(el, config);
  },

  initMultiple(selector, options = {}) {
    const elements = document.querySelectorAll(selector);
    const instances = [];

    elements.forEach((el) => {
      const instance = this.init(el, options);
      if (instance) instances.push(instance);
    });

    return instances;
  },

  initModal(modalElement, options = {}) {
    return this.init(modalElement, {
      ...options,
      scrollbars: {
        theme: "os-theme-indigo",
        visibility: "auto",
        autoHide: "leave",
        autoHideDelay: 1000,
        ...options.scrollbars,
      },
    });
  },

  initSidebar(sidebarElement, options = {}) {
    return this.init(sidebarElement, {
      ...options,
      scrollbars: {
        theme: "os-theme-dark",
        visibility: "visible",
        autoHide: "never",
        ...options.scrollbars,
      },
    });
  },

  destroy(instance) {
    if (instance && typeof instance.destroy === "function") {
      instance.destroy();
    }
  },

  destroyAll(instances) {
    if (Array.isArray(instances)) {
      instances.forEach((instance) => this.destroy(instance));
    }
  },

  update(instance) {
    if (instance && typeof instance.update === "function") {
      instance.update();
    }
  },
};

export const initializeScrollbars = () => {
  scrollbarUtils.initMultiple(".custom-scrollbar");
  
  scrollbarUtils.initMultiple(".data-table-container", {
    overflow: { x: "scroll" },
  });
};

export default scrollbarUtils;

