import dayjs from "dayjs";
import { statsService } from "/src/services/statsService.js";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export const InvoiceGenerator = {
  generateInvoiceHTML(booking, performance, customerInfo) {
    const invoiceNumber = `INV-${booking.id}`;
    const invoiceDate = dayjs().format("MMMM D, YYYY");
    const dueDate = dayjs().add(7, "days").format("MMMM D, YYYY");
    const issueDate = dayjs(booking.bookingDate).format("MMMM D, YYYY");

    const seatTicketList = booking.seatTicketTypes
      ? Object.entries(booking.seatTicketTypes)
          .map(
            ([seat, ticket], index) => `
          <tr class="border-b border-gray-200 ${
            index % 2 === 0 ? "bg-gray-50" : "bg-white"
          }">
            <td class="px-6 py-4 text-center">
              <span class="inline-flex items-center justify-center w-10 h-10 bg-indigo-100 text-indigo-700 rounded-lg font-bold text-sm">${seat}</span>
            </td>
            <td class="px-6 py-4 text-gray-700 font-medium">${ticket.name}</td>
            <td class="px-6 py-4 text-center text-gray-700 font-medium">1</td>
            <td class="px-6 py-4 text-right text-gray-900 font-semibold">${statsService.formatCurrency(
              ticket.price
            )}</td>
            <td class="px-6 py-4 text-right text-gray-900 font-bold">${statsService.formatCurrency(
              ticket.price
            )}</td>
          </tr>
        `
          )
          .join("")
      : booking.seats
          .map(
            (seat, index) => `
          <tr class="border-b border-gray-200 ${
            index % 2 === 0 ? "bg-gray-50" : "bg-white"
          }">
            <td class="px-6 py-4 text-center">
              <span class="inline-flex items-center justify-center w-10 h-10 bg-indigo-100 text-indigo-700 rounded-lg font-bold text-sm">${seat}</span>
            </td>
            <td class="px-6 py-4 text-gray-700 font-medium">${
              booking.ticketType || "Standard"
            }</td>
            <td class="px-6 py-4 text-center text-gray-700 font-medium">1</td>
            <td class="px-6 py-4 text-right text-gray-900 font-semibold">${statsService.formatCurrency(
              booking.amount / booking.seats.length
            )}</td>
            <td class="px-6 py-4 text-right text-gray-900 font-bold">${statsService.formatCurrency(
              booking.amount / booking.seats.length
            )}</td>
          </tr>
        `
          )
          .join("");

    const subtotal = booking.amount;
    const tax = 0;
    const total = subtotal + tax;

    const paymentMethod = booking.paymentMethod || "Credit Card";
    const paymentStatus = booking.status === "confirmed" ? "PAID" : "PENDING";

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - ${invoiceNumber}</title>
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
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
      gap: 20px;
    }
    .info-label {
      color: #64748b;
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .info-value {
      color: #1e293b;
      font-size: 14px;
      font-weight: 600;
      text-align: right;
    }
  </style>
</head>
<body>
  <div style="width: 794px; min-height: 1123px; margin: 0 auto; padding: 48px; background: white;">
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; padding-bottom: 32px; border-bottom: 4px solid #6366f1;">
      <div>
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
            <i class="fas fa-music" style="color: white; font-size: 28px;"></i>
          </div>
          <div>
            <h1 style="color: #1e293b; font-size: 28px; font-weight: 800; margin: 0; line-height: 1;">WOM</h1>
            <p style="color: #6366f1; font-size: 12px; font-weight: 600; margin: 0; margin-top: 4px;">WESTERN ORCHESTRAL MUSIC</p>
          </div>
        </div>
        <div style="color: #64748b; font-size: 13px; line-height: 1.6;">
          <p style="margin: 0;">123 Music Hall Avenue</p>
          <p style="margin: 0;">Hong Kong SAR</p>
          <p style="margin: 0; margin-top: 8px;">
            <i class="fas fa-phone" style="margin-right: 6px;"></i>+852 2333 0600
          </p>
          <p style="margin: 0;">
            <i class="fas fa-envelope" style="margin-right: 6px;"></i>info@wom.hk
          </p>
        </div>
      </div>
      <div style="text-align: right;">
        <h2 style="color: #1e293b; font-size: 42px; font-weight: 800; margin: 0; margin-bottom: 8px; letter-spacing: 1px;">INVOICE</h2>
        <div style="background: ${
          paymentStatus === "PAID" ? "#dcfce7" : "#fef3c7"
        }; border: 2px solid ${
      paymentStatus === "PAID" ? "#16a34a" : "#f59e0b"
    }; border-radius: 8px; padding: 8px 16px; display: inline-block; margin-bottom: 16px;">
          <span style="color: ${
            paymentStatus === "PAID" ? "#166534" : "#92400e"
          }; font-size: 16px; font-weight: 800; letter-spacing: 1px;">
            <i class="fas fa-${
              paymentStatus === "PAID" ? "check-circle" : "clock"
            }" style="margin-right: 6px;"></i>${paymentStatus}
          </span>
        </div>
        <div style="color: #64748b; font-size: 13px; text-align: right;">
          <div style="margin-bottom: 6px;">
            <span style="font-weight: 600; color: #1e293b;">Invoice #:</span>
            <span style="font-family: 'Courier New', monospace; font-weight: 700; color: #6366f1; margin-left: 8px;">${invoiceNumber}</span>
          </div>
          <div style="margin-bottom: 6px;">
            <span style="font-weight: 600; color: #1e293b;">Issue Date:</span>
            <span style="margin-left: 8px; font-weight: 600;">${issueDate}</span>
          </div>
          <div>
            <span style="font-weight: 600; color: #1e293b;">Invoice Date:</span>
            <span style="margin-left: 8px; font-weight: 600;">${invoiceDate}</span>
          </div>
        </div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 32px; margin-bottom: 40px;">
      <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 24px;">
        <h3 style="color: #1e293b; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
          <i class="fas fa-building" style="color: #6366f1;"></i>BILLED FROM
        </h3>
        <div style="color: #1e293b; font-size: 14px; line-height: 1.7;">
          <p style="margin: 0; font-weight: 700; font-size: 16px; margin-bottom: 8px;">Western Orchestral Music</p>
          <p style="margin: 0; color: #64748b;">123 Music Hall Avenue</p>
          <p style="margin: 0; color: #64748b;">Hong Kong SAR</p>
          <p style="margin: 0; color: #64748b; margin-top: 8px;">
            <i class="fas fa-envelope" style="margin-right: 6px; color: #6366f1;"></i>info@wom.hk
          </p>
          <p style="margin: 0; color: #64748b;">
            <i class="fas fa-phone" style="margin-right: 6px; color: #6366f1;"></i>+852 2333 0600
          </p>
        </div>
      </div>

      <div style="background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%); border: 2px solid #6366f1; border-radius: 12px; padding: 24px;">
        <h3 style="color: #4338ca; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
          <i class="fas fa-user-circle" style="color: #6366f1;"></i>BILLED TO
        </h3>
        <div style="color: #1e293b; font-size: 14px; line-height: 1.7;">
          <p style="margin: 0; font-weight: 700; font-size: 16px; margin-bottom: 8px; color: #4338ca;">${
            customerInfo?.name || "Guest Customer"
          }</p>
          <p style="margin: 0; color: #4338ca;">
            <i class="fas fa-envelope" style="margin-right: 6px;"></i>${
              customerInfo?.email || "N/A"
            }
          </p>
          <p style="margin: 0; color: #4338ca;">
            <i class="fas fa-phone" style="margin-right: 6px;"></i>${
              customerInfo?.phone || "N/A"
            }
          </p>
          <p style="margin: 0; margin-top: 12px; color: #4338ca; font-weight: 600;">
            <i class="fas fa-id-card" style="margin-right: 6px;"></i>Booking: ${
              booking.id
            }
          </p>
        </div>
      </div>
    </div>

    <div style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border: 2px solid #a855f7; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
      <h3 style="color: #581c87; font-size: 16px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 10px;">
        <i class="fas fa-theater-masks" style="color: #a855f7;"></i>Performance Details
      </h3>
      <div style="background: white; border-radius: 8px; padding: 20px;">
        <h4 style="color: #7c3aed; font-size: 20px; font-weight: 800; margin-bottom: 12px;">${
          performance?.title || "Unknown Performance"
        }</h4>
        <div style="display: grid; gap: 8px; color: #64748b; font-size: 14px;">
          <p style="margin: 0;">
            <i class="fas fa-calendar-alt" style="margin-right: 8px; color: #a855f7;"></i>
            <strong style="color: #1e293b;">Date & Time:</strong>
            <span style="margin-left: 8px;">${
              performance?.date
                ? dayjs(performance.date).format(
                    "dddd, MMMM D, YYYY [at] h:mm A"
                  )
                : "N/A"
            }</span>
          </p>
          <p style="margin: 0;">
            <i class="fas fa-map-marker-alt" style="margin-right: 8px; color: #a855f7;"></i>
            <strong style="color: #1e293b;">Venue:</strong>
            <span style="margin-left: 8px;">${
              performance?.venue || "N/A"
            }</span>
          </p>
          <p style="margin: 0;">
            <i class="fas fa-user-tie" style="margin-right: 8px; color: #a855f7;"></i>
            <strong style="color: #1e293b;">Conductor:</strong>
            <span style="margin-left: 8px;">${
              performance?.conductor || "N/A"
            }</span>
          </p>
          <p style="margin: 0;">
            <i class="fas fa-music" style="margin-right: 8px; color: #a855f7;"></i>
            <strong style="color: #1e293b;">Orchestra:</strong>
            <span style="margin-left: 8px;">${
              performance?.orchestra || "N/A"
            }</span>
          </p>
        </div>
      </div>
    </div>

    <div style="margin-bottom: 32px;">
      <h3 style="color: #1e293b; font-size: 18px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 10px;">
        <i class="fas fa-file-invoice-dollar" style="color: #6366f1;"></i>Invoice Items
      </h3>
      <div style="background: white; border: 2px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #1e293b;">
              <th style="padding: 16px 24px; text-align: center; color: white; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Seat</th>
              <th style="padding: 16px 24px; text-align: left; color: white; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Description</th>
              <th style="padding: 16px 24px; text-align: center; color: white; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
              <th style="padding: 16px 24px; text-align: right; color: white; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Unit Price</th>
              <th style="padding: 16px 24px; text-align: right; color: white; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${seatTicketList}
          </tbody>
        </table>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 400px; gap: 32px; margin-bottom: 32px;">
      <div>
        <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 16px;">
          <h4 style="color: #1e293b; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
            <i class="fas fa-credit-card" style="margin-right: 8px; color: #6366f1;"></i>Payment Information
          </h4>
          <div style="color: #64748b; font-size: 13px; line-height: 1.8;">
            <p style="margin: 0;"><strong style="color: #1e293b;">Method:</strong> ${paymentMethod}</p>
            <p style="margin: 0;"><strong style="color: #1e293b;">Status:</strong> 
              <span style="color: ${
                paymentStatus === "PAID" ? "#16a34a" : "#f59e0b"
              }; font-weight: 700;">${paymentStatus}</span>
            </p>
            ${
              paymentStatus === "PAID"
                ? `<p style="margin: 0; margin-top: 8px;"><strong style="color: #1e293b;">Payment Date:</strong> ${issueDate}</p>`
                : ""
            }
          </div>
        </div>

        <div style="background: #fef3c7; border: 2px solid #fbbf24; border-radius: 12px; padding: 20px;">
          <p style="color: #92400e; font-size: 13px; line-height: 1.6; margin: 0;">
            <i class="fas fa-info-circle" style="margin-right: 6px;"></i>
            <strong>Note:</strong> This invoice is for your records. All tickets are non-refundable and non-transferable. Please retain this document for your reference.
          </p>
        </div>
      </div>

      <div>
        <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 24px;">
          <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 2px solid #e2e8f0;">
            <div class="info-row">
              <span class="info-label">Subtotal</span>
              <span class="info-value" style="font-size: 16px;">${statsService.formatCurrency(
                subtotal
              )}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Tax (0%)</span>
              <span class="info-value" style="font-size: 16px;">${statsService.formatCurrency(
                tax
              )}</span>
            </div>
          </div>
          <div class="info-row" style="margin-bottom: 0;">
            <span style="color: #1e293b; font-size: 18px; font-weight: 800; text-transform: uppercase;">TOTAL</span>
            <span style="color: #6366f1; font-size: 28px; font-weight: 800;">${statsService.formatCurrency(
              total
            )}</span>
          </div>
        </div>

        ${
          paymentStatus === "PAID"
            ? `
        <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); border: 2px solid #16a34a; border-radius: 12px; padding: 20px; margin-top: 16px; text-align: center;">
          <i class="fas fa-check-circle" style="color: #166534; font-size: 32px; margin-bottom: 8px;"></i>
          <p style="color: #166534; font-size: 16px; font-weight: 700; margin: 0;">PAYMENT RECEIVED</p>
          <p style="color: #166534; font-size: 13px; margin: 0; margin-top: 4px;">Thank you for your payment</p>
        </div>
        `
            : ""
        }
      </div>
    </div>

    <div style="background: #f8fafc; border-top: 3px solid #6366f1; border-radius: 0 0 12px 12px; padding: 24px; text-align: center;">
      <p style="color: #64748b; font-size: 13px; margin-bottom: 12px;">
        <strong style="color: #1e293b;">Thank you for choosing Western Orchestral Music!</strong>
      </p>
      <p style="color: #64748b; font-size: 12px; margin: 0;">
        If you have any questions about this invoice, please contact us at
        <strong style="color: #6366f1;">info@wom.hk</strong> or <strong style="color: #6366f1;">+852 2333 0600</strong>
      </p>
      <p style="color: #94a3b8; font-size: 11px; margin: 0; margin-top: 16px;">
        This is a computer-generated invoice and does not require a signature.
      </p>
    </div>
  </div>
</body>
</html>
    `;
  },

  async downloadAsPDF(booking, performance, customerInfo) {
    const html = this.generateInvoiceHTML(booking, performance, customerInfo);

    const $iframe = $("<iframe>")
      .css({
        position: "absolute",
        left: "-9999px",
        width: "800px",
        height: "1200px",
      })
      .appendTo("body");

    const iframe = $iframe[0];
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    await new Promise((resolve) => setTimeout(resolve, 3000));

    try {
      const canvas = await html2canvas(iframeDoc.body, {
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

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF("p", "mm", "a4");
      const imgData = canvas.toDataURL("image/jpeg", 0.95);

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.setProperties({
        title: `Invoice - ${booking.id}`,
        subject: `Invoice for ${performance?.title || "Performance"}`,
        author: "WOM - Western Orchestral Music",
        keywords: "invoice, billing, receipt, booking",
        creator: "WOM Booking System",
      });

      pdf.save(`WOM-Invoice-${booking.id}.pdf`);
    } finally {
      $iframe.remove();
    }
  },

  async printInvoice(booking, performance, customerInfo) {
    const html = this.generateInvoiceHTML(booking, performance, customerInfo);

    const $iframe = $("<iframe>")
      .css({
        position: "absolute",
        left: "-9999px",
        width: "800px",
        height: "1200px",
      })
      .appendTo("body");

    const iframe = $iframe[0];
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    await new Promise((resolve) => setTimeout(resolve, 3000));

    try {
      const canvas = await html2canvas(iframeDoc.body, {
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

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF("p", "mm", "a4");
      const imgData = canvas.toDataURL("image/jpeg", 0.95);

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.setProperties({
        title: `Invoice - ${booking.id}`,
        subject: `Invoice for ${performance?.title || "Performance"}`,
        author: "WOM - Western Orchestral Music",
        keywords: "invoice, billing, receipt, booking",
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
