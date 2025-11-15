export function createLoadingState({
  message = "Loading...",
  size = "md",
  color = "indigo",
  fullPage = false,
}) {
  const sizes = {
    sm: { spinner: "h-8 w-8", text: "text-sm" },
    md: { spinner: "h-12 w-12", text: "text-base" },
    lg: { spinner: "h-16 w-16", text: "text-lg" },
  };

  const colors = {
    indigo: "border-indigo-600",
    blue: "border-blue-600",
    green: "border-green-600",
    purple: "border-purple-600",
    red: "border-red-600",
    gray: "border-gray-600",
  };

  const sizeClass = sizes[size] || sizes.md;
  const colorClass = colors[color] || colors.indigo;
  const containerClass = fullPage ? "min-h-screen" : "py-20";

  return `
    <div class="text-center ${containerClass} flex flex-col items-center justify-center">
      <div class="inline-block animate-spin rounded-full ${sizeClass.spinner} border-b-2 ${colorClass}"></div>
      <p class="mt-4 text-gray-600 ${sizeClass.text}">${message}</p>
    </div>
  `;
}

export function createInlineLoader({ size = "sm", color = "indigo" }) {
  const sizes = {
    xs: "h-4 w-4",
    sm: "h-6 w-6",
    md: "h-8 w-8",
  };

  const colors = {
    indigo: "border-indigo-600",
    blue: "border-blue-600",
    green: "border-green-600",
    purple: "border-purple-600",
    white: "border-white",
  };

  const sizeClass = sizes[size] || sizes.sm;
  const colorClass = colors[color] || colors.indigo;

  return `<div class="inline-block animate-spin rounded-full ${sizeClass} border-b-2 ${colorClass}"></div>`;
}

export function createSkeletonLoader({ type = "card", count = 1 }) {
  const templates = {
    card: `
      <div class="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div class="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div class="h-8 bg-gray-300 rounded w-1/2 mb-2"></div>
        <div class="h-3 bg-gray-200 rounded w-1/3"></div>
      </div>
    `,
    list: `
      <div class="bg-white rounded-lg shadow-md p-4 animate-pulse">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-gray-300 rounded-full"></div>
          <div class="flex-1">
            <div class="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div class="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    `,
    table: `
      <div class="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
        <div class="h-12 bg-gray-200"></div>
        <div class="p-4 space-y-3">
          <div class="h-4 bg-gray-200 rounded"></div>
          <div class="h-4 bg-gray-200 rounded"></div>
          <div class="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    `,
  };

  const template = templates[type] || templates.card;
  return Array(count).fill(template).join("");
}
