import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

const ORCHESTRA_COMPOSERS = [
  "Ludwig van Beethoven",
  "Wolfgang Amadeus Mozart",
  "Johann Sebastian Bach",
  "Pyotr Ilyich Tchaikovsky",
  "Johannes Brahms",
];

const FAMOUS_WORKS = {
  symphony: ["Symphony No. 9", "Symphony No. 5", "Symphony No. 40"],
  concerto: ["Piano Concerto No. 21", "Violin Concerto"],
  opera: ["The Magic Flute", "Carmen", "La Traviata"],
};

export const generateMockUsers = async (req, res, next) => {
  try {
    const { count = 10, role = "user" } = req.body;

    faker.seed(Date.now());

    const users = [];
    for (let i = 0; i < Math.min(count, 100); i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = faker.internet.email({ firstName, lastName });
      const hashedPassword = await bcrypt.hash("test123", 10);

      users.push({
        username: faker.internet.username({ firstName, lastName }),
        email: email.toLowerCase(),
        password: hashedPassword,
        name: `${firstName} ${lastName}`,
        phone: faker.phone.number("+852 #### ####"),
        role: role,
        status: "active",
        birthday: faker.date.birthdate({ min: 18, max: 75, mode: "age" }),
      });
    }

    res.json({
      success: true,
      message: `Generated ${users.length} mock users`,
      data: { users },
    });
  } catch (error) {
    next(error);
  }
};

export const generateMockPerformances = async (req, res, next) => {
  try {
    const { count = 10 } = req.body;

    faker.seed(Date.now());

    const performances = [];
    for (let i = 0; i < Math.min(count, 50); i++) {
      const workTypes = Object.keys(FAMOUS_WORKS);
      const selectedWorkType = faker.helpers.arrayElement(workTypes);
      const works = FAMOUS_WORKS[selectedWorkType];
      const title = faker.helpers.arrayElement(works);
      const composer = faker.helpers.arrayElement(ORCHESTRA_COMPOSERS);
      const date = faker.date.future({ years: 1 });

      performances.push({
        title,
        composer,
        description: faker.lorem.paragraph(),
        genre: selectedWorkType,
        date: date.toISOString(),
        duration: faker.number.int({ min: 60, max: 180 }),
        image: faker.image.url(),
        status: "on_sale",
      });
    }

    res.json({
      success: true,
      message: `Generated ${performances.length} mock performances`,
      data: { performances },
    });
  } catch (error) {
    next(error);
  }
};

export const generateMockBookings = async (req, res, next) => {
  try {
    const { count = 20 } = req.body;

    faker.seed(Date.now());

    const bookings = [];
    const statuses = ["pending", "confirmed", "cancelled", "completed"];

    for (let i = 0; i < Math.min(count, 100); i++) {
      const status = faker.helpers.arrayElement(statuses);
      const seatCount = faker.number.int({ min: 1, max: 4 });
      const basePrice = faker.number.int({ min: 200, max: 800 });
      const totalAmount = basePrice * seatCount;

      bookings.push({
        status,
        totalAmount,
        seatCount,
        performanceDate: faker.date.future().toISOString(),
        bookingDate: faker.date.past({ years: 1 }).toISOString(),
      });
    }

    res.json({
      success: true,
      message: `Generated ${bookings.length} mock bookings`,
      data: { bookings },
    });
  } catch (error) {
    next(error);
  }
};

export const clearAllData = async (req, res, next) => {
  try {
    const { confirm } = req.body;

    if (confirm !== "DELETE_ALL") {
      return res.status(400).json({
        success: false,
        message: "Confirmation string required",
      });
    }

    res.json({
      success: true,
      message: "All data cleared successfully",
      data: { cleared: true },
    });
  } catch (error) {
    next(error);
  }
};

export const getSystemStats = async (req, res, next) => {
  try {
    const stats = {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      env: process.env.NODE_ENV,
      nodeVersion: process.version,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
