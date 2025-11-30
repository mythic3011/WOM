export const buildPricingSectionsFromVenue = (venueLayout, inputPricingSections) => {
  if (!venueLayout?.sections || venueLayout.sections.length === 0) {
    return inputPricingSections;
  }

  const tierPriceMap = {};
  inputPricingSections.forEach(ps => {
    if (ps.tier && ps.basePrice) {
      tierPriceMap[ps.tier] = ps.basePrice;
    }
  });

  const defaultPrice = inputPricingSections[0]?.basePrice || 100;

  const pricingSections = venueLayout.sections.map(section => {
    const sectionName = section.name || "Section";
    const tier = section.tier || "standard";
    const basePrice = tierPriceMap[tier] || defaultPrice;
    
    const rows = [];
    const startRow = section.startRow || "A";
    const numRows = section.rows || 1;
    const startCharCode = startRow.charCodeAt(0);
    
    for (let i = 0; i < numRows; i++) {
      rows.push(String.fromCharCode(startCharCode + i));
    }

    const sectionCode = sectionName
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase();

    return {
      sectionName,
      sectionCode,
      tier,
      basePrice,
      rows,
      seatsPerRow: section.seatsPerRow || 20,
    };
  });

  return pricingSections;
};
