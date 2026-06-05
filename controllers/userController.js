// controllers/userController.js

import { ManagementClient } from "auth0";

/**
 * Auth0 Management API Client (M2M)
 *
 * Initialized with Machine-to-Machine credentials to call the Auth0
 * Management API for user listing operations.
 *
 * Required scopes: read:users
 */
const management = new ManagementClient({
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_M2M_CLIENT_ID,
  clientSecret: process.env.AUTH0_M2M_CLIENT_SECRET,
});

/**
 * GET /users Retrieves all registered users (Admin only).
 *
 * This controller function:
 * 1. Validates Accept header (must be application/json) 406
 * 2. Checks admin permission (read:users) 403
 * 3. Fetches all users from Auth0 Management API
 * 4. Formats and returns the user list
 *
 * The requesting user's JWT must contain the read:users permission.
 * @returns {Promise<void>} JSON response with user list or error
 *
 * @throws {Error} If Auth0 Management API call fails
 *
 * @returns {Number} 200 - Success, returns user list
 * @returns {Number} 406 - Accept header is not application/json
 * @returns {Number} 403 - Authenticated user lacks admin permission
 * @returns {Number} 500 - Internal server error (Auth0 API failure)
 *
 * @example
 * // Request (with admin JWT)
 * GET /users
 * Headers: Authorization: Bearer <admin_jwt>
 * Headers: Accept: application/json
 *
 * // Response (200 OK)
 * {
 *   "results": [
 *     { "id": "auth0|123456", "subject": "auth0|123456" },
 *     { "id": "auth0|789012", "subject": "auth0|789012" }
 *   ]
 * }
 *
 * // Response (403 Forbidden)
 * { "Error": "Admin access required" }
 *
 * // Response (406 Not Acceptable)
 * { "Error": "Client must accept application/json" }
 */
export const getAllUsers = async (req, res) => {
  // 406 Check Accept header
  const accepts = req.accepts(["application/json"]);
  if (!accepts) {
    return res
      .status(406)
      .json({ Error: "Client must accept application/json" });
  }

  // Check admin permission
  const permissions = req.auth.payload?.permissions || [];
  if (!permissions.includes("read:users")) {
    return res.status(403).json({ Error: "Admin access required" });
  }

  try {
    // Fetch users from Auth0 Management API
    const response = await management.users.list();

    // response.data contains the array of users
    const users = response.data;

    const results = users.map((user) => ({
      id: user.user_id,
    }));

    res.status(200).json({ results });
  } catch (error) {
    console.error("Error fetching users from Auth0:", error);
    res.status(500).json({ Error: "Internal server error" });
  }
};
