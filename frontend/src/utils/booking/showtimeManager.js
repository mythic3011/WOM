export const showtimeManager = {
  createEmptyShowtime(ticketTypes = []) {
    return {
      id: Date.now(),
      dateTime: "",
      venueId: "",
      venueName: "",
      pricing: {
        sections: [],
      },
      seatLayout: {
        rows: 5,
        seatsPerRow: 8,
      },
      seatDetails: {},
      pricingZones: [],
    };
  },

  createPricingSection(sectionNumber, ticketTypes = []) {
    const sectionCode = String.fromCharCode(64 + sectionNumber);
    const prices = {};
    ticketTypes.forEach((type) => {
      prices[type.name] = "";
    });

    return {
      section: `Section ${sectionNumber}`,
      sectionCode: sectionCode,
      tier: "standard",
      rows: [],
      basePrice: "",
      capacity: 0,
      discounts: {
        student: 0.5,
        senior: 0.5,
        pwd: 0.5,
        cssa: 0.5,
      },
      prices: prices,
    };
  },

  updateSectionPrice(showtime, showtimeIndex, sectionIndex, ticketType, price) {
    if (!showtime?.pricing?.sections?.[sectionIndex]) {return showtime;}

    showtime.pricing.sections[sectionIndex].prices[ticketType] = price;
    return showtime;
  },

  addTicketTypeToShowtimes(showtimes, newTicketType) {
    return showtimes.map((showtime) => {
      if (showtime.pricing?.sections) {
        showtime.pricing.sections = showtime.pricing.sections.map((section) => {
          let calculatedPrice = "";

          if (newTicketType.pricing && Object.keys(section.prices).length > 0) {
            const firstPriceKey = Object.keys(section.prices)[0];
            const basePrice = parseFloat(section.prices[firstPriceKey]) || 0;

            if (basePrice > 0) {
              calculatedPrice = this.calculatePriceFromBase(
                basePrice,
                newTicketType.pricing
              );
            }
          }

          return {
            ...section,
            prices: {
              ...section.prices,
              [newTicketType.name]: calculatedPrice,
            },
          };
        });
      }
      return showtime;
    });
  },

  calculatePriceFromBase(basePrice, pricingRule) {
    if (!pricingRule) {return "";}

    let result = basePrice;

    if (pricingRule.type === "percentage") {
      if (pricingRule.modifier === "discount") {
        result = basePrice * (1 - pricingRule.value / 100);
      } else {
        result = basePrice * (1 + pricingRule.value / 100);
      }
    } else if (pricingRule.type === "fixed") {
      if (pricingRule.modifier === "discount") {
        result = Math.max(0, basePrice - pricingRule.value);
      } else {
        result = basePrice + pricingRule.value;
      }
    }

    return result.toFixed(2);
  },

  validateShowtime(showtime) {
    const errors = [];

    if (!showtime.dateTime) {
      errors.push("Date and time is required");
    }

    if (!showtime.venueId) {
      errors.push("Venue selection is required");
    }

    if (!showtime.pricing?.sections?.length) {
      errors.push("At least one pricing section is required");
    } else {
      showtime.pricing.sections.forEach((section, index) => {
        if (!section.section) {
          errors.push(`Section ${index + 1} name is required`);
        }
        if (!section.sectionCode) {
          errors.push(`Section ${index + 1} code is required`);
        }

        const hasPrices = Object.values(section.prices).some(
          (price) => price && parseFloat(price) > 0
        );
        if (!hasPrices) {
          errors.push(`Section ${index + 1} must have at least one price set`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  calculateShowtimeRevenue(showtime) {
    if (!showtime.seatDetails) {return 0;}

    let totalRevenue = 0;
    const sections = showtime.pricing?.sections || [];

    Object.values(showtime.seatDetails).forEach((seat) => {
      if (seat.status === "reserved" && seat.sectionIndex !== undefined) {
        const section = sections[seat.sectionIndex];
        if (section) {
          const prices = Object.values(section.prices);
          const avgPrice =
            prices.reduce((sum, p) => sum + (parseFloat(p) || 0), 0) /
            prices.length;
          totalRevenue += avgPrice;
        }
      }
    });

    return totalRevenue;
  },

  calculateShowtimeCapacity(showtime) {
    const layout = showtime.seatLayout || { rows: 0, seatsPerRow: 0 };
    return layout.rows * layout.seatsPerRow;
  },

  getShowtimeUtilization(showtime) {
    if (!showtime.seatDetails) {return 0;}

    const totalSeats = this.calculateShowtimeCapacity(showtime);
    if (totalSeats === 0) {return 0;}

    const reservedSeats = Object.values(showtime.seatDetails).filter(
      (s) => s.status === "reserved"
    ).length;

    return ((reservedSeats / totalSeats) * 100).toFixed(1);
  },

  sortShowtimesByDate(showtimes, ascending = true) {
    return [...showtimes].sort((a, b) => {
      const dateA = new Date(a.dateTime);
      const dateB = new Date(b.dateTime);
      return ascending ? dateA - dateB : dateB - dateA;
    });
  },

  filterShowtimesByVenue(showtimes, venueId) {
    if (!venueId) {return showtimes;}
    return showtimes.filter((s) => s.venueId === venueId);
  },

  filterShowtimesByDateRange(showtimes, startDate, endDate) {
    return showtimes.filter((showtime) => {
      const date = new Date(showtime.dateTime);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start && date < start) {return false;}
      if (end && date > end) {return false;}
      return true;
    });
  },

  cloneShowtime(showtime, ticketTypes) {
    return {
      ...JSON.parse(JSON.stringify(showtime)),
      id: Date.now(),
      dateTime: "",
    };
  },
};
