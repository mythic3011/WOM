import express from "express";
import { body } from "express-validator";
import * as authController from "#controllers/authController.js";
import { validate } from "#middleware/validation.js";
import { authLimiter } from "#middleware/rateLimiter.js";
import { isAuthenticated } from "#middleware/auth.js";

const router = express.Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register new user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password, name]
 *             properties:
 *               username:
 *                 type: string
 *                 example: johndoe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: SecurePass123!
 *               name:
 *                 type: string
 *                 example: John Doe
 *               phone:
 *                 type: string
 *                 example: '91234567'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post(
  "/register",
  authLimiter,
  [
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("username")
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be 3-30 characters")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage("Username can only contain letters, numbers, and underscores"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("phone").optional().trim(),
    validate,
  ],
  authController.register
);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login with credentials
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 example: adminpass
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  "/login",
  authLimiter,
  [
    body("password").notEmpty().withMessage("Password is required"),
    body().custom((value, { req }) => {
      if (!req.body.username && !req.body.email) {
        throw new Error("Username or email is required");
      }
      return true;
    }),
    validate,
  ],
  authController.login
);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Logout current user
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post("/logout", authController.logout);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags: [Authentication]
 *     summary: Get current user info
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Current user info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/me", isAuthenticated, authController.getCurrentUser);

/**
 * @openapi
 * /api/auth/check:
 *   get:
 *     tags: [Authentication]
 *     summary: Check session status
 *     responses:
 *       200:
 *         description: Session status
 */
router.get("/check", authController.checkSession);

export default router;
