import { FormComponents } from "@components/FormComponents.js";
import { storage } from "@services/storageService.js";
import { bookingService } from "@services/bookingService.js";
import { performanceService } from "@services/performanceService.js";
import { formatCurrency } from "@utils/utils.js";
import dayjs from "dayjs";

export default {
  title: "Booking Confirmed | User",
  bookingData: null,
  performanceData: null,

  async render(params) {
    const bookingId = params?.booking || params?.id;

    if (bookingId) {
      try {
        const user = storage.getUser();
        if (user) {
          const bookings = await bookingService.getUserBookings(user.id);
          this.bookingData = bookings.find(
            (b) =>
              String(b.id) === String(bookingId) ||
              String(b.bookingReference) === String(bookingId)
          );

          if (this.bookingData) {
            const performances = await performanceService.getAll();
            this.performanceData = performances.find(
              (p) => String(p.id) === String(this.bookingData.performanceId)
            );
          }
        }
      } catch (error) {
        console.error("Error loading booking:", error);
      }
    }

    return `
      <main class="container mx-auto px-4 py-8">
        <div class="max-w-3xl mx-auto">
          ${this.renderConfirmation()}
        </div>
      </main>
    `;
  },

  async afterRender() {
    this.attachEventListeners();
  },

  renderConfirmation() {
    if (!this.bookingData) {
      return this.renderSimpleConfirmation();
    }

    const bookingRef = this.bookingData.bookingReference || this.bookingData.id;
    const performanceTitle = this.performanceData?.title || "Performance";
    const performanceDate = this.performanceData?.date
      ? dayjs(this.performanceData.date).format("MMMM D, YYYY")
      : "TBD";
    const seatCount = Array.isArray(this.bookingData.seats)
      ? this.bookingData.seats.length
      : 0;

    return `
      <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div class="bg-green-600 text-white px-8 py-12 text-center border-b-4 border-green-700">
          <div class="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg">
            <i class="fas fa-check text-5xl"></i>
          </div>
          <h1 class="text-4xl font-bold mb-2">Booking Confirmed</h1>
          <p class="text-green-100 text-lg">Your seats have been reserved successfully</p>
        </div>

        <div class="px-8 py-8 space-y-6">
          <div class="bg-indigo-50 border-2 border-indigo-300 rounded-xl p-6 shadow-sm">
            <div class="text-center mb-4">
              <p class="text-sm font-semibold text-indigo-700 uppercase tracking-wider mb-2">Booking Reference</p>
              <p class="text-3xl font-bold font-mono text-indigo-900">${bookingRef}</p>
            </div>
            <div class="flex items-center justify-center gap-2 text-sm text-indigo-600">
              <i class="fas fa-info-circle"></i>
              <span>Please save this reference for your records</span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div class="flex items-center gap-3 mb-2">
                <div class="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <i class="fas fa-music text-indigo-600"></i>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Performance</p>
                  <p class="font-semibold text-gray-900">${performanceTitle}</p>
                </div>
              </div>
            </div>

            <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div class="flex items-center gap-3 mb-2">
                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i class="fas fa-calendar text-blue-600"></i>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Date</p>
                  <p class="font-semibold text-gray-900">${performanceDate}</p>
                </div>
              </div>
            </div>

            <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div class="flex items-center gap-3 mb-2">
                <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <i class="fas fa-chair text-purple-600"></i>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Seats</p>
                  <p class="font-semibold text-gray-900">${seatCount} seat${seatCount !== 1 ? "s" : ""
      }</p>
                </div>
              </div>
            </div>

            <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div class="flex items-center gap-3 mb-2">
                <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <i class="fas fa-dollar-sign text-green-600"></i>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Total Amount</p>
                  <p class="font-semibold text-gray-900">${formatCurrency(
        this.bookingData.amount
      )}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <div class="flex items-start gap-3">
              <i class="fas fa-envelope text-blue-600 mt-1"></i>
              <div>
                <p class="font-semibold text-blue-900 mb-1">Confirmation Email Sent</p>
                <p class="text-sm text-blue-700">A confirmation email with your e-ticket has been sent to your registered email address.</p>
              </div>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row gap-3 pt-4">
            ${FormComponents.button({
        id: "viewBookings",
        text: "View My Bookings",
        icon: "fa-ticket-alt",
        color: "indigo",
        size: "lg",
        fullWidth: true,
      })}
            ${FormComponents.button({
        id: "browsePerformances",
        text: "Browse More",
        icon: "fa-music",
        color: "gray",
        size: "lg",
        fullWidth: true,
      })}
          </div>
        </div>
      </div>
    `;
  },

  renderSimpleConfirmation() {
    return `
      <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div class="bg-green-600 text-white px-8 py-16 text-center border-b-4 border-green-700">
          <div class="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg">
            <i class="fas fa-check text-6xl"></i>
          </div>
          <h1 class="text-4xl font-bold mb-3">Booking Confirmed</h1>
          <p class="text-green-100 text-lg">Your booking has been successfully confirmed</p>
        </div>

        <div class="px-8 py-12">
          <div class="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg mb-8">
            <div class="flex items-start gap-3">
              <i class="fas fa-info-circle text-blue-600 mt-1 text-xl"></i>
              <div>
                <p class="font-semibold text-blue-900 mb-2">What happens next?</p>
                <ul class="text-sm text-blue-700 space-y-1">
                  <li>A confirmation email will be sent to your registered email</li>
                  <li>Your e-ticket will be available in your bookings</li>
                  <li>Please arrive 30 minutes before the performance</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row gap-4">
            ${FormComponents.button({
      id: "viewBookings",
      text: "View My Bookings",
      icon: "fa-ticket-alt",
      color: "indigo",
      size: "lg",
      fullWidth: true,
    })}
            ${FormComponents.button({
      id: "browsePerformances",
      text: "Browse Performances",
      icon: "fa-music",
      color: "gray",
      size: "lg",
      fullWidth: true,
    })}
          </div>
        </div>
      </div>
    `;
  },

  attachEventListeners() {
    $("#viewBookings").on("click", () => {
      window.location.href = "/user/bookings";
    });

    $("#browsePerformances").on("click", () => {
      window.location.href = "/performances";
    });
  },
};
