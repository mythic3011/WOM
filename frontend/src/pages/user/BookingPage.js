import { performanceService } from "/src/services/performanceService.js";
import { ticketTypeService } from "/src/services/ticketTypeService.js";
import { bookingAPI, handleApiError } from "/src/services/apiClient.js";
import { ResponseExtractor } from "/src/services/responseExtractor.js";
import { FormComponents } from "/src/components/FormComponents.js";
import { createLoadingState } from "/src/components/LoadingState.js";
import { notify } from "/src/utils/ui/notification.js";
import { SwalColors } from "/src/utils/colors.js";
import { ZonePricing } from "/src/utils/booking/zonePricing.js";
import {
  getTierColors,
  getTierLabel,
  getTierBadge,
} from "/src/config/tierConfig.js";
import { storage } from "/src/services/storageService.js";
import { generateFullId, getDisplayLabel } from "/src/utils/seatIdHelper.js";
import { SeatMap } from "/src/components/SeatMap.js";
import { initSeatMapPanzoom } from "/src/utils/panzoomSeatMap.js";
import Swal from "sweetalert2";
import dayjs from "dayjs";

export default {
  title: "Book Your Seats | WOM",
  performanceData: null,
  selectedSeats: [],
  seatTicketTypes: {},
  bookingStep: 1,
  selectedShowtimeId: null,
  _zoom: { scale: 1, tx: 0, ty: 0 },

  async render(params) {
    return `
      <main class="container mx-auto px-4 py-8">
        <div class="max-w-6xl mx-auto">
          ${FormComponents.pageHeader({
            title: "Book Your Seats",
            subtitle: "Select your seats and complete your booking",
            icon: "fa-ticket-alt",
          })}

          <div class="mb-8">
            <div id="progressStepsContainer" class="flex items-center justify-between">
              ${this.renderProgressSteps()}
            </div>
          </div>

          <div id="bookingContent">
            ${createLoadingState({ message: "Loading booking form..." })}
          </div>
        </div>
      </main>
    `;
  },

  updateZoom(newScale, tx = this._zoom.tx, ty = this._zoom.ty) {
    const clamped = Math.max(0.6, Math.min(3, newScale));
    this._zoom = { scale: clamped, tx, ty };
    this.applyZoomTransform();
  },

  applyZoomTransform() {
    const g = document.querySelector("#seatMap svg #seats-layer");
    if (!g) return;
    const { scale, tx, ty } = this._zoom;
    g.setAttribute("transform", `translate(${tx},${ty}) scale(${scale})`);
  },

  async afterRender(params) {
    this.resetState();

    const performanceId = params?.performance || params?.id || params?.p;
    const showtimeId = params?.showtime;

    if (!performanceId && !showtimeId) {
      this.showError("No performance selected");
      return;
    }

    try {
      if (showtimeId && showtimeId !== "undefined") {
        const performances = await performanceService.getAll();
        this.performanceData = performances.find((p) => {
          if (!p.showtimes || !Array.isArray(p.showtimes)) return false;
          return p.showtimes.some((st) => st && st.id === showtimeId);
        });

        if (this.performanceData) {
          this.selectedShowtimeId = showtimeId;
        }
      } else if (performanceId && performanceId !== "undefined") {
        this.performanceData = await performanceService.getById(performanceId);
      }

      if (!this.performanceData) {
        this.showError("Performance not found");
        return;
      }

      this.renderBookingForm();
    } catch (error) {
      console.error("Error loading performance:", error);
      this.showError("Failed to load performance data");
    }
  },

  resetState() {
    this.performanceData = null;
    this.selectedSeats = [];
    this.seatTicketTypes = {};
    this.bookingStep = 1;
    this.selectedShowtimeId = null;
    this._zoom = { scale: 1, tx: 0, ty: 0 };
  },

  detectCardType(number) {
    const cleaned = number.replace(/\s/g, "");
    const patterns = {
      visa: /^4/,
      mastercard: /^5[1-5]/,
      amex: /^3[47]/,
      discover: /^6(?:011|5)/,
      diners: /^3(?:0[0-5]|[68])/,
      jcb: /^35/,
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(cleaned)) {
        return type;
      }
    }
    return null;
  },

  formatCardNumber(value) {
    const cleaned = value.replace(/\D/g, "");
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(" ");
  },

  validateLuhn(number) {
    const cleaned = number.replace(/\s/g, "");
    if (!/^\d+$/.test(cleaned)) return false;

    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i], 10);
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  },

  validateCardNumber(number) {
    const cleaned = number.replace(/\s/g, "");
    if (cleaned.length < 13) {
      return { valid: false, message: "Card number too short" };
    }
    if (cleaned.length > 19) {
      return { valid: false, message: "Card number too long" };
    }
    if (!this.validateLuhn(cleaned)) {
      return { valid: false, message: "Invalid card number" };
    }
    return { valid: true, message: "" };
  },

  formatExpiryDate(value) {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + " / " + cleaned.slice(2, 4);
    }
    return cleaned;
  },

  validateExpiryDate(value) {
    const cleaned = value.replace(/\s/g, "").replace(/\//g, "");
    if (cleaned.length < 4) {
      return { valid: false, message: "Format: MM / YY" };
    }

    const month = parseInt(cleaned.slice(0, 2), 10);
    const year = parseInt(cleaned.slice(2, 4), 10);

    if (month < 1 || month > 12) {
      return { valid: false, message: "Invalid month" };
    }

    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return { valid: false, message: "Card expired" };
    }

    return { valid: true, message: "" };
  },

  validateCVV(value, cardType) {
    const cleaned = value.replace(/\D/g, "");
    const expectedLength = cardType === "amex" ? 4 : 3;

    if (cleaned.length !== expectedLength) {
      return { valid: false, message: `CVV must be ${expectedLength} digits` };
    }

    return { valid: true, message: "" };
  },

  updateCardBrandIcon(type) {
    const iconMap = {
      visa: { icon: "fa-cc-visa", color: "text-blue-600" },
      mastercard: { icon: "fa-cc-mastercard", color: "text-red-600" },
      amex: { icon: "fa-cc-amex", color: "text-blue-500" },
      discover: { icon: "fa-cc-discover", color: "text-orange-600" },
      diners: { icon: "fa-cc-diners-club", color: "text-blue-700" },
      jcb: { icon: "fa-cc-jcb", color: "text-blue-600" },
    };

    const $cardBrand = $("#cardBrand");
    const $icon = $cardBrand.find("i");

    if (type && iconMap[type]) {
      $icon.attr(
        "class",
        `fab ${iconMap[type].icon} text-3xl block leading-none ${iconMap[type].color}`
      );
      $cardBrand
        .removeClass("hidden")
        .addClass("flex items-center justify-center");
    } else {
      $cardBrand
        .addClass("hidden")
        .removeClass("flex items-center justify-center");
    }
  },

  showFieldError(fieldName, message) {
    $(`#${fieldName}`).addClass(
      "border-red-500 focus:ring-red-500 focus:border-red-500"
    );
    $(`.${fieldName}-error`).find("span").text(message);
    $(`.${fieldName}-error`).removeClass("hidden");
  },

  clearFieldError(fieldName) {
    $(`#${fieldName}`).removeClass(
      "border-red-500 focus:ring-red-500 focus:border-red-500"
    );
    $(`.${fieldName}-error`).addClass("hidden");
  },

  updatePayButtonState() {
    const cardNumber = $("#cardNumber").val();
    const expiryDate = $("#expiryDate").val();
    const cvv = $("#cvv").val();
    const cardholderName = $("#cardholderName").val();

    const cardValid = this.validateCardNumber(cardNumber).valid;
    const expiryValid = this.validateExpiryDate(expiryDate).valid;
    const cardType = this.detectCardType(cardNumber);
    const cvvValid = this.validateCVV(cvv, cardType).valid;
    const nameValid = cardholderName.length >= 3;

    const allValid = cardValid && expiryValid && cvvValid && nameValid;
    $("#confirmPayment").prop("disabled", !allValid);
  },

  renderProgressSteps() {
    const steps = [
      { number: 1, label: "Select Seats", icon: "fa-chair" },
      { number: 2, label: "Choose Ticket", icon: "fa-ticket-alt" },
      { number: 3, label: "Review", icon: "fa-check-circle" },
      { number: 4, label: "Payment", icon: "fa-credit-card" },
    ];

    return `
      <div class="flex items-center justify-center w-full">
        ${steps
          .map((step, index) => {
            const isActive = step.number === this.bookingStep;
            const isCompleted = step.number < this.bookingStep;
            return `
              <div class="flex items-center">
                <div class="flex flex-col items-center">
                  <div class="w-12 h-12 rounded-full flex items-center justify-center ${
                    isCompleted
                      ? "bg-green-500 shadow-lg"
                      : isActive
                      ? "bg-indigo-600 shadow-lg ring-4 ring-indigo-200"
                      : "bg-gray-300"
                  } text-white text-lg font-bold transition-all">
                    ${
                      isCompleted ? '<i class="fas fa-check"></i>' : step.number
                    }
                  </div>
                  <p class="text-xs mt-2 font-medium ${
                    isActive ? "text-indigo-600" : "text-gray-600"
                  }">
                    <i class="fas ${step.icon} mr-1"></i>
                    ${step.label}
                  </p>
                </div>
                ${
                  index < steps.length - 1
                    ? `<div class="w-24 h-1 mx-2 ${
                        isCompleted || (isActive && index === 0)
                          ? "bg-green-500"
                          : "bg-gray-300"
                      } transition-all"></div>`
                    : ""
                }
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  },

  async renderBookingForm() {
    const stepContent = await this.renderStepContent();
    const content = `
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2">
          ${stepContent}
        </div>

        <div class="lg:col-span-1">
          ${this.renderBookingSummary()}
        </div>
      </div>
    `;

    $("#bookingContent").html(content);
    this.attachEventListeners();
  },

  async renderStepContent() {
    switch (this.bookingStep) {
      case 1:
        return await this.renderSeatSelection();
      case 2:
        return this.renderTicketSelection();
      case 3:
        return this.renderReviewBooking();
      case 4:
        return this.renderPayment();
      default:
        return "<p>Invalid step</p>";
    }
  },

  async renderSeatSelection() {
    const venue = this.performanceData.venue;
    const layout = venue?.layout || { sections: [] };
    const bookedSeats = await this.getBookedSeats();
    const seatDetails = bookedSeats.reduce((acc, id) => {
      acc[id] = { status: "reserved" };
      return acc;
    }, {});
    const seatMapHTML = SeatMap.generateFromLayout(
      layout,
      seatDetails,
      this.selectedSeats,
      true
    );
    return `
      <div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">
              <i class="fas fa-chair text-indigo-600 mr-2"></i>
              Select Your Seats
            </h2>
            <p class="text-sm text-gray-600 mt-1">
              <i class="fas fa-building mr-1"></i>${
                venue?.name || this.performanceData.venueName || "Venue"
              }
            </p>
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-600">Selected</p>
            <p class="text-2xl font-bold text-indigo-600">${
              this.selectedSeats.length
            }</p>
          </div>
        </div>

        ${FormComponents.infoBox({
          title: "How to Select Seats",
          message:
            "Click on available seats to select them. Different zones may have different pricing.",
          type: "info",
        })}

        ${this.renderZoneSummary()}

        <div class="mt-6">
          <div class="mb-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">
              <i class="fas fa-info-circle mr-2"></i>Seat Legend
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div class="flex items-center gap-2">
                <div class="w-10 h-10 shrink-0 bg-white border-2 border-gray-300 rounded flex items-center justify-center text-xs font-semibold text-gray-900">
                  A1
                </div>
                <span class="text-sm font-medium text-gray-700">Available</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-10 h-10 shrink-0 bg-indigo-600 border-2 border-indigo-700 rounded flex items-center justify-center text-xs font-semibold text-white">
                  B2
                </div>
                <span class="text-sm font-medium text-gray-700">Selected</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-10 h-10 shrink-0 bg-gray-400 border-2 border-gray-500 rounded flex items-center justify-center text-xs font-semibold text-gray-700">
                  C3
                </div>
                <span class="text-sm font-medium text-gray-700">Booked</span>
              </div>
            </div>
          </div>

          <div class="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
            <div class="text-center mb-6">
              <div class="inline-block px-12 py-3 bg-gray-800 text-white rounded-t-lg shadow">
                <i class="fas fa-music mr-2"></i>
                <span class="font-bold text-lg">STAGE</span>
              </div>
            </div>

            <div id="seatMap" class="space-y-6">${seatMapHTML}</div>
          </div>

          <div class="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="flex items-center gap-2">
                  <i class="fas fa-couch text-indigo-600 text-xl"></i>
                  <div>
                    <p class="text-xs text-gray-600">Selected Seats</p>
                    <p class="text-lg font-bold text-indigo-900">
                      ${
                        this.selectedSeats.length > 0
                          ? this.selectedSeats
                              .map((s) => getDisplayLabel(s))
                              .join(", ")
                          : "None"
                      }
                    </p>
                  </div>
                </div>
              </div>
              ${FormComponents.button({
                id: "continueToTickets",
                text: "Continue",
                icon: "fa-arrow-right",
                color: "indigo",
                size: "lg",
                disabled: this.selectedSeats.length === 0,
              })}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // Legacy HTML layout generator removed in favor of SVG SeatMap.

  async generateSeatMap() {
    const rows = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const seatsPerRow = 12;
    const bookedSeats = await this.getBookedSeats();

    return rows
      .map((row) => {
        const seats = [];
        for (let i = 1; i <= seatsPerRow; i++) {
          const seatId = `${row}${i}`;
          const isBooked = bookedSeats.includes(seatId);
          const isSelected = this.selectedSeats.includes(seatId);

          seats.push(`
            <button
              class="seat-btn w-10 h-10 rounded ${
                isBooked
                  ? "bg-gray-400 border-gray-500 text-gray-700 cursor-not-allowed"
                  : isSelected
                  ? "bg-indigo-600 border-indigo-700 text-white hover:bg-indigo-700"
                  : "bg-white border-gray-300 text-gray-900 hover:bg-gray-100"
              } border-2 transition-colors text-xs font-semibold"
              data-seat="${seatId}"
              ${isBooked ? "disabled" : ""}
            >
              ${seatId}
            </button>
          `);
        }

        return `
          <div class="flex items-center justify-center gap-1">
            <span class="w-8 text-center font-bold text-gray-700">${row}</span>
            ${seats.join("")}
          </div>
        `;
      })
      .join("");
  },

  async getBookedSeats() {
    try {
      const response = await bookingAPI.getAll();
      const bookings = ResponseExtractor.extract(response, "bookings");
      const performanceBookings = bookings.filter(
        (b) =>
          b.performanceId === this.performanceData.id &&
          b.status !== "cancelled"
      );
      return performanceBookings.flatMap((b) =>
        (b.seats || []).map((seat) =>
          typeof seat === "string"
            ? seat
            : seat.fullId || seat.seatId || seat.id || ""
        )
      );
    } catch (error) {
      console.error("Error loading booked seats:", error);
      return [];
    }
  },

  renderTicketSelection() {
    let ticketTypes = [];
    try {
      const result = ticketTypeService.getAll();
      ticketTypes = Array.isArray(result) ? result : [];
    } catch (error) {
      console.error("Error loading ticket types:", error);
      ticketTypes = [];
    }

    if (ticketTypes.length === 0) {
      return `
        <div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 class="text-2xl font-bold text-gray-900 mb-4">
            <i class="fas fa-ticket-alt text-indigo-600 mr-2"></i>
            Assign Ticket Types
          </h2>

          ${FormComponents.infoBox({
            title: "No Ticket Types Available",
            message:
              "Please contact the administrator to configure ticket types.",
            type: "warning",
          })}

          <div class="mt-6 flex gap-3">
            ${FormComponents.button({
              id: "backToSeats",
              text: "Back to Seats",
              icon: "fa-arrow-left",
              color: "gray",
              size: "lg",
            })}
          </div>
        </div>
      `;
    }

    const pricingSections = this.performanceData.pricingSections || [];
    const allAssigned = this.selectedSeats.every(
      (seat) => this.seatTicketTypes[seat]
    );
    const totalPrice = this.selectedSeats.reduce((sum, seat) => {
      const assigned = this.seatTicketTypes[seat];
      return sum + (assigned ? assigned.price : 0);
    }, 0);

    return `
      <div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">
          <i class="fas fa-ticket-alt text-indigo-600 mr-2"></i>
          Assign Ticket Types to Seats
        </h2>

        ${FormComponents.infoBox({
          title: "Assign Tickets",
          message:
            "Select a ticket type for each seat. You can assign different types to different seats.",
          type: "info",
        })}

        <div class="mt-6 space-y-4">
          ${this.selectedSeats
            .map((seat) => {
              const assigned = this.seatTicketTypes[seat];
              return `
              <div class="border-2 ${
                assigned ? "border-green-500 bg-green-50" : "border-gray-200"
              } rounded-lg p-4">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                      ${seat}
                    </div>
                    <div>
                      <p class="font-bold text-gray-900">Seat ${seat}</p>
                      ${(() => {
                        const zone = ZonePricing.getSeatZone(
                          seat,
                          pricingSections
                        );
                        const zoneName = zone
                          ? zone.tier.toUpperCase()
                          : "STANDARD";
                        const zoneColor =
                          zone?.tier === "premium"
                            ? "text-purple-600"
                            : zone?.tier === "economy"
                            ? "text-blue-600"
                            : "text-green-600";
                        return `<p class="text-xs ${zoneColor} font-semibold">${
                          zone?.sectionName || "Unknown"
                        } - ${zoneName}</p>`;
                      })()}
                      <p class="text-sm ${
                        assigned ? "text-green-600" : "text-gray-500"
                      }">
                        ${
                          assigned
                            ? `${
                                assigned.name
                              } - HKD ${assigned.price.toLocaleString()}`
                            : "No ticket assigned"
                        }
                      </p>
                    </div>
                  </div>
                  ${
                    assigned
                      ? `
                    <div class="text-right">
                      <p class="text-2xl font-bold text-green-600">HKD ${assigned.price.toLocaleString()}</p>
                      <button class="change-ticket-btn text-xs text-indigo-600 hover:text-indigo-800 mt-1" data-seat="${seat}">
                        Change
                      </button>
                    </div>
                  `
                      : ""
                  }
                </div>

                ${
                  !assigned
                    ? `
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                    ${ZonePricing.getTicketTypesWithPrices(
                      seat,
                      ticketTypes,
                      pricingSections
                    )
                      .map(
                        (type) => `
                      <button class="assign-ticket-btn text-left p-3 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all"
                              data-seat="${seat}"
                              data-ticket='${JSON.stringify(type)}'>
                        <div class="flex items-center justify-between">
                          <div>
                            <p class="font-semibold text-gray-900 text-sm">${
                              type.name
                            }</p>
                            ${
                              type.description
                                ? `<p class="text-xs text-gray-600 mt-0.5">${type.description}</p>`
                                : ""
                            }
                            ${
                              type.basePrice && type.price < type.basePrice
                                ? `<p class="text-xs text-green-600 font-semibold mt-0.5">Save HKD ${(
                                    type.basePrice - type.price
                                  ).toLocaleString()}</p>`
                                : ""
                            }
                          </div>
                          <div class="text-right">
                            ${
                              type.basePrice && type.price < type.basePrice
                                ? `<p class="text-xs text-gray-400 line-through">HKD ${type.basePrice.toLocaleString()}</p>`
                                : ""
                            }
                            <p class="text-lg font-bold text-indigo-600">HKD ${type.price.toLocaleString()}</p>
                          </div>
                        </div>
                      </button>
                    `
                      )
                      .join("")}
                  </div>
                `
                    : ""
                }
              </div>
            `;
            })
            .join("")}
        </div>

        <div class="mt-6 p-4 bg-indigo-600 text-white rounded-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm opacity-90">Total Amount</p>
              <p class="text-2xl font-bold">HKD ${totalPrice.toLocaleString()}</p>
              <p class="text-xs opacity-75 mt-1">
                ${Object.keys(this.seatTicketTypes).length} of ${
      this.selectedSeats.length
    } seats assigned
              </p>
            </div>
            <i class="fas fa-receipt text-4xl opacity-20"></i>
          </div>
        </div>

        <div class="mt-6 flex gap-3">
          ${FormComponents.button({
            id: "backToSeats",
            text: "Back",
            icon: "fa-arrow-left",
            color: "gray",
            size: "lg",
          })}
          ${FormComponents.button({
            id: "continueToReview",
            text: "Continue to Review",
            icon: "fa-arrow-right",
            color: "indigo",
            size: "lg",
            className: "flex-1",
            disabled: !allAssigned,
          })}
        </div>
      </div>
    `;
  },

  renderReviewBooking() {
    const user = storage.getUser();
    const totalPrice = this.selectedSeats.reduce((sum, seat) => {
      const assigned = this.seatTicketTypes[seat];
      return sum + (assigned ? assigned.price : 0);
    }, 0);

    return `
      <div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">
          <i class="fas fa-check-circle text-indigo-600 mr-2"></i>
          Review Your Booking
        </h2>

        <div class="space-y-6">
          <div class="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <h3 class="font-semibold text-indigo-900 mb-3">Performance Details</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Title:</span>
                <span class="font-medium text-gray-900">${
                  this.performanceData.title
                }</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Date:</span>
                <span class="font-medium text-gray-900">${dayjs(
                  this.performanceData.date
                ).format("MMM D, YYYY")}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Venue:</span>
                <span class="font-medium text-gray-900">${
                  this.performanceData.venue
                }</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Conductor:</span>
                <span class="font-medium text-gray-900">${
                  this.performanceData.conductor
                }</span>
              </div>
            </div>
          </div>

          <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 class="font-semibold text-purple-900 mb-3 flex items-center justify-between">
              <span>Seat & Ticket Breakdown</span>
              <span class="text-sm font-normal text-purple-700">${
                this.selectedSeats.length
              } seat${this.selectedSeats.length > 1 ? "s" : ""}</span>
            </h3>
            <div class="space-y-2">
              ${this.selectedSeats
                .map((seat) => {
                  const ticket = this.seatTicketTypes[seat];
                  return `
                    <div class="flex items-center justify-between p-2 bg-white rounded-lg border border-purple-200">
                      <div class="flex items-center gap-3">
                        <span class="w-8 h-8 flex items-center justify-center bg-indigo-600 text-white rounded-full text-sm font-bold">${seat}</span>
                        <div>
                          <p class="font-medium text-gray-900">${
                            ticket.name
                          }</p>
                          ${
                            ticket.description
                              ? `<p class="text-xs text-gray-500">${ticket.description}</p>`
                              : ""
                          }
                        </div>
                      </div>
                      <span class="text-lg font-bold text-purple-600">$${
                        ticket.price
                      }</span>
                    </div>
                  `;
                })
                .join("")}
            </div>
          </div>

          ${
            user
              ? `
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 class="font-semibold text-gray-900 mb-3">Your Information</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600">Name:</span>
                  <span class="font-medium text-gray-900">${user.name}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Email:</span>
                  <span class="font-medium text-gray-900">${user.email}</span>
                </div>
              </div>
            </div>
          `
              : `
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 class="font-semibold text-yellow-900 mb-2 flex items-center">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                Guest Booking
              </h3>
              <p class="text-sm text-yellow-800 mb-3">
                You're booking as a guest. Please provide your contact information.
              </p>
              <div class="space-y-3">
                ${FormComponents.input({
                  id: "guestName",
                  type: "text",
                  label: "Full Name",
                  placeholder: "John Doe",
                  required: true,
                })}
                ${FormComponents.input({
                  id: "guestEmail",
                  type: "email",
                  label: "Email Address",
                  placeholder: "john@example.com",
                  required: true,
                })}
                ${FormComponents.input({
                  id: "guestPhone",
                  type: "tel",
                  label: "Phone Number",
                  placeholder: "+852 1234 5678",
                  required: true,
                })}
              </div>
            </div>
          `
          }

          <div class="bg-indigo-600 text-white rounded-lg p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-indigo-100 text-sm">Total Amount</p>
                <p class="text-4xl font-bold">$${totalPrice}</p>
                <p class="text-indigo-100 text-xs mt-1">
                  ${this.selectedSeats.length} seat${
      this.selectedSeats.length > 1 ? "s" : ""
    } with individual pricing
                </p>
              </div>
              <i class="fas fa-dollar-sign text-6xl text-white opacity-20"></i>
            </div>
          </div>
        </div>

        <div class="mt-6 flex gap-3">
          ${FormComponents.button({
            id: "backToTickets",
            text: "Back",
            icon: "fa-arrow-left",
            color: "gray",
            size: "lg",
          })}
          ${FormComponents.button({
            id: "continueToPayment",
            text: "Continue to Payment",
            icon: "fa-arrow-right",
            color: "indigo",
            size: "lg",
            className: "flex-1",
          })}
        </div>
      </div>
    `;
  },

  renderPayment() {
    const user = storage.getUser();
    const totalPrice = this.selectedSeats.reduce((sum, seat) => {
      const assigned = this.seatTicketTypes[seat];
      return sum + (assigned ? assigned.price : 0);
    }, 0);

    return `
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="bg-indigo-700 px-8 py-6">
          <div class="flex items-center justify-between text-white">
            <div>
              <p class="text-sm font-medium opacity-90">Total Amount</p>
              <p class="text-4xl font-bold mt-1">$${totalPrice}</p>
              <p class="text-sm opacity-75 mt-1">${
                this.selectedSeats.length
              } seat${this.selectedSeats.length > 1 ? "s" : ""} • ${
      this.performanceData.title
    }</p>
            </div>
            <div class="text-right opacity-75">
              <i class="fas fa-shield-alt text-5xl"></i>
            </div>
          </div>
        </div>

        <div class="p-8">
          <div class="mb-8">
            <label class="block text-sm font-medium text-gray-700 mb-3">Payment Method</label>
            <div class="grid grid-cols-2 gap-3">
              <button class="payment-method group relative border-2 border-gray-200 rounded-lg p-4 text-left hover:border-indigo-500 hover:shadow-md transition-all duration-200" data-method="credit-card">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 shrink-0 rounded-lg bg-gray-100 group-hover:bg-indigo-50 flex items-center justify-center transition-colors">
                      <i class="fas fa-credit-card block text-xl leading-none text-gray-600 group-hover:text-indigo-600 transition-colors"></i>
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-gray-900">Card</p>
                      <p class="text-xs text-gray-500">Visa, Mastercard</p>
                    </div>
                  </div>
                  <div class="payment-check hidden w-6 h-6 items-center justify-center shrink-0">
                    <i class="fas fa-check-circle block text-lg leading-none text-indigo-600"></i>
                  </div>
                </div>
              </button>

              <button class="payment-method group relative border-2 border-gray-200 rounded-lg p-4 text-left hover:border-blue-500 hover:shadow-md transition-all duration-200" data-method="alipay">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 shrink-0 rounded-lg bg-blue-50 flex items-center justify-center">
                      <i class="fab fa-alipay block text-xl leading-none text-blue-600"></i>
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-gray-900">Alipay</p>
                      <p class="text-xs text-gray-500">Mobile</p>
                    </div>
                  </div>
                  <div class="payment-check hidden w-6 h-6 items-center justify-center shrink-0">
                    <i class="fas fa-check-circle block text-lg leading-none text-blue-600"></i>
                  </div>
                </div>
              </button>

              <button class="payment-method group relative border-2 border-gray-200 rounded-lg p-4 text-left hover:border-green-500 hover:shadow-md transition-all duration-200" data-method="wechat">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 shrink-0 rounded-lg bg-green-50 flex items-center justify-center">
                      <i class="fab fa-weixin block text-xl leading-none text-green-600"></i>
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-gray-900">WeChat</p>
                      <p class="text-xs text-gray-500">Mobile</p>
                    </div>
                  </div>
                  <div class="payment-check hidden w-6 h-6 items-center justify-center shrink-0">
                    <i class="fas fa-check-circle block text-lg leading-none text-green-600"></i>
                  </div>
                </div>
              </button>

              <button class="payment-method group relative border-2 border-gray-200 rounded-lg p-4 text-left hover:border-yellow-500 hover:shadow-md transition-all duration-200" data-method="paypal">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 shrink-0 rounded-lg bg-yellow-50 flex items-center justify-center">
                      <i class="fab fa-paypal block text-xl leading-none text-yellow-600"></i>
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-gray-900">PayPal</p>
                      <p class="text-xs text-gray-500">Online</p>
                    </div>
                  </div>
                  <div class="payment-check hidden w-6 h-6 items-center justify-center shrink-0">
                    <i class="fas fa-check-circle block text-lg leading-none text-yellow-600"></i>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div id="cardPaymentForm" class="hidden space-y-5 animate-fade-in">
            <div class="relative">
              <label for="cardNumber" class="block text-sm font-semibold text-gray-800 mb-2">
                Card Number
              </label>
              <div class="relative group">
                <input
                  type="text"
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  maxlength="23"
                  autocomplete="cc-number"
                  class="w-full px-4 py-3.5 pr-20 border-2 border-gray-300 rounded-xl bg-white text-lg font-mono tracking-wide text-gray-900 placeholder:text-gray-400 placeholder:opacity-100 transition-all duration-150 ease-in-out outline-none hover:border-gray-400 focus:border-indigo-600 focus:ring-4 focus:ring-purple-100/50 focus:shadow-sm disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                />
                <div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-end gap-2 h-10">
                  <div id="cardBrand" class="hidden transition-all duration-200">
                    <i class="fab text-3xl block leading-none"></i>
                  </div>
                  <div class="card-valid-icon hidden">
                    <i class="fas fa-check-circle text-green-500 text-xl block leading-none"></i>
                  </div>
                </div>
              </div>
              <p class="cardNumber-error text-xs mt-2 hidden text-red-600 font-medium">
                <i class="fas fa-exclamation-circle mr-1"></i>
                <span></span>
              </p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="relative">
                <label for="expiryDate" class="block text-sm font-semibold text-gray-800 mb-2">
                  Expiry Date
                </label>
                <div class="relative">
                  <input
                    type="text"
                    id="expiryDate"
                    placeholder="MM / YY"
                    maxlength="9"
                    autocomplete="cc-exp"
                    class="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl bg-white text-lg font-mono text-gray-900 placeholder:text-gray-400 placeholder:opacity-100 transition-all duration-150 ease-in-out outline-none hover:border-gray-400 focus:border-indigo-600 focus:ring-4 focus:ring-purple-100/50 focus:shadow-sm disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  />
                  <div class="expiry-valid-icon hidden absolute right-3 top-1/2 -translate-y-1/2">
                    <i class="fas fa-check-circle text-green-500 text-lg"></i>
                  </div>
                </div>
                <p class="expiryDate-error text-xs mt-2 hidden text-red-600 font-medium">
                  <i class="fas fa-exclamation-circle mr-1"></i>
                  <span></span>
                </p>
              </div>

              <div class="relative">
                <label for="cvv" class="block text-sm font-semibold text-gray-800 mb-2">
                  CVV / CVC
                </label>
                <div class="relative">
                  <input
                    type="text"
                    id="cvv"
                    placeholder="123"
                    maxlength="4"
                    autocomplete="cc-csc"
                    class="w-full px-4 py-3.5 pr-16 border-2 border-gray-300 rounded-xl bg-white text-lg font-mono text-gray-900 placeholder:text-gray-400 placeholder:opacity-100 transition-all duration-150 ease-in-out outline-none hover:border-gray-400 focus:border-[#635bff] focus:ring-4 focus:ring-purple-100/50 focus:shadow-sm disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  />
                  <div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-end gap-2 h-10">
                    <div class="cvv-valid-icon hidden items-center justify-center">
                      <i class="fas fa-check-circle text-green-500 text-lg leading-none"></i>
                    </div>
                    <div class="group/tooltip relative flex items-center justify-center">
                      <i class="fas fa-question-circle text-gray-400 hover:text-indigo-600 text-sm cursor-help transition-colors leading-none"></i>
                      <div class="hidden group-hover/tooltip:block absolute right-0 bottom-full mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                        3 or 4 digit security code on the back of your card
                        <div class="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <p class="cvv-error text-xs mt-2 hidden text-red-600 font-medium">
                  <i class="fas fa-exclamation-circle mr-1"></i>
                  <span></span>
                </p>
              </div>
            </div>

            <div class="relative">
              <label for="cardholderName" class="block text-sm font-semibold text-gray-800 mb-2">
                Cardholder Name
              </label>
              <div class="relative">
                <input
                  type="text"
                  id="cardholderName"
                  placeholder="JOHN DOE"
                  autocomplete="cc-name"
                  class="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl bg-white text-lg tracking-wide text-gray-900 placeholder:text-gray-400 placeholder:opacity-100 uppercase transition-all duration-150 ease-in-out outline-none hover:border-gray-400 focus:border-[#635bff] focus:ring-4 focus:ring-purple-100/50 focus:shadow-sm disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                />
                <div class="name-valid-icon hidden absolute right-3 top-1/2 -translate-y-1/2">
                  <i class="fas fa-check-circle text-green-500 text-lg"></i>
                </div>
              </div>
              <p class="cardholderName-error text-xs mt-2 hidden text-red-600 font-medium">
                <i class="fas fa-exclamation-circle mr-1"></i>
                <span></span>
              </p>
            </div>

            <div class="bg-green-50 border-2 border-green-200 rounded-xl p-4 mt-4">
              <div class="flex items-start gap-3">
                <div class="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <i class="fas fa-shield-alt text-green-600 text-lg"></i>
                </div>
                <div>
                  <h4 class="text-sm font-semibold text-green-900 mb-1">Secure Payment</h4>
                  <p class="text-xs text-green-700 leading-relaxed">Your payment information is encrypted and secure. We never store your full card details.</p>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-8 pt-6 border-t border-gray-200">
            <div class="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
              <i class="fas fa-lock text-gray-400"></i>
              <span>Secured by 256-bit SSL encryption</span>
            </div>

            <button
              id="confirmPayment"
              disabled
              class="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center gap-2"
            >
              <i class="fas fa-lock"></i>
              <span>Pay $${totalPrice}</span>
            </button>

            <button
              id="backToReview"
              class="w-full mt-3 bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 rounded-lg transition-all duration-200 border border-gray-300"
            >
              <i class="fas fa-arrow-left mr-2"></i>
              Back to Review
            </button>

            <p class="text-xs text-center text-gray-500 mt-4">
              By confirming your purchase, you agree to our
              <a href="#" class="text-indigo-600 hover:text-indigo-700 underline">Terms of Service</a> and
              <a href="#" class="text-indigo-600 hover:text-indigo-700 underline">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    `;
  },

  renderBookingSummary() {
    const totalPrice = this.selectedSeats.reduce((sum, seat) => {
      const assigned = this.seatTicketTypes[seat];
      return sum + (assigned ? assigned.price : 0);
    }, 0);

    return `
      <div class="bg-white rounded-lg shadow-md border border-gray-200 p-6 sticky top-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4">
          <i class="fas fa-shopping-cart text-indigo-600 mr-2"></i>
          Booking Summary
        </h3>

        <div class="space-y-4">
          <div>
            <p class="text-sm text-gray-600 mb-1">Performance</p>
            <p class="font-semibold text-gray-900">${
              this.performanceData?.title || "N/A"
            }</p>
            <p class="text-xs text-gray-500">${
              this.performanceData
                ? dayjs(this.performanceData.date).format("MMM D, YYYY")
                : "N/A"
            }</p>
          </div>

          <div class="border-t border-gray-200 pt-4">
            <p class="text-sm text-gray-600 mb-2">Selected Seats & Tickets</p>
            ${
              this.selectedSeats.length > 0
                ? `
              <div class="space-y-1.5">
                ${this.selectedSeats
                  .map((seat) => {
                    const ticket = this.seatTicketTypes[seat];
                    const displayLabel = getDisplayLabel(seat);
                    if (ticket) {
                      return `
                        <div class="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                          <div class="flex items-center gap-2">
                            <span class="px-2 py-1 bg-indigo-600 text-white rounded font-medium">${displayLabel}</span>
                            <span class="text-gray-700">${ticket.name}</span>
                          </div>
                          <span class="font-semibold text-gray-900">$${ticket.price}</span>
                        </div>
                      `;
                    }
                    return `
                      <div class="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                        <span class="px-2 py-1 bg-indigo-600 text-white rounded font-medium">${displayLabel}</span>
                        <span class="text-gray-400 italic">Not assigned</span>
                      </div>
                    `;
                  })
                  .join("")}
              </div>
              <p class="text-xs text-gray-500 mt-2">${
                this.selectedSeats.length
              } seat${this.selectedSeats.length > 1 ? "s" : ""}</p>
            `
                : `<p class="text-sm text-gray-400 italic">No seats selected</p>`
            }
          </div>

          <div class="border-t border-gray-200 pt-4">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-gray-600">Subtotal</span>
              <span class="font-semibold text-gray-900">$${totalPrice}</span>
            </div>
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-gray-600">Service Fee</span>
              <span class="font-semibold text-gray-900">$0</span>
            </div>
            <div class="flex justify-between items-center pt-2 border-t border-gray-200">
              <span class="text-base font-bold text-gray-900">Total</span>
              <span class="text-2xl font-bold text-indigo-600">$${totalPrice}</span>
            </div>
          </div>
        </div>

        ${FormComponents.infoBox({
          title: "Secure Booking",
          message: "Your payment information is encrypted and secure",
          type: "info",
        })}
      </div>
    `;
  },

  attachEventListeners() {
    const self = this;

    $(document)
      .off("click", ".seat-btn")
      .on("click", ".seat-btn", function () {
        const seatId = $(this).data("seat");
        self.toggleSeat(seatId);
      });

    $(document)
      .off("click", "g.interactive-seat")
      .on("click", "g.interactive-seat", function (e) {
        const fullId = $(this).data("fullId");
        if (!fullId) return;
        self.toggleSeat(fullId);
      });

    $(document)
      .off("keydown", "g.interactive-seat")
      .on("keydown", "g.interactive-seat", function (e) {
        if (e.key !== "Enter" && e.key !== " ") return;
        const fullId = $(this).data("fullId");
        if (!fullId) return;
        e.preventDefault();
        self.toggleSeat(fullId);
      });

    if (this._pz && this._pz.dispose) {
      try {
        this._pz.dispose();
      } catch (e) {}
    }
    setTimeout(() => {
      this._pz = initSeatMapPanzoom();
    }, 100);

    $(document)
      .off("click", ".zoom-btn")
      .on("click", ".zoom-btn", function () {
        const action = $(this).data("zoom");
        if (!self._pz) return;
        if (action === "in") self._pz.smoothZoom(0, 0, 1.15);
        if (action === "out") self._pz.smoothZoom(0, 0, 0.85);
        if (action === "reset") {
          self._pz.zoomTo(0, 0, 1);
          if (self._pz._center) self._pz._center();
        }
        if (self._pz._clamp) setTimeout(() => self._pz._clamp(), 160);
      });

    $(document)
      .off("wheel.seatzoom")
      .on("wheel.seatzoom", function () {});
    $(document)
      .off("click", "#continueToTickets")
      .on("click", "#continueToTickets", async function () {
        if (self.selectedSeats.length > 0) {
          self.bookingStep = 2;
          await self.renderBookingForm();
          self.updateProgressSteps();
        } else {
          notify.warning("Please select at least one seat");
        }
      });

    $(document)
      .off("click", ".assign-ticket-btn")
      .on("click", ".assign-ticket-btn", async function () {
        const seat = $(this).data("seat");
        const ticketData = $(this).data("ticket");
        self.seatTicketTypes[seat] = ticketData;
        await self.renderBookingForm();
        self.updateProgressSteps();
      });

    $(document)
      .off("click", ".change-ticket-btn")
      .on("click", ".change-ticket-btn", async function () {
        const seat = $(this).data("seat");
        delete self.seatTicketTypes[seat];
        await self.renderBookingForm();
        self.updateProgressSteps();
      });

    $(document)
      .off("click", "#backToSeats")
      .on("click", "#backToSeats", async function () {
        self.bookingStep = 1;
        await self.renderBookingForm();
        self.updateProgressSteps();
      });

    $(document)
      .off("click", "#continueToReview")
      .on("click", "#continueToReview", async function () {
        const allAssigned = self.selectedSeats.every(
          (seat) => self.seatTicketTypes[seat]
        );
        if (allAssigned) {
          self.bookingStep = 3;
          await self.renderBookingForm();
          self.updateProgressSteps();
        } else {
          notify.warning("Please assign ticket types to all seats");
        }
      });

    $(document)
      .off("click", "#backToTickets")
      .on("click", "#backToTickets", async function () {
        self.bookingStep = 2;
        await self.renderBookingForm();
        self.updateProgressSteps();
      });

    $(document)
      .off("click", "#continueToPayment")
      .on("click", "#continueToPayment", async function () {
        self.bookingStep = 4;
        await self.renderBookingForm();
        self.updateProgressSteps();
      });

    $(document)
      .off("click", "#backToReview")
      .on("click", "#backToReview", async function () {
        self.bookingStep = 3;
        await self.renderBookingForm();
        self.updateProgressSteps();
      });

    $(document)
      .off("click", ".payment-method")
      .on("click", ".payment-method", function () {
        $(".payment-method").removeClass(
          "border-indigo-600 bg-indigo-50 border-blue-600 bg-blue-50 border-green-600 bg-green-50 border-yellow-600 bg-yellow-50"
        );
        $(".payment-check").addClass("hidden").removeClass("flex");

        const method = $(this).data("method");
        $(this).find(".payment-check").removeClass("hidden").addClass("flex");

        if (method === "credit-card") {
          $(this).addClass("border-indigo-600 bg-indigo-50");
          $("#cardPaymentForm")
            .removeClass("hidden")
            .addClass("animate-fade-in");
          $("#confirmPayment").prop("disabled", true);
        } else {
          if (method === "alipay") {
            $(this).addClass("border-blue-600 bg-blue-50");
          } else if (method === "wechat") {
            $(this).addClass("border-green-600 bg-green-50");
          } else if (method === "paypal") {
            $(this).addClass("border-yellow-600 bg-yellow-50");
          }
          $("#cardPaymentForm").addClass("hidden");
          $("#confirmPayment").prop("disabled", false);
        }
      });

    $(document)
      .off("input", "#cardNumber")
      .on("input", "#cardNumber", function (e) {
        let value = $(this).val();
        const formatted = self.formatCardNumber(value);
        $(this).val(formatted);

        self.clearFieldError("cardNumber");
        $(".card-valid-icon").addClass("hidden").removeClass("flex");

        const cardType = self.detectCardType(formatted);
        self.updateCardBrandIcon(cardType);

        if (formatted.replace(/\s/g, "").length >= 13) {
          const validation = self.validateCardNumber(formatted);
          if (!validation.valid) {
            self.showFieldError("cardNumber", validation.message);
          } else {
            $(".card-valid-icon").removeClass("hidden").addClass("flex");
          }
        }

        self.updatePayButtonState();
      });

    $(document)
      .off("input", "#expiryDate")
      .on("input", "#expiryDate", function (e) {
        let value = $(this).val();
        const formatted = self.formatExpiryDate(value);
        $(this).val(formatted);

        self.clearFieldError("expiryDate");
        $(".expiry-valid-icon").addClass("hidden").removeClass("flex");

        if (formatted.replace(/\s/g, "").replace(/\//g, "").length === 4) {
          const validation = self.validateExpiryDate(formatted);
          if (!validation.valid) {
            self.showFieldError("expiryDate", validation.message);
          } else {
            $(".expiry-valid-icon").removeClass("hidden").addClass("flex");
          }
        }

        self.updatePayButtonState();
      });

    $(document)
      .off("input", "#cvv")
      .on("input", "#cvv", function (e) {
        let value = $(this).val().replace(/\D/g, "");
        $(this).val(value);

        self.clearFieldError("cvv");
        $(".cvv-valid-icon").addClass("hidden").removeClass("flex");

        const cardType = self.detectCardType($("#cardNumber").val());
        const expectedLength = cardType === "amex" ? 4 : 3;

        if (value.length === expectedLength) {
          const validation = self.validateCVV(value, cardType);
          if (!validation.valid) {
            self.showFieldError("cvv", validation.message);
          } else {
            $(".cvv-valid-icon").removeClass("hidden").addClass("flex");
          }
        }

        self.updatePayButtonState();
      });

    $(document)
      .off("input", "#cardholderName")
      .on("input", "#cardholderName", function (e) {
        let value = $(this).val().toUpperCase();
        $(this).val(value);

        self.clearFieldError("cardholderName");
        $(".name-valid-icon").addClass("hidden");

        if (value.length >= 3) {
          $(".name-valid-icon").removeClass("hidden");
        }

        self.updatePayButtonState();
      });

    $(document)
      .off("click", "#confirmPayment")
      .on("click", "#confirmPayment", function () {
        if (!$("#confirmPayment").prop("disabled")) {
          self.confirmBooking();
        }
      });
  },

  async toggleSeat(seatId) {
    const index = this.selectedSeats.indexOf(seatId);
    if (index > -1) {
      this.selectedSeats.splice(index, 1);
      delete this.seatTicketTypes[seatId];
    } else {
      this.selectedSeats.push(seatId);
    }
    this.selectedSeats.sort();
    await this.renderBookingForm();
    this.updateProgressSteps();
  },

  updateProgressSteps() {
    $("#progressStepsContainer").html(this.renderProgressSteps());
  },

  async confirmBooking() {
    const user = storage.getUser();
    let customerInfo = null;
    if (!user) {
      notify.error("Login required to complete booking");
      return;
    }
    customerInfo = { id: user.id, name: user.name, email: user.email };

    const rawMethod =
      $(
        ".payment-method.border-indigo-600, .payment-method.border-blue-600, .payment-method.border-green-600, .payment-method.border-yellow-600"
      ).data("method") || "credit-card";
    const paymentMethod = rawMethod === "paypal" ? "paypal" : "credit_card";
    const paymentDetails = {};

    if (paymentMethod === "credit-card") {
      paymentDetails.cardNumber = $("#cardNumber")
        .val()
        ?.replace(/\s/g, "")
        .slice(-4);
      paymentDetails.cardholderName = $("#cardholderName").val();
    }

    const totalPrice = this.selectedSeats.reduce((sum, seat) => {
      const assigned = this.seatTicketTypes[seat];
      return sum + (assigned ? assigned.price : 0);
    }, 0);

    const seatBreakdown = this.selectedSeats
      .map((seat) => {
        const ticket = this.seatTicketTypes[seat];
        return `${seat}: ${ticket.name} ($${ticket.price})`;
      })
      .join("<br>");

    Swal.fire({
      title: "Processing Payment",
      html: "Please wait while we process your payment...",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const result = await Swal.fire({
      title: "Confirm Booking",
      html: `
        <div class="text-left space-y-3">
          <p class="text-gray-700">Are you ready to complete this booking?</p>
          <div class="bg-gray-100 p-4 rounded-lg space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Performance:</span>
              <span class="font-semibold text-gray-900">${this.performanceData.title}</span>
            </div>
            <div class="border-t border-gray-300 pt-2 mt-2">
              <p class="text-gray-600 mb-1">Seats & Tickets:</p>
              <div class="text-xs text-gray-700 space-y-1">
                ${seatBreakdown}
              </div>
            </div>
            <div class="flex justify-between border-t border-gray-300 pt-2 mt-2">
              <span class="text-gray-600 font-semibold">Total:</span>
              <span class="font-semibold text-indigo-600 text-lg">$${totalPrice}</span>
            </div>
          </div>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Book Now",
      cancelButtonText: "Cancel",
      confirmButtonColor: SwalColors.primary,
      cancelButtonColor: SwalColors.cancel,
    });

    if (result.isConfirmed) {
      try {
        const booking = {
          performanceId: this.performanceData.id,
          showtimeId: this.selectedShowtimeId,
          seats: this.selectedSeats,
          amount: totalPrice,
          paymentMethod,
          customerInfo,
        };

        const createdBooking = await bookingAPI.create(booking);
        const bookingId = createdBooking.bookingReference || createdBooking.id;

        Swal.fire({
          title: "Booking Confirmed!",
          html: `
          <div class="text-center space-y-4">
            <div class="text-6xl text-green-500 mb-4">
              <i class="fas fa-check-circle"></i>
            </div>
            <p class="text-gray-700">Your booking has been confirmed!</p>
            <div class="bg-gray-100 p-4 rounded-lg">
              <p class="text-sm text-gray-600">Booking ID</p>
              <p class="text-xl font-mono font-bold text-gray-900">${bookingId}</p>
            </div>
            <p class="text-sm text-gray-600">A confirmation email will be sent to ${customerInfo.email}</p>
          </div>
        `,
          icon: "success",
          confirmButtonText: user ? "View My Bookings" : "Go to Homepage",
          confirmButtonColor: SwalColors.success,
        }).then(() => {
          window.location.href = "/user/bookings";
        });
      } catch (error) {
        console.error("Error creating booking:", error);
        handleApiError(error);
        Swal.fire({
          title: "Booking Failed",
          text: "There was an error creating your booking. Please try again.",
          icon: "error",
          confirmButtonColor: SwalColors.danger,
        });
      }
    }
  },

  showError(message) {
    $("#bookingContent").html(`
      <div class="text-center py-20">
        <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Error</h2>
        <p class="text-gray-600 mb-4">${message}</p>
        <a href="/performances" data-link class="text-indigo-600 hover:text-indigo-800">
          <i class="fas fa-arrow-left mr-2"></i>Back to Performances
        </a>
      </div>
    `);
  },

  renderZoneSummary() {
    const sections = this.performanceData.pricingSections || [];
    if (!sections.length) return "";
    const rows = ZonePricing.getZoneSummary(sections)
      .map((zone) => {
        const badge = getTierBadge(zone.tier);
        return `<tr class="border-b border-gray-200 hover:bg-gray-100"><td class="py-2 px-3 font-medium text-gray-900">${
          zone.sectionName
        }</td><td class="py-2 px-3"><span class="px-2 py-1 rounded text-xs font-semibold ${badge}">${
          zone.tierLabel
        }</span></td><td class="py-2 px-3 text-gray-600">${
          zone.rowsDisplay
        }</td><td class="py-2 px-3 text-right font-bold text-gray-900">HKD ${zone.basePrice.toLocaleString()}</td></tr>`;
      })
      .join("");
    return `<div class="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200"><h3 class="text-lg font-semibold text-gray-900 mb-3"><i class="fas fa-tags mr-2"></i>Pricing Zones</h3><div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="border-b border-gray-300"><th class="text-left py-2 px-3 text-gray-700 font-semibold">Section</th><th class="text-left py-2 px-3 text-gray-700 font-semibold">Zone</th><th class="text-left py-2 px-3 text-gray-700 font-semibold">Rows</th><th class="text-right py-2 px-3 text-gray-700 font-semibold">Base Price</th></tr></thead><tbody>${rows}</tbody></table></div><p class="text-xs text-gray-600 mt-3"><i class="fas fa-info-circle mr-1"></i>Final prices vary based on ticket type discounts.</p></div>`;
  },
};
