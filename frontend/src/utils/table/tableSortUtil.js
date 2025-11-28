import dayjs from "dayjs";

export const TableSortUtil = {
  sortData(data, column, direction = "asc", type = "auto") {
    if (!data || !Array.isArray(data) || data.length === 0) {return data;}

    const sortedData = [...data];
    const detectedType = type === "auto" ? this.detectType(data, column) : type;

    sortedData.sort((a, b) => {
      const aVal = this.getNestedValue(a, column);
      const bVal = this.getNestedValue(b, column);

      let comparison = 0;

      switch (detectedType) {
        case "number":
          comparison = this.compareNumbers(aVal, bVal);
          break;
        case "date":
          comparison = this.compareDates(aVal, bVal);
          break;
        case "boolean":
          comparison = this.compareBooleans(aVal, bVal);
          break;
        case "string":
        default:
          comparison = this.compareStrings(aVal, bVal);
          break;
      }

      return direction === "asc" ? comparison : -comparison;
    });

    return sortedData;
  },

  sortByMultiple(data, sortConfigs) {
    if (!data || !Array.isArray(data) || data.length === 0) {return data;}
    if (!sortConfigs || sortConfigs.length === 0) {return data;}

    const sortedData = [...data];

    sortedData.sort((a, b) => {
      for (const config of sortConfigs) {
        const { column, direction = "asc", type = "auto" } = config;
        const detectedType =
          type === "auto" ? this.detectType(data, column) : type;

        const aVal = this.getNestedValue(a, column);
        const bVal = this.getNestedValue(b, column);

        let comparison = 0;

        switch (detectedType) {
          case "number":
            comparison = this.compareNumbers(aVal, bVal);
            break;
          case "date":
            comparison = this.compareDates(aVal, bVal);
            break;
          case "boolean":
            comparison = this.compareBooleans(aVal, bVal);
            break;
          case "string":
          default:
            comparison = this.compareStrings(aVal, bVal);
            break;
        }

        const result = direction === "asc" ? comparison : -comparison;
        if (result !== 0) {return result;}
      }
      return 0;
    });

    return sortedData;
  },

  detectType(data, column) {
    const samples = data.slice(0, 10).map((row) => this.getNestedValue(row, column));
    const nonNull = samples.filter((val) => val !== null && val !== undefined);

    if (nonNull.length === 0) {return "string";}

    if (nonNull.every((val) => typeof val === "boolean")) {
      return "boolean";
    }

    if (nonNull.every((val) => typeof val === "number" && !isNaN(val))) {
      return "number";
    }

    if (nonNull.some((val) => dayjs(val).isValid() && this.isDateString(val))) {
      return "date";
    }

    return "string";
  },

  isDateString(value) {
    if (typeof value !== "string") {return false;}
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}$/,
      /^\d{4}\/\d{2}\/\d{2}$/,
      /^\d{2}-\d{2}-\d{4}$/,
      /^\d{2}\/\d{2}\/\d{4}$/,
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
    ];
    return datePatterns.some((pattern) => pattern.test(value));
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

  compareStrings(a, b) {
    const aStr = String(a ?? "").toLowerCase();
    const bStr = String(b ?? "").toLowerCase();
    return aStr.localeCompare(bStr);
  },

  compareNumbers(a, b) {
    const aNum = parseFloat(a);
    const bNum = parseFloat(b);
    if (isNaN(aNum) && isNaN(bNum)) {return 0;}
    if (isNaN(aNum)) {return 1;}
    if (isNaN(bNum)) {return -1;}
    return aNum - bNum;
  },

  compareDates(a, b) {
    const aDate = dayjs(a);
    const bDate = dayjs(b);
    if (!aDate.isValid() && !bDate.isValid()) {return 0;}
    if (!aDate.isValid()) {return 1;}
    if (!bDate.isValid()) {return -1;}
    return aDate.valueOf() - bDate.valueOf();
  },

  compareBooleans(a, b) {
    const aBool = Boolean(a);
    const bBool = Boolean(b);
    return aBool === bBool ? 0 : aBool ? -1 : 1;
  },

  saveSortState(tableId, config) {
    try {
      localStorage.setItem(
        `table_sort_${tableId}`,
        JSON.stringify(config)
      );
    } catch (error) {
      console.error("Failed to save sort state:", error);
    }
  },

  restoreSortState(tableId) {
    try {
      const saved = localStorage.getItem(`table_sort_${tableId}`);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error("Failed to restore sort state:", error);
      return null;
    }
  },

  clearSortState(tableId) {
    try {
      localStorage.removeItem(`table_sort_${tableId}`);
    } catch (error) {
      console.error("Failed to clear sort state:", error);
    }
  },
};
