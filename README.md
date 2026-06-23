# ProvisionIO API Documentation

Documentation for the ProvisionIO REST API.

Built with [MkDocs](https://www.mkdocs.org/) and the [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/) theme.

## Features

- **Client Management** - Create, update, and delete client entities
- **Service Management** - Manage cloud services and link them to clients
- **Service Assignment** - Assign and remove services from clients
- **Authentication** - Secure JWT-based authentication with Auth0
- **Authorization** - Role-based access control (RBAC) with admin permissions
- **Data Privacy** - Strict data ownership verification through Auth0

### Serve Documentation Locally

```bash
# Create and activate virtual environment
python -m venv venv
venv\scripts\activate

# Install dependencies
python -m pip install mkdocs mkdocs-material

# Serve the documentation
mkdocs serve -f mkdocs.yml
```

## Documentation Contents

- [Getting Started](docs/guides/getting-started.md) - Local development setup
- [API Reference](docs/api/endpoints.md) - Complete API documentation
- [Admin Endpoints](docs/api/admin.md) - Administrative operations
- [Client Endpoints](docs/api/clients.md) - Client management
- [Service Endpoints](docs/api/services.md) - Service management
- [Data Model](docs/model.md) - Table Design overview

## Prerequisites

- Python 3.14
- pip
