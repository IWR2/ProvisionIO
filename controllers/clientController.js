// clientController.js

/**
 * Clients Controller - Handles client create, read, update, and
 * delete operations.

 * JWT authentication required (private endpoints).
 *
 * @module controllers/clientController
 */

import { randomUUID } from "crypto";
import {
  postClient,
  getClient,
  getClients,
  putClient,
} from "../models/clientAws.js";

/**
 * POST /clients - Creates a new client record and stores it in DynamoDB.
 * Requires JWT authentication.
 *
 * @param {Object} req - Express request object containing the JWT payload and client data.
 * @param {Object} res - Express response object.
 * @returns {Object} 201 Created with the new client data and a self link
 * @returns {Object} 400 Bad Request for missing required attributes or extra/unsupported fields
 * @returns {Object} 406 Not Acceptable if the client does not accept application/json
 * @returns {Object} 415 Unsupported Media Type if the request content-type is not application/json
 * @returns {Object} 500 Internal Server Error for database or system failures
 */
export const createClient = async (req, res) => {
  // 415: Check Content-Type
  if (req.get("content-type") !== "application/json") {
    return res
      .status(415)
      .json({ Error: "Server only accepts application/json data" });
  }

  // 406: Check Accept header
  const accepts = req.accepts(["application/json"]);
  if (!accepts) {
    return res
      .status(406)
      .json({ Error: "Client must accept application/json" });
  }

  // Extract the data
  const { name, contact_manager, email } = req.body;

  // 400: Check required attributes
  const allowed = ["name", "contact_manager", "email"];
  const missing = allowed.filter((field) => req.body[field] === undefined);

  if (missing.length > 0) {
    return res.status(400).json({
      Error: `The request object is missing the following required attributes: ${missing.join(", ")}`,
    });
  }

  // 400: Check for unsupported attributes
  const extra = Object.keys(req.body).filter((key) => !allowed.includes(key));

  if (extra.length > 0) {
    return res.status(400).json({
      Error: `The request object includes unsupported attributes: ${extra.join(", ")}`,
    });
  }

  try {
    // Generate unique ID and timestamp for the new client
    const clientId = randomUUID();
    const userId = req.auth.payload.sub;
    const now = new Date().toISOString();

    // Create DynamoDB item with a unique ID and category label
    // EntityId: CLIENT#{id}, EntityType: CLIENT
    const client = {
      EntityId: `CLIENT#${clientId}`,
      EntityType: "CLIENT",
      owner: userId,
      name,
      contact_manager,
      email,
      services: [],
      createdAt: new Date().toISOString(),
    };

    // Write the client to DynamoDB table
    // Use a TransactWriteCommand for two actions
    // (create client + update count)
    await postClient(client);

    // Return 201 Created with the new client data and self link
    res.status(201).json({
      id: clientId,
      name: client.name,
      contact_manager: client.contact_manager,
      email: client.email,
      services: client.services,
      owner: client.owner,
      self: `${req.protocol}://${req.get("host")}/clients/${clientId}`,
    });
  } catch (error) {
    // 500: Unexpected errors ( connectivity, DynamoDB client issues)
    console.error("Error creating client:", error);
    res.status(500).json({ Error: "Internal server error" });
  }
};

/**
 * GET /clients/:id - Retrieves a single client by ID.
 * Requires JWT authentication.
 * Verifies that the authenticated user is the owner of the requested client.
 * Returns a 403 Forbidden error if the user attempts to access a resource they do not own.
 *
 * @param {Object} req - Express request object containing the client ID in params and user ID in auth.payload.
 * @param {Object} res - Express response object.
 * @returns {Object} 200 - Success with the client details and associated services
 * @returns {Object} 403 - Forbidden if the user is not the owner of the client
 * @returns {Object} 404 - Not Found if the specified client ID does not exist
 * @returns {Object} 406 - Not Acceptable if the client does not accept application/json
 * @returns {Object} 500 - Internal server error for database or system issues
 */
export const fetchClientById = async (req, res) => {
  // 406: Check Accept header
  const accepts = req.accepts(["application/json"]);
  if (!accepts) {
    return res
      .status(406)
      .json({ Error: "Client must accept application/json" });
  }

  // Get the ID from the URL path (/clients/123)
  const clientId = req.params.id;

  try {
    // Look for the client
    const result = await getClient(clientId);

    // 404: Cannot find client
    if (!result.Item) {
      return res
        .status(404)
        .json({ Error: "No client with this client_id exists" });
    }

    const client = result.Item;

    // Security check
    const userId = req.auth.payload.sub;
    if (userId !== client.owner) {
      return res.status(403).json({
        Error: "The user does not have access privileges to this client",
      });
    }

    // Strip prefix for clean ID
    const extractedClientId = client.EntityId.replace("CLIENT#", "");

    // Construct response
    res.status(200).json({
      id: extractedClientId,
      name: client.name,
      contact_manager: client.contact_manager,
      email: client.email,
      owner: client.owner,
      services: (client.services || []).map((serviceId) => ({
        id: serviceId,
        self: `${req.protocol}://${req.get("host")}/services/${serviceId}`,
      })),
      self: `${req.protocol}://${req.get("host")}${req.baseUrl}/${extractedClientId}`,
    });
  } catch (error) {
    // 500: Unexpected errors ( connectivity, DynamoDB service issues)
    console.error("Error fetching service:", error);
    res.status(500).json({ Error: "Internal server error" });
  }
};

/**
 * GET /clients
 * Fetches a paginated list of clients owned by the authenticated user.
 * * Retrieves the total count of clients for the user and a subset (limit 10)
 * of client records. Uses cursor-based pagination via the 'OwnerIndex' GSI
 * to ensure high performance and data isolation.
 * @param {Object} req - The Express request object.
 * @param {Object} req.auth.payload - The JWT claims, used to extract the 'sub' (userId).
 * @param {string} [req.query.cursor] - Base64 encoded 'LastEvaluatedKey' for pagination.
 * @param {Object} res - The Express response object.
 * @returns {Object} 200 - { clients: Array, items: Number, next?: String }
 * @returns {Object} 406 - Error: "Client must accept application/json"
 * @returns {Object} 500 - Error: "Internal server error"
 */
export const getPaginatedClients = async (req, res) => {
  // 406: Check Accept header
  const accepts = req.accepts(["application/json"]);
  if (!accepts) {
    return res
      .status(406)
      .json({ Error: "Client must accept application/json" });
  }

  // Get the user ID Bearer Token (JWT)
  const userId = req.auth.payload.sub;
  // Define pagination settings: how many items per "page"
  const limit = 10;
  const cursor = req.query.cursor;

  try {
    // Get the count of clients for this user and the info for each client
    const [statsResult, clientResult] = await getClients(userId, limit, cursor);
    // Format the clients
    const clients = clientResult.Items.map((item) => {
      const clientId = item.EntityId.replace("CLIENT#", "");
      return {
        id: clientId,
        name: item.name,
        contact_manager: item.contact_manager,
        email: item.email,
        owner: item.owner,
        services: item.services,
        self: `${req.protocol}://${req.get("host")}/clients/${clientId}`,
      };
    });

    const response = {
      clients,
      // Count of clients for this user
      items: statsResult.Item ? statsResult.Item.count : 0,
    };

    // Add next link if more results exist
    // If DynamoDB gives us a "LastEvaluatedKey", it means there is more data
    // We package that key into a base64 "Next" link for the client
    if (clientResult.LastEvaluatedKey) {
      const cursorBase64 = Buffer.from(
        JSON.stringify(clientResult.LastEvaluatedKey),
      ).toString("base64");
      response.next = `${req.protocol}://${req.get("host")}${req.baseUrl}?cursor=${cursorBase64}`;
    }

    res.status(200).json(response);
  } catch (error) {
    // 500: Unexpected errors ( connectivity, DynamoDB service issues)
    console.error("Error fetching services:", error);
    res.status(500).json({ Error: "Internal server error" });
  }
};

/**
 * PATCH /clients/:id - Partially updates an existing client record.
 * Requires JWT authentication. Verifies that the authenticated user is the owner of the client.
 * @param {Object} req - Express request object containing "id" in params and updates in "body"
 * @returns {Object} 200 - Successful update with the modified client object.
 * @returns {Object} 400 - Bad Request: Unsupported attributes, empty body, or invalid email format.
 * @returns {Object} 403 - Forbidden: Unauthorized access or attempt to modify immutable fields (clientId).
 * @returns {Object} 404 - Not Found: The specified client_id does not exist.
 * @returns {Object} 406 - Not Acceptable: Incorrect Accept header.
 * @returns {Object} 415 - Unsupported Media Type: Incorrect Content-Type header.
 * @returns {Object} 500 - Internal Server Error: Database failure or unexpected exception.
 */
export const updateClient = async (req, res) => {
  // 415: Check Content-Type
  if (req.get("content-type") !== "application/json") {
    return res
      .status(415)
      .json({ Error: "Server only accepts application/json data" });
  }

  // 406: Check Accept header
  const accepts = req.accepts(["application/json"]);
  if (!accepts) {
    return res
      .status(406)
      .json({ Error: "Client must accept application/json" });
  }

  const clientId = req.params.id;
  const bodyKeys = Object.keys(req.body);
  const allowedUpdates = ["name", "contact_manager", "email"];

  // 403: Prevent modifying clientId
  if (bodyKeys.includes("clientId")) {
    return res.status(403).json({ Error: "clientId cannot be modified" });
  }

  // 400: Check for unsupported attributes
  const unsupported = bodyKeys.filter((key) => !allowedUpdates.includes(key));
  if (unsupported.length > 0) {
    return res.status(400).json({
      Error: `The request object includes unsupported attributes: ${unsupported.join(", ")}`,
    });
  }

  // 400: Check for optional allowed attributes
  if (bodyKeys.length === 0) {
    return res.status(400).json({
      Error: `The request must include at least one valid attribute: ${allowedUpdates.join(", ")}`,
    });
  }

  // 400: Email format validation
  if (req.body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) {
    return res.status(400).json({ Error: "Invalid email format" });
  }

  try {
    // Check if this client exists and ownership check
    const result = await getClient(clientId);
    if (!result.Item) {
      return res
        .status(404)
        .json({ Error: "No client with this client_id exists" });
    }

    if (req.auth.payload.sub !== result.Item.owner) {
      return res.status(403).json({
        Error: "The user does not have access privileges to this client",
      });
    }

    // 3. Construct Update Expression
    // Maps #placeholders to field names ("#fName" -> "name")
    const expressionAttributes = {};
    // Maps :placeholders to the new values (":name" -> "Dott Toward")
    const expressionValues = {};
    let expressions = [];

    // Look at every key the user sent in their request body.
    bodyKeys.forEach((key) => {
      // Add a key from the request body
      // "SET updatedAt = :now, #fName = :Name, #fcontact_manager = :Contact_Manager"
      expressions.push(`#f${key} = :${key}`);
      // Using a # prefix bypasses these DynamoDB's reserved word ("TYPE" or "DATE") restrictions
      expressionAttributes[`#f${key}`] = key;
      expressionValues[`:${key}`] = req.body[key];
    });
    const updateExpression = "SET " + expressions.join(", ");

    // Patch this client
    const updateResponse = await putClient(
      clientId,
      updateExpression,
      expressionAttributes,
      expressionValues,
    );

    // Access the attributes
    const updated = updateResponse.Attributes;
    const extractedClientId = updated.EntityId.replace("CLIENT#", "");

    // 200: Successful Patch Return the modified client
    res.status(200).json({
      id: extractedClientId,
      name: updated.name,
      contact_manager: updated.contact_manager,
      email: updated.email,
      owner: updated.owner,
      services: updated.services || [],
      self: `${req.protocol}://${req.get("host")}${req.baseUrl}/${extractedClientId}`,
    });
  } catch (error) {
    // 404: Condition check failed because the ResourceId does not exist
    if (error.name === "ConditionalCheckFailedException") {
      return res
        .status(404)
        .json({ Error: "No client with this client_id exists" });
    }

    // 400: Database rejected the update parameters (bad schema)
    if (error.name === "ValidationException") {
      return res
        .status(400)
        .json({ Error: "Invalid request parameters provided to database" });
    }

    // 500: Unexpected errors (connectivity, DynamoDB service issues)
    console.error("CRITICAL DB ERROR:", error);
    res.status(500).json({ Error: "Internal server error" });
  }
};
