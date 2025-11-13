import $ from "jquery";

export class StorageViewer {
  static renderRawView(data) {
    return `
      <div class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto" style="max-height: 70vh;">
        <pre class="text-xs">${JSON.stringify(data, null, 2)}</pre>
      </div>
    `;
  }

  static renderProcessedView(data) {
    const entries = Object.entries(data);
    const stats = this.calculateStats(entries);
    const itemsHtml = entries
      .map(([key, item], index) => this.renderStorageItem(key, item, index))
      .join("");

    return `
      <div class="storage-viewer">
        ${this.renderHeader(stats)}
        ${this.renderSearchBar()}
        <div class="storage-items-container" style="max-height: 50vh; overflow-y: auto;">
          ${itemsHtml}
        </div>
      </div>
    `;
  }

  static calculateStats(entries) {
    const totalItems = entries.length;
    let encryptedCount = 0;
    let compressedCount = 0;

    entries.forEach(([_, item]) => {
      if (
        item.metadata.type === "encrypted" ||
        item.metadata.original?.includes("encrypted")
      ) {
        encryptedCount++;
      }
      if (
        item.metadata.type === "compressed" ||
        item.metadata.original?.includes("compressed")
      ) {
        compressedCount++;
      }
    });

    return {
      totalItems,
      encryptedCount,
      compressedCount,
      plainCount: totalItems - encryptedCount - compressedCount,
    };
  }

  static renderHeader(stats) {
    return `
      <div class="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-t-lg mb-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-bold text-lg">Storage Overview</h3>
            <p class="text-sm opacity-90 mt-1">All encrypted and compressed data has been processed</p>
          </div>
          <div class="text-right">
            <div class="text-2xl font-bold">${stats.totalItems}</div>
            <div class="text-xs opacity-90">Total Items</div>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-4 mt-4">
          <div class="bg-white bg-opacity-20 rounded p-2 text-center">
            <div class="text-xl font-bold">${stats.plainCount}</div>
            <div class="text-xs opacity-90">Plain JSON</div>
          </div>
          <div class="bg-orange-500 bg-opacity-30 rounded p-2 text-center">
            <div class="text-xl font-bold">${stats.encryptedCount}</div>
            <div class="text-xs opacity-90">Decrypted</div>
          </div>
          <div class="bg-green-500 bg-opacity-30 rounded p-2 text-center">
            <div class="text-xl font-bold">${stats.compressedCount}</div>
            <div class="text-xs opacity-90">Decompressed</div>
          </div>
        </div>
      </div>
    `;
  }

  static renderSearchBar() {
    return `
      <div class="bg-gray-50 rounded-lg p-3 mb-3">
        <input
          type="text"
          id="storageSearchInput"
          placeholder="Search by key name..."
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    `;
  }

  static renderStorageItem(key, item, index) {
    const badge = this.getBadge(item);
    const valuePreview = this.getValuePreview(item.value);
    const fullValue = JSON.stringify(item.value, null, 2);

    return `
      <div class="storage-item mb-3 border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow" data-key="${key.toLowerCase()}">
        <div class="storage-item-header bg-white p-3 cursor-pointer flex items-center justify-between" data-index="${index}">
          <div class="flex items-center gap-3 flex-1">
            <i class="fas fa-chevron-right storage-item-icon text-gray-400 transition-transform text-xs"></i>
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-mono font-semibold text-sm text-gray-800">${key}</span>
                ${badge}
              </div>
              <div class="text-xs text-gray-500">${valuePreview}</div>
            </div>
          </div>
          <button class="copy-storage-btn px-2 py-1 text-xs bg-indigo-100 text-indigo-600 rounded hover:bg-indigo-200 transition-colors" data-index="${index}" title="Copy to clipboard">
            <i class="fas fa-copy"></i>
          </button>
        </div>
        <div class="storage-item-content hidden bg-gray-900 p-4">
          <pre class="text-xs text-green-400 overflow-x-auto" style="max-height: 300px;">${fullValue}</pre>
        </div>
      </div>
    `;
  }

  static getBadge(item) {
    const isProcessed = item.metadata.type === "json-processed";
    const isEncrypted =
      item.metadata.type === "encrypted" ||
      item.metadata.original?.includes("encrypted");
    const isCompressed =
      item.metadata.type === "compressed" ||
      item.metadata.original?.includes("compressed");

    if (isProcessed) {
      return '<span class="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">Processed</span>';
    } else if (isEncrypted) {
      return '<span class="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">Decrypted</span>';
    } else if (isCompressed) {
      return '<span class="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Decompressed</span>';
    } else {
      return '<span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">JSON</span>';
    }
  }

  static getValuePreview(value) {
    if (value === null) return "null";
    if (value === undefined) return "undefined";

    const type = Array.isArray(value) ? "array" : typeof value;

    switch (type) {
      case "string":
        return value.length > 50
          ? `"${value.substring(0, 50)}..."`
          : `"${value}"`;
      case "number":
      case "boolean":
        return String(value);
      case "array":
        return `Array (${value.length} items)`;
      case "object":
        const keys = Object.keys(value).length;
        return `Object (${keys} ${keys === 1 ? "property" : "properties"})`;
      default:
        return type;
    }
  }

  static attachEvents() {
    $(document).off("click", ".storage-item-header");
    $(document).on("click", ".storage-item-header", function (e) {
      if ($(e.target).closest(".copy-storage-btn").length) return;

      const $item = $(this).closest(".storage-item");
      const $content = $item.find(".storage-item-content");
      const $icon = $item.find(".storage-item-icon");

      $content.slideToggle(200);
      $icon.toggleClass("fa-chevron-right fa-chevron-down");
    });

    $(document).off("click", ".copy-storage-btn");
    $(document).on("click", ".copy-storage-btn", function (e) {
      e.stopPropagation();
      const $item = $(this).closest(".storage-item");
      const text = $item.find("pre").text();

      navigator.clipboard.writeText(text).then(() => {
        const $btn = $(this);
        const originalHtml = $btn.html();
        $btn.html('<i class="fas fa-check"></i>');
        setTimeout(() => $btn.html(originalHtml), 1000);
      });
    });

    $(document).off("input", "#storageSearchInput");
    $(document).on("input", "#storageSearchInput", function () {
      const searchTerm = $(this).val().toLowerCase();
      $(".storage-item").each(function () {
        const key = $(this).data("key");
        if (key.includes(searchTerm)) {
          $(this).show();
        } else {
          $(this).hide();
        }
      });
    });
  }
}
