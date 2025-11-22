
import { getModalSize } from "@config/designSystem.js";

export const StandardModal = {
    create(options) {
        const {
            id,
            title,
            subtitle = null,
            body,
            footer = null,
            size = "md",
            closeButton = true,
            backdrop = true,
            onClose = null,
        } = options;

        const modalSize = getModalSize(size);

        return `
      <div id="${id}" class="fixed inset-0 z-[9999] hidden">
        ${backdrop
                ? `<div class="modal-backdrop fixed inset-0 bg-black bg-opacity-50 transition-opacity" onclick="${onClose ? `${onClose}()` : `StandardModal.close('${id}')`
                }"></div>`
                : ""
            }
        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4">
            <div class="modal-content bg-white rounded-xl shadow-2xl transform transition-all w-full" style="max-width: ${modalSize}">
              <div class="modal-header bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-t-xl">
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <h2 class="text-2xl font-bold">${title}</h2>
                    ${subtitle ? `<p class="text-indigo-100 text-sm mt-1">${subtitle}</p>` : ""}
                  </div>
                  ${closeButton
                ? `<button type="button" class="text-white hover:text-gray-200 transition-colors ml-4" onclick="${onClose ? `${onClose}()` : `StandardModal.close('${id}')`
                }">
                        <i class="fas fa-times text-2xl"></i>
                      </button>`
                : ""
            }
                </div>
              </div>
              <div class="modal-body px-6 py-6 max-h-[70vh] overflow-y-auto">
                ${body}
              </div>
              ${footer
                ? `<div class="modal-footer px-6 py-4 bg-gray-50 rounded-b-xl border-t border-gray-200 flex items-center justify-end gap-3">
                    ${footer}
                  </div>`
                : ""
            }
            </div>
          </div>
        </div>
      </div>
    `;
    },

    open(id) {
        const $modal = $(`#${id}`);
        $modal.removeClass("hidden");
        $modal.find(".modal-backdrop").addClass("opacity-100");
        $modal.find(".modal-content").addClass("scale-100 opacity-100");
        $("body").addClass("overflow-hidden");
    },

    close(id) {
        const $modal = $(`#${id}`);
        $modal.find(".modal-backdrop").removeClass("opacity-100");
        $modal.find(".modal-content").removeClass("scale-100 opacity-100");
        setTimeout(() => {
            $modal.addClass("hidden");
            $("body").removeClass("overflow-hidden");
        }, 300);
    },

    confirm(options) {
        const {
            title = "Confirm Action",
            message,
            confirmText = "Confirm",
            cancelText = "Cancel",
            confirmVariant = "primary",
            onConfirm,
            onCancel = null,
        } = options;

        const id = `confirm-modal-${Date.now()}`;

        const confirmColors = {
            primary: "bg-indigo-600 hover:bg-indigo-700",
            success: "bg-green-600 hover:bg-green-700",
            danger: "bg-red-600 hover:bg-red-700",
            warning: "bg-yellow-600 hover:bg-yellow-700",
        };

        const modal = this.create({
            id,
            title,
            body: `<p class="text-gray-700">${message}</p>`,
            footer: `
        <button type="button" class="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium" onclick="StandardModal.close('${id}'); ${onCancel ? `(${onCancel})()` : ""}">
          ${cancelText}
        </button>
        <button type="button" class="px-6 py-2 ${confirmColors[confirmVariant]} text-white rounded-lg transition-all font-semibold shadow-md hover:shadow-lg" onclick="StandardModal.close('${id}'); (${onConfirm})()">
          ${confirmText}
        </button>
      `,
            size: "sm",
        });

        $("body").append(modal);
        this.open(id);

        setTimeout(() => {
            $(`#${id}`).remove();
        }, 60000);
    },
};

window.StandardModal = StandardModal;

