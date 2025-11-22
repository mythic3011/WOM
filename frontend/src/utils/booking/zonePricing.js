// Seat tier labels for display
const SEAT_TIER_LABELS = {
  premium: "Premium",
  standard: "Standard",
  economy: "Economy",
  vip: "VIP",
  balcony: "Balcony",
  orchestra: "Orchestra",
  mezzanine: "Mezzanine",
  stalls: "Stalls",
  circle: "Circle",
  gallery: "Gallery"
};

export const ZonePricing = {
  getSeatZone(seatNumber, pricingSections) {
    if (!pricingSections || !Array.isArray(pricingSections)) {
      return null;
    }

    const seatRow = seatNumber.charAt(0).toUpperCase();

    for (const section of pricingSections) {
      if (section.rows && Array.isArray(section.rows)) {
        if (section.rows.includes(seatRow)) {
          return {
            sectionName: section.sectionName,
            tier: section.tier,
            basePrice: section.basePrice,
            rows: section.rows,
            discounts: section.discounts || {},
          };
        }
      }
    }

    return pricingSections[0] || null;
  },

  calculateFinalPrice(basePrice, ticketType, discounts = {}) {
    // Validate base price
    if (!basePrice || basePrice <= 0) {
      console.warn('Invalid base price:', basePrice);
      return 0;
    }

    if (!ticketType) {
      return basePrice;
    }

    const ticketTypeId = ticketType.id || ticketType.name?.toLowerCase();

    // Check for pricing object (structured pricing)
    if (ticketType.pricing) {
      if (ticketType.pricing.type === "percentage") {
        return Math.round(basePrice * (ticketType.pricing.value / 100));
      } else if (ticketType.pricing.type === "fixed") {
        return ticketType.pricing.value;
      } else if (ticketType.pricing.type === "modifier") {
        return Math.round(basePrice + ticketType.pricing.value);
      } else if (ticketType.pricing.type === "discount") {
        return Math.round(basePrice * (1 - ticketType.pricing.value));
      }
    }

    // Check for discount percentage field (e.g., 50 for 50% discount)
    if (ticketType.discountPercentage !== undefined && ticketType.discountPercentage !== null) {
      const discountDecimal = ticketType.discountPercentage / 100;
      return Math.round(basePrice * (1 - discountDecimal));
    }

    // Check for discount field (could be decimal like 0.5 or percentage like 50)
    if (ticketType.discount !== undefined && ticketType.discount !== null) {
      const discountValue = parseFloat(ticketType.discount);

      // If discount is 1.0 or "1.00", it means full price (no discount)
      if (discountValue === 1.0) {
        return basePrice;
      }

      // If discount is > 1, assume it's a percentage (e.g., 50 means 50%)
      // If discount is < 1, assume it's a decimal (e.g., 0.5 means 50%)
      const discountDecimal = discountValue > 1 ? discountValue / 100 : discountValue;
      return Math.round(basePrice * (1 - discountDecimal));
    }

    // Check zone-specific discounts
    if (discounts[ticketTypeId]) {
      return Math.round(basePrice * (1 - discounts[ticketTypeId]));
    }

    // No discount, return base price
    return basePrice;
  },

  getPriceForSeat(seatNumber, ticketType, pricingSections) {
    const zone = this.getSeatZone(seatNumber, pricingSections);
    if (!zone) {
      return 500;
    }

    return this.calculateFinalPrice(zone.basePrice, ticketType, zone.discounts);
  },

  getTicketTypesWithPrices(seatNumber, ticketTypes, pricingSections, totalSelectedSeats = 1) {
    const zone = this.getSeatZone(seatNumber, pricingSections);

    // If no zone found or basePrice is invalid, use fallback
    if (!zone || !zone.basePrice || zone.basePrice <= 0) {
      console.warn(`No valid pricing zone found for seat ${seatNumber}, using fallback price`);
      return ticketTypes
        .filter((type) => {
          // Filter out group tickets if not enough seats selected
          if (type.minGroupSize && type.minGroupSize > totalSelectedSeats) {
            return false;
          }
          return true;
        })
        .map((type) => ({
          ...type,
          price: 500,
          basePrice: 500,
          zone: 'standard',
          zoneName: 'Standard'
        }));
    }

    return ticketTypes
      .filter((type) => {
        // Filter out group tickets if not enough seats selected
        if (type.minGroupSize && type.minGroupSize > totalSelectedSeats) {
          return false;
        }
        return true;
      })
      .map((type) => {
        const finalPrice = this.calculateFinalPrice(zone.basePrice, type, zone.discounts);

        // Debug logging for price calculation
        if (finalPrice === 0 || isNaN(finalPrice)) {
          console.warn(`Invalid price calculated for ${type.name}:`, {
            basePrice: zone.basePrice,
            ticketType: type,
            finalPrice
          });
        }

        return {
          ...type,
          price: finalPrice > 0 ? finalPrice : zone.basePrice,
          basePrice: zone.basePrice,
          zone: zone.tier,
          zoneName: SEAT_TIER_LABELS[zone.tier] || zone.tier,
        };
      });
  },

  getSeatPriceBreakdown(seatNumber, ticketType, pricingSections) {
    const zone = this.getSeatZone(seatNumber, pricingSections);
    if (!zone) {
      return {
        seatNumber,
        zone: "unknown",
        zoneName: "Unknown",
        basePrice: 500,
        ticketType: ticketType?.name || "Standard",
        discount: 0,
        finalPrice: 500,
      };
    }

    const finalPrice = this.calculateFinalPrice(
      zone.basePrice,
      ticketType,
      zone.discounts
    );
    const discount = zone.basePrice - finalPrice;

    return {
      seatNumber,
      zone: zone.tier,
      zoneName: SEAT_TIER_LABELS[zone.tier] || zone.tier,
      sectionName: zone.sectionName,
      basePrice: zone.basePrice,
      ticketType: ticketType?.name || "Standard",
      discount: discount,
      discountPercentage:
        discount > 0 ? Math.round((discount / zone.basePrice) * 100) : 0,
      finalPrice: finalPrice,
    };
  },

  getZoneSummary(pricingSections) {
    if (!pricingSections || !Array.isArray(pricingSections)) {
      return [];
    }

    return pricingSections.map((section) => ({
      sectionName: section.sectionName,
      tier: section.tier,
      tierLabel: SEAT_TIER_LABELS[section.tier] || section.tier,
      basePrice: section.basePrice,
      rows: section.rows || 0,
      rowsDisplay: section.rows ? `${section.rows} rows` : "N/A",
    }));
  },

  formatPriceWithCurrency(price) {
    return `HKD ${price.toLocaleString()}`;
  },

  createPricingTable(pricingSections, ticketTypes) {
    const zones = this.getZoneSummary(pricingSections);

    const tableRows = zones.map((zone) => {
      const prices = ticketTypes.map((type) => {
        const sampleSeat = "A1";
        return this.getPriceForSeat(sampleSeat, type, pricingSections);
      });

      return {
        zone: zone.tierLabel,
        sectionName: zone.sectionName,
        rows: zone.rowsDisplay,
        basePrice: zone.basePrice,
        prices: prices,
      };
    });

    return tableRows;
  },
};

export default ZonePricing;
