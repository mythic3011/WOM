import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(relativeTime);
dayjs.extend(customParseFormat);

export function formatDate(dateString) {
  return dayjs(dateString).fromNow();
}

export function formatDateTime(dateString) {
  return dayjs(dateString).format("YYYY-MM-DD HH:mm");
}

export function formatDateLong(dateString) {
  return dayjs(dateString).format("MMMM D, YYYY");
}

export function formatDateShort(dateString) {
  return dayjs(dateString).format("MMM D, YYYY");
}

export function formatTime(dateString) {
  return dayjs(dateString).format("HH:mm");
}

export function isToday(dateString) {
  return dayjs(dateString).isSame(dayjs(), "day");
}

export function isPast(dateString) {
  return dayjs(dateString).isBefore(dayjs());
}

export function isFuture(dateString) {
  return dayjs(dateString).isAfter(dayjs());
}

export function addDays(dateString, days) {
  return dayjs(dateString).add(days, "day").format("YYYY-MM-DD");
}

export function formatCurrency(amount, currency = "HKD") {
  return new Intl.NumberFormat("en-HK", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(number) {
  return new Intl.NumberFormat("en-HK").format(number);
}

export function showAlert(
  message,
  type = "error",
  containerId = "alertContainer"
) {
  const alertContainer = $(`#${containerId}`);
  const bgColor = type === "error" ? "bg-red-100" : "bg-green-100";
  const borderColor = type === "error" ? "border-red-500" : "border-green-500";
  const textColor = type === "error" ? "text-red-700" : "text-green-700";
  const icon = type === "error" ? "fa-exclamation-circle" : "fa-check-circle";
  const iconColor = type === "error" ? "text-red-500" : "text-green-500";

  alertContainer.html(`
    <div class="${bgColor} border-l-4 ${borderColor} ${textColor} p-4 mb-6 rounded animate-fade-in flex items-center" role="alert">
      <i class="fas ${icon} mr-3 ${iconColor}"></i>
      <p>${message}</p>
    </div>
  `);
}

export function hideAlert(containerId = "alertContainer") {
  $(`#${containerId}`).empty();
}

export function showToast(message, type = "info", duration = 3000) {
  const bgColors = {
    success: "bg-green-600",
    error: "bg-red-600",
    warning: "bg-yellow-600",
    info: "bg-blue-600",
  };

  const icons = {
    success: "fa-check-circle",
    error: "fa-exclamation-circle",
    warning: "fa-exclamation-triangle",
    info: "fa-info-circle",
  };

  const toast = $(`
    <div class="fixed bottom-4 right-4 ${bgColors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in flex items-center">
      <i class="fas ${icons[type]} mr-2"></i>
      ${message}
    </div>
  `);

  $("body").append(toast);
  setTimeout(() => {
    toast.fadeOut(300, () => toast.remove());
  }, duration);
}
