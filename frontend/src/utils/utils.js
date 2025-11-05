export function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;

  return date.toLocaleDateString();
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

export function formatDateTime(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-HK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
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
