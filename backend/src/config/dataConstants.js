// Shared data constants for the application
// These constants are used across the application for consistent data handling

export const SEAT_TIERS = {
    VIP: "vip",
    PREMIUM: "premium",
    STANDARD: "standard",
    ECONOMY: "economy",
};

export const SEAT_TIER_LABELS = {
    vip: "VIP",
    premium: "Premium",
    standard: "Standard",
    economy: "Economy",
};

export const SEAT_STATUSES = {
    AVAILABLE: "available",
    BLOCKED: "blocked",
    RESERVED: "reserved",
    BOOKED: "booked",
};

export const BOOKING_STATUSES = {
    PENDING: "pending",
    CONFIRMED: "confirmed",
    CANCELLED: "cancelled",
    COMPLETED: "completed",
};

export const BOOKING_STATUS_LABELS = {
    pending: "Pending",
    confirmed: "Confirmed",
    cancelled: "Cancelled",
    completed: "Completed",
};

export const PAYMENT_STATUSES = {
    PENDING: "pending",
    PAID: "paid",
    FAILED: "failed",
    REFUNDED: "refunded",
};

export const PAYMENT_STATUS_LABELS = {
    pending: "Pending",
    paid: "Paid",
    failed: "Failed",
    refunded: "Refunded",
};

export const PAYMENT_METHODS = {
    CREDIT_CARD: "credit_card",
    DEBIT_CARD: "debit_card",
    PAYPAL: "paypal",
    ALIPAY: "alipay",
    WECHAT_PAY: "wechat_pay",
    BANK_TRANSFER: "bank_transfer",
};

export const PERFORMANCE_STATUSES = {
    DRAFT: "draft",
    PRE_ORDER: "pre_order",
    EARLY_BIRD: "early_bird",
    ON_SALE: "on_sale",
    SOLD_OUT: "sold_out",
    CANCELLED: "cancelled",
    COMPLETED: "completed",
};

export const USER_ROLES = {
    ADMIN: "admin",
    USER: "user",
    GUEST: "guest",
};

export const VENUE_STATUSES = {
    ACTIVE: "active",
    INACTIVE: "inactive",
    MAINTENANCE: "maintenance",
    UNDER_RENOVATION: "under_renovation",
};

export const TICKET_TYPES = {
    STANDARD: "Standard",
    STUDENT: "Student",
    SENIOR: "Senior Citizen",
    PWD: "People with Disabilities and the Minder",
    CSSA: "CSSA Recipient",
    WHEELCHAIR: "Wheelchair",
};

export const SYSTEM_TICKET_TYPE_IDS = [
    "standard",
    "student",
    "senior",
    "pwd",
    "cssa",
];

export const DEFAULT_TICKET_TYPES = [
    { id: "standard", name: "Standard", order: 1 },
    { id: "student", name: "Student", order: 2 },
    { id: "senior", name: "Senior Citizen", order: 3 },
    { id: "pwd", name: "People with Disabilities and the Minder", order: 4 },
    { id: "cssa", name: "CSSA Recipient", order: 5 },
];

export const TICKET_DISCOUNTS = {
    STUDENT: 0.5,
    SENIOR: 0.5,
    PWD: 0.5,
    CSSA: 0.5,
    WHEELCHAIR: 0.0,
};
