import { DEFAULT_TICKET_TYPES } from "/src/data/mockData.js";

const STORAGE_KEY = "ticketTypes";

export const ticketTypeService = {
  getAll() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Error parsing ticket types:", e);
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TICKET_TYPES));
    return DEFAULT_TICKET_TYPES;
  },

  getById(id) {
    const types = this.getAll();
    console.log("getById - Looking for ID:", id, "Type:", typeof id);
    console.log(
      "Available IDs:",
      types.map((t) => ({ id: t.id, type: typeof t.id }))
    );
    const found = types.find(
      (t) => t.id === id || t.id == id || t.id === String(id)
    );
    console.log("Found:", found);
    return found;
  },

  create(typeData) {
    const types = this.getAll();
    const newType = {
      ...typeData,
      id: Date.now().toString(),
      order: types.length + 1,
    };
    types.push(newType);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(types));
    return newType;
  },

  update(id, typeData) {
    const types = this.getAll();
    const index = types.findIndex((t) => t.id === id);
    if (index !== -1) {
      types[index] = { ...types[index], ...typeData };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(types));
      return types[index];
    }
    return null;
  },

  delete(id) {
    const types = this.getAll();
    const filtered = types.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  },

  reorder(typeIds) {
    const types = this.getAll();
    const reordered = typeIds.map((id, index) => {
      const type = types.find((t) => t.id === id);
      return { ...type, order: index + 1 };
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reordered));
    return reordered;
  },

  reset() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TICKET_TYPES));
    return DEFAULT_TICKET_TYPES;
  },
};
