import dayjs from "dayjs";
import { performanceService } from "/src/services/dataService.js";
import { getStatusBadge } from "/src/utils/status.js";
import { renderEmptyState } from "/src/utils/data/table.js";
import { createDebounceSearch } from "/src/utils/data/filters.js";

export default {
  title: "Performances | WOM",

  async render() {
    return `
      <main class="container mx-auto px-4 py-8">
        <div class="mb-8">
          <h1 class="text-4xl font-bold text-gray-900 mb-2">
            <i class="fas fa-music text-indigo-600 mr-3"></i>Performances
          </h1>
          <p class="text-gray-600">Browse our upcoming orchestral performances</p>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              id="searchInput"
              placeholder="Search performances..."
              class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <select
              id="statusFilter"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Status</option>
              <option value="on_sale">On Sale</option>
              <option value="upcoming">Upcoming</option>
              <option value="sold_out">Sold Out</option>
            </select>
            <button
              id="clearFilters"
              class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div id="performancesList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
      </main>
    `;
  },

  async afterRender() {
    try {
      this.performances = await performanceService.getAll();
      this.displayPerformances(this.performances);
      this.setupEventListeners();
    } catch (error) {
      console.error("Error loading performances:", error);
      renderEmptyState(
        "#performancesList",
        "fa-exclamation-triangle",
        "Failed to load performances"
      );
    }
  },

  displayPerformances(data) {
    const $container = $("#performancesList");

    if (!data || data.length === 0) {
      renderEmptyState(
        "#performancesList",
        "fa-music",
        "No performances found"
      );
      return;
    }

    $container.empty();
    data.forEach((perf) => {
      const statusBadge = getStatusBadge(
        perf.ticketingInfo?.status || "upcoming",
        "performance"
      );
      $container.append(`
        <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer" data-performance-id="${
          perf.id
        }">
          <img src="${perf.imageUrl || "/img/default-performance.jpg"}" alt="${
        perf.title
      }" class="w-full h-48 object-cover" />
          <div class="p-4">
            <h3 class="text-xl font-bold text-gray-900 mb-2">${perf.title}</h3>
            <p class="text-sm text-gray-600 mb-2">
              <i class="fas fa-user-tie mr-1"></i>${perf.composer}
            </p>
            <p class="text-sm text-gray-600 mb-3">
              <i class="fas fa-building mr-1"></i>${
                perf.orchestra || "Orchestra"
              }
            </p>
            <div class="flex justify-between items-center">
              ${statusBadge}
              <a href="/performances/${
                perf.id
              }" data-link class="text-indigo-600 hover:text-indigo-800">
                Learn More <i class="fas fa-arrow-right ml-1"></i>
              </a>
            </div>
          </div>
        </div>
      `);
    });

    $container.find("[data-performance-id]").on("click", function (e) {
      if (!$(e.target).is("a")) {
        const id = $(this).data("performance-id");
        window.location.href = `/performances/${id}`;
      }
    });
  },

  setupEventListeners() {
    const debouncedFilter = createDebounceSearch(
      () => this.filterPerformances(),
      300
    );

    $("#searchInput").on("input", debouncedFilter);
    $("#statusFilter").on("change", () => this.filterPerformances());
    $("#clearFilters").on("click", () => this.clearFilters());
  },

  filterPerformances() {
    const search = $("#searchInput").val().toLowerCase();
    const status = $("#statusFilter").val();

    let filtered = this.performances.filter((p) => {
      const matchesSearch =
        !search ||
        p.title.toLowerCase().includes(search) ||
        p.composer.toLowerCase().includes(search) ||
        p.orchestra.toLowerCase().includes(search);

      const matchesStatus = !status || p.ticketingInfo?.status === status;

      return matchesSearch && matchesStatus;
    });

    this.displayPerformances(filtered);
  },

  clearFilters() {
    $("#searchInput, #statusFilter").val("");
    this.displayPerformances(this.performances);
  },
};
