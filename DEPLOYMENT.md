# MicroPulse Deployment Guide

## Quick Start (Local Development)

### Prerequisites
- Python 3.9+
- Node.js 18+
- AWS Account (for AI features)
- Git

### 1. Clone Repository
```bash
git clone https://github.com/your-org/micropulse.git
cd micropulse
```

### 2. Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your AWS credentials

# Start API server
python run_api.py
```

API available at: `http://localhost:8000`

### 3. Frontend Setup
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Dashboard available at: `http://localhost:3000`

### 4. Verify Installation
```bash
# Test backend
python verify_api_setup.py

# Test frontend
python verify_frontend_setup.py

# Test complete system
python verify_complete_system.py
```

## Production Deployment

### Option 1: AWS (Recommended)

#### Architecture
```
CloudFront (CDN)
    ↓
S3 (Frontend Static Files)
    ↓
API Gateway
    ↓
Lambda (Backend API)
    ↓
Bedrock (AI)
```

#### Steps

**1. Deploy Backend to Lambda**

```bash
# Install deployment dependencies
pip install mangum

# Create deployment package
cd backend
zip -r function.zip .

# Upload to Lambda via AWS Console or CLI
aws lambda create-function \
  --function-name micropulse-api \
  --runtime python3.9 \
  --handler lambda_handler.handler \
  --zip-file fileb://function.zip \
  --role arn:aws:iam::ACCOUNT:role/lambda-role
```

**2. Configure API Gateway**

```bash
# Create REST API
aws apigateway create-rest-api \
  --name micropulse-api \
  --description "MicroPulse API"

# Create resources and methods
# Link to Lambda function
# Deploy to stage (prod)
```

**3. Deploy Frontend to S3 + CloudFront**

```bash
# Build frontend
cd frontend
npm run build
npm run export

# Upload to S3
aws s3 sync out/ s3://micropulse-frontend/

# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name micropulse-frontend.s3.amazonaws.com
```

**4. Configure Environment Variables**

```bash
# Lambda environment variables
aws lambda update-function-configuration \
  --function-name micropulse-api \
  --environment Variables="{
    AWS_REGION=us-east-1,
    BEDROCK_MODEL_ID=amazon.nova-lite-v1:0
  }"
```

### Option 2: Docker + EC2

#### Dockerfile (Backend)

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "api.server:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Dockerfile (Frontend)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### Docker Compose

```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - AWS_REGION=${AWS_REGION}
      - BEDROCK_MODEL_ID=${BEDROCK_MODEL_ID}
    volumes:
      - ./reports:/app/reports
      - ./data:/app/data

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
    depends_on:
      - backend
```

#### Deploy to EC2

```bash
# Launch EC2 instance (Ubuntu 22.04)
# SSH into instance

# Install Docker
sudo apt update
sudo apt install docker.io docker-compose

# Clone repository
git clone https://github.com/your-org/micropulse.git
cd micropulse

# Configure environment
cp .env.example .env
nano .env

# Start services
docker-compose up -d

# Configure Nginx reverse proxy
sudo apt install nginx
# Configure /etc/nginx/sites-available/micropulse
```

### Option 3: Vercel + Railway

#### Frontend (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd frontend
vercel --prod
```

#### Backend (Railway)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Option 4: Heroku

#### Backend

```bash
# Create Heroku app
heroku create micropulse-api

# Add buildpack
heroku buildpacks:set heroku/python

# Configure environment
heroku config:set AWS_REGION=us-east-1
heroku config:set BEDROCK_MODEL_ID=amazon.nova-lite-v1:0

# Deploy
git push heroku main
```

#### Frontend

```bash
# Create Heroku app
heroku create micropulse-dashboard

# Add buildpack
heroku buildpacks:set heroku/nodejs

# Configure environment
heroku config:set NEXT_PUBLIC_API_URL=https://micropulse-api.herokuapp.com

# Deploy
git push heroku main
```

## Environment Configuration

### Required Variables

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

# Bedrock Configuration
BEDROCK_MODEL_ID=amazon.nova-lite-v1:0

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000

# Frontend Configuration
NEXT_PUBLIC_API_URL=https://api.micropulse.com
```

### Optional Variables

```bash
# Database (if using)
DATABASE_URL=postgresql://user:pass@host:5432/db

# Redis (if using)
REDIS_URL=redis://host:6379

# Monitoring
SENTRY_DSN=https://...
LOG_LEVEL=INFO

# Feature Flags
ENABLE_AI_CHAT=true
ENABLE_SCENARIOS=true
```

## Database Setup (Optional)

### PostgreSQL

```sql
-- Create database
CREATE DATABASE micropulse;

-- Create tables
CREATE TABLE forecasts (
    id SERIAL PRIMARY KEY,
    sku_id VARCHAR(50),
    pin_code VARCHAR(10),
    baseline_mape FLOAT,
    context_mape FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    sku_id VARCHAR(50),
    pin_code VARCHAR(10),
    safety_stock FLOAT,
    working_capital FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Migration

```bash
# Install Alembic
pip install alembic

# Initialize migrations
alembic init migrations

# Create migration
alembic revision --autogenerate -m "Initial schema"

# Apply migration
alembic upgrade head
```

## Monitoring Setup

### CloudWatch (AWS)

```bash
# Create log group
aws logs create-log-group --log-group-name /aws/lambda/micropulse-api

# Create metric filter
aws logs put-metric-filter \
  --log-group-name /aws/lambda/micropulse-api \
  --filter-name ErrorCount \
  --filter-pattern "ERROR" \
  --metric-transformations \
    metricName=Errors,metricNamespace=MicroPulse,metricValue=1
```

### Prometheus + Grafana

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy MicroPulse

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: |
          pip install -r requirements.txt
          python -m pytest

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Lambda
        run: |
          # Deploy script

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        run: |
          cd frontend
          vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

## Performance Optimization

### Backend

```python
# Add caching
from functools import lru_cache

@lru_cache(maxsize=100)
def get_forecast(sku: str, pin: str):
    # Cached forecast loading
    pass
```

### Frontend

```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['api.micropulse.com'],
  },
  compress: true,
  swcMinify: true,
}
```

## Security Checklist

- [ ] Environment variables secured
- [ ] API authentication enabled
- [ ] HTTPS/TLS configured
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation active
- [ ] Error messages sanitized
- [ ] Secrets in Secrets Manager
- [ ] IAM roles configured
- [ ] Security headers set

## Troubleshooting

### Backend Issues

**API won't start**
```bash
# Check Python version
python --version  # Should be 3.9+

# Check dependencies
pip list

# Check logs
tail -f logs/api.log
```

**Bedrock errors**
```bash
# Verify AWS credentials
aws sts get-caller-identity

# Check Bedrock access
aws bedrock list-foundation-models --region us-east-1
```

### Frontend Issues

**Build fails**
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

**API connection fails**
```bash
# Check environment variable
echo $NEXT_PUBLIC_API_URL

# Test API directly
curl http://localhost:8000/health
```

## Rollback Procedure

### Lambda
```bash
# List versions
aws lambda list-versions-by-function --function-name micropulse-api

# Rollback to previous version
aws lambda update-alias \
  --function-name micropulse-api \
  --name prod \
  --function-version 2
```

### Vercel
```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback [deployment-url]
```

## Backup & Recovery

### Data Backup
```bash
# Backup reports
aws s3 sync reports/ s3://micropulse-backups/reports/

# Backup database
pg_dump micropulse > backup.sql
```

### Disaster Recovery
1. Restore from S3 backup
2. Redeploy Lambda function
3. Update API Gateway
4. Redeploy frontend
5. Verify functionality

---

**Last Updated**: March 8, 2026
**Maintained By**: MicroPulse DevOps Team
