# Service Endpoints

This section documents all service endpoints.

---

## Create a Service

`POST /services`

**Description:** Creates a new service.

#### Required Permissions

None

#### Request

##### Path Parameters

None

##### Request Header

| Field | Description | Required? |
| :--- | :--- | :--- |
| `Accept` | The format of the content to be returned. Must be `application/json`. | Yes |

##### Request Body

```json
{
    "name": "MVIDIA Mesla A100",
    "type": "IaaS",
    "price": 30500.00
}
```

##### Request JSON Attributes

| Name | Type | Description | Required |
| :--- | :--- | :--- | :--- |
| `name` | string | The name of the service. | Yes |
| `type` | string | The name of the service type. | Yes |
| `price` | float | The monthly cost in USD of a service. | Yes |

#### Response

##### Response Body Format

JSON

##### Response Statuses

| Outcome | Status Code | Notes |
| :--- | :--- | :--- |
| **Success** | `201` | Created: Response body returns created service. The self link is set to the created service. |
| **Failure** | `400` | Bad Request: Request is missing required parameters, using an unsupported attribute, or using a negative value for price. |
| **Failure** | `406` | Not Acceptable: Request Accept header is not supported or is missing. |
| **Failure** | `415` | Unsupported Media Type: Request Content-Type header is not supported or is missing. |
| **Failure** | `500` | Internal Server Error: An unexpected error occurred. |

##### Response Examples

```json title="201 Created"
{
    "id": "efa12b1f-3bde...",
    "name": "MVIDIA Mesla A100",
    "type": "IaaS",
    "price": 30500,
    "client": null,
    "self": "http://<your-app>/services/efa12b1f-3bde..."
}
```

```json title="400 Bad Request"
{
    "Error": "The request object is missing the following required attributes: name, type, price"
}
```

```json title="400 Bad Request"
{
    "Error": "The request object includes unsupported attributes: quantity"
}
```

```json title="400 Bad Request"
{
    "Error": "The price attribute must be a non-negative number"
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

## Get a Service

`GET /services/:service_id`

**Description:** Gets an existing service.

#### Required Permissions

None

#### Request

##### Path Parameters

| Name | Type | Description | Required? |
| :--- | :--- | :--- | :--- |
| `service_id` | string | The ID of the service. | Yes |

##### Request Header

| Field | Description | Required? |
| :--- | :--- | :--- |
| `Accept` | The format of the content to be returned. Must be `application/json`. | Yes |

##### Request Body

None

#### Response

##### Response Body Format

JSON

##### Response Statuses

| Outcome | Status Code | Notes |
| :--- | :--- | :--- |
| **Success** | `200` | OK: Service found. |
| **Failure** | `404` | Not Found: No service with the given service_id exists. |
| **Failure** | `406` | Not Acceptable: Request Accept header is not supported or is missing. |
| **Failure** | `500` | Internal Server Error: An unexpected error occurred. |

##### Response Examples

```json title="200 OK"
{
    "id": "efa12b1f-3bde...",
    "name": "MVIDIA Mesla A100",
    "type": "IaaS",
    "price": 30500,
    "client": null,
    "self": "http://<your-app>/services/efa12b1f-3bde..."
}
```

```json title="404 Not Found"
{
    "Error": "No service with this service_id exists"
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

## Get all Services

`GET /services?cursor=cursor_id`

**Description:** Lists all cloud services. This implements server-side pagination. It returns 10 services per page. If more services exist, a `next` link containing a base64-encoded cursor is provided.

#### Required Permissions

None

#### Request

##### Path Parameters

| Name | Type | Description | Required? |
| :--- | :--- | :--- | :--- |
| `cursor_id` | string | The encoded cursor string from the previous `next` link. | No |

##### Request Header

| Field | Description | Required? |
| :--- | :--- | :--- |
| `Accept` | The format of the content to be returned. Must be `application/json`. | Yes |

##### Request Body

None

#### Response

##### Response Body Format

JSON

##### Response Statuses

| Outcome | Status Code | Notes |
| :--- | :--- | :--- |
| **Success** | `200` | OK |
| **Failure** | `406` | Not Acceptable: Content-Type not supported or missing. |

##### Response Examples

```json title="200 OK"
{
    "services": [
        {
               "id": ""efa12b1f-3bde",
               "name": "MVIDIA Mesla A100",
               "type": "IaaS",
               "price": 1950.55,
               "client": null,
               "self": "http://<your-app>/services/"efa12b1f-3bde"
        },
        // ... (9 more items)
    ],
    "items": 12,
    "next": "http://<your-app>/services?cursor=eyJzZ..."
}
```

```json title="406 Not Acceptable"
{
    "Error": "Client must accept application/json"
}
```

---

## Replace a Service

`PUT /services/:service_id`

**Description:** Replaces an existing service with all new attribute values.

#### Required Permissions

None

#### Request

##### Path Parameters

| Name | Type | Description | Required? |
| :--- | :--- | :--- | :--- |
| `service_id` | string | The ID of the service. | Yes |

##### Request Header

| Field | Description | Required? |
| :--- | :--- | :--- |
| `Accept` | The format of the content to be returned. Must be `application/json`. | Yes |

##### Request Body

```json
{
    "name": "MVIDIA Mesla A100",
    "type": "IaaS",
    "price": 30500.00
}
```

##### Request JSON Attributes

| Name | Type | Description | Required |
| :--- | :--- | :--- | :--- |
| `name` | string | The name of the service. | Yes |
| `type` | string | The name of the service type. | Yes |
| `price` | float | The monthly cost in USD of a service. | Yes |

#### Response

##### Response Body Format

JSON

##### Response Statuses

| Outcome | Status Code | Notes |
| :--- | :--- | :--- |
| **Success** | `201` | Created: Response body returns replaced service. The self link is set to the replaced service. |
| **Failure** | `400` | Bad Request: Request is missing required parameters, using an unsupported attribute, or using a negative value for price. |
| **Failure** | `404` | Not Found: No service with the given service_id exists. |
| **Failure** | `406` | Not Acceptable: Request Accept header is not supported or is missing. |
| **Failure** | `415` | Unsupported Media Type: Request Content-Type header is not supported or is missing. |
| **Failure** | `500` | Internal Server Error: An unexpected error occurred. |

##### Response Examples

```json title="201 Created"
{
    "id": "2c53f59d-8d27",
    "name": "MVIDIA Mesla T4",
    "type": "IaaS",
    "price": 30500,
    "self": "http://<your-app>/services/2c53f59d-8d27"
}
```

```json title="400 Bad Request"
{
    "Error": "The request object is missing the following required attributes: name, type, price"
}
```

```json title="400 Bad Request"
{
    "Error": "The request object includes unsupported attributes: quantity"
}
```

```json title="400 Bad Request"
{
    "Error": "The price attribute must be a non-negative number"
}
```

```json title="404 Not Found"
{
    "Error": "No service with this service_id exists"
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

## Update a Service

`PATCH /services/:service_id`

**Description:** Updates one or more attributes of an existing service.

#### Required Permissions

None

#### Request

##### Path Parameters

| Name | Type | Description | Required? |
| :--- | :--- | :--- | :--- |
| `service_id` | string | The ID of the service. | Yes |

##### Request Header

| Field | Description | Required? |
| :--- | :--- | :--- |
| `Accept` | The format of the content to be returned. Must be `application/json`. | Yes |

##### Request Body

```json
{
    "price": 2100.00
}
```

##### Request JSON Attributes

| Name | Type | Description | Required |
| :--- | :--- | :--- | :--- |
| `name` | string | The name of the service. | Optional |
| `type` | string | The name of the service type. | Optional |
| `price` | float | The monthly cost in USD of a service. | Optional |

#### Response

##### Response Body Format

JSON

##### Response Statuses

| Outcome | Status Code | Notes |
| :--- | :--- | :--- |
| **Success** | `200` | OK: Response body returns updated service. The self link is set to the updated service. |
| **Failure** | `400` | Bad Request: Request is missing all attributes, using an unsupported attribute, too many attributes, price is not a number, or using a negative value for price. |
| **Failure** | `403` | Forbidden: Client attempts to modify service_id or client. |
| **Failure** | `404` | Not Found: No service with the given service_id exists. |
| **Failure** | `406` | Not Acceptable: Request Accept header is not supported or is missing. |
| **Failure** | `415` | Unsupported Media Type: Request Content-Type header is not supported or is missing. |
| **Failure** | `500` | Internal Server Error: An unexpected error occurred. |

##### Response Examples

```json title="200 Created"
{
    "id": "2c53f59d-8d27",
    "name": "MVIDIA Mesla T4",
    "type": "IaaS",
    "price": 2100.00,
    "self": "http://<your-app>/services/2c53f59d-8d27"
}
```

```json title="400 Bad Request"
{
    "Error": "The request object is missing the following required attributes: name, type, price"
}
```

```json title="400 Bad Request"
{
    "Error": "The request object includes unsupported attributes: quantity"
}
```

```json title="400 Bad Request"
{
    "Error": "The price attribute must be a non-negative number"
}
```

```json title="403 Forbidden"
{
     "Error": "service_id cannot be modified"
}
```

```json title="403 Forbidden"
{
     "Error": "client_id cannot be modified"
}
```

```json title="404 Not Found"
{
    "Error": "No service with this service_id exists"
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

## # Delete a Service

`DELETE /services/:service_id`

**Description:** Updates one or more attributes of an existing service.

#### Required Permissions

None

#### Request

##### Path Parameters

| Name | Type | Description | Required? |
| :--- | :--- | :--- | :--- |
| `service_id` | string | The ID of the service. | Yes |

##### Request Header

| Field | Description | Required? |
| :--- | :--- | :--- |
| `Accept` | The format of the content to be returned. Must be `application/json`. | Yes |

##### Request Body

None


#### Response

##### Response Body Format

Success: None

Failure: JSON

##### Response Statuses

| Outcome | Status Code | Notes |
| :--- | :--- | :--- |
| **Success** | `204` | No Content: Service successfully deleted. If the service was linked to a client, it is automatically unlinked. |
| **Failure** | `404` | Not Found: No service with the given service_id exists. |

##### Response Examples

**Status: 204 No Content**

*The service was deleted successfully. No response body is returned.*



```json title="404 Not Found"
{
    "Error": "No service with this service_id exists"
}
```

---

## Notes

- The `Accept` header must be set to `application/json` for all requests.
- For `PATCH /services/:service_id`, at least one attribute (`name`, `type`, or `price`) must be provided in the request body.
- For `DELETE /services/:service_id`, if the service is linked to a client, the service is automatically unlinked from that client upon deletion.
- The `service_id` and `client` attributes cannot be modified using `PATCH /services/:service_id`.
- All service endpoints are publicly accessible and do not require authentication.