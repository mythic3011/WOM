import { faker } from "@faker-js/faker";
import { hashPassword } from "../../utils/hash.js";

export const generateUsers = async () => {
  faker.seed(12345);

  const adminPass = await hashPassword("adminpass");
  const userPass = await hashPassword("userpass");

  const users = [
    {
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
    },
    {
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
    },
  ];

  for (let i = 3; i <= 20; i++) {
    const gender = faker.helpers.arrayElement(["male", "female", "prefer_not_to_say"]);
    const sex = gender === "male" ? "male" : gender === "female" ? "female" : undefined;
    const firstName = faker.person.firstName(sex);
    const lastName = faker.person.lastName();
    const username = faker.internet.username({ firstName, lastName }).toLowerCase();

    users.push({
      userId: String(i).padStart(6, "0"),
      username,
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      password: userPass,
      title: faker.person.prefix(),
      name: `${firstName} ${lastName}`,
      birthday: faker.date
        .birthdate({ min: 18, max: 70, mode: "age" })
        .toISOString()
        .split("T")[0],
      gender,
      role: "user",
      status: faker.helpers.arrayElement(["active", "active", "active", "inactive"]),
      phone: faker.string.numeric(8),
      address: faker.helpers.maybe(
        () => faker.location.streetAddress({ useFullAddress: true }),
        { probability: 0.7 }
      ),
      profileImage: null,
    });
  }

  return users;
};
