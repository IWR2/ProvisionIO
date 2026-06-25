# Client Endpoints

This section documents all client endpoints.

---

## Create a Client

`POST /clients`

**Description:** Creates a new client and assigns it to the authenticated user.

#### Required Permissions

None (any authenticated user can create clients)

#### Request

##### Path Parameters

None

##### Request Header

| Field | Description | Required? |
| :--- | :--- | :--- |
| `Accept` | The format of the content to be returned. Must be `application/json`. | Yes |
| `Authorization` | Bearer Token (JWT) identifying the authenticated user. | Yes |

##### Request Body

```json
{
    "name": "Real Engine",
    "contact_manager": "Sim Tweeny",
    "email": "sim_tweeny@realengine.com"
}
```

##### Request JSON Attributes

| Name | Type | Description | Required |
| :--- | :--- | :--- | :--- |
| `name` | string | The client's name. | Yes |
| `contact_manager` | string | The client's contact manager. | Yes |
| `email` | string | The client's email address. Must be a valid email format. | Yes |

#### Response

##### Response Body Format

JSON

##### Response Statuses

| Outcome | Status Code | Notes |
| :--- | :--- | :--- |
| **Success** | `201` | Created: Response body returns created client. The self link is set to the created client. |
| **Failure** | `400` |	Bad Request: Request is missing required parameters, using an unsupported attribute, or invalid email format. |
| **Failure** | `401` | Unauthorized: Request is missing credentials or credentials were invalid. |
| **Failure** | `406` | Not Acceptable: Request Accept header is not supported or is missing. |
| **Failure** | `415` | Unsupported Media Type: Request Content-Type header is not supported or is missing. |
| **Failure** | `500` | Internal Server Error: An unexpected error occurred. |

##### Response Examples

```json title="201 Created"
{
    "id": "feb83",
    "name": "Real Engine",
    "contact_manager": "Sim Tweeny",
    "email": "sim_tweeny@realengine.com",
    "owner": "auth0|01",
    "self": "http://<your-app>/clients/feb83"
}
```

```json title="400 Bad Request"
{
    "Error": "The request object is missing the following required attributes: contact_manager"
}
```

```json title="400 Bad Request"
{
    "Error": "The request object includes unsupported attributes: address"
}
```

```json title="400 Bad Request"
{
    "Error": "Invalid email format"
}
```

```json title="401 Unauthorized"
{
    "Error": "Unauthorized",
    "Message": "Authentication failed. Please provide a valid token."
}
```

```json title="406 Not Acceptable"
{
    "Error": "Client must accept application/json"
}
```

```json title="415 Unsupported Media Type"
{
    "Error": "Server only accepts application/json data"
}
```

```json title="500 Internal Server Error"
{
    "Error": "Internal Server Error",
    "Message": "An unexpected error occurred."
}
```

---

## Get a Client

`GET /clients/:client_id`

**Description:** Gets an existing client.

#### Required Permissions

None (authenticated users can only access their own clients)

#### Request

##### Path Parameters

| Name | Type | Description | Required? |
| :--- | :--- | :--- | :--- |
| `client_id` | string | The ID of the client. | Yes |

##### Request Header

| Field | Description | Required? |
| :--- | :--- | :--- |
| `Accept` | The format of the content to be returned. Must be `application/json`. | Yes |
| `Authorization` | Bearer Token (JWT) identifying the authenticated user. | Yes |

##### Request Body

None

#### Response

##### Response Body Format

JSON

##### Response Statuses

| Outcome | Status Code | Notes |
| :--- | :--- | :--- |
| **Success** | `200` | OK: Client found. |
| **Failure** | `401` | Unauthorized: Request is missing credentials or credentials were invalid. |
| **Failure** | `403` | Forbidden: Authenticated user does not have access to this client. |
| **Failure** | `404` | Not Found: No client with the given client_id exists. |
| **Failure** | `406` | Not Acceptable: Request Accept header is not supported or is missing. |
| **Failure** | `500` | Internal Server Error: An unexpected error occurred. |

##### Response Examples

```json title="200 OK"
{
    "id": "5c60",
    "name": "Real Engine",
    "contact_manager": "Sim Tweeny",
    "email": "sim_tweeny@realengine.com",
    "owner": "auth0|012",
    "services": [],
    "self": "http://<your-app>/clients/5c60"
}
```

```json title="401 Unauthorized"
{
    "Error": "Unauthorized",
    "Message": "Authentication failed. Please provide a valid token."
}
```

```json title="403 Forbidden"
{
    "Error": "You do not have permission to access this client"
}
```

```json title="404 Not Found"
{
    "Error": "No client with this client_id exists"
}
```

```json title="406 Not Acceptable"
{
    "Error": "Client must accept application/json"
}
```

```json title="500 Internal Server Error"
{
    "Error": "Internal Server Error",
    "Message": "An unexpected error occurred."
}
```

---

## Get all Clients

`GET /clients?cursor=cursor_id`

**Description:** Lists all clients belonging to the authenticated user. This implements server-side pagination. It returns 10 clients per page. If more clients exist, a next link containing a base64-encoded cursor is provided.

#### Required Permissions

None (authenticated users can only access their own clients)

#### Request

##### Path Parameters

| Name | Type | Description | Required? |
| :--- | :--- | :--- | :--- |
| `cursor_id` | string | The encoded cursor string from the previous `next` link. | No |

##### Request Header

| Field | Description | Required? |
| :--- | :--- | :--- |
| `Accept` | The format of the content to be returned. Must be `application/json`. | Yes |
| `Authorization` | Bearer Token (JWT) identifying the authenticated user. | Yes |

##### Request Body

None

#### Response

##### Response Body Format

JSON

##### Response Statuses

| Outcome | Status Code | Notes |
| :--- | :--- | :--- |
| **Success** | `200` | OK |
| **Failure** | `401` | Unauthorized: Request is missing credentials or credentials were invalid. |
| **Failure** | `406` | Not Acceptable: Request Accept header is not supported or is missing. |
| **Failure** | `500` | Internal Server Error: An unexpected error occurred. |

##### Response Examples

```json title="200 OK"
{
    "clients": [
        {
            "id": "42fcb",
            "name": "Real Games",
            "contact_manager": "Theo Teeny",
            "email": "theo_teeny@realgames.com",
            "owner": "auth|01",
            "self": "http://<your-app>/clients/42fcb"
        },
        // ... (9 more items)
    ],
    "items": 14,
    "next": "http://<your-app>/clients?cursor=..."
}
```

```json title="401 Unauthorized"
{
    "Error": "Unauthorized",
    "Message": "Authentication failed. Please provide a valid token."
}
```

```json title="406 Not Acceptable"
{
    "Error": "Client must accept application/json"
}
```

```json title="500 Internal Server Error"
{
    "Error": "Internal Server Error",
    "Message": "An unexpected error occurred."
}
```

---

## Replace a Client

`PUT /clients/:client_id`

**Description:** Replaces an existing client with all new attribute values. The client retains any existing associations to services.

#### Required Permissions

None (authenticated users can only modify their own clients)

#### Request

##### Path Parameters

| Name | Type | Description | Required? |
| :--- | :--- | :--- | :--- |
| `client_id` | string | The ID of the client. | Yes |

##### Request Header

| Field | Description | Required? |
| :--- | :--- | :--- |
| `Accept` | The format of the content to be returned. Must be `application/json`. | Yes |
| `Authorization` | Bearer Token (JWT) identifying the authenticated user. | Yes |

##### Request Body

```json
{
    "name": "Not Engine",
    "contact_manager": "Tim Bweeny",
    "email": "tim_bweeny@realgames.com"
}
```

##### Request JSON Attributes

| Name | Type | Description | Required |
| :--- | :--- | :--- | :--- |
| `name` | string | The client's name. | Yes |
| `contact_manager` | string | The client's contact manager. | Yes |
| `email` | string | The client's email address. Must be a valid email format. | Yes |

#### Response

##### Response Body Format

JSON

##### Response Statuses

| Outcome | Status Code | Notes |
| :--- | :--- | :--- |
| **Success** | `200` | OK: Response body returns replaced client. The self link is set to the replaced client. |
| **Failure** | `400` | Bad Request: Request is missing required parameters, using an unsupported attribute, or invalid email format. |
| **Failure** | `401` | Unauthorized: Request is missing credentials or credentials were invalid. |
| **Failure** | `403` | Forbidden: Attempting to modify client_id (immutable field), or user does not have permission to modify this client. |
| **Failure** | `404` | Not Found: No client with the given client_id exists. |
| **Failure** | `406` | Not Acceptable: Request Accept header is not supported or is missing. |
| **Failure** | `415` | Unsupported Media Type: Request Content-Type header is not supported or is missing. |
| **Failure** | `500` | Internal Server Error: An unexpected error occurred. |

##### Response Examples

```json title="200 OK"
{
    "id": "9ff8",
    "name": "Not Engine",
    "contact_manager": "Tim Bweeny",
    "email": "tim_bweeny@realgames.com",
    "owner": "auth0|012",
    "self": "http://<your-app>/clients/9ff8"
}
```

```json title="400 Bad Request"
{
    "Error": "The request object is missing the following required attributes: name"
}
```

```json title="400 Bad Request"
{
    "Error": "The request object includes unsupported attributes: owner"
}
```

```json title="400 Bad Request"
{
    "Error": "Invalid email format"
}
```

```json title="401 Unauthorized"
{
    "Error": "Unauthorized",
    "Message": "Authentication failed. Please provide a valid token."
}
```

```json title="403 Forbidden"
{
    "Error": "You do not have permission to modify this client"
}
```

```json title="403 Forbidden"
{
    "Error": "client_id cannot be modified"
}
```

```json title="404 Not Found"
{
    "Error": "No client with this client_id exists"
}
```

```json title="406 Not Acceptable"
{
    "Error": "Client must accept application/json"
}
```

```json title="415 Unsupported Media Type"
{
    "Error": "Server only accepts application/json data"
}
```

```json title="500 Internal Server Error"
{
    "Error": "Internal Server Error",
    "Message": "An unexpected error occurred."
}
```

---

## Update a Client

`PATCH /clients/:client_id`

**Description:** Updates one or more attributes of an existing client. The client retains any existing associations to services.

#### Required Permissions

None (authenticated users can only modify their own clients)

#### Request

##### Path Parameters

| Name | Type | Description | Required? |
| :--- | :--- | :--- | :--- |
| `client_id` | string | The ID of the client. | Yes |

##### Request Header

| Field | Description | Required? |
| :--- | :--- | :--- |
| `Accept` | The format of the content to be returned. Must be `application/json`. | Yes |
| `Authorization` | Bearer Token (JWT) identifying the authenticated user. | Yes |

##### Request Body

```json
{
    "contact_manager": "Simmothy Tweeny"
}
```

##### Request JSON Attributes

| Name | Type | Description | Required |
| :--- | :--- | :--- | :--- |
| `name` | string | The client's name. | Optional*  |
| `contact_manager` | string | The client's contact manager. | Optional*  |
| `email` | string | The client's email address. Must be a valid email format. | Optional*  |

\* At least one attribute must be provided.

#### Response

##### Response Body Format

JSON

##### Response Statuses

| Outcome | Status Code | Notes |
| :--- | :--- | :--- |
| **Success** | `200` | OK: Response body returns updated client. The self link is set to the updated client. |
| **Failure** | `400` | Bad Request: Request is missing all attributes, using an unsupported attribute, or invalid email format. |
| **Failure** | `401` | Unauthorized: Request is missing credentials or credentials were invalid. |
| **Failure** | `403` | Forbidden: Attempting to modify client_id (immutable field), or user does not have permission to modify this client. |
| **Failure** | `404` | Not Found: No client with the given client_id exists. |
| **Failure** | `406` | Not Acceptable: Request Accept header is not supported or is missing. |
| **Failure** | `415` | Unsupported Media Type: Request Content-Type header is not supported or is missing. |
| **Failure** | `500` | Internal Server Error: An unexpected error occurred. |

##### Response Examples

```json title="200 OK"
{
    "id": "9ff8",
    "name": "Not Engine",
    "contact_manager": "Simmothy Tweeny",
    "email": "tim_bweeny@realgames.com",
    "owner": "auth0|012",
    "self": "http://<your-app>/clients/9ff8"
}
```

```json title="400 Bad Request"
{
    "Error": "The request must include at least one valid attribute: name, contact_manager, email"
}
```

```json title="400 Bad Request"
{
    "Error": "The request object includes unsupported attributes: callsign"
}
```

```json title="400 Bad Request"
{
    "Error": "Invalid email format"
}
```

```json title="401 Unauthorized"
{
    "Error": "Unauthorized",
    "Message": "Authentication failed. Please provide a valid token."
}
```

```json title="403 Forbidden"
{
    "Error": "You do not have permission to modify this client"
}
```

```json title="403 Forbidden"
{
    "Error": "client_id cannot be modified"
}
```

```json title="404 Not Found"
{
    "Error": "No client with this client_id exists"
}
```

```json title="406 Not Acceptable"
{
    "Error": "Client must accept application/json"
}
```

```json title="415 Unsupported Media Type"
{
    "Error": "Server only accepts application/json data"
}
```

```json title="500 Internal Server Error"
{
    "Error": "Internal Server Error",
    "Message": "An unexpected error occurred."
}
```

---

## Delete a Client

`DELETE /clients/:client_id`

**Description:** Deletes an existing client. If the client has any associated services, they will be automatically unlinked from the client upon deletion.

#### Required Permissions

None (authenticated users can only delete their own clients)

#### Request

##### Path Parameters

| Name | Type | Description | Required? |
| :--- | :--- | :--- | :--- |
| `client_id` | string | The ID of the client. | Yes |

##### Request Header

| Field | Description | Required? |
| :--- | :--- | :--- |
| `Accept` | The format of the content to be returned. Must be `application/json`. | Yes |
| `Authorization` | Bearer Token (JWT) identifying the authenticated user. | Yes |

##### Request Body

None

#### Response

##### Response Body Format

Success: None

Failure: JSON

##### Response Statuses

| Outcome | Status Code | Notes |
| :--- | :--- | :--- |
| **Success** | `204` | No Content: Client successfully deleted. Any associated services are automatically unlinked. |
| **Failure** | `401` | Unauthorized: Request is missing credentials or credentials were invalid. |
| **Failure** | `403` | Forbidden: Authenticated user does not have permission to delete this client. |
| **Failure** | `404` | Not Found: No client with the given client_id exists. |

##### Response Examples

**Status: 204 No Content**

*The client was deleted successfully. No response body is returned.*


```json title="401 Unauthorized"
{
    "Error": "Unauthorized",
    "Message": "Authentication failed. Please provide a valid token."
}
```

```json title="403 Forbidden"
{
    "Error": "You do not have permission to delete this client"
}
```

```json title="404 Not Found"
{
    "Error": "No client with this client_id exists"
}
```

---

## Assign a Service to a Client

`PUT /clients/:client_id/services/:service_id`

**Description:** Assigns a service to a client.

#### Required Permissions

None (authenticated users can only modify their own clients)

#### Request

##### Path Parameters

| Name | Type | Description | Required? |
| :--- | :--- | :--- | :--- |
| `client_id` | string | The ID of the client. | Yes |
| `service_id` | string | The ID of the service. | Yes |


##### Request Header

| Field | Description | Required? |
| :--- | :--- | :--- |
| `Accept` | The format of the content to be returned. Must be `application/json`. | Yes |
| `Authorization` | Bearer Token (JWT) identifying the authenticated user. | Yes |

##### Request Body

None

#### Response

##### Response Body Format

Success: None

Failure: JSON

##### Response Statuses

| Outcome | Status Code | Notes |
| :--- | :--- | :--- |
| **Success** | `204` | No Content: Service successfully assigned to the client. |
| **Failure** | `401` | Unauthorized: Request is missing credentials or credentials were invalid. |
| **Failure** | `403` | Forbidden: Authenticated user does not have permission to modify this client, or the service is already associated with another client. |
| **Failure** | `404` | Not Found: No client with the given client_id exists, or no service with the given service_id exists. |

##### Response Examples

**Status: 204 No Content**

*The service was successfully assigned to the client. No response body is returned.*


```json title="401 Unauthorized"
{
    "Error": "Unauthorized",
    "Message": "Authentication failed. Please provide a valid token."
}
```

```json title="403 Forbidden"
{
    "Error": "You do not have permission to modify this client"
}
```

```json title="403 Forbidden"
{
    "Error": "The service is already associated with another client"
}
```

```json title="404 Not Found"
{
    "Error": "No client with this client_id exists"
}
```

```json title="404 Not Found"
{
    "Error": "No service with this service_id exists"
}
```

---

## Remove a Service from a Client

`DELETE /clients/:client_id/services/:service_id`

**Description:** Removes a service from a client.

#### Required Permissions

None (authenticated users can only modify their own clients)

#### Request

##### Path Parameters

| Name | Type | Description | Required? |
| :--- | :--- | :--- | :--- |
| `client_id` | string | The ID of the client. | Yes |
| `service_id` | string | The ID of the service. | Yes |


##### Request Header

| Field | Description | Required? |
| :--- | :--- | :--- |
| `Accept` | The format of the content to be returned. Must be `application/json`. | Yes |
| `Authorization` | Bearer Token (JWT) identifying the authenticated user. | Yes |

##### Request Body

None

#### Response

##### Response Body Format

Success: None

Failure: JSON

##### Response Statuses

| Outcome | Status Code | Notes |
| :--- | :--- | :--- |
| **Success** | `204` | No Content: Service successfully removed from the client. |
| **Failure** | `401` | Unauthorized: Request is missing credentials or credentials were invalid. |
| **Failure** | `403` | Forbidden: Authenticated user does not have permission to modify this client.|
| **Failure** | `404` | Not Found: No client with the given client_id exists, or no service with the given service_id exists. |

##### Response Examples

**Status: 204 No Content**

*The service was successfully removed from the client. No response body is returned.*


```json title="401 Unauthorized"
{
    "Error": "Unauthorized",
    "Message": "Authentication failed. Please provide a valid token."
}
```

```json title="403 Forbidden"
{
    "Error": "You do not have permission to modify this client"
}
```

```json title="404 Not Found"
{
    "Error": "No client with this client_id exists"
}
```

```json title="404 Not Found"
{
    "Error": "No service with this service_id exists"
}
```

---

## Notes

- All endpoints require authentication via a valid JWT token in the `Authorization` header.
- Users can only access, modify, and delete clients that they own (identified by the `owner` field).
- The `Accept` header must be set to `application/json` for all requests.
- For `PATCH /clients/:client_id`, at least one attribute (`name`, `contact_manager`, or `email`) must be provided in the request body.
- The `client_id` and `owner` attributes are read-only and cannot be modified.
- When a client is deleted, any associated services are automatically unlinked from the client.
- The `email` field must be in a valid email format.