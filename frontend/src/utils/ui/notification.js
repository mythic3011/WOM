import { Notyf } from "notyf";
import "notyf/notyf.min.css";

const notyf = new Notyf({
  duration: 4000,
  position: { x: "right", y: "top" },
  dismissible: true,
  ripple: true,
  types: [
    {
      type: "success",
      background: "#10b981",
      className: "shadow-lg border-l-4 border-green-600",
      icon: {
        className: "fas fa-check-circle",
        tagName: "i",
        color: "white",
      },
    },
    {
      type: "error",
      background: "#ef4444",
      className: "shadow-lg border-l-4 border-red-600",
      icon: {
        className: "fas fa-times-circle",
        tagName: "i",
        color: "white",
      },
    },
    {
      type: "warning",
      background: "#f59e0b",
      className: "shadow-lg border-l-4 border-amber-600",
      icon: {
        className: "fas fa-exclamation-triangle",
        tagName: "i",
        color: "white",
      },
    },
    {
      type: "info",
      background: "#3b82f6",
      className: "shadow-lg border-l-4 border-blue-600",
      icon: {
        className: "fas fa-info-circle",
        tagName: "i",
        color: "white",
      },
    },
    {
      type: "loading",
      background: "#6366f1",
      className: "shadow-lg border-l-4 border-indigo-600",
      duration: 0,
      icon: {
        className: "fas fa-spinner fa-spin",
        tagName: "i",
        color: "white",
      },
    },
    {
      type: "saved",
      background: "#8b5cf6",
      className: "shadow-lg border-l-4 border-purple-600",
      icon: {
        className: "fas fa-save",
        tagName: "i",
        color: "white",
      },
    },
    {
      type: "deleted",
      background: "#f43f5e",
      className: "shadow-lg border-l-4 border-rose-600",
      icon: {
        className: "fas fa-trash-alt",
        tagName: "i",
        color: "white",
      },
    },
    {
      type: "upload",
      background: "#06b6d4",
      className: "shadow-lg border-l-4 border-cyan-600",
      icon: {
        className: "fas fa-cloud-upload-alt",
        tagName: "i",
        color: "white",
      },
    },
    {
      type: "download",
      background: "#14b8a6",
      className: "shadow-lg border-l-4 border-teal-600",
      icon: {
        className: "fas fa-download",
        tagName: "i",
        color: "white",
      },
    },
  ],
});

export const notify = {
  success(message, duration = 4000) {
    return notyf.open({
      type: "success",
      message,
      duration,
    });
  },

  error(message, duration = 5000) {
    return notyf.open({
      type: "error",
      message,
      duration,
    });
  },

  warning(message, duration = 4500) {
    return notyf.open({
      type: "warning",
      message,
      duration,
    });
  },

  info(message, duration = 4000) {
    return notyf.open({
      type: "info",
      message,
      duration,
    });
  },

  loading(message = "Loading...", duration = 0) {
    return notyf.open({
      type: "loading",
      message,
      duration,
    });
  },

  saved(message = "Changes saved successfully!", duration = 3000) {
    return notyf.open({
      type: "saved",
      message,
      duration,
    });
  },

  deleted(message = "Item deleted successfully!", duration = 3000) {
    return notyf.open({
      type: "deleted",
      message,
      duration,
    });
  },

  upload(message = "Upload complete!", duration = 3000) {
    return notyf.open({
      type: "upload",
      message,
      duration,
    });
  },

  download(message = "Download started!", duration = 3000) {
    return notyf.open({
      type: "download",
      message,
      duration,
    });
  },

  async promise(promise, messages = {}) {
    const loadingNotification = this.loading(
      messages.loading || "Processing..."
    );

    try {
      const result = await promise;
      this.dismiss(loadingNotification);
      this.success(messages.success || "Operation completed successfully!");
      return result;
    } catch (error) {
      this.dismiss(loadingNotification);
      this.error(messages.error || "Operation failed. Please try again.");
      throw error;
    }
  },

  confirm(message, duration = 6000) {
    return notyf.open({
      type: "success",
      message: `<i class="fas fa-check-double mr-2"></i>${message}`,
      duration,
    });
  },

  question(message, duration = 5000) {
    return notyf.open({
      type: "info",
      message: `<i class="fas fa-question-circle mr-2"></i>${message}`,
      duration,
    });
  },

  custom(options) {
    return notyf.open(options);
  },

  dismiss(notification) {
    if (notification) {
      notyf.dismiss(notification);
    }
  },

  dismissAll() {
    notyf.dismissAll();
  },

  queue: {
    notifications: [],

    add(type, message, duration) {
      const notification = notify[type](message, duration);
      this.notifications.push(notification);
      return notification;
    },

    clear() {
      this.notifications.forEach((n) => notify.dismiss(n));
      this.notifications = [];
    },
  },
};
