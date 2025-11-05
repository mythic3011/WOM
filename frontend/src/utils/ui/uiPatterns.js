export const uiPatterns = {
  createLoadingState(message = "Loading...") {
    return `
      <div class="flex flex-col items-center justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p class="text-gray-600">${message}</p>
      </div>
    `;
  },

  createEmptyState(options = {}) {
    const {
      icon = "fa-inbox",
      title = "No data available",
      message = "",
      actionText = "",
      actionHandler = "",
      actionIcon = "fa-plus",
    } = options;

    return `
      <div class="text-center py-12">
        <i class="fas ${icon} text-6xl text-gray-300 mb-4"></i>
        <h3 class="text-lg font-medium text-gray-900 mb-2">${title}</h3>
        ${message ? `<p class="text-gray-500 mb-6">${message}</p>` : ""}
        ${
          actionText
            ? `
          <button onclick="${actionHandler}" class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <i class="fas ${actionIcon} mr-2"></i>${actionText}
          </button>
        `
            : ""
        }
      </div>
    `;
  },

  createErrorState(options = {}) {
    const {
      title = "Oops! Something went wrong",
      message = "An error occurred while processing your request.",
      retryHandler = "",
      showRetry = true,
    } = options;

    return `
      <div class="text-center py-12">
        <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
        <h3 class="text-lg font-medium text-gray-900 mb-2">${title}</h3>
        <p class="text-gray-500 mb-6">${message}</p>
        ${
          showRetry
            ? `
          <button onclick="${retryHandler}" class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <i class="fas fa-redo mr-2"></i>Try Again
          </button>
        `
            : ""
        }
      </div>
    `;
  },

  createCard(options = {}) {
    const {
      title = "",
      subtitle = "",
      content = "",
      footer = "",
      actions = [],
      icon = "",
      badge = "",
      cardClass = "bg-white rounded-lg shadow-md p-6",
    } = options;

    return `
      <div class="${cardClass}">
        ${
          title || icon || badge
            ? `
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              ${
                icon
                  ? `<i class="fas ${icon} text-2xl text-indigo-600"></i>`
                  : ""
              }
              <div>
                ${
                  title
                    ? `<h3 class="text-lg font-semibold text-gray-900">${title}</h3>`
                    : ""
                }
                ${
                  subtitle
                    ? `<p class="text-sm text-gray-500">${subtitle}</p>`
                    : ""
                }
              </div>
            </div>
            ${badge ? `<span class="badge">${badge}</span>` : ""}
          </div>
        `
            : ""
        }
        ${content ? `<div class="mb-4">${content}</div>` : ""}
        ${
          actions.length > 0
            ? `
          <div class="flex gap-2">
            ${actions
              .map(
                (action) => `
              <button onclick="${action.handler}" class="${
                  action.className ||
                  "px-3 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                }">
                ${action.icon ? `<i class="fas ${action.icon} mr-1"></i>` : ""}
                ${action.text}
              </button>
            `
              )
              .join("")}
          </div>
        `
            : ""
        }
        ${
          footer
            ? `<div class="mt-4 pt-4 border-t border-gray-200">${footer}</div>`
            : ""
        }
      </div>
    `;
  },

  createAlert(type, message, options = {}) {
    const { dismissible = true, icon = true } = options;

    const icons = {
      success: "fa-check-circle",
      error: "fa-exclamation-circle",
      warning: "fa-exclamation-triangle",
      info: "fa-info-circle",
    };

    const colors = {
      success: "bg-green-50 border-green-200 text-green-800",
      error: "bg-red-50 border-red-200 text-red-800",
      warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
      info: "bg-blue-50 border-blue-200 text-blue-800",
    };

    return `
      <div class="flex items-center gap-3 p-4 border rounded-lg ${
        colors[type]
      }" role="alert">
        ${icon ? `<i class="fas ${icons[type]} text-xl"></i>` : ""}
        <div class="flex-1">${message}</div>
        ${
          dismissible
            ? `
          <button onclick="this.closest('[role=alert]').remove()" class="text-current opacity-70 hover:opacity-100">
            <i class="fas fa-times"></i>
          </button>
        `
            : ""
        }
      </div>
    `;
  },

  createBadge(text, variant = "default") {
    const variants = {
      default: "bg-gray-100 text-gray-800",
      primary: "bg-indigo-100 text-indigo-800",
      success: "bg-green-100 text-green-800",
      warning: "bg-yellow-100 text-yellow-800",
      danger: "bg-red-100 text-red-800",
      info: "bg-blue-100 text-blue-800",
    };

    return `
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}">
        ${text}
      </span>
    `;
  },

  createProgress(percentage, options = {}) {
    const {
      label = "",
      showPercentage = true,
      color = "bg-indigo-600",
      size = "h-2",
    } = options;

    return `
      <div class="w-full">
        ${
          label || showPercentage
            ? `
          <div class="flex justify-between items-center mb-2">
            ${
              label ? `<span class="text-sm text-gray-700">${label}</span>` : ""
            }
            ${
              showPercentage
                ? `<span class="text-sm font-medium text-gray-700">${percentage}%</span>`
                : ""
            }
          </div>
        `
            : ""
        }
        <div class="w-full bg-gray-200 rounded-full ${size}">
          <div class="${color} ${size} rounded-full transition-all duration-300" style="width: ${percentage}%"></div>
        </div>
      </div>
    `;
  },

  createTabs(tabs, activeTab, onTabChange) {
    return `
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-8" aria-label="Tabs">
          ${tabs
            .map(
              (tab) => `
            <button onclick="${onTabChange}('${tab.id}')" 
              class="
                ${
                  tab.id === activeTab
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ">
              ${tab.icon ? `<i class="fas ${tab.icon}"></i>` : ""}
              ${tab.label}
              ${
                tab.count !== undefined
                  ? `<span class="ml-2 py-0.5 px-2 rounded-full text-xs ${
                      tab.id === activeTab
                        ? "bg-indigo-100 text-indigo-600"
                        : "bg-gray-100 text-gray-900"
                    }">${tab.count}</span>`
                  : ""
              }
            </button>
          `
            )
            .join("")}
        </nav>
      </div>
    `;
  },

  createModal(options = {}) {
    const {
      title = "Modal",
      content = "",
      footer = "",
      size = "max-w-2xl",
      closable = true,
    } = options;

    return `
      <div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
          <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
          <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle ${size} sm:w-full">
            <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div class="flex items-start justify-between mb-4">
                <h3 class="text-lg font-medium leading-6 text-gray-900" id="modal-title">${title}</h3>
                ${
                  closable
                    ? `
                  <button type="button" class="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none">
                    <i class="fas fa-times"></i>
                  </button>
                `
                    : ""
                }
              </div>
              <div class="mt-2">
                ${content}
              </div>
            </div>
            ${
              footer
                ? `
              <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                ${footer}
              </div>
            `
                : ""
            }
          </div>
        </div>
      </div>
    `;
  },

  createDropdown(options = {}) {
    const {
      items = [],
      buttonText = "Actions",
      buttonIcon = "fa-ellipsis-v",
    } = options;

    return `
      <div class="relative inline-block text-left">
        <button type="button" class="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">
          <i class="fas ${buttonIcon} mr-2"></i>
          ${buttonText}
          <i class="fas fa-chevron-down ml-2 -mr-1"></i>
        </button>
        <div class="hidden origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div class="py-1" role="menu" aria-orientation="vertical">
            ${items
              .map(
                (item) => `
              <a href="#" onclick="${
                item.handler
              }" class="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                ${item.icon ? `<i class="fas ${item.icon}"></i>` : ""}
                ${item.text}
              </a>
            `
              )
              .join("")}
          </div>
        </div>
      </div>
    `;
  },

  createBreadcrumb(items) {
    return `
      <nav class="flex" aria-label="Breadcrumb">
        <ol class="inline-flex items-center space-x-1 md:space-x-3">
          ${items
            .map(
              (item, index) => `
            <li class="inline-flex items-center">
              ${
                index > 0
                  ? '<i class="fas fa-chevron-right text-gray-400 mr-3"></i>'
                  : ""
              }
              ${
                item.href
                  ? `
                <a href="${
                  item.href
                }" class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-indigo-600">
                  ${item.icon ? `<i class="fas ${item.icon} mr-2"></i>` : ""}
                  ${item.text}
                </a>
              `
                  : `
                <span class="inline-flex items-center text-sm font-medium text-gray-500">
                  ${item.icon ? `<i class="fas ${item.icon} mr-2"></i>` : ""}
                  ${item.text}
                </span>
              `
              }
            </li>
          `
            )
            .join("")}
        </ol>
      </nav>
    `;
  },

  createTooltip(content, tooltipText) {
    return `
      <div class="relative inline-block group">
        ${content}
        <div class="absolute hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded shadow-lg whitespace-nowrap z-10">
          ${tooltipText}
          <div class="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
            <div class="border-8 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      </div>
    `;
  },

  createSkeleton(type = "text", count = 1) {
    const skeletons = {
      text: '<div class="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>',
      title:
        '<div class="h-6 bg-gray-200 rounded animate-pulse mb-3 w-3/4"></div>',
      card: `
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="h-6 bg-gray-200 rounded animate-pulse mb-4 w-3/4"></div>
          <div class="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div class="h-4 bg-gray-200 rounded animate-pulse mb-2 w-5/6"></div>
          <div class="h-4 bg-gray-200 rounded animate-pulse w-4/6"></div>
        </div>
      `,
      table: `
        <div class="space-y-3">
          ${Array(5)
            .fill()
            .map(
              () => `
            <div class="flex gap-4">
              <div class="h-4 bg-gray-200 rounded animate-pulse flex-1"></div>
              <div class="h-4 bg-gray-200 rounded animate-pulse flex-1"></div>
              <div class="h-4 bg-gray-200 rounded animate-pulse flex-1"></div>
            </div>
          `
            )
            .join("")}
        </div>
      `,
    };

    return Array(count)
      .fill(skeletons[type] || skeletons.text)
      .join("");
  },
};
