import {
  MOCK_USERS,
  MOCK_PERFORMANCES,
  MOCK_SEATS,
  MOCK_BOOKINGS,
  MOCK_TRANSACTIONS,
  MOCK_VENUES,
} from "/src/data/mockData.js";
import { storage } from "/src/services/storageService.js";

const USE_MOCK_DATA = true;

export const performanceService = {
  async getAll() {
    if (USE_MOCK_DATA) {
      const storedPerformances = storage.getItem("performances", []);
      const allPerformances = [...MOCK_PERFORMANCES, ...storedPerformances];
      const uniquePerformances = allPerformances.reduce((acc, perf) => {
        if (!acc.some((p) => p.id === perf.id)) {
          acc.push(perf);
        }
        return acc;
      }, []);
      return Promise.resolve(uniquePerformances);
    }
    const response = await fetch("/api/performances");
    return response.json();
  },

  async getById(id) {
    if (USE_MOCK_DATA) {
      const storedPerformances = storage.getItem("performances", []);
      const allPerformances = [...MOCK_PERFORMANCES, ...storedPerformances];
      const performance = allPerformances.find((p) => p.id === parseInt(id));
      return Promise.resolve(performance);
    }
    const response = await fetch(`/api/performances/${id}`);
    return response.json();
  },

  async search(query) {
    if (USE_MOCK_DATA) {
      const storedPerformances = storage.getItem("performances", []);
      const allPerformances = [...MOCK_PERFORMANCES, ...storedPerformances];
      const filtered = allPerformances.filter(
        (p) =>
          p.title.toLowerCase().includes(query.toLowerCase()) ||
          p.composer.toLowerCase().includes(query.toLowerCase()) ||
          (p.venue && p.venue.toLowerCase().includes(query.toLowerCase()))
      );
      return Promise.resolve(filtered);
    }
    const response = await fetch(`/api/performances/search?q=${query}`);
    return response.json();
  },

  async create(performanceData) {
    if (USE_MOCK_DATA) {
      const storedPerformances = storage.getItem("performances", []);
      const newPerformance = {
        ...performanceData,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      };
      storedPerformances.push(newPerformance);
      storage.setItem("performances", storedPerformances);
      return Promise.resolve(newPerformance);
    }
    const response = await fetch("/api/performances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(performanceData),
    });
    return response.json();
  },

  async update(id, performanceData) {
    if (USE_MOCK_DATA) {
      const storedPerformances = storage.getItem("performances", []);
      const index = storedPerformances.findIndex((p) => p.id === id);

      if (index !== -1) {
        storedPerformances[index] = {
          ...storedPerformances[index],
          ...performanceData,
        };
        storage.setItem("performances", storedPerformances);
        return Promise.resolve(storedPerformances[index]);
      }

      const mockIndex = MOCK_PERFORMANCES.findIndex((p) => p.id === id);
      if (mockIndex !== -1) {
        const updated = { ...MOCK_PERFORMANCES[mockIndex], ...performanceData };
        storedPerformances.push(updated);
        storage.setItem("performances", storedPerformances);
        return Promise.resolve(updated);
      }

      return Promise.reject(new Error("Performance not found"));
    }
    const response = await fetch(`/api/performances/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(performanceData),
    });
    return response.json();
  },

  async delete(id) {
    if (USE_MOCK_DATA) {
      const storedPerformances = storage.getItem("performances", []);
      const filtered = storedPerformances.filter((p) => p.id !== id);
      storage.setItem("performances", filtered);
      return Promise.resolve({ success: true });
    }
    const response = await fetch(`/api/performances/${id}`, {
      method: "DELETE",
    });
    return response.json();
  },
};

export const seatService = {
  async getByPerformanceId(performanceId) {
    if (USE_MOCK_DATA) {
      const seats = MOCK_SEATS.filter(
        (s) => s.performanceId === parseInt(performanceId)
      );
      return Promise.resolve(seats);
    }
    const response = await fetch(`/api/performances/${performanceId}/seats`);
    return response.json();
  },

  async getById(id) {
    if (USE_MOCK_DATA) {
      const seat = MOCK_SEATS.find((s) => s.id === parseInt(id));
      return Promise.resolve(seat);
    }
    const response = await fetch(`/api/seats/${id}`);
    return response.json();
  },
};

export const bookingService = {
  async getAll() {
    if (USE_MOCK_DATA) {
      return Promise.resolve(MOCK_BOOKINGS);
    }
    const token = localStorage.getItem("token");
    const response = await fetch("/api/bookings", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  },

  async getById(id) {
    if (USE_MOCK_DATA) {
      const booking = MOCK_BOOKINGS.find((b) => b.id === parseInt(id));
      return Promise.resolve(booking);
    }
    const token = localStorage.getItem("token");
    const response = await fetch(`/api/bookings/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  },

  async create(bookingData) {
    if (USE_MOCK_DATA) {
      const newBooking = {
        id: MOCK_BOOKINGS.length + 1,
        bookingRef: `BK-${new Date().getFullYear()}-${Math.floor(
          Math.random() * 900000 + 100000
        )}`,
        ...bookingData,
        status: "confirmed",
        bookedAt: new Date().toISOString(),
      };
      MOCK_BOOKINGS.push(newBooking);
      return Promise.resolve(newBooking);
    }
    const token = localStorage.getItem("token");
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(bookingData),
    });
    return response.json();
  },
};

export const transactionService = {
  async getAll() {
    if (USE_MOCK_DATA) {
      return Promise.resolve(MOCK_TRANSACTIONS);
    }
    const token = localStorage.getItem("token");
    const response = await fetch("/api/transactions", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  },

  async getByUserId(userId) {
    if (USE_MOCK_DATA) {
      return Promise.resolve(MOCK_TRANSACTIONS);
    }
    const token = localStorage.getItem("token");
    const response = await fetch(`/api/users/${userId}/transactions`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  },
};

export const userService = {
  async getAll() {
    if (USE_MOCK_DATA) {
      return Promise.resolve(Object.values(MOCK_USERS));
    }
    const token = localStorage.getItem("token");
    const response = await fetch("/api/users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  },

  async getById(id) {
    if (USE_MOCK_DATA) {
      const user = Object.values(MOCK_USERS).find((u) => u.id === parseInt(id));
      return Promise.resolve(user);
    }
    const token = localStorage.getItem("token");
    const response = await fetch(`/api/users/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  },

  async update(id, userData) {
    if (USE_MOCK_DATA) {
      return Promise.resolve({ ...userData, id });
    }
    const token = localStorage.getItem("token");
    const response = await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });
    return response.json();
  },
};

export const authService = {
  async login(username, password) {
    if (USE_MOCK_DATA) {
      const user = Object.values(MOCK_USERS).find(
        (u) => u.username === username && u.password === password
      );
      if (user) {
        const { password, ...userWithoutPassword } = user;
        return Promise.resolve({
          user: userWithoutPassword,
          token: `mock-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2)}`,
        });
      }
      return Promise.reject(new Error("Invalid credentials"));
    }
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
      throw new Error("Invalid credentials");
    }
    return response.json();
  },

  async register(userData) {
    if (USE_MOCK_DATA) {
      const newUser = {
        id: Object.keys(MOCK_USERS).length + 1,
        ...userData,
        createdAt: new Date().toISOString(),
      };
      const { password, ...userWithoutPassword } = newUser;
      return Promise.resolve({
        user: userWithoutPassword,
        token: `mock-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      });
    }
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      throw new Error("Registration failed");
    }
    return response.json();
  },
};

export const venueService = {
  async getAll() {
    if (USE_MOCK_DATA) {
      return Promise.resolve([...MOCK_VENUES]);
    }
    const response = await fetch("/api/venues");
    return response.json();
  },

  async getById(id) {
    if (USE_MOCK_DATA) {
      return Promise.resolve(MOCK_VENUES.find((v) => v.id === id));
    }
    const response = await fetch(`/api/venues/${id}`);
    return response.json();
  },

  async create(venue) {
    if (USE_MOCK_DATA) {
      const newVenue = { ...venue, id: MOCK_VENUES.length + 1 };
      MOCK_VENUES.push(newVenue);
      return Promise.resolve(newVenue);
    }
    const response = await fetch("/api/venues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(venue),
    });
    return response.json();
  },

  async update(id, venue) {
    if (USE_MOCK_DATA) {
      const index = MOCK_VENUES.findIndex((v) => v.id === id);
      if (index !== -1) {
        MOCK_VENUES[index] = { ...MOCK_VENUES[index], ...venue };
        return Promise.resolve(MOCK_VENUES[index]);
      }
      return Promise.reject(new Error("Venue not found"));
    }
    const response = await fetch(`/api/venues/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(venue),
    });
    return response.json();
  },

  async delete(id) {
    if (USE_MOCK_DATA) {
      const index = MOCK_VENUES.findIndex((v) => v.id === id);
      if (index !== -1) {
        MOCK_VENUES.splice(index, 1);
        return Promise.resolve({ success: true });
      }
      return Promise.reject(new Error("Venue not found"));
    }
    const response = await fetch(`/api/venues/${id}`, { method: "DELETE" });
    return response.json();
  },
};

export function switchToApiMode() {
  console.warn(
    "To switch to API mode, change USE_MOCK_DATA to false in dataService.js"
  );
}

export function isMockMode() {
  return USE_MOCK_DATA;
}
