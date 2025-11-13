import {
  validateVenueLayoutSemantic,
  validatePricingLinkage,
} from "./src/utils/validation/seatLayoutValidation.js";

const testLayout = {
  sections: [
    {
      name: "Orchestra Stalls",
      tier: "premium",
      rows: 3,
      seatsPerRow: 5,
      startRow: "A",
    },
    {
      name: "Balcony",
      tier: "standard",
      rows: 2,
      seatsPerRow: 4,
      startRow: "A",
    },
  ],
};

const testPricingSections = [
  {
    sectionName: "Orchestra Stalls",
    sectionCode: "OS",
    basePrice: 800,
    tier: "premium",
  },
  {
    sectionName: "Balcony",
    sectionCode: "BAL",
    basePrice: 500,
    tier: "standard",
  },
];

const mockHelpers = {
  message: (msg) => ({ error: msg }),
};

const mockState = {
  ancestors: [
    {
      venueId: 1,
      venue: {
        layout: testLayout,
      },
    },
  ],
};

console.log("\n=== Testing Venue Layout Validation ===");
try {
  const layoutResult = validateVenueLayoutSemantic(testLayout, mockHelpers);
  console.log(
    "✓ Layout validation passed:",
    layoutResult === testLayout ? "Valid" : layoutResult
  );
} catch (err) {
  console.log("✗ Layout validation failed:", err.message);
}

console.log("\n=== Testing Pricing Linkage Validation ===");
try {
  const pricingResult = validatePricingLinkage(
    testPricingSections,
    mockHelpers,
    mockState
  );
  console.log(
    "✓ Pricing validation passed:",
    pricingResult === testPricingSections ? "Valid" : pricingResult
  );
} catch (err) {
  console.log("✗ Pricing validation failed:", err.message);
}

console.log("\n=== Testing Invalid Tier Mismatch ===");
const invalidPricing = [
  {
    sectionName: "Orchestra Stalls",
    sectionCode: "OS",
    basePrice: 800,
    tier: "standard",
  },
];
try {
  const invalidResult = validatePricingLinkage(invalidPricing, mockHelpers, mockState);
  if (invalidResult.error) {
    console.log("✓ Correctly detected tier mismatch:", invalidResult.error);
  } else {
    console.log("✗ Should have detected tier mismatch");
  }
} catch (err) {
  console.log("✓ Correctly rejected:", err.message);
}

console.log("\n=== All Validation Tests Complete ===\n");
