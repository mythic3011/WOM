import express from "express";
import {
  generateMockUsers,
  generateMockPerformances,
  generateMockBookings,
  clearAllData,
  getSystemStats,
} from "../controllers/devToolsController.js";
import { isAuthenticated, isAdmin } from "../middleware/auth.js";

const router = express.Router();

router.use(isAuthenticated);
router.use(isAdmin);

router.post("/generate/users", generateMockUsers);
router.post("/generate/performances", generateMockPerformances);
router.post("/generate/bookings", generateMockBookings);
router.post("/clear-all", clearAllData);
router.get("/stats", getSystemStats);

export default router;
