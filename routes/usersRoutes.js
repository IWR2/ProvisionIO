// routes/usersRoutes.js

/**
 * Handles all /users endpoint operations.
 *
 * This module defines the routes for user management.
 * Currently only GET /users is supported (admin only).
 * All other HTTP methods return 405 Method Not Allowed.
 *
 * @module routes/usersRoutes
 */

import express from "express";
import { getAllUsers } from "../controllers/userController.js";
import { checkJwt } from "../services/auth.js";

const router = express.Router();

/**
 * GET /users retrieves all registered users (Admin only).
 *
 * This endpoint is protected by two middleware layers:
 * 1. checkJwt - Validates the JWT access token
 * 2. getAllUsers - Fetches user list from Auth0 Management API
 *
 * The requesting user must have the read:users permission.
 *
 * @returns {Object} JSON object with results array containing user objects
 * @returns {Number} 200 - Success, returns list of users
 * @returns {Number} 401 - Invalid or missing JWT token
 * @returns {Number} 403 - Authenticated user lacks admin permission
 * @returns {Number} 406 - Accept header is not application/json
 * @returns {Number} 500 - Internal server error
 *
 * @example
 * // Request
 * GET /users
 * Headers: Authorization: Bearer <admin_jwt>
 * Headers: Accept: application/json
 *
 * // Response (200 OK)
 * {
 *   "results": [
 *     { "id": "auth0|123", "subject": "auth0|123" },
 *     { "id": "auth0|456", "subject": "auth0|456" }
 *   ]
 * }
 */
router.get("/", checkJwt, getAllUsers);

/**
 * POST /users Method not allowed.
 *
 * @name POST /users
 * @returns {Number} 405 - Method Not Allowed
 */
router.post("/", (req, res) => {
  res.set("Accept", "POST");
  res.status(405).json({ Error: "Method not allowed" });
});

/**
 * DELETE /users Method not allowed.
 *
 * @name DELETE /users
 * @returns {Number} 405 - Method Not Allowed
 */
router.delete("/", (req, res) => {
  res.set("Accept", "DELETE");
  res.status(405).json({ Error: "Method not allowed" });
});

/**
 * PUT /users Method not allowed.
 *
 * @name PUT /users
 * @returns {Number} 405 - Method Not Allowed
 */
router.put("/", (req, res) => {
  res.set("Accept", "PUT");
  res.status(405).json({ Error: "Method not allowed" });
});

/**
 * PATCH /users Method not allowed.
 *
 * @name PATCH /users
 * @returns {Number} 405 - Method Not Allowed
 */
router.patch("/", (req, res) => {
  res.set("Accept", "PATCH");
  res.status(405).json({ Error: "Method not allowed" });
});

export default router;
