/**
 * Toast Component - Reusable toast notification system
 * Provides visual feedback for user actions
 */
// p.s Toast use for error msg



export const Toast = {
    /**
     * Initialize toast container in the DOM
     */
    init() {
        if (!document.getElementById("toast-container")) {
            const container = document.createElement("div");
            container.id = "toast-container";
            container.className = "fixed top-4 right-4 flex flex-col gap-2 pointer-events-none";
            container.style.maxWidth = "400px";
            container.style.zIndex = "99999";
            document.body.appendChild(container);
        }
    },

    /**
     * Show a toast notification
     * @param {Object} options - Toast configuration
     * @param {string} options.message - Message to display
     * @param {string} options.type - Type: 'success', 'error', 'warning', 'info'
     * @param {number} options.duration - Duration in ms (0 for persistent)
     * @param {string} options.title - Optional title
     */
    show({ message, type = "info", duration = 4000, title = null }) {
        this.init();

        const toast = this.create({ message, type, title });
        const container = document.getElementById("toast-container");
        container.appendChild(toast);

        // Trigger animation
        setTimeout(() => {
            toast.classList.remove("translate-x-full", "opacity-0");
            toast.classList.add("translate-x-0", "opacity-100");
        }, 10);

        // Auto dismiss
        if (duration > 0) {
            setTimeout(() => {
                this.dismiss(toast);
            }, duration);
        }

        return toast;
    },

    /**
     * Create toast element
     */
    create({ message, type, title }) {
        const config = this.getConfig(type);

        const toast = document.createElement("div");
        toast.className = `
      ${config.bgColor} ${config.borderColor} ${config.textColor}
      border-l-4 rounded-lg shadow-lg p-4 mb-2
      transform transition-all duration-300 ease-out
      translate-x-full opacity-0 pointer-events-auto
      max-w-md w-full
    `.trim().replace(/\s+/g, " ");

        toast.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0 mt-0.5">
          <i class="${config.icon} text-lg"></i>
        </div>
        <div class="flex-1 min-w-0">
          ${title ? `<p class="font-semibold text-sm mb-1">${this.escapeHtml(title)}</p>` : ""}
          <p class="text-sm ${title ? "" : "font-medium"}">${this.escapeHtml(message)}</p>
        </div>
        <button 
          class="flex-shrink-0 text-current opacity-70 hover:opacity-100 transition-opacity focus:outline-none"
          onclick="this.closest('[id^=toast-]').dispatchEvent(new Event('dismiss'))"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

        toast.id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Add dismiss event listener
        toast.addEventListener("dismiss", () => this.dismiss(toast));

        return toast;
    },

    /**
     * Get configuration for toast type
     */
    getConfig(type) {
        const configs = {
            success: {
                bgColor: "bg-green-50",
                borderColor: "border-green-500",
                textColor: "text-green-800",
                icon: "fas fa-check-circle",
            },
            error: {
                bgColor: "bg-red-50",
                borderColor: "border-red-500",
                textColor: "text-red-800",
                icon: "fas fa-times-circle",
            },
            warning: {
                bgColor: "bg-yellow-50",
                borderColor: "border-yellow-500",
                textColor: "text-yellow-800",
                icon: "fas fa-exclamation-triangle",
            },
            info: {
                bgColor: "bg-blue-50",
                borderColor: "border-blue-500",
                textColor: "text-blue-800",
                icon: "fas fa-info-circle",
            },
        };

        return configs[type] || configs.info;
    },

    /**
     * Dismiss a toast
     */
    dismiss(toast) {
        if (!toast || !toast.parentElement) {return;}

        toast.classList.remove("translate-x-0", "opacity-100");
        toast.classList.add("translate-x-full", "opacity-0");

        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
        }, 300);
    },

    /**
     * Dismiss all toasts
     */
    dismissAll() {
        const container = document.getElementById("toast-container");
        if (container) {
            const toasts = container.querySelectorAll("[id^=toast-]");
            toasts.forEach(toast => this.dismiss(toast));
        }
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    },

    // Convenience methods
    success(message, title = null, duration = 4000) {
        return this.show({ message, type: "success", title, duration });
    },

    error(message, title = null, duration = 5000) {
        return this.show({ message, type: "error", title, duration });
    },

    warning(message, title = null, duration = 4500) {
        return this.show({ message, type: "warning", title, duration });
    },

    info(message, title = null, duration = 4000) {
        return this.show({ message, type: "info", title, duration });
    },
};

// Auto-initialize on import
if (typeof window !== "undefined") {
    Toast.init();
}

export default Toast;
