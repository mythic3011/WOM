import express from "express";
import { isAuthenticated, isAdmin } from "#middleware/auth.js";
import {
  getAdminStats,
  getUserStats,
  getPerformanceStats,
  getAllPerformanceStats,
  getVenueStats,
  getAllVenueStats
} from "#controllers/statsController.js";

const router = express.Router();

router.get("/admin", isAuthenticated, isAdmin, getAdminStats);
router.get("/user", isAuthenticated, getUserStats);
router.get("/performances", isAuthenticated, isAdmin, getAllPerformanceStats);
router.get("/performances/:performanceId", isAuthenticated, isAdmin, getPerformanceStats);
router.get("/venues", isAuthenticated, isAdmin, getAllVenueStats);
router.get("/venues/:venueId", isAuthenticated, isAdmin, getVenueStats);

export default router;
