# Railway Deployment Guide

This guide will help you deploy the Task Scheduler application to Railway.

## Prerequisites

- GitHub account
- Railway account (sign up at https://railway.app)
- Your code pushed to a GitHub repository

## Step 1: Push Code to GitHub

1. Initialize a git repository if not already done:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. Create a new repository on GitHub

3. Push your code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/task-scheduler.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Deploy to Railway

1. Log in to Railway at https://railway.app

2. Click "New Project" → "Deploy from GitHub repo"

3. Select your `task-scheduler` repository

4. Railway will detect the services defined in `railway.toml`

5. Click "Deploy"

## Step 3: Configure Environment Variables

After deployment, you need to configure environment variables for each service:

### For `api-gateway`:

- `USER_SERVICE_URL`: The Railway URL of the user-service (e.g., `https://user-service-production.up.railway.app`)
- `TASK_SERVICE_URL`: The Railway URL of the task-service (e.g., `https://task-service-production.up.railway.app`)

### For `user-service`:

- `JWT_SECRET`: A secure 64+ character secret key for JWT signing
- `GOOGLE_CLIENT_ID`: (Optional) Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: (Optional) Your Google OAuth client secret
- `GITHUB_CLIENT_ID`: (Optional) Your GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET`: (Optional) Your GitHub OAuth client secret

### For `task-service`:

- `USER_SERVICE_URL`: The Railway URL of the user-service
- `JWT_SECRET`: Same as user-service JWT_SECRET

### For `frontend`:

- `API_BASE`: The Railway URL of the api-gateway (e.g., `https://api-gateway-production.up.railway.app`)

## Step 4: Get Service URLs

After deployment, Railway will provide URLs for each service:

- `api-gateway`: `https://api-gateway-xxxx.up.railway.app`
- `user-service`: `https://user-service-xxxx.up.railway.app`
- `task-service`: `https://task-service-xxxx.up.railway.app`
- `frontend`: `https://frontend-xxxx.up.railway.app`

Copy these URLs and set them as environment variables in the respective services.

## Step 5: Add Databases (Optional)

Railway will use H2 in-memory databases by default. For production, you can add PostgreSQL databases:

1. In Railway, click "New Service" → "Database" → "PostgreSQL"

2. Create 2 databases: `user-db` and `task-db`

3. Update environment variables:
   - For `user-service`: Set `DATABASE_URL` to the Railway PostgreSQL connection URL for `user-db`
   - For `task-service`: Set `DATABASE_URL` to the Railway PostgreSQL connection URL for `task-db`

## Step 6: Verify Deployment

1. Open the frontend URL in your browser

2. Try registering a new user

3. Create a project

4. Add tasks to the project

5. Verify all functionality works

## Troubleshooting

### Services not communicating

- Ensure `USER_SERVICE_URL` and `TASK_SERVICE_URL` are set correctly in api-gateway
- Ensure `USER_SERVICE_URL` is set correctly in task-service

### CORS errors

- The API Gateway CORS is configured to allow all origins, so this should not be an issue

### Database connection errors

- If using Railway PostgreSQL, ensure the DATABASE_URL is set correctly
- The format should be: `postgresql://username:password@host:port/database`

### Frontend not connecting to API

- Ensure `API_BASE` is set correctly in the frontend service
- The API_BASE should point to the api-gateway Railway URL

## Notes

- The application uses H2 in-memory databases by default, which is suitable for development/testing
- For production, use Railway PostgreSQL for data persistence
- JWT tokens expire after 24 hours (86400000 ms)
- OAuth2 is optional - the app works with email/password authentication
