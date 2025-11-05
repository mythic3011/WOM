import { createBadge } from "/src/components/Badge.js";

export const STATUS_CONFIGS = {
  performance: {
    upcoming: { variant: "default", text: "Upcoming" },
    on_sale: { variant: "success", text: "On Sale" },
    pre_order: { variant: "info", text: "Pre-Order" },
    early_bird: { variant: "primary", text: "Early Bird" },
    sold_out: { variant: "danger", text: "Sold Out" },
  },
  booking: {
    pending: { variant: "warning", text: "Pending" },
    confirmed: { variant: "success", text: "Confirmed" },
    cancelled: { variant: "danger", text: "Cancelled" },
    completed: { variant: "info", text: "Completed" },
  },
  user: {
    active: { variant: "success", text: "Active" },
    inactive: { variant: "default", text: "Inactive" },
    suspended: { variant: "danger", text: "Suspended" },
  },
  payment: {
    pending: { variant: "warning", text: "Pending" },
    paid: { variant: "success", text: "Paid" },
    failed: { variant: "danger", text: "Failed" },
    refunded: { variant: "info", text: "Refunded" },
  },
};

export function getStatusBadge(status, type = "performance") {
  const config = STATUS_CONFIGS[type]?.[status] || {
    variant: "default",
    text: status,
  };

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
