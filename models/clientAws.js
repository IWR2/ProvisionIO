import {
  PutCommand,
  TransactWriteCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
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
  const user_id = client.owner;
  await docClient.send(
    new TransactWriteCommand({
      TransactItems: [
        // Create the new client
        { Put: { TableName: TABLE_NAME, Item: client } },
        // Increment the client count for this specific user
        {
          Update: {
            TableName: TABLE_NAME,
            Key: { EntityId: `USER#${user_id}`, EntityType: "CLIENT_COUNT" },
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
 * @param {string} user_id - The owner ID to filter clients by.
 * @param {number} limit - The maximum number of items to return in the query.
 * @param {string} [cursor] - Base64 encoded string representing the ExclusiveStartKey from a previous page.
 * @returns {Promise<[Object, Object]>} An array containing [StatsResult, ClientResult].
 */
export const getClients = async (user_id, limit, cursor) => {
  // Run two database lookups at the same time:
  // Get the count from this user
  // Get the current page of clients using GSI
  return await Promise.all([
    // Get total client count for this user_id
    docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { EntityId: `USER#${user_id}`, EntityType: "CLIENT_COUNT" },
      }),
    ),
    // Get the paginated clients for this owner using the OwnerIndex
    docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "OwnerIndex",
        KeyConditionExpression: "#o = :userId",
        ExpressionAttributeNames: { "#o": "owner" },
        ExpressionAttributeValues: { ":userId": user_id },
        Limit: limit,
        ExclusiveStartKey: cursor
          ? JSON.parse(Buffer.from(cursor, "base64").toString())
          : undefined,
      }),
    ),
  ]);
};

/**
 * Partially updates an existing client record in DynamoDB.
 * @param {string} serviceId - The unique ID of the cliente.
 * @param {string} updateExpression - The string defining which fields to update.
 * @param {Object} expressionAttributes - Map of placeholders to attribute names.
 * @param {Object} expressionValues - Map of placeholders to new attribute values.
 * @returns {Promise<>} - A promise with the updated client item.
 */
export const putClient = async (
  clientId,
  updateExpression,
  expressionAttributes,
  expressionValues,
) => {
  return await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { EntityId: `CLIENT#${clientId}`, EntityType: "CLIENT" },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributes,
      ExpressionAttributeValues: expressionValues,
      ConditionExpression: "attribute_exists(EntityId)",
      ReturnValues: "ALL_NEW",
    }),
  );
};

/**
 * Links a specific service to a client. If the service is already taken,
 * it will safely reject the request to prevent accidental overwriting of
 * assignments.
 * @param {string} clientId - The unique ID of the client who will own the service.
 * @param {string} serviceId - The unique ID of the service we want to assign.
 * @returns {Promise<Object>} - Confirms the update was successful or throws an error if blocked.
 */
export const assignServiceToClient = async (clientId, serviceId) => {
  // Finds the service and assigns the clientId to that service if it is null
  return await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { EntityId: `SERVICE#${serviceId}`, EntityType: "SERVICE" },
      UpdateExpression: "SET clientId = :cid",
      ConditionExpression:
        "attribute_not_exists(clientId) OR clientId = :nullVal",
      ExpressionAttributeValues: {
        ":cid": clientId,
        ":nullVal": null,
      },
    }),
  );
};

/**
 * Retrieves all services currently assigned to a specific client.
 * @param {string} clientId - The unique ID of the client whose services we want to find.
 * @returns {Promise<Array>} - A list containing all service records matched to this client.
 */
export const getClientServices = async (clientId) => {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "ClientServiceIndex",
      KeyConditionExpression: "clientId = :cid",
      ExpressionAttributeValues: { ":cid": clientId },
    }),
  );
  return result.Items;
};

/**
 * Unlinks a service from its currently assigned client.
 * @param {string} serviceId - The unique ID of the service to release.
 * @returns {Promise<Object>} - Confirmation of the successful unlinking.
 */
export const unassignServiceFromClient = async (serviceId) => {
  return await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { EntityId: `SERVICE#${serviceId}`, EntityType: "SERVICE" },
      // Delete the clientId attribute, making it "attribute_not_exists"
      UpdateExpression: "REMOVE clientId",
      // Only unassign if a clientId actually exists
      ConditionExpression: "attribute_exists(clientId)",
    }),
  );
};

/**
 * Atomically deletes a client, decrements the user's client count,
 * and unlinks any services associated with that client.
 * @param {string} user_id - The ID of the owner.
 * @param {string} client_id - The ID of the client to be deleted.
 * @param {Array} services - List of service objects currently assigned to this client.
 */
export const deleteClientAndCleanup = async (user_id, client_id, services) => {
  // Create a list of transact write commands to delete a client and to decrement the count of clients for this user
  const transactItems = [
    // Delete the client record
    {
      Delete: {
        TableName: TABLE_NAME,
        Key: { EntityId: `CLIENT#${client_id}`, EntityType: "CLIENT" },
        ConditionExpression: "attribute_exists(EntityId)",
      },
    },
    // Decrement the user's client count
    {
      Update: {
        TableName: TABLE_NAME,
        Key: { EntityId: `USER#${user_id}`, EntityType: "CLIENT_COUNT" },
        UpdateExpression: "ADD #c :dec",
        ExpressionAttributeNames: { "#c": "count" },
        ExpressionAttributeValues: { ":dec": -1 },
      },
    },
  ];

  // Append a list of services to be removed belonging to this client
  // Unlink each associated service
  services.forEach((service) => {
    transactItems.push({
      Update: {
        TableName: TABLE_NAME,
        Key: { EntityId: service.EntityId, EntityType: "SERVICE" },
        UpdateExpression: "REMOVE clientId",
      },
    });
  });

  await docClient.send(
    new TransactWriteCommand({ TransactItems: transactItems }),
  );
};
