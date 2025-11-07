export const VENUE_FACILITIES = {
  ACCESSIBILITY: [
    "Wheelchair Access",
    "Accessible Parking",
    "Accessible Restrooms",
    "Hearing Loop System",
    "Braille Signage",
    "Elevator Access",
  ],
  COMFORT: [
    "Air Conditioning",
    "Heating System",
    "Comfortable Seating",
    "Temperature Control",
  ],
  AMENITIES: [
    "WiFi",
    "Parking",
    "Coat Check",
    "Lounge Area",
    "VIP Lounge",
    "Green Room",
  ],
  FOOD_BEVERAGE: [
    "Cafe",
    "Restaurant",
    "Bar",
    "Vending Machines",
    "Catering Available",
  ],
  TECHNICAL: [
    "Premium Acoustics",
    "Sound System",
    "Lighting System",
    "Recording Facilities",
    "Stage Equipment",
    "Backstage Facilities",
  ],
  SERVICES: [
    "Gift Shop",
    "Information Desk",
    "Security",
    "First Aid",
    "Lost and Found",
  ],
};

export const COMMON_FACILITY_COMBINATIONS = {
  CONCERT_HALL: [
    "Wheelchair Access",
    "Air Conditioning",
    "Premium Acoustics",
    "WiFi",
    "Parking",
    "Cafe",
    "Gift Shop",
    "Accessible Restrooms",
  ],
  COMMUNITY_VENUE: [
    "Wheelchair Access",
    "Air Conditioning",
    "Parking",
    "WiFi",
    "Accessible Restrooms",
    "First Aid",
  ],
  LARGE_ARENA: [
    "Wheelchair Access",
    "Air Conditioning",
    "Parking",
    "Multiple Entrances",
    "WiFi",
    "Restaurant",
    "Bar",
    "VIP Lounge",
    "Gift Shop",
    "Security",
  ],
  THEATER: [
    "Wheelchair Access",
    "Air Conditioning",
    "Premium Acoustics",
    "Coat Check",
    "Lounge Area",
    "WiFi",
    "Parking",
  ],
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

export const BOOKING_STATUS_COLORS = {
  pending: "bg-yellow-500",
  confirmed: "bg-green-500",
  cancelled: "bg-red-500",
  completed: "bg-blue-500",
};

export const PAYMENT_STATUSES = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded",
};

export const PAYMENT_STATUS_LABELS = {
  pending: "Pending",
  completed: "Completed",
  failed: "Failed",
  refunded: "Refunded",
};

export const PAYMENT_STATUS_COLORS = {
  pending: "bg-yellow-500",
  completed: "bg-green-500",
  failed: "bg-red-500",
  refunded: "bg-gray-500",
};

export const getBookingStatusLabel = (status) => {
  return BOOKING_STATUS_LABELS[status] || status || "Unknown";
};

export const getBookingStatusColor = (status) => {
  return BOOKING_STATUS_COLORS[status] || "bg-gray-500";
};

export const getPaymentStatusLabel = (status) => {
  return PAYMENT_STATUS_LABELS[status] || status || "Unknown";
};

export const getPaymentStatusColor = (status) => {
  return PAYMENT_STATUS_COLORS[status] || "bg-gray-500";
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

export const NOTIFICATION_TYPES = {
  BOOKING_CONFIRMED: "booking_confirmed",
  BOOKING_CANCELLED: "booking_cancelled",
  PAYMENT_SUCCESS: "payment_success",
  PAYMENT_FAILED: "payment_failed",
  PERFORMANCE_REMINDER: "performance_reminder",
  PERFORMANCE_CANCELLED: "performance_cancelled",
  PERFORMANCE_RESCHEDULED: "performance_rescheduled",
  SYSTEM_UPDATE: "system_update",
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

export const HONG_KONG_VENUES = {
  CULTURAL_CENTRES: [
    {
      name: "Hong Kong Cultural Centre Concert Hall",
      address: "10 Salisbury Road, Tsim Sha Tsui, Kowloon",
      contact: "+852 2734 2009",
      type: "concert_hall",
      district: "Tsim Sha Tsui",
    },
    {
      name: "Hong Kong City Hall Concert Hall",
      address: "5 Edinburgh Place, Central, Hong Kong",
      contact: "+852 2921 2840",
      type: "concert_hall",
      district: "Central",
    },
  ],
  ARENAS: [
    {
      name: "Hong Kong Coliseum",
      address: "9 Cheong Wan Road, Hung Hom, Kowloon",
      contact: "+852 2355 7234",
      type: "large_arena",
      district: "Hung Hom",
    },
    {
      name: "AsiaWorld-Expo",
      address: "Airport Expo Boulevard, Lantau",
      contact: "+852 3606 8888",
      type: "large_arena",
      district: "Lantau",
    },
  ],
  TOWN_HALLS: [
    {
      name: "Tsuen Wan Town Hall Auditorium",
      address: "72 Tai Ho Road, Tsuen Wan",
      contact: "+852 2414 0144",
      type: "community_venue",
      district: "Tsuen Wan",
    },
    {
      name: "Sha Tin Town Hall Auditorium",
      address: "1 Yuen Wo Road, Sha Tin",
      contact: "+852 2694 2509",
      type: "community_venue",
      district: "Sha Tin",
    },
    {
      name: "Tuen Mun Town Hall Auditorium",
      address: "3 Tuen Hi Road, Tuen Mun",
      contact: "+852 2450 9009",
      type: "community_venue",
      district: "Tuen Mun",
    },
  ],
};

export const ORCHESTRA_COMPOSERS = [
  {
    name: "Ludwig van Beethoven",
    era: "Classical/Romantic",
    nationality: "German",
  },
  {
    name: "Wolfgang Amadeus Mozart",
    era: "Classical",
    nationality: "Austrian",
  },
  { name: "Johann Sebastian Bach", era: "Baroque", nationality: "German" },
  { name: "Pyotr Ilyich Tchaikovsky", era: "Romantic", nationality: "Russian" },
  { name: "Johannes Brahms", era: "Romantic", nationality: "German" },
  { name: "Gustav Mahler", era: "Late Romantic", nationality: "Austrian" },
  { name: "Claude Debussy", era: "Impressionist", nationality: "French" },
  { name: "Igor Stravinsky", era: "Modern", nationality: "Russian" },
  { name: "Antonio Vivaldi", era: "Baroque", nationality: "Italian" },
  { name: "Sergei Rachmaninoff", era: "Romantic", nationality: "Russian" },
  {
    name: "Franz Schubert",
    era: "Classical/Romantic",
    nationality: "Austrian",
  },
  { name: "Robert Schumann", era: "Romantic", nationality: "German" },
];

export const FAMOUS_WORKS = {
  SYMPHONY: [
    { title: "Symphony No. 9", composer: "Ludwig van Beethoven", duration: 70 },
    { title: "Symphony No. 5", composer: "Ludwig van Beethoven", duration: 33 },
    {
      title: "Symphony No. 40",
      composer: "Wolfgang Amadeus Mozart",
      duration: 38,
    },
    {
      title: "Symphony No. 6 'Pastoral'",
      composer: "Ludwig van Beethoven",
      duration: 40,
    },
    { title: "Symphony No. 4", composer: "Johannes Brahms", duration: 40 },
    { title: "Symphony No. 5", composer: "Gustav Mahler", duration: 70 },
  ],
  CONCERTO: [
    {
      title: "Piano Concerto No. 1",
      composer: "Pyotr Ilyich Tchaikovsky",
      duration: 35,
    },
    {
      title: "Violin Concerto",
      composer: "Ludwig van Beethoven",
      duration: 42,
    },
    {
      title: "Piano Concerto No. 21",
      composer: "Wolfgang Amadeus Mozart",
      duration: 30,
    },
    {
      title: "Piano Concerto No. 2",
      composer: "Sergei Rachmaninoff",
      duration: 35,
    },
  ],
  CHAMBER: [
    {
      title: "String Quartet No. 14",
      composer: "Ludwig van Beethoven",
      duration: 40,
    },
    { title: "Piano Trio in B-flat", composer: "Franz Schubert", duration: 40 },
    {
      title: "Clarinet Quintet",
      composer: "Wolfgang Amadeus Mozart",
      duration: 34,
    },
  ],
  BALLET: [
    {
      title: "The Nutcracker Suite",
      composer: "Pyotr Ilyich Tchaikovsky",
      duration: 25,
    },
    {
      title: "Swan Lake Suite",
      composer: "Pyotr Ilyich Tchaikovsky",
      duration: 30,
    },
    { title: "The Rite of Spring", composer: "Igor Stravinsky", duration: 35 },
  ],
};

export const ORCHESTRAS = [
  "Hong Kong Philharmonic Orchestra",
  "Hong Kong Sinfonietta",
  "City Chamber Orchestra of Hong Kong",
  "Hong Kong Chinese Orchestra",
  "Hong Kong Festival Orchestra",
];

export const CONDUCTORS = [
  "Jaap van Zweden",
  "Yip Wing-sie",
  "Christoph Poppen",
  "Yan Pascal Tortelier",
  "Edo de Waart",
  "Alan Gilbert",
];

export const SOLOISTS = [
  { name: "Lang Lang", instrument: "Piano", nationality: "Chinese" },
  { name: "Yo-Yo Ma", instrument: "Cello", nationality: "American" },
  { name: "Joshua Bell", instrument: "Violin", nationality: "American" },
  { name: "Anne-Sophie Mutter", instrument: "Violin", nationality: "German" },
  { name: "Martha Argerich", instrument: "Piano", nationality: "Argentine" },
  { name: "Hilary Hahn", instrument: "Violin", nationality: "American" },
];

export const PRICE_RANGES = {
  CONCERT_HALL: {
    vip: { min: 600, max: 1000 },
    premium: { min: 400, max: 600 },
    standard: { min: 200, max: 400 },
    economy: { min: 100, max: 200 },
  },
  LARGE_ARENA: {
    vip: { min: 800, max: 1500 },
    premium: { min: 500, max: 800 },
    standard: { min: 300, max: 500 },
    economy: { min: 150, max: 300 },
  },
  COMMUNITY_VENUE: {
    vip: { min: 300, max: 500 },
    premium: { min: 200, max: 300 },
    standard: { min: 100, max: 200 },
    economy: { min: 50, max: 100 },
  },
};

export const MOCK_DATA_CONFIG = {
  VENUES_COUNT: 8,
  PERFORMANCES_COUNT: 50,
  USERS_COUNT: 100,
  BOOKINGS_PER_PERFORMANCE: { min: 10, max: 50 },
  SEATS_AVAILABILITY: {
    available: 0.6,
    blocked: 0.05,
    reserved: 0.1,
    booked: 0.25,
  },
};
