const STORAGE_KEY = "seatTemplates";

export const templateService = {
  async saveTemplate(name, description, layout, seatDetails, tags = []) {
    const templates = await this.getAll();

    const template = {
      id: Date.now(),
      name,
      description,
      layout,
      seatDetails,
      tags,
      preview: this.generateThumbnail(layout, seatDetails),
      createdAt: new Date().toISOString(),
    };

    templates.push(template);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    return template;
  },

  async getAll() {
    const stored = localStorage.getItem(STORAGE_KEY);
    const customTemplates = stored ? JSON.parse(stored) : [];
    const defaultTemplates = await this.getDefaultTemplates();
    return [...defaultTemplates, ...customTemplates];
  },

  async getById(id) {
    const templates = await this.getAll();
    return templates.find((t) => t.id === id);
  },

  async delete(id) {
    const stored = localStorage.getItem(STORAGE_KEY);
    const templates = stored ? JSON.parse(stored) : [];
    const filtered = templates.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  },

  async applyTemplate(templateId, showtime) {
    const template = await this.getById(templateId);
    if (!template) return null;

    return {
      ...showtime,
      layout: template.layout,
      seatDetails: JSON.parse(JSON.stringify(template.seatDetails)),
    };
  },

  async search(query, tags = []) {
    const templates = await this.getAll();

    return templates.filter((template) => {
      const matchesQuery =
        !query ||
        template.name.toLowerCase().includes(query.toLowerCase()) ||
        template.description.toLowerCase().includes(query.toLowerCase());

      const matchesTags =
        tags.length === 0 || tags.some((tag) => template.tags.includes(tag));

      return matchesQuery && matchesTags;
    });
  },

  generateThumbnail(layout, seatDetails) {
    const rows = layout.rows || 8;
    const seatsPerRow = layout.seatsPerRow || 10;

    const availableCount = Object.values(seatDetails).filter(
      (s) => s.status === "available"
    ).length;
    const blockedCount = Object.values(seatDetails).filter(
      (s) => s.status === "blocked"
    ).length;
    const vipCount = Object.values(seatDetails).filter(
      (s) => s.status === "vip"
    ).length;

    return {
      rows,
      seatsPerRow,
      totalSeats: rows * seatsPerRow,
      stats: {
        available: availableCount,
        blocked: blockedCount,
        vip: vipCount,
      },
    };
  },

  async exportTemplate(id) {
    const template = await this.getById(id);
    if (!template) return null;

    const dataStr = JSON.stringify(template, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `template-${template.name
      .replace(/\s+/g, "-")
      .toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    return true;
  },

  async importTemplate(jsonData) {
    const template = JSON.parse(jsonData);
    delete template.id;

    const templates = await this.getAll();
    const newTemplate = {
      ...template,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    };

    templates.push(newTemplate);
    const customTemplates = templates.filter((t) => !t.isDefault);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customTemplates));

    return newTemplate;
  },

  async getDefaultTemplates() {
    return [
      {
        id: "default-small",
        name: "Small Theater",
        description: "Intimate theater seating for 24 guests",
        layout: { rows: 4, seatsPerRow: 6 },
        seatDetails: this.generateDefaultSeats(4, 6),
        tags: ["Theater", "Small"],
        preview: { rows: 4, seatsPerRow: 6, totalSeats: 24, stats: {} },
        isDefault: true,
        createdAt: "2024-01-01T00:00:00.000Z",
      },
      {
        id: "default-medium",
        name: "Medium Hall",
        description: "Standard concert hall layout for 80 guests",
        layout: { rows: 8, seatsPerRow: 10 },
        seatDetails: this.generateDefaultSeats(8, 10),
        tags: ["Concert", "Medium"],
        preview: { rows: 8, seatsPerRow: 10, totalSeats: 80, stats: {} },
        isDefault: true,
        createdAt: "2024-01-01T00:00:00.000Z",
      },
      {
        id: "default-large",
        name: "Large Arena",
        description: "Spacious arena seating for 300 guests",
        layout: { rows: 15, seatsPerRow: 20 },
        seatDetails: this.generateDefaultSeats(15, 20),
        tags: ["Arena", "Large"],
        preview: { rows: 15, seatsPerRow: 20, totalSeats: 300, stats: {} },
        isDefault: true,
        createdAt: "2024-01-01T00:00:00.000Z",
      },
    ];
  },

  generateDefaultSeats(rows, seatsPerRow) {
    const seatDetails = {};
    for (let i = 0; i < rows; i++) {
      const rowLetter = String.fromCharCode(65 + i);
      for (let j = 1; j <= seatsPerRow; j++) {
        const seatId = `${rowLetter}${j}`;
        seatDetails[seatId] = { status: "available" };
      }
    }
    return seatDetails;
  },
};
