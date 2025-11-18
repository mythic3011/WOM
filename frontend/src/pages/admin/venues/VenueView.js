import { createEmptyState } from "@components/EmptyState.js";
import { createButton } from "@components/common/Button.js";
import { createBadge } from "@components/common/Badge.js";
import { createImageUpload } from "@components/ImageUpload.js";
import { VenueLayoutEditor } from "@components/VenueLayoutEditor.js";
import { SeatLayoutEditor } from "@components/SeatLayoutEditor.js";
import { SeatMap } from "@components/SeatMap.js";
import { SeatNumberingSystem } from "@utils/SeatNumberingSystem.js";

export class VenueView {
  constructor() {
    this.$container = null;
  }

  renderPage() {
    return `
      <main class="container mx-auto px-4 py-8 max-w-7xl">
        <div class="mb-8">
          <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center">
                <i class="fas fa-building text-indigo-600 text-2xl"></i>
              </div>
              <div>
                <h1 class="text-3xl font-bold text-gray-900">Venue Management</h1>
                <p class="text-gray-600 mt-1">Manage your performance venues and their configurations</p>
              </div>
            </div>
            <div class="flex gap-2">
              <button id="importVenueBtn" class="px-4 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-medium flex items-center gap-2 shadow-sm">
                <i class="fas fa-upload"></i>
                <span class="hidden sm:inline">Import</span>
              </button>
              ${createButton({
      text: "Add Venue",
      icon: "fa-plus",
      id: "addVenueBtn",
    })}
            </div>
          </div>
        </div>

        <div id="venuesStats" class="mb-6"></div>

        ${this.renderFilters()}

        <div id="venuesList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
      </main>
    `;
  }

  renderFilters() {
    return `
      <div class="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="md:col-span-2 relative">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <i class="fas fa-search text-gray-400"></i>
            </div>
            <input
              type="text"
              id="venueSearch"
              placeholder="Search venues by name or address..."
              class="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <select id="statusFilter" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white">
              <option value="">All Status</option>
              <option value="active">✓ Active</option>
              <option value="inactive">✗ Inactive</option>
            </select>
          </div>
        </div>
      </div>
    `;
  }

  renderVenuesList(venues, calculateCapacity) {
    const $container = $("#venuesList");

    if (venues.length === 0) {
      $("#venuesStats").html("");
      $container.html(
        createEmptyState({
          icon: "fa-building",
          title: "No venues found",
          message: "Add your first venue or adjust your search filters",
          actionText: "Add Venue",
          actionOnClick: "document.getElementById('addVenueBtn').click()",
        })
      );
      return;
    }

    this.renderStats(venues, calculateCapacity);

    const venuesHtml = venues
      .map((venue) => this.renderVenueCard(venue, calculateCapacity))
      .join("");
    $container.html(venuesHtml);
  }

  renderStats(venues, calculateCapacity) {
    const totalVenues = venues.length;
    const activeVenues = venues.filter((v) => v.status === "active").length;
    const totalCapacity = venues.reduce((sum, v) => {
      return sum + (v.capacity || calculateCapacity(v.layout));
    }, 0);
    const avgCapacity = Math.round(totalCapacity / totalVenues);

    const stats = [
      {
        icon: "fa-building",
        label: "Total Venues",
        value: totalVenues,
        color: "indigo",
        bgColor: "bg-indigo-50",
        borderColor: "border-indigo-100",
        iconColor: "text-indigo-600",
        textColor: "text-indigo-700",
      },
      {
        icon: "fa-check-circle",
        label: "Active Venues",
        value: activeVenues,
        color: "green",
        bgColor: "bg-green-50",
        borderColor: "border-green-100",
        iconColor: "text-green-600",
        textColor: "text-green-700",
      },
      {
        icon: "fa-users",
        label: "Total Capacity",
        value: totalCapacity.toLocaleString(),
        color: "purple",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-100",
        iconColor: "text-purple-600",
        textColor: "text-purple-700",
      },
      {
        icon: "fa-chart-bar",
        label: "Avg Capacity",
        value: avgCapacity.toLocaleString(),
        color: "blue",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-100",
        iconColor: "text-blue-600",
        textColor: "text-blue-700",
      },
    ];

    const statsHtml = `
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        ${stats
        .map(
          (stat) => `
          <div class="${stat.bgColor} ${stat.borderColor} border rounded-xl p-4 hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between mb-2">
              <div class="w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center">
                <i class="fas ${stat.icon} ${stat.iconColor} text-lg"></i>
              </div>
            </div>
            <p class="text-2xl font-bold text-gray-900">${stat.value}</p>
            <p class="text-sm ${stat.textColor} font-medium mt-1">${stat.label}</p>
          </div>
        `
        )
        .join("")}
      </div>
    `;

    $("#venuesStats").html(statsHtml);
  }

  renderVenueCard(venue, calculateCapacity) {
    const capacity = venue.capacity || calculateCapacity(venue.layout);
    const statusBadge = createBadge({
      text: venue.status || "active",
      variant: venue.status === "active" ? "success" : "secondary",
    });

    return `
      <div class="venue-card bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all duration-300 group">
        <div class="relative h-48 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 overflow-hidden">
          ${venue.image
        ? `<img src="${venue.image}" alt="${venue.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />`
        : `<div class="w-full h-full flex items-center justify-center">
                  <div class="text-center">
                    <i class="fas fa-building text-white text-6xl opacity-40 mb-2"></i>
                    <p class="text-white text-sm opacity-60">No Image</p>
                  </div>
                </div>`
      }
          <div class="absolute top-3 right-3">
            ${statusBadge}
          </div>
          <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
            <h3 class="text-xl font-bold text-white truncate">${venue.name}</h3>
          </div>
        </div>
        <div class="p-5">
          <div class="mb-4">
            <p class="text-sm text-gray-600 flex items-center gap-2">
              <i class="fas fa-map-marker-alt text-indigo-500"></i>
              <span class="truncate">${venue.address || "No address provided"
      }</span>
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3 mb-4">
            <div class="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
              <div class="flex items-center gap-2 mb-1">
                <i class="fas fa-users text-indigo-600 text-sm"></i>
                <span class="text-xs text-gray-600">Capacity</span>
              </div>
              <p class="text-lg font-bold text-gray-900">${capacity.toLocaleString()}</p>
            </div>
            <div class="bg-purple-50 rounded-lg p-3 border border-purple-100">
              <div class="flex items-center gap-2 mb-1">
                <i class="fas fa-th-large text-purple-600 text-sm"></i>
                <span class="text-xs text-gray-600">Sections</span>
              </div>
              <p class="text-lg font-bold text-gray-900">${venue.layout?.sections?.length || 0
      }</p>
            </div>
          </div>

          ${this.renderFacilities(venue.facilities)}
          ${this.renderActionButtons(venue.id)}
        </div>
      </div>
    `;
  }

  renderFacilities(facilities) {
    if (!facilities || facilities.length === 0) {
      return `
        <div class="mb-4">
          <p class="text-xs text-gray-400 italic">No facilities listed</p>
        </div>
      `;
    }

    return `
      <div class="mb-4">
        <div class="flex gap-2 flex-wrap">
          ${facilities
        .slice(0, 3)
        .map(
          (f) => `
            <span class="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">
              <i class="fas fa-check-circle text-blue-500"></i>
              ${f}
            </span>
          `
        )
        .join("")}
          ${facilities.length > 3
        ? `<span class="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full border border-gray-200">
                +${facilities.length - 3} more
              </span>`
        : ""
      }
        </div>
      </div>
    `;
  }

  renderActionButtons(venueId) {
    return `
      <div class="flex gap-2 pt-3 border-t border-gray-100">
        <button
          class="edit-venue-btn flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 active:scale-95 transition-all text-sm font-medium shadow-sm hover:shadow"
          data-venue-id="${venueId}"
          title="Edit venue details">
          <i class="fas fa-edit mr-2"></i>Edit
        </button>
        <button
          class="clone-venue-btn px-3 py-2.5 bg-white border border-green-200 text-green-700 rounded-lg hover:bg-green-50 hover:border-green-300 active:scale-95 transition-all text-sm shadow-sm"
          data-venue-id="${venueId}"
          title="Clone this venue">
          <i class="fas fa-copy"></i>
        </button>
        <button
          class="export-venue-btn px-3 py-2.5 bg-white border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50 hover:border-purple-300 active:scale-95 transition-all text-sm shadow-sm"
          data-venue-id="${venueId}"
          title="Export venue data">
          <i class="fas fa-download"></i>
        </button>
        <button
          class="delete-venue-btn px-3 py-2.5 bg-white border border-red-200 text-red-700 rounded-lg hover:bg-red-50 hover:border-red-300 active:scale-95 transition-all text-sm shadow-sm"
          data-venue-id="${venueId}"
          title="Delete venue">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
  }

  renderVenueForm(venue = null) {
    const sections = venue?.layout?.sections || [];

    return `
      <div class="text-left">
        <div class="mb-6">
          <div class="grid grid-cols-3 gap-2 bg-gray-100 p-2 rounded-xl">
            <button class="venue-tab flex items-center justify-center gap-2 py-3 px-4 bg-white text-indigo-600 rounded-lg font-semibold shadow-sm transition-all" data-tab="basic">
              <i class="fas fa-info-circle"></i>
              <span class="hidden sm:inline">Basic Info</span>
            </button>
            <button class="venue-tab flex items-center justify-center gap-2 py-3 px-4 bg-transparent text-gray-600 rounded-lg font-medium hover:bg-white/50 transition-all" data-tab="layout">
              <i class="fas fa-th-large"></i>
              <span class="hidden sm:inline">Layout</span>
            </button>
            <button class="venue-tab flex items-center justify-center gap-2 py-3 px-4 bg-transparent text-gray-600 rounded-lg font-medium hover:bg-white/50 transition-all" data-tab="facilities">
              <i class="fas fa-star"></i>
              <span class="hidden sm:inline">Facilities</span>
            </button>
          </div>
        </div>

        <div id="basicTab" class="venue-tab-content">
          ${this.renderBasicInfoTab(venue)}
        </div>

        <div id="layoutTab" class="venue-tab-content hidden">
          ${this.renderLayoutTab(sections)}
        </div>

        <div id="facilitiesTab" class="venue-tab-content hidden">
          ${this.renderFacilitiesTab()}
        </div>
      </div>
    `;
  }

  renderBasicInfoTab(venue) {
    return `
      <div class="space-y-5">
        <div class="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100">
          <div class="flex items-start gap-3 mb-4">
            <div class="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <i class="fas fa-building text-white"></i>
            </div>
            <div class="flex-1">
              <label class="block text-sm font-semibold text-gray-900 mb-2">
                Venue Name <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="venueName"
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                value="${venue?.name || ""}"
                placeholder="e.g., Hong Kong Cultural Centre"
              >
            </div>
          </div>
        </div>

        <div class="bg-gray-50 rounded-xl p-5 border border-gray-200">
          <div class="flex items-start gap-3 mb-4">
            <div class="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <i class="fas fa-map-marker-alt text-white"></i>
            </div>
            <div class="flex-1">
              <label class="block text-sm font-semibold text-gray-900 mb-2">Location Address</label>
              <input
                type="text"
                id="venueAddress"
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                value="${venue?.address || ""}"
                placeholder="10 Salisbury Road, Tsim Sha Tsui, Kowloon"
              >
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-blue-50 rounded-xl p-5 border border-blue-100">
            <div class="flex items-center gap-2 mb-3">
              <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <i class="fas fa-phone text-white text-sm"></i>
              </div>
              <label class="text-sm font-semibold text-gray-900">Contact Number</label>
            </div>
            <input
              type="text"
              id="venueContact"
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              value="${venue?.contact || ""}"
              placeholder="+852 1234 5678"
            >
          </div>

          <div class="bg-green-50 rounded-xl p-5 border border-green-100">
            <div class="flex items-center gap-2 mb-3">
              <div class="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <i class="fas fa-toggle-on text-white text-sm"></i>
              </div>
              <label class="text-sm font-semibold text-gray-900">Venue Status</label>
            </div>
            <select
              id="venueStatus"
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white"
            >
              <option value="active" ${venue?.status === "active" ? "selected" : ""
      }>Active</option>
              <option value="inactive" ${venue?.status === "inactive" ? "selected" : ""
      }>Inactive</option>
            </select>
          </div>
        </div>

        <div class="bg-gradient-to-r from-pink-50 to-orange-50 rounded-xl p-5 border border-pink-100">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center">
              <i class="fas fa-image text-white text-sm"></i>
            </div>
            <label class="text-sm font-semibold text-gray-900">Venue Image</label>
          </div>
          <div id="venueImageUpload" class="mt-3"></div>
          <p class="text-xs text-gray-500 mt-2">Upload a high-quality image of your venue (recommended: 1200x600px)</p>
        </div>
      </div>
    `;
  }

  renderLayoutTab(sections) {
    const layoutConfig = { sections: sections || [], globalAisles: [] };

    return `
      <div class="space-y-5">
        <div class="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-5 border border-indigo-100">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <i class="fas fa-th-large text-white"></i>
              </div>
              <div>
                <h4 class="font-semibold text-gray-900">Advanced Seating Layout</h4>
                <p class="text-xs text-gray-600 mt-1">Configure sections, aisles, and seat numbering</p>
              </div>
            </div>
          </div>
        </div>
        <div id="layout-editor-container" class="space-y-6">
          <div id="advanced-editor" class="bg-white p-4 rounded shadow border border-gray-200"></div>
          <div>
            <h5 class="text-sm font-semibold text-gray-700 mb-2">Quick Section Editor</h5>
            <div id="quick-editor" class="bg-white p-4 rounded shadow border border-gray-200"></div>
          </div>
        </div>
      </div>
    `;
  }

  renderFacilitiesTab() {
    return `
      <div class="space-y-5">
        <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <i class="fas fa-star text-white"></i>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-900">Facilities & Amenities</label>
              <p class="text-xs text-gray-600 mt-1">Add features and services available at this venue</p>
            </div>
          </div>

          <div id="facilitiesList" class="space-y-2 mb-4"></div>

          <button id="addFacilityBtn" class="w-full px-4 py-3 bg-white border-2 border-dashed border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 hover:border-purple-400 active:scale-95 transition-all text-sm font-medium flex items-center justify-center gap-2">
            <i class="fas fa-plus"></i>
            <span>Add Facility</span>
          </button>
        </div>

        <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div class="flex gap-3">
            <i class="fas fa-lightbulb text-blue-600 mt-1"></i>
            <div>
              <h5 class="text-sm font-semibold text-blue-900 mb-1">Suggestions</h5>
              <p class="text-xs text-blue-700">Wheelchair Access, Parking, WiFi, Air Conditioning, Restrooms, Cafe, Gift Shop, Coat Check</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderSectionRow(section = null) {
    const tierColors = {
      vip: "from-purple-50 to-pink-50 border-purple-200",
      premium: "from-blue-50 to-indigo-50 border-blue-200",
      standard: "from-green-50 to-emerald-50 border-green-200",
      economy: "from-gray-50 to-slate-50 border-gray-200",
    };
    const currentTier = section?.tier || "standard";
    const gradientClass = tierColors[currentTier] || tierColors.standard;

    return `
      <div class="section-row bg-gradient-to-r ${gradientClass} border-2 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <i class="fas fa-layer-group text-white text-sm"></i>
            </div>
            <span class="font-semibold text-gray-900">Section Details</span>
          </div>
          <button class="remove-section-btn px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 active:scale-95 transition-all text-sm flex items-center gap-2">
            <i class="fas fa-trash"></i>
            <span class="hidden sm:inline">Remove</span>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="block text-xs font-semibold text-gray-700 mb-2">
              <i class="fas fa-tag mr-1"></i>Section Name
            </label>
            <input
              type="text"
              class="section-name w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
              placeholder="e.g., Orchestra, Balcony, VIP Box"
              value="${section?.name || ""}"
            >
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-2">
              <i class="fas fa-grip-lines mr-1"></i>Number of Rows
            </label>
            <input
              type="number"
              class="section-rows w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
              placeholder="10"
              value="${section?.rows || ""}"
              min="1"
            >
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-2">
              <i class="fas fa-chair mr-1"></i>Seats Per Row
            </label>
            <input
              type="number"
              class="section-seats w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
              placeholder="20"
              value="${section?.seatsPerRow || ""}"
              min="1"
            >
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-2">
              <i class="fas fa-crown mr-1"></i>Tier Level
            </label>
            <select class="section-tier w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white">
              <option value="vip" ${section?.tier === "vip" ? "selected" : ""
      }>VIP</option>
              <option value="premium" ${section?.tier === "premium" ? "selected" : ""
      }>Premium</option>
              <option value="standard" ${section?.tier === "standard" ? "selected" : ""
      }>Standard</option>
              <option value="economy" ${section?.tier === "economy" ? "selected" : ""
      }>Economy</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-2">
              <i class="fas fa-sort-alpha-down mr-1"></i>Starting Row Label
            </label>
            <input
              type="text"
              class="section-start w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white"
              placeholder="A"
              value="${section?.startRow || ""}"
              maxlength="2"
            >
          </div>
        </div>

        <div class="mt-4 bg-white bg-opacity-60 rounded-lg p-3 border border-gray-200">
          <div class="flex items-center gap-2 text-xs text-gray-600">
            <i class="fas fa-info-circle text-indigo-600"></i>
            <span>Capacity: <strong class="text-gray-900">${section ? (section.rows || 0) * (section.seatsPerRow || 0) : 0
      } seats</strong></span>
          </div>
        </div>
      </div>
    `;
  }

  renderFacilityRow(facility = "") {
    return `
      <div class="facility-row flex gap-3 items-center bg-white rounded-lg p-3 border-2 border-gray-200 hover:border-purple-300 transition-all group">
        <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors">
          <i class="fas fa-check text-purple-600 text-sm"></i>
        </div>
        <input
          type="text"
          class="facility-input flex-1 px-3 py-2 border-0 focus:outline-none bg-transparent"
          placeholder="e.g., Wheelchair Access, Parking, WiFi"
          value="${facility}"
        >
        <button class="remove-facility-btn px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-500 hover:text-white active:scale-95 transition-all flex-shrink-0">
          <i class="fas fa-trash text-sm"></i>
        </button>
      </div>
    `;
  }

  renderTemplatesList(templates) {
    const templatesHtml = templates
      .map(
        (template) => `
      <div class="template-card border-2 border-gray-300 rounded-lg p-4 cursor-pointer hover:border-indigo-500 transition-colors" data-template-id="${template.id}">
        <h4 class="font-semibold text-gray-900 mb-2">${template.name}</h4>
        <p class="text-sm text-gray-600 mb-3">${template.description}</p>
        <div class="text-sm text-gray-700">
          <div>Capacity: <span class="font-semibold">${template.capacity}</span></div>
          <div>Sections: <span class="font-semibold">${template.layout.sections.length}</span></div>
        </div>
      </div>
    `
      )
      .join("");

    return `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        ${templatesHtml}
      </div>
    `;
  }

  addSectionRow(section = null) {
    const rowHtml = this.renderSectionRow(section);

    if ($("#sectionsList p").length > 0) {
      $("#sectionsList").html(rowHtml);
    } else {
      $("#sectionsList").append(rowHtml);
    }
  }

  addFacilityRow(facility = "") {
    $("#facilitiesList").append(this.renderFacilityRow(facility));
  }

  initImageUpload(venue) {
    $("#venueImageUpload").html(createImageUpload("venueImage", venue?.image));
  }

  initSeatEditors(layout) {
    if (window.__quickSeatEditorInstance) {
      window.__quickSeatEditorInstance = null;
    }
    $("#advanced-editor").html(
      VenueLayoutEditor.create(layout || { sections: [] }, 0)
    );
    window.__quickSeatEditorInstance = SeatLayoutEditor.bind(
      "#quick-editor",
      layout || { sections: [] }
    );
  }

  getFormData() {
    const name = $("#venueName").val().trim();
    const address = $("#venueAddress").val().trim();
    const contact = $("#venueContact").val().trim();
    const status = $("#venueStatus").val();

    const sections = [];
    $(".section-row").each(function () {
      const sectionName = $(this).find(".section-name").val().trim();
      const rows = parseInt($(this).find(".section-rows").val());
      const seatsPerRow = parseInt($(this).find(".section-seats").val());
      const tier = $(this).find(".section-tier").val();
      const startRow = $(this).find(".section-start").val().trim();

      if (sectionName && rows && seatsPerRow) {
        sections.push({ name: sectionName, rows, seatsPerRow, tier, startRow });
      }
    });

    const facilities = [];
    $(".facility-input").each(function () {
      const facility = $(this).val().trim();
      if (facility) {
        facilities.push(facility);
      }
    });

    const image = $("#venueImagePreview").attr("src") || "";

    let quickLayout = null;
    if (window.__quickSeatEditorInstance) {
      quickLayout = window.__quickSeatEditorInstance.getValue();
    }

    const layout = quickLayout || { sections };

    return {
      name,
      address,
      contact,
      status,
      layout,
      facilities,
      image,
    };
  }

  showLoading() {
    $("#venuesList").html(
      '<div class="col-span-3 flex justify-center items-center py-12"><i class="fas fa-spinner fa-spin text-4xl text-indigo-600"></i></div>'
    );
  }

  clearSearch() {
    $("#venueSearch").val("");
  }

  clearFilter() {
    $("#statusFilter").val("");
  }
}
