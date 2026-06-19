# Welcome to ProvisionIO Documentation

Welcome to the official documentation for the **ProvisionIO REST API**. This REST API manages Clients and Cloud Services using **AWS DynamoDB**. It allows authenticated users to create clients, manage services, and map services to clients.

## API Overview
The ProvisionIO API allows authenticated users to:

* **Manage Clients:** Create, track, and update client entities.
* **Manage Services:** Handle cloud service resources and link them to specific clients.
* **Maintain Ownership:** Ensure strict data privacy through Auth0 identity verification.

!!! note "Quick Start"
    Before making your first request, ensure you have a valid JWT from [Auth0](https://auth0.com). Check the [Authentication Guide](guides/authentication.md) for details on authorization headers.

## Change Log

| Version | Date | Description |
| :--- | :--- | :--- |
| **2.0** | June 15, 2026 | Migration from Google Datastore to local AWS DynamoDB; updated routing. |
| **1.1** | June 1, 2022 | Initial deployment to Google App Engine. |
| **1.0** | May 16, 2022 | Initial local development completion. |

---

## High-Level Architecture
The API a Single-Table Design within DynamoDB.


*For a detailed look at how these entities relate, see the [Data Model Overview](model.md).*