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
import { auth } from "express-oauth2-jwt-bearer";

import {
  CreateTableCommand,
  DeleteTableCommand,
} from "@aws-sdk/client-dynamodb";

import { client, TABLE_NAME } from "./utils/dynamodb.js";

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Validates JWT tokens from Auth0 for protected endpoints.
 * Checks signature, audience, issuer, and expiration.
 *
 * After validation, `req.auth.payload` contains the decoded token.
 */
const jwtCheck = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
  tokenSigningAlg: "RS256",
});

/**
 * Health check endpoint to verify API is running.
 * @returns {String} "Hello World!"
 */
app.get("/", (req, res) => {
  res.send("Hello World!");
});

/**
 * Test protected endpoint to verify JWT authentication is working.
 * TODO: Remove this after real endpoints are built.
 * @param {String} req.headers.authorization - Bearer token (JWT from Auth0)
 * @returns {Object} JSON with success message and authenticated user ID.
 * @returns {Number} 200 - Success, token is valid.
 * @returns {Number} 401 - Invalid or missing token.
 */
app.get("/protected", jwtCheck, (req, res) => {
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
