#!/bin/bash

# MicroPulse AWS Lambda Deployment Script
# This script packages and deploys the FastAPI backend to AWS Lambda

set -e

echo "=========================================="
echo "MicroPulse AWS Lambda Deployment"
echo "=========================================="

# Configuration
FUNCTION_NAME="micropulse-api"
REGION="${AWS_REGION:-us-east-1}"
RUNTIME="python3.11"
HANDLER="lambda_handler.handler"
MEMORY_SIZE=1024
TIMEOUT=30

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Creating deployment package...${NC}"

# Create deployment directory
DEPLOY_DIR="lambda_package"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Copy application code
echo "Copying application code..."
cp -r ../api $DEPLOY_DIR/
cp -r ../core $DEPLOY_DIR/
cp -r ../reports $DEPLOY_DIR/
cp lambda_handler.py $DEPLOY_DIR/

# Install dependencies
echo -e "${BLUE}Step 2: Installing dependencies...${NC}"
pip install -r requirements.txt -t $DEPLOY_DIR/ --upgrade

# Remove unnecessary files to reduce package size
echo "Cleaning up unnecessary files..."
cd $DEPLOY_DIR
find . -type d -name "tests" -exec rm -rf {} + 2>/dev/null || true
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete
find . -type f -name "*.pyo" -delete
find . -type d -name "*.dist-info" -exec rm -rf {} + 2>/dev/null || true
find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true

# Create deployment package
echo -e "${BLUE}Step 3: Creating ZIP package...${NC}"
zip -r ../micropulse-lambda.zip . -q
cd ..

echo -e "${GREEN}✓ Deployment package created: micropulse-lambda.zip${NC}"
echo "Package size: $(du -h micropulse-lambda.zip | cut -f1)"

# Check if AWS CLI is configured
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI not found. Please install AWS CLI to deploy.${NC}"
    exit 1
fi

# Deploy to AWS Lambda
echo -e "${BLUE}Step 4: Deploying to AWS Lambda...${NC}"

# Check if function exists
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION &> /dev/null; then
    echo "Updating existing Lambda function..."
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://micropulse-lambda.zip \
        --region $REGION
    
    echo "Updating function configuration..."
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --runtime $RUNTIME \
        --handler $HANDLER \
        --memory-size $MEMORY_SIZE \
        --timeout $TIMEOUT \
        --region $REGION \
        --environment "Variables={BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0,AWS_REGION=$REGION}"
else
    echo "Creating new Lambda function..."
    echo -e "${RED}Note: You need to specify an IAM role ARN${NC}"
    echo "Please run the following command manually:"
    echo ""
    echo "aws lambda create-function \\"
    echo "  --function-name $FUNCTION_NAME \\"
    echo "  --runtime $RUNTIME \\"
    echo "  --role <YOUR_IAM_ROLE_ARN> \\"
    echo "  --handler $HANDLER \\"
    echo "  --zip-file fileb://micropulse-lambda.zip \\"
    echo "  --memory-size $MEMORY_SIZE \\"
    echo "  --timeout $TIMEOUT \\"
    echo "  --region $REGION \\"
    echo "  --environment 'Variables={BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0,AWS_REGION=$REGION}'"
fi

echo ""
echo -e "${GREEN}=========================================="
echo "Deployment Complete!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Configure API Gateway to trigger this Lambda function"
echo "2. Update frontend API_BASE URL to point to API Gateway endpoint"
echo "3. Test the endpoints:"
echo "   - GET /forecast?sku=500ml_Cola&pin=395001"
echo "   - GET /inventory?sku=500ml_Cola&pin=395001"
echo "   - POST /chat/ask"
echo ""
echo "For local testing, run:"
echo "  python lambda_handler.py"
