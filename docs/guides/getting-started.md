# Getting Started

This guide walks you through setting up the ProvisionIO API locally for development.

---

## Prerequisites

- [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
- [WSL 2](https://learn.microsoft.com/en-us/windows/wsl/install) (enabled)
- Node.js 18+ and npm

---

## 1. Install Docker Desktop

1. Download [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/).
2. Run the installer and follow the setup wizard.
3. Enable **WSL 2** integration during installation (recommended).
4. Restart your computer if prompted.
5. Launch Docker Desktop and wait for it to start (you'll see the Docker whale icon in the system tray).

!!! tip
    Docker Desktop requires WSL 2 to be enabled. If you haven't enabled it, follow the [WSL 2 installation guide](https://learn.microsoft.com/en-us/windows/wsl/install).

---

## 2. Clone the Repository

```bash
git clone https://github.com/IWR2/ProvisionIO.git
cd ProvisionIO
```

---

## 3. Install Dependencies

```bash
npm install dotenv
npm install express
npm install -D nodemon
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
npm install express-oauth2-jwt-bearer
npm install express-openid-connect
npm install ejs
npm install auth0
```

---

## 4. Configure Environment Variables

Create a `.env` file in the project root:

!!! note
    Rename `.env.example` to `.env` and fill in your credentials to get started.

```env
# DynamoDB Local Configuration
DYNAMODB_ENDPOINT=http://localhost:8000
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=fakeMyKeyId
AWS_SECRET_ACCESS_KEY=fakeSecretKey

# Server Configuration
PORT=3000

# Web Secret generated with OpenSSL "openssl rand -hex 32"
WEB_SECRET=your_web_secret

# These are for express-openid-connect (web login)
WEB_CLIENT_ID=your_web_client_id
WEB_CLIENT_SECRET=your_web_client_secret
ISSUER_BASE_URL=https://your-tenant.us.auth0.com
WEB_BASE_URL=http://localhost:3000

# These are for express-oauth2-jwt-bearer (JWT validation)
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_AUDIENCE=https://your-api-identifier
AUTH0_SCOPES="openid profile email admin:access admin:table_create admin:table_delete"

# These are for Auth0 Management API (GET /users admin endpoint)
AUTH0_M2M_CLIENT_ID=your_m2m_client_id
AUTH0_M2M_CLIENT_SECRET=your_m2m_client_secret
```

!!! tip
    Generate your **WEB_SECRET** via `openssl rand -hex 32`.

---

## 5. Configure package.json Scripts

Add these scripts to your `package.json`:

```json
"scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js"
}
```

---

## 6. Start DynamoDB Local with Docker

**About DynamoDB Local**

DynamoDB Local is a downloadable version of DynamoDB that enables developers to develop and test applications using a version of DynamoDB running in your own development environment.

**Benefits**:

- No internet connection required
- Works with your existing DynamoDB API calls
- No provisioned throughput, data storage, or data transfer costs

**Steps**

1. Ensure Docker Desktop is running (you should see the Docker whale icon in your system tray).
2. Run DynamoDB Local in a container:

    ```bash
    docker run -d -p 8000:8000 --name dynamodb-local amazon/dynamodb-local:latest
    ```

3. Verify it's running:

    ```bash
    docker ps
    ```

**Expected Output**:

```text
CONTAINER ID   IMAGE                          STATUS          PORTS                    NAMES
xxxxxxxxxxx    amazon/dynamodb-local:latest   Up X seconds    0.0.0.0:8000->8000/tcp   dynamodb-local
```

!!! info
    DynamoDB Local requires `AWS_ACCESS_KEY_ID` to contain only letters (A–Z, a–z) and numbers (0–9) for version 2.0.0 and greater. The default values in `.env` (`fakeMyKeyId` and `fakeSecretKey`) work fine for local development.

    For more details, see the [DynamoDB Local usage notes](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html).

---

## 7. Set Up Auth0 (One-Time)

### Step 7.1: Create Auth0 Account and Applications

1. Register: Create a free account at [auth0.com](https://auth0.com/).

2. Initialize Web Application:

    - Navigate to **Dashboard → Applications → Applications**.
    - Name your web app.
    - Select **Regular Web Application**.

3. Retrieve Credentials:

    - Click on the **Settings** tab of your new application.
    - Locate and copy the following values:
        - **Domain**
        - **Client ID**
        - **Client Secret**

4. Configure Environment: Update your `.env` file with these values:

    ```env
    WEB_CLIENT_ID=your_web_client_id
    WEB_CLIENT_SECRET=your_web_client_secret
    ISSUER_BASE_URL=https://your-tenant.us.auth0.com
    ```

5. Configure Callback URLs for the Web App:

    - Scroll down to **Application URIs**.
    - Set your Allowed Callback URLs: ``http://localhost:3000/callback``.
    - Set your Allowed Logout URLs: ``http://localhost:3000``.
    - Add this to your `.env`: ``WEB_BASE_URL=http://localhost:3000``.

6. Your `.env` should look like this currently:

    ```env
    # Web Application Configuration
    WEB_CLIENT_ID=your_web_client_id
    WEB_CLIENT_SECRET=your_web_client_secret
    ISSUER_BASE_URL=https://your-tenant.us.auth0.com
    WEB_BASE_URL=http://localhost:3000
    ```

### Step 7.2: Authorize Web App to Access Your API

This step is required to receive an access_token that works with your API:

1. Initialize your Auth0 API:

    - Navigate to **Dashboard** → **Applications** → **APIs**.
    - Name your API.
    - Enter your custom Identifier for your API: ``https://your-api-endpoint``.
    - Click **Create**.
    - Click on the **Settings** tab.
    - Copy your Identifier: ``https://your-api-endpoint`` (Copy this for your `.env` below).

    ```env
    # Web Application Configuration
    WEB_CLIENT_ID=your_web_client_id
    WEB_CLIENT_SECRET=your_web_client_secret
    ISSUER_BASE_URL=https://your-tenant.us.auth0.com
    WEB_BASE_URL=http://localhost:3000
    
    # Auth0 Configuration
    AUTH0_DOMAIN=your-tenant.us.auth0.com
    AUTH0_AUDIENCE=https://your-api-endpoint
    ```

2. Enable RBAC to enable an Admin account to create and delete tables:
    
    - Scroll down to **RBAC Settings**.
    - Toggle **Enable RBAC** to **ON**.
    - Enable **Add Permissions** in the **Access Token** to **ON**.
    - Click **Save**.

3. Define Permissions:

    - Click on the **Permissions** Tab.
    - Add the following permissions:
        - `admin:access`
        - `admin:table_create`
        - `admin:table_delete`
        - `delete:users`
        - `read:users`

4. Authorize Web Application:

    - Click on the **Application Access** Tab.
    - Scroll down to your **Web App**.
    - Click on the **Edit** button of your **Web App**.
    - Click on **Grant Access** to your **User-Delegated Access**.

### Step 7.3: Create Admin Role and Assign Permission

1. Create the Admin Role:

    - Navigate to **Dashboard** → **User Management** → **Roles**.
    - Click **Create Role**.
    - **Name**: `Admin`
    - **Description**: `Full administrative access`
    - Click **Create**.
    - Click on the newly created **Admin** role.

2. Add Permissions to the Role:

    - Open your newly created **Admin** role.
    - Click on the **Permissions** Tab.
    - Click **Add Permissions**.
    - Select your **API** from the list.
    - Checkmark all required scopes:  `admin:access`, `admin:table_create`, `admin:table_delete`, `read:users`, and `delete:users`.
    - Click on **Add Permissions**.

3. Assign the role to Your User Account:

    - Click the **Users** tab (while still inside the Admin role).
    - Click on **Add Users**.
    - **Type** in the **name** of your user account you want to make Admin.
    - Click on **Assign**.

### Step 7.4: Configure Backend Management Access

This step enables your server to fetch the global list of users (the `GET /users` endpoint) by granting it administrative access to the **Auth0 Management API**.

1. Authorize the Management API:

    - Navigate to **Dashboard → Applications → APIs**.
    - Click on your **API (Test Application)**.
    - Click on the **API Access** tab.
    - Scroll to your Auth0 Management API.
    - Click on **Edit**.
    - Click on **Client Access**.
    - Checkmark all required scopes: `read:users` and `delete:users`.
    - Click on **Save**.

2. Retrieve M2M Credentials:

    - Click on the **Settings** tab.
    - Copy the **Client ID** and **Client Secret**.

3. Update Environment: Add these to your `.env` file:

    ```env
    # Auth0 Management API (M2M) 
    AUTH0_M2M_CLIENT_ID=your_m2m_client_id
    AUTH0_M2M_CLIENT_SECRET=your_m2m_client_secret
    ```

!!! info
    For more details, see the Auth0 documentation. [Auth0](https://auth0.com/docs/get-started/applications/application-access-to-apis-client-grants)

---

## 8. Start the API Server

```bash
npm run dev
```

**Expected Output**:

```text
Server running on http://localhost:3000
```

---

## 9. Create DynamoDB Table

### Using Postman (Recommended):

| Field | Value |
| :--- | :--- |
| **Method** | `POST` |
| **URL** | `http://localhost:3000/init` |
| **Headers** | `Authorization: Bearer YOUR_ADMIN_TOKEN` |
| **Body** | None needed |

Or using curl: 

```bash
curl -X POST http://localhost:3000/init -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected response**:

```json title="201 Created"
{
    "message": "ProvisionIO created successfully"
}
```

!!! tip
    You need an admin access token to call this endpoint. See [Step 10](#10-get-your-access-token-and-test-authentication) for instructions on obtaining one.

---

## 10. Get Your Access Token and Test Authentication

### Step 10.1: Log in and get your access token

1. Visit `http://localhost:3000/login` in your browser.
2. Click on **Login with Auth0** (email/password or Google).
3. Log in with your premade admin Auth0 account or register an account to your API with your Auth0 Web App.
4. Click on **Get Your JWT Token** to visit `http://localhost:3000/profile`.
5. Click on **Copy JWT** to copy your admin access token.
6. Use this admin access token for your bearer token.

### Step 10.2: Test the Admin protected endpoint

1. Open Postman.
2. Create a `GET` request to `http://localhost:3000/debug-scopes`.
3. Go to the **Authorization** tab and paste in your admin access token.
4. Your header should look like this below:

    | Field | Value |
    | :--- | :--- |
    | **Method** | `GET` |
    | **URL** | `http://localhost:3000/debug-scopes` |
    | **Headers** | `Authorization: Bearer YOUR_ADMIN_TOKEN` |

5. **Expected Response**:

```json title="200 OK"
{
    "scopes": "openid profile email",
    "fullPayload": {
        "iss": "https://your-tenant.us.auth0.com/",
        "sub": "auth0|01234",
        "aud": [
            "https://your-api-identifier",
            "https://your-tenant.us.auth0.com/userinfo"
        ],
        "iat": 99999,
        "exp": 99999,
        "scope": "openid profile email",
        "azp": "abc",
        "permissions": [
            "admin:access",
            "admin:table_create",
            "admin:table_delete",
            "delete:users",
            "read:users"
        ]
    }
}
```

---

## 11. Delete DynamoDB Table (Cleanup)

!!! warning
    This permanently deletes the table and **ALL** data (services, clients). This action cannot be undone.

### Using Postman (Recommended):

1. Open Postman.
2. Create a `DELETE` request to `http://localhost:3000/init`.
3. Go to the **Authorization** tab and paste in your admin access token.
4. Your header should look like this below:

    | Field | Value |
    | :--- | :--- |
    | **Method** | `DELETE` |
    | **URL** | `http://localhost:3000/init` |
    | **Headers** | `Authorization: Bearer YOUR_ADMIN_TOKEN` |

---

## 12. Stopping Services

1. **Stop the API server:**

    Press `Ctrl + C` in the terminal where `npm run dev` is running.

2. **Stop DynamoDB Local**:

    ```bash
    docker stop dynamodb-local
    docker rm dynamodb-local
    ```

3. **Shutdown WSL** (if needed):

    ```bash
    wsl --shutdown
    ```