# GCP Docker Deployment - Quick Start

**Time:** ~30 minutes
**Platform:** Google Cloud Compute Engine
**Method:** Docker + Docker Compose
**Status:** Production Ready ✅

---

## ⚡ Quick Overview

```
1. Create GCP VM (5 min)
2. Install Docker (5 min)
3. Clone repo (2 min)
4. Configure .env (3 min)
5. Start containers (2 min)
6. Setup Nginx (5 min)
7. Test endpoints (3 min)
```

**Total Time:** ~25 minutes to live! 🚀

---

## 🎯 Step 1: Create GCP VM (5 minutes)

### 1.1 Go to Google Cloud Console
```
https://console.cloud.google.com
```

### 1.2 Create VM
1. **Compute Engine** → **VM Instances** → **Create Instance**
2. **Configure:**
   ```
   Name: living-heritage
   Region: asia-southeast1 (or nearest)
   Machine: e2-medium (2 vCPU, 4GB RAM)
   Boot disk: Ubuntu 20.04 LTS (20GB)
   ```
3. Click **"Create"** (wait 2-3 minutes)

### 1.3 Get IP Address
- In VM list, find **External IP** (e.g., `35.240.xxx.xxx`)
- Save this IP - you'll use it to access your site

---

## 🔐 Step 2: Configure Firewall (2 minutes)

### 2.1 Create Firewall Rules
In Google Cloud Console:

1. **VPC Network** → **Firewalls** → **Create Firewall Rule**

**Rule 1: HTTP**
```
Name: allow-http
Direction: Ingress
Protocols: TCP:80
Source: 0.0.0.0/0
```

**Rule 2: HTTPS**
```
Name: allow-https
Direction: Ingress
Protocols: TCP:443
Source: 0.0.0.0/0
```

**Rule 3: SSH**
```
Name: allow-ssh
Direction: Ingress
Protocols: TCP:22
Source: 0.0.0.0/0 (or restrict to your IP)
```

Click **"Create"** for each

---

## 🔑 Step 3: SSH into VM (2 minutes)

### 3.1 Connect via Browser SSH
Easiest method:

1. In **VM Instances** list
2. Click **VM name** → **SSH** button
3. Browser terminal opens (no setup needed!)

### 3.2 Or Use Local SSH
```bash
# Get SSH key from GCP metadata
# Then connect
ssh -i ~/.ssh/gcp_key ubuntu@35.xxx.xxx.xxx
```

---

## 🐳 Step 4: Install Docker (5 minutes)

### 4.1 Update System
```bash
sudo apt update
sudo apt upgrade -y
```

### 4.2 Install Docker
```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
```

### 4.3 Install Docker Compose
```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 4.4 Verify
```bash
docker --version
docker-compose --version
```

---

## 📦 Step 5: Clone Repository (2 minutes)

```bash
cd ~
git clone https://github.com/adminggc/livingheritage1125.git
cd livingheritage1125
```

Verify files:
```bash
ls -la
# Should see: docker-compose.yml, server.js, Dockerfile, etc.
```

---

## 🗄️ Step 6: Create Cloud SQL Database (5 minutes)

### 6.1 Create Database
1. **Cloud SQL** → **Instances** → **Create Instance**
2. **Select PostgreSQL**
3. **Configure:**
   ```
   Instance ID: living-heritage-db
   Root password: [strong password - SAVE THIS]
   Region: asia-southeast1 (same as VM)
   Machine type: db-f1-micro
   ```
4. Click **"Create"** (wait 5-10 min)

### 6.2 Create Database
1. Click **instance** → **Databases** tab
2. Click **"Create Database"**
3. Name: `livingheritage`
4. Click **"Create"**

### 6.3 Get Connection IP
1. Click **instance** → Overview
2. Find **Public IP** or **Private IP**
3. Save for next step

### 6.4 Initialize Schema
```bash
# From VM terminal
# Install psql if needed
sudo apt install -y postgresql-client

# Connect and create schema
psql -h YOUR_CLOUD_SQL_IP -U postgres -d livingheritage < database/schema.sql
# Enter password when prompted
```

---

## ⚙️ Step 7: Configure Docker Environment (3 minutes)

### 7.1 Create .env File
```bash
cd ~/livingheritage1125

cat > .env << 'EOF'
# App Settings
NODE_ENV=production
PORT=3000

# Database
DB_HOST=YOUR_CLOUD_SQL_IP
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=YOUR_DB_PASSWORD
DB_NAME=livingheritage

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# Features
USE_DATABASE=true
USE_CACHE=false

# Security
JWT_SECRET=generate-random-string-here-min-32chars
SESSION_SECRET=another-random-string-here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-strong-password

# CORS
CORS_ORIGIN=*
EOF
```

### 7.2 Verify .env
```bash
cat .env
# Should show your configuration
```

---

## 🚀 Step 8: Start Docker Containers (2 minutes)

### 8.1 Build Image
```bash
docker-compose build
```

### 8.2 Start Services
```bash
# Start in background
docker-compose up -d

# View status
docker-compose ps

# View logs
docker-compose logs -f
```

### 8.3 Wait for Startup
```bash
# Watch logs until you see:
# "Server running on port 3000"
# "Connected to PostgreSQL"

# Press Ctrl+C to exit logs
```

### 8.4 Test Local
```bash
curl http://localhost:3000/api/health
# Should return JSON with status
```

---

## 🌐 Step 9: Setup Nginx (5 minutes)

### 9.1 Install Nginx
```bash
sudo apt install -y nginx
```

### 9.2 Configure Nginx
```bash
sudo cat > /etc/nginx/sites-available/default << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
```

### 9.3 Test & Start Nginx
```bash
sudo nginx -t
# Should say: "syntax is ok, test is successful"

sudo systemctl restart nginx
```

---

## ✅ Step 10: Test Everything (3 minutes)

### 10.1 Test from Browser
Open these in your browser (replace `35.xxx.xxx.xxx` with your VM IP):

```
Homepage:  http://35.xxx.xxx.xxx/
Admin:     http://35.xxx.xxx.xxx/admin/
API Test:  http://35.xxx.xxx.xxx/api/health
```

### 10.2 Test APIs with curl
```bash
# From your local machine
VM_IP="35.xxx.xxx.xxx"

# Health check
curl http://$VM_IP/api/health

# Public APIs
curl http://$VM_IP/api/figures
curl http://$VM_IP/api/news
curl http://$VM_IP/api/tips

# Admin APIs
curl http://$VM_IP/api/admin/figures
curl http://$VM_IP/api/admin/news
curl http://$VM_IP/api/admin/tips
```

### 10.3 Expected Results
- ✅ Health check returns JSON
- ✅ APIs return data arrays
- ✅ Homepage loads in browser
- ✅ Admin panel shows interface

**If all pass: YOU'RE LIVE! 🎉**

---

## 🔗 Step 11: Configure Custom Domain (Optional)

### 11.1 Point Domain to VM
1. Go to your **domain registrar**
2. Find **DNS settings**
3. Create **A Record:**
   ```
   Type: A
   Name: @ or your subdomain
   Value: 35.xxx.xxx.xxx (your VM IP)
   TTL: 3600
   ```
4. Save and wait 15-30 minutes

### 11.2 Update Nginx
```bash
sudo nano /etc/nginx/sites-available/default
# Change: server_name _;
# To: server_name your-domain.com www.your-domain.com;

# Save: Ctrl+X, Y, Enter

sudo nginx -t
sudo systemctl restart nginx
```

### 11.3 Test Domain
```bash
curl http://your-domain.com/
# Should show Living Heritage homepage
```

---

## 🔒 Step 12: Setup SSL (Optional but Recommended)

### 12.1 Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 12.2 Get Certificate
```bash
# If you have a domain configured
sudo certbot --nginx -d your-domain.com

# Follow the prompts:
# - Enter email
# - Agree to terms
# - Choose to redirect HTTP to HTTPS
```

### 12.3 Test HTTPS
```bash
curl https://your-domain.com/
# Should work with HTTPS
```

---

## 📊 Monitoring & Logs

### View Logs
```bash
# Application logs
docker-compose logs -f app

# View specific number of lines
docker-compose logs --tail=50 app

# View all services
docker-compose logs -f
```

### Check Status
```bash
# Running containers
docker-compose ps

# Container details
docker ps -a

# Resource usage
docker stats
```

### View Nginx Logs
```bash
# Error logs
sudo tail -f /var/log/nginx/error.log

# Access logs
sudo tail -f /var/log/nginx/access.log
```

---

## 🔄 Update Application

### Pull Latest Code
```bash
cd ~/livingheritage1125
git pull origin master
```

### Rebuild & Restart
```bash
docker-compose down
docker-compose build
docker-compose up -d
```

### Zero-Downtime Update
```bash
docker-compose up -d --no-deps --build app
```

---

## 💾 Backups

### Backup Database
```bash
pg_dump -h YOUR_CLOUD_SQL_IP -U postgres -d livingheritage > backup.sql

# Download to local
# Open new terminal on local machine
scp -i ~/.ssh/gcp_key ubuntu@35.xxx.xxx.xxx:~/backup.sql ./
```

### Backup Application
```bash
tar -czf app_backup.tar.gz ~/livingheritage1125
```

---

## 🛠️ Troubleshooting

### Application not responding (502 error)
```bash
# Check containers running
docker-compose ps

# View logs
docker-compose logs app

# Restart
docker-compose restart app
```

### Database connection error
```bash
# Check .env has correct IP and password
cat .env | grep DB_

# Test connection
psql -h YOUR_CLOUD_SQL_IP -U postgres -d livingheritage -c "SELECT 1;"
```

### Nginx not forwarding
```bash
# Check syntax
sudo nginx -t

# Restart
sudo systemctl restart nginx

# Check logs
sudo tail -f /var/log/nginx/error.log
```

### Port already in use
```bash
# Find process using port 3000
sudo lsof -i :3000

# Stop that process
sudo kill -9 <PID>

# Or change Docker port in docker-compose.yml
```

---

## ✅ Quick Checklist

- [ ] VM created with External IP
- [ ] Firewall rules configured (HTTP, HTTPS, SSH)
- [ ] Docker installed and working
- [ ] Repository cloned
- [ ] Cloud SQL instance created
- [ ] Database schema initialized
- [ ] .env file configured with DB credentials
- [ ] Docker containers running (docker-compose ps)
- [ ] Application responds on localhost:3000
- [ ] Nginx installed and working
- [ ] Can access site via VM IP in browser
- [ ] All API endpoints return data
- [ ] Admin panel accessible

---

## 📍 Access Points

```
Homepage:       http://35.xxx.xxx.xxx/
Admin Panel:    http://35.xxx.xxx.xxx/admin/
API Health:     http://35.xxx.xxx.xxx/api/health
API Figures:    http://35.xxx.xxx.xxx/api/figures
API News:       http://35.xxx.xxx.xxx/api/news
API Tips:       http://35.xxx.xxx.xxx/api/tips
```

If using custom domain:
```
Homepage:       https://your-domain.com/
Admin Panel:    https://your-domain.com/admin/
APIs:           https://your-domain.com/api/*
```

---

## 💰 Cost

```
Monthly Costs:
- VM (e2-medium):     $20-30
- Cloud SQL:          $10-15
- Disk/Network:       $2-5
- Total:              ~$32-50/month
```

---

## 📞 Support

- **GCP Docs:** https://cloud.google.com/docs
- **Docker Docs:** https://docs.docker.com
- **GitHub Repo:** https://github.com/adminggc/livingheritage1125
- **Issues:** https://github.com/adminggc/livingheritage1125/issues

---

## 🎉 You're Live!

Congratulations! Your Living Heritage application is now running on Google Cloud with Docker! 🚀

**Next Steps:**
1. Share your VM IP or domain with your team
2. Create admin user accounts
3. Start adding content
4. Monitor logs and performance
5. Configure backups

**Happy deploying!** 🎊
