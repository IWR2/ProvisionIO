# Global API Behaviors

All API endpoints follow these standardized behaviors. Please ensure your client is designed to handle these status codes consistently across the application.

## Standard HTTP Responses

| Outcome | Status Code | Notes |
| :--- | :--- | :--- |
| **Failure** | `405` | Method Not Allowed: HTTP method not supported for this endpoint. |
| **Failure** | `406` | Not Acceptable: Request `Content-Type` is not supported or is missing. |
| **Failure** | `500` | Internal Server Error: An unexpected server-side error occurred (e.g., database failure). |

## Request Standards
* **Content-Type:** All requests requiring a body must send `application/json`.
* **Authentication:** All private endpoints require a valid JWT passed in the `Authorization` header.