
import dayjs from "dayjs";
import pdfMake from "pdfmake/build/pdfmake";
import QRCode from "qrcode";

import { COMPANY_INFO } from "@config/config.js";
import { statsService } from "@services/statsService.js";
import { parseFullId, getDisplayLabel } from "@utils/seatIdHelper.js";
import "./pdfUtils.js";

export const TicketGenerator = {
  generateVerificationCode(booking, performance) {
    const bookingIdStr = String(booking.id || booking.bookingReference);
    const perfIdStr = String(booking.performanceId);
    const timestamp = new Date(booking.bookingDate || booking.date).getTime();
    const seed = `${bookingIdStr}-${perfIdStr}-${timestamp}`;

    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    const verificationCode = `WOM${Math.abs(hash)
      .toString()
      .padStart(10, "0")
      .slice(0, 10)}`;
    return verificationCode;
  },

  async generateQRCode(data) {
    try {
      const qrData = JSON.stringify(data);
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 400,
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

  async generatePDFDefinition(
    booking,
    performance,
    customerInfo,
    showtime = null
  ) {
    const verificationCode = this.generateVerificationCode(
      booking,
      performance
    );

    const performanceDate =
      showtime?.dateTime ||
      showtime?.date ||
      performance?.dateTime ||
      performance?.date ||
      booking.performanceDate;
    const performanceVenue =
      performance?.venueName ||
      performance?.location ||
      performance?.venue ||
      "TBA";

    const qrData = {
      verificationCode,
      bookingId: booking.id || booking.bookingReference,
      performanceId: booking.performanceId,
      date: performanceDate,
      seats: booking.seats,
      customerName: customerInfo?.name,
      amount: booking.amount,
    };

    const qrCodeUrl = await this.generateQRCode(qrData);

    const seatTableBody = booking.seatTicketTypes
      ? Object.entries(booking.seatTicketTypes).map(([seatId, ticket]) => {
        const parsed = parseFullId(seatId);
        const seatNumber = parsed
          ? parsed.displayLabel
          : getDisplayLabel(seatId);
        const section = parsed
          ? parsed.sectionSlug
            .replace(/-/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase())
          : "N/A";
        const tier = ticket.tier || ticket.section || "Standard";

        return [
          { text: seatNumber, style: "seatCell" },
          { text: section, style: "ticketCell" },
          { text: tier, style: "ticketCell" },
          {
            text: statsService.formatCurrency(ticket.price),
            style: "priceCell",
            alignment: "right",
          },
        ];
      })
      : booking.seats.map((seatId) => {
        const seatIdStr =
          typeof seatId === "string"
            ? seatId
            : seatId.fullId || seatId.seatId || "";
        const parsed = parseFullId(seatIdStr);
        const seatNumber = parsed
          ? parsed.displayLabel
          : getDisplayLabel(seatIdStr);
        const section = parsed
          ? parsed.sectionSlug
            .replace(/-/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase())
          : "N/A";
        const tier = booking.ticketType || "Standard";

        return [
          { text: seatNumber, style: "seatCell" },
          { text: section, style: "ticketCell" },
          { text: tier, style: "ticketCell" },
          {
            text: statsService.formatCurrency(
              booking.amount / booking.seats.length
            ),
            style: "priceCell",
            alignment: "right",
          },
        ];
      });

    return {
      pageSize: "A4",
      pageMargins: [40, 40, 40, 40],
      content: [
        {
          text: "E-TICKET",
          style: "header",
          alignment: "center",
          margin: [0, 0, 0, 10],
        },
        {
          text: "Western Orchestral Music Performance",
          style: "subheader",
          alignment: "center",
          margin: [0, 0, 0, 20],
        },
        {
          canvas: [
            {
              type: "rect",
              x: 0,
              y: 0,
              w: 515,
              h: 2,
              color: "#6366f1",
            },
          ],
          margin: [0, 0, 0, 20],
        },
        {
          columns: [
            {
              width: "*",
              stack: [
                { text: "BOOKING ID", style: "label" },
                { text: booking.id, style: "value", margin: [0, 5, 0, 0] },
              ],
            },
            {
              width: "*",
              stack: [
                { text: "BOOKING DATE", style: "label" },
                {
                  text: dayjs(booking.bookingDate).format("MMM D, YYYY"),
                  style: "value",
                  margin: [0, 5, 0, 0],
                },
              ],
            },
          ],
          margin: [0, 0, 0, 20],
        },
        {
          text: "Customer Information",
          style: "sectionHeader",
          margin: [0, 0, 0, 10],
        },
        {
          table: {
            widths: [120, "*"],
            body: [
              [
                { text: "Name:", style: "tableLabel" },
                { text: customerInfo?.name || "Guest", style: "tableValue" },
              ],
              [
                { text: "Email:", style: "tableLabel" },
                { text: customerInfo?.email || "N/A", style: "tableValue" },
              ],
              [
                { text: "Phone:", style: "tableLabel" },
                { text: customerInfo?.phone || "N/A", style: "tableValue" },
              ],
            ],
          },
          layout: "noBorders",
          margin: [0, 0, 0, 20],
        },
        {
          text: "Performance Details",
          style: "sectionHeader",
          margin: [0, 0, 0, 10],
        },
        {
          table: {
            widths: [120, "*"],
            body: [
              [
                { text: "Title:", style: "tableLabel" },
                {
                  text:
                    performance?.title ||
                    performance?.name ||
                    "Unknown Performance",
                  style: "performanceTitle",
                },
              ],
              [
                { text: "Date & Time:", style: "tableLabel" },
                {
                  text: performanceDate
                    ? dayjs(performanceDate).format(
                      "dddd, MMMM D, YYYY [at] h:mm A"
                    )
                    : "TBA",
                  style: "tableValue",
                },
              ],
              [
                { text: "Venue:", style: "tableLabel" },
                { text: performanceVenue, style: "tableValue" },
              ],
              [
                { text: "Conductor:", style: "tableLabel" },
                {
                  text: performance?.conductor || "N/A",
                  style: "tableValue",
                },
              ],
              [
                { text: "Orchestra:", style: "tableLabel" },
                {
                  text: performance?.orchestra || "N/A",
                  style: "tableValue",
                },
              ],
            ],
          },
          layout: "noBorders",
          margin: [0, 0, 0, 20],
        },
        {
          text: "Seat & Ticket Details",
          style: "sectionHeader",
          margin: [0, 0, 0, 10],
        },
        {
          table: {
            headerRows: 1,
            widths: ["auto", "*", "*", "auto"],
            body: [
              [
                { text: "Seat", style: "tableHeader" },
                { text: "Section/Zone", style: "tableHeader" },
                { text: "Tier", style: "tableHeader" },
                { text: "Price", style: "tableHeader", alignment: "right" },
              ],
              ...seatTableBody,
              [
                { text: "", border: [false, false, false, false] },
                { text: "", border: [false, false, false, false] },
                { text: "", border: [false, false, false, false] },
                { text: "", border: [false, false, false, false] },
              ],
              [
                { text: "", border: [false, false, false, false] },
                { text: "", border: [false, false, false, false] },
                {
                  text: "TOTAL AMOUNT",
                  style: "totalLabel",
                  alignment: "right",
                  border: [false, false, false, false],
                },
                {
                  text: statsService.formatCurrency(booking.amount),
                  style: "totalValue",
                  alignment: "right",
                  border: [false, false, false, false],
                },
              ],
            ],
          },
          layout: {
            hLineWidth: (i, node) =>
              i === 1 || i === node.table.body.length - 2 ? 1 : 0,
            vLineWidth: () => 0,
            hLineColor: () => "#e5e7eb",
            paddingLeft: () => 8,
            paddingRight: () => 8,
            paddingTop: () => 8,
            paddingBottom: () => 8,
          },
          margin: [0, 0, 0, 20],
        },
        {
          table: {
            widths: ["*"],
            body: [
              [
                {
                  text: [
                    { text: "Important: ", bold: true },
                    {
                      text: "Please arrive at least 15 minutes before the performance. Present this e-ticket at the entrance for verification. Late entry may not be permitted.",
                    },
                  ],
                  style: "warningBox",
                },
              ],
            ],
          },
          layout: {
            fillColor: "#fef3c7",
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: () => "#fbbf24",
            vLineColor: () => "#fbbf24",
            paddingLeft: () => 12,
            paddingRight: () => 12,
            paddingTop: () => 12,
            paddingBottom: () => 12,
          },
          margin: [0, 0, 0, 20],
        },
        {
          text: [
            "info@wom.hk  |  +852 2333 0600\n",
            {
              text: "This ticket is non-refundable and non-transferable. Photography and recording are prohibited.",
              fontSize: 9,
              color: "#94a3b8",
            },
          ],
          style: "footer",
          alignment: "center",
        },
        { text: "", pageBreak: "after" },
        {
          text: "ENTRY VERIFICATION",
          style: "header",
          alignment: "center",
          margin: [0, 0, 0, 5],
        },
        {
          text: "Scan at Venue Entrance",
          style: "subheader",
          alignment: "center",
          margin: [0, 0, 0, 15],
        },
        {
          columns: [
            {
              width: "*",
              stack: [
                {
                  text:
                    performance?.title || performance?.name || "Performance",
                  style: "qrTitle",
                  alignment: "center",
                },
                {
                  text: performanceDate
                    ? dayjs(performanceDate).format("MMM D, YYYY [at] h:mm A")
                    : "TBA",
                  style: "qrInfo",
                  alignment: "center",
                  margin: [0, 3, 0, 0],
                },
                {
                  text: performanceVenue,
                  style: "qrInfo",
                  alignment: "center",
                  margin: [0, 2, 0, 0],
                },
              ],
            },
          ],
          margin: [0, 0, 0, 15],
        },
        {
          image: qrCodeUrl,
          width: 220,
          alignment: "center",
          margin: [0, 0, 0, 8],
        },
        {
          text: "SCAN QR CODE FOR ENTRY",
          style: "qrLabel",
          alignment: "center",
          margin: [0, 0, 0, 12],
        },
        {
          table: {
            widths: ["*"],
            body: [
              [
                {
                  stack: [
                    {
                      text: "VERIFICATION CODE",
                      style: "verificationHeader",
                      alignment: "center",
                      margin: [0, 0, 0, 6],
                    },
                    {
                      text: verificationCode,
                      style: "verificationCode",
                      alignment: "center",
                    },
                  ],
                },
              ],
            ],
          },
          layout: {
            fillColor: "#f1f5f9",
            hLineWidth: () => 2,
            vLineWidth: () => 2,
            hLineColor: () => "#6366f1",
            vLineColor: () => "#6366f1",
            paddingLeft: () => 12,
            paddingRight: () => 12,
            paddingTop: () => 8,
            paddingBottom: () => 8,
          },
          margin: [0, 0, 0, 8],
        },
        {
          text: `Booking ID: ${booking.id || booking.bookingReference}`,
          style: "qrInfo",
          alignment: "center",
          margin: [0, 0, 0, 10],
        },
        {
          table: {
            widths: ["*"],
            body: [
              [
                {
                  stack: [
                    {
                      text: "ENTRY INSTRUCTIONS",
                      style: "instructionsHeader",
                      alignment: "center",
                      margin: [0, 0, 0, 6],
                    },
                    {
                      ul: [
                        "Present the QR code at the entrance for scanning",
                        "Have this page ready on your mobile device or printed",
                        "Arrive at least 15 minutes early for quick entry",
                        "Each ticket is valid for one-time entry only",
                      ],
                      style: "instructionsList",
                    },
                  ],
                },
              ],
            ],
          },
          layout: {
            fillColor: "#fef3c7",
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: () => "#fbbf24",
            vLineColor: () => "#fbbf24",
            paddingLeft: () => 12,
            paddingRight: () => 12,
            paddingTop: () => 10,
            paddingBottom: () => 10,
          },
          margin: [0, 0, 0, 10],
        },
        {
          text: [
            { text: "Need Assistance?\n", bold: true, fontSize: 11 },
            `${COMPANY_INFO.contact.email} | ${COMPANY_INFO.contact.phone}\n`,
            {
              text: COMPANY_INFO.fullName,
              fontSize: 8,
            },
          ],
          style: "footer",
          alignment: "center",
        },
      ],
      styles: {
        header: {
          fontSize: 26,
          bold: true,
          color: "#6366f1",
          letterSpacing: 1,
        },
        subheader: {
          fontSize: 12,
          color: "#64748b",
        },
        sectionHeader: {
          fontSize: 16,
          bold: true,
          color: "#1e293b",
        },
        label: {
          fontSize: 10,
          color: "#64748b",
          bold: true,
        },
        value: {
          fontSize: 14,
          color: "#1e293b",
          bold: true,
        },
        tableLabel: {
          fontSize: 11,
          color: "#64748b",
          bold: true,
        },
        tableValue: {
          fontSize: 11,
          color: "#1e293b",
        },
        performanceTitle: {
          fontSize: 14,
          color: "#6366f1",
          bold: true,
        },
        tableHeader: {
          fontSize: 11,
          bold: true,
          color: "#1e293b",
          fillColor: "#f1f5f9",
        },
        seatCell: {
          fontSize: 11,
          bold: true,
          color: "#6366f1",
        },
        ticketCell: {
          fontSize: 11,
          color: "#1e293b",
        },
        priceCell: {
          fontSize: 11,
          color: "#1e293b",
          bold: true,
        },
        totalLabel: {
          fontSize: 13,
          bold: true,
          color: "#1e293b",
        },
        totalValue: {
          fontSize: 16,
          bold: true,
          color: "#6366f1",
        },
        warningBox: {
          fontSize: 10,
          color: "#78350f",
          lineHeight: 1.5,
        },
        footer: {
          fontSize: 10,
          color: "#64748b",
        },
        qrTitle: {
          fontSize: 14,
          bold: true,
          color: "#1e293b",
        },
        qrInfo: {
          fontSize: 10,
          color: "#64748b",
        },
        qrLabel: {
          fontSize: 13,
          bold: true,
          color: "#6366f1",
          letterSpacing: 0.5,
        },
        verificationHeader: {
          fontSize: 10,
          bold: true,
          color: "#64748b",
          letterSpacing: 0.5,
        },
        verificationCode: {
          fontSize: 18,
          bold: true,
          color: "#1e293b",
          letterSpacing: 2,
        },
        instructionsHeader: {
          fontSize: 12,
          bold: true,
          color: "#92400e",
        },
        instructionsList: {
          fontSize: 10,
          color: "#78350f",
          lineHeight: 1.4,
        },
      },
      defaultStyle: {
        font: "Roboto",
      },
    };
  },

  async downloadAsPDF(booking, performance, customerInfo, showtime = null) {
    const docDefinition = await this.generatePDFDefinition(
      booking,
      performance,
      customerInfo,
      showtime
    );
    pdfMake.createPdf(docDefinition).download(`WOM-E-Ticket-${booking.id}.pdf`);
  },

  async printTicket(booking, performance, customerInfo, showtime = null) {
    const docDefinition = await this.generatePDFDefinition(
      booking,
      performance,
      customerInfo,
      showtime
    );
    pdfMake.createPdf(docDefinition).print();
  },

  async openTicket(booking, performance, customerInfo, showtime = null) {
    const docDefinition = await this.generatePDFDefinition(
      booking,
      performance,
      customerInfo,
      showtime
    );
    pdfMake.createPdf(docDefinition).open();
  },
};

export const generateTicket =
  TicketGenerator.downloadAsPDF.bind(TicketGenerator);
export const downloadTicket =
  TicketGenerator.downloadAsPDF.bind(TicketGenerator);
export const downloadTickets = async (bookings, performances, customers) => {
  for (const booking of bookings) {
    const performance = performances.find(
      (p) => String(p.id) === String(booking.performanceId)
    );
    const customer = customers.find(
      (c) => String(c.id) === String(booking.userId)
    );

    let showtime = null;
    if (booking.showtimeId && performance?.showtimes) {
      showtime = performance.showtimes.find(
        (s) => String(s.id) === String(booking.showtimeId)
      );
    }

    await TicketGenerator.downloadAsPDF(
      booking,
      performance,
      customer,
      showtime
    );
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
};
