import dayjs from "dayjs";
import { Avatar } from "@components/common/Avatar.js";
import { phoneUtils } from "@utils/forms/phoneFormat.js";
import { scrollbarUtils } from "@utils/ui/scrollbar.js";

export const UserModals = {
  showViewUserModal(user, bookings, totalSpent, onClose) {
    const modalHTML = `
      <div id="viewUserModal" class="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] flex flex-col">
          <div class="relative flex items-center gap-3 px-6 py-4 border-b border-gray-200">
            <button
              type="button"
              id="closeViewUserModal"
              class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <i class="fas fa-times text-xl"></i>
            </button>
            ${Avatar.render({
              src: user.profileImage || null,
              name: user.name || "User",
              size: "lg",
              editable: false,
            })}
            <div>
              <h3 class="text-lg font-bold text-gray-900">${user.title ? user.title + " " : ""}${user.name}</h3>
              <p class="text-sm text-gray-500">@${user.username} (ID: #${user.userId})</p>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-6">
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-blue-50 p-4 rounded-lg">
                  <p class="text-xs text-blue-600 font-semibold uppercase">Email</p>
                  <p class="text-sm text-gray-900 mt-1">${user.email}</p>
                </div>
                <div class="bg-teal-50 p-4 rounded-lg">
                  <p class="text-xs text-teal-600 font-semibold uppercase">Phone</p>
                  <p class="text-sm text-gray-900 mt-1">${user.phone ? phoneUtils.formatHKPhone(user.phone) : "Not provided"}</p>
                </div>
                <div class="bg-purple-50 p-4 rounded-lg">
                  <p class="text-xs text-purple-600 font-semibold uppercase">Role</p>
                  <p class="text-sm text-gray-900 mt-1 capitalize">${user.role}</p>
                </div>
                <div class="bg-green-50 p-4 rounded-lg">
                  <p class="text-xs text-green-600 font-semibold uppercase">Status</p>
                  <p class="text-sm text-gray-900 mt-1 capitalize">${user.status}</p>
                </div>
                <div class="bg-orange-50 p-4 rounded-lg">
                  <p class="text-xs text-orange-600 font-semibold uppercase">Gender</p>
                  <p class="text-sm text-gray-900 mt-1 capitalize">${user.gender === "prefer_not_to_say" ? "Not specified" : user.gender}</p>
                </div>
                <div class="bg-yellow-50 p-4 rounded-lg">
                  <p class="text-xs text-yellow-600 font-semibold uppercase">Username</p>
                  <p class="text-sm text-gray-900 mt-1 font-mono">@${user.username}</p>
                </div>
              </div>

              <div class="border-t border-gray-200 pt-4">
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p class="text-gray-600">Birthday</p>
                    <p class="font-semibold text-gray-900">${dayjs(user.birthday).format("MMMM D, YYYY")} (${dayjs().diff(dayjs(user.birthday), "year")} years old)</p>
                  </div>
                  <div>
                    <p class="text-gray-600">Member Since</p>
                    <p class="font-semibold text-gray-900">${dayjs(user.createdAt).format("MMMM D, YYYY")} (${dayjs(user.createdAt).fromNow()})</p>
                  </div>
                </div>
              </div>

              <div class="border-t border-gray-200 pt-4">
                <h4 class="font-semibold text-gray-900 mb-3">Booking Statistics</h4>
                <div class="grid grid-cols-3 gap-4">
                  <div class="bg-indigo-50 p-3 rounded-lg text-center">
                    <p class="text-2xl font-bold text-indigo-600">${bookings.length}</p>
                    <p class="text-xs text-gray-600">Total Bookings</p>
                  </div>
                  <div class="bg-green-50 p-3 rounded-lg text-center">
                    <p class="text-2xl font-bold text-green-600">${totalSpent.toFixed(2)}</p>
                    <p class="text-xs text-gray-600">Total Spent</p>
                  </div>
                  <div class="bg-yellow-50 p-3 rounded-lg text-center">
                    <p class="text-2xl font-bold text-yellow-600">${bookings.filter((b) => b.status === "confirmed").length}</p>
                    <p class="text-xs text-gray-600">Confirmed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="border-t border-gray-200 px-6 py-4 flex justify-end bg-gray-50">
            <button
              type="button"
              id="closeViewUserBtn"
              class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    `;

    $("body").append(modalHTML);

    const closeModal = () => {
      $(document).off("keydown.viewUserModal");
      $("#viewUserModal").fadeOut(200, function () {
        $(this).remove();
        if (onClose) {onClose();}
      });
    };

    $("#closeViewUserModal, #closeViewUserBtn, #viewUserModal").on("click", (e) => {
      if (
        e.target.id === "closeViewUserModal" ||
        e.target.id === "closeViewUserBtn" ||
        e.target.id === "viewUserModal" ||
        $(e.target).closest("#closeViewUserModal").length
      ) {
        closeModal();
      }
    });

    $(".bg-white.rounded-lg.shadow-xl").on("click", (e) => {
      e.stopPropagation();
    });

    $(document).on("keydown.viewUserModal", (e) => {
      if (e.key === "Escape") {
        closeModal();
      }
    });

    scrollbarUtils.initModal($("#viewUserModal .overflow-y-auto")[0]);
  },

  showConfirmModal({ title, message, confirmText, cancelText, onConfirm, onCancel, type = "warning" }) {
    const iconColors = {
      warning: "text-yellow-600",
      danger: "text-red-600",
      success: "text-green-600",
      info: "text-blue-600",
    };

    const iconNames = {
      warning: "fa-exclamation-triangle",
      danger: "fa-exclamation-circle",
      success: "fa-check-circle",
      info: "fa-info-circle",
    };

    const buttonColors = {
      warning: "bg-yellow-600 hover:bg-yellow-700",
      danger: "bg-red-600 hover:bg-red-700",
      success: "bg-green-600 hover:bg-green-700",
      info: "bg-blue-600 hover:bg-blue-700",
    };

    const modalHTML = `
      <div id="confirmModal" class="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div class="p-6">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0">
                <div class="h-12 w-12 rounded-full bg-${type}-100 flex items-center justify-center">
                  <i class="fas ${iconNames[type]} text-2xl ${iconColors[type]}"></i>
                </div>
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-bold text-gray-900 mb-2">${title}</h3>
                <div class="text-sm text-gray-600">${message}</div>
              </div>
            </div>
          </div>

          <div class="border-t border-gray-200 px-6 py-4 flex justify-end gap-3 bg-gray-50">
            <button
              type="button"
              id="cancelConfirmBtn"
              class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              ${cancelText || "Cancel"}
            </button>
            <button
              type="button"
              id="confirmBtn"
              class="px-4 py-2 text-white rounded-lg transition-colors ${buttonColors[type]}"
            >
              ${confirmText || "Confirm"}
            </button>
          </div>
        </div>
      </div>
    `;

    $("body").append(modalHTML);

    const closeModal = (confirmed = false) => {
      $(document).off("keydown.confirmModal");
      $("#confirmModal").fadeOut(200, function () {
        $(this).remove();
        if (confirmed && onConfirm) {
          onConfirm();
        } else if (!confirmed && onCancel) {
          onCancel();
        }
      });
    };

    $("#confirmBtn").on("click", () => closeModal(true));
    $("#cancelConfirmBtn, #confirmModal").on("click", (e) => {
      if (e.target.id === "cancelConfirmBtn" || e.target.id === "confirmModal") {
        closeModal(false);
      }
    });

    $(".bg-white.rounded-lg.shadow-xl").on("click", (e) => {
      e.stopPropagation();
    });

    $(document).on("keydown.confirmModal", (e) => {
      if (e.key === "Escape") {
        closeModal(false);
      }
    });
  },
};
