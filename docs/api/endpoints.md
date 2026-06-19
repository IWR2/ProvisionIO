# API Endpoints Directory

This directory provides a high-level summary of all available API endpoints. For detailed request parameters, payloads, and response examples, please refer to the specific resource documentation.

## Admin Endpoints
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/init` | `POST` | Create the DynamoDB table (Admin only). |
| `/init` | `DELETE` | Delete the DynamoDB table (Admin only). |
| `/users` | `GET` | List all registered users (Admin only). |

## Client Management
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/clients` | `GET` | Retrieve all clients. |
| `/clients` | `POST` | Create a new client. |
| `/clients/:client_id` | `GET` | Retrieve a specific client by ID. |
| `/clients/:client_id` | `PUT` | Replace a specific client. |
| `/clients/:client_id` | `PATCH` | Update client details. |
| `/clients/:client_id` | `DELETE` | Delete a specific client. |
| `/clients/:client_id/services/:service_id` | `PUT` | Assign a service to a client. |
| `/clients/:client_id/services/:service_id` | `DELETE` | Unlink a service from a client. |

## Service Management
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/services` | `GET` | Retrieve all services. |
| `/services` | `POST` | Create a new service. |
| `/services/:service_id` | `GET` | Retrieve a specific service by ID. |
| `/services/:service_id` | `PUT` | Replace a service. |
| `/services/:service_id` | `PATCH` | Update service details. |
| `/services/:service_id` | `DELETE` | Remove a service. |

## Other Endpoints
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/` | `GET` | UI: API landing page / Status. |
| `/profile` | `GET` | UI: Retrieve JWT for API usage. |
| `/protected` | `GET` | Verify authentication. |
| `/debug-scopes` | `GET` | Debug JWT claims and permissions. |