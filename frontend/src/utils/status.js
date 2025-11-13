import { createBadge } from "/src/components/Badge.js";

export const STATUS_CONFIGS = {
  performance: {
    upcoming: {
      variant: "info",
      text: "Upcoming",
      icon: "fa-calendar-alt",
      badgeClass: "bg-blue-100 text-blue-800",
    },
    on_sale: {
      variant: "success",
      text: "On Sale",
      icon: "fa-ticket-alt",
      badgeClass: "bg-green-100 text-green-800",
    },
    pre_order: {
      variant: "primary",
      text: "Pre-Order",
      icon: "fa-star",
      badgeClass: "bg-indigo-100 text-indigo-800",
    },
    early_bird: {
      variant: "warning",
      text: "Early Bird",
      icon: "fa-tag",
      badgeClass: "bg-yellow-100 text-yellow-800",
    },
    sold_out: {
      variant: "danger",
      text: "Sold Out",
      icon: "fa-exclamation-circle",
      badgeClass: "bg-red-100 text-red-800",
    },
  },
  booking: {
    pending: {
      variant: "warning",
      text: "Pending",
      icon: "fa-clock",
      badgeClass: "bg-yellow-100 text-yellow-800",
    },
    confirmed: {
      variant: "success",
      text: "Confirmed",
      icon: "fa-check-circle",
      badgeClass: "bg-green-100 text-green-800",
    },
    cancelled: {
      variant: "danger",
      text: "Cancelled",
      icon: "fa-times-circle",
      badgeClass: "bg-red-100 text-red-800",
    },
    completed: {
      variant: "info",
      text: "Completed",
      icon: "fa-check-double",
      badgeClass: "bg-blue-100 text-blue-800",
    },
  },
  user: {
    active: {
      variant: "success",
      text: "Active",
      icon: "fa-check-circle",
      badgeClass: "bg-green-100 text-green-800",
    },
    inactive: {
      variant: "default",
      text: "Inactive",
      icon: "fa-minus-circle",
      badgeClass: "bg-gray-100 text-gray-800",
    },
    suspended: {
      variant: "danger",
      text: "Suspended",
      icon: "fa-ban",
      badgeClass: "bg-red-100 text-red-800",
    },
  },
  payment: {
    pending: {
      variant: "warning",
      text: "Pending",
      icon: "fa-clock",
      badgeClass: "bg-yellow-100 text-yellow-800",
    },
    paid: {
      variant: "success",
      text: "Paid",
      icon: "fa-check-circle",
      badgeClass: "bg-green-100 text-green-800",
    },
    failed: {
      variant: "danger",
      text: "Failed",
      icon: "fa-times-circle",
      badgeClass: "bg-red-100 text-red-800",
    },
    refunded: {
      variant: "info",
      text: "Refunded",
      icon: "fa-undo",
      badgeClass: "bg-blue-100 text-blue-800",
    },
  },
};

export function getStatusConfig(status, type = "performance") {
  return (
    STATUS_CONFIGS[type]?.[status] || {
      variant: "default",
      text: status,
      icon: "fa-info-circle",
      badgeClass: "bg-gray-100 text-gray-800",
    }
  );
}

export function getStatusIcon(status, type = "performance") {
  const config = getStatusConfig(status, type);
  return config.icon;
}

export function getStatusBadge(status, type = "performance") {
  const config = getStatusConfig(status, type);

  return createBadge({
    text: config.text,
    variant: config.variant,
    size: "sm",
  });
}

export function renderStatusColumn(
  status,
  type = "performance",
  customConfig = null
) {
  if (customConfig) {
    const config = customConfig[status] || { variant: "default", text: status };
    return createBadge({
      text: config.text,
      variant: config.variant,
      size: "sm",
    });
  }

  return getStatusBadge(status, type);
}
