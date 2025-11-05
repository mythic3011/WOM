import { DataFactory, DateUtils, DataQuery } from "./mockDataFactory.js";
import { MOCK_USERS_STATIC } from "./mockUsers.js";

export { DataFactory, DateUtils, DataQuery };

export const MOCK_VENUES = [
  {
    id: 1,
    name: "Hong Kong Cultural Centre Concert Hall",
    address: "10 Salisbury Road, Tsim Sha Tsui, Kowloon",
    capacity: 2019,
    facilities: [
      "Wheelchair accessible",
      "Air conditioned",
      "Premium acoustics",
    ],
    contact: "+852 2734 2009",
    status: "active",
    layout: {
      sections: [
        {
          name: "Orchestra Stalls",
          rows: 8,
          seatsPerRow: 6,
          tier: "vip",
          startRow: "A",
        },
        {
          name: "Dress Circle",
          rows: 6,
          seatsPerRow: 5,
          tier: "premium",
          startRow: "I",
        },
        {
          name: "Grand Circle",
          rows: 4,
          seatsPerRow: 5,
          tier: "standard",
          startRow: "O",
        },
      ],
    },
  },
  {
    id: 2,
    name: "Hong Kong City Hall Concert Hall",
    address: "5 Edinburgh Place, Central, Hong Kong",
    capacity: 1434,
    facilities: [
      "Wheelchair accessible",
      "Air conditioned",
      "Historical venue",
    ],
    contact: "+852 2921 2840",
    status: "active",
    layout: {
      sections: [
        {
          name: "Stalls",
          rows: 7,
          seatsPerRow: 5,
          tier: "premium",
          startRow: "A",
        },
        {
          name: "Circle",
          rows: 5,
          seatsPerRow: 4,
          tier: "standard",
          startRow: "H",
        },
      ],
    },
  },
  {
    id: 3,
    name: "Hong Kong Coliseum",
    address: "9 Cheong Wan Road, Hung Hom, Kowloon",
    capacity: 12500,
    facilities: ["Large venue", "Modern facilities", "Multiple entrances"],
    contact: "+852 2355 7234",
    status: "active",
    layout: {
      sections: [
        {
          name: "Arena Floor",
          rows: 10,
          seatsPerRow: 8,
          tier: "vip",
          startRow: "A",
        },
        {
          name: "Lower Tier",
          rows: 8,
          seatsPerRow: 6,
          tier: "premium",
          startRow: "K",
        },
      ],
    },
  },
  {
    id: 4,
    name: "Tsuen Wan Town Hall Auditorium",
    address: "72 Tai Ho Road, Tsuen Wan",
    capacity: 1390,
    facilities: ["Community venue", "Good acoustics", "Easy access"],
    contact: "+852 2414 0144",
    status: "active",
    layout: {
      sections: [
        {
          name: "Orchestra",
          rows: 6,
          seatsPerRow: 5,
          tier: "standard",
          startRow: "A",
        },
        {
          name: "Balcony",
          rows: 5,
          seatsPerRow: 4,
          tier: "economy",
          startRow: "G",
        },
      ],
    },
  },
];

export const MOCK_USERS_REFERENCE = MOCK_USERS_STATIC;

export const MOCK_USERS = MOCK_USERS_REFERENCE;

export const TICKET_TYPES = {
  STANDARD: "Standard",
  STUDENT: "Student",
  SENIOR: "Senior Citizen",
  PWD: "People with Disabilities and the Minder",
  CSSA: "CSSA Recipient",
  WHEELCHAIR: "Wheelchair",
};

export const MOCK_PERFORMANCES = [
  {
    id: 1,
    title: "Symphony No. 9 - Beethoven",
    composer: "Ludwig van Beethoven",
    conductor: "John Eliot Gardiner",
    orchestra: "Hong Kong Philharmonic Orchestra",
    description:
      "Experience Beethoven's monumental Ninth Symphony featuring the iconic Ode to Joy",
    imageUrl: "/img/beethoven-9.jpg",
    performanceInfo: {
      presenter: "Hong Kong Philharmonic Orchestra",
      eventCategory: ["Western Instrumental Music", "Symphony"],
      modeOfTickets: ["Printed Ticket", "e-Ticket"],
      ageLimit: 6,
      ageLimitNote: "Person below this age not admitted",
      website: "https://www.hkphil.org",
    },
    ticketingInfo: {
      status: "early_bird",
      ticketSaleStart: "2025-01-01T10:00:00",
      preOrderStartDate: "2025-01-01",
      earlyBirdEndDate: "2025-03-31",
      saleStartDate: "2025-04-01",
      duration: "Approx. 75 minutes",
      interval: "No interval",
      groupBookingDiscount: {
        enabled: true,
        minimumTickets: 10,
        discountPercentage: 10,
        note: "Each purchase of 10 or more standard tickets (10% off)",
      },
      eTicketArrangement: {
        available: true,
        note: "E-ticket option is available for this event (only applicable to Internet and mobile app bookings). Patrons can select ticket collection by printed ticket or e-ticket mode upon ticket purchase.",
        nonMemberDelivery:
          "E-ticket(s) in image format will be delivered to the email address provided when purchasing the tickets.",
        memberOptions:
          "May choose to have the e-ticket(s) in image format delivered to the registered email address or saved in the e-ticket wallet of mobile ticketing app.",
      },
      additionalInfo:
        "Experience one of classical music's greatest masterpieces. Early bird discount available until March 31, 2025.",
    },
    showtimes: [
      {
        id: 1,
        performanceId: 1,
        dateTime: "2025-12-15T19:30:00",
        venueId: 1,
        venueName: "Hong Kong Cultural Centre Concert Hall",
        totalSeats: 98,
        bookedSeats: 45,
        availableSeats: 53,
        pricing: {
          sections: [
            {
              section: "Orchestra Stalls",
              sectionCode: "A",
              prices: {
                [TICKET_TYPES.STANDARD]: 1200,
                [TICKET_TYPES.STUDENT]: 600,
                [TICKET_TYPES.SENIOR]: 600,
                [TICKET_TYPES.PWD]: 600,
                [TICKET_TYPES.CSSA]: 600,
              },
            },
            {
              section: "Dress Circle",
              sectionCode: "B",
              prices: {
                [TICKET_TYPES.STANDARD]: 800,
                [TICKET_TYPES.STUDENT]: 400,
                [TICKET_TYPES.SENIOR]: 400,
                [TICKET_TYPES.PWD]: 400,
                [TICKET_TYPES.CSSA]: 400,
              },
            },
            {
              section: "Grand Circle",
              sectionCode: "C",
              prices: {
                [TICKET_TYPES.STANDARD]: 500,
                [TICKET_TYPES.STUDENT]: 250,
                [TICKET_TYPES.SENIOR]: 250,
                [TICKET_TYPES.PWD]: 250,
                [TICKET_TYPES.CSSA]: 250,
              },
            },
          ],
        },
      },
      {
        id: 2,
        performanceId: 1,
        dateTime: "2025-12-16T14:30:00",
        venueId: 1,
        venueName: "Hong Kong Cultural Centre Concert Hall",
        totalSeats: 98,
        bookedSeats: 23,
        availableSeats: 75,
        pricing: {
          sections: [
            {
              section: "Orchestra Stalls",
              sectionCode: "A",
              prices: {
                [TICKET_TYPES.STANDARD]: 1200,
                [TICKET_TYPES.STUDENT]: 600,
                [TICKET_TYPES.SENIOR]: 600,
                [TICKET_TYPES.PWD]: 600,
                [TICKET_TYPES.CSSA]: 600,
              },
            },
            {
              section: "Dress Circle",
              sectionCode: "B",
              prices: {
                [TICKET_TYPES.STANDARD]: 800,
                [TICKET_TYPES.STUDENT]: 400,
                [TICKET_TYPES.SENIOR]: 400,
                [TICKET_TYPES.PWD]: 400,
                [TICKET_TYPES.CSSA]: 400,
              },
            },
            {
              section: "Grand Circle",
              sectionCode: "C",
              prices: {
                [TICKET_TYPES.STANDARD]: 500,
                [TICKET_TYPES.STUDENT]: 250,
                [TICKET_TYPES.SENIOR]: 250,
                [TICKET_TYPES.PWD]: 250,
                [TICKET_TYPES.CSSA]: 250,
              },
            },
          ],
        },
      },
    ],
  },
  {
    id: 2,
    title:
      "Musicus Fest 2025 - Festival Opening: Trey Lee & English Chamber Orchestra",
    composer: "Piazzolla, Beethoven, Tchaikovsky",
    conductor: "Trey Lee",
    orchestra: "English Chamber Orchestra",
    description:
      "Celebrated cellist Trey Lee reunites with the long-established English Chamber Orchestra in Lee's own re-arrangement of Piazzolla's Four Seasons of Buenos Aires. This nature-themed concert completes an ear-opening journey with a strings version of Beethoven's idyllic Pastoral Symphony and Tchaikovsky's beautiful Chant d'automne.",
    imageUrl: "/img/musicus-fest.jpg",
    program: [
      "Tchaikovsky (arr. Paul Sherman) - Chant d'automne (October) from The Seasons, Op. 37a",
      "Beethoven - Symphony No. 6 in F, Op. 68, Pastoral",
      "Piazzolla (arr. Trey Lee) - The Four Seasons of Buenos Aires",
      "Boccherini - String Quintet in E, G. 275, Op. 11 No. 5",
      "Holst - St. Paul's Suite, Op. 29 No. 2",
    ],
    performanceInfo: {
      presenter: "Musicus Society",
      eventCategory: [
        "Western Instrumental Music",
        "Other Festivals / Series Events",
      ],
      modeOfTickets: ["Printed Ticket", "e-Ticket"],
      ageLimit: 6,
      ageLimitNote: "Person below this age not admitted",
      website: "https://www.musicussociety.org",
      sponsors: ["Bank of China (Hong Kong)", "The Tung Foundation"],
    },
    ticketingInfo: {
      status: "pre_order",
      ticketSaleStart: "2024-10-23T10:00:00",
      preOrderStartDate: "2024-08-01",
      earlyBirdEndDate: "2024-10-31",
      saleStartDate: "2024-11-01",
      duration: "Approx. 2 hrs",
      interval: "15 mins interval",
      groupBookingDiscount: {
        enabled: true,
        minimumTickets: 10,
        discountPercentage: 10,
        note: "Each purchase of 10 or more standard tickets (10% off)",
      },
      eTicketArrangement: {
        available: true,
        note: "E-ticket option is available for this event (only applicable to Internet and mobile app bookings). Patrons can select ticket collection by printed ticket or e-ticket mode upon ticket purchase.",
        nonMemberDelivery:
          "E-ticket(s) in image format will be delivered to the email address provided when purchasing the tickets.",
        memberOptions:
          "May choose to have the e-ticket(s) in image format delivered to the registered email address or saved in the e-ticket wallet of mobile ticketing app.",
      },
      additionalInfo:
        "Join us as we mark the 15th anniversary of Musicus Society with the distinguished musicians of the ECO. Musicus Society is financially supported by the Art Development Matching Grants Scheme of the Government of the Hong Kong Special Administrative Region.",
    },
    showtimes: [
      {
        id: 3,
        performanceId: 2,
        dateTime: "2025-11-01T20:00:00",
        venueId: 1,
        venueName: "Hong Kong Cultural Centre Concert Hall",
        totalSeats: 98,
        bookedSeats: 12,
        availableSeats: 86,
        pricing: {
          sections: [
            {
              section: "Orchestra Stalls",
              sectionCode: "A",
              prices: {
                [TICKET_TYPES.STANDARD]: 560,
                [TICKET_TYPES.STUDENT]: 280,
                [TICKET_TYPES.SENIOR]: 280,
                [TICKET_TYPES.PWD]: 280,
                [TICKET_TYPES.CSSA]: 280,
              },
            },
            {
              section: "Dress Circle",
              sectionCode: "B",
              prices: {
                [TICKET_TYPES.STANDARD]: 450,
                [TICKET_TYPES.STUDENT]: 225,
                [TICKET_TYPES.SENIOR]: 225,
                [TICKET_TYPES.PWD]: 225,
                [TICKET_TYPES.CSSA]: 225,
              },
            },
            {
              section: "Grand Circle",
              sectionCode: "C",
              prices: {
                [TICKET_TYPES.STANDARD]: 350,
                [TICKET_TYPES.STUDENT]: 175,
                [TICKET_TYPES.SENIOR]: 175,
                [TICKET_TYPES.PWD]: 175,
                [TICKET_TYPES.CSSA]: 175,
              },
            },
          ],
        },
      },
    ],
  },
  {
    id: 3,
    title: "Mozart Requiem",
    composer: "Wolfgang Amadeus Mozart",
    conductor: "Lio Kuokman",
    orchestra: "Hong Kong Philharmonic Orchestra",
    description:
      "Mozart's profoundly moving Requiem Mass in D minor, his final masterpiece",
    imageUrl: "/img/mozart-requiem.jpg",
    performanceInfo: {
      presenter: "Hong Kong Philharmonic Orchestra",
      eventCategory: ["Western Instrumental Music", "Vocal / Choral Music"],
      modeOfTickets: ["Printed Ticket", "e-Ticket"],
      ageLimit: 6,
      ageLimitNote: "Person below this age not admitted",
      website: "https://www.hkphil.org",
    },
    ticketingInfo: {
      status: "upcoming",
      ticketSaleStart: "2025-09-01T10:00:00",
      preOrderStartDate: "2025-06-01",
      earlyBirdEndDate: "2025-08-31",
      saleStartDate: "2025-09-01",
      duration: "Approx. 90 minutes",
      interval: "No interval",
      groupBookingDiscount: {
        enabled: true,
        minimumTickets: 10,
        discountPercentage: 10,
        note: "Each purchase of 10 or more standard tickets (10% off)",
      },
      eTicketArrangement: {
        available: true,
        note: "E-ticket option is available for this event (only applicable to Internet and mobile app bookings).",
        nonMemberDelivery:
          "E-ticket(s) in image format will be delivered to the email address provided when purchasing the tickets.",
        memberOptions:
          "May choose to have the e-ticket(s) in image format delivered to the registered email address or saved in the e-ticket wallet of mobile ticketing app.",
      },
      additionalInfo:
        "Mozart's Requiem performed with world-class soloists and chorus. A profound spiritual journey through one of classical music's most revered works.",
    },
    showtimes: [
      {
        id: 4,
        performanceId: 3,
        dateTime: "2026-01-25T19:30:00",
        venueId: 1,
        venueName: "Hong Kong Cultural Centre Concert Hall",
        totalSeats: 98,
        bookedSeats: 8,
        availableSeats: 90,
        pricing: {
          sections: [
            {
              section: "Orchestra Stalls",
              sectionCode: "A",
              prices: {
                [TICKET_TYPES.STANDARD]: 1300,
                [TICKET_TYPES.STUDENT]: 650,
                [TICKET_TYPES.SENIOR]: 650,
                [TICKET_TYPES.PWD]: 650,
                [TICKET_TYPES.CSSA]: 650,
              },
            },
            {
              section: "Dress Circle",
              sectionCode: "B",
              prices: {
                [TICKET_TYPES.STANDARD]: 900,
                [TICKET_TYPES.STUDENT]: 450,
                [TICKET_TYPES.SENIOR]: 450,
                [TICKET_TYPES.PWD]: 450,
                [TICKET_TYPES.CSSA]: 450,
              },
            },
            {
              section: "Grand Circle",
              sectionCode: "C",
              prices: {
                [TICKET_TYPES.STANDARD]: 600,
                [TICKET_TYPES.STUDENT]: 300,
                [TICKET_TYPES.SENIOR]: 300,
                [TICKET_TYPES.PWD]: 300,
                [TICKET_TYPES.CSSA]: 300,
              },
            },
          ],
        },
      },
      {
        id: 5,
        performanceId: 3,
        dateTime: "2026-01-26T14:30:00",
        venueId: 2,
        venueName: "Hong Kong City Hall Concert Hall",
        totalSeats: 55,
        bookedSeats: 5,
        availableSeats: 50,
        pricing: {
          sections: [
            {
              section: "Stalls",
              sectionCode: "A",
              prices: {
                [TICKET_TYPES.STANDARD]: 1000,
                [TICKET_TYPES.STUDENT]: 500,
                [TICKET_TYPES.SENIOR]: 500,
                [TICKET_TYPES.PWD]: 500,
                [TICKET_TYPES.CSSA]: 500,
              },
            },
            {
              section: "Circle",
              sectionCode: "B",
              prices: {
                [TICKET_TYPES.STANDARD]: 650,
                [TICKET_TYPES.STUDENT]: 325,
                [TICKET_TYPES.SENIOR]: 325,
                [TICKET_TYPES.PWD]: 325,
                [TICKET_TYPES.CSSA]: 325,
              },
            },
          ],
        },
      },
    ],
  },
  {
    id: 4,
    title: "Mahler Symphony No. 5",
    composer: "Gustav Mahler",
    conductor: "Jaap van Zweden",
    orchestra: "Hong Kong Philharmonic Orchestra",
    description:
      "A journey through love, loss, and triumph with Mahler's Fifth Symphony",
    imageUrl: "/img/mahler-5.jpg",
    performanceInfo: {
      presenter: "Hong Kong Philharmonic Orchestra",
      eventCategory: ["Western Instrumental Music", "Symphony"],
      modeOfTickets: ["Printed Ticket", "e-Ticket"],
      ageLimit: 6,
      ageLimitNote: "Person below this age not admitted",
      website: "https://www.hkphil.org",
    },
    ticketingInfo: {
      status: "on_sale",
      ticketSaleStart: "2025-02-01T10:00:00",
      preOrderStartDate: "2024-11-01",
      earlyBirdEndDate: "2025-01-31",
      saleStartDate: "2025-02-01",
      duration: "Approx. 80 minutes",
      interval: "No interval",
      groupBookingDiscount: {
        enabled: true,
        minimumTickets: 10,
        discountPercentage: 15,
        note: "Each purchase of 10 or more standard tickets (15% off)",
      },
      eTicketArrangement: {
        available: true,
        note: "E-ticket option is available for this event (only applicable to Internet and mobile app bookings). Patrons can select ticket collection by printed ticket or e-ticket mode upon ticket purchase.",
        nonMemberDelivery:
          "E-ticket(s) in image format will be delivered to the email address provided when purchasing the tickets.",
        memberOptions:
          "May choose to have the e-ticket(s) in image format delivered to the registered email address or saved in the e-ticket wallet of mobile ticketing app.",
      },
      additionalInfo:
        "Featuring the famous Adagietto. Tickets selling fast! Group discount available for 10+ tickets.",
    },
    showtimes: [
      {
        id: 6,
        performanceId: 4,
        dateTime: "2025-10-10T19:30:00",
        venueId: 3,
        venueName: "Hong Kong Coliseum",
        totalSeats: 128,
        bookedSeats: 98,
        availableSeats: 30,
        pricing: {
          sections: [
            {
              section: "Arena Floor",
              sectionCode: "A",
              prices: {
                [TICKET_TYPES.STANDARD]: 1500,
                [TICKET_TYPES.STUDENT]: 750,
                [TICKET_TYPES.SENIOR]: 750,
                [TICKET_TYPES.PWD]: 750,
                [TICKET_TYPES.CSSA]: 750,
              },
            },
            {
              section: "Lower Tier",
              sectionCode: "B",
              prices: {
                [TICKET_TYPES.STANDARD]: 1000,
                [TICKET_TYPES.STUDENT]: 500,
                [TICKET_TYPES.SENIOR]: 500,
                [TICKET_TYPES.PWD]: 500,
                [TICKET_TYPES.CSSA]: 500,
              },
            },
          ],
        },
      },
      {
        id: 7,
        performanceId: 4,
        dateTime: "2025-10-11T19:30:00",
        venueId: 3,
        venueName: "Hong Kong Coliseum",
        totalSeats: 128,
        bookedSeats: 56,
        availableSeats: 72,
        pricing: {
          sections: [
            {
              section: "Arena Floor",
              sectionCode: "A",
              prices: {
                [TICKET_TYPES.STANDARD]: 1500,
                [TICKET_TYPES.STUDENT]: 750,
                [TICKET_TYPES.SENIOR]: 750,
                [TICKET_TYPES.PWD]: 750,
                [TICKET_TYPES.CSSA]: 750,
              },
            },
            {
              section: "Lower Tier",
              sectionCode: "B",
              prices: {
                [TICKET_TYPES.STANDARD]: 1000,
                [TICKET_TYPES.STUDENT]: 500,
                [TICKET_TYPES.SENIOR]: 500,
                [TICKET_TYPES.PWD]: 500,
                [TICKET_TYPES.CSSA]: 500,
              },
            },
          ],
        },
      },
      {
        id: 8,
        performanceId: 4,
        dateTime: "2025-10-12T15:00:00",
        venueId: 4,
        venueName: "Tsuen Wan Town Hall Auditorium",
        totalSeats: 50,
        bookedSeats: 15,
        availableSeats: 35,
        pricing: {
          sections: [
            {
              section: "Orchestra",
              sectionCode: "A",
              prices: {
                [TICKET_TYPES.STANDARD]: 800,
                [TICKET_TYPES.STUDENT]: 400,
                [TICKET_TYPES.SENIOR]: 400,
                [TICKET_TYPES.PWD]: 400,
                [TICKET_TYPES.CSSA]: 400,
              },
            },
            {
              section: "Balcony",
              sectionCode: "B",
              prices: {
                [TICKET_TYPES.STANDARD]: 500,
                [TICKET_TYPES.STUDENT]: 250,
                [TICKET_TYPES.SENIOR]: 250,
                [TICKET_TYPES.PWD]: 250,
                [TICKET_TYPES.CSSA]: 250,
              },
            },
          ],
        },
      },
    ],
  },
  {
    id: 5,
    title:
      "PREMIERE PERFORMANCES: Viva! Pipers 10th Anniversary Musical Fairy Tales",
    composer: "Various",
    conductor: "Viva! Pipers Ensemble",
    orchestra: "Viva! Pipers",
    description:
      "Join us for an enchanting celebration of Viva! Pipers' 10th Anniversary with a delightful collection of musical fairy tales performed in English. Perfect for families and children.",
    imageUrl: "/img/viva-pipers.jpg",
    performanceInfo: {
      presenter: "Viva! Pipers",
      eventCategory: ["Children & Family", "Musical Theatre"],
      modeOfTickets: ["Printed Ticket", "e-Ticket"],
      ageLimit: 3,
      ageLimitNote: "Person below this age not admitted",
      website: "https://www.vivapipers.org",
      language: "Performed in English",
    },
    ticketingInfo: {
      status: "on_sale",
      ticketSaleStart: "2025-08-15T10:00:00",
      preOrderStartDate: "2025-08-01",
      saleStartDate: "2025-08-15",
      duration: "Approx. 90 minutes",
      interval: "15 mins interval",
      discountDetails: {
        studentDiscount: {
          enabled: true,
          percentage: 50,
          note: "Full-time Students (50% off)",
        },
        seniorDiscount: {
          enabled: true,
          percentage: 50,
          note: "Senior Citizens Aged 60 or Above (50% off)",
        },
        pwdDiscount: {
          enabled: true,
          percentage: 50,
          note: "People with Disabilities & the Minder* (50% off)",
          specialNote:
            "* For purchase of each concessionary ticket for people with disabilities, the customer can purchase one ticket of same concession for a minder.",
        },
        cssaDiscount: {
          enabled: true,
          percentage: 50,
          note: "Comprehensive Social Security Assistance Recipients (50% off, with limited quota)",
        },
      },
      groupBookingDiscount: {
        enabled: true,
        tiers: [
          {
            minimumTickets: 10,
            maximumTickets: null,
            discountPercentage: 10,
            note: "Each purchase of 10 or more standard tickets (10% off)",
          },
        ],
      },
      eTicketArrangement: {
        available: true,
        note: "E-ticket option is available for this event (only applicable to Internet and mobile app bookings). Patrons can select ticket collection by printed ticket or e-ticket mode upon ticket purchase.",
        nonMemberDelivery:
          "E-ticket(s) in image format will be delivered to the email address provided when purchasing the tickets.",
        memberOptions:
          "May choose to have the e-ticket(s) in image format delivered to the registered email address or saved in the e-ticket wallet of mobile ticketing app.",
      },
      additionalInfo:
        "A wonderful anniversary celebration for the whole family. Book early to secure your seats!",
    },
    showtimes: [
      {
        id: 9,
        performanceId: 5,
        dateTime: "2025-11-08T14:30:00",
        venueId: 2,
        venueName: "Hong Kong City Hall Concert Hall",
        totalSeats: 55,
        bookedSeats: 18,
        availableSeats: 37,
        pricing: {
          sections: [
            {
              section: "Stalls",
              sectionCode: "A",
              prices: {
                [TICKET_TYPES.STANDARD]: 380,
                [TICKET_TYPES.STUDENT]: 190,
                [TICKET_TYPES.SENIOR]: 190,
                [TICKET_TYPES.PWD]: 190,
                [TICKET_TYPES.WHEELCHAIR]: null,
              },
            },
            {
              section: "Circle",
              sectionCode: "B",
              prices: {
                [TICKET_TYPES.STANDARD]: 280,
                [TICKET_TYPES.STUDENT]: 140,
                [TICKET_TYPES.SENIOR]: 140,
                [TICKET_TYPES.PWD]: 140,
                [TICKET_TYPES.WHEELCHAIR]: null,
              },
            },
            {
              section: "Upper Circle",
              sectionCode: "C",
              prices: {
                [TICKET_TYPES.STANDARD]: 180,
                [TICKET_TYPES.STUDENT]: 90,
                [TICKET_TYPES.SENIOR]: 90,
                [TICKET_TYPES.PWD]: 90,
                [TICKET_TYPES.WHEELCHAIR]: null,
              },
            },
          ],
        },
      },
    ],
  },
  {
    id: 6,
    title:
      'Classical Music Lecture Series 2: "Top 10 Romantic Symphonies" - Lecture 1',
    composer: "Educational Series",
    conductor: "Dr. Clarence Mak",
    orchestra: "Hong Kong Philharmonic Orchestra",
    description:
      "An engaging lecture series exploring the greatest symphonies of the Romantic era. Learn about the history, context, and musical genius behind these timeless masterpieces.",
    imageUrl: "/img/lecture-series.jpg",
    performanceInfo: {
      presenter: "Hong Kong City Hall",
      eventCategory: ["Lecture / Demonstration", "Educational"],
      modeOfTickets: ["Printed Ticket", "e-Ticket"],
      ageLimit: 6,
      ageLimitNote: "Person below this age not admitted",
      website: "https://www.lcsd.gov.hk",
      seriesInfo: {
        seriesName:
          'Classical Music Lecture Series 2: "Top 10 Romantic Symphonies"',
        lectureNumber: 1,
        totalLectures: 4,
        relatedSeries: [
          'Classical Music Lecture Series 1: "Beethoven 1-9" (Sai Wan Ho Civic Centre)',
        ],
      },
    },
    ticketingInfo: {
      status: "on_sale",
      ticketSaleStart: "2025-08-29T10:00:00",
      saleStartDate: "2025-08-29",
      duration: "Approx. 90 minutes",
      interval: "No interval",
      discountDetails: {
        studentDiscount: {
          enabled: true,
          percentage: 50,
          note: "Full-time Students (50% off)",
        },
        seniorDiscount: {
          enabled: true,
          percentage: 50,
          note: "Senior Citizens Aged 60 or Above (50% off)",
        },
        pwdDiscount: {
          enabled: true,
          percentage: 50,
          note: "People with Disabilities & the Minder* (50% off)",
          specialNote:
            "* For purchase of each concessionary ticket for people with disabilities, the customer can purchase one ticket of same concession for a minder.",
        },
        cssaDiscount: {
          enabled: true,
          percentage: 50,
          note: "Comprehensive Social Security Assistance Recipients (50% off, with limited quota)",
        },
      },
      groupBookingDiscount: {
        enabled: true,
        tiers: [
          {
            minimumTickets: 4,
            maximumTickets: 9,
            discountPercentage: 10,
            note: "Each purchase of 4 to 9 standard tickets (10% off)",
          },
          {
            minimumTickets: 10,
            maximumTickets: 19,
            discountPercentage: 15,
            note: "Each purchase of 10 to 19 standard tickets (15% off)",
          },
          {
            minimumTickets: 20,
            maximumTickets: null,
            discountPercentage: 20,
            note: "Each purchase of 20 or more standard tickets (20% off)",
          },
        ],
        applicableNote:
          "Discounts are applicable to the following sessions: Classical Music Lecture Series 1: Beethoven 1-9 (Sai Wan Ho Civic Centre), Classical Music Lecture Series 2: Top 10 Romantic Symphonies (Hong Kong City Hall)",
      },
      packageDiscount: {
        enabled: true,
        tiers: [
          {
            minimumLectures: 2,
            maximumLectures: 2,
            discountPercentage: 10,
            note: "Each purchase of standard tickets of 2 different lectures (10% off)",
          },
          {
            minimumLectures: 3,
            maximumLectures: 3,
            discountPercentage: 15,
            note: "Each purchase of standard tickets of 3 different lectures (15% off)",
          },
          {
            minimumLectures: 4,
            maximumLectures: null,
            discountPercentage: 20,
            note: "Each purchase of standard tickets of 4 or more different lectures (20% off)",
          },
        ],
        applicableNote:
          "Discounts are applicable to the following sessions: Classical Music Lecture Series 1: Beethoven 1-9 (Sai Wan Ho Civic Centre), Classical Music Lecture Series 2: Top 10 Romantic Symphonies (Hong Kong City Hall)",
      },
      eTicketArrangement: {
        available: true,
        note: "E-ticket option is available for this event (only applicable to Internet and mobile app bookings).",
        nonMemberDelivery:
          "E-ticket(s) in image format will be delivered to the email address provided when purchasing the tickets.",
        memberOptions:
          "May choose to have the e-ticket(s) in image format delivered to the registered email address or saved in the e-ticket wallet of mobile ticketing app.",
      },
      additionalInfo:
        "Don't miss this enlightening lecture series! Package discounts available when purchasing multiple lectures.",
    },
    showtimes: [
      {
        id: 10,
        performanceId: 6,
        dateTime: "2025-11-13T20:00:00",
        venueId: 2,
        venueName: "Hong Kong City Hall Concert Hall",
        totalSeats: 55,
        bookedSeats: 12,
        availableSeats: 43,
        pricing: {
          sections: [
            {
              section: "General Admission",
              sectionCode: "A",
              prices: {
                [TICKET_TYPES.STANDARD]: 80,
                [TICKET_TYPES.STUDENT]: 40,
                [TICKET_TYPES.SENIOR]: 40,
                [TICKET_TYPES.PWD]: 40,
              },
            },
          ],
        },
      },
    ],
  },
];

export const MOCK_SEATS = [
  {
    id: 1,
    performanceId: 1,
    seatNumber: "A12",
    section: "Orchestra",
    row: "A",
    seatNo: 12,
    category: "VIP",
    price: 1200,
    earlyBirdPrice: 1000,
    groupDiscount: 0.15,
    status: "available",
    features: ["Premium view", "Complimentary program", "Priority entry"],
  },
  {
    id: 2,
    performanceId: 1,
    seatNumber: "B15",
    section: "Orchestra",
    row: "B",
    seatNo: 15,
    category: "Experience Package",
    price: 900,
    earlyBirdPrice: 750,
    groupDiscount: 0.12,
    status: "available",
    features: ["Excellent acoustics", "Pre-performance reception"],
  },
  {
    id: 3,
    performanceId: 1,
    seatNumber: "F20",
    section: "Dress Circle",
    row: "F",
    seatNo: 20,
    category: "Standard",
    price: 500,
    earlyBirdPrice: 400,
    groupDiscount: 0.1,
    status: "booked",
    features: ["Good view", "Comfortable seating"],
  },
  {
    id: 4,
    performanceId: 1,
    seatNumber: "L8",
    section: "Upper Circle",
    row: "L",
    seatNo: 8,
    category: "Discounted",
    price: 300,
    earlyBirdPrice: 250,
    groupDiscount: 0.08,
    status: "available",
    features: ["Student/Senior friendly", "Budget option"],
  },
];

export const MOCK_BOOKINGS = [
  {
    id: "BK000",
    performanceId: "1",
    userId: "user",
    seats: ["A5", "A6"],
    seatTicketTypes: {
      A5: { id: "standard", name: "Standard", price: 500 },
      A6: { id: "student", name: "Student", price: 250 },
    },
    amount: 750,
    status: "confirmed",
    date: "2025-10-10",
    ticketType: "Multiple",
    performanceTitle: "Beethoven Symphony No. 9",
    venue: "Concert Hall",
    performanceDate: "2025-12-15",
    customerInfo: {
      id: "user",
      name: "Test User",
      email: "user@example.com",
      isGuest: false,
    },
    paymentMethod: "credit-card",
    paymentDetails: {
      cardNumber: "1111",
      cardholderName: "TEST USER",
    },
    paymentDate: "2025-10-10T10:30:00.000Z",
  },
  {
    id: "BK000B",
    performanceId: "2",
    userId: "user",
    seats: ["B10", "B11"],
    seatTicketTypes: {
      B10: { id: "standard", name: "Standard", price: 450 },
      B11: { id: "standard", name: "Standard", price: 450 },
    },
    amount: 900,
    status: "confirmed",
    date: "2025-10-12",
    ticketType: "Multiple",
    performanceTitle: "Mozart Piano Concerto No. 21",
    venue: "Grand Theatre",
    performanceDate: "2025-11-20",
    customerInfo: {
      id: "user",
      name: "Test User",
      email: "user@example.com",
      isGuest: false,
    },
    paymentMethod: "alipay",
    paymentDetails: {},
    paymentDate: "2025-10-12T14:20:00.000Z",
  },
  {
    id: "BK000C",
    performanceId: "3",
    userId: "user",
    seats: ["C5"],
    seatTicketTypes: {
      C5: { id: "senior", name: "Senior Citizen", price: 300 },
    },
    amount: 300,
    status: "pending",
    date: "2025-10-28",
    ticketType: "Multiple",
    performanceTitle: "Tchaikovsky Swan Lake Suite",
    venue: "Opera House",
    performanceDate: "2025-12-01",
    customerInfo: {
      id: "user",
      name: "Test User",
      email: "user@example.com",
      isGuest: false,
    },
    paymentMethod: "credit-card",
    paymentDetails: {
      cardNumber: "1111",
      cardholderName: "TEST USER",
    },
    paymentDate: "2025-10-28T16:45:00.000Z",
  },
  {
    id: "BK001",
    performanceId: "1",
    userId: "user1",
    seats: ["A1", "A2"],
    seatTicketTypes: {
      A1: { id: "standard", name: "Standard", price: 500 },
      A2: { id: "standard", name: "Standard", price: 500 },
    },
    amount: 1000,
    status: "confirmed",
    date: "2025-10-15",
    ticketType: "Multiple",
    performanceTitle: "Beethoven Symphony No. 9",
    venue: "Concert Hall",
    performanceDate: "2025-12-15",
    customerInfo: {
      id: "user1",
      name: "John Doe",
      email: "john@example.com",
      isGuest: false,
    },
  },
  {
    id: "BK002",
    performanceId: "2",
    userId: "user2",
    seats: ["B5", "B6", "B7"],
    seatTicketTypes: {
      B5: { id: "standard", name: "Standard", price: 450 },
      B6: { id: "student", name: "Student", price: 225 },
      B7: { id: "student", name: "Student", price: 225 },
    },
    amount: 900,
    status: "confirmed",
    date: "2025-10-18",
    ticketType: "Multiple",
    performanceTitle: "Mozart Piano Concerto No. 21",
    venue: "Grand Theatre",
    performanceDate: "2025-11-20",
    customerInfo: {
      id: "user2",
      name: "Jane Smith",
      email: "jane@example.com",
      isGuest: false,
    },
  },
  {
    id: "BK003",
    performanceId: "1",
    userId: "user3",
    seats: ["C10"],
    seatTicketTypes: {
      C10: { id: "student", name: "Student", price: 250 },
    },
    amount: 250,
    status: "pending",
    date: "2025-10-20",
    ticketType: "Multiple",
    performanceTitle: "Beethoven Symphony No. 9",
    venue: "Concert Hall",
    performanceDate: "2025-12-15",
    customerInfo: {
      id: "user3",
      name: "Bob Johnson",
      email: "bob@example.com",
      isGuest: false,
    },
  },
  {
    id: "BK004",
    performanceId: "3",
    userId: "user4",
    seats: ["D1", "D2", "D3", "D4"],
    seatTicketTypes: {
      D1: { id: "standard", name: "Standard", price: 600 },
      D2: { id: "standard", name: "Standard", price: 600 },
      D3: { id: "senior", name: "Senior Citizen", price: 300 },
      D4: { id: "senior", name: "Senior Citizen", price: 300 },
    },
    amount: 1800,
    status: "confirmed",
    date: "2025-10-22",
    ticketType: "Multiple",
    performanceTitle: "Tchaikovsky Swan Lake Suite",
    venue: "Opera House",
    performanceDate: "2025-12-01",
    customerInfo: {
      id: "user4",
      name: "Alice Williams",
      email: "alice@example.com",
      isGuest: false,
    },
  },
  {
    id: "BK005",
    performanceId: "2",
    userId: "user5",
    seats: ["E15", "E16"],
    seatTicketTypes: {
      E15: { id: "standard", name: "Standard", price: 450 },
      E16: { id: "standard", name: "Standard", price: 450 },
    },
    amount: 900,
    status: "confirmed",
    date: "2025-10-25",
    ticketType: "Multiple",
    performanceTitle: "Mozart Piano Concerto No. 21",
    venue: "Grand Theatre",
    performanceDate: "2025-11-20",
    customerInfo: {
      id: "user5",
      name: "Charlie Brown",
      email: "charlie@example.com",
      isGuest: false,
    },
  },
  {
    id: "BK006",
    performanceId: "4",
    userId: "user6",
    seats: ["F8"],
    seatTicketTypes: {
      F8: {
        id: "pwd",
        name: "People with Disabilities and the Minder",
        price: 200,
      },
    },
    amount: 200,
    status: "confirmed",
    date: "2025-10-28",
    ticketType: "Multiple",
    performanceTitle: "Vivaldi Four Seasons",
    venue: "Music Centre",
    performanceDate: "2025-11-25",
    customerInfo: {
      id: "user6",
      name: "Diana Prince",
      email: "diana@example.com",
      isGuest: false,
    },
  },
  {
    id: "BK007",
    performanceId: "5",
    userId: "user7",
    seats: ["G1", "G2"],
    seatTicketTypes: {
      G1: { id: "standard", name: "Standard", price: 550 },
      G2: { id: "student", name: "Student", price: 275 },
    },
    amount: 825,
    status: "confirmed",
    date: "2025-10-30",
    ticketType: "Multiple",
    performanceTitle: "Brahms Symphony No. 1",
    venue: "Concert Hall",
    performanceDate: "2025-11-18",
    customerInfo: {
      id: "user7",
      name: "Edward Norton",
      email: "edward@example.com",
      isGuest: false,
    },
  },
  {
    id: "BK008",
    performanceId: "1",
    userId: "user8",
    seats: ["H12", "H13"],
    seatTicketTypes: {
      H12: { id: "standard", name: "Standard", price: 500 },
      H13: { id: "standard", name: "Standard", price: 500 },
    },
    amount: 1000,
    status: "cancelled",
    date: "2025-11-01",
    ticketType: "Multiple",
    performanceTitle: "Beethoven Symphony No. 9",
    venue: "Concert Hall",
    performanceDate: "2025-12-15",
    customerInfo: {
      id: "user8",
      name: "Fiona Green",
      email: "fiona@example.com",
      isGuest: false,
    },
  },
];

export const MOCK_TRANSACTIONS = [
  {
    id: 1,
    bookingRef: "BK-2025-001234",
    performance: "Symphony No. 9 - Beethoven",
    date: "2025-12-15",
    seat: "F20",
    amount: "1,050",
    status: "Confirmed",
  },
  {
    id: 2,
    bookingRef: "BK-2024-001128",
    performance: "The Four Seasons - Vivaldi",
    date: "2024-11-20",
    seat: "B12",
    amount: "900",
    status: "Completed",
  },
  {
    id: 3,
    bookingRef: "BK-2024-001056",
    performance: "Brahms Symphony No. 1",
    date: "2024-09-10",
    seat: "A08",
    amount: "1,200",
    status: "Completed",
  },
  {
    id: 4,
    bookingRef: "BK-2024-000989",
    performance: "Mozart Piano Concerto No. 21",
    date: "2024-08-15",
    seat: "D15",
    amount: "750",
    status: "Completed",
  },
  {
    id: 5,
    bookingRef: "BK-2025-001445",
    performance: "Mahler Symphony No. 5",
    date: "2025-10-10",
    seat: "C22",
    amount: "850",
    status: "Pending",
  },
];

export const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: "info",
    message: "Welcome to Western Orchestral Music Performance Booking System!",
    isRead: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    type: "success",
    message: "Your booking for Symphony No. 9 has been confirmed",
    isRead: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 3,
    type: "info",
    message: "Early bird tickets now available for Mozart Requiem",
    isRead: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 4,
    type: "warning",
    message: "Performance reminder: The Four Seasons - Tomorrow at 8:00 PM",
    isRead: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const MOCK_SIMPLE_PERFORMANCES = [
  {
    id: "1",
    title: "Beethoven Symphony No. 9",
    status: "upcoming",
    date: "2025-12-15",
    venue: "Concert Hall",
    conductor: "James Smith",
    orchestra: "Hong Kong Philharmonic",
    price: 500,
    seats: { total: 800, booked: 320 },
  },
  {
    id: "2",
    title: "Mozart Piano Concerto No. 21",
    status: "on_sale",
    date: "2025-11-20",
    venue: "Grand Theatre",
    conductor: "Emily Chen",
    orchestra: "City Orchestra",
    price: 450,
    seats: { total: 600, booked: 480 },
  },
  {
    id: "3",
    title: "Tchaikovsky Swan Lake Suite",
    status: "upcoming",
    date: "2025-12-01",
    venue: "Opera House",
    conductor: "Michael Wong",
    orchestra: "Royal Symphony",
    price: 600,
    seats: { total: 1000, booked: 150 },
  },
  {
    id: "4",
    title: "Vivaldi Four Seasons",
    status: "on_sale",
    date: "2025-11-25",
    venue: "Music Centre",
    conductor: "Sarah Lee",
    orchestra: "Chamber Orchestra",
    price: 400,
    seats: { total: 400, booked: 380 },
  },
  {
    id: "5",
    title: "Brahms Symphony No. 1",
    status: "sold_out",
    date: "2025-11-18",
    venue: "Concert Hall",
    conductor: "David Brown",
    orchestra: "Hong Kong Philharmonic",
    price: 550,
    seats: { total: 800, booked: 800 },
  },
];

export const MOCK_EVENTS = MOCK_PERFORMANCES;
export const MOCK_STALLS = MOCK_SEATS;
export const MOCK_SIMPLE_USERS = MOCK_USERS;

export const MockDataHelpers = {
  getUserById(id) {
    return MOCK_USERS.find((u) => u.id === id || u.id === String(id));
  },

  getPerformanceById(id) {
    return MOCK_PERFORMANCES.find((p) => p.id === id || p.id === String(id));
  },

  getBookingById(id) {
    return MOCK_BOOKINGS.find((b) => b.id === id);
  },

  getVenueById(id) {
    return MOCK_VENUES.find((v) => v.id === id || v.id === String(id));
  },

  getUserBookings(userId) {
    return MOCK_BOOKINGS.filter(
      (b) =>
        b.userId === userId ||
        b.userId === String(userId) ||
        b.customerInfo?.id === userId
    );
  },

  getPerformanceBookings(performanceId) {
    return MOCK_BOOKINGS.filter(
      (b) =>
        b.performanceId === performanceId ||
        b.performanceId === String(performanceId)
    );
  },

  getUpcomingPerformances() {
    return MOCK_SIMPLE_PERFORMANCES.filter(
      (p) => DateUtils.isUpcoming(p.date) && p.status !== "sold_out"
    );
  },

  getAvailablePerformances() {
    return MOCK_SIMPLE_PERFORMANCES.filter(
      (p) => p.status === "on_sale" || p.status === "upcoming"
    );
  },

  getBookingsByStatus(status) {
    return MOCK_BOOKINGS.filter((b) => b.status === status);
  },

  getTotalRevenue(bookings = MOCK_BOOKINGS) {
    return bookings
      .filter((b) => b.status === "confirmed")
      .reduce((sum, b) => sum + b.amount, 0);
  },

  getBookingStats(bookings = MOCK_BOOKINGS) {
    return {
      total: bookings.length,
      confirmed: bookings.filter((b) => b.status === "confirmed").length,
      pending: bookings.filter((b) => b.status === "pending").length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
      revenue: this.getTotalRevenue(bookings),
    };
  },

  getPerformanceStats(performances = MOCK_SIMPLE_PERFORMANCES) {
    return {
      total: performances.length,
      upcoming: performances.filter((p) => p.status === "upcoming").length,
      onSale: performances.filter((p) => p.status === "on_sale").length,
      soldOut: performances.filter((p) => p.status === "sold_out").length,
      totalSeats: performances.reduce((sum, p) => sum + p.seats.total, 0),
      bookedSeats: performances.reduce((sum, p) => sum + p.seats.booked, 0),
    };
  },

  getUserStats(users = MOCK_USERS) {
    return {
      total: users.length,
      active: users.filter((u) => u.status === "active").length,
      inactive: users.filter((u) => u.status === "inactive").length,
      admins: users.filter((u) => u.role === "admin").length,
      regularUsers: users.filter((u) => u.role === "user").length,
    };
  },

  searchPerformances(query) {
    return DataQuery.search(MOCK_SIMPLE_PERFORMANCES, query, [
      "title",
      "conductor",
      "orchestra",
      "venue",
    ]);
  },

  searchUsers(query) {
    return DataQuery.search(MOCK_USERS, query, ["name", "email", "id"]);
  },

  searchBookings(query) {
    return DataQuery.search(MOCK_BOOKINGS, query, [
      "id",
      "performanceTitle",
      "customerInfo.name",
    ]);
  },

  enrichBooking(booking) {
    const performance = this.getPerformanceById(booking.performanceId);
    const user = this.getUserById(booking.userId);

    return {
      ...booking,
      performance,
      user,
      enriched: true,
    };
  },

  enrichBookings(bookings) {
    return bookings.map((b) => this.enrichBooking(b));
  },

  generateMockData(counts = {}) {
    const { users = 20, performances = 30, bookingsPerUser = 5 } = counts;

    return DataFactory.createMockDataSet();
  },

  getSeatAvailability(performanceId) {
    const bookings = this.getPerformanceBookings(performanceId);
    const bookedSeats = bookings.flatMap((b) => b.seats);

    return {
      totalBooked: bookedSeats.length,
      bookedSeats: bookedSeats.sort(),
      bookingCount: bookings.length,
    };
  },

  getRevenueByPerformance() {
    const performanceMap = {};

    MOCK_BOOKINGS.filter((b) => b.status === "confirmed").forEach((booking) => {
      const perfId = booking.performanceId;
      if (!performanceMap[perfId]) {
        const perf = this.getPerformanceById(perfId);
        performanceMap[perfId] = {
          performanceId: perfId,
          title: booking.performanceTitle || perf?.title,
          revenue: 0,
          bookingCount: 0,
        };
      }
      performanceMap[perfId].revenue += booking.amount;
      performanceMap[perfId].bookingCount++;
    });

    return Object.values(performanceMap).sort((a, b) => b.revenue - a.revenue);
  },

  getRevenueByMonth() {
    const monthMap = {};

    MOCK_BOOKINGS.filter((b) => b.status === "confirmed").forEach((booking) => {
      const month = DateUtils.formatDate(booking.date, "YYYY-MM");
      if (!monthMap[month]) {
        monthMap[month] = { month, revenue: 0, bookings: 0 };
      }
      monthMap[month].revenue += booking.amount;
      monthMap[month].bookings++;
    });

    return Object.values(monthMap).sort((a, b) =>
      a.month.localeCompare(b.month)
    );
  },

  getPopularPerformances(limit = 5) {
    const performanceBookings = {};

    MOCK_BOOKINGS.forEach((booking) => {
      const perfId = booking.performanceId;
      if (!performanceBookings[perfId]) {
        performanceBookings[perfId] = { count: 0, revenue: 0 };
      }
      performanceBookings[perfId].count++;
      if (booking.status === "confirmed") {
        performanceBookings[perfId].revenue += booking.amount;
      }
    });

    return Object.entries(performanceBookings)
      .map(([perfId, stats]) => ({
        performance: this.getPerformanceById(perfId),
        bookingCount: stats.count,
        revenue: stats.revenue,
      }))
      .sort((a, b) => b.bookingCount - a.bookingCount)
      .slice(0, limit);
  },

  getTopCustomers(limit = 10) {
    const customerStats = {};

    MOCK_BOOKINGS.filter((b) => b.status === "confirmed").forEach((booking) => {
      const userId = booking.userId;
      if (!customerStats[userId]) {
        customerStats[userId] = {
          user: this.getUserById(userId) || booking.customerInfo,
          totalSpent: 0,
          bookingCount: 0,
        };
      }
      customerStats[userId].totalSpent += booking.amount;
      customerStats[userId].bookingCount++;
    });

    return Object.values(customerStats)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit);
  },

  validateData() {
    const results = {
      users: { valid: 0, invalid: 0, errors: [] },
      performances: { valid: 0, invalid: 0, errors: [] },
      bookings: { valid: 0, invalid: 0, errors: [] },
    };

    return results;
  },

  exportToCSV(data, type) {
    let headers = [];
    let rows = [];

    switch (type) {
      case "bookings":
        headers = [
          "Booking ID",
          "Performance",
          "User",
          "Seats",
          "Amount",
          "Status",
          "Date",
        ];
        rows = data.map((b) => [
          b.id,
          b.performanceTitle,
          b.customerInfo?.name || b.userId,
          b.seats.join(", "),
          b.amount,
          b.status,
          DateUtils.formatDate(b.date),
        ]);
        break;

      case "performances":
        headers = ["ID", "Title", "Date", "Venue", "Status", "Price"];
        rows = data.map((p) => [
          p.id,
          p.title,
          DateUtils.formatDate(p.date),
          p.venue,
          p.status,
          p.price,
        ]);
        break;

      case "users":
        headers = ["ID", "Name", "Email", "Role", "Status", "Joined"];
        rows = data.map((u) => [
          u.id,
          u.name,
          u.email,
          u.role,
          u.status,
          DateUtils.formatDate(u.joined || u.registeredAt),
        ]);
        break;
    }

    return [headers, ...rows].map((row) => row.join(",")).join("\n");
  },

  resetToDefaults() {
    return {
      users: [...MOCK_USERS],
      performances: [...MOCK_PERFORMANCES],
      bookings: [...MOCK_BOOKINGS],
      venues: [...MOCK_VENUES],
      seats: [...MOCK_SEATS],
    };
  },

  mergeData(stored, defaults) {
    const storedIds = new Set(stored.map((item) => item.id));
    const newItems = defaults.filter((item) => !storedIds.has(item.id));
    return [...stored, ...newItems];
  },
};
