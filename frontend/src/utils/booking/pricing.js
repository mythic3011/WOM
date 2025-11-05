export const TICKET_CATEGORIES = {
  VIP: {
    name: "VIP",
    description: "Premium seating with exclusive benefits",
    priceRange: "HKD 2,500 - 2,800",
  },
  EXPERIENCE_PACKAGE: {
    name: "Experience Package",
    description: "Bundled tickets with additional perks",
    priceRange: "HKD 3,200 - 3,500",
  },
  STANDARD: {
    name: "Standard",
    description: "General admission seats",
    priceRange: "HKD 600 - 800",
  },
  DISCOUNTED: {
    name: "Discounted",
    description: "Available for students, seniors, and disabled persons",
    priceRange: "HKD 300 - 400",
  },
};

export const PERFORMANCE_STATUS = {
  DRAFT: "draft",
  PRE_ORDER: "pre_order",
  EARLY_BIRD: "early_bird",
  ON_SALE: "on_sale",
  SOLD_OUT: "sold_out",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
};

export const STATUS_LABELS = {
  draft: "Coming Soon",
  pre_order: "Pre-Order Available",
  early_bird: "Early Bird Special",
  on_sale: "On Sale Now",
  sold_out: "Sold Out",
  cancelled: "Cancelled",
  completed: "Completed",
};

export const STATUS_COLORS = {
  draft: "bg-gray-500",
  pre_order: "bg-purple-500",
  early_bird: "bg-green-500",
  on_sale: "bg-blue-500",
  sold_out: "bg-red-500",
  cancelled: "bg-gray-700",
  completed: "bg-gray-600",
};

export function calculatePrice(seat, performance, groupSize = 1) {
  let basePrice = seat.price;

  if (
    performance.status === PERFORMANCE_STATUS.EARLY_BIRD &&
    seat.earlyBirdPrice
  ) {
    basePrice = seat.earlyBirdPrice;
  }

  let totalPrice = basePrice * groupSize;

  if (groupSize >= 4 && seat.groupDiscount > 0) {
    const discount = (totalPrice * seat.groupDiscount) / 100;
    totalPrice -= discount;
    return {
      originalPrice: basePrice * groupSize,
      finalPrice: totalPrice,
      discount: discount,
      isGroupDiscount: true,
      discountPercentage: seat.groupDiscount,
    };
  }

  return {
    originalPrice: totalPrice,
    finalPrice: totalPrice,
    discount: 0,
    isGroupDiscount: false,
    discountPercentage: 0,
  };
}

export function getStatusBadge(status) {
  return {
    label: STATUS_LABELS[status] || status,
    color: STATUS_COLORS[status] || "bg-gray-500",
  };
}

export function isPreOrderAvailable(performance) {
  if (!performance.preOrderStartDate) return false;
  const now = new Date();
  const startDate = new Date(performance.preOrderStartDate);
  return (
    performance.status === PERFORMANCE_STATUS.PRE_ORDER && now >= startDate
  );
}

export function isEarlyBirdAvailable(performance) {
  if (!performance.earlyBirdEndDate) return false;
  const now = new Date();
  const endDate = new Date(performance.earlyBirdEndDate);
  return performance.status === PERFORMANCE_STATUS.EARLY_BIRD && now <= endDate;
}

export function getAvailabilityMessage(performance) {
  const now = new Date();

  if (performance.status === PERFORMANCE_STATUS.DRAFT) {
    return "Coming soon. Stay tuned for announcements.";
  }

  if (performance.status === PERFORMANCE_STATUS.PRE_ORDER) {
    const startDate = new Date(performance.preOrderStartDate);
    if (now < startDate) {
      return `Pre-orders begin ${startDate.toLocaleDateString()}`;
    }
    return "Pre-order now and secure your seats early!";
  }

  if (performance.status === PERFORMANCE_STATUS.EARLY_BIRD) {
    const endDate = new Date(performance.earlyBirdEndDate);
    return `Early bird pricing until ${endDate.toLocaleDateString()}`;
  }

  if (performance.status === PERFORMANCE_STATUS.ON_SALE) {
    return `${performance.availableSeats} of ${performance.totalSeats} seats available`;
  }

  if (performance.status === PERFORMANCE_STATUS.SOLD_OUT) {
    return "All seats have been sold.";
  }

  if (performance.status === PERFORMANCE_STATUS.CANCELLED) {
    return "This performance has been cancelled.";
  }

  return "";
}
