import dayjs from "dayjs";
import Papa from "papaparse";
import {
  formatBookingForDisplay,
  formatSeatsDisplay,
  getBookingStatusLabel,
} from "@/data/index.js";

export class DataExporter {
  static exportBookingsToCSV(bookings) {
    const data = bookings.map((b) => {
      const formatted = formatBookingForDisplay(b);
      return {
        "Booking ID": b.id,
        Performance: formatted.performanceTitle,
        User: formatted.userName,
        Seats: formatSeatsDisplay(b.seats),
        Amount: b.amount || 0,
        Status: getBookingStatusLabel(b.status),
        Date: dayjs(b.bookingDate || b.date).format("YYYY-MM-DD HH:mm"),
      };
    });

    const csv = Papa.unparse(data);
    this.downloadFile(
      csv,
      `bookings-${dayjs().format("YYYY-MM-DD")}.csv`,
      "text/csv"
    );
  }

  static exportUsersToCSV(users) {
    const data = users.map((user) => ({
      ID: user.userId || user.id,
      Username: user.username,
      Name: user.name,
      Email: user.email,
      Role: user.role,
      Status: user.status,
      "Created At": dayjs(user.createdAt).format("YYYY-MM-DD HH:mm:ss"),
    }));

    const csv = Papa.unparse(data);
    this.downloadFile(
      csv,
      `users-${dayjs().format("YYYY-MM-DD")}.csv`,
      "text/csv"
    );
  }

  static exportPerformancesToCSV(performances) {
    const data = performances.map((perf) => ({
      ID: perf.id,
      Title: perf.title,
      Venue: perf.venue,
      Date: dayjs(perf.date).format("YYYY-MM-DD HH:mm"),
      Duration: perf.duration,
      "Available Seats": perf.availableSeats,
      "Total Seats": perf.totalSeats,
      Status: perf.status,
    }));

    const csv = Papa.unparse(data);
    this.downloadFile(
      csv,
      `performances-${dayjs().format("YYYY-MM-DD")}.csv`,
      "text/csv"
    );
  }

  static downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  static exportToJSON(data, filename) {
    const json = JSON.stringify(data, null, 2);
    this.downloadFile(json, filename, "application/json");
  }
}
