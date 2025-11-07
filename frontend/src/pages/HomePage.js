import { statsService } from "/src/services/statsService.js";
import { FormComponents } from "/src/components/FormComponents.js";
import { PerformanceCard } from "/src/components/PerformanceCard.js";
import { createLoadingState } from "/src/components/LoadingState.js";
import dayjs from "dayjs";

export default {
  title: "Home | Western Orchestral Music Performance",

  async render() {
    return `
      <main class="min-h-screen">
        <section class="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-24 overflow-hidden">
          <div class="absolute inset-0 opacity-10">
            <div class="absolute top-20 left-10 text-9xl">
              <i class="fas fa-music"></i>
            </div>
            <div class="absolute bottom-20 right-10 text-9xl">
              <i class="fas fa-guitar"></i>
            </div>
          </div>
          <div class="container mx-auto px-4 text-center relative z-10">
            <h1 class="text-6xl font-bold mb-4 animate-fade-in">
              <i class="fas fa-music text-white mr-4"></i>
              Welcome to WOM
            </h1>
            <p class="text-2xl mb-8 text-indigo-100">Experience World-Class Orchestral Performances</p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="/performances" data-link class="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-100 hover:shadow-2xl transition-all transform hover:scale-105">
                <i class="fas fa-calendar-alt text-indigo-600"></i>
                Browse Performances
              </a>
              <a href="/register" data-link class="inline-flex items-center gap-2 px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-indigo-600 transition-all">
                <i class="fas fa-user-plus text-white"></i>
                Join Now
              </a>
            </div>
          </div>
        </section>

        <section class="container mx-auto px-4 py-16">
          <div class="text-center mb-12">
            <h2 class="text-4xl font-bold text-gray-900 mb-4">
              <i class="fas fa-star text-yellow-500 mr-2"></i>
              Featured Performances
            </h2>
            <p class="text-xl text-gray-600">Don't miss these upcoming shows</p>
          </div>
          <div id="featuredPerformances" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
          <div class="text-center mt-12">
            <a href="/performances" data-link class="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all">
              View All Performances
              <i class="fas fa-arrow-right text-white"></i>
            </a>
          </div>
        </section>
      </main>
    `;
  },

  async afterRender() {
    this.loadFeaturedPerformances();
  },

  loadFeaturedPerformances() {
    $("#featuredPerformances").html(`
      <div class="col-span-3">
        ${createLoadingState({ message: "Loading performances..." })}
      </div>
    `);

    setTimeout(() => {
      const performances = statsService.getPerformances();
      const featured = performances
        .filter((p) => p.ticketingInfo?.status !== "sold_out")
        .slice(0, 6);

      if (featured.length === 0) {
        $("#featuredPerformances").html(`
          <div class="col-span-3 text-center py-12">
            <i class="fas fa-music text-6xl text-gray-300 mb-4"></i>
            <p class="text-xl text-gray-600">No performances available at the moment</p>
            <p class="text-gray-500 mt-2">Check back soon for upcoming shows</p>
          </div>
        `);
        return;
      }

      const cardsHTML = featured
        .map((perf) => PerformanceCard.renderGridCard(perf))
        .join("");
      $("#featuredPerformances").html(cardsHTML);

      $("#featuredPerformances")
        .find("[data-performance-id]")
        .on("click", function (e) {
          if (!$(e.target).closest("a").length) {
            const id = $(this).data("performance-id");
            window.location.href = `/performances/${id}`;
          }
        });
    }, 500);
  },
};
