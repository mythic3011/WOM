export function createStatsCard({
  title,
  value,
  label,
  subtitle,
  icon,
  color,
  iconColor,
  bgColor,
  borderColor,
  trend,
  trendUp = true,
  variant = "border",
}) {
  const colorSchemes = {
    indigo: {
      gradient: "from-indigo-50 to-indigo-100",
      border: "border-indigo-500",
      title: "text-indigo-600",
      value: "text-indigo-900",
      subtitle: "text-indigo-700",
      icon: "text-indigo-400",
      iconBg: "bg-indigo-50",
    },
    blue: {
      gradient: "from-blue-50 to-blue-100",
      border: "border-blue-500",
      title: "text-blue-600",
      value: "text-blue-900",
      subtitle: "text-blue-700",
      icon: "text-blue-400",
      iconBg: "bg-blue-50",
    },
    green: {
      gradient: "from-green-50 to-green-100",
      border: "border-green-500",
      title: "text-green-600",
      value: "text-green-900",
      subtitle: "text-green-700",
      icon: "text-green-400",
      iconBg: "bg-green-50",
    },
    purple: {
      gradient: "from-purple-50 to-purple-100",
      border: "border-purple-500",
      title: "text-purple-600",
      value: "text-purple-900",
      subtitle: "text-purple-700",
      icon: "text-purple-400",
      iconBg: "bg-purple-50",
    },
    yellow: {
      gradient: "from-yellow-50 to-yellow-100",
      border: "border-yellow-500",
      title: "text-yellow-600",
      value: "text-yellow-900",
      subtitle: "text-yellow-700",
      icon: "text-yellow-400",
      iconBg: "bg-yellow-50",
    },
    red: {
      gradient: "from-red-50 to-red-100",
      border: "border-red-500",
      title: "text-red-600",
      value: "text-red-900",
      subtitle: "text-red-700",
      icon: "text-red-400",
      iconBg: "bg-red-50",
    },
    orange: {
      gradient: "from-orange-50 to-orange-100",
      border: "border-orange-500",
      title: "text-orange-600",
      value: "text-orange-900",
      subtitle: "text-orange-700",
      icon: "text-orange-400",
      iconBg: "bg-orange-50",
    },
    gray: {
      gradient: "from-gray-50 to-gray-100",
      border: "border-gray-500",
      title: "text-gray-600",
      value: "text-gray-900",
      subtitle: "text-gray-700",
      icon: "text-gray-400",
      iconBg: "bg-gray-50",
    },
  };

  const scheme = colorSchemes[color] || colorSchemes.blue;
  const finalIconColor = iconColor || scheme.icon;
  const finalBgColor = bgColor || scheme.iconBg;
  const finalBorderColor = borderColor || scheme.border;

  if (variant === "gradient") {
    return `
      <div class="bg-gradient-to-br ${scheme.gradient} rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 ${finalBorderColor} p-6">
        <div class="flex items-center justify-between mb-2">
          <div class="flex-1">
            <p class="${scheme.title} text-sm font-semibold uppercase tracking-wide">${title}</p>
            <p class="text-3xl font-bold ${scheme.value} mt-2">${value}</p>
            ${subtitle ? `<p class="text-sm ${scheme.subtitle} mt-1 font-medium">${subtitle}</p>` : ""}
            ${label ? `<p class="text-sm ${scheme.subtitle} mt-1">${label}</p>` : ""}
          </div>
          <div class="w-16 h-16 ${finalBgColor} rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
            <i class="fas ${icon} text-3xl ${finalIconColor}"></i>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 ${finalBorderColor} p-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex-1">
          <p class="text-gray-600 text-sm font-medium">${title}</p>
          <p class="text-3xl font-bold text-gray-900 mt-2">${value}</p>
          ${subtitle ? `<p class="text-sm text-gray-500 mt-1">${subtitle}</p>` : ""}
          ${label ? `<p class="text-sm text-gray-500 mt-1">${label}</p>` : ""}
        </div>
        <div class="w-16 h-16 ${finalBgColor} rounded-full flex items-center justify-center flex-shrink-0">
          <i class="fas ${icon} text-3xl ${finalIconColor}"></i>
        </div>
      </div>
      ${
        trend
          ? `
        <div class="flex items-center text-sm">
          <i class="fas fa-arrow-${trendUp ? "up" : "down"} mr-1 ${trendUp ? "text-green-500" : "text-red-500"}"></i>
          <span class="font-semibold ${trendUp ? "text-green-600" : "text-red-600"}">${trend}</span>
          <span class="text-gray-500 ml-2">vs last month</span>
        </div>
      `
          : ""
      }
    </div>
  `;
}

export function renderStatsGrid(stats) {
  return `
    <div class="grid grid-cols-1 md:grid-cols-${stats.length > 3 ? "4" : stats.length} gap-6">
      ${stats.map((stat) => createStatsCard(stat)).join("")}
    </div>
  `;
}
