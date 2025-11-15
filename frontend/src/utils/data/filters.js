import _ from "lodash";

export function createDebounceSearch(callback, delay = 300) {
  return _.debounce(callback, delay);
}

export function applyFilters(data, filters) {
  let filtered = [...data];

  Object.keys(filters).forEach((key) => {
    const filterValue = filters[key];

    if (!filterValue || filterValue === "") return;

    filtered = filtered.filter((item) => {
      const itemValue = _.get(item, key);

      if (typeof itemValue === "string") {
        return itemValue.toLowerCase().includes(filterValue.toLowerCase());
      }

      if (typeof itemValue === "number") {
        return itemValue === parseFloat(filterValue);
      }

      return itemValue === filterValue;
    });
  });

  return filtered;
}

export function createFilterConfig(fields) {
  const config = {
    fields: {},
    searchFields: [],
  };

  fields.forEach((field) => {
    if (typeof field === "string") {
      config.fields[field] = { type: "text" };
    } else {
      config.fields[field.name] = {
        type: field.type || "text",
        options: field.options || null,
        label: field.label || field.name,
      };
    }
  });

  return config;
}

export function applySearchFilter(data, searchTerm, searchFields) {
  if (!searchTerm || searchTerm.trim() === "") {
    return data;
  }

  const search = searchTerm.toLowerCase();

  return data.filter((item) => {
    return searchFields.some((field) => {
      const value = _.get(item, field);
      return value && value.toString().toLowerCase().includes(search);
    });
  });
}

export function applySingleFilter(data, field, value) {
  if (!value || value === "") return data;

  return data.filter((item) => {
    const itemValue = _.get(item, field);
    if (typeof itemValue === "string") {
      return itemValue.toLowerCase() === value.toLowerCase();
    }
    return itemValue === value;
  });
}

export function combineFilters(data, filterFunctions) {
  let result = data;

  filterFunctions.forEach((fn) => {
    result = fn(result);
  });

  return result;
}
