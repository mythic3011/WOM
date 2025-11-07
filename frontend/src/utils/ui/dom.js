export const dom = {
  $(selector, context = document) {
    if (typeof selector === "string") {
      return context.querySelector(selector);
    }
    return selector;
  },

  $$(selector, context = document) {
    if (typeof selector === "string") {
      return Array.from(context.querySelectorAll(selector));
    }
    return Array.isArray(selector) ? selector : [selector];
  },

  create(tag, options = {}) {
    const element = document.createElement(tag);

    if (options.className) {
      element.className = options.className;
    }

    if (options.attributes) {
      Object.entries(options.attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }

    if (options.data) {
      Object.entries(options.data).forEach(([key, value]) => {
        element.dataset[key] = value;
      });
    }

    if (options.style) {
      Object.assign(element.style, options.style);
    }

    if (options.html) {
      element.innerHTML = options.html;
    } else if (options.text) {
      element.textContent = options.text;
    }

    if (options.children) {
      options.children.forEach((child) => {
        element.appendChild(child);
      });
    }

    if (options.parent) {
      this.$(options.parent).appendChild(element);
    }

    return element;
  },

  remove(element) {
    const el = this.$(element);
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  },

  empty(element) {
    const el = this.$(element);
    if (el) {
      el.innerHTML = "";
    }
  },

  addClass(element, ...classes) {
    const el = this.$(element);
    if (el) el.classList.add(...classes);
  },

  removeClass(element, ...classes) {
    const el = this.$(element);
    if (el) el.classList.remove(...classes);
  },

  toggleClass(element, className) {
    const el = this.$(element);
    if (el) el.classList.toggle(className);
  },

  hasClass(element, className) {
    const el = this.$(element);
    return el ? el.classList.contains(className) : false;
  },

  on(element, event, handler, options) {
    const el = this.$(element);
    if (el) el.addEventListener(event, handler, options);
  },

  off(element, event, handler, options) {
    const el = this.$(element);
    if (el) el.removeEventListener(event, handler, options);
  },

  trigger(element, eventName, detail = {}) {
    const el = this.$(element);
    if (el) {
      el.dispatchEvent(
        new CustomEvent(eventName, { detail, bubbles: true, cancelable: true })
      );
    }
  },

  ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  },

  closest(element, selector) {
    const el = this.$(element);
    return el ? el.closest(selector) : null;
  },

  find(element, selector) {
    const el = this.$(element);
    return el ? el.querySelector(selector) : null;
  },

  findAll(element, selector) {
    const el = this.$(element);
    return el ? Array.from(el.querySelectorAll(selector)) : [];
  },

  attr(element, name, value) {
    const el = this.$(element);
    if (!el) return undefined;

    if (value === undefined) {
      return el.getAttribute(name);
    }
    el.setAttribute(name, value);
    return el;
  },

  removeAttr(element, name) {
    const el = this.$(element);
    if (el) el.removeAttribute(name);
  },

  data(element, key, value) {
    const el = this.$(element);
    if (!el) return undefined;

    if (value === undefined) {
      return el.dataset[key];
    }
    el.dataset[key] = value;
    return el;
  },

  show(element) {
    const el = this.$(element);
    if (el) el.style.display = "";
  },

  hide(element) {
    const el = this.$(element);
    if (el) el.style.display = "none";
  },

  toggle(element) {
    const el = this.$(element);
    if (el) {
      el.style.display = el.style.display === "none" ? "" : "none";
    }
  },
};
