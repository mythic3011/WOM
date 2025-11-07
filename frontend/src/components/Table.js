export function createTable({
  columns = [],
  data = [],
  title,
  subtitle,
  icon,
  actions = [],
  searchable = false,
  sortable = true,
  selectable = false,
  pagination = null,
  emptyState = {
    icon: "fa-inbox",
    title: "No data available",
    message: "There are no items to display",
  },
  rowActions,
  headerStats,
  onSort,
  onSelect,
  onRowClick,
  className = "",
}) {
  const hasData = data && data.length > 0;
  const tableId = `table-${Math.random().toString(36).substr(2, 9)}`;

  return `
    <div class="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden ${className}">
      ${
        title || headerStats
          ? renderTableHeader({ title, subtitle, icon, actions, headerStats })
          : ""
      }

      ${searchable ? renderSearchBar(tableId) : ""}

      <div class="overflow-x-auto">
        ${
          hasData
            ? renderTableContent({
                tableId,
                columns,
                data,
                sortable,
                selectable,
                rowActions,
                onRowClick,
              })
            : renderEmptyState(emptyState)
        }
      </div>

      ${pagination ? renderPagination(pagination) : ""}
    </div>
  `;
}

function renderTableHeader({ title, subtitle, icon, actions, headerStats }) {
  return `
    <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex-1">
          ${
            title
              ? `
            <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
              ${icon ? `<i class="fas ${icon} text-indigo-600"></i>` : ""}
              <span>${title}</span>
            </h3>
          `
              : ""
          }
          ${
            subtitle
              ? `<p class="text-sm text-gray-600 mt-1">${subtitle}</p>`
              : ""
          }
        </div>

        ${
          headerStats
            ? `
          <div class="flex items-center gap-6">
            ${renderHeaderStats(headerStats)}
          </div>
        `
            : ""
        }

        ${
          actions.length > 0
            ? `
          <div class="flex items-center gap-2">
            ${actions.join("")}
          </div>
        `
            : ""
        }
      </div>
    </div>
  `;
}

function renderHeaderStats(stats) {
  return stats
    .map(
      (stat) => `
    <div class="text-center">
      <p class="text-xs text-gray-500 uppercase tracking-wide">${stat.label}</p>
      <p class="text-lg font-bold ${stat.colorClass || "text-gray-900"}">${
        stat.value
      }</p>
    </div>
  `
    )
    .join('<div class="h-8 w-px bg-gray-300"></div>');
}

function renderSearchBar(tableId) {
  return `
    <div class="px-6 py-4 border-b border-gray-200 bg-white">
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <i class="fas fa-search text-gray-400"></i>
        </div>
        <input
          type="text"
          id="${tableId}-search"
          class="table-search w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          placeholder="Search in table..."
        />
      </div>
    </div>
  `;
}

function renderTableContent({
  tableId,
  columns,
  data,
  sortable,
  selectable,
  rowActions,
  onRowClick,
}) {
  const hasActions = typeof rowActions === "function";
  const finalColumns = [...columns];

  if (hasActions) {
    finalColumns.push({
      label: "Actions",
      key: "_actions",
      nowrap: true,
      headerClassName: "text-center",
      cellClassName: "text-center",
    });
  }

  return `
    <table class="w-full" id="${tableId}">
      <thead class="bg-gray-50 border-b-2 border-gray-200">
        <tr>
          ${
            selectable
              ? `
            <th class="px-4 py-3 w-12">
              <input
                type="checkbox"
                class="table-select-all rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
            </th>
          `
              : ""
          }
          ${finalColumns
            .map(
              (col) => `
            <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${
              col.sortable !== false && sortable
                ? "cursor-pointer hover:bg-gray-100 transition-colors"
                : ""
            } ${col.nowrap ? "whitespace-nowrap" : ""} ${
                col.headerClassName || ""
              }"
              data-column="${col.key}"
              ${
                col.sortable !== false && sortable ? `data-sortable="true"` : ""
              }>
              <div class="flex items-center gap-2">
                <span>${col.label}</span>
                ${
                  col.sortable !== false && sortable
                    ? '<i class="fas fa-sort text-gray-400 text-xs"></i>'
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
          <tr class="hover:bg-gray-50 transition-colors ${
            onRowClick ? "cursor-pointer" : ""
          }"
            data-row-index="${index}"
            ${onRowClick ? 'data-clickable="true"' : ""}>
            ${
              selectable
                ? `
              <td class="px-4 py-4 w-12">
                <input
                  type="checkbox"
                  class="table-row-select rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  data-row-id="${row.id || index}"
                />
              </td>
            `
                : ""
            }
            ${columns
              .map(
                (col) => `
              <td class="px-4 py-4 text-sm ${col.cellClassName || ""} ${
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
            ${
              hasActions
                ? `
              <td class="px-4 py-4 text-sm text-center whitespace-nowrap">
                <div class="flex items-center justify-center gap-1">
                  ${rowActions(row, index).join("")}
                </div>
              </td>
            `
                : ""
            }
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderEmptyState(emptyState) {
  return `
    <div class="text-center py-16">
      <div class="inline-block">
        <i class="fas ${emptyState.icon} text-gray-300 text-6xl mb-4"></i>
        <h3 class="text-lg font-semibold text-gray-700 mb-2">${
          emptyState.title
        }</h3>
        <p class="text-sm text-gray-500">${emptyState.message}</p>
        ${
          emptyState.action
            ? `
          <div class="mt-4">
            ${emptyState.action}
          </div>
        `
            : ""
        }
      </div>
    </div>
  `;
}

function renderPagination(pagination) {
  const { currentPage, totalPages, totalItems, pageSize, onPageChange } =
    pagination;
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const pages = [];
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return `
    <div class="px-6 py-4 border-t border-gray-200 bg-gray-50">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="text-sm text-gray-700">
          Showing <span class="font-semibold text-gray-900">${startItem}</span> to
          <span class="font-semibold text-gray-900">${endItem}</span> of
          <span class="font-semibold text-gray-900">${totalItems}</span> results
        </div>

        <nav class="flex items-center gap-2">
          <button
            class="pagination-btn px-3 py-2 text-sm font-medium rounded-lg border ${
              currentPage === 1
                ? "text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed"
                : "text-gray-700 bg-white border-gray-300 hover:bg-gray-50"
            }"
            data-page="${currentPage - 1}"
            ${currentPage === 1 ? "disabled" : ""}>
            <i class="fas fa-chevron-left"></i>
          </button>

          ${
            startPage > 1
              ? `
            <button class="pagination-btn px-3 py-2 text-sm font-medium rounded-lg border text-gray-700 bg-white border-gray-300 hover:bg-gray-50" data-page="1">
              1
            </button>
            ${startPage > 2 ? '<span class="text-gray-500">...</span>' : ""}
          `
              : ""
          }

          ${pages
            .map(
              (page) => `
            <button
              class="pagination-btn px-3 py-2 text-sm font-medium rounded-lg border ${
                page === currentPage
                  ? "text-white bg-indigo-600 border-indigo-600"
                  : "text-gray-700 bg-white border-gray-300 hover:bg-gray-50"
              }"
              data-page="${page}"
              ${page === currentPage ? "disabled" : ""}>
              ${page}
            </button>
          `
            )
            .join("")}

          ${
            endPage < totalPages
              ? `
            ${
              endPage < totalPages - 1
                ? '<span class="text-gray-500">...</span>'
                : ""
            }
            <button class="pagination-btn px-3 py-2 text-sm font-medium rounded-lg border text-gray-700 bg-white border-gray-300 hover:bg-gray-50" data-page="${totalPages}">
              ${totalPages}
            </button>
          `
              : ""
          }

          <button
            class="pagination-btn px-3 py-2 text-sm font-medium rounded-lg border ${
              currentPage === totalPages
                ? "text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed"
                : "text-gray-700 bg-white border-gray-300 hover:bg-gray-50"
            }"
            data-page="${currentPage + 1}"
            ${currentPage === totalPages ? "disabled" : ""}>
            <i class="fas fa-chevron-right"></i>
          </button>
        </nav>
      </div>
    </div>
  `;
}

export function initTableFeatures(tableSelector, options = {}) {
  const { onSort, onSelect, onRowClick, onPageChange, onSearch } = options;

  if (onSort) {
    $(document).on(
      "click",
      `${tableSelector} th[data-sortable="true"]`,
      function () {
        const column = $(this).data("column");
        const $icon = $(this).find("i");
        const currentSort = $(this).data("sort") || "none";

        $(this)
          .closest("thead")
          .find("th i")
          .removeClass("fa-sort-up fa-sort-down")
          .addClass("fa-sort");

        let newSort = "asc";
        if (currentSort === "none") {
          newSort = "asc";
          $icon.removeClass("fa-sort").addClass("fa-sort-up");
        } else if (currentSort === "asc") {
          newSort = "desc";
          $icon.removeClass("fa-sort fa-sort-up").addClass("fa-sort-down");
        } else {
          newSort = "none";
          $icon.removeClass("fa-sort-down").addClass("fa-sort");
        }

        $(this).data("sort", newSort);
        onSort(column, newSort);
      }
    );
  }

  if (onSelect) {
    $(document).on("change", `${tableSelector} .table-select-all`, function () {
      const isChecked = $(this).prop("checked");
      $(tableSelector).find(".table-row-select").prop("checked", isChecked);

      const selectedIds = [];
      if (isChecked) {
        $(tableSelector)
          .find(".table-row-select:checked")
          .each(function () {
            selectedIds.push($(this).data("row-id"));
          });
      }
      onSelect(selectedIds);
    });

    $(document).on("change", `${tableSelector} .table-row-select`, function () {
      const selectedIds = [];
      $(tableSelector)
        .find(".table-row-select:checked")
        .each(function () {
          selectedIds.push($(this).data("row-id"));
        });

      const totalRows = $(tableSelector).find(".table-row-select").length;
      const checkedRows = selectedIds.length;
      $(tableSelector)
        .find(".table-select-all")
        .prop("checked", checkedRows === totalRows && totalRows > 0);

      onSelect(selectedIds);
    });
  }

  if (onRowClick) {
    $(document).on(
      "click",
      `${tableSelector} tr[data-clickable="true"]`,
      function (e) {
        if (!$(e.target).closest("input, button, a").length) {
          const rowIndex = $(this).data("row-index");
          onRowClick(rowIndex);
        }
      }
    );
  }

  if (onPageChange) {
    $(document).on(
      "click",
      `${tableSelector} .pagination-btn:not([disabled])`,
      function () {
        const page = parseInt($(this).data("page"));
        onPageChange(page);
      }
    );
  }

  if (onSearch) {
    $(document).on("input", `${tableSelector}-search`, function () {
      const searchTerm = $(this).val();
      onSearch(searchTerm);
    });
  }
}

export function createSimpleTable({
  columns,
  data,
  striped = false,
  hover = true,
  compact = false,
}) {
  return `
    <div class="overflow-x-auto">
      <table class="w-full ${striped ? "table-striped" : ""} ${
    hover ? "table-hover" : ""
  }">
        <thead class="bg-gray-50 border-b-2 border-gray-200">
          <tr>
            ${columns
              .map(
                (col) => `
              <th class="px-${compact ? "3" : "4"} py-${
                  compact ? "2" : "3"
                } text-left text-xs font-semibold text-gray-600 uppercase ${
                  col.nowrap ? "whitespace-nowrap" : ""
                }">
                ${col.label}
              </th>
            `
              )
              .join("")}
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${
            data.length > 0
              ? data
                  .map(
                    (row, index) => `
              <tr ${hover ? 'class="hover:bg-gray-50"' : ""}>
                ${columns
                  .map(
                    (col) => `
                  <td class="px-${compact ? "3" : "4"} py-${
                      compact ? "2" : "4"
                    } text-sm ${col.cellClassName || ""}">
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
                  .join("")
              : `
            <tr>
              <td colspan="${columns.length}" class="px-4 py-8 text-center text-gray-500">
                No data available
              </td>
            </tr>
          `
          }
        </tbody>
      </table>
    </div>
  `;
}
