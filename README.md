# ProvisionIO API
![Version 2.2](https://img.shields.io/badge/version-2.2-blue.svg)
![Docs](https://img.shields.io/badge/docs-mkdocs-4051B5.svg)
![Node](https://img.shields.io/badge/node.js-18.x-339933.svg)
![AWS](https://img.shields.io/badge/AWS-DynamoDB-FF9900.svg)

The documentation is built using [MkDocs](https://www.mkdocs.org/).

A modernized IaaS management system, refactored from a legacy GCP Datastore implementation to a serverless **AWS DynamoDB** architecture.

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

For detailed Auth0 configuration, local configuration, testing steps, and AWS Deployment please refer to the [Getting Started Guide](https://iwr2.github.io/ProvisionIO/guides/getting-started/).

## Documentation
**[View the Full Documentation](https://iwr2.github.io/ProvisionIO/)**

### Guides
* **[Getting Started](https://iwr2.github.io/ProvisionIO/guides/getting-started/):** Local development environment setup.
* **[Deployment Guide](https://iwr2.github.io/ProvisionIO/guides/deployment/):** AWS EC2 production blueprint.

### Data Model
* **[Overview](https://iwr2.github.io/ProvisionIO/model/):** DynamoDB single-table design, indexing strategies, and relationship management.

### API Reference
* **[API Directory](https://iwr2.github.io/ProvisionIO/api/endpoints/):** High-level summary of all endpoints.
* **[Global Behaviors](https://iwr2.github.io/ProvisionIO/api/behaviors/):** Standardized HTTP responses, request headers, and authentication requirements.
* **[Admin Endpoints](https://iwr2.github.io/ProvisionIO/api/admin/):** Privileged system operations, user auditing, and authentication diagnostics.
* **[Client Endpoints](https://iwr2.github.io/ProvisionIO/api/clients/):** Ownership-based management, service assignments, and secure resource access control.
* **[Service Endpoints](https://iwr2.github.io/ProvisionIO/api/services/):** Cloud service definitions, pagination support, and lifecycle updates.


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
| Version | Date | Description  |
| :--- | :--- | :--- |
| 2.2 |  June 29, 2026 | Production Ready: AWS EC2 + DynamoDB (Cloud) |
| 2.1 | June 19, 2026 | Infrastructure: Completed AWS EC2 deployment automation |
| 2.0 | May 31, 2026 | Core Refactor: Migration to Node.js/Express + local DynamoDB |
| 1.0 | June 1, 2022 | Legacy: Initial version (GCP App Engine + Datastore) | June 1, 2022 |