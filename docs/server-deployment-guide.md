# 🚀 **Production Server Deployment Guide**

## 📋 **Prerequisites**

### **Server Requirements**
- Ubuntu 20.04+ or CentOS 8+
- Docker Engine 20.10+
- Docker Compose 2.0+
- 2GB RAM minimum
- 10GB disk space
- Port 80 and 443 available

### **Access Requirements**
- SSH access to production server
- Sudo privileges
- GitHub Container Registry access

## 🔧 **Server Setup**

### **1. Install Docker**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### **2. Create Application Directory**
```bash
# Create app directory
sudo mkdir -p /opt/sodzo-webclient
sudo chown $USER:$USER /opt/sodzo-webclient
cd /opt/sodzo-webclient
```

### **3. Clone Repository**
```bash
# Clone the repository
git clone https://github.com/fadebowaley/sodzo-webclient.git .

# Switch to production branch
git checkout production
```

### **4. Configure Environment**
```bash
# Copy environment template
cp .env.example .env.production

# Edit environment variables
nano .env.production
```

**Required Environment Variables:**
```bash
# Production API Configuration
VITE_API_BASE=https://api.saby.ai
VITE_API_AUTH_ENDPOINT=/v1/auth/login
VITE_API_REFRESH_ENDPOINT=/v1/auth/refresh-tokens
VITE_API_LOGOUT_ENDPOINT=/v1/auth/logout

# User Endpoints
VITE_API_USER_ENDPOINT=/v1/users
VITE_API_USER_PROFILE_ENDPOINT=/v1/user-profiles

# Node Endpoints
VITE_API_NODE_ENDPOINT=/v1/node
VITE_API_NODE_PROFILE_ENDPOINT=/v1/nodeprofile

# Project Form Endpoints
VITE_API_PROJECT_FORM_ENDPOINT=/v1/projectForm

# Storage Endpoints
VITE_API_STORAGE_ENDPOINT=/v1/storage

# Inmail Endpoints
VITE_API_INMAIL_ENDPOINT=/v1/inmail

# Token Configuration
VITE_REFRESH_TOKEN_KEY=saby:refresh_token

# Production Settings
NODE_ENV=production
VITE_APP_TITLE=Sodzo Web Client
VITE_DEBUG=false
```

## 🚀 **Deployment Process**

### **Option 1: Manual Deployment**
```bash
# Pull latest changes
git pull origin production

# Build and deploy
./deploy.sh
```

### **Option 2: Automated Deployment (CI/CD)**
The GitHub Actions pipeline will automatically deploy when changes are pushed to the production branch.

### **Option 3: Docker Compose Deployment**
```bash
# Pull latest image
docker-compose -f docker-compose.prod.yml pull

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

## 🔍 **Verification**

### **Health Check**
```bash
# Check container status
docker ps

# Check application health
curl http://localhost/health

# Check logs
docker logs sodzo-webclient-prod
```

### **Application Access**
- **Application**: http://your-server-ip
- **Health Check**: http://your-server-ip/health

## 🔧 **Management Commands**

### **Start Application**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### **Stop Application**
```bash
docker-compose -f docker-compose.prod.yml down
```

### **Restart Application**
```bash
docker-compose -f docker-compose.prod.yml restart
```

### **View Logs**
```bash
docker logs -f sodzo-webclient-prod
```

### **Update Application**
```bash
# Pull latest changes
git pull origin production

# Rebuild and deploy
docker-compose -f docker-compose.prod.yml up -d --build
```

## 🔒 **Security Configuration**

### **Firewall Setup**
```bash
# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
sudo ufw enable
```

### **SSL Certificate (Optional)**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

## 📊 **Monitoring**

### **Container Monitoring**
```bash
# Monitor resource usage
docker stats sodzo-webclient-prod

# Check container health
docker inspect sodzo-webclient-prod | grep Health
```

### **Application Monitoring**
```bash
# Monitor application logs
docker logs -f sodzo-webclient-prod

# Check application metrics
curl http://localhost/health
```

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Container Won't Start**
```bash
# Check logs
docker logs sodzo-webclient-prod

# Check container status
docker ps -a

# Restart container
docker-compose -f docker-compose.prod.yml restart
```

#### **Application Not Accessible**
```bash
# Check if container is running
docker ps

# Check port binding
docker port sodzo-webclient-prod

# Check firewall
sudo ufw status
```

#### **Environment Variables Not Working**
```bash
# Check environment file
cat .env.production

# Restart container
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

### **Rollback Procedure**
```bash
# Stop current container
docker-compose -f docker-compose.prod.yml down

# Pull previous image
docker pull ghcr.io/fadebowaley/sodzo-webclient:previous-tag

# Start with previous image
docker-compose -f docker-compose.prod.yml up -d
```

## 📝 **Maintenance**

### **Regular Updates**
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose -f docker-compose.prod.yml pull

# Clean up old images
docker image prune -f
```

### **Backup**
```bash
# Backup environment configuration
cp .env.production .env.production.backup

# Backup docker-compose configuration
cp docker-compose.prod.yml docker-compose.prod.yml.backup
```

## 🎯 **Success Criteria**

- ✅ Application accessible at http://your-server-ip
- ✅ Health check returns "healthy"
- ✅ Container running without errors
- ✅ Logs show successful startup
- ✅ Environment variables properly configured
- ✅ SSL certificate installed (if applicable)

## 📞 **Support**

For deployment issues:
1. Check container logs: `docker logs sodzo-webclient-prod`
2. Verify environment configuration
3. Check server resources and connectivity
4. Review GitHub Actions pipeline logs
