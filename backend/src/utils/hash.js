import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export const hashPassword = async (password) =>
  await bcrypt.hash(password, SALT_ROUNDS);

export const comparePassword = async (password, hashedPassword) =>
  await bcrypt.compare(password, hashedPassword);
