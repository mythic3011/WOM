import dayjs from "dayjs";

export const performanceHelpers = {
  filterPerformances(performances, filters) {
    if (!performances) {return [];}

    let filtered = [...performances];

    if (filters.genre) {
      filtered = filtered.filter((p) => p.genre === filters.genre);
    }

    if (filters.composer) {
      filtered = filtered.filter((p) =>
        p.composer?.toLowerCase().includes(filters.composer.toLowerCase())
      );
    }

    if (filters.venue) {
      filtered = filtered.filter((p) => p.venueId === filters.venue);
    }

    if (filters.dateFrom) {
      const dateFrom = dayjs(filters.dateFrom);
      filtered = filtered.filter((p) => dayjs(p.date).isAfter(dateFrom));
    }

    if (filters.dateTo) {
      const dateTo = dayjs(filters.dateTo);
      filtered = filtered.filter((p) => dayjs(p.date).isBefore(dateTo));
    }

    if (filters.status) {
      filtered = filtered.filter(
        (p) => p.ticketingInfo?.status === filters.status
      );
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title?.toLowerCase().includes(search) ||
          p.composer?.toLowerCase().includes(search) ||
          p.description?.toLowerCase().includes(search)
      );
    }

    return filtered;
  },

  sortPerformances(performances, sortBy = "date-asc") {
    if (!performances) {return [];}

    const sorted = [...performances];

    switch (sortBy) {
      case "date-asc":
        return sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
      case "date-desc":
        return sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
      case "title-asc":
        return sorted.sort((a, b) =>
          (a.title || "").localeCompare(b.title || "")
        );
      case "title-desc":
        return sorted.sort((a, b) =>
          (b.title || "").localeCompare(a.title || "")
        );
      case "composer-asc":
        return sorted.sort((a, b) =>
          (a.composer || "").localeCompare(b.composer || "")
        );
      case "composer-desc":
        return sorted.sort((a, b) =>
          (b.composer || "").localeCompare(a.composer || "")
        );
      case "popularity":
        return sorted.sort(
          (a, b) =>
            (b.ticketingInfo?.soldCount || 0) -
            (a.ticketingInfo?.soldCount || 0)
        );
      default:
        return sorted;
    }
  },

  categorizeByDate(performances) {
    if (!performances) {return { upcoming: [], past: [], today: [] };}

    const now = dayjs();
    const today = now.startOf("day");
    const tomorrow = today.add(1, "day");

    return performances.reduce(
      (categories, performance) => {
        const perfDate = dayjs(performance.date);

        if (perfDate.isSame(today, "day")) {
          categories.today.push(performance);
        } else if (perfDate.isAfter(now)) {
          categories.upcoming.push(performance);
        } else {
          categories.past.push(performance);
        }

        return categories;
      },
      { upcoming: [], past: [], today: [] }
    );
  },

  calculateAvailability(performance) {
    if (!performance.ticketingInfo) {
      return {
        total: 0,
        sold: 0,
        available: 0,
        percentage: 0,
        status: "unknown",
      };
    }

    const total = performance.ticketingInfo.totalSeats || 0;
    const sold = performance.ticketingInfo.soldCount || 0;
    const available = total - sold;
    const percentage = total > 0 ? (sold / total) * 100 : 0;

    let status = "available";
    if (percentage >= 100) {status = "sold_out";}
    else if (percentage >= 90) {status = "almost_full";}
    else if (percentage >= 70) {status = "filling_fast";}

    return {
      total,
      sold,
      available,
      percentage: Math.round(percentage),
      status,
    };
  },

  getStatusInfo(status) {
    const statusMap = {
      on_sale: {
        label: "On Sale",
        color: "green",
        icon: "fa-ticket-alt",
        description: "Tickets available",
      },
      sold_out: {
        label: "Sold Out",
        color: "red",
        icon: "fa-times-circle",
        description: "No tickets available",
      },
      almost_full: {
        label: "Almost Full",
        color: "orange",
        icon: "fa-exclamation-triangle",
        description: "Limited seats remaining",
      },
      filling_fast: {
        label: "Filling Fast",
        color: "yellow",
        icon: "fa-fire",
        description: "Selling quickly",
      },
      upcoming: {
        label: "Coming Soon",
        color: "blue",
        icon: "fa-calendar",
        description: "Sales open soon",
      },
      ended: {
        label: "Ended",
        color: "gray",
        icon: "fa-check",
        description: "Performance completed",
      },
      cancelled: {
        label: "Cancelled",
        color: "red",
        icon: "fa-ban",
        description: "Performance cancelled",
      },
    };

    return (
      statusMap[status] || {
        label: status || "Unknown",
        color: "gray",
        icon: "fa-question-circle",
        description: "Status unknown",
      }
    );
  },

  searchPerformances(performances, query) {
    if (!query || !performances) {return performances;}

    const searchTerm = query.toLowerCase().trim();

    return performances.filter(
      (p) =>
        p.title?.toLowerCase().includes(searchTerm) ||
        p.composer?.toLowerCase().includes(searchTerm) ||
        p.genre?.toLowerCase().includes(searchTerm) ||
        p.description?.toLowerCase().includes(searchTerm) ||
        p.venue?.name?.toLowerCase().includes(searchTerm)
    );
  },

  getRecommendations(performances, userHistory = []) {
    if (!performances || performances.length === 0) {return [];}

    const userGenres = new Set(userHistory.map((p) => p.genre).filter(Boolean));
    const userComposers = new Set(
      userHistory.map((p) => p.composer).filter(Boolean)
    );

    const scored = performances.map((performance) => {
      let score = 0;

      if (userGenres.has(performance.genre)) {score += 3;}
      if (userComposers.has(performance.composer)) {score += 2;}

      const availability = this.calculateAvailability(performance);
      if (availability.status === "filling_fast") {score += 1;}

      const daysUntil = dayjs(performance.date).diff(dayjs(), "day");
      if (daysUntil >= 7 && daysUntil <= 30) {score += 1;}

      return { ...performance, recommendationScore: score };
    });

    return scored
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, 6);
  },

  groupByGenre(performances) {
    if (!performances) {return {};}

    return performances.reduce((groups, performance) => {
      const genre = performance.genre || "Other";
      if (!groups[genre]) {
        groups[genre] = [];
      }
      groups[genre].push(performance);
      return groups;
    }, {});
  },

  groupByVenue(performances) {
    if (!performances) {return {};}

    return performances.reduce((groups, performance) => {
      const venueName = performance.venue?.name || "Unknown";
      if (!groups[venueName]) {
        groups[venueName] = [];
      }
      groups[venueName].push(performance);
      return groups;
    }, {});
  },

  calculateSeatAvailability(totalSeats, availableSeats) {
    if (!totalSeats || totalSeats <= 0) {return 0;}
    return (availableSeats / totalSeats) * 100;
  },

  getAvailabilityCategory(availabilityPercent) {
    if (availabilityPercent === 0) {return "sold_out";}
    if (availabilityPercent > 0 && availabilityPercent < 10) {return "low";}
    if (availabilityPercent >= 10 && availabilityPercent <= 50) {return "medium";}
    return "high";
  },

  getSeatAvailabilityInfo(performance) {
    const totalSeats =
      performance.totalSeats || performance.ticketingInfo?.totalSeats || 0;
    const availableSeats =
      performance.availableSeats ??
      performance.ticketingInfo?.availableSeats ??
      0;
    const bookedSeats = totalSeats - availableSeats;
    const availabilityPercent = this.calculateSeatAvailability(
      totalSeats,
      availableSeats
    );
    const category = this.getAvailabilityCategory(availabilityPercent);

    return {
      totalSeats,
      availableSeats,
      bookedSeats,
      availabilityPercent,
      category,
    };
  },

  isBookable(performance) {
    const status =
      performance.ticketingInfo?.status || performance.status || "upcoming";
    const info = this.getSeatAvailabilityInfo(performance);

    return (
      ["on_sale", "early_bird", "pre_order"].includes(status) &&
      info.availableSeats > 0
    );
  },

  formatPerformanceDate(dateTime) {
    if (!dateTime) {return "Date TBA";}
    const date = new Date(dateTime);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  },

  formatPerformanceTime(dateTime) {
    if (!dateTime) {return "";}
    const date = new Date(dateTime);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  },

  getPriceRange(performance) {
    const showtimes = performance.showtimes || [];
    if (showtimes.length === 0) {return { min: 0, max: 0 };}

    let min = Infinity;
    let max = -Infinity;

    showtimes.forEach((showtime) => {
      const sections = showtime.pricing?.sections || [];
      sections.forEach((section) => {
        if (section.price < min) {min = section.price;}
        if (section.price > max) {max = section.price;}
      });
    });

    if (min === Infinity) {return { min: 0, max: 0 };}
    return { min, max };
  },

  formatPriceRange(performance) {
    const { min, max } = this.getPriceRange(performance);
    if (min === 0 && max === 0) {return "Price TBA";}
    if (min === max) {return `HKD ${min}`;}
    return `HKD ${min} - ${max}`;
  },
};
