
export const Notification = {
    show(options) {
        const {
            type = "info",
            title,
            message,
            duration = 5000,
            action = null,
            persistent = false,
        } = options;

        const id = `notification-${Date.now()}`;
        const icons = {
            success: "fa-check-circle",
            error: "fa-exclamation-circle",
            warning: "fa-exclamation-triangle",
            info: "fa-info-circle",
        };

        const colors = {
            success: {
                bg: "bg-green-50",
                border: "border-green-200",
                icon: "text-green-600",
                text: "text-green-900",
            },
            error: {
                bg: "bg-red-50",
                border: "border-red-200",
                icon: "text-red-600",
                text: "text-red-900",
            },
            warning: {
                bg: "bg-yellow-50",
                border: "border-yellow-200",
                icon: "text-yellow-600",
                text: "text-yellow-900",
            },
            info: {
                bg: "bg-blue-50",
                border: "border-blue-200",
                icon: "text-blue-600",
                text: "text-blue-900",
            },
        };

        const color = colors[type];

        const notification = `
      <div id="${id}" class="notification-item ${color.bg} ${color.border} border rounded-lg shadow-lg p-4 mb-3 transform transition-all duration-300 translate-x-full">
        <div class="flex items-start gap-3">
          <i class="fas ${icons[type]} ${color.icon} text-xl mt-0.5"></i>
          <div class="flex-1">
            ${title ? `<div class="font-semibold ${color.text} mb-1">${title}</div>` : ""}
            <div class="text-sm ${color.text}">${message}</div>
            ${action
                ? `<button class="mt-2 text-sm font-medium ${color.icon} hover:underline" onclick="${action.onClick}">
                  ${action.label}
                </button>`
                : ""
            }
          </div>
          ${!persistent
                ? `<button class="text-gray-400 hover:text-gray-600 transition-colors" onclick="EnhancedNotification.close('${id}')">
                <i class="fas fa-times"></i>
              </button>`
                : ""
            }
        </div>
      </div>
    `;

        let container = $("#notification-container");
        if (!container.length) {
            $("body").append('<div id="notification-container" class="fixed top-4 right-4 z-[9999] w-96 max-w-full"></div>');
            container = $("#notification-container");
        }

        container.append(notification);

        setTimeout(() => {
            $(`#${id}`).removeClass("translate-x-full");
        }, 10);

        if (!persistent && duration > 0) {
            setTimeout(() => {
                this.close(id);
            }, duration);
        }

        return id;
    },

    close(id) {
        const $notification = $(`#${id}`);
        $notification.addClass("translate-x-full opacity-0");
        setTimeout(() => {
            $notification.remove();
        }, 300);
    },

    success(message, title = "Success", options = {}) {
        return this.show({ type: "success", title, message, ...options });
    },

    error(message, title = "Error", options = {}) {
        return this.show({ type: "error", title, message, ...options });
    },

    warning(message, title = "Warning", options = {}) {
        return this.show({ type: "warning", title, message, ...options });
    },

    info(message, title = "Info", options = {}) {
        return this.show({ type: "info", title, message, ...options });
    },

    withUndo(message, onUndo, title = "Action Completed") {
        return this.show({
            type: "success",
            title,
            message,
            duration: 8000,
            action: {
                label: "Undo",
                onClick: `(${onUndo.toString()})()`,
            },
        });
    },
};

window.Notification = Notification;

