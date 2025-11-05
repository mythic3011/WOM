import dayjs from "dayjs";
import { statsService } from "/src/services/statsService.js";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export const TicketGenerator = {
  async generateQRCode(data) {
    try {
      const qrData = JSON.stringify(data);
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: "#1e293b",
          light: "#ffffff",
        },
      });
      return qrCodeDataUrl;
    } catch (error) {
      console.error("QR Code generation error:", error);
      return "";
    }
  },

  generateBarcode(bookingId) {
    try {
      const canvas = $("<canvas>")[0];
      JsBarcode(canvas, bookingId, {
        format: "CODE128",
        width: 3,
        height: 100,
        displayValue: true,
        fontSize: 16,
        margin: 10,
        background: "#ffffff",
        lineColor: "#1e293b",
      });
      return canvas.toDataURL();
    } catch (error) {
      console.error("Barcode generation error:", error);
      return "";
    }
  },

  async generateTicketHTML(booking, performance, customerInfo) {
    const qrData = {
      bookingId: booking.id,
      performanceId: booking.performanceId,
      date: performance?.date,
      seats: booking.seats,
      customerName: customerInfo?.name,
      amount: booking.amount,
    };

    const qrCodeUrl = await this.generateQRCode(qrData);
    const barcodeUrl = this.generateBarcode(booking.id);

    const seatTicketList = booking.seatTicketTypes
      ? Object.entries(booking.seatTicketTypes)
          .map(
            ([seat, ticket]) => `
          <tr class="border-b border-gray-100 hover:bg-gray-50">
            <td class="px-6 py-4">
              <span class="inline-flex items-center justify-center w-10 h-10 bg-indigo-100 text-indigo-700 rounded-lg font-bold text-sm">${seat}</span>
            </td>
            <td class="px-6 py-4 text-gray-700 font-medium">${ticket.name}</td>
            <td class="px-6 py-4 text-right text-gray-900 font-bold">${statsService.formatCurrency(
              ticket.price
            )}</td>
          </tr>
        `
          )
          .join("")
      : booking.seats
          .map(
            (seat) => `
          <tr class="border-b border-gray-100 hover:bg-gray-50">
            <td class="px-6 py-4">
              <span class="inline-flex items-center justify-center w-10 h-10 bg-indigo-100 text-indigo-700 rounded-lg font-bold text-sm">${seat}</span>
            </td>
            <td class="px-6 py-4 text-gray-700 font-medium">${
              booking.ticketType || "Standard"
            }</td>
            <td class="px-6 py-4 text-right text-gray-900 font-bold">${statsService.formatCurrency(
              booking.amount / booking.seats.length
            )}</td>
          </tr>
        `
          )
          .join("");

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>E-Ticket - ${booking.id}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: '#6366f1',
            secondary: '#8b5cf6',
          }
        }
      },
      corePlugins: {
        preflight: false,
      }
    }
  </script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    * { 
      color-scheme: initial !important;
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: #f8fafc;
      padding: 0;
    }
    @media print {
      body { background: white !important; padding: 0 !important; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
    }
    img {
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
      max-width: 100%;
      height: auto;
      display: block;
    }
    .gradient-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .ticket-card {
      background: white;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    }
    .info-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 16px;
    }
    .info-label {
      color: #64748b;
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      min-width: 120px;
    }
    .info-value {
      color: #1e293b;
      font-size: 15px;
      font-weight: 600;
      flex: 1;
    }
    .page-break {
      page-break-before: always;
      break-before: page;
      display: block;
      height: 0;
    }
  </style>
</head>
<body>
  <div id="ticket-page-1" style="width: 794px; min-height: 1123px; margin: 0 auto; padding: 40px; background: white;">
    <div class="gradient-header" style="padding: 32px; text-align: center; border-radius: 12px; margin-bottom: 32px;">
      <div style="display: inline-flex; align-items: center; justify-content: center; width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; margin-bottom: 16px;">
        <i class="fas fa-music" style="font-size: 36px; color: white;"></i>
      </div>
      <h1 style="color: white; font-size: 42px; font-weight: 800; margin-bottom: 8px; letter-spacing: 2px;">E-TICKET</h1>
      <p style="color: rgba(255,255,255,0.9); font-size: 16px; font-weight: 500;">Western Orchestral Music Performance</p>
    </div>

    <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px solid #0ea5e9; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
        <div>
          <div class="info-label" style="color: #0284c7;">
            <i class="fas fa-ticket-alt" style="margin-right: 6px;"></i>BOOKING ID
          </div>
          <div style="font-size: 24px; font-weight: 800; color: #0c4a6e; font-family: 'Courier New', monospace;">${
            booking.id
          }</div>
        </div>
        <div>
          <div class="info-label" style="color: #0284c7;">
            <i class="fas fa-calendar-check" style="margin-right: 6px;"></i>BOOKING DATE
          </div>
          <div style="font-size: 18px; font-weight: 700; color: #0c4a6e;">${dayjs(
            booking.bookingDate
          ).format("MMM D, YYYY")}</div>
        </div>
      </div>
    </div>

    <div style="background: #f8fafc; border-radius: 12px; padding: 28px; margin-bottom: 32px;">
      <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
        <i class="fas fa-user-circle" style="color: #6366f1;"></i>
        Customer Information
      </h2>
      <div style="display: grid; gap: 12px;">
        <div class="info-row">
          <div class="info-label">Name</div>
          <div class="info-value">${customerInfo?.name || "Guest"}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Email</div>
          <div class="info-value">${customerInfo?.email || "N/A"}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Phone</div>
          <div class="info-value">${customerInfo?.phone || "N/A"}</div>
        </div>
      </div>
    </div>

    <div style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border: 2px solid #a855f7; border-radius: 12px; padding: 28px; margin-bottom: 32px;">
      <h2 style="color: #581c87; font-size: 20px; font-weight: 700; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
        <i class="fas fa-theater-masks" style="color: #a855f7;"></i>
        Performance Details
      </h2>
      <div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
        <h3 style="color: #7c3aed; font-size: 26px; font-weight: 800; margin-bottom: 16px;">${
          performance?.title || "Unknown Performance"
        }</h3>
        <div style="display: grid; gap: 12px;">
          <div class="info-row">
            <div class="info-label"><i class="fas fa-calendar-alt"></i> Date & Time</div>
            <div class="info-value">${
              performance?.date
                ? dayjs(performance.date).format(
                    "dddd, MMMM D, YYYY [at] h:mm A"
                  )
                : "N/A"
            }</div>
          </div>
          <div class="info-row">
            <div class="info-label"><i class="fas fa-map-marker-alt"></i> Venue</div>
            <div class="info-value">${performance?.venue || "N/A"}</div>
          </div>
          <div class="info-row">
            <div class="info-label"><i class="fas fa-user-tie"></i> Conductor</div>
            <div class="info-value">${performance?.conductor || "N/A"}</div>
          </div>
          <div class="info-row">
            <div class="info-label"><i class="fas fa-music"></i> Orchestra</div>
            <div class="info-value">${performance?.orchestra || "N/A"}</div>
          </div>
        </div>
      </div>
    </div>

    <div style="margin-bottom: 32px;">
      <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 10px;">
        <i class="fas fa-chair" style="color: #6366f1;"></i>
        Seat & Ticket Details
      </h2>
      <div style="background: white; border: 2px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #1e293b;">
              <th style="padding: 16px 24px; text-align: left; color: white; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Seat</th>
              <th style="padding: 16px 24px; text-align: left; color: white; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Ticket Type</th>
              <th style="padding: 16px 24px; text-align: right; color: white; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${seatTicketList}
          </tbody>
          <tfoot>
            <tr style="background: #f1f5f9; border-top: 3px solid #6366f1;">
              <td colspan="2" style="padding: 20px 24px; text-align: right; font-size: 18px; font-weight: 700; color: #1e293b;">TOTAL AMOUNT</td>
              <td style="padding: 20px 24px; text-align: right; font-size: 24px; font-weight: 800; color: #6366f1;">${statsService.formatCurrency(
                booking.amount
              )}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <div style="background: #fef3c7; border: 2px solid #fbbf24; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <i class="fas fa-info-circle" style="color: #d97706; font-size: 20px; margin-top: 2px;"></i>
        <div>
          <p style="color: #92400e; font-size: 14px; font-weight: 600; line-height: 1.6; margin: 0;">
            <strong>Important:</strong> Please arrive at least 15 minutes before the performance. Present this e-ticket (digital or printed) at the entrance for verification. Late entry may not be permitted.
          </p>
        </div>
      </div>
    </div>

    <div style="background: #f8fafc; border-radius: 8px; padding: 20px; text-align: center;">
      <p style="color: #64748b; font-size: 13px; margin-bottom: 8px;">
        <i class="fas fa-envelope" style="margin-right: 6px;"></i>
        <strong>info@wom.hk</strong>
        <span style="margin: 0 12px; color: #cbd5e1;">|</span>
        <i class="fas fa-phone" style="margin-right: 6px;"></i>
        <strong>+852 2333 0600</strong>
      </p>
      <p style="color: #94a3b8; font-size: 11px; margin: 0;">
        This ticket is non-refundable and non-transferable. Photography and recording are prohibited.
      </p>
    </div>
  </div>

  <div class="page-break"></div>

  <div id="ticket-page-2" style="width: 794px; min-height: 1123px; margin: 0 auto; padding: 40px; background: white;">
    <div class="gradient-header" style="padding: 32px; text-align: center; border-radius: 12px; margin-bottom: 40px;">
      <div style="display: inline-flex; align-items: center; justify-content: center; width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; margin-bottom: 16px;">
        <i class="fas fa-qrcode" style="font-size: 36px; color: white;"></i>
      </div>
      <h1 style="color: white; font-size: 42px; font-weight: 800; margin-bottom: 8px; letter-spacing: 2px;">ENTRY VERIFICATION</h1>
      <p style="color: rgba(255,255,255,0.9); font-size: 16px; font-weight: 500;">Scan at Venue Entrance</p>
    </div>

    <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 3px solid #0ea5e9; border-radius: 16px; padding: 32px; margin-bottom: 40px; text-align: center;">
      <div style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 16px; display: inline-block;">
        <h3 style="color: #0c4a6e; font-size: 18px; font-weight: 700; margin-bottom: 8px;">${
          performance?.title || "Performance"
        }</h3>
        <p style="color: #0284c7; font-size: 14px; font-weight: 600; margin-bottom: 4px;">
          <i class="fas fa-calendar-alt" style="margin-right: 6px;"></i>${
            performance?.date
              ? dayjs(performance.date).format("MMM D, YYYY [at] h:mm A")
              : "N/A"
          }
        </p>
        <p style="color: #0284c7; font-size: 14px; font-weight: 600;">
          <i class="fas fa-map-marker-alt" style="margin-right: 6px;"></i>${
            performance?.venue || "N/A"
          }
        </p>
      </div>
    </div>

    <div style="margin-bottom: 40px;">
      <div style="background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%); border: 4px solid #6366f1; border-radius: 16px; padding: 40px; text-align: center; margin-bottom: 32px;">
        <div style="background: white; border-radius: 12px; padding: 24px; display: inline-block; box-shadow: 0 10px 30px rgba(99, 102, 241, 0.2);">
          <img src="${qrCodeUrl}" alt="QR Code" style="width: 300px; height: 300px; display: block;">
        </div>
        <div style="background: #6366f1; color: white; padding: 16px; border-radius: 12px; margin-top: 20px; display: inline-block; min-width: 300px;">
          <i class="fas fa-mobile-alt" style="font-size: 24px; margin-bottom: 8px;"></i>
          <p style="font-size: 18px; font-weight: 700; margin: 0;">SCAN QR CODE</p>
        </div>
      </div>

      <div style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border: 4px solid #6b7280; border-radius: 16px; padding: 40px; text-align: center;">
        <div style="background: white; border-radius: 12px; padding: 24px; display: inline-block; box-shadow: 0 10px 30px rgba(107, 114, 128, 0.2);">
          <img src="${barcodeUrl}" alt="Barcode" style="width: 450px; height: 120px; display: block;">
        </div>
        <div style="background: #1e293b; color: white; padding: 16px; border-radius: 12px; margin-top: 20px; display: inline-block; min-width: 300px;">
          <i class="fas fa-barcode" style="font-size: 24px; margin-bottom: 8px;"></i>
          <p style="font-size: 18px; font-weight: 700; margin: 0;">BOOKING ID: ${
            booking.id
          }</p>
        </div>
      </div>
    </div>

    <div style="background: #fef3c7; border: 3px solid #fbbf24; border-radius: 12px; padding: 28px; margin-bottom: 32px;">
      <h3 style="color: #92400e; font-size: 18px; font-weight: 700; margin-bottom: 16px; text-align: center;">
        <i class="fas fa-exclamation-triangle" style="margin-right: 8px;"></i>ENTRY INSTRUCTIONS
      </h3>
      <div style="color: #78350f; font-size: 14px; line-height: 1.8;">
        <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px;">
          <i class="fas fa-check-circle" style="color: #d97706; font-size: 18px; margin-top: 2px; flex-shrink: 0;"></i>
          <p style="margin: 0;">Present either the <strong>QR code</strong> or <strong>barcode</strong> at the entrance for scanning</p>
        </div>
        <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px;">
          <i class="fas fa-check-circle" style="color: #d97706; font-size: 18px; margin-top: 2px; flex-shrink: 0;"></i>
          <p style="margin: 0;">Have this page ready on your <strong>mobile device</strong> or <strong>printed</strong></p>
        </div>
        <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px;">
          <i class="fas fa-check-circle" style="color: #d97706; font-size: 18px; margin-top: 2px; flex-shrink: 0;"></i>
          <p style="margin: 0;">Arrive at least <strong>15 minutes early</strong> for quick entry</p>
        </div>
        <div style="display: flex; align-items: flex-start; gap: 12px;">
          <i class="fas fa-check-circle" style="color: #d97706; font-size: 18px; margin-top: 2px; flex-shrink: 0;"></i>
          <p style="margin: 0;">Each ticket is valid for <strong>one-time entry only</strong></p>
        </div>
      </div>
    </div>

    <div style="background: #1e293b; color: white; border-radius: 12px; padding: 28px; text-align: center;">
      <p style="font-size: 16px; font-weight: 600; margin-bottom: 12px;">
        <i class="fas fa-headset" style="margin-right: 8px;"></i>Need Assistance?
      </p>
      <p style="font-size: 18px; font-weight: 700; margin-bottom: 16px;">
        <i class="fas fa-envelope" style="margin-right: 8px;"></i>info@wom.hk
        <span style="margin: 0 16px; opacity: 0.5;">|</span>
        <i class="fas fa-phone" style="margin-right: 8px;"></i>+852 2333 0600
      </p>
      <p style="font-size: 13px; opacity: 0.7; margin: 0;">
        <i class="fas fa-globe" style="margin-right: 6px;"></i>Western Orchestral Music Performance System
      </p>
    </div>
  </div>
</body>
</html>
    `;
  },

  async downloadAsPDF(booking, performance, customerInfo) {
    const html = await this.generateTicketHTML(
      booking,
      performance,
      customerInfo
    );

    const $iframe = $("<iframe>")
      .css({
        position: "absolute",
        left: "-9999px",
        width: "800px",
        height: "2400px",
      })
      .appendTo("body");

    const iframe = $iframe[0];
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    await new Promise((resolve) => setTimeout(resolve, 3000));

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const imgHeight = 297;

      const page1Element = iframeDoc.getElementById("ticket-page-1");
      if (page1Element) {
        const canvas1 = await html2canvas(page1Element, {
          scale: 3,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          allowTaint: true,
          foreignObjectRendering: false,
          windowWidth: 794,
          windowHeight: 1123,
          imageTimeout: 0,
          removeContainer: false,
        });
        const imgData1 = canvas1.toDataURL("image/jpeg", 0.95);
        pdf.addImage(imgData1, "JPEG", 0, 0, imgWidth, imgHeight);
      }

      const page2Element = iframeDoc.getElementById("ticket-page-2");
      if (page2Element) {
        pdf.addPage();
        const canvas2 = await html2canvas(page2Element, {
          scale: 3,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          allowTaint: true,
          foreignObjectRendering: false,
          windowWidth: 794,
          windowHeight: 1123,
          imageTimeout: 0,
          removeContainer: false,
        });
        const imgData2 = canvas2.toDataURL("image/jpeg", 0.95);
        pdf.addImage(imgData2, "JPEG", 0, 0, imgWidth, imgHeight);
      }

      pdf.setProperties({
        title: `E-Ticket - ${booking.id}`,
        subject: `Electronic Ticket for ${performance?.title || "Performance"}`,
        author: "WOM - Western Orchestral Music",
        keywords: "ticket, e-ticket, booking, performance",
        creator: "WOM Booking System",
      });

      pdf.save(`WOM-E-Ticket-${booking.id}.pdf`);
    } finally {
      $iframe.remove();
    }
  },

  async printTicket(booking, performance, customerInfo) {
    const html = await this.generateTicketHTML(
      booking,
      performance,
      customerInfo
    );

    const $iframe = $("<iframe>")
      .css({
        position: "absolute",
        left: "-9999px",
        width: "800px",
        height: "2400px",
      })
      .appendTo("body");

    const iframe = $iframe[0];
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    await new Promise((resolve) => setTimeout(resolve, 3000));

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const imgHeight = 297;

      const page1Element = iframeDoc.getElementById("ticket-page-1");
      if (page1Element) {
        const canvas1 = await html2canvas(page1Element, {
          scale: 3,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          allowTaint: true,
          foreignObjectRendering: false,
          windowWidth: 794,
          windowHeight: 1123,
          imageTimeout: 0,
          removeContainer: false,
        });
        const imgData1 = canvas1.toDataURL("image/jpeg", 0.95);
        pdf.addImage(imgData1, "JPEG", 0, 0, imgWidth, imgHeight);
      }

      const page2Element = iframeDoc.getElementById("ticket-page-2");
      if (page2Element) {
        pdf.addPage();
        const canvas2 = await html2canvas(page2Element, {
          scale: 3,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          allowTaint: true,
          foreignObjectRendering: false,
          windowWidth: 794,
          windowHeight: 1123,
          imageTimeout: 0,
          removeContainer: false,
        });
        const imgData2 = canvas2.toDataURL("image/jpeg", 0.95);
        pdf.addImage(imgData2, "JPEG", 0, 0, imgWidth, imgHeight);
      }

      pdf.setProperties({
        title: `E-Ticket - ${booking.id}`,
        subject: `Electronic Ticket for ${performance?.title || "Performance"}`,
        author: "WOM - Western Orchestral Music",
        keywords: "ticket, e-ticket, booking, performance",
        creator: "WOM Booking System",
      });

      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, "_blank");

      setTimeout(() => {
        printWindow.print();
      }, 500);
    } finally {
      $iframe.remove();
    }
  },
};
