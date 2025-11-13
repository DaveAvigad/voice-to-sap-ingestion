#!/bin/bash

echo "Deploying Voice-to-SAP Ingestion System..."

# Navigate to infrastructure directory
cd infrastructure

# Install Python dependencies
echo "Installing CDK dependencies..."
pip install -r requirements.txt

# Bootstrap CDK (only needed once per account/region)
echo "Bootstrapping CDK..."
cdk bootstrap

# Deploy the stack
echo "Deploying stack..."
cdk deploy --require-approval never

echo "Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Upload a voice file to the 'voice-to-sap-input' S3 bucket"
echo "2. Monitor the Step Functions execution in AWS Console"
echo "3. Check the 'voice-to-sap-summaries' bucket for processed results"
