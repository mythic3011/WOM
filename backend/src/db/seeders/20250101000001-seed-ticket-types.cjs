module.exports = {
  async up(queryInterface, _Sequelize) {
    const now = new Date();

    await queryInterface.bulkInsert("ticket_types", [
      {
        id: "adult",
        name: "Adult",
        description: "Standard adult ticket (18-64 years)",
        discount: 1.0,
        eligibility: "Ages 18-64",
        isActive: true,
        minGroupSize: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "child",
        name: "Child",
        description: "Children ticket with 50% discount",
        discount: 0.5,
        eligibility: "Ages 3-17, valid ID required",
        isActive: true,
        minGroupSize: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "senior",
        name: "Senior",
        description: "Senior citizen ticket with 30% discount",
        discount: 0.7,
        eligibility: "Ages 65+, valid senior ID required",
        isActive: true,
        minGroupSize: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "student",
        name: "Student",
        description: "Student ticket with 25% discount",
        discount: 0.75,
        eligibility: "Full-time students with valid student ID",
        isActive: true,
        minGroupSize: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "vip",
        name: "VIP",
        description: "VIP membership ticket with 15% discount",
        discount: 0.85,
        eligibility: "VIP members only",
        isActive: true,
        minGroupSize: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "family-pack",
        name: "Family Pack",
        description: "Family package with 20% discount (minimum 4 people)",
        discount: 0.8,
        eligibility: "Minimum 4 tickets required",
        isActive: true,
        minGroupSize: 4,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "group-5",
        name: "Group of 5",
        description: "Small group discount - 25% off (minimum 5 people)",
        discount: 0.75,
        eligibility: "Minimum 5 tickets required",
        isActive: true,
        minGroupSize: 5,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "group-10",
        name: "Group of 10",
        description: "Large group discount - 30% off (minimum 10 people)",
        discount: 0.7,
        eligibility: "Minimum 10 tickets required",
        isActive: true,
        minGroupSize: 10,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.bulkDelete("ticket_types", null, {});
  },
};





