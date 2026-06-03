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
 * We use 'pkg' and 'pkg2' aliases because these Auth0 libraries are
 * CommonJS modules. Using an alias allows us to import the default
 * export and then destructure the specific methods (like 'auth') we need.
 */
import pkg from "express-openid-connect";
const { auth: webAuth, requiresAuth } = pkg;
import pkg2 from "express-oauth2-jwt-bearer";
const { auth: jwtAuth } = pkg2;

import {
  CreateTableCommand,
  DeleteTableCommand,
} from "@aws-sdk/client-dynamodb";

import { client, TABLE_NAME } from "./utils/dynamodb.js";

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

/**
 * JWT Validation Middleware
 *
 * This middleware validates access tokens for protected API endpoints.
 * It checks the token's signature, audience (aud), issuer (iss), and expiration.
 *
 * The token must be an access_token with the correct audience matching
 * AUTH0_AUDIENCE. This is the token displayed on "/profile"
 * after the user logs in.
 *
 * After validation, the decoded token payload is available at "req.auth.payload".
 */
const checkJwt = jwtAuth({
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
  audience: process.env.AUTH0_AUDIENCE,
  tokenSigningAlg: "RS256",
});

/**
 * Landing page for the ProvisionIO API.
 *
 * This route displays different content based on whether the user is
 * authenticated with Auth0.
 *
 * - If authenticated: Shows a welcome message, a link to the profile page
 *   (where the user can copy their JWT for API testing), and a logout link.
 * - If not authenticated: Shows a login link that redirects to Auth0's
 *   Universal Login page.
 *
 * The user's name or email is displayed as a personal greeting.
 *
 * @example
 * // User is not logged in
 * // Response: HTML page with "Login with Auth0" link
 *
 * // User is logged in
 * // Response: HTML page with welcome message, profile link, and logout link
 */
app.get("/", (req, res) => {
  const isAuthenticated = req.oidc.isAuthenticated();

  if (isAuthenticated) {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>ProvisionIO</title>
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body>
        <h1>Welcome, ${req.oidc.user.name || req.oidc.user.email}!</h1>
        <p><a href="/profile">Get your JWT for Postman</a></p>
        <p><a href="/logout">Logout</a></p>
      </body>
      </html>
    `);
  } else {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>ProvisionIO</title>
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body>
        <h1>ProvisionIO API</h1>
        <p><a href="/login">Login with Auth0</a></p>
      </body>
      </html>
    `);
  }
});

/**
 * Displays the user's Auth0 access token for API testing.
 *
 * This route is protected by requiresAuth(), meaning the user must be
 * logged in via Auth0 to access it. It retrieves the user's access token
 * (req.oidc.accessToken?.access_token) and renders the profile.ejs view.
 *
 * The access token displayed on this page is a valid JWT that can be copied
 * and used as a Bearer token in Postman to test protected API endpoints
 * (/protected endpoint).
 *
 * @returns {void} Renders the `profile.ejs` view with user data and access token
 *
 * @example
 * // User is logged in via Auth0
 * // Response: Rendered HTML page displaying:
 * // - User ID (sub)
 * // - User email
 * // - Access token (JWT) with a "Copy JWT" button
 */
app.get("/profile", requiresAuth(), (req, res) => {
  const accessToken = req.oidc.accessToken?.access_token;
  console.log("Access Token for API:", accessToken);
  console.log("User from oidc:", req.oidc.user); // ← ADD THIS DEBUG
  res.render("profile", {
    title: "Your JWT Token",
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

/**
 * Creates the DynamoDB table for the application.
 * Should be called ONCE before using any other endpoints.
 *
 * Table uses single-table design with PK (Partition Key) and SK (Sort Key).
 *
 * @returns {Object} JSON message indicating table creation status.
 * @returns {Number} 200 - Table created successfully or already exists.
 * @returns {Number} 400 - Invalid table configuration (wrong key schema).
 * @returns {Number} 500 - Unexpected server error.
 */
app.post("/init", async (req, res) => {
  try {
    const command = new CreateTableCommand({
      TableName: TABLE_NAME,
      AttributeDefinitions: [
        { AttributeName: "PK", AttributeType: "S" }, // Partition Key
        { AttributeName: "SK", AttributeType: "S" }, // Sort Key
      ],
      KeySchema: [
        { AttributeName: "PK", KeyType: "HASH" },
        { AttributeName: "SK", KeyType: "RANGE" },
      ],
      BillingMode: "PAY_PER_REQUEST",
    });
    // Send the command to DynamoDB create the table
    await client.send(command);
    console.log(`Table ${TABLE_NAME} created successfully`);
    res.json({ message: `${TABLE_NAME} created successfully` });
  } catch (error) {
    // Handle table already exists
    if (error.name === "ResourceInUseException") {
      console.log(`Table ${TABLE_NAME} already exists`);
      res.json({ message: `${TABLE_NAME} already exists` });
      // Handle validation errors (e.g., schema mismatch, missing required parameters)
    } else if (error.name === "ValidationException") {
      console.error(`Validation error: ${error.message}`);
      res.status(400).json({
        error:
          "Invalid table configuration. Check AttributeDefinitions and KeySchema.",
        details: error.message,
      });
      // Handle any other unexpected errors
    } else {
      console.error(`Unexpected error: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * Permanently deletes the DynamoDB table and ALL its data.
 * Use with caution. This action cannot be undone.
 *
 * @returns {Object} JSON message indicating deletion status.
 * @returns {Number} 200 - Table deleted successfully.
 * @returns {Number} 404 - Table does not exist.
 * @returns {Number} 500 - Unexpected server error.
 */
app.delete("/init", async (req, res) => {
  try {
    const command = new DeleteTableCommand({
      TableName: TABLE_NAME,
    });
    await client.send(command);
    console.log(`Table ${TABLE_NAME} deleted successfully`);
    res.json({ message: `${TABLE_NAME} deleted successfully` });
  } catch (error) {
    if (error.name === "ResourceNotFoundException") {
      console.log(`Table ${TABLE_NAME} does not exist`);
      res.status(404).json({ message: "Table does not exist" });
    } else {
      console.error(error);
      console.error(`Error deleting table: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * TODO: GET /users
 * Retrieves all registered users.
 */

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
