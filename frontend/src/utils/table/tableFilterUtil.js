export const TableFilterUtil = {
  filterData(data, searchTerm, columns) {
    if (!data || !Array.isArray(data)) {return data;}
    if (!searchTerm || searchTerm.trim() === "") {return data;}

    const term = searchTerm.toLowerCase().trim();

    return data.filter((row) => {
      return columns.some((column) => {
        const value = this.getNestedValue(row, column.key);
        const searchableValue = this.getSearchableValue(value, column.type);
        return searchableValue.includes(term);
      });
    });
  },

  filterByColumn(data, columnKey, filterValue, filterType = "exact") {
    if (!data || !Array.isArray(data)) {return data;}
    if (!filterValue) {return data;}

    return data.filter((row) => {
      const value = this.getNestedValue(row, columnKey);

      switch (filterType) {
        case "exact":
          return value === filterValue;
        case "contains":
          return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
        case "startsWith":
          return String(value).toLowerCase().startsWith(String(filterValue).toLowerCase());
        case "endsWith":
          return String(value).toLowerCase().endsWith(String(filterValue).toLowerCase());
        case "range":
          return value >= filterValue.min && value <= filterValue.max;
        case "in":
          return Array.isArray(filterValue) && filterValue.includes(value);
        default:
          return true;
      }
    });
  },

  filterByMultiple(data, filters) {
    if (!data || !Array.isArray(data)) {return data;}
    if (!filters || Object.keys(filters).length === 0) {return data;}

    return data.filter((row) => {
      return Object.entries(filters).every(([columnKey, filter]) => {
        const value = this.getNestedValue(row, columnKey);
        const { value: filterValue, type = "exact" } = filter;

        switch (type) {
          case "exact":
            return value === filterValue;
          case "contains":
            return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
          case "range":
            return value >= filterValue.min && value <= filterValue.max;
          case "in":
            return Array.isArray(filterValue) && filterValue.includes(value);
          default:
            return true;
        }
      });
    });
  },

  getNestedValue(obj, path) {
    if (!path) {return obj;}
    const keys = path.split(".");
    let value = obj;
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) {return null;}
    }
    return value;
  },

  getSearchableValue(value, type) {
    if (value === null || value === undefined) {return "";}

    switch (type) {
      case "date":
        return String(value);
      case "number":
      case "currency":
        return String(value);
      case "boolean":
        return value ? "yes true" : "no false";
      case "array":
        return Array.isArray(value) ? value.join(" ") : "";
      case "object":
        return JSON.stringify(value);
      default:
        return String(value).toLowerCase();
    }
  },

  saveFilterState(tableId, filters) {
    try {
      localStorage.setItem(
        `table_filter_${tableId}`,
        JSON.stringify(filters)
      );
    } catch (error) {
      console.error("Failed to save filter state:", error);
    }
  },

  restoreFilterState(tableId) {
    try {
      const saved = localStorage.getItem(`table_filter_${tableId}`);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error("Failed to restore filter state:", error);
      return null;
    }
  },

  clearFilterState(tableId) {
    try {
      localStorage.removeItem(`table_filter_${tableId}`);
    } catch (error) {
      console.error("Failed to clear filter state:", error);
    }
  },
};
