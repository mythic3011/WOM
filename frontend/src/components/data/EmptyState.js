export function createEmptyState({
    icon = "fa-inbox",
    title = "No data available",
    message = "",
    actionText = "",
    actionLink = "",
    actionOnClick = "",
}) {
    return `
    <div class="text-center py-12">
      <i class="fas ${icon} text-6xl text-gray-300 mb-4"></i>
      <h3 class="text-xl font-semibold text-gray-700 mb-2">${title}</h3>
      ${message ? `<p class="text-gray-500 mb-4">${message}</p>` : ""}
      ${actionText
            ? `
        <a 
          ${actionLink ? `href="${actionLink}" data-link` : ""}
          ${actionOnClick ? `onclick="${actionOnClick}"` : ""}
          class="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          ${actionText}
        </a>
      `
            : ""
        }
    </div>
  `;
}
