import { MOCK_VENUES } from "/src/data/mockData.js";

const STORAGE_KEY = "venues";

export const venueService = {
  async getAll() {
    const stored = localStorage.getItem(STORAGE_KEY);
    const customVenues = stored ? JSON.parse(stored) : [];
    return [...MOCK_VENUES, ...customVenues];
  },

  async getById(id) {
    const venues = await this.getAll();
    return venues.find((v) => v.id === id);
  },

  async create(venueData) {
    const stored = localStorage.getItem(STORAGE_KEY);
    const venues = stored ? JSON.parse(stored) : [];

    const newVenue = {
      ...venueData,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    };

    venues.push(newVenue);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(venues));
    return newVenue;
  },

  async update(id, venueData) {
    const stored = localStorage.getItem(STORAGE_KEY);
    const venues = stored ? JSON.parse(stored) : [];

    const index = venues.findIndex((v) => v.id === id);
    if (index !== -1) {
      venues[index] = {
        ...venues[index],
        ...venueData,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(venues));
      return venues[index];
    }

    return null;
  },

  async delete(id) {
    const stored = localStorage.getItem(STORAGE_KEY);
    const venues = stored ? JSON.parse(stored) : [];

    const filtered = venues.filter((v) => v.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  },

  async clone(id) {
    const venue = await this.getById(id);
    if (!venue) return null;

    const clonedVenue = {
      ...venue,
      id: Date.now(),
      name: `${venue.name} (Copy)`,
      createdAt: new Date().toISOString(),
    };

    const stored = localStorage.getItem(STORAGE_KEY);
    const venues = stored ? JSON.parse(stored) : [];
    venues.push(clonedVenue);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(venues));

    return clonedVenue;
  },

  async exportVenue(id) {
    const venue = await this.getById(id);
    if (!venue) return null;

    const dataStr = JSON.stringify(venue, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `venue-${venue.name
      .replace(/\s+/g, "-")
      .toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    return true;
  },

  async importVenue(jsonData) {
    const venue = JSON.parse(jsonData);
    delete venue.id;
    return await this.create(venue);
  },

  async search(query, filters = {}) {
    const venues = await this.getAll();

    return venues.filter((venue) => {
      const matchesQuery =
        !query ||
        venue.name.toLowerCase().includes(query.toLowerCase()) ||
        venue.address.toLowerCase().includes(query.toLowerCase());

      const matchesStatus = !filters.status || venue.status === filters.status;

      const matchesCapacity =
        (!filters.minCapacity || venue.capacity >= filters.minCapacity) &&
        (!filters.maxCapacity || venue.capacity <= filters.maxCapacity);

      return matchesQuery && matchesStatus && matchesCapacity;
    });
  },

  calculateCapacity(layout) {
    if (!layout?.sections) return 0;
    return layout.sections.reduce((total, section) => {
      return total + section.rows * section.seatsPerRow;
    }, 0);
  },
};
