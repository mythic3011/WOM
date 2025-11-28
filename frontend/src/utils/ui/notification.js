import { Toast } from "@components/Toast.js";

// Extended Toast component with additional notification types
const ExtendedToast = {
  ...Toast,

  // Override getConfig to add more types
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
      loading: {
        bgColor: "bg-indigo-50",
        borderColor: "border-indigo-500",
        textColor: "text-indigo-800",
        icon: "fas fa-spinner fa-spin",
      },
      saved: {
        bgColor: "bg-purple-50",
        borderColor: "border-purple-500",
        textColor: "text-purple-800",
        icon: "fas fa-save",
      },
      deleted: {
        bgColor: "bg-rose-50",
        borderColor: "border-rose-500",
        textColor: "text-rose-800",
        icon: "fas fa-trash-alt",
      },
      upload: {
        bgColor: "bg-cyan-50",
        borderColor: "border-cyan-500",
        textColor: "text-cyan-800",
        icon: "fas fa-cloud-upload-alt",
      },
      download: {
        bgColor: "bg-teal-50",
        borderColor: "border-teal-500",
        textColor: "text-teal-800",
        icon: "fas fa-download",
      },
    };

    return configs[type] || configs.info;
  },
};

export const notify = {
  success(message, duration = 4000) {
    return ExtendedToast.show({
      type: "success",
      message,
      duration,
    });
  },

  error(message, duration = 5000) {
    return ExtendedToast.show({
      type: "error",
      message,
      duration,
    });
  },

  warning(message, duration = 4500) {
    return ExtendedToast.show({
      type: "warning",
      message,
      duration,
    });
  },

  info(message, duration = 4000) {
    return ExtendedToast.show({
      type: "info",
      message,
      duration,
    });
  },

  loading(message = "Loading...", duration = 0) {
    return ExtendedToast.show({
      type: "loading",
      message,
      duration,
    });
  },

  saved(message = "Changes saved successfully!", duration = 3000) {
    return ExtendedToast.show({
      type: "saved",
      message,
      duration,
    });
  },

  deleted(message = "Item deleted successfully!", duration = 3000) {
    return ExtendedToast.show({
      type: "deleted",
      message,
      duration,
    });
  },

  upload(message = "Upload complete!", duration = 3000) {
    return ExtendedToast.show({
      type: "upload",
      message,
      duration,
    });
  },

  download(message = "Download started!", duration = 3000) {
    return ExtendedToast.show({
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
    return ExtendedToast.show({
      type: "success",
      message,
      duration,
    });
  },

  question(message, duration = 5000) {
    return ExtendedToast.show({
      type: "info",
      message,
      duration,
    });
  },

  custom(options) {
    return ExtendedToast.show(options);
  },

  dismiss(notification) {
    if (notification) {
      ExtendedToast.dismiss(notification);
    }
  },

  dismissAll() {
    ExtendedToast.dismissAll();
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
