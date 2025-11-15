export const MockDataCard = {
  render() {
    return `
      <div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <i class="fas fa-database text-green-600"></i>
          Mock Data Generator
        </h2>

        <div class="space-y-4">
          <div>
            <h3 class="text-sm font-semibold text-gray-700 mb-2">Users</h3>
            <div class="flex gap-2">
              <button id="createMockUsers" class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                <i class="fas fa-users mr-2"></i>Generate Users
              </button>
              <button id="viewUsers" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                <i class="fas fa-eye"></i>
              </button>
            </div>
          </div>

          <div>
            <h3 class="text-sm font-semibold text-gray-700 mb-2">Performances</h3>
            <div class="flex gap-2">
              <button id="createMockPerformances" class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                <i class="fas fa-music mr-2"></i>Generate Performances
              </button>
              <button id="viewPerformances" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                <i class="fas fa-eye"></i>
              </button>
              <button id="clearPerformances" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>

          <div>
            <h3 class="text-sm font-semibold text-gray-700 mb-2">Bookings</h3>
            <div class="flex gap-2">
              <button id="createMockBookings" class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                <i class="fas fa-ticket-alt mr-2"></i>Generate Bookings
              </button>
              <button id="viewBookings" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                <i class="fas fa-eye"></i>
              </button>
              <button id="clearBookings" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },
};
