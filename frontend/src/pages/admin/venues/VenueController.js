import { VenueModel } from "./VenueModel.js";
import { VenueView } from "./VenueView.js";
import { notify } from "/src/utils/ui/notification.js";
import { SwalColors } from "/src/utils/colors.js";
import Swal from "sweetalert2";

export class VenueController {
  constructor() {
    this.model = new VenueModel();
    this.view = new VenueView();
  }

  async init() {
    await this.loadVenues();
    this.attachEventListeners();
  }

  async loadVenues() {
    try {
      this.view.showLoading();
      const venues = await this.model.loadVenues();
      this.view.renderVenuesList(
        venues,
        this.model.calculateCapacity.bind(this.model)
      );
    } catch (error) {
      console.error("Error loading venues:", error);
      notify.error(error.message || "Failed to load venues");
    }
  }

  attachEventListeners() {
    this.attachSearchListener();
    this.attachFilterListener();
    this.attachActionListeners();
  }

  attachSearchListener() {
    $("#venueSearch").on("input", (e) => {
      this.model.setSearchQuery($(e.target).val());
      this.loadVenues();
    });
  }

  attachFilterListener() {
    $("#statusFilter").on("change", (e) => {
      this.model.setFilterStatus($(e.target).val());
      this.loadVenues();
    });
  }

  attachActionListeners() {
    $("#addVenueBtn").on("click", () => this.showVenueModal());
    $("#importVenueBtn").on("click", () => this.handleImportVenue());

    $(document).on("click", ".edit-venue-btn", (e) => {
      const venueId = parseInt($(e.currentTarget).data("venue-id"));
      this.showVenueModal(venueId);
    });

    $(document).on("click", ".clone-venue-btn", async (e) => {
      const venueId = parseInt($(e.currentTarget).data("venue-id"));
      await this.handleCloneVenue(venueId);
    });

    $(document).on("click", ".export-venue-btn", async (e) => {
      const venueId = parseInt($(e.currentTarget).data("venue-id"));
      await this.handleExportVenue(venueId);
    });

    $(document).on("click", ".delete-venue-btn", (e) => {
      const venueId = parseInt($(e.currentTarget).data("venue-id"));
      this.handleDeleteVenue(venueId);
    });
  }

  async showVenueModal(venueId = null) {
    const isEdit = venueId !== null;
    let venue = null;

    if (isEdit) {
      try {
        venue = await this.model.getVenueById(venueId);
      } catch (error) {
        notify.error(error.message || "Failed to load venue");
        return;
      }
    }

    const result = await Swal.fire({
      title: isEdit ? "Edit Venue" : "Add New Venue",
      html: this.view.renderVenueForm(venue),
      width: "800px",
      showCancelButton: true,
      showDenyButton: !isEdit,
      denyButtonText: "Load Template",
      confirmButtonText: isEdit ? "Update Venue" : "Create Venue",
      confirmButtonColor: SwalColors.primary,
      cancelButtonColor: SwalColors.cancel,
      didOpen: () => {
        this.initVenueFormHandlers(venue);
      },
      preConfirm: () => this.validateAndGetVenueData(),
    });

    if (result.isDenied) {
      await this.handleLoadTemplate();
      return this.showVenueModal(venueId);
    }

    if (result.isConfirmed) {
      await this.saveVenue(venueId, result.value);
    }
  }

  initVenueFormHandlers(venue = null) {
    this.attachTabSwitching();
    this.view.initImageUpload(venue);
    this.initSections(venue);
    this.initFacilities(venue);
    this.attachFormEventListeners();
  }

  attachTabSwitching() {
    $(".venue-tab").on("click", function () {
      const tab = $(this).data("tab");
      $(".venue-tab")
        .removeClass("bg-white text-indigo-600 shadow-sm font-semibold")
        .addClass("bg-transparent text-gray-600 font-medium");
      $(this)
        .addClass("bg-white text-indigo-600 shadow-sm font-semibold")
        .removeClass("bg-transparent text-gray-600 font-medium");

      $(".venue-tab-content").addClass("hidden");
      $(`#${tab}Tab`).removeClass("hidden");
    });
  }

  initSections(venue) {
    if (venue?.layout?.sections) {
      venue.layout.sections.forEach((section) => {
        this.view.addSectionRow(section);
      });
    }
  }

  initFacilities(venue) {
    if (venue?.facilities && venue.facilities.length > 0) {
      venue.facilities.forEach((facility) => {
        this.view.addFacilityRow(facility);
      });
    } else {
      this.view.addFacilityRow();
    }
  }

  attachFormEventListeners() {
    $("#addSectionBtn").on("click", () => this.view.addSectionRow());
    $("#addFacilityBtn").on("click", () => this.view.addFacilityRow());

    $(document).on("click", ".remove-section-btn", function () {
      $(this).closest(".section-row").remove();
    });

    $(document).on("click", ".remove-facility-btn", function () {
      $(this).closest(".facility-row").remove();
    });
  }

  validateAndGetVenueData() {
    const formData = this.view.getFormData();

    if (!formData.name) {
      Swal.showValidationMessage("Please enter venue name");
      return false;
    }

    const validation = this.model.validateVenueData(formData);
    if (!validation.isValid) {
      Swal.showValidationMessage(validation.errors.join("<br>"));
      return false;
    }

    formData.capacity = this.model.calculateCapacity(formData.layout);

    return formData;
  }

  async saveVenue(venueId, venueData) {
    try {
      if (venueId) {
        await this.model.updateVenue(venueId, venueData);
        notify.success("Venue updated successfully");
      } else {
        await this.model.createVenue(venueData);
        notify.success("Venue created successfully");
      }
      await this.loadVenues();
    } catch (error) {
      console.error("Error saving venue:", error);
      notify.error(error.message || "Failed to save venue");
    }
  }

  async handleLoadTemplate() {
    const templates = this.model.getTemplates();

    const result = await Swal.fire({
      title: "Choose Venue Template",
      html: this.view.renderTemplatesList(templates),
      width: "800px",
      showCancelButton: true,
      showConfirmButton: false,
      didOpen: () => {
        $(".template-card").on("click", function () {
          const templateId = $(this).data("template-id");
          const template = templates.find((t) => t.id === templateId);

          if (template) {
            $("#venueName").val(template.name);
            $("#venueAddress").val(template.address || "");
            $("#venueContact").val(template.contact || "");
            $("#venueStatus").val(template.status);

            $("#sectionsList").html("");
            template.layout.sections.forEach((section) => {
              const $sectionsList = $("#sectionsList");
              const rowHtml = `
                <div class="section-row border border-gray-300 rounded-lg p-4 mb-3">
                  <div class="grid grid-cols-2 gap-3">
                    <div class="col-span-2">
                      <input type="text" class="section-name swal2-input w-full" value="${
                        section.name
                      }">
                    </div>
                    <div>
                      <input type="number" class="section-rows swal2-input w-full" value="${
                        section.rows
                      }" min="1">
                    </div>
                    <div>
                      <input type="number" class="section-seats swal2-input w-full" value="${
                        section.seatsPerRow
                      }" min="1">
                    </div>
                    <div>
                      <select class="section-tier swal2-select w-full">
                        <option value="vip" ${
                          section.tier === "vip" ? "selected" : ""
                        }>VIP</option>
                        <option value="premium" ${
                          section.tier === "premium" ? "selected" : ""
                        }>Premium</option>
                        <option value="standard" ${
                          section.tier === "standard" ? "selected" : ""
                        }>Standard</option>
                        <option value="economy" ${
                          section.tier === "economy" ? "selected" : ""
                        }>Economy</option>
                      </select>
                    </div>
                    <div>
                      <input type="text" class="section-start swal2-input w-full" value="${
                        section.startRow
                      }" maxlength="2">
                    </div>
                  </div>
                  <button class="remove-section-btn mt-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">
                    <i class="fas fa-trash mr-1"></i>Remove
                  </button>
                </div>
              `;
              $sectionsList.append(rowHtml);
            });

            $("#facilitiesList").html("");
            template.facilities.forEach((facility) => {
              const rowHtml = `
                <div class="facility-row flex gap-2">
                  <input type="text" class="facility-input flex-1 px-3 py-2 border border-gray-300 rounded-lg" value="${facility}">
                  <button class="remove-facility-btn px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              `;
              $("#facilitiesList").append(rowHtml);
            });

            Swal.close();
          }
        });
      },
    });
  }

  async handleCloneVenue(venueId) {
    try {
      await this.model.cloneVenue(venueId);
      notify.success("Venue cloned successfully");
      await this.loadVenues();
    } catch (error) {
      console.error("Error cloning venue:", error);
      notify.error(error.message || "Failed to clone venue");
    }
  }

  async handleExportVenue(venueId) {
    try {
      await this.model.exportVenue(venueId);
      notify.success("Venue exported successfully");
    } catch (error) {
      console.error("Error exporting venue:", error);
      notify.error(error.message || "Failed to export venue");
    }
  }

  async handleDeleteVenue(venueId) {
    const result = await Swal.fire({
      title: "Delete Venue?",
      text: "This action cannot be undone. All performances using this venue will need to be updated.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: SwalColors.danger,
      cancelButtonColor: SwalColors.cancel,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        await this.model.deleteVenue(venueId);
        notify.success("Venue deleted successfully");
        await this.loadVenues();
      } catch (error) {
        console.error("Error deleting venue:", error);
        notify.error(error.message || "Failed to delete venue");
      }
    }
  }

  async handleImportVenue() {
    const { value: file } = await Swal.fire({
      title: "Import Venue",
      html: '<input type="file" id="venueImportFile" accept=".json" class="swal2-file">',
      showCancelButton: true,
      confirmButtonText: "Import",
      confirmButtonColor: SwalColors.primary,
      cancelButtonColor: SwalColors.cancel,
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
            await this.model.importVenue(e.target.result);
            notify.success("Venue imported successfully");
            await this.loadVenues();
          } catch (error) {
            console.error("Error importing venue:", error);
            notify.error(
              error.message ||
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
  }
}
