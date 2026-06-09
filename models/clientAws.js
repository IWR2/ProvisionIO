import {
  PutCommand,
  TransactWriteCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "../utils/dynamodb.js";

/**
 * Creates a new client and increments the global count.
 * @param {Object} service - The complete client item to be saved.
 * @returns {Promise<Object>} - The response object from DynamoDB containing the transaction outcome.
 * @source: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/getting-started-step-2.html
 * https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_TransactWriteItems.html
 * https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.UpdateExpressions.html#Expressions.UpdateExpressions.ADD
 */
export const postClient = async (client) => {
  await docClient.send(
    new TransactWriteCommand({
      TransactItems: [
        // Create the new client
        { Put: { TableName: TABLE_NAME, Item: client } },
        // Increment the global client count
        {
          Update: {
            TableName: TABLE_NAME,
            Key: { EntityId: "METRICS", EntityType: "CLIENT_COUNT" },
            UpdateExpression: "ADD #c :inc",
            ExpressionAttributeNames: { "#c": "count" },
            ExpressionAttributeValues: { ":inc": 1 },
          },
        },
      ],
    }),
  );
};

/**
 * Retrieves a single client record by its unique ID.
 * * @param {string} serviceId - The unique identifier of the client (without the "CLIENT#"" prefix).
 * @returns {Promise<Object>} The DynamoDB response object containing the client item.
 * @source: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/getting-started-step-3.html
 */
export const getClient = async (clientId) => {
  // Look for a client that matches:
  // EntityId: The unique ID of the client (prefixed with "CLIENT#").
  // EntityType: The "CLIENT" label assigned when the client was created
  return await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { EntityId: `CLIENT#${clientId}`, EntityType: "CLIENT" },
    }),
  );
};
