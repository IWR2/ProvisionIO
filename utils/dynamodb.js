// dynamodb.js

/**
 * @file DynamoDB client configuration for the ProvisionIO API.
 *
 * This module sets up the DynamoDB client for local development using DynamoDB Local.
 * Configuration comes from environment variables (.env file).
 *
 * For local development: Uses endpoint http://localhost:8000 with dummy credentials.
 */

import "dotenv/config";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

/**
 * DynamoDB client instance.
 *
 * Configuration comes from environment variables (.env file).
 *
 * For local development: Uses endpoint http://localhost:8000 with dummy credentials.
 *
 * @type {DynamoDBClient}
 */
const client = new DynamoDBClient({
  endpoint: process.env.DYNAMODB_ENDPOINT,
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * DynamoDB Document Client - Wrapper for easier data operations.
 *
 * Automatically converts between plain JavaScript objects and DynamoDB's
 * native attribute value format.
 *
 * @type {DynamoDBDocumentClient}
 */
export const docClient = DynamoDBDocumentClient.from(client);

/**
 * DynamoDB table name for the ProvisionIO application.
 *
 * Single-table design storing:
 * - User profiles (PK: USER#{userId}, SK: PROFILE)
 * - Clients (PK: USER#{userId}, SK: CLIENT#{clientId})
 * - Services (embedded inside clients.services array)
 *
 * @const {string}
 */
export const TABLE_NAME = "ProvisionIO";

/**
 * DynamoDB client for admin operations.
 *
 * Used for CreateTableCommand and DeleteTableCommand.
 *
 * @export
 * @type {DynamoDBClient}
 */
export { client };
