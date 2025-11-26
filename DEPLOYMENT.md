# Deployment Guide

## 🚀 Deploying PII Detection Service

This guide covers testing and deploying your TypeScript PII detection service to production.

---

## ⚠️ IMPORTANT: Test Locally First!

**Before deploying to production, thoroughly test the system locally.**

### Pre-Deployment Testing Checklist

✅ **1. Local Server Testing**

```bash
# Setup
copy .env.example .env
# Add your Gemini API keys to .env

# Install & Build
npm install
npm run build

# Start server
npm run dev
```

✅ **2. Run Automated Tests**

```bash
# Run test suite
test-all.bat
```

**Expected Results:**
- All 6 tests pass
- Health check returns "ok"
- PII detection works (phone, email, social media)
- Clean messages NOT flagged
- API stats show correct counts

✅ **3. Visual Testing with Web UI**

1. Start server: `npm run dev`
2. Open `test-ui.html` in browser
3. Test all features:
   - Health check ✅
   - Quick tests (phone, email, etc.) ✅
   - Custom message testing ✅
   - Send message flow ✅
   - API statistics ✅

✅ **4. Manual API Testing**

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test PII detection
curl -X POST http://localhost:3000/api/test/detect-pii ^
  -H "Content-Type: application/json" ^
  -d "{\"text\": \"Call me at 555-1234\", \"userId\": \"test\"}"

# Verify response shows PII detected
```

✅ **5. TypeScript Compilation**

```bash
# Ensure no TypeScript errors
npm run type-check
npm run build

# Should complete without errors
```

### Success Criteria Before Deployment

Your system is ready for deployment when:

- ✅ All automated tests pass
- ✅ TypeScript compiles without errors
- ✅ Server starts successfully
- ✅ PII detection accuracy is >95%
- ✅ No false positives on clean messages
- ✅ API rate limiting works with multiple keys
- ✅ All endpoints respond correctly

**If any test fails, DO NOT deploy. Fix issues locally first.**

---

## 📁 Files to Deploy

Ensure these files are included in your deployment:

```
pii-detection-system/
├── src/                    # TypeScript source
│   ├── types/
│   ├── services/
│   ├── middleware/
│   ├── index.ts
│   └── server.ts
│
├── dist/                   # Compiled JavaScript (after build)
├── package.json
├── package-lock.json
├── tsconfig.json
├── .env (with real API keys)
└── node_modules/          # Will be installed on server
```

**DO NOT deploy:**
- ❌ `test-all.bat`
- ❌ `test-ui.html`
- ❌ `TEST_LOCALLY.md`
- ❌ `.git/` folder
- ❌ `EXAMPLE_INTEGRATION.ts`

---

## 🌐 Deployment Options

### Option 1: AWS Elastic Beanstalk (Recommended for MVP)

### Prerequisites

* AWS Account
* AWS CLI installed
* EB CLI installed: `pip install awsebcli`

### Steps

1. **Initialize Elastic Beanstalk**

```bash
eb init -p node.js pii-detection-service --region us-east-1
```

2. **Create Environment**

```bash
eb create production-env
```

3. **Set Environment Variables**

```bash
eb setenv \
  GEMINI_API_KEY_1=your-key-1 \
  GEMINI_API_KEY_2=your-key-2 \
  GEMINI_API_KEY_3=your-key-3 \
  DATABASE_URL=your-mongodb-url \
  ADMIN_WEBHOOK_URL=your-webhook-url
```

4. **Deploy**

```bash
eb deploy
```

5. **Open Application**

```bash
eb open
```

### Configuration File

Create `.ebextensions/nodecommand.config`:

```yaml
option_settings:
  aws:elasticbeanstalk:container:nodejs:
    NodeCommand: "npm start"
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
```

---

## Option 2: AWS EC2

### Launch EC2 Instance

1. **Choose AMI** : Amazon Linux 2 or Ubuntu 20.04
2. **Instance Type** : t3.medium (for MVP) or larger for production
3. **Security Group** : Open ports 22 (SSH) and 3000 (or your port)

### Setup Script

```bash
#!/bin/bash

# Update system
sudo yum update -y  # For Amazon Linux
# or
# sudo apt update && sudo apt upgrade -y  # For Ubuntu

# Install Node.js
curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs  # Amazon Linux
# or
# sudo apt install -y nodejs npm  # Ubuntu

# Install PM2 globally
sudo npm install -g pm2

# Clone your repository
git clone https://github.com/your-repo/pii-detection-service.git
cd pii-detection-service

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
PORT=3000
GEMINI_API_KEY_1=your-key-1
GEMINI_API_KEY_2=your-key-2
GEMINI_API_KEY_3=your-key-3
DATABASE_URL=your-mongodb-url
ADMIN_WEBHOOK_URL=your-webhook-url
EOF

# Start with PM2
pm2 start server.js --name pii-detection-service
pm2 startup
pm2 save

# Setup nginx as reverse proxy (optional)
sudo yum install -y nginx  # or sudo apt install nginx
```

### Nginx Configuration

Create `/etc/nginx/conf.d/pii-detection.conf`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## Option 3: AWS Lambda + API Gateway (Serverless)

### Install Serverless Framework

```bash
npm install -g serverless
```

### Create `serverless.yml`

```yaml
service: pii-detection-service

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    GEMINI_API_KEY_1: ${env:GEMINI_API_KEY_1}
    GEMINI_API_KEY_2: ${env:GEMINI_API_KEY_2}
    GEMINI_API_KEY_3: ${env:GEMINI_API_KEY_3}
    DATABASE_URL: ${env:DATABASE_URL}
  timeout: 30
  memorySize: 1024

functions:
  api:
    handler: lambda.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true

plugins:
  - serverless-offline
```

### Create `lambda.js`

```javascript
const serverless = require('serverless-http');
const app = require('./server');

module.exports.handler = serverless(app);
```

### Deploy

```bash
npm install serverless-http serverless-offline
serverless deploy
```

---

## Option 4: AWS ECS with Docker

### Create `Dockerfile`

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

### Create `docker-compose.yml`

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - GEMINI_API_KEY_1=${GEMINI_API_KEY_1}
      - GEMINI_API_KEY_2=${GEMINI_API_KEY_2}
      - GEMINI_API_KEY_3=${GEMINI_API_KEY_3}
      - DATABASE_URL=${DATABASE_URL}
    restart: unless-stopped
```

### Deploy to ECS

1. **Build and push to ECR** :

```bash
# Create ECR repository
aws ecr create-repository --repository-name pii-detection-service

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build and tag
docker build -t pii-detection-service .
docker tag pii-detection-service:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/pii-detection-service:latest

# Push
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/pii-detection-service:latest
```

2. **Create ECS Task Definition** via AWS Console or CLI
3. **Create ECS Service** and deploy

---

## Database Setup

### MongoDB Atlas (Recommended)

1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Get connection string
4. Add to environment variables

### AWS DocumentDB

```bash
aws docdb create-db-cluster \
  --db-cluster-identifier pii-detection-db \
  --engine docdb \
  --master-username admin \
  --master-user-password YourPassword
```

---

## Environment Variables Management

### AWS Systems Manager Parameter Store

```bash
# Store secrets
aws ssm put-parameter \
  --name /pii-detection/gemini-key-1 \
  --value "your-key" \
  --type SecureString

# Retrieve in code
const AWS = require('aws-sdk');
const ssm = new AWS.SSM();

async function getParameter(name) {
  const result = await ssm.getParameter({
    Name: name,
    WithDecryption: true
  }).promise();
  return result.Parameter.Value;
}
```

---

## Monitoring & Logging

### CloudWatch Logs

PM2 automatically sends logs to CloudWatch if configured:

```bash
pm2 install pm2-cloudwatch
```

### CloudWatch Metrics

Add custom metrics:

```javascript
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch();

async function logMetric(metricName, value) {
  await cloudwatch.putMetricData({
    Namespace: 'PIIDetection',
    MetricData: [{
      MetricName: metricName,
      Value: value,
      Unit: 'Count',
      Timestamp: new Date()
    }]
  }).promise();
}
```

---

## Auto-Scaling Configuration

### For EC2/Elastic Beanstalk

Create scaling policy:

```bash
aws autoscaling put-scaling-policy \
  --auto-scaling-group-name your-asg-name \
  --policy-name cpu-scale-up \
  --scaling-adjustment 1 \
  --adjustment-type ChangeInCapacity \
  --cooldown 300
```

### For ECS

Configure service auto-scaling in task definition.

---

## SSL/TLS Setup

### Using AWS Certificate Manager

1. Request certificate in ACM
2. Add to Load Balancer
3. Configure in Elastic Beanstalk or ALB

### Using Let's Encrypt

```bash
sudo yum install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Health Checks

Add health check endpoint to your server:

```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

Configure in AWS:

* Path: `/health`
* Interval: 30 seconds
* Timeout: 5 seconds
* Healthy threshold: 2
* Unhealthy threshold: 3

---

## Backup Strategy

### Database Backups

MongoDB Atlas: Automatic
AWS DocumentDB: Configure automated backups

### Application Backups

Store logs in S3:

```javascript
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

async function backupLogs(logs) {
  await s3.putObject({
    Bucket: 'pii-detection-logs',
    Key: `logs/${Date.now()}.json`,
    Body: JSON.stringify(logs)
  }).promise();
}
```

---

## Cost Optimization

1. **Use Reserved Instances** for EC2 (save 30-60%)
2. **Auto-scaling** to scale down during low traffic
3. **S3 Lifecycle Policies** for log retention
4. **CloudFront CDN** for static assets
5. **Spot Instances** for non-critical workloads

---

## Production Checklist

* [ ] Environment variables configured
* [ ] Database connection tested
* [ ] SSL/TLS certificate installed
* [ ] Health checks configured
* [ ] Auto-scaling enabled
* [ ] Monitoring and alerts set up
* [ ] Backup strategy implemented
* [ ] Security groups configured
* [ ] IAM roles properly set
* [ ] API keys rotated regularly
* [ ] Load testing completed
* [ ] Error tracking enabled (Sentry, etc.)

---

## Troubleshooting

### Issue: App not starting

Check PM2 logs:

```bash
pm2 logs pii-detection-service
```

### Issue: High memory usage

Restart app:

```bash
pm2 restart pii-detection-service
```

### Issue: Rate limit errors

Add more API keys or upgrade to paid tier.

---

## Support

For AWS-specific issues:

* AWS Support Center
* AWS Documentation
* AWS Forums

For application issues:

* Check application logs
* Review README troubleshooting section
