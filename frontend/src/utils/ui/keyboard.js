import Swal from "sweetalert2";

export class KeyboardShortcutManager {
  constructor() {
    this.shortcuts = new Map();
    this.enabled = true;
    this.init();
  }

  init() {
    document.addEventListener("keydown", (e) => {
      if (!this.enabled) return;

      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable
      ) {
        return;
      }

      const key = this.getKeyString(e);
      const handler = this.shortcuts.get(key);

      if (handler) {
        e.preventDefault();
        handler(e);
      }
    });
  }

  getKeyString(e) {
    const parts = [];
    if (e.ctrlKey || e.metaKey) parts.push("ctrl");
    if (e.shiftKey) parts.push("shift");
    if (e.altKey) parts.push("alt");
    if (e.key) parts.push(e.key.toLowerCase());
    return parts.join("+");
  }

  register(keys, handler, description) {
    if (Array.isArray(keys)) {
      keys.forEach((key) => this.shortcuts.set(key, handler));
    } else {
      this.shortcuts.set(keys, handler);
    }
  }

  unregister(keys) {
    if (Array.isArray(keys)) {
      keys.forEach((key) => this.shortcuts.delete(key));
    } else {
      this.shortcuts.delete(keys);
    }
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  clear() {
    this.shortcuts.clear();
  }

  getShortcuts() {
    return Array.from(this.shortcuts.keys());
  }
}

export const globalShortcuts = new KeyboardShortcutManager();

export function showShortcutsHelp() {
  const shortcuts = [
    { keys: "Ctrl+A", description: "Select all items" },
    { keys: "Ctrl+S", description: "Save changes" },
    { keys: "Ctrl+Z", description: "Undo last action" },
    { keys: "Ctrl+Shift+Z", description: "Redo last action" },
    { keys: "Delete / Backspace", description: "Block selected seats" },
    { keys: "Escape", description: "Cancel/Close dialog" },
    {
      keys: "1-5",
      description:
        "Quick status change (1=Available, 2=Blocked, 3=Reserved, 4=VIP, 5=Wheelchair)",
    },
    { keys: "Ctrl+F", description: "Focus search" },
    { keys: "Ctrl+P", description: "Print/Preview" },
    { keys: "?", description: "Show this help" },
  ];

  const helpHTML = `
    <div class="text-left">
      <p class="text-gray-600 mb-4">Use these keyboard shortcuts to work more efficiently:</p>
      <table class="w-full">
        <thead>
          <tr class="border-b-2 border-gray-300">
            <th class="text-left py-2 px-3 bg-gray-50">Shortcut</th>
            <th class="text-left py-2 px-3 bg-gray-50">Action</th>
          </tr>
        </thead>
        <tbody>
          ${shortcuts
            .map(
              (s) => `
            <tr class="border-b border-gray-200">
              <td class="py-2 px-3">
                <kbd class="px-2 py-1 bg-gray-200 rounded text-xs font-mono">${s.keys}</kbd>
              </td>
              <td class="py-2 px-3 text-sm text-gray-700">${s.description}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
      <div class="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
        <i class="fas fa-info-circle mr-2"></i>
        Shortcuts are disabled when typing in input fields
      </div>
    </div>
  `;

  return Swal.fire({
    title:
      '<i class="fas fa-keyboard text-indigo-600 mr-2"></i>Keyboard Shortcuts',
    html: helpHTML,
    width: "600px",
    confirmButtonText: "Got it!",
  });
}
