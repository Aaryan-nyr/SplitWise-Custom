# SplitWise-Custom

A centralised, custom solution for managing a shared household.

Inspired by Splitwise, **SplitWise-Custom** expands on group expense splitting to give housemates a single place to log expenses and coordinate household activities. 
It is designed to be self-hosted on a home server using Docker containers and exposed through **Cloudflare Tunnel**.

---

## Prerequisites
* **Node.js** and **npm**
* **Docker** and **Docker Compose**
* **Google OAuth Credentials:** Create an OAuth 2.0 Client ID for Google sign-in via the [Google Workspace Credentials Guide](https://developers.google.com/workspace/guides/create-credentials).
* Configure **.env.local** for local build and **.env.prod** for production 
---

## Setup & Commands

### Local Development (Local Node + Containerised DB)
```bash
# 1. Install dependencies
cd app && npm ci

# 2. Start the PostgreSQL database container
docker compose up -d db --env-file ./.env.local

# 3. Verify database connectivity
nc -vz localhost 5432

# 4. Run the app in dev mode
npm run dev
```

### Full containerised deployment

```bash
# 1. Build the web app Docker image
docker build -t household-split-web .

# 2. Verify the image exists
docker images household-split-web # expect image to be listed

# 3. Start all services in detached mode
docker compose up -d --env-file ./.env.prod -p <deployment_name>

# Check running container status
docker compose ps # expect the postgres, app, and cloudflare services

# Rebuild and restart services after code changes
docker compose up -d --build # rebuilds the services

# Stop and remove containers  with database volume intact
docker compose down
```