/**
 * @deprecated This utility is deprecated and will be removed in a future version.
 * Please use jQuery instead for all DOM manipulation.
 *
 * Migration Guide:
 * - dom.$(selector) → $(selector)[0] or $(selector).get(0)
 * - dom.$$(selector) → $(selector) or $(selector).toArray()
 * - dom.create(tag, opts) → $('<tag>') with jQuery methods
 * - dom.addClass(el, cls) → $(el).addClass(cls)
 * - dom.removeClass(el, cls) → $(el).removeClass(cls)
 * - dom.toggleClass(el, cls) → $(el).toggleClass(cls)
 * - dom.hasClass(el, cls) → $(el).hasClass(cls)
 * - dom.on(el, evt, fn) → $(el).on(evt, fn)
 * - dom.off(el, evt, fn) → $(el).off(evt, fn)
 * - dom.trigger(el, evt, data) → $(el).trigger(evt, data)
 * - dom.ready(fn) → $(fn) or $(document).ready(fn)
 * - dom.closest(el, sel) → $(el).closest(sel)
 * - dom.find(el, sel) → $(el).find(sel)
 * - dom.findAll(el, sel) → $(el).find(sel)
 * - dom.attr(el, name, val) → $(el).attr(name, val)
 * - dom.removeAttr(el, name) → $(el).removeAttr(name)
 * - dom.data(el, key, val) → $(el).data(key, val)
 * - dom.show(el) → $(el).show()
 * - dom.hide(el) → $(el).hide()
 * - dom.toggle(el) → $(el).toggle()
 * - dom.remove(el) → $(el).remove()
 * - dom.empty(el) → $(el).empty()
 *
 * See design document for more details on jQuery patterns.
 */

// Helper to log deprecation warnings (only once per method)
const warnedMethods = new Set();
function logDeprecation(methodName, jqueryEquivalent) {
  if (!warnedMethods.has(methodName)) {
    console.warn(
      `[DEPRECATED] dom.${methodName}() is deprecated and will be removed. Use jQuery instead: ${jqueryEquivalent}`
    );
    warnedMethods.add(methodName);
  }
}

export const dom = {
  /**
   * @deprecated Use $(selector)[0] or $(selector).get(0) instead
   */
  $(selector, context = document) {
    logDeprecation("$", "$(selector)[0] or $(selector).get(0)");
    if (typeof selector === "string") {
      return context.querySelector(selector);
    }
    return selector;
  },

  /**
   * @deprecated Use $(selector) or $(selector).toArray() instead
   */
  $$(selector, context = document) {
    logDeprecation("$$", "$(selector) or $(selector).toArray()");
    if (typeof selector === "string") {
      return Array.from(context.querySelectorAll(selector));
    }
    return Array.isArray(selector) ? selector : [selector];
  },

  /**
   * @deprecated Use $('<tag>') with jQuery methods instead
   * Example: $('<div>', { class: 'my-class', text: 'Hello' })
   */
  create(tag, options = {}) {
    logDeprecation("create", "$('<tag>', { class: 'my-class', text: 'content' })");
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

  /**
   * @deprecated Use $(element).remove() instead
   */
  remove(element) {
    logDeprecation("remove", "$(element).remove()");
    const el = this.$(element);
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  },

  /**
   * @deprecated Use $(element).empty() instead
   */
  empty(element) {
    logDeprecation("empty", "$(element).empty()");
    const el = this.$(element);
    if (el) {
      el.innerHTML = "";
    }
  },

  /**
   * @deprecated Use $(element).addClass(classes) instead
   */
  addClass(element, ...classes) {
    logDeprecation("addClass", "$(element).addClass(classes)");
    const el = this.$(element);
    if (el) {el.classList.add(...classes);}
  },

  /**
   * @deprecated Use $(element).removeClass(classes) instead
   */
  removeClass(element, ...classes) {
    logDeprecation("removeClass", "$(element).removeClass(classes)");
    const el = this.$(element);
    if (el) {el.classList.remove(...classes);}
  },

  /**
   * @deprecated Use $(element).toggleClass(className) instead
   */
  toggleClass(element, className) {
    logDeprecation("toggleClass", "$(element).toggleClass(className)");
    const el = this.$(element);
    if (el) {el.classList.toggle(className);}
  },

  /**
   * @deprecated Use $(element).hasClass(className) instead
   */
  hasClass(element, className) {
    logDeprecation("hasClass", "$(element).hasClass(className)");
    const el = this.$(element);
    return el ? el.classList.contains(className) : false;
  },

  /**
   * @deprecated Use $(element).on(event, handler) instead
   * For dynamic elements, use event delegation: $(document).on(event, selector, handler)
   */
  on(element, event, handler, options) {
    logDeprecation("on", "$(element).on(event, handler)");
    const el = this.$(element);
    if (el) {el.addEventListener(event, handler, options);}
  },

  /**
   * @deprecated Use $(element).off(event, handler) instead
   */
  off(element, event, handler, options) {
    logDeprecation("off", "$(element).off(event, handler)");
    const el = this.$(element);
    if (el) {el.removeEventListener(event, handler, options);}
  },

  /**
   * @deprecated Use $(element).trigger(eventName, data) instead
   */
  trigger(element, eventName, detail = {}) {
    logDeprecation("trigger", "$(element).trigger(eventName, data)");
    const el = this.$(element);
    if (el) {
      el.dispatchEvent(
        new CustomEvent(eventName, { detail, bubbles: true, cancelable: true })
      );
    }
  },

  /**
   * @deprecated Use $(callback) or $(document).ready(callback) instead
   */
  ready(callback) {
    logDeprecation("ready", "$(callback) or $(document).ready(callback)");
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  },

  /**
   * @deprecated Use $(element).closest(selector) instead
   */
  closest(element, selector) {
    logDeprecation("closest", "$(element).closest(selector)");
    const el = this.$(element);
    return el ? el.closest(selector) : null;
  },

  /**
   * @deprecated Use $(element).find(selector) instead
   */
  find(element, selector) {
    logDeprecation("find", "$(element).find(selector)");
    const el = this.$(element);
    return el ? el.querySelector(selector) : null;
  },

  /**
   * @deprecated Use $(element).find(selector) instead (returns jQuery object)
   */
  findAll(element, selector) {
    logDeprecation("findAll", "$(element).find(selector)");
    const el = this.$(element);
    return el ? Array.from(el.querySelectorAll(selector)) : [];
  },

  /**
   * @deprecated Use $(element).attr(name, value) instead
   */
  attr(element, name, value) {
    logDeprecation("attr", "$(element).attr(name, value)");
    const el = this.$(element);
    if (!el) {return undefined;}

    if (value === undefined) {
      return el.getAttribute(name);
    }
    el.setAttribute(name, value);
    return el;
  },

  /**
   * @deprecated Use $(element).removeAttr(name) instead
   */
  removeAttr(element, name) {
    logDeprecation("removeAttr", "$(element).removeAttr(name)");
    const el = this.$(element);
    if (el) {el.removeAttribute(name);}
  },

  /**
   * @deprecated Use $(element).data(key, value) instead
   */
  data(element, key, value) {
    logDeprecation("data", "$(element).data(key, value)");
    const el = this.$(element);
    if (!el) {return undefined;}

    if (value === undefined) {
      return el.dataset[key];
    }
    el.dataset[key] = value;
    return el;
  },

  /**
   * @deprecated Use $(element).show() instead
   */
  show(element) {
    logDeprecation("show", "$(element).show()");
    const el = this.$(element);
    if (el) {el.style.display = "";}
  },

  /**
   * @deprecated Use $(element).hide() instead
   */
  hide(element) {
    logDeprecation("hide", "$(element).hide()");
    const el = this.$(element);
    if (el) {el.style.display = "none";}
  },

  /**
   * @deprecated Use $(element).toggle() instead
   */
  toggle(element) {
    logDeprecation("toggle", "$(element).toggle()");
    const el = this.$(element);
    if (el) {
      el.style.display = el.style.display === "none" ? "" : "none";
    }
  },
};
