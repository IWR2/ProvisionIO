# Admin Endpoints

This section documents endpoints restricted to administrative users.

---

## Initialize Table

Creates or deletes the DynamoDB table schema required for the application. These endpoints are intended for development and environment setup.

### Create Table

`POST /init`

**Description:** Creates the DynamoDB table using a single-table design with pre-configured Global Secondary Indexes (`TypeIndex`, `OwnerIndex`, `ClientServiceIndex`).

#### Required Permissions

- `admin:access`
- `admin:table_create`
- `admin:table_delete`

#### Request

##### Path Parameters

None

##### Request Header

| Field | Description | Required? |
| :--- | :--- | :--- |
| `Accept` | The format of the content to be returned. Must be `application/json`. | Yes |
| `Authorization` | Bearer Token (JWT of the admin account). | Yes |

##### Request Body

None

#### Response

##### Response Body Format

JSON

##### Response Statuses

| Outcome | Status Code | Notes |
| :--- | :--- | :--- |
| **Success** | `201` | Table created successfully. |
| **Failure** | `400` | Bad Request: Invalid table configuration. |
| **Failure** | `401` | Unauthorized: Credentials missing or invalid. |
| **Failure** | `500` | Internal Server Error: An unexpected error occurred. |

##### Response Examples

```json title="201 OK - Table Created"
{
    "message": "ProvisionIO created successfully"
}
```

```json title="401 Conflict - Table Already Exists"
{
    "message": "ProvisionIO already exists"
}
```

```json title="400 Bad Request"
{
    "error": "Invalid table configuration. Check AttributeDefinitions and KeySchema.",
    "details": "One or more parameter values were invalid"
}
```

```json title="401 Unauthorized"
{
    "Error": "Unauthorized",
    "Message": "Authentication failed. Please provide a valid token."
}
```

```json title="500 Internal Server Error"
{
    "Error": "Internal Server Error",
    "Message": "An unexpected error occurred."
}
```

---

### Delete Table

`DELETE /init`

**Description:** Deletes the DynamoDB table and ALL data contained within it. Use with extreme caution.

#### Required Permissions

- `admin:access`
- `admin:table_create`
- `admin:table_delete`

#### Request

##### Path Parameters

None

##### Request Header

| Field | Description | Required? |
| :--- | :--- | :--- |
| `Accept` | The format of the content to be returned. Must be `application/json`. | Yes |
| `Authorization` | Bearer Token (JWT of the admin account). | Yes |

##### Request Body

None

#### Response

##### Response Body Format

JSON (for error responses only)

##### Response Statuses

| Outcome | Status Code | Notes |
| :--- | :--- | :--- |
| **Success** | `204` | No Content: Table deleted successfully. No response body returned. |
| **Failure** | `401` | Unauthorized: Credentials missing or invalid. |
| **Failure** | `404` | Not Found: Table does not exist. |
| **Failure** | `500` | Internal Server Error: An unexpected error occurred. |

##### Response Examples

**Status: 204 No Content**

*The table was deleted successfully. No response body is returned.*

```json title="401 Unauthorized"
{
    "Error": "Unauthorized",
    "Message": "Authentication failed. Please provide a valid token."
}
```

```json title="404 Not Found"
{
    "message": "Table does not exist"
}
```

```json title="500 Internal Server Error"
{
    "Error": "Internal Server Error",
    "Message": "An unexpected error occurred."
}
```

---

## Get all Users

`GET /users`

**Description:** Retrieves all registered users for this application.

#### Required Permissions

- `admin:access`

#### Request

##### Path Parameters

None

##### Request Header

| Field | Description | Required? |
| :--- | :--- | :--- |
| `Accept` | The format of the content to be returned. Must be `application/json`. | Yes |
| `Authorization` | A JSON Web token identifying the admin. | Yes |

##### Request Body

None

#### Response

##### Response Body Format

JSON

##### Response Statuses

| Outcome | Status Code | Notes |
| :--- | :--- | :--- |
| **Success** | `200` | OK |
| **Failure** | `401` | Unauthorized: Credentials missing or invalid. |
| **Failure** | `405` | Method Not Allowed: HTTP method not supported. |
| **Failure** | `406` | Not Acceptable: Content-Type not supported or missing. |

##### Response Examples

```json title="200 OK"
{
    "results": [
        { "id": "auth0|01" },
        { "id": "auth0|012" },
        { "id": "auth0|0123" }
    ]
}
```

```json title="401 Unauthorized"
{
    "Error": "Unauthorized",
    "Message": "Authentication failed. Please provide a valid token."
}
```

```json title="405 Method Not Allowed"
{
    "Error": "Method not allowed"
}
```

```json title="406 Not Acceptable"
{
    "Error": "Client must accept application/json"
}
```

---

## Debug JWT Scopes

`GET /debug-scopes`

**Description:** Validates authentication and displays the user's granted permissions and full JWT payload. This is a critical tool for troubleshooting permission errors.

#### Required Permissions

- `admin:access`
- `admin:table_create`
- `admin:table_delete`

#### Request

##### Path Parameters

None

##### Request Header

| Field | Description | Required? |
| :--- | :--- | :--- |
| `Accept` | The format of the content to be returned. Must be `application/json`. | Yes |
| `Authorization` | A JSON Web token identifying the admin. | Yes |

##### Request Body

None

#### Response

##### Response Body Format

JSON

##### Response Statuses

| Outcome | Status Code | Notes |
| :--- | :--- | :--- |
| **Success** | `200` | OK |
| **Failure** | `401` | Unauthorized: Credentials missing or invalid. |

##### Response Examples

```json title="200 OK"
{
    "scopes": "openid profile email",
    "fullPayload": {
        "iss": "https://your-tenant.us.auth0.com/",
        "sub": "auth0|01234",
        "aud": [
            "https://your-api-identifier",
            "https://your-tenant.us.auth0.com/userinfo"
        ],
        "iat": 99999,
        "exp": 99999,
        "scope": "openid profile email",
        "azp": "abc",
        "permissions": [
            "admin:access",
            "admin:table_create",
            "admin:table_delete",
            "delete:users",
            "read:users"
        ]
    }
}
```

```json title="401 Unauthorized"
{
    "Error": "Unauthorized",
    "Message": "Authentication failed. Please provide a valid token."
}
```

---

## Notes

- All admin endpoints require a valid JWT token with administrative privileges.
- The token must be included in the `Authorization` header for every request.
- The `Accept` header must be set to `application/json` for all requests.
- The global error handler returns `401` for both missing credentials and permission failures (the global handler treats all `claimIncludes` failures as `403`).