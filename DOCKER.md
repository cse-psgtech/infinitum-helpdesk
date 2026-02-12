# Docker Deployment Guide

## Overview
This guide explains how to build and deploy the Infinitum Helpdesk application using Docker.

## Prerequisites
- Docker installed on your system
- Access to GitHub Container Registry (for pulling images)
- Environment variables configured

## GitHub Actions Setup

### Required Repository Secrets
To enable automatic Docker image building, add the following secrets to your GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://backendinfinitum.psgtech.ac.in` |
| `NEXT_PUBLIC_ADMIN_API_KEY` | Admin API key for authentication | `0582e5` |
| `NEXT_PUBLIC_HOST_IP` | Host IP for mobile scanner | `10.155.34.158` |
| `ADMIN_USERNAME` | Admin username | `admin` |
| `ADMIN_PASSWORD` | Admin password | `password` |
| `ADMIN_NAME` | Admin display name | `Admin` |

### Workflow Trigger
The Docker build workflow automatically triggers on:
- Push to `main` branch
- Manual workflow dispatch

The built image is pushed to: `ghcr.io/cse-psgtech/infinitum-helpdesk:latest`

## Building Docker Image Locally

### Build Command
```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://backendinfinitum.psgtech.ac.in \
  --build-arg NEXT_PUBLIC_ADMIN_API_KEY=your_api_key \
  --build-arg NEXT_PUBLIC_HOST_IP=10.155.34.158 \
  --build-arg ADMIN_USERNAME=admin \
  --build-arg ADMIN_PASSWORD=password \
  --build-arg ADMIN_NAME=Admin \
  -t infinitum-helpdesk:latest \
  .
```

## Running the Container

### Using Docker Run
```bash
docker run -d \
  --name infinitum-helpdesk \
  -p 4000:4000 \
  --restart unless-stopped \
  ghcr.io/cse-psgtech/infinitum-helpdesk:latest
```

### Using Docker Compose
Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  infinitum-helpdesk:
    image: ghcr.io/cse-psgtech/infinitum-helpdesk:latest
    container_name: infinitum-helpdesk
    ports:
      - "4000:4000"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
```

Then run:
```bash
docker-compose up -d
```

## Accessing the Application

Once the container is running, access the application at:
- **Local:** http://localhost:4000
- **Server:** http://your-server-ip:4000

## Container Management

### View logs
```bash
docker logs infinitum-helpdesk
```

### Follow logs in real-time
```bash
docker logs -f infinitum-helpdesk
```

### Stop container
```bash
docker stop infinitum-helpdesk
```

### Start container
```bash
docker start infinitum-helpdesk
```

### Restart container
```bash
docker restart infinitum-helpdesk
```

### Remove container
```bash
docker stop infinitum-helpdesk
docker rm infinitum-helpdesk
```

## Pulling from GitHub Container Registry

### Authenticate with GHCR
```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

### Pull latest image
```bash
docker pull ghcr.io/cse-psgtech/infinitum-helpdesk:latest
```

## Production Deployment on Linux Server

### Step 1: Install Docker
```bash
# Update package index
sudo apt-get update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER
```

### Step 2: Login to GHCR
```bash
# Create a GitHub Personal Access Token with `read:packages` scope
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### Step 3: Pull and Run
```bash
# Pull the latest image
docker pull ghcr.io/cse-psgtech/infinitum-helpdesk:latest

# Run the container
docker run -d \
  --name infinitum-helpdesk \
  -p 4000:4000 \
  --restart unless-stopped \
  ghcr.io/cse-psgtech/infinitum-helpdesk:latest
```

### Step 4: Setup Nginx Reverse Proxy (Optional)
Create `/etc/nginx/sites-available/infinitum-helpdesk`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/infinitum-helpdesk /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Updating to Latest Version

```bash
# Pull latest image
docker pull ghcr.io/cse-psgtech/infinitum-helpdesk:latest

# Stop and remove old container
docker stop infinitum-helpdesk
docker rm infinitum-helpdesk

# Run new container
docker run -d \
  --name infinitum-helpdesk \
  -p 4000:4000 \
  --restart unless-stopped \
  ghcr.io/cse-psgtech/infinitum-helpdesk:latest
```

## Troubleshooting

### Container not starting
```bash
# Check logs
docker logs infinitum-helpdesk

# Check if port is already in use
sudo netstat -tulpn | grep 4000
```

### Image pull fails
```bash
# Verify authentication
docker login ghcr.io

# Check image exists
docker pull ghcr.io/cse-psgtech/infinitum-helpdesk:latest
```

### Application not accessible
```bash
# Check if container is running
docker ps

# Check container health
docker inspect infinitum-helpdesk

# Verify port mapping
docker port infinitum-helpdesk
```

## Security Notes

1. **Never commit secrets** to the repository
2. **Use GitHub Secrets** for sensitive values in CI/CD
3. **Rotate API keys** regularly
4. **Use HTTPS** in production with SSL certificates
5. **Keep Docker images updated** for security patches

## Support

For issues or questions, please contact the development team or create an issue in the repository.
