# GCP Deployment Guide for SyncoraXP

This document provides step-by-step instructions to deploy the SyncoraXP stack (Fastify API, React Frontend, LiveKit Server, and Translation Worker) on a Google Compute Engine (GCE) VM in the **`asia-south1` (Mumbai)** region, using **Neon/Supabase** for the database and **Caddy** for automated Let's Encrypt SSL.

---

## Prerequisites
1. A Google Cloud Platform (GCP) account.
2. A registered domain name (e.g. `yourdomain.com`) with DNS management access.
3. A Database connection string from **Neon** or **Supabase**.
4. An OpenAI or Gemini API Key for translations.
5. A ZeptoMail API Token for sending invitations.

---

## Step 1: Configure GCP Network and Firewall

LiveKit Server requires specific ports open to the public internet for WebRTC signaling and media transfer.

### 1.1 Reserve a Static Public IP Address
Reserve a static IP address in the `asia-south1` region so your VM doesn't change IP addresses when restarted.

Run the following command using the Google Cloud Shell (or your local `gcloud` CLI):
```bash
gcloud compute addresses create syncora-static-ip \
    --region=asia-south1 \
    --project=YOUR_PROJECT_ID
```
*Alternatively, in the GCP Console, go to: **VPC Network > IP addresses > Reserve external static IP address**.*

Note down the reserved static IP address (e.g., `35.244.X.Y`).

### 1.2 Create Firewall Rules
We need to open ports for Web web traffic, LiveKit WebSockets, and WebRTC media transport.

Run these commands in Cloud Shell to create the firewall rules:

1. **Allow HTTP and HTTPS (Ports 80, 443)**:
   ```bash
   gcloud compute firewall-rules create allow-http-https \
       --direction=INGRESS \
       --priority=1000 \
       --network=default \
       --action=ALLOW \
       --rules=tcp:80,tcp:443 \
       --source-ranges=0.0.0.0/0 \
       --target-tags=syncora-server
   ```

2. **Allow LiveKit TCP ICE Fallback (Port 7881)**:
   ```bash
   gcloud compute firewall-rules create allow-livekit-tcp \
       --direction=INGRESS \
       --priority=1000 \
       --network=default \
       --action=ALLOW \
       --rules=tcp:7881 \
       --source-ranges=0.0.0.0/0 \
       --target-tags=syncora-server
   ```

3. **Allow LiveKit UDP WebRTC Media (Port 7882)**:
   ```bash
   gcloud compute firewall-rules create allow-livekit-udp \
       --direction=INGRESS \
       --priority=1000 \
       --network=default \
       --action=ALLOW \
       --rules=udp:7882 \
       --source-ranges=0.0.0.0/0 \
       --target-tags=syncora-server
   ```

---

## Step 2: Configure Your DNS Records

Log in to your DNS registrar (e.g. GoDaddy, Namecheap, Cloudflare) and create the following two **A Records** pointing to your reserved VM Static IP:

| Type | Name (Host) | Value (Points to) | Description |
| :--- | :--- | :--- | :--- |
| **A** | `@` (or `syncora.com`) | `YOUR_VM_STATIC_IP` | Main domain for Web App & API |
| **A** | `livekit` | `YOUR_VM_STATIC_IP` | Subdomain for LiveKit Server |

> [!IMPORTANT]
> DNS propagation can take up to 30 minutes. Caddy will fail to spin up HTTPS certificates if DNS is not pointed to the VM IP first.

---

## Step 3: Launch Google Compute Engine (GCE) VM

We recommend an **`e2-medium`** (2 vCPUs, 4GB RAM) for starting, or an **`e2-standard-2`** (2 vCPUs, 8GB RAM) if you expect concurrent translation streams (as audio processing consumes memory).

### 3.1 Create Instance
Run the following command to provision a VM running Ubuntu 24.04 LTS:
```bash
gcloud compute instances create syncora-app-server \
    --zone=asia-south1-a \
    --machine-type=e2-medium \
    --subnet=default \
    --address=syncora-static-ip \
    --tags=syncora-server \
    --image-family=ubuntu-2404-lts \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size=30GB \
    --boot-disk-type=pd-ssd
```

---

## Step 4: Install Docker & Docker Compose on the VM

SSH into your new VM instance:
```bash
gcloud compute ssh syncora-app-server --zone=asia-south1-a
```

Run the following commands on the VM to install Docker and Docker Compose:
```bash
# Update package list and install prerequisites
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up the stable repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/供應/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verify installation
sudo docker --version
sudo docker compose version
```

---

## Step 5: Deploy the Code and Build Containers

### 5.1 Copy Code to VM
You can use `git clone` on the VM to fetch the codebase, or copy it over using `gcloud compute scp`.

For example, on your VM, clone your repository:
```bash
git clone YOUR_REPOSITORY_URL /home/$USER/syncoraxp
cd /home/$USER/syncoraxp
```

### 5.2 Configure Environment Variables
Copy `.env.production` to `.env.production` (or `.env` at the root folder) and configure your secrets:
```bash
cp .env.production .env.production
nano .env.production
```

Make sure you update:
- `DOMAIN_NAME` (e.g. `yourdomain.com`)
- `LIVEKIT_DOMAIN_NAME` (e.g. `livekit.yourdomain.com`)
- `DATABASE_URL` (Neon or Supabase connection string!)
- `APP_BASE_URL` and `CORS_ORIGIN` (`https://yourdomain.com`)
- `LIVEKIT_URL` (`wss://livekit.yourdomain.com`)
- `LIVEKIT_API_KEY` & `LIVEKIT_API_SECRET` (generate strong random secrets)
- ZeptoMail, Gemini/OpenAI API Keys.

### 5.3 Run Database Migrations
Since your database is Neon/Supabase, you can run migrations directly from the VM inside a one-off build container:
```bash
# Build the API container first
sudo docker compose -f docker-compose.prod.yml build api

# Run the migrations script compiled inside the dist folder
sudo docker compose -f docker-compose.prod.yml run --entrypoint "node dist/db/migrate.js" api
```

### 5.4 Start the Stack
Run Docker Compose to build and launch all containers in the background:
```bash
sudo DOMAIN_NAME=yourdomain.com LIVEKIT_DOMAIN_NAME=livekit.yourdomain.com docker compose -f docker-compose.prod.yml up -d --build
```
*Note: Caddy will automatically download Let's Encrypt certificates for the configured domains.*

---

## Step 6: Verify Deployment

1. **Check Container Status**:
   ```bash
   sudo docker compose -f docker-compose.prod.yml ps
   ```
   All services (`api`, `web`, `livekit`, `translation-worker`, `caddy`) should be in the `running` state.

2. **Verify Logs**:
   ```bash
   sudo docker compose -f docker-compose.prod.yml logs -f caddy
   sudo docker compose -f docker-compose.prod.yml logs -f api
   sudo docker compose -f docker-compose.prod.yml logs -f translation-worker
   ```

3. **Hit the Health Check**:
   Open `https://yourdomain.com` in your browser. It should load the SyncoraXP homepage with HTTPS.
