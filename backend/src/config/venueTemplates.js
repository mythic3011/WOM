export const DEFAULT_VENUE_TEMPLATES = [
    {
        id: "venue-theater",
        name: "Classic Theater",
        description:
            "Traditional theater layout with orchestra, dress circle, and balcony",
        capacity: 500,
        layout: {
            sections: [
                {
                    name: "Orchestra",
                    rows: 10,
                    seatsPerRow: 20,
                    tier: "premium",
                    startRow: "A",
                },
                {
                    name: "Dress Circle",
                    rows: 8,
                    seatsPerRow: 18,
                    tier: "standard",
                    startRow: "K",
                },
                {
                    name: "Balcony",
                    rows: 6,
                    seatsPerRow: 16,
                    tier: "economy",
                    startRow: "S",
                },
            ],
        },
        facilities: [
            "Wheelchair accessible",
            "Air conditioned",
            "Premium acoustics",
        ],
        status: "active",
    },
    {
        id: "venue-concert",
        name: "Concert Hall",
        description: "Modern concert hall with excellent acoustics",
        capacity: 800,
        layout: {
            sections: [
                {
                    name: "Orchestra Stalls",
                    rows: 12,
                    seatsPerRow: 24,
                    tier: "vip",
                    startRow: "A",
                },
                {
                    name: "Grand Tier",
                    rows: 10,
                    seatsPerRow: 20,
                    tier: "premium",
                    startRow: "M",
                },
                {
                    name: "Upper Circle",
                    rows: 8,
                    seatsPerRow: 18,
                    tier: "standard",
                    startRow: "W",
                },
            ],
        },
        facilities: [
            "Wheelchair accessible",
            "Air conditioned",
            "Premium acoustics",
            "Elevator access",
        ],
        status: "active",
    },
    {
        id: "venue-arena",
        name: "Sports Arena",
        description: "Large multi-purpose arena for major events",
        capacity: 2000,
        layout: {
            sections: [
                {
                    name: "Floor Seating",
                    rows: 20,
                    seatsPerRow: 30,
                    tier: "premium",
                    startRow: "A",
                },
                {
                    name: "Lower Bowl",
                    rows: 15,
                    seatsPerRow: 40,
                    tier: "standard",
                    startRow: "U",
                },
                {
                    name: "Upper Bowl",
                    rows: 20,
                    seatsPerRow: 35,
                    tier: "economy",
                    startRow: "AJ",
                },
            ],
        },
        facilities: [
            "Wheelchair accessible",
            "Air conditioned",
            "Large screens",
            "Multiple entrances",
        ],
        status: "active",
    },
];
