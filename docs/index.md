# Welcome to ProvisionIO Documentation

Welcome to the official documentation for the **ProvisionIO REST API**. This REST API manages Clients and Cloud Services using **AWS DynamoDB**. It allows authenticated users to create clients, manage services, and map services to clients.

## API Overview

The ProvisionIO API allows authenticated users to:

- **Manage Clients:** Create, track, and update client entities.
- **Manage Services:** Handle cloud service resources and link them to specific clients.
- **Maintain Ownership:** Ensure strict data privacy through Auth0 identity verification.

!!! note "Quick Start"
    New to the API? Start with the [Getting Started](guides/getting-started.md) guide to set up your local development environment and get your first API request working.

## Change Log

| Version | Date | Description |
| :--- | :--- | :--- |
| **2.0** | June 17, 2026 | Migration from Google Datastore to local AWS DynamoDB; updated routing. |
| **1.1** | June 1, 2022 | Initial deployment to Google App Engine. |
| **1.0** | May 16, 2022 | Initial local development completion. |

---

## High-Level Architecture

The API uses a Single-Table Design within DynamoDB.

*For a detailed look at how these entities relate, see the [Data Model Overview](model.md).*