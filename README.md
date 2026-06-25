# ProvisionIO API Documentation

The documentation is built using [MkDocs](https://www.mkdocs.org/).


## Purpose

I was interested in migrating an old project from GCP Google Datastore to AWS DynamoDB.


| Version | Change | Date |
| :--- | :--- | :--- |
| 2.1 | Production deployment to AWS Lambda| TBD |
| 2.0 | Migration to local DynamoDB | June 19, 2026 |
| 1.0 | Initial version (GCP App Engine + Datastore) | June 1, 2022 |


## What I Built

A serverless REST API for IaaS (Infrastructure as a Service) management. The project refactors legacy Node.js functions, replacing the GCP App Engine/Datastore stack with AWS Lambda and DynamoDB.


## Features

- **Client Management** - Create, update, and delete client entities
- **Service Management** - Manage cloud services and link them to clients
- **Service Assignment** - Assign and remove services from clients
- **Authentication** - Secure JWT-based authentication with Auth0
- **Authorization** - Role-based access control (RBAC) with admin permissions
- **Data Privacy** - Strict data ownership verification through Auth0

## Quick Start

### 1. Start DynamoDB Local with Docker
Open Docker Desktop, then run:

```bash
docker run -d -p 8000:8000 --name dynamodb-local amazon/dynamodb-local:latest
```

### 2. Clone and Install

```bash
git clone https://github.com/IWR2/ProvisionIO.git
cd ProvisionIO
npm install
cp .env.example .env
```


### 3. Start the API Server

```bash
npm run dev
```


### 4. Serve Documentation Locally

```bash
python -m venv venv  
venv\scripts\activate
python -m pip install mkdocs mkdocs-material
mkdocs serve
```

For detailed Auth0 configuration and testing steps, please refer to the [Getting Started Guide](docs/guides/getting-started.md).

## Documentation

- [Getting Started](docs/guides/getting-started.md) - Local development setup
- [API Reference](docs/api/endpoints.md) - Complete API documentation
- [Admin Endpoints](docs/api/admin.md) - Administrative operations
- [Client Endpoints](docs/api/clients.md) - Client management
- [Service Endpoints](docs/api/services.md) - Service management
- [Data Model](docs/model.md) - Single-Table Design overview


## Tech Stack

- **Backend**: Node.js + Express
- **Database**: AWS DynamoDB (local with DynamoDB Local for development)
- **Authentication**: Auth0 (JWT validation + RBAC)
- **Documentation**: MkDocs with Material for MkDocs theme
- **Deployment**: Local development with Docker


## Prerequisites

### API Development
- Node.js 18+
- npm
- Docker Desktop (for DynamoDB Local)
- WSL 2 (for Windows users)

### Documentation

- Python: 3.10+
- pip