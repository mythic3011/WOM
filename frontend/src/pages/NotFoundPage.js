export default {
  title: "404 Not Found | WOM",

  async render() {
    return `
      <main class="container mx-auto px-4 py-20 text-center">
        <div class="max-w-md mx-auto">
          <i class="fas fa-question-circle text-9xl text-gray-300 mb-6"></i>
          <h1 class="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h1>
          <p class="text-gray-600 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <a href="/" data-link class="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
            <i class="fas fa-home mr-2"></i>Go Home
          </a>
        </div>
      </main>
    `;
  },
};
