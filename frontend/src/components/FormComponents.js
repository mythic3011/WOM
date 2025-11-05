export const FormComponents = {
  select({
    id,
    label,
    options,
    value = "",
    onChange,
    className = "",
    required = false,
  }) {
    return `
      ${
        label
          ? `<label for="${id}" class="block text-sm font-medium text-gray-700 mb-1">${label}${
              required ? '<span class="text-red-500 ml-1">*</span>' : ""
            }</label>`
          : ""
      }
      <select
        id="${id}"
        class="px-4 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${className}"
        ${onChange ? `onchange="${onChange}"` : ""}
        ${required ? "required" : ""}
      >
        ${options
          .map(
            (opt) => `
          <option value="${opt.value}" ${opt.value === value ? "selected" : ""}>
            ${opt.label}
          </option>
        `
          )
          .join("")}
      </select>
    `;
  },

  input({
    id,
    type = "text",
    label,
    value = "",
    placeholder = "",
    className = "",
    required = false,
    readonly = false,
    disabled = false,
  }) {
    return `
      ${
        label
          ? `<label for="${id}" class="block text-sm font-medium text-gray-700 mb-1">${label}${
              required ? '<span class="text-red-500 ml-1">*</span>' : ""
            }</label>`
          : ""
      }
      <input
        type="${type}"
        id="${id}"
        value="${value}"
        placeholder="${placeholder}"
        class="w-full px-4 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
          readonly ? "bg-gray-50 cursor-not-allowed" : ""
        } ${
      disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
    } ${className}"
        ${required ? "required" : ""}
        ${readonly ? "readonly" : ""}
        ${disabled ? "disabled" : ""}
      />
    `;
  },

  textarea({
    id,
    label,
    value = "",
    placeholder = "",
    rows = 3,
    className = "",
    required = false,
  }) {
    return `
      ${
        label
          ? `<label for="${id}" class="block text-sm font-medium text-gray-700 mb-1">${label}${
              required ? '<span class="text-red-500 ml-1">*</span>' : ""
            }</label>`
          : ""
      }
      <textarea
        id="${id}"
        rows="${rows}"
        placeholder="${placeholder}"
        class="w-full px-4 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${className}"
        ${required ? "required" : ""}
      >${value}</textarea>
    `;
  },

  button({
    id,
    text,
    icon,
    color = "indigo",
    type = "button",
    className = "",
    size = "md",
    disabled = false,
  }) {
    const sizeClasses = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
    };

    const colorClasses = {
      indigo: "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500",
      green: "bg-green-600 hover:bg-green-700 focus:ring-green-500",
      blue: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
      purple: "bg-purple-600 hover:bg-purple-700 focus:ring-purple-500",
      red: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
      orange: "bg-orange-600 hover:bg-orange-700 focus:ring-orange-500",
      gray: "bg-gray-600 hover:bg-gray-700 focus:ring-gray-500",
    };

    return `
      <button
        ${id ? `id="${id}"` : ""}
        type="${type}"
        class="inline-flex items-center gap-2 ${sizeClasses[size]} ${
      colorClasses[color] || colorClasses.indigo
    } text-white rounded-lg focus:outline-none focus:ring-2 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${className}"
        ${disabled ? "disabled" : ""}
      >
        ${icon ? `<i class="fas ${icon} text-white"></i>` : ""}
        <span>${text}</span>
      </button>
    `;
  },

  searchInput({ id, placeholder = "Search...", className = "" }) {
    return `
      <div class="relative ${className}">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <i class="fas fa-search text-gray-400"></i>
        </div>
        <input
          type="text"
          id="${id}"
          placeholder="${placeholder}"
          class="w-full pl-10 pr-4 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
        />
      </div>
    `;
  },

  filterBar({
    searchId,
    searchPlaceholder,
    filters = [],
    clearButtonId = "clearFilters",
  }) {
    return `
      <div class="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
        <div class="flex flex-col sm:flex-row gap-4 mb-6">
          <div class="flex-1">
            ${this.searchInput({
              id: searchId,
              placeholder: searchPlaceholder,
              className: "",
            })}
          </div>
          ${filters
            .map(
              (filter) => `
            <div>
              ${this.select(filter)}
            </div>
          `
            )
            .join("")}
          <button
            id="${clearButtonId}"
            class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
          >
            <i class="fas fa-times-circle text-gray-700"></i>
            Clear
          </button>
        </div>
      </div>
    `;
  },

  statCard({ title, value, icon, color = "indigo", subtitle }) {
    const colorClasses = {
      indigo: {
        gradient: "from-indigo-50 to-indigo-100",
        border: "border-indigo-500",
        title: "text-indigo-600",
        value: "text-indigo-900",
        subtitle: "text-indigo-700",
        icon: "text-indigo-400",
      },
      blue: {
        gradient: "from-blue-50 to-blue-100",
        border: "border-blue-500",
        title: "text-blue-600",
        value: "text-blue-900",
        subtitle: "text-blue-700",
        icon: "text-blue-400",
      },
      green: {
        gradient: "from-green-50 to-green-100",
        border: "border-green-500",
        title: "text-green-600",
        value: "text-green-900",
        subtitle: "text-green-700",
        icon: "text-green-400",
      },
      yellow: {
        gradient: "from-yellow-50 to-yellow-100",
        border: "border-yellow-500",
        title: "text-yellow-600",
        value: "text-yellow-900",
        subtitle: "text-yellow-700",
        icon: "text-yellow-400",
      },
      red: {
        gradient: "from-red-50 to-red-100",
        border: "border-red-500",
        title: "text-red-600",
        value: "text-red-900",
        subtitle: "text-red-700",
        icon: "text-red-400",
      },
      purple: {
        gradient: "from-purple-50 to-purple-100",
        border: "border-purple-500",
        title: "text-purple-600",
        value: "text-purple-900",
        subtitle: "text-purple-700",
        icon: "text-purple-400",
      },
      gray: {
        gradient: "from-gray-50 to-gray-100",
        border: "border-gray-500",
        title: "text-gray-600",
        value: "text-gray-900",
        subtitle: "text-gray-700",
        icon: "text-gray-400",
      },
    };

    const colors = colorClasses[color] || colorClasses.indigo;

    return `
      <div class="bg-gradient-to-br ${
        colors.gradient
      } rounded-lg p-4 border-l-4 ${colors.border}">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold ${
              colors.title
            } uppercase">${title}</p>
            <p class="text-2xl font-bold ${colors.value}">${value}</p>
            ${
              subtitle
                ? `<p class="text-xs ${colors.subtitle} mt-1">${subtitle}</p>`
                : ""
            }
          </div>
          <i class="fas ${icon} text-3xl ${colors.icon}"></i>
        </div>
      </div>
    `;
  },

  actionButton({
    id,
    icon,
    tooltip,
    color = "indigo",
    size = "md",
    title,
    onClick,
    dataAttributes = {},
  }) {
    const dataAttrs = Object.entries(dataAttributes)
      .map(([key, value]) => `data-${key}="${value}"`)
      .join(" ");

    const colorClasses = {
      indigo: {
        bg: "bg-indigo-100",
        text: "text-indigo-700",
        hover: "hover:bg-indigo-200",
        icon: "text-indigo-700",
      },
      green: {
        bg: "bg-green-100",
        text: "text-green-700",
        hover: "hover:bg-green-200",
        icon: "text-green-700",
      },
      blue: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        hover: "hover:bg-blue-200",
        icon: "text-blue-700",
      },
      purple: {
        bg: "bg-purple-100",
        text: "text-purple-700",
        hover: "hover:bg-purple-200",
        icon: "text-purple-700",
      },
      yellow: {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        hover: "hover:bg-yellow-200",
        icon: "text-yellow-700",
      },
      orange: {
        bg: "bg-orange-100",
        text: "text-orange-700",
        hover: "hover:bg-orange-200",
        icon: "text-orange-700",
      },
      red: {
        bg: "bg-red-100",
        text: "text-red-700",
        hover: "hover:bg-red-200",
        icon: "text-red-700",
      },
      gray: {
        bg: "bg-gray-100",
        text: "text-gray-700",
        hover: "hover:bg-gray-200",
        icon: "text-gray-700",
      },
    };

    const sizeClasses = {
      xs: "px-1.5 py-1 text-xs",
      sm: "px-2 py-1.5 text-xs",
      md: "px-2.5 py-1.5 text-sm",
      lg: "px-3 py-2 text-base",
    };

    const colors = colorClasses[color] || colorClasses.indigo;
    const sizeClass = sizeClasses[size] || sizeClasses.md;

    return `
      <button
        type="button"
        ${id ? `id="${id}"` : ""}
        class="inline-flex items-center ${sizeClass} ${colors.bg} ${
      colors.text
    } ${colors.hover} rounded-lg transition-colors font-medium"
        ${dataAttrs}
        ${title || tooltip ? `title="${title || tooltip}"` : ""}
        ${onClick ? `onclick="${onClick}"` : ""}
      >
        <i class="fas ${icon} ${colors.icon}"></i>
      </button>
    `;
  },

  badge({ text, color = "gray", icon }) {
    const colorClasses = {
      gray: { bg: "bg-gray-100", text: "text-gray-800", icon: "text-gray-600" },
      green: {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: "text-green-600",
      },
      yellow: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        icon: "text-yellow-600",
      },
      red: { bg: "bg-red-100", text: "text-red-800", icon: "text-red-600" },
      blue: { bg: "bg-blue-100", text: "text-blue-800", icon: "text-blue-600" },
      indigo: {
        bg: "bg-indigo-100",
        text: "text-indigo-800",
        icon: "text-indigo-600",
      },
      purple: {
        bg: "bg-purple-100",
        text: "text-purple-800",
        icon: "text-purple-600",
      },
      pink: { bg: "bg-pink-100", text: "text-pink-800", icon: "text-pink-600" },
    };

    const colors = colorClasses[color] || colorClasses.gray;

    return `
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        colors.bg
      } ${colors.text}">
        ${icon ? `<i class="fas ${icon} mr-1 ${colors.icon}"></i>` : ""}
        ${text}
      </span>
    `;
  },

  infoBox({ title, message, type = "info" }) {
    const config = {
      info: {
        bg: "bg-blue-50",
        border: "border-blue-200",
        icon: "fa-info-circle",
        iconColor: "text-blue-600",
        titleColor: "text-blue-900",
        textColor: "text-blue-800",
      },
      success: {
        bg: "bg-green-50",
        border: "border-green-200",
        icon: "fa-check-circle",
        iconColor: "text-green-600",
        titleColor: "text-green-900",
        textColor: "text-green-800",
      },
      warning: {
        bg: "bg-yellow-50",
        border: "border-yellow-200",
        icon: "fa-exclamation-triangle",
        iconColor: "text-yellow-600",
        titleColor: "text-yellow-900",
        textColor: "text-yellow-800",
      },
      error: {
        bg: "bg-red-50",
        border: "border-red-200",
        icon: "fa-times-circle",
        iconColor: "text-red-600",
        titleColor: "text-red-900",
        textColor: "text-red-800",
      },
    };

    const colors = config[type] || config.info;

    return `
      <div class="${colors.bg} border ${colors.border} rounded-lg p-4">
        <div class="flex items-start gap-3">
          <i class="fas ${colors.icon} ${colors.iconColor} text-lg mt-0.5"></i>
          <div class="flex-1">
            ${
              title
                ? `<h4 class="text-sm font-semibold ${colors.titleColor} mb-1">${title}</h4>`
                : ""
            }
            <p class="text-sm ${colors.textColor}">${message}</p>
          </div>
        </div>
      </div>
    `;
  },

  pageHeader({ title, subtitle, icon, actions = [] }) {
    return `
      <div class="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 flex items-center">
            ${
              icon ? `<i class="fas ${icon} text-indigo-600 mr-3"></i>` : ""
            }${title}
          </h1>
          ${subtitle ? `<p class="text-gray-600 mt-2">${subtitle}</p>` : ""}
        </div>
        ${
          actions.length > 0
            ? `
          <div class="flex gap-2">
            ${actions.join("")}
          </div>
        `
            : ""
        }
      </div>
    `;
  },

  table({ columns, rows, emptyMessage = "No data available" }) {
    if (!rows || rows.length === 0) {
      return `
        <div class="text-center py-12">
          <i class="fas fa-inbox text-gray-300 text-5xl mb-4"></i>
          <p class="text-gray-500">${emptyMessage}</p>
        </div>
      `;
    }

    return `
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              ${columns
                .map(
                  (col) => `
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${
                  col.className || ""
                }">
                  ${col.label}
                </th>
              `
                )
                .join("")}
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            ${rows
              .map(
                (row) => `
              <tr class="hover:bg-gray-50 transition-colors">
                ${columns
                  .map(
                    (col) => `
                  <td class="px-4 py-4 ${col.tdClassName || ""}">
                    ${
                      typeof col.render === "function"
                        ? col.render(row)
                        : row[col.key] || ""
                    }
                  </td>
                `
                  )
                  .join("")}
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  },

  dataTable({ columns, data, searchable = false, pagination = null }) {
    const hasData = data && data.length > 0;

    return `
      <div class="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        ${
          searchable
            ? `
          <div class="p-4 border-b border-gray-200">
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i class="fas fa-search text-gray-400"></i>
              </div>
              <input
                type="text"
                class="data-table-search w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Search..."
              />
            </div>
          </div>
        `
            : ""
        }

        <div class="overflow-x-auto">
          ${
            hasData
              ? `
            <table class="w-full">
              <thead class="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  ${columns
                    .map(
                      (col) => `
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap ${
                      col.sortable ? "cursor-pointer hover:bg-gray-100" : ""
                    } ${col.headerClassName || ""}">
                      <div class="flex items-center gap-2">
                        <span>${col.label}</span>
                        ${
                          col.sortable
                            ? '<i class="fas fa-sort text-gray-400"></i>'
                            : ""
                        }
                      </div>
                    </th>
                  `
                    )
                    .join("")}
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                ${data
                  .map(
                    (row, index) => `
                  <tr class="hover:bg-gray-50 transition-colors" data-row-index="${index}">
                    ${columns
                      .map(
                        (col) => `
                      <td class="px-4 py-4 ${col.cellClassName || ""} ${
                          col.nowrap ? "whitespace-nowrap" : ""
                        }">
                        ${
                          typeof col.render === "function"
                            ? col.render(row, index)
                            : row[col.key] || "-"
                        }
                      </td>
                    `
                      )
                      .join("")}
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          `
              : `
            <div class="text-center py-16">
              <i class="fas fa-inbox text-gray-300 text-6xl mb-4"></i>
              <p class="text-gray-500 text-lg">No data available</p>
            </div>
          `
          }
        </div>

        ${
          pagination
            ? `
          <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <div class="text-sm text-gray-600">
              Showing <span class="font-semibold">${pagination.from}</span> to
              <span class="font-semibold">${pagination.to}</span> of
              <span class="font-semibold">${pagination.total}</span> results
            </div>
            <div class="flex gap-2">
              <button class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700" ${
                pagination.currentPage === 1 ? "disabled" : ""
              }>
                <i class="fas fa-chevron-left text-gray-700"></i>
              </button>
              ${Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  return (
                    page === 1 ||
                    page === pagination.totalPages ||
                    Math.abs(page - pagination.currentPage) <= 1
                  );
                })
                .map((page, index, arr) => {
                  const prev = arr[index - 1];
                  const gap =
                    prev && page - prev > 1
                      ? '<span class="px-2 text-gray-400">...</span>'
                      : "";
                  return `
                    ${gap}
                    <button class="px-3 py-1.5 text-sm border rounded-lg ${
                      page === pagination.currentPage
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "border-gray-300 hover:bg-gray-100 text-gray-700"
                    }" data-page="${page}">
                      ${page}
                    </button>
                  `;
                })
                .join("")}
              <button class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700" ${
                pagination.currentPage === pagination.totalPages
                  ? "disabled"
                  : ""
              }>
                <i class="fas fa-chevron-right text-gray-700"></i>
              </button>
            </div>
          </div>
        `
            : ""
        }
      </div>
    `;
  },
};
