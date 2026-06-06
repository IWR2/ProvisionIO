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
 * POST /init - Creates the DynamoDB table.
 * Should be called ONCE before using any other endpoints.
 *
 * Table uses single-table design with PK (Partition Key) and SK (Sort Key).
 *
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
      AttributeDefinitions: [
        { AttributeName: "PK", AttributeType: "S" },
        { AttributeName: "SK", AttributeType: "S" },
      ],
      KeySchema: [
        { AttributeName: "PK", KeyType: "HASH" },
        { AttributeName: "SK", KeyType: "RANGE" },
      ],
      BillingMode: "PAY_PER_REQUEST",
    });
    // Send the command to DynamoDB to create the table
    await client.send(command);
    console.log(`Table ${TABLE_NAME} created successfully`);
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
