export const TIER_CONFIG = {
  vip: {
    label: "VIP",
    order: 1,
    colors: {
      badge: "bg-yellow-100 text-yellow-800",
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-700",
    },
  },
  premium: {
    label: "Premium",
    order: 2,
    colors: {
      badge: "bg-purple-100 text-purple-800",
      bg: "bg-purple-50",
      border: "border-purple-200",
      text: "text-purple-700",
    },
  },
  standard: {
    label: "Standard",
    order: 3,
    colors: {
      badge: "bg-green-100 text-green-800",
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-700",
    },
  },
  economy: {
    label: "Economy",
    order: 4,
    colors: {
      badge: "bg-blue-100 text-blue-800",
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-700",
    },
  },
};

export const TIER_OPTIONS = ["vip", "premium", "standard", "economy"];

export function getTierColors(tier) {
  const normalizedTier = tier?.toLowerCase();
  return TIER_CONFIG[normalizedTier]?.colors || TIER_CONFIG.standard.colors;
}

export function getTierBadge(tier) {
  const normalizedTier = tier?.toLowerCase();
  return (
    TIER_CONFIG[normalizedTier]?.colors.badge ||
    TIER_CONFIG.standard.colors.badge
  );
}

export function getTierLabel(tier) {
  const normalizedTier = tier?.toLowerCase();
  return TIER_CONFIG[normalizedTier]?.label || "Standard";
}
