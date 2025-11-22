import { SeatNumberingSystem } from "../SeatNumberingSystem.js";
import { slugify } from "../stringUtils.js";

export function validateVenueLayoutSemantic(layout, helpers) {
  const errors = [];
  if (!layout?.sections?.length) {
    return helpers.message("Layout must have at least one section");
  }

  const sys = new SeatNumberingSystem(layout);
  const validation = sys.validateInternal();
  if (!validation.valid) {
    errors.push(...validation.errors);
  }

  const allFullIds = new Set();
  layout.sections.forEach((section, sIdx) => {
    for (let rIdx = 0; rIdx < section.rows; rIdx++) {
      const seats = sys.enumerateRow(sIdx, rIdx);
      const rowLabel = sys.computeRowLabel(sIdx, rIdx);
      seats.forEach((s) => {
        if (!s.skipped && !s.empty && s.label) {
          const sectionSlug = slugify(section.name);
          const seatNum = Number((s.label || "").replace(/[^0-9]/g, ""));
          const fullId = `${sectionSlug}-${rowLabel}${seatNum}`;
          if (allFullIds.has(fullId)) {
            errors.push(`Duplicate seat fullId: ${fullId}`);
          }
          allFullIds.add(fullId);
        }
      });
    }
  });

  if (errors.length) {
    return helpers.message(errors.join("; "));
  }
  return layout;
}

export function validatePricingLinkage(pricingSections, helpers, state) {
  const performance = state.ancestors?.[0];
  if (!performance?.venueId) {
    return pricingSections;
  }

  const errors = [];
  const layoutSectionsMap = {};

  if (performance.venue?.layout?.sections) {
    performance.venue.layout.sections.forEach((s) => {
      layoutSectionsMap[s.name.toLowerCase()] = (s.tier || "standard").toLowerCase();
    });
  }

  pricingSections.forEach((ps) => {
    const expectedTier = layoutSectionsMap[ps.sectionName.toLowerCase()];
    if (!expectedTier) {
      errors.push(`Pricing section '${ps.sectionName}' not found in venue layout`);
    } else if (expectedTier !== (ps.tier || "standard").toLowerCase()) {
      errors.push(
        `Pricing section '${ps.sectionName}' tier mismatch: expected ${expectedTier}, got ${ps.tier}`
      );
    }
  });

  if (errors.length) {
    return helpers.message(errors.join("; "));
  }
  return pricingSections;
}
