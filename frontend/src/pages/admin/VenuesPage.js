import { createEmptyState } from "/src/components/EmptyState.js";
import { createButton } from "/src/components/Button.js";
import { createBadge } from "/src/components/Badge.js";
import { createImageUpload } from "/src/components/ImageUpload.js";
import { venueService } from "/src/services/venueService.js";
import { DEFAULT_VENUE_TEMPLATES } from "/src/data/defaultTemplates.js";
import { notify } from "/src/utils/ui/notification.js";
import Swal from "sweetalert2";

export default {
  title: "Venue Management | Admin",
  venues: [],
  searchQuery: "",
  filterStatus: "",

  async render() {
    return `
      <main class="container mx-auto px-4 py-8">
        <div class="flex justify-between items-center mb-8">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">
              <i class="fas fa-building text-indigo-600 mr-3"></i>Venue Management
            </h1>
            <p class="text-gray-600 mt-2">Manage venues and their configurations</p>
          </div>
          <div class="flex gap-2">
            <button id="importVenueBtn" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
              <i class="fas fa-upload mr-2"></i>Import
            </button>
            ${createButton({
              text: "Add Venue",
              icon: "fa-plus",
              id: "addVenueBtn",
            })}
          </div>
        </div>

        <div class="mb-6 bg-white rounded-lg shadow-md p-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="md:col-span-2">
              <input
                type="text"
                id="venueSearch"
                placeholder="Search venues by name or address..."
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <select id="statusFilter" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div id="venuesList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
      </main>
    `;
  },

  async afterRender() {
    await this.loadVenues();
    this.attachEventListeners();
  },

  async loadVenues() {
    try {
      this.venues = await venueService.search(this.searchQuery, {
        status: this.filterStatus,
      });
      this.renderVenues();
    } catch (error) {
      console.error("Error loading venues:", error);
      notify.error("Failed to load venues");
    }
  },

  renderVenues() {
    const container = $("#venuesList");

    if (this.venues.length === 0) {
      container.html(
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

    const venuesHtml = this.venues
      .map((venue) => this.renderVenueCard(venue))
      .join("");
    container.html(venuesHtml);
  },

  renderVenueCard(venue) {
    const capacity =
      venue.capacity || venueService.calculateCapacity(venue.layout);
    const statusBadge = createBadge({
      text: venue.status || "active",
      variant: venue.status === "active" ? "success" : "secondary",
    });

    return `
      <div class="venue-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
        <div class="h-48 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          ${
            venue.image
              ? `<img src="${venue.image}" alt="${venue.name}" class="w-full h-full object-cover" />`
              : `<i class="fas fa-building text-white text-6xl opacity-50"></i>`
          }
        </div>
        <div class="p-4">
          <div class="flex items-start justify-between mb-2">
            <h3 class="text-lg font-bold text-gray-900">${venue.name}</h3>
            ${statusBadge}
          </div>
          <p class="text-sm text-gray-600 mb-3">
            <i class="fas fa-map-marker-alt mr-1"></i>${venue.address || "N/A"}
          </p>
          <div class="grid grid-cols-2 gap-2 mb-3 text-sm">
            <div class="bg-gray-50 rounded p-2">
              <span class="text-gray-600">Capacity:</span>
              <span class="font-semibold text-gray-900 ml-1">${capacity}</span>
            </div>
            <div class="bg-gray-50 rounded p-2">
              <span class="text-gray-600">Sections:</span>
              <span class="font-semibold text-gray-900 ml-1">${
                venue.layout?.sections?.length || 0
              }</span>
            </div>
          </div>
          ${
            venue.facilities && venue.facilities.length > 0
              ? `
            <div class="mb-3">
              <div class="flex gap-1 flex-wrap">
                ${venue.facilities
                  .slice(0, 3)
                  .map(
                    (f) => `
                  <span class="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">${f}</span>
                `
                  )
                  .join("")}
                ${
                  venue.facilities.length > 3
                    ? `<span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">+${
                        venue.facilities.length - 3
                      }</span>`
                    : ""
                }
              </div>
            </div>
          `
              : ""
          }
          <div class="flex gap-2">
            <button class="edit-venue-btn flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm" data-venue-id="${
              venue.id
            }">
              <i class="fas fa-edit mr-1"></i>Edit
            </button>
            <button class="clone-venue-btn px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm" data-venue-id="${
              venue.id
            }">
              <i class="fas fa-copy"></i>
            </button>
            <button class="export-venue-btn px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors text-sm" data-venue-id="${
              venue.id
            }">
              <i class="fas fa-download"></i>
            </button>
            <button class="delete-venue-btn px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm" data-venue-id="${
              venue.id
            }">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  attachEventListeners() {
    const self = this;

    $("#venueSearch").on("input", function () {
      self.searchQuery = $(this).val();
      self.loadVenues();
    });

    $("#statusFilter").on("change", function () {
      self.filterStatus = $(this).val();
      self.loadVenues();
    });

    $("#addVenueBtn").on("click", () => this.showVenueModal());

    $("#importVenueBtn").on("click", () => this.importVenue());

    $(document).on("click", ".edit-venue-btn", function () {
      const venueId = parseInt($(this).data("venue-id"));
      self.showVenueModal(venueId);
    });

    $(document).on("click", ".clone-venue-btn", async function () {
      const venueId = parseInt($(this).data("venue-id"));
      await self.cloneVenue(venueId);
    });

    $(document).on("click", ".export-venue-btn", async function () {
      const venueId = parseInt($(this).data("venue-id"));
      await venueService.exportVenue(venueId);
      notify.success("Venue exported successfully");
    });

    $(document).on("click", ".delete-venue-btn", function () {
      const venueId = parseInt($(this).data("venue-id"));
      self.deleteVenue(venueId);
    });
  },

  async showVenueModal(venueId = null) {
    const isEdit = venueId !== null;
    const venue = isEdit ? await venueService.getById(venueId) : null;

    const result = await Swal.fire({
      title: isEdit ? "Edit Venue" : "Add New Venue",
      html: this.renderVenueForm(venue),
      width: "800px",
      showCancelButton: true,
      showDenyButton: !isEdit,
      denyButtonText: "Load Template",
      confirmButtonText: isEdit ? "Update Venue" : "Create Venue",
      didOpen: () => {
        this.initVenueForm(venue);
      },
      preConfirm: () => this.validateAndGetVenueData(),
    });

    if (result.isDenied) {
      await this.loadTemplate();
      return this.showVenueModal(venueId);
    }

    if (result.isConfirmed) {
      try {
        if (isEdit) {
          await venueService.update(venueId, result.value);
          notify.success("Venue updated successfully");
        } else {
          await venueService.create(result.value);
          notify.success("Venue created successfully");
        }
        await this.loadVenues();
      } catch (error) {
        console.error("Error saving venue:", error);
        notify.error("Failed to save venue");
      }
    }
  },

  renderVenueForm(venue = null) {
    const sections = venue?.layout?.sections || [];

    return `
      <div class="text-left">
        <div class="mb-4">
          <ul class="flex border-b">
            <li class="mr-1">
              <button class="venue-tab inline-block py-2 px-4 text-indigo-600 border-b-2 border-indigo-600 font-semibold" data-tab="basic">
                Basic Info
              </button>
            </li>
            <li class="mr-1">
              <button class="venue-tab inline-block py-2 px-4 text-gray-600 hover:text-indigo-600" data-tab="layout">
                Layout Sections
              </button>
            </li>
            <li class="mr-1">
              <button class="venue-tab inline-block py-2 px-4 text-gray-600 hover:text-indigo-600" data-tab="facilities">
                Facilities
              </button>
            </li>
          </ul>
        </div>

        <div id="basicTab" class="venue-tab-content">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Venue Name *</label>
              <input type="text" id="venueName" class="swal2-input w-full" value="${
                venue?.name || ""
              }" placeholder="e.g., Hong Kong Cultural Centre">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <input type="text" id="venueAddress" class="swal2-input w-full" value="${
                venue?.address || ""
              }" placeholder="Full address">
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Contact</label>
                <input type="text" id="venueContact" class="swal2-input w-full" value="${
                  venue?.contact || ""
                }" placeholder="+852 1234 5678">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select id="venueStatus" class="swal2-select w-full">
                  <option value="active" ${
                    venue?.status === "active" ? "selected" : ""
                  }>Active</option>
                  <option value="inactive" ${
                    venue?.status === "inactive" ? "selected" : ""
                  }>Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Venue Image</label>
              <div id="venueImageUpload"></div>
            </div>
          </div>
        </div>

        <div id="layoutTab" class="venue-tab-content hidden">
          <div class="space-y-4">
            <div class="flex justify-between items-center mb-3">
              <h4 class="font-semibold text-gray-900">Seating Sections</h4>
              <button id="addSectionBtn" class="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm">
                <i class="fas fa-plus mr-1"></i>Add Section
              </button>
            </div>

            <div id="sectionsList">
              ${
                sections.length === 0
                  ? '<p class="text-gray-500 text-sm">No sections defined. Click "Add Section" to create your first seating section.</p>'
                  : ""
              }
            </div>
          </div>
        </div>

        <div id="facilitiesTab" class="venue-tab-content hidden">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Facilities & Amenities</label>
              <div id="facilitiesList" class="space-y-2"></div>
              <button id="addFacilityBtn" class="mt-2 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm">
                <i class="fas fa-plus mr-1"></i>Add Facility
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  initVenueForm(venue = null) {
    const self = this;

    $(".venue-tab").on("click", function () {
      const tab = $(this).data("tab");
      $(".venue-tab")
        .removeClass(
          "text-indigo-600 border-b-2 border-indigo-600 font-semibold"
        )
        .addClass("text-gray-600");
      $(this)
        .addClass("text-indigo-600 border-b-2 border-indigo-600 font-semibold")
        .removeClass("text-gray-600");

      $(".venue-tab-content").addClass("hidden");
      $(`#${tab}Tab`).removeClass("hidden");
    });

    $("#venueImageUpload").html(createImageUpload("venueImage", venue?.image));

    if (venue?.layout?.sections) {
      venue.layout.sections.forEach((section, index) => {
        this.addSectionRow(section, index);
      });
    }

    if (venue?.facilities) {
      venue.facilities.forEach((facility) => {
        this.addFacilityRow(facility);
      });
    } else {
      this.addFacilityRow();
    }

    $("#addSectionBtn").on("click", () => this.addSectionRow());
    $("#addFacilityBtn").on("click", () => this.addFacilityRow());

    $(document).on("click", ".remove-section-btn", function () {
      $(this).closest(".section-row").remove();
    });

    $(document).on("click", ".remove-facility-btn", function () {
      $(this).closest(".facility-row").remove();
    });
  },

  addSectionRow(section = null, index = 0) {
    const rowHtml = `
      <div class="section-row border border-gray-300 rounded-lg p-4 mb-3">
        <div class="grid grid-cols-2 gap-3">
          <div class="col-span-2">
            <input type="text" class="section-name swal2-input w-full" placeholder="Section name (e.g., Orchestra)" value="${
              section?.name || ""
            }">
          </div>
          <div>
            <input type="number" class="section-rows swal2-input w-full" placeholder="Rows" value="${
              section?.rows || ""
            }" min="1">
          </div>
          <div>
            <input type="number" class="section-seats swal2-input w-full" placeholder="Seats per row" value="${
              section?.seatsPerRow || ""
            }" min="1">
          </div>
          <div>
            <select class="section-tier swal2-select w-full">
              <option value="vip" ${
                section?.tier === "vip" ? "selected" : ""
              }>VIP</option>
              <option value="premium" ${
                section?.tier === "premium" ? "selected" : ""
              }>Premium</option>
              <option value="standard" ${
                section?.tier === "standard" ? "selected" : ""
              }>Standard</option>
              <option value="economy" ${
                section?.tier === "economy" ? "selected" : ""
              }>Economy</option>
            </select>
          </div>
          <div>
            <input type="text" class="section-start swal2-input w-full" placeholder="Start row (e.g., A)" value="${
              section?.startRow || ""
            }" maxlength="2">
          </div>
        </div>
        <button class="remove-section-btn mt-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">
          <i class="fas fa-trash mr-1"></i>Remove
        </button>
      </div>
    `;

    if ($("#sectionsList p").length > 0) {
      $("#sectionsList").html(rowHtml);
    } else {
      $("#sectionsList").append(rowHtml);
    }
  },

  addFacilityRow(facility = "") {
    const rowHtml = `
      <div class="facility-row flex gap-2">
        <input type="text" class="facility-input flex-1 px-3 py-2 border border-gray-300 rounded-lg" placeholder="e.g., Wheelchair accessible" value="${facility}">
        <button class="remove-facility-btn px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;

    $("#facilitiesList").append(rowHtml);
  },

  validateAndGetVenueData() {
    const name = $("#venueName").val().trim();

    if (!name) {
      Swal.showValidationMessage("Please enter venue name");
      return false;
    }

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

    const imageFile = $("#venueImageInput")[0]?.files[0];
    let image = $("#venueImagePreview").attr("src") || "";

    return {
      name,
      address: $("#venueAddress").val().trim(),
      contact: $("#venueContact").val().trim(),
      status: $("#venueStatus").val(),
      layout: { sections },
      facilities,
      capacity: venueService.calculateCapacity({ sections }),
      image,
    };
  },

  async loadTemplate() {
    const templatesHtml = DEFAULT_VENUE_TEMPLATES.map(
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
    ).join("");

    const result = await Swal.fire({
      title: "Choose Venue Template",
      html: `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          ${templatesHtml}
        </div>
      `,
      showCancelButton: true,
      showConfirmButton: false,
      didOpen: () => {
        $(".template-card").on("click", function () {
          const templateId = $(this).data("template-id");
          const template = DEFAULT_VENUE_TEMPLATES.find(
            (t) => t.id === templateId
          );
          if (template) {
            $("#venueName").val(template.name);
            $("#venueAddress").val(template.address || "");
            $("#venueContact").val(template.contact || "");
            $("#venueStatus").val(template.status);

            $("#sectionsList").html("");
            template.layout.sections.forEach((section) => {
              $("#addSectionBtn")
                .closest(".space-y-4")
                .find("#addSectionBtn")
                .click();
              const lastSection = $(".section-row").last();
              lastSection.find(".section-name").val(section.name);
              lastSection.find(".section-rows").val(section.rows);
              lastSection.find(".section-seats").val(section.seatsPerRow);
              lastSection.find(".section-tier").val(section.tier);
              lastSection.find(".section-start").val(section.startRow);
            });

            $("#facilitiesList").html("");
            template.facilities.forEach((facility) => {
              $("#addFacilityBtn").click();
              $(".facility-input").last().val(facility);
            });

            Swal.close();
          }
        });
      },
    });
  },

  async cloneVenue(venueId) {
    try {
      const cloned = await venueService.clone(venueId);
      if (cloned) {
        notify.success("Venue cloned successfully");
        await this.loadVenues();
      }
    } catch (error) {
      console.error("Error cloning venue:", error);
      notify.error("Failed to clone venue");
    }
  },

  async deleteVenue(venueId) {
    const result = await Swal.fire({
      title: "Delete Venue?",
      text: "This action cannot be undone. All performances using this venue will need to be updated.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, delete it",
    });

    if (result.isConfirmed) {
      try {
        await venueService.delete(venueId);
        notify.success("Venue deleted successfully");
        await this.loadVenues();
      } catch (error) {
        console.error("Error deleting venue:", error);
        notify.error("Failed to delete venue");
      }
    }
  },

  async importVenue() {
    const { value: file } = await Swal.fire({
      title: "Import Venue",
      html: '<input type="file" id="venueImportFile" accept=".json" class="swal2-file">',
      showCancelButton: true,
      confirmButtonText: "Import",
      preConfirm: () => {
        const fileInput = document.getElementById("venueImportFile");
        if (!fileInput.files[0]) {
          Swal.showValidationMessage("Please select a file");
          return false;
        }
        return fileInput.files[0];
      },
    });

    if (file) {
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            await venueService.importVenue(e.target.result);
            notify.success("Venue imported successfully");
            await this.loadVenues();
          } catch (error) {
            console.error("Error importing venue:", error);
            notify.error(
              "Failed to import venue. Please check the file format."
            );
          }
        };
        reader.readAsText(file);
      } catch (error) {
        console.error("Error reading file:", error);
        notify.error("Failed to read file");
      }
    }
  },
};
