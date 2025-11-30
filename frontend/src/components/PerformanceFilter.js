/**
 * @file PerformanceFilter.js
 * @description Performance filter component with fuzzy search, autocomplete, and URL synchronization
 * @author LI Ning 25127563d
 * @author SHEK chinhei 25017482d
 * @see @utils/core/URLQueryManager.js
 */

import Fuse from "fuse.js";
import { URLQueryManager } from "@utils/core/URLQueryManager.js";

const DEFAULT_FILTER_PARAMS = {
  search: "",
  venue: "",
  genre: "",
  status: "",
  dateFrom: "",
  dateTo: "",
  page: 1,
  limit: 10,
};

const FUSE_OPTIONS = {
  keys: [
    { name: "title", weight: 0.4 },
    { name: "composer", weight: 0.25 },
    { name: "performer", weight: 0.2 },
    { name: "description", weight: 0.1 },
    { name: "titlePinyin", weight: 0.05 },
  ],
  threshold: 0.4,
  distance: 100,
  includeScore: true,
  minMatchCharLength: 1,
  shouldSort: true,
  findAllMatches: true,
  ignoreLocation: true,
};

const GENRE_OPTIONS = [
  { value: "", label: "All Genres" },
  { value: "classical", label: "Classical" },
  { value: "opera", label: "Opera" },
  { value: "ballet", label: "Ballet" },
  { value: "chamber", label: "Chamber Music" },
  { value: "symphony", label: "Symphony" },
  { value: "concerto", label: "Concerto" },
  { value: "recital", label: "Recital" },
  { value: "choral", label: "Choral" },
  { value: "contemporary", label: "Contemporary" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "on_sale", label: "On Sale" },
  { value: "upcoming", label: "Upcoming" },
  { value: "sold_out", label: "Sold Out" },
  { value: "cancelled", label: "Cancelled" },
];


class PerformanceFilter {
  /**
   * @param {string|HTMLElement} container - Container element or selector
   * @param {Object} [options={}] - Configuration options
   * @param {boolean} [options.enableURLSync=true] - Enable URL synchronization
   * @param {number} [options.debounceDelay=300] - Debounce delay for search input
   * @param {boolean} [options.showGenreFilter=true] - Show genre filter
   * @param {boolean} [options.showStatusFilter=true] - Show status filter
   * @param {boolean} [options.showDateFilter=true] - Show date filter
   * @param {boolean} [options.showVenueFilter=true] - Show venue filter
   * @param {Array} [options.venues=[]] - Venue options
   * @param {Array} [options.performances=[]] - Performance data
   */
  constructor(container, options = {}) {
    this.container = typeof container === "string"
      ? document.querySelector(container)
      : container;
    this.options = {
      enableURLSync: true,
      debounceDelay: 300,
      showGenreFilter: true,
      showStatusFilter: true,
      showDateFilter: true,
      showVenueFilter: true,
      venues: [],
      performances: [],
      ...options,
    };

    this.filters = { ...DEFAULT_FILTER_PARAMS };
    this.fuse = null;
    this.urlManager = null;
    this.changeCallbacks = [];
    this.debounceTimer = null;
    this.autocompleteVisible = false;
    this.autocompleteIndex = -1;
    this.autocompleteResults = [];

    if (this.options.enableURLSync) {
      this.urlManager = new URLQueryManager(DEFAULT_FILTER_PARAMS);
      this.syncFiltersFromURL();
    }

    if (this.options.performances.length > 0) {
      this.initFuzzySearch(this.options.performances);
    }
  }

  /**
   * @returns {void}
   */
  syncFiltersFromURL() {
    if (!this.urlManager) {return;}
    const params = this.urlManager.getParams();
    Object.keys(DEFAULT_FILTER_PARAMS).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null) {
        this.filters[key] = params[key];
      }
    });
  }

  /**
   * @returns {void}
   */
  syncFiltersToURL() {
    if (!this.urlManager) {return;}
    this.urlManager.setParams(this.filters, { replaceState: true });
  }

  /**
   * @param {Array} data - Performance data array
   * @returns {void}
   */
  initFuzzySearch(data) {
    const processedData = data.map((item) => ({
      ...item,
      titlePinyin: this.convertToPinyin(item.title || ""),
    }));
    this.fuse = new Fuse(processedData, FUSE_OPTIONS);
  }

  convertToPinyin(text) {
    const pinyinMap = {
      "\u4e2d": "zhong", "\u56fd": "guo", "\u97f3": "yin", "\u4e50": "yue",
      "\u4ea4": "jiao", "\u54cd": "xiang", "\u66f2": "qu", "\u6b4c": "ge",
      "\u5267": "ju", "\u821e": "wu", "\u53f0": "tai", "\u6f14": "yan",
      "\u594f": "zou", "\u7434": "qin", "\u7b2c": "di", "\u53f7": "hao",
      "\u5927": "da", "\u8c03": "diao", "\u5c0f": "xiao", "\u5e8f": "xu",
      "\u5723": "sheng", "\u6625": "chun", "\u590f": "xia", "\u79cb": "qiu",
      "\u51ac": "dong", "\u591c": "ye", "\u6708": "yue", "\u5149": "guang",
      "\u661f": "xing", "\u7a7a": "kong", "\u6d77": "hai", "\u5c71": "shan",
      "\u6c34": "shui", "\u98ce": "feng", "\u96e8": "yu", "\u96ea": "xue",
      "\u82b1": "hua", "\u9e1f": "niao", "\u9f99": "long", "\u51e4": "feng",
      "\u864e": "hu", "\u7231": "ai", "\u60c5": "qing", "\u68a6": "meng",
      "\u5fc3": "xin", "\u7075": "ling", "\u9b42": "hun", "\u795e": "shen",
    };

    const simplified = this.convertToSimplified(text);
    let pinyin = "";
    for (const char of simplified) {
      pinyin += pinyinMap[char] || char;
    }
    return pinyin.toLowerCase();
  }

  convertToSimplified(text) {
    const traditionalToSimplified = {
      "\u570b": "\u56fd", "\u6a02": "\u4e50", "\u97ff": "\u54cd",
      "\u5287": "\u5267", "\u821e": "\u821e", "\u81fa": "\u53f0",
      "\u6f14": "\u6f14", "\u5962": "\u594f", "\u7434": "\u7434",
      "\u8056": "\u5723", "\u611b": "\u7231", "\u60c5": "\u60c5",
      "\u5922": "\u68a6", "\u9748": "\u7075", "\u9b42": "\u9b42",
      "\u795e": "\u795e", "\u9f8d": "\u9f99", "\u9cf3": "\u51e4",
      "\u8655": "\u5904", "\u8a9e": "\u8bed", "\u8a00": "\u8a00",
      "\u6587": "\u6587", "\u5b78": "\u5b66", "\u85dd": "\u827a",
      "\u8853": "\u672f", "\u97f3": "\u97f3", "\u8072": "\u58f0",
    };

    let result = "";
    for (const char of text) {
      result += traditionalToSimplified[char] || char;
    }
    return result;
  }

  /**
   * @param {string} query - Search query string
   * @returns {Array} Filtered performance array
   */
  search(query) {
    if (!this.fuse || !query || query.trim() === "") {
      return this.options.performances;
    }

    const normalizedQuery = this.convertToSimplified(query.toLowerCase());
    const pinyinQuery = this.convertToPinyin(query);

    const results = this.fuse.search(normalizedQuery);
    const pinyinResults = this.fuse.search(pinyinQuery);

    const combinedMap = new Map();
    results.forEach((r) => {
      combinedMap.set(r.item.id, { item: r.item, score: r.score });
    });
    pinyinResults.forEach((r) => {
      const existing = combinedMap.get(r.item.id);
      if (!existing || r.score < existing.score) {
        combinedMap.set(r.item.id, { item: r.item, score: r.score });
      }
    });

    return Array.from(combinedMap.values())
      .sort((a, b) => a.score - b.score)
      .map((r) => r.item);
  }

  applyFilters(performances = null) {
    const data = performances || this.options.performances;
    let filtered = [...data];

    if (this.filters.search && this.filters.search.trim() !== "") {
      filtered = this.search(this.filters.search);
    }

    if (this.filters.venue && this.filters.venue !== "") {
      const venueId = String(this.filters.venue);
      filtered = filtered.filter((p) => {
        const performanceVenueId = p.venueId ? String(p.venueId) : (p.venue?.id ? String(p.venue.id) : "");
        return performanceVenueId === venueId;
      });
    }

    if (this.filters.genre && this.filters.genre !== "") {
      filtered = filtered.filter((p) => {
        const genre = (p.genre || "").toLowerCase();
        return genre === this.filters.genre.toLowerCase();
      });
    }

    if (this.filters.status && this.filters.status !== "") {
      filtered = filtered.filter((p) => {
        const status = (p.status || "").toLowerCase();
        return status === this.filters.status.toLowerCase();
      });
    }

    if (this.filters.dateFrom && this.filters.dateFrom !== "") {
      const fromDate = new Date(this.filters.dateFrom);
      filtered = filtered.filter((p) => {
        if (!p.date) {return false;}
        const performanceDate = new Date(p.date);
        return performanceDate >= fromDate;
      });
    }

    if (this.filters.dateTo && this.filters.dateTo !== "") {
      const toDate = new Date(this.filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((p) => {
        if (!p.date) {return false;}
        const performanceDate = new Date(p.date);
        return performanceDate <= toDate;
      });
    }

    return filtered;
  }


  render() {
    if (!this.container) {return;}

    const venueOptions = [
      { value: "", label: "All Venues" },
      ...this.options.venues.map((v) => ({ value: String(v.id), label: v.name })),
    ];

    this.container.innerHTML = `
      <div class="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6" id="performance-filter">
        <div class="flex flex-col gap-4">
          <div class="flex flex-col lg:flex-row gap-4">
            <div class="flex-1 relative">
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i class="fas fa-search text-gray-400"></i>
                </div>
                <input
                  type="text"
                  id="filter-search"
                  placeholder="Search performances, composers, performers..."
                  value="${this.escapeHtml(this.filters.search || "")}"
                  class="w-full pl-10 pr-4 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  autocomplete="off"
                />
              </div>
              <div id="autocomplete-dropdown" class="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg hidden max-h-60 overflow-y-auto"></div>
            </div>
            
            ${this.options.showVenueFilter ? `
              <div class="w-full lg:w-48">
                <select
                  id="filter-venue"
                  class="w-full px-4 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                >
                  ${venueOptions.map((opt) => `
                    <option value="${opt.value}" ${opt.value === this.filters.venue ? "selected" : ""}>
                      ${this.escapeHtml(opt.label)}
                    </option>
                  `).join("")}
                </select>
              </div>
            ` : ""}
            
            ${this.options.showGenreFilter ? `
              <div class="w-full lg:w-40">
                <select
                  id="filter-genre"
                  class="w-full px-4 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                >
                  ${GENRE_OPTIONS.map((opt) => `
                    <option value="${opt.value}" ${opt.value === this.filters.genre ? "selected" : ""}>
                      ${opt.label}
                    </option>
                  `).join("")}
                </select>
              </div>
            ` : ""}
            
            ${this.options.showStatusFilter ? `
              <div class="w-full lg:w-36">
                <select
                  id="filter-status"
                  class="w-full px-4 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                >
                  ${STATUS_OPTIONS.map((opt) => `
                    <option value="${opt.value}" ${opt.value === this.filters.status ? "selected" : ""}>
                      ${opt.label}
                    </option>
                  `).join("")}
                </select>
              </div>
            ` : ""}
          </div>
          
          ${this.options.showDateFilter ? `
            <div class="flex flex-col sm:flex-row gap-4 items-center">
              <div class="flex items-center gap-2 w-full sm:w-auto">
                <label class="text-sm text-gray-600 whitespace-nowrap">From:</label>
                <input
                  type="date"
                  id="filter-date-from"
                  value="${this.filters.dateFrom || ""}"
                  class="flex-1 sm:w-40 px-3 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                />
              </div>
              <div class="flex items-center gap-2 w-full sm:w-auto">
                <label class="text-sm text-gray-600 whitespace-nowrap">To:</label>
                <input
                  type="date"
                  id="filter-date-to"
                  value="${this.filters.dateTo || ""}"
                  class="flex-1 sm:w-40 px-3 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                />
              </div>
              <button
                id="filter-clear"
                class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
              >
                <i class="fas fa-times-circle text-gray-700"></i>
                Clear Filters
              </button>
            </div>
          ` : `
            <div class="flex justify-end">
              <button
                id="filter-clear"
                class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
              >
                <i class="fas fa-times-circle text-gray-700"></i>
                Clear
              </button>
            </div>
          `}
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }


  attachEventListeners() {
    const searchInput = document.getElementById("filter-search");
    const venueSelect = document.getElementById("filter-venue");
    const genreSelect = document.getElementById("filter-genre");
    const statusSelect = document.getElementById("filter-status");
    const dateFromInput = document.getElementById("filter-date-from");
    const dateToInput = document.getElementById("filter-date-to");
    const clearButton = document.getElementById("filter-clear");
    const autocompleteDropdown = document.getElementById("autocomplete-dropdown");

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.handleSearchInput(e.target.value);
      });

      searchInput.addEventListener("keydown", (e) => {
        this.handleKeyboardNavigation(e);
      });

      searchInput.addEventListener("focus", () => {
        if (this.autocompleteResults.length > 0) {
          this.showAutocomplete(this.autocompleteResults);
        }
      });

      document.addEventListener("click", (e) => {
        if (!searchInput.contains(e.target) && !autocompleteDropdown?.contains(e.target)) {
          this.hideAutocomplete();
        }
      });
    }

    if (venueSelect) {
      venueSelect.addEventListener("change", (e) => {
        this.filters.venue = e.target.value;
        this.emitChange();
      });
    }

    if (genreSelect) {
      genreSelect.addEventListener("change", (e) => {
        this.filters.genre = e.target.value;
        this.emitChange();
      });
    }

    if (statusSelect) {
      statusSelect.addEventListener("change", (e) => {
        this.filters.status = e.target.value;
        this.emitChange();
      });
    }

    if (dateFromInput) {
      dateFromInput.addEventListener("change", (e) => {
        this.filters.dateFrom = e.target.value;
        this.emitChange();
      });
    }

    if (dateToInput) {
      dateToInput.addEventListener("change", (e) => {
        this.filters.dateTo = e.target.value;
        this.emitChange();
      });
    }

    if (clearButton) {
      clearButton.addEventListener("click", () => {
        this.clearFilters();
      });
    }
  }

  handleSearchInput(value) {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.filters.search = value;

      if (value.length >= 1 && this.fuse) {
        const results = this.search(value).slice(0, 10);
        this.autocompleteResults = results;
        this.showAutocomplete(results);
      } else {
        this.hideAutocomplete();
        this.autocompleteResults = [];
      }

      this.emitChange();
    }, this.options.debounceDelay);
  }

  handleKeyboardNavigation(e) {
    const dropdown = document.getElementById("autocomplete-dropdown");
    if (!dropdown || !this.autocompleteVisible) {return;}

    const items = dropdown.querySelectorAll(".autocomplete-item");

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        this.autocompleteIndex = Math.min(this.autocompleteIndex + 1, items.length - 1);
        this.updateAutocompleteHighlight(items);
        break;

      case "ArrowUp":
        e.preventDefault();
        this.autocompleteIndex = Math.max(this.autocompleteIndex - 1, -1);
        this.updateAutocompleteHighlight(items);
        break;

      case "Enter":
        e.preventDefault();
        if (this.autocompleteIndex >= 0 && items[this.autocompleteIndex]) {
          this.selectAutocompleteItem(this.autocompleteResults[this.autocompleteIndex]);
        }
        break;

      case "Escape":
        this.hideAutocomplete();
        break;
    }
  }

  updateAutocompleteHighlight(items) {
    items.forEach((item, index) => {
      if (index === this.autocompleteIndex) {
        item.classList.add("bg-indigo-50");
        item.scrollIntoView({ block: "nearest" });
      } else {
        item.classList.remove("bg-indigo-50");
      }
    });
  }

  showAutocomplete(results) {
    const dropdown = document.getElementById("autocomplete-dropdown");
    if (!dropdown) {return;}

    if (results.length === 0) {
      this.hideAutocomplete();
      return;
    }

    dropdown.innerHTML = results.map((item, index) => `
      <div 
        class="autocomplete-item px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${index === this.autocompleteIndex ? "bg-indigo-50" : ""}"
        data-index="${index}"
      >
        <div class="font-medium text-gray-900 text-sm">${this.escapeHtml(item.title || "")}</div>
        ${item.composer ? `<div class="text-xs text-gray-500">${this.escapeHtml(item.composer)}</div>` : ""}
        ${item.venue?.name ? `<div class="text-xs text-gray-400">${this.escapeHtml(item.venue.name)}</div>` : ""}
      </div>
    `).join("");

    dropdown.classList.remove("hidden");
    this.autocompleteVisible = true;
    this.autocompleteIndex = -1;

    dropdown.querySelectorAll(".autocomplete-item").forEach((item) => {
      item.addEventListener("click", () => {
        const index = parseInt(item.dataset.index, 10);
        this.selectAutocompleteItem(results[index]);
      });
    });
  }

  hideAutocomplete() {
    const dropdown = document.getElementById("autocomplete-dropdown");
    if (dropdown) {
      dropdown.classList.add("hidden");
    }
    this.autocompleteVisible = false;
    this.autocompleteIndex = -1;
  }

  selectAutocompleteItem(item) {
    if (!item) {return;}

    const searchInput = document.getElementById("filter-search");
    if (searchInput) {
      searchInput.value = item.title || "";
      this.filters.search = item.title || "";
    }

    this.hideAutocomplete();
    this.emitChange();
  }


  setFilters(filters) {
    this.filters = { ...DEFAULT_FILTER_PARAMS, ...filters };
    this.updateUI();
    this.syncFiltersToURL();
  }

  getFilters() {
    return { ...this.filters };
  }

  clearFilters() {
    this.filters = { ...DEFAULT_FILTER_PARAMS };
    this.updateUI();
    this.syncFiltersToURL();
    this.hideAutocomplete();
    this.emitChange();
  }

  updateUI() {
    const searchInput = document.getElementById("filter-search");
    const venueSelect = document.getElementById("filter-venue");
    const genreSelect = document.getElementById("filter-genre");
    const statusSelect = document.getElementById("filter-status");
    const dateFromInput = document.getElementById("filter-date-from");
    const dateToInput = document.getElementById("filter-date-to");

    if (searchInput) {searchInput.value = this.filters.search || "";}
    if (venueSelect) {venueSelect.value = this.filters.venue || "";}
    if (genreSelect) {genreSelect.value = this.filters.genre || "";}
    if (statusSelect) {statusSelect.value = this.filters.status || "";}
    if (dateFromInput) {dateFromInput.value = this.filters.dateFrom || "";}
    if (dateToInput) {dateToInput.value = this.filters.dateTo || "";}
  }

  onFilterChange(callback) {
    if (typeof callback === "function") {
      this.changeCallbacks.push(callback);
    }
    return () => {
      const index = this.changeCallbacks.indexOf(callback);
      if (index > -1) {
        this.changeCallbacks.splice(index, 1);
      }
    };
  }

  emitChange() {
    this.syncFiltersToURL();
    const allFilters = this.getFilters();
    this.changeCallbacks.forEach((callback) => {
      try {
        callback(allFilters);
      } catch (error) {
        console.error("Error in filter change callback:", error);
      }
    });
  }

  setVenues(venues) {
    this.options.venues = venues;
    this.render();
  }

  setPerformances(performances) {
    this.options.performances = performances;
    this.initFuzzySearch(performances);
  }

  getFilteredResults() {
    return this.applyFilters();
  }

  destroy() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.changeCallbacks = [];
    if (this.container) {
      this.container.innerHTML = "";
    }
  }
}

function createPerformanceFilter(container, options = {}) {
  const filter = new PerformanceFilter(container, options);
  filter.render();
  return filter;
}

export { PerformanceFilter, createPerformanceFilter, DEFAULT_FILTER_PARAMS };
export default PerformanceFilter;
