import env from "./env.js";

export const corsConfig = {
  origin: env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["set-cookie"],
};
