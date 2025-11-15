import dayjs from "dayjs";

export const ShowtimeManager = {
  render(performance, showtimes, bookings, performanceId) {
    const showtimesHtml = showtimes
      .map((st, index) =>
        this.renderShowtimeCard(st, index, performanceId, bookings)
      )
      .join("");

    return `
      <div class="text-left space-y-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold">Manage Showtimes for "${performance.title}"</h3>
          <button id="addShowtimeBtn" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <i class="fas fa-plus mr-2"></i>Add Showtime
          </button>
        </div>
        
        ${
          showtimes.length === 0
            ? `
          <div class="text-center py-12 bg-gray-50 rounded-lg">
            <i class="fas fa-calendar-times text-6xl text-gray-300 mb-4"></i>
            <p class="text-gray-500">No showtimes scheduled yet</p>
            <p class="text-sm text-gray-400 mt-2">Click "Add Showtime" to create one</p>
          </div>
        `
            : `
          <div class="space-y-3">
            ${showtimesHtml}
          </div>
        `
        }
      </div>
    `;
  },

  renderShowtimeCard(showtime, index, performanceId, bookings) {
    const date = dayjs(showtime.dateTime || showtime.datetime).format(
      "MMMM D, YYYY"
    );
    const time = dayjs(showtime.dateTime || showtime.datetime).format("h:mm A");
    const showtimeBookings =
      bookings?.filter((b) => b.showtimeId === showtime.id) || [];
    const totalRevenue = showtimeBookings.reduce(
      (sum, b) => sum + (b.amount || 0),
      0
    );

    return `
      <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <i class="fas fa-calendar-day text-2xl text-indigo-600"></i>
              <div>
                <div class="font-bold text-lg">${date}</div>
                <div class="text-sm text-gray-600">${time}</div>
              </div>
            </div>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
              <div class="bg-blue-50 rounded p-2">
                <div class="text-xs text-blue-600 font-medium">Total Seats</div>
                <div class="text-lg font-bold text-blue-900">${showtime.totalSeats || 0}</div>
              </div>
              <div class="bg-green-50 rounded p-2">
                <div class="text-xs text-green-600 font-medium">Available</div>
                <div class="text-lg font-bold text-green-900">${showtime.availableSeats || 0}</div>
              </div>
              <div class="bg-orange-50 rounded p-2">
                <div class="text-xs text-orange-600 font-medium">Bookings</div>
                <div class="text-lg font-bold text-orange-900">${showtimeBookings.length}</div>
              </div>
              <div class="bg-purple-50 rounded p-2">
                <div class="text-xs text-purple-600 font-medium">Revenue</div>
                <div class="text-lg font-bold text-purple-900">$${totalRevenue}</div>
              </div>
            </div>
          </div>
          
          <div class="flex flex-col gap-2 ml-4">
            <button class="view-showtime-btn px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors" data-index="${index}">
              <i class="fas fa-eye mr-1"></i>View
            </button>
            <button class="edit-showtime-btn px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors" data-index="${index}">
              <i class="fas fa-edit mr-1"></i>Edit
            </button>
            <button class="delete-showtime-btn px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors" data-index="${index}">
              <i class="fas fa-trash mr-1"></i>Delete
            </button>
          </div>
        </div>
      </div>
    `;
  },
};
