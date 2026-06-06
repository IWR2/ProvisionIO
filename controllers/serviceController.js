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
  PutCommand,
  GetCommand,
  QueryCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "../utils/dynamodb.js";

/**
 * POST /services - Creates a new service and updates global service count.
 * No JWT authentication required.
 *
 * @source: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/getting-started-step-2.html
 * https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_TransactWriteItems.html
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} 201 Created with service data and self link
 * @returns {Object} 400 Bad Request for missing/invalid attributes
 * @returns {Object} 406 Not Acceptable for wrong Accept header
 * @returns {Object} 415 Unsupported Media Type for wrong Content-Type
 * @returns {Object} 500 Internal Server Error
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
    // ResourceId: SERVICE#{id}, Category: METADATA for entity type
    const service = {
      ResourceId: `SERVICE#${serviceId}`,
      Category: "METADATA",
      name,
      type,
      price,
      clientId: null, // Starts as null, this will be linked to a client later
      createdAt: now,
      updatedAt: now,
    };

    // Write the service to DynamoDB table
    // Use a TransactWriteCommand for two actions
    // (create service + update count)
    await docClient.send(
      new TransactWriteCommand({
        TransactItems: [
          // Create the new service
          { Put: { TableName: TABLE_NAME, Item: service } },
          // Increment the stats counter
          // Instead of counting every service one by one, we keep a tally
          // record that lives at:
          // (ResourceId: "CATALOG", Category: "SERVICE_COUNT").
          {
            Update: {
              TableName: TABLE_NAME,
              // We target a stats record to keep our total count
              Key: { ResourceId: "CATALOG", Category: "SERVICE_COUNT" },
              // "ADD" tells DynamoDB to perform the math internally,
              // ensuring no data conflicts even if many services are created at once
              // So we add 1 to our count: "Add 1 to the count attribute"
              UpdateExpression: "ADD #c :inc",
              // We use '#c' as an alias for "count" to avoid issues with
              // DynamoDB's reserved system keywords
              ExpressionAttributeNames: { "#c": "count" },
              // We use "":inc" as a variable placeholder
              // to safely pass the number "1" into our expression.
              ExpressionAttributeValues: { ":inc": 1 },
            },
          },
        ],
      }),
    );

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
export const getAService = async (req, res) => {
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
    // Look for a service that matches:
    // ResourceId: The unique ID of the service (prefixed with "SERVICE#").
    // Category: The "METADATA" label assigned when the service was created
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          ResourceId: `SERVICE#${serviceId}`,
          Category: "METADATA",
        },
      }),
    );

    // 404: Cannot find service
    if (!result.Item) {
      return res
        .status(404)
        .json({ Error: "No service with this service_id exists" });
    }

    const service = result.Item;

    // Return 200 found service
    res.status(200).json({
      id: service.ResourceId.replace("SERVICE#", ""), // Strips the "SERVICE#" prefix to return just the ID
      name: service.name,
      type: service.type,
      price: service.price,
      client: service.clientId,
      // Reconstructs the URL to point back to this specific resource.
      self: `${req.protocol}://${req.get("host")}/services/${service.ResourceId.replace("SERVICE#", "")}`,
    });
  } catch (error) {
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
 *
 * @source:
 * https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/getting-started-step-5.html
 * https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.Pagination.html
 * @returns {Object} JSON: A list of services, the total count,
 * and a "next" link if more pages are available.
 */
export const getAllServices = async (req, res) => {
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

  try {
    // Run two database lookups at the same time:
    // Get the global count from the catalog (so the UI knows how many items exist)
    // Get the current page of services using our "Shortcut" Index (GSI)
    const [statsResult, serviceResult] = await Promise.all([
      docClient.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: { ResourceId: "CATALOG", Category: "SERVICE_COUNT" },
        }),
      ),
      docClient.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: "ServicesByCategoryIndex", // Requires a GSI where SK is Partition Key
          KeyConditionExpression: "Category = :cat",
          ExpressionAttributeValues: { ":cat": "METADATA" },
          Limit: limit,
          // If a "cursor" was provided, convert it back from base64 so
          // DynamoDB knows where to pick up from
          ExclusiveStartKey: cursor
            ? JSON.parse(Buffer.from(cursor, "base64").toString())
            : undefined,
        }),
      ),
    ]);

    // Format services
    const services = serviceResult.Items.map((item) => ({
      id: item.ResourceId.replace("SERVICE#", ""),
      name: item.name,
      type: item.type,
      price: item.price,
      client: item.clientId,
      self: `${req.protocol}://${req.get("host")}/services/${item.ResourceId.replace("SERVICE#", "")}`,
    }));

    // Build response
    const response = {
      services,
      items: statsResult.Item ? statsResult.Item.count : 0, // Total count from Stats
    };

    // Add next link if more results exist
    // If DynamoDB gives us a "LastEvaluatedKey", it means there is more data
    // We package that key into a base64 "Next" link for the client.
    if (serviceResult.LastEvaluatedKey) {
      const cursorBase64 = Buffer.from(
        JSON.stringify(serviceResult.LastEvaluatedKey),
      ).toString("base64");
      response.next = `${req.protocol}://${req.get("host")}/services?cursor=${cursorBase64}`;
    }

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({ Error: "Internal server error" });
  }
};
