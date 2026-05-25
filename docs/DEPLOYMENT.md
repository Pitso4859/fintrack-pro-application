# FinTrack Pro — Render.com Deployment Guide

## Prerequisites
- GitHub account with the repo pushed
- Render.com account (free tier works)
- Docker Hub account (for backend image)
- Gemini API key from https://aistudio.google.com/app/apikey

---

## Option A: One-Click Deploy (Recommended)

1. Push code to GitHub
2. Go to https://dashboard.render.com
3. Click **New → Blueprint**
4. Connect your GitHub repo
5. Render reads `render.yaml` and provisions everything automatically
6. After deploy, set `GEMINI_API_KEY` manually in the backend service environment

---

## Option B: Manual Setup (Step by Step)

### Step 1: PostgreSQL Database

1. Render dashboard → **New → PostgreSQL**
2. Name: `fintrack-db`
3. Plan: Free
4. Click **Create Database**
5. Copy the **Internal Database URL** (starts with `postgres://`)

### Step 2: Backend Web Service

1. **New → Web Service**
2. Connect GitHub repo → select your repo
3. Settings:
   - **Name**: `fintrack-api`
   - **Environment**: `Docker`
   - **Dockerfile path**: `./backend/Dockerfile`
   - **Plan**: Free

4. Environment Variables:
```
SPRING_PROFILES_ACTIVE=prod
DATABASE_URL=<paste Internal Database URL from Step 1, change postgres:// to jdbc:postgresql://>
DATABASE_USERNAME=<from Render DB info>
DATABASE_PASSWORD=<from Render DB info>
DATABASE_DRIVER=org.postgresql.Driver
JPA_DIALECT=org.hibernate.dialect.PostgreSQLDialect
JWT_SECRET=<generate: openssl rand -hex 64>
JWT_EXPIRATION_MS=86400000
JWT_REFRESH_EXPIRATION_MS=604800000
GEMINI_API_KEY=<your Gemini API key>
CORS_ALLOWED_ORIGINS=https://fintrack-app.onrender.com
```

5. **Health Check Path**: `/actuator/health`
6. Click **Create Web Service**

### Step 3: Frontend Static Site

1. **New → Static Site**
2. Connect same GitHub repo
3. Settings:
   - **Name**: `fintrack-app`
   - **Build Command**: `cd frontend && npm ci && npm run build`
   - **Publish Directory**: `frontend/dist`

4. Environment Variables:
```
VITE_API_BASE_URL=https://fintrack-api.onrender.com/api
```

5. Rewrite rules:
   - Source: `/*`
   - Destination: `/index.html`
   - Action: Rewrite

6. Click **Create Static Site**

### Step 4: Update CORS

After both services are deployed, go back to the backend service environment and update:
```
CORS_ALLOWED_ORIGINS=https://fintrack-app.onrender.com,https://fintrack-api.onrender.com
```

---

## GitHub Actions Setup

Add these secrets in GitHub → Settings → Secrets:

| Secret | Value |
|--------|-------|
| `DOCKER_HUB_USERNAME` | Your Docker Hub username |
| `DOCKER_HUB_TOKEN` | Docker Hub access token |
| `RENDER_DEPLOY_HOOK_BACKEND` | From Render backend service → Settings → Deploy Hooks |
| `RENDER_DEPLOY_HOOK_FRONTEND` | From Render frontend service → Settings → Deploy Hooks |
| `RENDER_BACKEND_URL` | `https://fintrack-api.onrender.com` |
| `RENDER_FRONTEND_URL` | `https://fintrack-app.onrender.com` |

---

## Jenkins Setup (On-Premises)

### Required Credentials in Jenkins (Manage Jenkins → Credentials)

| Credential ID | Type | Value |
|--------------|------|-------|
| `docker-hub-credentials` | Username/Password | Docker Hub |
| `render-deploy-hook-backend` | Secret text | Render backend hook URL |
| `render-deploy-hook-frontend` | Secret text | Render frontend hook URL |
| `gemini-api-key` | Secret text | Your Gemini API key |

### Required Jenkins Plugins
- Pipeline
- Docker Pipeline
- JUnit
- JaCoCo
- Git

### Run pipeline
1. New Item → Pipeline
2. SCM: Git → your repo URL
3. Script Path: `Jenkinsfile`
4. Save → Build Now

---

## Verify Deployment

```bash
# Check backend health
curl https://fintrack-api.onrender.com/actuator/health

# Register a user
curl -X POST https://fintrack-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Alice","lastName":"Smith","email":"alice@test.com","password":"Password1!"}'

# Check Swagger docs
open https://fintrack-api.onrender.com/swagger-ui/index.html
```

---

## Free Tier Considerations

Render free services spin down after 15 min of inactivity. On first request, the backend may take 30–60 seconds to start. 

Options to avoid cold starts:
- Upgrade to Starter plan ($7/month)
- Use a cron service to ping `/actuator/health` every 10 min
- Self-host on a VPS (DigitalOcean, Hetzner)
