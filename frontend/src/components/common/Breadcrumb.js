
export const Breadcrumb = {
    render(items) {
        if (!items || items.length === 0) {
            return "";
        }

        return `
      <nav class="flex items-center space-x-2 text-sm mb-6" aria-label="Breadcrumb">
        <a href="/admin/dashboard" data-link class="text-gray-500 hover:text-gray-700 transition-colors">
          <i class="fas fa-home"></i>
        </a>
        ${items
                .map((item, index) => {
                    const isLast = index === items.length - 1;
                    return `
              <span class="text-gray-400">/</span>
              ${isLast
                            ? `<span class="text-gray-900 font-medium">${item.label}</span>`
                            : `<a href="${item.url}" data-link class="text-gray-500 hover:text-gray-700 transition-colors">${item.label}</a>`
                        }
            `;
                })
                .join("")}
      </nav>
    `;
    },

    renderWithIcon(items) {
        if (!items || items.length === 0) {
            return "";
        }

        return `
      <nav class="flex items-center space-x-2 text-sm mb-6 bg-white px-4 py-3 rounded-lg shadow-sm border border-gray-200" aria-label="Breadcrumb">
        <a href="/admin/dashboard" data-link class="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors">
          <i class="fas fa-home"></i>
          <span>Dashboard</span>
        </a>
        ${items
                .map((item, index) => {
                    const isLast = index === items.length - 1;
                    return `
              <i class="fas fa-chevron-right text-gray-400 text-xs"></i>
              ${isLast
                            ? `<span class="text-indigo-600 font-semibold flex items-center gap-2">
                    ${item.icon ? `<i class="${item.icon}"></i>` : ""}
                    ${item.label}
                  </span>`
                            : `<a href="${item.url}" data-link class="text-gray-600 hover:text-indigo-600 transition-colors flex items-center gap-2">
                    ${item.icon ? `<i class="${item.icon}"></i>` : ""}
                    ${item.label}
                  </a>`
                        }
            `;
                })
                .join("")}
      </nav>
    `;
    },
};

