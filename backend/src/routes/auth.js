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
 *     description: |
 *       Creates a new user account with the provided credentials. This endpoint is rate-limited to prevent abuse.
 *       
 *       **Authentication Flow:**
 *       1. Submit registration details with valid email, username, and password
 *       2. System validates input and checks for existing users
 *       3. Password is securely hashed before storage
 *       4. Session cookie is automatically created upon successful registration
 *       5. User is immediately logged in and can access protected endpoints
 *       
 *       **Password Requirements:**
 *       - Minimum 8 characters
 *       - At least one uppercase letter
 *       - At least one lowercase letter
 *       - At least one number
 *       
 *       **Username Requirements:**
 *       - 3-30 characters
 *       - Only letters, numbers, and underscores allowed
 *       - Must be unique across the system
 *       
 *       **Rate Limiting:**
 *       - Maximum 5 registration attempts per 15 minutes per IP address
 *       - Only failed attempts count toward the limit
 *       - Rate limit resets after successful registration
 *       
 *       **Session Management:**
 *       - Session cookie name: `connect.sid`
 *       - Cookie is HTTP-only and secure in production
 *       - Session expires after 24 hours of inactivity
 *     x-rate-limit:
 *       window: 15 minutes
 *       max: 5
 *       skipSuccessful: true
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
 *                 minLength: 3
 *                 maxLength: 30
 *                 pattern: '^[a-zA-Z0-9_]+$'
 *                 description: Unique username (letters, numbers, underscores only)
 *                 example: johndoe
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Valid email address (will be normalized)
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)'
 *                 description: Strong password with uppercase, lowercase, and number
 *                 example: SecurePass123!
 *               name:
 *                 type: string
 *                 description: Full name of the user
 *                 example: John Doe
 *               phone:
 *                 type: string
 *                 description: Optional phone number
 *                 example: '+852 9123 4567'
 *           examples:
 *             standardUser:
 *               summary: Standard user registration
 *               value:
 *                 username: johndoe
 *                 email: john@example.com
 *                 password: SecurePass123!
 *                 name: John Doe
 *                 phone: '+852 9123 4567'
 *             minimalUser:
 *               summary: Registration with required fields only
 *               value:
 *                 username: janedoe
 *                 email: jane@example.com
 *                 password: AnotherSecure456!
 *                 name: Jane Doe
 *     responses:
 *       201:
 *         description: User registered successfully and session created
 *         headers:
 *           Set-Cookie:
 *             description: Session cookie for authentication
 *             schema:
 *               type: string
 *               example: connect.sid=s%3A...; Path=/; HttpOnly; Secure
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/RegisterSuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       422:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError422'
 *             examples:
 *               validationErrors:
 *                 $ref: '#/components/examples/ValidationErrorUserInput'
 *       429:
 *         description: Too many registration attempts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Too many login attempts. Please try again in 15 minutes.
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
 *     description: |
 *       Authenticates a user with username/email and password. Creates a session cookie upon successful authentication.
 *       
 *       **Authentication Flow:**
 *       1. Provide either username OR email along with password
 *       2. System validates credentials against stored user data
 *       3. Password is compared using secure bcrypt hashing
 *       4. Session cookie is created and returned in response headers
 *       5. User can now access protected endpoints using the session cookie
 *       
 *       **Login Options:**
 *       - Login with username and password
 *       - Login with email and password
 *       - Either username or email is required (not both)
 *       
 *       **Rate Limiting:**
 *       - Maximum 5 login attempts per 15 minutes per IP address
 *       - Only failed attempts count toward the limit
 *       - Successful logins reset the counter
 *       
 *       **Session Management:**
 *       - Session cookie name: `connect.sid`
 *       - Cookie is HTTP-only and secure in production
 *       - Session expires after 24 hours of inactivity
 *       - Use `/api/auth/logout` to explicitly end the session
 *       
 *       **Security Notes:**
 *       - Account may be suspended after multiple failed login attempts
 *       - Passwords are never returned in responses
 *       - Session cookies should be stored securely by the client
 *     x-rate-limit:
 *       window: 15 minutes
 *       max: 5
 *       skipSuccessful: true
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
 *                 description: Username for login (provide username OR email)
 *                 example: admin
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email for login (provide username OR email)
 *                 example: admin@wom.hk
 *               password:
 *                 type: string
 *                 description: User password
 *                 example: adminpass
 *           examples:
 *             withUsername:
 *               summary: Login with username
 *               value:
 *                 username: admin
 *                 password: adminpass
 *             withEmail:
 *               summary: Login with email
 *               value:
 *                 email: admin@wom.hk
 *                 password: adminpass
 *     responses:
 *       200:
 *         description: Login successful and session created
 *         headers:
 *           Set-Cookie:
 *             description: Session cookie for authentication
 *             schema:
 *               type: string
 *               example: connect.sid=s%3A...; Path=/; HttpOnly; Secure
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/LoginSuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       422:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError422'
 *             examples:
 *               missingCredentials:
 *                 summary: Missing username or email
 *                 value:
 *                   success: false
 *                   message: Validation failed
 *                   code: VALIDATION_ERROR
 *                   errors:
 *                     - field: username
 *                       code: MISSING_IDENTIFIER
 *                       message: Username or email is required
 *                       severity: error
 *       429:
 *         description: Too many login attempts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Too many login attempts. Please try again in 15 minutes.
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
 *     description: |
 *       Ends the current user session and clears the session cookie. After logout, the user must login again to access protected endpoints.
 *       
 *       **Logout Process:**
 *       1. Session is destroyed on the server
 *       2. Session cookie is cleared from the client
 *       3. User is no longer authenticated
 *       4. Subsequent requests to protected endpoints will return 401 Unauthorized
 *       
 *       **Authentication Required:**
 *       - Must have valid session cookie
 *       - No authentication = 401 Unauthorized response
 *       
 *       **Best Practices:**
 *       - Always call logout when user explicitly logs out
 *       - Clear any client-side user data after logout
 *       - Redirect to login page after successful logout
 *       
 *       **Related Endpoints:**
 *       - POST /api/auth/login - Login to create new session
 *       - GET /api/auth/check - Check if session is still valid
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Logout successful and session destroyed
 *         headers:
 *           Set-Cookie:
 *             description: Cleared session cookie
 *             schema:
 *               type: string
 *               example: connect.sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Logout successful
 *             examples:
 *               success:
 *                 summary: Successful logout
 *                 value:
 *                   success: true
 *                   message: Logout successful
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post("/logout", authController.logout);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags: [Authentication]
 *     summary: Get current user info
 *     description: |
 *       Retrieves the complete profile information for the currently authenticated user. This endpoint is useful for:
 *       - Loading user profile on application startup
 *       - Verifying current user permissions and role
 *       - Displaying user information in the UI
 *       - Checking account status
 *       
 *       **Authentication Required:**
 *       - Must have valid session cookie
 *       - Returns 401 if not authenticated
 *       
 *       **Returned Information:**
 *       - User ID, username, email, name
 *       - Role (user or admin)
 *       - Account status (active or suspended)
 *       - Profile details (phone, birthday, gender, profile image)
 *       - Account timestamps (created, updated)
 *       
 *       **Use Cases:**
 *       - Check if user is still logged in
 *       - Get user role for permission checks
 *       - Display user profile information
 *       - Verify account status before critical operations
 *       
 *       **Related Endpoints:**
 *       - GET /api/auth/check - Lightweight session check
 *       - PUT /api/users/{id} - Update user profile
 *       - GET /api/users/{id} - Get any user's public profile
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Current user information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *             examples:
 *               regularUser:
 *                 summary: Regular user profile
 *                 value:
 *                   success: true
 *                   user:
 *                     id: 550e8400-e29b-41d4-a716-446655440000
 *                     username: johndoe
 *                     email: john.doe@example.com
 *                     name: John Doe
 *                     role: user
 *                     status: active
 *                     phone: '+852 9123 4567'
 *                     birthday: '1990-05-15'
 *                     gender: male
 *                     profileImage: https://example.com/images/johndoe.jpg
 *                     createdAt: '2024-01-15T10:30:00Z'
 *                     updatedAt: '2024-11-15T14:20:00Z'
 *               adminUser:
 *                 summary: Admin user profile
 *                 value:
 *                   success: true
 *                   user:
 *                     id: 660e8400-e29b-41d4-a716-446655440001
 *                     username: admin
 *                     email: admin@wom.hk
 *                     name: Admin User
 *                     role: admin
 *                     status: active
 *                     createdAt: '2023-06-01T08:00:00Z'
 *                     updatedAt: '2024-11-18T09:15:00Z'
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
 *     description: |
 *       Lightweight endpoint to verify if the current session is valid. This endpoint does not require authentication and can be used to check session status without triggering authentication errors.
 *       
 *       **Use Cases:**
 *       - Check if user is logged in before showing login/logout buttons
 *       - Verify session validity on application startup
 *       - Implement "remember me" functionality
 *       - Periodic session health checks
 *       
 *       **Response Behavior:**
 *       - Returns `authenticated: true` if valid session exists
 *       - Returns `authenticated: false` if no session or expired session
 *       - Never returns 401 error (unlike /api/auth/me)
 *       - Includes basic user info if authenticated
 *       
 *       **Performance:**
 *       - Very lightweight operation
 *       - Suitable for frequent polling
 *       - No database queries if session is invalid
 *       
 *       **Comparison with /api/auth/me:**
 *       - /api/auth/check: Lightweight, no auth required, returns boolean
 *       - /api/auth/me: Full profile, requires auth, returns complete user object
 *       
 *       **Related Endpoints:**
 *       - GET /api/auth/me - Get full user profile (requires auth)
 *       - POST /api/auth/login - Create new session
 *       - POST /api/auth/logout - Destroy session
 *     responses:
 *       200:
 *         description: Session status check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 authenticated:
 *                   type: boolean
 *                   description: Whether a valid session exists
 *                 user:
 *                   type: object
 *                   description: Basic user info if authenticated (null if not)
 *                   nullable: true
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     username:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [user, admin]
 *             examples:
 *               authenticated:
 *                 summary: Valid session exists
 *                 value:
 *                   success: true
 *                   authenticated: true
 *                   user:
 *                     id: 550e8400-e29b-41d4-a716-446655440000
 *                     username: johndoe
 *                     role: user
 *               notAuthenticated:
 *                 summary: No valid session
 *                 value:
 *                   success: true
 *                   authenticated: false
 *                   user: null
 */
router.get("/check", authController.checkSession);

/**
 * @openapi
 * /api/auth/profile-image:
 *   get:
 *     tags: [Authentication]
 *     summary: Get user's profile image
 *     description: |
 *       Retrieves the authenticated user's profile image (base64 encoded).
 *       This is a separate endpoint to avoid storing large images in localStorage.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Profile image retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     profileImage:
 *                       type: string
 *                       description: Base64 encoded image
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/profile-image", isAuthenticated, authController.getProfileImage);

export default router;
