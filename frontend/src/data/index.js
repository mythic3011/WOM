export { DEFAULT_VENUE_TEMPLATES } from "./defaultTemplates.js";

export {
    MOCK_PERFORMANCES,
    getPerformanceById,
    getPerformancesByVenue,
    getPerformancesByStatus,
    getUpcomingPerformances,
    searchPerformances,
    getPerformancesByComposer,
    getPerformancesByCategory,
} from "./mockPerformances.js";

export {
    MOCK_VENUES,
    calculateVenueCapacity,
    normalizeVenueLayout,
    getVenueById,
    getActiveVenues,
    getVenuesByCapacity,
    searchVenues,
} from "./mockVenues.js";

export { MOCK_USERS_STATIC, generateMockUsers } from "./mockUsers.js";

export {
    VENUE_FACILITIES,
    COMMON_FACILITY_COMBINATIONS,
    TICKET_TYPES,
    SYSTEM_TICKET_TYPE_IDS,
    DEFAULT_TICKET_TYPES,
    TICKET_DISCOUNTS,
    SEAT_TIERS,
    SEAT_TIER_LABELS,
    SEAT_STATUSES,
    BOOKING_STATUSES,
    BOOKING_STATUS_LABELS,
    BOOKING_STATUS_COLORS,
    PAYMENT_STATUSES,
    PAYMENT_STATUS_LABELS,
    PAYMENT_STATUS_COLORS,
    getBookingStatusLabel,
    getBookingStatusColor,
    getPaymentStatusLabel,
    getPaymentStatusColor,
    PAYMENT_METHODS,
    PERFORMANCE_STATUSES,
    NOTIFICATION_TYPES,
    USER_ROLES,
    VENUE_STATUSES,
    HONG_KONG_VENUES,
    ORCHESTRA_COMPOSERS,
    FAMOUS_WORKS,
    ORCHESTRAS,
    CONDUCTORS,
    SOLOISTS,
    PRICE_RANGES,
    MOCK_DATA_CONFIG,
} from "./mockDataConfig.js";

export {
    DataFactory,
    DateUtils,
    DataValidation,
    DataQuery,
} from "./mockDataFactory.js";

export {
    generateAllSeats,
    MOCK_SEATS,
    generateAllBookings,
    MOCK_BOOKINGS,
    MOCK_TRANSACTIONS,
    getSeatsForPerformance,
    getAvailableSeats,
    getSeatById,
    getBookingsForUser,
    getBookingByReference,
    getBookingsForPerformance,
    getTransactionsForUser,
    formatSeatDisplay,
    formatSeatsDisplay,
    getSeatsSummary,
    formatBookingForDisplay,
} from "./mockSeatsAndBookings.js";
