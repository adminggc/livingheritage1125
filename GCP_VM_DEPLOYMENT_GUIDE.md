# Google Cloud VM Deployment Guide - Living Heritage

**Status:** Ready for GCP Deployment ✅
**Platform:** Google Cloud Compute Engine
**Estimated Setup Time:** 30-45 minutes
**Cost:** ~$20-50/month (depending on VM size)

---

## 📋 Prerequisites

- ✅ Google Cloud account (free trial available: $300 credit)
- ✅ Project created in Google Cloud Console
- ✅ Billing enabled
- ✅ Code pushed to GitHub
- ✅ SSH key pair (will generate if needed)

---

## 🚀 Step 1: Create Google Cloud Project

### 1.1 Access Google Cloud Console
1. Go to **https://console.cloud.google.com**
2. Sign in with your Google account
3. Create a new project:
   - Click **"Select a Project"** → **"New Project"**
   - Name: `living-heritage`
   - Click **"Create"**
4. Wait for project to be created

### 1.2 Enable Required APIs
1. Go to **"APIs & Services"** → **"Library"**
2. Search and enable these APIs:
   - **Compute Engine API**
   - **Cloud SQL Admin API**
   - **Service Networking API**
3. Each should show **"Enabled"** status

---

## 🖥️ Step 2: Create Compute Engine VM

### 2.1 Create VM Instance
1. Go to **Compute Engine** → **VM Instances**
2. Click **"Create Instance"**
3. Configure:
   ```
   Name: living-heritage-prod
   Region: asia-southeast1 (Singapore) or your preferred region
   Zone: asia-southeast1-a
   Machine type: e2-medium (2 vCPU, 4GB RAM)
   Boot disk: Ubuntu 20.04 LTS (20GB)
   ```
4. Click **"Create"**
5. Wait 2-3 minutes for VM to start

### 2.2 Configure Firewall Rules
1. VM is created → Click on it
2. Go to **Network interfaces** section
3. Click on **default** network
4. Go to **Firewalls** → **Create Firewall Rule**
5. Create rule:
   ```
   Name: allow-http
   Direction: Ingress
   Priority: 1000
   Protocols: TCP port 80
   Source IPs: 0.0.0.0/0
   ```
6. Create another for HTTPS:
   ```
   Name: allow-https
   Direction: Ingress
   Protocol: TCP port 443
   Source IPs: 0.0.0.0/0
   ```
7. Create another for SSH:
   ```
   Name: allow-ssh
   Direction: Ingress
   Protocol: TCP port 22
   Source IPs: 0.0.0.0/0 (or restrict to your IP)
   ```

### 2.3 Get VM Details
1. In **VM Instances** list, find your instance
2. Note the **External IP** (looks like: `35.x.x.x`)
3. This is your server IP address

---

## 🔐 Step 3: Connect to VM via SSH

### 3.1 Generate SSH Key (if needed)
```bash
# From your local machine
ssh-keygen -t rsa -b 4096 -f ~/.ssh/gcp_key
# Press Enter for passphrase (or set one)
```

### 3.2 Add SSH Key to GCP
1. In Google Cloud Console → **Compute Engine** → **Metadata**
2. Go to **SSH Keys** tab
3. Click **"Add SSH Key"**
4. Paste your public key:
   ```bash
   cat ~/.ssh/gcp_key.pub
   ```
5. Save

### 3.3 Connect to VM
```bash
# Replace 35.x.x.x with your External IP
ssh -i ~/.ssh/gcp_key ubuntu@35.x.x.x
```

You should now be connected to your VM terminal.

---

## 🐳 Step 4: Install Docker & Docker Compose

### 4.1 Update System
```bash
sudo apt update
sudo apt upgrade -y
```

### 4.2 Install Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
```

### 4.3 Install Docker Compose
```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 4.4 Verify Installation
```bash
docker --version
docker-compose --version
```

---

## 📦 Step 5: Clone Repository

### 5.1 Install Git (if needed)
```bash
sudo apt install -y git
```

### 5.2 Clone Living Heritage
```bash
cd ~
git clone https://github.com/adminggc/livingheritage1125.git
cd livingheritage1125
```

### 5.3 View Files
```bash
ls -la
# Should see: docker-compose.yml, server.js, package.json, etc.
```

---

## 🗄️ Step 6: Create Cloud SQL Database (Recommended)

### 6.1 Create Cloud SQL Instance
1. Go to **Cloud SQL** → **Instances**
2. Click **"Create Instance"** → **"PostgreSQL"**
3. Configure:
   ```
   Instance ID: living-heritage-db
   Password: [strong password - save this!]
   Database version: PostgreSQL 13
   Region: Same as your VM (asia-southeast1)
   Machine type: db-f1-micro (cheapest, good for dev)
   ```
4. Click **"Create Instance"**
5. Wait 5-10 minutes

### 6.2 Create Database
1. Click on the instance
2. Go to **Databases** tab
3. Click **"Create Database"**
4. Name: `livingheritage`
5. Click **"Create"**

### 6.3 Get Connection Details
1. In instance overview, find:
   - **Private IP address** (if VM is in same VPC)
   - **Public IP address** (if connecting from outside)
2. Note the connection string

### 6.4 Initialize Schema
```bash
# From your local machine or VM
psql "postgresql://postgres:PASSWORD@CLOUD_SQL_IP/livingheritage" < database/schema.sql

# Or use Cloud SQL Proxy from VM
cloud_sql_proxy -instances=PROJECT_ID:REGION:INSTANCE=tcp:5432 &
psql -h localhost -U postgres -d livingheritage < database/schema.sql
```

---

## 🔧 Step 7: Configure Environment Variables

### 7.1 Create .env file on VM
```bash
ssh -i ~/.ssh/gcp_key ubuntu@35.x.x.x

cd ~/livingheritage1125
cat > .env << 'EOF'
# Application
NODE_ENV=production
PORT=3000

# Database (Cloud SQL)
DB_HOST=your-cloud-sql-ip
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-strong-password
DB_NAME=livingheritage

# Redis (optional - can use Cloud Memorystore or local)
REDIS_HOST=your-redis-ip
REDIS_PORT=6379
REDIS_PASSWORD=optional

# Features
USE_DATABASE=true
USE_CACHE=false
ENABLE_QUERY_LOGGING=false

# Security
JWT_SECRET=generate-random-string-here
SESSION_SECRET=generate-random-string-here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=strong-password-here

# CORS
CORS_ORIGIN=*
EOF
```

### 7.2 Verify .env
```bash
cat .env
```

---

## 🚀 Step 8: Deploy with Docker Compose

### 8.1 Build Docker Image
```bash
cd ~/livingheritage1125
docker-compose build
```

### 8.2 Start Application
```bash
# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 8.3 Verify Application
```bash
# Test local (from VM)
curl http://localhost:3000/api/health
curl http://localhost:3000/

# Should return JSON or HTML
```

---

## 🌐 Step 9: Setup Nginx Reverse Proxy

### 9.1 Install Nginx
```bash
sudo apt install -y nginx
```

### 9.2 Configure Nginx
```bash
sudo cp nginx/default.conf /etc/nginx/sites-available/default
# Or create manually:
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

### 9.3 Test & Restart Nginx
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 9.4 Test Web Access
```bash
# From your local machine
curl http://35.x.x.x/
# Should show Living Heritage homepage
```

---

## 🔒 Step 10: Setup SSL with Let's Encrypt

### 10.1 Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 10.2 Get Certificate (if you have a domain)
```bash
# Replace your-domain.com with your actual domain
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
# Follow prompts
# Choose to redirect HTTP to HTTPS
```

### 10.3 Auto-Renew Certificates
```bash
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### 10.4 Test HTTPS
```bash
# After certbot completes
curl https://your-domain.com/
# Should show homepage with HTTPS
```

---

## 📊 Step 11: Configure Custom Domain (Optional)

### 11.1 Point Domain to VM
1. Go to your domain registrar (GoDaddy, Namecheap, etc.)
2. Find DNS settings
3. Create **A Record**:
   ```
   Type: A
   Name: @ (or subdomain)
   Value: 35.x.x.x (your VM's External IP)
   ```
4. Wait 15-30 minutes for DNS propagation

### 11.2 Verify Domain
```bash
nslookup your-domain.com
# Should show your VM's IP
```

### 11.3 Update Nginx for Domain
```bash
sudo nano /etc/nginx/sites-available/default
# Change: server_name _;
# To: server_name your-domain.com www.your-domain.com;

sudo nginx -t
sudo systemctl restart nginx
```

---

## 📈 Step 12: Setup Monitoring & Logging

### 12.1 View Container Logs
```bash
# View all logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# View specific service
docker-compose logs app
```

### 12.2 Monitor VM Resources
1. In Google Cloud Console → **Monitoring** → **Dashboards**
2. Create custom dashboard to monitor:
   - CPU usage
   - Memory usage
   - Disk space
   - Network traffic

### 12.3 Setup Email Alerts (Optional)
1. **Monitoring** → **Alert Policies**
2. Create alerts for:
   - High CPU (>80%)
   - High memory (>85%)
   - Disk full (>90%)

---

## 🔄 Step 13: Database Backups

### 13.1 Automatic Cloud SQL Backups
1. Cloud SQL instance → **Backups**
2. Click **"Create Backup"**
3. Set automatic backups:
   - Go to **Edit Instance**
   - Find **Backup configuration**
   - Enable automatic backups
   - Set frequency: Daily
   - Set retention: 30 days

### 13.2 Manual Backup Command
```bash
# From VM
pg_dump -h your-cloud-sql-ip -U postgres -d livingheritage > backup.sql

# Download to local
scp -i ~/.ssh/gcp_key ubuntu@35.x.x.x:~/backup.sql ./
```

---

## 🧪 Step 14: Verify Deployment

### 14.1 Test All Endpoints
```bash
# From your local machine
DOMAIN="http://35.x.x.x" # or your domain

# Test health
curl $DOMAIN/api/health

# Test public endpoints
curl $DOMAIN/api/figures
curl $DOMAIN/api/news
curl $DOMAIN/api/tips

# Test admin endpoints
curl $DOMAIN/api/admin/figures

# Test homepage
curl $DOMAIN/
```

### 14.2 Access Admin Panel
```
http://35.x.x.x/admin/
# or
https://your-domain.com/admin/
```

### 14.3 Check Database Connection
```bash
# SSH into VM
ssh -i ~/.ssh/gcp_key ubuntu@35.x.x.x

# Check Docker logs
docker-compose logs app | grep -i database

# Should see: "Connected to PostgreSQL" or similar
```

---

## 🔒 Security Checklist

- [ ] Firewall rules configured (HTTP, HTTPS, SSH)
- [ ] SSH key-based auth (no password login)
- [ ] Strong database password set
- [ ] .env file with strong secrets
- [ ] SSL/HTTPS enabled and working
- [ ] Automatic backups configured
- [ ] Monitoring and alerts enabled
- [ ] Regular log reviews scheduled
- [ ] Access restricted to necessary IPs
- [ ] Keep system packages updated

---

## 🛠️ Troubleshooting

### Issue: Cannot connect to VM
```bash
# Check firewall rules allow SSH (port 22)
# Verify SSH key has correct permissions
chmod 600 ~/.ssh/gcp_key
```

### Issue: Docker containers not starting
```bash
docker-compose logs
# Check: .env file exists and has correct values
# Check: Disk space: df -h
# Check: Docker running: docker ps
```

### Issue: Application not responding
```bash
# Check port 3000 is listening
docker-compose ps
# Check application logs
docker-compose logs app
# Verify database connection
# Check .env variables
```

### Issue: Database connection failed
```bash
# Test connection from VM
psql -h $DB_HOST -U postgres -d livingheritage -c "SELECT 1;"
# Check .env has correct DB credentials
# Verify Cloud SQL allows connections from VM
```

### Issue: Nginx showing "502 Bad Gateway"
```bash
# Check app is running
docker-compose ps
# Check Nginx config
sudo nginx -t
# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Issue: Let's Encrypt certificate failed
```bash
# Check domain DNS resolves
nslookup your-domain.com
# Check firewall allows port 80 and 443
# Try manual renewal
sudo certbot renew --dry-run
```

---

## 📈 Performance Optimization

### Enable Caching
```bash
# Edit .env
USE_CACHE=true

# Redeploy
docker-compose down
docker-compose up -d
```

### Database Optimization
```bash
# Create indexes
psql -h $DB_HOST -U postgres -d livingheritage << 'EOF'
CREATE INDEX idx_published ON heritage_figures(published);
CREATE INDEX idx_language ON heritage_figures(language);
CREATE INDEX idx_published_news ON news_articles(published);
CREATE INDEX idx_language_news ON news_articles(language);
EOF
```

### Upgrade VM if Needed
1. Stop running containers
2. In Google Cloud → VM Instance → **Change Machine Type**
3. Choose larger machine (e2-standard-2, etc.)
4. Restart containers

---

## 🔄 Deployment Updates

### Push Code Updates
```bash
# On your local machine
git push origin master

# On VM, pull and redeploy
ssh -i ~/.ssh/gcp_key ubuntu@35.x.x.x
cd ~/livingheritage1125
git pull
docker-compose build
docker-compose up -d
```

### Zero-Downtime Deployment
```bash
# Using Docker Compose rolling restart
docker-compose up -d --no-deps --build app
```

---

## 💾 Backup & Recovery

### Create Full Backup
```bash
# Database backup
pg_dump -h $DB_HOST -U postgres -d livingheritage > db_backup.sql

# Application backup
tar -czf app_backup.tar.gz ~/livingheritage1125

# Download backups
scp -i ~/.ssh/gcp_key ubuntu@35.x.x.x:~/db_backup.sql ./
scp -i ~/.ssh/gcp_key ubuntu@35.x.x.x:~/app_backup.tar.gz ./
```

### Restore from Backup
```bash
# Restore database
psql -h $DB_HOST -U postgres -d livingheritage < db_backup.sql

# Restore application
tar -xzf app_backup.tar.gz
```

---

## 📋 Maintenance Tasks

### Weekly
- [ ] Check application logs for errors
- [ ] Monitor disk space (`df -h`)
- [ ] Review Cloud SQL metrics

### Monthly
- [ ] Update OS packages: `sudo apt update && sudo apt upgrade`
- [ ] Test backup restoration
- [ ] Review and optimize database queries
- [ ] Check SSL certificate expiry

### Quarterly
- [ ] Update npm dependencies: `npm update`
- [ ] Review security settings
- [ ] Plan scaling if needed

---

## 📞 Support & Documentation

### Google Cloud Resources
- **Console:** https://console.cloud.google.com
- **Compute Engine Docs:** https://cloud.google.com/compute/docs
- **Cloud SQL Docs:** https://cloud.google.com/sql/docs
- **Getting Started:** https://cloud.google.com/docs/getting-started

### Your Application
- **GitHub:** https://github.com/adminggc/livingheritage1125
- **Issues:** https://github.com/adminggc/livingheritage1125/issues
- **Local Setup:** See QUICK_START_PRODUCTION.md

---

## 💰 Cost Estimation

```
GCP VM Costs (monthly):
├─ Compute Engine (e2-medium):  $20-30
├─ Cloud SQL (db-f1-micro):     $10-15
├─ Storage (20GB disk):         $0.50
├─ Network (moderate traffic):  $1-5
└─ Total:                        ~$31-51/month

(Can optimize to ~$20-30 with smaller machine)
```

---

## ✅ Deployment Checklist

### Before Deployment
- [ ] Google Cloud account created
- [ ] Project created and APIs enabled
- [ ] VM instance created
- [ ] SSH key configured
- [ ] Cloud SQL instance created
- [ ] Database initialized
- [ ] GitHub repository cloned

### After Deployment
- [ ] VM is accessible via SSH
- [ ] Docker running correctly
- [ ] Application responds on port 3000
- [ ] Nginx serving on ports 80/443
- [ ] Database connected and working
- [ ] All API endpoints responding
- [ ] Admin panel accessible
- [ ] SSL certificate working (if domain used)
- [ ] Firewall rules configured
- [ ] Backups configured

### Production Ready
- [ ] Monitoring and alerts set up
- [ ] Security checklist completed
- [ ] Domain configured (optional)
- [ ] Automatic updates scheduled
- [ ] Disaster recovery plan documented

---

**Status:** Ready for GCP Deployment ✅
**Last Updated:** November 22, 2025
**Support:** See GitHub issues or GCP documentation

Happy deploying to Google Cloud! 🚀
