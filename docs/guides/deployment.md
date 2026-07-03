# Deployment Guide

This guide outlines the steps to deploy the ProvisionIO API to an AWS EC2 instance.

---

## 1. AWS Account & Resource Setup

### 1.1 Create AWS Account

1. Sign up for an account at [aws.amazon.com](https://aws.amazon.com/).

---

### 1.2 Create DynamoDB Table

1. Navigate to **AWS Console → DynamoDB → Tables**.
2. Click **Create table**.

#### Table Configuration

| Field | Value |
|-------|-------|
| **Table name** | `ProvisionIO` |
| **Partition key** | `EntityId` (String) |
| **Sort key** | `EntityType` (String) |

#### Table Settings

1. Under **Table settings**, select **Customize settings**.

2. **Read/write capacity settings**:
    - **Capacity mode**: Provisioned
    - **Read capacity**: Auto scaling
    - **Write capacity**: Auto scaling

3. Configure auto scaling settings:

    | Setting | Value |
    |---------|-------|
    | **Minimum Capacity Units** | `1` |
    | **Maximum Capacity Units** | `10` |
    | **Target Utilization (%)** | `70` |

4. Click **Add index** to create the following Global Secondary Indexes:

    | Index Name | Partition Key | Sort Key |
    |------------|---------------|----------|
    | `TypeIndex` | `EntityType` | `EntityId` |
    | `OwnerIndex` | `owner` | `EntityId` |
    | `ClientServiceIndex` | `clientId` | `EntityId` |

5. Click **Create table**.

!!! tip "Table Creation Time"
    The table creation process takes approximately 30 seconds to 1 minute. Wait for the status to change from **Creating** to **Active** before proceeding.

---

### 1.3 Create IAM Role for EC2

1. Navigate to **AWS Console → IAM → Roles**.
2. Click **Create role**.
3. **Select trusted entity**:
    - **Trusted entity type**: AWS Service
    - **Use case**: EC2
    - Click **Next**
4. **Add permissions**:
    - Search and select: `AmazonDynamoDBFullAccess`
    - Click **Next**
5. **Name, review, and create**:
    - **Role name**: `EC2-DynamoDB-Access`
    - Click **Create role**

---

### 1.4 Launch EC2 Instance

1. Navigate to **AWS Console → EC2 → Instances**.
2. Click **Launch instance**.

#### Instance Configuration

| Field | Value |
|-------|-------|
| **Name** | `provisionio-api` |
| **AMI** | Ubuntu Server (Free tier eligible) |
| **Instance type** | `t2.micro` (Free tier eligible) |
| **Key pair** | Create new key pair |

**Key pair details**:
- **Name**: `provisionio-key`
- **Key pair type**: RSA
- **Private key format**: `.pem`
- **Save the `.pem` file** to a secure location on your local machine

#### Network Settings

| Setting | Value |
|---------|-------|
| **Auto-assign public IP** | Enable |
| **Security group** | Create new security group |

**Security group rules**:

| Type | Protocol | Port | Source | Purpose |
|------|----------|------|--------|---------|
| SSH | TCP | `22` | My IP | Secure shell access |
| HTTP | TCP | `3000` | `0.0.0.0/0` | API server access |

#### Advanced Settings

1. Expand **Advanced details**.
2. Under **IAM instance profile**, select: `EC2-DynamoDB-Access`

!!! warning "IAM Role Required"
    Attaching the `EC2-DynamoDB-Access` role is critical. Without it, your EC2 instance cannot read from or write to DynamoDB.

3. Click **Launch instance**.

4. After the instance launches, copy the **Public IPv4 address** from the EC2 console.

!!! note "Save Your EC2 IP"
    Save this IP address. You'll need it for .env configuration (WEB_BASE_URL), your Auth0 ProvisionIO Web App callback and logout URLs, and Postman testing.

---

## 2. EC2 Instance Setup

### 2.1 Connect to EC2 Instance

**Using the EC2 Launch Console (Recommended)**

1. Navigate to **AWS Console → EC2 → Instances**.
2. Select your running instance (`provisionio-api`).
3. Click the **Connect** button at the top.
4. Choose the **EC2 Instance Connect** tab.
5. Click **Connect** to open a browser-based terminal session.

!!! tip "EC2 Instance Connect"
    EC2 Instance Connect provides a browser-based SSH client. No key pair or SSH client is required for this method.

---

**Using SSH (Alternative Method)**

If you prefer to use SSH from your terminal:

```bash
# Navigate to your key pair location
cd /path/to/your/key

# Fix permissions (Mac/Linux only)
chmod 400 provisionio-key.pem

# Connect to EC2 (replace YOUR_EC2_IP with your actual IP)
ssh -i provisionio-key.pem ubuntu@YOUR_EC2_IP
```

!!! tip "Windows Users"
    Use Git Bash or Windows Subsystem for Linux (WSL) to run the SSH command. PowerShell also works if you have OpenSSH installed.


### 2.2 Install Node.js and Git

```bash
# Install git and npm with node
sudo apt update
sudo apt install git -y
sudo apt install npm -y

# Verify installations
git -v
node -v
npm -v
```

### 2.3 Clone Repository

```bash
git clone https://github.com/IWR2/ProvisionIO.git
cd ProvisionIO
```

### 2.4 Install Dependencies

```bash
npm install
```

### 2.5 Configure Environment Variables

Create the `.env` file:

```bash
vim .env
```
1. Press `i` to enter Insert Mode.
2. Paste the following (replace `YOUR_EC2_IP` with your actual IP):

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# DynamoDB Local Configuration
DYNAMODB_ENDPOINT=https://dynamodb.us-east-1.amazonaws.com
AWS_REGION=us-east-1

# Web Secret generated with OpenSSL (copy from your local .env)
WEB_SECRET=your_web_secret

# Auth0 Web Login
WEB_CLIENT_ID=your_web_client_id
WEB_CLIENT_SECRET=your_web_client_secret
ISSUER_BASE_URL=https://your-tenant.us.auth0.com
WEB_BASE_URL=http://YOUR_EC2_IP:3000

# JWT Validation
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_AUDIENCE=https://your-api-identifier
AUTH0_SCOPES="openid profile email admin:access admin:table_create admin:table_delete"

# Auth0 Management API (M2M)
AUTH0_M2M_CLIENT_ID=your_m2m_client_id
AUTH0_M2M_CLIENT_SECRET=your_m2m_client_secret
```

To paste in the terminal:
* **Windows/Linux**: Right-click or `Ctrl+Shift+V`

3. Press `Esc` to exit Insert Mode.
4. Type `:wq` and press `Enter` to save and quit.

!!! warning "Important Configuration Changes"
    DYNAMODB_ENDPOINT must point to AWS DynamoDB, not localhost. WEB_BASE_URL must be your EC2 public IP. Remove AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY from the .env file when using an IAM role.

### 2.6 Update Auth0 Callback URLs

1. Log in to the [Auth0 Dashboard](https://manage.auth0.com/dashboard).
2. Navigate to **Applications → Applications → Your Web Application**.
3. Under **Application URIs**, add:

| Setting | Value |
|---------|-------|
| **Allowed Callback URLs** | `http://YOUR_EC2_IP:3000/callback` |
| **Allowed Logout URLs** | `http://YOUR_EC2_IP:3000` |

4. Click **Save**.

---

## 3. Run the API Server

### 3.1 Install PM2 (Process Manager)

PM2 keeps your Node.js application running continuously, even after you close your SSH session.

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version
```

### 3.2 Start the Server with PM2

```bash
# Start the server with PM2
pm2 start server.js --name provisionio-api
```

### 3.3 Save PM2 Configuration

Save the current PM2 process list so it restarts automatically on system reboot:

```bash
# Save the current process list
pm2 save

# Generate startup script
pm2 startup
```

### 3.4 Verify Server Status

```bash
# Check if the server is running
pm2 status

# View logs
pm2 logs provisionio-api

# View detailed information
pm2 show provisionio-api
```

### 3.5 Set Up Postman Testing

**Overview**

Your Postman environment requires:

* **1 Admin Account**: With full permissions for admin endpoints
* **3 Regular User Accounts**: For testing user-specific endpoints

#### Step 1: Import Postman Files

1. Download the Postman collection and environment files from the repository:
    * **Collection**: `ProvisionIO.postman_collection.json`
    * **Environment**: `ProvisionIO.postman_environment.json`
2. Open Postman.
3. Click **Import** and select both files.
4. Select the `ProvisionIO` environment from the environment dropdown.

#### Step 2: Create Auth0 User Accounts

1. Open a browser and navigate to your API: `http://YOUR_EC2_IP:3000`
2. Click Login with **Auth0**.
3. Click Sign Up to create your Admin Account:
    * Email: `admin@yourdomain.com` (or any valid email)
    * Password: Create a strong password

4. After signing up, go to **Auth0 Dashboard → User Management → Users**.
    * Find your admin user.
    * Click on the **Roles** Tab.
    * Assign the **Admin** role (as configured in Step 7.3 of the Getting Started guide).

5. Log out and repeat the sign-up process for three regular users:
    * User 1: `user1@yourdomain.com`
    * User 2: `user2@yourdomain.com`
    * User 3: `user3@yourdomain.com`

!!! note "Email Verification"
    If Auth0 requires email verification, check your email and verify each account before proceeding.

#### Step 3: Get Admin JWT Token

1. Log in as the Admin User at: `http://YOUR_EC2_IP:3000`.
2. Click Get Your JWT Token to visit `/profile`.
3. Click Copy JWT.
4. In Postman, open your `ProvisionIO` environment and set: 
    ```text
    admin_access_token = YOUR_ADMIN_JWT
    ```

#### Step 4: Get User JWT Tokens

Repeat the process for each of the three regular users:

1. Log in as User 1 at `http://YOUR_EC2_IP:3000`.
2. Navigate to `/profile` and copy the JWT.
3. In Postman, set:
    ```text
    user1_access_token = USER_1_JWT
    ```

4. Log out and repeat for **User 2** and **User 3**:
    ```text
    user2_access_token = USER_2_JWT
    user3_access_token = USER_3_JWT
    ```

#### Step 5: Update Base URL

In your Postman environment, set the `base_url` variable:

```text
base_url = http://YOUR_EC2_IP:3000
```

#### Step 6: Verify All Variables

Ensure all variables are populated in your Postman environment:

| Variable | Description | Example |
|------|------|------|
| `base_url` | Your EC2 API URL | `http://54.123.45.67:3000` |
| `admin_access_token` | Admin user JWT | `eyJhbG...` |
| `user1_access_token` | First regular user JWT | `eyJhbG...` |
| `user2_access_token` | Second regular user JWT | `eyJhbG...` |
| `user3_access_token` | Third regular user JWT | `eyJhbG...` |


#### Step 7: Run Your Postman Collection

1. Select the `ProvisionIO` collection.
2. Click **Run** to execute all requests.

## 4. Cleanup

!!! danger "Cleanup Required"
    To avoid ongoing AWS charges, delete all resources immediately after testing.

### 4.1 Stop and Remove PM2 Process

```bash
# Stop the PM2 process
pm2 stop provisionio-api

# Remove from PM2 list
pm2 delete provisionio-api

# Remove PM2 startup script (optional)
pm2 unstartup

# Exit EC2 (if using SSH)
exit
```

### 4.2 Terminate EC2 Instance

1. Navigate to **AWS Console → EC2 → Instances**.
2. Select your instance (`provisionio-api`).
3. Click **Instance State → Terminate**.
4. Confirm termination.

!!! tip "Verify Termination"
    The instance status will change from running to shutting-down to terminated. This takes about 1-2 minutes.

### 4.3 Delete DynamoDB Table

1. Navigate to **AWS Console → DynamoDB → Tables**.
2. Select the `ProvisionIO` table.
3. Click **Delete table**.
4. Confirm deletion.

!!! warning "Data Loss"
    Deleting the DynamoDB table permanently removes all data. This action cannot be undone.

### 4.4 Remove Auth0 URLs (Optional)

1. Log in to the [Auth0 Dashboard](https://manage.auth0.com/dashboard).
2. Navigate to **Applications → Applications → Your Web Application**.
3. Under **Application URIs**, remove:

| Setting | Value |
|---------|-------|
| **Allowed Callback URLs** | `http://YOUR_EC2_IP:3000/callback` |
| **Allowed Logout URLs** | `http://YOUR_EC2_IP:3000` |

4. Click **Save**.