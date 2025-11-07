import {
  FAMOUS_WORKS,
  ORCHESTRA_COMPOSERS,
  ORCHESTRAS,
  CONDUCTORS,
  SOLOISTS,
  PERFORMANCE_STATUSES,
  SEAT_TIERS,
  PRICE_RANGES,
} from "./mockDataConfig.js";
import { MOCK_VENUES, normalizeVenueLayout } from "./mockVenues.js";

const generatePerformanceDate = (daysFromNow) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
};

const generateShowtimes = (baseDate, count = 3) => {
  const times = ["14:30", "19:30", "20:00"];
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + Math.floor(i / 2));
    const [hours, minutes] = times[i % times.length].split(":");
    date.setHours(parseInt(hours), parseInt(minutes), 0);
    const dateTime = date.toISOString();
    return {
      id: `showtime_${Date.now()}_${i}`,
      dateTime: dateTime,
      venueName: MOCK_VENUES[0]?.name || "Concert Hall",
      venueId: MOCK_VENUES[0]?.id || 1,
    };
  });
};

const generatePricingSections = (venueId, performanceType = "concert_hall") => {
  const venue = MOCK_VENUES.find((v) => v.id === venueId);
  if (!venue || !venue.layout || !venue.layout.sections) return [];

  const normalizedLayout = normalizeVenueLayout(venue.layout);
  const priceRange = PRICE_RANGES[performanceType] || PRICE_RANGES.CONCERT_HALL;

  return normalizedLayout.sections.map((section) => {
    const tierPricing = priceRange[section.tier];
    const basePrice =
      tierPricing.min + (tierPricing.max - tierPricing.min) * Math.random();

    return {
      sectionName: section.name,
      tier: section.tier,
      basePrice: Math.round(basePrice / 10) * 10,
      rows: section.rows || [],
      capacity: section.capacity || 0,
      discounts: {
        student: 0.5,
        senior: 0.5,
        pwd: 0.5,
        cssa: 0.5,
      },
    };
  });
};

export const MOCK_PERFORMANCES = [
  {
    id: 1,
    title: "Symphony No. 9 - Beethoven",
    composer: "Ludwig van Beethoven",
    description:
      "Experience Beethoven's monumental Ninth Symphony featuring the famous 'Ode to Joy'. This masterpiece combines orchestra, choir, and soloists in a celebration of universal brotherhood.",
    venueId: 1,
    venueName: "Hong Kong Cultural Centre Concert Hall",
    date: generatePerformanceDate(30),
    duration: 70,
    image: null,
    category: "Classical Music",
    subcategory: "Symphony",
    status: PERFORMANCE_STATUSES.ON_SALE,
    orchestra: "Hong Kong Philharmonic Orchestra",
    conductor: "Jaap van Zweden",
    soloists: [
      { name: "Soprano Singer", role: "Soprano" },
      { name: "Alto Singer", role: "Alto" },
      { name: "Tenor Singer", role: "Tenor" },
      { name: "Bass Singer", role: "Bass" },
    ],
    program: [
      {
        title: "Symphony No. 9 in D minor, Op. 125",
        composer: "Ludwig van Beethoven",
        movements: [
          "Allegro ma non troppo",
          "Molto vivace",
          "Adagio molto e cantabile",
          "Finale: Ode to Joy",
        ],
      },
    ],
    showtimes: generateShowtimes(generatePerformanceDate(30), 3),
    pricingSections: generatePricingSections(1, "concert_hall"),
    tags: ["Beethoven", "Symphony", "Choral", "Orchestra", "Classical"],
    ageRestriction: null,
    dresscode: "Smart Casual",
  },
  {
    id: 2,
    title: "Piano Concerto No. 1 - Tchaikovsky",
    composer: "Pyotr Ilyich Tchaikovsky",
    description:
      "Featuring renowned pianist Lang Lang performing Tchaikovsky's dramatic and powerful First Piano Concerto. An unforgettable evening of romantic music.",
    venueId: 1,
    venueName: "Hong Kong Cultural Centre Concert Hall",
    date: generatePerformanceDate(45),
    duration: 90,
    image: null,
    category: "Classical Music",
    subcategory: "Concerto",
    status: PERFORMANCE_STATUSES.EARLY_BIRD,
    orchestra: "Hong Kong Philharmonic Orchestra",
    conductor: "Yan Pascal Tortelier",
    soloists: [{ name: "Lang Lang", instrument: "Piano" }],
    program: [
      {
        title: "Piano Concerto No. 1 in B-flat minor, Op. 23",
        composer: "Pyotr Ilyich Tchaikovsky",
        movements: [
          "Allegro non troppo e molto maestoso",
          "Andantino semplice",
          "Allegro con fuoco",
        ],
      },
      {
        title: "Symphony No. 5 in E minor, Op. 64",
        composer: "Pyotr Ilyich Tchaikovsky",
        movements: ["Andante", "Andante cantabile", "Valse", "Finale"],
      },
    ],
    showtimes: generateShowtimes(generatePerformanceDate(45), 2),
    pricingSections: generatePricingSections(1, "concert_hall"),
    tags: ["Tchaikovsky", "Piano", "Concerto", "Lang Lang", "Romantic"],
    ageRestriction: null,
    dresscode: "Formal",
  },
  {
    id: 3,
    title: "The Four Seasons - Vivaldi",
    composer: "Antonio Vivaldi",
    description:
      "A baroque masterpiece depicting the changing seasons through violin concertos. Perfect introduction to classical music for all ages.",
    venueId: 2,
    venueName: "Hong Kong City Hall Concert Hall",
    date: generatePerformanceDate(15),
    duration: 50,
    image: null,
    category: "Classical Music",
    subcategory: "Baroque",
    status: PERFORMANCE_STATUSES.ON_SALE,
    orchestra: "City Chamber Orchestra of Hong Kong",
    conductor: "Christoph Poppen",
    soloists: [{ name: "Hilary Hahn", instrument: "Violin" }],
    program: [
      {
        title: "The Four Seasons",
        composer: "Antonio Vivaldi",
        movements: ["Spring", "Summer", "Autumn", "Winter"],
      },
    ],
    showtimes: generateShowtimes(generatePerformanceDate(15), 4),
    pricingSections: generatePricingSections(2, "concert_hall"),
    tags: ["Vivaldi", "Baroque", "Violin", "Four Seasons", "Family-Friendly"],
    ageRestriction: "6+",
    dresscode: "Smart Casual",
  },
  {
    id: 4,
    title: "Mozart Masterpieces",
    composer: "Wolfgang Amadeus Mozart",
    description:
      "An evening celebrating Mozart's genius featuring his most beloved symphonies and concertos. Experience the elegance and beauty of classical era music.",
    venueId: 2,
    venueName: "Hong Kong City Hall Concert Hall",
    date: generatePerformanceDate(60),
    duration: 80,
    image: null,
    category: "Classical Music",
    subcategory: "Classical Era",
    status: PERFORMANCE_STATUSES.PRE_ORDER,
    orchestra: "Hong Kong Sinfonietta",
    conductor: "Yip Wing-sie",
    soloists: [],
    program: [
      {
        title: "Symphony No. 40 in G minor, K. 550",
        composer: "Wolfgang Amadeus Mozart",
        movements: ["Molto allegro", "Andante", "Menuetto", "Allegro assai"],
      },
      {
        title: "Eine kleine Nachtmusik, K. 525",
        composer: "Wolfgang Amadeus Mozart",
        movements: ["Allegro", "Romanze", "Menuetto", "Rondo"],
      },
    ],
    showtimes: generateShowtimes(generatePerformanceDate(60), 2),
    pricingSections: generatePricingSections(2, "concert_hall"),
    tags: ["Mozart", "Symphony", "Classical", "Orchestra"],
    ageRestriction: null,
    dresscode: "Smart Casual",
  },
  {
    id: 5,
    title: "Nutcracker Suite - Tchaikovsky",
    composer: "Pyotr Ilyich Tchaikovsky",
    description:
      "A festive holiday favorite! Experience the magic of Tchaikovsky's beloved Nutcracker Suite. Perfect for families and ballet enthusiasts.",
    venueId: 3,
    venueName: "Hong Kong Coliseum",
    date: generatePerformanceDate(90),
    duration: 120,
    image: null,
    category: "Ballet",
    subcategory: "Classical Ballet",
    status: PERFORMANCE_STATUSES.PRE_ORDER,
    orchestra: "Hong Kong Festival Orchestra",
    conductor: "Alan Gilbert",
    soloists: [],
    program: [
      {
        title: "The Nutcracker, Op. 71 (Complete Ballet)",
        composer: "Pyotr Ilyich Tchaikovsky",
        acts: ["Act I: The Christmas Party", "Act II: The Land of Sweets"],
      },
    ],
    showtimes: generateShowtimes(generatePerformanceDate(90), 6),
    pricingSections: generatePricingSections(3, "large_arena"),
    tags: ["Tchaikovsky", "Ballet", "Nutcracker", "Holiday", "Family"],
    ageRestriction: null,
    dresscode: "Smart Casual",
  },
  {
    id: 6,
    title: "Brahms Symphony No. 4",
    composer: "Johannes Brahms",
    description:
      "Brahms' final symphony showcases the composer's mastery of form and emotion. A powerful and moving conclusion to his symphonic works.",
    venueId: 1,
    venueName: "Hong Kong Cultural Centre Concert Hall",
    date: generatePerformanceDate(20),
    duration: 75,
    image: null,
    category: "Classical Music",
    subcategory: "Symphony",
    status: PERFORMANCE_STATUSES.ON_SALE,
    orchestra: "Hong Kong Philharmonic Orchestra",
    conductor: "Edo de Waart",
    soloists: [],
    program: [
      {
        title: "Symphony No. 4 in E minor, Op. 98",
        composer: "Johannes Brahms",
        movements: [
          "Allegro non troppo",
          "Andante moderato",
          "Allegro giocoso",
          "Allegro energico",
        ],
      },
      {
        title: "Academic Festival Overture, Op. 80",
        composer: "Johannes Brahms",
      },
    ],
    showtimes: generateShowtimes(generatePerformanceDate(20), 2),
    pricingSections: generatePricingSections(1, "concert_hall"),
    tags: ["Brahms", "Symphony", "Romantic", "Orchestra"],
    ageRestriction: null,
    dresscode: "Smart Casual",
  },
  {
    id: 7,
    title: "Mahler Symphony No. 5",
    composer: "Gustav Mahler",
    description:
      "Mahler's Fifth Symphony featuring the famous Adagietto. An epic journey through darkness to light, showcasing the full power of the orchestra.",
    venueId: 1,
    venueName: "Hong Kong Cultural Centre Concert Hall",
    date: generatePerformanceDate(75),
    duration: 70,
    image: null,
    category: "Classical Music",
    subcategory: "Symphony",
    status: PERFORMANCE_STATUSES.PRE_ORDER,
    orchestra: "Hong Kong Philharmonic Orchestra",
    conductor: "Jaap van Zweden",
    soloists: [],
    program: [
      {
        title: "Symphony No. 5 in C-sharp minor",
        composer: "Gustav Mahler",
        movements: [
          "Trauermarsch",
          "Stürmisch bewegt",
          "Scherzo",
          "Adagietto",
          "Rondo-Finale",
        ],
      },
    ],
    showtimes: generateShowtimes(generatePerformanceDate(75), 2),
    pricingSections: generatePricingSections(1, "concert_hall"),
    tags: ["Mahler", "Symphony", "Late Romantic", "Orchestra", "Adagietto"],
    ageRestriction: null,
    dresscode: "Formal",
  },
  {
    id: 8,
    title: "Rachmaninoff Piano Concerto No. 2",
    composer: "Sergei Rachmaninoff",
    description:
      "One of the most beloved piano concertos ever written. Martha Argerich brings her legendary interpretation to this romantic masterpiece.",
    venueId: 2,
    venueName: "Hong Kong City Hall Concert Hall",
    date: generatePerformanceDate(40),
    duration: 85,
    image: null,
    category: "Classical Music",
    subcategory: "Concerto",
    status: PERFORMANCE_STATUSES.ON_SALE,
    orchestra: "Hong Kong Sinfonietta",
    conductor: "Yan Pascal Tortelier",
    soloists: [{ name: "Martha Argerich", instrument: "Piano" }],
    program: [
      {
        title: "Piano Concerto No. 2 in C minor, Op. 18",
        composer: "Sergei Rachmaninoff",
        movements: ["Moderato", "Adagio sostenuto", "Allegro scherzando"],
      },
      {
        title: "Symphonic Dances, Op. 45",
        composer: "Sergei Rachmaninoff",
        movements: ["Non allegro", "Andante con moto", "Lento assai"],
      },
    ],
    showtimes: generateShowtimes(generatePerformanceDate(40), 3),
    pricingSections: generatePricingSections(2, "concert_hall"),
    tags: ["Rachmaninoff", "Piano", "Concerto", "Romantic", "Martha Argerich"],
    ageRestriction: null,
    dresscode: "Smart Casual",
  },
  {
    id: 9,
    title: "Beethoven Violin Concerto",
    composer: "Ludwig van Beethoven",
    description:
      "Beethoven's only violin concerto performed by virtuoso Joshua Bell. A sublime work of grace and beauty.",
    venueId: 1,
    venueName: "Hong Kong Cultural Centre Concert Hall",
    date: generatePerformanceDate(50),
    duration: 80,
    image: null,
    category: "Classical Music",
    subcategory: "Concerto",
    status: PERFORMANCE_STATUSES.ON_SALE,
    orchestra: "Hong Kong Philharmonic Orchestra",
    conductor: "Christoph Poppen",
    soloists: [{ name: "Joshua Bell", instrument: "Violin" }],
    program: [
      {
        title: "Violin Concerto in D major, Op. 61",
        composer: "Ludwig van Beethoven",
        movements: ["Allegro ma non troppo", "Larghetto", "Rondo"],
      },
      {
        title: "Symphony No. 7 in A major, Op. 92",
        composer: "Ludwig van Beethoven",
        movements: [
          "Poco sostenuto",
          "Allegretto",
          "Presto",
          "Allegro con brio",
        ],
      },
    ],
    showtimes: generateShowtimes(generatePerformanceDate(50), 2),
    pricingSections: generatePricingSections(1, "concert_hall"),
    tags: ["Beethoven", "Violin", "Concerto", "Joshua Bell", "Classical"],
    ageRestriction: null,
    dresscode: "Smart Casual",
  },
  {
    id: 10,
    title: "Stravinsky: The Rite of Spring",
    composer: "Igor Stravinsky",
    description:
      "Experience the groundbreaking work that changed music forever. Stravinsky's revolutionary ballet score in its full orchestral glory.",
    venueId: 3,
    venueName: "Hong Kong Coliseum",
    date: generatePerformanceDate(65),
    duration: 90,
    image: null,
    category: "Modern Classical",
    subcategory: "Ballet",
    status: PERFORMANCE_STATUSES.PRE_ORDER,
    orchestra: "Hong Kong Festival Orchestra",
    conductor: "Alan Gilbert",
    soloists: [],
    program: [
      {
        title: "The Rite of Spring",
        composer: "Igor Stravinsky",
        parts: ["Part I: The Adoration of the Earth", "Part II: The Sacrifice"],
      },
      {
        title: "The Firebird Suite",
        composer: "Igor Stravinsky",
        movements: [
          "Introduction",
          "Firebird and its Dance",
          "Princesses' Round Dance",
          "Finale",
        ],
      },
    ],
    showtimes: generateShowtimes(generatePerformanceDate(65), 3),
    pricingSections: generatePricingSections(3, "large_arena"),
    tags: ["Stravinsky", "Modern", "Ballet", "Rite of Spring", "Revolutionary"],
    ageRestriction: "12+",
    dresscode: "Smart Casual",
  },
];

export const getPerformanceById = (id) => {
  return MOCK_PERFORMANCES.find((performance) => performance.id === id);
};

export const getPerformancesByVenue = (venueId) => {
  return MOCK_PERFORMANCES.filter(
    (performance) => performance.venueId === venueId
  );
};

export const getPerformancesByStatus = (status) => {
  return MOCK_PERFORMANCES.filter(
    (performance) => performance.status === status
  );
};

export const getUpcomingPerformances = () => {
  const now = new Date();
  return MOCK_PERFORMANCES.filter(
    (performance) => new Date(performance.date) > now
  ).sort((a, b) => new Date(a.date) - new Date(b.date));
};

export const searchPerformances = (query) => {
  const lowerQuery = query.toLowerCase();
  return MOCK_PERFORMANCES.filter(
    (performance) =>
      performance.title.toLowerCase().includes(lowerQuery) ||
      performance.composer.toLowerCase().includes(lowerQuery) ||
      performance.orchestra?.toLowerCase().includes(lowerQuery) ||
      performance.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
};

export const getPerformancesByComposer = (composer) => {
  return MOCK_PERFORMANCES.filter(
    (performance) => performance.composer === composer
  );
};

export const getPerformancesByCategory = (category) => {
  return MOCK_PERFORMANCES.filter(
    (performance) => performance.category === category
  );
};
