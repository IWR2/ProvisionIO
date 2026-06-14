// controllers/serviceController.js

/**
 * Service Controller - Handles service create, read, update, and
 * delete operations.
 *
 * Services are public catalog items (cloud infrastructure products).
 * No JWT authentication required (public endpoints).
 *
 * @module controllers/serviceController
 */

import { randomUUID } from "crypto";
import {
  postService,
  getService,
  getServices,
  patchService,
  deleteService,
} from "../models/serviceAws.js";

/**
 * POST /services - Creates a new service and updates global service count.
 * No JWT authentication required.
 *
 * @source: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/getting-started-step-2.html
 * https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_TransactWriteItems.html
 * @returns {Object} 201 Created with service data and self link
 * @returns {Object} 400 Bad Request for missing required attributes or extra/unsupported fields
 * @returns {Object} 406 Not Acceptable if the client does not accept application/json
 * @returns {Object} 415 Unsupported Media Type if the request content-type is not application/json
 * @returns {Object} 500 Internal Server Error for database or system failures
 */
export const createService = async (req, res) => {
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
  const { name, type, price } = req.body;

  // 400: Check required attributes
  const allowed = ["name", "type", "price"];
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

  // 400: Check price is a non-negative number
  if (typeof price !== "number" || price < 0) {
    return res.status(400).json({
      Error: "The price attribute must be a non-negative number",
    });
  }

  try {
    // Generate unique ID and timestamp for the new service
    const serviceId = randomUUID();
    const now = new Date().toISOString();

    // Create DynamoDB item with a unique ID and category label
    // EntityId: SERVICE#{id}, EntityType: SERVICE
    const service = {
      EntityId: `SERVICE#${serviceId}`,
      EntityType: "SERVICE",
      name,
      type,
      price,
      createdAt: now,
      updatedAt: now,
    };

    // Write the service to DynamoDB table
    // Use a TransactWriteCommand for two actions
    // (create service + update count)
    await postService(service);

    // Return 201 Created with the new service data and self link
    res.status(201).json({
      id: serviceId,
      name,
      type,
      price,
      client: null,
      self: `${req.protocol}://${req.get("host")}/services/${serviceId}`,
    });
  } catch (error) {
    // 500: Unexpected errors ( connectivity, DynamoDB service issues)
    console.error("Error creating service:", error);
    res.status(500).json({ Error: "Internal server error" });
  }
};

/**
 * GET /services/:id - Retrieves a single service by ID.
 * No JWT authentication required.
 *
 * @source: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/getting-started-step-3.html
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON representation of the service
 * @returns {Number} 200 - Success
 * @returns {Number} 404 - Service not found
 * @returns {Number} 406 - Accept header not application/json
 * @returns {Number} 500 - Internal server error
 */
export const fetchServiceById = async (req, res) => {
  // 406: Check Accept header
  const accepts = req.accepts(["application/json"]);
  if (!accepts) {
    return res
      .status(406)
      .json({ Error: "Client must accept application/json" });
  }

  // Get the ID from the URL path (/services/123)
  const serviceId = req.params.id;

  try {
    // Look for a service that matches the serviceId
    const result = await getService(serviceId);

    // 404: Cannot find service
    if (!result.Item) {
      return res
        .status(404)
        .json({ Error: "No service with this service_id exists" });
    }

    const service = result.Item;

    // Return 200 found service
    // Strips the "SERVICE#" prefix to return just the ID
    const extractedServiceId = service.EntityId.replace("SERVICE#", "");
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    res.status(200).json({
      id: extractedServiceId,
      name: service.name,
      type: service.type,
      price: service.price,
      // If service.clientId is undefined or null, this returns null
      client: service.clientId || null,
      // Reconstructs the URL to point back to this specific resource
      self: `${baseUrl}/services/${extractedServiceId}`,
    });
  } catch (error) {
    // 500: Unexpected errors ( connectivity, DynamoDB service issues)
    console.error("Error fetching service:", error);
    res.status(500).json({ Error: "Internal server error" });
  }
};

/**
 * GET /services
 * Fetches a list of cloud services. It fetches the total number of
 * services from a "Stats" record. Then it grabs a "page" of 10 services
 * at a time to keep the app fast. If there are more services, it
 * provides a "next" link (a cursor) to fetch the next page.
 * @returns {Object} JSON: A list of services, the total count,
 * and a "next" link if more pages are available.
 */
export const getPaginatedServices = async (req, res) => {
  // 406: Check Accept header
  const accepts = req.accepts(["application/json"]);
  if (!accepts) {
    return res
      .status(406)
      .json({ Error: "Client must accept application/json" });
  }

  // Define pagination settings: how many items per "page"
  const limit = 10;
  const cursor = req.query.cursor;
  const baseUrl = `${req.protocol}://${req.get("host")}`;

  try {
    // Run two database lookups at the same time:
    // Get the global count from METRICS (so the UI knows how many items exist)
    // Get the current page of services using our "Shortcut" Index (GSI)
    const [statsResult, serviceResult] = await getServices(limit, cursor);

    // Format services
    const services = serviceResult.Items.map((item) => {
      const extractedServiceId = item.EntityId.replace("SERVICE#", "");
      return {
        id: extractedServiceId,
        name: item.name,
        type: item.type,
        price: item.price,
        // If service's clientId is undefined or null, this returns null
        client: item.clientId || null,
        self: `${baseUrl}/services/${extractedServiceId}`,
      };
    });

    // Build response
    const response = {
      services,
      items: statsResult.Item ? statsResult.Item.count : 0, // Total count from Stats
    };

    // Add next link if more results exist
    // If DynamoDB gives us a "LastEvaluatedKey", it means there is more data
    // We package that key into a base64 "Next" link for the client
    if (serviceResult.LastEvaluatedKey) {
      const cursorBase64 = Buffer.from(
        JSON.stringify(serviceResult.LastEvaluatedKey),
      ).toString("base64");
      response.next = `${req.protocol}://${req.get("host")}/services?cursor=${cursorBase64}`;
    }

    res.status(200).json(response);
  } catch (error) {
    // 500: Unexpected errors ( connectivity, DynamoDB service issues)
    console.error("Error fetching services:", error);
    res.status(500).json({ Error: "Internal server error" });
  }
};

/**
 * PATCH /services/:id - Partially updates an existing service record.
 * @param {Object} req - Express request object containing 'id' in params and updates in 'body'
 * @returns {Object} 200 - Successful update with the modified service object.
 * @returns {Object} 400 - Bad Request: Unsupported attributes, empty body, or invalid data types.
 * @returns {Object} 403 - Forbidden: Attempts to modify immutable fields (id, clientId).
 * @returns {Object} 404 - Not Found: The specified service_id does not exist.
 * @returns {Object} 406 - Not Acceptable: Incorrect Accept header.
 * @returns {Object} 415 - Unsupported Media Type: Incorrect Content-Type header.
 * @returns {Object} 500 - Internal Server Error: Database failure or unexpected exception.
 */
export const updateService = async (req, res) => {
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

  const serviceId = req.params.id;
  const bodyKeys = Object.keys(req.body);
  const allowedUpdates = ["name", "type", "price"];

  // 403: Prevent modifying serviceId and clientId
  if (bodyKeys.includes("id")) {
    return res.status(403).json({ Error: "serviceId cannot be modified" });
  }

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

  // 400: Ensure the price is a valid number
  if (
    req.body.price !== undefined &&
    (typeof req.body.price !== "number" || req.body.price < 0)
  ) {
    return res
      .status(400)
      .json({ Error: "The price attribute must be a non-negative number" });
  }

  try {
    // Maps #placeholders to field names ("#fName" -> "name")
    const expressionAttributes = {};
    // Maps :placeholders to the new values (":name" -> "Chillflix")
    const expressionValues = {};

    // Set updatedAt timestamp so we know when the change happened
    let updateExpression = "SET updatedAt = :now";
    expressionValues[":now"] = new Date().toISOString();

    // Look at every key the user sent in their request body.
    bodyKeys.forEach((key) => {
      // Add a key from the request body
      // "SET updatedAt = :now, #fName = :Name, #fPrice = :Price"
      updateExpression += `, #f${key} = :${key}`;

      // Using a # prefix bypasses these DynamoDB's reserved word ("TYPE" or "DATE") restrictions
      expressionAttributes[`#f${key}`] = key;

      // ExpressionAttributeValues prevents NoSQL injection by binding
      // user data to placeholders (:) instead of pasting it directly
      expressionValues[`:${key}`] = req.body[key];
    });

    // Patch this service
    const updateResponse = await patchService(
      req.params.id,
      updateExpression,
      expressionAttributes,
      expressionValues,
    );

    // Access the attributes correctly
    const updated = updateResponse.Attributes;
    const extractedServiceId = updated.EntityId.replace("SERVICE#", "");

    // 200: Successful Patch Return the newly modified service
    res.status(200).json({
      id: extractedServiceId,
      name: updated.name,
      type: updated.type,
      price: updated.price,
      client: updated.clientId,
      self: `${req.protocol}://${req.get("host")}/services/${extractedServiceId}`,
    });
  } catch (error) {
    // 404: Condition check failed because the ResourceId does not exist
    if (error.name === "ConditionalCheckFailedException") {
      return res
        .status(404)
        .json({ Error: "No service with this service_id exists" });
    }

    // 400: Database rejected the update parameters (bad schema)
    if (error.name === "ValidationException") {
      return res
        .status(400)
        .json({ Error: "Invalid request parameters provided to database" });
    }

    // 500: Unexpected errors ( connectivity, DynamoDB service issues)
    console.error("CRITICAL DB ERROR:", error);
    res.status(500).json({ Error: "Internal server error" });
  }
};

/**
 * DELETE /services/:id - Deletes a service and updates global service count.
 * Uses a TransactWriteCommand to ensure the service is deleted and
 * the catalog count is decremented as an atomic unit.
 * @param {Object} req - Express request object containing 'id' in params
 * @param {Object} res - Express response object
 * @returns {Object} 204 - No Content (Success)
 * @returns {Object} 404 - Not Found: The service_id does not exist
 * @returns {Object} 406 - Not Acceptable: Incorrect Accept header
 * @returns {Object} 500 - Internal Server Error
 */
export const removeService = async (req, res) => {
  // 406: Check Accept header
  const accepts = req.accepts(["application/json"]);
  if (!accepts) {
    return res
      .status(406)
      .json({ Error: "Client must accept application/json" });
  }

  const serviceId = req.params.id;

  try {
    // Delete service and  decrement global service count
    await deleteService(serviceId);

    // 204: Success (No content returned)
    res.status(204).end();
  } catch (error) {
    // 404: Transaction cancelled because the service was not found
    // TransactWriteCommand cancels the transaction if any item condition fails
    if (error.name === "TransactionCanceledException") {
      return res
        .status(404)
        .json({ Error: "No service with this service_id exists" });
    }

    // 500: Unexpected errors (connectivity, DynamoDB service issues)
    console.error("CRITICAL DB ERROR:", error);
    res.status(500).json({ Error: "Internal server error" });
  }
};
