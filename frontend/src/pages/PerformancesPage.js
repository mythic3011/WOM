import dayjs from "dayjs";
import { performanceService } from "/src/services/dataService.js";
import { renderEmptyState } from "/src/utils/data/table.js";
import { createDebounceSearch } from "/src/utils/data/filters.js";
import { PerformanceCard } from "/src/components/PerformanceCard.js";

export default {
  title: "Performances | WOM",
  viewMode: "grid",
  sortBy: "date",

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

          <div class="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
            <div class="p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <i class="fas fa-filter text-indigo-600"></i>
                  Filters & Search
                </h3>
                <button
                  id="toggleFilters"
                  class="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2"
                >
                  <i class="fas fa-chevron-up"></i>
                  <span>Collapse</span>
                </button>
              </div>

              <div id="filtersContent">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      <i class="fas fa-search mr-1"></i>Search
                    </label>
            <input
              type="text"
              id="searchInput"
                      placeholder="Title, composer, orchestra..."
                      class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      <i class="fas fa-tag mr-1"></i>Status
                    </label>
            <select
              id="statusFilter"
                      class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            >
              <option value="">All Status</option>
              <option value="on_sale">On Sale</option>
              <option value="upcoming">Upcoming</option>
              <option value="sold_out">Sold Out</option>
            </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      <i class="fas fa-sort mr-1"></i>Sort By
                    </label>
                    <select
                      id="sortFilter"
                      class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    >
                      <option value="date">Date (Earliest First)</option>
                      <option value="date-desc">Date (Latest First)</option>
                      <option value="title">Title (A-Z)</option>
                      <option value="price">Price (Low to High)</option>
                      <option value="price-desc">Price (High to Low)</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      <i class="fas fa-dollar-sign mr-1"></i>Price Range
                    </label>
                    <select
                      id="priceFilter"
                      class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    >
                      <option value="">All Prices</option>
                      <option value="0-200">Under HKD 200</option>
                      <option value="200-500">HKD 200 - 500</option>
                      <option value="500-1000">HKD 500 - 1000</option>
                      <option value="1000+">Above HKD 1000</option>
                    </select>
                  </div>
                </div>

                <div class="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              id="clearFilters"
                    class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium flex items-center gap-2"
                  >
                    <i class="fas fa-times-circle"></i>
                    Clear All Filters
                  </button>
                  <div class="text-sm text-gray-600">
                    <span id="resultCount">0</span> results found
                  </div>
                </div>
              </div>
            </div>
          </div>

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
      this.performances = await performanceService.getAll();
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

    const onSale = this.performances.filter(
      (p) => p.ticketingInfo?.status === "on_sale" || p.status === "on_sale"
    ).length;

    const upcoming = this.performances.filter(
      (p) =>
        p.ticketingInfo?.status === "upcoming" ||
        p.status === "upcoming" ||
        (!p.ticketingInfo?.status && !p.status)
    ).length;

    const soldOut = this.performances.filter(
      (p) => p.ticketingInfo?.status === "sold_out" || p.status === "sold_out"
    ).length;

    const validPrices = this.performances
      .map((p) => p.price || 0)
      .filter((p) => p > 0);

    let priceDisplay = "N/A";
    if (validPrices.length > 0) {
      const minPrice = Math.min(...validPrices);
      const maxPrice = Math.max(...validPrices);
      priceDisplay =
        minPrice === maxPrice
          ? `HKD ${maxPrice}`
          : `HKD ${minPrice}-${maxPrice}`;
    }

    const stats = [
      {
        icon: "fa-ticket-alt",
        label: "On Sale",
        value: onSale || this.performances.length,
        color: "bg-green-500",
        textColor: "text-green-700",
        bgColor: "bg-green-50",
      },
      {
        icon: "fa-calendar-alt",
        label: "Upcoming",
        value: upcoming,
        color: "bg-blue-500",
        textColor: "text-blue-700",
        bgColor: "bg-blue-50",
      },
      {
        icon: "fa-users-slash",
        label: "Sold Out",
        value: soldOut,
        color: "bg-red-500",
        textColor: "text-red-700",
        bgColor: "bg-red-50",
      },
      {
        icon: "fa-dollar-sign",
        label: "Price Range",
        value: priceDisplay,
        color: "bg-indigo-500",
        textColor: "text-indigo-700",
        bgColor: "bg-indigo-50",
      },
    ];

    const html = stats
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
    $("#resultCount").text(data.length);

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
    const debouncedFilter = createDebounceSearch(
      () => this.filterPerformances(),
      300
    );

    $("#searchInput").on("input", debouncedFilter);
    $("#statusFilter, #sortFilter, #priceFilter").on("change", () =>
      this.filterPerformances()
    );
    $("#clearFilters").on("click", () => this.clearFilters());

    $(".view-btn").on("click", (e) => {
      const $clicked = $(e.currentTarget);
      const view = $clicked.data("view");
      this.viewMode = view;

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

      this.filterPerformances();
    });

    $("#toggleFilters").on("click", () => {
      const $content = $("#filtersContent");
      const $icon = $("#toggleFilters i");
      const $text = $("#toggleFilters span");

      $content.slideToggle(300);
      $icon.toggleClass("fa-chevron-up fa-chevron-down");
      $text.text($content.is(":visible") ? "Collapse" : "Expand");
    });
  },

  filterPerformances() {
    const search = $("#searchInput").val().toLowerCase();
    const status = $("#statusFilter").val();
    const priceRange = $("#priceFilter").val();
    const sortBy = $("#sortFilter").val();

    let filtered = this.performances.filter((p) => {
      const matchesSearch =
        !search ||
        p.title.toLowerCase().includes(search) ||
        p.composer.toLowerCase().includes(search) ||
        p.orchestra.toLowerCase().includes(search) ||
        (p.description && p.description.toLowerCase().includes(search)) ||
        (p.conductor && p.conductor.toLowerCase().includes(search));

      const matchesStatus = !status || p.ticketingInfo?.status === status;

      let matchesPrice = true;
      if (priceRange) {
        const price = p.price || 0;
        if (priceRange === "0-200") matchesPrice = price < 200;
        else if (priceRange === "200-500")
          matchesPrice = price >= 200 && price < 500;
        else if (priceRange === "500-1000")
          matchesPrice = price >= 500 && price < 1000;
        else if (priceRange === "1000+") matchesPrice = price >= 1000;
      }

      return matchesSearch && matchesStatus && matchesPrice;
    });

    filtered = this.sortPerformances(filtered, sortBy);
    this.displayPerformances(filtered);
  },

  sortPerformances(data, sortBy) {
    const sorted = [...data];

    switch (sortBy) {
      case "date":
        return sorted.sort((a, b) => {
          const dateA = a.showtimes?.[0]?.dateTime || a.date || 0;
          const dateB = b.showtimes?.[0]?.dateTime || b.date || 0;
          return dayjs(dateA).valueOf() - dayjs(dateB).valueOf();
        });

      case "date-desc":
        return sorted.sort((a, b) => {
          const dateA = a.showtimes?.[0]?.dateTime || a.date || 0;
          const dateB = b.showtimes?.[0]?.dateTime || b.date || 0;
          return dayjs(dateB).valueOf() - dayjs(dateA).valueOf();
        });

      case "title":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));

      case "price":
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));

      case "price-desc":
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));

      default:
        return sorted;
    }
  },

  clearFilters() {
    $("#searchInput, #statusFilter, #priceFilter").val("");
    $("#sortFilter").val("date");
    this.sortBy = "date";
    this.displayPerformances(this.performances);
  },
};
