import { createEmptyState } from "/src/components/EmptyState.js";
import { FormComponents } from "/src/components/FormComponents.js";
import { statsService } from "/src/services/statsService.js";
import { ticketTypeService } from "/src/services/ticketTypeService.js";
import dayjs from "dayjs";
import Swal from "sweetalert2";
import { notify } from "/src/utils/ui/notification.js";

export default {
  title: "Manage Bookings | Admin",
  bookings: [],
  performances: [],
  users: [],
  ticketTypes: [],
  filteredBookings: [],
  currentFilter: "all",

  async render() {
    this.bookings = statsService.getBookings();
    this.performances = statsService.getPerformances();
    this.users = statsService.getUsers();
    this.ticketTypes = ticketTypeService.getAll();
    this.filteredBookings = [...this.bookings];

    return `
      <main class="container mx-auto px-4 py-8 max-w-7xl">
        ${FormComponents.pageHeader({
          title: "Manage Bookings",
          subtitle: "View and manage all customer bookings",
          icon: "fa-clipboard-list",
          actions: [
            FormComponents.button({
              id: "exportBookings",
              text: "Export",
              icon: "fa-download",
              color: "green",
            }),
          ],
        })}

        ${this.renderStats()}

        ${FormComponents.filterBar({
          searchId: "searchBookings",
          searchPlaceholder: "Search by booking ID, user, or performance...",
          filters: [
            {
              id: "statusFilter",
              options: [
                { value: "all", label: "All Status" },
                { value: "confirmed", label: "Confirmed" },
                { value: "pending", label: "Pending" },
                { value: "cancelled", label: "Cancelled" },
              ],
            },
          ],
          clearButtonId: "clearFilters",
        })}

        <div id="bookingsTable"></div>
      </main>
    `;
  },

  renderStats() {
    const total = this.bookings.length;
    const confirmed = this.bookings.filter(
      (b) => b.status === "confirmed"
    ).length;
    const pending = this.bookings.filter((b) => b.status === "pending").length;
    const cancelled = this.bookings.filter(
      (b) => b.status === "cancelled"
    ).length;
    const revenue = this.bookings
      .filter((b) => b.status === "confirmed")
      .reduce((sum, b) => sum + b.amount, 0);

    const stats = [
      {
        title: "Total",
        value: total,
        icon: "fa-clipboard-list",
        color: "indigo",
      },
      {
        title: "Confirmed",
        value: confirmed,
        icon: "fa-check-circle",
        color: "green",
      },
      { title: "Pending", value: pending, icon: "fa-clock", color: "yellow" },
      {
        title: "Cancelled",
        value: cancelled,
        icon: "fa-times-circle",
        color: "red",
      },
      {
        title: "Revenue",
        value: statsService.formatCurrency(revenue),
        icon: "fa-dollar-sign",
        color: "purple",
      },
    ];

    return `
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        ${stats.map((stat) => FormComponents.statCard(stat)).join("")}
      </div>
    `;
  },

  async afterRender() {
    this.renderBookingsTable();
    this.attachEventListeners();
  },

  attachEventListeners() {
    $("#searchBookings").on("input", (e) => {
      this.filterBookings();
    });

    $("#statusFilter").on("change", (e) => {
      this.currentFilter = e.target.value;
      this.filterBookings();
    });

    $("#clearFilters").on("click", () => {
      $("#searchBookings").val("");
      $("#statusFilter").val("all");
      this.currentFilter = "all";
      this.filteredBookings = [...this.bookings];
      this.renderBookingsTable();
    });

    $("#exportBookings").on("click", () => {
      this.exportBookings();
    });

    $(document).on("click", ".view-booking-btn", (e) => {
      const bookingId = $(e.currentTarget).data("id");
      this.viewBooking(bookingId);
    });

    $(document).on("click", ".cancel-booking-btn", (e) => {
      const bookingId = $(e.currentTarget).data("id");
      this.cancelBooking(bookingId);
    });

    $(document).on("click", ".confirm-booking-btn", (e) => {
      const bookingId = $(e.currentTarget).data("id");
      this.confirmBooking(bookingId);
    });

    $(document).on("click", ".edit-booking-btn", (e) => {
      const bookingId = $(e.currentTarget).data("id");
      this.editBooking(bookingId);
    });

    $(document).on("click", ".refund-booking-btn", (e) => {
      const bookingId = $(e.currentTarget).data("id");
      this.refundBooking(bookingId);
    });

    $(document).on("click", ".email-booking-btn", (e) => {
      const bookingId = $(e.currentTarget).data("id");
      this.emailBooking(bookingId);
    });
  },

  filterBookings() {
    const searchTerm = $("#searchBookings").val().toLowerCase();
    const status = this.currentFilter;

    this.filteredBookings = this.bookings.filter((booking) => {
      const performance = this.performances.find(
        (p) => p.id === booking.performanceId
      );
      const user = this.users.find((u) => u.id === booking.userId);

      const matchesSearch =
        booking.id.toLowerCase().includes(searchTerm) ||
        performance?.title.toLowerCase().includes(searchTerm) ||
        user?.name.toLowerCase().includes(searchTerm);

      const matchesStatus = status === "all" || booking.status === status;

      return matchesSearch && matchesStatus;
    });

    this.renderBookingsTable();
  },

  renderBookingsTable() {
    if (this.filteredBookings.length === 0) {
      $("#bookingsTable").html(
        createEmptyState({
          icon: "fa-clipboard-list",
          title: "No bookings found",
          message: "Try adjusting your filters",
        })
      );
      return;
    }

    const columns = [
      {
        label: "Booking ID",
        key: "id",
        nowrap: true,
        render: (booking) =>
          `<span class="font-mono text-sm font-semibold text-gray-900">${booking.id}</span>`,
      },
      {
        label: "Performance",
        key: "performance",
        render: (booking) => {
          const performance = this.performances.find(
            (p) => p.id === booking.performanceId
          );
          return `
            <div class="text-sm font-medium text-gray-900">${
              performance?.title || "Unknown"
            }</div>
            <div class="text-xs text-gray-500">${performance?.venue || ""}</div>
          `;
        },
      },
      {
        label: "Customer",
        key: "customer",
        render: (booking) => {
          const user = this.users.find((u) => u.id === booking.userId);
          return `
            <div class="text-sm font-medium text-gray-900">${
              user?.name || "Unknown"
            }</div>
            <div class="text-xs text-gray-500">${user?.email || ""}</div>
          `;
        },
      },
      {
        label: "Seats",
        key: "seats",
        nowrap: true,
        render: (booking) => `
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            <i class="fas fa-chair mr-1"></i>
            ${booking.seats.length} seat${booking.seats.length > 1 ? "s" : ""}
          </span>
          <div class="text-xs text-gray-500 mt-1">${booking.seats.join(
            ", "
          )}</div>
        `,
      },
      {
        label: "Amount",
        key: "amount",
        nowrap: true,
        render: (booking) => `
          <span class="text-sm font-bold text-gray-900">${statsService.formatCurrency(
            booking.amount
          )}</span>
          <div class="text-xs text-gray-500">${booking.ticketType}</div>
        `,
      },
      {
        label: "Date",
        key: "date",
        nowrap: true,
        render: (booking) => `
          <span class="text-sm text-gray-900">${dayjs(booking.date).format(
            "MMM D, YYYY"
          )}</span>
          <div class="text-xs text-gray-500">${dayjs(booking.date).format(
            "h:mm A"
          )}</div>
        `,
      },
      {
        label: "Status",
        key: "status",
        nowrap: true,
        render: (booking) => this.renderStatusBadge(booking),
      },
      {
        label: "Actions",
        key: "actions",
        nowrap: true,
        cellClassName: "text-sm",
        render: (booking) => this.renderBookingActions(booking),
      },
    ];

    const tableHTML = `
      ${FormComponents.dataTable({
        columns,
        data: this.filteredBookings,
      })}
      <div class="mt-4 flex justify-between items-center text-sm text-gray-600 px-2">
        <p>Showing <span class="font-semibold">${
          this.filteredBookings.length
        }</span> of <span class="font-semibold">${
      this.bookings.length
    }</span> bookings</p>
      </div>
    `;

    $("#bookingsTable").html(tableHTML);
  },

  renderStatusBadge(booking) {
    const statusColors = {
      confirmed: "green",
      pending: "yellow",
      cancelled: "red",
    };

    const statusIcons = {
      confirmed: "fa-check-circle",
      pending: "fa-clock",
      cancelled: "fa-times-circle",
    };

    const statusLabels = {
      confirmed: "Confirmed",
      pending: "Pending",
      cancelled: "Cancelled",
    };

    return FormComponents.badge({
      text: statusLabels[booking.status],
      icon: statusIcons[booking.status],
      color: statusColors[booking.status],
    });
  },

  renderBookingActions(booking) {
    const actions = [];

    actions.push(
      FormComponents.actionButton({
        icon: "fa-eye",
        tooltip: "View Details",
        color: "indigo",
        dataAttributes: { id: booking.id },
      }).replace("<button", '<button class="view-booking-btn"')
    );

    if (booking.status === "pending") {
      actions.push(
        FormComponents.actionButton({
          icon: "fa-check",
          tooltip: "Confirm Booking",
          color: "green",
          dataAttributes: { id: booking.id },
        }).replace("<button", '<button class="confirm-booking-btn"')
      );
    }

    if (booking.status !== "cancelled") {
      actions.push(
        FormComponents.actionButton({
          icon: "fa-edit",
          tooltip: "Edit Booking",
          color: "blue",
          dataAttributes: { id: booking.id },
        }).replace("<button", '<button class="edit-booking-btn"')
      );

      actions.push(
        FormComponents.actionButton({
          icon: "fa-envelope",
          tooltip: "Send Email",
          color: "purple",
          dataAttributes: { id: booking.id },
        }).replace("<button", '<button class="email-booking-btn"')
      );
    }

    if (booking.status === "confirmed") {
      actions.push(
        FormComponents.actionButton({
          icon: "fa-undo",
          tooltip: "Refund",
          color: "orange",
          dataAttributes: { id: booking.id },
        }).replace("<button", '<button class="refund-booking-btn"')
      );
    }

    if (booking.status !== "cancelled") {
      actions.push(
        FormComponents.actionButton({
          icon: "fa-ban",
          tooltip: "Cancel Booking",
          color: "red",
          dataAttributes: { id: booking.id },
        }).replace("<button", '<button class="cancel-booking-btn"')
      );
    }

    return `<div class="flex gap-1.5">${actions.join("")}</div>`;
  },

  viewBooking(bookingId) {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const performance = this.performances.find(
      (p) => p.id === booking.performanceId
    );
    const user = this.users.find((u) => u.id === booking.userId);

    Swal.fire({
      title: `<i class="fas fa-ticket-alt text-indigo-600"></i> Booking Details`,
      html: `
        <div class="text-left space-y-4">
          <div class="bg-gray-50 rounded-lg p-4">
            <h3 class="font-semibold text-gray-900 mb-2">Booking Information</h3>
            <div class="space-y-2 text-sm">
              <p><span class="font-medium">Booking ID:</span> <span class="font-mono">${
                booking.id
              }</span></p>
              <p><span class="font-medium">Date:</span> ${dayjs(
                booking.date
              ).format("MMMM D, YYYY h:mm A")}</p>
              <p><span class="font-medium">Status:</span> <span class="px-2 py-1 rounded ${
                booking.status === "confirmed"
                  ? "bg-green-100 text-green-800"
                  : booking.status === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }">${booking.status}</span></p>
            </div>
          </div>
          <div class="bg-blue-50 rounded-lg p-4">
            <h3 class="font-semibold text-gray-900 mb-2">Performance</h3>
            <div class="space-y-2 text-sm">
              <p class="font-medium text-indigo-900">${
                performance?.title || "Unknown"
              }</p>
              <p><span class="font-medium">Venue:</span> ${
                performance?.venue || "N/A"
              }</p>
              <p><span class="font-medium">Date:</span> ${dayjs(
                performance?.date
              ).format("MMMM D, YYYY")}</p>
            </div>
          </div>
          <div class="bg-purple-50 rounded-lg p-4">
            <h3 class="font-semibold text-gray-900 mb-2">Customer</h3>
            <div class="space-y-2 text-sm">
              <p><span class="font-medium">Name:</span> ${
                user?.name || "Unknown"
              }</p>
              <p><span class="font-medium">Email:</span> ${
                user?.email || "N/A"
              }</p>
            </div>
          </div>
          <div class="bg-green-50 rounded-lg p-4">
            <h3 class="font-semibold text-gray-900 mb-2">Seats & Payment</h3>
            <div class="space-y-2 text-sm">
              <p><span class="font-medium">Seats:</span> ${booking.seats.join(
                ", "
              )}</p>
              <p><span class="font-medium">Ticket Type:</span> ${
                booking.ticketType
              }</p>
              <p><span class="font-medium">Amount:</span> <span class="text-lg font-bold text-green-700">${statsService.formatCurrency(
                booking.amount
              )}</span></p>
            </div>
          </div>
        </div>
      `,
      width: "600px",
      confirmButtonText: "Close",
    });
  },

  async cancelBooking(bookingId) {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const result = await Swal.fire({
      title: "Cancel Booking?",
      html: `Are you sure you want to cancel booking <strong>${bookingId}</strong>?<br><br><span class="text-sm text-gray-600">This action cannot be undone.</span>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, Cancel Booking",
      cancelButtonText: "No, Keep It",
    });

    if (result.isConfirmed) {
      booking.status = "cancelled";
      this.filterBookings();
      notify.success("Booking cancelled successfully");
    }
  },

  async confirmBooking(bookingId) {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const result = await Swal.fire({
      title: "Confirm Booking?",
      html: `Confirm booking <strong>${bookingId}</strong>?<br><br><span class="text-sm text-gray-600">This will change the status to confirmed.</span>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      confirmButtonText: "Yes, Confirm",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      booking.status = "confirmed";
      this.filterBookings();
      notify.success("Booking confirmed successfully");
    }
  },

  async editBooking(bookingId) {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const ticketTypes = ticketTypeService.getAll() || [];

    const performance = this.performances.find(
      (p) => p.id === booking.performanceId
    );
    const user = this.users.find((u) => u.id === booking.userId);

    const { value: formValues } = await Swal.fire({
      title: '<i class="fas fa-edit text-blue-600"></i> Edit Booking',
      html: `
        <div class="text-left space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Booking ID</label>
            <input id="edit-booking-id" type="text" value="${
              booking.id
            }" disabled class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Performance</label>
            <select id="edit-performance" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              ${this.performances
                .map(
                  (p) => `
                <option value="${p.id}" ${
                    p.id === booking.performanceId ? "selected" : ""
                  }>
                  ${p.title}
                </option>
              `
                )
                .join("")}
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Customer</label>
            <select id="edit-customer" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              ${this.users
                .map(
                  (u) => `
                <option value="${u.id}" ${
                    u.id === booking.userId ? "selected" : ""
                  }>
                  ${u.name} (${u.email})
                </option>
              `
                )
                .join("")}
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Selected Seats</label>
            <div class="flex gap-2">
              <input id="edit-seats" type="text" value="${booking.seats.join(
                ", "
              )}" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="A1, A2, A3" readonly>
              <button id="select-seats-btn" type="button" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 transition-colors">
                <i class="fas fa-chair mr-2"></i>Select Seats
              </button>
            </div>
            <p class="text-xs text-gray-500 mt-1">Click "Select Seats" to choose from available seats</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Amount (HKD)</label>
            <input id="edit-amount" type="number" value="${
              booking.amount
            }" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" min="0" step="1">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Ticket Type</label>
            <select id="edit-ticket-type" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              ${
                ticketTypes.length > 0
                  ? ticketTypes
                      .map(
                        (type) => `
                    <option value="${type.name}" ${
                          type.name === booking.ticketType ? "selected" : ""
                        }>
                      ${type.name}${type.isCustom ? " (Custom)" : ""}
                    </option>
                  `
                      )
                      .join("")
                  : `<option value="${booking.ticketType}" selected>${booking.ticketType}</option>`
              }
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select id="edit-status" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="pending" ${
                booking.status === "pending" ? "selected" : ""
              }>Pending</option>
              <option value="confirmed" ${
                booking.status === "confirmed" ? "selected" : ""
              }>Confirmed</option>
              <option value="cancelled" ${
                booking.status === "cancelled" ? "selected" : ""
              }>Cancelled</option>
            </select>
          </div>
        </div>
      `,
      width: "600px",
      showCancelButton: true,
      confirmButtonText: "Save Changes",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#3b82f6",
      didOpen: () => {
        const selectSeatsBtn = document.getElementById("select-seats-btn");
        const seatsInput = document.getElementById("edit-seats");

        selectSeatsBtn.addEventListener("click", async () => {
          const currentSeats = seatsInput.value
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s);
          const selectedPerformance = this.performances.find(
            (p) => p.id === document.getElementById("edit-performance").value
          );

          const result = await this.showSeatSelectionModal(
            currentSeats,
            selectedPerformance
          );
          if (result) {
            seatsInput.value = result.join(", ");
          }
        });
      },
      preConfirm: () => {
        const performanceId = document.getElementById("edit-performance").value;
        const userId = document.getElementById("edit-customer").value;
        const seats = document
          .getElementById("edit-seats")
          .value.split(",")
          .map((s) => s.trim())
          .filter((s) => s);
        const amount = parseFloat(document.getElementById("edit-amount").value);
        const ticketType = document.getElementById("edit-ticket-type").value;
        const status = document.getElementById("edit-status").value;

        if (!seats.length) {
          Swal.showValidationMessage("Please enter at least one seat");
          return false;
        }

        if (isNaN(amount) || amount < 0) {
          Swal.showValidationMessage("Please enter a valid amount");
          return false;
        }

        return { performanceId, userId, seats, amount, ticketType, status };
      },
    });

    if (formValues) {
      booking.performanceId = formValues.performanceId;
      booking.userId = formValues.userId;
      booking.seats = formValues.seats;
      booking.amount = formValues.amount;
      booking.ticketType = formValues.ticketType;
      booking.status = formValues.status;

      this.filterBookings();
      notify.success("Booking updated successfully");
    }
  },

  async refundBooking(bookingId) {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const { value: refundData } = await Swal.fire({
      title: '<i class="fas fa-undo text-orange-600"></i> Process Refund',
      html: `
        <div class="text-left space-y-4">
          <div class="bg-gray-50 rounded-lg p-4 mb-4">
            <p class="text-sm"><span class="font-medium">Booking ID:</span> ${
              booking.id
            }</p>
            <p class="text-sm"><span class="font-medium">Original Amount:</span> ${statsService.formatCurrency(
              booking.amount
            )}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Refund Type</label>
            <select id="refund-type" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
              <option value="full">Full Refund (${statsService.formatCurrency(
                booking.amount
              )})</option>
              <option value="partial">Partial Refund</option>
            </select>
          </div>

          <div id="partial-refund-container" style="display: none;">
            <label class="block text-sm font-medium text-gray-700 mb-1">Refund Amount (HKD)</label>
            <input id="refund-amount" type="number" max="${
              booking.amount
            }" min="1" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="Enter amount">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Refund Reason</label>
            <textarea id="refund-reason" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="Enter reason for refund"></textarea>
          </div>
        </div>
      `,
      width: "600px",
      showCancelButton: true,
      confirmButtonText: "Process Refund",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#f97316",
      didOpen: () => {
        const typeSelect = document.getElementById("refund-type");
        const partialContainer = document.getElementById(
          "partial-refund-container"
        );

        typeSelect.addEventListener("change", () => {
          if (typeSelect.value === "partial") {
            partialContainer.style.display = "block";
          } else {
            partialContainer.style.display = "none";
          }
        });
      },
      preConfirm: () => {
        const type = document.getElementById("refund-type").value;
        const reason = document.getElementById("refund-reason").value;
        let amount = booking.amount;

        if (type === "partial") {
          const partialAmount = parseFloat(
            document.getElementById("refund-amount").value
          );
          if (
            isNaN(partialAmount) ||
            partialAmount <= 0 ||
            partialAmount > booking.amount
          ) {
            Swal.showValidationMessage(
              `Please enter a valid amount between 1 and ${booking.amount}`
            );
            return false;
          }
          amount = partialAmount;
        }

        if (!reason.trim()) {
          Swal.showValidationMessage("Please provide a reason for the refund");
          return false;
        }

        return { type, amount, reason };
      },
    });

    if (refundData) {
      await Swal.fire({
        title: "Refund Processed",
        html: `
          <div class="text-left space-y-3">
            <div class="bg-green-50 rounded-lg p-4">
              <p class="text-sm text-green-800 mb-2"><i class="fas fa-check-circle mr-2"></i>Refund successfully processed</p>
              <hr class="my-2 border-green-200">
              <p class="text-sm"><span class="font-medium">Amount:</span> ${statsService.formatCurrency(
                refundData.amount
              )}</p>
              <p class="text-sm"><span class="font-medium">Type:</span> ${
                refundData.type === "full" ? "Full Refund" : "Partial Refund"
              }</p>
              <p class="text-sm"><span class="font-medium">Reason:</span> ${
                refundData.reason
              }</p>
            </div>
          </div>
        `,
        icon: "success",
        confirmButtonText: "Close",
      });

      if (refundData.type === "full") {
        booking.status = "cancelled";
      }
      booking.refunded = true;
      booking.refundAmount = refundData.amount;
      booking.refundReason = refundData.reason;

      this.filterBookings();
      notify.success(
        `Refund of ${statsService.formatCurrency(
          refundData.amount
        )} processed successfully`
      );
    }
  },

  async showSeatSelectionModal(currentSeats = [], performance) {
    const rows = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const seatsPerRow = 15;
    let selectedSeats = [...currentSeats];

    const bookedSeats = this.bookings
      .filter(
        (b) => b.performanceId === performance?.id && b.status !== "cancelled"
      )
      .flatMap((b) => b.seats);

    const generateSeatGrid = () => {
      return rows
        .map(
          (row) => `
        <div class="mb-3">
          <div class="flex items-center gap-2 mb-2">
            <span class="font-semibold text-gray-700 w-6">${row}</span>
            <div class="flex flex-wrap gap-2">
              ${Array.from({ length: seatsPerRow }, (_, i) => i + 1)
                .map((num) => {
                  const seatId = `${row}${num}`;
                  const isSelected = selectedSeats.includes(seatId);
                  const isBooked =
                    bookedSeats.includes(seatId) &&
                    !currentSeats.includes(seatId);

                  let classes =
                    "seat-btn w-10 h-10 rounded-lg font-medium text-xs transition-all duration-200 ";
                  if (isBooked) {
                    classes += "bg-gray-300 text-gray-500 cursor-not-allowed";
                  } else if (isSelected) {
                    classes +=
                      "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md";
                  } else {
                    classes +=
                      "bg-white border-2 border-gray-300 text-gray-700 hover:border-indigo-400 hover:bg-indigo-50";
                  }

                  return `
                    <button
                      type="button"
                      class="${classes}"
                      data-seat="${seatId}"
                      ${isBooked ? "disabled" : ""}
                    >
                      ${num}
                    </button>
                  `;
                })
                .join("")}
            </div>
          </div>
        </div>
      `
        )
        .join("");
    };

    const result = await Swal.fire({
      title: '<i class="fas fa-chair text-indigo-600"></i> Select Seats',
      html: `
        <div class="text-left">
          <div class="bg-gray-50 rounded-lg p-4 mb-4">
            <p class="text-sm mb-2"><span class="font-medium">Performance:</span> ${
              performance?.title || "Unknown"
            }</p>
            <p class="text-sm"><span class="font-medium">Venue:</span> ${
              performance?.venue || "N/A"
            }</p>
          </div>

          <div class="flex items-center gap-4 mb-4 text-xs">
            <div class="flex items-center gap-1">
              <div class="w-6 h-6 bg-white border-2 border-gray-300 rounded"></div>
              <span>Available</span>
            </div>
            <div class="flex items-center gap-1">
              <div class="w-6 h-6 bg-indigo-600 rounded"></div>
              <span>Selected</span>
            </div>
            <div class="flex items-center gap-1">
              <div class="w-6 h-6 bg-gray-300 rounded"></div>
              <span>Booked</span>
            </div>
          </div>

          <div class="mb-4 p-3 bg-indigo-50 rounded-lg">
            <p class="text-sm font-medium text-indigo-900">
              Selected Seats (<span id="selected-count">${
                selectedSeats.length
              }</span>):
              <span id="selected-seats-display" class="font-normal">${
                selectedSeats.join(", ") || "None"
              }</span>
            </p>
          </div>

          <div class="bg-white border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
            <div class="mb-4 text-center">
              <div class="inline-block bg-gray-800 text-white px-8 py-2 rounded-lg font-semibold">
                <i class="fas fa-tv mr-2"></i>STAGE
              </div>
            </div>
            <div id="seat-grid">
              ${generateSeatGrid()}
            </div>
          </div>

          <div class="mt-4 flex gap-2">
            <button id="clear-selection-btn" type="button" class="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <i class="fas fa-times mr-2"></i>Clear Selection
            </button>
            <button id="select-row-btn" type="button" class="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
              <i class="fas fa-chair mr-2"></i>Select Row
            </button>
          </div>
        </div>
      `,
      width: "900px",
      showCancelButton: true,
      confirmButtonText: `Confirm Selection (${selectedSeats.length})`,
      cancelButtonText: "Cancel",
      confirmButtonColor: "#4f46e5",
      didOpen: () => {
        const updateDisplay = () => {
          document.getElementById("selected-count").textContent =
            selectedSeats.length;
          document.getElementById("selected-seats-display").textContent =
            selectedSeats.join(", ") || "None";
          Swal.getConfirmButton().textContent = `Confirm Selection (${selectedSeats.length})`;

          document.querySelectorAll(".seat-btn").forEach((btn) => {
            const seatId = btn.getAttribute("data-seat");
            if (btn.disabled) return;

            if (selectedSeats.includes(seatId)) {
              btn.className =
                "seat-btn w-10 h-10 rounded-lg font-medium text-xs transition-all duration-200 bg-indigo-600 text-white hover:bg-indigo-700 shadow-md";
            } else {
              btn.className =
                "seat-btn w-10 h-10 rounded-lg font-medium text-xs transition-all duration-200 bg-white border-2 border-gray-300 text-gray-700 hover:border-indigo-400 hover:bg-indigo-50";
            }
          });
        };

        document.querySelectorAll(".seat-btn").forEach((btn) => {
          btn.addEventListener("click", () => {
            const seatId = btn.getAttribute("data-seat");
            if (selectedSeats.includes(seatId)) {
              selectedSeats = selectedSeats.filter((s) => s !== seatId);
            } else {
              selectedSeats.push(seatId);
              selectedSeats.sort((a, b) => {
                const rowA = a.match(/[A-Z]/)[0];
                const rowB = b.match(/[A-Z]/)[0];
                const numA = parseInt(a.match(/\d+/)[0]);
                const numB = parseInt(b.match(/\d+/)[0]);
                if (rowA !== rowB) return rowA.localeCompare(rowB);
                return numA - numB;
              });
            }
            updateDisplay();
          });
        });

        document
          .getElementById("clear-selection-btn")
          .addEventListener("click", () => {
            selectedSeats = [];
            updateDisplay();
          });

        document
          .getElementById("select-row-btn")
          .addEventListener("click", async () => {
            const { value: row } = await Swal.fire({
              title: "Select Row",
              input: "select",
              inputOptions: rows.reduce(
                (acc, r) => ({ ...acc, [r]: `Row ${r}` }),
                {}
              ),
              inputPlaceholder: "Choose a row",
              showCancelButton: true,
            });

            if (row) {
              const rowSeats = Array.from(
                { length: seatsPerRow },
                (_, i) => `${row}${i + 1}`
              );
              const availableRowSeats = rowSeats.filter(
                (seat) =>
                  !bookedSeats.includes(seat) || currentSeats.includes(seat)
              );

              availableRowSeats.forEach((seat) => {
                if (!selectedSeats.includes(seat)) {
                  selectedSeats.push(seat);
                }
              });

              selectedSeats.sort((a, b) => {
                const rowA = a.match(/[A-Z]/)[0];
                const rowB = b.match(/[A-Z]/)[0];
                const numA = parseInt(a.match(/\d+/)[0]);
                const numB = parseInt(b.match(/\d+/)[0]);
                if (rowA !== rowB) return rowA.localeCompare(rowB);
                return numA - numB;
              });

              updateDisplay();
            }
          });
      },
    });

    if (result.isConfirmed) {
      return selectedSeats;
    }
    return null;
  },

  async emailBooking(bookingId) {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const performance = this.performances.find(
      (p) => p.id === booking.performanceId
    );
    const user = this.users.find((u) => u.id === booking.userId);

    const { value: emailData } = await Swal.fire({
      title: '<i class="fas fa-envelope text-purple-600"></i> Send Email',
      html: `
        <div class="text-left space-y-4">
          <div class="bg-gray-50 rounded-lg p-4 mb-4">
            <p class="text-sm"><span class="font-medium">To:</span> ${
              user?.email || "Unknown"
            }</p>
            <p class="text-sm"><span class="font-medium">Customer:</span> ${
              user?.name || "Unknown"
            }</p>
            <p class="text-sm"><span class="font-medium">Booking:</span> ${
              booking.id
            }</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email Template</label>
            <select id="email-template" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              <option value="confirmation">Booking Confirmation</option>
              <option value="reminder">Event Reminder</option>
              <option value="update">Booking Update</option>
              <option value="cancellation">Cancellation Notice</option>
              <option value="custom">Custom Message</option>
            </select>
          </div>

          <div id="custom-message-container" style="display: none;">
            <label class="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input id="email-subject" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 mb-2" placeholder="Email subject">

            <label class="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea id="email-message" rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="Enter your message"></textarea>
          </div>

          <div class="bg-blue-50 rounded-lg p-3">
            <p class="text-xs text-blue-800">
              <i class="fas fa-info-circle mr-1"></i>
              The email will include booking details, seat information, and QR code.
            </p>
          </div>
        </div>
      `,
      width: "600px",
      showCancelButton: true,
      confirmButtonText: "Send Email",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#a855f7",
      didOpen: () => {
        const templateSelect = document.getElementById("email-template");
        const customContainer = document.getElementById(
          "custom-message-container"
        );

        templateSelect.addEventListener("change", () => {
          if (templateSelect.value === "custom") {
            customContainer.style.display = "block";
          } else {
            customContainer.style.display = "none";
          }
        });
      },
      preConfirm: () => {
        const template = document.getElementById("email-template").value;
        let subject = "";
        let message = "";

        if (template === "custom") {
          subject = document.getElementById("email-subject").value;
          message = document.getElementById("email-message").value;

          if (!subject.trim() || !message.trim()) {
            Swal.showValidationMessage(
              "Please provide both subject and message"
            );
            return false;
          }
        }

        return { template, subject, message };
      },
    });

    if (emailData) {
      const templateTitles = {
        confirmation: "Booking Confirmation",
        reminder: "Event Reminder",
        update: "Booking Update",
        cancellation: "Cancellation Notice",
        custom: emailData.subject,
      };

      await Swal.fire({
        title: "Email Sent Successfully",
        html: `
          <div class="text-left space-y-3">
            <div class="bg-green-50 rounded-lg p-4">
              <p class="text-sm text-green-800 mb-2"><i class="fas fa-check-circle mr-2"></i>Email sent successfully</p>
              <hr class="my-2 border-green-200">
              <p class="text-sm"><span class="font-medium">To:</span> ${
                user?.email || "Unknown"
              }</p>
              <p class="text-sm"><span class="font-medium">Template:</span> ${
                templateTitles[emailData.template]
              }</p>
              <p class="text-sm"><span class="font-medium">Booking ID:</span> ${
                booking.id
              }</p>
            </div>
          </div>
        `,
        icon: "success",
        confirmButtonText: "Close",
      });

      notify.success("Email sent successfully");
    }
  },

  exportBookings() {
    const csv = this.bookingsToCSV();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bookings-${dayjs().format("YYYY-MM-DD")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    notify.success("Bookings exported successfully");
  },

  bookingsToCSV() {
    const headers = [
      "Booking ID",
      "Performance",
      "Customer",
      "Email",
      "Seats",
      "Amount",
      "Status",
      "Date",
    ];
    const rows = this.filteredBookings.map((booking) => {
      const performance = this.performances.find(
        (p) => p.id === booking.performanceId
      );
      const user = this.users.find((u) => u.id === booking.userId);
      return [
        booking.id,
        performance?.title || "Unknown",
        user?.name || "Unknown",
        user?.email || "",
        booking.seats.join("; "),
        booking.amount,
        booking.status,
        dayjs(booking.date).format("YYYY-MM-DD HH:mm"),
      ];
    });

    return [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
  },
};
