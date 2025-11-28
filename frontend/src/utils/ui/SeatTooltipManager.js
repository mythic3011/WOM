import $ from "jquery";

export class SeatTooltipManager {
  constructor(container) {
    this.container = container;
    this.tooltip = null;
    this.currentSeat = null;
    this.isVisible = false;
    this.initTooltip();
  }

  initTooltip() {
    this.tooltip = $("<div>")
      .addClass(
        "seat-tooltip fixed hidden z-50 bg-gray-900 text-white text-sm rounded-lg shadow-lg p-3 pointer-events-none"
      )
      .css({
        maxWidth: "280px",
        minWidth: "200px",
      })
      .appendTo("body");
  }

  attachToSeats(seatElements) {
    const self = this;

    $(seatElements).each(function () {
      const $seat = $(this);
      const status = $seat.attr("data-status");

      if (status === "occupied" || status === "booked" || status === "reserved") {
        $seat
          .on("mouseenter", function (e) {
            const bookingData = {
              customerName: $seat.attr("data-customer-name"),
              orderId: $seat.attr("data-order-id"),
              phone: $seat.attr("data-phone"),
              bookedAt: $seat.attr("data-booked-at"),
            };

            if (bookingData.customerName || bookingData.orderId) {
              self.show(this, bookingData);
            }
          })
          .on("mousemove", function (e) {
            if (self.isVisible) {
              self.updatePosition(e);
            }
          })
          .on("mouseleave", function () {
            self.hide();
          })
          .on("focus", function () {
            const bookingData = {
              customerName: $seat.attr("data-customer-name"),
              orderId: $seat.attr("data-order-id"),
              phone: $seat.attr("data-phone"),
              bookedAt: $seat.attr("data-booked-at"),
            };

            if (bookingData.customerName || bookingData.orderId) {
              self.handleKeyboardFocus(this);
            }
          })
          .on("blur", function () {
            self.hide();
          });

        $seat.attr("tabindex", "0");
      }
    });
  }

  show(seatElement, bookingData) {
    if (!bookingData || (!bookingData.customerName && !bookingData.orderId)) {
      return;
    }

    this.currentSeat = seatElement;
    this.isVisible = true;

    const content = this.buildTooltipContent(bookingData);
    this.tooltip.html(content).removeClass("hidden");
  }

  hide() {
    this.isVisible = false;
    this.currentSeat = null;
    this.tooltip.addClass("hidden");
  }

  updatePosition(event) {
    if (!this.isVisible || !this.tooltip) {
      return;
    }

    const offset = 15;
    const x = event.pageX + offset;
    const y = event.pageY + offset;

    this.tooltip.css({
      left: `${x}px`,
      top: `${y}px`,
    });

    requestAnimationFrame(() => {
      this.adjustForViewport();
    });
  }

  adjustForViewport() {
    if (!this.isVisible || !this.tooltip || this.tooltip.hasClass("hidden")) {
      return;
    }

    const tooltipRect = this.tooltip[0].getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    let newLeft = parseFloat(this.tooltip.css("left"));
    let newTop = parseFloat(this.tooltip.css("top"));

    if (tooltipRect.right > viewportWidth) {
      newLeft = scrollX + viewportWidth - tooltipRect.width - 10;
    }

    if (tooltipRect.left < 0) {
      newLeft = scrollX + 10;
    }

    if (tooltipRect.bottom > viewportHeight) {
      newTop = scrollY + viewportHeight - tooltipRect.height - 10;
    }

    if (tooltipRect.top < 0) {
      newTop = scrollY + 10;
    }

    this.tooltip.css({
      left: `${newLeft}px`,
      top: `${newTop}px`,
    });
  }

  handleKeyboardFocus(seatElement) {
    const $seat = $(seatElement);
    const bookingData = {
      customerName: $seat.attr("data-customer-name"),
      orderId: $seat.attr("data-order-id"),
      phone: $seat.attr("data-phone"),
      bookedAt: $seat.attr("data-booked-at"),
    };

    if (!bookingData.customerName && !bookingData.orderId) {
      return;
    }

    this.currentSeat = seatElement;
    this.isVisible = true;

    const content = this.buildTooltipContent(bookingData);
    this.tooltip.html(content).removeClass("hidden");

    const rect = seatElement.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    const x = rect.left + scrollX + rect.width / 2;
    const y = rect.bottom + scrollY + 10;

    this.tooltip.css({
      left: `${x}px`,
      top: `${y}px`,
    });

    requestAnimationFrame(() => {
      this.adjustForViewport();
    });
  }

  buildTooltipContent(bookingData) {
    const { customerName, orderId, phone, bookedAt } = bookingData;

    let content = "<div class=\"space-y-1\">";

    if (customerName) {
      content += `
        <div class="flex items-start gap-2">
          <span class="font-semibold text-gray-300 min-w-[60px]">Customer:</span>
          <span class="break-words">${this.escapeHtml(customerName)}</span>
        </div>
      `;
    }

    if (orderId) {
      content += `
        <div class="flex items-start gap-2">
          <span class="font-semibold text-gray-300 min-w-[60px]">Order ID:</span>
          <span class="break-words font-mono text-xs">${this.escapeHtml(orderId)}</span>
        </div>
      `;
    }

    if (phone) {
      content += `
        <div class="flex items-start gap-2">
          <span class="font-semibold text-gray-300 min-w-[60px]">Phone:</span>
          <span class="break-words">${this.escapeHtml(phone)}</span>
        </div>
      `;
    }

    if (bookedAt) {
      const formattedDate = this.formatDate(bookedAt);
      content += `
        <div class="flex items-start gap-2">
          <span class="font-semibold text-gray-300 min-w-[60px]">Booked:</span>
          <span class="break-words text-xs">${formattedDate}</span>
        </div>
      `;
    }

    content += "</div>";

    return content;
  }

  formatDate(dateString) {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }

      const options = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };

      return date.toLocaleString("en-US", options);
    } catch (error) {
      return dateString;
    }
  }

  escapeHtml(text) {
    if (!text) {return "";}

    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  destroy() {
    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }
    this.currentSeat = null;
    this.isVisible = false;
  }
}
