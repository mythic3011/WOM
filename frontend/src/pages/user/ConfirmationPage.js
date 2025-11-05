export default {
  title: "Booking Confirmed | User",

  async render() {
    return `
      <main class="container mx-auto px-4 py-8">
        <div class="max-w-2xl mx-auto text-center">
          <div class="bg-white rounded-lg shadow-md p-12">
            <i class="fas fa-check-circle text-6xl text-green-500 mb-4"></i>
            <h1 class="text-3xl font-bold text-gray-900 mb-4">Booking Confirmed!</h1>
            <p class="text-gray-600 mb-8">Your booking has been successfully confirmed.</p>
            <div class="flex gap-4 justify-center">
              <a href="/user/bookings" data-link class="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                View Bookings
              </a>
              <a href="/performances" data-link class="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                Browse More
              </a>
            </div>
          </div>
        </div>
      </main>
    `;
  },
};
