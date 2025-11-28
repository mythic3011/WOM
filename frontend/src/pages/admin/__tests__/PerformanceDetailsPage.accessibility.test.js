/**
 * Accessibility Tests for PerformanceDetailsPage
 *
 * These tests verify that the Performance Details Page meets accessibility requirements
 * including ARIA labels, keyboard navigation, and screen reader support.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import PerformanceDetailsPage from "../PerformanceDetailsPage.js";

describe("PerformanceDetailsPage - Accessibility Features", () => {
  let mockPerformance;
  let mockVenue;
  let mockShowtimes;

  beforeEach(() => {
    // Setup mock data
    mockVenue = {
      id: 1,
      name: "Test Venue"
    };

    mockShowtimes = [
      {
        id: 1,
        showtimeId: "st-1",
        dateTime: "2024-03-15T19:30:00",
        datetime: "2024-03-15T19:30:00"
      },
      {
        id: 2,
        showtimeId: "st-2",
        dateTime: "2024-03-16T19:30:00",
        datetime: "2024-03-16T19:30:00"
      }
    ];

    mockPerformance = {
      id: 1,
      title: "Test Performance",
      composer: "Test Composer",
      genre: "Classical",
      duration: 120,
      description: "Test description",
      venue: mockVenue,
      showtimes: mockShowtimes,
      ticketTypes: [],
      seatMap: {
        rows: 5,
        seats: 10
      }
    };

    // Setup page state
    PerformanceDetailsPage._currentPerformance = mockPerformance;
    PerformanceDetailsPage._currentVenue = mockVenue;
    PerformanceDetailsPage._currentShowtimes = mockShowtimes;
    PerformanceDetailsPage._currentTicketTypes = [];
    PerformanceDetailsPage._bookingsData = [];
    PerformanceDetailsPage._seatStatusMap = new Map();

    // Setup DOM
    document.body.innerHTML = "<div id=\"app\"></div>";
  });

  describe("Skip Links", () => {
    it("should render skip links for keyboard navigation", () => {
      const skipLinks = PerformanceDetailsPage.renderSkipLinks();

      expect(skipLinks).toContain("skip-links");
      expect(skipLinks).toContain("href=\"#performance-info\"");
      expect(skipLinks).toContain("href=\"#showtimes-section\"");
      expect(skipLinks).toContain("href=\"#seat-map-section\"");
      expect(skipLinks).toContain("Skip to performance information");
      expect(skipLinks).toContain("Skip to showtimes");
      expect(skipLinks).toContain("Skip to seat map");
    });

    it("should have proper CSS for skip links visibility on focus", () => {
      const skipLinks = PerformanceDetailsPage.renderSkipLinks();

      expect(skipLinks).toContain(".skip-link:focus");
      expect(skipLinks).toContain("position: static");
    });
  });

  describe("ARIA Labels and Semantic HTML", () => {
    it("should use semantic section elements with aria-labelledby", () => {
      const performanceInfo = PerformanceDetailsPage.renderPerformanceInfo(mockPerformance, mockVenue);

      expect(performanceInfo).toContain("<section");
      expect(performanceInfo).toContain("id=\"performance-info\"");
      expect(performanceInfo).toContain("aria-labelledby=\"performance-info-heading\"");
      expect(performanceInfo).toContain("id=\"performance-info-heading\"");
    });

    it("should add aria-hidden to decorative icons", () => {
      const performanceInfo = PerformanceDetailsPage.renderPerformanceInfo(mockPerformance, mockVenue);

      expect(performanceInfo).toContain("aria-hidden=\"true\"");
    });

    it("should use role=\"list\" for showtimes container", () => {
      const showtimesList = PerformanceDetailsPage.renderShowtimesList();

      expect(showtimesList).toContain("role=\"list\"");
      expect(showtimesList).toContain("aria-label=\"Available showtimes\"");
    });

    it("should add descriptive aria-labels to showtime buttons", () => {
      const showtimesList = PerformanceDetailsPage.renderShowtimesList();

      expect(showtimesList).toContain("role=\"listitem\"");
      expect(showtimesList).toContain("aria-label=\"Select showtime for");
      expect(showtimesList).toContain("aria-pressed=");
      expect(showtimesList).toContain("tabindex=\"0\"");
    });

    it("should add aria-labels to seat map statistics", () => {
      PerformanceDetailsPage._seatStatusMap = new Map();
      const seatMapContent = PerformanceDetailsPage.renderSimpleSeatMap(mockPerformance.seatMap);

      expect(seatMapContent).toContain("role=\"region\"");
      expect(seatMapContent).toContain("aria-label=\"Seat availability statistics\"");
      expect(seatMapContent).toContain("role=\"group\"");
      expect(seatMapContent).toContain("aria-label=\"Total seats:");
      expect(seatMapContent).toContain("aria-label=\"Available seats:");
      expect(seatMapContent).toContain("aria-label=\"Booked seats:");
    });

    it("should add aria-label to seat map container", () => {
      PerformanceDetailsPage._seatStatusMap = new Map();
      const seatMapContent = PerformanceDetailsPage.renderSimpleSeatMap(mockPerformance.seatMap);

      expect(seatMapContent).toContain("role=\"img\"");
      expect(seatMapContent).toContain("aria-label=\"Venue seat map showing");
    });

    it("should add aria-labels to legend items", () => {
      const legend = PerformanceDetailsPage.renderSeatMapLegend();

      expect(legend).toContain("role=\"region\"");
      expect(legend).toContain("aria-labelledby=\"legend-heading\"");
      expect(legend).toContain("id=\"legend-heading\"");
      expect(legend).toContain("role=\"list\"");
      expect(legend).toContain("role=\"listitem\"");
      expect(legend).toContain("aria-label=\"Green color indicator\"");
      expect(legend).toContain("aria-label=\"Dark gray color indicator\"");
    });
  });

  describe("Screen Reader Announcements", () => {
    it("should render screen reader announcement region", () => {
      const pageContent = PerformanceDetailsPage.renderPageContent();

      expect(pageContent).toContain("id=\"sr-announcements\"");
      expect(pageContent).toContain("role=\"status\"");
      expect(pageContent).toContain("aria-live=\"polite\"");
      expect(pageContent).toContain("aria-atomic=\"true\"");
    });

    it("should announce showtime selection to screen readers", () => {
      // Setup DOM with announcement region
      document.body.innerHTML = "<div id=\"sr-announcements\" role=\"status\" aria-live=\"polite\"></div>";

      const message = "Test announcement";
      PerformanceDetailsPage.announceToScreenReader(message);

      // Wait for setTimeout
      setTimeout(() => {
        const announcer = document.getElementById("sr-announcements");
        expect(announcer.textContent).toBe(message);
      }, 150);
    });
  });

  describe("Keyboard Navigation", () => {
    it("should support Enter key for showtime selection", () => {
      document.body.innerHTML = `
        <div id="showtimes-list">
          <button class="showtime-item" data-showtime-id="st-1" data-showtime-index="0">
            <div class="flex items-center justify-between">
              <div class="font-bold text-gray-900">Mar 15, 2024</div>
            </div>
          </button>
        </div>
        <div id="sr-announcements"></div>
      `;

      PerformanceDetailsPage.attachShowtimeHandlers();

      const button = document.querySelector(".showtime-item");
      const enterEvent = new KeyboardEvent("keydown", { key: "Enter" });

      button.dispatchEvent(enterEvent);

      expect(PerformanceDetailsPage._selectedShowtimeId).toBe("st-1");
    });

    it("should support Space key for showtime selection", () => {
      document.body.innerHTML = `
        <div id="showtimes-list">
          <button class="showtime-item" data-showtime-id="st-1" data-showtime-index="0">
            <div class="flex items-center justify-between">
              <div class="font-bold text-gray-900">Mar 15, 2024</div>
            </div>
          </button>
        </div>
        <div id="sr-announcements"></div>
      `;

      PerformanceDetailsPage.attachShowtimeHandlers();

      const button = document.querySelector(".showtime-item");
      const spaceEvent = new KeyboardEvent("keydown", { key: " " });

      button.dispatchEvent(spaceEvent);

      expect(PerformanceDetailsPage._selectedShowtimeId).toBe("st-1");
    });

    it("should support Arrow Down for navigation", () => {
      document.body.innerHTML = `
        <div id="showtimes-list">
          <button class="showtime-item" data-showtime-id="st-1" data-showtime-index="0"></button>
          <button class="showtime-item" data-showtime-id="st-2" data-showtime-index="1"></button>
        </div>
      `;

      PerformanceDetailsPage.attachShowtimeHandlers();

      const buttons = document.querySelectorAll(".showtime-item");
      const focusSpy = vi.spyOn(buttons[1], "focus");

      const arrowDownEvent = new KeyboardEvent("keydown", { key: "ArrowDown" });
      buttons[0].dispatchEvent(arrowDownEvent);

      expect(focusSpy).toHaveBeenCalled();
    });

    it("should support Arrow Up for navigation", () => {
      document.body.innerHTML = `
        <div id="showtimes-list">
          <button class="showtime-item" data-showtime-id="st-1" data-showtime-index="0"></button>
          <button class="showtime-item" data-showtime-id="st-2" data-showtime-index="1"></button>
        </div>
      `;

      PerformanceDetailsPage.attachShowtimeHandlers();

      const buttons = document.querySelectorAll(".showtime-item");
      const focusSpy = vi.spyOn(buttons[0], "focus");

      const arrowUpEvent = new KeyboardEvent("keydown", { key: "ArrowUp" });
      buttons[1].dispatchEvent(arrowUpEvent);

      expect(focusSpy).toHaveBeenCalled();
    });

    it("should support Home key to jump to first showtime", () => {
      document.body.innerHTML = `
        <div id="showtimes-list">
          <button class="showtime-item" data-showtime-id="st-1" data-showtime-index="0"></button>
          <button class="showtime-item" data-showtime-id="st-2" data-showtime-index="1"></button>
        </div>
      `;

      PerformanceDetailsPage.attachShowtimeHandlers();

      const buttons = document.querySelectorAll(".showtime-item");
      const focusSpy = vi.spyOn(buttons[0], "focus");

      const homeEvent = new KeyboardEvent("keydown", { key: "Home" });
      buttons[1].dispatchEvent(homeEvent);

      expect(focusSpy).toHaveBeenCalled();
    });

    it("should support End key to jump to last showtime", () => {
      document.body.innerHTML = `
        <div id="showtimes-list">
          <button class="showtime-item" data-showtime-id="st-1" data-showtime-index="0"></button>
          <button class="showtime-item" data-showtime-id="st-2" data-showtime-index="1"></button>
        </div>
      `;

      PerformanceDetailsPage.attachShowtimeHandlers();

      const buttons = document.querySelectorAll(".showtime-item");
      const focusSpy = vi.spyOn(buttons[1], "focus");

      const endEvent = new KeyboardEvent("keydown", { key: "End" });
      buttons[0].dispatchEvent(endEvent);

      expect(focusSpy).toHaveBeenCalled();
    });
  });

  describe("Focus Management", () => {
    it("should update aria-pressed when showtime is selected", () => {
      document.body.innerHTML = `
        <div id="showtimes-list">
          <button class="showtime-item" data-showtime-id="st-1" data-showtime-index="0" aria-pressed="false">
            <div class="flex items-center justify-between">
              <div class="font-bold text-gray-900">Mar 15, 2024</div>
            </div>
          </button>
        </div>
        <div id="sr-announcements"></div>
        <div id="seat-map-content"></div>
      `;

      const button = document.querySelector(".showtime-item");
      const allButtons = document.querySelectorAll(".showtime-item");

      PerformanceDetailsPage.selectShowtime(button, allButtons);

      expect(button.getAttribute("aria-pressed")).toBe("true");
    });

    it("should have focus indicators on all interactive elements", () => {
      const showtimesList = PerformanceDetailsPage.renderShowtimesList();

      expect(showtimesList).toContain("focus:outline-none");
      expect(showtimesList).toContain("focus:ring-2");
      expect(showtimesList).toContain("focus:ring-indigo-500");
    });
  });

  describe("Seat Map Accessibility", () => {
    it("should announce seat map load to screen readers", (done) => {
      document.body.innerHTML = "<div id=\"sr-announcements\"></div>";

      PerformanceDetailsPage._seatStatusMap = new Map();
      PerformanceDetailsPage.renderSimpleSeatMap(mockPerformance.seatMap);

      setTimeout(() => {
        const announcer = document.getElementById("sr-announcements");
        expect(announcer.textContent).toContain("Seat map loaded");
        expect(announcer.textContent).toContain("total seats");
        expect(announcer.textContent).toContain("available");
        expect(announcer.textContent).toContain("booked");
        done();
      }, 600);
    });

    it("should include section information in sectioned seat map announcement", (done) => {
      document.body.innerHTML = "<div id=\"sr-announcements\"></div>";

      const sectionedSeatMap = {
        sections: [
          { name: "Orchestra", rows: 5, seatsPerRow: 10 },
          { name: "Balcony", rows: 3, seatsPerRow: 8 }
        ]
      };

      PerformanceDetailsPage._seatStatusMap = new Map();
      PerformanceDetailsPage.renderSectionedSeatMap(sectionedSeatMap);

      setTimeout(() => {
        const announcer = document.getElementById("sr-announcements");
        expect(announcer.textContent).toContain("sections");
        done();
      }, 600);
    });
  });
});
