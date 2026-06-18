# Getting Started
## Prerequisites

- [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)

- [WSL 2](https://learn.microsoft.com/en-us/windows/wsl/install) (enabled)

- Node.js 18+ and npm

  

## 1. Clone the repository

```bash
git clone https://github.com/IWR2/ProvisionIO.git
cd ProvisionIO
```

  

## 2. Install Dependencies

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

  

## 3. Configure Environment Variables

Create a .env file in the project root:
Note: Rename `.env.example` to `.env` and fill in your credentials to get started.
```
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

Note: Generate your **WEB_SECRET** via` openssl rand -hex 32`.

## 4. Configure package.json Scripts

Add these scripts to your package.json
```
"scripts": {
  "dev": "nodemon server.js",
  "start": "node server.js"
}
```
## 5. Start DynamoDB Local with Docker

Start Docker Desktop and wait for it to be ready.
Run DynamoDB Local in a container:

```bash
docker run -d -p 8000:8000 --name dynamodb-local amazon/dynamodb-local:latest
```

Verify it's running:

```bash
docker ps
```

Expected Output:

```bash
CONTAINER ID   IMAGE                          STATUS          PORTS                    NAMES
xxxxxxxxxxx    amazon/dynamodb-local:latest   Up X seconds    0.0.0.0:8000->8000/tcp   dynamodb-local
```

## 6. Set Up Auth0 (One-Time)
### Step 6.1: Create Auth0 Account and Applications
1. Register: Create a free account at [auth0.com](https://auth0.com/).
2. Initialize Web Application:
	* Navigate to **Dashboard → Applications → Applications**.
	* Name your web app.
	* Select Regular Web Application.
3. Retrieve 
	* Click on the **Settings** tab of your new application.
	* Locate and copy the following values:
		* **Domain**
		* **Client ID**
		* **Client Secret**
4. **Configure Environment:** Update your `.env` file with these values:
	* ```
	  WEB_CLIENT_ID=your_web_client_id // Client ID
	  WEB_CLIENT_SECRET=your_web_client_secret // Client Secret
	  ISSUER_BASE_URL=https://your-tenant.us.auth0.com // Domain
	   ```
5. Configure Callback URLs for the Web App:
	* Scroll down to Application URIs
	* Set your Allowed Callback URLs: ``http://localhost:3000/callback``
	* Set your Allowed Logout URLs: ``http://localhost:3000``
	* Add this to your env:``WEB_BASE_URL=http://localhost:3000``
6. Your .env should look like this currently:
	* ```
	  # Web Application Configuration
	  WEB_CLIENT_ID=your_web_client_id // Client ID
	  WEB_CLIENT_SECRET=your_web_client_secret // Client Secret
	  ISSUER_BASE_URL=https://your-tenant.us.auth0.com // Domain
	  WEB_BASE_URL=http://localhost:3000
	  ```
###  Step 6.2: Authorize Web App to Access Your API

This step is required to receive an access_token that works with your API:

1. Initialize your Auth0 API:
	* Navigate to **Dashboard → Applications → APIs.
	* Name your API.
	* Enter your custom Identifier for your API: ``https://your-api-endpoint``.
	* Click Create.
	* Click on Settings tab.
	* Copy your Identifier: ``https://your-api-endpoint`` (Copy this for your `.env` below).
		* ```
		  # Web Application Configuration
		  WEB_CLIENT_ID=your_web_client_id // Client ID
		  WEB_CLIENT_SECRET=your_web_client_secret // Client Secret
		  ISSUER_BASE_URL=https://your-tenant.us.auth0.com // Domain
		  WEB_BASE_URL=http://localhost:3000
		  
		  # Auth0 Configuration
		  AUTH0_DOMAIN=your-tenant.us.auth0.com // Domain
		  AUTH0_AUDIENCE=https://your-api-endpoint // Identifier
		  ```
2. **Enable RBAC** to enable an Admin account to create and delete tables:
	* Scroll down to RBAC Settings
	* Toggle **Enable RBAC** to **ON**.
	* Enable **Add Permissions** in the **Access Token** to **ON**.
	* Click Save.
3. **Define Permissions**:
	* Click on the **Permissions** Tab
	* Add the following permissions:
		* `admin:access`
		* `admin:table_create`
		* `admin:table_delete`
		* `delete:users`
		* `read:users`
4. **Authorize Web Application**:
	* Click on the **Application Access** Tab.
	* Scroll down to your **Web App**.
	* Click on the **Edit** button of your **Web App**.
	* Click on **Grant Access** to your **User-Delegated Access**.
###  Step 6.3: Create Admin Role and Assign Permission

1. **Creating the Admin Role**:
	*  Navigate to **Dashboard** → **User Management** → **Roles**.
	* Click **Create Role**.
	* **Name**: `Admin`
	* **Description**: `Full administrative access`
	* Click **Create**.
	* Click on the newly created **Admin** role.
2. **Adding Permissions to the Role your API**:
	* Open your newly created **Admin** role.
	* Click on the **Permissions** Tab.
	* Click **Add Permissions**.
	* Select your **API** from the list.
	* Checkmark all required scopes:  `admin:access`, `admin:table_create`, `admin:table_delete`, `read:users`, and `delete:users`.
	* Click on **Add Permissions**.
3. **Assign the role to Yourself**:
	* Click the **Users** tab (while still inside the Admin role).
	* Click on **Add Users**.
	* **Type** in the **name** of you user account.
	* Click on **Assign**.

### Step 6.4: Configure Backend Management Access
This step enables your server to fetch the global list of users (the `GET /users` endpoint) by granting it administrative access to the Auth0 Management API.
1. **Authorize the Management API**:
	* Navigate to **Dashboard → Applications → APIs**.
	* Click on your **API (Test Application)**.
	* Click on the **API Access** tab.
	* Scroll to your Auth0 Management API.
	* Click on **Edit**.
	* Click on **Client Access**.
	* Check Mark all required scopes: `read:users` and `delete:users`.
	* Click on **Save**.
2. Retrieve M2M Credentials:
	* Click on the **Settings Tab**.
	* Copy the **Client ID** and **Client Secret**.
3. Update Environment: Add these to your .env file:
	* ```
	  # Auth0 Management API (M2M) 
	  AUTH0_M2M_CLIENT_ID=your_m2m_client_id
	  AUTH0_M2M_CLIENT_SECRET=your_m2m_client_secret
	  ```

For more details, see the Auth0 documentation. [Auth0](https://auth0.com/docs/get-started/applications/application-access-to-apis-client-grants)

## 7. Start the API Server

```bash
npm run dev
```

Expected output:
```bash
Server running on http://localhost:3000
```
##  8. Create DynamoDB Table

Using Postman (Recommended):

```bash
Field   Value
Method  POST
URL http://localhost:3000/init
Body    None needed
```

Or using curl:

```bash
curl -X POST http://localhost:3000/init
```

Expected response:

```bash
{
    "message": "Table created successfully"
}
```

  

If you run it again:

```bash
{
    "message": "Table already exists"
}
```

### 9. Get Your Access Token and Test Authentication

### Step 9.1: Log in and get your access token

1. Visit http://localhost:3000/login in your browser.
2. Log in with Auth0 (email/password or Google)
3. After login, visit http://localhost:3000/profile
4. Click the Copy JWT button to copy your access_token.

### Step 9.2: Test the protected endpoint in Postman

1. Open Postman.
2. Create a GET request to http://localhost:3000/protected.
3. Add a header:
* `Key: Authorization`
* `Value: Bearer Token YOUR_COPIED_TOKEN`

Expected response:

```bash
{
    "message": "You accessed a protected endpoint!",
    "user": "auth0|0123"
}
```

## 10. Delete DynamoDB Table (Cleanup)

Warning: This permanently deletes the table and ALL data (services, clients, users). This action cannot be undone.

Using Postman (Recommended):

```bash
Field   Value
Method  DELETE
URL http://localhost:3000/init
Body    None needed
```
## 11. Stopping Services
Stop the API server:
Press `Ctrl + C`in the terminal where npm run dev is running.

Stop DynamoDB Local:

```bash
docker stop dynamodb-local
docker rm dynamodb-local
```

Shutdown WSL (if needed)

```bash
wsl --shutdown
```