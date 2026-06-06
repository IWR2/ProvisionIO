// server.js

/**
 * ProvisionIO API Server
 *
 * A REST API for managing IaaS (Infrastructure as a Service) resources.
 * Built with Express.js, DynamoDB Local (for development), and Auth0 for authentication.
 *
 * Features:
 * - DynamoDB table creation/deletion (admin endpoints)
 * - JWT authentication via Auth0
 * - Protected endpoints that require valid tokens
 *
 * @module server
 */

import "dotenv/config";
import express from "express";
/** * Auth0 SDK Imports
 * We use "pkg" aliases because these Auth0 libraries are
 * CommonJS modules. Using an alias allows us to import the default
 * export and then destructure the specific methods (like "auth") we need.
 */
import pkg from "express-openid-connect";
import adminRoutes from "./routes/adminRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import usersRoutes from "./routes/usersRoutes.js";
import { checkJwt } from "./services/auth.js";

const { auth: webAuth, requiresAuth } = pkg;
const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// Auth0 Web Login Configuration (adds /login, /logout, /callback)

/**
 * Auth0 Web Login Configuration
 *
 * This configuration is used by the express-openid-connect middleware to
 * enable browser-based login via Auth0's Universal Login page.
 *
 * authorizationParams  allows the user to obtain a token
 * that can be used to call protected API endpoints.
 */
const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.WEB_SECRET, // ← Session encryption (you generate)
  clientSecret: process.env.WEB_CLIENT_SECRET, // ← Auth0 app credential (from dashboard)
  baseURL: process.env.WEB_BASE_URL,
  clientID: process.env.WEB_CLIENT_ID,
  issuerBaseURL: process.env.ISSUER_BASE_URL,
  authorizationParams: {
    response_type: "code", // ← This requests an access_token
    audience: process.env.AUTH0_AUDIENCE, // ← Required for access_token
    scope: "openid profile email",
  },
};

// Apply web auth middleware (adds /login, /logout, /callback routes)
app.use(webAuth(config));
app.use(express.json());

/**
 * Landing page for the ProvisionIO API.
 *
 * This route displays different content based on whether the user is
 * authenticated with Auth0.
 *
 * - If authenticated: Shows a welcome message, user metadata, and a link to
 *   the profile page where the user can copy their JWT for API testing.
 * - If not authenticated: Shows API description and a login link that
 *   redirects to Auth0's Universal Login page.
 *
 * The isAuthenticated variable is passed to the template to control the
 * display of navigation links (Profile/Logout) in the nav partial.
 *
 * @returns {void} Renders the home.ejs view with user data
 *
 * @example
 * // User is not logged in
 * // GET / Renders home.ejs showing API info and "Login with Auth0" button
 *
 * @example
 * // User is logged in
 * // GET / Renders home.ejs showing welcome message, user metadata, and
 * // "Get Your JWT Token" button
 */
app.get("/", (req, res) => {
  const isAuthenticated = req.oidc.isAuthenticated();

  res.render("home", {
    title: "ProvisionIO API",
    isAuthenticated: isAuthenticated,
    user: isAuthenticated ? req.oidc.user : null,
  });
});

/**
 * Displays the user's Auth0 access token for API testing.
 *
 * This route is protected by requiresAuth(), meaning the user must be
 * logged in via Auth0 to access it. It retrieves the user's access token
 * (req.oidc.accessToken?.access_token) and renders the profile.ejs view.
 *
 * The access token displayed on this page is a valid JWT that can be copied
 * and used as a Bearer token in Postman to test protected API endpoints.
 *
 * The isAuthenticated variable is passed to the template to control the
 * display of navigation links (Profile/Logout) in the nav partial.
 *
 * @returns {void} Renders the profile.ejs view with user data and access token
 *
 * @example
 * // User is logged in via Auth0
 * // GET /profile renders HTML page displaying:
 * // - User ID (sub)
 * // - User email
 * // - Access token (JWT) with a "Copy JWT" button
 */
app.get("/profile", requiresAuth(), (req, res) => {
  const accessToken = req.oidc.accessToken?.access_token;
  const isAuthenticated = true;

  res.render("profile", {
    title: "Your JWT Token",
    isAuthenticated: isAuthenticated,
    user: req.oidc.user,
    jwt: accessToken,
  });
});

/**
 * Test protected endpoint to verify JWT authentication is working.
 * TODO: Remove this after real endpoints are built.
 * @param {String} req.headers.authorization - Bearer token (JWT from Auth0)
 * @returns {Object} JSON with success message and authenticated user ID.
 * @returns {Number} 200 - Success, token is valid.
 * @returns {Number} 401 - Invalid or missing token.
 */
app.get("/protected", checkJwt, (req, res) => {
  res.json({
    message: "You accessed a protected endpoint!",
    user: req.auth.payload.sub,
  });
});

app.use("/", adminRoutes); // /init endpoints (admin)

/**
 * Retrieves all registered users.
 */
app.use("/users", usersRoutes);

/**
 * TODO: POST /clients
 * Creates a new client associated with the authenticated user.
 */

/**
 * TODO: GET /clients
 * Retrieves all clients owned by the authenticated user with pagination.
 */

/**
 * TODO: GET /clients/:id
 * Retrieves a single client by ID if owned by the authenticated user.
 */

/**
 * TODO: PUT /clients/:id
 * Replaces an existing client with all new attribute values.
 */

/**
 * TODO: PATCH /clients/:id
 * Updates one or more attributes of an existing client.
 */

/**
 * TODO: DELETE /clients/:id
 * Deletes an existing client and disassociates any services attached to it.
 */

/**
 * TODO: POST /services
 * Creates a new service (cloud infrastructure product).
 */
app.use("/services", serviceRoutes);

/**
 * TODO: GET /services
 * Retrieves all services (unprotected, shows all services).
 */

/**
 * TODO: GET /services/:id
 * Retrieves a single service by ID.
 */

/**
 * TODO: PUT /services/:id
 * Replaces an existing service with all new attribute values.
 */

/**
 * TODO: PATCH /services/:id
 * Updates one or more attributes of an existing service.
 */

/**
 * TODO: DELETE /services/:id
 * Deletes a service. Disassociates any client using this service.
 */

/**
 * TODO: PUT /clients/:clientId/services/:serviceId
 * Assigns a service to a client. Updates both the client's services array
 * and the service's client reference.
 */

/**
 * TODO: DELETE /clients/:clientId/services/:serviceId
 * Removes a service from a client. Updates both the client's services array
 * and the service's client reference (sets to null).
 */

app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}. Press CTRL+C to end the server.`,
  );
});

// to run: node server.js
