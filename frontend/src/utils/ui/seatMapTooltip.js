import { formatBookingTooltip } from "@utils/seatStatusCalculator.js";

export class SeatMapTooltip {
  constructor(tooltipId = "seat-tooltip") {
    this.tooltipId = tooltipId;
    this.tooltip = null;
    this.hoverDebounceTimer = null;
    this.hoverDebounceDelay = 150;
    this.init();
  }

  init() {
    this.tooltip = document.getElementById(this.tooltipId);
    if (!this.tooltip) {
      this.tooltip = document.createElement("div");
      this.tooltip.id = this.tooltipId;
      this.tooltip.className = "seat-tooltip";
      this.tooltip.style.cssText = `
        position: fixed;
        display: none;
        z-index: 9999;
        pointer-events: none;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        padding: 12px;
        max-width: 280px;
      `;
      document.body.appendChild(this.tooltip);
    }
  }

  attach(container, seatStatusMap, seatDetails) {
    if (!container) {return;}

    const seatElements = container.querySelectorAll("[data-seat-id], [data-full-id]");

    seatElements.forEach((seatElement) => {
      seatElement.addEventListener("mouseenter", (e) => {
        this.handleMouseEnter(e, seatElement, seatStatusMap, seatDetails);
      });

      seatElement.addEventListener("mousemove", (e) => {
        if (this.tooltip.style.display === "block") {
          this.position(e);
        }
      });

      seatElement.addEventListener("mouseleave", () => {
        this.handleMouseLeave();
      });
    });
  }

  handleMouseEnter(event, seatElement, seatStatusMap, seatDetails) {
    const fullId = seatElement.getAttribute("data-full-id");
    const seatId = seatElement.getAttribute("data-seat-id");
    const zone = seatElement.getAttribute("data-zone");

    this.hoverDebounceTimer = setTimeout(() => {
      let tooltipContent = "";

      const seatStatus = seatStatusMap?.get(fullId || seatId);
      const actualStatus = seatStatus?.status || seatElement.getAttribute("data-status") || "available";

      if (actualStatus === "booked") {
        if (seatStatus && seatStatus.booking) {
          tooltipContent = formatBookingTooltip(seatStatus.booking, seatStatus.seatTicket, "booked");
        } else {
          tooltipContent = this.formatUnavailableTooltip(fullId || seatId, actualStatus);
        }
      } else if (actualStatus === "reserved") {
        if (seatStatus && seatStatus.booking) {
          tooltipContent = formatBookingTooltip(seatStatus.booking, seatStatus.seatTicket, "reserved");
        } else {
          tooltipContent = this.formatUnavailableTooltip(fullId || seatId, actualStatus);
        }
      } else if (actualStatus === "blocked") {
        const seatDetail = seatDetails[fullId] || seatDetails[seatId];
        const metadata = {
          blockedAt: seatDetail?.blockedAt || seatDetail?.updatedAt,
        };
        tooltipContent = this.formatUnavailableTooltip(fullId || seatId, actualStatus, metadata);
      } else if (actualStatus === "broken") {
        tooltipContent = this.formatUnavailableTooltip(fullId || seatId, actualStatus);
      } else {
        const seatDetail = seatDetails[fullId] || seatDetails[seatId];
        tooltipContent = this.formatAvailableTooltip(
          fullId || seatId,
          zone || seatDetail?.section,
          seatDetail?.price,
          seatDetail?.tier
        );
      }

      if (tooltipContent) {
        this.tooltip.innerHTML = tooltipContent;
        this.tooltip.style.display = "block";
        this.position(event);
      }
    }, this.hoverDebounceDelay);
  }

  handleMouseLeave() {
    if (this.hoverDebounceTimer) {
      clearTimeout(this.hoverDebounceTimer);
      this.hoverDebounceTimer = null;
    }

    this.tooltip.style.display = "none";
  }

  formatAvailableTooltip(seatId, zone, price, tier) {
    const priceValue = parseFloat(price);
    const formattedPrice = !isNaN(priceValue) && priceValue > 0
      ? `HKD ${priceValue.toFixed(2)}`
      : "Price not set";
    const seatLabel = seatId ? seatId.toUpperCase() : "Unknown";
    const zoneName = zone || "Unknown Section";

    return `
      <div class="booking-tooltip text-left text-sm">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-3 h-3 rounded-full bg-green-500"></div>
          <div class="font-semibold text-green-700">Available</div>
        </div>
        <div class="text-xs space-y-1">
          <div class="flex justify-between gap-3">
            <span class="text-gray-500">Seat ID:</span>
            <span class="font-medium">${seatLabel}</span>
          </div>
          <div class="flex justify-between gap-3">
            <span class="text-gray-500">Section:</span>
            <span class="font-medium">${zoneName}</span>
          </div>
          ${tier ? `
          <div class="flex justify-between gap-3">
            <span class="text-gray-500">Tier:</span>
            <span class="font-medium">${tier}</span>
          </div>
          ` : ""}
          <div class="flex justify-between gap-3">
            <span class="text-gray-500">Price:</span>
            <span class="font-semibold text-green-600">${formattedPrice}</span>
          </div>
        </div>
      </div>
    `;
  }

  formatUnavailableTooltip(seatId, status, metadata = {}) {
    const seatLabel = seatId ? seatId.toUpperCase() : "Unknown";
    
    let statusText, statusColor, statusIcon;
    
    switch (status) {
      case "blocked":
        statusText = "Blocked by Admin";
        statusColor = "red";
        statusIcon = "fa-ban";
        break;
      case "broken":
        statusText = "Broken Seat";
        statusColor = "orange";
        statusIcon = "fa-tools";
        break;
      case "booked":
        statusText = "Booked";
        statusColor = "blue";
        statusIcon = "fa-check-circle";
        break;
      case "reserved":
        statusText = "Reserved";
        statusColor = "yellow";
        statusIcon = "fa-clock";
        break;
      default:
        statusText = "Unavailable";
        statusColor = "gray";
        statusIcon = "fa-times-circle";
    }

    let timestampHtml = "";
    if (status === "blocked" && metadata.blockedAt) {
      const blockedDate = new Date(metadata.blockedAt);
      const formattedDate = blockedDate.toLocaleString("en-HK", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      timestampHtml = `
        <div class="flex justify-between gap-3">
          <span class="text-gray-500">Blocked At:</span>
          <span class="font-medium text-xs">${formattedDate}</span>
        </div>
      `;
    }

    return `
      <div class="booking-tooltip text-left text-sm">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-3 h-3 rounded-full bg-${statusColor}-500"></div>
          <div class="font-semibold text-${statusColor}-700">${statusText}</div>
        </div>
        <div class="text-xs space-y-1">
          <div class="flex justify-between gap-3">
            <span class="text-gray-500">Seat ID:</span>
            <span class="font-medium">${seatLabel}</span>
          </div>
          ${timestampHtml}
        </div>
      </div>
    `;
  }

  position(event) {
    const offset = 15;
    const tooltipWidth = this.tooltip.offsetWidth;
    const tooltipHeight = this.tooltip.offsetHeight;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = event.clientX + offset;
    let y = event.clientY + offset;

    if (x + tooltipWidth > viewportWidth) {
      x = event.clientX - tooltipWidth - offset;
    }
    if (y + tooltipHeight > viewportHeight) {
      y = event.clientY - tooltipHeight - offset;
    }

    this.tooltip.style.left = `${x}px`;
    this.tooltip.style.top = `${y}px`;
  }

  destroy() {
    if (this.hoverDebounceTimer) {
      clearTimeout(this.hoverDebounceTimer);
      this.hoverDebounceTimer = null;
    }

    if (this.tooltip && this.tooltip.parentNode) {
      this.tooltip.parentNode.removeChild(this.tooltip);
      this.tooltip = null;
    }
  }
}
