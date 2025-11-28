
import Swal from "sweetalert2";

import { notify } from "@utils/ui/notification.js";
import { getPerformanceImageUrl } from "@utils/imageUtils.js";
import { ModifiedFieldTracker } from "@utils/forms/index.js";

import { PerformanceWizard } from "./PerformanceWizard.js";
import { ImageUploader } from "./ImageUploader.js";

export class PerformanceWizardHandler {
    constructor(venues, onSubmit) {
        this.venues = venues;
        this.onSubmit = onSubmit;
        this.wizard = PerformanceWizard;
        this.formData = {};
        this.validationErrors = {};
        this.eventHandlers = [];
        this.imageUploader = null;
        this.modifiedFieldTracker = null;
        this.isEditMode = false;
    }

    async show(performance = null) {
        const draft = this.wizard.loadDraft();

        if (draft && !performance) {
            const result = await Swal.fire({
                title: "<i class=\"fas fa-file-alt text-indigo-600 mr-2\"></i>Draft Found",
                html: `
          <div class="text-left space-y-3">
            <div class="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <p class="text-gray-700 mb-2 font-medium">We found a saved draft from:</p>
              <p class="text-indigo-700 font-semibold">${new Date(draft.timestamp).toLocaleString()}</p>
            </div>
            <p class="text-gray-600 text-sm">Would you like to continue where you left off, or start fresh?</p>
          </div>
        `,
                icon: null,
                showCancelButton: true,
                confirmButtonText: "<i class=\"fas fa-play mr-2\"></i>Continue Draft",
                cancelButtonText: "<i class=\"fas fa-file-plus mr-2\"></i>Start Fresh",
                confirmButtonColor: "#4F46E5",
                cancelButtonColor: "#6B7280",
                customClass: {
                    popup: "rounded-xl shadow-2xl",
                    confirmButton: "rounded-lg px-6 py-3 font-semibold",
                    cancelButton: "rounded-lg px-6 py-3 font-semibold"
                }
            });

            if (result.isConfirmed) {
                this.formData = draft.formData;
                this.wizard.currentStep = draft.currentStep;
            } else {
                this.wizard.clearDraft();
            }
        } else if (performance) {
            this.formData = this.parseExistingPerformance(performance);
            this.isEditMode = true;
            this.modifiedFieldTracker = new ModifiedFieldTracker(this.formData);
        }

        await Swal.fire({
            title: performance
                ? "<i class=\"fas fa-edit text-indigo-600 mr-2\"></i>Edit Performance"
                : "<i class=\"fas fa-magic text-indigo-600 mr-2\"></i>Create New Performance",
            html: this.wizard.render(this.formData),
            width: "1000px",
            showConfirmButton: false,
            showCancelButton: false,
            showCloseButton: true,
            allowOutsideClick: false,
            customClass: {
                popup: "rounded-2xl shadow-2xl",
                htmlContainer: "overflow-visible",
                closeButton: "wizard-close-btn"
            },
            didOpen: () => {
                this.attachEventListeners();
                this.populateVenues();
                this.setupInlineValidation();
                this.populateFormData();
                this.initializeImageUploader();
            },
            willClose: () => {
                this.cleanup();
            },
        });
    }

    cleanup() {
        this.wizard.stopAutoSave();

        this.eventHandlers.forEach(({ selector, event, handler }) => {
            $(document).off(event, selector, handler);
        });
        this.eventHandlers = [];

        if (this.validationTimer) {
            clearTimeout(this.validationTimer);
        }

        if (this.imageUploader) {
            this.imageUploader = null;
        }
    }

    addEventHandler(selector, event, handler) {
        $(document).off(event, selector);
        this.eventHandlers.push({ selector, event, handler });
        $(document).on(event, selector, handler);
    }

    parseExistingPerformance(perf) {
        console.log("Parsing existing performance:", perf);

        // Parse showtimes to split dateTime into date and time
        const showtimes = (perf.showtimes || []).map(showtime => {
            if (showtime.dateTime) {
                const dt = new Date(showtime.dateTime);
                return {
                    date: dt.toISOString().split("T")[0],
                    time: dt.toTimeString().slice(0, 5)
                };
            }
            return showtime;
        });

        // Handle both venueId and venue_id (camelCase and snake_case)
        const venueId = perf.venueId || perf.venue_id;
        console.log("Extracted venueId:", venueId);

        // Extract pricing from pricingSections if available
        let basePrice = perf.basePrice || perf.base_price;
        let vipPrice = perf.vipPrice || perf.vip_price;
        let premiumPrice = perf.premiumPrice || perf.premium_price;
        let economyPrice = perf.economyPrice || perf.economy_price;

        // If pricing not in flat fields, extract from pricingSections
        if (!basePrice && perf.pricingSections && Array.isArray(perf.pricingSections)) {
            perf.pricingSections.forEach(section => {
                const price = section.basePrice || section.price;
                const tier = (section.tier || "").toLowerCase();

                if (tier === "standard" && !basePrice) {
                    basePrice = price;
                } else if (tier === "vip" && !vipPrice) {
                    vipPrice = price;
                } else if (tier === "premium" && !premiumPrice) {
                    premiumPrice = price;
                } else if (tier === "economy" && !economyPrice) {
                    economyPrice = price;
                }
            });
        }

        console.log("Extracted pricing:", { basePrice, vipPrice, premiumPrice, economyPrice });

        let imageUrl = perf.image || perf.imageUrl || perf.image_url || null;

        if (imageUrl && typeof imageUrl === "string") {
            imageUrl = imageUrl
                .replace(/&#x2F;/g, "/")
                .replace(/&#x5C;/g, "\\")
                .replace(/&amp;/g, "&")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&quot;/g, "\"")
                .replace(/&#x27;/g, "'");
        }

        return {
            title: perf.title,
            composer: perf.composer,
            conductor: perf.conductor,
            description: perf.description,
            duration: perf.duration,
            genre: perf.genre,
            imageUrl: imageUrl,
            venueId: venueId,
            showtimes: showtimes,
            basePrice: basePrice,
            vipPrice: vipPrice,
            premiumPrice: premiumPrice,
            economyPrice: economyPrice,
        };
    }

    setupInlineValidation() {
        const self = this;

        $("#wizardTitle").on("blur input", function () {
            const value = $(this).val().trim();
            const validationEl = $("#titleValidation");

            if (!value) {
                validationEl.html("<span class=\"text-red-600\"><i class=\"fas fa-exclamation-circle mr-1\"></i>Required</span>");
                $(this).addClass("border-red-500");
            } else if (value.length < 3) {
                validationEl.html("<span class=\"text-red-600\"><i class=\"fas fa-exclamation-circle mr-1\"></i>Too short</span>");
                $(this).addClass("border-red-500");
            } else {
                validationEl.html("<span class=\"text-green-600\"><i class=\"fas fa-check-circle mr-1\"></i>Valid</span>");
                $(this).removeClass("border-red-500").addClass("border-green-500");
                self.wizard.markDirty();
            }
        });

        $("#wizardComposer").on("blur input", function () {
            const value = $(this).val().trim();
            const validationEl = $("#composerValidation");

            if (!value) {
                validationEl.html("<span class=\"text-red-600\"><i class=\"fas fa-exclamation-circle mr-1\"></i>Required</span>");
                $(this).addClass("border-red-500");
            } else {
                validationEl.html("<span class=\"text-green-600\"><i class=\"fas fa-check-circle mr-1\"></i>Valid</span>");
                $(this).removeClass("border-red-500").addClass("border-green-500");
                self.wizard.markDirty();
            }
        });

        $("#wizardConductor").on("blur input", function () {
            const value = $(this).val().trim();
            const validationEl = $("#conductorValidation");

            if (!value) {
                validationEl.html("<span class=\"text-red-600\"><i class=\"fas fa-exclamation-circle mr-1\"></i>Required</span>");
                $(this).addClass("border-red-500");
            } else {
                validationEl.html("<span class=\"text-green-600\"><i class=\"fas fa-check-circle mr-1\"></i>Valid</span>");
                $(this).removeClass("border-red-500").addClass("border-green-500");
                self.wizard.markDirty();
            }
        });

        $("#wizardDescription").on("blur input", function () {
            const value = $(this).val().trim();
            const validationEl = $("#descriptionValidation");

            if (!value) {
                validationEl.html("<span class=\"text-red-600\"><i class=\"fas fa-exclamation-circle mr-1\"></i>Required</span>");
                $(this).addClass("border-red-500");
            } else if (value.length < 20) {
                validationEl.html("<span class=\"text-orange-600\"><i class=\"fas fa-info-circle mr-1\"></i>Add more details</span>");
                $(this).addClass("border-orange-500");
            } else {
                validationEl.html("<span class=\"text-green-600\"><i class=\"fas fa-check-circle mr-1\"></i>Valid</span>");
                $(this).removeClass("border-red-500 border-orange-500").addClass("border-green-500");
                self.wizard.markDirty();
            }
        });

        $("#wizardVenue").on("change", function () {
            const value = $(this).val();
            const validationEl = $("#venueValidation");

            if (!value) {
                validationEl.html("<span class=\"text-red-600\"><i class=\"fas fa-exclamation-circle mr-1\"></i>Please select a venue</span>");
                $(this).addClass("border-red-500");
            } else {
                validationEl.html("<span class=\"text-green-600\"><i class=\"fas fa-check-circle mr-1\"></i>Valid</span>");
                $(this).removeClass("border-red-500").addClass("border-green-500");
                self.wizard.markDirty();
            }
        });

        $("#wizardPrice").on("blur input", function () {
            const value = parseFloat($(this).val());
            const validationEl = $("#priceValidation");

            if (!value || value <= 0) {
                validationEl.html("<span class=\"text-red-600\"><i class=\"fas fa-exclamation-circle mr-1\"></i>Required</span>");
                $(this).addClass("border-red-500");
            } else {
                validationEl.html("<span class=\"text-green-600\"><i class=\"fas fa-check-circle mr-1\"></i>Valid</span>");
                $(this).removeClass("border-red-500").addClass("border-green-500");
                self.wizard.markDirty();
            }
        });

    }

    attachEventListeners() {
        const self = this;

        // Navigation buttons
        this.addEventHandler("#wizardNextBtn", "click", () => {
            if (self.validateCurrentStep()) {
                // Save current step data BEFORE changing step
                self.saveCurrentStep();
                // Store the data in wizard's formData to persist across steps
                self.wizard.formData = { ...self.wizard.formData, ...self.formData };
                // Ensure we don't go beyond total steps
                if (self.wizard.currentStep < self.wizard.totalSteps) {
                    self.wizard.currentStep++;
                    self.updateWizard();
                }
            }
        });

        this.addEventHandler("#wizardPrevBtn", "click", () => {
            // Save current step data BEFORE changing step
            self.saveCurrentStep();
            // Store the data in wizard's formData to persist across steps
            self.wizard.formData = { ...self.wizard.formData, ...self.formData };
            // Don't go below step 1
            if (self.wizard.currentStep > 1) {
                self.wizard.currentStep--;
                self.updateWizard();
            }
        });

        this.addEventHandler("#wizardSubmitBtn", "click", async () => {
            console.log("Submit button clicked");
            console.log("Current form data:", self.formData);

            if (self.validateCurrentStep()) {
                self.saveCurrentStep();
                await self.submit();
            } else {
                console.error("Validation failed on final step");
            }
        });

        this.addEventHandler("#wizardSaveDraftBtn", "click", () => {
            self.saveCurrentStep();
            self.wizard.saveDraft();
            notify.success("Draft saved successfully!", {
                icon: "fas fa-save",
                duration: 2000
            });
        });

        // Showtime management - use event delegation to prevent duplicate handlers
        this.addEventHandler("#wizardAddShowtime", "click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            self.addShowtime();
        });

        this.attachShowtimeListeners();

        // Step navigation
        this.addEventHandler(".edit-step-btn", "click", function () {
            const step = parseInt($(this).data("step"));
            self.wizard.currentStep = step;
            self.updateWizard();
        });

        // Price preview updates
        this.addEventHandler(
            "#wizardPrice, #wizardVipPrice, #wizardPremiumPrice, #wizardEconomyPrice",
            "input",
            () => {
                self.updatePricePreview();
            }
        );

        // Auto-save on any input change
        this.addEventHandler("input, textarea, select", "change input", function () {
            self.wizard.markDirty();
        });
    }

    populateVenues() {
        const select = $("#wizardVenue");

        // Check if venue dropdown exists (only on step 2)
        if (!select.length) {
            console.log("Venue dropdown not found - probably not on step 2 yet");
            return;
        }

        select.empty().append("<option value=\"\">Select a venue...</option>");

        console.log("=== VENUE POPULATION DEBUG ===");
        console.log("Current venueId:", this.formData.venueId, "Type:", typeof this.formData.venueId);
        console.log("Full formData:", this.formData);
        console.log("Available venues:", this.venues);

        this.venues.forEach((venue) => {
            // Use loose equality to handle string/number mismatch
            const selected = venue.id == this.formData.venueId ? "selected" : "";
            console.log(`Venue ${venue.id} (${venue.name}): selected="${selected}", match: ${venue.id == this.formData.venueId}`);
            select.append(
                `<option value="${venue.id}" ${selected}>${venue.name}</option>`
            );
        });

        console.log("Options after building:", select.find("option").length);
        console.log("Current dropdown value before manual set:", select.val());

        // Force set the value multiple ways
        if (this.formData.venueId) {
            // Try immediately first
            select.val(String(this.formData.venueId));
            console.log("After immediate set, value:", select.val());

            // Then try with delay
            setTimeout(() => {
                const venueIdStr = String(this.formData.venueId);
                const venueIdNum = Number(this.formData.venueId);

                // Try string version
                select.val(venueIdStr);
                console.log("After string set:", select.val());

                // Try number version
                if (!select.val()) {
                    select.val(venueIdNum);
                    console.log("After number set:", select.val());
                }

                // If still not selected, try finding and setting manually
                if (!select.val() || select.val() === "") {
                    console.warn("⚠️ Venue selection failed! Trying alternative methods...");
                    const option = select.find(`option[value="${venueIdStr}"]`);
                    console.log("Found option:", option.length, option.text());
                    option.prop("selected", true);
                    select.trigger("change");
                    console.log("After alternative method, selected:", select.val());
                }

                console.log("=== FINAL VENUE STATE ===");
                console.log("Selected value:", select.val());
                console.log("Selected text:", select.find("option:selected").text());
            }, 50);
        }
    }

    populateFormData() {
        // Populate basic info fields
        if (this.formData.title) {$("#wizardTitle").val(this.formData.title);}
        if (this.formData.composer) {$("#wizardComposer").val(this.formData.composer);}
        if (this.formData.conductor) {$("#wizardConductor").val(this.formData.conductor);}
        if (this.formData.description) {$("#wizardDescription").val(this.formData.description);}
        if (this.formData.duration) {$("#wizardDuration").val(this.formData.duration);}
        if (this.formData.genre) {$("#wizardGenre").val(this.formData.genre);}

        // Populate venue (only if on step 2 where venue dropdown exists)
        if (this.formData.venueId && this.wizard.currentStep === 2) {
            console.log("populateFormData: Setting venue to", this.formData.venueId);
            $("#wizardVenue").val(String(this.formData.venueId));
            console.log("populateFormData: Venue dropdown value is now", $("#wizardVenue").val());
        }

        // Populate pricing (only if on step 3 where pricing fields exist)
        if (this.wizard.currentStep === 3) {
            console.log("populateFormData: Populating pricing data", {
                basePrice: this.formData.basePrice,
                vipPrice: this.formData.vipPrice,
                premiumPrice: this.formData.premiumPrice,
                economyPrice: this.formData.economyPrice
            });

            if (this.formData.basePrice) {
                $("#wizardPrice").val(this.formData.basePrice);
                console.log("Set base price to:", this.formData.basePrice);
            }
            if (this.formData.vipPrice) {
                $("#wizardVipPrice").val(this.formData.vipPrice);
                console.log("Set VIP price to:", this.formData.vipPrice);
            }
            if (this.formData.premiumPrice) {
                $("#wizardPremiumPrice").val(this.formData.premiumPrice);
                console.log("Set premium price to:", this.formData.premiumPrice);
            }
            if (this.formData.economyPrice) {
                $("#wizardEconomyPrice").val(this.formData.economyPrice);
                console.log("Set economy price to:", this.formData.economyPrice);
            }

            // Update price preview
            this.updatePricePreview();
        }

        // Populate showtimes if they exist
        if (this.formData.showtimes && this.formData.showtimes.length > 0) {
            this.formData.showtimes.forEach((showtime, index) => {
                $(`.showtime-date[data-index="${index}"]`).val(showtime.date || "");
                $(`.showtime-time[data-index="${index}"]`).val(showtime.time || "");
            });
        }

        // Update review if on review step
        if (this.wizard.currentStep === 4) {
            // Save current data before updating review
            this.saveCurrentStep();
            this.updateReview();
        }
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
            $("#wizardTitle").focus();
            return false;
        }

        if (description.length < 20) {
            notify.warning("Consider adding more details to the description");
        }

        if (this.imageUploader && this.imageUploader.state.error) {
            notify.warning("Please resolve the image error or remove the image");
        }

        return true;
    }

    validateSchedule() {
        // Save current step data first to ensure venueId is in formData
        this.saveCurrentStep();

        const venueId = this.formData.venueId || $("#wizardVenue").val();

        if (!venueId) {
            notify.error("Please select a venue");
            $("#wizardVenue").focus();
            return false;
        }

        if (!this.formData.showtimes || this.formData.showtimes.length === 0) {
            notify.error("Please add at least one showtime");
            $("#showtimesValidation").html("<span class=\"text-red-600\"><i class=\"fas fa-exclamation-circle mr-1\"></i>At least one showtime required</span>");
            return false;
        }

        // Validate that all showtimes have both date and time
        const invalidShowtimes = this.formData.showtimes.filter(st => !st.date || !st.time);
        if (invalidShowtimes.length > 0) {
            notify.error("Please complete all showtime dates and times");
            return false;
        }

        return true;
    }

    validatePricing() {
        // Save current step data first
        this.saveCurrentStep();

        const basePrice = parseFloat(this.formData.basePrice || $("#wizardPrice").val());

        if (!basePrice || basePrice <= 0 || isNaN(basePrice)) {
            notify.error("Please enter a valid standard price");
            $("#wizardPrice").focus();
            return false;
        }

        return true;
    }

    async saveImageData() {
        if (!this.imageUploader) {
            return null;
        }

        const imageData = this.imageUploader.getImageData();

        if (!imageData || !imageData.type) {
            return null;
        }

        if (imageData.type === "url") {
            return imageData.data;
        } else if (imageData.type === "upload" && imageData.data) {
            try {
                const formData = new FormData();
                formData.append("image", imageData.data);

                const response = await fetch("/api/performances/upload-image", {
                    method: "POST",
                    body: formData,
                    credentials: "include"
                });

                if (!response.ok) {
                    throw new Error("Failed to upload image");
                }

                const result = await response.json();
                // Return the uploaded image URL
                return result.data?.imageUrl || result.imageUrl;
            } catch (error) {
                console.error("Error uploading image:", error);
                notify.error("Failed to upload image");
                return null;
            }
        }

        return null;
    }

    saveCurrentStep() {
        const self = this;
        try {
            switch (this.wizard.currentStep) {
                case 1:
                    const title = $("#wizardTitle");
                    const composer = $("#wizardComposer");
                    const conductor = $("#wizardConductor");
                    const description = $("#wizardDescription");
                    const duration = $("#wizardDuration");
                    const genre = $("#wizardGenre");

                    if (title.length) {
                        this.formData.title = title.val();
                        this.trackFieldChange("title", title.val());
                    }
                    if (composer.length) {
                        this.formData.composer = composer.val();
                        this.trackFieldChange("composer", composer.val());
                    }
                    if (conductor.length) {
                        this.formData.conductor = conductor.val();
                        this.trackFieldChange("conductor", conductor.val());
                    }
                    if (description.length) {
                        this.formData.description = description.val();
                        this.trackFieldChange("description", description.val());
                    }
                    if (duration.length) {
                        this.formData.duration = duration.val();
                        this.trackFieldChange("duration", duration.val());
                    }
                    if (genre.length) {
                        this.formData.genre = genre.val();
                        this.trackFieldChange("genre", genre.val());
                    }

                    if (this.imageUploader) {
                        const imageData = this.imageUploader.getImageData();
                        this.formData.imageData = imageData;
                        this.trackFieldChange("imageData", imageData);
                    }
                    break;

                case 2:
                    const venueSelect = $("#wizardVenue");
                    if (venueSelect.length) {
                        const venueValue = venueSelect.val();
                        this.formData.venueId = venueValue ? parseInt(venueValue) : null;
                        this.trackFieldChange("venueId", this.formData.venueId);
                        console.log("saveCurrentStep - Saved venueId:", this.formData.venueId);
                    }

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
                    this.trackFieldChange("showtimes", this.formData.showtimes);
                    break;

                case 3:
                    const priceInput = $("#wizardPrice");
                    const vipPriceInput = $("#wizardVipPrice");
                    const premiumPriceInput = $("#wizardPremiumPrice");
                    const economyPriceInput = $("#wizardEconomyPrice");

                    if (priceInput.length) {
                        this.formData.basePrice = parseFloat(priceInput.val());
                        this.trackFieldChange("basePrice", this.formData.basePrice);
                    }
                    if (vipPriceInput.length) {
                        this.formData.vipPrice = parseFloat(vipPriceInput.val()) || null;
                        this.trackFieldChange("vipPrice", this.formData.vipPrice);
                    }
                    if (premiumPriceInput.length) {
                        this.formData.premiumPrice = parseFloat(premiumPriceInput.val()) || null;
                        this.trackFieldChange("premiumPrice", this.formData.premiumPrice);
                    }
                    if (economyPriceInput.length) {
                        this.formData.economyPrice = parseFloat(economyPriceInput.val()) || null;
                        this.trackFieldChange("economyPrice", this.formData.economyPrice);
                    }
                    break;
            }
        } catch (error) {
            console.error("Error saving current step:", error);
        }
    }

    trackFieldChange(fieldName, currentValue) {
        if (this.isEditMode && this.modifiedFieldTracker) {
            this.modifiedFieldTracker.checkAndMarkModified(fieldName, currentValue);
        }
    }

    updateWizard() {
        // Sync formData between handler and wizard
        this.wizard.formData = { ...this.wizard.formData, ...this.formData };
        this.formData = this.wizard.formData;

        // Re-render the wizard with the new step
        $(".performance-wizard").replaceWith(this.wizard.render(this.formData, false));
        this.attachEventListeners();
        this.populateVenues();
        this.setupInlineValidation();
        this.populateFormData();

        // Initialize ImageUploader if on step 1
        if (this.wizard.currentStep === 1) {
            this.initializeImageUploader();
        }

        $("#stepProgress").text(`Step ${this.wizard.currentStep} of ${this.wizard.totalSteps}`);

        // Update review if on review step
        if (this.wizard.currentStep === 4) {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                this.updateReview();
            }, 50);
        }
    }

    attachShowtimeListeners() {
        const self = this;

        // Remove existing listeners first to prevent duplicates
        $(".remove-showtime").off("click");
        $(".showtime-date, .showtime-time").off("change");

        // Attach remove showtime listeners
        $(".remove-showtime").on("click", function (e) {
            e.preventDefault();
            const index = $(this).data("index");
            self.removeShowtime(index);
        });

        // Attach change listeners to save data
        $(".showtime-date, .showtime-time").on("change", function () {
            self.saveCurrentStep();
            self.wizard.markDirty();
        });
    }

    initializeImageUploader() {
        // Only initialize on step 1 where the image uploader container exists
        const container = document.getElementById("imageUploaderContainer");
        if (!container) {
            return;
        }

        // Determine the current image URL to display
        let currentImageUrl = null;

        // Priority: draft imageData > existing performance imageUrl
        if (this.formData.imageData) {
            // Restore from draft
            const imageData = this.formData.imageData;

            if (imageData.type === "url" && imageData.data) {
                currentImageUrl = getPerformanceImageUrl(imageData.data);
            } else if (imageData.type === "upload" && imageData.previewUrl) {
                // For uploads, we can show the preview URL if available
                // But note that the actual file is lost and needs re-upload
                currentImageUrl = imageData.previewUrl;
            }
        } else if (this.formData.imageUrl) {
            // Use existing performance image - convert to absolute URL
            currentImageUrl = getPerformanceImageUrl(this.formData.imageUrl);
        }

        // Create ImageUploader instance
        this.imageUploader = new ImageUploader({
            containerId: "wizardImageUploader",
            currentImageUrl: currentImageUrl,
            onImageChange: (imageData) => {
                // Update formData when image changes
                this.formData.imageData = imageData;
                this.wizard.markDirty();
            },
            maxFileSize: 5242880 // 5MB
        });

        // Render the ImageUploader into the container
        container.innerHTML = this.imageUploader.render();

        // Attach event listeners
        this.imageUploader.attachEventListeners();

        // Restore draft image state if available
        if (this.formData.imageData) {
            const imageData = this.formData.imageData;

            // Restore the state in the ImageUploader
            if (imageData.type === "url" && imageData.data) {
                // URL is already set via currentImageUrl in constructor
                // Just ensure the state is correct
                this.imageUploader.state.imageSource = "url";
                this.imageUploader.state.imageData = imageData.data;
                this.imageUploader.state.previewUrl = imageData.previewUrl || imageData.data;
            } else if (imageData.type === "upload" && imageData.uploadPending) {
                // Show a message that the file needs to be re-uploaded
                this.imageUploader.state.error = `Previous upload (${imageData.fileName}) was not saved. Please re-upload the file.`;
                this.imageUploader.state.imageSource = null;
                this.imageUploader.state.imageData = null;
                this.imageUploader.state.previewUrl = null;
                // Rerender to show the error message
                this.imageUploader.rerender();
            }
        }
    }

    addShowtime() {
        if (!this.formData.showtimes) {
            this.formData.showtimes = [];
        }

        // Add only one showtime
        this.formData.showtimes.push({
            date: "",
            time: "",
        });

        // Update the wizard's formData reference
        this.wizard.formData = this.formData;

        // Re-render showtimes
        $("#wizardShowtimesContainer").html(this.wizard.renderShowtimes());
        $("#showtimesValidation").html("<span class=\"text-green-600\"><i class=\"fas fa-check-circle mr-1\"></i>Showtime added</span>");
        this.wizard.markDirty();

        // Re-attach event listeners for the new showtime fields
        this.attachShowtimeListeners();
    }

    removeShowtime(index) {
        this.formData.showtimes.splice(index, 1);
        // Update the wizard's formData reference
        this.wizard.formData = this.formData;
        $("#wizardShowtimesContainer").html(this.wizard.renderShowtimes());
        this.wizard.markDirty();
        // Re-attach listeners after re-render
        this.attachShowtimeListeners();
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
        $("#reviewTitle").text(this.formData.title || "--");
        $("#reviewComposer").text(this.formData.composer || "--");
        $("#reviewConductor").text(this.formData.conductor || "--");
        $("#reviewDuration").text(
            this.formData.duration
                ? `${this.formData.duration} minutes`
                : "Not specified"
        );

        const venueId = this.formData.venueId ? parseInt(this.formData.venueId) : null;
        const venue = this.venues.find((v) => v.id === venueId);
        console.log("updateReview - venueId:", venueId, "found venue:", venue);
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
            console.log("Starting submit process...");
            this.wizard.updateAutoSaveStatus("saving");

            const imageUrl = await this.saveImageData();

            let submitData;

            if (this.isEditMode && this.modifiedFieldTracker) {
                const fullData = {
                    title: this.formData.title,
                    composer: this.formData.composer,
                    conductor: this.formData.conductor,
                    description: this.formData.description,
                    duration: this.formData.duration,
                    genre: this.formData.genre,
                    venueId: this.formData.venueId,
                    showtimes: (this.formData.showtimes || []).map(st => ({
                        dateTime: `${st.date}T${st.time}:00`
                    })),
                    basePrice: this.formData.basePrice,
                    vipPrice: this.formData.vipPrice,
                    premiumPrice: this.formData.premiumPrice,
                    economyPrice: this.formData.economyPrice
                };

                if (imageUrl) {
                    fullData.image = imageUrl;
                    this.modifiedFieldTracker.markModified("image");
                }

                submitData = this.modifiedFieldTracker.getPayload(fullData);

                if (this.modifiedFieldTracker.isModified("showtimes")) {
                    submitData.showtimes = fullData.showtimes;
                }

                console.log("Edit mode - Modified fields:", this.modifiedFieldTracker.getModifiedFields());
                console.log("Edit mode - Submitting only modified data:", submitData);
            } else {
                submitData = {
                    title: this.formData.title,
                    composer: this.formData.composer,
                    conductor: this.formData.conductor,
                    description: this.formData.description,
                    duration: this.formData.duration,
                    genre: this.formData.genre,
                    venueId: this.formData.venueId,
                    showtimes: (this.formData.showtimes || []).map(st => ({
                        dateTime: `${st.date}T${st.time}:00`
                    }))
                };

                if (imageUrl) {
                    submitData.image = imageUrl;
                }

                console.log("Create mode - Submitting full data:", submitData);
            }

            await this.onSubmit(submitData);

            this.wizard.clearDraft();
            Swal.close();

            await Swal.fire({
                title: null,
                html: `
          <div class="text-center py-6">
            <div class="mb-6">
              <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full shadow-lg">
                <i class="fas fa-check text-4xl text-white"></i>
              </div>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 mb-3">Success!</h3>
            <p class="text-gray-700 mb-2 text-lg">Performance created successfully!</p>
            <p class="text-sm text-gray-600">Your performance has been added to the system and is ready to go.</p>
          </div>
        `,
                icon: null,
                confirmButtonText: "<i class=\"fas fa-thumbs-up mr-2\"></i>Great!",
                confirmButtonColor: "#10B981",
                customClass: {
                    popup: "rounded-2xl shadow-2xl",
                    confirmButton: "rounded-lg px-8 py-3 font-semibold"
                }
            });
        } catch (error) {
            console.error("Error saving performance:", error);
            this.wizard.updateAutoSaveStatus("error");

            await Swal.fire({
                title: "<i class=\"fas fa-exclamation-triangle text-red-600 mr-2\"></i>Error",
                html: `
          <div class="text-center">
            <p class="text-gray-700 mb-2">Failed to save performance</p>
            <p class="text-sm text-gray-600">${error.message || "Please try again."}</p>
          </div>
        `,
                icon: null,
                confirmButtonText: "OK",
                confirmButtonColor: "#EF4444",
                customClass: {
                    popup: "rounded-2xl shadow-2xl",
                    confirmButton: "rounded-lg px-6 py-3 font-semibold"
                }
            });
        }
    }
}

