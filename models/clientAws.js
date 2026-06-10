import {
  PutCommand,
  TransactWriteCommand,
  GetCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "../utils/dynamodb.js";

/**
 * Creates a new client and increments the per-user count.
 * @param {Object} service - The complete client item to be saved.
 * @returns {Promise<Object>} - The response object from DynamoDB containing the transaction outcome.
 * @source: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/getting-started-step-2.html
 * https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_TransactWriteItems.html
 * https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.UpdateExpressions.html#Expressions.UpdateExpressions.ADD
 */
export const postClient = async (client) => {
  // Use the owner from the client object
  const userId = client.owner;
  await docClient.send(
    new TransactWriteCommand({
      TransactItems: [
        // Create the new client
        { Put: { TableName: TABLE_NAME, Item: client } },
        // Increment the client count for this specific user
        {
          Update: {
            TableName: TABLE_NAME,
            Key: { EntityId: `USER#${userId}`, EntityType: "CLIENT_COUNT" },
            // Use SET + if_not_exists for safe initialization
            UpdateExpression: "SET #c = if_not_exists(#c, :zero) + :inc",
            ExpressionAttributeNames: { "#c": "count" },
            ExpressionAttributeValues: { ":inc": 1, ":zero": 0 },
          },
        },
      ],
    }),
  );
};

/**
 * Retrieves a single client record by its unique ID.
 * @param {string} clientId - The unique identifier of the client (without the "CLIENT#"" prefix).
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

/**
 * Fetches a page of clients from a specific user. It fetches the total number of
 * clients from a "Stats" record. Then it grabs a "page" of 10 clients
 * at a time. If there are more clients, it provides a "next" link
 * (a cursor) to fetch the next page.
 * 1. Fetches the "CLIENT_COUNT" record for the user to determine the total items available.
 * 2. Queries the "OwnerIndex" GSI to retrieve a page of client records.
 * @param {string} userId - The owner ID to filter clients by.
 * @param {number} limit - The maximum number of items to return in the query.
 * @param {string} [cursor] - Base64 encoded string representing the ExclusiveStartKey from a previous page.
 * @returns {Promise<[Object, Object]>} An array containing [StatsResult, ClientResult].
 */
export const getClients = async (userId, limit, cursor) => {
  // Run two database lookups at the same time:
  // Get the count from this user
  // Get the current page of clients using GSI
  return await Promise.all([
    // Get total client count for this userId
    docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { EntityId: `USER#${userId}`, EntityType: "CLIENT_COUNT" },
      }),
    ),
    // Get the paginated clients for this owner using the OwnerIndex
    docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "OwnerIndex",
        KeyConditionExpression: "#o = :userId",
        ExpressionAttributeNames: { "#o": "owner" },
        ExpressionAttributeValues: { ":userId": userId },
        Limit: limit,
        ExclusiveStartKey: cursor
          ? JSON.parse(Buffer.from(cursor, "base64").toString())
          : undefined,
      }),
    ),
  ]);
};
