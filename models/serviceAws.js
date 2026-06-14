import {
  PutCommand,
  GetCommand,
  QueryCommand,
  TransactWriteCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "../utils/dynamodb.js";

/**
 * Creates a new service and increments the global count.
 * @param {Object} service - The complete service item to be saved.
 * @returns {Promise<Object>} - The response object from DynamoDB containing the transaction outcome.
 * @source: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/getting-started-step-2.html
 * https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_TransactWriteItems.html
 * https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.UpdateExpressions.html#Expressions.UpdateExpressions.ADD
 */
export const postService = async (service) => {
  await docClient.send(
    // Write the service to DynamoDB table
    // Use a TransactWriteCommand for two actions
    // (create service + update count)
    new TransactWriteCommand({
      TransactItems: [
        // Create the new service
        { Put: { TableName: TABLE_NAME, Item: service } },
        // Increment the stats counter
        // Instead of counting every service one by one, we keep a count at:
        // (EntityId: "METRICS", EntityType: "SERVICE_COUNT").
        {
          Update: {
            TableName: TABLE_NAME,
            // We target a stats record to keep our total count
            Key: { EntityId: "METRICS", EntityType: "SERVICE_COUNT" },
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
};

/**
 * Retrieves a single service record by its unique ID.
 * * @param {string} service_id - The unique identifier of the service (without the "SERVICE#" prefix).
 * @returns {Promise<Object>} The DynamoDB response object containing the service item.
 * @source: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/getting-started-step-3.html
 */
export const getService = async (service_id) => {
  return await docClient.send(
    // Look for a service that matches:
    // EntityId: The unique ID of the service (prefixed with "SERVICE#").
    // EntityType: The "SERVICE" label assigned when the service was created
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { EntityId: `SERVICE#${service_id}`, EntityType: "SERVICE" },
    }),
  );
};

/**
 * Fetches a page of services. It fetches the total number of
 * services from a "Stats" record. Then it grabs a "page" of 10 services
 * at a time to keep the. If there are more services, it provides a "next"
 * link (a cursor) to fetch the next page.
 * @param {number} limit - The maximum number of services to return in the query.
 * @param {string} [cursor] - Base64 encoded string representing the ExclusiveStartKey
 * from a previous page.
 * @returns {Promise<[Object, Object]>} An array containing [statsResult, serviceResult].
 * @source:
 * https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/getting-started-step-5.html
 * https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.Pagination.html
 * https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Query.html
 * https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Query.html#DDB-Query-request-ExclusiveStartKey
 * https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Query.html#DDB-Query-request-Limit
 * https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/example_dynamodb_Scenarios_QueryWithPagination_section.html
 */
export const getServices = async (limit, cursor) => {
  // Run two database lookups at the same time:
  // Get the global count from METRICS (so the UI knows how many items exist)
  // Get the current page of services using GSI
  return await Promise.all([
    docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { EntityId: "METRICS", EntityType: "SERVICE_COUNT" },
      }),
    ),
    docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "TypeIndex", // SK to get all services
        KeyConditionExpression: "EntityType = :type",
        ExpressionAttributeValues: { ":type": "SERVICE" },
        Limit: limit,
        // If a "cursor" was provided, convert it back from base64 so
        // DynamoDB knows where to pick up from
        ExclusiveStartKey: cursor
          ? JSON.parse(Buffer.from(cursor, "base64").toString())
          : undefined,
      }),
    ),
  ]);
};

/**
 * Partially updates an existing service record in DynamoDB.
 * @param {string} service_id - The unique ID of the service.
 * @param {string} updateExpression - The string defining which fields to update.
 * @param {Object} expressionAttributes - Map of placeholders to attribute names.
 * @param {Object} expressionValues - Map of placeholders to new attribute values.
 * @returns {Promise<>} - A promise with the updated service item.
 * @source: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.UpdateExpressions.html
 * https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.ExpressionAttributeNames.html
 * https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.ExpressionAttributeValues.html
 * https://github.com/awsdocs/aws-doc-sdk-examples/blob/main/javascriptv3/example_code/dynamodb/scenarios/basic.js
 */
export const patchService = async (
  service_id,
  updateExpression,
  expressionAttributes,
  expressionValues,
) => {
  return await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { EntityId: `SERVICE#${service_id}`, EntityType: "SERVICE" },
      UpdateExpression: updateExpression, // Instruction expression
      ExpressionAttributeNames: expressionAttributes, // Dictionary to translate # placeholders
      ExpressionAttributeValues: expressionValues, // Dictionary to translate : placeholders
      // ConditionExpression command only runs if the EntityId already exists in the table
      // If the ID is missing, the update fails to prevent creating data by accident
      ConditionExpression: "attribute_exists(EntityId)",
      // ReturnValues tells the database to give us back the full object
      // as it looks after the update is complete
      ReturnValues: "ALL_NEW",
    }),
  );
};

/**
 * Replaces an existing service record entirely.
 * @param {string} service_id - The unique ID of the service.
 * @param {Object} serviceData - The complete service object to replace the old one.
 * @returns {Promise<Object>} - The updated service item.
 */
export const putService = async (service_id, serviceData) => {
  return await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { EntityId: `SERVICE#${service_id}`, EntityType: "SERVICE" },
      UpdateExpression: "SET #n = :n, #t = :t, #p = :p, updatedAt = :now",
      ExpressionAttributeNames: {
        "#n": "name",
        "#t": "type",
        "#p": "price",
      },
      ExpressionAttributeValues: {
        ":n": serviceData.name,
        ":t": serviceData.type,
        ":p": serviceData.price,
        ":now": new Date().toISOString(),
      },
      ConditionExpression: "attribute_exists(EntityId)",
      ReturnValues: "ALL_NEW",
    }),
  );
};

/**
 * Atomically deletes a service and decrements the global service count.
 * @param {string} service_id - The unique ID of the service to remove (without the 'SERVICE#' prefix).
 * @returns {Promise<Object>}
 * The response object from DynamoDB confirming the transactional delete and update.
 * @source:
 * https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.UpdateExpressions.html#Expressions.UpdateExpressions.ADD
 */
export const deleteService = async (service_id) => {
  // Delete service + decrement global count
  await docClient.send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Delete: {
            TableName: TABLE_NAME,
            Key: { EntityId: `SERVICE#${service_id}`, EntityType: "SERVICE" },
            // Check if this service exists
            ConditionExpression: "attribute_exists(EntityId)",
          },
        },
        {
          Update: {
            TableName: TABLE_NAME,
            Key: { EntityId: "METRICS", EntityType: "SERVICE_COUNT" },
            // Subtract 1 from the "count" attribute
            UpdateExpression: "ADD #c :dec",
            ExpressionAttributeNames: { "#c": "count" },
            ExpressionAttributeValues: { ":dec": -1 },
          },
        },
      ],
    }),
  );
};
