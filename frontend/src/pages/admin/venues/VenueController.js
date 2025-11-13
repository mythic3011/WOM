import { VenueModel } from "./VenueModel.js";
import { VenueView } from "./VenueView.js";
import { notify } from "/src/utils/ui/notification.js";
import { SwalColors } from "/src/utils/colors.js";
import { SeatNumberingSystem } from "/src/utils/SeatNumberingSystem.js";
import { SeatMap } from "/src/components/SeatMap.js";
import { VenueLayoutEditor } from "/src/components/VenueLayoutEditor.js";
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
        if (venue?.layout) {
          this.view.initSeatEditors(venue.layout);
        } else {
          this.view.initSeatEditors({ sections: [] });
        }
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
    this.initLayoutEditor(venue);
    this.initFacilities(venue);
    this.attachFormEventListeners();
  }

  initLayoutEditor(venue = null) {
    this.currentLayout = venue?.layout || { sections: [], globalAisles: [] };
    this.currentSectionIndex = 0;

    if (this.currentLayout.sections.length === 0) {
      this.currentLayout.sections.push({
        name: "Main Section",
        rows: 10,
        seatsPerRow: 20,
        startRow: "A",
        tier: "standard",
        seatNumbering: {
          globalDirection: "L_TO_R",
          startNumber: 1,
          prefix: "",
          suffix: "",
          skipNumbers: [],
          skipSeatIndices: [],
        },
        aisles: [],
        rowsConfig: [],
      });
      this.refreshLayoutEditor();
    }

    this.attachLayoutEditorHandlers();
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

    formData.layout = this.currentLayout;

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
      if (
        error.status === 422 &&
        error.data &&
        Array.isArray(error.data.errors)
      ) {
        this.showValidationErrors(error.data.errors);
      } else {
        notify.error(error.message || "Failed to save venue");
      }
    }
  }

  showValidationErrors(errors) {
    const summary = errors
      .map(
        (e) =>
          `<li class="text-red-600 text-sm">${e.message}${
            e.hint ? ` – <span class='text-gray-600'>${e.hint}</span>` : ""
          }</li>`
      )
      .join("");
    const summaryHtml = `
      <div id="venueErrorSummary" class="mb-3 bg-red-50 border border-red-200 rounded-lg p-3">
        <div class="text-red-700 font-semibold text-sm mb-1">Validation errors</div>
        <ul class="list-disc pl-5">${summary}</ul>
      </div>
    `;
    const $container = $(".swal2-html-container .text-left");
    if ($container.length) {
      const existing = $("#venueErrorSummary");
      if (existing.length) existing.remove();
      $container.prepend(summaryHtml);
    }
    errors.forEach((e) => this.highlightField(e));
  }

  highlightField(error) {
    const field = error.field || "";
    if (field === "name" || field.startsWith("name")) {
      $("#venueName").addClass("border-red-500 ring-2 ring-red-200");
      return;
    }
    if (field === "address" || field.startsWith("address")) {
      $("#venueAddress").addClass("border-red-500 ring-2 ring-red-200");
      return;
    }
    if (field === "contact" || field.startsWith("contact")) {
      $("#venueContact").addClass("border-red-500 ring-2 ring-red-200");
      return;
    }
    const match = field.match(
      /layout\.sections\[(\d+)\](?:\.(rows|seatsPerRow|name|tier|startRow)|\.aisles\[(\d+)\]\.position|\.rowsConfig\[(\d+)\])/
    );
    if (match) {
      const sectionIndex = parseInt(match[1], 10);
      const $section = $(".section-row").eq(sectionIndex);
      if ($section.length) {
        $section.addClass("border-red-400");
        const badge = $section.find(".section-name");
        if (badge.length) {
          badge.addClass("border-red-500 ring-2 ring-red-200");
        }
        const msg = `<div class="mt-2 text-xs text-red-600">${error.message}${
          error.hint ? ` – ${error.hint}` : ""
        }</div>`;
        const existing = $section.find(".section-error-msg");
        if (existing.length) existing.remove();
        $section.append(`<div class="section-error-msg">${msg}</div>`);
      }
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

  attachLayoutEditorHandlers() {
    this.attachLayoutTabSwitching();
    this.attachSectionHandlers();
    this.attachAisleHandlers();
    this.attachNumberingHandlers();
    this.attachRowOverrideHandlers();
    this.attachPreviewHandlers();
  }

  attachLayoutTabSwitching() {
    $(document).on("click", ".layout-tab", (e) => {
      const tabName = $(e.currentTarget).data("tab");
      $(".layout-tab").removeClass("tab-active");
      $(e.currentTarget).addClass("tab-active");

      const section = this.currentLayout.sections[this.currentSectionIndex];
      let tabContent = "";

      switch (tabName) {
        case "aisles":
          tabContent = VenueLayoutEditor.createAislesTab(section);
          break;
        case "numbering":
          tabContent = VenueLayoutEditor.createNumberingTab(section);
          break;
        case "per-row":
          tabContent = VenueLayoutEditor.createPerRowTab(section);
          break;
      }

      $("#tab-content").html(tabContent);
    });
  }

  attachSectionHandlers() {
    $(document).on("change", "#section-selector", (e) => {
      this.currentSectionIndex = parseInt($(e.currentTarget).val());
      this.refreshLayoutEditor();
    });

    $(document).on("click", "#add-section-btn", () => {
      this.currentLayout.sections.push({
        name: `Section ${this.currentLayout.sections.length + 1}`,
        rows: 10,
        seatsPerRow: 20,
        startRow: "A",
        tier: "standard",
        seatNumbering: {
          globalDirection: "L_TO_R",
          startNumber: 1,
          prefix: "",
          suffix: "",
          skipNumbers: [],
          skipSeatIndices: [],
        },
        aisles: [],
        rowsConfig: [],
      });
      this.currentSectionIndex = this.currentLayout.sections.length - 1;
      this.refreshLayoutEditor();
    });

    $(document).on("click", "#remove-section-btn", () => {
      if (this.currentLayout.sections.length === 1) {
        Swal.fire({
          icon: "error",
          title: "Cannot Remove",
          text: "Venue must have at least one section",
        });
        return;
      }

      this.currentLayout.sections.splice(this.currentSectionIndex, 1);
      this.currentSectionIndex = Math.max(0, this.currentSectionIndex - 1);
      this.refreshLayoutEditor();
    });
  }

  attachAisleHandlers() {
    $(document).on("click", "#add-aisle-btn", () => {
      const section = this.currentLayout.sections[this.currentSectionIndex];
      section.aisles.push({
        type: "vertical",
        afterSeat: null,
        afterRow: null,
        width: 1,
        label: "",
      });
      this.refreshLayoutEditor();
    });

    $(document).on("click", ".remove-aisle", (e) => {
      const index = parseInt($(e.currentTarget).data("index"));
      const section = this.currentLayout.sections[this.currentSectionIndex];
      section.aisles.splice(index, 1);
      this.refreshLayoutEditor();
    });

    $(document).on(
      "change",
      ".aisle-type, .aisle-position, .aisle-width, .aisle-label",
      (e) => {
        const index = parseInt(
          $(e.currentTarget).closest(".aisle-item").data("index")
        );
        const section = this.currentLayout.sections[this.currentSectionIndex];
        const aisle = section.aisles[index];

        const field = $(e.currentTarget)
          .attr("class")
          .split(" ")[0]
          .replace("aisle-", "");
        const value = $(e.currentTarget).val();

        if (field === "type") {
          aisle.type = value;
          aisle.afterSeat = null;
          aisle.afterRow = null;
        } else if (field === "position") {
          if (aisle.type === "vertical") {
            aisle.afterSeat = parseInt(value) || null;
            aisle.afterRow = null;
          } else {
            aisle.afterRow = value || null;
            aisle.afterSeat = null;
          }
        } else if (field === "width") {
          aisle.width = parseInt(value) || 1;
        } else if (field === "label") {
          aisle.label = value;
        }

        this.refreshLayoutEditor();
      }
    );
  }

  attachNumberingHandlers() {
    $(document).on(
      "change",
      "#direction, #start-number, #prefix, #suffix",
      (e) => {
        const section = this.currentLayout.sections[this.currentSectionIndex];
        const field = $(e.currentTarget).attr("id").replace("-", "");
        const value = $(e.currentTarget).val();

        if (field === "direction") {
          section.seatNumbering.globalDirection = value;
        } else if (field === "startnumber") {
          section.seatNumbering.startNumber = parseInt(value) || 1;
        } else if (field === "prefix") {
          section.seatNumbering.prefix = value;
        } else if (field === "suffix") {
          section.seatNumbering.suffix = value;
        }

        this.refreshPreview();
      }
    );

    $(document).on("click", "#add-skip-number-btn", () => {
      const input = $("#skip-number-input");
      const value = parseInt(input.val());

      if (!value || value < 1) {
        return;
      }

      const section = this.currentLayout.sections[this.currentSectionIndex];
      if (!section.seatNumbering.skipNumbers.includes(value)) {
        section.seatNumbering.skipNumbers.push(value);
        section.seatNumbering.skipNumbers.sort((a, b) => a - b);
        this.refreshLayoutEditor();
      }

      input.val("");
    });

    $(document).on("click", "#add-skip-index-btn", () => {
      const input = $("#skip-index-input");
      const value = parseInt(input.val());

      if (value == null || value < 0) {
        return;
      }

      const section = this.currentLayout.sections[this.currentSectionIndex];
      if (!section.seatNumbering.skipSeatIndices.includes(value)) {
        section.seatNumbering.skipSeatIndices.push(value);
        section.seatNumbering.skipSeatIndices.sort((a, b) => a - b);
        this.refreshLayoutEditor();
      }

      input.val("");
    });

    $(document).on("click", ".remove-skip-number", (e) => {
      const value = parseInt($(e.currentTarget).data("value"));
      const section = this.currentLayout.sections[this.currentSectionIndex];
      section.seatNumbering.skipNumbers =
        section.seatNumbering.skipNumbers.filter((n) => n !== value);
      this.refreshLayoutEditor();
    });

    $(document).on("click", ".remove-skip-index", (e) => {
      const value = parseInt($(e.currentTarget).data("value"));
      const section = this.currentLayout.sections[this.currentSectionIndex];
      section.seatNumbering.skipSeatIndices =
        section.seatNumbering.skipSeatIndices.filter((n) => n !== value);
      this.refreshLayoutEditor();
    });
  }

  attachRowOverrideHandlers() {
    $(document).on("click", ".row-item", (e) => {
      $(".row-item").removeClass("bg-blue-50");
      $(e.currentTarget).addClass("bg-blue-50");

      const rowLabel = $(e.currentTarget).data("row-label");
      const section = this.currentLayout.sections[this.currentSectionIndex];
      const existingOverride = section.rowsConfig.find(
        (r) => r.rowLabel === rowLabel
      );

      if (existingOverride) {
        $("#row-direction").val(existingOverride.direction || "");
        $("#row-start-number").val(existingOverride.startNumber || "");
        $("#row-prefix").val(existingOverride.prefix || "");
        $("#row-suffix").val(existingOverride.suffix || "");
        $("#row-padding-start").val(existingOverride.paddingStart || "");
        $("#row-padding-end").val(existingOverride.paddingEnd || "");
        $("#row-empty-indices").val(
          (existingOverride.emptySeatIndices || []).join(",")
        );
      } else {
        $("#row-direction").val("");
        $("#row-start-number").val("");
        $("#row-prefix").val("");
        $("#row-suffix").val("");
        $("#row-padding-start").val("");
        $("#row-padding-end").val("");
        $("#row-empty-indices").val("");
      }

      $("#current-row-label").text(rowLabel);
    });

    $(document).on("click", "#save-row-config-btn", () => {
      const rowLabel = $("#current-row-label").text();
      if (!rowLabel) {
        return;
      }

      const section = this.currentLayout.sections[this.currentSectionIndex];
      const direction = $("#row-direction").val();
      const startNumber = parseInt($("#row-start-number").val());
      const prefix = $("#row-prefix").val();
      const suffix = $("#row-suffix").val();
      const paddingStart = parseInt($("#row-padding-start").val());
      const paddingEnd = parseInt($("#row-padding-end").val());
      const emptyIndicesStr = $("#row-empty-indices").val();

      const override = { rowLabel };

      if (direction) override.direction = direction;
      if (startNumber) override.startNumber = startNumber;
      if (prefix) override.prefix = prefix;
      if (suffix) override.suffix = suffix;
      if (paddingStart) override.paddingStart = paddingStart;
      if (paddingEnd) override.paddingEnd = paddingEnd;
      if (emptyIndicesStr) {
        override.emptySeatIndices = emptyIndicesStr
          .split(",")
          .map((s) => parseInt(s.trim()))
          .filter((n) => !isNaN(n));
      }

      const existingIndex = section.rowsConfig.findIndex(
        (r) => r.rowLabel === rowLabel
      );
      if (existingIndex >= 0) {
        section.rowsConfig[existingIndex] = override;
      } else {
        section.rowsConfig.push(override);
      }

      this.refreshLayoutEditor();

      Swal.fire({
        icon: "success",
        title: "Saved",
        text: `Row ${rowLabel} configuration saved`,
        timer: 1500,
        showConfirmButton: false,
      });
    });

    $(document).on("click", "#remove-row-config-btn", () => {
      const rowLabel = $("#current-row-label").text();
      if (!rowLabel) {
        return;
      }

      const section = this.currentLayout.sections[this.currentSectionIndex];
      section.rowsConfig = section.rowsConfig.filter(
        (r) => r.rowLabel !== rowLabel
      );

      $("#row-direction").val("");
      $("#row-start-number").val("");
      $("#row-prefix").val("");
      $("#row-suffix").val("");
      $("#row-padding-start").val("");
      $("#row-padding-end").val("");
      $("#row-empty-indices").val("");

      this.refreshLayoutEditor();

      Swal.fire({
        icon: "success",
        title: "Removed",
        text: `Row ${rowLabel} override removed`,
        timer: 1500,
        showConfirmButton: false,
      });
    });
  }

  attachPreviewHandlers() {
    $(document).on("click", "#refresh-preview-btn", () => {
      this.refreshPreview();
    });

    $(document).on("click", "#zoom-in-btn", () => {
      const svg = $("#seat-preview svg");
      const currentScale = parseFloat(svg.attr("data-scale") || "1");
      const newScale = Math.min(currentScale + 0.1, 3);
      svg.attr("data-scale", newScale);
      svg.css("transform", `scale(${newScale})`);
    });

    $(document).on("click", "#zoom-out-btn", () => {
      const svg = $("#seat-preview svg");
      const currentScale = parseFloat(svg.attr("data-scale") || "1");
      const newScale = Math.max(currentScale - 0.1, 0.5);
      svg.attr("data-scale", newScale);
      svg.css("transform", `scale(${newScale})`);
    });
  }

  refreshLayoutEditor() {
    const $layoutTab = $("#layout-tab");
    if ($layoutTab.length) {
      const html = VenueLayoutEditor.create(
        this.currentLayout,
        this.currentSectionIndex
      );
      $layoutTab.html(html);
      this.refreshPreview();
    }
  }

  refreshPreview() {
    const section = this.currentLayout.sections[this.currentSectionIndex];
    if (!section) return;

    const numbering = new SeatNumberingSystem(section);
    const capacity = numbering.computeEffectiveCapacity();

    $("#effective-capacity").text(capacity);
    const seatMapHtml = SeatMap.generateFromLayout(
      this.currentLayout,
      {},
      [],
      false
    );
    $("#seat-preview").html(seatMapHtml);
  }
}
