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
```

### 3. Configure Environment Variables
Create a .env file in the project root:
```
# Server Configuration
PORT=3000

# DynamoDB Local Configuration
DYNAMODB_ENDPOINT=http://localhost:8000
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=fakeMyKeyId
AWS_SECRET_ACCESS_KEY=fakeSecretKey

# Auth0 Configuration (Get these from your Auth0 Dashboard)
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_AUDIENCE=https://your-api-identifier
```

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
1. Create a free account at auth0.com
2. Create a Regular Web Application and copy the Domain, Client ID, and Client Secret into your .env file.
3. Create an API with an identifier and copy it to .env
For more details, see the Auth0 documentation. [Auth0](https://auth0.com/docs/quickstart/backend/nodejs)

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

### 9. Test Authentication
1. Get a test JWT from Auth0 Dashboard → APIs → Your API → Test tab

2. In Postman, create a GET request to http://localhost:3000/protected

3. Add a header: Authorization: Bearer YOUR_TOKEN_HERE

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