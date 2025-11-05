export function createStatsCard({
  title,
  value,
  label,
  subtitle,
  icon,
  iconColor = "text-blue-500",
  bgColor = "bg-blue-50",
  borderColor = "border-blue-500",
  trend,
  trendUp = true,
}) {
  return `
    <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 ${borderColor} p-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex-1">
          <p class="text-gray-600 text-sm font-medium">${title}</p>
          <p class="text-3xl font-bold text-gray-900 mt-2">${value}</p>
          ${
            subtitle
              ? `<p class="text-sm text-gray-500 mt-1">${subtitle}</p>`
              : ""
          }
          ${label ? `<p class="text-sm text-gray-500 mt-1">${label}</p>` : ""}
        </div>
        <div class="w-16 h-16 ${bgColor} rounded-full flex items-center justify-center flex-shrink-0">
          <i class="fas ${icon} text-3xl ${iconColor}"></i>
        </div>
      </div>
      ${
        trend
          ? `
        <div class="flex items-center text-sm">
          <i class="fas fa-arrow-${trendUp ? "up" : "down"} mr-1 ${
              trendUp ? "text-green-500" : "text-red-500"
            }"></i>
          <span class="font-semibold ${
            trendUp ? "text-green-600" : "text-red-600"
          }">${trend}</span>
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
    <div class="grid grid-cols-1 md:grid-cols-${
      stats.length > 3 ? "4" : stats.length
    } gap-6">
      ${stats.map((stat) => createStatsCard(stat)).join("")}
    </div>
  `;
}
