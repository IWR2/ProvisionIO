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
import pkg from "express-openid-connect";
// import adminRoutes from "./routes/adminRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import usersRoutes from "./routes/usersRoutes.js";
import clientsRoutes from "./routes/clientRoutes.js";
import { checkJwt, claimIncludes } from "./services/auth.js";

const { auth: webAuth, requiresAuth } = pkg;
const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

/**
 * Auth0 Web Login Configuration
 * Provides the credentials and settings required to
 * communicate securely with the Auth0 identity platform.
 * - authRequired: Controls if visitors must log in to view the site.
 * - auth0Logout: Syncs your local app logout with the global Auth0 session.
 * - secret: A private key used to keep user sessions secure and encrypted.
 * - clientID/Secret: Unique identifiers that prove your app's identity to Auth0.
 * - authorizationParams: Defines what user data we need and which API
 * resources we are authorized to access (the 'audience' and 'scope').
 *
 * @type {Object}
 */
const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.WEB_SECRET, // Session encryption (Generated)
  clientSecret: process.env.WEB_CLIENT_SECRET, // Auth0 app credential (From login)
  baseURL: process.env.WEB_BASE_URL, // The public URL where your app is hosted
  clientID: process.env.WEB_CLIENT_ID, // The unique public identifier for your app
  issuerBaseURL: process.env.ISSUER_BASE_URL, // The Auth0 domain that verifies tokens
  authorizationParams: {
    response_type: "code",
    audience: process.env.AUTH0_AUDIENCE,
    // Permissions and identity data requested from the user
    scope:
      "openid profile email admin:access admin:table_create admin:table_delete",
  },
};

// Apply web auth middleware (adds /login, /logout, /callback routes)
app.use(webAuth(config));
app.use(express.json());

/**
 * Landing page for the ProvisionIO API.
 *
 * This route displays different content based on whether the user is
 * authenticated with Auth0. If authenticated: Shows a welcome message,
 * user metadata, and a link to the profile page where the user can copy
 * their JWT for API testing. If not authenticated: Shows API description
 * and a login link that redirects to Auth0's Universal Login page.
 *
 * The isAuthenticated variable is passed to the template to control the
 * display of navigation links (Profile/Logout) in the nav partial.
 *
 * @returns {void} Renders the home.ejs view with user data
 * @example
 * // User is not logged in
 * // GET / Renders home.ejs showing API info and "Login with Auth0" button
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

/**
 * Debug endpoint to verify JWT claims and permission scopes.
 * This route validates both the authentication status and the presence of
 * required administrative permissions.
 * * @param {String} req.headers.authorization - Bearer token (JWT from Auth0).
 * @returns {Object} JSON containing the user's granted scopes and the
 * complete decoded JWT payload.
 * @returns {Number} 200 - Success, token is valid and all permissions present.
 * @returns {Number} 403 - Forbidden, user lacks one or more required permissions.
 * @returns {Number} 401 - Unauthorized, invalid or missing token.
 */
app.get(
  "/debug-scopes",
  checkJwt,
  claimIncludes("permissions", "admin:access"),
  claimIncludes("permissions", "admin:table_create"),
  claimIncludes("permissions", "admin:table_delete"),
  (req, res) => {
    res.json({
      scopes: req.auth.payload.scope,
      fullPayload: req.auth.payload,
    });
  },
);

/**
 * Table creation and deletion.
 */
//app.use(
//  "/init",
//  checkJwt,
//  claimIncludes("permissions", "admin:access"),
//  claimIncludes("permissions", "admin:table_create"),
//  claimIncludes("permissions", "admin:table_delete"),
//  adminRoutes,
//);

/**
 * Retrieves all registered users.
 */
app.use(
  "/users",
  checkJwt,
  claimIncludes("permissions", "admin:access"),
  usersRoutes,
);

app.use("/clients", checkJwt, clientsRoutes);

app.use("/services", serviceRoutes);

/**
 * Global error handling middleware.
 * * Intercepts errors thrown during the request lifecycle.
 * - 403 Forbidden: Returned when a user is authenticated but lacks the
 * required permissions (RBAC) or specific custom claims.
 * - 401 Unauthorized: Returned when authentication fails (invalid/expired
 * tokens, or missing credentials).
 * - 500 Internal Server Error: Catch-all for unexpected application failures.
 *
 * @param {Error} err - The error object thrown by middleware or routes.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Object} next - The next middleware function.
 * @returns {void} Sends a structured JSON error response.
 */
app.use((err, req, res, next) => {
  // Handle Custom Permission Failures (from claimIncludes)
  // 403: User does not have access to this
  if (
    err.name === "ForbiddenError" ||
    (err.message && err.message.includes("does not include"))
  ) {
    return res.status(403).json({
      Error: "Admin access required",
      Message: "You do not have the necessary permissions.",
      Required: err.message,
    });
  }

  // 401: User is not authorized for this route
  if (err.name === "UnauthorizedError" || err.name === "InvalidTokenError") {
    return res.status(401).json({
      Error: "Unauthorized",
      Message: "Authentication failed. Please provide a valid token.",
    });
  }

  // 500: Internal Server Error
  console.error("Global Error Handler:", err);
  res.status(500).json({
    Error: "Internal Server Error",
    Message: "An unexpected error occurred.",
  });
});

app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}. Press CTRL+C to end the server.`,
  );
});

// to run: npm run dev
