# SeatTooltipManager Usage Guide

## Overview

The `SeatTooltipManager` class provides tooltip functionality for displaying booking information when hovering over booked seats in a seat map.

## Features

- Displays customer name, order ID, phone number, and booking time
- Responsive positioning that adjusts to viewport boundaries
- Keyboard navigation support for accessibility
- Automatic masking of sensitive information based on user permissions
- Tailwind CSS styling

## Basic Usage

```javascript
import { SeatTooltipManager } from "@utils/ui/SeatTooltipManager.js";

const container = document.getElementById("seat-map-container");
const tooltipManager = new SeatTooltipManager(container);

const seatElements = document.querySelectorAll(".seat");
tooltipManager.attachToSeats(seatElements);
```

## Integration with Seat Map

### 1. Fetch Seat Data with Booking Information

```javascript
import { performanceService } from "@services/performanceService.js";

const seatDetails = await performanceService.getSeatsWithBookingInfo(
  performanceId,
  showtimeId
);
```

### 2. Render Seat Map with Data Attributes

The seat map generator automatically adds booking data attributes to booked seats:

```javascript
import { SeatMap } from "@components/SeatMap.js";

const seatMapHTML = SeatMap.generateFromLayout(
  layoutConfig,
  seatDetails,
  selectedSeats,
  true
);
```

### 3. Initialize Tooltip Manager

```javascript
import { SeatTooltipManager } from "@utils/ui/SeatTooltipManager.js";

const container = document.getElementById("seat-map-container");
const tooltipManager = new SeatTooltipManager(container);

const seatElements = container.querySelectorAll(".seat");
tooltipManager.attachToSeats(seatElements);
```

## Data Attributes

The seat map generator adds the following data attributes to booked seats:

- `data-customer-name`: Customer's name (masked for non-admin users)
- `data-order-id`: Booking/order ID
- `data-phone`: Customer's phone number (masked for non-admin users)
- `data-booked-at`: Booking timestamp

## Cleanup

When unmounting or destroying the seat map, clean up the tooltip manager:

```javascript
tooltipManager.destroy();
```

## Accessibility

The tooltip manager automatically:

- Adds `tabindex="0"` to booked seats for keyboard navigation
- Shows tooltip on focus for keyboard users
- Hides tooltip on blur
- Positions tooltip to remain visible within viewport

## Example: Complete Integration

```javascript
import { SeatTooltipManager } from "@utils/ui/SeatTooltipManager.js";
import { SeatMap } from "@components/SeatMap.js";
import { performanceService } from "@services/performanceService.js";

async function renderSeatMapWithTooltips(performanceId, showtimeId) {
  const seatDetails = await performanceService.getSeatsWithBookingInfo(
    performanceId,
    showtimeId
  );

  const performance =
    await performanceService.getPerformanceById(performanceId);
  const layoutConfig = performance.venue.layout;

  const seatMapHTML = SeatMap.generateFromLayout(
    layoutConfig,
    seatDetails,
    [],
    true
  );

  const container = document.getElementById("seat-map-container");
  container.innerHTML = seatMapHTML;

  const tooltipManager = new SeatTooltipManager(container);
  const seatElements = container.querySelectorAll(".seat");
  tooltipManager.attachToSeats(seatElements);

  return tooltipManager;
}
```
