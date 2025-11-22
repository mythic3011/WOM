
import Swal from "sweetalert2";

import { SwalColors } from "@utils/colors.js";
import { notify } from "@utils/ui/notification.js";

import { VenueModel } from "./VenueModel.js";
import { VenueView } from "./VenueView.js";

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
    $("#addVenueBtn").on("click", () => {
      window.location.href = "/admin/venues/form";
    });
    $("#importVenueBtn").on("click", () => this.handleImportVenue());

    $(document).on("click", ".edit-venue-btn", (e) => {
      const venueId = parseInt($(e.currentTarget).data("venue-id"));
      window.location.href = `/admin/venues/form?id=${venueId}`;
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
