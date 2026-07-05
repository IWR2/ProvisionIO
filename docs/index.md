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
| **2.2** | June 29, 2026 | Production Ready: AWS EC2 + DynamoDB (Cloud) |
| **2.1** | June 19, 2026 | Infrastructure: Completed AWS EC2 deployment automation |
| **2.0** | May 31, 2026 | Core Refactor: Migration to Node.js/Express + local DynamoDB |
| **1.0** | June 1, 2022 | Legacy: Initial version (GCP App Engine + Datastore) |

---

## High-Level Architecture

The API uses a Single-Table Design within DynamoDB.

*For a detailed look at how these entities relate, see the [Data Model Overview](model.md).*