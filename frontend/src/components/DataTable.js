
import dayjs from "dayjs";

import { TableFilterUtil } from "@utils/table/tableFilterUtil.js";
import { TableSortUtil } from "@utils/table/tableSortUtil.js";

import { Avatar } from "./common/Avatar.js";
import { createTable, initTableFeatures } from "./Table.js";

export class DataTable {
  constructor(containerId, options) {
    this.containerId = containerId;
    this.options = {
      data: [],
      columns: [],
      sortable: true,
      filterable: true,
      paginate: false,
      selectable: false,
      pageSize: 10,
      defaultSort: null,
      columnFilters: [],
      tableId: `datatable_${Math.random().toString(36).substr(2, 9)}`,
      onRowClick: null,
      onSelect: null,
      ...options,
    };

    this.state = {
      originalData: [...this.options.data],
      filteredData: [...this.options.data],
      displayData: [...this.options.data],
      currentSort: this.options.defaultSort || null,
      searchTerm: "",
      currentPage: 1,
      selectedRows: new Set(),
      activeColumnFilters: {},
      visibleColumns: new Set(this.options.columns.map(col => col.key)),
    };

    this.enhanceColumns();
    this.restoreState();
    this.render();
    this.attachEventListeners();
  }

  enhanceColumns() {
    this.options.columns = this.options.columns.map((col) => {
      if (col.render) {return col;}

      switch (col.type) {
        case "avatar":
          col.render = (row) =>
            Avatar.render({
              src: row[col.key],
              name: row[col.nameKey || "name"],
              size: col.size || "sm",
            });
          break;

        case "date":
          col.render = (row) => {
            const value = TableSortUtil.getNestedValue(row, col.key);
            if (!value) {return "-";}
            return dayjs(value).format(col.format || "MMM D, YYYY");
          };
          break;

        case "currency":
          col.render = (row) => {
            const value = TableSortUtil.getNestedValue(row, col.key);
            if (value === null || value === undefined) {return "-";}
            const prefix = col.prefix || "HKD";
            return `${prefix} ${parseFloat(value).toLocaleString()}`;
          };
          break;

        case "badge":
          col.render = (row) => {
            const value = TableSortUtil.getNestedValue(row, col.key);
            if (!value) {return "-";}
            const colors = col.badgeColors || {};
            const color = colors[value] || "gray";
            return `
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${color}-100 text-${color}-800">
                ${value}
              </span>
            `;
          };
          break;

        case "progress":
          col.render = (row) => {
            const value = TableSortUtil.getNestedValue(row, col.key);
            const percentage = parseFloat(value) || 0;
            const color = percentage > 75 ? "green" : percentage > 50 ? "blue" : percentage > 25 ? "yellow" : "red";
            return `
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-${color}-600 h-2 rounded-full" style="width: ${percentage}%"></div>
              </div>
              <span class="text-xs text-gray-600">${percentage}%</span>
            `;
          };
          break;

        case "boolean":
          col.render = (row) => {
            const value = TableSortUtil.getNestedValue(row, col.key);
            return value
              ? "<i class=\"fas fa-check text-green-600\"></i>"
              : "<i class=\"fas fa-times text-red-600\"></i>";
          };
          break;

        case "link":
          col.render = (row) => {
            const value = TableSortUtil.getNestedValue(row, col.key);
            const href = col.href ? TableSortUtil.getNestedValue(row, col.href) : value;
            return `<a href="${href}" class="text-indigo-600 hover:text-indigo-800">${value}</a>`;
          };
          break;

        case "email":
          col.render = (row) => {
            const value = TableSortUtil.getNestedValue(row, col.key);
            return `<a href="mailto:${value}" class="text-indigo-600 hover:text-indigo-800">${value}</a>`;
          };
          break;

        case "phone":
          col.render = (row) => {
            const value = TableSortUtil.getNestedValue(row, col.key);
            return `<a href="tel:${value}" class="text-indigo-600 hover:text-indigo-800">${value}</a>`;
          };
          break;

        case "image":
          col.render = (row) => {
            const value = TableSortUtil.getNestedValue(row, col.key);
            if (!value) {return "-";}
            return `<img src="${value}" alt="" class="h-10 w-10 rounded object-cover" />`;
          };
          break;

        case "actions":
          col.sortable = false;
          col.render = (row) => {
            if (!col.actions) {return "";}
            const buttons = col.actions(row).map((action) => {
              const color = action.color || "indigo";
              return `
                <button
                  onclick="${action.onClick}"
                  class="text-${color}-600 hover:text-${color}-900 p-1"
                  title="${action.label || ""}"
                >
                  <i class="fas ${action.icon}"></i>
                </button>
              `;
            });
            return `<div class="flex items-center gap-2">${buttons.join("")}</div>`;
          };
          break;

        default:
          col.render = (row) => {
            const value = TableSortUtil.getNestedValue(row, col.key);
            return value !== null && value !== undefined ? value : "-";
          };
      }

      return col;
    });
  }

  restoreState() {
    if (this.options.defaultSort) {
      this.applySorting(
        this.options.defaultSort.column,
        this.options.defaultSort.direction || "asc"
      );
    }

    const savedSort = TableSortUtil.restoreSortState(this.options.tableId);
    if (savedSort) {
      this.applySorting(savedSort.column, savedSort.direction);
    }
  }

  applySorting(column, direction) {
    if (!column) {return;}

    this.state.currentSort = { column, direction };
    this.state.filteredData = TableSortUtil.sortData(
      this.state.filteredData,
      column,
      direction,
      "auto"
    );
    this.updateDisplayData();

    TableSortUtil.saveSortState(this.options.tableId, {
      column,
      direction,
    });
  }

  applyColumnFilters() {
    let filtered = [...this.state.originalData];

    Object.entries(this.state.activeColumnFilters).forEach(([column, value]) => {
      if (value && value !== "") {
        filtered = filtered.filter((row) => {
          const cellValue = TableSortUtil.getNestedValue(row, column);
          return String(cellValue) === String(value);
        });
      }
    });

    return filtered;
  }

  applyFilter(searchTerm) {
    this.state.searchTerm = searchTerm;

    const baseData = this.applyColumnFilters();

    if (!searchTerm || searchTerm.trim() === "") {
      this.state.filteredData = baseData;
    } else {
      this.state.filteredData = TableFilterUtil.filterData(
        baseData,
        searchTerm,
        this.options.columns
      );
    }

    if (this.state.currentSort) {
      this.applySorting(
        this.state.currentSort.column,
        this.state.currentSort.direction
      );
    } else {
      this.updateDisplayData();
    }

    TableFilterUtil.saveFilterState(this.options.tableId, {
      searchTerm,
      columnFilters: this.state.activeColumnFilters,
    });
  }

  updateDisplayData() {
    if (this.options.paginate) {
      const startIndex = (this.state.currentPage - 1) * this.options.pageSize;
      const endIndex = startIndex + this.options.pageSize;
      this.state.displayData = this.state.filteredData.slice(
        startIndex,
        endIndex
      );
    } else {
      this.state.displayData = this.state.filteredData;
    }
  }

  renderColumnFilters() {
    const hasFilters = this.options.columnFilters && this.options.columnFilters.length > 0;
    const hasColumns = this.options.columns && this.options.columns.length > 1;

    if (!hasFilters && !hasColumns) {
      return "";
    }

    let filters = "";
    if (hasFilters) {
      filters = this.options.columnFilters.map((filter) => {
        const currentValue = this.state.activeColumnFilters[filter.column] || "";

        return `
          <div class="flex flex-col">
            <label class="text-xs font-medium text-gray-700 mb-1">${filter.label || filter.column}</label>
            <select
              class="column-filter px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              data-column="${filter.column}"
            >
              <option value="">All ${filter.label || filter.column}</option>
              ${filter.options.map((opt) => `
                <option value="${opt.value}" ${currentValue === opt.value ? "selected" : ""}>
                  ${opt.label}
                </option>
              `).join("")}
            </select>
          </div>
        `;
      }).join("");
    }

    return `
      <div class="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div class="flex items-center gap-4">
          ${hasFilters ? `
            <div class="flex items-center gap-2 text-sm font-medium text-gray-700">
              <i class="fas fa-filter text-indigo-600"></i>
              <span>Filters:</span>
            </div>
            <div class="flex-1 grid grid-cols-1 md:grid-cols-${this.options.columnFilters.length} gap-4">
              ${filters}
            </div>
          ` : "<div class=\"flex-1\"></div>"}
          
          <div class="flex items-center gap-2">
            ${hasFilters ? `
              <button
                id="clearColumnFilters"
                class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <i class="fas fa-times-circle mr-1"></i>
                Clear
              </button>
            ` : ""}
            
            ${hasColumns ? `
              <div class="relative">
                <button
                  id="toggleColumnVisibility"
                  class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
                >
                  <i class="fas fa-columns"></i>
                  <span>Columns</span>
                </button>
                <div
                  id="columnVisibilityMenu"
                  class="hidden absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                >
                  <div class="px-4 py-2 text-xs font-semibold text-gray-500 uppercase border-b border-gray-200">
                    Toggle Columns
                  </div>
                  ${this.options.columns.filter(col => col.sortable !== false).map((col) => `
                    <label class="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        class="column-visibility-toggle rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2"
                        data-column="${col.key}"
                        ${this.state.visibleColumns.has(col.key) ? "checked" : ""}
                      />
                      <span class="text-sm text-gray-700">${col.label}</span>
                    </label>
                  `).join("")}
                </div>
              </div>
            ` : ""}
          </div>
        </div>
      </div>
    `;
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`Container #${this.containerId} not found`);
      return;
    }

    const pagination = this.options.paginate
      ? {
        currentPage: this.state.currentPage,
        totalPages: Math.ceil(
          this.state.filteredData.length / this.options.pageSize
        ),
        totalItems: this.state.filteredData.length,
        pageSize: this.options.pageSize,
      }
      : null;

    const columnFiltersHtml = this.renderColumnFilters();

    const visibleColumns = this.options.columns.filter(col =>
      this.state.visibleColumns.has(col.key)
    );

    const tableHtml = createTable({
      columns: visibleColumns,
      data: this.state.displayData,
      title: this.options.title,
      subtitle: this.options.subtitle,
      icon: this.options.icon,
      searchable: this.options.filterable,
      sortable: this.options.sortable,
      selectable: this.options.selectable,
      pagination,
      emptyState: this.options.emptyState,
      rowActions: this.options.rowActions,
      onRowClick: this.options.onRowClick,
    });

    const finalHtml = `
      <div class="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        ${columnFiltersHtml}
        ${tableHtml}
      </div>
    `;

    container.innerHTML = finalHtml;
  }

  attachEventListeners() {
    const tableSelector = `#${this.containerId}`;

    // Remove previous listeners to prevent duplicates
    $(document).off("change", `${tableSelector} .column-filter`);
    $(document).off("click", `${tableSelector} #clearColumnFilters`);
    $(document).off("click", `${tableSelector} #toggleColumnVisibility`);
    $(document).off("change", `${tableSelector} .column-visibility-toggle`);

    $(document).on("change", `${tableSelector} .column-filter`, (e) => {
      const column = $(e.target).data("column");
      const value = $(e.target).val();

      this.state.activeColumnFilters[column] = value;
      this.applyFilter(this.state.searchTerm);
      this.state.currentPage = 1;
      this.render();
      this.attachEventListeners();
    });

    $(document).on("click", `${tableSelector} #clearColumnFilters`, () => {
      this.state.activeColumnFilters = {};
      $(`${tableSelector} .column-filter`).val("");
      this.applyFilter(this.state.searchTerm);
      this.state.currentPage = 1;
      this.render();
      this.attachEventListeners();
    });

    $(document).on("click", `${tableSelector} #toggleColumnVisibility`, (e) => {
      e.stopPropagation();
      $(`${tableSelector} #columnVisibilityMenu`).toggleClass("hidden");
    });

    $(document).on("click", (e) => {
      if (!$(e.target).closest(`${tableSelector} #toggleColumnVisibility, ${tableSelector} #columnVisibilityMenu`).length) {
        $(`${tableSelector} #columnVisibilityMenu`).addClass("hidden");
      }
    });

    $(document).on("change", `${tableSelector} .column-visibility-toggle`, (e) => {
      const column = $(e.target).data("column");
      const isChecked = $(e.target).prop("checked");

      if (isChecked) {
        this.state.visibleColumns.add(column);
      } else {
        this.state.visibleColumns.delete(column);
      }

      this.render();
      this.attachEventListeners();
    });

    initTableFeatures(tableSelector, {
      onSort: (column, direction) => {
        if (direction === "none") {
          this.state.currentSort = null;
          this.state.filteredData = [...this.state.originalData];
          if (this.state.searchTerm) {
            this.applyFilter(this.state.searchTerm);
          } else {
            this.updateDisplayData();
            this.render();
          }
        } else {
          this.applySorting(column, direction);
          this.render();
        }
      },
      onSearch: (searchTerm) => {
        this.applyFilter(searchTerm);
        this.state.currentPage = 1;
        this.render();
      },
      onPageChange: (page) => {
        this.state.currentPage = page;
        this.updateDisplayData();
        this.render();
      },
      onSelect: (selectedIds) => {
        this.state.selectedRows = new Set(selectedIds);
        if (this.options.onSelect) {
          this.options.onSelect(Array.from(selectedIds));
        }
      },
      onRowClick: this.options.onRowClick
        ? (rowIndex) => {
          const row = this.state.displayData[rowIndex];
          this.options.onRowClick(row);
        }
        : null,
    });
  }

  updateData(newData) {
    this.state.originalData = [...newData];
    this.applyFilter(this.state.searchTerm);
    this.state.currentPage = 1;
    this.render();
  }

  getSelectedRows() {
    return Array.from(this.state.selectedRows);
  }

  clearSelection() {
    this.state.selectedRows.clear();
    const checkboxes = document.querySelectorAll(
      `#${this.containerId} .table-row-select`
    );
    checkboxes.forEach((cb) => (cb.checked = false));
  }

  refresh() {
    this.render();
  }

  destroy() {
    const container = document.getElementById(this.containerId);
    if (container) {
      container.innerHTML = "";
    }
  }
}

export function createDataTable(containerId, options) {
  return new DataTable(containerId, options);
}
