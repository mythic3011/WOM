const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const adminPass = await bcrypt.hash("adminpass", 10);
    const userPass = await bcrypt.hash("userpass", 10);

    const users = [
      {
        id: uuidv4(),
        userId: "000001",
        username: "admin",
        email: "admin@wom.hk",
        password: adminPass,
        title: "Mr.",
        name: "Administrator",
        birthday: "1985-05-20",
        gender: "male",
        role: "admin",
        status: "active",
        phone: "23330600",
        address: "Room M101, 1/F, Li Ka Shing Tower, PolyU",
        profileImage: null,
        lastLoginAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        userId: "000002",
        username: "user",
        email: "user@example.com",
        password: userPass,
        title: "Mr.",
        name: "Test User",
        birthday: "1995-03-15",
        gender: "prefer_not_to_say",
        role: "user",
        status: "active",
        phone: "91234567",
        address: "Flat 15A, Block 2, Happy Garden, Kowloon",
        profileImage: null,
        lastLoginAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        userId: "000003",
        username: "john.smith",
        email: "john.smith@example.com",
        password: userPass,
        title: "Mr.",
        name: "John Smith",
        birthday: "1990-06-15",
        gender: "male",
        role: "user",
        status: "active",
        phone: "91234568",
        address: "Room 501, Tower A, Happy Valley Mansion",
        profileImage: null,
        lastLoginAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        userId: "000004",
        username: "mary.wong",
        email: "mary.wong@example.com",
        password: userPass,
        title: "Ms.",
        name: "Mary Wong",
        birthday: "1988-09-22",
        gender: "female",
        role: "user",
        status: "active",
        phone: "92345678",
        address: "Flat 12B, Silver Mansion, Causeway Bay",
        profileImage: null,
        lastLoginAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        userId: "000005",
        username: "peter.chan",
        email: "peter.chan@example.com",
        password: userPass,
        title: "Mr.",
        name: "Peter Chan",
        birthday: "1992-12-08",
        gender: "male",
        role: "user",
        status: "active",
        phone: "93456789",
        address: "Room 1508, Ocean Tower, Tsim Sha Tsui",
        profileImage: null,
        lastLoginAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ];

    await queryInterface.bulkInsert("users", users);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("users", null, {});
  },
};
