import { statsService } from "/src/services/statsService.js";
import { FormComponents } from "/src/components/FormComponents.js";
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

        <section class="bg-white py-12 border-b border-gray-200">
          <div class="container mx-auto px-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div class="p-6">
                <div class="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                  <i class="fas fa-ticket-alt text-3xl text-indigo-600"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-900 mb-2">Easy Booking</h3>
                <p class="text-gray-600">Book your seats with just a few clicks</p>
              </div>
              <div class="p-6">
                <div class="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                  <i class="fas fa-star text-3xl text-purple-600"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-900 mb-2">Premium Experience</h3>
                <p class="text-gray-600">World-class orchestras and venues</p>
              </div>
              <div class="p-6">
                <div class="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-4">
                  <i class="fas fa-shield-alt text-3xl text-pink-600"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-900 mb-2">Secure Payment</h3>
                <p class="text-gray-600">Safe and secure booking platform</p>
              </div>
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
      <div class="col-span-3 text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p class="mt-4 text-gray-600">Loading performances...</p>
      </div>
    `);

    setTimeout(() => {
      const performances = statsService.getPerformances();
      const featured = performances
        .filter((p) => p.status !== "sold_out")
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
        .map((perf) => this.renderPerformanceCard(perf))
        .join("");
      $("#featuredPerformances").html(cardsHTML);
    }, 500);
  },

  renderPerformanceCard(performance) {
    const availability = Math.round(
      ((performance.seats.total - performance.seats.booked) /
        performance.seats.total) *
        100
    );

    const statusConfig = {
      upcoming: {
        badge: FormComponents.badge({
          text: "Upcoming",
          color: "blue",
          icon: "fa-calendar",
        }),
      },
      on_sale: {
        badge: FormComponents.badge({
          text: "On Sale",
          color: "green",
          icon: "fa-ticket-alt",
        }),
      },
      sold_out: {
        badge: FormComponents.badge({
          text: "Sold Out",
          color: "red",
          icon: "fa-times-circle",
        }),
      },
    };

    return `
      <div class="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
        <div class="relative h-48 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden">
          <div class="absolute inset-0 opacity-20">
            <i class="fas fa-music text-white text-9xl transform rotate-12"></i>
          </div>
          <div class="relative z-10 text-center text-white p-4">
            <i class="fas fa-music text-5xl mb-2 group-hover:scale-110 transition-transform"></i>
          </div>
          <div class="absolute top-4 right-4">
            ${statusConfig[performance.status]?.badge || ""}
          </div>
        </div>
        
        <div class="p-6">
          <h3 class="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
            ${performance.title}
          </h3>
          
          <div class="space-y-2 mb-4">
            <div class="flex items-center text-gray-600 text-sm">
              <i class="fas fa-calendar-alt w-5 text-indigo-500"></i>
              <span>${dayjs(performance.date).format("MMM D, YYYY")}</span>
            </div>
            <div class="flex items-center text-gray-600 text-sm">
              <i class="fas fa-map-marker-alt w-5 text-indigo-500"></i>
              <span>${performance.venue}</span>
            </div>
            <div class="flex items-center text-gray-600 text-sm">
              <i class="fas fa-user-tie w-5 text-indigo-500"></i>
              <span>${performance.conductor}</span>
            </div>
            <div class="flex items-center text-gray-600 text-sm">
              <i class="fas fa-users w-5 text-indigo-500"></i>
              <span>${performance.orchestra}</span>
            </div>
          </div>

          <div class="border-t border-gray-200 pt-4">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm text-gray-500">Availability</span>
              <span class="text-sm font-semibold ${
                availability > 50
                  ? "text-green-600"
                  : availability > 20
                  ? "text-yellow-600"
                  : "text-red-600"
              }">
                ${availability}% available
              </span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                class="h-2 rounded-full transition-all ${
                  availability > 50
                    ? "bg-green-500"
                    : availability > 20
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }" 
                style="width: ${availability}%"
              ></div>
            </div>
            
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs text-gray-500">Starting from</p>
                <p class="text-2xl font-bold text-indigo-600">$${
                  performance.price
                }</p>
              </div>
              <a 
                href="/performances/${performance.id}" 
                data-link
                class="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                <span>Book Now</span>
                <i class="fas fa-arrow-right text-white"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  },
};
