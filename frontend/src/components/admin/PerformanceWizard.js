
import dayjs from "dayjs";

export const PerformanceWizard = {
  currentStep: 1,
  totalSteps: 4,
  formData: {},
  autoSaveInterval: null,
  lastSaved: null,
  isDirty: false,

  render(performance = null, resetStep = true) {
    if (resetStep) {
      this.currentStep = 1;
    }
    this.formData = performance || {};
    this.startAutoSave();

    return `
      <div class="performance-wizard">
        ${this.renderProgress()}
        ${this.renderAutoSaveIndicator()}
        <div class="wizard-content mt-6">
          ${this.renderStep()}
        </div>
        <div class="wizard-actions mt-6 flex justify-between">
          ${this.renderActions()}
        </div>
      </div>
    `;
  },

  renderAutoSaveIndicator() {
    return `
      <div class="flex items-center justify-between mt-2 px-2">
        <div class="text-xs text-gray-500">
          <span id="autoSaveStatus" class="inline-flex items-center gap-1">
            <i class="fas fa-circle text-gray-400"></i>
            <span>Auto-save enabled</span>
          </span>
        </div>
        <div class="text-xs text-gray-500">
          <span id="stepProgress">Step ${this.currentStep} of ${this.totalSteps}</span>
        </div>
      </div>
    `;
  },

  startAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    this.autoSaveInterval = setInterval(() => {
      if (this.isDirty) {
        this.saveDraft();
      }
    }, 30000);
  },

  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  },

  saveDraft() {
    try {
      const draftKey = "performance_draft";
      const draft = {
        formData: this.formData,
        currentStep: this.currentStep,
        timestamp: new Date().toISOString(),
      };

      // Handle image data separately for File objects
      if (this.formData.imageData) {
        const imageData = this.formData.imageData;

        // Store image metadata
        draft.imageData = {
          type: imageData.type,
          previewUrl: imageData.previewUrl
        };

        // For URL type, store the URL string
        if (imageData.type === "url") {
          draft.imageData.data = imageData.data;
        }
        // For upload type, we can't serialize File objects to localStorage
        // Store a flag that there was an upload, but user will need to re-upload
        else if (imageData.type === "upload") {
          draft.imageData.data = null;
          draft.imageData.uploadPending = true;
          draft.imageData.fileName = imageData.data?.name || "uploaded-file";
        }
      }

      localStorage.setItem(draftKey, JSON.stringify(draft));
      this.lastSaved = new Date();
      this.isDirty = false;
      this.updateAutoSaveStatus("saved");
    } catch (error) {
      console.error("Failed to save draft:", error);
    }
  },

  loadDraft() {
    try {
      const draftKey = "performance_draft";
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        const parsedDraft = JSON.parse(draft);

        if (parsedDraft.imageData) {
          parsedDraft.formData.imageData = parsedDraft.imageData;
        }

        return parsedDraft;
      }
    } catch (error) {
      console.error("Failed to load draft:", error);
    }
    return null;
  },

  clearDraft() {
    try {
      localStorage.removeItem("performance_draft");
    } catch (error) {
      console.error("Failed to clear draft:", error);
    }
  },

  updateAutoSaveStatus(status) {
    const statusEl = $("#autoSaveStatus");
    if (!statusEl.length) {return;}

    switch (status) {
      case "saving":
        statusEl.html(`
          <i class="fas fa-circle-notch fa-spin text-blue-500"></i>
          <span>Saving...</span>
        `);
        break;
      case "saved":
        statusEl.html(`
          <i class="fas fa-check-circle text-green-500"></i>
          <span>Saved ${dayjs(this.lastSaved).format("HH:mm:ss")}</span>
        `);
        setTimeout(() => {
          statusEl.html(`
            <i class="fas fa-circle text-gray-400"></i>
            <span>Auto-save enabled</span>
          `);
        }, 3000);
        break;
      case "error":
        statusEl.html(`
          <i class="fas fa-exclamation-circle text-red-500"></i>
          <span>Save failed</span>
        `);
        break;
    }
  },

  markDirty() {
    this.isDirty = true;
  },

  renderProgress() {
    const steps = [
      { number: 1, label: "Basic Info", icon: "fa-info-circle" },
      { number: 2, label: "Schedule", icon: "fa-calendar" },
      { number: 3, label: "Pricing", icon: "fa-dollar-sign" },
      { number: 4, label: "Review", icon: "fa-check" },
    ];

    return `
      <div class="flex items-center justify-between mb-2">
        ${steps
        .map((step, index) => {
          const isActive = step.number === this.currentStep;
          const isCompleted = step.number < this.currentStep;
          return `
              <div class="flex items-center ${index < steps.length - 1 ? "flex-1" : ""}">
                <div class="flex flex-col items-center">
                  <div class="${isActive
              ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
              : isCompleted
                ? "bg-green-600 text-white"
                : "bg-gray-300 text-gray-600"
            } w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300 shadow-md">
                    ${isCompleted
              ? "<i class=\"fas fa-check text-lg\"></i>"
              : `<span class="text-lg">${step.number}</span>`
            }
                  </div>
                  <div class="mt-2 text-xs font-medium ${isActive
              ? "text-indigo-600"
              : isCompleted
                ? "text-green-600"
                : "text-gray-500"
            } transition-colors">
                    ${step.label}
                  </div>
                </div>
                ${index < steps.length - 1
              ? `<div class="flex-1 h-1 mx-3 rounded-full ${isCompleted ? "bg-green-600" : "bg-gray-300"
              } transition-all duration-300"></div>`
              : ""
            }
              </div>
            `;
        })
        .join("")}
      </div>
    `;
  },

  renderStep() {
    switch (this.currentStep) {
      case 1:
        return this.renderBasicInfo();
      case 2:
        return this.renderSchedule();
      case 3:
        return this.renderPricing();
      case 4:
        return this.renderReview();
      default:
        return "";
    }
  },

  renderBasicInfo() {
    return `
      <div class="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div class="flex items-start justify-between mb-4">
          <div>
            <h3 class="text-xl font-bold text-gray-900">
              <i class="fas fa-info-circle text-indigo-600 mr-2"></i>
              Basic Performance Information
            </h3>
            <p class="text-sm text-gray-600 mt-1">Let's start with the essentials</p>
          </div>
          <div class="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            Required fields marked with <span class="text-red-500">*</span>
          </div>
        </div>

        <div class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Performance Title <span class="text-red-500">*</span>
            </label>
            <input type="text" id="wizardTitle" required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black transition-all"
              placeholder="e.g., Symphony No. 9 in D minor"
              value="${this.formData.title || ""}" />
            <div class="mt-1 flex items-center justify-between">
              <p class="text-xs text-gray-500">The main title of the performance</p>
              <span id="titleValidation" class="text-xs"></span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Composer <span class="text-red-500">*</span>
              </label>
              <input type="text" id="wizardComposer" required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black transition-all"
                placeholder="e.g., Ludwig van Beethoven"
                value="${this.formData.composer || ""}" />
              <span id="composerValidation" class="text-xs mt-1 block"></span>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Conductor <span class="text-red-500">*</span>
              </label>
              <input type="text" id="wizardConductor" required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black transition-all"
                placeholder="e.g., Herbert von Karajan"
                value="${this.formData.conductor || ""}" />
              <span id="conductorValidation" class="text-xs mt-1 block"></span>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Description <span class="text-red-500">*</span>
            </label>
            <textarea id="wizardDescription" rows="4" required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black transition-all"
              placeholder="Describe the performance, its significance, and what audiences can expect...">${this.formData.description || ""}</textarea>
            <div class="mt-1 flex items-center justify-between">
              <p class="text-xs text-gray-500">Provide details about the performance</p>
              <span id="descriptionValidation" class="text-xs"></span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <input type="number" id="wizardDuration" min="30" max="300"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black transition-all"
                placeholder="120"
                value="${this.formData.duration || ""}" />
              <p class="text-xs text-gray-500 mt-1">Typical concert duration</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Genre
              </label>
              <select id="wizardGenre"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black transition-all">
                <option value="">Select genre...</option>
                <option value="symphony" ${this.formData.genre === "symphony" ? "selected" : ""}>Symphony</option>
                <option value="concerto" ${this.formData.genre === "concerto" ? "selected" : ""}>Concerto</option>
                <option value="opera" ${this.formData.genre === "opera" ? "selected" : ""}>Opera</option>
                <option value="chamber" ${this.formData.genre === "chamber" ? "selected" : ""}>Chamber Music</option>
                <option value="choral" ${this.formData.genre === "choral" ? "selected" : ""}>Choral</option>
              </select>
              <p class="text-xs text-gray-500 mt-1">Musical category</p>
            </div>
          </div>

          <!-- Image Management Section -->
          <div class="border-t pt-6 mt-6">
            <div id="imageUploaderContainer"></div>
          </div>
        </div>
      </div>
    `;
  },

  renderSchedule() {
    return `
      <div class="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 class="text-xl font-bold text-gray-900 mb-4">
          <i class="fas fa-calendar text-indigo-600 mr-2"></i>
          Schedule & Venue
        </h3>
        <p class="text-sm text-gray-600 mb-6">When and where will this performance take place?</p>

        <div class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Venue <span class="text-red-500">*</span>
            </label>
            <select id="wizardVenue" required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black transition-all">
              <option value="">Select a venue...</option>
            </select>
            <p class="text-xs text-gray-500 mt-1">Where the performance will be held</p>
            <span id="venueValidation" class="text-xs mt-1 block"></span>
          </div>

          <div class="border-t pt-6">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h4 class="text-sm font-semibold text-gray-900">Showtimes</h4>
                <p class="text-xs text-gray-500 mt-0.5">Add one or more performance dates</p>
              </div>
              <button type="button" id="wizardAddShowtime"
                class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md text-sm font-medium">
                <i class="fas fa-plus mr-2"></i>Add Showtime
              </button>
            </div>

            <div id="wizardShowtimesContainer" class="space-y-3">
              ${this.renderShowtimes()}
            </div>
            <span id="showtimesValidation" class="text-xs mt-2 block"></span>
          </div>
        </div>
      </div>
    `;
  },

  renderShowtimes() {
    const showtimes = this.formData.showtimes || [];

    if (showtimes.length === 0) {
      return `
        <div class="text-center py-10 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300">
          <i class="fas fa-calendar-plus text-5xl text-gray-400 mb-3"></i>
          <p class="text-sm font-medium text-gray-700">No showtimes added yet</p>
          <p class="text-xs text-gray-500 mt-1">Click "Add Showtime" to create one</p>
        </div>
      `;
    }

    return showtimes
      .map(
        (showtime, index) => `
        <div class="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:border-indigo-300 transition-all">
          <div class="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
            <i class="fas fa-clock text-indigo-600"></i>
          </div>
          <div class="flex-1 grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Date</label>
              <input type="date" class="showtime-date w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                data-index="${index}" value="${showtime.date || ""}" required />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Time</label>
              <input type="time" class="showtime-time w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                data-index="${index}" value="${showtime.time || ""}" required />
            </div>
          </div>
          <button type="button" class="remove-showtime flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
            data-index="${index}" title="Remove showtime">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `
      )
      .join("");
  },

  renderPricing() {
    return `
      <div class="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 class="text-xl font-bold text-gray-900 mb-4">
          <i class="fas fa-dollar-sign text-indigo-600 mr-2"></i>
          Ticket Pricing
        </h3>
        <p class="text-sm text-gray-600 mb-6">Set up your ticket prices</p>

        <div class="space-y-6">
          <div class="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <i class="fas fa-lightbulb text-indigo-600 mt-0.5 text-lg"></i>
              <div class="text-sm text-indigo-900">
                <p class="font-semibold mb-1">Quick Setup</p>
                <p>Set a standard price that will apply to all seats. You can customize pricing by section later if needed.</p>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Standard Ticket Price (HKD) <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">HKD</span>
              <input type="number" id="wizardPrice" min="0" step="10" required
                class="w-full pl-16 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black text-lg font-semibold transition-all"
                placeholder="380"
                value="${this.formData.basePrice || ""}" />
            </div>
            <div class="mt-1 flex items-center justify-between">
              <p class="text-xs text-gray-500">Base price for standard seating</p>
              <span id="priceValidation" class="text-xs"></span>
            </div>
          </div>

          <div class="border-t pt-6">
            <h4 class="text-sm font-semibold text-gray-900 mb-4">Optional Tier Pricing</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <span class="inline-flex items-center gap-2">
                    <span class="w-3 h-3 bg-yellow-400 rounded-full"></span>
                    VIP Price
                  </span>
                </label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">HKD</span>
                  <input type="number" id="wizardVipPrice" min="0" step="10"
                    class="w-full pl-14 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-black transition-all"
                    placeholder="680"
                    value="${this.formData.vipPrice || ""}" />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <span class="inline-flex items-center gap-2">
                    <span class="w-3 h-3 bg-purple-400 rounded-full"></span>
                    Premium Price
                  </span>
                </label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">HKD</span>
                  <input type="number" id="wizardPremiumPrice" min="0" step="10"
                    class="w-full pl-14 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-black transition-all"
                    placeholder="480"
                    value="${this.formData.premiumPrice || ""}" />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <span class="inline-flex items-center gap-2">
                    <span class="w-3 h-3 bg-blue-400 rounded-full"></span>
                    Economy Price
                  </span>
                </label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">HKD</span>
                  <input type="number" id="wizardEconomyPrice" min="0" step="10"
                    class="w-full pl-14 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black transition-all"
                    placeholder="180"
                    value="${this.formData.economyPrice || ""}" />
                </div>
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-5 border border-gray-200">
            <h4 class="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <i class="fas fa-chart-bar text-indigo-600"></i>
              Price Summary
            </h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div class="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <p class="text-xs text-gray-600 mb-1">Standard</p>
                <p class="text-xl font-bold text-gray-900" id="pricePreviewStandard">--</p>
              </div>
              <div class="bg-white rounded-lg p-4 shadow-sm border border-purple-200">
                <p class="text-xs text-gray-600 mb-1">Premium</p>
                <p class="text-xl font-bold text-purple-600" id="pricePreviewPremium">--</p>
              </div>
              <div class="bg-white rounded-lg p-4 shadow-sm border border-yellow-200">
                <p class="text-xs text-gray-600 mb-1">VIP</p>
                <p class="text-xl font-bold text-yellow-600" id="pricePreviewVip">--</p>
              </div>
              <div class="bg-white rounded-lg p-4 shadow-sm border border-blue-200">
                <p class="text-xs text-gray-600 mb-1">Economy</p>
                <p class="text-xl font-bold text-blue-600" id="pricePreviewEconomy">--</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderReview() {
    return `
      <div class="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 class="text-xl font-bold text-gray-900 mb-4">
          <i class="fas fa-check-circle text-green-600 mr-2"></i>
          Review & Confirm
        </h3>
        <p class="text-sm text-gray-600 mb-6">Please review your performance details before submitting</p>

        <div class="space-y-5">
          <div class="bg-gradient-to-r from-gray-50 to-white rounded-lg p-5 border border-gray-200">
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <i class="fas fa-info-circle text-indigo-600"></i>
                Basic Information
              </h4>
              <button type="button" class="edit-step-btn text-xs text-indigo-600 hover:text-indigo-700 font-medium" data-step="1">
                <i class="fas fa-edit mr-1"></i>Edit
              </button>
            </div>
            <dl class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt class="text-gray-600 mb-1">Title:</dt>
                <dd class="font-semibold text-gray-900" id="reviewTitle">--</dd>
              </div>
              <div>
                <dt class="text-gray-600 mb-1">Composer:</dt>
                <dd class="font-semibold text-gray-900" id="reviewComposer">--</dd>
              </div>
              <div>
                <dt class="text-gray-600 mb-1">Conductor:</dt>
                <dd class="font-semibold text-gray-900" id="reviewConductor">--</dd>
              </div>
              <div>
                <dt class="text-gray-600 mb-1">Duration:</dt>
                <dd class="font-semibold text-gray-900" id="reviewDuration">--</dd>
              </div>
            </dl>
          </div>

          <div class="bg-gradient-to-r from-gray-50 to-white rounded-lg p-5 border border-gray-200">
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <i class="fas fa-calendar text-indigo-600"></i>
                Schedule
              </h4>
              <button type="button" class="edit-step-btn text-xs text-indigo-600 hover:text-indigo-700 font-medium" data-step="2">
                <i class="fas fa-edit mr-1"></i>Edit
              </button>
            </div>
            <dl class="space-y-3 text-sm">
              <div>
                <dt class="text-gray-600 mb-1">Venue:</dt>
                <dd class="font-semibold text-gray-900" id="reviewVenue">--</dd>
              </div>
              <div>
                <dt class="text-gray-600 mb-1">Showtimes:</dt>
                <dd id="reviewShowtimes" class="font-semibold text-gray-900">--</dd>
              </div>
            </dl>
          </div>

          <div class="bg-gradient-to-r from-gray-50 to-white rounded-lg p-5 border border-gray-200">
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <i class="fas fa-dollar-sign text-indigo-600"></i>
                Pricing
              </h4>
              <button type="button" class="edit-step-btn text-xs text-indigo-600 hover:text-indigo-700 font-medium" data-step="3">
                <i class="fas fa-edit mr-1"></i>Edit
              </button>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div class="bg-white rounded-lg p-4 text-center border border-gray-200">
                <p class="text-xs text-gray-600 mb-1">Standard</p>
                <p class="text-lg font-bold text-gray-900" id="reviewPriceStandard">--</p>
              </div>
              <div class="bg-white rounded-lg p-4 text-center border border-purple-200">
                <p class="text-xs text-gray-600 mb-1">Premium</p>
                <p class="text-lg font-bold text-purple-600" id="reviewPricePremium">--</p>
              </div>
              <div class="bg-white rounded-lg p-4 text-center border border-yellow-200">
                <p class="text-xs text-gray-600 mb-1">VIP</p>
                <p class="text-lg font-bold text-yellow-600" id="reviewPriceVip">--</p>
              </div>
              <div class="bg-white rounded-lg p-4 text-center border border-blue-200">
                <p class="text-xs text-gray-600 mb-1">Economy</p>
                <p class="text-lg font-bold text-blue-600" id="reviewPriceEconomy">--</p>
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-5">
            <div class="flex items-start gap-3">
              <i class="fas fa-check-circle text-green-600 mt-0.5 text-xl"></i>
              <div class="text-sm text-green-900">
                <p class="font-semibold mb-1">Ready to Create</p>
                <p>Your performance is ready to be created. Click "Create Performance" to submit.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderActions() {
    const isFirstStep = this.currentStep === 1;
    const isLastStep = this.currentStep === this.totalSteps;

    return `
      <div class="flex items-center gap-3">
        ${!isFirstStep
        ? `<button type="button" id="wizardPrevBtn"
              class="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium text-gray-700 shadow-sm hover:shadow">
              <i class="fas fa-arrow-left mr-2"></i>Previous
            </button>`
        : `<button type="button" id="wizardSaveDraftBtn"
              class="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium text-gray-700 shadow-sm hover:shadow">
              <i class="fas fa-save mr-2"></i>Save Draft
            </button>`
      }
      </div>
      ${!isLastStep
        ? `<button type="button" id="wizardNextBtn"
              class="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-semibold shadow-md hover:shadow-lg">
              Next<i class="fas fa-arrow-right ml-2"></i>
            </button>`
        : `<button type="button" id="wizardSubmitBtn"
              class="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-semibold shadow-md hover:shadow-lg">
              <i class="fas fa-check mr-2"></i>Create
            </button>`
      }
    `;
  },
};

