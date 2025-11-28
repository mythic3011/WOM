
import dayjs from "dayjs";

import { PerformanceCard } from "@components/PerformanceCard.js";
import { PerformanceFilter } from "@components/PerformanceFilter.js";
import { performanceService } from "@services/performanceService.js";
import { createDebounceSearch } from "@utils/data/filters.js";
import { renderEmptyState } from "@utils/data/table.js";
import { performanceUtils } from "@utils/performanceUtils.js";

export default {
  title: "Performances | WOM",
  viewMode: "grid",
  sortBy: "date",
  performanceFilter: null,
  venues: [],

  async render() {
    return `
      <main class="min-h-screen bg-gray-50">
        <div class="bg-white border-b border-gray-200 shadow-sm">
          <div class="container mx-auto px-4 py-12">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 class="text-5xl font-bold text-gray-900 mb-3 flex items-center gap-3">
                  <i class="fas fa-music text-indigo-600"></i>
                  Performances
          </h1>
                <p class="text-lg text-gray-600">Discover world-class orchestral music performances</p>
              </div>
              <div class="flex items-center gap-4">
                <div class="text-right">
                  <p class="text-3xl font-bold text-indigo-600" id="totalCount">0</p>
                  <p class="text-sm text-gray-500">Available Shows</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="container mx-auto px-4 py-8">
          <div id="statsBar" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"></div>

          <div id="performanceFilterContainer"></div>

          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-2 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
              <button
                id="viewGrid"
                class="px-4 py-2 rounded-lg transition-all text-lg view-btn bg-indigo-600 text-white shadow-md"
                data-view="grid"
              >
                <i class="fas fa-th"></i>
              </button>
              <button
                id="viewList"
                class="px-4 py-2 rounded-lg transition-all text-lg view-btn bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-700"
                data-view="list"
              >
                <i class="fas fa-list"></i>
            </button>
            </div>
            <div class="text-sm text-gray-600 font-medium">
              Switch between grid and list views
            </div>
          </div>

          <div id="performancesList"></div>
        </div>
      </main>
    `;
  },

  async afterRender() {
    try {
      const [performances, venuesResponse] = await Promise.all([
        performanceService.getAll(),
        fetch("/api/venues").then((r) => r.json()),
      ]);
      
      this.performances = performances;
      this.venues = venuesResponse.data?.venues || [];
      
      this.performanceFilter = new PerformanceFilter("#performanceFilterContainer", {
        enableURLSync: true,
        debounceDelay: 300,
        showGenreFilter: false,
        showStatusFilter: true,
        showDateFilter: true,
        showVenueFilter: true,
        venues: this.venues,
        performances: this.performances,
      });
      
      this.performanceFilter.render();
      
      this.performanceFilter.onFilterChange((filters) => {
        const filtered = this.performanceFilter.applyFilters(this.performances);
        this.displayPerformances(filtered);
      });
      
      this.renderStatsBar();
      this.displayPerformances(this.performances);
      this.setupEventListeners();
      $("#totalCount").text(this.performances.length);
    } catch (error) {
      console.error("Error loading performances:", error);
      renderEmptyState(
        "#performancesList",
        "fa-exclamation-triangle",
        "Failed to load performances"
      );
    }
  },

  renderStatsBar() {
    if (!this.performances || this.performances.length === 0) {
      $("#statsBar").html("");
      return;
    }

    const stats = performanceService.getPerformanceStats(this.performances);

    const statsConfig = [
      {
        icon: "fa-ticket-alt",
        label: "On Sale",
        value: stats.onSale || this.performances.length,
        color: "bg-green-500",
        textColor: "text-green-700",
        bgColor: "bg-green-50",
      },
      {
        icon: "fa-calendar-alt",
        label: "Upcoming",
        value: stats.upcoming,
        color: "bg-blue-500",
        textColor: "text-blue-700",
        bgColor: "bg-blue-50",
      },
      {
        icon: "fa-users-slash",
        label: "Sold Out",
        value: stats.soldOut,
        color: "bg-red-500",
        textColor: "text-red-700",
        bgColor: "bg-red-50",
      },
      {
        icon: "fa-dollar-sign",
        label: "Price Range",
        value: stats.priceRange.display,
        color: "bg-indigo-500",
        textColor: "text-indigo-700",
        bgColor: "bg-indigo-50",
      },
    ];

    const html = statsConfig
      .map(
        (stat) => `
      <div class="${stat.bgColor} rounded-lg p-4 border border-gray-200">
        <div class="flex items-center gap-3">
          <div class="flex-shrink-0 w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white">
            <i class="fas ${stat.icon} text-xl"></i>
          </div>
          <div>
            <p class="text-sm text-gray-600 font-medium">${stat.label}</p>
            <p class="text-2xl font-bold ${stat.textColor}">${stat.value}</p>
          </div>
        </div>
      </div>
    `
      )
      .join("");

    $("#statsBar").html(html);
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

    if (this.viewMode === "grid") {
      $container.attr(
        "class",
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      );
      data.forEach((perf) => {
        $container.append(PerformanceCard.renderGridCard(perf));
      });
    } else {
      $container.attr("class", "space-y-4");
      data.forEach((perf) => {
        $container.append(PerformanceCard.renderListCard(perf));
      });
    }

    $container.find("[data-performance-id]").on("click", function (e) {
      if (!$(e.target).closest("a").length) {
        const id = $(this).data("performance-id");
        window.location.href = `/performances/${id}`;
      }
    });
  },

  setupEventListeners() {
    $(".view-btn").on("click", (e) => {
      const $clicked = $(e.currentTarget);
      this.viewMode = $clicked.data("view");

      $(".view-btn").each(function () {
        $(this)
          .removeClass("bg-indigo-600 text-white shadow-md")
          .addClass(
            "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-700"
          );
      });

      $clicked
        .removeClass(
          "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-700"
        )
        .addClass("bg-indigo-600 text-white shadow-md");

      const filtered = this.performanceFilter.applyFilters(this.performances);
      this.displayPerformances(filtered);
    });
  },

  cleanup() {
    if (this.performanceFilter) {
      this.performanceFilter.destroy();
      this.performanceFilter = null;
    }
  },
};
