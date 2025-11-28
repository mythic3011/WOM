export const ShowtimeAvailabilityBadge = {
  render(showtime) {
    const available = showtime.availableSeats || 0;
    const total = showtime.totalSeats || 0;
    const percentage = total > 0 ? Math.round((available / total) * 100) : 0;

    let badgeColor, icon, label;

    if (percentage >= 75) {
      badgeColor = "bg-green-100 text-green-800 border-green-200";
      icon = "fa-check-circle";
      label = "Available";
    } else if (percentage >= 50) {
      badgeColor = "bg-blue-100 text-blue-800 border-blue-200";
      icon = "fa-info-circle";
      label = "Good";
    } else if (percentage >= 25) {
      badgeColor = "bg-yellow-100 text-yellow-800 border-yellow-200";
      icon = "fa-exclamation-triangle";
      label = "Limited";
    } else if (percentage > 0) {
      badgeColor = "bg-orange-100 text-orange-800 border-orange-200";
      icon = "fa-exclamation-circle";
      label = "Few Left";
    } else {
      badgeColor = "bg-red-100 text-red-800 border-red-200";
      icon = "fa-times-circle";
      label = "Sold Out";
    }

    return `
      <div class="inline-flex items-center gap-1.5 px-2 py-1 ${badgeColor} border rounded-full text-xs font-semibold">
        <i class="fas ${icon}"></i>
        <span>${available}/${total}</span>
      </div>
    `;
  },

  renderDetailed(showtime) {
    const available = showtime.availableSeats || 0;
    const total = showtime.totalSeats || 0;
    const booked = total - available;
    const percentage = total > 0 ? Math.round((available / total) * 100) : 0;

    let progressColor;
    if (percentage >= 75) {progressColor = "bg-green-600";}
    else if (percentage >= 50) {progressColor = "bg-blue-600";}
    else if (percentage >= 25) {progressColor = "bg-yellow-600";}
    else if (percentage > 0) {progressColor = "bg-orange-600";}
    else {progressColor = "bg-red-600";}

    return `
      <div class="space-y-2">
        <div class="flex items-center justify-between text-xs">
          <span class="text-gray-600">Availability</span>
          <span class="font-bold text-gray-900">${percentage}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div class="${progressColor} h-full rounded-full transition-all" style="width: ${percentage}%"></div>
        </div>
        <div class="grid grid-cols-3 gap-2 text-xs">
          <div class="text-center">
            <div class="font-bold text-green-700">${available}</div>
            <div class="text-gray-600">Available</div>
          </div>
          <div class="text-center">
            <div class="font-bold text-blue-700">${booked}</div>
            <div class="text-gray-600">Booked</div>
          </div>
          <div class="text-center">
            <div class="font-bold text-gray-700">${total}</div>
            <div class="text-gray-600">Total</div>
          </div>
        </div>
      </div>
    `;
  },

  renderCompact(showtimes) {
    if (!showtimes || showtimes.length === 0) {
      return "<div class=\"text-xs text-gray-400\">No showtimes</div>";
    }

    let totalAvailable = 0;
    let totalSeats = 0;

    showtimes.forEach((st) => {
      totalAvailable += st.availableSeats || 0;
      totalSeats += st.totalSeats || 0;
    });

    const percentage =
      totalSeats > 0 ? Math.round((totalAvailable / totalSeats) * 100) : 0;

    let color, icon;
    if (percentage >= 75) {
      color = "text-green-600";
      icon = "fa-check-circle";
    } else if (percentage >= 50) {
      color = "text-blue-600";
      icon = "fa-info-circle";
    } else if (percentage >= 25) {
      color = "text-yellow-600";
      icon = "fa-exclamation-triangle";
    } else if (percentage > 0) {
      color = "text-orange-600";
      icon = "fa-exclamation-circle";
    } else {
      color = "text-red-600";
      icon = "fa-times-circle";
    }

    return `
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-2">
          <i class="fas ${icon} ${color}"></i>
          <span class="text-sm font-semibold ${color}">${percentage}%</span>
        </div>
        <div class="text-xs text-gray-600">${totalAvailable}/${totalSeats} seats</div>
      </div>
    `;
  },
};
