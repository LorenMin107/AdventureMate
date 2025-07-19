# AdventureMate Docker Setup

This document provides comprehensive instructions for running AdventureMate using Docker for both development and production environments.

## 🐳 Overview

The Docker setup includes:

- **Multi-stage Dockerfile** for optimized production builds
- **Development Dockerfile** with hot reloading
- **Docker Compose** for local development with all services
- **Production Docker Compose** for deployment
- **Nginx reverse proxy** with SSL support
- **MongoDB** with initialization scripts
- **Redis** for caching
- **Optional development tools** (Mongo Express, Redis Commander)

## 📁 File Structure

```
├── Dockerfile                 # Production multi-stage build
├── Dockerfile.dev            # Development build with hot reloading
├── docker-compose.yml        # Main compose file for development
├── docker-compose.prod.yml   # Production compose file
├── docker-compose.override.yml # Development overrides (customizable)
├── .dockerignore             # Files excluded from Docker build
├── scripts/
│   └── mongo-init.js         # MongoDB initialization script
├── nginx/
│   ├── nginx.conf           # Development Nginx config
│   └── nginx.prod.conf      # Production Nginx config
└── DOCKER-README.md         # This file
```

## 🚀 Quick Start

### Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose
- At least 4GB RAM available for Docker

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd AdventureMate

# Copy the development override file
cp docker-compose.override.yml.example docker-compose.override.yml

# Edit environment variables (optional)
nano docker-compose.override.yml
```

### 2. Start Development Environment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:3001
# MongoDB: localhost:27017
# Redis: localhost:6379
```

### 3. Optional Development Tools

```bash
# Start with development tools (Mongo Express, Redis Commander)
docker-compose --profile tools up -d

# Access development tools
# Mongo Express: http://localhost:8081 (admin/password)
# Redis Commander: http://localhost:8082
```

## 🔧 Development Workflow

### Starting Development

```bash
# Start all services
docker-compose up -d

# Start with development tools
docker-compose --profile tools up -d

# Start in foreground with logs
docker-compose up
```

### Development Commands

```bash
# View logs for specific service
docker-compose logs -f app
docker-compose logs -f mongodb
docker-compose logs -f redis

# Execute commands in running container
docker-compose exec app npm test
docker-compose exec app npm run lint
docker-compose exec app node seedDB.js

# Access MongoDB shell
docker-compose exec mongodb mongosh -u admin -p password

# Access Redis CLI
docker-compose exec redis redis-cli

# Restart specific service
docker-compose restart app

# Rebuild and restart
docker-compose up -d --build app
```

### Hot Reloading

The development setup includes hot reloading:

- **Backend**: Nodemon watches for changes and restarts the server
- **Frontend**: Vite provides instant hot module replacement
- **Database**: MongoDB data persists in Docker volumes
- **Cache**: Redis data persists in Docker volumes

### Environment Variables

Create a `.env` file in the root directory for sensitive configuration:

```bash
# Database
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your-secure-password
MONGO_DATABASE=adventure-mate

# Redis
REDIS_PASSWORD=your-redis-password

# JWT Secrets (use strong secrets in production)
JWT_ACCESS_TOKEN_SECRET=your-very-long-secure-access-token-secret
JWT_REFRESH_TOKEN_SECRET=your-very-long-secure-refresh-token-secret

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# API Keys (optional for development)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_KEY=your-api-key
CLOUDINARY_SECRET=your-api-secret
MAPBOX_TOKEN=your-mapbox-token
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLIC_KEY=your-stripe-public-key
OPENWEATHER_KEY=your-openweather-key
```

## 🏭 Production Deployment

### 1. Production Build

```bash
# Build production image
docker build -t adventuremate:latest .

# Or use production compose
docker-compose -f docker-compose.prod.yml build
```

### 2. Production Environment Variables

Create a `.env.prod` file with production values:

```bash
# Production environment variables
NODE_ENV=production
CLIENT_URL=https://yourdomain.com

# Database
MONGO_ROOT_USERNAME=your-prod-username
MONGO_ROOT_PASSWORD=your-very-secure-password
MONGO_DATABASE=adventure-mate-prod

# Redis
REDIS_PASSWORD=your-very-secure-redis-password

# JWT Secrets (use very strong secrets)
JWT_ACCESS_TOKEN_SECRET=your-very-long-secure-access-token-secret
JWT_REFRESH_TOKEN_SECRET=your-very-long-secure-refresh-token-secret

# Email
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_SECURE=true
EMAIL_USER=your-email@yourdomain.com
EMAIL_PASSWORD=your-secure-password
EMAIL_FROM=noreply@yourdomain.com

# API Keys
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_KEY=your-api-key
CLOUDINARY_SECRET=your-api-secret
MAPBOX_TOKEN=your-mapbox-token
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLIC_KEY=your-stripe-public-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
OPENWEATHER_KEY=your-openweather-key
```

### 3. SSL Certificates

For production, you need SSL certificates:

```bash
# Create SSL directory
mkdir -p nginx/ssl

# Add your SSL certificates
cp your-cert.pem nginx/ssl/cert.pem
cp your-key.pem nginx/ssl/key.pem
```

### 4. Deploy Production

```bash
# Deploy with production compose
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# Scale application instances
docker-compose -f docker-compose.prod.yml up -d --scale app=3
```

## 📊 Monitoring and Logs

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f nginx

# Production logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Health Checks

All services include health checks:

```bash
# Check service health
docker-compose ps

# Manual health check
curl http://localhost/health
curl http://localhost/api/v1/health
```

### Performance Monitoring

```bash
# Container resource usage
docker stats

# Database performance
docker-compose exec mongodb mongosh --eval "db.stats()"

# Redis performance
docker-compose exec redis redis-cli info memory
```

## 🔒 Security Considerations

### Development

- Use strong passwords for development databases
- Don't commit `.env` files to version control
- Use different JWT secrets for development and production

### Production

- Use very strong, unique passwords for all services
- Enable SSL/TLS encryption
- Configure proper firewall rules
- Use secrets management for sensitive data
- Regularly update base images
- Monitor for security vulnerabilities

## 🛠️ Troubleshooting

### Common Issues

#### 1. Port Conflicts

```bash
# Check what's using a port
lsof -i :3001
lsof -i :5173

# Stop conflicting services
sudo systemctl stop mongod  # If MongoDB is running locally
sudo systemctl stop redis   # If Redis is running locally
```

#### 2. Permission Issues

```bash
# Fix file permissions
sudo chown -R $USER:$USER .

# Fix Docker volume permissions
docker-compose down
sudo rm -rf mongodb_data redis_data app_logs
docker-compose up -d
```

#### 3. Memory Issues

```bash
# Increase Docker memory limit in Docker Desktop
# Or reduce service memory limits in docker-compose.yml

# Check memory usage
docker stats
```

#### 4. Database Connection Issues

```bash
# Check MongoDB status
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Check Redis status
docker-compose exec redis redis-cli ping

# Restart services
docker-compose restart mongodb redis app
```

### Debug Commands

```bash
# Enter container shell
docker-compose exec app sh
docker-compose exec mongodb mongosh
docker-compose exec redis redis-cli

# View container details
docker-compose exec app ps aux
docker-compose exec app df -h

# Check network connectivity
docker-compose exec app ping mongodb
docker-compose exec app ping redis
```

## 📈 Scaling

### Horizontal Scaling

```bash
# Scale application instances
docker-compose -f docker-compose.prod.yml up -d --scale app=3

# Scale with load balancer
docker-compose -f docker-compose.prod.yml up -d --scale app=5
```

### Database Scaling

For production, consider:

- MongoDB replica sets
- Redis clustering
- External managed databases (MongoDB Atlas, Redis Cloud)

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build and deploy
        run: |
          docker-compose -f docker-compose.prod.yml build
          docker-compose -f docker-compose.prod.yml up -d
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MongoDB Docker Image](https://hub.docker.com/_/mongo)
- [Redis Docker Image](https://hub.docker.com/_/redis)
- [Nginx Documentation](https://nginx.org/en/docs/)

## 🤝 Contributing

When contributing to the Docker setup:

1. Test changes in development environment
2. Update documentation
3. Ensure backward compatibility
4. Test production deployment
5. Update version tags appropriately

---

**Note**: This Docker setup is designed for development and small to medium production deployments. For large-scale production deployments, consider using Kubernetes or managed container services.
