let $tooltip = null;
let currentSeat = null;

function createTooltip() {
  if ($tooltip && $tooltip.length) {return;}

  const html = `
    <div id="seatTooltip" class="fixed bg-gray-900/95 text-white px-3 py-2 rounded-lg shadow-xl text-xs pointer-events-none z-[10000] hidden transition-opacity duration-200 backdrop-blur-sm border border-gray-700">
      <div class="font-semibold text-sm mb-1 text-yellow-400" data-tooltip-title></div>
      <div class="flex items-center gap-1.5 my-0.5 text-gray-100">
        <i class="fas fa-map-marker-alt text-[10px] text-blue-400"></i>
        <span data-tooltip-zone></span>
      </div>
      <div class="flex items-center gap-1.5 my-0.5 text-gray-100">
        <i class="fas fa-circle text-[8px]" data-tooltip-status-icon></i>
        <span data-tooltip-status></span>
      </div>
      <div class="flex items-center gap-1.5 my-0.5 text-green-400 font-semibold">
        <i class="fas fa-tag text-[10px]"></i>
        <span data-tooltip-price></span>
      </div>
    </div>
  `;

  $tooltip = $(html).appendTo("body");
}

function getSeatData($seat) {
  const status = $seat.attr("data-status") || $seat.data("status");
  const isSelected = $seat.hasClass("selected") || status === "selected";
  const isOccupied =
    $seat.hasClass("occupied") ||
    status === "occupied" ||
    status === "reserved";

  const seatId = $seat.attr("data-seat-id") || $seat.data("seat-id") || "";
  const fullId = $seat.attr("data-full-id") || $seat.data("full-id") || "";
  const displayId = seatId || (fullId ? fullId.split("-").pop() : "");

  return {
    seatId: displayId,
    fullId: fullId,
    zone: $seat.attr("data-zone") || $seat.data("zone") || "Section",
    price: $seat.attr("data-price") || $seat.data("price") || "0",
    status: status || "available",
    isOccupied,
    isSelected,
  };
}

function getStatusInfo(data) {
  if (data.isSelected) {
    return {
      label: "Selected",
      iconClass: "text-yellow-400",
    };
  }
  if (data.isOccupied) {
    return {
      label: "Occupied",
      iconClass: "text-red-400",
    };
  }
  return {
    label: "Available",
    iconClass: "text-green-400",
  };
}

function updateTooltipContent(data) {
  if (!$tooltip) {return;}

  const statusInfo = getStatusInfo(data);
  const priceValue = parseFloat(data.price) || 0;
  const formattedPrice = `HKD ${priceValue.toLocaleString()}`;

  $tooltip.find("[data-tooltip-title]").text(`Seat ${data.seatId}`);
  $tooltip.find("[data-tooltip-zone]").text(data.zone);
  $tooltip.find("[data-tooltip-status]").text(statusInfo.label);
  $tooltip
    .find("[data-tooltip-status-icon]")
    .attr("class", `fas fa-circle text-[8px] ${statusInfo.iconClass}`);
  $tooltip.find("[data-tooltip-price]").text(formattedPrice);
}

function positionTooltip(event) {
  if (!$tooltip) {return;}

  const offset = 15;
  const tooltipWidth = $tooltip.outerWidth();
  const tooltipHeight = $tooltip.outerHeight();
  const viewportWidth = $(window).width();
  const viewportHeight = $(window).height();

  let x = event.clientX + offset;
  let y = event.clientY + offset;

  if (x + tooltipWidth > viewportWidth) {
    x = event.clientX - tooltipWidth - offset;
  }
  if (y + tooltipHeight > viewportHeight) {
    y = event.clientY - tooltipHeight - offset;
  }

  $tooltip.css({
    left: `${x}px`,
    top: `${y}px`,
  });
}

function showTooltip($seat, event) {
  if (!$tooltip) {createTooltip();}

  const data = getSeatData($seat);
  updateTooltipContent(data);
  positionTooltip(event);

  $tooltip.removeClass("hidden opacity-0").addClass("opacity-100");
  currentSeat = data.seatId;
}

function hideTooltip() {
  if (!$tooltip) {return;}

  $tooltip.removeClass("opacity-100").addClass("opacity-0");
  setTimeout(() => {
    if ($tooltip && !$tooltip.hasClass("opacity-100")) {
      $tooltip.addClass("hidden");
    }
  }, 200);

  currentSeat = null;
}

export function initSeatTooltip() {
  createTooltip();
  return { $tooltip, currentSeat };
}

export function getSeatTooltip() {
  if (!$tooltip) {createTooltip();}
  return { $tooltip, currentSeat };
}

export function destroySeatTooltip() {
  if ($tooltip) {
    $tooltip.remove();
    $tooltip = null;
  }
  currentSeat = null;
}

export function attachSeatTooltipListeners(containerSelector = "svg") {
  const $container = $(containerSelector);

  if (!$container.length) {
    console.warn(`Seat tooltip: Container "${containerSelector}" not found`);
    return;
  }

  createTooltip();

  $container.off("mouseenter.seatTooltip", "g.interactive-seat");
  $container.off("mouseleave.seatTooltip", "g.interactive-seat");
  $(document).off("mousemove.seatTooltip");

  $container.on("mouseenter.seatTooltip", "g.interactive-seat", function (e) {
    showTooltip($(this), e);
  });

  $container.on("mouseleave.seatTooltip", "g.interactive-seat", function () {
    hideTooltip();
  });

  $(document).on("mousemove.seatTooltip", function (e) {
    if (currentSeat && $tooltip && $tooltip.hasClass("opacity-100")) {
      positionTooltip(e);
    }
  });

  return () => {
    $container.off(".seatTooltip");
    $(document).off(".seatTooltip");
  };
}
