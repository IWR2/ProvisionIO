# ProvisionIO API
![Version 2.2](https://img.shields.io/badge/version-2.2-blue.svg)
![Docs](https://img.shields.io/badge/docs-mkdocs-4051B5.svg)
![Node](https://img.shields.io/badge/node.js-18.x-339933.svg)
![AWS](https://img.shields.io/badge/AWS-DynamoDB-FF9900.svg)

The documentation is built using [MkDocs](https://www.mkdocs.org/).

A serverless REST API for IaaS management, migrated from Google Datastore to **AWS DynamoDB**.

---

## Features
- **Client Management** - Create, update, and delete client entities
- **Service Management** - Manage cloud services and link them to clients
- **Service Assignment** - Assign and remove services from clients
- **Authentication** - Secure JWT-based authentication with Auth0
- **Authorization** - Role-based access control (RBAC) with admin permissions
- **Data Privacy** - Strict data ownership verification through Auth0

## Quick Start

### Local Development
For rapid testing on your machine, open Docker Desktop, then run:
```bash
git clone [https://github.com/IWR2/ProvisionIO.git](https://github.com/IWR2/ProvisionIO.git)
cd ProvisionIO
npm install
# Add your credentials from Auth0 and AWS here
cp .env.example .env

# Start DynamoDB Local
docker run -d -p 8000:8000 --name dynamodb-local amazon/dynamodb-local:latest

# Run the API
npm run dev
```

### Serve Documentation Locally
```bash
python -m venv venv  
venv\scripts\activate
python -m pip install mkdocs mkdocs-material
mkdocs serve
```

For detailed Auth0 configuration, local configuration, testing steps, and AWS Deployment please refer to the [Getting Started Guide](docs/guides/getting-started.md).

## Documentation
**[View the Full Documentation](https://iwr2.github.io/ProvisionIO/)**

### Guides
* **[Getting Started](docs/guides/getting-started.md):** Local development environment setup.
* **[Deployment Guide](docs/guides/deployment.md):** AWS EC2 production blueprint.

### Data Model
* **[Overview](docs/model.md):** Single-Table Design optimization strategy.

### API Reference
* **[API Directory](docs/api/endpoints.md):** High-level summary of all endpoints.
* **[Global Behaviors](docs/api/behaviors.md):** Authentication and common API patterns.
* **[Admin Endpoints](docs/api/admin.md):** Administrative operations.
* **[Client Endpoints](docs/api/clients.md):** Client management.
* **[Service Endpoints](docs/api/services.md):** Service management.


## Tech Stack
- **Backend**: Node.js + Express
- **Database**: AWS DynamoDB (Local + Production)
- **Authentication**: Auth0 (JWT + RBAC)
- **Documentation**: MkDocs with Material theme
- **Deployment**: AWS EC2 (Automated)

## Prerequisites
- **API**: Node.js 18+, npm, Docker Desktop, WSL 2.
- **Docs**: Python 3.10+, pip.

## Change Log
| Version | Change | Date |
| :--- | :--- | :--- |
| 2.2 | Production Ready: AWS EC2 + DynamoDB (Cloud) | June 29, 2026 |
| 2.1 | Infrastructure: Completed AWS EC2 deployment automation | June 19, 2026 |
| 2.0 | Core Refactor: Migration to Node.js/Express + local DynamoDB | May 31, 2026 |
| 1.0 | Legacy: Initial version (GCP App Engine + Datastore) | June 1, 2022 |