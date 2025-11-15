import { PerformanceWizard } from "./PerformanceWizard.js";
import { notify } from "/src/utils/ui/notification.js";
import Swal from "sweetalert2";

export class PerformanceWizardHandler {
  constructor(venues, onSubmit) {
    this.venues = venues;
    this.onSubmit = onSubmit;
    this.wizard = PerformanceWizard;
    this.formData = {};
  }

  async show(performance = null) {
    if (performance) {
      this.formData = this.parseExistingPerformance(performance);
    }

    const result = await Swal.fire({
      title: performance ? "Edit Performance" : "Create New Performance",
      html: this.wizard.render(this.formData),
      width: "800px",
      showConfirmButton: false,
      showCancelButton: false,
      didOpen: () => {
        this.attachEventListeners();
        this.populateVenues();
      },
    });
  }

  parseExistingPerformance(perf) {
    return {
      title: perf.title,
      composer: perf.composer,
      conductor: perf.conductor,
      description: perf.description,
      duration: perf.duration,
      genre: perf.genre,
      venueId: perf.venueId,
      showtimes: perf.showtimes || [],
      basePrice: perf.basePrice,
      vipPrice: perf.vipPrice,
      premiumPrice: perf.premiumPrice,
      economyPrice: perf.economyPrice,
    };
  }

  attachEventListeners() {
    const self = this;

    $(document)
      .off("click", "#wizardNextBtn")
      .on("click", "#wizardNextBtn", () => {
        if (self.validateCurrentStep()) {
          self.saveCurrentStep();
          self.wizard.currentStep++;
          self.updateWizard();
        }
      });

    $(document)
      .off("click", "#wizardPrevBtn")
      .on("click", "#wizardPrevBtn", () => {
        self.wizard.currentStep--;
        self.updateWizard();
      });

    $(document)
      .off("click", "#wizardSubmitBtn")
      .on("click", "#wizardSubmitBtn", async () => {
        if (self.validateCurrentStep()) {
          self.saveCurrentStep();
          await self.submit();
        }
      });

    $(document)
      .off("click", "#wizardAddShowtime")
      .on("click", "#wizardAddShowtime", () => {
        self.addShowtime();
      });

    $(document).on("click", ".remove-showtime", function () {
      const index = $(this).data("index");
      self.removeShowtime(index);
    });

    $(document).on(
      "input",
      "#wizardPrice, #wizardVipPrice, #wizardPremiumPrice, #wizardEconomyPrice",
      () => {
        self.updatePricePreview();
      }
    );
  }

  populateVenues() {
    const select = $("#wizardVenue");
    select.empty().append('<option value="">Select a venue...</option>');

    this.venues.forEach((venue) => {
      const selected = venue.id === this.formData.venueId ? "selected" : "";
      select.append(
        `<option value="${venue.id}" ${selected}>${venue.name}</option>`
      );
    });
  }

  validateCurrentStep() {
    switch (this.wizard.currentStep) {
      case 1:
        return this.validateBasicInfo();
      case 2:
        return this.validateSchedule();
      case 3:
        return this.validatePricing();
      case 4:
        return true;
      default:
        return false;
    }
  }

  validateBasicInfo() {
    const title = $("#wizardTitle").val()?.trim();
    const composer = $("#wizardComposer").val()?.trim();
    const conductor = $("#wizardConductor").val()?.trim();
    const description = $("#wizardDescription").val()?.trim();

    if (!title || !composer || !conductor || !description) {
      notify.error("Please fill in all required fields");
      return false;
    }

    if (title.length < 3) {
      notify.error("Title must be at least 3 characters");
      return false;
    }

    return true;
  }

  validateSchedule() {
    const venueId = $("#wizardVenue").val();

    if (!venueId) {
      notify.error("Please select a venue");
      return false;
    }

    if (!this.formData.showtimes || this.formData.showtimes.length === 0) {
      notify.error("Please add at least one showtime");
      return false;
    }

    return true;
  }

  validatePricing() {
    const basePrice = parseFloat($("#wizardPrice").val());

    if (!basePrice || basePrice <= 0) {
      notify.error("Please enter a valid standard price");
      return false;
    }

    return true;
  }

  saveCurrentStep() {
    const self = this;
    switch (this.wizard.currentStep) {
      case 1:
        this.formData.title = $("#wizardTitle").val();
        this.formData.composer = $("#wizardComposer").val();
        this.formData.conductor = $("#wizardConductor").val();
        this.formData.description = $("#wizardDescription").val();
        this.formData.duration = $("#wizardDuration").val();
        this.formData.genre = $("#wizardGenre").val();
        break;
      case 2:
        this.formData.venueId = $("#wizardVenue").val();
        this.formData.showtimes = this.formData.showtimes || [];
        $(".showtime-date").each(function (index) {
          const date = $(this).val();
          const time = $(`.showtime-time[data-index="${index}"]`).val();
          if (date && time) {
            if (!self.formData.showtimes[index]) {
              self.formData.showtimes[index] = {};
            }
            self.formData.showtimes[index].date = date;
            self.formData.showtimes[index].time = time;
          }
        });
        break;
      case 3:
        this.formData.basePrice = parseFloat($("#wizardPrice").val());
        this.formData.vipPrice = parseFloat($("#wizardVipPrice").val()) || null;
        this.formData.premiumPrice =
          parseFloat($("#wizardPremiumPrice").val()) || null;
        this.formData.economyPrice =
          parseFloat($("#wizardEconomyPrice").val()) || null;
        break;
    }
  }

  updateWizard() {
    this.wizard.formData = this.formData;
    $(".performance-wizard").replaceWith(this.wizard.render(this.formData, false));
    this.attachEventListeners();
    this.populateVenues();

    if (this.wizard.currentStep === 3) {
      this.updatePricePreview();
    }

    if (this.wizard.currentStep === 4) {
      this.updateReview();
    }
  }

  addShowtime() {
    if (!this.formData.showtimes) {
      this.formData.showtimes = [];
    }

    this.formData.showtimes.push({
      date: "",
      time: "",
    });

    $("#wizardShowtimesContainer").html(this.wizard.renderShowtimes());
  }

  removeShowtime(index) {
    this.formData.showtimes.splice(index, 1);
    $("#wizardShowtimesContainer").html(this.wizard.renderShowtimes());
  }

  updatePricePreview() {
    const standard = $("#wizardPrice").val() || "--";
    const premium = $("#wizardPremiumPrice").val() || "--";
    const vip = $("#wizardVipPrice").val() || "--";
    const economy = $("#wizardEconomyPrice").val() || "--";

    $("#pricePreviewStandard").text(
      standard !== "--" ? `HKD ${standard}` : "--"
    );
    $("#pricePreviewPremium").text(premium !== "--" ? `HKD ${premium}` : "--");
    $("#pricePreviewVip").text(vip !== "--" ? `HKD ${vip}` : "--");
    $("#pricePreviewEconomy").text(economy !== "--" ? `HKD ${economy}` : "--");
  }

  updateReview() {
    $("#reviewTitle").text(this.formData.title);
    $("#reviewComposer").text(this.formData.composer);
    $("#reviewConductor").text(this.formData.conductor);
    $("#reviewDuration").text(
      this.formData.duration
        ? `${this.formData.duration} minutes`
        : "Not specified"
    );

    const venue = this.venues.find((v) => v.id === this.formData.venueId);
    $("#reviewVenue").text(venue ? venue.name : "--");

    const showtimesText = this.formData.showtimes
      .map((st) => `${st.date} at ${st.time}`)
      .join(", ");
    $("#reviewShowtimes").text(showtimesText || "--");

    $("#reviewPriceStandard").text(
      this.formData.basePrice ? `HKD ${this.formData.basePrice}` : "--"
    );
    $("#reviewPricePremium").text(
      this.formData.premiumPrice ? `HKD ${this.formData.premiumPrice}` : "--"
    );
    $("#reviewPriceVip").text(
      this.formData.vipPrice ? `HKD ${this.formData.vipPrice}` : "--"
    );
    $("#reviewPriceEconomy").text(
      this.formData.economyPrice ? `HKD ${this.formData.economyPrice}` : "--"
    );
  }

  async submit() {
    try {
      await this.onSubmit(this.formData);
      Swal.close();
      notify.success("Performance saved successfully!");
    } catch (error) {
      console.error("Error saving performance:", error);
      notify.error("Failed to save performance");
    }
  }
}
