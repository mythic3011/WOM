export const TailwindColors = {
  purple: {
    500: "rgb(168, 85, 247)",
    600: "rgb(147, 51, 234)",
    class: "bg-purple-500",
  },
  blue: {
    500: "rgb(59, 130, 246)",
    600: "rgb(37, 99, 235)",
    class: "bg-blue-500",
  },
  pink: {
    500: "rgb(236, 72, 153)",
    600: "rgb(219, 39, 119)",
    class: "bg-pink-500",
  },
  amber: {
    500: "rgb(245, 158, 11)",
    600: "rgb(217, 119, 6)",
    class: "bg-amber-500",
  },
  green: {
    500: "rgb(16, 185, 129)",
    600: "rgb(5, 150, 105)",
    class: "bg-green-500",
  },
  indigo: {
    500: "rgb(99, 102, 241)",
    600: "rgb(79, 70, 229)",
    class: "bg-indigo-500",
  },
  orange: {
    500: "rgb(249, 115, 22)",
    600: "rgb(234, 88, 12)",
    class: "bg-orange-500",
  },
  teal: {
    500: "rgb(20, 184, 166)",
    600: "rgb(13, 148, 136)",
    class: "bg-teal-500",
  },
  red: {
    500: "rgb(239, 68, 68)",
    600: "rgb(220, 38, 38)",
    class: "bg-red-500",
  },
  yellow: {
    500: "rgb(234, 179, 8)",
    600: "rgb(202, 138, 4)",
    class: "bg-yellow-500",
  },
  gray: {
    500: "rgb(107, 114, 128)",
    600: "rgb(75, 85, 99)",
    700: "rgb(55, 65, 81)",
    800: "rgb(31, 41, 55)",
    class: "bg-gray-500",
  },
};

export const SeatStatusColors = {
  available: {
    rgb: TailwindColors.green[500],
    class: "bg-green-500",
    name: "Available",
  },
  blocked: {
    rgb: TailwindColors.red[500],
    class: "bg-red-500",
    name: "Blocked",
  },
  reserved: {
    rgb: TailwindColors.amber[500],
    class: "bg-amber-500",
    name: "Reserved",
  },
  selected: {
    rgb: TailwindColors.yellow[500],
    class: "bg-yellow-500",
    name: "Selected",
  },
  booked: {
    rgb: TailwindColors.gray[700],
    class: "bg-gray-700",
    name: "Booked",
  },
};

export const SectionColors = [
  TailwindColors.purple[500],
  TailwindColors.blue[500],
  TailwindColors.pink[500],
  TailwindColors.amber[500],
  TailwindColors.green[500],
  TailwindColors.indigo[500],
  TailwindColors.orange[500],
  TailwindColors.teal[500],
];

export const StageColor = TailwindColors.gray[700];

export function getSectionColor(index) {
  return SectionColors[index % SectionColors.length];
}

export function getSeatStatusColor(status) {
  return SeatStatusColors[status]?.rgb || SeatStatusColors.available.rgb;
}

export function getSeatStatusClass(status) {
  return SeatStatusColors[status]?.class || SeatStatusColors.available.class;
}

export const SwalColors = {
  primary: "rgb(79, 70, 229)",
  success: "rgb(16, 185, 129)",
  danger: "rgb(239, 68, 68)",
  dangerDark: "rgb(220, 38, 38)",
  cancel: "rgb(107, 114, 128)",
  info: "rgb(59, 130, 246)",
  warning: "rgb(249, 115, 22)",
  purple: "rgb(168, 85, 247)",
};

export const PerformanceStatusColors = {
  draft: {
    rgb: TailwindColors.gray[500],
    class: "bg-gray-500",
    name: "Coming Soon",
  },
  pre_order: {
    rgb: TailwindColors.purple[500],
    class: "bg-purple-500",
    name: "Pre-Order Available",
  },
  early_bird: {
    rgb: TailwindColors.green[500],
    class: "bg-green-500",
    name: "Early Bird Special",
  },
  on_sale: {
    rgb: TailwindColors.blue[500],
    class: "bg-blue-500",
    name: "On Sale Now",
  },
  sold_out: {
    rgb: TailwindColors.red[500],
    class: "bg-red-500",
    name: "Sold Out",
  },
  cancelled: {
    rgb: TailwindColors.gray[700],
    class: "bg-gray-700",
    name: "Cancelled",
  },
  completed: {
    rgb: TailwindColors.gray[600],
    class: "bg-gray-600",
    name: "Completed",
  },
};

export function getPerformanceStatusColor(status) {
  return (
    PerformanceStatusColors[status]?.rgb || PerformanceStatusColors.draft.rgb
  );
}

export function getPerformanceStatusClass(status) {
  return (
    PerformanceStatusColors[status]?.class ||
    PerformanceStatusColors.draft.class
  );
}

export function getPerformanceStatusLabel(status) {
  return PerformanceStatusColors[status]?.name || status;
}
