import dayjs from "dayjs";
import { statsService } from "@services/statsService.js";
import pdfMake from "pdfmake/build/pdfmake";
import { COMPANY_INFO } from "@config/config.js";
import { getDisplayLabel } from "@utils/seatIdHelper.js";

const initPdfMake = async () => {
  try {
    const pdfFonts = await import("pdfmake/build/vfs_fonts");
    if (pdfFonts.pdfMake?.vfs) {
      pdfMake.vfs = pdfFonts.pdfMake.vfs;
    } else if (pdfFonts.default?.pdfMake?.vfs) {
      pdfMake.vfs = pdfFonts.default.pdfMake.vfs;
    } else if (pdfFonts.default?.vfs) {
      pdfMake.vfs = pdfFonts.default.vfs;
    }
  } catch (error) {
    console.error("Failed to load pdfMake fonts:", error);
  }
};

initPdfMake();

export const InvoiceGenerator = {
  generatePDFDefinition(booking, performance, customerInfo, showtime = null) {
    const invoiceNumber = `INV-${booking.id}`;
    const invoiceDate = dayjs().format("MMMM D, YYYY");
    const dueDate = dayjs().add(7, "days").format("MMMM D, YYYY");
    const issueDate = dayjs(booking.bookingDate).format("MMMM D, YYYY");

    const performanceTitle =
      performance?.title || performance?.name || "Unknown Performance";
    const performanceDate =
      showtime?.dateTime || showtime?.date || performance?.date;
    const performanceVenue =
      performance?.venueName ||
      performance?.location ||
      performance?.venue ||
      "TBA";

    const seatTableBody = booking.seatTicketTypes
      ? Object.entries(booking.seatTicketTypes).map(([seat, ticket]) => [
        {
          text: getDisplayLabel(seat),
          style: "tableCell",
          alignment: "center",
        },
        { text: ticket.name, style: "tableCell" },
        { text: "1", style: "tableCell", alignment: "center" },
        {
          text: statsService.formatCurrency(ticket.price),
          style: "tableCell",
          alignment: "right",
        },
        {
          text: statsService.formatCurrency(ticket.price),
          style: "tableCell",
          alignment: "right",
          bold: true,
        },
      ])
      : booking.seats.map((seat) => {
        const seatId =
          typeof seat === "string" ? seat : seat.fullId || seat.seatId || "";
        return [
          {
            text: getDisplayLabel(seatId),
            style: "tableCell",
            alignment: "center",
          },
          {
            text: booking.ticketType || "Standard",
            style: "tableCell",
          },
          { text: "1", style: "tableCell", alignment: "center" },
          {
            text: statsService.formatCurrency(
              booking.amount / booking.seats.length
            ),
            style: "tableCell",
            alignment: "right",
          },
          {
            text: statsService.formatCurrency(
              booking.amount / booking.seats.length
            ),
            style: "tableCell",
            alignment: "right",
            bold: true,
          },
        ];
      });

    const subtotal = booking.amount;
    const tax = 0;
    const total = subtotal + tax;

    const paymentMethod = booking.paymentMethod || "Credit Card";
    const paymentStatus = booking.status === "confirmed" ? "PAID" : "PENDING";

    const companyAddress = [
      COMPANY_INFO.address.line1,
      COMPANY_INFO.address.line2 ? COMPANY_INFO.address.line2 + "\n" : "",
      COMPANY_INFO.address.city + "\n",
      `Tel: ${COMPANY_INFO.contact.phone}\n`,
      `Email: ${COMPANY_INFO.contact.email}`,
    ]
      .filter((line) => line && line !== "\n")
      .join("");

    return {
      pageSize: "A4",
      pageMargins: [30, 30, 30, 30],
      content: [
        {
          columns: [
            {
              width: "*",
              stack: [
                {
                  text: "INVOICE",
                  style: "header",
                  margin: [0, 0, 0, 3],
                },
                {
                  text: COMPANY_INFO.name,
                  style: "companyName",
                },
                {
                  text: companyAddress,
                  style: "companyDetails",
                },
              ],
            },
            {
              width: "auto",
              stack: [
                {
                  text: invoiceNumber,
                  style: "invoiceNumber",
                  alignment: "right",
                },
                {
                  table: {
                    widths: [80, 100],
                    body: [
                      [
                        { text: "Invoice Date:", style: "infoLabel" },
                        { text: invoiceDate, style: "infoValue" },
                      ],
                      [
                        { text: "Issue Date:", style: "infoLabel" },
                        { text: issueDate, style: "infoValue" },
                      ],
                      [
                        { text: "Due Date:", style: "infoLabel" },
                        { text: dueDate, style: "infoValue" },
                      ],
                    ],
                  },
                  layout: "noBorders",
                  margin: [0, 5, 0, 0],
                },
              ],
            },
          ],
          margin: [0, 0, 0, 15],
        },
        {
          canvas: [
            {
              type: "rect",
              x: 0,
              y: 0,
              w: 515,
              h: 1,
              color: "#6366f1",
            },
          ],
          margin: [0, 0, 0, 12],
        },
        {
          columns: [
            {
              width: "*",
              stack: [
                { text: "BILL TO", style: "sectionLabel" },
                {
                  text: customerInfo?.name || "Guest",
                  style: "customerName",
                  margin: [0, 3, 0, 2],
                },
                {
                  text: [
                    customerInfo?.email ? `${customerInfo.email}\n` : "",
                    customerInfo?.phone ? customerInfo.phone : "",
                  ],
                  style: "customerDetails",
                },
              ],
            },
            {
              width: "*",
              stack: [
                { text: "PERFORMANCE DETAILS", style: "sectionLabel" },
                {
                  text: performanceTitle,
                  style: "performanceName",
                  margin: [0, 3, 0, 2],
                },
                {
                  text: [
                    performanceDate
                      ? dayjs(performanceDate).format(
                        "MMMM D, YYYY [at] h:mm A"
                      ) + "\n"
                      : "",
                    performanceVenue,
                  ],
                  style: "performanceDetails",
                },
              ],
            },
          ],
          margin: [0, 0, 0, 15],
        },
        {
          table: {
            headerRows: 1,
            widths: [60, "*", 60, 80, 80],
            body: [
              [
                { text: "Seat", style: "tableHeader", alignment: "center" },
                { text: "Description", style: "tableHeader" },
                { text: "Qty", style: "tableHeader", alignment: "center" },
                {
                  text: "Unit Price",
                  style: "tableHeader",
                  alignment: "right",
                },
                { text: "Amount", style: "tableHeader", alignment: "right" },
              ],
              ...seatTableBody,
            ],
          },
          layout: {
            hLineWidth: (i, node) =>
              i === 0 || i === 1 || i === node.table.body.length ? 1 : 0,
            vLineWidth: () => 0,
            hLineColor: (i) => (i === 0 || i === 1 ? "#1e293b" : "#e5e7eb"),
            fillColor: (i) =>
              i === 0 ? "#f1f5f9" : i % 2 === 0 ? "#f9fafb" : null,
            paddingLeft: () => 8,
            paddingRight: () => 8,
            paddingTop: () => 6,
            paddingBottom: () => 6,
          },
          margin: [0, 0, 0, 12],
        },
        {
          columns: [
            {
              width: "*",
              text: "",
            },
            {
              width: 180,
              table: {
                widths: ["*", 70],
                body: [
                  [
                    { text: "Subtotal", style: "summaryLabel" },
                    {
                      text: statsService.formatCurrency(subtotal),
                      style: "summaryValue",
                      alignment: "right",
                    },
                  ],
                  [
                    { text: "Tax (0%)", style: "summaryLabel" },
                    {
                      text: statsService.formatCurrency(tax),
                      style: "summaryValue",
                      alignment: "right",
                    },
                  ],
                  [
                    {
                      text: "TOTAL",
                      style: "totalLabel",
                    },
                    {
                      text: statsService.formatCurrency(total),
                      style: "totalValue",
                      alignment: "right",
                    },
                  ],
                ],
              },
              layout: {
                hLineWidth: (i, node) =>
                  i === node.table.body.length - 1 ? 1 : 0,
                vLineWidth: () => 0,
                hLineColor: () => "#6366f1",
                paddingLeft: () => 0,
                paddingRight: () => 0,
                paddingTop: () => 4,
                paddingBottom: () => 4,
              },
            },
          ],
          margin: [0, 0, 0, 15],
        },
        {
          table: {
            widths: ["*"],
            body: [
              [
                {
                  stack: [
                    {
                      text: "PAYMENT INFORMATION",
                      style: "paymentHeader",
                      margin: [0, 0, 0, 5],
                    },
                    {
                      columns: [
                        {
                          width: "*",
                          stack: [
                            { text: "Payment Method", style: "paymentLabel" },
                            {
                              text: paymentMethod,
                              style: "paymentValue",
                              margin: [0, 2, 0, 0],
                            },
                          ],
                        },
                        {
                          width: "*",
                          stack: [
                            { text: "Payment Status", style: "paymentLabel" },
                            {
                              text: paymentStatus,
                              style:
                                paymentStatus === "PAID"
                                  ? "statusPaid"
                                  : "statusPending",
                              margin: [0, 2, 0, 0],
                            },
                          ],
                        },
                        {
                          width: "*",
                          stack: [
                            { text: "Booking ID", style: "paymentLabel" },
                            {
                              text: booking.id,
                              style: "paymentValue",
                              margin: [0, 2, 0, 0],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            ],
          },
          layout: {
            fillColor: "#f8fafc",
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: () => "#e2e8f0",
            vLineColor: () => "#e2e8f0",
            paddingLeft: () => 10,
            paddingRight: () => 10,
            paddingTop: () => 10,
            paddingBottom: () => 10,
          },
          margin: [0, 0, 0, 15],
        },
        {
          table: {
            widths: ["*"],
            body: [
              [
                {
                  stack: [
                    {
                      text: "TERMS & CONDITIONS",
                      style: "termsHeader",
                      margin: [0, 0, 0, 5],
                    },
                    {
                      ol: [
                        "Payment is due within 7 days from the invoice date",
                        "All sales are final. No refunds or exchanges",
                        "Please bring a valid ID and this invoice to the venue",
                        "Late arrivals may not be admitted until a suitable break",
                        "Photography and recording are strictly prohibited",
                      ],
                      style: "termsList",
                    },
                  ],
                },
              ],
            ],
          },
          layout: "noBorders",
          margin: [0, 0, 0, 12],
        },
        {
          canvas: [
            {
              type: "rect",
              x: 0,
              y: 0,
              w: 515,
              h: 1,
              color: "#e5e7eb",
            },
          ],
          margin: [0, 0, 0, 10],
        },
        {
          text: [
            { text: "Thank you for your business!\n", bold: true },
            "For questions about this invoice, please contact:\n",
            `Email: ${COMPANY_INFO.contact.email} | Phone: ${COMPANY_INFO.contact.phone}`,
          ],
          style: "footer",
          alignment: "center",
        },
      ],
      styles: {
        header: {
          fontSize: 22,
          bold: true,
          color: "#6366f1",
        },
        companyName: {
          fontSize: 11,
          bold: true,
          color: "#1e293b",
          margin: [0, 0, 0, 3],
        },
        companyDetails: {
          fontSize: 8,
          color: "#64748b",
          lineHeight: 1.3,
        },
        invoiceNumber: {
          fontSize: 16,
          bold: true,
          color: "#1e293b",
        },
        infoLabel: {
          fontSize: 8,
          color: "#64748b",
        },
        infoValue: {
          fontSize: 8,
          color: "#1e293b",
          bold: true,
        },
        sectionLabel: {
          fontSize: 9,
          bold: true,
          color: "#64748b",
        },
        customerName: {
          fontSize: 10,
          bold: true,
          color: "#1e293b",
        },
        customerDetails: {
          fontSize: 8,
          color: "#64748b",
          lineHeight: 1.3,
        },
        performanceName: {
          fontSize: 10,
          bold: true,
          color: "#6366f1",
        },
        performanceDetails: {
          fontSize: 8,
          color: "#64748b",
          lineHeight: 1.3,
        },
        tableHeader: {
          fontSize: 9,
          bold: true,
          color: "#1e293b",
        },
        tableCell: {
          fontSize: 8,
          color: "#1e293b",
        },
        summaryLabel: {
          fontSize: 9,
          color: "#64748b",
        },
        summaryValue: {
          fontSize: 9,
          color: "#1e293b",
          bold: true,
        },
        totalLabel: {
          fontSize: 11,
          bold: true,
          color: "#1e293b",
        },
        totalValue: {
          fontSize: 13,
          bold: true,
          color: "#6366f1",
        },
        paymentHeader: {
          fontSize: 10,
          bold: true,
          color: "#1e293b",
        },
        paymentLabel: {
          fontSize: 8,
          color: "#64748b",
          bold: true,
        },
        paymentValue: {
          fontSize: 9,
          color: "#1e293b",
        },
        statusPaid: {
          fontSize: 10,
          bold: true,
          color: "#16a34a",
        },
        statusPending: {
          fontSize: 10,
          bold: true,
          color: "#ea580c",
        },
        termsHeader: {
          fontSize: 10,
          bold: true,
          color: "#1e293b",
        },
        termsList: {
          fontSize: 8,
          color: "#64748b",
          lineHeight: 1.4,
        },
        footer: {
          fontSize: 8,
          color: "#64748b",
          lineHeight: 1.4,
        },
      },
      defaultStyle: {
        font: "Roboto",
      },
    };
  },

  downloadAsPDF(booking, performance, customerInfo, showtime = null) {
    const docDefinition = this.generatePDFDefinition(
      booking,
      performance,
      customerInfo,
      showtime
    );
    const invoiceNumber = `INV-${booking.id}`;
    pdfMake.createPdf(docDefinition).download(`${invoiceNumber}.pdf`);
  },

  printInvoice(booking, performance, customerInfo, showtime = null) {
    const docDefinition = this.generatePDFDefinition(
      booking,
      performance,
      customerInfo,
      showtime
    );
    pdfMake.createPdf(docDefinition).print();
  },

  openInvoice(booking, performance, customerInfo, showtime = null) {
    const docDefinition = this.generatePDFDefinition(
      booking,
      performance,
      customerInfo,
      showtime
    );
    pdfMake.createPdf(docDefinition).open();
  },
};

export const generateInvoice =
  InvoiceGenerator.downloadAsPDF.bind(InvoiceGenerator);
export const downloadInvoice =
  InvoiceGenerator.downloadAsPDF.bind(InvoiceGenerator);
