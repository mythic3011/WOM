export function createCard({
  title,
  body,
  footer = "",
  icon = "",
  className = "",
}) {
  return `
    <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 ${className}">
      ${
        title
          ? `
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-xl font-semibold text-gray-800">${title}</h3>
          ${icon ? `<i class="fas ${icon} text-gray-400"></i>` : ""}
        </div>
      `
          : ""
      }
      <div class="card-body">${body}</div>
      ${
        footer
          ? `<div class="mt-4 pt-4 border-t border-gray-200">${footer}</div>`
          : ""
      }
    </div>
  `;
}

export function createCardGrid(cards, cols = 3) {
  return `
    <div class="grid grid-cols-1 md:grid-cols-${cols} gap-6">
      ${cards.map((card) => createCard(card)).join("")}
    </div>
  `;
}

