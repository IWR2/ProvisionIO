## Getting Started

### Prerequisites
- [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
- [WSL 2](https://learn.microsoft.com/en-us/windows/wsl/install) (enabled)
- Node.js 18+ and npm

### 1. Clone the repository
```bash
git clone https://github.com/IWR2/ProvisionIO.git
cd ProvisionIO
```

### 2. Install Dependencies
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

### 3. Configure Environment Variables
Create a .env file in the project root:
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

# These are for Auth0 Management API (GET /users admin endpoint)
AUTH0_M2M_CLIENT_ID=your_m2m_client_id
AUTH0_M2M_CLIENT_SECRET=your_m2m_client_secret
```
Note: Generate your WEB_SECRET via openssl rand -hex 32.

### 4. Configure package.json Scripts
Add these scripts to your package.json:
```
"scripts": {
  "dev": "nodemon server.js",
  "start": "node server.js"
}
```

### 5. Start DynamoDB Local with Docker
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
CONTAINER ID   IMAGE                          STATUS          PORTS                    NAMES
xxxxxxxxxxx    amazon/dynamodb-local:latest   Up X seconds    0.0.0.0:8000->8000/tcp   dynamodb-local
```


### 6. Set Up Auth0 (One-Time)
Step 6.1: Create Auth0 Account and Applications
1. Create a free account at [auth0.com](https://auth0.com/)
2. Create a Regular Web Application (for web login):
* Name: Your Web App
* Type: Regular Web Application
* Copy Client ID, Client Secret, and Domain to .env as WEB_CLIENT_ID, WEB_CLIENT_SECRET, ISSUER_BASE_URL
3. Configure Callback URLs for the Web App:
* Allowed Callback URLs: http://localhost:3000/callback
* Allowed Logout URLs: http://localhost:3000
4. Name: Your API Name
* Identifier: https://your-api-identifier (copy to .env as AUTH0_AUDIENCE)
Step 6.2: Create an API for JWT Validation
This step is required to receive an access_token that works with your API:
1. Go to Auth0 Dashboard → Applications → APIs
2. Click Create API
3. Name your API
4. Copy your Identifier (copy to .env as AUTH0_AUDIENCE)
5. Click Create
Step 6.3: Enable RBAC and Add Permissions
1. Go to your API → Settings Tab
2. Scroll down to RBAC Settings
3. Toggle Enable RBAC ON
4. Toggle Add Permissions in the Access Token → ON
5. Click Save
6. Click on the Permissions tab
7. Click Add a Permission:
* Permission: read:users
* Description: Allows retrieving the list of all users
8. Click Add
Step 6.4: Create Admin Role and Assign Permission
1. Go to User Management → Roles
2. Click Create Role
3. Name: Admin
4. Description: Full administrative access
5. Click Create
6. Click on the Admin role → Permissions tab
7. Click Add Permissions
8. Select your ProvisionIO API and check read:users
9. Click Add Permissions
Step 6.5 Assign Admin Role to Your User
1. Go to User Management → Users
2. Click on your user account
3. Go to the Roles Tab
4. Click Assign Roles
5. Select Admin and click Assign
Step 6.6 Authorize Web App to Access Your API
This step is required to receive an access_token that works with your API:
1. Go to Auth0 Dashboard → Applications → APIs
2. Click on your API
3. Click on API Access
4. Click edit on your API
5. Click on Client Acess
6. Grant Acess
7. Select read:users
8. Click Save
Step 6.7 Grant Auth0 Management API to access your API
This step is required for the GET /users admin endpoint:
1. Go to Applications → API
2. Click on Auth0 Management API
3. Click on Application Access
4. Click Edit on your API
5. Click on Client Access and click on read:users.
6. Click Save.

Why this is required: Without this step, your web app cannot request an access_token for your API. The login flow will only return an id_token, which will be rejected by your protected endpoints.
For more details, see the Auth0 documentation. [Auth0](https://auth0.com/docs/get-started/applications/application-access-to-apis-client-grants)

### 7. Start the API Server
```bash
npm run dev
```

Expected output:
```bash
Server running on http://localhost:3000
```

### 8. Create DynamoDB Table
Using Postman (Recommended):
```bash
Field	Value
Method	POST
URL	http://localhost:3000/init
Body	None needed
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
Step 9.1: Log in and get your access token
1. Visit http://localhost:3000/login in your browser
2. Log in with Auth0 (email/password or Google)
3. After login, visit http://localhost:3000/profile
4. Click the Copy JWT button to copy your access_token

Step 9.2: Test the protected endpoint in Postman
1. Open Postman
2. Create a GET request to http://localhost:3000/protected
3. Add a header:
* Key: Authorization
* Value: Bearer Token YOUR_COPIED_TOKEN

Expected response:
```bash
{
    "message": "You accessed a protected endpoint!",
    "user": "auth0|123456789"
}
```

### Stopping Services

Stop the API server:
Press Ctrl + C in the terminal where npm run dev is running.

Stop DynamoDB Local:
```bash
docker stop dynamodb-local
docker rm dynamodb-local
```

Shutdown WSL (if needed)
```bash
wsl --shutdown
```