import express from "express";
import * as userController from "#controllers/userController.js";
import { validate } from "#middleware/validation.js";
import { isAuthenticated, isAdmin, isOwnerOrAdminByParam } from "#middleware/auth.js";
import {
  createUserValidator,
  updateUserValidator,
  getUserValidator,
  deleteUserValidator,
  listUsersValidator,
  selfDeleteValidator,
} from "#middleware/validators/userValidators.js";
import { uploadSingle } from "#config/multer.js";

const router = express.Router();

/**
 * @openapi
 * /api/users/upload-profile-image:
 *   post:
 *     tags: [Users]
 *     summary: Upload profile image
 *     description: |
 *       Uploads a profile image for the authenticated user. Returns a public URL for the uploaded image.
 *       
 *       **Authentication Required:**
 *       - Must be logged in
 *       - Users can only upload their own profile image
 *       
 *       **File Requirements:**
 *       - Allowed types: JPEG, PNG, WebP
 *       - Maximum size: 5MB
 *       - Image will be processed and optimized
 *       
 *       **Processing:**
 *       - Resized to 300x300 (cover fit)
 *       - Compressed to JPEG format
 *       - Stored with unique filename
 *       
 *       **Returns:**
 *       - Public URL for the uploaded image
 *       - Can be used in user profile updates
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Profile image file to upload
 *     responses:
 *       200:
 *         description: Image uploaded successfully
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
 *                     imageUrl:
 *                       type: string
 *                       example: /uploads/profiles/abc123.jpg
 *       400:
 *         description: Invalid file or validation error
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  "/upload-profile-image",
  isAuthenticated,
  uploadSingle,
  userController.uploadProfileImage
);

/**
 * @openapi
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: Get all users with pagination
 *     description: |
 *       Retrieves a paginated list of all users in the system. This endpoint is restricted to administrators only.
 *       
 *       **Admin Only:**
 *       - Requires authentication with admin role
 *       - Regular users will receive 403 Forbidden
 *       
 *       **Pagination:**
 *       - Default page size: 10 users
 *       - Maximum page size: 100 users
 *       - Page numbers start at 1
 *       - Returns total count and total pages
 *       
 *       **Use Cases:**
 *       - Admin dashboard user management
 *       - User search and filtering
 *       - Bulk user operations
 *       - User analytics and reporting
 *       
 *       **Performance:**
 *       - Results are paginated for optimal performance
 *       - Consider caching for frequently accessed pages
 *       - Use appropriate page size for your use case
 *       
 *       **Related Endpoints:**
 *       - GET /api/users/{id} - Get specific user details
 *       - POST /api/users - Create new user
 *       - PUT /api/users/{id} - Update user
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Number of users per page
 *         example: 10
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total number of users
 *                     page:
 *                       type: integer
 *                       description: Current page number
 *                     limit:
 *                       type: integer
 *                       description: Users per page
 *                     totalPages:
 *                       type: integer
 *                       description: Total number of pages
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/UserListResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
  "/",
  isAuthenticated,
  isAdmin,
  listUsersValidator,
  validate,
  userController.getAllUsers
);

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     description: |
 *       Retrieves detailed information for a specific user by their unique ID. Any authenticated user can view user profiles.
 *       
 *       **Authentication Required:**
 *       - Must be logged in to view user profiles
 *       - No special permissions needed
 *       
 *       **Privacy:**
 *       - Password is never included in response
 *       - All profile fields are visible to authenticated users
 *       - Consider implementing privacy settings in future
 *       
 *       **Use Cases:**
 *       - View user profile page
 *       - Display user information in bookings
 *       - Show user details in admin panel
 *       - Verify user identity
 *       
 *       **Related Endpoints:**
 *       - GET /api/auth/me - Get current user (self)
 *       - PUT /api/users/{id} - Update user profile
 *       - GET /api/users/{id}/bookings - Get user's bookings
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique user identifier
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *             examples:
 *               success:
 *                 $ref: '#/components/examples/UserResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  "/:id",
  isAuthenticated,
  getUserValidator,
  validate,
  userController.getUserById
);

/**
 * @openapi
 * /api/users:
 *   post:
 *     tags: [Users]
 *     summary: Create new user (Admin only)
 *     description: |
 *       Creates a new user account. This endpoint is restricted to administrators and differs from registration in that it allows setting the user role directly.
 *       
 *       **Admin Only:**
 *       - Requires authentication with admin role
 *       - Can create users with any role (user or admin)
 *       - Bypasses rate limiting
 *       
 *       **Differences from /api/auth/register:**
 *       - /api/auth/register: Public, creates regular users only, rate-limited
 *       - /api/users (POST): Admin only, can create admin users, no rate limit
 *       
 *       **Use Cases:**
 *       - Admin creating user accounts
 *       - Bulk user import
 *       - Creating admin accounts
 *       - System initialization
 *       
 *       **Related Endpoints:**
 *       - POST /api/auth/register - Public user registration
 *       - PUT /api/users/{id} - Update user
 *       - GET /api/users - List all users
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *           examples:
 *             createRegularUser:
 *               summary: Create regular user
 *               value:
 *                 username: newuser
 *                 email: newuser@example.com
 *                 password: SecurePass123!
 *                 name: New User
 *                 role: user
 *             createAdminUser:
 *               summary: Create admin user
 *               value:
 *                 username: newadmin
 *                 email: admin@example.com
 *                 password: AdminPass456!
 *                 name: Admin User
 *                 role: admin
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntity'
 */
router.post(
  "/",
  isAuthenticated,
  isAdmin,
  createUserValidator,
  validate,
  userController.createUser
);

/**
 * @openapi
 * /api/users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update user profile
 *     description: |
 *       Updates user profile information. Users can update their own profile, and admins can update any user's profile.
 *       
 *       **Authorization:**
 *       - Users can update their own profile
 *       - Admins can update any user's profile
 *       - Other users cannot update profiles they don't own
 *       
 *       **Updatable Fields:**
 *       - name, email, phone, birthday, gender
 *       - password (if provided, must meet security requirements)
 *       - role (admin only)
 *       - status (admin only)
 *       
 *       **Security:**
 *       - Password changes require current password validation
 *       - Email changes may require verification (future enhancement)
 *       - Role changes restricted to admins
 *       
 *       **Use Cases:**
 *       - User updating their profile
 *       - Admin modifying user accounts
 *       - Changing user roles
 *       - Suspending user accounts
 *       
 *       **Related Endpoints:**
 *       - GET /api/users/{id} - View user profile
 *       - GET /api/auth/me - Get current user
 *       - DELETE /api/users/{id} - Delete user
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID to update
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               birthday:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 description: Admin only
 *               status:
 *                 type: string
 *                 enum: [active, suspended]
 *                 description: Admin only
 *           examples:
 *             updateProfile:
 *               summary: Update basic profile
 *               value:
 *                 name: John Updated Doe
 *                 phone: '+852 9999 8888'
 *             changePassword:
 *               summary: Change password
 *               value:
 *                 password: NewSecurePass789!
 *             adminUpdateRole:
 *               summary: Admin changing user role
 *               value:
 *                 role: admin
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntity'
 */
router.put(
  "/:id",
  isAuthenticated,
  isOwnerOrAdminByParam,
  updateUserValidator,
  validate,
  userController.updateUser
);

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete user account (Admin only)
 *     description: |
 *       Permanently deletes a user account and all associated data. This action cannot be undone.
 *       
 *       **Admin Only:**
 *       - Requires authentication with admin role
 *       - Regular users cannot delete other users
 *       - Use POST /api/users/me/delete for self-deletion
 *       
 *       **Cascade Behavior:**
 *       - User's bookings are marked as cancelled
 *       - User's session is destroyed
 *       - User's profile data is permanently removed
 *       - Cannot be undone
 *       
 *       **Safety:**
 *       - Consider implementing soft delete for data recovery
 *       - Admins cannot delete themselves via this endpoint
 *       - Confirmation recommended in UI
 *       
 *       **Use Cases:**
 *       - Admin removing user accounts
 *       - Compliance with data deletion requests
 *       - Removing spam or abusive accounts
 *       - System cleanup
 *       
 *       **Related Endpoints:**
 *       - POST /api/users/me/delete - Self-deletion
 *       - PUT /api/users/{id} - Update user (consider suspending instead)
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID to delete
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: User deleted successfully
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
 *                   example: User deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete(
  "/:id",
  isAuthenticated,
  isAdmin,
  deleteUserValidator,
  validate,
  userController.deleteUser
);

/**
 * @openapi
 * /api/users/me/delete:
 *   post:
 *     tags: [Users]
 *     summary: Delete own account (self-deletion)
 *     description: |
 *       Allows authenticated users to delete their own account. This action cannot be undone.
 *       
 *       **Self-Deletion:**
 *       - Any authenticated user can delete their own account
 *       - Requires password confirmation for security
 *       - Session is destroyed after deletion
 *       - Cannot be undone
 *       
 *       **Cascade Behavior:**
 *       - User's bookings are marked as cancelled
 *       - User's session is destroyed
 *       - User's profile data is permanently removed
 *       - User is logged out automatically
 *       
 *       **Security:**
 *       - Requires current password confirmation
 *       - Prevents accidental deletion
 *       - Session is immediately invalidated
 *       
 *       **Use Cases:**
 *       - User closing their account
 *       - GDPR right to be forgotten
 *       - Account cleanup
 *       
 *       **Related Endpoints:**
 *       - DELETE /api/users/{id} - Admin deletion
 *       - POST /api/auth/logout - Logout without deletion
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password:
 *                 type: string
 *                 description: Current password for confirmation
 *           examples:
 *             confirmDeletion:
 *               summary: Confirm account deletion
 *               value:
 *                 password: MyCurrentPassword123!
 *     responses:
 *       200:
 *         description: Account deleted successfully
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
 *                   example: Account deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       422:
 *         description: Invalid password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError422'
 */
router.post(
  "/me/delete",
  isAuthenticated,
  selfDeleteValidator,
  validate,
  userController.deleteSelf
);

/**
 * @openapi
 * /api/users/{id}/bookings:
 *   get:
 *     tags: [Users]
 *     summary: Get user's booking history
 *     description: |
 *       Retrieves all bookings made by a specific user. Users can view their own bookings, and admins can view any user's bookings.
 *       
 *       **Authorization:**
 *       - Users can view their own bookings
 *       - Admins can view any user's bookings
 *       - Other users cannot view bookings they don't own
 *       
 *       **Returned Data:**
 *       - All bookings (past and future)
 *       - Booking status (confirmed, pending, cancelled)
 *       - Performance details
 *       - Seat information
 *       - Payment status
 *       
 *       **Use Cases:**
 *       - User viewing their booking history
 *       - Admin reviewing user's bookings
 *       - Generating booking reports
 *       - Customer support inquiries
 *       
 *       **Related Endpoints:**
 *       - GET /api/bookings - List all bookings (admin)
 *       - GET /api/bookings/{id} - Get specific booking
 *       - POST /api/bookings - Create new booking
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: User bookings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 *             examples:
 *               withBookings:
 *                 summary: User with bookings
 *                 value:
 *                   success: true
 *                   data:
 *                     - id: 990e8400-e29b-41d4-a716-446655440005
 *                       bookingReference: BK-2024-001234
 *                       performanceId: 770e8400-e29b-41d4-a716-446655440002
 *                       status: confirmed
 *                       totalAmount: 1200.00
 *                     - id: 990e8400-e29b-41d4-a716-446655440006
 *                       bookingReference: BK-2024-001235
 *                       performanceId: 770e8400-e29b-41d4-a716-446655440004
 *                       status: pending
 *                       totalAmount: 2000.00
 *               noBookings:
 *                 summary: User with no bookings
 *                 value:
 *                   success: true
 *                   data: []
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  "/:id/bookings",
  isAuthenticated,
  getUserValidator,
  validate,
  userController.getUserBookings
);

export default router;
