module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    
    await queryInterface.bulkInsert("ticket_types", [
      {
        id: "adult",
        name: "Adult",
        description: "Standard adult ticket (18-64 years)",
        discount: 1.0,
        eligibility: "Ages 18-64",
        isActive: true,
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
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("ticket_types", null, {});
  },
};





