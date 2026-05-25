# GitHub Actions — Required Secrets

Add these under: **GitHub repo → Settings → Secrets and variables → Actions**

## Repository Secrets

| Name | Description | How to get |
|------|-------------|------------|
| `DOCKER_HUB_USERNAME` | Your Docker Hub username | https://hub.docker.com |
| `DOCKER_HUB_TOKEN`    | Docker Hub access token (not password) | Docker Hub → Account Settings → Security → New Access Token |
| `RENDER_DEPLOY_HOOK_BACKEND`  | Backend deploy webhook URL | Render dashboard → Backend service → Settings → Deploy Hooks |
| `RENDER_DEPLOY_HOOK_FRONTEND` | Frontend deploy webhook URL | Render dashboard → Frontend service → Settings → Deploy Hooks |
| `RENDER_BACKEND_URL`  | e.g. `https://fintrack-api.onrender.com` | Render backend service URL |
| `RENDER_FRONTEND_URL` | e.g. `https://fintrack-app.onrender.com` | Render frontend service URL |

## How to Generate a Secure JWT Secret

```bash
# On Linux/Mac:
openssl rand -hex 64

# On Windows PowerShell:
[System.Web.Security.Membership]::GeneratePassword(64, 0)
```

## Environment Names

The deploy job uses `environment: production`. 
Create this environment in GitHub: **Settings → Environments → New environment → production**

You can add required reviewers here for production deploys.
