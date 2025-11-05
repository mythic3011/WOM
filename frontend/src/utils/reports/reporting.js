import dayjs from "dayjs";

export const reportingUtils = {
  generateUtilizationReport(showtime, performance) {
    const layout = showtime.seatLayout || { rows: 5, seatsPerRow: 8 };
    const seatDetails = showtime.seatDetails || {};

    const stats = {
      total: layout.rows * layout.seatsPerRow,
      available: 0,
      blocked: 0,
      reserved: 0,
      vip: 0,
      wheelchair: 0,
    };

    Object.values(seatDetails).forEach((seat) => {
      if (seat.status) stats[seat.status]++;
      if (seat.category === "wheelchair") stats.wheelchair++;
    });

    const utilizationPercentage = (
      ((stats.total - stats.available) / stats.total) *
      100
    ).toFixed(1);
    const blockedPercentage = ((stats.blocked / stats.total) * 100).toFixed(1);

    return {
      performance: performance.title,
      showtime: dayjs(showtime.dateTime).format("MMMM D, YYYY h:mm A"),
      venue: showtime.venueName,
      stats,
      utilizationPercentage,
      blockedPercentage,
      generatedAt: new Date().toISOString(),
    };
  },

  generateRevenueReport(showtime, performance) {
    const seatDetails = showtime.seatDetails || {};
    const pricingSections = showtime.pricing?.sections || [];

    const revenue = {
      total: 0,
      bySection: {},
      seatsSold: 0,
    };

    Object.entries(seatDetails).forEach(([seatId, seat]) => {
      if (
        seat.status === "reserved" &&
        seat.section !== null &&
        seat.section !== undefined
      ) {
        const section = pricingSections[seat.section];
        if (section) {
          const price = parseFloat(section.price) || 0;
          revenue.total += price;
          revenue.seatsSold++;

          if (!revenue.bySection[section.category]) {
            revenue.bySection[section.category] = {
              seats: 0,
              revenue: 0,
              price: price,
            };
          }

          revenue.bySection[section.category].seats++;
          revenue.bySection[section.category].revenue += price;
        }
      }
    });

    return {
      performance: performance.title,
      showtime: dayjs(showtime.dateTime).format("MMMM D, YYYY h:mm A"),
      venue: showtime.venueName,
      revenue,
      generatedAt: new Date().toISOString(),
    };
  },

  generateDetailedReport(showtime, performance) {
    const utilization = this.generateUtilizationReport(showtime, performance);
    const revenue = this.generateRevenueReport(showtime, performance);

    return {
      ...utilization,
      revenue: revenue.revenue,
    };
  },

  exportReportAsJSON(report, filename) {
    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  },

  exportReportAsCSV(report, filename) {
    let csv = "Performance,Showtime,Venue\n";
    csv += `"${report.performance}","${report.showtime}","${report.venue}"\n\n`;

    csv += "Seat Statistics\n";
    csv += "Category,Count,Percentage\n";
    csv += `Total Seats,${report.stats.total},100%\n`;
    csv += `Available,${report.stats.available},${(
      (report.stats.available / report.stats.total) *
      100
    ).toFixed(1)}%\n`;
    csv += `Blocked,${report.stats.blocked},${(
      (report.stats.blocked / report.stats.total) *
      100
    ).toFixed(1)}%\n`;
    csv += `Reserved,${report.stats.reserved},${(
      (report.stats.reserved / report.stats.total) *
      100
    ).toFixed(1)}%\n`;
    csv += `VIP,${report.stats.vip},${(
      (report.stats.vip / report.stats.total) *
      100
    ).toFixed(1)}%\n`;
    csv += `Wheelchair,${report.stats.wheelchair},${(
      (report.stats.wheelchair / report.stats.total) *
      100
    ).toFixed(1)}%\n\n`;

    if (report.revenue) {
      csv += "Revenue Statistics\n";
      csv += "Category,Seats Sold,Revenue\n";
      Object.entries(report.revenue.bySection).forEach(([category, data]) => {
        csv += `"${category}",${data.seats},$${data.revenue.toFixed(2)}\n`;
      });
      csv += `\nTotal Revenue,$${report.revenue.total.toFixed(2)}\n`;
      csv += `Total Seats Sold,${report.revenue.seatsSold}\n`;
    }

    csv += `\nGenerated: ${dayjs(report.generatedAt).format(
      "YYYY-MM-DD HH:mm:ss"
    )}\n`;

    const dataBlob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  },

  generateHTMLReport(report) {
    const utilizationColor =
      parseFloat(report.utilizationPercentage) > 75
        ? "green"
        : parseFloat(report.utilizationPercentage) > 50
        ? "yellow"
        : "red";

    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #4f46e5; border-bottom: 3px solid #4f46e5; padding-bottom: 10px;">
          Seat Utilization & Revenue Report
        </h1>
        
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: #374151;">Performance Details</h2>
          <p><strong>Performance:</strong> ${report.performance}</p>
          <p><strong>Showtime:</strong> ${report.showtime}</p>
          <p><strong>Venue:</strong> ${report.venue}</p>
          <p><strong>Generated:</strong> ${dayjs(report.generatedAt).format(
            "MMMM D, YYYY h:mm A"
          )}</p>
        </div>

        <div style="background: #${
          utilizationColor === "green"
            ? "d1fae5"
            : utilizationColor === "yellow"
            ? "fef3c7"
            : "fee2e2"
        }; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: #374151;">Utilization Rate</h2>
          <p style="font-size: 32px; font-weight: bold; margin: 10px 0; color: #${
            utilizationColor === "green"
              ? "059669"
              : utilizationColor === "yellow"
              ? "d97706"
              : "dc2626"
          };">
            ${report.utilizationPercentage}%
          </p>
          <div style="background: #e5e7eb; height: 20px; border-radius: 10px; overflow: hidden;">
            <div style="background: #${
              utilizationColor === "green"
                ? "10b981"
                : utilizationColor === "yellow"
                ? "f59e0b"
                : "ef4444"
            }; height: 100%; width: ${report.utilizationPercentage}%;"></div>
          </div>
        </div>

        <div style="background: #ffffff; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: #374151;">Seat Statistics</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                <th style="text-align: left; padding: 10px;">Category</th>
                <th style="text-align: right; padding: 10px;">Count</th>
                <th style="text-align: right; padding: 10px;">Percentage</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 10px;">Total Seats</td>
                <td style="text-align: right; padding: 10px; font-weight: bold;">${
                  report.stats.total
                }</td>
                <td style="text-align: right; padding: 10px;">100%</td>
              </tr>
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 10px;">Available</td>
                <td style="text-align: right; padding: 10px;">${
                  report.stats.available
                }</td>
                <td style="text-align: right; padding: 10px;">${(
                  (report.stats.available / report.stats.total) *
                  100
                ).toFixed(1)}%</td>
              </tr>
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 10px;">Blocked</td>
                <td style="text-align: right; padding: 10px;">${
                  report.stats.blocked
                }</td>
                <td style="text-align: right; padding: 10px;">${(
                  (report.stats.blocked / report.stats.total) *
                  100
                ).toFixed(1)}%</td>
              </tr>
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 10px;">Reserved</td>
                <td style="text-align: right; padding: 10px;">${
                  report.stats.reserved
                }</td>
                <td style="text-align: right; padding: 10px;">${(
                  (report.stats.reserved / report.stats.total) *
                  100
                ).toFixed(1)}%</td>
              </tr>
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 10px;">VIP</td>
                <td style="text-align: right; padding: 10px;">${
                  report.stats.vip
                }</td>
                <td style="text-align: right; padding: 10px;">${(
                  (report.stats.vip / report.stats.total) *
                  100
                ).toFixed(1)}%</td>
              </tr>
              <tr>
                <td style="padding: 10px;">Wheelchair Accessible</td>
                <td style="text-align: right; padding: 10px;">${
                  report.stats.wheelchair
                }</td>
                <td style="text-align: right; padding: 10px;">${(
                  (report.stats.wheelchair / report.stats.total) *
                  100
                ).toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        ${
          report.revenue
            ? `
          <div style="background: #ffffff; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #374151;">Revenue Statistics</h2>
            <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <p style="margin: 0; font-size: 14px; color: #1e40af;">Total Revenue</p>
              <p style="margin: 5px 0 0 0; font-size: 36px; font-weight: bold; color: #1e40af;">
                $${report.revenue.total.toFixed(2)}
              </p>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #1e40af;">
                ${report.revenue.seatsSold} seats sold
              </p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                  <th style="text-align: left; padding: 10px;">Section</th>
                  <th style="text-align: right; padding: 10px;">Seats Sold</th>
                  <th style="text-align: right; padding: 10px;">Price</th>
                  <th style="text-align: right; padding: 10px;">Revenue</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(report.revenue.bySection)
                  .map(
                    ([category, data]) => `
                  <tr style="border-bottom: 1px solid #f3f4f6;">
                    <td style="padding: 10px;">${category}</td>
                    <td style="text-align: right; padding: 10px;">${
                      data.seats
                    }</td>
                    <td style="text-align: right; padding: 10px;">$${data.price.toFixed(
                      2
                    )}</td>
                    <td style="text-align: right; padding: 10px; font-weight: bold;">$${data.revenue.toFixed(
                      2
                    )}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        `
            : ""
        }

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
          <p>Generated by Western Orchestral Music Performance Seat Booking System</p>
        </div>
      </div>
    `;
  },
};
