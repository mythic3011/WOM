import { faker } from "@faker-js/faker";
import { generateRowLabels } from "../../utils/venueUtils.js";
import { generatePerformanceImageUrl } from "./mockImageUrls.js";

const generateFutureDate = (daysFromNow) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
};

const generateShowtimeId = (performanceId, index) => {
  return `showtime_${performanceId}_${Date.now()}_${index}`;
};

const generateAdditionalPerformances = () => {
  faker.seed(99999);
  const performances = [];

  const composers = [
    "Wolfgang Amadeus Mozart",
    "Johann Sebastian Bach",
    "Franz Schubert",
    "Frederic Chopin",
    "Robert Schumann",
    "Johannes Brahms",
    "Claude Debussy",
    "Igor Stravinsky",
    "Sergei Rachmaninoff",
    "Gustav Mahler",
  ];

  const workTitles = [
    "Symphony No. 40",
    "Brandenburg Concerto No. 3",
    "Piano Sonata in A major",
    "Nocturne in E-flat major",
    "Carnaval, Op. 9",
    "Violin Concerto in D major",
    "Prelude to the Afternoon of a Faun",
    "The Rite of Spring",
    "Piano Concerto No. 2",
    "Symphony No. 5",
  ];

  const orchestras = [
    "Hong Kong Sinfonietta",
    "Hong Kong Chinese Orchestra",
    "Musica Viva Orchestra",
    "Hong Kong Chamber Orchestra",
  ];

  const conductors = [
    "Yip Wing-sie",
    "Bright Sheng",
    "Lio Kuokman",
    "Perry So",
    "Christoph Poppen",
  ];

  const instruments = ["Piano", "Violin", "Cello", "Flute", "Clarinet", "Trumpet"];
  const statuses = ["on_sale", "early_bird", "upcoming", "pre_order"];
  const categories = ["Classical Music", "Chamber Music", "Opera"];
  const subcategories = [
    "Symphony",
    "Concerto",
    "Sonata",
    "Baroque",
    "Romantic",
    "Contemporary",
  ];

  for (let i = 4; i <= 12; i++) {
    const composer = faker.helpers.arrayElement(composers);
    const title = faker.helpers.arrayElement(workTitles);
    const venueId = faker.number.int({ min: 1, max: 3 });
    const daysUntil = faker.number.int({ min: 10, max: 180 });
    const status = faker.helpers.arrayElement(statuses);

    const numSoloists = faker.number.int({ min: 1, max: 3 });
    const soloists = Array.from({ length: numSoloists }, () => ({
      name: faker.person.fullName(),
      instrument: faker.helpers.arrayElement(instruments),
    }));

    const basePrice = faker.number.int({ min: 300, max: 1000 });

    performances.push({
      id: i,
      title: `${title} - ${composer.split(" ").pop()}`,
      composer,
      description: faker.lorem.paragraph({ min: 2, max: 3 }),
      venueId,
      venueName:
        venueId === 1
          ? "Hong Kong Cultural Centre Concert Hall"
          : venueId === 2
            ? "Hong Kong City Hall Concert Hall"
            : "Hong Kong Academy for Performing Arts Concert Hall",
      date: generateFutureDate(daysUntil),
      duration: faker.number.int({ min: 60, max: 120 }),
      image: generatePerformanceImageUrl(i - 4),
      category: faker.helpers.arrayElement(categories),
      subcategory: faker.helpers.arrayElement(subcategories),
      status,
      orchestra: faker.helpers.arrayElement(orchestras),
      conductor: faker.helpers.arrayElement(conductors),
      soloists,
      program: [
        {
          title,
          composer,
          movements: Array.from({ length: faker.number.int({ min: 3, max: 4 }) }, () =>
            faker.music.genre()
          ),
        },
      ],
      showtimes: [
        {
          id: generateShowtimeId(i, 0),
          dateTime: generateFutureDate(daysUntil),
          venueName:
            venueId === 1
              ? "Hong Kong Cultural Centre Concert Hall"
              : venueId === 2
                ? "Hong Kong City Hall Concert Hall"
                : "Hong Kong Academy for Performing Arts Concert Hall",
          status,
          pricing: {
            sections: [
              {
                sectionName: "Premium",
                sectionCode: "PR",
                basePrice,
                tier: "premium",
                rows: ["A", "B", "C", "D", "E", "F"]
              },
              {
                sectionName: "Standard",
                sectionCode: "ST",
                basePrice: Math.floor(basePrice * 0.7),
                tier: "standard",
                rows: ["G", "H", "I", "J", "K", "L"]
              },
              {
                sectionName: "Economy",
                sectionCode: "EC",
                basePrice: Math.floor(basePrice * 0.4),
                tier: "economy",
                rows: ["M", "N", "O", "P"]
              },
            ],
          },
        },
      ],
      pricingSections: [
        {
          sectionName: "Premium",
          sectionCode: "PR",
          basePrice,
          tier: "premium",
          rows: ["A", "B", "C", "D", "E", "F"]
        },
        {
          sectionName: "Standard",
          sectionCode: "ST",
          basePrice: Math.floor(basePrice * 0.7),
          tier: "standard",
          rows: ["G", "H", "I", "J", "K", "L"]
        },
        {
          sectionName: "Economy",
          sectionCode: "EC",
          basePrice: Math.floor(basePrice * 0.4),
          tier: "economy",
          rows: ["M", "N", "O", "P"]
        },
      ],
      tags: [
        composer.split(" ").pop(),
        faker.helpers.arrayElement(subcategories),
        faker.helpers.arrayElement(instruments),
      ],
      ageRestriction: faker.helpers.maybe(
        () => `${faker.number.int({ min: 6, max: 12 })}+`,
        { probability: 0.3 }
      ),
      dresscode: faker.helpers.arrayElement(["Formal", "Smart Casual", "Casual"]),
    });
  }

  return performances;
};

export const performancesData = [
  {
    id: 1,
    title: "Symphony No. 9 - Beethoven",
    composer: "Ludwig van Beethoven",
    description:
      "Experience Beethoven's monumental Ninth Symphony featuring the iconic 'Ode to Joy' chorus. A triumphant celebration of human unity and brotherhood.",
    venueId: 1,
    venueName: "Hong Kong Cultural Centre Concert Hall",
    date: generateFutureDate(30),
    duration: 75,
    image: generatePerformanceImageUrl(0),
    category: "Classical Music",
    subcategory: "Symphony",
    status: "on_sale",
    orchestra: "Hong Kong Philharmonic Orchestra",
    conductor: "Jaap van Zweden",
    soloists: [
      { name: "Sarah Chang", instrument: "Soprano" },
      { name: "Emily D'Angelo", instrument: "Mezzo-soprano" },
    ],
    program: [
      {
        title: "Symphony No. 9 in D minor, Op. 125",
        composer: "Ludwig van Beethoven",
        movements: [
          "Allegro ma non troppo",
          "Molto vivace",
          "Adagio molto e cantabile",
          "Presto - Allegro assai",
        ],
      },
    ],
    showtimes: [
      {
        id: generateShowtimeId(1, 0),
        dateTime: generateFutureDate(30),
        venueName: "Hong Kong Cultural Centre Concert Hall",
        status: "on_sale",
        pricing: {
          sections: [
            {
              sectionName: "Orchestra Stalls",
              sectionCode: "OS",
              basePrice: 800,
              tier: "vip",
              rows: ["A", "B", "C", "D", "E", "F", "G", "H"],
              seatsPerRow: 26,
            },
            {
              sectionName: "Dress Circle",
              sectionCode: "DC",
              basePrice: 600,
              tier: "premium",
              rows: ["I", "J", "K", "L", "M", "N"],
              seatsPerRow: 30,
            },
            {
              sectionName: "Grand Circle",
              sectionCode: "GC",
              basePrice: 400,
              tier: "standard",
              rows: ["O", "P", "Q", "R"],
              seatsPerRow: 32,
            },
            {
              sectionName: "Upper Circle",
              sectionCode: "UC",
              basePrice: 200,
              tier: "economy",
              rows: ["S", "T", "U"],
              seatsPerRow: 28,
            },
          ],
        },
      },
    ],
    pricingSections: [
      {
        sectionName: "Orchestra Stalls",
        sectionCode: "OS",
        basePrice: 800,
        tier: "vip",
        rows: ["A", "B", "C", "D", "E", "F", "G", "H"],
        seatsPerRow: 26,
      },
      {
        sectionName: "Dress Circle",
        sectionCode: "DC",
        basePrice: 600,
        tier: "premium",
        rows: ["I", "J", "K", "L", "M", "N"],
        seatsPerRow: 30,
      },
      {
        sectionName: "Grand Circle",
        sectionCode: "GC",
        basePrice: 400,
        tier: "standard",
        rows: ["O", "P", "Q", "R"],
        seatsPerRow: 32,
      },
      {
        sectionName: "Upper Circle",
        sectionCode: "UC",
        basePrice: 200,
        tier: "economy",
        rows: ["S", "T", "U"],
        seatsPerRow: 28,
      },
    ],
    tags: ["Beethoven", "Symphony", "Choral", "Orchestra", "Classical"],
    ageRestriction: null,
    dresscode: "Smart Casual",
  },
  {
    id: 2,
    title: "Piano Concerto No. 1 - Tchaikovsky",
    composer: "Pyotr Ilyich Tchaikovsky",
    description:
      "Featuring renowned pianist performing Tchaikovsky's dramatic and powerful First Piano Concerto. An unforgettable evening of romantic music.",
    venueId: 1,
    venueName: "Hong Kong Cultural Centre Concert Hall",
    date: generateFutureDate(45),
    duration: 90,
    image: generatePerformanceImageUrl(1),
    category: "Classical Music",
    subcategory: "Concerto",
    status: "early_bird",
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
    ],
    showtimes: [
      {
        id: generateShowtimeId(2, 0),
        dateTime: generateFutureDate(45),
        venueName: "Hong Kong Cultural Centre Concert Hall",
        status: "early_bird",
        pricing: {
          sections: [
            {
              sectionName: "Orchestra Stalls",
              sectionCode: "OS",
              basePrice: 900,
              tier: "vip",
              rows: ["A", "B", "C", "D", "E", "F", "G", "H"],
              seatsPerRow: 26,
            },
            {
              sectionName: "Dress Circle",
              sectionCode: "DC",
              basePrice: 700,
              tier: "premium",
              rows: ["I", "J", "K", "L", "M", "N"],
              seatsPerRow: 30,
            },
            {
              sectionName: "Grand Circle",
              sectionCode: "GC",
              basePrice: 500,
              tier: "standard",
              rows: ["O", "P", "Q", "R"],
              seatsPerRow: 32,
            },
            {
              sectionName: "Upper Circle",
              sectionCode: "UC",
              basePrice: 300,
              tier: "economy",
              rows: ["S", "T", "U"],
              seatsPerRow: 28,
            },
          ],
        },
      },
    ],
    pricingSections: [
      {
        sectionName: "Orchestra Stalls",
        sectionCode: "OS",
        basePrice: 900,
        tier: "vip",
        rows: ["A", "B", "C", "D", "E", "F", "G", "H"],
        seatsPerRow: 26,
      },
      {
        sectionName: "Dress Circle",
        sectionCode: "DC",
        basePrice: 700,
        tier: "premium",
        rows: ["I", "J", "K", "L", "M", "N"],
        seatsPerRow: 30,
      },
      {
        sectionName: "Grand Circle",
        sectionCode: "GC",
        basePrice: 500,
        tier: "standard",
        rows: ["O", "P", "Q", "R"],
        seatsPerRow: 32,
      },
      {
        sectionName: "Upper Circle",
        sectionCode: "UC",
        basePrice: 300,
        tier: "economy",
        rows: ["S", "T", "U"],
        seatsPerRow: 28,
      },
    ],
    tags: ["Tchaikovsky", "Piano", "Concerto", "Romantic"],
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
    date: generateFutureDate(15),
    duration: 50,
    image: generatePerformanceImageUrl(2),
    category: "Classical Music",
    subcategory: "Baroque",
    status: "on_sale",
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
    showtimes: [
      {
        id: generateShowtimeId(3, 0),
        dateTime: generateFutureDate(15),
        venueName: "Hong Kong City Hall Concert Hall",
        status: "on_sale",
        pricing: {
          sections: [
            {
              sectionName: "Stalls",
              sectionCode: "ST",
              basePrice: 500,
              tier: "premium",
              rows: generateRowLabels("A", 17),
              seatsPerRow: 34,
            },
            {
              sectionName: "Circle",
              sectionCode: "CI",
              basePrice: 350,
              tier: "standard",
              rows: generateRowLabels("R", 8),
              seatsPerRow: 32,
            },
            {
              sectionName: "Balcony",
              sectionCode: "BA",
              basePrice: 200,
              tier: "economy",
              rows: generateRowLabels("Z", 4),
              seatsPerRow: 26,
            },
          ],
        },
      },
    ],
    pricingSections: [
      {
        sectionName: "Stalls",
        sectionCode: "ST",
        basePrice: 500,
        tier: "premium",
        rows: generateRowLabels("A", 17),
        seatsPerRow: 34,
      },
      {
        sectionName: "Circle",
        sectionCode: "CI",
        basePrice: 350,
        tier: "standard",
        rows: generateRowLabels("R", 8),
        seatsPerRow: 32,
      },
      {
        sectionName: "Balcony",
        sectionCode: "BA",
        basePrice: 200,
        tier: "economy",
        rows: generateRowLabels("Z", 4),
        seatsPerRow: 26,
      },
    ],
    tags: ["Vivaldi", "Baroque", "Violin", "Four Seasons", "Family-Friendly"],
    ageRestriction: "6+",
    dresscode: "Smart Casual",
  },
  ...generateAdditionalPerformances(),
];
