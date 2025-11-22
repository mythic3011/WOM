
export const QuickActionsToolbar = {
    render(actions) {
        if (!actions || actions.length === 0) {
            return "";
        }

        return `
      <div class="fixed bottom-6 right-6 z-50">
        <div class="bg-white rounded-lg shadow-2xl border border-gray-200 p-2 flex flex-col gap-2">
          ${actions
                .map(
                    (action) => `
              <button
                type="button"
                class="quick-action-btn flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-all text-left group"
                data-action="${action.id}"
                title="${action.tooltip || action.label}"
              >
                <div class="w-10 h-10 rounded-lg ${action.bgColor || "bg-indigo-100"
                        } flex items-center justify-center group-hover:scale-110 transition-transform">
                  <i class="${action.icon} ${action.iconColor || "text-indigo-600"
                        }"></i>
                </div>
                <div class="flex-1">
                  <div class="font-semibold text-gray-900 text-sm">${action.label
                        }</div>
                  ${action.description
                            ? `<div class="text-xs text-gray-500">${action.description}</div>`
                            : ""
                        }
                </div>
                ${action.badge
                            ? `<span class="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">${action.badge}</span>`
                            : ""
                        }
              </button>
            `
                )
                .join("")}
        </div>
      </div>
    `;
    },

    renderCompact(actions) {
        if (!actions || actions.length === 0) {
            return "";
        }

        return `
      <div class="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        ${actions
                .map(
                    (action) => `
            <button
              type="button"
              class="quick-action-btn w-14 h-14 rounded-full ${action.bgColor || "bg-indigo-600"
                        } text-white shadow-lg hover:shadow-xl transition-all hover:scale-110 relative group"
              data-action="${action.id}"
              title="${action.tooltip || action.label}"
            >
              <i class="${action.icon} text-xl"></i>
              ${action.badge
                            ? `<span class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">${action.badge}</span>`
                            : ""
                        }
              <span class="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                ${action.label}
              </span>
            </button>
          `
                )
                .join("")}
      </div>
    `;
    },
};

