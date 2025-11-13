import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.1.0",
    info: {
      title: "Western Orchestral Music Booking System API",
      version: "1.0.0",
      description:
        "RESTful API for managing orchestral music performance bookings, users, venues, and ticket types.",
      contact: {
        name: "API Support",
        email: "admin@wom.hk",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
      {
        url: "https://api.wom.hk",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        sessionAuth: {
          type: "apiKey",
          in: "cookie",
          name: "connect.sid",
          description: "Session cookie authentication",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            username: { type: "string" },
            email: { type: "string", format: "email" },
            name: { type: "string" },
            role: { type: "string", enum: ["user", "admin"] },
            status: { type: "string", enum: ["active", "suspended"] },
            phone: { type: "string" },
            birthday: { type: "string", format: "date" },
            gender: { type: "string" },
            profileImage: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        UserInput: {
          type: "object",
          required: ["username", "email", "password", "name"],
          properties: {
            username: { type: "string" },
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 8 },
            name: { type: "string" },
            role: { type: "string", enum: ["user", "admin"], default: "user" },
            phone: { type: "string" },
            birthday: { type: "string", format: "date" },
            gender: { type: "string" },
          },
        },
        Performance: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            title: { type: "string" },
            composer: { type: "string" },
            conductor: { type: "string" },
            orchestra: { type: "string" },
            venueId: { type: "string", format: "uuid" },
            date: { type: "string", format: "date-time" },
            duration: { type: "integer" },
            status: { type: "string" },
            category: { type: "string" },
            image: { type: "string" },
            showtimes: { type: "array", items: { type: "object" } },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        PerformanceInput: {
          type: "object",
          required: ["title", "composer", "venueId", "date"],
          properties: {
            title: { type: "string" },
            composer: { type: "string" },
            conductor: { type: "string" },
            venueId: { type: "string", format: "uuid" },
            date: { type: "string", format: "date-time" },
            duration: { type: "integer" },
            category: { type: "string" },
          },
        },
        Booking: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            bookingReference: { type: "string" },
            userId: { type: "string", format: "uuid" },
            performanceId: { type: "string", format: "uuid" },
            showtimeId: { type: "string" },
            seatCount: { type: "integer" },
            totalAmount: { type: "number" },
            status: { type: "string" },
            paymentMethod: { type: "string" },
            paymentStatus: { type: "string" },
            bookingDate: { type: "string", format: "date-time" },
          },
        },
        BookingInput: {
          type: "object",
          required: ["performanceId", "showtimeId", "seats"],
          properties: {
            performanceId: { type: "string", format: "uuid" },
            showtimeId: { type: "string" },
            seats: { type: "array", items: { type: "object" } },
            paymentMethod: { type: "string" },
          },
        },
        Venue: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            address: { type: "string" },
            contact: { type: "string" },
            status: { type: "string", enum: ["active", "inactive", "maintenance"] },
            capacity: { type: "integer" },
            layout: { type: "object" },
            facilities: { type: "array", items: { type: "string" } },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        VenueInput: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", example: "Concert Hall" },
            address: { type: "string" },
            contact: { type: "string" },
            status: { type: "string", enum: ["active", "inactive", "maintenance"] },
            capacity: { type: "integer" },
            layout: { type: "object" },
            facilities: { type: "array", items: { type: "string" } },
          },
        },
        ErrorItem: {
          type: "object",
          properties: {
            field: { type: "string" },
            code: { type: "string" },
            message: { type: "string" },
            hint: { type: "string" },
            path: {
              type: "array",
              items: { oneOf: [{ type: "string" }, { type: "integer" }] },
            },
            value: {},
            context: { type: "object" },
            severity: { type: "string", enum: ["error", "warning"] },
          },
        },
        ValidationError422: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Validation failed" },
            code: { type: "string" },
            errors: {
              type: "array",
              items: { $ref: "#/components/schemas/ErrorItem" },
            },
          },
          required: ["success", "message", "errors"],
        },
      },
      responses: {
        BadRequest: {
          description: "Bad request",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  message: { type: "string" },
                  errors: { type: "array", items: { type: "object" } },
                },
              },
            },
          },
        },
        Unauthorized: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  message: { type: "string", example: "Unauthorized" },
                },
              },
            },
          },
        },
        Forbidden: {
          description: "Forbidden",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  message: { type: "string", example: "Forbidden" },
                },
              },
            },
          },
        },
        NotFound: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  message: { type: "string", example: "Resource not found" },
                },
              },
            },
          },
        },
        UnprocessableEntity: {
          description: "Validation failed",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ValidationError422" },
              examples: {
                venueLayoutInvalid: {
                  summary: "Venue layout semantic errors",
                  value: {
                    success: false,
                    message: "Semantic validation failed",
                    code: "VENUE_LAYOUT_INVALID",
                    errors: [
                      {
                        field: "layout.sections[0].aisles[1].position",
                        code: "AISLE_POSITION_OUT_OF_RANGE",
                        message: "Aisle position must be less than seatsPerRow",
                        hint: "Use position < seatsPerRow for afterSeat",
                        path: ["layout", "sections", 0, "aisles", 1, "position"],
                        value: 20,
                        context: { seatsPerRow: 18 },
                        severity: "error",
                      },
                      {
                        field: "layout.sections[0].rowsConfig[0]",
                        code: "ROW_SKIP_EMPTY_CONFLICT",
                        message: "skipSeatIndices and emptySeatIndices overlap",
                        hint: "Remove indices from one list",
                        path: ["layout", "sections", 0, "rowsConfig", 0],
                        value: [4, 5],
                        severity: "error",
                      },
                    ],
                  },
                },
                bookingSeatConflict: {
                  summary: "Booking seat unavailable",
                  value: {
                    success: false,
                    message: "Seat validation failed",
                    code: "BOOKING_SEAT_CONFLICT",
                    errors: [
                      {
                        field: "seats[0]",
                        code: "SEAT_ALREADY_BOOKED",
                        message: "Selected seat is already reserved",
                        hint: "Choose a different seat or refresh availability",
                        path: ["seats", 0],
                        value: { section: "A", row: "5", seat: "12" },
                        severity: "error",
                      },
                    ],
                  },
                },
                performanceShowtimeInvalid: {
                  summary: "Performance showtime validation errors",
                  value: {
                    success: false,
                    message: "Showtime validation failed",
                    code: "PERFORMANCE_SHOWTIME_INVALID",
                    errors: [
                      {
                        field: "showtimes[1].startTime",
                        code: "SHOWTIME_OVERLAP",
                        message: "Showtime overlaps with existing performance",
                        hint: "Adjust start time to avoid venue conflict",
                        path: ["showtimes", 1, "startTime"],
                        value: "2025-12-15T19:30:00Z",
                        context: { conflictingPerformance: "Symphony No. 9" },
                        severity: "error",
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: "Authentication",
        description: "User authentication and session management",
      },
      { name: "Users", description: "User account management" },
      { name: "Performances", description: "Orchestral performance management" },
      { name: "Bookings", description: "Ticket booking and reservation management" },
      { name: "Venues", description: "Performance venue management" },
      { name: "Ticket Types", description: "Ticket type and pricing management" },
      { name: "Statistics", description: "Dashboard and analytics data" },
    ],
  },
  apis: ["./src/routes/*.js"],
};

export const openApiSpec = swaggerJsdoc(options);
