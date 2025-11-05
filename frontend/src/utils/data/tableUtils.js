import { performanceOptimizer } from "./performance.js";

export const tableUtils = {
  renderTable(data, columns, options = {}) {
    const {
      emptyMessage = "No data available",
      tableClass = "min-w-full divide-y divide-gray-200",
      onRowClick,
      rowClass = "",
    } = options;

    if (!data || data.length === 0) {
      return `
        <tr>
          <td colspan="${columns.length}" class="px-6 py-8 text-center text-gray-500">
            ${emptyMessage}
          </td>
        </tr>
      `;
    }

    return data
      .map((row, rowIndex) => {
        const clickHandler = onRowClick
          ? `onclick="${onRowClick}(${rowIndex})"`
          : "";
        const computedRowClass =
          typeof rowClass === "function" ? rowClass(row) : rowClass;

        return `
        <tr class="hover:bg-gray-50 transition-colors ${computedRowClass}" ${clickHandler}>
          ${columns
            .map((col) => {
              const value = this.getCellValue(row, col);
              return `<td class="px-6 py-4 whitespace-nowrap ${
                col.cellClass || ""
              }">${value}</td>`;
            })
            .join("")}
        </tr>
      `;
      })
      .join("");
  },

  getCellValue(row, column) {
    const { key, render, format } = column;

    let value = key ? this.getNestedValue(row, key) : row;

    if (render) {
      return render(value, row);
    }

    if (format) {
      return format(value);
    }

    return value || "-";
  },

  getNestedValue(obj, path) {
    return path.split(".").reduce((acc, part) => acc?.[part], obj);
  },

  renderTableHeader(columns, options = {}) {
    const { sortable = false, onSort, currentSort = {} } = options;

    return `
      <thead class="bg-gray-50">
        <tr>
          ${columns
            .map((col) => {
              const isSortable = sortable && col.sortable !== false;
              const sortIcon = this.getSortIcon(col.key, currentSort);
              const clickHandler =
                isSortable && onSort ? `onclick="${onSort}('${col.key}')"` : "";

              return `
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                isSortable ? "cursor-pointer hover:bg-gray-100" : ""
              }" ${clickHandler}>
                <div class="flex items-center gap-2">
                  ${col.label}
                  ${isSortable ? sortIcon : ""}
                </div>
              </th>
            `;
            })
            .join("")}
        </tr>
      </thead>
    `;
  },

  getSortIcon(key, currentSort) {
    if (!currentSort.key || currentSort.key !== key) {
      return '<i class="fas fa-sort text-gray-300"></i>';
    }

    return currentSort.direction === "asc"
      ? '<i class="fas fa-sort-up text-indigo-600"></i>'
      : '<i class="fas fa-sort-down text-indigo-600"></i>';
  },

  sortData(data, sortKey, direction = "asc") {
    return [...data].sort((a, b) => {
      const aVal = this.getNestedValue(a, sortKey);
      const bVal = this.getNestedValue(b, sortKey);

      if (aVal === bVal) return 0;

      const comparison = aVal > bVal ? 1 : -1;
      return direction === "asc" ? comparison : -comparison;
    });
  },

  filterData(data, filters) {
    return data.filter((item) => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;

        const itemValue = this.getNestedValue(item, key);

        if (typeof value === "function") {
          return value(itemValue, item);
        }

        if (typeof itemValue === "string") {
          return itemValue.toLowerCase().includes(value.toLowerCase());
        }

        return itemValue === value;
      });
    });
  },

  paginateData(data, page = 1, pageSize = 10) {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return {
      data: data.slice(startIndex, endIndex),
      totalPages: Math.ceil(data.length / pageSize),
      currentPage: page,
      totalItems: data.length,
    };
  },

  renderPagination(pagination, onPageChange) {
    const { currentPage, totalPages } = pagination;

    if (totalPages <= 1) return "";

    const pages = [];
    const maxVisible = 7;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return `
      <div class="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
        <div class="flex-1 flex justify-between sm:hidden">
          <button ${
            currentPage === 1 ? "disabled" : ""
          } onclick="${onPageChange}(${currentPage - 1})" 
            class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
            Previous
          </button>
          <button ${
            currentPage === totalPages ? "disabled" : ""
          } onclick="${onPageChange}(${currentPage + 1})" 
            class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
            Next
          </button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700">
              Showing <span class="font-medium">${
                (currentPage - 1) * 10 + 1
              }</span> to 
              <span class="font-medium">${Math.min(
                currentPage * 10,
                pagination.totalItems
              )}</span> of 
              <span class="font-medium">${pagination.totalItems}</span> results
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              ${
                startPage > 1
                  ? `<button onclick="${onPageChange}(1)" class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">1</button>`
                  : ""
              }
              ${
                startPage > 2
                  ? '<span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>'
                  : ""
              }
              ${pages
                .map(
                  (page) => `
                <button onclick="${onPageChange}(${page})" 
                  class="relative inline-flex items-center px-4 py-2 border ${
                    page === currentPage
                      ? "bg-indigo-50 border-indigo-500 text-indigo-600 z-10"
                      : "border-gray-300 bg-white text-gray-500 hover:bg-gray-50"
                  } text-sm font-medium">
                  ${page}
                </button>
              `
                )
                .join("")}
              ${
                endPage < totalPages - 1
                  ? '<span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>'
                  : ""
              }
              ${
                endPage < totalPages
                  ? `<button onclick="${onPageChange}(${totalPages})" class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">${totalPages}</button>`
                  : ""
              }
            </nav>
          </div>
        </div>
      </div>
    `;
  },

  createDataTable(containerId, data, columns, options = {}) {
    const {
      searchable = true,
      sortable = true,
      paginated = true,
      pageSize = 10,
      filters = {},
    } = options;

    let currentData = data;
    let currentSort = {};
    let currentPage = 1;
    let currentFilters = { ...filters };

    const render = () => {
      let processedData = currentData;

      processedData = this.filterData(processedData, currentFilters);

      if (currentSort.key) {
        processedData = this.sortData(
          processedData,
          currentSort.key,
          currentSort.direction
        );
      }

      let paginationInfo = null;
      if (paginated) {
        paginationInfo = this.paginateData(
          processedData,
          currentPage,
          pageSize
        );
        processedData = paginationInfo.data;
      }

      const tableHTML = `
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            ${this.renderTableHeader(columns, {
              sortable,
              currentSort,
              onSort: "handleSort",
            })}
            <tbody class="bg-white divide-y divide-gray-200">
              ${this.renderTable(processedData, columns)}
            </tbody>
          </table>
        </div>
        ${
          paginated && paginationInfo
            ? this.renderPagination(paginationInfo, "handlePageChange")
            : ""
        }
      `;

      document.getElementById(containerId).innerHTML = tableHTML;
    };

    const handleSort = (key) => {
      if (currentSort.key === key) {
        currentSort.direction =
          currentSort.direction === "asc" ? "desc" : "asc";
      } else {
        currentSort = { key, direction: "asc" };
      }
      render();
    };

    const handlePageChange = (page) => {
      currentPage = page;
      render();
    };

    window.handleSort = handleSort;
    window.handlePageChange = handlePageChange;

    return {
      render,
      updateData: (newData) => {
        currentData = newData;
        currentPage = 1;
        render();
      },
      updateFilters: (newFilters) => {
        currentFilters = { ...currentFilters, ...newFilters };
        currentPage = 1;
        render();
      },
      getData: () => currentData,
      getFilteredData: () =>
        this.filterData(
          currentSort.key
            ? this.sortData(currentData, currentSort.key, currentSort.direction)
            : currentData,
          currentFilters
        ),
    };
  },

  exportToCSV(data, columns, filename = "export.csv") {
    const headers = columns.map((col) => col.label).join(",");
    const rows = data
      .map((row) => {
        return columns
          .map((col) => {
            const value = this.getNestedValue(row, col.key);
            return `"${String(value).replace(/"/g, '""')}"`;
          })
          .join(",");
      })
      .join("\n");

    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  },

  exportToJSON(data, filename = "export.json") {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  },
};
