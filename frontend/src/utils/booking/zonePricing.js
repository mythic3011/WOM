import { SEAT_TIER_LABELS } from "@/data/index.js";

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
    if (!ticketType) {
      return basePrice;
    }

    const ticketTypeId = ticketType.id || ticketType.name?.toLowerCase();

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

    if (discounts[ticketTypeId]) {
      return Math.round(basePrice * (1 - discounts[ticketTypeId]));
    }

    return basePrice;
  },

  getPriceForSeat(seatNumber, ticketType, pricingSections) {
    const zone = this.getSeatZone(seatNumber, pricingSections);
    if (!zone) {
      return 500;
    }

    return this.calculateFinalPrice(zone.basePrice, ticketType, zone.discounts);
  },

  getTicketTypesWithPrices(seatNumber, ticketTypes, pricingSections) {
    const zone = this.getSeatZone(seatNumber, pricingSections);
    if (!zone) {
      return ticketTypes.map((type) => ({ ...type, price: 500 }));
    }

    return ticketTypes.map((type) => ({
      ...type,
      price: this.calculateFinalPrice(zone.basePrice, type, zone.discounts),
      basePrice: zone.basePrice,
      zone: zone.tier,
      zoneName: SEAT_TIER_LABELS[zone.tier] || zone.tier,
    }));
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
