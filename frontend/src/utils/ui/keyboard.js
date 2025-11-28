import hotkeys from "hotkeys-js";

hotkeys.filter = function (event) {
  const target = event.target || event.srcElement;
  const tagName = target.tagName;
  const isInput =
    tagName === "INPUT" ||
    tagName === "SELECT" ||
    tagName === "TEXTAREA" ||
    target.isContentEditable;

  return !isInput || target.dataset.hotkeysEnabled === "true";
};

export const keyboard = {
  bind(keys, callback, options = {}) {
    const scope = options.scope || "all";
    hotkeys(keys, { scope, ...options }, callback);
  },

  unbind(keys, scope = "all") {
    hotkeys.unbind(keys, scope);
  },

  setScope(scope) {
    hotkeys.setScope(scope);
  },

  getScope() {
    return hotkeys.getScope();
  },

  deleteScope(scope) {
    hotkeys.deleteScope(scope);
  },

  unbindAll() {
    hotkeys.unbind();
  },

  isPressed(key) {
    return hotkeys.isPressed(key);
  },

  getPressedKeyCodes() {
    return hotkeys.getPressedKeyCodes();
  },
};

export const registerGlobalShortcuts = () => {
  keyboard.bind("ctrl+s, command+s", (e) => {
    e.preventDefault();
    const saveBtn = document.querySelector("[data-shortcut='save']");
    if (saveBtn) {saveBtn.click();}
  });

  keyboard.bind("esc", () => {
    const closeBtn = document.querySelector(
      ".swal2-close, [data-shortcut='close']"
    );
    if (closeBtn) {closeBtn.click();}
  });

  keyboard.bind("ctrl+/, command+/", (e) => {
    e.preventDefault();
    const searchInput = document.querySelector(
      "input[type='search'], #searchInput"
    );
    if (searchInput) {searchInput.focus();}
  });

  keyboard.bind("ctrl+k, command+k", (e) => {
    e.preventDefault();
  });
};
