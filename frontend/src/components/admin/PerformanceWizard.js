import { FormComponents } from "@components/FormComponents.js";
import dayjs from "dayjs";

export const PerformanceWizard = {
  currentStep: 1,
  totalSteps: 4,
  formData: {},

  render(performance = null, resetStep = true) {
    if (resetStep) {
      this.currentStep = 1;
    }
    this.formData = performance || {};

    return `
      <div class="performance-wizard">
        ${this.renderProgress()}
        <div class="wizard-content mt-6">
          ${this.renderStep()}
        </div>
        <div class="wizard-actions mt-6 flex justify-between">
          ${this.renderActions()}
        </div>
      </div>
    `;
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
              ? "bg-indigo-600 text-white"
              : isCompleted
                ? "bg-green-600 text-white"
                : "bg-gray-300 text-gray-600"
            } w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors">
                    ${isCompleted ? '<i class="fas fa-check"></i>' : step.number
            }
                  </div>
                  <div class="mt-2 text-xs font-medium ${isActive
              ? "text-indigo-600"
              : isCompleted
                ? "text-green-600"
                : "text-gray-500"
            }">
                    ${step.label}
                  </div>
                </div>
                ${index < steps.length - 1
              ? `<div class="flex-1 h-0.5 mx-2 ${isCompleted ? "bg-green-600" : "bg-gray-300"
              } transition-colors"></div>`
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
      <div class="bg-white rounded-lg p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4">
          <i class="fas fa-info-circle text-indigo-600 mr-2"></i>
          Basic Performance Information
        </h3>
        <p class="text-sm text-gray-600 mb-6">Let's start with the essentials</p>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Performance Title <span class="text-red-500">*</span>
            </label>
            <input type="text" id="wizardTitle" required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
              placeholder="e.g., Symphony No. 9 in D minor"
              value="${this.formData.title || ""}" />
            <p class="text-xs text-gray-500 mt-1">The main title of the performance</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Composer <span class="text-red-500">*</span>
              </label>
              <input type="text" id="wizardComposer" required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
                placeholder="e.g., Ludwig van Beethoven"
                value="${this.formData.composer || ""}" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Conductor <span class="text-red-500">*</span>
              </label>
              <input type="text" id="wizardConductor" required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
                placeholder="e.g., Herbert von Karajan"
                value="${this.formData.conductor || ""}" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Description <span class="text-red-500">*</span>
            </label>
            <textarea id="wizardDescription" rows="4" required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
              placeholder="Describe the performance, its significance, and what audiences can expect...">${this.formData.description || ""}</textarea>
            <p class="text-xs text-gray-500 mt-1">Provide details about the performance</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <input type="number" id="wizardDuration" min="30" max="300"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
                placeholder="120"
                value="${this.formData.duration || ""}" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Genre
              </label>
              <select id="wizardGenre"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black">
                <option value="">Select genre...</option>
                <option value="symphony" ${this.formData.genre === "symphony" ? "selected" : ""}>Symphony</option>
                <option value="concerto" ${this.formData.genre === "concerto" ? "selected" : ""}>Concerto</option>
                <option value="opera" ${this.formData.genre === "opera" ? "selected" : ""}>Opera</option>
                <option value="chamber" ${this.formData.genre === "chamber" ? "selected" : ""}>Chamber Music</option>
                <option value="choral" ${this.formData.genre === "choral" ? "selected" : ""}>Choral</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderSchedule() {
    return `
      <div class="bg-white rounded-lg p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4">
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
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black">
              <option value="">Select a venue...</option>
            </select>
            <p class="text-xs text-gray-500 mt-1">Where the performance will be held</p>
          </div>

          <div class="border-t pt-6">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h4 class="text-sm font-semibold text-gray-900">Showtimes</h4>
                <p class="text-xs text-gray-500 mt-0.5">Add one or more performance dates</p>
              </div>
              <button type="button" id="wizardAddShowtime"
                class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm">
                <i class="fas fa-plus mr-2"></i>Add Showtime
              </button>
            </div>

            <div id="wizardShowtimesContainer" class="space-y-3">
              ${this.renderShowtimes()}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderShowtimes() {
    const showtimes = this.formData.showtimes || [];

    if (showtimes.length === 0) {
      return `
        <div class="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <i class="fas fa-calendar-plus text-4xl text-gray-400 mb-2"></i>
          <p class="text-sm text-gray-600">No showtimes added yet</p>
          <p class="text-xs text-gray-500">Click "Add Showtime" to create one</p>
        </div>
      `;
    }

    return showtimes
      .map(
        (showtime, index) => `
        <div class="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <i class="fas fa-clock text-indigo-600"></i>
          <div class="flex-1 grid grid-cols-2 gap-3">
            <input type="date" class="showtime-date px-3 py-2 border border-gray-300 rounded text-sm"
              data-index="${index}" value="${showtime.date || ""}" required />
            <input type="time" class="showtime-time px-3 py-2 border border-gray-300 rounded text-sm"
              data-index="${index}" value="${showtime.time || ""}" required />
          </div>
          <button type="button" class="remove-showtime p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
            data-index="${index}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `
      )
      .join("");
  },

  renderPricing() {
    return `
      <div class="bg-white rounded-lg p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4">
          <i class="fas fa-dollar-sign text-indigo-600 mr-2"></i>
          Ticket Pricing
        </h3>
        <p class="text-sm text-gray-600 mb-6">Set up your ticket prices</p>

        <div class="space-y-4">
          <div class="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
            <div class="flex items-start gap-3">
              <i class="fas fa-lightbulb text-indigo-600 mt-0.5"></i>
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
            <input type="number" id="wizardPrice" min="0" step="10" required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black text-lg font-semibold"
              placeholder="380"
              value="${this.formData.basePrice || ""}" />
            <p class="text-xs text-gray-500 mt-1">Base price for standard seating</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                VIP Price (Optional)
              </label>
              <input type="number" id="wizardVipPrice" min="0" step="10"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
                placeholder="680"
                value="${this.formData.vipPrice || ""}" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Premium Price (Optional)
              </label>
              <input type="number" id="wizardPremiumPrice" min="0" step="10"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
                placeholder="480"
                value="${this.formData.premiumPrice || ""}" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Economy Price (Optional)
              </label>
              <input type="number" id="wizardEconomyPrice" min="0" step="10"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-black"
                placeholder="180"
                value="${this.formData.economyPrice || ""}" />
            </div>
          </div>

          <div class="bg-gray-50 rounded-lg p-4 mt-6">
            <h4 class="text-sm font-semibold text-gray-900 mb-3">Price Summary</h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div class="bg-white rounded p-3">
                <p class="text-xs text-gray-600">Standard</p>
                <p class="text-lg font-bold text-gray-900" id="pricePreviewStandard">--</p>
              </div>
              <div class="bg-white rounded p-3">
                <p class="text-xs text-gray-600">Premium</p>
                <p class="text-lg font-bold text-gray-900" id="pricePreviewPremium">--</p>
              </div>
              <div class="bg-white rounded p-3">
                <p class="text-xs text-gray-600">VIP</p>
                <p class="text-lg font-bold text-gray-900" id="pricePreviewVip">--</p>
              </div>
              <div class="bg-white rounded p-3">
                <p class="text-xs text-gray-600">Economy</p>
                <p class="text-lg font-bold text-gray-900" id="pricePreviewEconomy">--</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderReview() {
    return `
      <div class="bg-white rounded-lg p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4">
          <i class="fas fa-check text-green-600 mr-2"></i>
          Review & Confirm
        </h3>
        <p class="text-sm text-gray-600 mb-6">Please review your performance details before submitting</p>

        <div class="space-y-6">
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="text-sm font-semibold text-gray-900 mb-3">Basic Information</h4>
            <dl class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt class="text-gray-600">Title:</dt>
                <dd class="font-medium text-gray-900" id="reviewTitle">--</dd>
              </div>
              <div>
                <dt class="text-gray-600">Composer:</dt>
                <dd class="font-medium text-gray-900" id="reviewComposer">--</dd>
              </div>
              <div>
                <dt class="text-gray-600">Conductor:</dt>
                <dd class="font-medium text-gray-900" id="reviewConductor">--</dd>
              </div>
              <div>
                <dt class="text-gray-600">Duration:</dt>
                <dd class="font-medium text-gray-900" id="reviewDuration">--</dd>
              </div>
            </dl>
          </div>

          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="text-sm font-semibold text-gray-900 mb-3">Schedule</h4>
            <dl class="space-y-2 text-sm">
              <div>
                <dt class="text-gray-600">Venue:</dt>
                <dd class="font-medium text-gray-900" id="reviewVenue">--</dd>
              </div>
              <div>
                <dt class="text-gray-600">Showtimes:</dt>
                <dd id="reviewShowtimes" class="font-medium text-gray-900">--</dd>
              </div>
            </dl>
          </div>

          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="text-sm font-semibold text-gray-900 mb-3">Pricing</h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div class="bg-white rounded p-3 text-center">
                <p class="text-xs text-gray-600">Standard</p>
                <p class="text-lg font-bold text-gray-900" id="reviewPriceStandard">--</p>
              </div>
              <div class="bg-white rounded p-3 text-center">
                <p class="text-xs text-gray-600">Premium</p>
                <p class="text-lg font-bold text-gray-900" id="reviewPricePremium">--</p>
              </div>
              <div class="bg-white rounded p-3 text-center">
                <p class="text-xs text-gray-600">VIP</p>
                <p class="text-lg font-bold text-gray-900" id="reviewPriceVip">--</p>
              </div>
              <div class="bg-white rounded p-3 text-center">
                <p class="text-xs text-gray-600">Economy</p>
                <p class="text-lg font-bold text-gray-900" id="reviewPriceEconomy">--</p>
              </div>
            </div>
          </div>

          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <i class="fas fa-check-circle text-green-600 mt-0.5"></i>
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
      ${!isFirstStep
        ? `<button type="button" id="wizardPrevBtn"
              class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
              <i class="fas fa-arrow-left mr-2"></i>Previous
            </button>`
        : "<div></div>"
      }
      ${!isLastStep
        ? `<button type="button" id="wizardNextBtn"
              class="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
              Next<i class="fas fa-arrow-right ml-2"></i>
            </button>`
        : `<button type="button" id="wizardSubmitBtn"
              class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
              <i class="fas fa-check mr-2"></i>Create Performance
            </button>`
      }
    `;
  },
};
