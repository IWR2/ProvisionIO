/**
 * Admin Controller - Handles administrative operations.
 *
 * These endpoints are for table management during development.
 * Not part of the regular REST API.
 *
 * @module controllers/adminController
 */

import {
  CreateTableCommand,
  DeleteTableCommand,
} from "@aws-sdk/client-dynamodb";
import { client, TABLE_NAME } from "../utils/dynamodb.js";

/**
 * POST /init - Creates the DynamoDB table and its index.
 * Should be called ONCE before using any other endpoints.
 * Includes two Global Secondary Indexes for optimized query patterns:
 * 1. TypeIndex: Used to find all items of a specific category (all SERVICES, all CLIENTS)
 * 2. OwnerIndex: Used to find all clients assigned to a specific user (all CLIENTS for one owner).
 *
 * Table uses single-table design with EntityId (Partition Key) and EntityType (Sort Key).
 * @source: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/getting-started-step-1.html
 * https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GSI.html#GSI.scenario
 * https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GSI.html#GSI.Projections
 * https://youtu.be/BkEu7zBWge8
 * @returns {Object} JSON message indicating table creation status.
 * @returns {Number} 200 - Table created successfully or already exists.
 * @returns {Number} 400 - Invalid table configuration (wrong key schema).
 * @returns {Number} 500 - Unexpected server error.
 */
export const createTable = async (req, res) => {
  try {
    // Create the table
    const command = new CreateTableCommand({
      TableName: TABLE_NAME,
      // Every item uses:
      // EntityId: The unique identifier ("SERVICE#123", "CLIENT#456", "USER#789")
      // EntityType: The category label ("SERVICE", "SERVICE_COUNT")
      // owner: The user that owns this client
      AttributeDefinitions: [
        { AttributeName: "EntityId", AttributeType: "S" },
        { AttributeName: "EntityType", AttributeType: "S" },
        { AttributeName: "owner", AttributeType: "S" },
      ],
      KeySchema: [
        { AttributeName: "EntityId", KeyType: "HASH" },
        { AttributeName: "EntityType", KeyType: "RANGE" },
      ],
      // Global Secondary Index (GSI):
      // By default, you can only find items if you know their exact Entity ID.
      // We create this index to "flip" the lookup: it acts like a library card catalog
      // where we look up files by their "Entity Type" ("SERVICE", 'CLIENT#456') first
      // This allows us to list all related items (like all services for a specific client)
      // without needing to know the individual ID of each service
      GlobalSecondaryIndexes: [
        // Used to query by type (services, clients)
        {
          IndexName: "TypeIndex",
          KeySchema: [
            { AttributeName: "EntityType", KeyType: "HASH" },
            { AttributeName: "EntityId", KeyType: "RANGE" },
          ],
          Projection: {
            ProjectionType: "ALL", // Ensures all data is available in the index
          },
        },
        // Used to query clients by user ownership
        {
          IndexName: "OwnerIndex",
          KeySchema: [
            { AttributeName: "owner", KeyType: "HASH" },
            { AttributeName: "EntityId", KeyType: "RANGE" },
          ],
          Projection: { ProjectionType: "ALL" },
        },
      ],
      BillingMode: "PAY_PER_REQUEST",
    });
    // Send the command to DynamoDB to create the table
    await client.send(command);
    console.log(`Table ${TABLE_NAME} created successfully with OwnerIndex`);
    res.json({ message: `${TABLE_NAME} created successfully` });
  } catch (error) {
    // Handle table already exists
    if (error.name === "ResourceInUseException") {
      console.log(`Table ${TABLE_NAME} already exists`);
      res.json({ message: `${TABLE_NAME} already exists` });
      // Handle validation errors (schema mismatch, missing required parameters)
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
};

/**
 * DELETE /init - Deletes the DynamoDB table and ALL its data.
 * Use with caution. This action cannot be undone.
 *
 * @returns {Object} JSON message indicating deletion status.
 * @returns {Number} 200 - Table deleted successfully.
 * @returns {Number} 404 - Table does not exist.
 * @returns {Number} 500 - Unexpected server error.
 */
export const deleteTable = async (req, res) => {
  try {
    // Delete the table
    const command = new DeleteTableCommand({ TableName: TABLE_NAME });
    // Send the command to DynamoDB to delete the table
    await client.send(command);
    console.log(`Table ${TABLE_NAME} deleted successfully`);
    res.json({ message: `${TABLE_NAME} deleted successfully` });
  } catch (error) {
    // Handle if the table does not exist
    if (error.name === "ResourceNotFoundException") {
      console.log(`Table ${TABLE_NAME} does not exist`);
      res.status(404).json({ message: "Table does not exist" });
      // Handle any other unexpected errors
    } else {
      console.error(error);
      console.error(`Error deleting table: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  }
};
