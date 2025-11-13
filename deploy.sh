#!/bin/bash

echo "🚀 Deploying Voice-to-SAP TypeScript System..."
echo "=============================================="

# Delete old CloudFormation stack if it exists
echo "🧹 Cleaning up old CloudFormation stack..."
aws cloudformation delete-stack --stack-name voice-to-sap-system 2>/dev/null || true
aws cloudformation wait stack-delete-complete --stack-name voice-to-sap-system 2>/dev/null || true

# Navigate to infrastructure directory
cd infrastructure

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Bootstrap CDK (only needed once per account/region)
echo "🏗️  Bootstrapping CDK..."
npx cdk bootstrap

# Deploy the stack
echo "🚀 Deploying CDK stack..."
npx cdk deploy --require-approval never

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Test the system: npm run test:stepfunctions"
echo "2. Upload test file: npm run test:upload"
echo "3. Check AWS Console for Step Functions execution"
echo "4. Set up SAP MCP connector integration"
echo ""
echo "🔗 Key resources:"
echo "- Input bucket: voice-to-sap-input-{account-id}"
echo "- Output bucket: voice-to-sap-summaries-{account-id}"
echo "- Step Functions: VoiceToSapStateMachine"
